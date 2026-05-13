<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include_once '../00-include/validation.php';

$head_type = addslashes((urldecode(($_POST['head_type']))));
$title = addslashes((urldecode(($_POST['title']))));
$content = urldecode($_POST['content']);
$upload_folder = addslashes(urldecode($_POST['uploadFolder']));
$public_fg = addslashes(urldecode($_POST['public_fg']));
$no = addslashes(urldecode($_POST['no']));
$file = isset($_FILES['file_input']) ? $_FILES['file_input'] : null;

// print_r($file);
// exit;
// echo $content;exit;

##################### 0. 유효성 검사 #####################
$errorMessage = "제목을 확인해주세요.";
$valid = validateInput($title, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
$errorMessage = "말머리를 확인해주세요.";
$valid = validateInput($head_type, 'string', $errorMessage, array());
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


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    ##################### 0. 유저 번호 #####################
    $userNo = get_admin_no_for_hash($conn, $saNo);

    ##################### 1. 공지사항 등록 #####################
    $new_content = str_replace('/temp/', '/uploads/reference/', $content);

    $sql =
        "UPDATE reference_listings 
        SET 
            head_type = ?,
            title = ?,
            content = ?,
            upload_folder = ?,
            public_fg = ?,
            lst_no = ?
        WHERE idx = ?; ";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    if (!mysqli_stmt_bind_param($stmt, "sssssii", $head_type, $title, $new_content, $upload_folder, $public_fg, $userNo, $no)) {
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


    if ($file) {
        $filePath = 'reference_file/' . $no . '/';
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
                mysqli_stmt_bind_param($stmt2, "si", $fileName, $no);

                // 2-4. SQL 문장을 실행합니다.
                mysqli_stmt_execute($stmt2);
            }
        }
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, "SUCCESS", null);

    ############################## 이미지 등록 및 수정 start #######################################################
    $type = "reference";
    $result = tempToUploadForModify($upload_folder, $content, $type);
    ############################## 이미지 등록 및 수정 End #######################################################

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
