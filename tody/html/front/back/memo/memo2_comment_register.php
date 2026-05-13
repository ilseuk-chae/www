<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$memo_no = isset($_POST['memo_no']) ? $_POST['memo_no'] : null;
$comment = isset($_POST['comment']) ? urldecode($_POST['comment']) : null;

// user 정보도 여기서 어떻게 받는지 확인 (e.g., $userNo from authChk.php)
$user_no_hash = isset($_POST['user_no']) ? $_POST['user_no'] : null; // JS에서 user_no_hash를 보냈다면
// $user_token_hash = isset($_POST['user_token']) ? $_POST['user_token'] : null; // JS에서 user_token_hash를 보냈다면

######################################################
# 0. 유효성 검사 - 시작
#######################################################

$validations = [
    // ⭐⭐⭐ 여기가 수정됩니다! ⭐⭐⭐
    ['value' => $memo_no, 'type' => 'string', 'message' => '메모 ID가 없습니다.', 'options' => array('min_length' => 1)],
    ['value' => $comment, 'type' => 'string', 'message' => '댓글이 50자 이내인지 확인해주세요.', 'options' => array('min' => 1, 'max' => 50)],
];

foreach ($validations as $validation) {
    $validationResult = validateInput($validation['value'], $validation['type'], $validation['message'], $validation['options']);
    if ($validation['message'] == $validationResult) {
        responseApi(400, $validationResult, null);
        exit;
    }
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 메모 존재 유무 확인
    $sql = 
        "SELECT * FROM memo2_listings WHERE idx = ? ";
    $stmt = executeQuery($conn, $sql, 'i', [$memo_no]);
    $result = mysqli_stmt_get_result($stmt);
    if (!$row = mysqli_fetch_assoc($result)) {
        // 값이 없을 때의 처리 (예: 에러 메시지와 함께 종료)
        responseApi(404, "확인되지 않는 메모입니다.", null);
        exit;
    }

    // 회원 번호
    $user_no = get_user_no_for_hash($conn, $userNo);

    // SQL 쿼리
    $sql =
        "INSERT INTO memo_comment (
            memo_no, comment, reg_no
        ) VALUES (
            ?, ?, ?
        ); ";

    // 조건 추가
    $params = [$memo_no, $comment, $user_no];
    $types = 'isi';
    executeQuery($conn, $sql, $types, $params);

    // 마지막으로 삽입된 ID 가져오기
    $inserted_id = mysqli_insert_id($conn);

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', ['comment_no' => $inserted_id]);

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
