<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);


include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    // SQL 쿼리
    $sql =
        "SELECT 
            a.user_no AS a_no,
            a.id,
            a.name,
            a.phone,
            a.email,
            a.user_image,
            a.per_no,
            b.per_title
    
        FROM user_admin AS a

        LEFT JOIN (
            SELECT per_no, MAX(per_title) AS per_title
            FROM admin_menu_permission
            GROUP BY per_no
        ) AS b
        ON a.per_no = b.per_no
        
        WHERE a.status = 'ACTIVE'

        ORDER BY a.reg_date ASC;
        ";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('QUERY_EXECUTE_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();
    $estateArray = array();

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $filePath = $row['user_image'];
        $row['user_image'] = '';
        $rcvUserNo = $row['a_no'];
        $type = 'admin';
        $secretKey = 'tody2024';

        if ($filePath) {
            $token = getToken($filePath, $rcvUserNo, $type, $secretKey);
            $row['token'] = $token;
        }

        $response_data[] = $row;
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
function getToken($filePath, $userId, $type, $secretKey, $expiryTime = 900)
{
    $cipher = "aes-256-cbc";
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($cipher));
    $encryptedFilePath = openssl_encrypt($filePath, $cipher, $secretKey, 0, $iv);

    $expiryTimestamp = time() + $expiryTime;
    $tokenData = [
        'userId' => $userId,
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
