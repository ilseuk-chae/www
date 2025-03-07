<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$memo_no = isset($_POST['memoNo']) ? urldecode($_POST['memoNo']) : '';
$flag = isset($_POST['flag']) ? urldecode($_POST['flag']) : 'N';

##################### 0. 유효성 검사 #####################
$errorMessage = "올바른 요청이 아닙니다.";
$valid = validateInput($memo_no, 'int', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $user_no = get_user_no_for_hash($conn, $userNo);

    // 페이징 추가
    $params = [$flag, $memo_no, $user_no];
    $types = 'sii';

    ##################### 변경 처리 #####################
    $sql_comment = 
        "UPDATE memo_listings SET
            top_fg = ?
        WHERE idx = ?
        AND reg_no = ?";

    $stmt = executeQuery($conn, $sql_comment, $types, $params);

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
    responseApi($e->getCode(), '처리중 문제가 발생했습니다.', $e->getMessage());

} finally {
    // 연결 종료
    if (isset($stmt))
        mysqli_stmt_close($stmt);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    mysqli_close($conn);
}
?>