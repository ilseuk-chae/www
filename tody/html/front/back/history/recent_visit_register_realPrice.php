<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

$address = isset($_POST['address']) ? urldecode($_POST['address']) : null;
$lat = isset($_POST['lat']) ? urldecode($_POST['lat']) : null;
$lng = isset($_POST['lng']) ? urldecode($_POST['lng']) : null;
$pnu = isset($_POST['pnu']) ? urldecode($_POST['pnu']) : null;

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
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

mysqli_autocommit($conn, FALSE);
mysqli_begin_transaction($conn);

try {
    $user_no = null;
    $userNo = $_POST['user_no'];
    if ($userNo) {
        $user_no = get_user_no_for_hash($conn, $userNo);
    }

    # 중복 확인 (로그인 유저: reg_no+pnu, 비로그인: pnu만)
    if ($user_no) {
        $sql_chk = "SELECT idx FROM history_recent_realPrice
                    WHERE reg_no = ? AND pnu = ? LIMIT 1";
        $stmt_chk = executeQuery($conn, $sql_chk, 'is', [$user_no, $pnu]);
    } else {
        $sql_chk = "SELECT idx FROM history_recent_realPrice
                    WHERE reg_no IS NULL AND pnu = ? LIMIT 1";
        $stmt_chk = executeQuery($conn, $sql_chk, 's', [$pnu]);
    }
    $row_chk = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt_chk));

    if ($row_chk) {
        # 이미 존재 → 날짜만 업데이트
        $sql = "UPDATE history_recent_realPrice SET reg_date = NOW(), address_jibun = ?, latitude = ?, longitude = ?
                WHERE idx = ?";
        executeQuery($conn, $sql, 'sddi', [$address, $lat, $lng, $row_chk['idx']]);
    } else {
        # 신규 등록
        $sql = "INSERT INTO history_recent_realPrice (pnu, address_jibun, latitude, longitude, reg_no)
                VALUES (?, ?, ?, ?, ?)";
        executeQuery($conn, $sql, 'ssddi', [$pnu, $address, $lat, $lng, $user_no]);
    }

    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    mysqli_rollback($conn);
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    if (isset($stmt_chk)) mysqli_stmt_close($stmt_chk);
    if (isset($stmt))     mysqli_stmt_close($stmt);
    mysqli_close($conn);
}
