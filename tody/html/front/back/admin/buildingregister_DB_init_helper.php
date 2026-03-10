<?php
// buildingregister_DB_init_helper.php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only be executed via CLI." . PHP_EOL);
    exit(1);
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
set_time_limit(0);

$script_root = dirname(__FILE__); // /var/www/tody/html/front/back/admin/
$project_base = dirname($script_root, 1); // /var/www/tody/html/front/back/ (admin에서 1단계 위로)

require_once $project_base . '/00-include/dbconnect.php';
require_once $project_base . '/00-include/common.php';
require_once $project_base . '/admin/batch_helpers.php'; // admin 폴더도 common.php와 같은 레벨에 있으니 경로 수정

$cliOptions = parseCliKeyValueArgs($argv ?? []);

$sidoCdsString = $cliOptions['sidoCds'] ?? '';

if ($sidoCdsString === '') {
    fwrite(STDERR, "FAILED: 필수 CLI 인자(sidoCds)가 누락되었습니다." . PHP_EOL);
    exit(1);
}
// 시도 목록:
//$sidoList = ['11','26','27','28','29','30','31','36','41','43','44','46','47','48','50', '51','52'];
$sidoList = array_filter(
    array_map('trim', explode(',', $sidoCdsString)),
    fn($v) => preg_match('/^\d{2}$/', $v)
);

if (empty($sidoList)) {
    fwrite(STDERR, "FAILED: 유효한 sidoCds가 없습니다." . PHP_EOL);
    exit(1);
}

$historyId = (int) ($cliOptions['historyId'] ?? 0); // 자식 historyId 받기

$overallSuccess = true;

$totalProcessedCount = 0; // 총 처리 건수를 누적할 변수 초기화
$failedSidos = []; // 실패한 시도 추적

foreach ($sidoList as $sidoCd) {
    try {
        log_to_db($historyId, "건축물대장 테이블 초기화 시도: {$sidoCd}", $conn, 'INFO');
        truncateBuildingRegisterTables($conn, $sidoCd);
        $totalProcessedCount += 1; // total/title 테이블 1개 (통합 1개로)
    } catch (Exception $e) {
        fwrite(STDERR, "FAILED: {$sidoCd} → {$e->getMessage()}" . PHP_EOL);
        log_to_db($historyId, "초기화 실패: {$sidoCd} ({$e->getMessage()})", $conn, 'ERROR');
        $overallSuccess = false;
        $failedSidos[] = $sidoCd;
        //break;
    }
}

// 헬퍼 스크립트의 마지막 부분 (수정)
if ($overallSuccess) {
    // JSON 형태로 상태 코드와 필요한 데이터(totalProcessedCount)를 출력
    echo json_encode([
        'status' => 'SUCCESS',
        'message' => 'buildingregister_DB 초기화 완료. 총시도: ' . count($sidoList),
        'totalProcessedCount' => $totalProcessedCount
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL; 
    exit(0);
} else {
    // 실패 시에도 JSON 형태로 에러 메시지를 출력
    echo json_encode([
        'status' => 'FAILED',
        'message' => 'buildingregister_DB 초기화 실패. 성공시도: ' . count($sidoList) - count($failedSidos) . ', 실패시도: ' . count($failedSidos),
        'error' => 'buildingregister_DB 초기화 실패' // 실제 에러 내용을 여기에 포함
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL; 
    exit(1);
}

function truncateBuildingRegisterTables(mysqli $conn, string $sidoCd) : void
{
    $tables = [
        "bldrgst_total_{$sidoCd}",
        "bldrgst_title_{$sidoCd}",
    ];

    foreach ($tables as $table) {
        $sql = "TRUNCATE TABLE `{$table}`";
        if (!$conn->query($sql)) {
            throw new Exception("테이블 초기화 실패: {$table} ({$conn->error})");
        }
    }
}
function parseCliKeyValueArgs(array $argv)
{
    $parsed = [];
    foreach (array_slice($argv, 1) as $arg) {
        if (strpos($arg, '=') === false) {
            continue;
        }
        [$key, $value] = explode('=', $arg, 2);
        $key = trim($key);
        if ($key === '') {
            continue;
        }
        $parsed[$key] = $value;
    }

    return $parsed;
}
?>