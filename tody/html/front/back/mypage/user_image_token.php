<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

session_start();

$type = urldecode($_POST['type']);
$secretKey = 'tody2024';

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 해시로 유저넘버 얻기
    $user_no = get_user_no_for_hash($conn, $userNo);

    ##################### 1. 이미지 select #####################

    // 입력값 검증
    if ( !isset($type)) {
        throw new Exception('NO_PARAMETER', 400);
    }

    // 유저 정보와 이미지 경로 조회
    $stmt = $conn->prepare(
        "SELECT a.id, b.file_path 
        FROM user_master a 
        
        INNER JOIN user_images b 
        ON a.user_no = b.user_no 

        WHERE a.user_no = ? 
        AND b.image_type = ?
        
        ORDER BY b.reg_date DESC
        LIMIT 1
        ; "
    );

    if ($stmt === false) {
        throw new Exception('STATEMENT_PREPARATION_FAILED', 500);
    }

    $stmt->bind_param("is", $user_no, $type);
    $stmt->execute();
    $result = $stmt->get_result();

    $response_data = array();
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $filePath = $row['file_path'];
        $token = getToken($filePath, $user_no, $type, $secretKey);
        $response_data['token'] = $token;
        $response_data['file_name'] = basename($filePath);
    } else {
        $response_data = array(); // 빈 배열로 설정
        // throw new Exception('NO_DATA', 500);
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $response_data);

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


// 토큰 생성 함수 (HMAC 서명 추가, openSSL 암호화 추가)
function getToken($filePath, $user_no, $type, $secretKey, $expiryTime = 900)
{
    $cipher = "aes-256-cbc";
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($cipher));
    $encryptedFilePath = openssl_encrypt($filePath, $cipher, $secretKey, 0, $iv);

    $expiryTimestamp = time() + $expiryTime;
    $tokenData = [
        'userNo' => $user_no,
        'filePath' => $encryptedFilePath,
        'expiry' => $expiryTimestamp,
        'iv' => base64_encode($iv), // IV를 포함해야 복호화 가능
        'key' => bin2hex(random_bytes(16))
    ];

    $tokenPayload = json_encode($tokenData, JSON_UNESCAPED_SLASHES); // 슬래시를 이스케이프하지 않음
    $signature = hash_hmac('sha256', $tokenPayload, $secretKey);

    // Base64 인코딩 전에 확실히 파일 경로가 올바르게 인코딩되었는지 확인
    $tokenPayload = base64_encode($tokenPayload);
    $token = $tokenPayload . '.' . $signature;

    $_SESSION[$type . '_tokens'][$token] = $tokenData; // Base64 인코딩된 토큰을 키로 사용

    return $token;
}


?>