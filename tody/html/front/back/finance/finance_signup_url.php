<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

##################### 1. 금융사 등록 #####################
try {
    $sql =
        "SELECT url
        FROM finance_signup_url
        ORDER BY reg_date DESC
        LIMIT 1; ";

    // 쿼리 실행
    $params = [];
    $types = '';
    $stmt = executeQuery($conn, $sql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $response_data = $row;
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $response_data);

} catch (Exception $e) {
    mysqli_rollback($conn);  // 트랜잭션 롤백
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    if (isset($stmt2)) {
        mysqli_stmt_close($stmt2);
    }
    mysqli_close($conn);
}
