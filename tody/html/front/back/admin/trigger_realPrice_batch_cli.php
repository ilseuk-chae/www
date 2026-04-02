<?php
// trigger_realPrice_batch_cli.php

// CLI 실행 강제 (안정성 확보)
if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only be executed via CLI." . PHP_EOL);
    exit(1);
}

// 환경 설정
error_reporting(E_ALL);
ini_set('display_errors', 0);
set_time_limit(0);
ini_set('memory_limit', '-1');

$script_root = dirname(__FILE__); // /var/www/tody/html/front/back/admin/
$project_base = dirname($script_root, 1); // /var/www/tody/html/front/back/ (admin에서 2단계 위로)

require_once $project_base . '/00-include/dbconnect.php';
require_once $project_base . '/00-include/common.php';
require_once $project_base . '/admin/batch_helpers.php'; // admin 폴더도 common.php와 같은 레벨에 있으니 경로 수정


// CLI 인자 파싱
$cliOptions = [];
foreach (array_slice($argv, 1) as $arg) {
    if (strpos($arg, '=') !== false) {
        [$key, $value] = explode('=', $arg, 2);
        // 여기서 ltrim($key, '-')를 사용해서 --sidoCds 가 sidoCds 가 됩니다.
        $cliOptions[ltrim($key, '-')] = $value; 
    }
}

$parentHistoryId = (int) ($cliOptions['historyId'] ?? 0);
$sidoCdsString = $cliOptions['sidoCds'] ?? ''; // 콤마로 구분된 시도 코드 문자열 (예: "36,50" 또는 "36")
$sidoCds = explode(',', $sidoCdsString); // ["36", "50"]
$startYear = $cliOptions['startYear'] ?? '2025';
$startMonth = $cliOptions['startMonth'] ?? '01';
$endYear = $cliOptions['endYear'] ?? '2025';
$endMonth = $cliOptions['endMonth'] ?? '10';
$startYearMonth = $startYear . str_pad($startMonth, 2, '0', STR_PAD_LEFT); // 예: "202501"
$endYearMonth = $endYear . str_pad($endMonth, 2, '0', STR_PAD_LEFT); // 예: "202510"
$resetType = $cliOptions['reset'] ?? ''; // "all" 또는 빈 문자열


//error_log("[DEBUG] Master History ID : " . $parentHistoryId . " sidoCds : " . $sidoCdsString . " startYearMonth: " . $startYearMonth . " endYearMonth: " . $endYearMonth);

if ($parentHistoryId === 0 || empty($sidoCdsString)) {
    // historyId가 없으면 로그를 남길 수 없음, 그냥 종료
    fwrite(STDERR, "Missing historyId or sidoCds for batch worker. Exiting.\n");
    exit(1);
}

// 스크립트 시작 시간 기록
$startTimeTotal = microtime(true);

// 초기 상태 업데이트: 'processing' 상태를 유지하되 log_message 업데이트
update_history_status($parentHistoryId, 'processing', '국토교통부 실거래가 가져오기 작업 시작.', $conn, false);
log_to_db($parentHistoryId, "국토교통부 실거래가 가져오기 작업 시작. 대상 시도: {$sidoCdsString}", $conn, 'INFO');

$success = true;
$processedSidoCount = 0; // 성공적으로 처리된 시도 수 카운트
$overallErrors = 0; // 전체 에러 카운트
$getSidoCount =0;

$bApt = true;
$bMultiFamily = true;
$bOfficetel = true;
$bLand = true;
$bSingle = true;
$bCommercial = true;
$bFactory = true;

foreach ($sidoCds as $sidoCd) {
    $getSidoCount = 0; 
    // =============================================================
    // === 1. 각 Sido 처리 시작 전, 마스터 작업 취소 여부 확인 ===
    // =============================================================
    if (check_cancellation($parentHistoryId, $conn)) { // [수정] $log_conn 제거
        $success = false;
        log_to_db($parentHistoryId, "사용자 요청으로 마스터 배치 작업 중단됨.", $conn, 'WARN'); // [수정] $log_conn 제거
        break;
    }
    $currentSidoStartTime = microtime(true);
    $sidoChildHistoryId = null; // 현재 Sido 작업의 고유한 historyId
    $sidoErrors = 0; // 현재 Sido 작업의 오류 수

    $sidoCd = trim($sidoCd);
    if (empty($sidoCd)) {
        log_to_db($parentHistoryId, "빈 sidoCd가 감지되어 건너뜁니다.", $conn, 'WARN'); // [수정] $log_conn 제거
        continue;
    }
    try {
        // // [수정 4] 각 시도 작업에 대한 upload_history 레코드 생성 (이전과 동일)
        $stmt = $conn->prepare("INSERT INTO upload_history (task_type, sido_param, start_year_month, end_year_month, status, started_at, parent_history_id, log_message) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)");
        if ($stmt === false) {
             throw new Exception("Sido {$sidoCd}의 upload_history 레코드 생성 SQL 준비 실패: " . $conn->error);
        }
        $taskType = 'realprice'; // 실거래가 가져오기
        $status = 'processing';
        $subLogMessage = "Sido {$sidoCd} 실거래가 가져오기 작업 시작.";
        $stmt->bind_param("sssssis", $taskType, $sidoCd, $startYearMonth, $endYearMonth, $status, $parentHistoryId, $subLogMessage);
        $stmt->execute();
        $sidoChildHistoryId = $conn->insert_id;
        $stmt->close();

        if ($sidoChildHistoryId === 0) {
            throw new Exception("Sido {$sidoCd}의 upload_history 레코드 생성 실패: " . $conn->error);
        }

        log_to_db($sidoChildHistoryId, "Sido {$sidoCd} 국토교통부 실거래가 가져오기 작업 시작.", $conn, 'INFO');
        update_history_status($sidoChildHistoryId, 'processing', "Sido {$sidoCd} 실거래가 가져오기 작업 진행중....", $conn);

        // =============================================================
        // === 2. 마스터 작업 취소 여부 재확인 (Sido 자식 작업 시작 전) ===
        // =============================================================
        if (check_cancellation($parentHistoryId, $conn)) {
            $success = false;
            log_to_db($sidoChildHistoryId, "[{$sidoCd}] 사용자 중단 요청 감지. 작업 중단.", $conn, 'WARN'); 
            break;
        }
   
        if($bApt) {
            // 2. 실거래가(아파트) 가져오기 스크립트 실행
            log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(아파트) 가져오기 스크립트 실행.", $conn, 'INFO');
            $fastCommand = 'php ' . $project_base . '/admin/download_realPrice_apartment_renewal_helper.php ' .
                '"historyId=' . $sidoChildHistoryId . '" ' .
                '"sidoCd=' . $sidoCd . '" ' .
                '"start=' . $startYearMonth . '" ' .
                '"end=' . $endYearMonth . '" ' .
                '2>&1';

            //log_to_db($sidoChildHistoryId, "[DEBUG] 헬퍼 스크립트 호출 명령어: " . $fastCommand, $conn, 'DEBUG'); // [수정] $log_conn 제거

            $fastOutput = shell_exec($fastCommand); // 헬퍼 스크립트의 표준 출력을 받음 // <--- 여기서 아파트 스크립트가 완전히 끝날 때까지 대기합니다.
            if (strpos($fastOutput, 'SUCCESS') === false) {
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(아파트) 가져오기 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                break;
            }
            // JSON 디코딩 시도
            $outputData = json_decode($fastOutput, true);

            if ($outputData === null || !isset($outputData['status'])) {
                // JSON 파싱 실패 또는 status 키 없음 (예상치 못한 출력)
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 헬퍼 스크립트 응답 파싱 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                // exit(1); // 이 상황에서 부모 스크립트도 종료할지 결정
                // continue; // 아니면 다음 작업으로 넘어갈지
            } elseif ($outputData['status'] === 'SUCCESS') {
                $processedCount = $outputData['totalProcessedCount'] ?? 0;
                $message = $outputData['message'] ?? '완료.';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(아파트) 가져오기 완료. {$message} 처리 건수: {$processedCount}", $conn, 'INFO');
                // $totalProcessedCount를 필요하다면 부모 스크립트에서도 누적 가능
                $getSidoCount += $processedCount;
            } else { // status === 'FAILED'
                $errorMessage = $outputData['message'] ?? '알 수 없는 실패';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(아파트) 가져오기 실패: {$errorMessage} " . ($outputData['error'] ?? ''), $conn, 'ERROR');
                $success = false;
                // break; // 또는 다른 실패 처리
            }
        
            // 3. 중단 요청 확인
            if (check_cancellation($parentHistoryId, $conn)) {
                $success = false;
                break;
            }
        }
        if($bMultiFamily) {
            // 4. 실거래가(연립) 가져오기 스크립트 실행
            log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(연립) 가져오기 스크립트 실행.", $conn, 'INFO');
            $fastCommand = 'php ' . $project_base . '/admin/download_realPrice_multiFamily_helper.php ' . // 스크립트 경로 뒤 공백!
                '"historyId=' . $sidoChildHistoryId . '" ' .
                '"sidoCd=' . $sidoCd . '" ' .
                '"start=' . $startYearMonth . '" ' .
                '"end=' . $endYearMonth . '" ' .
                '2>&1';

            $fastOutput = shell_exec($fastCommand); // 헬퍼 스크립트의 표준 출력을 받음// <--- 여기서 연립 스크립트가 완전히 끝날 때까지 대기합니다.
            if (strpos($fastOutput, 'SUCCESS') === false) {
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(연립) 가져오기 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                break;
            }
            // JSON 디코딩 시도
            $outputData = json_decode($fastOutput, true);

            if ($outputData === null || !isset($outputData['status'])) {
                // JSON 파싱 실패 또는 status 키 없음 (예상치 못한 출력)
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 헬퍼 스크립트 응답 파싱 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                // exit(1); // 이 상황에서 부모 스크립트도 종료할지 결정
                // continue; // 아니면 다음 작업으로 넘어갈지
            } elseif ($outputData['status'] === 'SUCCESS') {
                $processedCount = $outputData['totalProcessedCount'] ?? 0;
                $message = $outputData['message'] ?? '완료.';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(연립) 가져오기 완료. {$message} 처리 건수: {$processedCount}", $conn, 'INFO');
                // $totalProcessedCount를 필요하다면 부모 스크립트에서도 누적 가능
                $getSidoCount += $processedCount;
            } else { // status === 'FAILED'
                $errorMessage = $outputData['message'] ?? '알 수 없는 실패';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(연립) 가져오기 실패: {$errorMessage} " . ($outputData['error'] ?? ''), $conn, 'ERROR');
                $success = false;
                // break; // 또는 다른 실패 처리
            }
            // 5. 중단 요청 확인
            if (check_cancellation($parentHistoryId, $conn)) {
                $success = false;
                break;
            }
        }
        if($bOfficetel) {
            // 6. 실거래가(오피스텔) 가져오기 스크립트 실행
            log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(오피스텔) 가져오기 스크립트 실행.", $conn, 'INFO');
            $fastCommand = 'php ' . $project_base . '/admin/download_realPrice_officetel_helper.php ' . // 스크립트 경로 뒤 공백!
                '"historyId=' . $sidoChildHistoryId . '" ' .
                '"sidoCd=' . $sidoCd . '" ' .
                '"start=' . $startYearMonth . '" ' .
                '"end=' . $endYearMonth . '" ' .
                '2>&1';
            $fastOutput = shell_exec($fastCommand); // 헬퍼 스크립트의 표준 출력을 받음 // <--- 여기서 오피스텔 스크립트가 완전히 끝날 때까지 대기합니다.
            if (strpos($fastOutput, 'SUCCESS') === false) {
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(오피스텔) 가져오기 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                break;
            }
            // JSON 디코딩 시도
            $outputData = json_decode($fastOutput, true);

            if ($outputData === null || !isset($outputData['status'])) {
                // JSON 파싱 실패 또는 status 키 없음 (예상치 못한 출력)
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 헬퍼 스크립트 응답 파싱 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                // exit(1); // 이 상황에서 부모 스크립트도 종료할지 결정
                // continue; // 아니면 다음 작업으로 넘어갈지
            } elseif ($outputData['status'] === 'SUCCESS') {
                $processedCount = $outputData['totalProcessedCount'] ?? 0;
                $message = $outputData['message'] ?? '완료.';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(오피스텔) 가져오기 완료. {$message} 처리 건수: {$processedCount}", $conn, 'INFO');
                // $totalProcessedCount를 필요하다면 부모 스크립트에서도 누적 가능
                $getSidoCount += $processedCount;
            } else { // status === 'FAILED'
                $errorMessage = $outputData['message'] ?? '알 수 없는 실패';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(오피스텔) 가져오기 실패: {$errorMessage} " . ($outputData['error'] ?? ''), $conn, 'ERROR');
                $success = false;
                // break; // 또는 다른 실패 처리
            }

            // 7. 중단 요청 확인
            if (check_cancellation($parentHistoryId, $conn)) {
                $success = false;
                break;
            }
        }
        if($bLand) {
            // 8. 실거래가(토지) 가져오기 스크립트 실행
            log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(토지) 가져오기 스크립트 실행.", $conn, 'INFO');
            $fastCommand = 'php ' . $project_base . '/admin/download_realPrice_land_redis_helper.php ' . // 스크립트 경로 뒤 공백!
                '"historyId=' . $sidoChildHistoryId . '" ' .
                '"sidoCd=' . $sidoCd . '" ' .
                '"start=' . $startYearMonth . '" ' .
                '"end=' . $endYearMonth . '" ' .
                '2>&1';
            $fastOutput = shell_exec($fastCommand); // 헬퍼 스크립트의 표준 출력을 받음// <--- 여기서 토지 스크립트가 완전히 끝날 때까지 대기합니다.
            if (strpos($fastOutput, 'SUCCESS') === false) {
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(토지) 가져오기 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                break;
            }
            // JSON 디코딩 시도
            $outputData = json_decode($fastOutput, true);

            if ($outputData === null || !isset($outputData['status'])) {
                // JSON 파싱 실패 또는 status 키 없음 (예상치 못한 출력)
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 헬퍼 스크립트 응답 파싱 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                // exit(1); // 이 상황에서 부모 스크립트도 종료할지 결정
                // continue; // 아니면 다음 작업으로 넘어갈지
            } elseif ($outputData['status'] === 'SUCCESS') {
                $processedCount = $outputData['totalProcessedCount'] ?? 0;
                $message = $outputData['message'] ?? '완료.';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(토지) 가져오기 완료. {$message} 처리 건수: {$processedCount}", $conn, 'INFO');
                // $totalProcessedCount를 필요하다면 부모 스크립트에서도 누적 가능
                $getSidoCount += $processedCount;
            } else { // status === 'FAILED'
                $errorMessage = $outputData['message'] ?? '알 수 없는 실패';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(토지) 가져오기 실패: {$errorMessage} " . ($outputData['error'] ?? ''), $conn, 'ERROR');
                $success = false;
                // break; // 또는 다른 실패 처리
            }
            // 9. 중단 요청 확인
            if (check_cancellation($parentHistoryId, $conn)) {
                $success = false;
                break;
            }        
        }
        //20260119 추가
        if($bSingle) {
            // 10. 실거래가(단독) 가져오기 스크립트 실행
            log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(단독) 가져오기 스크립트 실행.", $conn, 'INFO');
            $fastCommand = 'php ' . $project_base . '/admin/download_realPrice_single_helper.php ' . // 스크립트 경로 뒤 공백!
                '"historyId=' . $sidoChildHistoryId . '" ' .
                '"sidoCd=' . $sidoCd . '" ' .
                '"start=' . $startYearMonth . '" ' .
                '"end=' . $endYearMonth . '" ' .
                '2>&1';

            $fastOutput = shell_exec($fastCommand); // 헬퍼 스크립트의 표준 출력을 받음// <--- 여기서 연립 스크립트가 완전히 끝날 때까지 대기합니다.

            if (strpos($fastOutput, 'SUCCESS') === false) {
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(토지) 가져오기 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                break;
            }
            // JSON 디코딩 시도
            $outputData = json_decode($fastOutput, true);

            if ($outputData === null || !isset($outputData['status'])) {
                // JSON 파싱 실패 또는 status 키 없음 (예상치 못한 출력)
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 헬퍼 스크립트 응답 파싱 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                // exit(1); // 이 상황에서 부모 스크립트도 종료할지 결정
                // continue; // 아니면 다음 작업으로 넘어갈지
            } elseif ($outputData['status'] === 'SUCCESS') {
                $processedCount = $outputData['totalProcessedCount'] ?? 0;
                $message = $outputData['message'] ?? '완료.';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(단독) 가져오기 완료. {$message} 처리 건수: {$processedCount}", $conn, 'INFO');
                // $totalProcessedCount를 필요하다면 부모 스크립트에서도 누적 가능
                $getSidoCount += $processedCount;
            } else { // status === 'FAILED'
                $errorMessage = $outputData['message'] ?? '알 수 없는 실패';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(단독) 가져오기 실패: {$errorMessage} " . ($outputData['error'] ?? ''), $conn, 'ERROR');
                $success = false;
                // break; // 또는 다른 실패 처리
            }

            // 11. 중단 요청 확인
            if (check_cancellation($parentHistoryId, $conn)) {
                $success = false;
                break;
            }
        }
        if($bCommercial) {
            // 12. 실거래가(상업/업무용) 가져오기 스크립트 실행
            log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(상업/업무) 가져오기 스크립트 실행.", $conn, 'INFO');
            $fastCommand = 'php ' . $project_base . '/admin/download_realPrice_commercial_helper.php ' . // 스크립트 경로 뒤 공백!
                '"historyId=' . $sidoChildHistoryId . '" ' .
                '"sidoCd=' . $sidoCd . '" ' .
                '"start=' . $startYearMonth . '" ' .
                '"end=' . $endYearMonth . '" ' .
                '2>&1';

            $fastOutput = shell_exec($fastCommand); // 헬퍼 스크립트의 표준 출력을 받음// <--- 여기서 연립 스크립트가 완전히 끝날 때까지 대기합니다.

            if (strpos($fastOutput, 'SUCCESS') === false) {
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(상업/업무) 가져오기 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                break;
            }
            // JSON 디코딩 시도
            $outputData = json_decode($fastOutput, true);

            if ($outputData === null || !isset($outputData['status'])) {
                // JSON 파싱 실패 또는 status 키 없음 (예상치 못한 출력)
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 헬퍼 스크립트 응답 파싱 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                // exit(1); // 이 상황에서 부모 스크립트도 종료할지 결정
                // continue; // 아니면 다음 작업으로 넘어갈지
            } elseif ($outputData['status'] === 'SUCCESS') {
                $processedCount = $outputData['totalProcessedCount'] ?? 0;
                $message = $outputData['message'] ?? '완료.';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(상업/업무) 가져오기 완료. {$message} 처리 건수: {$processedCount}", $conn, 'INFO');
                // $totalProcessedCount를 필요하다면 부모 스크립트에서도 누적 가능
                $getSidoCount += $processedCount;
            } else { // status === 'FAILED'
                $errorMessage = $outputData['message'] ?? '알 수 없는 실패';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(상업/업무) 가져오기 실패: {$errorMessage} " . ($outputData['error'] ?? ''), $conn, 'ERROR');
                $success = false;
                // break; // 또는 다른 실패 처리
            }

            // 13. 중단 요청 확인
            if (check_cancellation($parentHistoryId, $conn)) {
                $success = false;
                break;
            }
        }
        if($bFactory) {
            // 14. 실거래가(공장/창고) 가져오기 스크립트 실행
            log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(공장/창고) 가져오기 스크립트 실행.", $conn, 'INFO');
            $fastCommand = 'php ' . $project_base . '/admin/download_realPrice_factory_helper.php ' . // 스크립트 경로 뒤 공백!
                '"historyId=' . $sidoChildHistoryId . '" ' .
                '"sidoCd=' . $sidoCd . '" ' .
                '"start=' . $startYearMonth . '" ' .
                '"end=' . $endYearMonth . '" ' .
                '2>&1';

            $fastOutput = shell_exec($fastCommand); // 헬퍼 스크립트의 표준 출력을 받음// <--- 여기서 연립 스크립트가 완전히 끝날 때까지 대기합니다.
            if (strpos($fastOutput, 'SUCCESS') === false) {
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(공장/창고) 가져오기 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                break;
            }
            // JSON 디코딩 시도
            $outputData = json_decode($fastOutput, true);

            if ($outputData === null || !isset($outputData['status'])) {
                // JSON 파싱 실패 또는 status 키 없음 (예상치 못한 출력)
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 헬퍼 스크립트 응답 파싱 실패: " . $fastOutput, $conn, 'ERROR');
                $success = false;
                // exit(1); // 이 상황에서 부모 스크립트도 종료할지 결정
                // continue; // 아니면 다음 작업으로 넘어갈지
            } elseif ($outputData['status'] === 'SUCCESS') {
                $processedCount = $outputData['totalProcessedCount'] ?? 0;
                $message = $outputData['message'] ?? '완료.';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(공장/창고) 가져오기 완료. {$message} 처리 건수: {$processedCount}", $conn, 'INFO');
                // $totalProcessedCount를 필요하다면 부모 스크립트에서도 누적 가능
                $getSidoCount += $processedCount;
            } else { // status === 'FAILED'
                $errorMessage = $outputData['message'] ?? '알 수 없는 실패';
                log_to_db($sidoChildHistoryId, "[{$sidoCd}] 국토교통부 실거래가(공장/창고) 가져오기 실패: {$errorMessage} " . ($outputData['error'] ?? ''), $conn, 'ERROR');
                $success = false;
                // break; // 또는 다른 실패 처리
            }

            // 15. 중단 요청 확인
            if (check_cancellation($parentHistoryId, $conn)) {
                $success = false;
                break;
            }
        }
        $sidoFinalStatus = 'success';

    } catch (Exception $e) {
        $logMessage = "Sido {$sidoCd} 처리 중 오류 발생: " . $e->getMessage();
        log_to_db($sidoChildHistoryId ?: $parentHistoryId, $logMessage, $conn, 'ERROR'); // 자식 ID 없으면 마스터 ID에 기록
        $sidoErrors++;
        $sidoFinalStatus = 'failed';
    } finally {

        $currentSidoDuration = microtime(true) - $currentSidoStartTime;
        $hours = (int)floor($currentSidoDuration / 3600);
        $minutes = (int)fmod(floor($currentSidoDuration / 60), 60);
        $seconds = (int)round(fmod($currentSidoDuration, 60));
        $currentSidoDurationFormatted = sprintf("%02d시 %02d분 %02d초", $hours, $minutes, $seconds);

        $processedCount = 0;
        // 현재 시도 작업의 최종 상태 업데이트
        $sidoFinalMessage = "Sido {$sidoCd} 국토교통부 실거래가 가져오기 완료. 소요 시간: {$currentSidoDurationFormatted}. 총 수집수 : " . "{$getSidoCount} 건. 수집완료" . ($sidoErrors > 0 ? " 오류 발생: {$sidoErrors} 건." : "");        
        log_to_db($sidoChildHistoryId ?: $parentHistoryId, $sidoFinalMessage, $conn, ($sidoErrors > 0) ? 'ERROR' : 'INFO');
        if ($sidoChildHistoryId) { // 자식 ID가 있는 경우에만 업데이트
            $sidoFinalStatus = 'success';
            update_history_status($sidoChildHistoryId, $sidoFinalStatus, $sidoFinalMessage, $conn, true);
        }
        $overallErrors += $sidoErrors;
        $processedSidoCount++;
    }
}// end foreach Sido

// --- 마스터 작업 (parentHistoryId)의 최종 상태 업데이트 ---
$endTimeTotal = microtime(true);
$durationTotal = $endTimeTotal - $startTimeTotal;
$hours = (int)floor($durationTotal / 3600);
$minutes = (int)fmod(floor($durationTotal / 60), 60);
$seconds = (int)round(fmod($durationTotal, 60));
$durationTotalFormatted = sprintf("%02d시 %02d분 %02d초", $hours, $minutes, $seconds);

// 최종 상태 업데이트

$masterFinalStatus = ($overallErrors > 0) ? 'failed' : 'success';
$masterFinalMessage = "모든 국토교통부 실거래가 가져오기 마스터 배치 작업 완료 (총 시도: " . count($sidoCds) . ", 성공 시도: {$processedSidoCount}, 총 에러: {$overallErrors}). 총 소요 시간: {$durationTotalFormatted}.";

log_to_db($parentHistoryId, $masterFinalMessage, $conn, ($overallErrors > 0) ? 'ERROR' : 'INFO');
update_history_status($parentHistoryId, $masterFinalStatus, $masterFinalMessage, $conn, true);


$conn->close();
exit(0);

?>