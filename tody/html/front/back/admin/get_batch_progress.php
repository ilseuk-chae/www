<?php
// get_batch_progress.php
// 프론트엔드에서 특정 배치 작업의 현재 상태와 로그를 조회하기 위한 API
header('Content-Type: application/json'); // DB 기반 조회는 JSON 형태로 응답

// CLI 환경에서 DOCUMENT_ROOT가 설정되지 않을 수 있으므로 대비
// DB 연결 (파일 기반 조회 로직 이후에 배치)
if (php_sapi_name() == 'cli' && !isset($_SERVER['DOCUMENT_ROOT'])) {
    $_SERVER['DOCUMENT_ROOT'] = '/www/tody/html'; // 실제 웹 서버 경로에 맞게 변경하세요.
}
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php';

$historyId = $_GET['history_id'] ?? null;

if (empty($historyId)) { // 파일 기반이 아닌 경우 history_id는 필수
    echo json_encode(['success' => false, 'message' => 'history_id가 필요합니다.']);
    exit;
}

$response = [
    'success' => true,
    'master_status' => 'unknown', // 마스터 작업의 최종 상태
    'master_status_text' => '알 수 없음',
    'master_start_year_month' => '-',
    'master_end_year_month' => '-',
    'master_started_at' => '-',
    'master_finished_at' => '-',
    'child_tasks' => [], // 하위 작업들의 요약 정보 (ID, Sido, Status)
    'all_logs' => [] // 모든 관련 로그를 통합하여 시간순 정렬
];

// 헬퍼 함수 정의
function getStatusText($status) {
    switch ($status) {
        case 'processing': return '처리 중';
        case 'success': return '성공'; // 'completed'를 'success'로 변경
        case 'failed': return '실패';
        case 'pending': return '대기 중';
        case 'canceled': return '취소됨'; // 취소 상태 추가 (중단 기능 대비)
        default: return '알 수 없음';
    }
}

// --- 마스터 이력 정보 조회 및 모든 관련 이력 ID 수집 ---
$relatedHistoryIds = []; // 마스터 및 모든 하위 이력 ID를 저장할 배열
try {
    // 먼저 마스터 이력 (self)을 조회
    $stmt = $conn->prepare("SELECT id, task_type, sido_param, start_year_month, end_year_month, status,  started_at, finished_at, parent_history_id FROM upload_history WHERE id = ?");
    $stmt->bind_param("i", $historyId);
    $stmt->execute();
    $result = $stmt->get_result();
    $masterHistory = $result->fetch_assoc();

    if (!$masterHistory) {
        echo json_encode(['success' => false, 'message' => '해당 history_id를 찾을 수 없습니다.']);
        $conn->close();
        exit;
    }

    $response['master_status'] = $masterHistory['status'];
    $response['master_status_text'] = getStatusText($masterHistory['status']);
    $response['master_start_year_month'] = $masterHistory['start_year_month'] ?? '-';
    $response['master_end_year_month'] = $masterHistory['end_year_month'] ?? '-';
    $response['master_started_at'] = $masterHistory['started_at'] ? date('Y. m. d. H:i:s', strtotime($masterHistory['started_at'])) : '-';
    $response['master_finished_at'] = $masterHistory['finished_at'] ? date('Y. m. d. H:i:s', strtotime($masterHistory['finished_at'])) : '-';
    
    // 마스터 이력 자체를 관련 ID에 추가
    $relatedHistoryIds[] = $masterHistory['id'];

    // 하위 이력들을 조회 (마스터의 id가 parent_history_id인 경우)
    $childStmt = $conn->prepare("SELECT id, task_type, sido_param, start_year_month, end_year_month, status, started_at, finished_at, log_message FROM upload_history WHERE parent_history_id = ? ORDER BY id ASC");
    $childStmt->bind_param("i", $masterHistory['id']);
    $childStmt->execute();
    $childResult = $childStmt->get_result();
    while ($child = $childResult->fetch_assoc()) {
        $response['child_tasks'][] = [
            'id' => $child['id'],
            'sido_param' => $child['sido_param'],
            'status' => $child['status'],
            'status_text' => getStatusText($child['status']),
            'start_year_month' => $child['start_year_month'] ?? '-',
            'end_year_month' => $child['end_year_month'] ?? '-',
            'started_at' => $child['started_at'] ? date('Y. m. d. H:i:s', strtotime($child['started_at'])) : '-',
            'finished_at' => $child['finished_at'] ? date('Y. m. d. H:i:s', strtotime($child['finished_at'])) : '-',
            'log_message_summary' => $child['log_message'] // 최종 요약 메시지도 포함
        ];
        $relatedHistoryIds[] = $child['id']; // 하위 이력 ID도 관련 ID에 추가
    }

} catch (Exception $e) {
    error_log("Failed to fetch history info for ID {$historyId} or its children: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '이력 정보 조회 중 오류 발생.']);
    $conn->close();
    exit;
}

// --- 모든 관련 이력의 로그 조회 및 통합 ---
if (!empty($relatedHistoryIds)) {
    // IN 절에 사용할 플레이스홀더를 동적으로 생성
    $placeholders = implode(',', array_fill(0, count($relatedHistoryIds), '?'));
    $types = str_repeat('i', count($relatedHistoryIds)); // 모든 ID는 정수

    try {
        // 모든 관련 이력 ID에 해당하는 로그를 시간순으로 가져옴
        $logStmt = $conn->prepare("SELECT history_id, timestamp, log_message, level FROM upload_logs WHERE history_id IN ({$placeholders}) ORDER BY timestamp ASC, id ASC");
        // PHP 5.6+ splat operator. PHP 5.5 이하는 call_user_func_array 사용
        if (version_compare(PHP_VERSION, '5.6.0', '>=')) {
            $logStmt->bind_param($types, ...$relatedHistoryIds);
        } else {
            $bindParams = array_merge([$types], $relatedHistoryIds);
            call_user_func_array([$logStmt, 'bind_param'], $this->refValues($bindParams)); // refValues 헬퍼 필요
        }
        $logStmt->execute();
        $logResult = $logStmt->get_result();
        while ($log = $logResult->fetch_assoc()) {
            $response['all_logs'][] = [
                'history_id' => $log['history_id'],
                'timestamp' => date('Y. m. d. H:i:s', strtotime($log['timestamp'])),
                'message' => $log['log_message'],
                'level' => $log['level']
            ];
        }
    } catch (Exception $e) {
        error_log("Failed to fetch aggregated logs for history ID {$historyId} and its children: " . $e->getMessage());
    }
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();


// PHP 5.5 이하에서 bind_param을 위한 헬퍼 함수
// function refValues($arr){
//     if (strnatcmp(phpversion(),'5.6') >= 0) return $arr;
//     $refs = array();
//     foreach($arr as $key => $value)
//         $refs[$key] = &$arr[$key];
//     return $refs;
// }

?>