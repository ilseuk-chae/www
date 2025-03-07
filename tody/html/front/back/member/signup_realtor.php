<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

$id = urldecode($_POST['id']);
$password = urldecode($_POST['password']);
$agency_name = urldecode($_POST['agency_name']);
$broker_name = urldecode($_POST['broker_name']);
$zipcode = urldecode($_POST['zipcode']);
$address_primary = urldecode($_POST['address_primary']);
$address_detail = urldecode($_POST['address_detail']);
$phone = urldecode($_POST['phone']);
$mobile = urldecode($_POST['mobile']);
$email = urldecode($_POST['email']);
$homepage_url = urldecode($_POST['homepage_url']);
$event_rcv_fg = urldecode($_POST['event_rcv_fg']);
$find_push_fg = urldecode($_POST['find_push_fg']);
$put_push_fg = urldecode($_POST['put_push_fg']);
$term_fg = urldecode($_POST['term_fg']);
$business_license = isset($_FILES['business_license']) ? $_FILES['business_license'] : null;
$brokerage_cert = isset($_FILES['brokerage_cert']) ? $_FILES['brokerage_cert'] : null;


#######################################################
# 0. 유효성 검사 - 시작
#######################################################
$options = array('type' => 'imagePdf');

// 유효성 검사할 배열
$validations = [
    ['value' => $id, 'type' => 'id', 'message' => '아이디를 확인해주세요.'],
    ['value' => $password, 'type' => 'password', 'message' => '비밀번호를 확인해주세요.'],
    ['value' => $agency_name, 'type' => 'string', 'message' => '상호명을 확인해주세요.'],
    ['value' => $broker_name, 'type' => 'string', 'message' => '대표 공인중개사명을 확인해주세요.'],
    ['value' => $zipcode, 'type' => 'string', 'message' => '우편번호를 확인해주세요.'],
    ['value' => $address_primary, 'type' => 'string', 'message' => '주소를 확인해주세요.'],
    ['value' => $phone, 'type' => 'phone', 'message' => '전화번호를 확인해주세요.'],
    ['value' => $mobile, 'type' => 'phone', 'message' => '휴대폰번호를 확인해주세요.'],
    ['value' => $email, 'type' => 'email', 'message' => '이메일 주소를 확인해주세요.'],
    ['value' => $business_license, 'type' => 'file', 'message' => '사업자등록증을 확인해주세요.', 'options' => $options],
    ['value' => $brokerage_cert, 'type' => 'file', 'message' => '중개업등록증을 확인해주세요.', 'options' => $options],
];

// 유효성 검증
foreach ($validations as $validation) {
    $errorMessage = validateInput($validation['value'], $validation['type'], $validation['message'], isset($validation['options']) ? $validation['options'] : array());
    if ($validation['message'] == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}

// 이용약관 유효성 검사
if ($term_fg !== 'Y') {
    responseApi(400, "이용약관에 동의해주세요.", null);
    exit;
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $sql0 = "SELECT email FROM user_master WHERE email = ? ";
    $params0 = [$email];
    $types0 = 's';
    $stmt0 = executeQuery($conn, $sql0, $types0, $params0);
    $result0 = mysqli_stmt_get_result($stmt0);
    $row = mysqli_fetch_assoc($result0);

    if (!empty($row) && !empty($row['email'])) {
        throw new Exception('존재하는 이메일 주소입니다.', 400);
    }

    #######################################################
    # 1. 유저 정보 등록 
    #######################################################
    // 비밀번호를 해시화합니다.
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    $sql =
        "INSERT INTO user_master (
            role, platform, id, password, email, 
            phone, mobile, zipcode, address_primary, address_detail, 
            agency_name, registered_broker_name, homepage_url, 
            event_rcv_fg, term_fg, status_code
        ) VALUES (
            '002', 'general', ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, '006'
        )
        ";

    // 조건 추가
    $params = [
        $id,
        $hashed_password,
        $email,
        $phone,
        $mobile,
        $zipcode,
        $address_primary,
        $address_detail,
        $agency_name,
        $broker_name,
        $homepage_url,
        $event_rcv_fg,
        $term_fg
    ];
    $types = 'sssssssssssss';
    executeQuery($conn, $sql, $types, $params);

    // 새로 생성된 primary key 가져오기
    $user_no = mysqli_insert_id($conn);
    if (!$user_no) {
        throw new Exception('FAILED_TO_RETRIEVE_INSERT_ID', 500);
    }


    #######################################################
    # 2. 알림 플래그 저장 
    #######################################################
    $sql2 =
        "INSERT INTO user_notification_preferences 
            (user_no, type_name, active_fg)
        VALUES 
            (?, 'event', ?),
            (?, 'find', ?),
            (?, 'put', ?);
        ";

    $params2 = [
        $user_no,
        $event_rcv_fg,
        $user_no,
        $find_push_fg,
        $user_no,
        $put_push_fg
    ];
    $types2 = 'isisis';
    executeQuery($conn, $sql2, $types2, $params2);


    // #######################################################
    // # 3. 유저넘버 hmac 업데이트 
    // #######################################################
    // HMAC(SHA-256) hash key 생성
    $secretKey = 'tody2024';
    $hashed_user_no = hash_hmac('sha256', $user_no, $secretKey);

    $sql3 =
        "UPDATE user_master 
        SET user_no_hmac = ?
        WHERE user_no = ? ;";

    $params3 = [$hashed_user_no, $user_no];
    executeQuery($conn, $sql3, 'ss', $params3);


    #######################################################
    # 4~5. 파일 이동 및 DB에 저장 
    #######################################################
    // 사업자 등록증
    if ($business_license) {
        handleFileUpload($business_license, $user_no, $id, 'business');
    }

    // 중개업 등록증
    if ($brokerage_cert) {
        handleFileUpload($brokerage_cert, $user_no, $id, 'brokerage');
    }


    // 모든 SQL 작업이 성공적으로 완료되면 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    mysqli_rollback($conn);  // 트랜잭션 롤백

    $statusCode = $e->getCode() ? $e->getCode() : 500; // 코드가 없을 경우 500으로 설정
    responseApi($statusCode, $e->getMessage(), null);

} finally {
    // 준비된 문장 닫기
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    if (isset($stmt2)) {
        mysqli_stmt_close($stmt2);
    }
    if (isset($stmt3)) {
        mysqli_stmt_close($stmt3);
    }
    if (isset($stmt4)) {
        mysqli_stmt_close($stmt4);
    }
    if (isset($stmt6)) {
        mysqli_stmt_close($stmt6);
    }

    // 데이터베이스 연결 닫기
    mysqli_close($conn);
}

function handleFileUpload($file, $user_no, $id, $imageType)
{
    global $conn;

    // 파일 경로 설정
    $filePath = "user/" . $user_no . "/" . $imageType . "/";
    $file_move_result = upload_file_one($file, $filePath, "N");

    if ($file_move_result['result'] == 'success') {
        $sql = "INSERT INTO user_images (user_no, id, image_type, file_path) 
                VALUES (?, ?, ?, ?);";
        executeQuery($conn, $sql, "isss", [$user_no, $id, $imageType, $file_move_result["file_path"]]);
    }
}
