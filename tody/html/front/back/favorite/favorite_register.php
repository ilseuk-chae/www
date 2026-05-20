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
    ['value' => $viewNo, 'type' => 'int', 'message' => '올바른 요청이 아닙니다.'],
    ['value' => $type, 'type' => 'string', 'message' => '올바른 요청이 아닙니다.']
];
foreach ($validations as $validation) {
    $validationResult = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['value'] != $validationResult) {
        responseApi(400, $validationResult, null);
        exit;
    }
}


mysqli_autocommit($conn, FALSE);
mysqli_begin_transaction($conn);

try {
    $user_no = get_user_no_for_hash($conn, $userNo);

    # 중복 확인 (user_no + board_no + favorite_type)
    $sql_chk = "SELECT idx FROM history_favorite
                WHERE user_no = ? AND board_no = ? AND favorite_type = ? LIMIT 1";
    $stmt_chk = executeQuery($conn, $sql_chk, 'iis', [$user_no, $viewNo, $type]);
    $row_chk  = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt_chk));

    if ($row_chk) {
        # 이미 존재 → 날짜만 업데이트
        $sql = "UPDATE history_favorite SET reg_date = NOW() WHERE idx = ?";
        executeQuery($conn, $sql, 'i', [$row_chk['idx']]);
    } else {
        # 신규 등록
        $sql = "INSERT INTO history_favorite (favorite_type, user_no, board_no) VALUES (?, ?, ?)";
        executeQuery($conn, $sql, 'sii', [$type, $user_no, $viewNo]);
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
