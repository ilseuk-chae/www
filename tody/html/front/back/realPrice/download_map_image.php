<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");
header("Access-Control-Allow-Origin: *");
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['html']) {
    $domain = $_ENV['domain'];

    // Base64로 디코딩된 HTML 데이터 가져오기
    $htmlContent = base64_decode($_POST['html']);

    // src 경로를 절대 경로로 변경
    $htmlContent = str_replace('src="/', 'src="' . $domain . '/', $htmlContent);
    
    // echo $htmlContent;exit;
    // $htmlContent = urldecode($_POST['html']);
    // $htmlContent = html_entity_decode($htmlContent, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    // echo $htmlContent;exit;
    // 너비와 높이를 POST 데이터에서 받아오되, 없으면 기본값 설정
    $width = isset($_POST['width']) ? urldecode($_POST['width']) : 1920;
    $height = isset($_POST['height']) ? urldecode($_POST['height']) : 1080;
    // $width = 1920;
    // $height = 1080;

    // HTML에 스타일 추가
    $htmlWithStyles = "
        <!DOCTYPE html>
        <html lang='ko'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Map Export</title>
            <link href='{$domain}/assets/css/bootstrap.min.css' rel='stylesheet' type='text/css' />
            <link href='{$domain}/assets/css/icons.min.css' rel='stylesheet' type='text/css' />
            <link href='{$domain}/assets/css/app.min.css' rel='stylesheet' type='text/css' />
            <link href='{$domain}/front/assets/css/style.css' rel='stylesheet' />
        </head>
        <body>
                $htmlContent
        </body>
        </html>";
        // <div style='position:relative; height:auto;'>
        // </div>

    // HTML을 임시 파일로 저장
    $tempHtmlPath = '/home/project/tody/temp/temp_' . time() . '.html';
    file_put_contents($tempHtmlPath, $htmlWithStyles); // 스타일이 추가된 HTML을 저장
    
    // 이미지 저장 경로 지정
    $upload_dir = '/home/project/tody/temp/';
    $fileName = 'saved_map_' . time() . '.png';  // 파일명 지정
    $filePath = $upload_dir . $fileName;         // 저장할 경로

    // wkhtmltoimage 명령어로 HTML을 이미지로 변환
    $command = "wkhtmltoimage --enable-local-file-access --enable-local-file-access --no-stop-slow-scripts --crop-x 0 --crop-y 0 --crop-w $width --crop-h $height --encoding utf-8 $tempHtmlPath $filePath 2>&1";
    exec($command, $output, $return_var);

    if ($return_var === 0) {
        // 성공적으로 변환되었을 때
        echo json_encode(['success' => true, 'image_url' => '/temp/'.$fileName]);
    } else {
        // 변환 실패 시 오류 반환
        echo json_encode(['success' => false, 'message' => '이미지 변환 실패', 'output' => $output]);
    }

    // 임시 HTML 파일 삭제
    // unlink($tempHtmlPath);
} else {
    // 이미지 데이터가 없는 경우
    echo json_encode(['success' => false, 'message' => '이미지 데이터가 전달되지 않았습니다']);
}
?>