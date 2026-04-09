<?php
include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

$fileNo = isset($_POST['file_no']) ? (int)$_POST['file_no']
        : (isset($_GET['file_no']) ? (int)$_GET['file_no'] : 0);

try {
    if ($fileNo <= 0) throw new Exception('INVALID_PARAM', 400);

    $sql = "SELECT original_name, stored_path, mime_type
            FROM purchas_listings_files
            WHERE idx=? AND active_fg='Y'";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, 'i', $fileNo);
    mysqli_stmt_execute($stmt);
    $res = mysqli_stmt_get_result($stmt);
    $f = mysqli_fetch_assoc($res);
    if (!$f) throw new Exception('NOT_FOUND', 404);
    if (!file_exists($f['stored_path'])) throw new Exception('FILE_MISSING', 404);

    // JSON 헤더 제거 후 파일 응답
    header_remove('Content-Type');
    header('Content-Type: ' . ($f['mime_type'] ?: 'application/octet-stream'));
    header('Content-Disposition: attachment; filename="'
        . rawurlencode($f['original_name']) . '"; filename*=UTF-8\'\''
        . rawurlencode($f['original_name']));
    header('Content-Length: ' . filesize($f['stored_path']));
    header('Cache-Control: private, no-cache, no-store, must-revalidate');
    readfile($f['stored_path']);
    exit;
} catch (Exception $e) {
    header('Content-Type: application/json; charset=utf-8');
    responseApi($e->getCode() ?: 500, $e->getMessage(), null);
} finally {
    if (isset($stmt)) mysqli_stmt_close($stmt);
    if (isset($conn)) mysqli_close($conn);
}
