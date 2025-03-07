<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include_once '../00-include/validation.php';

$title = addslashes((urldecode(($_POST['title']))));
$head_type = addslashes((urldecode(($_POST['head_type']))));
$content = urldecode($_POST['content']);
$upload_folder = addslashes(urldecode($_POST['uploadFolder']));
$file = isset($_FILES['file_input']) ? $_FILES['file_input'] : null;

##################### 0. 유효성 검사 #####################
$errorMessage = "제목을 확인해주세요.";
$valid = validateInput($title, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
$errorMessage = "내용을 확인해주세요.";
$valid = validateInput($content, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}

// 파일 전체 error 체크
$fileCheckResult = file_upload_error_check($_FILES);
if ($fileCheckResult !== true) {
    responseApi(400, $fileCheckResult, null);
    exit;
}

// 파일 유효성 검사
if ($file) {
    $errorMessage = "파일의 확장자를 확인해주세요.";
    $options = array('type' => 'all'); // 모든 파일 타입 허용
    $valid = validateInput($file, 'file', $errorMessage, $options);
    if ($valid == $errorMessage) {
        responseApi(400, $valid, null);
        exit;
    }
}

// print_r($file);
// exit;

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    ##################### 0. 유저 번호 #####################
    $userNo = get_admin_no_for_hash($conn, $saNo);

    ##################### 1. 공지사항 등록 #####################
    $new_content = str_replace('/temp/', '/uploads/reference/', $content);


    $sql =
        "INSERT INTO reference_listings (
            title,
            head_type,
            content,
            upload_folder,
            public_fg,
            active_fg,
            reg_no
        ) VALUES (
            ?,
            ?,
            ?,
            ?,
            'Y',
            'Y',
            ?
        ); ";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    if (!mysqli_stmt_bind_param($stmt, "ssssi", $title, $head_type, $new_content, $upload_folder, $userNo)) {
        throw new Exception('BINDING_FAILED', 500);
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

    if ($file) {
        $filePath = 'reference_file/' . $insertedId . '/';
        $file_move_result = upload_file_one($file, $filePath);

        if ($file_move_result['result'] == 'success') {
            $sql2 =
                "UPDATE reference_listings SET 
                    file_path = ?
                WHERE idx = ?; ";

            // 2-1. SQL 문장을 준비합니다.
            $stmt2 = mysqli_prepare($conn, $sql2);

            // 2-2. SQL 준비 성공 시,
            if ($stmt2) {
                $fileName = $file['name'];
                // 2-3. 변수 바인딩 (s: string, i: integer 등)
                mysqli_stmt_bind_param($stmt2, "si", $fileName, $insertedId);

                // 2-4. SQL 문장을 실행합니다.
                mysqli_stmt_execute($stmt2);
            }
        }
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, "SUCCESS", null);

    ############################## 이미지 등록 start #######################################################
    // temp -> upload 폴더 이동
    $type = "reference";
    $result = tempToUploadForCreate($upload_folder, $content, $type);
    ############################## 이미지 등록 End #######################################################

} catch (Exception $e) {
    mysqli_rollback($conn);  // 트랜잭션 롤백
    responseApi($e->getCode(), $e->getMessage(), null);
} finally {
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    if (isset($stmt2)) {
        mysqli_stmt_close($stmt2);
    }
    mysqli_close($conn);
}
