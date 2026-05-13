<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

$id = isset($_POST['id']) ? urldecode($_POST['id']) : null;
$password = isset($_POST['password']) ? urldecode($_POST['password']) : null;
$name = isset($_POST['name']) ? urldecode($_POST['name']) : null;
$email = isset($_POST['email']) ? urldecode($_POST['email']) : null;
$mobile = isset($_POST['mobile']) ? urldecode($_POST['mobile']) : null;
$relationship_fg = isset($_POST['relationship_fg']) ? urldecode($_POST['relationship_fg']) : 'N';
$job_no_array = isset($_POST['jobNoArray']) ? urldecode($_POST['jobNoArray']) : null;
$event_rcv_fg = isset($_POST['event_rcv_fg']) ? urldecode($_POST['event_rcv_fg']) : 'N';
$term_fg = isset($_POST['term_fg']) ? urldecode($_POST['term_fg']) : 'N';

if (empty($job_no_array)) {
    $relationship_fg = 'N';
}

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $id, 'type' => 'id', 'message' => '아이디를 확인해주세요.'],
    ['value' => $password, 'type' => 'password', 'message' => '비밀번호를 확인해주세요.'],
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
if ($term_fg !== 'Y') {
    responseApi(400, "이용약관에 동의해주세요.", null);
    exit;
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $sql0 = "SELECT email FROM user_master WHERE email = ? ";
    $params0 = [$email];
    $types0 = 's';
    $stmt0 = executeQuery($conn, $sql0, $types0, $params0);
    $result0 = mysqli_stmt_get_result($stmt0);
    $row = mysqli_fetch_assoc($result0);

    if (!empty($row) && !empty($row['email'])) {
        throw new Exception('존재하는 이메일 주소입니다.', 400);
    }
    
    #######################################################
    # 1. 유저 정보 등록 
    #######################################################
    // 비밀번호를 해시화합니다.
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    $sql =
        "INSERT INTO user_master (
            role, platform, id, password, 
            name, email, mobile, relationship_fg, 
            event_rcv_fg, term_fg, status_code
        ) VALUES (
            '001', 'general', ?, ?, 
            ?, ?, ?, ?, 
            ?, ?, '001'
        )
        ";
        
    $params = [$id, $hashed_password, $name, $email, $mobile, $relationship_fg, $event_rcv_fg, $term_fg];
    $types = 'ssssssss';
    executeQuery($conn, $sql, $types, $params);

    // 새로 생성된 primary key 가져오기
    $user_no = mysqli_insert_id($conn);
    if (!$user_no) {
        throw new Exception('FAILED_TO_RETRIEVE_INSERT_ID', 500);
    }


    #######################################################
    # 2. 유저넘버 hmac 업데이트 
    #######################################################
    // HMAC(SHA-256) hash key 생성
    $secretKey = 'tody2024';
    $hashed_user_no = hash_hmac('sha256', $user_no, $secretKey);

    $sql2 =
        "UPDATE user_master 
        SET user_no_hmac = ?
        WHERE user_no = ? ;";

    $params2 = [$hashed_user_no, $user_no];
    executeQuery($conn, $sql2, 'ss', $params2);


    #######################################################
    # 3. 직군 입력  
    #######################################################
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
    
    #######################################################
    # 4. 알림 설정 등록
    #######################################################
    $sql4 = "INSERT INTO user_notification_preferences (user_no, type_name, active_fg) VALUES (?, 'event', ?)";
    executeQuery($conn, $sql4, 'is', [$user_no, $event_rcv_fg]);
   

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
    if (isset($stmt4)) {
        mysqli_stmt_close($stmt4);
    }

    // 데이터베이스 연결 닫기
    mysqli_close($conn);
}