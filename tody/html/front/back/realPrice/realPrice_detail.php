<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

// Redis 연결
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);
// $redis->flushDB();  // 현재 DB의 모든 키 삭제

$type = isset($_POST['type']) ? urldecode($_POST['type']) : '';
$pnu = isset($_POST['pnu']) ? urldecode($_POST['pnu']) : '';

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $type, 'type' => 'string', 'message' => '올바르지 않은 요청입니다.'],
    ['value' => $pnu, 'type' => 'string', 'message' => '올바르지 않은 요청입니다.'],
];

foreach ($validations as $validation) {
    $errorMessage = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['message'] == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}

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
        $sql = "SELECT rap.aptDong, rap.floor, rap.excluUseAr, '매매' AS saleType, 'apt' AS estateType, 
                       rap.dealYear, CONCAT(rap.dealYear, '.', LPAD(rap.dealMonth, 2, '0'), '.', LPAD(rap.dealDay, 2, '0')) AS dealDate, 
                       rap.dealAmount, rap.pnu 
                FROM $table AS rap 
                WHERE rap.pnu = ? 
                ORDER BY STR_TO_DATE(CONCAT(rap.dealYear, '-', LPAD(rap.dealMonth, 2, '0'), '-', LPAD(rap.dealDay, 2, '0')), '%Y-%m-%d') DESC";
        break;
    case 'land':
        $sql = "SELECT rap.dealArea, '매매' AS saleType, 'land' AS estateType, 
                       rap.dealYear, CONCAT(rap.dealYear, '.', LPAD(rap.dealMonth, 2, '0'), '.', LPAD(rap.dealDay, 2, '0')) AS dealDate, 
                       rap.dealAmount, rap.pnu 
                FROM $table AS rap 
                WHERE rap.pnu = ? 
                ORDER BY STR_TO_DATE(CONCAT(rap.dealYear, '-', LPAD(rap.dealMonth, 2, '0'), '-', LPAD(rap.dealDay, 2, '0')), '%Y-%m-%d') DESC";
        break;
    case 'officetel':
        $sql = "SELECT rap.floor, rap.excluUseAr, '매매' AS saleType, 'officetel' AS estateType, 
                       rap.dealYear, CONCAT(rap.dealYear, '.', LPAD(rap.dealMonth, 2, '0'), '.', LPAD(rap.dealDay, 2, '0')) AS dealDate, 
                       rap.dealAmount, rap.pnu 
                FROM $table AS rap 
                WHERE rap.pnu = ? 
                ORDER BY STR_TO_DATE(CONCAT(rap.dealYear, '-', LPAD(rap.dealMonth, 2, '0'), '-', LPAD(rap.dealDay, 2, '0')), '%Y-%m-%d') DESC";
        break;
    case 'multi':
        $sql = "SELECT rap.floor, rap.excluUseAr, rap.houseType, '매매' AS saleType, 'multi' AS estateType, 
                       rap.dealYear, CONCAT(rap.dealYear, '.', LPAD(rap.dealMonth, 2, '0'), '.', LPAD(rap.dealDay, 2, '0')) AS dealDate, 
                       rap.dealAmount, rap.pnu 
                FROM $table AS rap 
                WHERE rap.pnu = ? 
                ORDER BY STR_TO_DATE(CONCAT(rap.dealYear, '-', LPAD(rap.dealMonth, 2, '0'), '-', LPAD(rap.dealDay, 2, '0')), '%Y-%m-%d') DESC";
        break;
}


// 실행 및 결과 반환
try {
    // 결과를 배열로 변환합니다.
    $response_data = array();

    // 쿼리 실행
    $params = [$pnu];
    $types = 's';
    // echo (get_bound_query($sql, $params));exit;
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
