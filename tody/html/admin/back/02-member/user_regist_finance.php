<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// phpinfo();

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include_once '../00-include/validation.php';

$lang = $_POST['langCode'];
$id = urldecode($_POST['id']);
$c_no = urldecode($_POST['c_no']);
$b_no = urldecode($_POST['b_no']);
$name = urldecode($_POST['name']);
$mobile = urldecode($_POST['mobile']);
$email = urldecode($_POST['email']);


#######################################################
# 0-1. 유효성 검사
#######################################################
// ID 유효성 검사
$errorMessage = "ID를 확인해주세요.";
$valid = validateInput($id, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 은행 유효성 검사
$errorMessage = "금융사를 확인해주세요.";
$valid = validateInput($c_no, 'int', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 영업점 유효성 검사
$errorMessage = "영업점을 확인해주세요.";
$valid = validateInput($b_no, 'int', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 담당자 이름 유효성 검사
$errorMessage = "담당자 이름을 확인해주세요.";
$valid = validateInput($name, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 휴대폰번호 유효성 검사
$errorMessage = "휴대폰번호를 확인해주세요.";
$valid = validateInput($mobile, 'phone', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 휴대폰번호 유효성 검사
$errorMessage = "이메일을 확인해주세요.";
$valid = validateInput($email, 'email', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    #######################################################
    # 0-2. 아이디, 이메일 확인
    #######################################################
    $checkSql = "SELECT COUNT(*) FROM user_master WHERE id = ? OR email = ?";
    $checkStmt = mysqli_prepare($conn, $checkSql);

    if (!$checkStmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 중복 아이디 체크를 위한 파라미터 바인딩
    mysqli_stmt_bind_param($checkStmt, 'ss', $id, $email);
    mysqli_stmt_execute($checkStmt);
    mysqli_stmt_bind_result($checkStmt, $count);
    mysqli_stmt_fetch($checkStmt);
    mysqli_stmt_close($checkStmt);

    // 중복 아이디가 있는 경우
    if ($count > 0) {
        throw new Exception('이미 사용 중인 아이디 또는 이메일입니다.', 409);
    }


    #######################################################
    # 1. 유저 등록
    #######################################################
    $sql =
        "INSERT INTO user_master (
            role, id, name, mobile, status_code
        ) VALUES (
            '003', ?, ?, ?, '002'
        )";

    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    mysqli_stmt_bind_param($stmt, "sss", $id, $name, $mobile);
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('UPDATE_FAILED', 500);
    }

    // 성공한 row의 primary key 값을 가져옵니다.
    $insertedId = mysqli_insert_id($conn);

    
    #######################################################
    # 2. 영업점 담당자 업데이트
    #######################################################
    $sql2 =
        "UPDATE finance_branches SET
            manager_no = ?
        WHERE finance_company_idx = ?
        AND idx = ?;";

    $stmt2 = mysqli_prepare($conn, $sql2);
    if (!$stmt2) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    mysqli_stmt_bind_param($stmt2, "iii", $insertedId, $c_no, $b_no);
    if (!mysqli_stmt_execute($stmt2)) {
        throw new Exception('UPDATE_FAILED', 500);
    }

    
    #######################################################
    # 3. 알림 설정 등록
    #######################################################
    $sql3 = "INSERT INTO user_notification_preferences (user_no, type_name, active_fg) VALUES (?, 'event', 'Y'), (?, 'finance', 'Y')";

    $stmt3 = mysqli_prepare($conn, $sql3);
    if (!$stmt3) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    mysqli_stmt_bind_param($stmt3, "ii", $insertedId, $insertedId);
    if (!mysqli_stmt_execute($stmt3)) {
        throw new Exception('INSERT_FAILED', 500);
    }

    // 모든 작업 성공 시 커밋
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
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    if (isset($stmt3))
        mysqli_stmt_close($stmt3);
    mysqli_close($conn);
}
?>