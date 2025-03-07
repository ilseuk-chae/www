<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include_once '../00-include/validation.php';

$site_name = urldecode($_POST['site_name']);
$site_url = urldecode($_POST['site_url']);
$no = urldecode($_POST['no']);
$file = isset($_FILES['file']) ? $_FILES['file'] : null;
// print_r($file);
// exit;

##################### 0. 유효성 검사 #####################
// 유효성 검사
$errorMessage = "사이트명을 확인해주세요.";
$valid = validateInput($site_name, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
$errorMessage = "사이트주소를 확인해주세요.";
$valid = validateInput($site_url, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 이미지 유효성 검사
if ($file) {
    $errorMessage = "이미지의 확장자를 확인해주세요.";
    $options = array('type' => 'image');
    $valid = validateInput($file, 'file', $errorMessage, $options);
    if ($valid == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

##################### 1. 금융사 등록 #####################
try {
    $sql =
        "UPDATE related_website SET
            site_name = ?,
            site_url = ?
        WHERE idx = ?
        ; ";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    if (!mysqli_stmt_bind_param($stmt, "ssi", $site_name, $site_url, $no)) {
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

    ##################### 2. 파일 이동 및 DB에 저장 #####################
    // 사업자 등록증        
    if ($file) {
        // 2-0. 파일 이동
        $filePath = "website/" . $no . "/";
        $file_move_result = upload_file_one($file, $filePath);

        if ($file_move_result['result'] == 'success') {
            $sql2 =
                "UPDATE related_website SET 
                    site_image = ?
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
    responseApi(200, 'SUCCESS', null);

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
