<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$comment_no = isset($_POST['comment_no']) ? urldecode($_POST['comment_no']) : '';

$user_no_hash = isset($_POST['user_no']) ? $_POST['user_no'] : null; // JS에서 user_no_hash를 보냈다면

##################### 0. 유효성 검사 #####################
$validations = [
    ['value' => $comment_no, 'type' => 'string', 'message' => '댓글 ID가 없습니다.', 'options' => array('min_length' => 1)],
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
    $user_no = get_user_no_for_hash($conn, $userNo);

    if (empty($user_no)) { // 사용자 번호가 유효하지 않으면 여기서 응답하고 종료
        //error_log("DEBUG: User number is empty, rejecting with 401.");
        responseApi(401, "Unauthorized: User not found.", null); // 명시적으로 401
        exit;
    }
    // 페이징 추가
    $params = [$comment_no, $user_no];
    $types = 'ii';

    ##################### 1. memo_comment 삭제 처리 #####################
    $sql_comment = 
        "DELETE FROM memo_comment
        WHERE idx = ?
        AND reg_no = ?";

    $stmt = executeQuery($conn, $sql_comment, $types, $params);

     // 5. 삭제된 행 수 확인
     $affected_rows = mysqli_stmt_affected_rows($stmt);
     //error_log("DEBUG: Affected rows by DELETE query: " . $affected_rows);
 
     if ($affected_rows === 0) {
         //error_log("DEBUG: No rows deleted, possible permission issue or comment not found.");
         // 만약 권한 때문에 삭제 안 된 것이라면 403 (Forbidden)이 더 적절
         responseApi(403, "권한이 없거나 해당 댓글을 찾을 수 없습니다.", null);
         exit;
     }
     
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