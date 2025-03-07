<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

include_once '../00-include/common.php';
include_once '../00-include/validation.php';

session_start();

$token = urldecode($_GET['token']);
$type = urldecode($_GET['type']);
$secretKey = 'tody2024';

try {
    // 입력값 검증
    if (!isset($token) || !isset($type)) {
        throw new Exception('NO_PARAMETER', 400);
    }

    $filePath = verifyToken($token, $type, $secretKey);
    if (!$filePath) {
        throw new Exception('INVALID_TOKEN', 403);
    }

    // // 파일 경로 URL 디코딩 및 인코딩 변환
    // $decodedFilePath = urldecode($filePath);
    // echo $decodedFilePath;
    // $decodedFilePath = iconv('UTF-8', 'UTF-8//IGNORE', $decodedFilePath);

    // // 파일 경로 디버깅 출력
    // error_log("Decoded file path: " . $decodedFilePath);

    // 파일 존재 여부 확인
    if (!file_exists($filePath)) {
        throw new Exception('FILE_NOT_FOUND', 404);
    }

    $mimeType = mime_content_type($filePath);
    if (strpos($mimeType, 'image/') !== 0) {
        throw new Exception('INVALID_FILE_TYPE', 403);
    }

    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: inline; filename="' . basename($filePath) . '"');
    header('Content-Length: ' . filesize($filePath));
    header('X-Content-Type-Options: nosniff'); // 보안 헤더 추가
    header('Content-Security-Policy: default-src \'self\'; img-src \'self\';');

    // 파일 읽기
    readfile($filePath);
    exit;

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);
}

// 토큰 복호화(openSSL 복호화 추가)
function verifyToken($token, $type, $secretKey)
{
    if (isset($_SESSION[$type . '_tokens'][$token])) {
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

            if (time() < $tokenData['expiry']) {
                // 토큰이 유효하고 만료되지 않았을 경우 파일 경로 반환

                $cipher = "aes-256-cbc";
                $iv = base64_decode($tokenData['iv']);
                $decryptedFilePath = openssl_decrypt($tokenData['filePath'], $cipher, $secretKey, 0, $iv);

                return $decryptedFilePath;
            } else {
                // echo "Token expired.<br>";
            }
        } else {
            // echo "Signature mismatch.<br>";
        }
    } else {
        // echo "Token not found in session.<br>";
    }
    return false;
}
?>