<?php
//header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect.php';


// --- 데이터 수신 방식 변경 시작 ---
$no = null; // 초기화

// 1. Content-Type 헤더 확인 (JSON으로 왔을 경우)
$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
if (strpos($contentType, 'application/json') !== false) {
    // JSON 데이터 파싱
    $input = file_get_contents('php://input');
    $decodedData = json_decode($input, true); // true를 넣어 연관 배열로 받음
    if (isset($decodedData['ad_no'])) {
        $no = $decodedData['ad_no'];
    }
} 
// 2. JSON이 아니면, $_POST에서 확인 (x-www-form-urlencoded로 왔을 경우)
if ($no === null && isset($_POST['ad_no'])) {
    $no = $_POST['ad_no'];
}

// $no가 여전히 null이거나 유효하지 않은 경우 처리
if ($no === null || !is_numeric($no)) { // is_numeric으로 숫자인지 확인하는 것이 더 안전
    responseApi(400, 'BAD_REQUEST: ad_no is missing or invalid', null);
    exit; // 응답 후 스크립트 종료
}
// --- 데이터 수신 방식 변경 끝 ---

try {
    $sql =
        "SELECT 
            a.idx AS ad_no,
            a.ad_name,
            a.ad_url,
            a.ad_image_name,
            a.active_fg,
            a.show_fg,
            DATE_FORMAT(a.start_date, '%Y-%m-%d') AS start_date, -- 이 부분 수정
            DATE_FORMAT(a.end_date, '%Y-%m-%d') AS end_date,     -- 이 부분도 수정
            a.reg_date,
            a.ad_image -- CONCAT('adwelcome/', a.idx, '/', a.ad_image) AS ad_image            
        FROM advertise_welcome AS a
        WHERE a.idx = ?";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    if (!mysqli_stmt_bind_param($stmt, "i", $no)) {
        throw new Exception('BINDING_FAILED', 500);
    }

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('SQL_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = mysqli_fetch_assoc($result); // 결과를 직접 한 행만 가져옵니다.

    if (!$response_data) {
        // 결과가 없을 경우 (해당 ad_no를 가진 광고가 없는 경우)
        throw new Exception('AD_NOT_FOUND', 404); // 적절한 오류 처리
    } else {
        // 성공 응답 반환
        responseApi(200, 'SUCCESS', $response_data);
    }
} catch (Exception $e) {
    // 오류 발생 시 롤백
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    // 연결 종료
    if (isset($stmt))
        mysqli_stmt_close($stmt);
    mysqli_close($conn);
}