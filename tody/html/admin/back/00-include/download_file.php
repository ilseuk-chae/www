<?php

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

// 허용된 파일 확장자 목록
// $allowedExtensions = ['txt', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'hwp', 'zip'];
$allowedExtensions = ['txt', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'hwp', 'zip', '7z'];
$no = $_POST['no'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['fileName'])) {
        $fileName = basename($_POST['fileName']);
        $uploadDir = '/home/project/tody/upload/reference_file/' . $no . '/'; // 업로드 폴더 경로
        $filePath = $uploadDir . $fileName;


        // 파일 확장자 검증
        $fileExtension = pathinfo($filePath, PATHINFO_EXTENSION);
        if (!in_array(strtolower($fileExtension), $allowedExtensions)) {
            http_response_code(400);
            echo 'Invalid file type.';
            exit;
        }

        // 파일 존재 여부 및 경로 검증
        if (file_exists($filePath) && strpos(realpath($filePath), realpath($uploadDir)) === 0) {
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $fileName . '"');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($filePath));
            readfile($filePath);
            exit;
        } else {
            http_response_code(404);
            echo 'File not found.';
        }
    } else {
        http_response_code(400);
        echo 'No file name provided.';
    }
} else {
    http_response_code(405);
    echo 'Invalid request method.';
}
?>