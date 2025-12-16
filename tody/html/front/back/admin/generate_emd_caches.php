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

// ----------------------------------------------------
// DB 로깅 및 상태 업데이트 헬퍼 함수
// (이 파일 상단에 정의하여 스크립트 어디서든 사용 가능하게 함)
// ----------------------------------------------------
function log_to_db(?int $historyId, string $message, mysqli $conn, string $level = 'INFO') {
    if ($historyId === null) {
        error_log("[DB_LOG_SKIP] No historyId for DB logging: " . $message); 
        return;
    }
    try {
        $stmt = $conn->prepare("INSERT INTO upload_logs (history_id, log_message, level) VALUES (?, ?, ?)"); 
        $stmt->bind_param("iss", $historyId, $message, $level); 
        $stmt->execute();
        $stmt->close();
    } catch (Exception $e) {
        error_log("[DB_LOG_FAIL] Failed to log to upload_logs for history ID {$historyId} (level: {$level}): " . $e->getMessage() . ". Original message: " . $message, 0);
    }
}

function update_history_status(int $historyId, string $status, string $logMessage, mysqli $conn) {
    try {
        // historyId 컬럼은 ID라고 가정
        $stmt = $conn->prepare("UPDATE upload_history SET status = ?, log_message = ?, finished_at = NOW() WHERE id = ?");
        // prepare()가 성공했는지 확인하는 것이 좋습니다.
        if ($stmt === false) {
            error_log("[DB_STATUS_UPDATE_FAIL] Prepare failed for ID {$historyId}: " . $conn->error);
            return; // 쿼리 준비 실패 시 함수 종료
        }
        $stmt->bind_param("ssi", $status, $logMessage, $historyId);
        $stmt->execute();
        // execute() 후 오류 확인
        if ($stmt->error) {
            error_log("[DB_STATUS_UPDATE_FAIL] Execute failed for ID {$historyId}: " . $stmt->error);
        }
        $stmt->close();
    } catch (Exception $e) {
        error_log("[DB_STATUS_UPDATE_FAIL] Failed to update upload_history for ID {$historyId} to status '{$status}': " . $e->getMessage(), 0);
    }
}


function check_cancellation(int $historyId, mysqli $conn) {
    try {
        error_log("[DEBUG_CANCEL] check_cancellation 호출됨. historyId: {$historyId}");
        $stmt = $conn->prepare("SELECT status FROM upload_history WHERE id = ?");
        if (!$stmt) {
            error_log("[DEBUG_CANCEL] SQL prepare 실패: " . $conn->error);
            return; // 쿼리 준비 실패 시 바로 리턴
        }
        $stmt->bind_param("i", $historyId);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            error_log("[DEBUG_CANCEL] DB 조회 결과 - ID: {$historyId}, Status: {$row['status']}");
            if ($row['status'] === 'canceled') {
                $logMessage = "작업 ID {$historyId}가 취소 요청되어 스크립트를 중단합니다.";
                error_log("[CANCELED] " . $logMessage);
                
                // --- 하위 작업 업데이트 시작 ---
                /*
                error_log("[DEBUG_CANCEL] 하위 작업 업데이트 시도. parent_history_id = {$historyId}");
                $updateChildrenStmt = $conn->prepare("UPDATE upload_history SET status = 'canceled', finished_at = NOW(), log_message = '마스터 작업 취소로 인해 중단됨' WHERE parent_history_id = ? AND status = 'processing'");
                if (!$updateChildrenStmt) {
                    error_log("[DEBUG_CANCEL] 하위 작업 UPDATE prepare 실패: " . $conn->error);
                    $conn->close(); exit(0); // 준비 실패 시 종료
                }
                $updateChildrenStmt->bind_param("i", $historyId);
                $updateChildrenStmt->execute();
                
                $affectedRows = $updateChildrenStmt->affected_rows;
                error_log("[DEBUG_CANCEL] 하위 작업 업데이트 결과 affected_rows: {$affectedRows}");

                if ($affectedRows > 0) {
                    error_log("[CANCELED] 마스터 {$historyId} 취소로 인해 " . $affectedRows . "개의 하위 작업도 취소 처리되었습니다.");
                } else {
                    error_log("[CANCELED] 마스터 {$historyId} 취소되었으나, 하위 작업 중 'processing' 상태인 것은 없었습니다. Affected Rows: {$affectedRows}");
                }
                $updateChildrenStmt->close();

                // 트랜잭션이 활성화되지 않았다면 autocommit으로 바로 반영되지만,
                // 안전을 위해 명시적으로 commit 호출
                if (!$conn->autocommit_is_on) { // autocommit이 꺼져있을 경우에만 commit
                    error_log("[DEBUG_CANCEL] Autocommit off, attempting commit.");
                    $conn->commit();
                } else {
                    error_log("[DEBUG_CANCEL] Autocommit is on, changes should be auto-committed.");
                }
                */
                $conn->close(); // 명시적으로 연결 종료
                exit(0); // 스크립트 강제 종료
            }
        } else {
            error_log("[DEBUG_CANCEL] ID {$historyId}에 대한 upload_history 레코드를 찾을 수 없습니다.");
        }
        $stmt->close();
    } catch (Exception $e) {
        error_log("[CANCEL_CHECK_FAIL] Exception during check_cancellation for ID {$historyId}: " . $e->getMessage());
        // 혹시 예외 발생 시 롤백을 고려할 수 있으나, 여기서는 exit(0) 하므로 영향이 제한적
    }
}

// --- 파일 로드 경로 수정: realpath()를 사용하여 절대 경로 확보 ---
// __DIR__은 현재 스크립트 파일의 절대 경로 (예: /var/www/tody/html/front/back/admin)
// 웹 루트 (/var/www/tody/html)는 __DIR__에서 상위 3단계입니다.
$web_root = realpath(__DIR__ . '/../../..'); 
if ($web_root === false) { // 경로 찾기 실패시 비상 로직
    error_log("FATAL: Could not resolve web_root path from __DIR__. Script will exit.");
    exit(1); 
}

// === DB 연결 로드 (이제 $web_root를 사용합니다!) ===
require_once $web_root . '/front/back/00-include/dbconnect.php'; 
require_once $web_root . '/front/back/00-include/common.php';     
require_once $web_root . '/front/back/realPrice/poligon_center.php'; 


// -----------------------------------------------------------
// CLI 옵션 처리: --sido (콤마 구분 문자열), --parent-history-id
// -----------------------------------------------------------
$options = getopt("", ["sido:", "parent-history-id:"]);
$sidoParamRaw = $options['sido'] ?? null;
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
    error_log($logMessage);
    update_history_status($parentHistoryId, 'failed', $logMessage, $conn);
    $conn->close();
    exit(1);
}

if (!empty($invalidCodes)) {
    $logMessage = "경고: 유효하지 않거나 지원되지 않는 시도 코드가 요청되었습니다: " . implode(', ', $invalidCodes);
    error_log($logMessage);
    log_to_db($parentHistoryId, $logMessage, $conn, 'WARN');
}

log_to_db($parentHistoryId, "처리할 시도 코드: " . implode(', ', $sidoCodesToProcessQueue), $conn, 'INFO');


// --- Redis 연결 (루프 시작 전 한 번만 연결) ---
$redis = new Redis();
try {
    $redis->connect('127.0.0.1', 6379); 
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
$polygonCenterCachePrefix = 'polygon:center:';


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
        $subLogMessage = "Sido {$sidoCd} Redis 캐시 작업 시작.";
        $stmt->bind_param("sssis", $taskType, $sidoCd, $status, $parentHistoryId, $subLogMessage);
        $stmt->execute();
        $historyId = $conn->insert_id;
        $stmt->close();

        if ($historyId === 0) {
            throw new Exception("Sido {$sidoCd}의 upload_history 레코드 생성 실패: " . $conn->error);
        }

        log_to_db($historyId, "Sido {$sidoCd} Redis 캐시 작업 시작.", $conn, 'INFO');
        update_history_status($historyId, 'processing', "Sido {$sidoCd} 작업 초기화 중.", $conn);


        // ===>>> EMD 코드 추출 전: 마스터 ID를 전달 <<<===
        check_cancellation($parentHistoryId, $conn); 


        // --- 테이블 매핑 초기화 (현재 시도에만 해당) ---
        // === 수정: $tableMappings 구조 변경 (배열 안에 배열 대신 직접 문자열 매핑) ===
        $propertyTypeTableNames = [
            'apt'       => "realPrice_apt_{$sidoCd}",
            'multi'     => "realPrice_multiFamily_{$sidoCd}",
            'officetel' => "realPrice_officetel_{$sidoCd}",
            'land'      => "realPrice_land_{$sidoCd}"
        ];
        $adminTableName = "AL_D002_{$sidoCd}"; 
        
        log_to_db($historyId, "Sido {$sidoCd} 부동산 유형별 테이블 매핑 완료. Admin Table: {$adminTableName}", $conn);

        // --- EMD (읍면동) 코드 목록 추출 (현재 시도에만 해당) ---
        $currentSidoEmdCodes = [];
        log_to_db($historyId, "Sido '{$sidoCd}'에서 EMD 코드를 추출 중...", $conn);

        $sqlEmd = "SELECT emd_code FROM SIDO_EMD_CODE WHERE use_yn = '1' AND sido_code = '{$sidoCd}' ORDER BY emd_code";
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
        check_cancellation($parentHistoryId, $conn);

        // --- 각 EMD 코드별 데이터 조회, 가공, Redis 저장 (현재 시도 내 EMD 루프) ---
        $processedEmdCount = 0;
        $redisPipeline = $redis->pipeline(); 

        foreach ($currentSidoEmdCodes as $emdIndex => $emdCdInner) {
            // ===============================================================
            // === 2. 각 EMD 코드 처리 중 주기적으로 취소 여부 확인 (선택적, 권장) ===
            // ===============================================================
            if ($emdIndex % 10 === 0) { // 매 10번째 EMD 코드마다 확인하여 DB 부하 감소
                check_cancellation($parentHistoryId, $conn); // 마스터 작업이 취소됐는지 확인
                // 선택 사항: 개별 Sido 작업 ($historyId)이 취소되었는지도 확인 가능
                // check_cancellation($historyId, $conn); 
            }
            log_to_db($historyId, "EMD 코드 '{$emdCdInner}' 처리 중... (" . ($emdIndex + 1) . "/" . count($currentSidoEmdCodes) . ")", $conn, 'INFO');
            
            $queryPnuLike = substr($emdCdInner, 0, 8) . '%'; 

            $emdDataCollection = [];
            $unionQueries = [];
            $bindParams = [];
            $typesString = '';

            // --- APT Query ---
            // === 수정: $propertyTypeTableNames 배열에서 직접 테이블 이름을 가져옵니다. ===
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
                        'apt' AS estate_type,
                        -- admg.WKT AS poligon_wkt, -- 필요하다면 WKT 문자열 자체도 가져오고
                        ST_Y(ST_Centroid(admg.WKT)) AS center_latitude,  -- 위도 (Y 좌표)
                        ST_X(ST_Centroid(admg.WKT)) AS center_longitude  -- 경도 (X 좌표)
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
                    GROUP BY rap.aptSeq, admg.WKT
                ");
                $bindParams[] = $queryPnuLike;
                $typesString .= 's';
            }

            // --- Multi-Family Query ---
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
                        NULL AS jimok,
                        'multi' AS estate_type,
                        -- admg.WKT AS poligon_wkt, -- 필요하다면 WKT 문자열 자체도 가져오고
                        ST_Y(ST_Centroid(admg.WKT)) AS center_latitude,  -- 위도 (Y 좌표)
                        ST_X(ST_Centroid(admg.WKT)) AS center_longitude  -- 경도 (X 좌표)
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
                    GROUP BY rmf.pnu, admg.WKT 
                ");
                $bindParams[] = $queryPnuLike;
                $typesString .= 's';
            }

            // --- Officetel Query ---
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
                        'officetel' AS estate_type,
                        -- admg.WKT AS poligon_wkt, -- 필요하다면 WKT 문자열 자체도 가져오고
                        ST_Y(ST_Centroid(admg.WKT)) AS center_latitude,  -- 위도 (Y 좌표)
                        ST_X(ST_Centroid(admg.WKT)) AS center_longitude  -- 경도 (X 좌표)
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
                    GROUP BY rot.pnu, admg.WKT
                ");
                $bindParams[] = $queryPnuLike;
                $typesString .= 's';
            }

            // --- Land Query ---
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
                        'land' AS estate_type,
                        -- admg.WKT AS poligon_wkt, -- 필요하다면 WKT 문자열 자체도 가져오고
                        ST_Y(ST_Centroid(admg.WKT)) AS center_latitude,  -- 위도 (Y 좌표)
                        ST_X(ST_Centroid(admg.WKT)) AS center_longitude  -- 경도 (X 좌표)
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
                    WHERE rl.pnu LIKE ? AND rl.jimok != '도로' AND rl.cdealDay IS NULL
                    -- GROUP BY 절에 PNU와 admg.WKT가 모두 포함되어야 일관된 결과를 얻을 수 있습니다.
                    GROUP BY rl.pnu, admg.WKT
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

                while ($row = $result->fetch_assoc()) {
                    if (!isset($row['jimok'])) {
                        $row['jimok'] = null;
                    }
                    //unset($row['poligon_wkt']); 

                    $emdDataCollection[] = $row;
                }
                $stmt->close();
                // ===>>> 여기서 $emdCdInner는 현재 EMD 코드이고, $emdDataCollection은 해당 EMD의 데이터입니다. <<<===
                log_to_db($historyId, "EMD '{$emdCdInner}'에서 " . count($emdDataCollection) . "건의 데이터를 조회했습니다.", $conn); // $emdCdInner 사용은 맞음.

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
                $data_to_store_in_redis = [
                    'cached_at' => date('Y-m-d H:i:s'), // 현재 시간으로 cached_at 추가
                    'data' => $emdDataCollection // 조회된 실거래가 데이터 배열을 'data' 키 아래에 저장
                ];

                // 2. 이 데이터를 JSON으로 인코딩하여 Redis에 SET 합니다.
                $json_data_to_store = json_encode($data_to_store_in_redis, JSON_UNESCAPED_UNICODE);
                $redisPipeline->set($cacheKey, $json_data_to_store);
                
                log_to_db($historyId, "EMD '{$emdCdInner}'의 실거래가 데이터를 Redis에 캐싱했습니다. (" . count($emdDataCollection) . "건)", $conn);
                
            } else {
                 log_to_db($historyId, "EMD '{$emdCdInner}'에 조회된 데이터가 없어 Redis 캐시에 저장하지 않습니다.", $conn, 'INFO');
            }

            $processedEmdCount++;
            
            // ===>>> 수정 필요한 부분 <<<===
            if ($processedEmdCount % 10 === 0) { // 10개마다 진행 상황 로그
                // $allEmdCodes 대신 해당 Sido의 EMD 코드 목록인 $currentSidoEmdCodes를 사용해야 합니다.
                // count()에 null이 넘어가는 문제는 $currentSidoEmdCodes가 이 시점에서 null일 때 발생합니다.
                // 따라서 $currentSidoEmdCodes가 배열임을 보장하거나, null 체크를 해야 합니다.
                if (is_array($currentSidoEmdCodes)) { // $currentSidoEmdCodes가 배열인지 확인
                    log_to_db($historyId, "현재 " . $processedEmdCount . "/" . count($currentSidoEmdCodes) . "개의 EMD 코드를 처리했습니다.", $conn);
                } else {
                    log_to_db($historyId, "현재 " . $processedEmdCount . "개의 EMD 코드를 처리했습니다. (전체 EMD 코드 수 불명)", $conn);
                }
            }

        } // end foreach EMD within Sido

        // ========================================================
        // === 3. Redis 파이프라인 exec() 실행 직전 최종 확인 ===
        // ========================================================
        check_cancellation($parentHistoryId, $conn);
        //check_cancellation($historyId, $conn); // 선택 사항

        // Redis 파이프라인 실행 (현재 Sido의 모든 EMD 처리가 끝나면)
        try {
            $redisPipeline->exec();
            
            log_to_db($historyId, "Redis 파이프라인 성공적으로 실행됨 (Sido {$sidoCd}). 처리된 EMD 수: {$processedEmdCount}. 에러 수: {$sidoErrors}.", $conn, 'INFO');
        } catch (Exception $e) {
            $logMessage = "Redis pipeline execution failed for Sido {$sidoCd}: " . $e->getMessage();
            
            log_to_db($historyId, $logMessage, $conn, 'CRITICAL');
            $sidoErrors++;
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
        update_history_status($historyId, $sidoFinalStatus, $sidoFinalMessage, $conn);
        
        $processedSidoCount++; 
        $overallErrors += $sidoErrors; 

    } catch (Exception $e) {
        $logMessage = "Sido {$sidoCd} 처리 중 치명적인 오류 발생: " . $e->getMessage();
        if ($historyId) {
            log_to_db($historyId, $logMessage, $conn, 'CRITICAL');
            update_history_status($historyId, 'failed', $logMessage, $conn);
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
update_history_status($parentHistoryId, $masterFinalStatus, $masterFinalMessage, $conn);


if ($conn) $conn->close();
if ($redis) $redis->close();
exit(0);

?>