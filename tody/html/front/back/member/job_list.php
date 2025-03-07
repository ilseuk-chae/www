<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect.php';

$sql =
    "SELECT 
        job_no,
        job_name
    FROM relationship_job
    WHERE delete_fg = 'N'
    ORDER BY job_no ASC; ";


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

// 성공 응답 반환
responseApi(200, 'SUCCESS', $response_data);

// 데이터베이스 연결 종료
mysqli_close($conn);