<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

$user_no = urldecode($_POST['userNo']);
$password = urldecode($_POST['password']);

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $user_no, 'type' => 'string', 'message' => '정상적인 접근이 아닙니다.'],
    ['value' => $password, 'type' => 'password', 'message' => '비밀번호를 확인해주세요.'],
];

foreach ($validations as $validation) {
    $errorMessage = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['message'] == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}
#######################################################
# 0. 유효성 검사 - 끝
#######################################################


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    #######################################################
    ##################### 1. 비밀번호 변경 #####################
    // 비밀번호를 해시화합니다.
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    $sql =
        "UPDATE user_master SET
            password = ?
        WHERE user_no_hmac = ?
        AND platform = general
        ";

    // 조건 추가
    $params = [$hashed_password, $user_no];
    $types = 'ss';
    $stmt = executeQuery($conn, $sql, $types, $params);

    // 업데이트가 성공적으로 수행되었는지 확인
    if (mysqli_stmt_affected_rows($stmt) === 0) {
        throw new Exception('FAILED_TO_RESET_PASSWORD', 500);
    }

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