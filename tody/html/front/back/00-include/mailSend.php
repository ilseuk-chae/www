<?php
// =============================================================================================
// smtp 메일 발송 ===========================================================================

//Import PHPMailer classes into the global namespace
//These must be at the top of your script, not inside a function
require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";

$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

function sendMail($email, $subject, $content)
{
    $fromName = $_ENV['GOOGLE_FROM_NAME'];
    $sendEmail = $_ENV['GOOGLE_SEND_EMAIL'];
    $fromEmail = $_ENV['GOOGLE_FROM_EMAIL'];
    $password = $_ENV['GOOGLE_PASSWORD'];
    $addEmail = $_ENV['GOOGLE_ADD_EMAIL'];
    $to = $email;

    // 한글 깨짐 방지
    $subject = "=?EUC-KR?B?" . base64_encode(iconv("UTF-8", "EUC-KR", $subject)) . "?="; //한글 깨짐현황 해결
    
    // 템플릿 파일 읽기
    $templatePath = $_SERVER['DOCUMENT_ROOT'] . "/front/assets/template/email_template.html";
    if (!file_exists($templatePath)) {
        return "템플릿 파일이 존재하지 않습니다.";
    }
    $templateContent = file_get_contents($templatePath);

    // 템플릿 내 동적 데이터 교체
    $templateContent = str_replace("{{제목이 들어가는 영역입니다}}", $subject, $templateContent);
    $templateContent = str_replace("{{내용이 들어가는 영역입니다}}", nl2br($content), $templateContent);

    // $type = 0;
    // $file = array();
    // if ($type != 1) {
    //     $content = nl2br($content);
    // }
        
    // 메일로 인증코드 양식을 보낸다.
    $mail = new PHPMailer(true); // 오류에 대한 예외처리를 위해 true로 설정

    try {
        //Server settings
        $mail->IsSMTP(); // SMTP 사용
        $mail->Host = 'smtp.gmail.com'; // email 보낼때 사용할 서버를 지정
        $mail->SMTPAuth = true; // SMTP 인증을 사용함
        $mail->Username = $sendEmail;
        $mail->Password = $password;
        $mail->SMTPSecure = "tls"; // SSL을 사용함
        $mail->Port = 587; // email 보낼때 사용할 포트를 지정

        // Recipients
        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';
        $mail->SetFrom($fromEmail, $fromName);
        $mail->addAddress($to);
        $mail->addReplyTo($addEmail, $fromName);
        // $mail->addCC('cc@example.com');
        // $mail->addBCC('bcc@example.com');

        // Content
        $mail->isHTML(true);	//Set email format to HTML
        $mail->Subject = $subject;
        $mail->MsgHTML($templateContent);
        // if($cc) $mail->addCC($cc);
        // if($bcc) $mail->addBCC($bcc);

        // //Attachments
        // $mail->addAttachment('/var/tmp/file.tar.gz');         //Add attachments
        // $mail->addAttachment('/tmp/image.jpg', 'new.jpg');    //Optional name
        // if ($file != "") {
        //     foreach ($file as $f) {
        //         $mail->addAttachment($f['path'], $f['name']);
        //     }
        // }

        $mail_flag = $mail->send();

        if (!$mail_flag) {
            return "Failed to send email. Error: " . $mail->ErrorInfo;
        } else {
            return 'SUCCESS';
        }
    } catch (Exception $e) {
        return "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
    }
}

// 2. smtp 메일 발송 끝 ========================================================================
// =============================================================================================




?>