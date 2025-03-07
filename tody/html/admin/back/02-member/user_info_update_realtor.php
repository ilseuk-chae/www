<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");
// phpinfo();
// exit;
// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include_once '../00-include/validation.php';

$lang = $_POST['langCode'];
$rcvUserNo = $_POST['rcvUser'];
$id = urldecode($_POST['id']);
$agency_name = urldecode($_POST['agency_name']);
$registered_broker_name = urldecode($_POST['registered_broker_name']);
$zipcode = urldecode($_POST['zipcode']);
$address_primary = urldecode($_POST['address_primary']);
$address_detail = urldecode($_POST['address_detail']);
$phone = urldecode($_POST['phone']);
$mobile = urldecode($_POST['mobile']);
$email = urldecode($_POST['email']);
$homepage_url = urldecode($_POST['homepage_url']);
$business_license_code = urldecode($_POST['business_license_code']);
$business_regist_code = urldecode($_POST['business_regist_code']);
$status_code = urldecode($_POST['status_code']);
$business_license = isset($_FILES['business_license']) ? $_FILES['business_license'] : null;
$brokerage_cert = isset($_FILES['brokerage_cert']) ? $_FILES['brokerage_cert'] : null;
// print_r($business_license);
// exit;
// file upload error log 출력
// fileUploadErrorLog($business_license);

##################### 0. 유효성 검사 #####################
// ID 유효성 검사
$errorMessage = "문제가 발생하였습니다.";
$valid = validateInput($rcvUserNo, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// ID 유효성 검사
$errorMessage = "ID를 확인해주세요.";
$valid = validateInput($id, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 상호명 유효성 검사
$errorMessage = "상호명을 입력하세요.";
$valid = validateInput($agency_name, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 대표 공인중개사명 유효성 검사
$errorMessage = "대표 공인중개사명을 입력하세요.";
$valid = validateInput($registered_broker_name, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 우편번호 유효성 검사
$errorMessage = "우편번호를 확인해주세요.";
$valid = validateInput($zipcode, 'postal_code', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 주소 유효성 검사
$errorMessage = "주소를 확인하세요.";
$valid = validateInput($address_primary, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 전화번호 유효성 검사
$errorMessage = "전화번호를 확인해주세요.";
$valid = validateInput($phone, 'phone', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 전화번호 유효성 검사
$errorMessage = "전화번호를 확인해주세요.";
$valid = validateInput($mobile, 'phone', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
// 이메일 유효성 검사
$errorMessage = "이메일 주소를 확인해주세요.";
$valid = validateInput($email, 'email', $errorMessage, array());
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

// 사업자등록증 유효성 검사
if ($business_license) {
    $errorMessage = "이미지의 확장자를 확인해주세요.";
    $options = array('type' => 'image');
    $valid = validateInput($business_license, 'file', $errorMessage, $options);
    if ($valid == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}
// 중개업등록증 유효성 검사
if ($brokerage_cert) {
    $errorMessage = "이미지의 확장자를 확인해주세요.";
    $options = array('type' => 'image');
    $valid = validateInput($brokerage_cert, 'file', $errorMessage, $options);
    if ($valid == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    ##################### 1. 유저 정보 업데이트 #####################
    $sql =
        "UPDATE user_master 
        SET 
            agency_name = ?, 
            registered_broker_name = ?, 
            zipcode = ?,
            address_primary = ?,
            address_detail = ?,
            phone = ?,
            mobile = ?,
            email = ?,
            homepage_url = ?,
            business_license_code = ?,
            business_regist_code = ?,
            status_code = ?
        WHERE SHA2(user_no, 256) = ?
        AND id = ?;
        ";

    // 1-1. SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // 1-2. SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 1-3. 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param(
        $stmt,
        "ssssssssssssss",
        $agency_name,
        $registered_broker_name,
        $zipcode,
        $address_primary,
        $address_detail,
        $phone,
        $mobile,
        $email,
        $homepage_url,
        $business_license_code,
        $business_regist_code,
        $status_code,
        $rcvUserNo,
        $id
    );

    // 1-4. SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('UPDATE_FAILED', 500);
    }

    ##################### 2. user_no 가져오기 #####################
    $user_no = get_user_no_for_hash($conn, $rcvUserNo);

    ##################### 3. 파일 이동 및 DB에 저장 #####################
    // 사업자 등록증
    if ($business_license) {
        // 3-0. 파일 이동
        $filePath = "user/" . $id . "/business/";
        $file_move_result = upload_file_one($business_license, $filePath);

        if ($file_move_result['result'] == 'success') {
            // print_r($file_move_result);

            $sql2 =
                "INSERT INTO user_images (user_no, id, image_type, file_path) 
                VALUES (?, ?, 'business', ?);
            ";

            // 3-1. SQL 문장을 준비합니다.
            $stmt2 = mysqli_prepare($conn, $sql2);

            // 3-2. SQL 준비 실패 시,
            if ($stmt2) {
                // 3-3. 변수 바인딩 (s: string, i: integer 등)
                mysqli_stmt_bind_param($stmt2, "iss", $user_no, $id, $file_move_result["file_path"]);

                // 3-4. SQL 문장을 실행합니다.
                if (!mysqli_stmt_execute($stmt2)) {
                    throw new Exception('INSERT_QUERY_FAILED', 500);
                }
            }

        }
    }

    // 중개업 등록증
    if ($brokerage_cert) {
        // 3-0. 파일 이동
        $filePath = "user/" . $id . "/brokerage/";
        $file_move_result = upload_file_one($brokerage_cert, $filePath);

        if ($file_move_result['result'] == 'success') {
            // print_r($file_move_result);

            $sql2 =
                "INSERT INTO user_images (user_no, id, image_type, file_path) 
                VALUES (?, ?, 'brokerage', ?);
            ";

            // 3-1. SQL 문장을 준비합니다.
            $stmt2 = mysqli_prepare($conn, $sql2);

            // 3-2. SQL 준비 실패 시,
            if ($stmt2) {
                // 3-3. 변수 바인딩 (s: string, i: integer 등)
                mysqli_stmt_bind_param($stmt2, "iss", $user_no, $id, $file_move_result["file_path"]);

                // 3-4. SQL 문장을 실행합니다.
                if (!mysqli_stmt_execute($stmt2)) {
                    throw new Exception('INSERT_QUERY_FAILED', 500);
                }
            }

        }
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    // 연결 종료
    if (isset($stmt))
        mysqli_stmt_close($stmt);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    if (isset($stmt3))
        mysqli_stmt_close($stmt3);
    mysqli_close($conn);
}
?>