<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';

$file = $_FILES['uploadFile']; //uploadFile 배열의 index 순으로 들어가있듬
$uploadFolder = $_POST['uploadFolder'];
// print_r($file);
// exit;

$result_array = upload_file_temp($file, $uploadFolder);
echo json_encode($result_array);
