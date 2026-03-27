<?php
//realPrice_apt_emd_cache.php 
// PHP 환경 설정
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL); // 개발 중 모든 에러 표시 (운영 환경에서는 off 또는 로그 처리)
ini_set('display_errors', 1); // 운영 환경에서는 화면에 에러 표시 안함

// DB 연결은 필요한 경우에만, 여기서는 주로 Redis 사용
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

// Redis 연결
$redis = new Redis();
try {
    $redis->connect('127.0.0.1', 6379); // Redis 서버 IP와 포트 (환경에 맞게 수정)
    // $redis->auth('your_redis_password'); // 비밀번호가 있다면 주석 해제
    $redis->setOption(Redis::OPT_READ_TIMEOUT, -1); // 큰 데이터 전송 시 타임아웃 방지 (필요 시)
} catch (Exception $e) {
    $redis = null;
    error_log("[ERROR] Redis connection failed in realPrice_apt_emd_cache.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Redis connection failed.']);
    exit();
}

// 클라이언트 요청 데이터 수신 (POST 방식으로 변경)
// Input 스트림에서 JSON 데이터를 읽어옵니다.
$input = file_get_contents('php://input');
$requestData = json_decode($input, true); // JSON 데이터를 PHP 배열로 디코딩
error_log("[DEBUG] Request Data: " . json_encode($requestData));

// JSON 디코딩 실패 처리
if (json_last_error() !== JSON_ERROR_NONE || !is_array($requestData)) {
    error_log("[ERROR] Invalid JSON data received: " . $input);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data received.']);
    exit();
}

// ✨✨✨ 이 부분을 수정합니다: $_POST 대신 $requestData에서 데이터를 가져옵니다. ✨✨✨
$sggCdsParam  = $requestData['sggCds'] ?? null;
// 클라이언트 JS에서 'emdCds'는 보내고 있지 않으므로 주석 처리하거나 제거하는 것이 좋습니다.
// $emdCdsParam = $requestData['emdCds'] ?? null; 

// 클라이언트 JS 코드에서는 estateTypes 필드명으로 보냈으므로 estateType 대신 estateTypes로 접근해야 합니다.
$estateTypesParam = $requestData['estateTypes'] ?? null; // 클라이언트 JS 코드에서 'estateTypes'로 보냄
$minLat = isset($requestData['minLat']) ? (float)$requestData['minLat'] : null;
$minLng = isset($requestData['minLng']) ? (float)$requestData['minLng'] : null;
$maxLat = isset($requestData['maxLat']) ? (float)$requestData['maxLat'] : null;
$maxLng = isset($requestData['maxLng']) ? (float)$requestData['maxLng'] : null;

error_log("[DEBUG] Client BBOX: minLat={$minLat}, minLng={$minLng}, maxLat={$maxLat}, maxLng={$maxLng}");
error_log("[DEBUG] Client estateTypes:  {$estateTypesParam}");
error_log("[DEBUG] Target sggCds: " . json_encode($sggCdsParam));

// 필수 파라미터 유효성 검사 (예: Bbox 범위는 필수)
if (is_null($minLat) || is_null($minLng) || is_null($maxLat) || is_null($maxLng)) {
    error_log("[ERROR] Bbox parameters are missing in realPrice_apt_emd_cache.php.");
    echo json_encode(['success' => false, 'message' => 'Missing bbox parameters.']);
    exit();
}


// estateTypes 파싱 (예: "apt,multi" -> ['apt', 'multi'])
$estateTypes = [];
if (!empty($estateTypesParam)) {
    $estateTypes = array_map('trim', explode(',', $estateTypesParam));
}

// ----- 읍면동(EMD) 코드 목록 결정 -----
$targetEmdCds  = []; // ✨ 이 변수를 DB 조회 결과 및 Redis 루프에서 사용합니다. ✨

if (!empty($sggCdsParam)) { 
    $sggCds = is_array($sggCdsParam) ? $sggCdsParam : array_map('trim', explode(',', $sggCdsParam));
    $sggCds = array_unique($sggCds);

    if (!empty($sggCds)) {
        $firstCode = $sggCds[0]; // 배열의 첫 번째 코드를 가져와서 길이로 판단
        $codeLength = strlen($firstCode);
        
        $columnToQuery = ''; // 조회할 컬럼명
        if ($codeLength === 10) {
            $columnToQuery = 'emd_code';
        } elseif ($codeLength === 5) {
            $columnToQuery = 'sgg_code';
        } elseif ($codeLength === 2) {
            $columnToQuery = 'sido_code';
        } else {
            error_log("[ERROR] Unexpected code length received: {$firstCode} (length {$codeLength}).");
            echo json_encode(['success' => true, 'data' => []]);
            exit();
        }
        $sggCdsPlaceholders = implode(',', array_fill(0, count($sggCds), '?'));

        $sql = "SELECT emd_code FROM SIDO_EMD_CODE WHERE {$columnToQuery} IN ({$sggCdsPlaceholders}) AND use_yn = 'Y'"; 

        try {
            if ($stmt = $conn->prepare($sql)) {
                $types = str_repeat('s', count($sggCds));
                $stmt->bind_param($types, ...$sggCds);
                
                $stmt->execute();
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $targetEmdCds[] = $row['emd_code']; // ✨ DB 조회 결과를 $targetEmdCds에 추가합니다. ✨
                }
                $stmt->close();
            } else {
                error_log("[ERROR] Failed to prepare SQL for EMD codes from SIDO_EMD_CODE: " . $conn->error);
                echo json_encode(['success' => false, 'message' => 'Internal server error.']);
                exit();
            }
        } catch (mysqli_sql_exception $e) {
            error_log("[ERROR] SQL Exception fetching EMD codes: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Internal server error.']);
            exit();
        }
    }
}

// 조회할 EMD 코드가 없으면 빈 배열 반환
if (empty($targetEmdCds)) { // ✨ $targetEmdCds를 확인합니다. ✨
    error_log("[INFO] No EMD codes found for the given sggCds. Returning empty data.");
    echo json_encode(['success' => true, 'data' => []]);
    exit();
}
error_log("[DEBUG] Extracted Target EMD Cds: " . json_encode($targetEmdCds)); // ✨ DB 조회 성공 시 로그 추가 ✨

// ----- Redis에서 데이터 조회 및 필터링 -----
$allEstateData = [];
$cacheKeys = [];
foreach ($targetEmdCds as $emdCd) { 
    // Redis 키 유효성 검사 (emdCd가 PNU 10자리 규격을 따르는지 등)
    if (!preg_match('/^\d{10}$/', $emdCd)) {
        error_log("[WARNING] Invalid emd_code format encountered: {$emdCd}. Skipping.");
        continue;
    }
    $cacheKeys[] = "realPrice:emd:latest:{$emdCd}";
}

$cachedDataArray = []; // ✨ $cachedDataArray 초기화 ✨
if (!empty($cacheKeys)) {
    $cachedDataArray = $redis->mget($cacheKeys); // ✨ MGET 호출 ✨
    if ($cachedDataArray === false) {
        error_log("[ERROR] Redis MGET operation failed for keys: " . implode(', ', $cacheKeys));
        echo json_encode(['success' => false, 'message' => 'Redis operation failed.']);
        if ($conn) $conn->close();
        exit();
    }
} else {
    // 유효한 cacheKeys가 없는 경우 (모두 유효성 검사로 걸러진 경우)
    $cachedDataArray = [];
}

// ✨ MGET 결과 로그는 MGET 호출 후에 배치합니다. ✨
error_log("[DEBUG] After Redis MGET, cacheKeys count: " . count($cacheKeys) . ", Cached Data Array count: " . count($cachedDataArray));
if (!empty($cachedDataArray)) {
    // 첫 번째 데이터 엔트리의 첫 200자만 찍어봅니다.
    error_log("[DEBUG] Sample Cached Data: " . substr($cachedDataArray[array_key_first($cachedDataArray)], 0, 200));
}

foreach ($cachedDataArray as $dataJson) {
    if ($dataJson) { // 캐시 데이터가 존재하면
        $decodedCacheEntry = json_decode($dataJson, true); // Redis에서 가져온 전체 엔트리 디코딩

        if (json_last_error() === JSON_ERROR_NONE && is_array($decodedCacheEntry)) {
            $cachedAt = $decodedCacheEntry['cached_at'] ?? null; // 캐시된 시간 정보
            $emdDataItems = $decodedCacheEntry['data'] ?? [];    // 실제 부동산 거래 데이터 배열

            if (!is_array($emdDataItems)) {
                error_log("[WARNING] 'data' field in Redis cache is not an array for a cache entry. Data: " . substr($dataJson, 0, 200));
                continue;
            }

            foreach ($emdDataItems as $item) { // 실제 거래 데이터 배열을 순회
                $estateTypeMatch = true;
                if (!empty($estateTypes) && !in_array($item['estate_type'], $estateTypes)) {
                    $estateTypeMatch = false;
                }

                $bboxMatch = false;
                if (
                    isset($item['center_latitude']) && isset($item['center_longitude']) &&
                    $item['center_latitude'] >= $minLat && $item['center_latitude'] <= $maxLat &&
                    $item['center_longitude'] >= $minLng && $item['center_longitude'] <= $maxLng
                ) {
                    $bboxMatch = true;
                }

                if ($estateTypeMatch && $bboxMatch) {
                    $item['redis_cached_at'] = $cachedAt; // 'redis_cached_at'과 같이 명확한 이름 사용 권장
                    $allEstateData[] = $item;
                }
            }
        } else {
            error_log("[WARNING] Failed to decode JSON from Redis cache or data is not array. Data: " . substr($dataJson, 0, 200)); // 처음 200자만 로그
        }
    }
}

// 최종 응답
error_log("[DEBUG] Final result count for allEstateData: " . count($allEstateData));
echo json_encode(['success' => true, 'data' => $allEstateData]);

// DB 연결 닫기 (여기서는 DB를 열고 썼다면 닫는게 좋습니다)
if ($conn) {
    $conn->close();
}
?>