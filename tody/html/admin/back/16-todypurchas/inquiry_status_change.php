<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

$no     = isset($_POST['rcvNo'])  ? (int)urldecode($_POST['rcvNo'])  : 0;
$status = isset($_POST['status']) ? urldecode($_POST['status']) : '';

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

$allowed = ['received','read','in_progress','done','rejected'];

try {
    if ($no <= 0)                         throw new Exception('INVALID_PARAM', 400);
    if (!in_array($status, $allowed,true)) throw new Exception('INVALID_STATUS', 400);

    mysqli_autocommit($conn, FALSE);
    mysqli_begin_transaction($conn);

    if ($status === 'done') {
        $sql = "UPDATE purchas_listings
                SET status=?, completed_at=NOW()
                WHERE idx=? AND active_fg='Y'";
        executeQuery($conn, $sql, 'si', [$status, $no]);
    } else {
        $sql = "UPDATE purchas_listings
                SET status=?, completed_at=NULL
                WHERE idx=? AND active_fg='Y'";
        executeQuery($conn, $sql, 'si', [$status, $no]);
    }

    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);
} catch (Exception $e) {
    mysqli_rollback($conn);
    responseApi($e->getCode() ?: 500, $e->getMessage(), null);
} finally {
    mysqli_close($conn);
}
