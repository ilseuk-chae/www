<?php
// trigger_buildingregister_batch_cli.php

// CLI 실행 강제 (안정성 확보)
if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only be executed via CLI." . PHP_EOL);
    exit(1);
}

// 환경 설정
error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(0);
ini_set('memory_limit', '-1');

$script_root = dirname(__FILE__); // /var/www/tody/html/front/back/admin/
$project_base = dirname($script_root, 1); // /var/www/tody/html/front/back/ (admin에서 2단계 위로)

require_once $project_base . '/00-include/dbconnect.php';
require_once $project_base . '/00-include/common.php';
require_once $project_base . '/admin/batch_helpers.php'; // admin 폴더도 common.php와 같은 레벨에 있으니 경로 수정

//require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'; 
//require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php'; 
//require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/admin/batch_helpers.php'; 


// CLI 인자 파싱
$cliOptions = [];
foreach (array_slice($argv, 1) as $arg) {
    if (strpos($arg, '=') !== false) {
        [$key, $value] = explode('=', $arg, 2);
        $cliOptions[$key] = $value;
    }
}

$parentHistoryId = (int) ($cliOptions['historyId'] ?? 0); // 마스터 historyId
$sidoCdsString = $cliOptions['sidoCds'] ?? ''; // 콤마로 구분된 시도 코드 문자열
$sidoCds = explode(',', $sidoCdsString);
$resetType = $cliOptions['reset'] ?? 'false'; // 'yes' 또는 'false'

//error_log("[DEBUG] Master History ID : " . $parentHistoryId . " sidoCds : " . $sidoCdsString);

if ($parentHistoryId === 0 || empty($sidoCdsString)) {
    // parentHistoryId가 없으면 로그를 남길 수 없음, 그냥 종료
    fwrite(STDERR, "Missing historyId or sidoCds for batch worker. Exiting.\n");
    exit(1);
}

// 스크립트 시작 시간 기록
$startTimeTotal = microtime(true);

$overallErrors = 0;
$processedSidoCount = 0;

// 마스터 작업 초기 상태 업데이트: 'processing' 상태 유지, log_message 업데이트
if($resetType === 'true' || $resetType === 'yes' || $resetType === 1) {
    update_history_status($parentHistoryId, 'processing', '건축물대장 데이터를 가져오기 작업 시작', $conn, false);
    log_to_db($parentHistoryId, "건축물대장 데이터를 가져오기 마스터 작업 시작. 대상 시도: {$sidoCdsString}", $conn, 'INFO');

    // 1.초기화 스크립트 실행 (마스터 작업에 속함)
    log_to_db($parentHistoryId, "전체 건축물대장 DB데이터 초기화 스크립트 실행.", $conn, 'INFO');
    $resetCommand = 'php ' .$project_base . '/admin/buildingregister_DB_init_helper.php ' .
        escapeshellarg('historyId=' . $parentHistoryId) . ' ' .
        escapeshellarg('sidoCds=' . $sidoCdsString) . 
        ' 2>&1';   // ← stdout + stderr 받기
    $resetOutput = shell_exec($resetCommand); // 헬퍼 스크립트의 표준 출력을 받음

    if ($resetOutput === null) {
        log_to_db($parentHistoryId, "건축물대장 DB 초기화 실행 자체 실패", $conn, 'ERROR');
        update_history_status($parentHistoryId,'failed',"건축물대장 DB 초기화 실행 실패로 마스터 작업 종료",$conn, true);
        exit(1);
    }

    if (strpos($resetOutput, '"status":"SUCCESS"') === false) {
        log_to_db( $parentHistoryId,"건축물대장 DB 초기화 실패. 출력: {$resetOutput}",$conn,'ERROR');
        update_history_status($parentHistoryId,'failed',"건축물대장 DB 초기화 실패로 마스터 작업 종료",$conn, true);
        exit(1);
    }

    log_to_db($parentHistoryId, "건축물대장 DB데이터 초기화 완료. " . $resetOutput, $conn, 'INFO');
} else {
    log_to_db($parentHistoryId, "실행 전 reset을 체크하지 않아서 DB데이터 초기화 작업을 하지 않습니다.", $conn, 'INFO');
}

$success = true;

// 각 시도 코드별 순차 처리 루프 (여기서 시도별 작업을 처리합니다!)
foreach ($sidoCds as $sidoCd) {

    // =============================================================
    // === 1. 각 Sido 처리 시작 전, 마스터 작업 취소 여부 확인 ===
    // =============================================================
    check_cancellation($parentHistoryId, $conn);

    $currentSidoStartTime = microtime(true);
    $sidoChildHistoryId = null; // 현재 Sido 작업의 고유한 historyId
    $sidoErrors = 0; // 현재 Sido 작업의 오류 수

    $sidoCd = trim($sidoCd);
    if (empty($sidoCd)) continue;

    try {
        // 1. 각 시도 작업에 대한 upload_history 레코드 생성
        $stmt = $conn->prepare("INSERT INTO upload_history (task_type, sido_param, status, started_at, parent_history_id, log_message) VALUES (?, ?, ?, NOW(), ?, ?)");
        //$taskType = 'landcharacteristics_sido'; // 토지특성정보 시도별 캐시 타입
        $taskType = 'buildingregister'; // 토지특성정보 시도별 캐시 타입
        $status = 'processing';
        $subLogMessage = "Sido {$sidoCd} 건축물대장 데이터를 가져오기 작업 시작.";
        $stmt->bind_param("sssis", $taskType, $sidoCd, $status, $parentHistoryId, $subLogMessage);
        $stmt->execute();
        $sidoChildHistoryId = $conn->insert_id;
        $stmt->close();

        if ($sidoChildHistoryId === 0) {
            throw new Exception("Sido {$sidoCd}의 upload_history 레코드 생성 실패: " . $conn->error);
        }

        //log_to_db($sidoChildHistoryId, "Sido {$sidoCd} 토지특성정보 캐시 작업 시작.", $conn, 'INFO');
        update_history_status($sidoChildHistoryId, 'processing', "Sido {$sidoCd} 건축물대장 데이터를 가져오기 작업 초기화 중.", $conn);

        // =============================================================
        // === 2. 마스터 작업 취소 여부 재확인 (Sido 자식 작업 시작 전) ===
        // =============================================================
        if(check_cancellation($parentHistoryId, $conn)) return;
        
        // 각 시도별 캐시 스크립트 실행 (헬퍼 스크립트가 log_to_db를 내부적으로 사용해야 합니다)
        // 헬퍼 스크립트에도 historyId, sidoCd를 넘겨주도록 수정 필요
        $command = 'php ' . $project_base . '/admin/download_buildingregister_fast_helper.php ' .
                   escapeshellarg('historyId=' . $parentHistoryId) . ' ' .
                   escapeshellarg('sidoCds=' . $sidoCd) . 
                   ' 2>&1'; // <-- 여기 ' 2>&1' 부분을 추가합니다.
        //log_to_db($sidoChildHistoryId, "실행될 헬퍼 명령어: " . $command, $conn, 'DEBUG');                   
        $output = trim((string)shell_exec($command));
        if ($output === '') {
            throw new Exception('CLI 워커 실행 실패 (PID 없음)');
        }

        if (strpos($output, 'SUCCESS') === false) {
            throw new Exception("Sido {$sidoCd} 건축물대장 데이터를 가져오기 생성 실패: " . $output);
        }
        $sidoFinalStatus = 'success';

    } catch (Exception $e) {
        $logMessage = "Sido {$sidoCd} 건축물대장 데이터를 가져오기 처리 중 오류 발생: " . $e->getMessage();
        log_to_db($sidoChildHistoryId ?: $parentHistoryId, $logMessage, $conn, 'ERROR'); // 자식 ID 없으면 마스터 ID에 기록
        $sidoErrors++;
        $sidoFinalStatus = 'failed';
    } finally {
        $currentSidoDuration = microtime(true) - $currentSidoStartTime;
        $hours = (int)floor($currentSidoDuration / 3600);
        $minutes = (int)fmod(floor($currentSidoDuration / 60), 60);
        $seconds = (int)round(fmod($currentSidoDuration, 60));
        $currentSidoDurationFormatted = sprintf("%02d시 %02d분 %02d초", $hours, $minutes, $seconds);

        // --- 수정된 부분: 헬퍼 스크립트의 출력에서 totalProcessed 건수 파싱 ---
        $processedCount = 0;
        
        // 1️⃣ JSON 블록 추출 (앞에 CLI 로그가 붙어 있는 경우 대응)
        if (preg_match('/(\{.*\})/s', $output, $jsonMatch)) {
            $json = json_decode($jsonMatch[1], true);

            if (json_last_error() === JSON_ERROR_NONE && isset($json['totalProcessedCount'])) {
                $processedCount = (int)$json['totalProcessedCount'];
            }
        }
        // 2️⃣ fallback: 기존 CLI 텍스트 포맷 대응 ("총 N건 처리")
        elseif (preg_match('/총\s*(\d+)\s*건\s*처리/', $output, $matches)) {
            $processedCount = (int)$matches[1];
        }
        // 3️⃣ 둘 다 실패 시 에러 로그
        else {
            log_to_db($sidoChildHistoryId, "[ERROR] 헬퍼 스크립트 출력에서 처리된 건수를 파싱하지 못했습니다. 출력: {$output}", $conn, 'ERROR');
        }
        
        $sidoFinalMessage = "Sido {$sidoCd} 건축물대장 데이터를 가져오기 완료.(오류: {$sidoErrors}건) 총 {$processedCount}건 처리. 소요 시간: {$currentSidoDurationFormatted}.";
        log_to_db($sidoChildHistoryId ?: $parentHistoryId, $sidoFinalMessage, $conn, ($sidoErrors > 0) ? 'ERROR' : 'INFO');
        if ($sidoChildHistoryId) { // 자식 ID가 있는 경우에만 업데이트
            update_history_status($sidoChildHistoryId, $sidoFinalStatus, $sidoFinalMessage, $conn,true);
        }
        $overallErrors += $sidoErrors;
        $processedSidoCount++;
    }
} // end foreach Sido

// --- 마스터 작업 (parentHistoryId)의 최종 상태 업데이트 ---
$endTimeTotal = microtime(true);
$durationTotal = $endTimeTotal - $startTimeTotal;
$hours = (int)floor($durationTotal / 3600);
$minutes = (int)fmod(floor($durationTotal / 60), 60);
$seconds = (int)round(fmod($durationTotal, 60));
$durationTotalFormatted = sprintf("%02d시 %02d분 %02d초", $hours, $minutes, $seconds);

$masterFinalStatus = ($overallErrors > 0) ? 'failed' : 'success';
$masterFinalMessage = "건축물대장 데이터를 가져오기 마스터 배치 작업 완료 (총 시도: " . count($sidoCds) . ", 성공 시도: {$processedSidoCount}, 총 에러: {$overallErrors}). 총 소요 시간: {$durationTotalFormatted}.";

log_to_db($parentHistoryId, $masterFinalMessage, $conn, ($overallErrors > 0) ? 'ERROR' : 'INFO');
update_history_status($parentHistoryId, $masterFinalStatus, $masterFinalMessage, $conn, true);


if ($conn) $conn->close();

exit(0);

?>