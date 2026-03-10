<?php
// trigger_cache_batch.php
// 이 파일은 웹 요청을 받아 generate_emd_caches.php CLI 스크립트를
// 모든 선택된 시도를 한 번에 인자로 전달하여 백그라운드에서 실행합니다.

header('Content-Type: application/json');

$response = ['success' => false, 'message' => '알 수 없는 오류가 발생했습니다.'];

// CLI 환경에서 DOCUMENT_ROOT가 설정되지 않을 수 있으므로 대비
if (php_sapi_name() == 'cli' && !isset($_SERVER['DOCUMENT_ROOT'])) {
    $_SERVER['DOCUMENT_ROOT'] = '/www/tody/html'; // 실제 웹 서버 경로에 맞게 변경하세요.
}

// DB 연결
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'; // mysqli 객체 $conn 제공
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/admin/batch_helpers.php';


// 1. 요청 메서드 및 입력값 유효성 검사
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = '잘못된 요청 메서드입니다.';
    echo json_encode($response);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$sidoParamRaw = isset($input['sido']) ? trim($input['sido']) : null;
$baseYear = isset($input['baseYear']) ? trim($input['baseYear']) : null;
$baseMonth = isset($input['baseMonth']) ? trim($input['baseMonth']) : null;
$userId = isset($input['user_id']) ? trim($input['user_id']) : null; // 프론트엔드에서 user_id를 넘겨준다면 사용
$resetType = (!empty($input['reset']) && $input['reset'] === true) ? 'true' : 'false';

if (empty($sidoParamRaw)) {
    $response['message'] = 'Sido 파라미터가 누락되었습니다.';
    echo json_encode($response);
    exit;
}

if (!preg_match('/^(ALL|\d{2}(,\d{2})*)$/', $sidoParamRaw)) {
    $response['message'] = '유효하지 않은 sido 파라미터 형식입니다.';
    echo json_encode($response);
    exit;
}

// supported sido codes (generate_emd_caches.php의 $allSupportedSidoCodes와 일치해야 함)
$allSupportedSidoCodesForTrigger = ['11','26','27','28','29','30','31','36','41','43','44','46','47','48','50','51','52']; 

//error_log("(trigger_cache_batch) sidoParamRaw: {$sidoParamRaw}");

$sidoCodesToPass = []; // generate_emd_caches.php에 전달할 실제 시도 코드들
if ($sidoParamRaw === 'ALL') {
    $sidoCodesToPass = $allSupportedSidoCodesForTrigger;
} else {
    $inputSidoCodes = explode(',', $sidoParamRaw);
    foreach ($inputSidoCodes as $sidoCode) {
        $sidoCode = trim($sidoCode);
        if (in_array($sidoCode, $allSupportedSidoCodesForTrigger)) {
            $sidoCodesToPass[] = $sidoCode;
        } else {
            //error_log("Invalid or unsupported Sido code '{$sidoCode}' in trigger_cache_batch. It will be ignored.");
        }
    }
    $sidoCodesToPass = array_unique($sidoCodesToPass);
}

if (empty($sidoCodesToPass)) {
    $response['message'] = '유효한 시도 코드가 없어 작업을 시작할 수 없습니다.';
    echo json_encode($response);
    $conn->close();
    exit;
}

// generate_emd_caches.php에 전달할 콤마로 구분된 시도 코드 문자열
$sidoParamForGenerateScript = implode(',', $sidoCodesToPass);

$phpExecutable = '/usr/bin/php'; // 또는 'php', 혹은 '/opt/lampp/bin/php' 등 PHP 실행 파일의 전체 경로
$scriptPath = __DIR__ . '/generate_emd_caches.php'; 
// === 수정: $baseLogDir를 절대 경로로 구성 ===
// __DIR__은 현재 스크립트의 절대 경로 (예: /var/www/tody/html/front/back/admin)
// 웹 루트 (/var/www/tody/html)로 가려면 상위 3개 디렉토리가 필요합니다.
// 웹 루트에서 logs 폴더 (/var/www/tody/logs/)로 가려면 다시 상위 디렉토리로 이동해야 합니다.
// 즉, /var/www/tody/html/front/back/admin --> /var/www/tody/html --> /var/www/tody --> /var/www/tody/logs
// 즉, __DIR__에서 4단계 상위 디렉토리로 가서 logs 폴더로 가야 합니다.
$baseLogDir = realpath(__DIR__ . '/../../../../logs') . '/'; // realpath()를 사용하여 절대 경로 확보 및 슬래시 추가

// 2. upload_history 테이블에 '마스터' 레코드 생성
$masterHistoryId = null;
$overallSuccess = false;
$overallMessage = '';

try {
    $stmt = $conn->prepare("INSERT INTO upload_history 
        (task_type, sido_param, end_year_month, status, started_at, triggered_by_user_id, log_message, parent_history_id) 
        VALUES (?, ?, ?, ?, NOW(), ?, ?, NULL)");
    $taskType = 'rediscache';
    $status = 'processing';
    $formattedMonth = sprintf("%02d", $baseMonth);
    $baseDateForLog = "{$baseYear}/{$formattedMonth}"; // 로그용으로 파라미터 보관

    $logMessage = "업로드 마스터 배치 작업 시작 (대상 시도: {$sidoParamForGenerateScript}, 기준 연월: {$baseDateForLog}, 리셋 유형: {$resetType})";
    $stmt->bind_param("ssssss", $taskType, $sidoParamForGenerateScript, $baseDateForLog, $status, $userId, $logMessage);
    $stmt->execute();
    $masterHistoryId = $conn->insert_id;

    if ($masterHistoryId === 0) {
        throw new Exception("upload_history 마스터 레코드 생성 실패: " . $conn->error);
    }

    // 시도별 로그 파일 경로 설정: 이제 $logFile은 완전한 절대 경로가 됩니다.
    //$logFile = $baseLogDir . 'emd_cache_batch_master_' . $masterHistoryId . '.log';
    $logFile = $baseLogDir . 'upload_batch_master_' . $masterHistoryId . '.log';

    // 3. generate_emd_caches.php 스크립트를 모든 시도 코드를 인자로 백그라운드에서 실행
    $command = sprintf(
        "%s %s --sido=%s --parent-history-id=%d --reset==%s --base-year==%s --base-month==%s> %s 2>&1 &",
        escapeshellarg($phpExecutable),
        escapeshellarg($scriptPath),
        escapeshellarg($sidoParamForGenerateScript),
        $masterHistoryId,
        $resetType,
        escapeshellarg($baseYear),
        escapeshellarg($baseMonth),
        escapeshellarg($logFile) // $logFile은 이미 절대 경로입니다.
    );
    //error_log("(trigger_cache_batch)Executing command: " . $command);

    $output = []; 
    $return_var = null;

    exec($command, $output, $return_var);

    // 명령 실행 (백그라운드에서 실행)
    if ($return_var === 0) {
        $overallSuccess = true;
        $overallMessage = "업로드 마스터 배치 작업이 백그라운드에서 시작되었습니다. 마스터 이력 ID: {$masterHistoryId}. 로그 파일: " . basename($logFile);
    } else {
        // exec 명령 시작 실패 시 이력 상태 업데이트
        try {
            // === 수정: task_type을 'rediscache'로 변경 ===
            $updateStmt = $conn->prepare("UPDATE upload_history SET status = 'failed', finished_at = NOW(), log_message = ? WHERE id = ?");
            $logMessage = "업로드 배치 스크립트 실행 명령 실패 (return_var: {$return_var}). Output: " . implode("\n", $output);
            $updateStmt->bind_param("si", $logMessage, $masterHistoryId);
            $updateStmt->execute();
        } catch (Exception $e) {
            //error_log("Failed to update upload_history master status after exec failure: " . $e->getMessage());
        }
        $overallMessage = "업로드 마스터 배치 작업을 시작하는 데 실패했습니다. Return Code: {$return_var}";
    }
} catch (Exception $e) {
    //error_log("Error creating master history record or executing batch script: " . $e->getMessage());
    $overallMessage = "업로드 마스터 배치 작업 시작 중 오류 발생: " . $e->getMessage();
    if ($masterHistoryId) {
        try {
            // === 수정: task_type을 'rediscache'로 변경 ===
            $updateStmt = $conn->prepare("UPDATE upload_history SET status = 'failed', finished_at = NOW(), log_message = ? WHERE id = ?");
            $updateStmt->bind_param("si", $overallMessage, $masterHistoryId);
            $updateStmt->execute();
        } catch (Exception $e2) {
            //error_log("Failed to update upload_history master status after initial error: " . $e2->getMessage());
        }
    }
}

$response['success'] = $overallSuccess;
$response['message'] = $overallMessage;
$response['master_history_id'] = $masterHistoryId; // 프론트엔드에서 업로드 마스터 ID를 추적할 수 있도록 반환

echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();
?>