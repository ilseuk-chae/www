<?php
// cancel_batch_new.php (이 파일 이름으로 새로 만듭니다)

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'; 
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php'; 
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/admin/batch_helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $historyId = 0;

    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['history_id'])) {
        $historyId = (int) $input['history_id'];
    } else if (isset($_POST['history_id'])) {
        $historyId = (int) $_POST['history_id'];
    }

    if ($historyId === 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '유효한 historyId를 입력해주세요.']);
        exit;
    }

    $conn->begin_transaction(); // 트랜잭션 시작

    try {
        // 1. 요청된 historyId의 상태를 확인합니다.
        // `parent_history_id`도 함께 가져옵니다.
        $select_sql = "SELECT status, parent_history_id FROM upload_history WHERE id = ?";
        $stmt = $conn->prepare($select_sql);
        if ($stmt === false) {
            throw new Exception("Failed to prepare select statement: " . $conn->error);
        }
        $stmt->bind_param('i', $historyId);
        $stmt->execute();
        $stmt->bind_result($currentStatus, $parentHistoryId);
        $stmt->fetch();
        $stmt->close();

        if (!$currentStatus) { // 해당 ID의 작업이 존재하지 않는 경우
            $conn->rollback();
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => '해당 ID의 작업이 존재하지 않습니다.']);
            exit;
        }

        if ($currentStatus !== 'processing') { // 작업이 이미 'processing'이 아니면 취소할 필요 없음
            $conn->rollback();
            http_response_code(409);
            echo json_encode(['status' => 'error', 'message' => '작업이 이미 완료/실패/취소된 상태입니다.']);
            exit;
        }

        // 2. 현재 요청된 historyId를 포함하여 취소할 대상 ID들을 결정합니다.
        $targetHistoryIds = [$historyId];

        // 만약 요청된 historyId가 마스터 작업이라면, 그 자식 작업들도 찾아서 추가합니다.
        // parent_history_id가 NULL인 경우 (마스터)
        if ($parentHistoryId === NULL) {
            $children_sql = "SELECT id FROM upload_history WHERE parent_history_id = ? AND status = 'processing'";
            $children_stmt = $conn->prepare($children_sql);
            if ($children_stmt === false) {
                throw new Exception("Failed to prepare children select statement: " . $conn->error);
            }
            $children_stmt->bind_param('i', $historyId);
            $children_stmt->execute();
            $children_result = $children_stmt->get_result();
            while ($row = $children_result->fetch_assoc()) {
                $targetHistoryIds[] = $row['id'];
            }
            $children_stmt->close();
        }

        // 3. 결정된 모든 대상 ID들의 상태를 'canceled'로 업데이트합니다.
        // `IN` 절을 사용하기 위해 ID 목록을 콤마로 구분된 문자열로 변환합니다.
        $idList = implode(',', array_map('intval', $targetHistoryIds));
        
        $update_sql = "UPDATE upload_history SET status = 'canceled', log_message = '사용자 중단 요청 및 작업 취소.', finished_at = NOW() WHERE id IN ($idList) AND status = 'processing'";
        $update_stmt = $conn->prepare($update_sql);
        if ($update_stmt === false) {
            throw new Exception("Failed to prepare update statement: " . $conn->error);
        }
        $update_stmt->execute();
        $affected_rows = $update_stmt->affected_rows;
        $update_stmt->close();

        if ($affected_rows > 0) {
            // 모든 대상 ID에 대해 로그를 남깁니다.
            foreach ($targetHistoryIds as $targetId) {
                log_to_db($targetId, "사용자로부터 중단 요청 접수 및 작업 취소됨. (마스터/하위 작업 포함)", $conn, 'WARN');
            }
            $conn->commit(); // 모든 변경사항 커밋
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => '중단 요청이 접수되어 해당 작업 및 관련 하위 작업들이 취소되었습니다.']);
        } else {
            $conn->rollback(); // 변경된 것이 없다면 롤백
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => '해당 ID의 작업이 현재 진행 중이 아니거나 이미 완료/취소/실패된 상태입니다. (Affected rows: 0)']);
        }

    } catch (Exception $e) {
        $conn->rollback(); // 오류 발생 시 롤백
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => '중단 요청 처리 중 오류 발생: ' . $e->getMessage()]);
    } finally {
        $conn->close();
    }

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POST 요청만 허용됩니다.']);
}
