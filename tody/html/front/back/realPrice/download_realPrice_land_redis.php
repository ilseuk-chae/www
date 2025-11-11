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
set_time_limit(0);
ini_set('memory_limit', '-1');

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
    fwrite(STDERR, "sidoCd는 두 자리 숫자여야 합니다 (예: 41)." . PHP_EOL);
    exit(1);
}

define('AREA_TOLERANCE', 5);
define('TARGET_REGION_PREFIX', $targetRegionPrefix);
define('REALPRICE_LAND_TABLE', 'realPrice_land_' . TARGET_REGION_PREFIX);

// 인증 체크 및 파일 포함
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

// Redis 연결
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);
$redis_prefix = 'land_pnu:';

// API 호출 설정
$start_ymd = $cliOptions['start'] ?? $cliOptions['start_ymd'] ?? '202001';
$end_ymd = $cliOptions['end'] ?? $cliOptions['end_ymd'] ?? '202510';

$start_ymd = validateYmArgument($start_ymd, 'start');
$end_ymd = validateYmArgument($end_ymd, 'end');

if ($start_ymd > $end_ymd) {
    fwrite(STDERR, "start 값은 end 값보다 클 수 없습니다." . PHP_EOL);
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
$stmt = executeQuery($conn, $sql);
$result = mysqli_stmt_get_result($stmt);

$bjd_list = [];
while ($row = mysqli_fetch_assoc($result)) {
    $bjd_list[] = $row['bjd_cd'];
}

$start_date = DateTime::createFromFormat('Ym', $start_ymd);
$end_date = DateTime::createFromFormat('Ym', $end_ymd);

// 기간(월)별로 시군구 데이터를 순회하며 적재
while ($start_date <= $end_date) {
    $ymd = $start_date->format('Ym');

    foreach ($bjd_list as $bjd_cd) {
        // 월별 다운로드 이력 확인
        $select_sql =
            "SELECT COUNT(*) 
            FROM realprice_down_his
            WHERE type = 'land' 
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
            continue;
        }

        try {
            // 국토부 실거래가 API 페이지네이션 호출
            $response = getTradeDataAllPages($bjd_cd, $ymd, $service_key);
            $items = $response['items'];
            $count = $response['totalCount'];

            $historyCount = 0;

            if (!empty($items) && $count > 0) {
                foreach ($items as $item) {
                    // 거래 항목과 가장 근접한 PNU를 Redis에서 찾아 결합
                    $item['pnu'] = findPnuInRedis($item, $redis, $redis_prefix);
                    processAndSaveItem($conn, $item);
                }

                $historyCount = $count;
                echo "bjd_cd: $bjd_cd, ymd: $ymd, count: $count -> Success" . PHP_EOL;
            } else {
                echo "bjd_cd: $bjd_cd, ymd: $ymd -> No data found" . PHP_EOL;
            }

            $insert_sql = "INSERT INTO realprice_down_his (type, bjdCd, date, count) VALUES ('land', ?, ?, ?)";
            $insert_stmt = $conn->prepare($insert_sql);
            $insert_stmt->bind_param("ssi", $bjd_cd, $ymd, $historyCount);
            $insert_stmt->execute();
            $insert_stmt->close();
        } catch (Exception $e) {
            echo "bjd_cd: $bjd_cd, ymd: $ymd -> Error: {$e->getMessage()}" . PHP_EOL;
            exit;
        }
    }

    $start_date->modify('+1 month');
}
exit;


/**
 * 국토교통부 토지 실거래 API를 모두 호출하여 전체 페이지를 수집한다.
 */
function getTradeDataAllPages($lawd_cd, $deal_ymd, $service_key, $numOfRows = 3000)
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
    if ($umdCd === null) return null;

    $targetJimok = normalizeLandString($jimok);
    $targetLandUse = normalizeLandString($landUse);

    for ($bonbun = $start; $bonbun <= $end; $bonbun++) {
        $bonbunStr = str_pad($bonbun, 4, '0', STR_PAD_LEFT);
        $indexKey = "land_pnu_idx:$sggCd:$umdCd:$mountainCode:$bonbunStr";

        $pnuList = $redis->sMembers($indexKey);
        if (empty($pnuList)) continue;

        // 후보 PNU의 속성을 한 번에 조회하기 위해 파이프라인 사용
        $redis->multi(Redis::PIPELINE);
        foreach ($pnuList as $pnu) {
            $redis->hMGet($prefix . $pnu, ['lndcgrCodeNm', 'prposArea1Nm', 'lndpclAr']);
        }
        $results = $redis->exec();

        foreach ($results as $i => $data) {
            if (!is_array($data) || empty($data)) continue;

            $dataJimok = normalizeLandString($data['lndcgrCodeNm'] ?? null);
            $dataLandUse = normalizeLandString($data['prposArea1Nm'] ?? null);

            if ($dataJimok === $targetJimok && $dataLandUse === $targetLandUse) {
                $difference = abs((float)$data['lndpclAr'] - (float)$dealArea);
                if ($difference < $smallestDifference && $difference < AREA_TOLERANCE) {
                    $smallestDifference = $difference;
                    $closestPnu = $pnuList[$i];
                }
            }
        }
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
    $sql = "INSERT INTO " . REALPRICE_LAND_TABLE . " (" . implode(', ', $columns) . ") VALUES ($placeholders)";

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
