<?php
//start_datacollect_bjd.php
header('Content-Type: application/json');

ini_set('display_errors',1);
error_reporting(E_ALL);

//require_once __DIR__ . '/../00-include/dbconnect.php';
require_once __DIR__ . '/../../../front/back/00-include/dbconnect.php';

$input = json_decode(file_get_contents("php://input"), true);

$sido = $input['sido'] ?? '';

if(empty($sido)){
    echo json_encode([
        "success" => false,
        "message" => "sido parameter missing"
    ]);
    exit;
}

/* ---------------------------------
   1. history 생성
--------------------------------- */

$stmt = $conn->prepare("
    INSERT INTO upload_history
    (task_type,sido_param,status,started_at)
    VALUES
    ('collect_bjd', ?, 'processing', NOW())
    ");

$stmt->bind_param("s",$sido);
$stmt->execute();

$historyId = $stmt->insert_id;
error_log("[DEBUG]error_log historyId :" . $historyId ); 
/* ---------------------------------
   2. CLI worker 실행
--------------------------------- */

$phpPath = "/usr/bin/php"; // 서버 php 경로

$workerScript = __DIR__ . "/datacollect_bjd_worker.php";
/*
$cmd = sprintf(
    "%s %s historyId=%d sidoCds=%s > /dev/null 2>&1 &",
    $phpPath,
    escapeshellarg($workerScript),
    $historyId,
    escapeshellarg($sido)
);

exec($cmd);
*/

$logFile = "/var/www/tody/logs/bjd_worker.log";

$cmd = sprintf(
    "%s %s historyId=%d sidoCds=%s >> %s 2>&1 & echo $!",
    $phpPath,
    escapeshellarg($workerScript),
    $historyId,
    escapeshellarg($sido),
    $logFile
);

$pid = exec($cmd);

error_log("BJD Worker Started. PID=".$pid);

/* ---------------------------------
   3. 응답
--------------------------------- */

echo json_encode([
    "success" => true,
    "message" => "법정동 데이터 수집 시작",
    "master_history_id" => $historyId
]);
exit;