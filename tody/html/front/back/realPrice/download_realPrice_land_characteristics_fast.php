<?php
// 배치 로딩 시 CORS 허용
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-cache, must-revalidate");
header("Connection: close");

// 장시간 실행을 위한 환경 설정
error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(0);
ini_set('memory_limit', '-1');

include('/var/www/tody/html/front/back/00-include/dbconnect.php');
include('/var/www/tody/html/front/back/00-include/common.php');

// CLI 인자를 key=value 형태로 전달하면 $_GET에 매핑
if (PHP_SAPI === 'cli' && !empty($argv)) {
    foreach (array_slice($argv, 1) as $arg) {
        if (strpos($arg, '=') !== false) {
            parse_str($arg, $parsed);
            if (!empty($parsed)) {
                $_GET = array_merge($_GET, $parsed);
            }
        }
    }
}

if (!isset($_GET['sidoCd']) || $_GET['sidoCd'] === '') {
    $message = '필수 파라미터(sidoCd)가 누락되었습니다.';
    if (PHP_SAPI === 'cli') {
        fwrite(STDERR, $message . PHP_EOL);
    } else {
        if (function_exists('http_response_code')) {
            http_response_code(400);
        }
        echo $message;
    }
    exit(1);
}

$sidoCd = (string) $_GET['sidoCd'];
if (!preg_match('/^\d{2}$/', $sidoCd)) {
    $message = 'sidoCd는 두 자리 숫자여야 합니다 (예: 47).';
    if (PHP_SAPI === 'cli') {
        fwrite(STDERR, $message . PHP_EOL);
    } else {
        if (function_exists('http_response_code')) {
            http_response_code(400);
        }
        echo $message;
    }
    exit(1);
}

// 토지 특성 데이터를 저장할 Redis 연결 준비
$redis = new Redis();
$redis->connect('127.0.0.1', 6379, 10);
$redis->setOption(Redis::OPT_READ_TIMEOUT, 60);
$debugMode = isset($_GET['debug']) && $_GET['debug'] !== '0';
$debugInterval = isset($_GET['debugInterval']) ? max(1, (int) $_GET['debugInterval']) : 200000;
$debug = static function (string $message) use ($debugMode) {
    if ($debugMode) {
        echo "[DEBUG] {$message}\n";
        flush();
    }
};
// Lua 스크립트로 해시 적재와 인덱스 세트를 원자적으로 처리
$luaScript = <<<LUA
redis.call('HMSET', KEYS[1], unpack(ARGV, 1, #ARGV - 1))
return redis.call('SADD', KEYS[2], ARGV[#ARGV])
LUA;
$luaSha = $redis->script('load', $luaScript);
if ($luaSha === false) {
    throw new Exception("Redis Lua script load 실패. Redis 연결 또는 스크립트 문법을 확인하세요.", 500);
}
$pipeline = $redis->multi(Redis::PIPELINE);
$pipelineOps = 0;
$pipelineFlushSize = isset($_GET['pipeFlush']) ? max(1000, (int) $_GET['pipeFlush']) : 5000;
$totalFlushErrors = 0;

// 배치 처리/테이블 설정
$prefix = 'land_pnu:';
$tableName = "land_characteristics_{$sidoCd}";
$chunkSize = isset($_GET['chunk']) ? max(1000, (int) $_GET['chunk']) : 20000;


// 기본 조회 쿼리 (커서 조건은 루프에서 추가)
$baseSql = "SELECT pnu, ldCodeNm, lndcgrCodeNm, prposArea1Nm, lndpclAr
            FROM {$tableName}
            WHERE pnu IS NOT NULL";

$lastPnu = '';
$lastFetchedPnu = '';
$totalProcessed = 0;

while (true) {
    $whereClause = $baseSql;
    if ($lastPnu !== '') {
        $escapedCursor = mysqli_real_escape_string($conn, $lastPnu);
        $whereClause .= " AND pnu > '{$escapedCursor}'";
    }

    // pnu 기준 Keyset Pagination으로 메모리 사용을 최소화
    $sql = $whereClause . " ORDER BY pnu LIMIT {$chunkSize}";
    $result = mysqli_query($conn, $sql, MYSQLI_USE_RESULT);
    if (!$result) {
        throw new Exception('EXECUTION_FAILED: ' . mysqli_error($conn), 500);
    }

    $rowCount = 0;

    while ($row = mysqli_fetch_assoc($result)) {
        $pnu = $row['pnu'] ?? '';
        if (empty($pnu)) {
            continue;
        }

        if ($pnu === $lastFetchedPnu) {
            echo "[WARN] Detected repeated PNU {$pnu}. Stopping to avoid infinite loop.\n";
            $pipeResults = $pipeline->exec();
            if ($pipeResults === false) {
                error_log("[ERROR] Redis pipeline exec 실패 (중복 PNU exit). PNU: {$pnu}");
            }
            mysqli_free_result($result);
            exit;
        }
        $lastFetchedPnu = $pnu;

        $rowCount++;
        $totalProcessed++;
        $lastPnu = $pnu;

        // PNU를 행정구역/본번 단위로 분해해 인덱스 키 구성
        $sggCd = substr($pnu, 0, 5);
        $umdCd = substr($pnu, 5, 3);
        $mCode = substr($pnu, 10, 1);
        $bonbun = substr($pnu, 11, 4);

        $ldCodeNm = (string) ($row['ldCodeNm'] ?? '');
        $lndcgrCodeNm = (string) ($row['lndcgrCodeNm'] ?? '');
        $prposArea1Nm = (string) ($row['prposArea1Nm'] ?? '');
        $lndpclAr = (string) ($row['lndpclAr'] ?? '');

        $hashKey = $prefix . $pnu;
        $indexKey = "land_pnu_idx:$sggCd:$umdCd:$mCode:$bonbun";

    if ($debugMode && ($totalProcessed % $debugInterval === 0)) {
        $debugCursor = $lastPnu === '' ? '[INIT]' : $lastPnu;
        echo "[DEBUG] cursor={$debugCursor}, lastPnu={$lastPnu}, total={$totalProcessed}\n";
        flush();
    }

        // HMSET에 전달할 키/값 쌍 구성
        $hashPairs = [
            'pnu', (string) $pnu,
            'ldCodeNm', $ldCodeNm,
            'lndcgrCodeNm', $lndcgrCodeNm,
            'prposArea1Nm', $prposArea1Nm,
            'lndpclAr', $lndpclAr,
            'sggCd', (string) $sggCd,
            'umdCd', (string) $umdCd,
        ];

        $evalArgs = array_merge([$hashKey, $indexKey], $hashPairs, [(string) $pnu]);
        $pipeline->evalSha($luaSha, $evalArgs, 2);
        $pipelineOps++;

        if ($pipelineOps >= $pipelineFlushSize) {
            $pipeResults = $pipeline->exec();
            if ($pipeResults === false) {
                $totalFlushErrors += $pipelineOps;
                error_log("[ERROR] Redis pipeline exec 실패. 처리중 PNU: {$lastPnu}, 누적 실패: {$totalFlushErrors}건");
                // Redis 재연결 시도
                try {
                    $redis->close();
                    $redis = new Redis();
                    $redis->connect('127.0.0.1', 6379, 10);
                    $redis->setOption(Redis::OPT_READ_TIMEOUT, 60);
                    $luaSha = $redis->script('load', $luaScript);
                } catch (Exception $reconEx) {
                    throw new Exception("Redis 재연결 실패: " . $reconEx->getMessage(), 500);
                }
            } elseif (is_array($pipeResults)) {
                $errCount = 0;
                foreach ($pipeResults as $r) {
                    if ($r === false) $errCount++;
                }
                if ($errCount > 0) {
                    $totalFlushErrors += $errCount;
                    error_log("[WARN] Redis pipeline 부분 실패: {$errCount}/{$pipelineOps}건. 누적 실패: {$totalFlushErrors}건");
                }
            }
            $debug("[PIPELINE] flushed (errors: {$totalFlushErrors})");
            $pipeline = $redis->multi(Redis::PIPELINE);
            $pipelineOps = 0;
        }
    }

    mysqli_free_result($result);

    if ($rowCount === 0) {
        break;
    }

    echo "Processed {$totalProcessed} rows\n";

    if ($rowCount < $chunkSize) {
        break;
    }
}

if ($pipelineOps > 0) {
    $pipeResults = $pipeline->exec();
    if ($pipeResults === false) {
        $totalFlushErrors += $pipelineOps;
        error_log("[ERROR] Redis 마지막 pipeline exec 실패. 누적 실패: {$totalFlushErrors}건");
    } elseif (is_array($pipeResults)) {
        $errCount = 0;
        foreach ($pipeResults as $r) {
            if ($r === false) $errCount++;
        }
        if ($errCount > 0) {
            $totalFlushErrors += $errCount;
            error_log("[WARN] Redis 마지막 pipeline 부분 실패: {$errCount}/{$pipelineOps}건. 누적 실패: {$totalFlushErrors}건");
        }
    }
    $debug('[PIPELINE] final flush');
}

// 적재 후 샘플 검증
if ($lastPnu !== '') {
    $verifyExists = $redis->exists($prefix . $lastPnu);
    if (!$verifyExists) {
        $totalFlushErrors++;
        error_log("[ERROR] 적재 검증 실패: Redis에 {$prefix}{$lastPnu} 키가 존재하지 않습니다.");
    }
}

$errorInfo = $totalFlushErrors > 0 ? " (Redis 실패 {$totalFlushErrors}건 발생)" : "";
echo "Optimized Redis load complete (table: {$tableName}){$errorInfo}\n";
