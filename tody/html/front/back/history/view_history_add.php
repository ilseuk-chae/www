<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$viewNo = isset($_POST['viewNo']) ? urldecode($_POST['viewNo']) : '';
$type = isset($_POST['type']) ? urldecode($_POST['type']) : '';

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
$validations = [
    ['value' => $viewNo, 'type' => 'int', 'message' => '게시글 번호를 확인해주세요.']
];

foreach ($validations as $validation) {
    $errorMessage = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['message'] == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}

mysqli_autocommit($conn, FALSE);
mysqli_begin_transaction($conn);

try {
    $user_no = get_user_no_for_hash($conn, $userNo);

    # 중복 확인 (user_no + view_type + board_no)
    $sql_chk = "SELECT idx FROM history_recent_view
                WHERE user_no = ? AND view_type = ? AND board_no = ? LIMIT 1";
    $stmt_chk = executeQuery($conn, $sql_chk, 'isi', [$user_no, $type, $viewNo]);
    $row_chk  = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt_chk));

    if ($row_chk) {
        # 이미 존재 → 날짜만 업데이트
        $sql = "UPDATE history_recent_view SET reg_date = NOW() WHERE idx = ?";
        executeQuery($conn, $sql, 'i', [$row_chk['idx']]);
    } else {
        # 신규 등록
        $sql = "INSERT INTO history_recent_view (user_no, view_type, board_no) VALUES (?, ?, ?)";
        executeQuery($conn, $sql, 'isi', [$user_no, $type, $viewNo]);
    }

    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    mysqli_rollback($conn);
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    if (isset($stmt_chk)) mysqli_stmt_close($stmt_chk);
    if (isset($stmt))     mysqli_stmt_close($stmt);
    mysqli_close($conn);
}
?>
