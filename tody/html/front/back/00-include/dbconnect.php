<?php
ob_start(); // 최상단에 추가!

// -----------------------------------------------------------------------------
// 기존 웹 요청과 CLI 요청 모두를 위한 공통 루트 경로 로직
// -----------------------------------------------------------------------------
//$rootDirForAutoload = '';
//if (php_sapi_name() == 'cli') {
    // CLI 환경에서 __DIR__은 /var/www/tody/html/front/back/00-include
    // 목표는 /var/www/tody/html
//    $rootDirForAutoload = __DIR__ . '/../../..';
//} else {
    // 웹 환경에서는 $_SERVER['DOCUMENT_ROOT']를 기준으로 계산
    // $_SERVER['DOCUMENT_ROOT']는 /var/www/tody/html
    // 프로젝트 루트는 /var/www/tody 이므로, 상위 디렉토리로 한번 이동
//    $rootDirForAutoload = $_SERVER['DOCUMENT_ROOT'] . '/';
//}

// Composer autoload 로드
// $rootDirForAutoload 아래의 vendor/autoload.php 파일을 불러옵니다.
//require_once $rootDirForAutoload . 'vendor/autoload.php';
// Dotenv 로딩: $rootDirForAutoload 경로에서 .env 파일 찾기
//$dotenv = Dotenv\Dotenv::createImmutable($rootDirForAutoload);
//$dotenv->load();


$web_root = __DIR__ . '/../../..'; // /var/www/tody/html
require_once $web_root . '/vendor/autoload.php'; // <--- 이 라인으로 수정 (21번 라인이겠죠?)
$project_root = $web_root . '/../'; // /var/www/tody/
$dotenv = Dotenv\Dotenv::createImmutable($web_root);
$dotenv->load();


// -----------------------------------------------------------------------------
// 웹 요청에만 적용되는 로직 (CLI 환경에서는 건너뛰도록 수정)
// -----------------------------------------------------------------------------
if (php_sapi_name() !== 'cli') {
    header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
    header("Content-Type:text/html;charset=utf-8"); // Content-Type을 application/json으로 변경하는 것이 더 정확합니다.

    // ===>>> 웹 요청 에러 발생 시 JSON으로 응답하도록 수정 <<<===
    $jsonErrorResponse = function($message, $statusCode = 403) {
        http_response_code($statusCode);
        echo json_encode(['success' => false, 'message' => $message]);
        exit(); // die() 대신 exit() 사용
    };

    // HTTP_REFERER 검사
    if (!isset($_SERVER['HTTP_REFERER'])) {
        $jsonErrorResponse('Access denied: No referrer', 403);
    }
    $referrer = $_SERVER['HTTP_REFERER'];
    $referrer_host = parse_url($referrer, PHP_URL_HOST);
    if ($referrer_host === null) {
        $jsonErrorResponse('Access denied: Invalid referrer host', 403); // 메시지 명확화
    }
    $allowed_domains = ['tody.co.kr']; 
    if (!in_array($referrer_host, $allowed_domains)) {
        $jsonErrorResponse('Access denied: Referrer not allowed', 403); // 메시지 명확화
    }

    // 또한, API 응답이라면 Content-Type을 application/json으로 설정하는 것이 일반적입니다.
    // 기존 Content-Type 헤더가 웹 페이지 용이므로, API라면 변경하는 것이 좋습니다.
    header("Content-Type: application/json;charset=utf-8"); 
}


// DB 설정 (dotenv 에서 환경 변수를 가져옵니다)
$servername = $_ENV['mariadb_host'];
$username = $_ENV['mariadb_user'];
$password = $_ENV['mariadb_password'];
$dbname = $_ENV['mariadb_database'];
$conn = mysqli_connect($servername, $username, $password, $dbname);

if (mysqli_connect_errno()) {
    if (php_sapi_name() !== 'cli') {
        http_response_code(500); // 웹 요청일 경우 500 응답 코드 전송
        die('DB 연결 실패: ' . mysqli_connect_error());
    } else {
        error_log('CLI DB 연결 실패: ' . mysqli_connect_error());
        throw new Exception('CLI DB 연결 실패: ' . mysqli_connect_error());
    }
}

mysqli_query($conn, "SET NAMES utf8mb4");
mysqli_query($conn, "SET CHARACTER SET utf8mb4");
mysqli_query($conn, "SET collation_connection = 'utf8mb4_unicode_ci'");

if (!$conn) {
    die('falied : ' . mysqli_connect_error());
}