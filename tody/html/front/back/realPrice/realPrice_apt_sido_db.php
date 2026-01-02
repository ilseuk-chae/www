<?php
// /front/back/realPrice/realPrice_apt_sido_db.php
// PHP 환경 설정
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL); // 개발 중 모든 에러 표시 (운영 환경에서는 off 또는 로그 처리)
ini_set('display_errors', 1); // 운영 환경에서는 화면에 에러 표시 안함

// DB 연결 및 공통 함수 포함
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php'); // get_db_connection() 함수가 있다고 가정

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

// 클라이언트 요청 데이터 수신 (POST 방식으로 JSON 데이터 수신)
$input = file_get_contents('php://input');
$requestData = json_decode($input, true); // JSON 데이터를 PHP 배열로 디코딩
error_log("[DEBUG] realPrice_apt_sido_db.php Request Data: " . json_encode($requestData));

// JSON 디코딩 실패 처리 및 필수 파라미터 유효성 검사
if (json_last_error() !== JSON_ERROR_NONE || !is_array($requestData)) {
    error_log("[ERROR] Invalid JSON data received: " . $input);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data received.']);
    exit();
}

$minLat = isset($requestData['minLat']) ? (float)$requestData['minLat'] : null;
$minLng = isset($requestData['minLng']) ? (float)$requestData['minLng'] : null;
$maxLat = isset($requestData['maxLat']) ? (float)$requestData['maxLat'] : null;
$maxLng = isset($requestData['maxLng']) ? (float)$requestData['maxLng'] : null;
$estateTypesParam = $requestData['estateTypes'] ?? null; // "apt,multi" 형태
$sidoCdsParam = $requestData['sggCds'] ?? null; // 클라이언트에서 sggCds로 보내더라도 여기서 sidoCds로 처리함 (예: "11,26" 형태)

// 필수 Bbox 파라미터 유효성 검사
if (is_null($minLat) || is_null($minLng) || is_null($maxLat) || is_null($maxLng)) {
    error_log("[ERROR] Bbox parameters are missing in realPrice_apt_sido_db.php.");
    echo json_encode(['success' => false, 'message' => 'Missing bbox parameters.']);
    exit();
}

// estateTypes 파싱 (예: "apt,multi" -> ['apt', 'multi'])
$estateTypes = [];
if (!empty($estateTypesParam)) {
    $estateTypes = array_map('trim', explode(',', $estateTypesParam));
}

// sidoCds 파싱 (예: "11,26" -> ['11', '26'])
$targetSidoCds = [];
// 클라이언트에서 sggCds 이름으로 보내는 파라미터를 sidoCds로 활용합니다.
if (!empty($sidoCdsParam)) { 
    $targetSidoCds = array_map('trim', explode(',', $sidoCdsParam));
}

$data = []; // 최종 반환될 데이터 배열
try {
    $sql = "
        SELECT
            code,
            code_name,
            estate_type,
            all_average,
            all_count,
            last5Year_average,
            last5Year_count,
            last1Year_average,
            last1Year_count,
            last3Month_average,
            last3Month_count,
            last1Month_average,
            last1Month_count,
            center_latitude,
            center_longitude,
            description
        FROM
            realPrice_Average_sido  /* <-- 시도 테이블로 변경 */
    ";
    $whereClauses = []; // WHERE 절의 조건을 모을 배열
    $params = [];       // 바인딩할 파라미터 값을 모을 배열
    $types = "";        // 바인딩할 파라미터 타입을 모을 문자열

    
    // sidoCds 조건 추가
    if (!empty($targetSidoCds)) {
        $placeholders = implode(',', array_fill(0, count($targetSidoCds), '?'));
        // ✨ 변경: 조건을 $whereClauses 배열에 추가합니다.
        // realPrice_Average_sido 테이블의 'code' 컬럼이 SIDO 2자리 코드를 직접 담는다고 가정합니다.
        $whereClauses[] = "code IN ({$placeholders})"; 
        $params = array_merge($params, $targetSidoCds);
        $types .= str_repeat('s', count($targetSidoCds)); // string for sido codes
    } else {
        // targetSidoCds가 비어있으면 아무 결과도 반환하지 않음
        $whereClauses[] = "FALSE"; // SQL 쿼리가 항상 FALSE가 되어 결과가 없음
        error_log("[INFO] No targetSidoCds provided. Query will return an empty set based on 'FALSE' condition.");
    }

    // estateTypes 조건 추가
    if (!empty($estateTypes)) {
        $placeholders = implode(',', array_fill(0, count($estateTypes), '?'));
        // ✨ 변경: 조건을 $whereClauses 배열에 추가합니다.
        $whereClauses[] = "estate_type IN ({$placeholders})";
        $params = array_merge($params, $estateTypes);
        $types .= str_repeat('s', count($estateTypes)); // string for estate types
    }

    // ✨ 최종 WHERE 절 조립 ✨
    // $whereClauses 배열에 조건이 하나라도 있다면 'WHERE' 키워드를 붙여서 SQL을 완성합니다.
    if (!empty($whereClauses)) {
        $sql .= " WHERE " . implode(" AND ", $whereClauses);
    } else {
        // 이 부분에 도달했다면 $targetSidoCds도 $estateTypes도 없는 경우입니다.
        // 현재 로직에서는 $targetSidoCds가 없으면 "FALSE"를 추가했으므로 $whereClauses가 비어있을 일은 없습니다.
        error_log("[WARNING] No WHERE clauses were generated, but this state should be prevented by 'FALSE' condition.");
    }
    
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        error_log("[ERROR] Prepare failed: (" . $conn->errno . ") " . $conn->error);
        echo json_encode(['success' => false, 'message' => 'Database query preparation failed.']);
        if ($conn) $conn->close();
        exit();
    }

    // 파라미터가 있을 때만 bind_param 호출
    if (!empty($params)) {
        // PHP 5.6 이상 버전에서 ...$params (splat operator) 사용
        $stmt->bind_param($types, ...$params); 
    }
    
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
    } else {
        error_log("[ERROR] Query execution failed: (" . $stmt->errno . ") " . $stmt->error);
        echo json_encode(['success' => false, 'message' => 'Database query execution failed.']);
        if ($conn) $conn->close();
        exit();
    }
    $stmt->close();

} catch (mysqli_sql_exception $e) {
    error_log("[ERROR] SQL Exception in realPrice_apt_sido_db.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Internal server error during data retrieval.']);
    if ($conn) $conn->close();
    exit();
} finally {
    if ($conn) $conn->close();
}

// 최종 응답
error_log("[DEBUG] Final result count for realPrice_Average_sido: " . count($data));
echo json_encode(['success' => true, 'data' => $data]);
?>