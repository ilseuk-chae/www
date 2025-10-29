<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");
// phpinfo();
// exit;
// error_reporting(E_ALL);
// ini_set("display_errors", 1);
$globalAligoOn = false; // 알리고 전역 사용 여부(off=false, on=true)

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include_once '../00-include/validation.php';
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/sendAligo.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/mailSend.php');

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
$old_status_code = urldecode($_POST['old_status_code']);
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
    $clean_old_status_code = trim($old_status_code, '"'); // 쌍따옴표 제거
    if($clean_old_status_code === '006' && $status_code == '001') {  //006:승인대기, 001:승인
        // 승인 알림톡 발송
        //sendRealtorApprovalKakaoTalk($conn, $user_no, $id, $lang);
        
        #######################################################
        # 2. 알림 발송 
        #######################################################
        // 바로가기 주소
        $domain = $_SERVER['HTTP_HOST'];
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        //$detail = $protocol . $domain . '/admin/views/user_manage/realtor.html?viewNo=' . $user_no;
        $alimtalkParamList = []; // 알림톡 발송을 위한 리스트
        $emailRecipientList = []; // 이메일 발송을 위한 리스트 (필요하다면 배열로 모아서 나중에 일괄 발송)
        // 1. 휴대폰 번호가 있다면 알림톡 발송 리스트에 추가
        
        if (!empty($mobile)) { // <-- if (!empty($row['mobile'])) {
            $array = [
                'phone' => $mobile,  // <-- $row['mobile'] 대신 $mobile 사용
                'subject' => "[토디] 회원 가입 승인 알림",
                'emtitle' => "",
                'message' => "[토디] '회원 가입'  승인 알림\n안녕하세요. {$agency_name}님!\n 회원가입이 승인되었습니다.\n Tody에 회원가입 해주셔서 진심으로 감사드립니다~~\n",
                'button' => ''
            ];
            //$paramList[] = $array;
            $alimtalkParamList[] = $array;
        }
        // 2. 이메일 주소가 있다면 이메일 발송 리스트에 추가 (또는 바로 발송)
        if (!empty($email)) { // <-- $row['email'] 대신 $email 사용
            $emailSubject = "[토디] 회원 가입 승인 알림";
            $emailMessage = "[토디] '회원 가입'  승인 알림<br>안녕하세요. '{$agency_name}'님!<br> 회원가입이 승인되었습니다.<br> Tody에 회원가입 해주셔서 진심으로 감사드립니다~~<br>";

            // 또는 이메일 주소를 리스트에 모아두었다가 나중에 일괄 처리
            $emailRecipientList[] = [
                'email' => $email, // <-- $row['email'] 대신 $email 사용
                'subject' => $emailSubject,
                'message' => $emailMessage,
                'isHtml' => true // HTML 메일 여부
            ];
        }
        // 3. 모아진 알림톡 리스트로 알림톡 발송
        if (!empty($alimtalkParamList)  && $globalAligoOn) { // 현재 알리고 상태 off
            //$response = sendAlimtalk('TX_6344', $paramList);
            $response = sendAlimtalk('TX_6344', $alimtalkParamList); //TX_6344는 추후 변경해야함
        } else {
            $response = null;
            //error_log("No mobile numbers found for Alimtalk.  or Aligo is off.");
        }
        // 4. 모아진 이메일 리스트로 이메일 발송 (이전에 언급했던 sendEmail 함수를 가정)
        
        if (!empty($emailRecipientList)) {
            foreach ($emailRecipientList as $recipient) {
                // 실제 이메일 발송 함수 호출
                $emailSent = sendMail($recipient['email'], $recipient['subject'], $recipient['message']);
                if (!$emailSent) {
                    error_log("Failed to send email to: " . $recipient['email']);
                }
            }
            error_log("Emails sent to " . count($emailRecipientList) . " recipients.");
        } else {
            error_log("No email addresses found for email sending.");
        }
    }
    
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