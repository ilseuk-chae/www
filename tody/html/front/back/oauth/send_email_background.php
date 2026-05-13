<?php
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/mailSend.php');

$log_file = $_SERVER['DOCUMENT_ROOT'] . '/../logs/email_log.txt';
if ($argc != 4) {
    file_put_contents($log_file, date('Y-m-d H:i:s') . " - Invalid arguments\n", FILE_APPEND);
    exit("Usage: php send_email_background.php <email> <auth_code> <certifyNo>\n");
}

// if ($argc != 4) {
//     exit("Usage: php send_email_background.php <email> <auth_code>\n");
// }

$email = $argv[1];
$authCode = $argv[2];
$certifyNo = $argv[3];

$subject = '[토디] 인증번호 발송 안내';
$content = '인증번호 : ' . $authCode;

$result_mail_customer = sendMail($email, $subject, $content);

// 로그 기록 (선택 사항)
$log = date('Y-m-d H:i:s') . " - Email sent to: " . $email . " - Result: " . ($result_mail_customer == 'success' ? 'Success' : 'Failed') . "\n";
file_put_contents($_SERVER['DOCUMENT_ROOT'] . '/../logs/email_log.txt', $log, FILE_APPEND);

if ($result_mail_customer == 'success') {
    $sql = 
        "UPDATE user_certify SET
            result = 'Y'
        WHERE idx = ?; ";
    
    // 조건 추가
    $params = [$certifyNo];
    $types = 'i';
    $stmt = executeQuery($conn, $sql, $types, $params);
} else {
    $sql = 
        "UPDATE user_certify SET
            result = 'N'
        WHERE idx = ?; ";
    
    // 조건 추가
    $params = [$certifyNo];
    $types = 'i';
    $stmt = executeQuery($conn, $sql, $types, $params);
}

if (isset($stmt)) mysqli_stmt_close($stmt);
mysqli_close($conn);
?>