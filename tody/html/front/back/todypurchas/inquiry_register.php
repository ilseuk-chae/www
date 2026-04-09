<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

error_reporting(E_ALL); ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/mailSend.php');

// -----------------------------------------------------------------------------
// 설정
// -----------------------------------------------------------------------------
define('PURCHAS_UPLOAD_ROOT', '/home/project/tody/upload/purchas');
define('PURCHAS_TO_EMAIL',    'info@2sproperty.com'); // index.html contact-channels 기준
define('PURCHAS_MAX_SIZE',    10 * 1024 * 1024); // 파일당 10MB
$ALLOWED_EXT = ['jpg','jpeg','png','gif','webp','pdf','doc','docx','xls','xlsx','hwp','zip'];

// -----------------------------------------------------------------------------
// 입력 수신
// -----------------------------------------------------------------------------
$type     = isset($_POST['type'])     ? trim($_POST['type'])     : '';
$name     = isset($_POST['name'])     ? trim($_POST['name'])     : '';
$company  = isset($_POST['company'])  ? trim($_POST['company'])  : '';
$phone    = isset($_POST['phone'])    ? trim($_POST['phone'])    : '';
$location = isset($_POST['location']) ? trim($_POST['location']) : '';
$budget   = isset($_POST['budget'])   ? trim($_POST['budget'])   : '';
$message  = isset($_POST['message'])  ? trim($_POST['message'])  : '';
$agree    = isset($_POST['agree'])    ? 'Y' : 'N';

// -----------------------------------------------------------------------------
// 유효성 검사
// -----------------------------------------------------------------------------
if (!in_array($type, ['purchas','credit','other'], true)) {
    responseApi(400, '신청 구분을 확인해주세요.', null);
}
if ($name === '')    responseApi(400, '담당자명을 확인해주세요.', null);
if ($phone === '')   responseApi(400, '연락처를 확인해주세요.', null);
if ($message === '') responseApi(400, '문의 내용을 확인해주세요.', null);
if ($agree !== 'Y')  responseApi(400, '개인정보 수집 및 이용에 동의해주세요.', null);

// -----------------------------------------------------------------------------
// 첨부파일 정규화 ($_FILES['attachment'] 배열 처리)
// -----------------------------------------------------------------------------
$files = [];
if (!empty($_FILES['attachment']) && is_array($_FILES['attachment']['name'])) {
    $cnt = count($_FILES['attachment']['name']);
    for ($i = 0; $i < $cnt; $i++) {
        if ($_FILES['attachment']['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
        if ($_FILES['attachment']['error'][$i] !== UPLOAD_ERR_OK) {
            responseApi(400, '파일 업로드 오류가 발생했습니다.', null);
        }
        $orig = $_FILES['attachment']['name'][$i];
        $ext  = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
        if (!in_array($ext, $ALLOWED_EXT, true)) {
            responseApi(400, '허용되지 않은 파일 형식입니다: ' . $orig, null);
        }
        if ($_FILES['attachment']['size'][$i] > PURCHAS_MAX_SIZE) {
            responseApi(400, '파일 용량 초과(10MB): ' . $orig, null);
        }
        $files[] = [
            'tmp'  => $_FILES['attachment']['tmp_name'][$i],
            'orig' => $orig,
            'ext'  => $ext,
            'size' => $_FILES['attachment']['size'][$i],
            'mime' => $_FILES['attachment']['type'][$i],
        ];
    }
}

// -----------------------------------------------------------------------------
// 업로드 디렉토리 준비
// -----------------------------------------------------------------------------
$ym      = date('Y/m');
$saveDir = PURCHAS_UPLOAD_ROOT . '/' . $ym;
if (!is_dir($saveDir)) {
    if (!@mkdir($saveDir, 0755, true) && !is_dir($saveDir)) {
        responseApi(500, '업로드 경로 생성 실패', null);
    }
}

$ip        = $_SERVER['REMOTE_ADDR']     ?? '';
$userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);
$savedFiles = []; // rollback용

mysqli_autocommit($conn, FALSE);
mysqli_begin_transaction($conn);

try {
    // 1) 문의 insert
    $sql = "INSERT INTO purchas_listings
              (type, name, company, phone, location, budget, message,
               agree_fg, status, ip_address, user_agent)
            VALUES (?,?,?,?,?,?,?, ?, 'received', ?, ?)";
    $params = [$type, $name, $company, $phone, $location, $budget, $message, $agree, $ip, $userAgent];
    $types  = 'ssssssssss';
    executeQuery($conn, $sql, $types, $params);
    $inquiryId = mysqli_insert_id($conn);

    // 2) 파일 저장 + DB insert
    $mailAttachments = [];
    foreach ($files as $f) {
        $storedName = uniqid('p_', true) . '.' . $f['ext'];
        $storedPath = $saveDir . '/' . $storedName;
        if (!move_uploaded_file($f['tmp'], $storedPath)) {
            throw new Exception('파일 저장 실패', 500);
        }
        $savedFiles[] = $storedPath;

        $sqlF = "INSERT INTO purchas_listings_files
                  (listing_idx, original_name, stored_name, stored_path, mime_type, file_size)
                  VALUES (?,?,?,?,?,?)";
        executeQuery($conn, $sqlF, 'issssi',
            [$inquiryId, $f['orig'], $storedName, $storedPath, $f['mime'], $f['size']]);

        $mailAttachments[] = ['path' => $storedPath, 'name' => $f['orig']];
    }

    // 3) 메일 발송
    $typeLabelMap   = ['purchas'=>'구매대행','credit'=>'구매대행(신용)','other'=>'기타'];
    $budgetLabelMap = ['under1'=>'1억 미만','1to5'=>'1억~5억','5to10'=>'5억~10억','over10'=>'10억 이상'];
    $typeLabel   = $typeLabelMap[$type] ?? $type;
    $budgetLabel = $budgetLabelMap[$budget] ?? ($budget ?: '-');

    $subject = "[구매대행 문의] {$name} / {$typeLabel}";
    $body  = "<h3>구매대행 신청서 접수</h3>";
    $body .= "<table border='1' cellpadding='8' cellspacing='0' style='border-collapse:collapse;font-size:14px'>";
    $body .= "<tr><th>접수번호</th><td>{$inquiryId}</td></tr>";
    $body .= "<tr><th>신청구분</th><td>".htmlspecialchars($typeLabel)."</td></tr>";
    $body .= "<tr><th>담당자명</th><td>".htmlspecialchars($name)."</td></tr>";
    $body .= "<tr><th>회사/상호명</th><td>".htmlspecialchars($company)."</td></tr>";
    $body .= "<tr><th>연락처</th><td>".htmlspecialchars($phone)."</td></tr>";
    $body .= "<tr><th>공사 위치</th><td>".htmlspecialchars($location)."</td></tr>";
    $body .= "<tr><th>예상 금액</th><td>".htmlspecialchars($budgetLabel)."</td></tr>";
    $body .= "<tr><th>문의 내용</th><td>".nl2br(htmlspecialchars($message))."</td></tr>";
    $body .= "<tr><th>접수일시</th><td>".date('Y-m-d H:i:s')."</td></tr>";
    $body .= "</table>";

    $mailResult = sendMailWithAttachments(PURCHAS_TO_EMAIL, $subject, $body, $mailAttachments);

    if ($mailResult === 'SUCCESS') {
        executeQuery($conn, "UPDATE purchas_listings SET email_sent_at = NOW() WHERE idx = ?", 'i', [$inquiryId]);
    }
    // 메일 실패해도 접수는 유지

    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', ['idx' => $inquiryId, 'mail' => $mailResult]);

} catch (Exception $e) {
    mysqli_rollback($conn);
    foreach ($savedFiles as $p) { @unlink($p); }
    responseApi($e->getCode() ?: 500, $e->getMessage(), null);
} finally {
    mysqli_close($conn);
}
