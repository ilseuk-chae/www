<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$memo_no = isset($_POST['memo_idx']) ? $_POST['memo_idx'] : null; // JS에서 memo_idx로 보냄

##################### 0. 유효성 검사 #####################
#######################################################
# 0. 유효성 검사
#######################################################
$validations = [
    ['value' => $memo_no, 'type' => 'string', 'message' => '삭제할 메모 ID가 없습니다.', 'options' => ['min_length' => 1]],
];
foreach ($validations as $validation) {
    $validationResult = validateInput($validation['value'], $validation['type'], $validation['message'], $validation['options']);
    if ($validation['message'] == $validationResult) {
        responseApi(400, $validationResult, null);
        exit;
    }
}

mysqli_autocommit($conn, FALSE);
mysqli_begin_transaction($conn);

try {
    // 1. 메모 소유권 확인 (옵션: 현재 로그인한 사용자가 해당 메모의 소유자인지 확인)
    $user_no = get_user_no_for_hash($conn, $userNo); // authChk.php에서 설정된 userNo 사용
    
    $sql_check_owner = "SELECT idx FROM memo2_listings WHERE idx = ? AND reg_no = ?";
    $stmt_check_owner = executeQuery($conn, $sql_check_owner, 'ii', [$memo_no, $user_no]);
    $result_check_owner = mysqli_stmt_get_result($stmt_check_owner);
    if (!mysqli_fetch_assoc($result_check_owner)) {
        responseApi(403, "권한이 없거나 존재하지 않는 메모입니다.", null); // 403 Forbidden
        if (isset($stmt_check_owner)) mysqli_stmt_close($stmt_check_owner);
        exit;
    }
    if (isset($stmt_check_owner)) mysqli_stmt_close($stmt_check_owner);


    // 2. 메모 삭제
    $sql_delete_memo = "DELETE FROM memo2_listings WHERE idx = ?";
    $stmt_delete_memo = executeQuery($conn, $sql_delete_memo, 'i', [$memo_no]);
    // mysqli_stmt_affected_rows($stmt_delete_memo)를 통해 실제로 삭제된 행 수를 확인할 수 있습니다.

    // 3. 해당 메모의 댓글 삭제 (외래키 제약조건으로 ON DELETE CASCADE 설정되어 있지 않다면 필요)
    $sql_delete_comments = "DELETE FROM memo_comment WHERE memo_no = ?";
    $stmt_delete_comments = executeQuery($conn, $sql_delete_comments, 'i', [$memo_no]);

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
    responseApi(500, "메모 삭제 중 문제가 발생했습니다.", $e->getMessage());

} finally {
    // 연결 종료
    if (isset($stmt_delete_memo)) mysqli_stmt_close($stmt_delete_memo);
    if (isset($stmt_delete_comments)) mysqli_stmt_close($stmt_delete_comments);
    mysqli_close($conn);
}
?>