<?php
// cancel_batch.php
// 특정 배치 작업을 취소 요청하는 API

header('Content-Type: application/json');

// DB 연결
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php';

// POST 요청으로부터 history_id를 받습니다.
$request_body = file_get_contents('php://input');
$data = json_decode($request_body, true);

$historyId = $data['history_id'] ?? null;
$userId = $data['user_id'] ?? null; // 취소 요청 사용자 ID (선택 사항)

if (empty($historyId)) {
    echo json_encode(['success' => false, 'message' => '취소할 history_id가 필요합니다.']);
    exit;
}

$conn->begin_transaction(); // 트랜잭션 시작

try {
    // 1. 트랜잭션 시작 (이미 되어 있지 않다면)
    // $conn->begin_transaction(); // 필요한 경우 추가 (기존에 이미 설정되어 있다면 생략)

    // 2. 해당 history_id의 상태를 'canceled'로 업데이트 (마스터 작업)
    // 'processing' 상태일 때만 취소 요청을 받도록 제한합니다.
    $updateMasterStmt = $conn->prepare("UPDATE upload_history SET status = 'canceled', finished_at = NOW(), log_message = '사용자 요청에 의해 취소됨' WHERE id = ? AND status = 'processing'");
    if (!$updateMasterStmt) {
        throw new Exception("업로드 마스터 업데이트 쿼리 준비 실패: " . $conn->error);
    }
    $updateMasterStmt->bind_param("i", $historyId);
    $updateMasterStmt->execute();
    
    if ($updateMasterStmt->affected_rows === 0) {
        // 이미 취소되었거나, 완료/실패 상태여서 업데이트가 안 된 경우
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => '작업을 취소할 수 없습니다. 이미 완료되었거나 취소된 작업입니다.']);
        exit;
    }
    $updateMasterStmt->close();

    // ===>>> 추가/수정될 코드 블록 시작 - WHERE 절에 status = 'processing' 조건 추가 <<<===
    // 3. 해당 마스터 작업의 모든 하위(자식) 작업들을 'canceled'로 업데이트
    // parent_history_id가 현재 $historyId인 경우 중 'processing' 상태인 자식 작업만 업데이트합니다.
    $updateChildrenStmt = $conn->prepare("UPDATE upload_history SET status = 'canceled', finished_at = NOW(), log_message = '업로드 마스터 작업 취소로 인해 중단됨' WHERE parent_history_id = ? AND status = 'processing'");
    if (!$updateChildrenStmt) {
        throw new Exception("자식 업데이트 쿼리 준비 실패: " . $conn->error);
    }
    $updateChildrenStmt->bind_param("i", $historyId);
    $updateChildrenStmt->execute();
    
    $affectedChildren = $updateChildrenStmt->affected_rows;
    $updateChildrenStmt->close();
    // ===>>> 추가/수정될 코드 블록 끝 <<<===


    // 4. upload_logs에 취소 메시지 기록
    $logMessage = "사용자 요청에 의해 작업(ID: {$historyId})이 취소되었습니다.";
    if ($userId) {
        $logMessage .= " (요청자 user_id: {$userId})";
    }
    // 자식 작업들도 취소되었다는 정보 추가
    if ($affectedChildren > 0) {
        $logMessage .= " (하위 작업 {$affectedChildren}개 포함)";
    }

    $logStmt = $conn->prepare("INSERT INTO upload_logs (history_id, log_message, level) VALUES (?, ?, 'INFO')");
    if (!$logStmt) {
        throw new Exception("로그 삽입 쿼리 준비 실패: " . $conn->error);
    }
    $logStmt->bind_param("is", $historyId, $logMessage);
    $logStmt->execute();
    $logStmt->close();

    $conn->commit(); // 트랜잭션 커밋
    echo json_encode(['success' => true, 'message' => '작업 취소 요청이 성공적으로 처리되었습니다. (하위 작업 ' . $affectedChildren . '개 포함)']);

} catch (Exception $e) {
    $conn->rollback(); // 오류 발생 시 롤백
    //error_log("Failed to cancel batch job (ID: {$historyId}): " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '작업 취소 중 오류가 발생했습니다.']);
} finally {
    // DB 연결이 된 경우에만 닫습니다.
    if (isset($conn) && $conn) {
        $conn->close();
    }
}
?>