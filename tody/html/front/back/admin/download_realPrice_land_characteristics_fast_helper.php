<?php
// download_realPrice_land_characteristics_fast_helper.php
//trigger_characteristics_batch_cli.php에 의해 호출되며, 데이터 적재 로직을 수행하고 간단한 성공/실패 메시지를 반환합니다

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

//require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'; 
//require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php'; 
//require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/admin/batch_helpers.php'; 

// 로그 전용 DB 연결 생성
// dbconnect.php의 내용을 복사해서 직접 연결하거나,
// dbconnect.php가 연결 객체를 반환하는 함수를 제공한다면 그걸 사용합니다.
// 여기서는 간단하게 새 mysqli 객체를 생성하는 것으로 예시를 들게요.
// DB 설정 (dotenv 에서 환경 변수를 가져옵니다)
/*
// 로그 전용 DB 연결 생성
$log_conn = new mysqli($servername, $username, $password, $dbname);
// ... 에러 처리 및 charset 설정 ...
if ($log_conn->connect_error) {
    error_log("FATAL: Failed to connect to database for logging: " . $log_conn->connect_error);
    exit(1);
}
$log_conn->set_charset("utf8mb4");
*/

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

$sidoCd = $cliOptions['sidoCd'] ?? null;
$historyId = (int) ($cliOptions['historyId'] ?? 0); // 자식 historyId 받기

// historyId와 sidoCd 유효성 검사 (로그 기록 가능하도록 추가)
if ($historyId === 0) {
    $errorMessage = "Missing historyId for batch worker. Exiting without logging to DB.";
    fwrite(STDERR, $errorMessage . PHP_EOL);
    exit(1);
}

if ($sidoCd === null || !preg_match('/^\d{2}$/', $sidoCd)) {
    $errorMessage = "Missing or invalid sidoCd. FAILED";
    log_to_db($historyId, $errorMessage, $conn, 'CRITICAL');
    update_history_status($historyId, 'failed', $errorMessage, $conn);
    echo $errorMessage . PHP_EOL; // 부모 스크립트를 위해 출력
    exit(1);
}

$startTime = microtime(true);
log_to_db($historyId, "Sido {$sidoCd} 토지특성정보 Redis 캐시 적재 시작.", $conn, 'INFO');
update_history_status($historyId, 'processing', "Sido {$sidoCd} 캐시 데이터 적재 시작.", $conn);

try {
     // Redis 연결
     $redis = new Redis();
     //$redis->connect('127.0.0.1', 6379);
     $redis->connect('127.0.0.1', 6379,10); // 10초 타임아웃 설정);
     //$redis->setOption(Redis::OPT_READ_TIMEOUT, -1); // 무한 타임아웃
     $redis->setOption(Redis::OPT_READ_TIMEOUT, 10); //  추가적으로 Read Timeout도 설정
     //log_to_db($historyId, "Redis 서버 연결 성공.", $conn, 'DEBUG');

    // Lua 스크립트 및 파이프라인 설정 (기존 로직 그대로)
    
    //redis.call('HMSET', KEYS[1], unpack(ARGV, 1, #ARGV - 1))
    //return redis.call('SADD', KEYS[2], ARGV[#ARGV])

    $luaScript = <<<LUA

-- Lua 스크립트가 로드될 때 PHP의 <<<LUA ... LUA; 사이의 내용이 이 변수에 할당됩니다.
local hashKey = KEYS[1]
local indexKey = KEYS[2]
local saddMember = ARGV[#ARGV]

-- 디버깅 정보 출력
redis.log(redis.LOG_WARNING, "HMSET Key: " .. hashKey)
redis.log(redis.LOG_WARNING, "SADD Key: " .. indexKey .. ", Member: " .. saddMember)
local hmset_result = redis.call('HMSET', hashKey, unpack(ARGV, 1, #ARGV - 1))
local sadd_result = redis.call('SADD', indexKey, saddMember)
redis.log(redis.LOG_WARNING, "HMSET Result for " .. hashKey .. ": " .. tostring(hmset_result))
redis.log(redis.LOG_WARNING, "SADD Result for " .. indexKey .. ": " .. tostring(sadd_result))

return sadd_result -- 또는 hmset_result 등 최종 결과

LUA;
    $luaSha = $redis->script('load', $luaScript);
    $pipeline = $redis->multi(Redis::PIPELINE);
    $pipelineOps = 0;
    $pipelineFlushSize = isset($cliOptions['pipeFlush']) ? max(1000, (int) $cliOptions['pipeFlush']) : 50000; // CLI 인자로 pipeFlush 받기

    // 배치 처리/테이블 설정 (기존 로직 그대로)
    $prefix = 'land_pnu:';
    $tableName = "land_characteristics_{$sidoCd}"; // $sidoCd 사용
    $chunkSize = isset($cliOptions['chunk']) ? max(1000, (int) $cliOptions['chunk']) : 20000; // CLI 인자로 chunk 받기

    $baseSql = "SELECT pnu, ldCodeNm, lndcgrCodeNm, prposArea1Nm, lndpclAr
                FROM {$tableName}
                WHERE pnu IS NOT NULL";

    $lastPnu = '';
    $lastFetchedPnu = '';
    $totalProcessed = 0;

    while (true) {
        // === 작업 취소 여부 주기적 확인 ===
        if (check_cancellation($historyId, $conn)) {
            throw new Exception("Sido {$sidoCd} 작업 도중 사용자 중단 요청 감지. 작업 중단.", 500);
        }

        $whereClause = $baseSql;
        if ($lastPnu !== '') {
            $escapedCursor = mysqli_real_escape_string($conn, $lastPnu);
            $whereClause .= " AND pnu > '{$escapedCursor}'";
        }

        $sql = $whereClause . " ORDER BY pnu LIMIT {$chunkSize}";
        //$result = mysqli_query($conn, $sql, MYSQLI_USE_RESULT);
        $result = mysqli_query($conn, $sql);
        if (!$result) {
            throw new Exception('DATABASE_QUERY_FAILED: ' . mysqli_error($conn), 500);
        }

        $rowCount = 0;

        while ($row = mysqli_fetch_assoc($result)) {
            $pnu = $row['pnu'] ?? '';
            if (empty($pnu)) {
                log_to_db($historyId, "PNU 값이 비어있는 레코드를 건너뜁니다.", $conn, 'WARN');
                continue;
            }

            if ($pnu === $lastFetchedPnu) {
                // 이 경우 무한 루프 가능성이 있어 중대한 오류로 간주하고 중단
                $errorMessage = "[WARN] Detected repeated PNU {$pnu}. Stopping to avoid infinite loop.";
                log_to_db($historyId, $errorMessage, $conn, 'CRITICAL');
                mysqli_free_result($result);
                throw new Exception($errorMessage, 500); // 예외 발생시켜 catch 블록으로 이동
            }

            $lastFetchedPnu = $pnu;

            $rowCount++;
            $totalProcessed++;
            $lastPnu = $pnu;

            // PNU를 행정구역/본번 단위로 분해해 인덱스 키 구성 (기존 로직 그대로)
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
                $pipeline->exec();
                //log_to_db($historyId, "Sido {$sidoCd} 캐시 적재 진행 중. 현재 처리된 PNU: {$totalProcessed}건.", $conn, 'INFO');
                $pipeline = $redis->multi(Redis::PIPELINE);
                $pipelineOps = 0;
            }
        }

        mysqli_free_result($result);

        if ($rowCount < $chunkSize) {
            break;
        }
    }

    if ($pipelineOps > 0) {
        $pipeline->exec();
        //log_to_db($historyId, "Sido {$sidoCd} 남은 캐시 데이터 Flush 완료. 총 PNU: {$totalProcessed}건.", $conn, 'INFO');
    }

    $endTime = microtime(true);
    $duration = $endTime - $startTime;
    $durationFormatted = sprintf("%02d분 %02d초", (int)floor($duration / 60), (int)round(fmod($duration, 60)));

    // --- 수정된 부분: totalProcessed 건수를 메시지에 포함 ---
    $successMessage = "Sido {$sidoCd} 토지특성정보 Redis 캐시 적재 완료. 총 {$totalProcessed}건 처리. 소요 시간: {$durationFormatted}. SUCCESS";
    // ----------------------------------------------------

    log_to_db($historyId, $successMessage, $conn, 'INFO');
    update_history_status($historyId, 'success', $successMessage, $conn);
    

    echo $successMessage . PHP_EOL;
   
} catch (Exception $e) {
    echo "Sido {$sidoCd} 토지특성정보 Redis 캐시 적재 실패: " . $e->getMessage() . " FAILED" . PHP_EOL;
    exit(1); // 오류 시 헬퍼 스크립트 자체를 종료
} finally {
    if ($conn) $conn->close();
    if ($redis) $redis->close();
   
}

exit(0);