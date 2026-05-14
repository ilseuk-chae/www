<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

$no = isset($_POST['no']) ? (int)urldecode($_POST['no']) : 0;

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    if ($no <= 0) throw new Exception('INVALID_PARAM', 400);

    $sql = "SELECT idx AS no, purpose, location, area, phone, name,
                   message, agree_fg, status, memo AS admin_memo,
                   DATE_FORMAT(created_at,   '%Y-%m-%d %H:%i:%s') AS reg_date,
                   DATE_FORMAT(email_sent_at,'%Y-%m-%d %H:%i:%s') AS email_sent_at,
                   DATE_FORMAT(updated_at,   '%Y-%m-%d %H:%i:%s') AS updated_at,
                   ip_address
            FROM consulting_listings
            WHERE idx = ? AND active_fg = 'Y'";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, 'i', $no);
    if (!mysqli_stmt_execute($stmt)) throw new Exception('QUERY_EXECUTE_FAILED', 500);
    $result = mysqli_stmt_get_result($stmt);
    $info = mysqli_fetch_assoc($result);
    if (!$info) throw new Exception('NOT_FOUND', 404);

    responseApi(200, 'SUCCESS', $info);
} catch (Exception $e) {
    responseApi($e->getCode() ?: 500, $e->getMessage(), null);
} finally {
    if (isset($stmt)) mysqli_stmt_close($stmt);
    mysqli_close($conn);
}
