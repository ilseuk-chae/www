<?php

header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

$host_postgre = 'localhost';
$port_postgre = "5432";
$dbname_postgre = 'tody_db';
$user_postgre = 'postgres';
$password_postgre = 'dkfvkdhkdhaprk!123';

// // 연결 문자열
// $conn_string = "host=$host_postgre port=$port_postgre dbname=$dbname_postgre user=$user_postgre password=$password_postgre";

// // 연결 시도
// $conn_postgre = pg_connect($conn_string);

// if (!$conn_postgre) {
//     echo "PostgreSQL 연결 실패!";
//     exit;
// } else {
//     // echo "PostgreSQL 연결 성공!";
// }

try {
    // PostgreSQL 연결 정보
    $dsn = "pgsql:host=$host_postgre;port=$port_postgre;dbname=$dbname_postgre";
    $pdo = new PDO($dsn, $user_postgre, $password_postgre);

    // PDO 에러 모드 설정
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 스키마 설정
    // $pdo->exec("SET search_path TO tody");

    // echo "스키마가 설정되었습니다.\n";

} catch (PDOException $e) {
    echo "PostgreSQL 연결 실패: " . $e->getMessage();
    exit;
}