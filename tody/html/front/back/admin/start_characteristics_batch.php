<?php
// api/start_characteristics_batch.php
//웹 화면에서 호출되어 CLI 워커를 백그라운드로 실행시킵니다.

header('Content-Type: application/json');
// CORS 허용 (개발 환경에서 필요할 수 있음)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'; 
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php'; 
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/admin/batch_helpers.php'; 


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $sidoCds = $input['sido'] ?? []; // 배열 형태로 시도 코드들을 받음
    $resetType = (!empty($input['reset']) && $input['reset'] === true) ? 'true' : 'false';
    
    if (empty($sidoCds)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'sidoCds를 입력해주세요.']);
        exit;
    }

    // ====================================================================
    // sidoCds "ALL" 처리 로직 추가 시작
    // ====================================================================
    if (is_string($sidoCds) && strtoupper($sidoCds) === 'ALL') {
        // "ALL"이 문자열로 들어오면, 미리 정의된 전체 시도 코드 배열로 대체
        $sidoCds = ['11','26','27','28','29','30','31','36','41','43','44','46','47','48','50','51','52'];
    } else if (!is_array($sidoCds)) { //// 만약 $sidoCds가 배열이 아니라면 배열로 강제 변환
        if (is_string($sidoCds)) {
            $sidoCds = explode(',', $sidoCds);
        } else { // 그 외의 예상치 못한 타입이라면 빈 배열로
            $sidoCds = [];
        }
    }
    
    // 이제 $sidoCds는 확실히 배열입니다.
    // sidoCds가 비어 있는지 확인하여 메시지 출력
    
    $triggeredByUserId = $input['userId'] ?? ''; // 사용자 ID (선택사항)

    $sidoParam = implode(',', $sidoCds); // DB sido_param 필드에 저장될 문자열

    try {
        // 1. upload_history 테이블에 새로운 작업 이력 추가
        $insert_sql = "INSERT INTO upload_history (task_type, sido_param, status, log_message, triggered_by_user_id, started_at) VALUES (?, ?, ?, ?, ?, NOW())";
        $stmt = $conn->prepare($insert_sql);
        if ($stmt === false) {
            throw new Exception("Failed to prepare history insert statement: " . $conn->error);
        }
        $taskType = 'characteristic'; // 토지특성정보에 맞는 enum 값
        $status = 'processing'; // 처음엔 'processing' 상태로 시작
        $logMessage = '작업 시작 대기 중...';
        $stmt->bind_param('sssss', $taskType, $sidoParam, $status, $logMessage, $triggeredByUserId);
        $stmt->execute();
        $historyId = $stmt->insert_id;
        $stmt->close();

        if ($historyId === 0) {
             throw new Exception("Failed to get historyId after insert.");
        }

        // 2. CLI 워커 스크립트를 백그라운드에서 실행
        // `nohup`으로 프로세스를 분리하고, `&`로 백그라운드 실행. 표준 출력/에러는 nohup.out으로 리다이렉트
        $command = 'nohup php ' . __DIR__ . '/trigger_characteristics_batch_cli.php ' .
                   'historyId=' . $historyId . ' sidoCds=' . escapeshellarg($sidoParam) . 
                   ' reset=' . escapeshellarg($resetType) . 
                   ' > /dev/null 2>&1 & echo $!'; // PID를 반환받기 위함 (선택사항)

        $pid = shell_exec($command); // PID를 받아 추후 kill 명령에 사용할 수 있음
        $conn->commit(); // ★★★ 이 라인이 있어야 변경사항이 DB에 최종 반영됩니다. ★★★

        log_to_db($historyId, "백그라운드 워커 스크립트 실행 시작. historyId: " . trim($historyId) . " pid :" . $pid , $conn);
        //update_history_status($historyId, 'processing', 'batch_cli 실행 중...', $conn, false); // 이미 insert 시 started_at 지정됨

        http_response_code(202); // Accepted
        echo json_encode(['success' => true, 'message' => '토지특성정보 캐시 업로드 작업을 시작합니다.', 'master_history_id' => $historyId, 'pid' => trim($pid)]);

    } catch (Exception $e) {
        if ($conn->in_transaction) { // 트랜잭션 중이었다면 롤백
            $conn->rollback();
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => '작업 시작 실패: ' . $e->getMessage()]);
        // 작업 시작 실패 시 historyId가 있으면 FAILED로 업데이트 (선택사항)
        if (isset($historyId) && $historyId > 0) {
            update_history_status($historyId, 'failed', '작업 시작 중 오류 발생: ' . $e->getMessage(), $conn, true);
        }
    } finally {
        $conn->close();
    }

} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'POST 요청만 허용됩니다.']);
}