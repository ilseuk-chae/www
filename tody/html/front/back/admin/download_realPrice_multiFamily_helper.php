<?php
// download_realPrice_multiFamily_helper.php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only be executed via CLI." . PHP_EOL);
    exit(1);
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
set_time_limit(0);

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
    fwrite(STDERR, "FAILED: sidoCd는 두 자리 숫자여야 합니다 (예: 11)." . PHP_EOL);
    exit(1);
}

define('TARGET_REGION_PREFIX', $targetRegionPrefix);
define('REALPRICE_MULTIFAMILY_TABLE', 'realPrice_multiFamily_' . TARGET_REGION_PREFIX);

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

$sql = sprintf(
    "SELECT CONCAT(sido_cd, sgg_cd) AS bjd_cd FROM bjd_master WHERE depth = 2 AND LEFT(region_cd, 2) IN ('%s') ORDER BY bjd_cd ASC;",
    TARGET_REGION_PREFIX
);

try {
    $params = [];
    $types = '';
    $stmt = executeQuery($conn, $sql, $types, $params);
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
$historyId = (int) ($cliOptions['historyId'] ?? 0); // 자식 historyId 받기

$overallSuccess = true;
$totalProcessedCount = 0; // 총 처리 건수를 누적할 변수 초기화

while ($start_date <= $end_date) {
    // === 작업 취소 여부 주기적 확인 ===
    if (check_cancellation($historyId, $conn)) {
        throw new Exception("Sido {$sidoCd} 작업 도중 사용자 중단 요청 감지. 작업 중단.", 500);
    }
    $ymd = $start_date->format('Ym'); // 조회 대상 연월

    foreach ($bjd_list as $bjd_cd) {
        // 월별 다운로드 이력 확인
        $select_sql = "SELECT COUNT(*) FROM realprice_down_his WHERE type = 'multi' AND bjdCd = ? AND date = ?";
        $select_stmt = $conn->prepare($select_sql);
        if ($select_stmt === false) {
            fwrite(STDERR, "FAILED: Failed to prepare select_stmt for realprice_down_his: " . $conn->error . PHP_EOL);
            $overallSuccess = false;
            break 2;
        }
        $select_stmt->bind_param("ss", $bjd_cd, $ymd);
        $select_stmt->execute();
        $select_stmt->bind_result($row_count);
        $select_stmt->fetch();
        $select_stmt->close();

        if ($row_count > 0) {
            //fwrite(STDERR, "WARN: (연립)이미 존재하는 날짜입니다. bjd_cd: $bjd_cd, 날짜: $ymd" . PHP_EOL); // 헬퍼는 로그를 상세히 남기지 않음
            log_to_db($historyId, "[bjd_cd: $bjd_cd] (연립)이미 존재하는 날짜($ymd)입니다: ", $conn, 'INFO');
            continue;
        }

        try {
            //$url = "https://apis.data.go.kr/1613000/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade"; // 연립다세대 API 엔드포인트 확인
            // getTradeData 함수가 API를 호출하고 응답($response)을 가져옵니다.
            //$response = getTradeData($bjd_cd, $ymd, $service_key, $url ); // 함수 이름 변경
            $response = getTradeData($bjd_cd, $ymd, $service_key);

            if ($response) {
                //$xml = simplexml_load_string($response);

                // 디버그용: 실제 API 응답 문자열을 로그로 남겨서 확인합니다.
                // 이 메시지는 콘솔, 또는 PHP 에러 로그 파일(php_error.log)에 출력됩니다.
                //fwrite(STDERR, "[DEBUG_API_RAW_RESPONSE] bjd_cd: {$bjd_cd}, ymd: {$ymd}, Response: " . $response . PHP_EOL);
                libxml_use_internal_errors(true); // 에러를 내부적으로 처리하도록 설정
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

                if (isset($json['body']['items']['item'])) {
                    $items = $json['body']['items']['item'];
                    $count = $json['body']['totalCount'] ?? 0;

                    $totalProcessedCount += $count;

                    if (isset($items[0])) {
                        foreach ($items as $item) {
                            processAndSaveItem($conn, $item, REALPRICE_MULTIFAMILY_TABLE); // 함수 이름 변경
                        }
                    } else {
                        processAndSaveItem($conn, $items, REALPRICE_MULTIFAMILY_TABLE); // 함수 이름 변경
                    }

                    $insert_sql = "INSERT INTO realprice_down_his (type, bjdCd, date, count) VALUES ('multi', ?, ?, ?)";
                    $insert_stmt = $conn->prepare($insert_sql);
                    $insert_stmt->bind_param("ssi", $bjd_cd, $ymd, $count);
                    $insert_stmt->execute();
                    $insert_stmt->close();
                } else {
                    $count = 0;
                    $insert_sql = "INSERT INTO realprice_down_his (type, bjdCd, date, count) VALUES ('multi', ?, ?, ?)";
                    $insert_stmt = $conn->prepare($insert_sql);
                    $insert_stmt->bind_param("ssi", $bjd_cd, $ymd, $count);
                    $insert_stmt->execute();
                    $insert_stmt->close();
                    log_to_db($historyId, "INFO: bjd_cd: $bjd_cd, 수집월: $ymd -> No data found(연립)", $conn, 'INFO');
                }
            } else {
                fwrite(STDERR, "FAILED: bjd_cd: $bjd_cd, 수집월: $ymd -> No response from API (MultiFamily)." . PHP_EOL);
                $overallSuccess = false;
                break 2;
            }
        } catch (Exception $e) {
            fwrite(STDERR, "FAILED: bjd_cd: $bjd_cd, 수집월: $ymd -> Error (MultiFamily): {$e->getMessage()}" . PHP_EOL);
            $overallSuccess = false;
            break 2;
        }
    }
    $start_date->modify('+1 month');
}

// 헬퍼 스크립트의 마지막 부분 (수정)
if ($overallSuccess) {
    // JSON 형태로 상태 코드와 필요한 데이터(totalProcessedCount)를 출력
    echo json_encode([
        'status' => 'SUCCESS',
        'message' => '국토교통부 실거래가(연립) 가져오기 완료.',
        'totalProcessedCount' => $totalProcessedCount
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL; 
    exit(0);
} else {
    // 실패 시에도 JSON 형태로 에러 메시지를 출력
    echo json_encode([
        'status' => 'FAILED',
        'message' => '국토교통부 실거래가(연립) 가져오기 실패.',
        'error' => '모두 수집 실패' // 실제 에러 내용을 여기에 포함
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL; 
    exit(1);
}

/**
 * 국토교통부 다세대·연립 실거래 API 호출.
 *
 * @param string $lawd_cd  법정동 코드(시군구 5자리)
 * @param string $deal_ymd 조회 연월(YYYYMM)
 * @param string $service_key 공공데이터 서비스 키
 * @return string|null XML 응답 또는 null
 */
function getTradeData($lawd_cd, $deal_ymd, $service_key)
{
    $url = "https://apis.data.go.kr/1613000/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade";
    $params = [
        'LAWD_CD' => $lawd_cd,
        'DEAL_YMD' => $deal_ymd,
        'serviceKey' => $service_key,
        'pageNo' => '1',
        'numOfRows' => '10000',

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

/**
 * API 항목을 정규화해 다세대 실거래 테이블에 저장.
 *
 * @param mysqli $conn
 * @param array  $item
 * @throws \Exception
 */
function processAndSaveItem($conn, $item)
{
    // PNU 계산
    $item['pnu'] = generatePnu($item);

    // 배열 값은 JSON 문자열로 변환
    foreach ($item as $key => $value) {
        if (is_array($value)) {
            if (empty($value)) {
                $item[$key] = null;
            } else {
                $item[$key] = json_encode($value, JSON_UNESCAPED_UNICODE);
            }
        }
    }

    // 정규화된 데이터를 즉시 삽입
    $columns = array_keys($item);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $sql = "INSERT IGNORE INTO " . REALPRICE_MULTIFAMILY_TABLE . " (" . implode(', ', $columns) . ") VALUES ($placeholders)";

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
 * 응답 필드를 조합해 PNU를 생성한다.
 */
function generatePnu($item)
{
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