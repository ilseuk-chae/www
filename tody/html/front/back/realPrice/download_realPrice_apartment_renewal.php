<?php
if (PHP_SAPI !== 'cli') {
    if (function_exists('http_response_code')) {
        http_response_code(403);
    }
    echo "This script can only be executed via CLI." . PHP_EOL;
    exit;
}

error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(0);

$cliOptions = parseCliKeyValueArgs($argv ?? []);

$aptRegionPrefix = $cliOptions['sidoCd'] ?? null;
if ($aptRegionPrefix === null) {
    fwrite(STDERR, "Missing required CLI argument: sidoCd." . PHP_EOL);
    exit(1);
}

if (!preg_match('/^\d{2}$/', $aptRegionPrefix)) {
    fwrite(STDERR, "sidoCd must be a 2-digit code (e.g., 52)." . PHP_EOL);
    exit(1);
}

define('APT_REGION_PREFIX', $aptRegionPrefix);
define('APT_TABLE_NAME', 'realPrice_apt_' . APT_REGION_PREFIX);

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


$start_ymd = $cliOptions['start'] ?? '202001';
$end_ymd = $cliOptions['end'] ?? '202510';

$start_ymd = validateYmArgument($start_ymd, 'start_ymd');
$end_ymd = validateYmArgument($end_ymd, 'end_ymd');

if ($start_ymd > $end_ymd) {
    fwrite(STDERR, "start_ymd must be earlier than or equal to end_ymd." . PHP_EOL);
    exit(1);
}

$service_key = $_ENV['public_data_key'] ?? '';

$sql = "SELECT CONCAT(sido_cd, sgg_cd) AS bjd_cd
        FROM bjd_master
        WHERE depth = 2
          AND LEFT(region_cd, 2) = ?
        ORDER BY bjd_cd ASC";

$params = [APT_REGION_PREFIX];
$types = 's';
$stmt = executeQuery($conn, $sql, $types, $params);
$result = mysqli_stmt_get_result($stmt);

// 대상 시군구 코드 목록 구성
$bjd_list = [];
while ($row = mysqli_fetch_assoc($result)) {
    $bjd_list[] = $row['bjd_cd'];
}

$start_date = DateTime::createFromFormat('Ym', $start_ymd);
$end_date = DateTime::createFromFormat('Ym', $end_ymd);

while ($start_date <= $end_date) {
    $ymd = $start_date->format('Ym'); // 조회 대상 연월

    // 시군구 단위로 월별 실거래 데이터를 적재
    foreach ($bjd_list as $bjd_cd) {
        // 월별 다운로드 이력 확인
        $select_sql = "SELECT COUNT(*)
        FROM realprice_down_his 
        WHERE type = 'apt' 
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
            continue; // 중복 이력은 건너뜀
        }

        try {
            $response = getTradeData($bjd_cd, $ymd, $service_key);

            if ($response) {
                // OpenAPI 응답을 XML → 배열로 정규화
                $xml = simplexml_load_string($response);
                $json = json_decode(json_encode($xml), true);

                // 응답 목록이 존재하는 경우 데이터 저장
                if (isset($json['body']['items']['item'])) {
                    $items = $json['body']['items']['item'];
                    $count = $json['body']['totalCount'] ?? 0;
                    // 항목 개수에 따라 단건/다건 처리
                    if (isset($items[0])) {
                        foreach ($items as $item) {
                            processAndSaveItem($conn, $item);
                        }
                    } else {
                        processAndSaveItem($conn, $items);
                    }

                    // 기록 저장
                    $insert_sql = "INSERT INTO realprice_down_his (type, bjdCd, date, count) VALUES ('apt', ?, ?, ?)";
                    $insert_stmt = $conn->prepare($insert_sql);
                    $insert_stmt->bind_param("ssi", $bjd_cd, $ymd, $count);
                    $insert_stmt->execute();
                    $insert_stmt->close();

                    echo "bjd_cd: $bjd_cd, ymd: $ymd, count: $count -> Success" . PHP_EOL;
                } else {
                    echo "bjd_cd: $bjd_cd, ymd: $ymd -> No data found" . PHP_EOL;
                    $count = 0;
                    $insert_sql = "INSERT INTO realprice_down_his (type, bjdCd, date, count) VALUES ('apt', ?, ?, ?)";
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

    // 날짜 증가
    $start_date->modify('+1 month');
}


/**
 * API 항목을 정규화하여 아파트 실거래 테이블에 저장한다.
 *
 * @param mysqli $conn
 * @param array  $item
 * @throws \Exception
 */
function processAndSaveItem($conn, $item)
{
    // 필수 키(PNU) 계산
    $item['pnu'] = generatePnu($item);

    // 중첩 배열은 JSON 문자열로 변환
    foreach ($item as $key => $value) {
        if (is_array($value)) {
            $item[$key] = empty($value) ? null : json_encode($value, JSON_UNESCAPED_UNICODE);
        }
    }

    // 정규화된 데이터를 DB에 즉시 삽입
    $columns = array_keys($item);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $sql = "INSERT INTO " . APT_TABLE_NAME . " (" . implode(', ', $columns) . ") VALUES ($placeholders)";

    $stmt = mysqli_prepare($conn, $sql);

    if ($stmt === false) {
        throw new Exception('Failed to prepare statement: ' . mysqli_error($conn));
    }

    $params = [];
    $types = str_repeat('s', count($columns)); // 단순화를 위해 전부 문자열로 바인딩
    foreach ($columns as $column) {
        $params[] = $item[$column] ?? null;
    }

    mysqli_stmt_bind_param($stmt, $types, ...$params);

    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('Failed to execute statement: ' . mysqli_stmt_error($stmt));
    }

    mysqli_stmt_close($stmt);
}


// 국토교통부 아파트 실거래 API 호출
function getTradeData($lawd_cd, $deal_ymd, $service_key)
{
    $url = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev";
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

// PNU 생성 유틸리티
function generatePnu($item)
{
    $sggCd = isset($item['sggCd']) ? $item['sggCd'] : '';
    $umdCd = isset($item['umdCd']) ? $item['umdCd'] : '';
    $landCd = isset($item['landCd']) ? $item['landCd'] : '';
    $bonbun = isset($item['bonbun']) ? $item['bonbun'] : '';
    $bubun = isset($item['bubun']) ? $item['bubun'] : '';

    // PNU는 sggCd, umdCd, landCd, bonbun, bubun을 결합하여 생성합니다.
    return $sggCd . $umdCd . $landCd . $bonbun . $bubun;
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
        fwrite(STDERR, sprintf('%s must be provided in YYYYMM format.', $label) . PHP_EOL);
        exit(1);
    }

    return (string) $value;
}
