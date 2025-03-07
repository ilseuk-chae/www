<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 해시로 유저넘버 얻기
    $user_no = get_user_no_for_hash($conn, $userNo);

    ##################### 1. 유저 정보 가져오기 #####################
    $sql =
        "SELECT 
            a.id, 
            a.agency_name, 
            a.registered_broker_name, 
            a.zipcode, 
            a.address_primary, 
            a.address_detail, 
            a.name, 
            a.email, 
            a.phone,
            a.mobile,
            a.homepage_url,
            a.business_regist_code,
            a.brokerage_cert_name,
            a.brokerage_cert_url,
            a.business_license_code,
            a.business_license_name,
            a.business_license_url,
            a.event_rcv_fg,
            a.term_fg,
            a.role
        FROM user_master AS a

        WHERE a.user_no = ?
        ";

        
    // 조건 추가
    $params = [$user_no];
    $types = 'i';
    $stmt = executeQuery($conn, $sql, $types, $params);

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $response_data = $row;
    }

    // 데이터가 없을 경우
    if (empty($response_data)) {
        throw new Exception('NO_DATA', 404);
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $response_data);

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
