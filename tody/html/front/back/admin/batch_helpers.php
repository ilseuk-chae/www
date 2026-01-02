<?php
// batch_helpers.php

// (dbconnect.php가 이미 로드되어 $conn이 유효하다고 가정)

/**
 * 로그 메시지를 upload_logs 테이블에 저장합니다.
 * @param int|null $historyId upload_history.id
 * @param string $message 로그 메시지
 * @param mysqli $conn DB 연결 객체
 * @param string $level 로그 레벨 (INFO, WARN, ERROR)
 */
function log_to_db(?int $historyId, string $message, mysqli $conn, string $level = 'INFO')
{
    // $historyId가 null이면, 로그에 history_id가 null로 들어갑니다 (예: 초기 에러).
    $sql = "INSERT INTO upload_logs (history_id, log_message, level, timestamp) VALUES (?, ?, ?, NOW())";
    $stmt = $conn->prepare($sql);
    if ($stmt) {
        // history_id가 null일 수 있으므로 'i' 대신 's'로 바인딩하거나, null 처리 로직 필요
        // MySQLi bind_param은 null을 지원하지만, PHP 8.1+에서 ?int 타입 힌트와 일치
        $stmt->bind_param("iss", $historyId, $message, $level);
        $stmt->execute();
        $stmt->close();
    } else {
        error_log("Failed to prepare log_to_db statement: " . $conn->error);
    }
}

/**
 * upload_history 테이블의 상태를 업데이트합니다.
 * @param int $historyId upload_history.id
 * @param string $status 새로운 상태 (enum('processing','success','failed','canceled', 'cancel_requested') 중 하나)
 * @param string $logMessage upload_history.log_message에 저장될 메시지
 * @param mysqli $conn DB 연결 객체
 * @param bool $isFinished 작업 완료 여부 (finished_at 업데이트용)
 */
function update_history_status(int $historyId, string $status, string $logMessage, mysqli $conn, bool $isFinished = false)
{
    $sql = "UPDATE upload_history SET status = ?, log_message = ?, started_at = IFNULL(started_at, NOW())"
         . ($isFinished ? ", finished_at = NOW()" : "")
         . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param("ssi", $status, $logMessage, $historyId);
        $stmt->execute();
        $stmt->close();
    } else {
        error_log("[DB_STATUS_UPDATE_FAIL] Failed to update upload_history for ID {$historyId} to status '{$status}': " . $e->getMessage(), 0);
    }
}

/**
 * 현재 작업이 취소 요청되었는지 확인합니다.
 * @param int $historyId upload_history.id
 * @param mysqli $conn DB 연결 객체
 * @return bool 취소 요청 여부
 */
function check_cancellation(int $historyId, mysqli $conn): bool
{
    $stmt = null; // $stmt 변수 초기화
    try { // try-catch 블록 추가하여 예외 처리 강화
        $sql = "SELECT status FROM upload_history WHERE id = ?";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) { // prepare 실패 시
            error_log("[CANCEL_CHECK_FAIL] prepare failed for ID {$historyId}: " . $conn->error);
            return false; // 오류 발생했으므로 취소되지 않은 것으로 간주
        }
        
        $stmt->bind_param("i", $historyId);
        $stmt->execute();

        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            if ($row['status'] === 'canceled') {
                $logMessage = "작업 ID {$historyId}가 취소 요청되어 스크립트를 중단합니다.";
                error_log("[CANCELED] " . $logMessage);
                log_to_db($historyId, $logMessage, $conn, "INFO"); 
                $conn->close(); // 명시적으로 연결 종료
                return true; // 취소되었음을 알림
            }
        } else {
            error_log("[DEBUG_CANCEL] ID {$historyId}에 대한 upload_history 레코드를 찾을 수 없습니다.");
            // 레코드를 찾을 수 없으면 취소된 것이 아니므로 false 반환
        }
        
        // 여기에 원래 return false; 가 필요합니다.
        return false; // 작업이 취소되지 않은 경우 (기본값)
        
    } catch (Exception $e) {
        error_log("[CANCEL_CHECK_FAIL] Exception during check_cancellation for ID {$historyId}: " . $e->getMessage());
        return false; // 예외 발생 시 취소되지 않은 것으로 간주
    } finally {
        if ($stmt) { // finally 블록에서 $stmt가 존재하면 닫음
            $stmt->close();
        }
    }
}

?>