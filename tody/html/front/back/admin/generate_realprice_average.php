<?php
// generate_realprice_average.php

// ----------------------------------------------------
// PHP 환경 설정 및 초기화
// ----------------------------------------------------
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL); // 개발 중 모든 에러 표시
ini_set('display_errors', 1); // 운영 환경에서는 화면에 에러 표시 안함
ini_set('memory_limit', '1024M'); // 메모리 제한 1024M로 설정

// 스크립트 실행 제한 시간 (배치 작업이 길어질 수 있으므로 무제한으로 설정)
//set_time_limit(7200); // 최대 실행 시간 7200초 (2시간)로 설정
set_time_limit(0);

ini_set('date.timezone', 'Asia/Seoul'); // 배치 스크립트 시작 시 PHP 시간대 설정

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

function check_cancellation(int $historyId, mysqli $conn):bool {  //// 반환 타입을 bool로 명시
    try {
        $stmt = $conn->prepare("SELECT status FROM upload_history WHERE id = ?");
        if (!$stmt) {
            error_log("[DEBUG_CANCEL] SQL prepare 실패: " . $conn->error);
            // 쿼리 준비 실패 시에는 취소된 것으로 간주하지 않고 진행 (false 반환)
            return false; 
        }
        $stmt->bind_param("i", $historyId);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            error_log("[DEBUG_CANCEL] DB 조회 결과 - ID: {$historyId}, Status: {$row['status']}");
            if ($row['status'] === 'canceled') {
                $logMessage = "작업 ID {$historyId}가 취소 요청되어 스크립트를 중단합니다.";
                error_log("[CANCELED] " . $logMessage);
                log_to_db($historyId, $logMessage, $conn, "INFO"); 
                $conn->close(); // 명시적으로 연결 종료
                // 쿼리 준비 실패 시에는 취소된 것으로 간주하지 않고 진행 (false 반환)
                return true; 
            }
        } else {
            error_log("[DEBUG_CANCEL] ID {$historyId}에 대한 upload_history 레코드를 찾을 수 없습니다.");
        }
        $stmt->close();
    } catch (Exception $e) {
        error_log("[CANCEL_CHECK_FAIL] Exception during check_cancellation for ID {$historyId}: " . $e->getMessage());
        // 혹시 예외 발생 시 롤백을 고려할 수 있으나, 여기서는 exit(0) 하므로 영향이 제한적
    }
    // 취소되지 않은 경우 false 반환
    return false; 
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
//require_once $web_root . '/front/back/00-include/dbconnect.php'; 
//require_once $web_root . '/front/back/00-include/common.php';     
//require_once $web_root . '/front/back/realPrice/poligon_center.php'; 

//require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
require_once __DIR__ . '/../../../vendor/autoload.php';

// --- 여기서부터 수정 ---
// Dotenv 객체 생성 시 .env 파일이 위치한 디렉토리 경로를 명확하게 전달
// (예상: /var/www/tody/html 에 .env 파일이 있음)
$dotenv = Dotenv\Dotenv::createImmutable($web_root);
$dotenv->load(); // .env 파일 로드 시도

require_once $web_root . '/front/back/00-include/dbconnect.php'; 
require_once $web_root . '/front/back/00-include/common.php';     
require_once $web_root . '/front/back/realPrice/poligon_center.php';

//$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
//$dotenv->load();

//require_once $_SERVER['DOCUMENT_ROOT'] . `/front/back/00-include/dbconnect.php`; 
//require_once $_SERVER['DOCUMENT_ROOT'] . `/front/back/00-include/common.php`;
//require_once $_SERVER['DOCUMENT_ROOT'] . `/front/back/realPrice/poligon_center.php`;
// Autoloader 및 Dotenv 로드


// DB 연결 확인 (database.php에서 $conn 변수 생성 가정)
if (!isset($conn) || ($conn instanceof mysqli && $conn->connect_error)) {
    echo "[FATAL] Worker script: Database connection failed immediately after require_once. Error: " . ($conn->connect_error ?? "Unknown DB error") . "\n";
    exit(1);
}

// ----------------------------------------------------
// 부동산 타입 및 실거래가 테이블 정의
// ----------------------------------------------------
$estateTypes = [
    'apt'       => 'realPrice_apt',
    'multi'     => 'realPrice_multiFamily',
    'officetel' => 'realPrice_officetel',
    'land'      => 'realPrice_land'
];

// GeoJSON 파일 경로 기본 설정
$geojsonBaseDir = $_SERVER['DOCUMENT_ROOT'] . '/front/assets/data/';

// ----------------------------------------------------
// GeoJSON 파일에서 중심 좌표 (바운딩 박스 중앙값) 추출 도우미 함수
// ----------------------------------------------------
function getGeoJsonCenterCoordinates($geojsonPath) {
    if (!file_exists($geojsonPath)) {
        error_log("[WARNING] GeoJSON file not found: {$geojsonPath}");
        return ['latitude' => null, 'longitude' => null];
    }
    
    $geojsonContent = file_get_contents($geojsonPath);
    $geojson = json_decode($geojsonContent, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($geojson['features'])) {
        error_log("[WARNING] Failed to parse GeoJSON or features not found in: {$geojsonPath}");
        return ['latitude' => null, 'longitude' => null];
    }

    $minLat = 999.0; $maxLat = -999.0;
    $minLng = 999.0; $maxLng = -999.0;
    $hasCoords = false;

    // MultiPolygon 또는 Polygon 처리 로직을 위한 내부 도우미 함수
    // 클로저의 유연성을 위해 참조 전달 방식을 유지하되, 내부 처리 강화
    $extractCoords = function($coordinates, &$minLatRef, &$maxLatRef, &$minLngRef, &$maxLngRef, &$hasCoordsRef) use (&$extractCoords) {
        if (!is_array($coordinates) || empty($coordinates)) return;

        foreach ($coordinates as $coordSet) {
            if (is_array($coordSet) && count($coordSet) > 0) {
                // GeoJSON 구조는 중첩될 수 있으므로, 재귀적으로 깊이를 탐색
                // 가장 깊은 곳의 [lng, lat] 배열을 찾아야 함
                if (is_array($coordSet[0]) && is_array($coordSet[0][0])) { // 깊은 중첩 구조 (예: MultiPolygon -> Polygon -> LinearRing)
                    $extractCoords($coordSet, $minLatRef, $maxLatRef, $minLngRef, $maxLngRef, $hasCoordsRef);
                } elseif (isset($coordSet[0]) && isset($coordSet[1]) && !is_array($coordSet[0]) && !is_array($coordSet[1])) { // 직접적인 [lng, lat] 좌표
                    $lng = (float)$coordSet[0];
                    $lat = (float)$coordSet[1];
                    $minLngRef = min($minLngRef, $lng);
                    $maxLngRef = max($maxLngRef, $lng);
                    $minLatRef = min($minLatRef, $lat);
                    $maxLatRef = max($maxLatRef, $lat);
                    $hasCoordsRef = true;
                } elseif (is_array($coordSet[0]) && count($coordSet[0]) >= 2 && !is_array($coordSet[0][0])) { // 한 단계 덜 중첩된 LinearRing (배열 안에 [lng,lat]이 바로 있는 경우)
                    $extractCoords($coordSet, $minLatRef, $maxLatRef, $minLngRef, $maxLngRef, $hasCoordsRef);
                }
            }
        }
    };


    foreach ($geojson['features'] as $feature) {
        if (!isset($feature['geometry']['coordinates'])) continue;
        $geometry = $feature['geometry'];
        
        if ($geometry['type'] === 'MultiPolygon' || $geometry['type'] === 'Polygon') {
            $extractCoords($geometry['coordinates'], $minLat, $maxLat, $minLng, $maxLng, $hasCoords);
        }
    }
    
    // 유효한 좌표가 있었다면 중앙값 계산
    if ($hasCoords) {
        $centerLat = ($minLat + $maxLat) / 2;
        $centerLng = ($minLng + $maxLng) / 2;
        return ['latitude' => $centerLat, 'longitude' => $centerLng];
    }

    return ['latitude' => null, 'longitude' => null];
}

// ----------------------------------------------------
// 배치 처리 시작 (트랜잭션)
// ----------------------------------------------------

// 스크립트 시작 시간 기록
$startTimeTotal = microtime(true);
$historyId = null; // 현재 Sido 작업의 고유한 historyId

try {

    // 1. 명령줄 인자 파싱 (워커 스크립트는 이제 $_POST나 $_GET이 아닌 CLI 인자를 받습니다)
    $options = getopt('', ['master-history-id:', 'sido:', 'base-year:', 'base-month:']);

    $masterHistoryId = (int)($options['master-history-id'] ?? 0);
    $sidoCode = $options['sido'] ?? 'ALL';
    $baseYear = (int)($options['base-year'] ?? 0);
    $baseMonth = (int)($options['base-month'] ?? 0);

    $baseDate = sprintf("%04d년 %02d월", $baseYear, $baseMonth);

    if ($masterHistoryId === 0 || $baseYear === 0 || $baseMonth === 0) {
        throw new Exception("Master history ID, base year, or base month is missing in worker script arguments.");
    }
    $historyId = $masterHistoryId; // 워커 스크립트는 마스터의 history_id를 사용

    // 워커 스크립트 시작 로그 기록
    log_to_db($historyId, "RealPrice Average 워커 스크립트 시작. (Master History ID: {$historyId})", $conn, "INFO");
    
    // 2. 워커 스크립트 메인 로직 시작 (기존 trigger_realprice_average_batch.php의 모든 로직)
    $conn->begin_transaction();
    $overallSuccess = true;

    // 초기 로그 메시지 (log_to_db 함수 사용)
    log_to_db($historyId, "RealPrice_Average 배치 스크립트 시작. (History ID: {$historyId})", $conn, "INFO");
    
    // =========================================================================
    // 메인 배치 로직 시작
    // =========================================================================

    // ----------------------------------------------------
    // 평균 실거래가 테이블 초기화 (TRUNCATE)
    // ----------------------------------------------------
    // 기존의 테이블 삭제/초기화 로직 
    log_to_db($historyId, "realPrice_Average 테이블 초기화 시작...", $conn, "INFO");
    // ... 테이블 TRUNCATE 로직 ...
    // (여기서는 원래의 TRUNCATE TABLE `realPrice_Average_sido` 등을 그대로 사용)
    $conn->query("TRUNCATE TABLE `realPrice_Average_sido`");
    $conn->query("TRUNCATE TABLE `realPrice_Average_sgg`");
    $conn->query("TRUNCATE TABLE `realPrice_Average_emd`");
    log_to_db($historyId, "realPrice_Average 테이블 초기화 완료.", $conn, "INFO");


    // SIDO_EMD_CODE 업데이트용 Prepared Statement 준비
    $sidoUpdateCoordsStmt = $conn->prepare("UPDATE SIDO_EMD_CODE SET center_latitude = ?, center_longitude = ? WHERE sido_code = ?");
    $sggUpdateCoordsStmt = $conn->prepare("UPDATE SIDO_EMD_CODE SET center_latitude = ?, center_longitude = ? WHERE sgg_code = ?");
    $emdUpdateCoordsStmt = $conn->prepare("UPDATE SIDO_EMD_CODE SET center_latitude = ?, center_longitude = ? WHERE emd_code = ?");


    // ----------------------------------------------------
    // 1. realPrice_Average_sido 테이블 업데이트
    // ----------------------------------------------------
    log_to_db($historyId, "Processing realPrice_Average_sido data...", $conn, "INFO");
    $sidoSelectStmt = $conn->prepare("SELECT DISTINCT sido_code, sido_name FROM SIDO_EMD_CODE WHERE use_yn = '1' AND sido_code IS NOT NULL");
    $sidoSelectStmt->execute();
    $sidoResult = $sidoSelectStmt->get_result();
    $totalSidos = $sidoResult->num_rows;
    $sidoCount = 0;
    $todayDateString = makeTodayDateString();

    while ($sidoRow = $sidoResult->fetch_assoc()) {
        if (check_cancellation($historyId, $conn)) { // ✨ 이렇게 변경 ✨
            //log_to_db($historyId, "Batch stopped by user during SIDO processing.", $conn, "INFO");
            throw new Exception("Batch stopped by user.");
        }
        $sidoCount++;
        $sidoCode = $sidoRow['sido_code'];
        $sidoName = $sidoRow['sido_name'];
        log_to_db($historyId, "  Processing SIDO: {$sidoName} ({$sidoCode}) - ({$sidoCount}/{$totalSidos})", $conn, "INFO");

        // 항상 GeoJSON에서 좌표 계산
        $geojsonFilePath = $web_root . '/front/assets/data/CTPRVN_CD_' . $sidoCode . '.geojson'; // <<-- 경로 수정!
        // 파일 존재 여부 확인 (필수)
        if (!file_exists($geojsonFilePath)) {
            log_to_db($historyId, "[WARNING] GeoJSON file not found: {$geojsonFilePath}", $conn, "WARNING");
            $multiPolygon = []; // 파일이 없으니 $multiPolygon을 비워둡니다.
        } else {
            $geojsonContent = file_get_contents($geojsonFilePath);
            $geojson = json_decode($geojsonContent, true);

            // JSON 파싱 에러 확인 (필수)
            if (json_last_error() !== JSON_ERROR_NONE) {
                log_to_db($historyId, "[WARNING] Failed to parse GeoJSON from {$geojsonFilePath}: " . json_last_error_msg(), $conn, "WARNING");
                $multiPolygon = []; // 파싱 실패 시 $multiPolygon을 비워둡니다.
            } else {
                // 이제 GeoJSON에서 'geometry.coordinates'를 추출합니다.
                $multiPolygon = []; // 기본값은 빈 배열
                foreach ($geojson['features'] as $feature) {
                    // GeoJSON의 'properties.CTPRVN_CD'와 현재 $sidoCode가 일치하는 feature를 찾습니다.
                    if (isset($feature['properties']['CTPRVN_CD']) && $feature['properties']['CTPRVN_CD'] == $sidoCode) {
                        if (isset($feature['geometry']['type']) && $feature['geometry']['type'] == 'MultiPolygon' && isset($feature['geometry']['coordinates'])) {
                            $multiPolygon = $feature['geometry']['coordinates'];
                            break; // 첫 번째 일치하는 MultiPolygon을 찾으면 중단
                        }
                    }
                }
            }
        }

        // 추출된 $multiPolygon이 비어있는지 확인
        if (empty($multiPolygon)) {
            log_to_db($historyId, "[WARNING] No valid MultiPolygon data extracted for sido_code {$sidoCode} from {$geojsonFilePath}", $conn, "WARNING");
            // 이 워닝이 뜨면 getPolygonCentroid에 빈 데이터가 전달되거나, 예상치 못한 결과가 나옵니다.
        }

        // 이제 $multiPolygon을 getPolygonCentroid 함수에 전달하여 중심 좌표를 계산
        $centroids = getPolygonCentroid($multiPolygon); 
                
        // $centroid 결과 검증 로직 추가 (예: (0,0) 이거나 비정상적인 값일 경우)
        if (count($centroids) != 2 || $centroids[0] === null || $centroids[1] === null) {
            log_to_db($historyId, "[WARNING] Invalid centroid returned for sido_code {$sidoCode}.", $conn, "WARNING");
        } else if ($centroids[0] == 0 && $centroids[1] == 0 && !empty($multiPolygon)) { // 데이터가 있었는데도 0,0이면 문제
            log_to_db($historyId, "[WARNING] getPolygonCentroid returned (0,0) for non-empty MultiPolygon of sido_code {$sidoCode}.", $conn, "WARNING");
        }

        $finalLatitude = null;
        $finalLongitude = null;
        // getPolygonCentroid가 유효한 값을 반환했는지 다시 한번 최종적으로 확인
        if (is_array($centroids) && count($centroids) === 2 && $centroids[0] !== null && $centroids[1] !== null) {
            // (0,0)이 유효하지 않은 중심 좌표로 간주된다면 이 조건을 유지합니다.
            if ($centroids[0] != 0 || $centroids[1] != 0) { 
                $finalLatitude = $centroids[1];  // $centroids[1]이 위도 (latitude)
                $finalLongitude = $centroids[0]; // $centroids[0]이 경도 (longitude)
            } else {
                log_to_db($historyId, "[WARNING] getPolygonCentroid returned (0,0) for non-empty MultiPolygon of sido_code {$sidoCode}. Considering it invalid.", $conn, "WARNING");
            }
        }
        
        // 기존 $centerCoords를 사용하던 조건문을 $finalLatitude, $finalLongitude를 사용하도록 변경
        if ($finalLatitude !== null && $finalLongitude !== null) { // 유효한 위도, 경도가 있는 경우에만 업데이트
            // SIDO_EMD_CODE 테이블 업데이트
            // "dds"는 'double, double, string'을 의미. 순서는 위도, 경도, 시도코드
            $sidoUpdateCoordsStmt->bind_param("dds", $finalLatitude, $finalLongitude, $sidoCode);
            $sidoUpdateCoordsStmt->execute();
            if ($sidoUpdateCoordsStmt->error) {
                log_to_db($historyId, "[ERROR] SIDO_EMD_CODE update failed for sido_code {$sidoCode}: " . $sidoUpdateCoordsStmt->error, $conn, "ERROR");
            }
        } else {
            // $finalLatitude, $finalLongitude 중 하나라도 null이면 중심 좌표를 결정할 수 없었다는 경고를 로깅
            log_to_db($historyId, "[WARNING] Could not determine valid center_coords for sido_code {$sidoCode}. MultiPolygon data might be missing or Centroid calculation failed.", $conn, "WARNING");
        }


        //$geojsonPath = $geojsonBaseDir . "CTPRVN_CD_{$sidoCode}.geojson";
        //$centerCoords = getGeoJsonCenterCoordinates($geojsonPath);
     
        //if (!is_null($centerCoords['latitude']) && !is_null($centerCoords['longitude'])) {
            // SIDO_EMD_CODE 테이블 업데이트
        //    $sidoUpdateCoordsStmt->bind_param("dds", $centerCoords['latitude'], $centerCoords['longitude'], $sidoCode);
        //    $sidoUpdateCoordsStmt->execute();
        //    if ($sidoUpdateCoordsStmt->error) {
        //        log_to_db($historyId, "[ERROR] SIDO_EMD_CODE update failed for sido_code {$sidoCode}: " . $sidoUpdateCoordsStmt->error, $conn, "ERROR");
        //    }
        //} else {
        //    log_to_db($historyId, "[WARNING] Could not determine center_coords for sido_code {$sidoCode}.", $conn, "WARNING");
        //}

        foreach ($estateTypes as $type => $tablePrefix) {
            $tableName = "{$tablePrefix}_{$sidoCode}";

            $checkTableSql = "SHOW TABLES LIKE '{$tableName}'";
            $tableExistsResult = $conn->query($checkTableSql);
            if ($tableExistsResult->num_rows == 0) {
                log_to_db($historyId, "[WARNING] Table '{$tableName}' does not exist. Skipping.", $conn, "WARNING");
                continue;
            }

            $whereClause = "`pnu` LIKE '{$sidoCode}%' AND `cdealDay` IS NULL";
            $areaColumn = ($type === 'land') ? 'dealArea' : 'excluUseAr';

            $stats = calculateEstateStats($conn, $historyId, $tableName, $areaColumn, $baseYear, $baseMonth, $whereClause);
            
            $stmt = $conn->prepare("
                INSERT INTO realPrice_Average_sido 
                (code, code_name, estate_type, all_average, all_count, 
                 last1Year_average, last1Year_count, last3Month_average, last3Month_count, 
                 last1Month_average, last1Month_count, 
                 center_latitude, center_longitude, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    code_name = VALUES(code_name), estate_type = VALUES(estate_type),
                    all_average = VALUES(all_average), all_count = VALUES(all_count),
                    last1Year_average = VALUES(last1Year_average), last1Year_count = VALUES(last1Year_count),
                    last3Month_average = VALUES(last3Month_average), last3Month_count = VALUES(last3Month_count),
                    last1Month_average = VALUES(last1Month_average), last1Month_count = VALUES(last1Month_count),
                    center_latitude = VALUES(center_latitude), center_longitude = VALUES(center_longitude),
                    description = VALUES(description);
            ");
            $descriptionValue = "시도별 통계 ({$type})[{$todayDateString}]";
            $stmt->bind_param("sssdidisdiddds", 
                $sidoCode, $sidoName, $type, 
                $stats['all_average'], $stats['all_count'],
                $stats['last1Year_average'], $stats['last1Year_count'],
                $stats['last3Month_average'], $stats['last3Month_count'],
                $stats['last1Month_average'], $stats['last1Month_count'],
                //$centerCoords['latitude'], $centerCoords['longitude'],
                $finalLatitude, $finalLongitude,
                $descriptionValue
            );
            $stmt->execute();
            if ($stmt->error) {
                log_to_db($historyId, "[ERROR] realPrice_Average_sido insert/update failed for {$sidoCode}-{$type}: " . $stmt->error, $conn, "ERROR");
                $overallSuccess = false;
            }
            $stmt->close();
        }
    }
    $sidoSelectStmt->close();

    // ----------------------------------------------------
    // 2. realPrice_Average_sgg 테이블 업데이트
    // ----------------------------------------------------
    log_to_db($historyId, "Processing realPrice_Average_ssg data...", $conn, "INFO");
    $sggSelectStmt = $conn->prepare("SELECT DISTINCT sgg_code, sgg_name FROM SIDO_EMD_CODE WHERE use_yn = '1' AND sgg_code IS NOT NULL");
    $sggSelectStmt->execute();
    $sggResult = $sggSelectStmt->get_result();
    $totalSggs = $sggResult->num_rows;
    $sggCount = 0;

    while ($sggRow = $sggResult->fetch_assoc()) {
        if (check_cancellation($historyId, $conn)) { 
            //log_to_db($historyId, "Batch stopped by user during SGG processing.", $conn, "INFO");
            throw new Exception("Batch stopped by user.");
        }
        $sggCount++;
        $sggCode = $sggRow['sgg_code'];
        $sggName = $sggRow['sgg_name'];
        $sidoCodeFromSgg = substr($sggCode, 0, 2);
        log_to_db($historyId, "  Processing SGG: {$sggName} ({$sggCode}) - ({$sggCount}/{$totalSggs})", $conn, "INFO");

        // 항상 GeoJSON에서 좌표 계산
        $geojsonFilePath = $web_root . '/front/assets/data/SIG_CD_' . $sggCode . '.geojson'; // <<-- 경로 수정!
        // 파일 존재 여부 확인 (필수)
        if (!file_exists($geojsonFilePath)) {
            log_to_db($historyId, "[WARNING] GeoJSON file not found: {$geojsonFilePath}", $conn, "WARNING");
            $multiPolygon = []; // 파일이 없으니 $multiPolygon을 비워둡니다.
        } else {
            $geojsonContent = file_get_contents($geojsonFilePath);
            $geojson = json_decode($geojsonContent, true);

            // JSON 파싱 에러 확인 (필수)
            if (json_last_error() !== JSON_ERROR_NONE) {
                log_to_db($historyId, "[WARNING] Failed to parse GeoJSON from {$geojsonFilePath}: " . json_last_error_msg(), $conn, "WARNING");
                $multiPolygon = []; // 파싱 실패 시 $multiPolygon을 비워둡니다.
            } else {
                // 이제 GeoJSON에서 'geometry.coordinates'를 추출합니다.
                $multiPolygon = []; // 기본값은 빈 배열
                foreach ($geojson['features'] as $feature) {
                    // GeoJSON의 'properties.SIG_CD'와 현재 sggCode가 일치하는 feature를 찾습니다.
                    if (isset($feature['properties']['SIG_CD']) && $feature['properties']['SIG_CD'] == $sggCode) {
                        if (isset($feature['geometry']['type']) && $feature['geometry']['type'] == 'MultiPolygon' && isset($feature['geometry']['coordinates'])) {
                            $multiPolygon = $feature['geometry']['coordinates'];
                            break; // 첫 번째 일치하는 MultiPolygon을 찾으면 중단
                        }
                    }
                }
            }
        }

        // 추출된 $multiPolygon이 비어있는지 확인
        if (empty($multiPolygon)) {
            log_to_db($historyId, "[WARNING] No valid MultiPolygon data extracted for sgg_code {$sggCode} from {$geojsonFilePath}", $conn, "WARNING");
            // 이 워닝이 뜨면 getPolygonCentroid에 빈 데이터가 전달되거나, 예상치 못한 결과가 나옵니다.
        }

        // 이제 $multiPolygon을 getPolygonCentroid 함수에 전달하여 중심 좌표를 계산
        $centroids = getPolygonCentroid($multiPolygon); 
        
        // $centroid 결과 검증 로직 추가 (예: (0,0) 이거나 비정상적인 값일 경우)
        if (count($centroids) != 2 || $centroids[0] === null || $centroids[1] === null) {
            log_to_db($historyId, "[WARNING] Invalid centroid returned for sgg_code {$sggCode}.", $conn, "WARNING");
        } else if ($centroids[0] == 0 && $centroids[1] == 0 && !empty($multiPolygon)) { // 데이터가 있었는데도 0,0이면 문제
            log_to_db($historyId, "[WARNING] getPolygonCentroid returned (0,0) for non-empty MultiPolygon of sgg_code {$sggCode}.", $conn, "WARNING");
        }
        
        $finalLatitude = null;
        $finalLongitude = null;
        // getPolygonCentroid가 유효한 값을 반환했는지 다시 한번 최종적으로 확인
        // (empty($multiPolygon)에 대한 검사는 이미 이전에 수행했으므로 여기서는 $centroids 자체의 유효성 위주로 검사)
        if (is_array($centroids) && count($centroids) === 2 && $centroids[0] !== null && $centroids[1] !== null) {
            // (0,0)이 유효하지 않은 중심 좌표로 간주된다면 이 조건을 유지합니다.
            if ($centroids[0] != 0 || $centroids[1] != 0) { 
                $finalLatitude = $centroids[1];  // $centroids[1]이 위도 (latitude)
                $finalLongitude = $centroids[0]; // $centroids[0]이 경도 (longitude)
            } else {
                log_to_db($historyId, "[WARNING] getPolygonCentroid returned (0,0) for non-empty MultiPolygon of sgg_code {$sggCode}. Considering it invalid.", $conn, "WARNING");
            }
        }
        // 위에서 $finalLatitude/$finalLongitude 가 null로 남아있다면 유효하지 않은 중심 좌표로 간주됩니다.

        // 기존 $centerCoords를 사용하던 조건문을 $finalLatitude, $finalLongitude를 사용하도록 변경
        if ($finalLatitude !== null && $finalLongitude !== null) { // 유효한 위도, 경도가 있는 경우에만 업데이트
            // SIDO_EMD_CODE 테이블 업데이트
            // "dds"는 'double, double, string'을 의미. 순서는 위도, 경도, 시도코드
            $sggUpdateCoordsStmt->bind_param("dds", $finalLatitude, $finalLongitude, $sggCode);
            $sggUpdateCoordsStmt->execute();
            if ($sggUpdateCoordsStmt->error) {
                log_to_db($historyId, "[ERROR] SIDO_EMD_CODE update failed for sgg_code {$sidoCode}: " . $sggUpdateCoordsStmt->error, $conn, "ERROR");
            }
        } else {
            // $finalLatitude, $finalLongitude 중 하나라도 null이면 중심 좌표를 결정할 수 없었다는 경고를 로깅
            log_to_db($historyId, "[WARNING] Could not determine valid center_coords for sgg_code {$sggCode}. MultiPolygon data might be missing or Centroid calculation failed.", $conn, "WARNING");
        }

        
        //$geojsonPath = $geojsonBaseDir . "SIG_CD_{$sggCode}.geojson"; // GeoJSON 파일명 확인
        //$centerCoords = getGeoJsonCenterCoordinates($geojsonPath);

        //if (!is_null($centerCoords['latitude']) && !is_null($centerCoords['longitude'])) {
        //    // SIDO_EMD_CODE 테이블 업데이트
        //    $sggUpdateCoordsStmt->bind_param("dds", $centerCoords['latitude'], $centerCoords['longitude'], $sggCode);
        //    $sggUpdateCoordsStmt->execute();
        //    if ($sggUpdateCoordsStmt->error) {
        //        log_to_db($historyId, "[ERROR] SIDO_EMD_CODE update failed for sgg_code {$sggCode}: " . $sggUpdateCoordsStmt->error, $conn, "ERROR");
        //    }
        //} else {
        //    log_to_db($historyId, "[WARNING] Could not determine center_coords for sgg_code {$sggCode}.", $conn, "WARNING");
        //}
        
        foreach ($estateTypes as $type => $tablePrefix) {
            $tableName = "{$tablePrefix}_{$sidoCodeFromSgg}";

            $checkTableSql = "SHOW TABLES LIKE '{$tableName}'";
            $tableExistsResult = $conn->query($checkTableSql);
            if ($tableExistsResult->num_rows == 0) {
                //log_to_db($historyId, "[WARNING] Table '{$tableName}' does not exist for SGG {$sggCode}. Skipping.", $conn, "WARNING");// 너무 많은 로그 방지
                continue;
            }

            $whereClause = "`pnu` LIKE '{$sggCode}%' AND `cdealDay` IS NULL";
            $areaColumn = ($type === 'land') ? 'dealArea' : 'excluUseAr';

            $stats = calculateEstateStats($conn, $historyId, $tableName, $areaColumn, $baseYear, $baseMonth, $whereClause);
            
            $stmt = $conn->prepare("
                INSERT INTO realPrice_Average_sgg 
                (code, code_name, estate_type, all_average, all_count, 
                 last1Year_average, last1Year_count, last3Month_average, last3Month_count, 
                 last1Month_average, last1Month_count, 
                 center_latitude, center_longitude, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    code_name = VALUES(code_name), estate_type = VALUES(estate_type),
                    all_average = VALUES(all_average), all_count = VALUES(all_count),
                    last1Year_average = VALUES(last1Year_average), last1Year_count = VALUES(last1Year_count),
                    last3Month_average = VALUES(last3Month_average), last3Month_count = VALUES(last3Month_count),
                    last1Month_average = VALUES(last1Month_average), last1Month_count = VALUES(last1Month_count),
                    center_latitude = VALUES(center_latitude), center_longitude = VALUES(center_longitude),
                    description = VALUES(description);
            ");
            $descriptionValue = "시군구별 통계 ({$type})[{$todayDateString}]";
            $stmt->bind_param("sssdidisdiddds", 
                $sggCode, $sggName, $type, 
                $stats['all_average'], $stats['all_count'],
                $stats['last1Year_average'], $stats['last1Year_count'],
                $stats['last3Month_average'], $stats['last3Month_count'],
                $stats['last1Month_average'], $stats['last1Month_count'],
                //$centerCoords['latitude'], $centerCoords['longitude'],
                $finalLatitude, $finalLongitude,
                $descriptionValue // ✨ 임시 변수를 전달 ✨
            );
            $stmt->execute();
            if ($stmt->error) {
                log_to_db($historyId, "[ERROR] realPrice_Average_sgg insert/update failed for {$sggCode}-{$type}: " . $stmt->error, $conn, "ERROR");
                $overallSuccess = false;
            }
            $stmt->close();
        }
    }
    $sggSelectStmt->close();

    // ----------------------------------------------------
    // 3. realPrice_Average_emd 테이블 업데이트
    // ----------------------------------------------------
    log_to_db($historyId, "Processing realPrice_Average_emd data...", $conn, "INFO");
    $emdSelectStmt = $conn->prepare("SELECT DISTINCT emd_code, emd_name FROM SIDO_EMD_CODE WHERE use_yn = '1' AND emd_code IS NOT NULL");
    $emdSelectStmt->execute();
    $emdResult = $emdSelectStmt->get_result();
    $totalEmds = $emdResult->num_rows;
    $emdCount = 0;
    
    while ($emdRow = $emdResult->fetch_assoc()) {
        if (check_cancellation($historyId, $conn)) { 
            //log_to_db($historyId, "Batch stopped by user during EMD processing.", $conn, "INFO");
            throw new Exception("Batch stopped by user.");
        }
        $emdCount++;
        $emdCode = $emdRow['emd_code'];
        $emdName = $emdRow['emd_name'];
        $sidoCodeFromEmd = substr($emdCode, 0, 2);

        $emdCode = substr($emdCode, 0, 8);  // EMD_CODE를 8자리로 자르기 (EMD_CD_xxxxxxxx00 ==> EMD_CD_xxxxxxxx)

        log_to_db($historyId, "  Processing EMD: {$emdName} ({$emdCode}) - ({$emdCount}/{$totalEmds})", $conn, "INFO");

        // 항상 GeoJSON에서 좌표 계산
        $geojsonFilePath = $web_root . '/front/assets/data/EMD_CD_' . $emdCode . '.geojson'; // <<-- 경로 수정!
        // 파일 존재 여부 확인 (필수)
        if (!file_exists($geojsonFilePath)) {
            log_to_db($historyId, "[WARNING] GeoJSON file not found: {$geojsonFilePath}", $conn, "WARNING");
            $multiPolygon = []; // 파일이 없으니 $multiPolygon을 비워둡니다.
        } else {
            $geojsonContent = file_get_contents($geojsonFilePath);
            $geojson = json_decode($geojsonContent, true);

            // JSON 파싱 에러 확인 (필수)
            if (json_last_error() !== JSON_ERROR_NONE) {
                log_to_db($historyId, "[WARNING] Failed to parse GeoJSON from {$geojsonFilePath}: " . json_last_error_msg(), $conn, "WARNING");
                $multiPolygon = []; // 파싱 실패 시 $multiPolygon을 비워둡니다.
            } else {
                // 이제 GeoJSON에서 'geometry.coordinates'를 추출합니다.
                $multiPolygon = []; // 기본값은 빈 배열
                foreach ($geojson['features'] as $feature) {
                    // GeoJSON의 'properties.EMD_CD'와 현재 emdCode가 일치하는 feature를 찾습니다.
                    if (isset($feature['properties']['EMD_CD']) && $feature['properties']['EMD_CD'] == $emdCode) {
                        if (isset($feature['geometry']['type']) && $feature['geometry']['type'] == 'MultiPolygon' && isset($feature['geometry']['coordinates'])) {
                            $multiPolygon = $feature['geometry']['coordinates'];
                            break; // 첫 번째 일치하는 MultiPolygon을 찾으면 중단
                        }
                    }
                }
            }
        }
        // 추출된 $multiPolygon이 비어있는지 확인
        if (empty($multiPolygon)) {
            log_to_db($historyId, "[WARNING] No valid MultiPolygon data extracted for emd_code {$emdCode} from {$geojsonFilePath}", $conn, "WARNING");
            // 이 워닝이 뜨면 getPolygonCentroid에 빈 데이터가 전달되거나, 예상치 못한 결과가 나옵니다.
        }

        // 이제 $multiPolygon을 getPolygonCentroid 함수에 전달하여 중심 좌표를 계산
        $centroids = getPolygonCentroid($multiPolygon); 

        // $centroid 결과 검증 로직 추가 (예: (0,0) 이거나 비정상적인 값일 경우)
        if (count($centroids) != 2 || $centroids[0] === null || $centroids[1] === null) {
            log_to_db($historyId, "[WARNING] Invalid centroid returned for emd_code {$emdCode}.", $conn, "WARNING");
        } else if ($centroids[0] == 0 && $centroids[1] == 0 && !empty($multiPolygon)) { // 데이터가 있었는데도 0,0이면 문제
            log_to_db($historyId, "[WARNING] getPolygonCentroid returned (0,0) for non-empty MultiPolygon of emd_code {$emdCode}.", $conn, "WARNING");
        }

        $finalLatitude = null;
        $finalLongitude = null;
        // getPolygonCentroid가 유효한 값을 반환했는지 다시 한번 최종적으로 확인
        // (empty($multiPolygon)에 대한 검사는 이미 이전에 수행했으므로 여기서는 $centroids 자체의 유효성 위주로 검사)
        if (is_array($centroids) && count($centroids) === 2 && $centroids[0] !== null && $centroids[1] !== null) {
            // (0,0)이 유효하지 않은 중심 좌표로 간주된다면 이 조건을 유지합니다.
            if ($centroids[0] != 0 || $centroids[1] != 0) { 
                $finalLatitude = $centroids[1];  // $centroids[1]이 위도 (latitude)
                $finalLongitude = $centroids[0]; // $centroids[0]이 경도 (longitude)
            } else {
                log_to_db($historyId, "[WARNING] getPolygonCentroid returned (0,0) for non-empty MultiPolygon of emd_code {$emdCode}. Considering it invalid.", $conn, "WARNING");
            }
        }
        
        // 기존 $centerCoords를 사용하던 조건문을 $finalLatitude, $finalLongitude를 사용하도록 변경
        if ($finalLatitude !== null && $finalLongitude !== null) { // 유효한 위도, 경도가 있는 경우에만 업데이트
            // SIDO_EMD_CODE 테이블 업데이트
            // "dds"는 'double, double, string'을 의미. 순서는 위도, 경도, 시도코드
            $emdUpdateCoordsStmt->bind_param("dds", $finalLatitude, $finalLongitude, $emdCode);
            $emdUpdateCoordsStmt->execute();
            if ($emdUpdateCoordsStmt->error) {
                log_to_db($historyId, "[ERROR] SIDO_EMD_CODE update failed for emd_code {$emdCode}: " . $emdUpdateCoordsStmt->error, $conn, "ERROR");
            }
        } else {
            // $finalLatitude, $finalLongitude 중 하나라도 null이면 중심 좌표를 결정할 수 없었다는 경고를 로깅
            log_to_db($historyId, "[WARNING] Could not determine valid center_coords for sgg_code {$emdCode}. MultiPolygon data might be missing or Centroid calculation failed.", $conn, "WARNING");
        }
        
        //$geojsonPath = $geojsonBaseDir . "EMD_CD_{$emdCode}.geojson"; 
        //$centerCoords = getGeoJsonCenterCoordinates($geojsonPath);
        
        //if (!is_null($centerCoords['latitude']) && !is_null($centerCoords['longitude'])) {
            // SIDO_EMD_CODE 테이블 업데이트
        //    $emdUpdateCoordsStmt->bind_param("dds", $centerCoords['latitude'], $centerCoords['longitude'], $emdCode);
        //    $emdUpdateCoordsStmt->execute();
        //    if ($emdUpdateCoordsStmt->error) {
        //        log_to_db($historyId, "[ERROR] SIDO_EMD_CODE update failed for emd_code {$emdCode}: " . $emdUpdateCoordsStmt->error, $conn, "ERROR");
        //    }
        //} else {
        //    log_to_db($historyId, "[WARNING] Could not determine center_coords for sgg_code {$emdCode}.", $conn, "WARNING");
        //}
        
        foreach ($estateTypes as $type => $tablePrefix) {
            $tableName = "{$tablePrefix}_{$sidoCodeFromEmd}";

            $checkTableSql = "SHOW TABLES LIKE '{$tableName}'";
            $tableExistsResult = $conn->query($checkTableSql);
            if ($tableExistsResult->num_rows == 0) {
                //log_to_db($historyId, "[WARNING] Table '{$tableName}' does not exist for EMD {$emdCode}. Skipping.", $conn, "WARNING");// 너무 많은 로그 방지
                continue;
            }

            $pnuPrefix8 = substr($emdCode, 0, 8); 
            $whereClause = "`pnu` LIKE '{$pnuPrefix8}%' AND `cdealDay` IS NULL";
            $areaColumn = ($type === 'land') ? 'dealArea' : 'excluUseAr';

            $stats = calculateEstateStats($conn, $historyId, $tableName, $areaColumn, $baseYear, $baseMonth, $whereClause);
            
            $stmt = $conn->prepare("
                INSERT INTO realPrice_Average_emd 
                (code, code_name, estate_type, all_average, all_count, 
                 last1Year_average, last1Year_count, last3Month_average, last3Month_count, 
                 last1Month_average, last1Month_count, 
                 center_latitude, center_longitude, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    code_name = VALUES(code_name), estate_type = VALUES(estate_type),
                    all_average = VALUES(all_average), all_count = VALUES(all_count),
                    last1Year_average = VALUES(last1Year_average), last1Year_count = VALUES(last1Year_count),
                    last3Month_average = VALUES(last3Month_average), last3Month_count = VALUES(last3Month_count),
                    last1Month_average = VALUES(last1Month_average), last1Month_count = VALUES(last1Month_count),
                    center_latitude = VALUES(center_latitude), center_longitude = VALUES(center_longitude),
                    description = VALUES(description);
            ");
            $descriptionValue = "읍면동별 통계 ({$type})[{$todayDateString}]";
            $stmt->bind_param("sssdidisdiddds", 
                $emdCode, $emdName, $type, 
                $stats['all_average'], $stats['all_count'],
                $stats['last1Year_average'], $stats['last1Year_count'],
                $stats['last3Month_average'], $stats['last3Month_count'],
                $stats['last1Month_average'], $stats['last1Month_count'],
                //$centerCoords['latitude'], $centerCoords['longitude'],
                $finalLatitude, $finalLongitude,
                $descriptionValue // ✨ 임시 변수를 전달 ✨
            );
            $stmt->execute();
            if ($stmt->error) {
                log_to_db($historyId, "[ERROR] realPrice_Average_emd insert/update failed for {$emdCode}-{$type}: " . $stmt->error, $conn, "ERROR");
                $overallSuccess = false;
            }
            $stmt->close();
        }
    }
    $emdSelectStmt->close();

    // ----------------------------------------------------
    // 트랜잭션 커밋 또는 롤백
    // ----------------------------------------------------
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

    $masterFinalStatus = ($overallSuccess) ?  'success' : 'failed';
    $masterFinalMessage = "realPrice_Average 배치 작업 완료 : 총 소요 시간: {$durationTotalFormatted}.";

    // 1. log_to_db를 먼저 호출하고,
    log_to_db($historyId, $masterFinalMessage, $conn, ($overallSuccess) ? 'INFO' : 'ERROR');

    // 2. update_history_status를 호출하여 최종 상태를 업데이트합니다.
    update_history_status($historyId, $masterFinalStatus, $masterFinalMessage, $conn);
        
    // !!! 중요한 부분: update_history_status의 변경 사항을 즉시 반영 !!!
    // mysqli_autocommit(false) 상태이므로, update_history_status는 자체 트랜잭션으로 처리되어야 함.
    // update_history_status 함수 내부에서 commit을 하지 않는다면, 여기서 직접 commit()을 한 번 더 하거나
    // autocommit 모드로 변경 후 다시 autocommit(false)로 되돌리는 방식 등을 고려해야 합니다.

    if ($overallSuccess) {
        $conn->commit();
        log_to_db($historyId, "Real estate average batch updated successfully. Transaction committed.", $conn, "INFO");
        echo json_encode(['success' => true, 'message' => 'Real estate average batch updated successfully.']);
        
    } else {
        $conn->rollback();
        log_to_db($historyId, "Real estate average batch failed. Transaction rolled back.", $conn, "ERROR");
        echo json_encode(['success' => false, 'message' => 'Real estate average batch failed. Transaction rolled back.']);
    }
} catch (Exception $e) {
    // =========================================================================
    // 배치 실패 및 오류 처리
    // =========================================================================
    // 오류 처리 (워커 스크립트는 클라이언트에게 직접 응답하지 않으므로 에러는 로그에만)
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (mysqli_sql_exception $rollback_e) {
            error_log("[ERROR] Rollback failed during worker exception handling: " . $rollback_e->getMessage());
        }
    }

    log_to_db($historyId, "An unexpected error occurred during batch process: " . $e->getMessage() . ". Transaction rolled back.", $conn, "FATAL");
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);

    $finalStatus = 'failed';
    $finalLogMessage = "배치 처리 중 오류 발생: " . $e->getMessage();

    // 사용자가 취소한 경우 (check_cancellation이 던진 예외)
    if ($e->getMessage() === "Batch stopped by user.") {
        $finalStatus = 'canceled';
        $finalLogMessage = "사용자 요청에 의해 배치가 중단되었습니다.";
    }

    if ($historyId) { // historyId가 생성된 경우에만 상태 업데이트
        update_history_status($historyId, $finalStatus, $finalLogMessage, $conn);
        log_to_db($historyId, "스크립트 최종 오류/취소: " . $finalLogMessage, $conn, "ERROR");
    }
    error_log("[FATAL] RealPrice Average Worker Batch Error: " . $finalLogMessage);
    exit(1); // 오류 코드로 종료

} finally {
    // 모든 Prepared Statement 닫기 (오류 발생 여부와 관계없이)
    if (isset($sidoUpdateCoordsStmt) && $sidoUpdateCoordsStmt) $sidoUpdateCoordsStmt->close();
    if (isset($sggUpdateCoordsStmt) && $sggUpdateCoordsStmt) $sggUpdateCoordsStmt->close();
    if (isset($emdUpdateCoordsStmt) && $emdUpdateCoordsStmt) $emdUpdateCoordsStmt->close();
    if (isset($conn)) $conn->close();
}


// ----------------------------------------------------
// 실거래가 통계 계산 함수
// ----------------------------------------------------
/**
 * 주어진 조건과 기간에 따라 실거래가 통계를 계산합니다.
 * @param mysqli $conn DB 연결 객체
 * @param string $tableName 실거래가 테이블명 (예: realPrice_apt_11)
 * @param string $areaColumn 면적 컬럼명 (excluUseAr 또는 dealArea)
 * @param int $baseYear 기준 연도
 * @param int $baseMonth 기준 월
 * @param string $additionalWhere 추가 WHERE 조건 (예: pnu LIKE '...' AND cdealDay IS NULL)
 * @return array 계산된 통계 데이터 (all, last1Year, last3Month, last1Month)
 */

function calculateEstateStats($conn, $historyId, $tableName, $areaColumn, $baseYear, $baseMonth, $additionalWhere = "") {
    $stats = [
        'all_count' => 0, 'all_average' => 0,
        'last1Year_count' => 0, 'last1Year_average' => 0,
        'last3Month_count' => 0, 'last3Month_average' => 0,
        'last1Month_count' => 0, 'last1Month_average' => 0,
    ];

    // 컬럼명 등에 불필요한 공백을 제거 (쿼리 안정성 확보)
    $areaColumn = trim($areaColumn);

    // dealAmount 필터링 (거래금액 0 또는 null 제외, 필요시)
    // ✨ '\' (백슬래시)를 교체하려면 '세 개'의 백슬래시가 아닌, SQL 리터럴에서 '\\' (두 개)를 의미하는 
    //    PHP 문자열 '\\\\' (네 개)를 사용해야 합니다.
    $dealAmountCleaned = "REPLACE(REPLACE(REPLACE(dealAmount, ',', ''), '/', ''), '\\\\', '')"; 
    //   

    // 정규식을 사용하면 더 강력하게 처리 가능
    // 공통 SELECT 문 - ✨ {FILTER_CONDITION} 플레이스홀더 사용 ✨
    $selectSqlTemplate = "
        SELECT 
            COUNT(*) as count,
            SUM(CAST({$dealAmountCleaned} AS DECIMAL) / {$areaColumn}) as total_unit_price
        FROM {$tableName}
        WHERE {$additionalWhere} {FILTER_CONDITION}
    "; // ✨ %s 대신 {FILTER_CONDITION} 사용 ✨

    // 1. 전체 기간 통계
    // {FILTER_CONDITION}에 빈 문자열 전달 (기간 조건 없음)
    $sqlForAll = str_replace('{FILTER_CONDITION}', '', $selectSqlTemplate);
    //log_to_db($historyId, "[DEBUG] Final SQL for all_average: " . $sqlForAll, $conn, "INFO");
    $result = $conn->query($sqlForAll);
    if ($result === false) {
        error_log("[ERROR] Query failed for all_average on {$tableName}: " . $conn->error);
        log_to_db($historyId, "[ERROR] Query failed for all_average on {$tableName}: " . $conn->error, $conn, "ERROR");
    } else if ($row = $result->fetch_assoc()) {
        if ($row['count'] > 0) {
            $stats['all_count'] = (int)$row['count'];
            $stats['all_average'] = (float)($row['total_unit_price'] / $row['count']);
        }
    }
    
    // --- 날짜 필터링을 위한 기준 설정 (baseYear, baseMonth는 포함되는 마지막 월) ---
    $targetYear = (int)$baseYear;
    $targetMonth = (int)$baseMonth;

    // 2. 최근 1년 통계 (기준연월이 2025/11일 때 2024/12/01 ~ 2025/11/30)
    // 기준월의 11개월 전 (총 12개월 데이터를 포함하기 위해)
    $startMonthDate1Y = (new DateTime("{$baseYear}-{$baseMonth}-01"))->modify('-11 months');
    $filter1Y = " AND (dealYear > {$startMonthDate1Y->format('Y')} OR (dealYear = {$startMonthDate1Y->format('Y')} AND dealMonth >= {$startMonthDate1Y->format('n')})) AND (dealYear < {$targetYear} OR (dealYear = {$targetYear} AND dealMonth <= {$targetMonth}))";

    // 3. 최근 3개월 통계 (기준연월이 2025/11일 때 2025/09/01 ~ 2025/11/30)
    $startMonthDate3M = (new DateTime("{$baseYear}-{$baseMonth}-01"))->modify('-2 months');
    $filter3M = " AND (dealYear > {$startMonthDate3M->format('Y')} OR (dealYear = {$startMonthDate3M->format('Y')} AND dealMonth >= {$startMonthDate3M->format('n')})) AND (dealYear < {$targetYear} OR (dealYear = {$targetYear} AND dealMonth <= {$targetMonth}))";
    
    // 4. 최근 1개월 통계 (기준연월이 2025/11일 때 2025/11/01 ~ 2025/11/30)
    $filter1M = " AND dealYear = {$targetYear} AND dealMonth = {$targetMonth}";

    // 2. 최근 1년 통계
    // {FILTER_CONDITION}에 $filter1Y를 전달
    $sqlFor1Y = str_replace('{FILTER_CONDITION}', $filter1Y, $selectSqlTemplate);
    
    $result = $conn->query($sqlFor1Y);
    if ($result === false) {
        error_log("[ERROR] Query failed for last1Year_average on {$tableName}: " . $conn->error);
    } else if ($row = $result->fetch_assoc()) {
        if ($row['count'] > 0) {
            $stats['last1Year_count'] = (int)$row['count'];
            $stats['last1Year_average'] = (float)($row['total_unit_price'] / $row['count']);
        }
    }
    
    // 3. 최근 3개월 통계
    // {FILTER_CONDITION}에 $filter3M을 전달
    $sqlFor3M = str_replace('{FILTER_CONDITION}', $filter3M, $selectSqlTemplate);
    
    $result = $conn->query($sqlFor3M);
    if ($result === false) {
        error_log("[ERROR] Query failed for last3Month_average on {$tableName}: " . $conn->error);
    } else if ($row = $result->fetch_assoc()) {
        if ($row['count'] > 0) {
            $stats['last3Month_count'] = (int)$row['count'];
            $stats['last3Month_average'] = (float)($row['total_unit_price'] / $row['count']);
        }
    }

    // 4. 최근 1개월 통계
    // {FILTER_CONDITION}에 $filter1M을 전달
    $sqlFor1M = str_replace('{FILTER_CONDITION}', $filter1M, $selectSqlTemplate);
    
    $result = $conn->query($sqlFor1M);
    if ($result === false) {
        error_log("[ERROR] Query failed for last1Month_average on {$tableName}: " . $conn->error);
    } else if ($row = $result->fetch_assoc()) {
        if ($row['count'] > 0) {
            $stats['last1Month_count'] = (int)$row['count'];
            $stats['last1Month_average'] = (float)($row['total_unit_price'] / $row['count']);
        }
    }

    return $stats;
}
function makeTodayDateString() {
    $now = new DateTime('now', new DateTimeZone('Asia/Seoul'));

    return $now->format('Y-m-d H:i' );
}
?>