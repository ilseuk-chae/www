<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include_once '../00-include/validation.php';

$admin_id = isset($_POST['admin_id']) ? urldecode($_POST['admin_id']) : '';
$admin_password = isset($_POST['admin_password']) ? urldecode($_POST['admin_password']) : '';
$admin_name = isset($_POST['admin_name']) ? urldecode($_POST['admin_name']) : '';
$admin_email = isset($_POST['admin_email']) ? urldecode($_POST['admin_email']) : '';
$admin_phone = isset($_POST['admin_phone']) ? urldecode($_POST['admin_phone']) : '';
$file = isset($_FILES['file']) ? $_FILES['file'] : null;
// $upload_folder = addslashes(urldecode($_POST['uploadFolder']));
// echo $content;exit;

##################### 0. 유효성 검사 #####################
$errorMessage = "아이디를 확인해주세요.";
$valid = validateInput($admin_id, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
$errorMessage = "비밀번호를 확인해주세요.";
$valid = validateInput($admin_password, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    ##################### 0. 아이디 중복확인 #####################
    
    // 아이디 중복 확인을 위한 SQL 문
    $checkSql = "SELECT COUNT(*) FROM user_admin WHERE id = ?";
    $checkStmt = mysqli_prepare($conn, $checkSql);

    if (!$checkStmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 중복 아이디 체크를 위한 파라미터 바인딩
    mysqli_stmt_bind_param($checkStmt, 's', $admin_id);
    mysqli_stmt_execute($checkStmt);
    mysqli_stmt_bind_result($checkStmt, $count);
    mysqli_stmt_fetch($checkStmt);
    mysqli_stmt_close($checkStmt);

    // 중복 아이디가 있는 경우
    if ($count > 0) {
        throw new Exception('이미 존재하는 아이디입니다.', 409);
    }

    ##################### 1. 수정 #####################

    $sql =
        "INSERT INTO user_admin (
            id,
            password,
            name,
            email,
            phone
        ) VALUES (
            ?,
            EBGA_CREATE_PW_SHA(?),
            ?,
            ?,
            ?
        );
        ";

    // 조건 추가
    $params = [$admin_id, $admin_password, $admin_name, $admin_email, $admin_phone];
    $types = 'sssss';

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    if (!empty($params)) {
        mysqli_stmt_bind_param($stmt, $types, ...$params);
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
    // 유저 이미지      
    if ($file) {
        // 2-0. 파일 이동
        $filePath = "admin/" . $admin_id . "/";
        $file_move_result = upload_file_one($file, $filePath);

        if ($file_move_result['result'] == 'success') {
            $sql2 =
                "UPDATE user_admin SET 
                    user_image = ?
                WHERE user_no = ?; ";

            // 2-1. SQL 문장을 준비합니다.
            $stmt2 = mysqli_prepare($conn, $sql2);

            // 2-2. SQL 준비 성공 시,
            if ($stmt2) {
                $fileName = $filePath . $file['name'];
                // 2-3. 변수 바인딩 (s: string, i: integer 등)
                mysqli_stmt_bind_param($stmt2, "si", $file_move_result['file_path'], $insertedId);

                // 2-4. SQL 문장을 실행합니다.
                mysqli_stmt_execute($stmt2);
            }

        }
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, "SUCCESS", null);

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
