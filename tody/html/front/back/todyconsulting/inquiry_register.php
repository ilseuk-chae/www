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
define('CONSULTING_TO_EMAIL', 'info@2sproperty.com');

$PURPOSE_LABELS = [
    'feasibility' => '사업타당성 분석',
    'devpermit'   => '개발행위허가 검토',
    'district'    => '지구단위계획사업 검토',
    'tourism'     => '관광농원 및 관광휴양단지 사업 검토',
    'housing'     => '주택건설사업 검토',
    'industrial'  => '산업단지개발사업 검토',
    'urban'       => '도시개발사업 검토',
    'other'       => '기타 토지 개발 사업 검토',
];

// -----------------------------------------------------------------------------
// 입력 수신
// -----------------------------------------------------------------------------
$purpose  = isset($_POST['purpose'])  ? trim($_POST['purpose'])  : '';
$location = isset($_POST['location']) ? trim($_POST['location']) : '';
$area     = isset($_POST['area'])     ? trim($_POST['area'])     : '';
$phone    = isset($_POST['phone'])    ? trim($_POST['phone'])    : '';
$name     = isset($_POST['name'])     ? trim($_POST['name'])     : '';
$message  = isset($_POST['message'])  ? trim($_POST['message'])  : '';
$agree    = isset($_POST['agree'])    ? 'Y' : 'N';

// -----------------------------------------------------------------------------
// 유효성 검사
// -----------------------------------------------------------------------------
if (!array_key_exists($purpose, $PURPOSE_LABELS)) {
    responseApi(400, '개발 목적을 선택해주세요.', null);
}
if ($location === '') responseApi(400, '소재지를 입력해주세요.', null);
if ($phone === '')    responseApi(400, '연락처를 입력해주세요.', null);
if ($name === '')     responseApi(400, '성명을 입력해주세요.', null);
if ($agree !== 'Y')  responseApi(400, '개인정보 수집 및 이용에 동의해주세요.', null);

// -----------------------------------------------------------------------------
// DB 저장 및 메일 발송
// -----------------------------------------------------------------------------
$ip        = $_SERVER['REMOTE_ADDR']     ?? '';
$userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);

mysqli_autocommit($conn, FALSE);
mysqli_begin_transaction($conn);

try {
    // 1) 신청 insert
    $sql = "INSERT INTO consulting_listings
              (purpose, location, area, phone, name, message,
               agree_fg, status, ip_address, user_agent)
            VALUES (?,?,?,?,?,?, ?, 'received', ?, ?)";
    $params = [$purpose, $location, $area, $phone, $name, $message, $agree, $ip, $userAgent];
    $types  = 'sssssssss';
    executeQuery($conn, $sql, $types, $params);
    $inquiryId = mysqli_insert_id($conn);

    // 2) 메일 발송
    $purposeLabel = $PURPOSE_LABELS[$purpose] ?? $purpose;

    $subject = "[부동산개발컨설팅 신청] {$name} / {$purposeLabel}";
    $body  = "<h3>부동산 개발 컨설팅 신청서 접수</h3>";
    $body .= "<table border='1' cellpadding='8' cellspacing='0' style='border-collapse:collapse;font-size:14px'>";
    $body .= "<tr><th>접수번호</th><td>{$inquiryId}</td></tr>";
    $body .= "<tr><th>개발 목적</th><td>" . htmlspecialchars($purposeLabel) . "</td></tr>";
    $body .= "<tr><th>소재지</th><td>"    . htmlspecialchars($location) . "</td></tr>";
    $body .= "<tr><th>면적</th><td>"      . htmlspecialchars($area ?: '-') . "</td></tr>";
    $body .= "<tr><th>성명</th><td>"      . htmlspecialchars($name) . "</td></tr>";
    $body .= "<tr><th>연락처</th><td>"    . htmlspecialchars($phone) . "</td></tr>";
    $body .= "<tr><th>기타 문의사항</th><td>" . nl2br(htmlspecialchars($message ?: '-')) . "</td></tr>";
    $body .= "<tr><th>접수일시</th><td>"  . date('Y-m-d H:i:s') . "</td></tr>";
    $body .= "</table>";

    $mailResult = sendMail(CONSULTING_TO_EMAIL, $subject, $body);

    if ($mailResult === 'SUCCESS') {
        executeQuery($conn, "UPDATE consulting_listings SET email_sent_at = NOW() WHERE idx = ?", 'i', [$inquiryId]);
    }

    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', ['idx' => $inquiryId, 'mail' => $mailResult]);

} catch (Exception $e) {
    mysqli_rollback($conn);
    responseApi($e->getCode() ?: 500, $e->getMessage(), null);
} finally {
    mysqli_close($conn);
}
