<?php
// CORS 헤더 설정
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";

$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

// 세션 시작
session_start();

// 세션에서 저장된 액세스 토큰 가져오기
$accessToken = $_SESSION['naver_access_token'];
// echo $accessToken;
// exit;

// 네이버 연동 해제 요청 URL
// $client_id = "51uqj3T1dAORiqMsBTFv";
// $client_secret = "DGZY4NdHi6";
$client_id = $_ENV['naver_client_id'];
$client_secret = $_ENV['naver_client_secret'];
$url = "https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=$client_id&client_secret=$client_secret&access_token=$accessToken";

// CURL을 이용하여 연동 해제 요청 보내기
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$responseArr = json_decode($response, true);

if (isset($responseArr['result']) && $responseArr['result'] == 'success') {
    // 연동 해제 성공 시 세션 데이터 삭제
    session_destroy();
    // 다른 PHP 스크립트 실행
    // include 'withdrawal.php';
    echo json_encode(['message' => '네이버 연동 해제가 완료되었습니다.', 'statusCode' => 200]);
} else {
    // 연동 해제 실패 시 처리
    http_response_code(400); // Bad Request
    echo json_encode(['message' => '네이버 연동 해제에 실패하였습니다. 다시 시도해 주세요.', 'statusCode' => 400]);
}
exit;
?>