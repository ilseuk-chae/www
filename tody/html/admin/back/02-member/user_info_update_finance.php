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
$rcvUserNo = $_POST['rcvUser'];
$id = urldecode($_POST['id']);
$name = urldecode($_POST['name']);
$mobile = urldecode($_POST['mobile']);
$email = urldecode($_POST['email']);
$status_code = urldecode($_POST['status_code']);
$company_select = urldecode($_POST['company_select']);
$branch_select = urldecode($_POST['branch_select']);

##################### 0. 유효성 검사 #####################
// 수정할 유저 유효성 검사
$errorMessage = "문제가 발생하였습니다.";
$valid = validateInput($rcvUserNo, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 금융사 유효성 검사
$errorMessage = "금융사를 확인해주세요.";
$valid = validateInput($company_select, 'int', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 영업점 유효성 검사
$errorMessage = "영업점을 확인해주세요.";
$valid = validateInput($branch_select, 'int', $errorMessage, array());
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
// 담당자 이름 유효성 검사
$errorMessage = "담당자 이름을 입력하세요.";
$valid = validateInput($name, 'string', $errorMessage, array());
if ($valid == $errorMessage && $name) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 휴대폰번호 유효성 검사
$errorMessage = "휴대폰번호를 확인해주세요.";
$valid = validateInput($mobile, 'phone', $errorMessage, array());
if ($valid == $errorMessage && $mobile) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 이메일 유효성 검사
$errorMessage = "이메일 주소를 확인해주세요.";
$valid = validateInput($email, 'email', $errorMessage, array());
if ($valid == $errorMessage && $email) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 상태 유효성 검사
$errorMessage = "상태를 확인해주세요.";
$valid = validateInput($status_code, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {

    #######################################################
    # 0-2. 이메일 확인
    #######################################################
    $checkSql = "SELECT COUNT(*) FROM user_master WHERE email = ?";
    $checkStmt = mysqli_prepare($conn, $checkSql);

    if (!$checkStmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 중복 아이디 체크를 위한 파라미터 바인딩
    mysqli_stmt_bind_param($checkStmt, 's', $email);
    mysqli_stmt_execute($checkStmt);
    mysqli_stmt_bind_result($checkStmt, $count);
    mysqli_stmt_fetch($checkStmt);
    mysqli_stmt_close($checkStmt);

    // 중복 아이디가 있는 경우
    if ($count > 0) {
        throw new Exception('이미 사용 중인 이메일입니다.', 409);
    }


    ##################### 1. 유저 정보 업데이트 #####################
    $sql1 =
        "UPDATE user_master 
        SET 
            name = ?, 
            mobile = ?,
            email = ?,
            status_code = ?
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
        "ssssss",
        $name,
        $mobile,
        $email,
        $status_code,
        $rcvUserNo,
        $id
    );

    // 1-4. SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt1)) {
        throw new Exception('UPDATE_FAILED', 500);
    }


    ##################### 2. 유저 no 가져오기 #####################
    $userNo = get_user_no_for_hash($conn, $rcvUserNo);


    ##################### 0. 기존 영업점 담당자 수정 #####################
    $sql =
        "UPDATE finance_branches 
        SET 
            manager_no = null
        WHERE manager_no = ?;
        ";

    // 0-1. SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // 0-2. SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 0-3. 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param(
        $stmt,
        "i",
        $userNo
    );

    // 0-4. SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('UPDATE_FAILED', 500);
    }


    ##################### 3. 영업점 담당자 수정 #####################
    $sql2 =
        "UPDATE finance_branches 
        SET 
            manager_no = ?
        WHERE finance_company_idx = ?
        AND idx = ?;
        ";

    // 3-1. SQL 문장을 준비합니다.
    $stmt2 = mysqli_prepare($conn, $sql2);

    // 3-2. SQL 준비 실패 시,
    if (!$stmt2) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 3-3. 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param(
        $stmt2,
        "iii",
        $userNo,
        $company_select,
        $branch_select
    );

    // 3-4. SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt2)) {
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