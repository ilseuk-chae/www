<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$address = isset($_POST['address']) ? urldecode($_POST['address']) : '';
$lat = isset($_POST['lat']) ? urldecode($_POST['lat']) : null;
$lng = isset($_POST['lng']) ? urldecode($_POST['lng']) : null;
$type = isset($_POST['type']) ? urldecode($_POST['type']) : 'real';


#######################################################
# 0. 유효성 검사 - 시작
#######################################################
$validations = [
    ['value' => $address, 'type' => 'string', 'message' => '올바른 요청이 아닙니다.'],
    ['value' => $lat, 'type' => 'float', 'message' => '올바른 요청이 아닙니다.'],
    ['value' => $lng, 'type' => 'float', 'message' => '올바른 요청이 아닙니다.'],
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
    $user_no = get_user_no_for_hash($conn, $userNo);

    # 중복 확인
    $sql_chk = "SELECT idx FROM history_recent_search
                WHERE user_no = ? AND type = ? AND jibun_address = ? LIMIT 1";
    $stmt_chk = executeQuery($conn, $sql_chk, 'iss', [$user_no, $type, $address]);
    $row_chk  = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt_chk));

    if ($row_chk) {
        # 이미 존재 → 날짜만 업데이트
        $sql = "UPDATE history_recent_search SET reg_date = NOW(), latitude = ?, longitude = ?
                WHERE idx = ?";
        executeQuery($conn, $sql, 'ddi', [$lat, $lng, $row_chk['idx']]);
    } else {
        # 신규 등록
        $sql = "INSERT INTO history_recent_search (user_no, type, jibun_address, latitude, longitude)
                VALUES (?, ?, ?, ?, ?)";
        executeQuery($conn, $sql, 'issdd', [$user_no, $type, $address, $lat, $lng]);
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
