<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$email = urldecode($_POST['email']);
$mobile = urldecode($_POST['mobile']);
$phone = urldecode($_POST['phone']);
$homepage_url = urldecode($_POST['homepage_url']);
$term_fg = urldecode($_POST['term_fg']);


#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $email, 'type' => 'email', 'message' => '이메일 주소를 확인해주세요.'],
    ['value' => $mobile, 'type' => 'phone', 'message' => '휴대폰번호를 확인해주세요.'],
    ['value' => $phone, 'type' => 'phone', 'message' => '전화번호를 확인해주세요.'],
];

foreach ($validations as $validation) {
    $errorMessage = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['message'] == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}

// 이용약관 유효성 검사
$errorMessage = "이용약관에 동의해주세요.";
if ($term_fg !== 'Y') {
    responseApi(400, $errorMessage, null);
    exit;
}
#######################################################
# 0. 유효성 검사 - 끝
#######################################################


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 해시로 유저넘버 얻기
    $user_no = get_user_no_for_hash($conn, $userNo);

    #######################################################
    ##################### 1. 유저 정보 업데이트 #####################
    $sql =
        "UPDATE user_master SET
            email = ?, 
            mobile = ?, 
            phone = ?, 
            homepage_url = ?, 
            term_fg = ?,
            lst_no = ?
        WHERE user_no = ?
        ";

    // 조건 추가
    $params = [$email, $mobile, $phone, $homepage_url, $term_fg, $user_no, $user_no];
    $types = 'sssssii';
    $stmt = executeQuery($conn, $sql, $types, $params);

    // // 업데이트가 성공적으로 수행되었는지 확인
    // if (mysqli_stmt_affected_rows($stmt) === 0) {
    //     throw new Exception('NO_ROWS_UPDATED', 500);
    // }
    

    // 모든 SQL 작업이 성공적으로 완료되면 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    mysqli_rollback($conn);  // 트랜잭션 롤백

    $statusCode = $e->getCode() ? $e->getCode() : 500; // 코드가 없을 경우 500으로 설정
    responseApi($statusCode, $e->getMessage(), null);

} finally {
    // 준비된 문장 닫기
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    if (isset($stmt2)) {
        mysqli_stmt_close($stmt2);
    }
    if (isset($stmt3)) {
        mysqli_stmt_close($stmt3);
    }

    // 데이터베이스 연결 닫기
    mysqli_close($conn);
}