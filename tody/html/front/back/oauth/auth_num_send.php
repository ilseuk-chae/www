<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

// 에러 보고 설정
// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/mailSend.php');

try {
    #######################################################
    # 0. 유효성 검사 - 시작
    #
    $email = isset($_POST['email']) ? urldecode($_POST['email']) : '';
    $email = filter_var($email, FILTER_VALIDATE_EMAIL);

    // 유효하지 않은 이메일 주소
    if ($email === false) {
        throw new Exception('VALIDATION_ERROR', 400);
    }
    #
    # 0. 유효성 검사 - 종료
    #######################################################

    #######################################################
    # 0. 이메일 유무 확인 - 시작
    #
    $select_sql = 
    "SELECT email FROM user_master WHERE email = ?";
    $select_stmt = executeQuery($conn, $select_sql, 's', [$email]);
    $select_result = mysqli_stmt_get_result($select_stmt);

    // 유효하지 않은 이메일 주소
    if (!$select_result || mysqli_num_rows($select_result) === 0) {
        throw new Exception('가입되지 않은 이메일 주소입니다', 400);
    }
    #
    # 0. 이메일 유무 확인 - 종료
    #######################################################

    #######################################################
    # 1. 반복요청 검사 - 시작
    #
    // 요청 간격을 분 단위로 설정 (예: 10분)
    $request_interval = 10;

    // 반복 요청 제한 횟수 및 기간 설정 (예: 10분 내에 5번)
    $max_requests = 5;
    $check_period = 10; // 분 단위 (예: 10분)

    // 현재 시간으로부터 체크 기간 내의 요청 횟수 확인
    // DATE_SUB(A, INTERVAL B MINUTE) : A에서 B분을 뺀 시간
    $sql1 = 
        "SELECT COUNT(*) as request_count 
        FROM user_certify 
        WHERE user_email = ? 
        AND reg_date >= DATE_SUB(NOW(), INTERVAL ? MINUTE)";

    // 조건 추가
    $params1 = [$email, $check_period];
    $types1 = 'si';
    $stmt1 = executeQuery($conn, $sql1, $types1, $params1);
    $result = mysqli_stmt_get_result($stmt1);
    $request_count = mysqli_fetch_assoc($result)['request_count'];

    // 요청 횟수 확인
    if ($request_count >= $max_requests) {
        throw new Exception('TOO_MANY_REQUESTS', 429);
    }

    // // 마지막 요청 시간 확인
    // $sql2 = 
    //     "SELECT reg_date 
    //     FROM user_certify 
    //     WHERE user_email = ? 
    //     ORDER BY reg_date DESC 
    //     LIMIT 1";

    // // 조건 추가
    // $params2 = [$email];
    // $types2 = 's';
    // $stmt2 = executeQuery($conn, $sql2, $types2, $params2);
    // $result = mysqli_stmt_get_result($stmt2);
    // $last_request_time = mysqli_fetch_assoc($result)['reg_date'];

    // // 인증번호 기록이 있다면
    // if ($last_request_time) {
    //     // 현재시간
    //     $current_time = new DateTime();
    //     // 마지막 인증요청 시간
    //     $last_request_time = new DateTime($last_request_time);
    //     // 두 객체의 시간 차이 계산
    //     $interval = $last_request_time->diff($current_time);

    //     // 두 객체의 시간 차이 검토
    //     $elapsed_minutes = ($interval->days * 24 * 60) + ($interval->h * 60) + $interval->i;
        
    //     // 마지막 요청 시간과 현재 시간의 시간 차이가 설정된 간격보다 작은지 확인
    //     if ($elapsed_minutes < $request_interval) {
    //         // 정해진 시간보다 작다면(짧은 시간 안에 반복 요청이라면) 중지
    //         throw new Exception('TOO_MANY_REQUESTS', 429);
    //     }
    // }
    #
    # 1. 반복요청 검사 - 종료
    #######################################################

    #######################################################
    # 3. 인증번호 저장 - 시작
    #
    // 6자리 랜덤 숫자 생성
    try {
        $authCode = random_int(100000, 999999);
    } catch (Exception $e) {
        throw new Exception('CODE_GENERATION_ERROR', 500);
    }

    $sql3 = 
        "INSERT INTO user_certify (
            user_email, 
            auth_code, 
            type
        ) VALUES ( 
            ?, 
            ?, 
            'ID'
        ); ";

    // 조건 추가
    $params3 = [$email, $authCode];
    $types3 = 'ss';
    $stmt3 = executeQuery($conn, $sql3, $types3, $params3);
    $certifyNo = mysqli_insert_id($conn);
    
    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    #
    # 3. 인증번호 저장 - 종료
    #######################################################

    #######################################################
    # 4. 이메일 발송 - 시작
    #
    $subject = '[토디] 인증번호 발송 안내';
    $content = '인증번호 : ' . $authCode;

    $result_mail_customer = sendMail($email, $subject, $content);

    // 로그 기록 (선택 사항)
    $log = date('Y-m-d H:i:s') . " - Email sent to: " . $email . " - Result: " . ($result_mail_customer == 'SUCCESS' ? 'Success' : 'Failed') . "\n";
    file_put_contents($_SERVER['DOCUMENT_ROOT'] . '/../logs/email_log.txt', $log, FILE_APPEND);

    $email_fg = strtolower($result_mail_customer) === 'success' ? 'Y' : 'N';

    $sql4 = 
        "UPDATE user_certify SET
            send_fg = ?
        WHERE idx = ?; ";

    // 조건 추가
    $params4 = [$email_fg, $certifyNo];
    $types4 = 'si';
    $stmt4 = executeQuery($conn, $sql4, $types4, $params4);
    #
    # 4. 이메일 발송 - 종료
    #######################################################

    if ($email_fg === 'Y') {
        responseApi(200, 'SUCCESS', null);
    } else {
        throw new Exception('FAILED', 500);
    }


} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
    // responseApi($e->getCode(), $e->getMessage(), null);
    responseApi($e->getCode(), 'An error occurred', null);
} finally {
    // 연결 종료
    if (isset($stmt1))
        mysqli_stmt_close($stmt1);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    if (isset($stmt3))
        mysqli_stmt_close($stmt3);
    if (isset($stmt4))
        mysqli_stmt_close($stmt4);
    mysqli_close($conn);
}
?>