<?php
if (PHP_SAPI !== 'cli') {
    if (function_exists('http_response_code')) {
        http_response_code(403);
    }
    echo "이 스크립트는 CLI에서만 실행할 수 있습니다." . PHP_EOL;
    exit;
}

error_reporting(E_ALL);
ini_set("display_errors", 1);
set_time_limit(0); // 실행 시간을 무한대로 설정

$cliOptions = parseCliKeyValueArgs($argv ?? []);


$targetRegionPrefix = $cliOptions['sidoCd']
    ?? $cliOptions['sidocd']
    ?? $cliOptions['sido_cd']
    ?? $cliOptions['prefix']
    ?? null;

if ($targetRegionPrefix === null) {
    fwrite(STDERR, "필수 CLI 인자(sidoCd)가 누락되었습니다." . PHP_EOL);
    exit(1);
}

if (!preg_match('/^\d{2}$/', $targetRegionPrefix)) {
    fwrite(STDERR, "sidoCd는 두 자리 숫자여야 합니다 (예: 11)." . PHP_EOL);
    exit(1);
}

define('TARGET_REGION_PREFIX', $targetRegionPrefix);
define('REALPRICE_MULTIFAMILY_TABLE', 'realPrice_multiFamily_' . TARGET_REGION_PREFIX);

include('/var/www/tody/html/front/back/00-include/dbconnect.php');
include('/var/www/tody/html/front/back/00-include/common.php');

$project_root = dirname(__DIR__, 3);
$autoload_path = $project_root . '/vendor/autoload.php';
if (is_file($autoload_path)) {
    require_once $autoload_path;
    if (!isset($_ENV['public_data_key']) && class_exists('Dotenv\\Dotenv')) {
        Dotenv\Dotenv::createImmutable($project_root)->load();
    }
}

// 조회 대상 기간 설정 (기본: 2020.01~2025.10)
$start_ymd = $cliOptions['start'] ?? $cliOptions['start_ymd'] ?? '202001';
$end_ymd = $cliOptions['end'] ?? $cliOptions['end_ymd'] ?? '202510';

$start_ymd = validateYmArgument($start_ymd, 'start');
$end_ymd = validateYmArgument($end_ymd, 'end');

if ($start_ymd > $end_ymd) {
    fwrite(STDERR, "start 값은 end 값보다 클 수 없습니다." . PHP_EOL);
    exit(1);
}

$service_key = $_ENV['public_data_key'] ?? '';

// 대상 시군구 코드 목록 조회
$sql = sprintf(
    "SELECT CONCAT(sido_cd, sgg_cd) AS bjd_cd 
    FROM bjd_master 
    WHERE depth = 2 
    AND LEFT(region_cd, 2) IN ('%s') 
    ORDER BY bjd_cd ASC;",
    TARGET_REGION_PREFIX
);

$params = [];
$types = '';
$stmt = executeQuery($conn, $sql, $types, $params);
$result = mysqli_stmt_get_result($stmt);

$bjd_list = [];
while ($row = mysqli_fetch_assoc($result)) {
    $bjd_list[] = $row['bjd_cd'];
}

$start_date = DateTime::createFromFormat('Ym', $start_ymd);
$end_date = DateTime::createFromFormat('Ym', $end_ymd);

// 기간 루프 (월 단위)
while ($start_date <= $end_date) {
    $ymd = $start_date->format('Ym'); // 조회 대상 연월

    // 시군구별 데이터 다운로드
    foreach ($bjd_list as $bjd_cd) {
        // 월별 다운로드 이력 확인
        $select_sql = "SELECT COUNT(*)
            FROM realprice_down_his 
            WHERE type = 'multi' 
            AND bjdCd = ?
            AND date = ?";
        $select_stmt = $conn->prepare($select_sql);
        $select_stmt->bind_param("ss", $bjd_cd, $ymd);
        $select_stmt->execute();
        $select_stmt->bind_result($row_count);
        $select_stmt->fetch();
        $select_stmt->close();

        if ($row_count > 0) {
            echo "이미 존재하는 날짜입니다. bjd_cd: $bjd_cd, 날짜: $ymd" . PHP_EOL;
            continue; // 중복 이력은 스킵
        }

        try {
            $response = getTradeData($bjd_cd, $ymd, $service_key);

            if ($response) {
                // XML → 배열 변환
                $xml = simplexml_load_string($response);
                $json = json_decode(json_encode($xml), true);

                // 응답에 거래 목록이 있으면 DB에 즉시 적재
                if (isset($json['body']['items']['item'])) {
                    $items = $json['body']['items']['item'];
                    $count = $json['body']['totalCount'] ?? 0;

                    // API가 배열을 주는지 단건을 주는지에 따라 분기
                    if (isset($items[0])) {
                        foreach ($items as $item) {
                            processAndSaveItem($conn, $item);
                        }
                    } else {
                        processAndSaveItem($conn, $items);
                    }

                    // 다운로드 이력 기록
                    $insert_sql = "INSERT INTO realprice_down_his (type, bjdCd, date, count) VALUES ('multi', ?, ?, ?)";
                    $insert_stmt = $conn->prepare($insert_sql);
                    $insert_stmt->bind_param("ssi", $bjd_cd, $ymd, $count);
                    $insert_stmt->execute();
                    $insert_stmt->close();

                    echo "bjd_cd: $bjd_cd, ymd: $ymd, count: $count -> Success" . PHP_EOL;
                } else {
                    echo "bjd_cd: $bjd_cd, ymd: $ymd -> No data found" . PHP_EOL;
                    $count = 0;
                    $insert_sql = "INSERT INTO realprice_down_his (type, bjdCd, date, count) VALUES ('multi', ?, ?, ?)";
                    $insert_stmt = $conn->prepare($insert_sql);
                    $insert_stmt->bind_param("ssi", $bjd_cd, $ymd, $count);
                    $insert_stmt->execute();
                    $insert_stmt->close();
                }
            } else {
                echo "bjd_cd: $bjd_cd, ymd: $ymd -> Failed (No Response)" . PHP_EOL;
            }
        } catch (Exception $e) {
            echo "bjd_cd: $bjd_cd, ymd: $ymd -> Failed (Error: {$e->getMessage()})" . PHP_EOL;
        }
    }

    // 다음 달로 이동
    $start_date->modify('+1 month');
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
    $sql = "INSERT INTO " . REALPRICE_MULTIFAMILY_TABLE . " (" . implode(', ', $columns) . ") VALUES ($placeholders)";

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
