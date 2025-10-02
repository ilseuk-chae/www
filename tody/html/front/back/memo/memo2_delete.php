<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// error_reporting(E_ALL); // 개발 중에만 활성화
// ini_set("display_errors", 1); // 개발 중에만 활성화
$debug_mode = true; // 디버그 모드 활성화

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$memo_no_from_client = isset($_POST['memo_idx']) ? urldecode($_POST['memo_idx']) : ''; // 클라이언트에서 보낸 메모 번호 (memo2_listings.idx 값)

##################### 0. 유효성 검사 #####################
$errorMessage = "올바른 요청이 아닙니다.";
$valid = validateInput($memo_no_from_client, 'int', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}

mysqli_autocommit($conn, FALSE);
mysqli_begin_transaction($conn);

try {
    $user_no_authenticated = get_user_no_for_hash($conn, $userNo); // authChk.php에서 userNo가 설정된다고 가정
    
    // SQL 쿼리에 바인딩될 변수들 준비
    $param_listing_idx = $memo_no_from_client; // memo2_listings의 idx (전체 메모 번호)
    $param_user_id_for_memo_check = $user_no_authenticated; // memo2_listings.reg_no, memo_comment.reg_no, memo_files.user_no 와 일치할 것

    // memo2_listings.idx와 reg_no를 이용해 memo2_listings.my_idx를 가져옵니다.
    $linked_my_idx_for_files = null;
    $stmt_get_my_idx = $conn->prepare("SELECT my_idx FROM memo2_listings WHERE idx = ? AND reg_no = ?");
    if (!$stmt_get_my_idx) {
        throw new Exception("SQL PREPARE failed for select my_idx from memo2_listings: " . $conn->error);
    }
    $stmt_get_my_idx->bind_param("ii", $param_listing_idx, $param_user_id_for_memo_check);
    $stmt_get_my_idx->execute();
    $result_my_idx = $stmt_get_my_idx->get_result();
    if ($result_my_idx->num_rows > 0) {
        $row_my_idx = $result_my_idx->fetch_assoc();
        $linked_my_idx_for_files = $row_my_idx['my_idx'];
    }
    $stmt_get_my_idx->close();

    // ⭐⭐⭐ 1. memo_files 테이블에서 파일 정보 조회 (my_idx와 user_no로 조회) ⭐⭐⭐
    $files_to_delete_from_disk = [];
    $db_file_details = [];

    if ($linked_my_idx_for_files !== null) { // my_idx를 찾았다면 파일 조회 및 삭제 진행
        $sql_select_files = "SELECT file_path, file_name FROM memo_files WHERE memo_idx = ? AND user_no = ?"; 
        $stmt_select_files = $conn->prepare($sql_select_files);
        if (!$stmt_select_files) {
            throw new Exception("SQL PREPARE failed for select memo_files: " . $conn->error);
        }
        $stmt_select_files->bind_param("ii", $linked_my_idx_for_files, $param_user_id_for_memo_check);
        $stmt_select_files->execute();
        $result_files = $stmt_select_files->get_result();
        
        while ($row = $result_files->fetch_assoc()) {
            $files_to_delete_from_disk[] = $row['file_path'];
            $db_file_details[] = $row;
        }
        $stmt_select_files->close();
        
    } else {
        
    }
    
    // 2. 서버 디스크에서 실제 이미지 파일 삭제
    foreach ($files_to_delete_from_disk as $file_path) {
        // PHP에서는 / 와 \ 모두 디렉토리 구분자로 사용될 수 있지만, 저장된 경로에 \\가 들어가면 \를 한 번 제거해야 합니다.
        $clean_file_path = str_replace('\\', '/', $file_path); // DB에 \\/ 로 저장될 경우, /로 치환
        
        // 최종 삭제 경로: DB에 저장된 file_path가 이미 /home/project/tody/upload/memo/2/10/... 와 같은 형태라면 이것이 full_path입니다.
        $full_path = $clean_file_path; // DB에 저장된 경로를 그대로 사용

        if (file_exists($full_path)) {
            if (!unlink($full_path)) {
                error_log("ERROR: Failed to delete physical file: " . $full_path . " (Check permissions!)");
            } else {
            }
        } else {
            error_log("WARNING: Physical file not found for deletion: " . $full_path . " (Verify path in DB and server filesystem)");
        }
    }

    // ⭐⭐⭐ 3. memo_files 테이블에서 레코드 삭제 (my_idx와 user_no로 삭제) ⭐⭐⭐
    if ($linked_my_idx_for_files !== null) { // my_idx를 찾았다면 파일 레코드 삭제 진행
        $sql_delete_files = "DELETE FROM memo_files WHERE memo_idx = ? AND user_no = ?"; 
        
        $stmt_delete_files = executeQuery($conn, $sql_delete_files, "ii", [$linked_my_idx_for_files, $param_user_id_for_memo_check]);
        if (!$stmt_delete_files) {
            throw new Exception("SQL PREPARE/EXECUTE failed for delete memo_files: " . $conn->error);
        }
        $affected_files_rows = mysqli_stmt_affected_rows($stmt_delete_files);
        
    } else {
        
        $affected_files_rows = 0; // 디버깅을 위해 영향 받은 행 수를 0으로 설정
    }


    // ⭐⭐⭐ 4. memo_comment 테이블에서 레코드 삭제 (memo_no와 reg_no로 삭제) ⭐⭐⭐
    //    여기서 memo_no는 param_listing_idx(memo2_listings.idx)
    $sql_comment = 
        "DELETE FROM memo_comment
        WHERE memo_no = ?  
        AND reg_no = ?";
    
    $stmt_comment = executeQuery($conn, $sql_comment, "ii", [$param_listing_idx, $param_user_id_for_memo_check]);
    $affected_comment_rows = mysqli_stmt_affected_rows($stmt_comment);
    
    // ⭐⭐⭐ 5. memo2_listings 삭제 처리 (idx와 reg_no로 삭제) ⭐⭐⭐
    $sql_memo =
        "DELETE FROM memo2_listings
        WHERE idx = ?
        AND reg_no = ?
        ";        
    
    $stmt_memo = executeQuery($conn, $sql_memo, "ii", [$param_listing_idx, $param_user_id_for_memo_check]);
    $affected_memo_rows = mysqli_stmt_affected_rows($stmt_memo);
    
    if ($affected_memo_rows === 0) {
        throw new Exception("Memo not found or you don't have permission for memo_no: " . $param_listing_idx, 404);
    }

    mysqli_commit($conn);
    
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    mysqli_rollback($conn);
    error_log("ERROR: Memo deletion failed (rolled back). Memo_no: " . $memo_no_from_client . " | Exception: " . $e->getMessage() . " | Code: " . $e->getCode());
    responseApi(500, '처리 중 문제가 발생했습니다. 관리자에게 문의하세요.', $e->getMessage());

} finally {
    if (isset($stmt_get_my_idx)) mysqli_stmt_close($stmt_get_my_idx); // 새로 추가
    if (isset($stmt_select_files)) mysqli_stmt_close($stmt_select_files);
    if (isset($stmt_delete_files)) mysqli_stmt_close($stmt_delete_files);
    if (isset($stmt_comment)) mysqli_stmt_close($stmt_comment);
    if (isset($stmt_memo)) mysqli_stmt_close($stmt_memo);
    mysqli_close($conn);
    
}
?>