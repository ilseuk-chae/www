<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$apply_no = isset($_POST['apply_no']) ? urldecode($_POST['apply_no']) : '';
$status_code = isset($_POST['status_code']) ? urldecode($_POST['status_code']) : '';

##################### 0. 유효성 검사 #####################
$errorMessage = "문제가 발생했습니다.";
$valid = validateInput($status_code, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
$valid = validateInput($apply_no, 'int', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $user_no = get_user_no_for_hash($conn, $userNo);

    ##################### 1.삭제 처리 #####################
    $sql =
        "UPDATE finance_support_list_applied 
        SET 
            status_code = ?
        WHERE manager_no = ?
        AND idx = ?;
        ";

    $params = [$status_code, $user_no, $apply_no];
    $types = 'sii';
    // echo get_bound_query($sql, $params);exit;
    
    $stmt = executeQuery($conn, $sql, $types, $params);

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    // 연결 종료
    if (isset($stmt))
        mysqli_stmt_close($stmt);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    mysqli_close($conn);
}
?>