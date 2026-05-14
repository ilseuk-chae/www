<?php
header("Content-Type: application/json; charset=utf-8");

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

$session_token = isset($_POST['session_token']) ? trim($_POST['session_token']) : null;

if ($session_token) {
    $sql  = "DELETE FROM user_sessions WHERE session_token = ? AND user_type = 'FRONT'";
    $stmt = mysqli_prepare($conn, $sql);
    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "s", $session_token);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }
}

mysqli_close($conn);
responseApi(200, 'SUCCESS', null);
