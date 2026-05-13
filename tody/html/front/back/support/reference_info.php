<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

session_start();

$no = isset($_POST['no']) ? urldecode($_POST['no']) : '';
$secretKey = 'tody2024';

try {
    // SQL 쿼리
    $sql =
        "SELECT 
            a.idx AS notice_no,
            a.title,
            a.content,
            a.file_path,
            a.view_count,
            DATE_FORMAT(a.reg_date, '%Y.%m.%d %H:%i') AS reg_date,
            b.name
    
        FROM reference_listings AS a

        LEFT JOIN user_admin AS b 
        ON a.reg_no = b.user_no
        
        WHERE a.idx = ?
        AND a.public_fg = 'Y'
        AND a.active_fg = 'Y'
        ";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, "i", $no);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('QUERY_EXECUTE_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $filePath = $row['file_path'];
        $token = getToken($filePath, $no, $secretKey);

        $response_data['notice_no'] = $row['notice_no'];
        $response_data['title'] = $row['title'];
        $response_data['content'] = $row['content'];
        $response_data['view_count'] = $row['view_count'];
        $response_data['reg_date'] = $row['reg_date'];
        $response_data['file_path'] = $row['file_path'];
        $response_data['token'] = $token;
    }

    // 모든 작업 성공 시 커밋
    responseApi(200, 'SUCCESS', $response_data);

} catch (Exception $e) {
    // 오류 발생 시 롤백
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
function getToken($filePath, $no, $secretKey, $expiryTime = 900)
{
    $cipher = "aes-256-cbc";
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($cipher));
    $encryptedFilePath = openssl_encrypt($filePath, $cipher, $secretKey, 0, $iv);
    $expiryTimestamp = time() + $expiryTime;

    $tokenData = [
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

    $_SESSION['reference_tokens_' . $no][$token] = $tokenData; // Base64 인코딩된 토큰을 키로 사용

    return $token;
}
