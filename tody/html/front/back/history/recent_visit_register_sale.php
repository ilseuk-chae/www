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
$estate_no = isset($_POST['estate_no']) ? urldecode($_POST['estate_no']) : null;

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

    # 중복 확인 (reg_no + pnu + estate_no)
    if ($user_no) {
        $sql_chk = "SELECT idx FROM history_recent_sale
                    WHERE reg_no = ? AND pnu = ? AND estate_no = ? LIMIT 1";
        $stmt_chk = executeQuery($conn, $sql_chk, 'isi', [$user_no, $pnu, $estate_no]);
    } else {
        $sql_chk = "SELECT idx FROM history_recent_sale
                    WHERE reg_no IS NULL AND pnu = ? AND estate_no = ? LIMIT 1";
        $stmt_chk = executeQuery($conn, $sql_chk, 'si', [$pnu, $estate_no]);
    }
    $row_chk = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt_chk));

    if ($row_chk) {
        # 이미 존재 → 날짜만 업데이트
        $sql = "UPDATE history_recent_sale SET reg_date = NOW(), address_jibun = ?, latitude = ?, longitude = ?
                WHERE idx = ?";
        executeQuery($conn, $sql, 'sddi', [$address, $lat, $lng, $row_chk['idx']]);
    } else {
        # 신규 등록
        $sql = "INSERT INTO history_recent_sale (pnu, address_jibun, latitude, longitude, estate_no, reg_no)
                VALUES (?, ?, ?, ?, ?, ?)";
        executeQuery($conn, $sql, 'ssddii', [$pnu, $address, $lat, $lng, $estate_no, $user_no]);
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
