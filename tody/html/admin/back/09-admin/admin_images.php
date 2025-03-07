<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

include_once '../00-include/common.php';
include_once '../00-include/validation.php';

// session_start();

$token = urldecode($_GET['token']);
// echo $token;
// exit;
// $type = urldecode($_GET['type']);
$secretKey = 'tody2024';

try {
    // 입력값 검증
    if (!isset($token)) {
        throw new Exception('NO_PARAMETER', 400);
    }

    $filePath = verifyToken($token, $type, $secretKey);
    // echo $filePath;
    if (!$filePath) {
        throw new Exception('INVALID_TOKEN', 403);
    }

    // 파일 존재 여부 확인
    if (!file_exists($filePath)) {
        throw new Exception('FILE_NOT_FOUND', 404);
    }

    $mimeType = mime_content_type($filePath);
    // if (strpos($mimeType, 'image/') !== 0) {
    //     throw new Exception('INVALID_FILE_TYPE', 403);
    // }

    // 동영상 스트리밍 처리
    if (strpos($mimeType, 'video/') === 0) {
        handleVideoStreaming($filePath, $mimeType);
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
    responseApi($e->getCode(), $e->getMessage(), null);
}

function verifyToken($token, $type, $secretKey)
{
    $tokenParts = explode('.', $token);
    if (count($tokenParts) !== 2) {
        // echo "Invalid token parts count: " . count($tokenParts) . "<br>";
        return false;
    }

    $encodedPayload = $tokenParts[0];
    $providedSignature = $tokenParts[1];
    $decodedPayload = base64_decode($encodedPayload);
    $expectedSignature = hash_hmac('sha256', $decodedPayload, $secretKey);

    if (hash_equals($expectedSignature, $providedSignature)) {
        $tokenData = json_decode($decodedPayload, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            // echo "JSON decode error: " . json_last_error_msg() . "<br>";
            return false;
        }

        $cipher = "aes-256-cbc";
        $iv = base64_decode($tokenData['iv']);
        $decryptedFilePath = openssl_decrypt($tokenData['filePath'], $cipher, $secretKey, 0, $iv);

        // 파일 경로 반환
        return $decryptedFilePath;
    } else {
        // echo "Signature mismatch.<br>";
    }
    return false;
}


// 토큰 복호화(openSSL 복호화 추가)
function handleVideoStreaming($filePath, $mimeType)
{
    $size = filesize($filePath);
    $length = $size;
    $start = 0;
    $end = $size - 1;

    header('Content-Type: ' . $mimeType);
    header('Accept-Ranges: bytes');

    if (isset($_SERVER['HTTP_RANGE'])) {
        $range = $_SERVER['HTTP_RANGE'];
        $range = str_replace('bytes=', '', $range);
        $range = explode('-', $range);
        $start = intval($range[0]);
        if (isset($range[1]) && is_numeric($range[1])) {
            $end = intval($range[1]);
        }
        $length = ($end - $start) + 1;

        header('HTTP/1.1 206 Partial Content');
        header("Content-Range: bytes $start-$end/$size");
    }

    header('Content-Length: ' . $length);

    $file = fopen($filePath, 'rb');
    fseek($file, $start);
    $bufferSize = 8192;
    while (!feof($file) && ($pos = ftell($file)) <= $end) {
        if ($pos + $bufferSize > $end) {
            $bufferSize = $end - $pos + 1;
        }
        set_time_limit(0); // Reset time limit for big files
        echo fread($file, $bufferSize);
        flush(); // Free up memory. 
    }
    fclose($file);
}
?>