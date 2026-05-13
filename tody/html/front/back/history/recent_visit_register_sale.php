<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

$address = isset($_POST['address']) ? urldecode($_POST['address']) : null;
$lat = isset($_POST['lat']) ? urldecode($_POST['lat']) : null;
$lng = isset($_POST['lng']) ? urldecode($_POST['lng']) : null;
$pnu = isset($_POST['pnu']) ? urldecode($_POST['pnu']) : null;
$estate_no = isset($_POST['estate_no']) ? urldecode($_POST['estate_no']) : null;

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열hi
$validations = [
    ['value' => $address, 'type' => 'string', 'message' => '올바른 요청이 아닙니다.'],
    ['value' => $pnu, 'type' => 'string', 'message' => '올바른 요청이 아닙니다.'],
];
foreach ($validations as $validation) {
    $validationResult = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['value'] != $validationResult) {
        responseApi(400, $validationResult, null);
        exit;
    }
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $user_no = null;
    $userNo = $_POST['user_no'];
    if ($userNo) {
        // 회원 번호
        $user_no = get_user_no_for_hash($conn, $userNo);
    }

    // SQL 쿼리
    $sql =
        "INSERT INTO history_recent_sale (
            pnu, address_jibun, latitude, longitude, estate_no, reg_no
        ) VALUES (
            ?, ?, ?, ?, ?, ?
        ); ";

    // 조건 추가
    $params = [$pnu, $address, $lat, $lng, $estate_no, $user_no];
    $types = 'ssddii';
    executeQuery($conn, $sql, $types, $params);

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
