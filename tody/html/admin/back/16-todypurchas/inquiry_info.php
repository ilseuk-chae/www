<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

$no = isset($_POST['no']) ? (int)urldecode($_POST['no']) : 0;

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    if ($no <= 0) throw new Exception('INVALID_PARAM', 400);

    // 상세
    $sql = "SELECT idx AS no, type, name, company, phone, location, budget,
                   message, agree_fg, status, admin_memo,
                   DATE_FORMAT(reg_date,'%Y-%m-%d %H:%i:%s')      AS reg_date,
                   DATE_FORMAT(email_sent_at,'%Y-%m-%d %H:%i:%s') AS email_sent_at,
                   DATE_FORMAT(completed_at,'%Y-%m-%d %H:%i:%s')  AS completed_at,
                   ip_address
            FROM purchas_listings
            WHERE idx = ? AND active_fg = 'Y'";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, 'i', $no);
    if (!mysqli_stmt_execute($stmt)) throw new Exception('QUERY_EXECUTE_FAILED', 500);
    $result = mysqli_stmt_get_result($stmt);
    $info = mysqli_fetch_assoc($result);
    if (!$info) throw new Exception('NOT_FOUND', 404);

    // 첨부
    $sqlF = "SELECT idx AS file_no, original_name, mime_type, file_size,
                    DATE_FORMAT(reg_date,'%Y-%m-%d %H:%i') AS reg_date
             FROM purchas_listings_files
             WHERE listing_idx = ? AND active_fg = 'Y'
             ORDER BY idx ASC";
    $stmt2 = mysqli_prepare($conn, $sqlF);
    mysqli_stmt_bind_param($stmt2, 'i', $no);
    mysqli_stmt_execute($stmt2);
    $res2 = mysqli_stmt_get_result($stmt2);
    $files = [];
    while ($r = mysqli_fetch_assoc($res2)) $files[] = $r;

    $info['files'] = $files;
    responseApi(200, 'SUCCESS', $info);
} catch (Exception $e) {
    responseApi($e->getCode() ?: 500, $e->getMessage(), null);
} finally {
    if (isset($stmt))  mysqli_stmt_close($stmt);
    if (isset($stmt2)) mysqli_stmt_close($stmt2);
    mysqli_close($conn);
}
