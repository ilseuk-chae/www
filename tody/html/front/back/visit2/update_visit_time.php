<?php
// front\back\visit2\update_visit_time.php (수정)
date_default_timezone_set('Asia/Seoul'); // <-- 맨 위 추가

header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version, Content-Type");
header("Content-Type: application/json; charset=utf-8");

session_start();

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'); 

$response = ['status' => 'error', 'message' => '처리 중 오류 발생'];

if (!isset($conn) || !($conn instanceof mysqli)) {
    //error_log('update_visit_time.php DB CONNECT ERROR: MySQLi 연결 객체($conn)가 유효하지 않습니다.');
    $response['message'] = '데이터베이스 연결 문제 (초기화 실패)';
    echo json_encode($response);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    $clientSessionId = $input['clientSessionId'] ?? null; 
    $userId = $input['userId'] ?? null;             
    $pageUrl = $input['pageUrl'] ?? null;         
    $pageTitleFromClient = $input['pageTitle'] ?? '알 수 없음'; 
    $passedSeconds = $input['passedSeconds'] ?? 0; // <-- client.js에서 보낸 값

    if (!$clientSessionId || !$pageUrl) {
        //error_log('update_visit_time.php PARAM MISSING: clientSessionId or pageUrl is null.');
        $response['message'] = '필수 데이터 (clientSessionId, pageUrl) 누락';
        echo json_encode($response);
        exit;
    }

    $currentTime = time(); 
    $currentPhpSessionId = session_id();  // 현재 시간 (Unix 타임스탬프)
    $ipAddress = $_SERVER['REMOTE_ADDR'];

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

    // *** 중요 디버깅 로그: 이 요청의 입력 값들을 확인합니다. ***
    //error_log("DEBUG update_visit_time Input: clientSessionId=$clientSessionId, phpSessionId=$currentPhpSessionId, pageTitle=$pageTitle, userId=" . ($userId ?? 'NULL') . ", passedSeconds=$passedSeconds"); // 로그 추가

    // 1. user_visits 테이블 레코드 조회
    $stmt_select_visit = mysqli_prepare($conn, "
        SELECT visit_id, start_time, last_activity_time, duration_minutes
        FROM user_visits
        WHERE client_session_id = ? AND php_session_id = ? AND page_title = ?
        ORDER BY start_time DESC LIMIT 1
    ");
    if ($stmt_select_visit === false) { throw new Exception("Select visit prepare failed: " . mysqli_error($conn)); }
    mysqli_stmt_bind_param($stmt_select_visit, "sss", $clientSessionId, $currentPhpSessionId, $pageTitle);
    mysqli_stmt_execute($stmt_select_visit);
    $result_select = mysqli_stmt_get_result($stmt_select_visit);
    $existingPageVisit = mysqli_fetch_assoc($result_select);
    mysqli_stmt_close($stmt_select_visit);

    if ($existingPageVisit) {
        // *** 중요 디버깅 로그: 기존 레코드를 찾았는지, 찾았다면 그 내용을 확인합니다. ***
        //error_log("DEBUG update_visit_time FOUND existing record. visit_id={$existingPageVisit['visit_id']}, duration_minutes=" . ($existingPageVisit['duration_minutes'] ?? 0) . ", last_activity_time={$existingPageVisit['last_activity_time']}");

        $currentVisitRecordId = $existingPageVisit['visit_id'];
        
        // 기존 oldLastActivityTime과 currentTime 계산 대신, 클라이언트에서 보내준 passedSeconds 사용
        $addedDurationThisCallSeconds = $passedSeconds; // 클라이언트가 보내준 값 사용
        $addedDurationThisCallMinutes = floor($addedDurationThisCallSeconds / 60);

        // $oldDurationMinutes는 기존과 동일하게 가져옴
        $oldDurationMinutes = (int)($existingPageVisit['duration_minutes'] ?? 0); 

        //error_log("DEBUG update_visit_time Duration Calc: passedSecFromClient=$passedSeconds, addedMin=$addedDurationThisCallMinutes, oldDurMin=$oldDurationMinutes");
        
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

        if ($stmt_update_visit === false) { throw new Exception("Update visit prepare failed: " . mysqli_error($conn)); }
        // 바인딩 타입 다시 확인 (user_id s, user_type s, ip_address s, page_url s, currentTime i, newDurationMinutes i, currentVisitRecordId i)
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
        $affectedRowsUpdate = mysqli_stmt_affected_rows($stmt_update_visit); // 영향을 받은 행 수 확인
        $stmtErrorUpdate = mysqli_stmt_error($stmt_update_visit); // <--- 에러 정보는 닫기 전에 먼저 가져옵니다!
        mysqli_stmt_close($stmt_update_visit);

       // *** 중요 디버깅 로그: UPDATE 쿼리 결과 확인 ***
       //error_log("DEBUG update_visit_time UPDATE Result: visit_id=$currentVisitRecordId, newDuration=$newDurationMinutes, affected_rows=$affectedRowsUpdate, stmt_error=" . $stmtErrorUpdate); // <--- 저장된 변수 사용

        // 2. user_total_durations 테이블 누적 업데이트 (로그인 사용자에게만 해당)
        if ($userId !== null && $addedDurationThisCallMinutes > 0) { 
            $stmt_update_total_user = mysqli_prepare($conn, "
                INSERT INTO user_total_durations (user_id, total_duration_minutes)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE total_duration_minutes = total_duration_minutes + ?
            ");
            if ($stmt_update_total_user === false) { throw new Exception("Update user_total prepare failed: " . mysqli_error($conn)); }
            mysqli_stmt_bind_param($stmt_update_total_user, "sii", $userId, $addedDurationThisCallMinutes, $addedDurationThisCallMinutes);
            mysqli_stmt_execute($stmt_update_total_user);
            mysqli_stmt_close($stmt_update_total_user);
            //error_log("DEBUG update_visit_time TOTAL_USER_DURATIONS Updated for user_id=" . ($userId ?? 'NULL') . " with $addedDurationThisCallMinutes minutes.");
        } 
        // 비회원인 경우, guest_total_durations에 누적
        // user_id가 null이고, 추가된 시간이 0보다 큰 경우
        elseif ($userId === null && $addedDurationThisCallMinutes > 0) {
            $stmt_update_total_guest = mysqli_prepare($conn, "
                INSERT INTO guest_total_durations (client_session_id, total_duration_minutes)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE total_duration_minutes = total_duration_minutes + ?
            ");
            if ($stmt_update_total_guest === false) { throw new Exception("Update guest_total prepare failed: " . mysqli_error($conn)); }
            // client_session_id (s), addedDurationThisCallMinutes (i), addedDurationThisCallMinutes (i)
            mysqli_stmt_bind_param($stmt_update_total_guest, "sii", $clientSessionId, $addedDurationThisCallMinutes, $addedDurationThisCallMinutes);
            mysqli_stmt_execute($stmt_update_total_guest);
            mysqli_stmt_close($stmt_update_total_guest);
            //error_log("DEBUG update_visit_time TOTAL_GUEST_DURATIONS Updated for client_session_id=$clientSessionId with $addedDurationThisCallMinutes minutes.");
        }

    } else {
        // *** 중요 디버깅 로그: 기존 레코드를 찾지 못하고 새 레코드를 삽입하는 경우 ***
        //error_log("DEBUG update_visit_time NO existing record found for clientSessionId=$clientSessionId, pageTitle=$pageTitle. INSERTING new one.");

        $stmt_insert_visit = mysqli_prepare($conn, "
            INSERT INTO user_visits
            (client_session_id, php_session_id, user_id, user_type, ip_address, page_url, page_title, start_time, last_activity_time, duration_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?)
        ");
        if ($stmt_insert_visit === false) { throw new Exception("Insert visit prepare failed: " . mysqli_error($conn)); }
        
        $initialDuration = 0; 
        // 바인딩 타입 다시 확인 (clientSessionId s, currentPhpSessionId s, userId s, userType s, ipAddress s, pageUrl s, pageTitle s, currentTime i, currentTime i, initialDuration i)
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
            $initialDuration 
        );
        mysqli_stmt_execute($stmt_insert_visit);
        $affectedRowsInsert = mysqli_stmt_affected_rows($stmt_insert_visit);
        $lastInsertId = mysqli_insert_id($conn); // INSERT된 레코드의 PK
        $stmtErrorInsert = mysqli_stmt_error($stmt_insert_visit); // <--- 에러 정보는 닫기 전에 먼저 가져옵니다!
        mysqli_stmt_close($stmt_insert_visit);
        //error_log("DEBUG update_visit_time INSERT Result: clientSessionId=$clientSessionId, pageTitle=$pageTitle, affected_rows=$affectedRowsInsert, last_insert_id=$lastInsertId, stmt_error=" . mysqli_stmt_error($stmt_insert_visit));
    }
    
    $response['status'] = 'success';
    $response['message'] = '방문 시간 업데이트 완료';

} catch (Exception $e) {
    //error_log('ERROR update_visit_time Exception: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine());
    $response['message'] = '방문 시간 업데이트 중 예외 발생';
} finally {
    if ($conn) mysqli_close($conn);
}

echo json_encode($response);
exit;
?>