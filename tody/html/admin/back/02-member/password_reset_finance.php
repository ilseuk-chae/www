<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// phpinfo();

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include_once '../00-include/validation.php';

$rcvUserNo = $_POST['rcvUser'];
$id = urldecode($_POST['id']);
$password = isset($_POST['change']) ? urldecode($_POST['change']) : null;

##################### 0. 유효성 검사 #####################
// 수정할 유저 유효성 검사
$errorMessage = "문제가 발생하였습니다.";
$valid = validateInput($rcvUserNo, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// ID 유효성 검사
$errorMessage = "ID를 확인해주세요.";
$valid = validateInput($id, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    ##################### 1. 유저 정보 업데이트 #####################
    $sql1 =
        "UPDATE user_master 
        SET 
            password = ?
        WHERE SHA2(user_no, 256) = ?
        AND id = ?
        AND role = '003';
        ";

    // 1-1. SQL 문장을 준비합니다.
    $stmt1 = mysqli_prepare($conn, $sql1);

    // 1-2. SQL 준비 실패 시,
    if (!$stmt1) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 1-3. 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param(
        $stmt1,
        "sss",
        $hashed_password,
        $rcvUserNo,
        $id
    );

    // 1-4. SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt1)) {
        throw new Exception('UPDATE_FAILED', 500);
    }

    ##################### 모든 작업 성공 시 커밋 #####################
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
    if (isset($stmt1))
        mysqli_stmt_close($stmt1);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    if (isset($stmt3))
        mysqli_stmt_close($stmt3);
    mysqli_close($conn);
}
?>