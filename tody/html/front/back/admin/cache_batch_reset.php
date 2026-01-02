<?php
// chche_batch_reset.php
//trigger_catch_batch.php에 의해 호출되며, Redis 초기화 로직만 수행하고 간단한 성공/실패 메시지를 반환합니다.

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only be executed via CLI." . PHP_EOL);
    exit(1);
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
set_time_limit(0);
ini_set('memory_limit', '-1');

$redis = new Redis();
try {
    $redis->connect('127.0.0.1', 6379,10);

    $deletedIdx = deleteKeysByPattern($redis, 'realPrice:emd:latest:*');

    // 성공 메시지를 표준 출력으로 보냅니다.
    echo sprintf("Removed %d realPrice:emd:latest: entries. SUCCESS", $deletedIdx) . PHP_EOL;
    
} catch (Exception $e) {
    // 실패 메시지를 표준 출력과 표준 에러 출력으로 보냅니다.s
    $errorMessage = "Redis reset failed: " . $e->getMessage() . " FAILED";
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
            throw new Exception("Redis SCAN failed for pattern {$pattern}");
        }

        if (!empty($keys)) {
            $deleted += $redis->del($keys);
        }
    } while ($iterator !== 0);

    return $deleted;
}