<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

// Redis 연결
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);
// $redis->flushDB();  // 현재 DB의 모든 키 삭제

$type = isset($_POST['type']) ? urldecode($_POST['type']) : 'land';
$data = isset($_POST['data']) ? $_POST['data'] : null;

function normalizeSidoName($name)
{
    $mapping = [
        '경기' => '경기도',
        '강원' => '강원도',
        '충북' => '충청북도',
        '충남' => '충청남도',
        '전북' => '전북특별자치도',
        '전남' => '전라남도',
        '경북' => '경상북도',
        '경남' => '경상남도',
    ];

    return $mapping[$name] ?? $name;
}

if (!$data) {
    responseApi(400, 'Invalid or missing data', null);
    exit;
}

try {
    // 데이터 준비
    $sido = normalizeSidoName($data['region_1depth_name']);
    $sgg = $data['region_2depth_name'];
    $umdLi = $data['region_3depth_name'];
    $bun = str_pad($data['main_address_no'], 4, '0', STR_PAD_LEFT);
    $ji = str_pad($data['sub_address_no'], 4, '0', STR_PAD_LEFT);
    $mountainCode = $data['mountain_yn'] == 'Y' ? '2' : '1';
    $addressParts = [$sido];
    if ($sido !== '세종특별자치시' && !empty($sgg)) {
        $addressParts[] = $sgg;
    }
    if (!empty($umdLi)) {
        $addressParts[] = $umdLi;
    }
    $address = implode('%', $addressParts);
    // echo $address;

    // 지역 코드 쿼리
    $sql = 'SELECT region_cd FROM bjd_master WHERE locatadd_nm LIKE ? ';
    $params = [$address];
    $types = 's';
    $stmt = executeQuery($conn, $sql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    $region_cd = $row['region_cd'] ?? null;

    if (!$region_cd) {
        responseApi(404, 'Region code not found', null);
        exit;
    }

    $pnu = $region_cd . $mountainCode . $bun . $ji;

    // 시도 코드 추출
    $sidoCd = substr($pnu, 0, 2);

    // Redis 키 설정
    $cacheKey = "realPrice:{$type}:{$pnu}";

    // 캐시에서 데이터 확인
    if ($redis->exists($cacheKey)) {
        $cachedData = json_decode($redis->get($cacheKey), true);
        responseApi(200, 'SUCCESS', $cachedData);
        exit;
    }

    // 테이블명을 시도 코드에 맞춰 동적으로 변경
    $tableNames = [
        'apt' => "realPrice_apt_{$sidoCd}",
        'land' => "realPrice_land_{$sidoCd}",
        'officetel' => "realPrice_officetel_{$sidoCd}",
        'multi' => "realPrice_multiFamily_{$sidoCd}"
    ];

    // SQL 구문 설정
    if (!isset($tableNames[$type])) {
        responseApi(400, "잘못된 유형입니다.", null);
        exit;
    }

    $table = $tableNames[$type];

    // 테이블과 SQL 구문 설정
    switch ($type) {
        case 'apt':
            // $table = 'realPrice_apt_41';
            $sql = "SELECT rap.aptDong, rap.floor, rap.excluUseAr, '매매' AS saleType, 'apt' AS estateType, rap.dealYear, CONCAT(rap.dealYear, '.', LPAD(rap.dealMonth, 2, '0'), '.', LPAD(rap.dealDay, 2, '0')) AS dealDate, rap.dealAmount, rap.pnu FROM $table AS rap WHERE rap.pnu = ? ORDER BY STR_TO_DATE(CONCAT(rap.dealYear, '-', LPAD(rap.dealMonth, 2, '0'), '-', LPAD(rap.dealDay, 2, '0')), '%Y-%m-%d') DESC";
            break;
        case 'land':
            // $table = 'realPrice_land_41';        
            $sql = "SELECT rap.dealArea, '매매' AS saleType, 'land' AS estateType, rap.dealYear, CONCAT(rap.dealYear, '.', LPAD(rap.dealMonth, 2, '0'), '.', LPAD(rap.dealDay, 2, '0')) AS dealDate, rap.dealAmount, rap.pnu FROM $table AS rap WHERE rap.pnu = ? ORDER BY STR_TO_DATE(CONCAT(rap.dealYear, '-', LPAD(rap.dealMonth, 2, '0'), '-', LPAD(rap.dealDay, 2, '0')), '%Y-%m-%d') DESC";
            break;
        case 'officetel':
            // $table = 'realPrice_officetel_41';
            $sql = "SELECT rap.floor, rap.excluUseAr, '매매' AS saleType, 'officetel' AS estateType, rap.dealYear, CONCAT(rap.dealYear, '.', LPAD(rap.dealMonth, 2, '0'), '.', LPAD(rap.dealDay, 2, '0')) AS dealDate, rap.dealAmount, rap.pnu FROM $table AS rap WHERE rap.pnu = ? ORDER BY STR_TO_DATE(CONCAT(rap.dealYear, '-', LPAD(rap.dealMonth, 2, '0'), '-', LPAD(rap.dealDay, 2, '0')), '%Y-%m-%d') DESC";
            break;
        case 'multi':
            // $table = 'realPrice_multiFamily_41';
            $sql = "SELECT rap.floor, rap.excluUseAr, rap.houseType, '매매' AS saleType, 'multi' AS estateType, rap.dealYear, CONCAT(rap.dealYear, '.', LPAD(rap.dealMonth, 2, '0'), '.', LPAD(rap.dealDay, 2, '0')) AS dealDate, rap.dealAmount, rap.pnu FROM $table AS rap WHERE rap.pnu = ? ORDER BY STR_TO_DATE(CONCAT(rap.dealYear, '-', LPAD(rap.dealMonth, 2, '0'), '-', LPAD(rap.dealDay, 2, '0')), '%Y-%m-%d') DESC";
            break;
        default:
            responseApi(400, 'Invalid estate type', null);
            break;
    }

    $response_data = array();

    // 쿼리 실행
    $params = [$pnu];
    $types = 's';
    $stmt = executeQuery($conn, $sql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $response_data[] = $row;
    }

    // Redis에 결과 저장 (TTL: 하루)
    $redis->setex($cacheKey, 86400, json_encode($response_data));

    // 모든 작업 성공 시 커밋
    responseApi(200, 'SUCCESS', $response_data);
} catch (\Throwable $e) {
    // 오류 발생 시 롤백
    responseApi($e->getCode(), $e->getMessage(), null);
} finally {
    // 연결 종료
    if (isset($stmt))
        mysqli_stmt_close($stmt);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    if (isset($stmt3))
        mysqli_stmt_close($stmt3);
    mysqli_close($conn);
}
