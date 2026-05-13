<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

// error_reporting( E_ALL );
// ini_set( "display_errors", 1 );

// include_once 'dbconnect.php';
// include_once 'auth_include.php';
include ($_SERVER['DOCUMENT_ROOT'] . '/admin/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/admin/back/00-include/auth_include.php');

$saNo = $_POST['sa_no'];
$saToken = $_POST['sa_token'];
$saContNo = $_POST['sa_cont_no'];
$saContToken = $_POST['sa_cont_token'];

$message = "";

if (!$saNo || !$saToken) {
    $message = "AUTH_FAIL";
} else {
    $flag = authChk($conn, $saNo, $saToken, $saContNo, $saContToken);
}
// echo $message;
// echo $flag;

if ($flag != 'ACCESS') {
    $message = "AUTH_FAIL";
}

if ($message) {
    responseApi(401, $message, null);
    exit;
}

//	mysql_close($conn);

?>