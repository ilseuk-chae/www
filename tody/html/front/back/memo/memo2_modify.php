<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// error_reporting(E_ALL); // 에러 보고 활성화 (개발 시 유용)
// ini_set("display_errors", 1); // 화면에 에러 표시 (개발 시 유용)

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

// 1. 입력값 수신
$memo_no = isset($_POST['memo_no']) ? intval($_POST['memo_no']) : null;
$name = isset($_POST['name']) ? $_POST['name'] : null;
$phone = isset($_POST['phone']) ? $_POST['phone'] : null;
$estate_no_raw = isset($_POST['estateNo']) ? $_POST['estateNo'] : null;
$content = isset($_POST['content']) ? $_POST['content'] : null;
$complete = isset($_POST['complete']) ? $_POST['complete'] : null;
$latitude = isset($_POST['latitude']) ? $_POST['latitude'] : null;
$longitude = isset($_POST['longitude']) ? $_POST['longitude'] : null;
$pnu = isset($_POST['pnu']) ? $_POST['pnu'] : null;
$type = isset($_POST['type']) ? $_POST['type'] : null;
$my_idx = isset($_POST['my_idx']) ? $_POST['my_idx'] : null;


// estate_no 처리 로직 (null, 빈 문자열, '0' 처리)
if ($estate_no_raw === '' || $estate_no_raw === '0') {
    $estate_no = null;
} else {
    $estate_no = intval($estate_no_raw);
}

// 파일 데이터 수신
$new_files = isset($_FILES["new_files"]) ? $_FILES["new_files"] : array();
$deleted_file_nos_json = isset($_POST['deleted_file_nos']) ? $_POST['deleted_file_nos'] : '[]';
$deleted_file_nos = json_decode($deleted_file_nos_json, true);

#######################################################
# 2. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열 (memo_no는 이제 숫자로 받는다고 가정)
$validations = [
    ['value' => $memo_no, 'type' => 'int', 'message' => '메모 ID가 유효하지 않습니다.', 'options' => ['min' => 1]],
    ['value' => $name, 'type' => 'string', 'message' => '이름을 50자 이내로 입력해주세요.', 'options' => ['max' => 50, 'required' => true]],
    ['value' => $phone, 'type' => 'phone', 'message' => '연락처를 확인해주세요.', 'options' => ['required' => true]],
    // estate_no는 null을 허용하고 int로 변환되었으므로 추가적인 유효성 검사는 필요 없을 수 있습니다.
];

foreach ($validations as $validation) {
    // required 옵션을 명시적으로 처리
    if (isset($validation['options']['required']) && $validation['options']['required'] && ($validation['value'] === null || $validation['value'] === '')) {
        responseApi(400, $validation['message'], null);
        exit;
    }
    // required가 아닌 경우는 null/빈 문자열일 경우 검사 skip
    if ($validation['value'] === null || $validation['value'] === '') {
        continue;
    }

    $validationResult = validateInput($validation['value'], $validation['type'], $validation['message'], $validation['options']);
    if ($validation['message'] == $validationResult) { // validateInput이 에러 메시지를 반환하는 방식
        responseApi(400, $validationResult, null);
        exit;
    }
}

// 메모 내용 (content) 유효성 검사
if ($content) {
    $errorMessage = "메모 내용은 255자 이내로 작성해주세요.";
    $valid = validateInput($content, 'string', $errorMessage, ['max' => 255]);
    if ($valid === $errorMessage) { // validateInput이 에러 메시지를 반환하는 방식
        responseApi(400, $errorMessage, null);
        exit;
    }
}

// ⭐⭐ 새로 추가된 파일 유효성 검사 ⭐⭐
if ($new_files && !empty($new_files['name'][0])) { // 실제 업로드된 파일이 있는지 확인
    $errorMessage = '이미지 파일을 확인해주세요.';

    foreach ($new_files['name'] as $index => $currentFileName) {
        $file = array(
            'name' => $new_files['name'][$index],
            'full_path' => $new_files['full_path'][$index], // 이 필드는 없을 수 있습니다.
            'type' => $new_files['type'][$index],
            'tmp_name' => $new_files['tmp_name'][$index],
            'error' => $new_files['error'][$index],
            'size' => $new_files['size'][$index]
        );

        // 파일 타입에 따른 유효성 검사 옵션 설정
        $fileMimeType = mime_content_type($file['tmp_name']); // 임시 파일로 MIME 타입 확인
        if (strpos($fileMimeType, 'image') !== false) {
            $options = ['type' => 'image', 'max_size' => 10 * 1024 * 1024]; // 예: 10MB 제한
        } else {
            $errorMessage = "허용되지 않는 파일 형식입니다: {$file['name']}";
            responseApi(400, $errorMessage, null);
            exit;
        }

        // 파일 유효성 검사 (validateInput이 에러 메시지 또는 true를 반환하는 형태라면)
        $validationResult = validateInput($file, 'file', $errorMessage, $options);
        if ($validationResult !== true) { // 유효성 검사가 true를 반환해야 성공
            responseApi(400, $validationResult, null); // validateInput이 에러 메시지를 반환
            exit;
        }
    }
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

$result_memo_data = []; // 최종적으로 클라이언트에 반환할 업데이트된 메모 데이터

try {
    // 매물 존재 확인 (estate_no)
    if ($estate_no !== null) {
        $sql_check_estate = "SELECT idx FROM estate_listings WHERE idx = ? AND public_fg = 'Y' AND active_fg = 'Y'";
        $stmt_check_estate = executeQuery($conn, $sql_check_estate, 'i', [$estate_no]);
        $result_check_estate = mysqli_stmt_get_result($stmt_check_estate);
        if (!mysqli_fetch_assoc($result_check_estate)) {
            responseApi(404, "확인되지 않는 매물번호입니다.", null);
            mysqli_stmt_close($stmt_check_estate);
            exit;
        }
        mysqli_stmt_close($stmt_check_estate);
    }
  

    // ⭐⭐ 4. 메모 정보 업데이트 (memo_listings 테이블) ⭐⭐
    $sql_update_memo = "UPDATE memo2_listings SET 
                        name = ?, 
                        phone = ?, 
                        estate_no = ?, 
                        content = ?, 
                        complete = ?
                    WHERE idx = ?";  
    $stmt_update_memo = executeQuery(
        $conn, 
        $sql_update_memo, 
        'ssissi',
        // s: string, i: integer, d: double (float), b: blob
        // name(s), phone(s), estate_no(i), content(s), reg_no(i), type(s), latitude(d), longitude(d), pnu(s),complete(s)
            [$name, $phone, $estate_no, $content, $complete,  $memo_no]
    );
    if (!$stmt_update_memo) {
        throw new Exception("메모 정보 업데이트 실패.");
    }
    mysqli_stmt_close($stmt_update_memo);

    // 메모 정보 조회 및 변수 할당 예시
    $sql = "SELECT reg_no, my_idx FROM memo2_listings WHERE idx = ?";
    $stmt = executeQuery($conn, $sql, 'i', [$memo_no]);
    $result = mysqli_stmt_get_result($stmt);
    if ($row = mysqli_fetch_assoc($result)) {
        $reg_no = $row['reg_no'];
        $my_idx = $row['my_idx'];
    } else {
        throw new Exception("메모 정보를 찾을 수 없습니다.");
    }
    mysqli_stmt_close($stmt);


    // 5. 삭제할 이미지 파일 처리
    if (!empty($deleted_file_nos)) {
        // 1. 메모 번호로 reg_no와 my_idx 조회 (필수)
        // $memo_no는 클라이언트에서 넘어온 memo2_listings의 idx 값입니다.
        $sql_get_memo_info = "SELECT reg_no, my_idx FROM memo2_listings WHERE idx = ?";
        $stmt_memo_info = executeQuery($conn, $sql_get_memo_info, 'i', [$memo_no]);
        $res_memo_info = mysqli_stmt_get_result($stmt_memo_info);
        $memo_info = mysqli_fetch_assoc($res_memo_info);
        mysqli_stmt_close($stmt_memo_info);
    
        if (!$memo_info) {
            throw new Exception("수정하려는 메모 정보를 찾을 수 없습니다.");
        }
        $current_reg_no = $memo_info['reg_no']; // memo_files.user_no 에 사용될 값
        $current_my_idx = $memo_info['my_idx']; // memo_files.memo_idx 에 사용될 값
    
        // 2. 플레이스홀더, 바인딩 타입, 파라미터 재구성 (reg_no, my_idx 포함)
        $placeholders = implode(',', array_fill(0, count($deleted_file_nos), '?'));
        $types = str_repeat('i', count($deleted_file_nos)) . 'ii'; // 삭제할 idx들 + current_my_idx(int) + current_reg_no(int)
        $params = array_merge($deleted_file_nos, [$current_my_idx, $current_reg_no]); // idx 값들 + my_idx + reg_no
    
        // 3. 삭제 대상 파일 경로 조회 및 유효성 검증
        $sql_select_deleted_files = "SELECT idx, file_path FROM memo_files WHERE idx IN ($placeholders) AND memo_idx = ? AND user_no = ?";
        $stmt_select_deleted_files = executeQuery($conn, $sql_select_deleted_files, $types, $params);
        $result_files = mysqli_stmt_get_result($stmt_select_deleted_files);
    
        $files_to_delete = [];
        $db_idxs_found = []; // 실제로 DB에서 조회된 idx들을 담을 배열
        while ($row = mysqli_fetch_assoc($result_files)) {
            $db_idxs_found[] = $row['idx']; // 조회된 idx들을 수집
            $files_to_delete[] = $row['file_path'];
        }
        mysqli_stmt_close($stmt_select_deleted_files);
    
        // --- 여기서 유효성 검증 ---
        if (count($db_idxs_found) !== count($deleted_file_nos)) {
            throw new Exception("삭제 요청된 파일 중 DB에 존재하지 않는 파일이 있거나, 수량이 불일치합니다.");
        }
    
        // 4. DB 이미지 정보 삭제 (쿼리, 타입, 파라미터는 위와 동일하게 사용)
        $sql_delete_images = "DELETE FROM memo_files WHERE idx IN ($placeholders) AND memo_idx = ? AND user_no = ?";
        $stmt_delete_images = executeQuery($conn, $sql_delete_images, $types, $params);
        if (!$stmt_delete_images || mysqli_stmt_affected_rows($stmt_delete_images) !== count($deleted_file_nos)) {
            // 이미 위에서 유효성 검증을 했으므로, 여기서는 쿼리 자체의 실패나 예상치 못한 DB 상태 변화를 체크
            throw new Exception("이미지 DB 삭제 쿼리 실행 실패.");
        }
        mysqli_stmt_close($stmt_delete_images);
    
        // 5. 서버 저장 이미지 파일 삭제
        foreach ($files_to_delete as $file_path) {
            $full_path = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/' . ltrim($file_path, '/'); // 경로 조합은 이전과 동일하게
            if (file_exists($full_path)) {
                unlink($full_path);
            } else {
                //error_log("File not found on disk for deletion: " . $full_path); // 파일을 찾지 못했을 때도 로그
            }
        }
    }

    // 6. 새 이미지 파일 업로드 처리
    $uploaded_file_infos = [];
    if (!empty($new_files) && !empty($new_files['name'][0])) {
        $absolute_upload_root = "/home/project/tody/upload/";
        // user_no 정보는 authChk.php 등에서 받아오거나, DB에서 조회해야 합니다.
        // 예: $user_no = ... 
        
        $user_no = $reg_no/* 인증 또는 DB 조회로 가져온 값 */;
        $relative_sub_path = "memo/" . $user_no . "/" . $memo_no . "/";
        $upload_dir = $absolute_upload_root . $relative_sub_path;

        if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);

        foreach ($new_files['name'] as $idx => $fileName) {
            $file = [
                'name' => $fileName,
                'tmp_name' => $new_files['tmp_name'][$idx],
                'size' => $new_files['size'][$idx],
                'type' => $new_files['type'][$idx],
                'error' => $new_files['error'][$idx]
            ];
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $savedFileName = uniqid('memo_img_') . '.' . $ext;
            $dest = $upload_dir . $savedFileName;
            $db_file_path = $relative_sub_path . $savedFileName;

            if (!move_uploaded_file($file['tmp_name'], $dest)) {
                throw new Exception("파일 업로드 실패: " . $file['name']);
            }

            $sql_insert_img = "INSERT INTO memo_files (memo_idx, user_no, file_name, file_path) VALUES (?, ?, ?, ?)";
            $stmt_insert_img = executeQuery($conn, $sql_insert_img, 'iiss', [$my_idx,$user_no, $file['name'], $db_file_path]);
            if (!$stmt_insert_img) throw new Exception("이미지 DB 삽입 실패.");

            $img_id = mysqli_insert_id($conn);
            mysqli_stmt_close($stmt_insert_img);

            $uploaded_file_infos[] = [
                'file_no' => $img_id,
                'file_name' => $file['name'],
                'file_path' => $db_file_path,
                'imgSrc' => "/uploads/" . $db_file_path
            ];
        }
    }

    // 7. 최종 메모 및 이미지 정보 조회
    
    $sql_final = "SELECT ml.*, 
                    GROUP_CONCAT(mf.idx) AS file_idxs, 
                    GROUP_CONCAT(mf.file_path) AS file_paths,
                    GROUP_CONCAT(mf.file_name) AS file_names
                FROM memo2_listings ml
                LEFT JOIN memo_files mf 
                    ON mf.user_no = ml.reg_no
                    AND mf.memo_idx = ml.my_idx
                WHERE ml.idx = ?
                GROUP BY ml.idx";

    $stmt_final = executeQuery($conn, $sql_final, 'i', [$memo_no]);
    $res_final = mysqli_stmt_get_result($stmt_final);
    $memo_data = mysqli_fetch_assoc($res_final);
    mysqli_stmt_close($stmt_final);
    
//var_dump($memo_data);
//exit;

    $files = [];
    if (!empty($memo_data['file_idxs'])) {
        $idxArr = explode(',', $memo_data['file_idxs']);
        $pathArr = explode(',', $memo_data['file_paths']);
        $nameArr = explode(',', $memo_data['file_names']);
        foreach ($idxArr as $k => $v) {
            $files[] = [
                'idx' => (int)$v,
                'file_path' => $pathArr[$k],
                'file_name' => $nameArr[$k],
                'imgSrc' => "/uploads/" . $pathArr[$k]
            ];
        }
    }
    $memo_data['files'] = $files;
    unset($memo_data['file_idxs'], $memo_data['file_paths'], $memo_data['file_names']);

    // 임시방편
    $memo_data['memo_no'] = $memo_no;
    // 8. 커밋 및 성공 응답
    mysqli_commit($conn);
    responseApi(200, "SUCCESS", $memo_data);

} catch (Exception $e) {
    mysqli_rollback($conn);
    responseApi(500, "메모 수정 중 오류가 발생했습니다: " . $e->getMessage(), null);
} finally {
    if (isset($conn)) mysqli_close($conn);
}
?>