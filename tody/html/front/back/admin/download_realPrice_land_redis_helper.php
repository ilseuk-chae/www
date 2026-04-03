<?php
// download_realPrice_land_redis_helper.php

// CLI 실행 강제
if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only be executed via CLI." . PHP_EOL);
    exit(1);
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
set_time_limit(0);
ini_set('memory_limit', '-1');

$script_root = dirname(__FILE__); // /var/www/tody/html/front/back/admin/
$project_base = dirname($script_root, 1); // /var/www/tody/html/front/back/ (admin에서 2단계 위로)

require_once $project_base . '/00-include/dbconnect.php';
require_once $project_base . '/00-include/common.php';
require_once $project_base . '/admin/batch_helpers.php'; // admin 폴더도 common.php와 같은 레벨에 있으니 경로 수정

//require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'; 
//require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php'; 
//require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/admin/batch_helpers.php'; 

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
define('AREA_TOLERANCE', 5);
define('TARGET_REGION_PREFIX', $targetRegionPrefix);
define('REALPRICE_LAND_TABLE', 'realPrice_land_' . TARGET_REGION_PREFIX); // DB 저장 테이블명

// Redis 연결
$redis = new Redis();
try {
    $redis->connect('127.0.0.1', 6379);
} catch (RedisException $e) {
    fwrite(STDERR, "FAILED: Redis connection failed: " . $e->getMessage() . PHP_EOL);
    exit(1);
}
$redis_prefix = 'land_pnu:'; // 토지 PNU를 Redis에서 찾기 위한 프리픽스

$start_ymd = $cliOptions['start'] ?? $cliOptions['start_ymd'] ?? '202001';
$end_ymd = $cliOptions['end'] ?? $cliOptions['end_ymd'] ?? '202510';
$historyId = (int) ($cliOptions['historyId'] ?? 0); // 자식 historyId 받기

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
        // 월별 다운로드 이력 확인
        $select_sql = "SELECT COUNT(*)
        FROM realprice_down_his
        WHERE type = 'land'
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
            //fwrite(STDERR, "WARN: (토지)이미 존재하는 날짜입니다. bjd_cd: $bjd_cd, 날짜: $ymd" . PHP_EOL); // 헬퍼는 로그를 상세히 남기지 않음
            log_to_db($historyId, "[bjd_cd: $bjd_cd] (토지)이미 존재하는 날짜($ymd)입니다: ", $conn, 'INFO');
            continue; // 중복 이력은 건너_ms
        }

        try {
            // 국토부 실거래가 API 페이지네이션 호출
            $response = getTradeData($bjd_cd, $ymd, $service_key);
            $items = $response['items'];
            $count = $response['totalCount'];

            $totalProcessedCount += $count;

            $historyCount = 0;

            if (!empty($items) && $count > 0) {
                foreach ($items as $item) {
                    // 거래 항목과 가장 근접한 PNU를 Redis에서 찾아 결합
                    $item['pnu'] = findPnuInRedis($item, $redis, $redis_prefix);
                 
                    processAndSaveItem($conn, $item, REALPRICE_LAND_TABLE);
                }
                $historyCount = $count;
            } else {
                //fwrite(STDERR, "INFO: bjd_cd: $bjd_cd, ymd: $ymd -> No data found" . PHP_EOL);
                log_to_db($historyId, "INFO: bjd_cd: $bjd_cd, 수집월: $ymd -> No data found(토지)", $conn, 'INFO');
            }

            // 다운로드 이력 저장
            $insert_sql = "INSERT INTO realprice_down_his (type, bjdCd, date, count) VALUES ('land', ?, ?, ?)";
            $insert_stmt = $conn->prepare($insert_sql);
            if ($insert_stmt === false) {
                throw new Exception('Failed to prepare history insert statement: ' . $conn->error);
            }
            $insert_stmt->bind_param("ssi", $bjd_cd, $ymd, $historyCount);
            $insert_stmt->execute();
            $insert_stmt->close();

        } catch (Exception $e) {
            fwrite(STDERR, "FAILED: bjd_cd: $bjd_cd, 수집월: $ymd -> Error: {$e->getMessage()}" . PHP_EOL);
            $overallSuccess = false;
            //break 2; // 전체 루프 중단
            break;
        }
    }
    $start_date->modify('+1 month');
}

// 헬퍼 스크립트의 마지막 부분 (수정)
if ($overallSuccess) {
    // JSON 형태로 상태 코드와 필요한 데이터(totalProcessedCount)를 출력
    echo json_encode([
        'status' => 'SUCCESS',
        'message' => '국토교통부 실거래가(토지) 가져오기 완료.',
        'totalProcessedCount' => $totalProcessedCount
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL; // <--- 이 부분!
    
    exit(0);
} else {
    // 실패 시에도 JSON 형태로 에러 메시지를 출력
    echo json_encode([
        'status' => 'FAILED',
        'message' => '국토교통부 실거래가(토지) 가져오기 실패.',
        'error' => '모두 수집 실패' // 실제 에러 내용을 여기에 포함
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL; 
    exit(1);
}

/**
 * 국토교통부 토지 실거래 API를 모두 호출하여 전체 페이지를 수집한다.
 */
function getTradeData($lawd_cd, $deal_ymd, $service_key, $numOfRows = 3000)
{
    // 페이지가 끝날 때까지 모든 응답을 수집
    $all_items = [];
    $page = 1;

    while (true) {
        $url = "https://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getRTMSDataSvcLandTrade";
        $params = [
            'LAWD_CD' => $lawd_cd,
            'DEAL_YMD' => $deal_ymd,
            'serviceKey' => $service_key,
            'pageNo' => $page,
            'numOfRows' => $numOfRows,
        ];
        $url .= '?' . http_build_query($params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        curl_close($ch);

        if ($response === false) {
            throw new Exception("cURL 호출 실패: $url");
        }

        $xml = simplexml_load_string($response);
        if (!$xml || $xml->header->resultCode != '000') {
            throw new Exception("API 오류 또는 XML 파싱 실패: $url");
        }

        $json = json_decode(json_encode($xml), true);
        $items = $json['body']['items']['item'] ?? [];

        // 단일 item일 경우
        if (isset($items['dealAmount'])) {
            $all_items[] = $items;
        } else {
            $all_items = array_merge($all_items, $items);
        }

        // 종료 조건
        $totalCount = (int) ($json['body']['totalCount'] ?? 0);
        if ($page * $numOfRows >= $totalCount) break;

        $page++;
    }
    return [
        'items' => $all_items,
        'totalCount' => $totalCount
    ];
}

/**
 * 거래 정보를 기준으로 Redis에 저장된 토지 특성(PNU)을 찾아 결합한다.
 */
function findPnuInRedis($item, $redis, $prefix)
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

    $sggCd = $item['sggCd'];
    $jibun = $item['jibun'];
    $umdNm = $item['umdNm'];
    $jimok = $item['jimok'];
    $landUse = $item['landUse'];
    $dealArea = $item['dealArea'];

    $mountainCode = '1';
    $start = 0;
    $end = 0;

    // 지번이 없으면 매칭하지 않음
    if (empty($jibun)) {
        //error_log("[debug][jibun이 없습니다 (sggCd): $sggCd (umdNm): $umdNm (jimok): $jimok (jibun): $jibun ]");
        return null;
    }

    $range = getJibunRangeFromMasked($jibun);
    $mountainCode = $range['mountainCode'];
    $start = $range['start'];
    $end = $range['end'];

    // 읍면동·지목·이용상황·면적 차이를 기준으로 가장 근접한 PNU 탐색
    return searchClosestPnuByPrefix(
        $redis,
        $prefix,
        $sggCd,
        $mountainCode,
        $start,
        $end,
        $umdNm,
        $jimok,
        $landUse,
        $dealArea
    );
}

function getJibunRangeFromMasked($jibun)
{
    // 지번 마스킹 형태(산 여부, *, 숫자 조합)에 따라 본번 범위 계산
    $mountainCode = strpos($jibun, '산') === 0 ? '2' : '1';

    // 산 표기 제거 후 본번(첫 번째 지번)만 사용
    $withoutMountain = str_replace('산', '', $jibun);
    $mainPart = preg_split('/-/', trim($withoutMountain))[0] ?? '';
    $mainPart = preg_replace('/[^0-9*]/', '', $mainPart);

    if ($mainPart === '') {
        return [
            'mountainCode' => $mountainCode,
            'start' => 0,
            'end' => 0,
        ];
    }

    // 본번은 4자리이므로 불필요한 길이는 잘라낸다
    $mask = substr($mainPart, 0, 4);
    $numStars = substr_count($mask, '*');
    $baseDigits = str_replace('*', '', $mask);

    if ($numStars === 0) {
        $number = (int) $baseDigits;
        $number = max(0, min(9999, $number));
        return [
            'mountainCode' => $mountainCode,
            'start' => $number,
            'end' => $number,
        ];
    }

    // *, **, *** 등 자리수에 따른 범위 계산
    $effectiveStars = min($numStars, 4);
    $rangeSize = 10 ** $effectiveStars;

    if ($baseDigits === '') {
        $start = 0;
        $end = min(9999, $rangeSize - 1);
    } else {
        $baseInt = (int) $baseDigits;
        $start = $baseInt * $rangeSize;
        $end = $start + $rangeSize - 1;
    }

    $start = max(0, min(9999, $start));
    $end = max($start, min(9999, $end));

    return [
        'mountainCode' => $mountainCode,
        'start' => $start,
        'end' => $end,
    ];
}

/**
 * Redis 인덱스를 이용해 가장 가까운 PNU를 탐색한다.
 */
function searchClosestPnuByPrefix($redis, $prefix, $sggCd, $mountainCode, $start, $end, $umdNm, $jimok, $landUse, $dealArea)
{
    // Redis 인덱스 테이블을 이용해 빠르게 후보 PNU 목록을 로드
    $closestPnu = null;
    $smallestDifference = PHP_INT_MAX;

    $umdCd = getUmdCdByName($sggCd, $umdNm); // 예: '129'
    if ($umdCd === null)
    {
        //error_log("[debug][getUmdCdByName 내용이 없습니다  (sggCd): $sggCd ,(umdNm): $umdNm]");
        return null;
    }

    $targetJimok = normalizeLandString($jimok);
    $targetLandUse = normalizeLandString($landUse);

    for ($bonbun = $start; $bonbun <= $end; $bonbun++) {
        $bonbunStr = str_pad($bonbun, 4, '0', STR_PAD_LEFT);
        $indexKey = "land_pnu_idx:$sggCd:$umdCd:$mountainCode:$bonbunStr";

        $pnuList = $redis->sMembers($indexKey);
        if (empty($pnuList))
        {
            //error_log("[debug][pnuList가 없습니다  (indexKey): $indexKey ]");
            continue;
        }

        // 후보 PNU의 속성을 한 번에 조회하기 위해 파이프라인 사용
        $redis->multi(Redis::PIPELINE);
        foreach ($pnuList as $pnu) {
            $redis->hMGet($prefix . $pnu, ['lndcgrCodeNm', 'prposArea1Nm', 'lndpclAr']);
        }
        $results = $redis->exec();

        if ($results === false || !is_array($results)) {
            error_log("[ERROR] Redis pipeline exec 실패 (조회). indexKey=$indexKey");
            continue;
        }

        foreach ($results as $i => $data) {
            // $data는 배열일 수도 있고, Redis에서 데이터를 제대로 가져오지 못하면 false나 빈 배열일 수 있습니다.
            // print_r($data, true)를 사용하여 어떤 형태의 데이터인지 로그로 남기는 것이 디버깅에 유리합니다.
            if (!is_array($data) || empty($data) || (!isset($data['lndcgrCodeNm']) && !isset($data['prposArea1Nm']) && !isset($data['lndpclAr']))) {
                //error_log("[debug][Redis에서 PNU 상세 속성을 제대로 가져오지 못했거나 데이터가 비어있습니다. PNU: " . ($pnuList[$i] ?? 'unknown') . ", data: " . print_r($data, true) . " ]");
                continue; // 다음 $data 항목으로 넘어감
            }

            $dataJimok = normalizeLandString($data['lndcgrCodeNm'] ?? null);
            $dataLandUse = normalizeLandString($data['prposArea1Nm'] ?? null);

            if ($dataJimok === $targetJimok && $dataLandUse === $targetLandUse) {
                $difference = abs((float)$data['lndpclAr'] - (float)$dealArea);
                if ($difference < $smallestDifference && $difference < AREA_TOLERANCE) {
                    $smallestDifference = $difference;
                    $closestPnu = $pnuList[$i];
                } else {
                    //error_log("[debug][면적 차이가 허용 범위를 초과하거나 더 가까운 PNU를 찾지 못했습니다. PNU: " . $pnuList[$i] . ", dataArea: {$data['lndpclAr']}, dealArea: $dealArea, difference: $difference, smallestDifference: $smallestDifference, tolerance: " . AREA_TOLERANCE . " ]");
                }
            } else {
                //error_log("[debug][jimok 또는 landUse가 일치하지 않습니다. PNU: " . $pnuList[$i] . ", dataJimok: $dataJimok, targetJimok: $targetJimok, dataLandUse: $dataLandUse, targetLandUse: $targetLandUse ]");
            }
        }
    }

    // 모든 루프를 다 돌았는데도 $closestPnu가 여전히 null인 경우 (최종적으로 매칭되는 PNU를 찾지 못함)
    if ($closestPnu === null) {
        //error_log("[debug][최종적으로 일치하는 PNU를 찾지 못했습니다. 매개변수: sggCd=$sggCd, umdNm=$umdNm, jimok=$jimok, landUse=$landUse, dealArea=$dealArea, range=$start-$end]");
    }
    else {
        //error_log("[debug][최종적으로 일치하는 PNU를 찾았습니다. PNU: $closestPnu ]");
    }

    return $closestPnu;
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
 * 토지 거래 항목을 정규화해 임시 테이블에 저장한다.
 */
function processAndSaveItem($conn, $item)
{
    // API 응답 구조가 고정되지 않아 컬럼/바인딩을 동적으로 구성
    $columns = array_keys($item);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $sql = "INSERT IGNORE INTO " . REALPRICE_LAND_TABLE . " (" . implode(', ', $columns) . ") VALUES ($placeholders)";

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

/**
 * 토지 관련 문자열을 trim한 형태로 통일한다.
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