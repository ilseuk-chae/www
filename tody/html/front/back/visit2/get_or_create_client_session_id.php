<?php
// 파일 위치: front\back\visit2\get_or_create_client_session_id.php

header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version, Content-Type");
header("Content-Type: application/json; charset=utf-8");

session_start();

// dbconnect.php는 기존 경로를 그대로 사용한다고 가정
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'); 

$response = ['status' => 'error', 'message' => '처리 중 오류 발생'];

if (!isset($conn) || !($conn instanceof mysqli)) {
    //error_log('get_or_create_client_session_id.php: MySQLi 연결 객체($conn)가 유효하지 않습니다.');
    $response['message'] = '데이터베이스 연결 문제 (초기화 실패)';
    echo json_encode($response);
    exit;
}

try {
    $clientSessionIdFromClient = $_COOKIE['client_session_id'] ?? null; // 클라이언트 쿠키에서 ID 가져오기

    $finalClientSessionId = $clientSessionIdFromClient;
    $isNewClientSessionId = false;

    // 클라이언트 쿠키에 client_session_id가 없으면 새로 생성
    if (!$finalClientSessionId) {
        $finalClientSessionId = uniqid('', true); // 고유한 문자열 ID 생성
        $isNewClientSessionId = true;
    }
    
    // 1. 클라이언트 쿠키에 client_session_id 설정 (새로 생성했거나, 기존 것을 다시 확인했을 경우)
    // expires: 0 (브라우저 세션이 종료될 때까지)
    setcookie('client_session_id', $finalClientSessionId, [
        'expires' => 0, 
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']), 
        'httponly' => true, 
        'samesite' => 'Lax' 
    ]);

    $response['status'] = 'success';
    $response['message'] = $isNewClientSessionId ? '새로운 클라이언트 세션 ID 생성' : '기존 클라이언트 세션 ID 확인';
    $response['clientSessionId'] = $finalClientSessionId;

} catch (Exception $e) {
    //error_log('get_or_create_client_session_id.php: 클라이언트 세션 ID 처리 실패: ' . $e->getMessage());
    $response['message'] = '클라이언트 세션 ID 처리 중 예외 발생';
} finally {
    if ($conn) mysqli_close($conn);
}

echo json_encode($response);
exit;
?>
