<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

// 에러 보고 설정
error_reporting(E_ALL);
ini_set("display_errors", 1);

include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

try {
    #######################################################
    #
    $check_period = 10; // 분 단위 (예: 10분)

    // 현재 시간으로부터 체크 기간 내의 요청 횟수 확인
    // DATE_SUB(A, INTERVAL B MINUTE) : A에서 B분을 뺀 시간
    $sql1 = 
        "SELECT role, status_code
        FROM user_master 
        WHERE user_no_hmac = ? ";

    // 조건 추가
    $params1 = [$userNo];
    $types1 = 's';
    $stmt1 = executeQuery($conn, $sql1, $types1, $params1);
    $result = mysqli_stmt_get_result($stmt1);
    $row = mysqli_fetch_assoc($result);

    if ($row['status_code'] !== '001') {
        throw new Exception('승인되지 않은 회원입니다. 관리자에게 문의해주세요.', 400);
    }
    $response_array = $row;
    #
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