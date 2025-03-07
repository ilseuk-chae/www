<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $sql = 
        "UPDATE user_master 
        SET 
            status_code = '005',
            withdrawal_date = NOW()
        WHERE user_no_hmac = ? ;
        ";
    
    // 조건 추가
    $params = [$userNo];
    $types = 's';

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, $types, ...$params);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('EXECUTION_FAILED', 500);
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    mysqli_rollback($conn);  // 트랜잭션 롤백

    $statusCode = $e->getCode() ? $e->getCode() : 500; // 코드가 없을 경우 500으로 설정

    responseApi($statusCode, $e->getMessage(), null);
} finally {
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    if (isset($stmt2)) {
        mysqli_stmt_close($stmt2);
    }
    if (isset($stmt3)) {
        mysqli_stmt_close($stmt3);
    }
    mysqli_close($conn);
}