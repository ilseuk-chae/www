<?php
// 세션 시작
session_start();

// GET 파라미터로 전달된 상태 토큰과 쿠키에 저장된 상태 토큰 비교
if ($_GET['state'] !== $_COOKIE['naver_state']) {
    exit('Invalid state');
}

// 전달된 코드와 상태 토큰으로 액세스 토큰 요청
$code = $_GET['code'];
$client_id = "51uqj3T1dAORiqMsBTFv";
$client_secret = "DGZY4NdHi6";
$redirectURI = urlencode((isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . '/front/views/callback/naver.php');

$url = "https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=" . $client_id . "&client_secret=" . $client_secret . "&redirect_uri=" . $redirectURI . "&code=" . $code . "&state=" . $_GET['state'];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$responseArr = json_decode($response, true);
// print_r($responseArr);exit;

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

// 사용자 정보를 세션에 저장
// $_SESSION['user_info'] = $user_info;

// 로그인 완료 후 팝업 창 닫기 및 부모 창 리로드
echo "<script>
    window.opener.location.reload();
    window.close();
</script>";
exit;
?>