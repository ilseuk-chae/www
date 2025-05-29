<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

// error_reporting( E_ALL );
// ini_set( "display_errors", 1 );

// include_once 'dbconnect.php';
// include_once 'auth_include.php';
include ($_SERVER['DOCUMENT_ROOT'] . '/admin/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/admin/back/00-include/auth_include.php');


// ------------------------------------------------------------
// *** 수정: 인증 정보를 $_POST 대신 $_COOKIE에서 가져옵니다. ***
// ------------------------------------------------------------
$saNo = isset($_COOKIE['sa_no']) ? $_COOKIE['sa_no'] : ''; // isset으로 키 존재 여부 확인
$saToken = isset($_COOKIE['sa_token']) ? $_COOKIE['sa_token'] : '';
$saContNo = isset($_COOKIE['sa_cont_no']) ? $_COOKIE['sa_cont_no'] : '';
$saContToken = isset($_COOKIE['sa_cont_token']) ? $_COOKIE['sa_cont_token'] : '';
// ------------------------------------------------------------


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
