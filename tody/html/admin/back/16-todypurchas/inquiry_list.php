<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

$status = isset($_POST['status']) ? urldecode($_POST['status']) : '';

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    $sql = "SELECT
              a.idx AS no,
              a.type, a.name, a.company, a.phone, a.status,
              DATE_FORMAT(a.reg_date, '%Y-%m-%d %H:%i') AS reg_date,
              DATE_FORMAT(a.email_sent_at, '%Y-%m-%d %H:%i') AS email_sent_at,
              DATE_FORMAT(a.completed_at,  '%Y-%m-%d %H:%i') AS completed_at,
              (SELECT COUNT(*) FROM purchas_listings_files f
                 WHERE f.listing_idx = a.idx AND f.active_fg='Y') AS file_count
            FROM purchas_listings AS a
            WHERE a.active_fg = 'Y' ";

    $params = []; $types = '';
    if ($status !== '') {
        $sql .= " AND a.status = ? ";
        $params[] = $status; $types .= 's';
    }
    $sql .= " ORDER BY a.idx DESC ";

    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) throw new Exception('QUERY_PREPARATION_FAILED', 500);
    if (!empty($params)) mysqli_stmt_bind_param($stmt, $types, ...$params);
    if (!mysqli_stmt_execute($stmt)) throw new Exception('QUERY_EXECUTE_FAILED', 500);

    $result = mysqli_stmt_get_result($stmt);
    $rows = [];
    while ($row = mysqli_fetch_assoc($result)) $rows[] = $row;

    responseApi(200, 'SUCCESS', $rows);
} catch (Exception $e) {
    responseApi($e->getCode() ?: 500, $e->getMessage(), null);
} finally {
    if (isset($stmt)) mysqli_stmt_close($stmt);
    mysqli_close($conn);
}
