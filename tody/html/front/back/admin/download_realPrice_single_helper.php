<?php
// download_realPrice_single_helper.php

// CLI 실행 강제
if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only be executed via CLI." . PHP_EOL);
    exit(1);
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
set_time_limit(0);
ini_set('memory_limit', '-1');

ob_start();

$script_root = dirname(__FILE__); // /var/www/tody/html/front/back/admin/
$project_base = dirname($script_root, 1); // /var/www/tody/html/front/back/ (admin에서 2단계 위로)

require_once $project_base . '/00-include/dbconnect.php';
require_once $project_base . '/00-include/common.php';
require_once $project_base . '/admin/batch_helpers.php'; // admin 폴더도 common.php와 같은 레벨에 있으니 경로 수정
require_once __DIR__ . '/PnuResolver.php';
require_once __DIR__ . '/policy/SingleScorePolicy.php';
require_once __DIR__ . '/policy/ScorePolicyInterface.php';

$project_root = dirname(__DIR__, 3);
$autoload_path = $project_root . '/vendor/autoload.php';
if (is_file($autoload_path)) {
    require_once $autoload_path;
    if (!isset($_ENV['public_data_key']) && class_exists('Dotenv\\Dotenv')) {
        Dotenv\Dotenv::createImmutable($project_root)->load();
    }
}

// CLI 인자 파싱 (local to this helper)
$cliOptions = parseCliKeyValueArgs($argv ?? []);

$targetRegionPrefix = $cliOptions['sidoCd']
    ?? $cliOptions['sidocd']
    ?? $cliOptions['sido_cd']
    ?? $cliOptions['prefix']
    ?? null;

if ($targetRegionPrefix === null) {
    fwrite(STDERR, "FAILED: 필수 CLI 인자(sidoCd)가 누락되었습니다." . PHP_EOL);
    exit(1);
}

if (!preg_match('/^\d{2}$/', $targetRegionPrefix)) {
    fwrite(STDERR, "FAILED: sidoCd는 두 자리 숫자여야 합니다 (예: 41)." . PHP_EOL);
    exit(1);
}

// 기존 파일의 상수 정의를 따릅니다.
define('PNU_SCORE_THRESHOLD', 60);  
define('AREA_TOLERANCE', 20);  //5==>20
define('TARGET_REGION_PREFIX', $targetRegionPrefix);
define('REALPRICE_SINGLE_TABLE', 'realPrice_single_' . TARGET_REGION_PREFIX); // DB 저장 테이블명

// Redis 연결
$redis = new Redis();
try {
    $redis->connect('127.0.0.1', 6379);
} catch (RedisException $e) {
    fwrite(STDERR, "FAILED: Redis connection failed: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

$start_ymd = $cliOptions['start'] ?? $cliOptions['start_ymd'] ?? '202001';
$end_ymd = $cliOptions['end'] ?? $cliOptions['end_ymd'] ?? '202510';
$historyId = (int) ($cliOptions['historyId'] ?? 0); // 자식 historyId 받기

define('TEMP_historyId', $historyId); 
define('TEMP_conn', $conn); 

try {
    $start_ymd = validateYmArgument($start_ymd, 'start');
    $end_ymd = validateYmArgument($end_ymd, 'end');
} catch (Exception $e) {
    fwrite(STDERR, "FAILED: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

if ($start_ymd > $end_ymd) {
    fwrite(STDERR, "FAILED: start 값은 end 값보다 클 수 없습니다." . PHP_EOL);
    exit(1);
}

$service_key = $_ENV['public_data_key'] ?? '';

// 시군구 단위 다운로드 대상 목록 조회
$sql = sprintf(
    "SELECT CONCAT(sido_cd, sgg_cd) AS bjd_cd
    FROM bjd_master
    WHERE depth = 2
    AND LEFT(region_cd, 2) IN ('%s')
    ORDER BY bjd_cd ASC;",
    TARGET_REGION_PREFIX
);
$sidoCd = TARGET_REGION_PREFIX;

try {
    $stmt = executeQuery($conn, $sql); // executeQuery 함수는 common.php에 정의되어 있을 것으로 가정
    $result = mysqli_stmt_get_result($stmt);
} catch (Exception $e) {
    fwrite(STDERR, "FAILED: DB query failed for bjd_master: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

$bjd_list = [];
while ($row = mysqli_fetch_assoc($result)) {
    $bjd_list[] = $row['bjd_cd'];
}

$start_date = DateTime::createFromFormat('Ym', $start_ymd);
$end_date = DateTime::createFromFormat('Ym', $end_ymd);

$overallSuccess = true;

$totalProcessedCount = 0; // 총 처리 건수를 누적할 변수 초기화

$policy = new SingleScorePolicy();
$resolver = new PnuResolver($conn, $redis);

// 기간(월)별로 시군구 데이터를 순회하며 적재
while ($start_date <= $end_date) {

    // === 작업 취소 여부 주기적 확인 ===
    if (check_cancellation($historyId, $conn)) {
        throw new Exception("Sido {$sidoCd} 작업 도중 사용자 중단 요청 감지. 작업 중단.", 500);
    }
    $ymd = $start_date->format('Ym');
    
    foreach ($bjd_list as $bjd_cd) {

        /*-- 테스트용 특정 시군구만 처리 ( 반드시 살려 놓을것)
        if($bjd_cd !== '41461'){ 
            continue;
        }
        */
        
        // ✅ 시군구 루프마다 취소 체크 추가!
        if (check_cancellation($historyId, $conn)) {
            throw new Exception("Sido {". TARGET_REGION_PREFIX ."} bjd_cd={$bjd_cd} 작업 도중 사용자 중단 요청 감지. 작업 중단.", 500);
        }
        
        // 월별 다운로드 이력 확인
        $select_sql = "SELECT COUNT(*)
        FROM realprice_down_his
        WHERE type = 'single'
        AND bjdCd = ?
        AND date = ?";

        $select_stmt = $conn->prepare($select_sql);
        if ($select_stmt === false) {
            fwrite(STDERR, "FAILED: Failed to prepare select_stmt for realprice_down_his: " . $conn->error . PHP_EOL);
            $overallSuccess = false;
            break 2; // 전체 루프 중단
        }
        $select_stmt->bind_param("ss", $bjd_cd, $ymd);
        $select_stmt->execute();
        $select_stmt->bind_result($row_count);
        $select_stmt->fetch();
        $select_stmt->close();

        if ($row_count > 0) {
            //fwrite(STDERR, "WARN: (단독)이미 존재하는 날짜입니다. bjd_cd: $bjd_cd, 날짜: $ymd" . PHP_EOL); // 헬퍼는 로그를 상세히 남기지 않음
            log_to_db($historyId, "[bjd_cd: $bjd_cd] (단독)이미 존재하는 날짜($ymd)입니다: ", $conn, 'INFO');
            continue; // 중복 이력은 건너_ms
        }

        try {
            // 국토부 실거래가 API 페이지네이션 호출
            $response = getTradeData($bjd_cd, $ymd, $service_key);

            if ($response) {
                //$xml = simplexml_load_string($response);

                // 디버그용: 실제 API 응답 문자열을 로그로 남겨서 확인합니다.
                // 이 메시지는 콘솔, 또는 PHP 에러 로그 파일(php_error.log)에 출력됩니다.
                //fwrite(STDERR, "[DEBUG_API_RAW_RESPONSE] bjd_cd: {$bjd_cd}, ymd: {$ymd}, Response: " . $response . PHP_EOL);
                libxml_use_internal_errors(true); // 에러를 내부적으로 처리하도록 설정
                libxml_clear_errors();   // 🔥 이 줄 추가
                
                if (
                    stripos($response, 'quota') !== false ||
                    stripos($response, 'SERVICE_KEY') !== false ||
                    stripos($response, '<OpenAPI_ServiceResponse>') !== false ||
                    stripos($response, '<ServiceResult>') !== false) {

                    fwrite(STDERR, "FAILED: bjd_cd: {$bjd_cd}, ymd: {$ymd} -> API ERROR RESPONSE: {$response}" . PHP_EOL);
                    $overallSuccess = false;
                    break 2;
                }

                $xml = simplexml_load_string($response);

                // #<-- 여기에 에러 처리 로직을 넣으세요 -->
                if ($xml === false) {
                    $errors = libxml_get_errors();
                    $errorMessage = "XML 파싱 실패: ";
                    foreach ($errors as $error) {
                        $errorMessage .= trim($error->message) . " "; // 오류 메시지 앞뒤 공백 제거
                    }
                    libxml_clear_errors(); // 에러 버퍼 비우기

                    // 실패했으므로 스크립트를 중단하고 오류 메시지 출력
                    fwrite(STDERR, "FAILED: bjd_cd: {$bjd_cd}, ymd: {$ymd} -> API 응답 XML 파싱 실패: {$errorMessage} 원본 응답: {$response}" . PHP_EOL);
                    $overallSuccess = false; // 이 스크립트 전체의 최종 성공 여부 플래그
                    break 2; // bjd_cd, ymd 루프 모두 중단
                }

                $json = json_decode(json_encode($xml), true);

                $processed = 0;

                if (isset($json['body']['items']['item'])) {
                    $items = $json['body']['items']['item'];
                    $count = $json['body']['totalCount'] ?? 0;

                    $processed = isset($items[0]) ? count($items) : 1;
                    $totalProcessedCount += $processed;
                    $historyCount = $processed;

                    $items = isset($items[0]) ? $items : [$items];

                    foreach ($items as &$item) {  // ✅ & 참조 사용
                        // 모든 필드 정규화
                        $item = normalizeXmlItem($item);
                    }
                    unset($item);  // 참조 해제

                    foreach ($items as $item) {
                        
                        $jibun = isset($item['jibun']) ? trim($item['jibun']) : '';
                        // 1️⃣ 지번 마킹 여부 판단
                        $isMasked = ($jibun !== '' && strpos($jibun, '*') !== false);

                        // 2️⃣ 마킹된 경우 → 추론 로직
                        if ($isMasked) {
                            $pnu = findPnuInBuildingRedis( $conn, $item, $redis, $policy, $resolver, $historyId);
                            if (!$pnu) {
                                // 로그 남기고 continue
                                //fwrite(STDERR, "[WARN] PNU 매칭 실패: {$item['jibun']} {$item['buildingAr']}" . PHP_EOL);
                            //    pnuScoreLog( "[WARN] PNU 매칭 실패: {$item['jibun']} {$item['buildingAr']}" );
                            //    continue;
                            }
                        } else {
                            // 3️⃣ 마킹 안 된 경우 → PNU 직접 생성
                            $pnu = generatePnu($item);
                            if (!$pnu) {
                                //fwrite(STDERR, "[WARN] PNU 생성 실패: {$item['jibun']}" . PHP_EOL);
                            //    pnuScoreLog( "[WARN] PNU 생성 실패: {$item['jibun']}" );
                            //    continue;
                            }
                        }
                        $item['pnu'] = $pnu ?? '';
                        if(processAndSaveItem($conn, $item, REALPRICE_SINGLE_TABLE)){ // 함수 이름 변경
                            $insertedCount++;
                        }
                    }
                } else {
                    $processed = 0;
                    $historyCount = 0;
                    $count = 0;
                }   
                $insert_sql = "INSERT INTO realprice_down_his (type, bjdCd, date, count) VALUES ('single', ?, ?, ?)";
                $insert_stmt = $conn->prepare($insert_sql);

                $insert_stmt->bind_param("ssi", $bjd_cd, $ymd, $count);
                $insert_stmt->execute();
                $insert_stmt->close();
               
            } else {
                fwrite(STDERR, "FAILED: bjd_cd: $bjd_cd, 수집월: $ymd -> No response from API (single)." . PHP_EOL);
                $overallSuccess = false;
                break 2;
            }
        } catch (Exception $e) {
            fwrite(STDERR, "FAILED: bjd_cd: $bjd_cd, 수집월: $ymd -> Error (single): {$e->getMessage()}" . PHP_EOL);
            $overallSuccess = false;
            break 2;
        }
    }
    $start_date->modify('+1 month');
}

if (ob_get_level() > 0) {
    ob_end_clean();
}

// 헬퍼 스크립트의 마지막 부분 (수정)
if ($overallSuccess) {
    // JSON 형태로 상태 코드와 필요한 데이터(totalProcessedCount)를 출력
    echo json_encode([
        'status' => 'SUCCESS',
        'message' => '국토교통부 실거래가(단독) 가져오기 완료.',
        'totalProcessedCount' => $totalProcessedCount
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL; // <--- 이 부분!
    
    exit(0);
} else {
    // 실패 시에도 JSON 형태로 에러 메시지를 출력
    echo json_encode([
        'status' => 'FAILED',
        'message' => '국토교통부 실거래가(단독) 가져오기 실패.',
        'error' => '모두 수집 실패' // 실제 에러 내용을 여기에 포함
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL; 
    exit(1);
}

function existsPnuInBuildingDB($pnu, $sidoCd) {
    global $conn;

    $bldTotal = "bldrgst_total_" . $sidoCd;
    $bldTitle = "bldrgst_title_" . $sidoCd;

    // 1️⃣ 총괄표제부 체크
    $sql = "SELECT 1 FROM {$bldTotal} WHERE pnu = ? LIMIT 1";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "s", $pnu);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_store_result($stmt);

    if (mysqli_stmt_num_rows($stmt) > 0) {
        mysqli_stmt_close($stmt);
        return true;
    }
    mysqli_stmt_close($stmt);

    // 2️⃣ 표제부 체크
    $sql = "SELECT 1 FROM {$bldTitle} WHERE pnu = ? LIMIT 1";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "s", $pnu);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_store_result($stmt);

    $exists = mysqli_stmt_num_rows($stmt) > 0;
    mysqli_stmt_close($stmt);

    return $exists;
}

/**
 * 국토교통부 단독 실거래 API를 모두 호출하여 전체 페이지를 수집한다.
 */
function getTradeData($lawd_cd, $deal_ymd, $service_key)
{
    // 페이지가 끝날 때까지 모든 응답을 수집
    $all_items = [];
    $page = 1;

    
    $url = "https://apis.data.go.kr/1613000/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade";
    
    $params = [
        'LAWD_CD' => $lawd_cd,
        'DEAL_YMD' => $deal_ymd,
        'serviceKey' => $service_key,
        'pageNo' => $page,
        'numOfRows' => '5000',
    ];
    $url .= '?' . http_build_query($params);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        echo json_encode(['error' => 'cURL Error: ' . curl_error($ch)]);
        return null;
    }

    curl_close($ch);

    return $response;

}

// 응답 필드를 기반으로 PNU 생성
function generatePnu($item)
{
    // 지분 거래는 매칭 대상에서 제외
    if (
        isset($item['shareDealingType']) &&
        is_string($item['shareDealingType']) &&
        trim($item['shareDealingType']) === '지분'
    ) {
        //error_log("[debug][지분 거래는 매칭 대상에서 제외됩니다 (sggCd): {$item['sggCd']} (umdNm): {$item['umdNm']} (jimok): {$item['jimok']} (jibun): {$item['jibun']} ]");
        return null;
    }
    
    // 1️⃣ 거래취소 제외
    if (isset($item['cdealDay']) && trim((string)$item['cdealDay']) === '') {  //cdealDay이 존재하고, 그 값이 null 또는 빈 문자열인 경우
        return null;
    }
    global $conn;

    $sggCd = $item['sggCd'];
    $sidoCd = substr($sggCd, 0, 2);
    $sggCdOnly = substr($sggCd, 2, 3);
    $umdNm = $item['umdNm'];
    $jibun = $item['jibun'];

    $sql = "SELECT region_cd 
            FROM bjd_master 
            WHERE sido_cd = ? 
            AND sgg_cd = ? 
            AND locatadd_nm LIKE ? ";

    $umdNmWithWildcard = "%" . $umdNm;

    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "sss", $sidoCd, $sggCdOnly, $umdNmWithWildcard);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_bind_result($stmt, $pnu);
    mysqli_stmt_fetch($stmt);

    mysqli_stmt_close($stmt);

    if (empty($jibun)) {
        $jibunCode = '00000000';
    } else {
        $jibunParts = explode('-', $jibun);
        $mainJibun = str_pad($jibunParts[0], 4, '0', STR_PAD_LEFT);
        $subJibun = isset($jibunParts[1]) ? str_pad($jibunParts[1], 4, '0', STR_PAD_LEFT) : '0000';
        $jibunCode = $mainJibun . $subJibun;
    }

    $finalPnu = $pnu ? $pnu . "1" . $jibunCode : null;
    return $finalPnu ?: null;
}

/**
 * 거래 정보를 기준으로 Redis에 저장된 단독토지 특성(PNU)을 찾아 결합한다.
 * $item: 실거래가 정보 배열
 */
function findPnuInBuildingRedis(mysqli $conn, $item, $redis, $policy, $resolver, $historyId)
{
    // 1️⃣ 지분 거래 제외 단독에는 없는 항목임
    /*
    if (
        isset($item['shareDealingType']) &&
        trim((string)$item['shareDealingType']) === '지분'
    ) {
        return null;
    }
    */

    // 1️⃣ 거래취소 제외
    if (isset($item['cdealDay']) && trim((string)$item['cdealDay']) === NULL) {
        return null;
    }

    $sggCd = $item['sggCd'];
    $jibun = $item['jibun'];
    $umdNm = $item['umdNm'];
    $umdCd = getUmdCdByName($sggCd, $umdNm);
    // ✅ 디버그 추가
    if (!$umdCd){
        pnuScoreLog("[DEBUG] umdNm={$umdNm}, sggCd={$sggCd}, umdCd=" . ($umdCd ?? 'NULL'));
        //pnuScoreLog("[debug][umdCd 없음] sggCd={$sggCd} umdNm={$umdNm}");
        return null;
    }
    

    // 2️⃣ 마스킹 지번 파싱
    $parsed = parseMaskedJibun($jibun);
    if (!$parsed){
        //pnuScoreLog( "[debug][마스킹 지번 파싱 실패] (jibun): $jibun" );
        return null;
    }
    $mCode  = $parsed['mCode'];
    $min   = $parsed['min'];
    $max   = $parsed['max'];
    //$prefix = $parsed['prefix'];
    //$rawPrefix = $parsed['prefix'];
    //$rawPrefix = $parsed['prefix'] ?? '';
//pnuScoreLog("==== 실거래가 지번 분석 ====");
//pnuScoreLog("원본 jibun: {$jibun}");
//pnuScoreLog("range: {$min} ~ {$max}");
//pnuScoreLog("mCode: {$mCode}");

    $sidoCd = substr($sggCd, 0, 2);
    
    // 3️⃣ 전체 PNU 인덱스 조회
    $indexKey = "bld:{$sidoCd}:pnu_idx:{$sggCd}:{$umdCd}:{$mCode}";
    //pnuScoreLog("[debug] indexKey={$indexKey}");

    $candidatePnus = $redis->sMembers($indexKey);

    // ✅ 디버그 추가
    if (empty($candidatePnus)) {
        pnuScoreLog("[DEBUG] indexKey={$indexKey}, candidates=" . count($candidatePnus));
        //pnuScoreLog("[debug][전체 후보 없음]");
        return null;
    }
//pnuScoreLog("candidatePnus count: " . count($candidatePnus));

    // 4️⃣ bonbun range 필터
    $candidates = [];
/*
    foreach ($candidatePnus as $pnu) {

        $hashKey = "bld:{$sidoCd}:pnu:{$pnu}";
        $data = $redis->hGetAll($hashKey);

        if (empty($data)) continue;

        $bonbun = (int)$data['bonbun'];

        if ($bonbun < $min || $bonbun > $max) {
            continue;
        }

        $candidates[] = $data;
    }
*/
    // 🔥 Redis pipeline 시작
    $pipe = $redis->multi(Redis::PIPELINE);

    foreach ($candidatePnus as $pnu) {
        $hashKey = "bld:{$sidoCd}:pnu:{$pnu}";
        $pipe->hGetAll($hashKey);
    }

    // 🔥 한번에 Redis 실행
    $results = $pipe->exec();

    if ($results === false || !is_array($results)) {
        error_log("[ERROR] Redis pipeline exec 실패 (단독/다가구 조회). sggCd={$sggCd}, dongNm={$umdNm}");
        return null;
    }

    foreach ($results as $data) {

        if (empty($data)) continue;
        //$data['pnu'] = $pnu;   // 🔥 추가
       // $data['pnu'] = $candidatePnus[$idx]; // ✅ 인덱스로 매핑
        $bonbun = (int)($data['bonbun'] ?? 0);

        if ($bonbun < $min || $bonbun > $max) {
            continue;
        }

        $candidates[] = $data;
    }

    if (empty($candidates)) {
        //pnuScoreLog("[debug][range 통과 후보 없음]");
        return null;
    }

     // 5️⃣ 점수 컨텍스트 구성
     $context = [
        'houseType'    => $item['houseType'] ?? '',
        'plottageAr'  => (float)($item['plottageAr'] ?? 0),  //대지(전용면적)
        'totalFloorAr' => (float)($item['totalFloorAr'] ?? 0),
        'sggCd'       => $sggCd,
        'umdCd'       => $umdCd,
    ];

    // 6️⃣ 최고 점수 선택
    $bestScore = 0;
    $bestPnu   = null;
    $best      = null;

    foreach ($candidates as &$c) {

        // 🔥 여기다가 추가
    //pnuScoreLog("RAW title_platArea=" . ($c['title_platArea'] ?? 'NULL'));
    //pnuScoreLog("RAW total_platArea=" . ($c['total_platArea'] ?? 'NULL'));
    //pnuScoreLog("RAW title_totArea=" . ($c['title_totArea'] ?? 'NULL'));
    //pnuScoreLog("RAW total_totArea=" . ($c['total_totArea'] ?? 'NULL'));

    // 🔥 대지면적 (platArea)
        $titlePlat = (float)($c['title_platArea'] ?? 0);
        $totalPlat = (float)($c['total_platArea'] ?? 0);
        //토지면적
        $land_lndpclAr = (float)($c['land_lndpclAr'] ?? 0);
        $c['plottageAr'] = 
            $titlePlat > 0 ? $titlePlat : 
            ($totalPlat > 0 ? $totalPlat : $land_lndpclAr); // 🔥 토지면적 추가 고려
        //$c['plottageAr'] = $titlePlat > 0 ? $titlePlat : $totalPlat;

        // 🔥 연면적 (totArea)
        $titleTot = (float)($c['title_totArea'] ?? 0);
        $totalTot = (float)($c['total_totArea'] ?? 0);
        $c['totalFloorAr'] = $titleTot > 0 ? $titleTot : $totalTot;
        
        /*
        // 🔥 층수 안전 처리
        $c['grndFlrCnt'] = (int)($c['grndFlrCnt'] ?? 0);
        */
        if (!$policy->isValid($c, $context)) {
            continue;
        }
        // 건물 유형 필터 후보항목중 건물 유형이 일반인 경우 대지면적(platArea)이 0인 후보는 제외
        /*
        if ($c['plottageAr'] == 0) {
            continue;
        }
        */
        
        // 🔥 점수 계산
        $score = $policy->score($c, $context);

        // 65점 이상인 것 중 최고 점수 선택
        if ($score >= PNU_SCORE_THRESHOLD && $score > $bestScore) {
            $bestScore = $score;
            $bestPnu   = $c['pnu'];
            $best      = $c;   // 로그용
        }
    }

    return $bestPnu;
}

function parseMaskedJibun(string $jibun): ?array
{
    $jibun = trim($jibun);
    if ($jibun === '') return null;

    $mCode = 1;

    if (mb_substr($jibun, 0, 1) === '산') {
        $mCode = 2;
        $jibun = trim(mb_substr($jibun, 1)); // ✅ 공백 제거
    }

    // '*' → 0000~0009
    if ($jibun === '*') {
        return [
            'mCode' => $mCode,
            'min'   => 0,
            'max'   => 9,
        ];
    }

    // 숫자 1자리 + * 1~3개
    if (!preg_match('/^(\d)(\*{1,3})$/', $jibun, $m)) {
        return null;
    }

    $digit   = (int)$m[1];
    $starLen = strlen($m[2]);

    $min = $digit * pow(10, $starLen);
    $max = $min + pow(10, $starLen) - 1;

    return [
        'mCode' => $mCode,
        'min'   => $min,
        'max'   => $max,
    ];
}

/**
 * 읍면동명을 기준으로 bjd_master에서 umd_cd를 조회한다.
 */
function getUmdCdByName($sggCd, $umdNm)
{
    static $cache = [];

    $umdQueryInfo = resolveUmdQueryInfo($umdNm);
    $normalizedUmd = $umdQueryInfo['name'];
    $targetDepth = $umdQueryInfo['depth'];

    if ($normalizedUmd === null || $targetDepth === null) {
        return null;
    }

    $cacheKey = $sggCd . '_' . $normalizedUmd . '_' . $targetDepth;
    if (isset($cache[$cacheKey])) return $cache[$cacheKey];

    global $conn;

    $sido = substr($sggCd, 0, 2);
    $sgg  = substr($sggCd, 2, 3);

    $sql =
        "SELECT umd_cd 
        FROM bjd_master 
        WHERE sido_cd = ? 
            AND sgg_cd = ? 
            AND locallow_nm = ? 
            AND depth = ? 
        LIMIT 1
    ";

    $stmt = executeQuery($conn, $sql, 'sssi', [$sido, $sgg, $normalizedUmd, $targetDepth]);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    $cache[$cacheKey] = $row ? $row['umd_cd'] : null;
    return $cache[$cacheKey];
}

/**
 * 읍면동 문자열에서 검색용 마지막 토큰과 depth를 파생한다.
 */
function resolveUmdQueryInfo($umdNm)
{
    if ($umdNm === null) {
        return ['name' => null, 'depth' => null];
    }

    $trimmed = trim((string) $umdNm);
    if ($trimmed === '') {
        return ['name' => null, 'depth' => null];
    }

    // 괄호나 여분 공백 제거 후 마지막 지역명만 사용
    $cleaned = preg_replace('/\([^)]*\)/u', '', $trimmed);
    $cleaned = preg_replace('/\s+/u', ' ', $cleaned);
    $cleaned = trim($cleaned);
    if ($cleaned === '') {
        $cleaned = $trimmed;
    }

    $parts = preg_split('/\s+/u', $cleaned);
    if ($parts === false || empty($parts)) {
        $parts = [$cleaned];
    }

    $lastPart = end($parts);
    if ($lastPart === false) {
        $lastPart = $cleaned;
    }

    $lastPart = preg_replace('/[^0-9A-Za-z가-힣]+$/u', '', $lastPart);
    if ($lastPart === '') {
        $lastPart = $cleaned;
    }

    $depth = count($parts) >= 2 ? 4 : 3;

    return [
        'name' => $lastPart,
        'depth' => $depth,
    ];
}


/**
 * 단독토지 거래 항목을 정규화해 임시 테이블에 저장한다.
 */
function processAndSaveItem($conn, $item)
{
    // API 응답 구조가 고정되지 않아 컬럼/바인딩을 동적으로 구성
    $columns = array_keys($item);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $sql = "INSERT IGNORE INTO " . REALPRICE_SINGLE_TABLE . " (" . implode(', ', $columns) . ") VALUES ($placeholders)";

    $stmt = mysqli_prepare($conn, $sql);
    if ($stmt === false) {
        throw new Exception('Prepare error: ' . mysqli_error($conn));
    }

    $params = [];
    $types = str_repeat('s', count($columns));
    foreach ($columns as $col) {
        $value = $item[$col];
        if (is_array($value)) {
            // 빈 배열이면 null, 아니면 json 인코딩
            $params[] = empty($value) ? null : json_encode($value, JSON_UNESCAPED_UNICODE);
        } else {
            $params[] = $value;
        }
    }

    mysqli_stmt_bind_param($stmt, $types, ...$params);
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('Execute error: ' . mysqli_stmt_error($stmt));
    }
    mysqli_stmt_close($stmt);
    /*  //INSERT ... ON DUPLICATE KEY UPDATE (중복 시 업데이트)
       //중복 레코드가 발생하면 기존 레코드의 특정 컬럼을 업데이트해야 할 경우 사용합니다. (예: rgstDate나 다른 상태 컬럼 등)
     $columns = array_keys($item);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));

    // ON DUPLICATE KEY UPDATE 절을 동적으로 생성
    $updateColumns = [];
    foreach ($columns as $column) {
        // `idx` 컬럼은 auto_increment이므로 업데이트하지 않습니다.
        // 다른 고유하지 않은 컬럼들은 새로운 값으로 업데이트합니다.
        if ($column !== 'idx') { 
            $updateColumns[] = "`{$column}` = VALUES(`{$column}`)"; // VALUES(`컬럼명`)은 현재 INSERT 하려는 값을 의미합니다.
        }
    }
    $onDuplicateUpdate = implode(', ', $updateColumns);

    $sql = "INSERT INTO " . $tableName . " (" . implode(', ', $columns) . ") VALUES ($placeholders) " .
           "ON DUPLICATE KEY UPDATE " . $onDuplicateUpdate;

    $stmt = mysqli_prepare($conn, $sql);

    if ($stmt === false) {
        throw new Exception('Failed to prepare statement: ' . mysqli_error($conn));
    }

    $params = [];
    $types = str_repeat('s', count($columns));
    foreach ($columns as $column) {
        $params[] = $item[$column] ?? null;
    }

    mysqli_stmt_bind_param($stmt, $types, ...$params);

    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('Failed to execute statement: ' . mysqli_stmt_error($stmt));
    }

    // ON DUPLICATE KEY UPDATE 시 mysqli_stmt_affected_rows는
    // 삽입 시 1, 업데이트 시 2 (값이 변경되었을 때), 변경 없으면 0을 반환할 수 있습니다.
    // $affectedRows = mysqli_stmt_affected_rows($stmt);

    mysqli_stmt_close($stmt);
    */
}

// ✅ 정규화 함수 추가
function normalizeXmlItem(array $item): array
{
    foreach ($item as $key => $value) {
        if (is_array($value)) {
            // 빈 배열 → null, 값 있는 배열 → 첫 번째 값
            $item[$key] = empty($value) ? null : (string)reset($value);
        } else {
            $item[$key] = $value === '' ? null : $value;
        }
    }
    return $item;
}

/**
 * 단독토지 관련 문자열을 trim한 형태로 통일한다.
 */
function normalizeLandString($value)
{
    if ($value === null) {
        return null;
    }

    if (is_string($value)) {
        return trim($value);
    }

    return $value;
}

function parseCliKeyValueArgs(array $argv)
{
    $parsed = [];
    foreach (array_slice($argv, 1) as $arg) {
        if (strpos($arg, '=') === false) {
            continue;
        }
        [$key, $value] = explode('=', $arg, 2);
        $key = trim($key);
        if ($key === '') {
            continue;
        }
        $parsed[$key] = $value;
    }

    return $parsed;
}

function validateYmArgument($value, $label)
{
    if (!preg_match('/^\d{6}$/', (string) $value)) {
        fwrite(STDERR, sprintf('%s 값은 YYYYMM 형식이어야 합니다.', $label) . PHP_EOL);
        exit(1);
    }

    return (string) $value;
}

?>