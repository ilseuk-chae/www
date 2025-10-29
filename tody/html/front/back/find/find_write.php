<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);
$globalAligoOn = false; // 알리고 전역 사용 여부(off=false, on=true)

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/sendAligo.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/mailSend.php');

$sido = isset($_POST['sido']) ? urldecode($_POST['sido']) : '';
$sgg = isset($_POST['sgg']) ? urldecode($_POST['sgg']) : '';
$estate_type = isset($_POST['estate_type']) ? urldecode($_POST['estate_type']) : '';
$sale_type = isset($_POST['sale_type']) ? urldecode($_POST['sale_type']) : '';
$exchange_fg = isset($_POST['exchange_fg']) ? urldecode($_POST['exchange_fg']) : 'N';
$min_price = isset($_POST['min_price']) ? urldecode($_POST['min_price']) : 0;
$max_price = isset($_POST['max_price']) ? urldecode($_POST['max_price']) : 0;
$min_area = isset($_POST['min_area']) ? urldecode($_POST['min_area']) : 0;
$max_area = isset($_POST['max_area']) ? urldecode($_POST['max_area']) : 0;
$phone = isset($_POST['phone']) ? urldecode($_POST['phone']) : '';
$description = isset($_POST['description']) ? urldecode($_POST['description']) : '';

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $sido, 'type' => 'int', 'message' => '시/도를 확인해주세요.'],
    ['value' => $sgg, 'type' => 'int', 'message' => '시/군/구를 확인해주세요.'],
    ['value' => $estate_type, 'type' => 'string', 'message' => '매물종류를 확인해주세요.'],
    ['value' => $sale_type, 'type' => 'string', 'message' => '거래종류를 확인해주세요.'],
    ['value' => $min_price, 'type' => 'int', 'message' => '가격대(최소)를 확인해주세요.'],
    ['value' => $max_price, 'type' => 'int', 'message' => '가격대(최대)를 확인해주세요.'],
    ['value' => $min_area, 'type' => 'int', 'message' => '면적을 확인해주세요.'],
    ['value' => $max_area, 'type' => 'int', 'message' => '면적을 확인해주세요.'],
    ['value' => $phone, 'type' => 'phone', 'message' => '연락처를 확인해주세요.'],
];

foreach ($validations as $validation) {
    $errorMessage = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['message'] == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $user_no = get_user_no_for_hash($conn, $userNo); // 사용자 번호 가져오기
 
    ##################### 1. 삽니다 등록 #####################
    $sql =
        "INSERT INTO wanted_listings (
            sido_cd, sgg_cd, estate_type, sale_type, 
            exchange_fg, min_price, max_price, min_area, 
            max_area, phone, description, reg_no
        ) VALUES (
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?
        );
        ";

    // 조건 추가
    $params = [$sido, $sgg, $estate_type, $sale_type, $exchange_fg, $min_price, $max_price, $min_area, $max_area, $phone, $description, $user_no];
    $types = 'sssssiiiissi';
    executeQuery($conn, $sql, $types, $params);
    $board_no = mysqli_insert_id($conn);

    ##################### 2. 알림 발송 #####################
    $sql2 = 
        "WITH FilteredNotificationList AS (
            SELECT user_no
            FROM user_notification_list
            WHERE noti_type = 'find'
            AND sido_cd = ?
            AND (sgg_cd = ? OR sgg_cd = '' OR sgg_cd IS NULL)
            AND (estate_type = ? OR estate_type = '' OR estate_type IS NULL)
        )
        SELECT a.mobile, a.email 
        FROM user_master AS a
        INNER JOIN user_notification_preferences AS b
            ON a.user_no = b.user_no
            AND b.type_name = 'find'
            AND b.active_fg = 'Y'
        INNER JOIN FilteredNotificationList AS c
            ON a.user_no = c.user_no;
        ";
        
    $params2 = [$sido, $sgg, $estate_type];
    $types2 = 'sss';
    $stmt2 = executeQuery($conn, $sql2, $types2, $params2);
    $result2 = mysqli_stmt_get_result($stmt2);

    // 결과 개수 확인 // 알림 발송 대상자 수 확인
    $num_rows = mysqli_num_rows($result2);

    //dump_go($num_rows);
    
    // 바로가기 주소
    $domain = $_SERVER['HTTP_HOST'];
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $detail = $protocol . $domain . '/front/views/find/find_view.html?viewNo=' . $board_no;

    //$paramList = [];
    $alimtalkParamList = []; // 알림톡 발송을 위한 리스트
    $emailRecipientList = []; // 이메일 발송을 위한 리스트 (필요하다면 배열로 모아서 나중에 일괄 발송)
    while ($row = mysqli_fetch_assoc($result2)) {
        // 1. 휴대폰 번호가 있다면 알림톡 발송 리스트에 추가
        if (!empty($row['mobile'])) {
            $array = [
                'phone' => $row['mobile'],
                'subject' => "[토디] 삽니다 등록 알림",
                'emtitle' => "",
                'message' => "[토디] '삽니다'  등록 알림\n설정하신 지역의 '삽니다' 게시글이 등록되었습니다.\n{$detail}",
                'button' => ''
            ];
        //$paramList[] = $array;
        $alimtalkParamList[] = $array;
        }
        //dump_go($row['mobile']);
        // 2. 이메일 주소가 있다면 이메일 발송 리스트에 추가 (또는 바로 발송)
        if (!empty($row['email'])) {
            $emailSubject = "[토디] 삽니다 등록 알림";
            $emailMessage = "[토디] '삽니다' 등록 알림<br>설정하신 지역의 '삽니다' 게시글이 등록되었습니다.<br>{$detail}"; // HTML 이메일의 경우 <br> 사용

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
        $response = sendAlimtalk('TX_6345', $alimtalkParamList);// 알림톡 발송
    } else {
        $response = null;
        error_log("No mobile numbers found for Alimtalk.  or Aligo is off.");
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

    //dump_go($response);

    // 발송 성공 시
    if ($response || $emailSent === 'SUCCESS') { //if ($response) { 
        #######################################################
        # 3. 알림 발송 수 업데이트 
        #######################################################
        $sql3 = 
            "UPDATE wanted_listings SET
                noti_count = ?
            WHERE idx = ?;
            ";
            
        $params3 = [$num_rows, $board_no];
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
    mysqli_close($conn);
}
?>