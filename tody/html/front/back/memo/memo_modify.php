<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$memo_no = isset($_POST['memoNo']) ? urldecode($_POST['memoNo']) : null;
$name = isset($_POST['name']) ? urldecode($_POST['name']) : null;
$phone = isset($_POST['phone']) ? urldecode($_POST['phone']) : null;
$estate_no = isset($_POST['estateNo']) ? urldecode($_POST['estateNo']) : null;
$content = isset($_POST['content']) ? urldecode($_POST['content']) : null;


#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $memo_no, 'type' => 'int', 'message' => '올바른 요청이 아닙니다.', 'options' => array('min' => 0, 'max' => 999999)],
    ['value' => $name, 'type' => 'string', 'message' => '이름이 50자 이내인지 확인해주세요.', 'options' => array('max' => 50)],
    ['value' => $phone, 'type' => 'phone', 'message' => '연락처를 확인해주세요.', 'options' => array()],
    ['value' => $estate_no, 'type' => 'int', 'message' => '매물번호를 확인해주세요.', 'options' => array()],
];
foreach ($validations as $validation) {
    $validationResult = validateInput($validation['value'], $validation['type'], $validation['message'], $validation['options']);
    if ($validation['message'] == $validationResult) {
        responseApi(400, $validationResult, null);
        exit;
    }
}


// 은행명 유효성 검사
$errorMessage = "메모 내용이 255자 이내인지 확인해주세요.";
if ($content) {
    $valid = validateInput($content, 'string', $errorMessage, array('max' => 255));
    if ($valid == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 매물 존재 유무 확인
    $sql = 
        "SELECT * FROM estate_listings WHERE idx = ? AND public_fg = 'Y' AND active_fg = 'Y' ";
    $stmt = executeQuery($conn, $sql, 'i', [$estate_no]);
    $result = mysqli_stmt_get_result($stmt);
    if (!$row = mysqli_fetch_assoc($result)) {
        // 값이 없을 때의 처리 (예: 에러 메시지와 함께 종료)
        responseApi(404, "확인되지 않는 매물번호입니다.", null);
        exit;
    }

    // 회원 번호
    $user_no = get_user_no_for_hash($conn, $userNo);

    // SQL 쿼리
    $sql =
        "UPDATE memo_listings SET
            name = ?,
            phone = ?,
            estate_no = ?,
            content = ?
        WHERE idx = ? ";

    // 조건 추가
    $params = [$name, $phone, $estate_no, $content, $memo_no];
    $types = 'ssisi';
    executeQuery($conn, $sql, $types, $params);

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
    responseApi($e->getCode(), "처리 중 문제가 발생했습니다.", $e->getMessage());

} finally {
    // 연결 종료
    if (isset($stmt))
        mysqli_stmt_close($stmt);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    if (isset($stmt3))
        mysqli_stmt_close($stmt3);
    mysqli_close($conn);
}
