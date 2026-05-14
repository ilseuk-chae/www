<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

$no   = isset($_POST['rcvNo'])      ? (int)urldecode($_POST['rcvNo']) : 0;
$memo = isset($_POST['admin_memo']) ? urldecode($_POST['admin_memo']) : '';

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    if ($no <= 0) throw new Exception('INVALID_PARAM', 400);

    mysqli_autocommit($conn, FALSE);
    mysqli_begin_transaction($conn);

    $sql = "UPDATE consulting_listings SET memo=? WHERE idx=? AND active_fg='Y'";
    executeQuery($conn, $sql, 'si', [$memo, $no]);

    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);
} catch (Exception $e) {
    mysqli_rollback($conn);
    responseApi($e->getCode() ?: 500, $e->getMessage(), null);
} finally {
    mysqli_close($conn);
}
