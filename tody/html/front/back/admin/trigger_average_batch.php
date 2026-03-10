<?php
// trigger_average_batch.php

// 초기 설정
ini_set('display_errors', '0'); // 웹 응답으로 에러 출력 방지
ini_set('date.timezone', 'Asia/Seoul');
set_time_limit(0); // 이 스크립트 자체는 오래 걸리지 않으므로 필수는 아님

// DB 연결 (log_to_db, update_history_status, check_cancellation 함수는 이 파일에도 필요)
// DB 연결
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'; // mysqli 객체 $conn 제공
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/admin/batch_helpers.php';

// DB 연결 확인
if (!isset($conn) || $conn->connect_error) {
    //error_log("[FATAL] DB Connection failed in master trigger: " . ($conn->connect_error ?? "Unknown error"));
    echo json_encode(['success' => false, 'message' => 'DB connection failed.']);
    exit();
}

$historyId = null; // 초기화

try {
    // 1. 요청 파라미터 파싱
    $input = json_decode(file_get_contents('php://input'), true);

    //$sidoCode = isset($input['sido']) ? trim($input['sido']) : 'ALL';
    $sidoCode = 'ALL';
    $baseYear = isset($input['baseYear']) ? trim($input['baseYear']) : null;
    $baseMonth = isset($input['baseMonth']) ? trim($input['baseMonth']) : null;
    $userId = isset($input['user_id']) ? trim($input['user_id']) : null; // 프론트엔드에서 user_id를 넘겨준다면 사용

    if ($baseYear === null || $baseMonth === null) {
        throw new Exception("baseYear and baseMonth are required.");
    }
    
    // 이 배치 마스터의 `task_type`은 'realpriceAverageMaster' 등으로 구분하는 것이 좋습니다.
    // 워커 스크립트는 'realpriceAverage'로.
    $batchMasterType = 'realpriceAverage';
    $workerScriptPath = __DIR__ . '/generate_realprice_average.php'; // 실제 워커 스크립트 경로

    
    // 2. upload_history 테이블에 새로운 마스터 이력 기록 (상태: processing)
    $stmt = $conn->prepare("INSERT INTO upload_history 
        (task_type, sido_param, end_year_month, status, started_at, triggered_by_user_id, log_message, parent_history_id)
        VALUES (?, ?, ?, ?, NOW(), ?, ?, NULL)");
    
    
    // userId 처리 로직 (기존 코드와 동일하게)
    $userId_var = $userId ?? null; // userId는 null 가능성 있음. int 컬럼에 null 넣으려면 's'로 바인딩


    // $sidoCode는 ALL이고, $baseYear, $baseMonth를 end_year_month에 적절히 매핑
    $formattedMonth = sprintf("%02d", $baseMonth);
    $baseDateForLog = "{$baseYear}/{$formattedMonth}"; // 로그용으로 파라미터 보관
    $status = 'processing';
    $logMessage = "실거래 평균가 마스터 배치 요청 시작 (대상 시도: ALL)";

    $batchMasterType_var = $batchMasterType; // 변수로 할당
    $sidoCode_var = $sidoCode;               // 변수로 할당
    $baseDateForLog_var = $baseDateForLog;   // 변수로 할당
    $status_var = $status;                   // 변수로 할당
    $logMessage_var = $logMessage;           // 변수로 할당

    $type_string = "ssss"; // task_type, sido_param, end_year_month, status
    $type_string .= "s"; // triggered_by_user_id (NULL string)
    $type_string .= "s"; // log_message
    
    // bind_param 함수에 전달할 인자들을 배열로 만들고, 각 요소를 참조로 전달하기 위해 변수를 직접 넘깁니다.
    // NOTE: PHP < 8.1 에서는 array_merge 대신 call_user_func_array에 변수를 직접 나열하는 것이 더 안전.
    // PHP >= 8.1 에서는 bind_param의 참조 요구사항이 약화되어 array_merge로도 잘 동작하는 경우가 많음.
    $bind_params = [];
    $bind_params[] = $type_string; // 첫 번째 인자는 형식 문자열
    $bind_params[] = &$batchMasterType_var; // 모든 바인딩 변수는 참조로 전달
    $bind_params[] = &$sidoCode_var;
    $bind_params[] = &$baseDateForLog_var;
    $bind_params[] = &$status_var;
    $bind_params[] = &$userId_var;
    $bind_params[] = &$logMessage_var;

    /*
    $params = [ $batchMasterType, $sidoCode, $baseDateForLog, $status ];
    if ($userId === null) {
        $params[] = null;
    } else {
        $params[] = $userId;
    }
    $params[] = $logMessage;

    call_user_func_array([$stmt, 'bind_param'], array_merge([$type_string], $params));
    */
    // call_user_func_array로 bind_param 호출
    //call_user_func_array([$stmt, 'bind_param'], $bind_params);
    $stmt->bind_param(
        $type_string, 
        $batchMasterType_var, 
        $sidoCode_var, 
        $baseDateForLog_var, 
        $status_var, 
        $userId_var, 
        $logMessage_var
    );

    $stmt->execute();
    if ($stmt->error) {
        throw new Exception("마스터 배치 이력 시작 기록에 실패했습니다: " . $stmt->error);
    }
    $historyId = $conn->insert_id; // 새로 생성된 마스터 history_id
    $stmt->close();
    
    // 3. 워커 스크립트 호출 (exec() 또는 passthru())
    // 이때 마스터 history_id와 다른 필요한 파라미터들을 워커에게 전달
    // PHP CLI 실행 경로가 '/usr/bin/php'인지 확인 (env php 등으로 자동 탐색 가능)
    $phpExecutable = '/usr/bin/php'; 
    $command = escapeshellarg($phpExecutable) . ' ' . escapeshellarg($workerScriptPath) . ' ' .
               '--master-history-id=' . escapeshellarg($historyId) . ' ' .
               '--sido=' . escapeshellarg($sidoCode) . ' ' .
               '--base-year=' . escapeshellarg($baseYear) . ' ' .
               '--base-month=' . escapeshellarg($baseMonth) . ' ';
    
    // 백그라운드 실행을 위해 ' > /dev/null 2>&1 &' 추가 (출력 무시 및 백그라운드)
    $command .= ' > /dev/null 2>&1 &';

    exec($command, $output, $return_var);

    if ($return_var !== 0) {
        // exec 자체는 성공했으나 스크립트 실행이 즉시 실패할 수 있음.
        // 이 오류는 "워커 스크립트 시작 실패"를 의미할 수 있음.
        log_to_db($historyId, "워커 스크립트 실행 실패. Return code: {$return_var}", $conn, "ERROR");
        update_history_status($historyId, 'failed', '워커 스크립트 시작 실패.', $conn);
        throw new Exception("워커 스크립트 시작 실패.");
    }
    else {
        log_to_db($historyId, "워커 스크립트가 백그라운드에서 시작되었습니다. (마스터 ID: {$historyId})", $conn, "INFO");
        // 4. 클라이언트에 마스터 history_id 반환
        echo json_encode(['success' => true, 'message' => '실거래 평균가 배치 작업이 시작되었습니다.', 'master_history_id' => $historyId]);
    }
} catch (Exception $e) {
    // 오류 처리
    if ($historyId) {
        update_history_status($historyId, 'failed', "마스터 배치 처리 중 오류 발생: " . $e->getMessage(), $conn);
    }
    //error_log("[FATAL] RealPrice Average Master Batch Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => "배치 시작 요청 중 오류 발생: " . $e->getMessage()]);

} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>