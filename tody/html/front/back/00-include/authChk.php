<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

// include_once 'dbconnect.php';
// include_once 'auth_include.php';
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/auth_include.php');

$userNo = $_POST['user_no'];
$userToken = $_POST['user_token'];

$message = "";

if (!$userNo || !$userToken) {
    $message = "unauthorized";
} else {
    $message = authChk($conn, $userNo, $userToken);
}

$isSuccess = false;
if ($message != "authorized") {
    responseApi(401, $message, null);
    exit;
}

//	mysql_close($conn);

?>