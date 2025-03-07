<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include_once '../00-include/validation.php';

$no = addslashes((urldecode(($_POST['no']))));
$admin_id = addslashes((urldecode(($_POST['admin_id']))));
$admin_password = addslashes((urldecode(($_POST['admin_password']))));
$admin_name = addslashes((urldecode(($_POST['admin_name']))));
$admin_email = addslashes((urldecode(($_POST['admin_email']))));
$admin_phone = addslashes((urldecode(($_POST['admin_phone']))));
$file = isset($_FILES['file']) ? $_FILES['file'] : null;
// $upload_folder = addslashes(urldecode($_POST['uploadFolder']));
// echo $admin_password;exit;

##################### 0. 유효성 검사 #####################
$errorMessage = "문제가 발생했습니다.";
$valid = validateInput($no, 'int', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    ##################### 0. 유저 번호 #####################
    $userNo = get_admin_no_for_hash($conn, $saNo);

    ##################### 1. 수정 #####################

    $sql =
        "UPDATE user_admin 
        SET
            name = ?,
            email = ?,
            phone = ?,
            lst_no = ?
        ";

    // 조건 추가
    $params = [$admin_name, $admin_email, $admin_phone, $userNo];
    $types = 'sssi';

    if ($admin_password) {
        $sql .= ", password = EBGA_CREATE_PW_SHA(?)";
        $params[] = $admin_password;
        $types .= 's';
    }

    $sql .= "WHERE user_no = ?; ";
    $params[] = $no;
    $types .= 'i';

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
                mysqli_stmt_bind_param($stmt2, "si", $file_move_result['file_path'], $no);

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
