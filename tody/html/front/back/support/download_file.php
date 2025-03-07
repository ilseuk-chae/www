<?php

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';

session_start();

$token = urldecode($_POST['token']);
$no = $_POST['no'];
$secretKey = 'tody2024';

// 허용된 파일 확장자 목록
$allowedExtensions = ['txt', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'hwp', 'zip', '7z'];

// 입력값 검증
if (!isset($token) || !isset($no)) {
    throw new Exception('NO_PARAMETER', 400);
}

$filePath = verifyToken($token, $no, $secretKey);
if (!$filePath) {
    throw new Exception('INVALID_TOKEN', 403);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['fileName'])) {
        $fileName = basename($_POST['fileName']);
        $uploadDir = '/home/project/tody/upload/reference_file/' . $no . '/'; // 업로드 폴더 경로
        $filePath = $uploadDir . $fileName;


        // 파일 확장자 검증
        $fileExtension = pathinfo($filePath, PATHINFO_EXTENSION);
        if (!in_array(strtolower($fileExtension), $allowedExtensions)) {
            http_response_code(400);
            echo 'Invalid file type.';
            exit;
        }

        // 파일 존재 여부 및 경로 검증
        if (file_exists($filePath) && strpos(realpath($filePath), realpath($uploadDir)) === 0) {
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $fileName . '"');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($filePath));
            readfile($filePath);
            exit;
        } else {
            http_response_code(404);
            echo 'File not found.';
        }
    } else {
        http_response_code(400);
        echo 'No file name provided.';
    }
} else {
    http_response_code(405);
    echo 'Invalid request method.';
}


function verifyToken($token, $no, $secretKey)
{
    if (isset($_SESSION['reference_tokens_' . $no][$token])) {
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

            // 토큰 만료 여부 확인
            if (time() > $tokenData['expiry']) {
                return false;  // 토큰이 만료된 경우
            }

            $cipher = "aes-256-cbc"; // 암호화 방식
            $iv = base64_decode($tokenData['iv']);
            $decryptedFilePath = openssl_decrypt($tokenData['filePath'], $cipher, $secretKey, 0, $iv);  // 파일 경로 복호화

            // 파일 경로 반환
            return $decryptedFilePath;
        }
    } else {
        return false; // 세션에 토큰데이터 없을 시 유효하지 않음
    }
    return false;  // 서명 불일치 시 유효하지 않음
}

?>