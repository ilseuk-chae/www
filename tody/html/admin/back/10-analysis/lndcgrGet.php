<?php
// CORS 허용
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    $sql = 
    "SELECT 
        condition_id,
        name,
        code
    FROM analysis_conditions
    WHERE parent_id = 23
    AND level = 2
    ORDER BY name ASC";

    // SQL 실행
    $stmt = executeQuery($conn, $sql);

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();

    while ($row = mysqli_fetch_assoc($result)) {
        $response_data[] = $row;
    }

    // 모든 작업 성공 시 커밋
    responseApi(200, 'SUCCESS', $response_data);
    
} catch (Exception $e) {
    // 오류 발생 시 롤백
    responseApi($e->getCode(), $e->getMessage(), null);

}
