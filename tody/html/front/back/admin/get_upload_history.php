<?php
// get_upload_history.php
// 모든 배치 작업의 이력 목록을 조회하기 위한 API (마스터-하위 관계 포함)

header('Content-Type: application/json');

// DB 연결
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php';

$taskType = $_GET['task_type'] ?? null;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10; // 기본값 10
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0; // 기본값 0

$response = [
    'success' => true,
    'message' => '',
    'data' => [],
    'total_count' => 0 // 총 마스터 작업 수를 위해 추가
];

// 헬퍼 함수 정의 (get_batch_progress.php와 동일하게 사용)
function getStatusText($status) {
    switch ($status) {
        case 'processing': return '처리 중';
        case 'success': return '성공';
        case 'failed': return '실패';
        case 'pending': return '대기 중';
        case 'canceled': return '취소됨';
        default: return '알 수 없음';
    }
}


try {
    // 1. 조건에 맞는 마스터 작업의 총 개수 조회
    $countSql = "SELECT COUNT(*) FROM upload_history WHERE task_type = ? AND parent_history_id IS NULL";
    $countStmt = $conn->prepare($countSql);
    $countStmt->bind_param("s", $taskType);
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $response['total_count'] = $countResult->fetch_row()[0];
    $countStmt->close();

    // 2. 마스터 작업 이력 조회 (parent_history_id가 NULL인 경우)
    $sql = "SELECT id, task_type, sido_param, start_year_month, end_year_month, status, started_at, finished_at, log_message FROM upload_history WHERE task_type = ? AND parent_history_id IS NULL ORDER BY id DESC LIMIT ? OFFSET ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sii", $taskType, $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();

    $masterHistoryIds = [];
    while ($item = $result->fetch_assoc()) {
        $item['status_text'] = getStatusText($item['status']);
        $item['started_at'] = $item['started_at'] ? date('Y. m. d. H:i:s', strtotime($item['started_at'])) : '-';
        $item['finished_at'] = $item['finished_at'] ? date('Y. m. d. H:i:s', strtotime($item['finished_at'])) : '-';
        $item['log_message_summary'] = $item['log_message']; // 마스터의 최종 메시지
        $item['child_tasks'] = []; // 하위 작업을 담을 배열 추가

        $response['data'][] = $item;
        $masterHistoryIds[] = $item['id'];
    }
    $stmt->close();

    // 3. 조회된 마스터 작업에 대한 하위 작업들 조회
    if (!empty($masterHistoryIds)) {
        $placeholders = implode(',', array_fill(0, count($masterHistoryIds), '?'));
        $types = str_repeat('i', count($masterHistoryIds));

        $childSql = "SELECT id, task_type, sido_param, start_year_month, end_year_month, status, started_at, finished_at, log_message, parent_history_id FROM upload_history WHERE parent_history_id IN ({$placeholders}) ORDER BY id ASC";
        $childStmt = $conn->prepare($childSql);
        $childStmt->bind_param($types, ...$masterHistoryIds);
        $childStmt->execute();
        $childResult = $childStmt->get_result();

        $childTasksByParent = [];
        while ($child = $childResult->fetch_assoc()) {
            $child['status_text'] = getStatusText($child['status']);
            $child['started_at'] = $child['started_at'] ? date('Y. m. d. H:i:s', strtotime($child['started_at'])) : '-';
            $child['finished_at'] = $child['finished_at'] ? date('Y. m. d. H:i:s', strtotime($child['finished_at'])) : '-';
            $child['log_message_summary'] = $child['log_message']; // 하위 작업의 최종 메시지

            $childTasksByParent[$child['parent_history_id']][] = $child;
        }
        $childStmt->close();

        // 마스터 작업에 하위 작업들 연결
        foreach ($response['data'] as &$masterItem) {
            if (isset($childTasksByParent[$masterItem['id']])) {
                $masterItem['child_tasks'] = $childTasksByParent[$masterItem['id']];
            }
        }
        unset($masterItem); // 레퍼런스 해제
    }

} catch (Exception $e) {
    error_log("이력 조회 중 오류 발생: " . $e->getMessage());
    $response['success'] = false;
    $response['message'] = '이력 조회 중 오류가 발생했습니다.';
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();

?>