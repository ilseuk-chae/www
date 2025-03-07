<?php

header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

// 허용된 도메인 목록을 설정
$allowed_domains = ['tody.co.kr'];

// HTTP_REFERER 헤더가 설정되어 있는지 확인
if (!isset($_SERVER['HTTP_REFERER'])) {
    die('Access denied: No referrer');
}

// HTTP_REFERER에서 호스트 이름을 추출
$referrer = $_SERVER['HTTP_REFERER'];
$referrer_host = parse_url($referrer, PHP_URL_HOST);

// referrer_host가 null이 아닌지 확인
if ($referrer_host === null) {
    die('Access denied: Invalid referrer');
}

// 호스트 이름이 허용된 도메인 목록에 있는지 확인
if (!in_array($referrer_host, $allowed_domains)) {
    die('Access denied: Invalid referrer');
}

$servername = 'localhost';
$username = 'root';
$password = 'dkfvkdhkdhaprk!123';
$dbname = 'tody';
$conn = mysqli_connect($servername, $username, $password, $dbname);

mysqli_query($conn, "set session character_set_connection=utf8;");
mysqli_query($conn, "set session character_set_results=utf8;");
mysqli_query($conn, "set session character_set_client=utf8;");
mysqli_select_db($conn, $dbname);

if (!$conn) {
    die('falied : ' . mysqli_connect_error());
}