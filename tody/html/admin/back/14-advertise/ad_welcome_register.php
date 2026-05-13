<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect.php';
include_once '../00-include/validation.php';

// $_POST 데이터 가져오기 (urldecode 제거)
$ad_name = $_POST['ad_name'] ?? '';
$ad_url = $_POST['ad_url'] ?? '';
$start_date = $_POST['start_date'] ?? '';
$end_date = $_POST['end_date'] ?? '';
$active_fg = $_POST['active_fg'] ?? '';
$show_fg = $_POST['show_fg'] ?? '';  //'Y' 또는 'N'

// $ad_image_name은 프론트에서 넘어온 원본 파일명 (없으면 빈 문자열)
$ad_image_name= $_POST['ad_image_name'] ?? '';

// 파일 데이터 가져오기
$ad_file = isset($_FILES['ad_image']) ? $_FILES['ad_image'] : null;

// advertise_welcome.ad_image 컬럼에 저장될 실제 서버 파일명 (초기에는 null)
$server_saved_file_name_to_db = null;


##################### 0. 유효성 검사 #####################
$errorMessage = "메인 광고명을 확인해주세요.";
$valid = validateInput($ad_name, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
$errorMessage = "메인 광고 사이트 주소를 확인해주세요.";
$valid = validateInput($ad_url, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}

// 이미지 유효성 검사 (파일이 업로드된 경우에만)
if ($ad_file && $ad_file['error'] === UPLOAD_ERR_OK) { // 파일 업로드 오류 없는지 확인
    $errorMessage = "이미지의 확장자를 확인해주세요.";
    $options = array('type' => 'image');
    $valid = validateInput($ad_file, 'file', $errorMessage, $options);
    if ($valid === $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}

// show_fg='Y'인 광고 개수 제한 로직 추가 시작
if ($show_fg === 'Y') {
    $countSql = "SELECT COUNT(*) AS active_show_count FROM advertise_welcome WHERE show_fg = 'Y'";
    $countStmt = mysqli_prepare($conn, $countSql);

    if (!$countStmt) {
        responseApi(500, 'COUNT_QUERY_PREPARATION_FAILED', null);
        exit;
    }

    mysqli_stmt_execute($countStmt);
    $countResult = mysqli_stmt_get_result($countStmt);
    $countRow = mysqli_fetch_assoc($countResult);
    $activeShowCount = $countRow['active_show_count'];

    mysqli_stmt_close($countStmt); // 카운트 쿼리 종료

    if ($activeShowCount >= 3) {
        responseApi(409, '메인 광고는 3개까지만 노출 가능합니다.', null);
        exit;
    }
}
//show_fg='Y'인 광고 개수 제한 로직 추가 끝

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    ##################### 1. 메인 광고 등록 #####################
    $sql =
        "INSERT INTO advertise_welcome (
            ad_name,ad_url,ad_image_name,start_date,end_date,active_fg,show_fg, ad_image 
        ) VALUES (
            ?,?,?,?,?,?,?,?
        ); ";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    // 타입 지정 (s: string, s: string, s: string, s: string, s: string, s: string, s: string, s: string) 총 8개
    if (!mysqli_stmt_bind_param($stmt, "ssssssss",
        $ad_name,
        $ad_url,
        $ad_image_name, 
        $start_date,
        $end_date,
        $active_fg,
        $show_fg,
        $server_saved_file_name_to_db // 초기에는 null 또는 빈 문자열
    )) {
        throw new Exception('BINDING_FAILED: ' . mysqli_stmt_error($stmt), 500); // 에러 상세화
    }

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        // 중복 항목 에러 처리
        $errorCode = mysqli_stmt_errno($stmt);
        $errorMessage = mysqli_stmt_error($stmt);

        if ($errorCode == 1062) {
            throw new Exception('DUPLICATE_ENTRY', 409);
        } else {
            throw new Exception('EXECUTION_FAILED: ' . $errorMessage, 500);
        }
    }

    // 성공한 row의 primary key 값을 가져옵니다.
    $insertedId = mysqli_insert_id($conn);

    ##################### 2. 파일 이동 및 DB에 저장 #####################
    // --- 2단계: 파일 이동 및 DB 업데이트 (`ad_image` 컬럼) ---
    if ($ad_file && $ad_file['error'] === UPLOAD_ERR_OK) { // $file 대신 $ad_file 사용
        // 2-0. 파일 이동
        $filePath = "adwelcome/" . $insertedId . "/";
        $file_move_result = upload_file_one($ad_file, $filePath); // $file 대신 $ad_file 사용

        if ($file_move_result['result'] == 'success') {
            // 예시: u/home/project/tody/upload/adwelcome/1/uuid.jpg
            $full_path_from_upload = $file_move_result['file_path'];
            $upload_base_path_for_str_replace = "/home/project/tody/upload/";

            // 웹에서 접근 가능한 상대 경로를 추출 (예: adwelcome/1/uuid.jpg)
            $actual_saved_relative_path = str_replace($upload_base_path_for_str_replace, '', $full_path_from_upload);

            // 2-1. DB 업데이트
            $sql2 =
            "UPDATE advertise_welcome SET
                ad_image = ?
            WHERE idx = ?; ";

            $stmt2 = mysqli_prepare($conn, $sql2);
            if (!$stmt2) {
                throw new Exception('AD_IMAGE_UPDATE_PREPARATION_FAILED: ' . mysqli_error($conn), 500);
            }

            // 'ad_image' 컬럼을 실제 서버에 저장된 파일명으로 업데이트
            if (!mysqli_stmt_bind_param($stmt2, "si", $actual_saved_relative_path , $insertedId)) {
                throw new Exception('AD_IMAGE_UPDATE_BINDING_FAILED: ' . mysqli_stmt_error($stmt2), 500);
            }
            if (!mysqli_stmt_execute($stmt2)) {
                throw new Exception('AD_IMAGE_UPDATE_EXECUTION_FAILED: ' . mysqli_stmt_error($stmt2), 500);
            }
        } else {
            // 파일 업로드 함수에서 실패가 반환된 경우
            throw new Exception('FILE_UPLOAD_FAILED: ' . ($file_move_result['message'] ?? 'Unknown error'), 500);
        }
    }
    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    mysqli_rollback($conn); // 예외 발생 시 롤백
    // 예외 코드에 따른 적절한 HTTP 상태 코드 및 메시지 반환
    $statusCode = $e->getCode() == 409 ? 409 : 500;
    responseApi($statusCode, 'FAILURE', ['message' => $e->getMessage()]);
} finally {
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    if (isset($stmt2)) {
        mysqli_stmt_close($stmt2);
    }
    mysqli_close($conn);
}
