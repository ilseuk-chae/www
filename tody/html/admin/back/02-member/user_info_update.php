<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include_once '../00-include/validation.php';

$lang = $_POST['langCode'];
$rcvUserNo = $_POST['rcvUser'];
$id = urldecode($_POST['id']);
$name = urldecode($_POST['name']);
$email = urldecode($_POST['email']);
$relationship = urldecode($_POST['relationship']);
$status_code = urldecode($_POST['status_code']);
$job_no_array = urldecode($_POST['jobNoArray']);

##################### 0. 유효성 검사 #####################
// 이메일 유효성 검사
$errorMessage = "이름을 입력하세요.";
$valid = validateInput($name, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 이메일 유효성 검사
$errorMessage = "올바른 이메일 주소를 입력하세요.";
$valid = validateInput($email, 'email', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 직군 유효성 검사
$errorMessage = "상태값을 입력하세요.";
$valid = validateInput($status_code, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    ##################### 1. 유저 정보 업데이트 #####################
    $sql =
        "UPDATE user_master 
        SET 
            name = ?, 
            email = ?, 
            relationship_fg = ?,
            status_code = ?,
            lst_no = ?
        WHERE SHA2(user_no, 256) = ?
        AND id = ?;
        ";

    // 1-1. SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // 1-2. SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 1-3. 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, "ssssiss", $name, $email, $relationship, $status_code, $saNo, $rcvUserNo, $id);

    // 1-4. SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('UPDATE_FAILED', 500);
    }

    ##################### 2. user_no 가져오기 #####################
    $user_no = get_user_no_for_hash($conn, $rcvUserNo);

    ##################### 3. 기존 직군 제거 #####################
    $sql3 =
        "DELETE FROM relationship
        WHERE SHA2(user_no, 256) = ?;
        ";

    // 바인딩할 변수들
    $params = array($rcvUserNo);
    // 실제 실행될 쿼리문
    $bound_query = get_bound_query($sql3, $params);
    // 로그 출력 (이 부분은 실제 코드에서는 로그 파일에 기록하거나 디버깅 콘솔에 출력)
    // echo ($bound_query);
    // exit;

    // 3-1. SQL 문장을 준비합니다.
    $stmt3 = mysqli_prepare($conn, $sql3);

    // 3-2. 변수 바인딩
    mysqli_stmt_bind_param($stmt3, "i", $rcvUserNo);

    // 3-3. SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt3)) {
        throw new Exception('DELETE_FAILED', 500);
    }

    ##################### 4. 직군 입력  #####################
    if (!empty($job_no_array)) {
        // 4-1.job_no_array를 쉼표로 구분된 문자열에서 배열로 변환 
        $job_no_list = explode(',', $job_no_array);

        // 4-2. 다중 행 삽입을 위한 SQL 쿼리 생성 
        $values = [];
        foreach ($job_no_list as $job_no) {
            $values[] = "($user_no, $job_no)";
        }
        $values_str = implode(',', $values);

        // 4-3. 직군 업데이트
        $sql4 =
            "INSERT INTO relationship (user_no, job_no)
            VALUES $values_str";

        // 4-4. 쿼리 실행 실패시
        if (!mysqli_query($conn, $sql4)) {
            throw new Exception('INSERT_FAILED', 500);
        }
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