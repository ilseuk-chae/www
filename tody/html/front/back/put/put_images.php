<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

// 세션 시작 
// session_start();

$token = urldecode($_GET['token']);  // URL에서 전달된 토큰 값 디코딩
$secretKey = 'tody2024';  // 비밀 키 설정

try {
    // 입력값 검증
    if (!isset($token)) {
        throw new Exception('NO_PARAMETER', 400);  // 토큰이 없으면 예외 발생
    }

    $filePath = verifyToken($token, $type, $secretKey);  // 토큰 검증 후 파일 경로 가져오기
    if (!$filePath) {
        throw new Exception('INVALID_TOKEN', 403);  // 토큰이 유효하지 않으면 예외 발생
    }

    // 파일 존재 여부 확인
    if (!file_exists($filePath)) {
        throw new Exception('FILE_NOT_FOUND', 404);  // 파일이 없으면 예외 발생
    }

    $mimeType = mime_content_type($filePath);  // 파일의 MIME 타입 확인
    // if (strpos($mimeType, 'image/') !== 0) {
    //     throw new Exception('INVALID_FILE_TYPE', 403);
    // }

    // 동영상 스트리밍 처리
    if (strpos($mimeType, 'video/') === 0) {
        handleVideoStreaming($filePath, $mimeType);  // 동영상 파일 스트리밍
    } else {
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: inline; filename="' . basename($filePath) . '"');
        header('Content-Length: ' . filesize($filePath));
        header('X-Content-Type-Options: nosniff'); // 보안 헤더 추가
        header('Content-Security-Policy: default-src \'self\'; img-src \'self\';');

        // 파일 읽기
        readfile($filePath);
    }
    exit;

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);  // 예외 발생 시 API 응답 반환
}

function verifyToken($token, $type, $secretKey)
{
    $tokenParts = explode('.', $token);  // 토큰을 '.' 기준으로 분할
    if (count($tokenParts) !== 2) {
        return false;  // 토큰 부분 개수가 2개가 아니면 유효하지 않음
    }

    $encodedPayload = $tokenParts[0];
    $providedSignature = $tokenParts[1];
    $decodedPayload = base64_decode($encodedPayload);  // 페이로드 디코딩
    $expectedSignature = hash_hmac('sha256', $decodedPayload, $secretKey);  // 서명 생성

    if (hash_equals($expectedSignature, $providedSignature)) {  // 서명 일치 여부 확인
        $tokenData = json_decode($decodedPayload, true);  // 페이로드 JSON 디코딩

        if (json_last_error() !== JSON_ERROR_NONE) {
            // echo "JSON decode error: " . json_last_error_msg() . "<br>";
            return false;  // JSON 디코딩 오류 시 유효하지 않음
        }

        $cipher = "aes-256-cbc"; // 암호화 방식
        $iv = base64_decode($tokenData['iv']);
        $decryptedFilePath = openssl_decrypt($tokenData['filePath'], $cipher, $secretKey, 0, $iv);  // 파일 경로 복호화

        // 파일 경로 반환
        return $decryptedFilePath;
    }
    return false;  // 서명 불일치 시 유효하지 않음
}


// 토큰 복호화(openSSL 복호화 추가)
function handleVideoStreaming($filePath, $mimeType)
{
    $size = filesize($filePath);  // 파일 크기 확인
    $length = $size;
    $start = 0;
    $end = $size - 1;

    header('Content-Type: ' . $mimeType);
    header('Accept-Ranges: bytes');  // 바이트 단위 범위 요청 허용

    if (isset($_SERVER['HTTP_RANGE'])) {
        $range = $_SERVER['HTTP_RANGE'];
        $range = str_replace('bytes=', '', $range);
        $range = explode('-', $range);
        $start = intval($range[0]);
        if (isset($range[1]) && is_numeric($range[1])) {
            $end = intval($range[1]);
        }
        $length = ($end - $start) + 1;

        header('HTTP/1.1 206 Partial Content');  // 부분 콘텐츠 응답
        header("Content-Range: bytes $start-$end/$size");
    }

    header('Content-Length: ' . $length);

    $file = fopen($filePath, 'rb');  // 파일 읽기 모드로 열기
    fseek($file, $start);  // 시작 지점으로 이동
    $bufferSize = 8192;
    while (!feof($file) && ($pos = ftell($file)) <= $end) {
        if ($pos + $bufferSize > $end) {
            $bufferSize = $end - $pos + 1;
        }
        set_time_limit(0);  // 큰 파일의 경우 시간 제한 재설정
        echo fread($file, $bufferSize);
        flush();  // 메모리 해제
    }
    fclose($file);  // 파일 닫기
}
?>