<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);
// CSRF 방지를 위한 상태 토큰 생성 코드
// 상태 토큰은 추후 검증을 위해 세션에 저장되어야 한다.


function generate_state() {
    $mt = microtime();
    $rand = mt_rand();
    return md5($mt . $rand);
}


// 상태 토큰으로 사용할 랜덤 문자열을 생성
$state = generate_state();
// 세션 또는 별도의 저장 공간에 상태 토큰을 저장
$_SESSION['naver_state'] = $state;

$client_id = "51uqj3T1dAORiqMsBTFv";
$redirectURI = urlencode((isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . '/front/views/callback/naver.php');
// $state = "fe486e77-7455-4c42-8467-599e46fed79c";
$url = "https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=" . $client_id . "&redirect_uri=" . $redirectURI . "&state=" . $state;


// 네이버 로그인 페이지로 리디렉션
header('Location: ' . $url);
exit;

// 네이버 로그인 콜백 예제
// $client_id = "YOUR_CLIENT_ID";
// $client_secret = "YOUR_CLIENT_SECRET";
// $code = $_GET["code"];
// $state = $_GET["state"];
// $redirectURI = urlencode("YOUR_CALLBACK_URL");
// $url = "https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=" . $client_id . "&client_secret=" . $client_secret . "&redirect_uri=" . $redirectURI . "&code=" . $code . "&state=" . $state;
$is_post = false;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, $is_post);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$headers = array();
$response = curl_exec($ch);
$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "status_code:" . $status_code . "<br>";
curl_close($ch);
if ($status_code == 200) {
    echo $response;
} else {
    echo "Error 내용:" . $response;
}

exit;

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/validation.php');

$viewNo = isset($_POST['viewNo']) ? urldecode($_POST['viewNo']) : '';

##################### 0. 유효성 검사 #####################
// 은행명 유효성 검사
$errorMessage = "정상적인 접근이 아닙니다.";
$valid = validateInput($viewNo, 'int', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // SQL 쿼리
    $sql =
        "UPDATE wanted_listings 
        SET view_count = view_count + 1
        WHERE idx = ? ;
        ";

    // 조건 추가
    $params = [$viewNo];
    $types = 'i';

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, $types, ...$params);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('QUERY_EXECUTE_FAILED', 500);
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    // 연결 종료
    if (isset($stmt))
        mysqli_stmt_close($stmt);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    if (isset($stmt3))
        mysqli_stmt_close($stmt3);
    mysqli_close($conn);
}
