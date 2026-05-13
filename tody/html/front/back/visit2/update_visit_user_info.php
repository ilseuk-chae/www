<?php
// 파일 위치: front\back\visit2\update_visit_user_info.php

header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version, Content-Type");
header("Content-Type: application/json; charset=utf-8");

session_start();

// dbconnect.php는 기존 경로를 그대로 사용한다고 가정
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'); 

$response = ['status' => 'error', 'message' => '처리 중 오류 발생'];

if (!isset($conn) || !($conn instanceof mysqli)) {
    //error_log('update_visit_user_info.php: MySQLi 연결 객체($conn)가 유효하지 않습니다.');
    $response['message'] = '데이터베이스 연결 문제 (초기화 실패)';
    echo json_encode($response);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    $clientSessionId = $input['clientSessionId'] ?? null; 
    $userId = $input['userId'] ?? null;             
    $userType = $input['userType'] ?? 'registered'; 

    if (!$clientSessionId || !$userId) {
        $response['message'] = '필수 데이터 (clientSessionId, userId) 누락';
        echo json_encode($response);
        exit;
    }

    $currentPhpSessionId = session_id();

    mysqli_begin_transaction($conn);

    // 1. 해당 client_session_id와 php_session_id에 해당하는 익명 user_visits 레코드들을 로그인 사용자로 업데이트
    $stmt_update_visits = mysqli_prepare($conn, "
        UPDATE user_visits
        SET
            user_id = ?,
            user_type = ?
        WHERE client_session_id = ? AND php_session_id = ? AND user_id IS NULL; -- user_id가 NULL인 경우에만 업데이트
    ");
    if ($stmt_update_visits === false) { throw new Exception("mysqli_prepare failed: " . mysqli_error($conn)); }
    // user_id (s), userType (s), clientSessionId (s), currentPhpSessionId (s)
    mysqli_stmt_bind_param($stmt_update_visits, "ssss", $userId, $userType, $clientSessionId, $currentPhpSessionId); 
    mysqli_stmt_execute($stmt_update_visits);
    $affected_rows_visits = mysqli_stmt_affected_rows($stmt_update_visits);
    mysqli_stmt_close($stmt_update_visits);

    // 2. user_id가 업데이트된 익명 세션이 있다면, 해당 세션들의 체류 시간을 user_total_durations에 누적
    if ($affected_rows_visits > 0) { 
        // 2-1. 해당 client_session_id와 php_session_id에 연결된 모든 user_visits 레코드들의 total_duration_minutes 합계 조회
        $stmt_select_total_duration = mysqli_prepare($conn, "
            SELECT SUM(duration_minutes) AS total_duration_to_accumulate
            FROM user_visits
            WHERE client_session_id = ? AND php_session_id = ? AND user_id = ?; -- 업데이트된 user_id로 조회
        ");
        if ($stmt_select_total_duration === false) { throw new Exception("mysqli_prepare failed: " . mysqli_error($conn)); }
        // clientSessionId (s), currentPhpSessionId (s), userId (s)
        mysqli_stmt_bind_param($stmt_select_total_duration, "sss", $clientSessionId, $currentPhpSessionId, $userId); 
        mysqli_stmt_execute($stmt_select_total_duration);
        mysqli_stmt_bind_result($stmt_select_total_duration, $totalDurationToAccumulate);
        mysqli_stmt_fetch($stmt_select_total_duration);
        mysqli_stmt_close($stmt_select_total_duration);

        if ($totalDurationToAccumulate !== null && $totalDurationToAccumulate > 0) {
            // 2-2. user_total_durations 테이블에 해당 사용자(user_id)의 total_duration_minutes 누적 업데이트
            $stmt_update_total_user = mysqli_prepare($conn, "
                INSERT INTO user_total_durations (user_id, total_duration_minutes)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE total_duration_minutes = total_duration_minutes + ?
            ");
            if ($stmt_update_total_user === false) { throw new Exception("Update user_total prepare failed: " . mysqli_error($conn)); }
            mysqli_stmt_bind_param($stmt_update_total_user, "sii", $userId, $totalDurationToAccumulate, $totalDurationToAccumulate);
            mysqli_stmt_execute($stmt_update_total_user);
            mysqli_stmt_close($stmt_update_total_user);

            // *** 추가: guest_total_durations에서 해당 클라이언트 세션 ID 기록 삭제 (이관되었으므로) ***
            $stmt_delete_guest_total = mysqli_prepare($conn, "
                DELETE FROM guest_total_durations WHERE client_session_id = ?
            ");
            if ($stmt_delete_guest_total === false) { throw new Exception("Delete guest_total prepare failed: " . mysqli_error($conn)); }
            mysqli_stmt_bind_param($stmt_delete_guest_total, "s", $clientSessionId);
            mysqli_stmt_execute($stmt_delete_guest_total);
            mysqli_stmt_close($stmt_delete_guest_total);

            mysqli_commit($conn); 
            $response['status'] = 'success';
            $response['message'] = '방문자 정보 연결 및 체류 시간 누적 완료 (게스트 시간 이관됨)';
        } else {
            // (추가: 이관할 게스트 시간은 없어도, 혹시 게스트 기록이 있다면 삭제)
            $stmt_delete_guest_total = mysqli_prepare($conn, "
                DELETE FROM guest_total_durations WHERE client_session_id = ?
            ");
            if ($stmt_delete_guest_total === false) { throw new Exception("Delete guest_total prepare failed: " . mysqli_error($conn)); }
            mysqli_stmt_bind_param($stmt_delete_guest_total, "s", $clientSessionId);
            mysqli_stmt_execute($stmt_delete_guest_total);
            mysqli_stmt_close($stmt_delete_guest_total);

            mysqli_commit($conn); 
            $response['status'] = 'success';
            $response['message'] = '방문자 정보는 연결되었으나 누적할 체류 시간 정보 없음 (게스트 시간 삭제됨)';
        }
    } else {
        mysqli_commit($conn); 
        $response['status'] = 'success';
        $response['message'] = '방문자 정보는 이미 연결되었거나 해당 세션을 찾을 수 없음'; 
    }

} catch (Exception $e) {
    mysqli_rollback($conn); 
    //error_log('update_visit_user_info.php: 방문자 정보 업데이트 실패: ' . $e->getMessage());
    $response['message'] = '방문자 정보 업데이트 중 예외 발생';
} finally {
    if ($conn) mysqli_close($conn);
}

echo json_encode($response);
exit;
?>