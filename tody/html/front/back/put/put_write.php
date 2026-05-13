<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);
$globalAligoOn = false; // 알리고 전역 사용 여부(off=false, on=true)
// print_r($_FILES["files"]);
// exit;
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/sendAligo.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/mailSend.php');

$sido = isset($_POST['sido']) ? urldecode($_POST['sido']) : '';
$sgg = isset($_POST['sgg']) ? urldecode($_POST['sgg']) : '';
$umd = isset($_POST['umd']) ? urldecode($_POST['umd']) : '';
$address_primary = isset($_POST['address_primary']) ? urldecode($_POST['address_primary']) : '';
$address_road = isset($_POST['address_road']) ? urldecode($_POST['address_road']) : '';
$address_jibun = isset($_POST['address_jibun']) ? urldecode($_POST['address_jibun']) : '';
$address_detail = isset($_POST['address_detail']) ? urldecode($_POST['address_detail']) : '';
$latitude = isset($_POST['latitude']) ? urldecode($_POST['latitude']) : '';
$longitude = isset($_POST['longitude']) ? urldecode($_POST['longitude']) : '';
$estate_type = isset($_POST['estate_type']) ? urldecode($_POST['estate_type']) : '';
$sale_type = isset($_POST['sale_type']) ? urldecode($_POST['sale_type']) : '';
$exchange_fg = isset($_POST['exchange_fg']) ? urldecode($_POST['exchange_fg']) : '';
$sale_price = isset($_POST['sale_price']) ? intval(urldecode($_POST['sale_price'])) : '';
$rent_price = isset($_POST['rent_price']) ? intval(urldecode($_POST['rent_price'])) : '';
$area = isset($_POST['area']) ? intval(urldecode($_POST['area'])) : '';
$phone = isset($_POST['phone']) ? urldecode($_POST['phone']) : '';
$description = isset($_POST['description']) ? urldecode($_POST['description']) : '';
$files = isset($_FILES["files"]) ? $_FILES["files"] : array();

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $sido, 'type' => 'int', 'message' => '주소를 확인해주세요.'],
    ['value' => $sgg, 'type' => 'int', 'message' => '주소를 확인해주세요.'],
    ['value' => $estate_type, 'type' => 'string', 'message' => '매물종류를 확인해주세요.'],
    ['value' => $sale_type, 'type' => 'string', 'message' => '거래종류를 확인해주세요.'],
    ['value' => $sale_price, 'type' => 'int', 'message' => '가격대를 확인해주세요.'],
    ['value' => $area, 'type' => 'int', 'message' => '면적을 확인해주세요.'],
    ['value' => $phone, 'type' => 'phone', 'message' => '연락처를 확인해주세요.'],
];

foreach ($validations as $validation) {
    $validationResult = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['value'] != $validationResult) {
        responseApi(400, $validationResult, null);
        exit;
    }
}

// 파일 유효성 검사
if ($files) {
    $errorMessage = '이미지 파일을 확인해주세요.';
    $options = array('type' => 'image');

    foreach ($files['name'] as $index => $name) {
        $file = array(
            'name' => $files['name'][$index],
            'full_path' => $files['full_path'][$index],
            'type' => $files['type'][$index],
            'tmp_name' => $files['tmp_name'][$index],
            'error' => $files['error'][$index],
            'size' => $files['size'][$index]
        );

        // 파일 유효성 검사
        $validationResult = validateInput($file, 'file', $errorMessage, $options);
        // print_r($error);exit;
        if ($file != $validationResult) {
            $errorMessage = "파일 {$file['name']}에 오류가 있습니다. {$validationResult}\n";
            responseApi(400, $errorMessage, null);
            exit;
        }
    }
} else {
    $errorMessage = '이미지 파일을 확인해주세요.';
    responseApi(400, $errorMessage, null);
    exit;
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $user_no = get_user_no_for_hash($conn, $userNo);

    #######################################################
    # 1.삭제 처리 
    #######################################################
    $sql =
        "INSERT INTO put_listings (
            sido_cd, sgg_cd, umd_cd, 
            address_jibun, address_road, address_detail,
            latitude, longitude, 
            estate_type, sale_type, exchange_fg, 
            sale_price, rent_price, area,
            phone, description, reg_no
        ) VALUES (
            ?, ?, ?,
            ?, ?, ?, 
            ?, ?,
            ?, ?, ?, 
            ?, ?, ?,
            ?, ?, ?
        );
        ";

    // 조건 추가
    $params = [$sido, $sgg, $umd, $address_jibun, $address_road, $address_detail, $latitude, $longitude, $estate_type, $sale_type, $exchange_fg, $sale_price, $rent_price, $area, $phone, $description, $user_no];
    $types = 'sss' . 'sss' . 'dd' . 'sss' . 'iii' . 'ssi';
    executeQuery($conn, $sql, $types, $params);

    $put_no = mysqli_insert_id($conn);


    #######################################################
    # 파일 이동 및 DB에 저장 
    #######################################################
    if ($files) {
        handleMultipleFileUploads($files, $user_no, $put_no);
    }

    
    #######################################################
    # 2. 알림 발송 
    #######################################################
    $sql2 = 
        "WITH FilteredNotificationList AS (
            SELECT user_no
            FROM user_notification_list
            WHERE noti_type = 'put'
            AND sido_cd = ?
            AND (sgg_cd = ? OR sgg_cd = '' OR sgg_cd IS NULL)
            AND (estate_type = ? OR estate_type = '' OR estate_type IS NULL)
        )
        SELECT a.mobile, a.email 
        FROM user_master AS a
        INNER JOIN user_notification_preferences AS b
            ON a.user_no = b.user_no
            AND b.type_name = 'put'
            AND b.active_fg = 'Y'
        INNER JOIN FilteredNotificationList AS c
            ON a.user_no = c.user_no;
        ";
        
    $params2 = [$sido, $sgg, $estate_type];
    $types2 = 'sss';
    $stmt2 = executeQuery($conn, $sql2, $types2, $params2);
    $result2 = mysqli_stmt_get_result($stmt2);

    // 결과 개수 확인
    $num_rows = mysqli_num_rows($result2);

    // 바로가기 주소
    $domain = $_SERVER['HTTP_HOST'];
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $detail = $protocol . $domain . '/front/views/put/put_view.html?viewNo=' . $put_no;
    
    //$paramList = [];
    $alimtalkParamList = []; // 알림톡 발송을 위한 리스트
    $emailRecipientList = []; // 이메일 발송을 위한 리스트 (필요하다면 배열로 모아서 나중에 일괄 발송)
    while ($row = mysqli_fetch_assoc($result2)) {
        // 1. 휴대폰 번호가 있다면 알림톡 발송 리스트에 추가
        if (!empty($row['mobile'])) {
            $array = [
                'phone' => $row['mobile'],
                'subject' => "[토디] 팝니다 등록 알림",
                'emtitle' => "",
                'message' => "[토디] '팝니다'  등록 알림\n설정하신 지역의 '팝니다' 게시글이 등록되었습니다.\n{$detail}",
                'button' => ''
            ];
            //$paramList[] = $array;
            $alimtalkParamList[] = $array;
        }

        // 2. 이메일 주소가 있다면 이메일 발송 리스트에 추가 (또는 바로 발송)
        if (!empty($row['email'])) {
            $emailSubject = "[토디] 팝니다 등록 알림";
            $emailMessage = "[토디] '팝니다' 등록 알림<br>설정하신 지역의 '팝니다' 게시글이 등록되었습니다.<br>{$detail}"; // HTML 이메일의 경우 <br> 사용

            // 또는 이메일 주소를 리스트에 모아두었다가 나중에 일괄 처리
            $emailRecipientList[] = [
                'email' => $row['email'],
                'subject' => $emailSubject,
                'message' => $emailMessage,
                'isHtml' => true // HTML 메일 여부
            ];
        }
    }
    // 3. 모아진 알림톡 리스트로 알림톡 발송
    if (!empty($alimtalkParamList)  && $globalAligoOn) { // 현재 알리고 상태 off
        //$response = sendAlimtalk('TX_6344', $paramList);
        $response = sendAlimtalk('TX_6344', $alimtalkParamList);
    } else {
        $response = null;
        error_log("No mobile numbers found for Alimtalk.  or Aligo is off.");
    }
    // 4. 모아진 이메일 리스트로 이메일 발송 (이전에 언급했던 sendEmail 함수를 가정)
    
    //error_log("num_rows count: " . $num_rows);
    //error_log("emailRecipientList count: " . count($emailRecipientList));
    $emailSent = 'SUCCESS';
    $successCnt = 0;
    
    if (!empty($emailRecipientList)) {
        foreach ($emailRecipientList as $recipient) {
            // 실제 이메일 발송 함수 호출
            $emailSent = sendMail($recipient['email'], $recipient['subject'], $recipient['message']);
            if (!$emailSent) {
                error_log("Failed to send email to: " . $recipient['email']);
            }
            else {
                $successCnt++;
            }
        }
        error_log("Emails sent to " . count($emailRecipientList) . " recipients.");
    } else {
        error_log("No email addresses found for email sending.");
    }
            
    // 발송 성공 시
    if ($response || $emailSent === 'SUCCESS') { //if ($response) { 
        #######################################################
        # 3. 알림 발송 수 업데이트 
        #######################################################
        $sql3 = 
            "UPDATE put_listings SET
                noti_count = ?
            WHERE idx = ?;
            ";
            
        $params3 = [$num_rows, $put_no];
        $types3 = 'ii';
        $stmt3 = executeQuery($conn, $sql3, $types3, $params3);
        $result3 = mysqli_stmt_get_result($stmt3);
    } else {
        $num_rows = 0;
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $num_rows);

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

/**
 * 파일 업로드 함수
 * @param mixed $files : 파일 모음
 * @param mixed $user_no : 유저 번호
 * @param mixed $put_no : 게시글 번호
 * @throws \Exception
 * @return void
 */
function handleMultipleFileUploads($files, $user_no, $put_no)
{
    global $conn;

    // 파일 경로 설정
    $filePath = "put/" . $user_no . "/" . $put_no . "/";
    $values = [];
    $types = '';

    foreach ($files['name'] as $index => $name) {
        $file = [
            'name' => $files['name'][$index],
            'full_path' => $files['full_path'][$index],
            'type' => $files['type'][$index],
            'tmp_name' => $files['tmp_name'][$index],
            'error' => $files['error'][$index],
            'size' => $files['size'][$index]
        ];

        // 파일 업로드 및 경로가 이미 존재하는지 확인
        $file_move_result = upload_file_one($file, $filePath, "Y");

        // 파일 업로드가 성공한 경우에만 처리
        if ($file_move_result['result'] == 'success') {
            $values[] = $put_no;
            $values[] = $user_no;
            $values[] = $file_move_result["file_path"];
            $values[] = $file["name"];
            $types .= 'iiss';
        }
    }

    // 업로드에 성공한 파일이 있는 경우에만 INSERT
    if (!empty($values)) {
        $placeholders = implode(', ', array_fill(0, count($values) / 4, "(?, ?, ?, ?, 'put')"));
        $sql =
            "INSERT INTO estate_files (
                estate_idx, user_no, file_path, file_name, group_type
            ) VALUES $placeholders";

        $stmt = mysqli_prepare($conn, $sql);

        if ($stmt) {
            mysqli_stmt_bind_param($stmt, $types, ...$values);
            if (!mysqli_stmt_execute($stmt)) {
                throw new Exception('INSERT_QUERY_FAILED', 500);
            }
            mysqli_stmt_close($stmt);
        }
    }
}
