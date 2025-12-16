<?php
// get_last_batch_id.php
header('Content-Type: application/json');
// ===> 이 require_once 경로가 정확한지 확인해 주세요 <===
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'; // DB 연결

$taskType = $_GET['task_type'] ?? null;

if (!$taskType) {
    echo json_encode(['success' => false, 'message' => 'task_type이 필요합니다.']);
    exit;
}

$historyId = null;
try {
    // 가장 최근의 배치 이력을 찾습니다.
    $stmt = $conn->prepare("
        SELECT id FROM upload_history 
        WHERE task_type = ? AND status = 'processing' AND parent_history_id IS NULL 
        ORDER BY id DESC 
        LIMIT 1"
    );

    // ===> $conn 객체가 dbconnect.php에서 제대로 초기화되었는지, prepare() 호출 전 유효한지 확인 <===
    if ($stmt === false) {
        echo json_encode(['success' => false, 'message' => 'SQL 준비 실패: ' . $conn->error]);
        throw new Exception("SQL Prepare failed: " . $conn->error);
        exit;
    }

    // ===> $conn 객체가 dbconnect.php에서 제대로 초기화되었는지, prepare() 호출 전 유효한지 확인 <===
    if (!$stmt) {
        throw new Exception("SQL Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("s", $taskType);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        $historyId = $row['id'];
    }
    $stmt->close();

    if ($historyId !== null) {
        echo json_encode(['success' => true, 'history_id' => $historyId]);
    } else {
        echo json_encode(['success' => false, 'history_id' => null, 'message' => '진행 중인 마스터 작업이 없습니다.']);
    }

} catch (Exception $e) {
    // 이곳에서 발생하는 에러는 JSON이 아니라 HTML 에러 메시지가 될 가능성이 높음.
    error_log("Failed to get last batch ID for {$taskType}: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '최신 배치 ID 조회 중 오류 발생.']);
} finally {
    if ($conn) {
        $conn->close();
    }
}
?>