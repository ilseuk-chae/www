<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$name = urldecode($_POST['name']);
$email = urldecode($_POST['email']);
$mobile = urldecode($_POST['mobile']);
$relationship_fg = urldecode($_POST['relationship_fg']);
$job_no_array = urldecode($_POST['jobNoArray']);
$term_fg = urldecode($_POST['term_fg']);

if (empty($job_no_array)) {
    $relationship_fg = 'N';
    // echo $relationship_fg;
}


#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $name, 'type' => 'string', 'message' => '이름을 확인해주세요.'],
    ['value' => $email, 'type' => 'email', 'message' => '이메일 주소를 확인해주세요.'],
    ['value' => $mobile, 'type' => 'phone', 'message' => '휴대폰번호를 확인해주세요.'],
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
            name = ?,
            email = ?, 
            mobile = ?, 
            relationship_fg = ?, 
            term_fg = ?,
            lst_no = ?
        WHERE user_no = ?
        ";

    // 조건 추가
    $params = [$name, $email, $mobile, $relationship_fg, $term_fg, $user_no, $user_no];
    $types = 'sssssii';
    $stmt = executeQuery($conn, $sql, $types, $params);

    // // 업데이트가 성공적으로 수행되었는지 확인
    // if (mysqli_stmt_affected_rows($stmt) === 0) {
    //     throw new Exception('NO_ROWS_UPDATED', 500);
    // }
    

    #######################################################
    # 2. 기존 직군 제거 
    $sql2 =
        "DELETE FROM relationship
        WHERE user_no = ?;
        ";

    // 조건 추가
    $params2 = [$user_no];
    $types2 = 'i';
    executeQuery($conn, $sql2, $types2, $params2);


    #######################################################
    # 3. 직군 입력  
    if (!empty($job_no_array)) {

        // 3-1.job_no_array를 쉼표로 구분된 문자열에서 배열로 변환 
        $job_no_list = explode(',', $job_no_array);

        // 3-2. 다중 행 삽입을 위한 SQL 쿼리 생성 
        $values = [];
        foreach ($job_no_list as $job_no) {
            $values[] = "($user_no, $job_no)";
        }
        $values_str = implode(',', $values);

        // 3-3. 직군 업데이트
        $sql3 =
            "INSERT INTO relationship (
                user_no, job_no
            ) VALUES 
                $values_str
            ";

        // 3-4. 쿼리 실행 실패시
        if (!mysqli_query($conn, $sql3)) {
            throw new Exception('INSERT_FAILED', 500);
        }
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