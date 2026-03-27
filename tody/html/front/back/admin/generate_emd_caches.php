<?php
// generate_emd_caches.php
// 이 스크립트는 CLI에서 여러 Sido 코드 (--sido="XX,YY,ZZ")를 인자로 받아,
// 각 Sido별로 모든 EMD 코드를 순차적으로 처리하고 Redis에 캐싱합니다.
// 이 작업은 trigger_cache_batch.php에 의해 백그라운드에서 한 번만 실행됩니다.

error_reporting(E_ALL);
ini_set('display_errors', 0); // 화면에 에러 표시 안 함 (CLI에서는 exec 리다이렉션으로 이미 처리됨)
ini_set('log_errors', 1); // 로그 파일에 에러 기록 (trigger_cache_batch.php에서 리다이렉션된 마스터 로그 파일에 기록됨)

// CLI 실행 시 스크립트 시작/종료 표시
if (php_sapi_name() == 'cli') {
    error_log("Script START: " . basename(__FILE__));
    register_shutdown_function(function() {
        error_log("Script END: " . basename(__FILE__));
    });
}

// --- 파일 로드 경로 수정: realpath()를 사용하여 절대 경로 확보 ---
// __DIR__은 현재 스크립트 파일의 절대 경로 (예: /var/www/tody/html/front/back/admin)
// 웹 루트 (/var/www/tody/html)는 __DIR__에서 상위 3단계입니다.
$web_root = realpath(__DIR__ . '/../../..'); 
if ($web_root === false) { // 경로 찾기 실패시 비상 로직
    //error_log("FATAL: Could not resolve web_root path from __DIR__. Script will exit.");
    exit(1); 
}

// === DB 연결 로드 (이제 $web_root를 사용합니다!) ===
require_once $web_root . '/front/back/00-include/dbconnect.php'; 
require_once $web_root . '/front/back/00-include/common.php';
require_once $web_root . '/front/back/admin/batch_helpers.php';     
require_once $web_root . '/front/back/realPrice/poligon_center.php'; 

$script_root = dirname(__FILE__); // /var/www/tody/html/front/back/admin/
$project_base = dirname($script_root, 1); // /var/www/tody/html/front/back/ (admin에서 2단계 위로)


// -----------------------------------------------------------
// CLI 옵션 처리: --sido (콤마 구분 문자열), --parent-history-id
// -----------------------------------------------------------
$options = getopt("", ["sido:", "parent-history-id:", "reset:", "base-year::", "base-month::"]);
$sidoParamRaw = $options['sido'] ?? null;
$resetType = $options['reset'] ?? 'false';
//$resetType = isset($options['reset']) ? ($options['reset'] === false ? true : 
$baseYear = (int)($options['base-year'] ?? 0);
$baseMonth = (int)($options['base-month'] ?? 0);

$parentHistoryId = isset($options['parent-history-id']) ? (int)$options['parent-history-id'] : null;

// 스크립트 시작 시간 기록
$startTimeTotal = microtime(true);

// 필수 인수가 없으면 처리 및 종료
if (empty($sidoParamRaw) || $parentHistoryId === null) {
    $logMessage = "FATAL: 'sido' 또는 'parent-history-id' CLI 인수가 누락되었습니다.";
    
    if ($parentHistoryId) { 
        update_history_status($parentHistoryId, 'failed', $logMessage, $conn);
    }
    $conn->close();
    exit(1);
}

// -----------------------------------------------------------
// 0. 전국 모든 읍면동 PNU 테이블 이름 정의 및 Sido 코드 유효성 검사
// -----------------------------------------------------------
$allSupportedSidoCodes = ['11','26','27','28','29','30','31','36','41','43','44','46','47','48','50','51','52']; 

$inputSidoCodes = explode(',', $sidoParamRaw);
$sidoCodesToProcessQueue = [];
$invalidCodes = [];

foreach ($inputSidoCodes as $sidoCode) {
    $sidoCode = trim($sidoCode);
    if (in_array($sidoCode, $allSupportedSidoCodes)) {
        $sidoCodesToProcessQueue[] = $sidoCode;
    } else {
        $invalidCodes[] = $sidoCode;
    }
}
$sidoCodesToProcessQueue = array_unique($sidoCodesToProcessQueue); 
sort($sidoCodesToProcessQueue); 

if (empty($sidoCodesToProcessQueue)) {
    $logMessage = "FATAL: 처리할 유효한 Sido 코드를 찾을 수 없습니다. 요청된 Sido: '{$sidoParamRaw}'";
    //error_log($logMessage);
    update_history_status($parentHistoryId, 'failed', $logMessage, $conn);
    $conn->close();
    exit(1);
}

if (!empty($invalidCodes)) {
    $logMessage = "경고: 유효하지 않거나 지원되지 않는 시도 코드가 요청되었습니다: " . implode(', ', $invalidCodes);
    //error_log($logMessage);
    log_to_db($parentHistoryId, $logMessage, $conn, 'WARN');
}

log_to_db($parentHistoryId, "처리할 시도 코드: " . implode(', ', $sidoCodesToProcessQueue), $conn, 'INFO');


// --- Redis 연결 (루프 시작 전 한 번만 연결) ---
$redis = new Redis();
try {
    $redis->connect('127.0.0.1', 6379,10); 
    // $redis->auth('your_redis_password');
    $redis->setOption(Redis::OPT_READ_TIMEOUT, -1); 
    log_to_db($parentHistoryId, "Redis 서버에 연결되었습니다.", $conn);
} catch (Exception $e) {
    $redis = null;
    $logMessage = "Redis connection failed: " . $e->getMessage();
    
    log_to_db($parentHistoryId, $logMessage, $conn, 'CRITICAL');
    update_history_status($parentHistoryId, 'failed', $logMessage, $conn);
    $conn->close();
    exit(1);
}

if (!$redis || !$redis->ping()) {
    $logMessage = "Redis connection failed or invalid. Aborting script.";
    
    log_to_db($parentHistoryId, $logMessage, $conn, 'CRITICAL');
    update_history_status($parentHistoryId, 'failed', $logMessage, $conn);
    $conn->close();
    exit(1);
}

// 이 아래에서 $rpEmdCachePrefix 가 정의됩니다. (대략 131 라인 근처)
$rpEmdCachePrefix = 'realPrice:emd:latest:'; 

log_to_db($parentHistoryId, "[generate_emd_caches] resetType: " . $resetType, $conn, 'INFO');
// 마스터 작업 초기 상태 업데이트: 'processing' 상태 유지, log_message 업데이트
/*
if($resetType == 'true' || $resetType == 'yes' || $resetType == 1) {
    
    update_history_status($parentHistoryId, 'processing', '실거래가 캐시 reset 작업 시작', $conn, false);
    
    // 1. Redis 초기화 스크립트 실행 (마스터 작업에 속함)
    log_to_db($parentHistoryId, "전체 실거래가 Redis 캐시 초기화 스크립트 실행.", $conn, 'INFO');
    
    // 1. Redis 초기화 스크립트 실행 (마스터 작업에 속함)
    log_to_db($parentHistoryId, "전체 실거래가 Redis 캐시 초기화 스크립트 실행.", $conn, 'INFO');
    $resetCommand = 'php ' .$project_base . '/admin/cache_batch_reset.php';
    $resetOutput = shell_exec($resetCommand . ' 2>&1'); 

    if (strpos($resetOutput, 'SUCCESS') === false) {
        log_to_db($parentHistoryId, "실거래가 Redis 캐시 초기화 실패: " . $resetOutput, $conn, 'ERROR');
        $overallErrors++;
        // 초기화 실패 시 전체 작업을 실패로 간주하고 종료
        update_history_status($parentHistoryId, 'failed', "실거래가 Redis 캐시 초기화 실패로 마스터 작업 종료.", $conn);
        if ($conn) $conn->close();
        if ($redis) $redis->close();
        exit(1);
    }
    log_to_db($parentHistoryId, "실거래가 Redis 캐시 초기화 완료. " . $resetOutput, $conn, 'INFO');
    update_history_status($parentHistoryId, 'processing', '실거래가 캐시 reset 작업 완료', $conn, false);

} else {
    log_to_db($parentHistoryId, "부분 실거래가 캐시 업로드 작업으로 실거래가 Redis 초기화 작업을 하지 않습니다.", $conn, 'INFO');
}
*/

$overallErrors = 0; 
$processedSidoCount = 0; 

// -----------------------------------------------------------
// 각 시도 코드별 순차 처리 루프 (여기서 시도별 작업을 처리합니다!)
// -----------------------------------------------------------
foreach ($sidoCodesToProcessQueue as $sidoCd) {
    // =============================================================
    // === 1. 각 Sido 처리 시작 전, 마스터 작업 취소 여부 확인 ===
    // =============================================================
    check_cancellation($parentHistoryId, $conn);

    $currentSidoStartTime = microtime(true);
    $historyId = null; // 현재 Sido 작업의 고유한 historyId
    $sidoErrors = 0; // 현재 Sido 작업의 오류 수

    try {
        // 1. 각 시도 작업에 대한 upload_history 레코드 생성
        $stmt = $conn->prepare("INSERT INTO upload_history (task_type, sido_param, status, started_at, parent_history_id, log_message) VALUES (?, ?, ?, NOW(), ?, ?)");
        $taskType = 'rediscache'; 
        $status = 'processing';
        $subLogMessage = "Sido {$sidoCd} 실거래가 Redis 캐시 작업 시작.";
        $stmt->bind_param("sssis", $taskType, $sidoCd, $status, $parentHistoryId, $subLogMessage);
        $stmt->execute();
        $historyId = $conn->insert_id;
        $stmt->close();

        if ($historyId === 0) {
            throw new Exception("Sido {$sidoCd}의 upload_history 레코드 생성 실패: " . $conn->error);
        }

        if($resetType == 'true' || $resetType == 'yes' || $resetType == 1) {
            $redisKeysPattern = $rpEmdCachePrefix . ":$sidoCd*";
            update_history_status($historyId, 'processing', "Sido {$sidoCd} 작업 초기화 중.", $conn);

            log_to_db($historyId, "Sido {$sidoCd} 실거래가 Redis 캐시 Reset 작업 시작.", $conn, 'INFO');
            // 해당 시도의 실거래가 캐시 키 삭제
            try {
                // keys() 대신 scan() 기반 함수 사용
                $deletedCount = deleteKeysByPattern($redis, $redisKeysPattern);
        
                if ($deletedCount > 0) {
                    log_to_db($historyId, "Deleted {$deletedCount} real price cache keys for Sido {$sidoCd}.", $conn, 'INFO');
                } else {
                    log_to_db($historyId, "No real price cache keys found to delete for Sido {$sidoCd}.", $conn, 'INFO');
                }
            } catch (Exception $e) {
                log_to_db($historyId, "Error deleting Redis keys for Sido {$sidoCd}: " . $e->getMessage(), $conn, 'ERROR');
            }
        }
        update_history_status($historyId, 'processing', "Sido {$sidoCd} Redis 캐시중...", $conn);
        log_to_db($historyId, "Sido {$sidoCd} 실거래가 Redis 캐시 작업 시작.", $conn, 'INFO');

        // ===>>> EMD 코드 추출 전: 마스터 ID를 전달 <<<===
        check_cancellation($historyId, $conn); 


        // --- 테이블 매핑 초기화 (현재 시도에만 해당) ---
        // === 수정: $tableMappings 구조 변경 (배열 안에 배열 대신 직접 문자열 매핑) ===
        $propertyTypeTableNames = [
            'apt'       => "realPrice_apt_{$sidoCd}",
            'multi'     => "realPrice_multiFamily_{$sidoCd}",
            'officetel' => "realPrice_officetel_{$sidoCd}",
            'land'      => "realPrice_land_{$sidoCd}",
            'single'      => "realPrice_single_{$sidoCd}",
            'commercial'      => "realPrice_commercial_{$sidoCd}",
            'factory'      => "realPrice_factory_{$sidoCd}"
        ];
        $adminTableName = "AL_D002_{$sidoCd}"; 
        
        log_to_db($historyId, "Sido {$sidoCd} 부동산 유형별 테이블 매핑 완료. Admin Table: {$adminTableName}", $conn);

        // --- EMD (읍면동) 코드 목록 추출 (현재 시도에만 해당) ---
        $currentSidoEmdCodes = [];
        log_to_db($historyId, "Sido '{$sidoCd}'에서 EMD 코드를 추출 중...", $conn);

        $sqlEmd = "SELECT emd_code FROM SIDO_EMD_CODE WHERE use_yn = 'Y' AND sido_code = '{$sidoCd}' ORDER BY emd_code";
        $resultEmd = $conn->query($sqlEmd);
        if ($resultEmd) {
            while ($rowEmd = $resultEmd->fetch_assoc()) {
                $currentSidoEmdCodes[] = $rowEmd['emd_code'];
            }
            $resultEmd->free();
            log_to_db($historyId, "Sido {$sidoCd}에 대해 총 " . count($currentSidoEmdCodes) . "개의 EMD 코드를 찾았습니다.", $conn);
        } else {
            throw new Exception("SIDO_EMD_CODE 테이블에서 EMD 코드 쿼리 중 오류 발생 (Sido: {$sidoCd}): " . $conn->error);
        }

        if (empty($currentSidoEmdCodes)) {
            throw new Exception("Sido {$sidoCd}에 대해 처리할 EMD 코드를 찾을 수 없습니다. 건너뜁니다.");
        }

        // ===>>> EMD 코드 목록 추출 완료 후: 마스터 ID를 전달 <<<===
        check_cancellation($historyId, $conn);

        // --- 각 EMD 코드별 데이터 조회, 가공, Redis 저장 (현재 시도 내 EMD 루프) ---
        $processedEmdCount = 0;
        $redisPipeline = $redis->pipeline();
        $pipelineOps = 0; // 파이프라인에 추가된 명령 개수를 추적하기 위한 변수 
        $pipelineFlushSize = 5000; // 예: 5000개 명령마다 플러시

        //조회를 5년으로 한정
        $targetYear = (int)$baseYear;
        $targetMonth = (int)$baseMonth;
        // ✨ 5. 최근 5년 통계 (기준연월이 2025/11일 때 2020/12/01 ~ 2025/11/30) ✨
        // 기준월의 59개월 전 (총 60개월 = 5년 데이터를 포함하기 위해)
        $startMonthDate5Y = (new DateTime("{$baseYear}-{$baseMonth}-01"))->modify('-59 months'); // 현재 시각 2025. 12. 31. 09:01:00 가정
        
        foreach ($currentSidoEmdCodes as $emdIndex => $emdCdInner) {
            // ===============================================================
            // === 2. 각 EMD 코드 처리 중 주기적으로 취소 여부 확인 (선택적, 권장) ===
            // ===============================================================
            if (check_cancellation($historyId, $conn)) {
                throw new Exception("Sido {". $sidoCd ."} 작업 도중 사용자 중단 요청 감지. 작업 중단.", 500);
            }
            
            //log_to_db($historyId, "EMD 코드 '{$emdCdInner}' 처리 중... (" . ($emdIndex + 1) . "/" . count($currentSidoEmdCodes) . ")", $conn, 'INFO');
            
            $queryPnuLike = substr($emdCdInner, 0, 8) . '%'; 

            $emdDataCollection = [];
            $unionQueries = [];
            $bindParams = [];
            $typesString = '';

            // --- APT Query ---
            // === 수정: $propertyTypeTableNames 배열에서 직접 테이블 이름을 가져옵니다. ===
            $filter5Y_for_union_query = " AND (rap.dealYear > {$startMonthDate5Y->format('Y')} OR (rap.dealYear = {$startMonthDate5Y->format('Y')} AND rap.dealMonth >= {$startMonthDate5Y->format('n')})) AND (rap.dealYear < {$targetYear} OR (rap.dealYear = {$targetYear} AND rap.dealMonth <= {$targetMonth}))";
            if (isset($propertyTypeTableNames['apt'])) { 
                $aptTableName = $propertyTypeTableNames['apt']; 
                $unionQueries[] = trim("
                    SELECT
                        rap.aptSeq AS id,
                        rap.excluUseAr,
                        rap.dealYear, 
                        rap.dealMonth, 
                        rap.dealDay, 
                        rap.dealAmount, 
                        rap.pnu,
                        NULL AS jimok,
                        NULL AS usage_type,
                        'apt' AS estate_type,
                        ST_AsText(admg.WKT) AS poligon, -- WKT 문자열로 가져오기
                        -- ST_Y(ST_Centroid(admg.WKT)) AS center_latitude,  -- 위도 (Y 좌표)
                        -- ST_X(ST_Centroid(admg.WKT)) AS center_longitude  -- 경도 (X 좌표)
                        NULL AS center_latitude,  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                        NULL AS center_longitude  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                    FROM `{$aptTableName}` AS rap
                    INNER JOIN `{$adminTableName}` AS admg 
                    ON admg.pnu_cd = rap.pnu -- ON admg.bjd_cd = SUBSTRING(rap.pnu, 1, 10)
                    INNER JOIN
                    (
                        SELECT aptSeq, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                        FROM `{$aptTableName}`
                        GROUP BY aptSeq
                    ) AS latest
                        ON rap.aptSeq = latest.aptSeq
                        AND CONCAT(rap.dealYear, LPAD(rap.dealMonth, 2, '0'), LPAD(rap.dealDay, 2, '0')) = latest.max_date
                    WHERE rap.pnu LIKE ? AND rap.cdealDay IS NULL
                    -- GROUP BY 절에 PNU와 admg.WKT가 모두 포함되어야 일관된 결과를 얻을 수 있습니다.
                    -- GROUP BY rap.aptSeq, admg.WKT
                    {$filter5Y_for_union_query} -- 이 부분에 5년 필터링 조건 추가 ✨
                    GROUP BY rap.aptSeq
                ");
                $bindParams[] = $queryPnuLike;
                $typesString .= 's';
            }

            // --- Multi-Family Query ---
            $filter5Y_for_union_query = " AND (rmf.dealYear > {$startMonthDate5Y->format('Y')} OR (rmf.dealYear = {$startMonthDate5Y->format('Y')} AND rmf.dealMonth >= {$startMonthDate5Y->format('n')})) AND (rmf.dealYear < {$targetYear} OR (rmf.dealYear = {$targetYear} AND rmf.dealMonth <= {$targetMonth}))";
            if (isset($propertyTypeTableNames['multi'])) {
                $multiTableName = $propertyTypeTableNames['multi'];
                $unionQueries[] = trim("
                    SELECT
                        rmf.idx AS id,
                        rmf.excluUseAr,
                        rmf.dealYear, 
                        rmf.dealMonth, 
                        rmf.dealDay, 
                        rmf.dealAmount, 
                        rmf.pnu,
                        rmf.housetype AS jimok,          -- Multi-Family의 경우 housetype을 jimok로 매핑(예: 단독주택, 다가구주택)
                        NULL AS usage_type,
                        'multi' AS estate_type,
                        ST_AsText(admg.WKT) AS poligon, -- WKT 문자열로 가져오기
                        -- ST_Y(ST_Centroid(admg.WKT)) AS center_latitude,  -- 위도 (Y 좌표)
                        -- ST_X(ST_Centroid(admg.WKT)) AS center_longitude  -- 경도 (X 좌표)
                        NULL AS center_latitude,  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                        NULL AS center_longitude  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                    FROM `{$multiTableName}` AS rmf
                    INNER JOIN `{$adminTableName}` AS admg 
                    ON admg.pnu_cd = rmf.pnu -- ON admg.bjd_cd = SUBSTRING(rmf.pnu, 1, 10)
                    INNER JOIN
                    (
                        SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                        FROM `{$multiTableName}`
                        GROUP BY pnu
                    ) AS latest
                        ON rmf.pnu = latest.pnu
                        AND CONCAT(rmf.dealYear, LPAD(rmf.dealMonth, 2, '0'), LPAD(rmf.dealDay, 2, '0')) = latest.max_date
                    WHERE rmf.pnu LIKE ? AND rmf.cdealDay IS NULL
                    -- GROUP BY 절에 PNU와 admg.WKT가 모두 포함되어야 일관된 결과를 얻을 수 있습니다.
                    -- GROUP BY rmf.pnu, admg.WKT
                    {$filter5Y_for_union_query} -- 이 부분에 5년 필터링 조건 추가 ✨
                    GROUP BY rmf.pnu 
                ");
                $bindParams[] = $queryPnuLike;
                $typesString .= 's';
            }

            // --- Officetel Query ---
            $filter5Y_for_union_query = " AND (rot.dealYear > {$startMonthDate5Y->format('Y')} OR (rot.dealYear = {$startMonthDate5Y->format('Y')} AND rot.dealMonth >= {$startMonthDate5Y->format('n')})) AND (rot.dealYear < {$targetYear} OR (rot.dealYear = {$targetYear} AND rot.dealMonth <= {$targetMonth}))";
            if (isset($propertyTypeTableNames['officetel'])) {
                $officetelTableName = $propertyTypeTableNames['officetel'];
                $unionQueries[] = trim("
                    SELECT
                        rot.idx AS id,
                        rot.excluUseAr,
                        rot.dealYear, 
                        rot.dealMonth, 
                        rot.dealDay, 
                        rot.dealAmount, 
                        rot.pnu,
                        NULL AS jimok,
                        NULL AS usage_type,
                        'officetel' AS estate_type,
                        ST_AsText(admg.WKT) AS poligon, -- WKT 문자열로 가져오기
                        -- ST_Y(ST_Centroid(admg.WKT)) AS center_latitude,  -- 위도 (Y 좌표)
                        -- ST_X(ST_Centroid(admg.WKT)) AS center_longitude  -- 경도 (X 좌표)
                        NULL AS center_latitude,  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                        NULL AS center_longitude  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                    FROM `{$officetelTableName}` AS rot
                    INNER JOIN `{$adminTableName}` AS admg 
                    ON admg.pnu_cd = rot.pnu -- ON admg.bjd_cd = SUBSTRING(rot.pnu, 1, 10)
                    INNER JOIN
                    (
                        SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                        FROM `{$officetelTableName}`
                        GROUP BY pnu
                    ) AS latest
                        ON rot.pnu = latest.pnu
                        AND CONCAT(rot.dealYear, LPAD(rot.dealMonth, 2, '0'), LPAD(rot.dealDay, 2, '0')) = latest.max_date
                    WHERE rot.pnu LIKE ? AND rot.cdealDay IS NULL 
                    -- GROUP BY 절에 PNU와 admg.WKT가 모두 포함되어야 일관된 결과를 얻을 수 있습니다.
                    -- GROUP BY rot.pnu, admg.WKT
                    {$filter5Y_for_union_query} -- 이 부분에 5년 필터링 조건 추가 ✨
                    GROUP BY rot.pnu
                ");
                $bindParams[] = $queryPnuLike;
                $typesString .= 's';
            }

            // --- Land Query ---
            $filter5Y_for_union_query = " AND (rl.dealYear > {$startMonthDate5Y->format('Y')} OR (rl.dealYear = {$startMonthDate5Y->format('Y')} AND rl.dealMonth >= {$startMonthDate5Y->format('n')})) AND (rl.dealYear < {$targetYear} OR (rl.dealYear = {$targetYear} AND rl.dealMonth <= {$targetMonth}))";
            if (isset($propertyTypeTableNames['land'])) {
                $landTableName = $propertyTypeTableNames['land'];
                $unionQueries[] = trim("
                    SELECT
                        rl.idx AS id,
                        rl.dealArea AS excluUseAr,
                        rl.dealYear, 
                        rl.dealMonth, 
                        rl.dealDay, 
                        rl.dealAmount, 
                        rl.pnu,
                        rl.jimok,
                        NULL AS usage_type,
                        'land' AS estate_type,
                        ST_AsText(admg.WKT) AS poligon, -- WKT 문자열로 가져오기
                        -- ST_Y(ST_Centroid(admg.WKT)) AS center_latitude,  -- 위도 (Y 좌표)
                        -- ST_X(ST_Centroid(admg.WKT)) AS center_longitude  -- 경도 (X 좌표)
                        NULL AS center_latitude,  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                        NULL AS center_longitude  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                    FROM `{$landTableName}` AS rl
                    INNER JOIN `{$adminTableName}` AS admg 
                     ON admg.pnu_cd = rl.pnu -- ON admg.bjd_cd = SUBSTRING(rl.pnu, 1, 10)
                    INNER JOIN
                    (
                        SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                        FROM `{$landTableName}`
                        GROUP BY pnu
                    ) AS latest
                        ON rl.pnu = latest.pnu
                        AND CONCAT(rl.dealYear, LPAD(rl.dealMonth, 2, '0'), LPAD(rl.dealDay, 2, '0')) = latest.max_date
                    WHERE rl.pnu LIKE ? AND rl.jimok != '도로' AND rl.cdealDay IS NULL AND rl.shareDealingType IS NULL
                    -- GROUP BY 절에 PNU와 admg.WKT가 모두 포함되어야 일관된 결과를 얻을 수 있습니다.
                    -- GROUP BY rl.pnu, admg.WKT
                    {$filter5Y_for_union_query} -- 이 부분에 5년 필터링 조건 추가 ✨
                    GROUP BY rl.pnu
                ");
                $bindParams[] = $queryPnuLike;
                $typesString .= 's';
            }

            // --- single Query ---
            $filter5Y_for_union_query = " AND (rs.dealYear > {$startMonthDate5Y->format('Y')} OR (rs.dealYear = {$startMonthDate5Y->format('Y')} AND rs.dealMonth >= {$startMonthDate5Y->format('n')})) AND (rs.dealYear < {$targetYear} OR (rs.dealYear = {$targetYear} AND rs.dealMonth <= {$targetMonth}))";
            if (isset($propertyTypeTableNames['single'])) {
                $singleTableName = $propertyTypeTableNames['single'];
                $unionQueries[] = trim("
                    SELECT
                        rs.idx AS id,
                        rs.plottageAr as excluUseAr,  -- 대지면적을 excluUseAr로 매핑
                        rs.dealYear, 
                        rs.dealMonth, 
                        rs.dealDay, 
                        rs.dealAmount, 
                        rs.pnu,
                        rs.housetype AS jimok,          -- single의 경우 housetype을 jimok로 매핑(예: 단독주택, 다가구주택)
                        NULL AS usage_type,
                        'single' AS estate_type,
                        ST_AsText(admg.WKT) AS poligon, -- WKT 문자열로 가져오기
                        -- ST_Y(ST_Centroid(admg.WKT)) AS center_latitude,  -- 위도 (Y 좌표)
                        -- ST_X(ST_Centroid(admg.WKT)) AS center_longitude  -- 경도 (X 좌표)
                        NULL AS center_latitude,  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                        NULL AS center_longitude  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                    FROM `{$singleTableName}` AS rs
                    INNER JOIN `{$adminTableName}` AS admg 
                    ON admg.pnu_cd = rs.pnu -- ON admg.bjd_cd = SUBSTRING(rs.pnu, 1, 10)
                    INNER JOIN
                    (
                        SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                        FROM `{$singleTableName}`
                        GROUP BY pnu
                    ) AS latest
                        ON rs.pnu = latest.pnu
                        AND CONCAT(rs.dealYear, LPAD(rs.dealMonth, 2, '0'), LPAD(rs.dealDay, 2, '0')) = latest.max_date
                    WHERE rs.pnu LIKE ? AND rs.cdealDay IS NULL
                    -- GROUP BY 절에 PNU와 admg.WKT가 모두 포함되어야 일관된 결과를 얻을 수 있습니다.
                    -- GROUP BY rs.pnu, admg.WKT
                    {$filter5Y_for_union_query} -- 이 부분에 5년 필터링 조건 추가 ✨
                    GROUP BY rs.pnu 
                ");
                $bindParams[] = $queryPnuLike;
                $typesString .= 's';
            }

            // --- commercial Query ---
            $filter5Y_for_union_query = " AND (rc.dealYear > {$startMonthDate5Y->format('Y')} OR (rc.dealYear = {$startMonthDate5Y->format('Y')} AND rc.dealMonth >= {$startMonthDate5Y->format('n')})) AND (rc.dealYear < {$targetYear} OR (rc.dealYear = {$targetYear} AND rc.dealMonth <= {$targetMonth}))";
            if (isset($propertyTypeTableNames['commercial'])) {
                $commercialTableName = $propertyTypeTableNames['commercial'];
                $unionQueries[] = trim("
                    SELECT
                        rc.idx AS id,
                        rc.buildingAr as excluUseAr,  -- 건물면적(전용)을 excluUseAr로 매핑
                        rc.dealYear, 
                        rc.dealMonth, 
                        rc.dealDay, 
                        rc.dealAmount, 
                        rc.pnu,
                        rc.buildingType AS jimok,          -- commercial 경우 buildingType jimok로 매핑(예: 일반(상가/사무실), 집합(빌딩))
                        rc.buildingUse AS usage_type,      -- 집합 건물주용도(예: 업무,근린 판매
                        'commercial' AS estate_type,
                        ST_AsText(admg.WKT) AS poligon, -- WKT 문자열로 가져오기
                        -- ST_Y(ST_Centroid(admg.WKT)) AS center_latitude,  -- 위도 (Y 좌표)
                        -- ST_X(ST_Centroid(admg.WKT)) AS center_longitude  -- 경도 (X 좌표)
                        NULL AS center_latitude,  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                        NULL AS center_longitude  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                    FROM `{$commercialTableName}` AS rc
                    INNER JOIN `{$adminTableName}` AS admg 
                    ON admg.pnu_cd = rc.pnu -- ON admg.bjd_cd = SUBSTRING(rc.pnu, 1, 10)
                    INNER JOIN
                    (
                        SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                        FROM `{$commercialTableName}`
                        GROUP BY pnu
                    ) AS latest
                        ON rc.pnu = latest.pnu
                        AND CONCAT(rc.dealYear, LPAD(rc.dealMonth, 2, '0'), LPAD(rc.dealDay, 2, '0')) = latest.max_date
                    WHERE rc.pnu LIKE ? AND rc.cdealDay IS NULL AND rc.shareDealingType IS NULL
                    -- GROUP BY 절에 PNU와 admg.WKT가 모두 포함되어야 일관된 결과를 얻을 수 있습니다.
                    -- GROUP BY rc.pnu, admg.WKT
                    {$filter5Y_for_union_query} -- 이 부분에 5년 필터링 조건 추가 ✨
                    GROUP BY rc.pnu 
                ");
                $bindParams[] = $queryPnuLike;
                $typesString .= 's';
            }

            // --- factory Query ---
            $filter5Y_for_union_query = " AND (rf.dealYear > {$startMonthDate5Y->format('Y')} OR (rf.dealYear = {$startMonthDate5Y->format('Y')} AND rf.dealMonth >= {$startMonthDate5Y->format('n')})) AND (rf.dealYear < {$targetYear} OR (rf.dealYear = {$targetYear} AND rf.dealMonth <= {$targetMonth}))";
            if (isset($propertyTypeTableNames['factory'])) {
                $factoryTableName = $propertyTypeTableNames['factory'];
                $unionQueries[] = trim("
                    SELECT
                        rf.idx AS id,
                        rf.buildingAr as excluUseAr,  -- 건물면적(전용)을 excluUseAr로 매핑
                        rf.dealYear, 
                        rf.dealMonth, 
                        rf.dealDay, 
                        rf.dealAmount, 
                        rf.pnu,
                        rf.buildingType AS jimok,          -- factory 경우 buildingType을 jimok로 매핑(예: 일반, 집합)
                        rf.buildingUse AS usage_type,      -- 집합 건물주용도(예: 공장,창고시설)
                        'factory' AS estate_type,
                        ST_AsText(admg.WKT) AS poligon, -- WKT 문자열로 가져오기
                        -- ST_Y(ST_Centroid(admg.WKT)) AS center_latitude,  -- 위도 (Y 좌표)
                        -- ST_X(ST_Centroid(admg.WKT)) AS center_longitude  -- 경도 (X 좌표)
                        NULL AS center_latitude,  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                        NULL AS center_longitude  -- <<< DB에서 계산하지 않고 NULL로 가져옴
                    FROM `{$factoryTableName}` AS rf
                    INNER JOIN `{$adminTableName}` AS admg 
                    ON admg.pnu_cd = rf.pnu -- ON admg.bjd_cd = SUBSTRING(rf.pnu, 1, 10)
                    INNER JOIN
                    (
                        SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                        FROM `{$factoryTableName}`
                        GROUP BY pnu
                    ) AS latest
                        ON rf.pnu = latest.pnu
                        AND CONCAT(rf.dealYear, LPAD(rf.dealMonth, 2, '0'), LPAD(rf.dealDay, 2, '0')) = latest.max_date
                    WHERE rf.pnu LIKE ? AND rf.cdealDay IS NULL AND rf.shareDealingType IS NULL
                    -- GROUP BY 절에 PNU와 admg.WKT가 모두 포함되어야 일관된 결과를 얻을 수 있습니다.
                    -- GROUP BY rf.pnu, admg.WKT
                    {$filter5Y_for_union_query} -- 이 부분에 5년 필터링 조건 추가 ✨
                    GROUP BY rf.pnu 
                ");
                $bindParams[] = $queryPnuLike;
                $typesString .= 's';
            }

            if (empty($unionQueries)) {
                $logMessage = "경고: EMD '{$emdCdInner}'에 대해 설정된 유효한 부동산 유형이 없습니다. 건너뜁니다.";
                
                log_to_db($historyId, $logMessage, $conn, 'WARN');
                $sidoErrors++;
                continue;
            }
            
            $sql = implode(" UNION ALL ", $unionQueries);
            $sql .= " ORDER BY dealYear DESC, dealMonth DESC, dealDay DESC";
            
            if ($stmt = $conn->prepare($sql)) {
                if (!empty($bindParams)) {
                    $refs = [];
                    if (strlen($typesString) > 0) { 
                        foreach ($bindParams as $key => $value) {
                            $refs[$key] = &$bindParams[$key];
                        }
                        call_user_func_array([$stmt, 'bind_param'], array_merge([$typesString], $refs));
                    }
                }

                $stmt->execute();
                $result = $stmt->get_result();

                $emdDataCollection = []; // --- 중요: 각 EMD마다 데이터 컬렉션 초기화 ---

                if ($result && $result->num_rows > 0) {
                    while ($row = $result->fetch_assoc()) {
                        // ... 데이터 처리 
                        if (!isset($row['jimok'])) {
                            $row['jimok'] = null;
                        }
                        $emdDataCollection[] = $row;
                    }
                }
                $stmt->close();
                

            } else { // // 쿼리 준비 실패 또는 쿼리 실행 실패 (execute 전에 prepare에서 실패)
                $logMessage = "DB Execute 또는 Fetch 실패 for EMD {$emdCdInner}: " . $conn->error . "\nSQL: " . $sql; 
                
                log_to_db($historyId, $logMessage, $conn, 'ERROR');
                $sidoErrors++;
                continue;
            }

            // 캐싱할 데이터가 있으면 Redis에 추가
            if (!empty($emdDataCollection)) { // 데이터가 없으면 Redis에 set하지 않음
                $cacheKey = "{$rpEmdCachePrefix}{$emdCdInner}"; // $emdCdInner는 현재 EMD 코드

                // ===>>> 여기를 수정합니다 <<<===
                // 1. Redis에 저장할 최종 데이터 구조를 만듭니다.
                $processedEmdDataCollection = []; // 새로 처리된 데이터를 담을 배열

                foreach ($emdDataCollection as $row) {

                    $poligonContent = isset($row['poligon']) ? trim($row['poligon']) : '';

                    if (!empty($poligonContent)) { // 빈 문자열이나 공백만 있는 문자열은 여기서 걸러집니다.
                    //if (isset($row['poligon']) && !empty($row['poligon'])) {
                        //$coordinates = extractCoordinates($row['poligon']);
                        $coordinates = extractCoordinates($poligonContent); // 수정된 $poligonContent 사용
                    
                        $centerCoords = getPolygonCentroid($coordinates);
                        $row['center_latitude'] = $centerCoords[1]; // 위도 (latitude)
                        $row['center_longitude'] = $centerCoords[0]; // 경도 (longitude)

                        //error_log("[DEBUG] EMD {$emdCdInner} 폴리곤 중심 계산 완료(poligon 있음): 위도 {$row['center_latitude']}, 경도 {$row['center_longitude']}");
                    } else {
                        // poligon 내용이 비어있거나 유효하지 않은 경우
                        $row['center_latitude'] = null;
                        $row['center_longitude'] = null;
                        error_log("[DEBUG] EMD {$emdCdInner} 폴리곤 데이터 없음/유효하지 않음: 위도 {$row['center_latitude']}, 경도 {$row['center_longitude']}");
                    }
                    
                    // Redis에 저장할 데이터에는 poligon 필드 자체는 포함하지 않을 수 있습니다 (선택 사항)
                    unset($row['poligon']); // 캐시에 WKT 폴리곤을 저장하지 않을 경우
                    
                    $processedEmdDataCollection[] = $row; // 처리된 row를 새로운 배열에 추가
                }
                // 최종 캐싱할 데이터 구조 생성
                $data_to_store_in_redis = [
                    'cached_at' => date('Y-m-d H:i:s'), // 현재 시간으로 cached_at 추가
                    'data' => $processedEmdDataCollection // 처리된 실거래가 데이터 배열을 'data' 키 아래에 저장
                ];

                // 2. 이 데이터를 JSON으로 인코딩하여 Redis에 SET 합니다.
                $json_data_to_store = json_encode($data_to_store_in_redis, JSON_UNESCAPED_UNICODE);
                $redisPipeline->set($cacheKey, $json_data_to_store);
                $pipelineOps++; // 파이프라인에 명령 추가 시 카운트 증가
                // 일정 개수 이상 쌓이면 파이프라인 실행
                if ($pipelineOps >= $pipelineFlushSize) {

                    try {
                        $redisPipeline->exec(); // 명령 실행
                        log_to_db($historyId, "Redis 파이프라인 {$pipelineFlushSize}개 명령 플러시됨.", $conn, 'DEBUG');
                    } catch (Exception $e) {
                        // 파이프라인 중간에 에러가 나면 처리하고 계속 진행하거나, 전체 중단
                        $logMessage = "Redis pipeline execution failed mid-loop for EMD {$emdCdInner}: " . $e->getMessage();
                        log_to_db($historyId, $logMessage, $conn, 'CRITICAL');
                        $sidoErrors++; // 오류 카운트
                    }
                    $redisPipeline = $redis->pipeline(); // 파이프라인 재초기화
                    $pipelineOps = 0; // 명령 카운트 리셋
                }
                
                log_to_db($historyId, "EMD '{$emdCdInner}'의 실거래가 데이터를 조회 후 Redis에 캐싱했습니다. (" . count($emdDataCollection) . "건) 처리된 EMD수(" . ($emdIndex + 1) . "/" . count($currentSidoEmdCodes) . ")", $conn);
                
            } else {
                log_to_db($historyId, "EMD '{$emdCdInner}'에 조회된 데이터가 없어 Redis 캐시에 저장하지 않습니다. 처리된 EMD수(" . ($emdIndex + 1) . "/" . count($currentSidoEmdCodes) . ")", $conn, 'INFO');
            }

            $processedEmdCount++;
            
        } // end foreach EMD within Sido

        // ========================================================
        // === 3. Redis 파이프라인 exec() 실행 직전 최종 확인 ===
        // ========================================================
        check_cancellation($parentHistoryId, $conn);
        //check_cancellation($historyId, $conn); // 선택 사항

        if ($pipelineOps > 0) { // 파이프라인에 아직 실행되지 않은 명령이 남아있다면
            try {
                $redisPipeline->exec(); // 남아있는 명령 실행
                log_to_db($historyId, "Redis 파이프라인 종료 전 남은 {$pipelineOps}개 명령 플러시됨.", $conn, 'DEBUG');
                // 여기서는 이 메시지가 실행될 때만 INFO 레벨의 로그를 남기는 게 좋습니다.
                log_to_db($historyId, "Redis 파이프라인 성공적으로 실행됨 (Sido {$sidoCd}). 처리된 EMD 수: {$processedEmdCount}. 에러 수: {$sidoErrors}.", $conn, 'INFO');
            } catch (Exception $e) {
                $logMessage = "Redis pipeline execution failed at final flush for Sido {$sidoCd}: " . $e->getMessage();
                log_to_db($historyId, $logMessage, $conn, 'CRITICAL');
                $sidoErrors++; // 오류 카운트
                // 여기서는 최종적인 실패 메시지 한 번만 기록
                update_history_status($historyId, 'failed', $logMessage, $conn); // 최종 상태 업데이트 (필요시)
            }
        } else {
            // 파이프라인에 추가된 명령이 전혀 없었을 경우에도 성공 메시지는 남겨야 합니다.
            log_to_db($historyId, "Redis 파이프라인 성공적으로 실행됨 (Sido {$sidoCd}). 처리된 EMD 수: {$processedEmdCount}. 에러 수: {$sidoErrors}. (플러시할 명령 없음)", $conn, 'INFO');
        }


        $currentSidoEndTime = microtime(true);
        $currentSidoDuration = $currentSidoEndTime - $currentSidoStartTime;
        // === 수정: Implicit conversion Deprecated 경고 회피 ===
        $hours = (int)floor($currentSidoDuration / 3600);
        $minutes_float = fmod(floor($currentSidoDuration / 60), 60);
        $seconds_float = fmod($currentSidoDuration, 60);

        // 최종 결과는 정수로 명시적 캐스팅 (여기서의 (int)는 경고를 유발하지 않습니다)
        $minutes = (int)$minutes_float;
        $seconds = (int)round($seconds_float); // round()를 사용하면 초 부분에서 반올림 처리 가능

        $currentSidoDurationFormatted = sprintf("%02d시 %02d분 %02d초", $hours, $minutes, $seconds);

        // 현재 시도 작업의 최종 상태 업데이트
        $sidoFinalStatus = ($sidoErrors > 0) ? 'failed' : 'success';
        $sidoFinalMessage = "Sido {$sidoCd} 캐시 작업 완료. 총 소요 시간: {$currentSidoDurationFormatted}. 처리된 EMD: {$processedEmdCount}. 에러: {$sidoErrors}.";
        
        log_to_db($historyId, $sidoFinalMessage, $conn, ($sidoErrors > 0) ? 'ERROR' : 'INFO');
        update_history_status($historyId, $sidoFinalStatus, $sidoFinalMessage, $conn, true);
        
        $processedSidoCount++; 
        $overallErrors += $sidoErrors; 

    } catch (Exception $e) {
        $logMessage = "Sido {$sidoCd} 처리 중 치명적인 오류 발생: " . $e->getMessage();
        if ($historyId) {
            log_to_db($historyId, $logMessage, $conn, 'CRITICAL');
            update_history_status($historyId, 'failed', $logMessage, $conn, true);
        } else {
            log_to_db($parentHistoryId, $logMessage . " (History ID 생성 전 발생 for Sido {$sidoCd})", $conn, 'CRITICAL');
        }
        $overallErrors++; 
    }
} // end foreach Sido
// --- 마스터 작업 (parentHistoryId)의 최종 상태 업데이트 ---
$endTimeTotal = microtime(true);
$durationTotal = $endTimeTotal - $startTimeTotal;
// === 수정: Implicit conversion Deprecated 경고 회피 ===
$hours = (int)floor($durationTotal / 3600);

$minutes_float = fmod(floor($durationTotal / 60), 60);
$seconds_float = fmod($durationTotal, 60);

// 최종 결과는 정수로 명시적 캐스팅 (여기서의 (int)는 경고를 유발하지 않습니다)
$minutes = (int)$minutes_float;
$seconds = (int)round($seconds_float); // round()를 사용하면 초 부분에서 반올림 처리 가능

$durationTotalFormatted = sprintf("%02d시 %02d분 %02d초", $hours, $minutes, $seconds);

$masterFinalStatus = ($overallErrors > 0) ? 'failed' : 'success';
$masterFinalMessage = "업로드 마스터 배치 작업 완료 (총 시도: " . count($sidoCodesToProcessQueue) . ", 성공 시도: {$processedSidoCount}, 총 에러: {$overallErrors}). 총 소요 시간: {$durationTotalFormatted}.";

log_to_db($parentHistoryId, $masterFinalMessage, $conn, ($overallErrors > 0) ? 'ERROR' : 'INFO');
update_history_status($parentHistoryId, $masterFinalStatus, $masterFinalMessage, $conn,true);


if ($conn) $conn->close();
if ($redis) $redis->close();
exit(0);

// 중심 좌표를 계산하는 함수 호출 추가

function extractCoordinates($polygonText) {
    // MULTIPOLYGON 형식 문자열을 파싱하여 좌표 배열로 변환
    preg_match_all('/\(([^()]+)\)/', $polygonText, $matches);
    $coords = [];
    foreach ($matches[1] as $polygon) {
        $points = explode(',', $polygon);
        $polygonCoords = [];
        foreach ($points as $point) {
            $latLng = array_map('floatval', explode(' ', trim($point)));
            $polygonCoords[] = $latLng;
        }
        $coords[] = [$polygonCoords];
    }
    return $coords;
}

// (기존 파일에서 deleteKeysByPattern 함수 복사)
function deleteKeysByPattern(Redis $redis, string $pattern, int $count = 10000): int
{
    $deleted = 0;
    $iterator = null;

    do {
        $keys = $redis->scan($iterator, $pattern, $count);
        // false는 에러가 아니라 "이 배치에 매칭 키 없음"을 의미합니다. 따라서 false인 경우에도 continue로 넘어가서 다음 배치를 시도해야 합니다.
        if ($keys === false) {
            // Redis 연결 오류 등으로 SCAN이 실패하면 예외 처리
            //throw new Exception("Redis SCAN failed for pattern {$pattern}");
            continue;
        }

        if (!empty($keys)) {
            $deleted += $redis->del($keys);
        }
    } while ($iterator !== 0);

    return $deleted;
}
/*
function extractCoordinates($polygonText) {
    $coords = [];
    
    // WKT 문자열이 "MULTIPOLYGON"으로 시작하는지 확인
    if (strpos(trim($polygonText), 'MULTIPOLYGON') === 0) {
        // "MULTIPOLYGON ((...))" 형태에서 가장 안쪽의 좌표 쌍들을 추출합니다.
        // 예를 들어 MULTIPOLYGON(((1 1, 2 2), (3 3, 4 4))) -> ((1 1, 2 2), (3 3, 4 4))
        // 또는 MULTIPOLYGON(((1 1, 2 2))) -> (1 1, 2 2)
        // 중첩된 괄호를 처리할 수 있도록 재귀적인 패턴 (R)을 사용합니다.
        // PHP preg_match는 재귀 패턴을 직접 지원하지 않으므로, 괄호 쌍의 깊이를 고려해야 합니다.
        // 가장 간단한 접근은 최외곽 "MULTIPOLYGON" 부분을 제거하고 내부 좌표 문자열을 파싱하는 것입니다.

        // MULTIPOLYGON(((...))) 또는 POLYGON((...)) 등 여러 형식에 대응하도록 변경
        $polygonText = trim($polygonText);
        if (substr($polygonText, 0, 12) === 'MULTIPOLYGON') {
            $cleanedText = substr($polygonText, 13); // "MULTIPOLYGON" 제거
            // 가장 바깥 괄호 두 개를 제거: MULTIPOLYGON(((...))) -> ((...))
            if (substr($cleanedText, 0, 1) === '(' && substr($cleanedText, -1) === ')') {
                 $cleanedText = substr($cleanedText, 1, -1);
            }
        } elseif (substr($polygonText, 0, 7) === 'POLYGON') {
             $cleanedText = substr($polygonText, 8); // "POLYGON" 제거
             // 가장 바깥 괄호 하나 제거: POLYGON((...)) -> (...)
             if (substr($cleanedText, 0, 1) === '(' && substr($cleanedText, -1) === ')') {
                 $cleanedText = substr($cleanedText, 1, -1);
             }
        } else {
             // 알 수 없는 WKT 형식일 경우, 빈 배열 반환
             error_log("경고: extractCoordinates에 알 수 없는 WKT 형식 '{$polygonText}'이 전달되었습니다.");
             return [];
        }

        // 이제 cleanedText는 하나의 MultiPolygon 안의 여러 Polygon 문자열 (예: "((lon lat, ...)), ((lon lat, ...))")
        // 또는 하나의 Polygon의 내부링 포함 문자열 (예: "(lon lat, ...),(lon lat, ...)")
        // 또는 하나의 Polygon의 외부링 문자열 (예: "(lon lat, ...)")
        // 을 포함합니다. 이를 다시 파싱합니다.

        // 각 Polygon을 찾습니다. (ex: "(lon lat, ...)")
        // 여기서는 가장 바깥 괄호의 수준만 고려합니다.
        // 정규식을 더 보강하여 중첩 괄호를 정확히 분리해야 합니다.
        // 간소화된 접근: 괄호와 콤마를 기준으로 분리 후 클린업.
        
        // Example: "((1 1,2 2)),((3 3,4 4))"  -> ["(1 1,2 2)", "(3 3,4 4)"]
        // Example: "(1 1,2 2)" -> ["(1 1,2 2)"]
        
        // 이 부분은 가장 정교한 WKT 파서가 필요하지만, 간략하게는 이렇게 시도해 볼 수 있습니다.
        // 가장 바깥쪽 괄호들을 제거하고 콤마로 분리
        $polygonStrings = preg_split('/(?<=))\s*,\s*(?=\()/s', $cleanedText); 
                    
        // 괄호 안에 있는 모든 문자열을 찾아 (X Y, X Y, ...) 형태를 예상
        // 이 정규식은 재귀적인 괄호를 처리하는 데 한계가 있습니다.
        // 더 견고한 방법: 외부 라이브러리 사용 또는 스택 기반의 수동 파서 구현

        foreach ($polygonStrings as $polyString) {
            $polyString = trim($polyString, '() '); // 바깥쪽 괄호 제거
            if (empty($polyString)) continue;

            $pointsStrings = explode('), (', $polyString); // 내부 링이 있다면 분리

            $currentPolygonCoords = [];
            foreach ($pointsStrings as $ringString) {
                $ringString = trim($ringString, '() ');
                if (empty($ringString)) continue;

                $points = explode(',', $ringString);
                $ringCoords = [];
                foreach ($points as $point) {
                    $latLng = array_map('floatval', explode(' ', trim($point)));
                    // $latLng가 반드시 2개의 float 값을 포함하는지 확인
                    if (count($latLng) == 2 && is_numeric($latLng[0]) && is_numeric($latLng[1])) {
                        $ringCoords[] = $latLng; // GeoJSON 표준은 [lon, lat]
                    } else {
                        error_log("경고: extractCoordinates에서 잘못된 좌표 형식 감지: {$point}");
                        // 유효하지 않은 좌표는 무시하거나 에러 처리
                    }
                }
                if (!empty($ringCoords)) {
                    $currentPolygonCoords[] = $ringCoords;
                }
            }
            if (!empty($currentPolygonCoords)) {
                $coords[] = $currentPolygonCoords;
            }
        }

    } elseif (strpos(trim($polygonText), 'POINT') === 0) {
        // POINT(X Y) 형식 처리 (필요하다면)
        // 현재는 MULTIPOLYGON에 초점
        error_log("알림: extractCoordinates에 POINT 형식 '{$polygonText}'이 전달되었습니다. 현재 MULTIPOLYGON/POLYGON만 처리합니다.");
        return [];

    } else {
        // 'MULTIPOLYGON'이나 'POLYGON'으로 시작하지 않는 경우 (예: 잘못된 문자열 또는 JSON)
        // JSON 형태의 GeoJSON Feature/Geometry를 가정하고 디코드 시도
        $decoded = json_decode($polygonText, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            // GeoJSON Geometry Collection 또는 Feature Collection에서 MultiPolygon/Polygon 찾기
            // 이 부분은 GeoJSON의 복잡성에 따라 더 정교하게 구현해야 합니다.
            // 여기서는 geometry 객체 바로 밑에 type과 coordinates가 있다고 가정
            if (isset($decoded['type']) && $decoded['type'] === 'MultiPolygon' && isset($decoded['coordinates'])) {
                $coords = $decoded['coordinates'];
            } elseif (isset($decoded['type']) && $decoded['type'] === 'Polygon' && isset($decoded['coordinates'])) {
                // Polygon도 MultiPolygon처럼 2D 배열 안에 링 배열이 들어있어야 getPolygonCentroid가 처리할 수 있습니다.
                $coords[] = $decoded['coordinates']; 
            } else {
                error_log("경고: extractCoordinates에서 파싱 가능한 GeoJSON 객체/형식이 아님: {$polygonText}");
            }
        } else {
            error_log("경고: extractCoordinates에 파싱할 수 없는 형식의 문자열 '{$polygonText}'이 전달되었습니다. WKT 또는 GeoJSON JSON 형식 아님.");
            return []; // 파싱 실패 시 빈 배열 반환
        }
    }
    
    // 최종 결과 반환 전, $coords가 빈 배열이면 경고 로그
    if (empty($coords)) {
        error_log("경고: extractCoordinates가 최종적으로 빈 좌표 배열을 반환했습니다. 원본 텍스트: {$polygonText}");
    }

    return $coords;
}
*/
?>