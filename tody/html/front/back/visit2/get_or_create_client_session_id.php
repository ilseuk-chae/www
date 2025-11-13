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
2-2. update_visit_time.php
클라이언트(client.js)에서 주기적으로 또는 페이지 로드/이동 시 호출됩니다. user_visits 테이블에 페이지별 방문 기록을 생성하거나 업데이트하고, 로그인 사용자라면 user_total_durations에도 누적시킵니다.

php


<?php
// 파일 위치: front\back\visit2\update_visit_time.php

header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version, Content-Type");
header("Content-Type: application/json; charset=utf-8");

session_start();

// dbconnect.php는 기존 경로를 그대로 사용한다고 가정
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'); 

$response = ['status' => 'error', 'message' => '처리 중 오류 발생'];

if (!isset($conn) || !($conn instanceof mysqli)) {
    //error_log('update_visit_time.php: MySQLi 연결 객체($conn)가 유효하지 않습니다.');
    $response['message'] = '데이터베이스 연결 문제 (초기화 실패)';
    echo json_encode($response);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    // 필수 파라미터
    $clientSessionId = $input['clientSessionId'] ?? null; 
    $userId = $input['userId'] ?? null;             
    $pageUrl = $input['pageUrl'] ?? null;         
    $pageTitleFromClient = $input['pageTitle'] ?? '알 수 없음'; 

    if (!$clientSessionId || !$pageUrl) {
        $response['message'] = '필수 데이터 (clientSessionId, pageUrl) 누락';
        echo json_encode($response);
        exit;
    }

    $currentTime = time(); // Unix 타임스탬프
    $currentPhpSessionId = session_id();
    $ipAddress = $_SERVER['REMOTE_ADDR'];

    // 페이지 제목 분류 로직 (onedol님 기존 코드 기반)
    $parsed_url = parse_url($pageUrl);
    $path = isset($parsed_url['path']) ? $parsed_url['path'] : '/';
    $pageTitle = $pageTitleFromClient; 

    if ($path === '/' || strpos($path, '/index.html') !== false) {
        $pageTitle = '메인';
    } elseif (strpos($path, '/front/views/realPrice') !== false) {
        $pageTitle = '실거래가';
    } elseif (strpos($path, '/front/views/sell') !== false) {
        $pageTitle = '매물정보';
    } elseif (strpos($path, '/front/views/find') !== false) {
        $pageTitle = '삽니다';
    } elseif (strpos($path, '/front/views/put') !== false) {
        $pageTitle = '팝니다';
    } elseif (strpos($path, '/front/views/finance') !== false) {
        $pageTitle = '금융지원';
    } elseif (strpos($path, '/front/views/support') !== false) {
        $pageTitle = '제휴/제안';
    } elseif (strpos($path, '/front/views/mypage') !== false || strpos($path, '/front/views/member') !== false) {
        $pageTitle = '나의정보';
    }

    $userType = ($userId !== null) ? 'registered' : 'guest';

    // 1. user_visits 테이블 레코드 조회 (client_session_id, php_session_id, page_title 기준으로 찾음)
    //    ORDER BY start_time DESC LIMIT 1: 현재 client_session_id, page_title에 대한 최신 레코드를 가져옵니다.
    $stmt_select_visit = mysqli_prepare($conn, "
        SELECT visit_id, start_time, last_activity_time, duration_minutes
        FROM user_visits
        WHERE client_session_id = ? AND php_session_id = ? AND page_title = ?
        ORDER BY start_time DESC LIMIT 1
    ");
    mysqli_stmt_bind_param($stmt_select_visit, "sss", $clientSessionId, $currentPhpSessionId, $pageTitle);
    mysqli_stmt_execute($stmt_select_visit);
    $result_select = mysqli_stmt_get_result($stmt_select_visit);
    $existingPageVisit = mysqli_fetch_assoc($result_select);
    mysqli_stmt_close($stmt_select_visit);

    if ($existingPageVisit) {
        // 기존 페이지 방문 레코드가 있는 경우 업데이트
        $currentVisitRecordId = $existingPageVisit['visit_id'];
        $oldLastActivityTime = (int)strtotime($existingPageVisit['last_activity_time']); 
        $oldDurationMinutes = (int)$existingPageVisit['duration_minutes'];
        
        // 마지막 활동 이후 경과 시간 (초 단위)
        $addedDurationThisCallSeconds = ($currentTime > $oldLastActivityTime) ? ($currentTime - $oldLastActivityTime) : 0;
        
        // 추가된 시간을 분 단위로 변환 (버림 처리)
        $addedDurationThisCallMinutes = floor($addedDurationThisCallSeconds / 60);

        // 해당 페이지의 총 체류 시간 (분 단위) 누적
        $newDurationMinutes = $oldDurationMinutes + $addedDurationThisCallMinutes; 

        $stmt_update_visit = mysqli_prepare($conn, "
            UPDATE user_visits
            SET
                user_id = ?, 
                user_type = ?,
                ip_address = ?,
                page_url = ?, 
                last_activity_time = FROM_UNIXTIME(?),
                duration_minutes = ?
            WHERE visit_id = ?
        ");
        // user_id (s), user_type (s), ip_address (s), page_url (s), currentTime (i), newDurationMinutes (i), currentVisitRecordId (i)
        mysqli_stmt_bind_param($stmt_update_visit, "sssssii", 
            $userId, 
            $userType, 
            $ipAddress,
            $pageUrl,
            $currentTime, 
            $newDurationMinutes, 
            $currentVisitRecordId 
        );
        mysqli_stmt_execute($stmt_update_visit);
        mysqli_stmt_close($stmt_update_visit);

        // 2. user_total_durations 테이블 누적 업데이트 (로그인 사용자에게만 해당)
        if ($userId !== null && $addedDurationThisCallMinutes > 0) { 
            $stmt_update_total = mysqli_prepare($conn, "
                INSERT INTO user_total_durations (user_id, total_duration_minutes)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE total_duration_minutes = total_duration_minutes + ?
            ");
            // user_id (s), addedDurationThisCallMinutes (i), addedDurationThisCallMinutes (i)
            mysqli_stmt_bind_param($stmt_update_total, "sii", $userId, $addedDurationThisCallMinutes, $addedDurationThisCallMinutes);
            mysqli_stmt_execute($stmt_update_total);
            mysqli_stmt_close($stmt_update_total);
        }

    } else {
        // 새로운 페이지 방문 레코드인 경우 삽입
        // 이 로직은 사용자가 처음 특정 페이지를 방문했을 때 실행됩니다.
        $stmt_insert_visit = mysqli_prepare($conn, "
            INSERT INTO user_visits
            (client_session_id, php_session_id, user_id, user_type, ip_address, page_url, page_title, start_time, last_activity_time, duration_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?)
        ");
        // clientSessionId (s), currentPhpSessionId (s), userId (s), userType (s), ipAddress (s), pageUrl (s), pageTitle (s),
        // currentTime (i), currentTime (i), 0 (i)
        mysqli_stmt_bind_param($stmt_insert_visit, "sssssssiii",
            $clientSessionId, 
            $currentPhpSessionId, 
            $userId, 
            $userType, 
            $ipAddress,
            $pageUrl,
            $pageTitle,
            $currentTime, 
            $currentTime, 
            0 
        );
        mysqli_stmt_execute($stmt_insert_visit);
        mysqli_stmt_close($stmt_insert_visit);
    }
    
    $response['status'] = 'success';
    $response['message'] = '방문 시간 업데이트 완료';

} catch (Exception $e) {
    //error_log('update_visit_time.php: 방문 시간 업데이트 실패: ' . $e->getMessage());
    $response['message'] = '방문 시간 업데이트 중 예외 발생';
} finally {
    if ($conn) mysqli_close($conn);
}

echo json_encode($response);
exit;
?>