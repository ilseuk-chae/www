<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

// 에러 보고 설정
error_reporting(E_ALL);
ini_set("display_errors", 1);

include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

try {
    #######################################################
    # 0. 유효성 검사 - 시작
    #
    $email = isset($_POST['email']) ? urldecode($_POST['email']) : '';
    $email = filter_var($email, FILTER_VALIDATE_EMAIL);
    $authCode = isset($_POST['authCode']) ? urldecode($_POST['authCode']) : '';

    // 유효하지 않은 이메일 주소 또는 인증 코드가 없는 경우
    if (!$authCode || $email === false) {
        throw new Exception('VALIDATION_ERROR', 400);
    }
    #
    # 0. 유효성 검사 - 종료
    #######################################################

    #######################################################
    # 1. 인증번호 검사 - 시작
    #
    $check_period = 10; // 분 단위 (예: 10분)

    // 현재 시간으로부터 체크 기간 내의 요청 횟수 확인
    // DATE_SUB(A, INTERVAL B MINUTE) : A에서 B분을 뺀 시간
    $sql1 = 
        "SELECT idx
        FROM user_certify 
        WHERE user_email = ? 
        AND auth_code = ?
        AND reg_date >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
        ORDER BY idx DESC
        LIMIT 1";

    // 조건 추가
    $params1 = [$email, $authCode, $check_period];
    $types1 = 'ssi';
    $stmt1 = executeQuery($conn, $sql1, $types1, $params1);
    $result = mysqli_stmt_get_result($stmt1);
    $row = mysqli_fetch_assoc($result);
    #
    # 1. 인증번호 검사 - 종료
    #######################################################

    #######################################################
    # 2. 인증 완료 업데이트 - 시작
    #
    if ($row && $row['idx']) {
        $sql2 = 
            "UPDATE user_certify SET
                check_fg = 'Y'
            WHERE idx = ? ";

        // 조건 추가
        $params2 = [$row['idx']];
        $types2 = 'i';
        $stmt2 = executeQuery($conn, $sql2, $types2, $params2);
    } else {
        throw new Exception('AUTH_CODE_ERROR', 400);
    }
    #
    # 2. 인증 완료 업데이트 - 종료
    #######################################################
    
    #######################################################
    # 2. 인증 완료 업데이트 - 시작
    #
    $sql3 = 
        "SELECT id, platform, user_no_hmac AS user_no
        FROM user_master
        WHERE email = ? ";

    // 조건 추가
    $params3 = [$email];
    $types3 = 's';
    $stmt3 = executeQuery($conn, $sql3, $types3, $params3);
    $result3 = mysqli_stmt_get_result($stmt3);
    while($row3 = mysqli_fetch_assoc($result3)) {
        $response_array[] = $row3;
    };
    # 2. 인증 완료 업데이트 - 종료
    #######################################################


    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $response_array);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
    responseApi($e->getCode(), $e->getMessage(), null);

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