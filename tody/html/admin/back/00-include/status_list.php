<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect.php';

$lang = $_POST['langCode'];

if (!$lang || strtolower($lang) == 'kr') {
    $sql =
        "SELECT 
            status_code,
            description_ko AS description
        FROM status_code
        
        WHERE use_fg = 'Y'
        AND group_code = 'USER_STATUS'

        ORDER BY status_code ASC; ";
} else {
    $sql =
        "SELECT 
            status_code,
            description_en AS description
        FROM status_code
    
        WHERE use_fg = 'Y'
        AND group_code = 'USER_STATUS'

        ORDER BY status_code ASC; ";
}

// SQL 문장을 준비합니다.
$stmt = mysqli_prepare($conn, $sql);

// SQL 준비 실패 시,
if (!$stmt) {
    responseApi(500, 'QUERY_PREPARATION_FAILED', null);
    exit;
}

// SQL 문장을 실행합니다.
mysqli_stmt_execute($stmt);

// 결과를 가져옵니다.
$result = mysqli_stmt_get_result($stmt);

// 결과를 배열로 변환합니다.
$response_data = array();

// 결과를 배열로 변환합니다.
while ($row = mysqli_fetch_assoc($result)) {
    $response_data[] = $row;
}

// 데이터가 없을 경우
if (empty($response_data)) {
    responseApi(404, 'NO_DATA', null);
} else {
    // 성공 응답 반환
    responseApi(200, 'SUCCESS', $response_data);
}

// 데이터베이스 연결 종료
mysqli_close($conn);