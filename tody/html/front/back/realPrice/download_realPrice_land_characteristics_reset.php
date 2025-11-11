<?php
if (PHP_SAPI !== 'cli') {
    if (function_exists('http_response_code')) {
        http_response_code(403);
    }
    echo "This script can only be executed via CLI." . PHP_EOL;
    exit;
}

error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(0);
ini_set('memory_limit', '-1');

$redis = new Redis();
$redis->connect('127.0.0.1', 6379);

$deletedPnu = deleteKeysByPattern($redis, 'land_pnu:*');
$deletedIdx = deleteKeysByPattern($redis, 'land_pnu_idx:*');

echo sprintf("Removed %d land_pnu hashes and %d land_pnu_idx entries.%s", $deletedPnu, $deletedIdx, PHP_EOL);

exit;

function deleteKeysByPattern(Redis $redis, string $pattern, int $count = 10000): int
{
    $deleted = 0;
    $iterator = null;

    do {
        $keys = $redis->scan($iterator, $pattern, $count);
        if ($keys === false) {
            continue;
        }

        if (!empty($keys)) {
            $deleted += $redis->del($keys);
        }
    } while ($iterator !== 0);

    return $deleted;
}
