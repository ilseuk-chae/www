<?php
// download_building_rediscache_reset_helper.php
//trigger_buildingrediscache_batch_cli.php에 의해 호출되며, Redis 초기화 로직만 수행하고 간단한 성공/실패 메시지를 반환합니다.

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only be executed via CLI." . PHP_EOL);
    exit(1);
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
set_time_limit(0);
ini_set('memory_limit', '-1');

// 공통 파일 포함 (dbconnect.php, common.php)
$script_root = dirname(__FILE__); // /var/www/tody/html/front/back/admin/
$project_base = dirname($script_root, 1); // /var/www/tody/html/front/back/ (admin에서 2단계 위로)

require_once $project_base . '/00-include/dbconnect.php';
require_once $project_base . '/00-include/common.php';
require_once $project_base . '/admin/batch_helpers.php'; // admin 폴더도 common.php와 같은 레벨에 있으니 경로 수정

// CLI 인자 sidoCd, historyId 파싱
$cliOptions = [];
foreach (array_slice($argv, 1) as $arg) {
    if (strpos($arg, '=') !== false) {
        [$key, $value] = explode('=', $arg, 2);
        // --- 여기를 수정해주세요 ---
        $key = ltrim($key, '-'); // key에서 선행하는 하이픈을 제거합니다.
        // ------------------------
        $cliOptions[$key] = $value;
    }
}

$redis = new Redis();
try {
    $redis->connect('127.0.0.1', 6379);

    $sidoCd = $cliOptions['sidoCd'] ?? null;

    if (!$sidoCd || !preg_match('/^\d{2}$/', $sidoCd)) {
        throw new Exception("Invalid or missing sidoCd");
    }

    $deletedPnu = deleteKeysByPattern($redis, "bld:{$sidoCd}:pnu:*");
    $deletedIdx = deleteKeysByPattern($redis, "bld:{$sidoCd}:pnu_idx:*");
    //$deletedBonbunIdx = deleteKeysByPattern($redis, "bld:{$sidoCd}:bonbun_idx:*");


    // 성공 메시지를 표준 출력으로 보냅니다.
    echo sprintf(
        "Removed %d bld:%s:pnu hashes and %d bld:%s:pnu_idx entries. SUCCESS",
        $deletedPnu,
        $sidoCd,
        $deletedIdx,
        $sidoCd
    ) . PHP_EOL;
} catch (Exception $e) {
    // 실패 메시지를 표준 출력과 표준 에러 출력으로 보냅니다.
    $errorMessage = "건축물대장 정보Redis reset failed: " . $e->getMessage() . " FAILED";
    echo $errorMessage . PHP_EOL; // 표준 출력으로도 실패 메시지 전송
    fwrite(STDERR, $errorMessage . PHP_EOL); // 표준 에러로도 실패 메시지 전송 (로그용)
    exit(1); // 오류 시 헬퍼 스크립트 자체를 종료
}

exit(0);

// (기존 파일에서 deleteKeysByPattern 함수 복사)
function deleteKeysByPattern(Redis $redis, string $pattern, int $count = 10000): int
{
    $deleted = 0;
    $iterator = null;

    do {
        $keys = $redis->scan($iterator, $pattern, $count);
        if ($keys === false) {
            // Redis 연결 오류 등으로 SCAN이 실패하면 예외 처리
            //throw new Exception("Redis SCAN failed for pattern {$pattern}");
            continue; // 오류 발생 시 해당 스캔을 건너뛰고 다음으로 진행
        }

        if (!empty($keys)) {
            $deleted += $redis->del($keys);
        }
    } while ($iterator !== 0);

    return $deleted;
}