<?php
header("Content-Type: application/json; charset=utf-8");

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

$session_token = isset($_POST['session_token']) ? trim($_POST['session_token']) : null;

if (!$session_token) {
    responseApi(400, 'NO_PARAMETER', null);
    exit;
}

$sql  = "SELECT session_id, is_forced_logout FROM user_sessions WHERE session_token = ? AND user_type = 'FRONT'";
$stmt = mysqli_prepare($conn, $sql);

if (!$stmt) {
    responseApi(500, 'DB_ERROR', null);
    exit;
}

mysqli_stmt_bind_param($stmt, "s", $session_token);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$row    = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

if (!$row) {
    responseApi(200, 'OK', null);
    exit;
}

if ($row['is_forced_logout']) {
    $sql2  = "DELETE FROM user_sessions WHERE session_id = ?";
    $stmt2 = mysqli_prepare($conn, $sql2);
    if ($stmt2) {
        mysqli_stmt_bind_param($stmt2, "i", $row['session_id']);
        mysqli_stmt_execute($stmt2);
        mysqli_stmt_close($stmt2);
    }
    responseApi(200, 'FORCED_LOGOUT', null);
} else {
    $sql2  = "UPDATE user_sessions SET last_activity = NOW() WHERE session_id = ?";
    $stmt2 = mysqli_prepare($conn, $sql2);
    if ($stmt2) {
        mysqli_stmt_bind_param($stmt2, "i", $row['session_id']);
        mysqli_stmt_execute($stmt2);
        mysqli_stmt_close($stmt2);
    }
    responseApi(200, 'OK', null);
}

mysqli_close($conn);
