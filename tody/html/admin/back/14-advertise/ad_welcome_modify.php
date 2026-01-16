<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect.php';
include_once '../00-include/validation.php';

define('UPLOAD_WEB_ROOT_URL', "/uploads/"); 
define('UPLOAD_BASE_DIR_ABSOLUTE', "/home/project/tody/upload/"); 

// $_POST 데이터 가져오기 (urldecode 제거)
$ad_no = $_POST['ad_no'] ?? ''; // 수정할 광고의 ID
$ad_name = $_POST['ad_name'] ?? '';
$ad_url = $_POST['ad_url'] ?? '';
$start_date = $_POST['start_date'] ?? '';
$end_date = $_POST['end_date'] ?? '';
$active_fg = $_POST['active_fg'] ?? '';
$show_fg = $_POST['show_fg'] ?? '';  //'Y' 또는 'N'

// $ad_image_name은 프론트에서 넘어온 원본 파일명 (없으면 빈 문자열)
$ad_image_name_from_frontend = $_POST['ad_image_name'] ?? '';

// 기존 이미지를 삭제했음을 나타내는 플래그 (새 파일 업로드 없이 이미지 삭제 시 사용)
$delete_existing_image_flag = $_POST['delete_existing_image_flag'] ?? '0'; // 0: 유지, 1: 삭제
// 파일 데이터 가져오기
$new_ad_file = isset($_FILES['ad_image']) ? $_FILES['ad_image'] : null;

// advertise_welcome.ad_image 컬럼에 저장될 실제 서버 파일명 (초기에는 null)
$server_saved_file_name_to_db = null;
$actual_ad_image_name_for_db = $ad_image_name_from_frontend; // DB에 저장할 원본 파일명 (기본은 프론트에서 넘어온 값)


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작


try {
    // --- 0.1. 기본 유효성 검사 ---
    $errorMessage = "수정할 광고 ID를 확인해주세요.";
    if (empty($ad_no) || !is_numeric($ad_no)) {
        throw new Exception($errorMessage, 400);
    }
    $errorMessage = "메인 광고명을 확인해주세요.";
    if (validateInput($ad_name, 'string', $errorMessage) === $errorMessage) {
        throw new Exception($errorMessage, 400);
    }
    $errorMessage = "메인 광고 사이트 주소를 확인해주세요.";
    if (validateInput($ad_url, 'string', $errorMessage) === $errorMessage) {
        throw new Exception($errorMessage, 400);
    }

    // --- 0.2. 기존 광고 정보 가져오기 (파일 삭제 및 show_fg 로직에 필요) ---
    $current_ad_image_db = null; // DB에 저장된 실제 파일명
    $current_ad_image_name_db = null; // DB에 저장된 원본 파일명
    $current_show_fg_db = null;

    $select_current_sql = "SELECT ad_image, ad_image_name, show_fg FROM advertise_welcome WHERE idx = ?";
    $stmt_select_current = mysqli_prepare($conn, $select_current_sql);
    if (!$stmt_select_current) {
        throw new Exception('PREPARE_CURRENT_AD_SELECT_FAILED', 500);
    }
    mysqli_stmt_bind_param($stmt_select_current, "i", $ad_no);
    mysqli_stmt_execute($stmt_select_current);
    $result_current = mysqli_stmt_get_result($stmt_select_current);
    $current_ad_data = mysqli_fetch_assoc($result_current);
    mysqli_stmt_close($stmt_select_current);

    if (!$current_ad_data) {
        throw new Exception('AD_NOT_FOUND', 404); // 수정할 광고를 찾을 수 없음
    }
    $current_ad_image_db = $current_ad_data['ad_image'];
    $current_ad_image_name_db = $current_ad_data['ad_image_name'];
    $current_show_fg_db = $current_ad_data['show_fg'];


    // ⭐⭐⭐ 필수 이미지 파일 유효성 검사 시작 ⭐⭐⭐
    $is_new_file_uploaded = ($new_ad_file && $new_ad_file['error'] === UPLOAD_ERR_OK);

    // Case 1: 새 파일이 업로드된 경우
    if ($is_new_file_uploaded) {
        $errorMessage = "새 이미지의 확장자를 확인해주세요.";
        if (validateInput($new_ad_file, 'file', $errorMessage, ['type' => 'image']) === $errorMessage) {
            throw new Exception($errorMessage, 400);
        }
    } 
    // Case 2: 새 파일이 업로드되지 않았고, 기존 이미지를 삭제하려 하거나 기존 이미지가 없는 경우
    else {
        // 이미지를 삭제하라는 플래그가 넘어왔거나 (delete_existing_image_flag = 1)
        // 기존 광고에 이미지가 아예 없었던 경우 (empty($current_ad_image_db))
        // -> 이 경우 새 파일이 없으므로 이미지를 필수 항목으로 간주하여 에러 발생
        if ($delete_existing_image_flag === '1' || empty($current_ad_image_db)) {
             throw new Exception('이미지는 필수 항목입니다. 새 이미지를 업로드해야 합니다.', 400);
        }
        // Case 3: 새 파일은 없고, delete_existing_image_flag도 1이 아니며, 기존 이미지가 있는 경우
        // -> 기존 이미지를 그대로 사용 (이 로직은 아래 파일 처리 단계에서 자동 처리)
    }
    // ⭐⭐⭐ 필수 이미지 파일 유효성 검사 끝 ⭐⭐⭐


    // --- 0.3. show_fg='Y'인 광고 개수 제한 로직 (수정 시 로직 조정) ---
    // 새로운 show_fg가 'Y'이고, 기존 show_fg가 'N' 또는 현재 count가 3이상이라면 검사
    if ($show_fg === 'Y') {
        // 현재 'Y'인 광고 개수를 세는데, 수정하려는 본인 광고는 제외하고 셉니다.
        $countSql = "SELECT COUNT(*) AS active_show_count FROM advertise_welcome WHERE show_fg = 'Y' AND idx != ?";
        $countStmt = mysqli_prepare($conn, $countSql);
        if (!$countStmt) {
            throw new Exception('COUNT_QUERY_PREPARATION_FAILED', 500);
        }
        mysqli_stmt_bind_param($countStmt, "i", $ad_no);
        mysqli_stmt_execute($countStmt);
        $countResult = mysqli_stmt_get_result($countStmt);
        $countRow = mysqli_fetch_assoc($countResult);
        $activeShowCount = $countRow['active_show_count'];
        mysqli_stmt_close($countStmt);

        if ($activeShowCount >= 3) {
            throw new Exception('메인 광고는 3개까지만 노출 가능합니다.', 409); // 409 Conflict
        }
    }


    // ⭐⭐⭐ 1. 파일 처리 로직 (항상 파일 존재 보장) ⭐⭐⭐
    $update_image_columns = []; // ad_image, ad_image_name 업데이트 여부
    $update_image_values = [];  // ad_image, ad_image_name 업데이트 값

    // 1-1. 새 파일이 업로드된 경우
    if ($is_new_file_uploaded) {
        // 기존 파일 삭제 (기존 이미지가 DB에 저장되어 있다면)
        if (!empty($current_ad_image_db)) {
            $old_file_physical_path = UPLOAD_BASE_DIR_ABSOLUTE . $current_ad_image_db;
            
            if (file_exists($old_file_physical_path) && is_file($old_file_physical_path)) {
                if (!unlink($old_file_physical_path)) { 
                    $php_error = error_get_last();
                    //error_log("ERROR: Failed to delete old file: " . $old_file_physical_path . " (PHP Error: " . ($php_error['message'] ?? 'Unknown error') . ")");
                } else {
                    //error_log("DEBUG: Successfully unlinked old file: " . $old_file_physical_path);
                }
            } else {
                error_log("WARNING: Old file to delete not found at transformed physical path: " . $old_file_physical_path);
            }
        }

        // 새 파일 업로드
        $target_prefix_for_upload = "adwelcome/" . $ad_no . "/";
        $file_move_result = upload_file_one($new_ad_file, $target_prefix_for_upload);
    
        if ($file_move_result['result'] !== 'success') {
            throw new Exception('FILE_UPLOAD_FAILED: ' . ($file_move_result['message'] ?? 'Unknown error'), 500);
        }
        
        $full_path_from_upload = $file_move_result['file_path'];
        $upload_base_path_for_str_replace = "/home/project/tody/upload/"; // 실제 업로드 디렉토리 루트
        
        $actual_saved_relative_path = str_replace($upload_base_path_for_str_replace, '', $full_path_from_upload);

        $update_image_columns[] = 'ad_image = ?';
        $update_image_columns[] = 'ad_image_name = ?';
        $update_image_values[] = $actual_saved_relative_path;  
        $update_image_values[] = $actual_ad_image_name_for_db;
    } 
    // 1-2. 새 파일은 업로드되지 않았고, 기존 이미지를 유지하는 경우
    else {
        
        $server_saved_file_name_for_db = $current_ad_image_db;
        $actual_ad_image_name_for_db = $current_ad_image_name_db;
    }

    // --- 2. 메인 광고 정보 업데이트 ---
    $sql_update = "
        UPDATE advertise_welcome SET
            ad_name = ?,
            ad_url = ?,
            start_date = ?,
            end_date = ?,
            active_fg = ?,
            show_fg = ?            
        ";

    $bind_types = "ssssss"; // ad_name, ad_url, start_date, end_date, active_fg, show_fg
    $bind_values = [
        $ad_name,
        $ad_url,
        $start_date,
        $end_date,
        $active_fg,
        $show_fg
    ];

    // 이미지 관련 컬럼 업데이트 필요 시 SQL과 바인딩 정보 추가
    if (!empty($update_image_columns)) {
        $sql_update .= ", " . implode(", ", $update_image_columns);
        // 바인딩 타입: 이미지 경로는 's', 원본 파일명은 's'
        foreach ($update_image_values as $val) {
             $bind_types .= (is_null($val) ? 's' : (is_string($val) ? 's' : (is_int($val) ? 'i' : 's'))); // 실제 값에 따라 타입 조정
        }
        $bind_values = array_merge($bind_values, $update_image_values);
    }
    
    $sql_update .= " WHERE idx = ?";
    $bind_types .= "i"; // idx (ad_no)
    $bind_values[] = $ad_no;

    $stmt = mysqli_prepare($conn, $sql_update);
    if (!$stmt) {
        throw new Exception('UPDATE_PREPARATION_FAILED: ' . mysqli_error($conn), 500);
    }

    // ⭐⭐⭐ 변경 시작 ⭐⭐⭐
    // 바인딩 파라미터를 참조로 전달하기 위한 전처리
    $bind_refs = array();
    $bind_refs[] = $bind_types; // 첫 번째 인자는 타입 문자열 (참조 아님)
    for ($i=0; $i<count($bind_values); $i++) {
        $bind_refs[] = &$bind_values[$i]; // 배열의 각 요소를 참조로 전달
    }

    // ⭐ 최종 수정: $stmt 객체를 mysqli_stmt_bind_param의 첫 인자로 직접 전달
    if (!call_user_func_array([$stmt, 'bind_param'], $bind_refs)) { // <-- 여기를 이렇게!
        throw new Exception('UPDATE_BINDING_FAILED: ' . mysqli_stmt_error($stmt), 500);
    }

    if (!mysqli_stmt_execute($stmt)) {
        $errorCode = mysqli_stmt_errno($stmt);
        $errorMessage = mysqli_stmt_error($stmt);
        if ($errorCode == 1062) { // 중복 항목 (예: UNIQUE 키 제약 조건)
            throw new Exception('DUPLICATE_ENTRY', 409);
        } else {
            throw new Exception('UPDATE_EXECUTION_FAILED: ' . $errorMessage, 500);
        }
    }

    mysqli_commit($conn); // 모든 작업 성공 시 커밋

    responseApi(200, 'SUCCESS', ['ad_no' => $ad_no]);

} catch (Exception $e) {
    mysqli_rollback($conn); // 예외 발생 시 롤백
    $statusCode = $e->getCode() == 409 || $e->getCode() == 404 || $e->getCode() == 400 ? $e->getCode() : 500;
    responseApi($statusCode, 'FAIL: ' . $e->getMessage(), null);

} finally {
    if (isset($stmt)) mysqli_stmt_close($stmt);
    if (isset($conn)) mysqli_close($conn);
}
?>

