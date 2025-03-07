<?php
require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";

$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

// 세션 시작
session_start();

// GET 파라미터로 전달된 상태 토큰과 쿠키에 저장된 상태 토큰 비교(해당 php로 sns로그인 사용할 시)
// if ($_GET['state'] !== $_COOKIE['naver_state']) {
//     exit('Invalid state');
// }

// 전달된 코드와 상태 토큰으로 액세스 토큰 요청
$code = $_GET['code'];
$client_id = $_ENV['naver_client_id'];
$client_secret = $_ENV['naver_client_secret'];
$redirectURI = urlencode((isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . '/front/back/oauth/naver_login.php');

$url = "https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=" . $client_id . "&client_secret=" . $client_secret . "&redirect_uri=" . $redirectURI . "&code=" . $code . "&state=" . $_GET['state'];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$responseArr = json_decode($response, true);
// print_r($responseArr);
// exit;

$accessToken = $responseArr['access_token'];
$refreshToken = $responseArr['refresh_token'];

// 액세스 토큰을 세션에 저장
$_SESSION['naver_access_token'] = $accessToken;
$_SESSION['naver_refresh_token'] = $refreshToken;

// 사용자 정보를 가져오는 코드 (선택 사항)
// $user_info_url = "https://openapi.naver.com/v1/nid/me";
// $headers = array("Authorization: Bearer " . $accessToken);

// $ch = curl_init();
// curl_setopt($ch, CURLOPT_URL, $user_info_url);
// curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
// curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// $response = curl_exec($ch);
// curl_close($ch);

// $user_info = json_decode($response, true);
// if (!isset($user_info['response'])) {
//     http_response_code(400); // Bad Request
//     echo json_encode(['message' => 'Failed to retrieve user info', 'statusCode' => 400]);
//     exit;
// }

// 사용자 정보를 세션에 저장
// $_SESSION['user_info'] = $user_info;


// 로그인 완료 후 팝업 창 닫기 및 부모 창 리로드
echo "<script>
if (window.opener && !window.opener.closed) {
        window.opener.naver_delete_account();
        window.close();
    } else {
        alert('부모 창이 열려 있지 않거나 이미 닫혀 있습니다.');
    }
</script>";
exit;
?>