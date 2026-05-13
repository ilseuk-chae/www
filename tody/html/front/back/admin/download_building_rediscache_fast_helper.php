<?php
// download_building_rediscache_fast_helper.php
//trigger_buildingrediscache_batch_cli.php에 의해 호출되며, 데이터 적재 로직을 수행하고 간단한 성공/실패 메시지를 반환합니다

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
log_to_db($historyId, "Sido {$sidoCd} 건축물대장 정보 Redis 캐시 적재 시작.", $conn, 'INFO');
update_history_status($historyId, 'processing', "Sido {$sidoCd} 건축물대장 정보 캐시 데이터 적재 시작.", $conn);

try {
     // Redis 연결
     $redis = new Redis();
     //$redis->connect('127.0.0.1', 6379);
     $redis->connect('127.0.0.1', 6379,30); // 10초 타임아웃 설정);
     $redis->setOption(Redis::OPT_READ_TIMEOUT, -1); // 무한 타임아웃
     //$redis->setOption(Redis::OPT_READ_TIMEOUT, 10); //  추가적으로 Read Timeout도 설정
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
-- redis.log(redis.LOG_WARNING, "HMSET Key: " .. hashKey)
-- redis.log(redis.LOG_WARNING, "SADD Key: " .. indexKey .. ", Member: " .. saddMember)
local hmset_result = redis.call('HSET', hashKey, unpack(ARGV, 1, #ARGV - 1))
local sadd_result = redis.call('SADD', indexKey, saddMember)
-- redis.log(redis.LOG_WARNING, "HMSET Result for " .. hashKey .. ": " .. tostring(hmset_result))
-- redis.log(redis.LOG_WARNING, "SADD Result for " .. indexKey .. ": " .. tostring(sadd_result))

return sadd_result -- 또는 hmset_result 등 최종 결과

LUA;
    $luaSha = $redis->script('load', $luaScript);
    if ($luaSha === false) {
        throw new Exception("Redis Lua script load 실패. Redis 연결 또는 스크립트 문법을 확인하세요.", 500);
    }
    $pipeline = $redis->multi(Redis::PIPELINE);
    $pipelineOps = 0;
    $pipelineFlushSize = isset($cliOptions['pipeFlush']) ? max(1000, (int) $cliOptions['pipeFlush']) : 5000; // CLI 인자로 pipeFlush 받기
    $totalFlushErrors = 0; // pipeline flush 실패 누적 카운트

    // 배치 처리/테이블 설정 (기존 로직 그대로)
    //$prefix = 'bld_pnu:';
    $prefix = "bld:{$sidoCd}:pnu:";
    $bldTotal = "bldrgst_total_{$sidoCd}";
    $bldTitle = "bldrgst_title_{$sidoCd}";
    $land_charact = "land_characteristics_{$sidoCd}";

    $chunkSize = isset($cliOptions['chunk']) ? max(1000, (int) $cliOptions['chunk']) : 20000; // CLI 인자로 chunk 받기

    $lastPnu = '';
    $lastFetchedPnu = '';
    $totalProcessed = 0;

    while (true) {
        // === 작업 취소 여부 주기적 확인 ===
        if (check_cancellation($historyId, $conn)) {
            throw new Exception("Sido {$sidoCd} 작업 도중 사용자 중단 요청 감지. 작업 중단.", 500);
        }

        
        /* =====================================================
       1️⃣ STEP 1: pnu 목록만 정확히 chunkSize만큼 가져오기
        ====================================================== */

        $escapedCursor = mysqli_real_escape_string($conn, $lastPnu);

        $pnuSql = "
            SELECT pnu
            FROM {$bldTitle}
            WHERE pnu IS NOT NULL
            AND pnu <> ''
            " . ($lastPnu !== '' ? "AND pnu > '{$escapedCursor}'" : "") . "
            GROUP BY pnu
            ORDER BY pnu
            LIMIT {$chunkSize}
        ";

        $pnuResult = mysqli_query($conn, $pnuSql);
        if (!$pnuResult) {
            throw new Exception('PNU_QUERY_FAILED: ' . mysqli_error($conn), 500);
        }

        $pnuList = [];
        while ($row = mysqli_fetch_assoc($pnuResult)) {
            $pnuList[] = $row['pnu'];
        }
        mysqli_free_result($pnuResult);

        $rowCount = count($pnuList);
        if ($rowCount === 0) {
            break;
        }

        /* =====================================================
        2️⃣ STEP 2: 잘라온 pnu에 대해서만 JOIN 수행
        ====================================================== */

        $escapedPnuList = array_map(function ($v) use ($conn) {
            return "'" . mysqli_real_escape_string($conn, $v) . "'";
        }, $pnuList);

        $pnuIn = implode(",", $escapedPnuList);
        /*
        $sql = "
            SELECT
                ti_base.pnu,

                MAX(t.mainPurpsCdNm) AS mainPurpsCdNm,
                MAX(t.etcPurps) AS etcPurps,

                -- 🔥 Total (bldrgst_total)
                MAX(t.totArea) AS total_totArea,
                MAX(t.platArea) AS total_platArea,
                MAX(t.archArea) AS total_archArea,
                MAX(t.useAprDay) AS useAprDay,

                -- 🔥 Title 기본정보
                MAX(ti_base.bun) AS bun,
                MAX(ti_base.ji) AS ji,
                MAX(ti_base.regstrKindCdNm) AS regstrKindCdNm,

                -- 🔥 Title 면적 (표제부 기준)
                MAX(tt.title_totArea)  AS title_totArea,
                MAX(tt.title_platArea) AS title_platArea,
                MAX(tt.title_archArea) AS title_archArea,

                -- 🔥 층수 (총괄표제부 우선)
                MAX(tf.grndFlrCnt) AS grndFlrCnt,
                MAX(tf.ugrndFlrCnt) AS ugrndFlrCnt,

                -- 🔥 토지 면적 추가
                MAX(lc.lndpclAr) AS land_lndpclAr

            FROM {$bldTitle} ti_base

            -- 🔥 total은 보조정보
            LEFT JOIN {$bldTotal} t
                ON ti_base.pnu = t.pnu

            -- 🔥 land_characteristics 추가
            LEFT JOIN {$land_charact} lc
                ON ti_base.pnu = lc.pnu

            -- 🔥 title 면적
            LEFT JOIN (
                SELECT
                    pnu,
                    MAX(totArea)  AS title_totArea,
                    MAX(platArea) AS title_platArea,
                    MAX(archArea) AS title_archArea
                FROM {$bldTitle}
                WHERE regstrKindCdNm IN ('표제부','일반건축물')
                GROUP BY pnu
            ) tt ON ti_base.pnu = tt.pnu

            -- 🔥 층수 전용 (총괄표제부 우선)
            LEFT JOIN (
                SELECT
                    pnu,
                    grndFlrCnt,
                    ugrndFlrCnt
                FROM (
                    SELECT
                        pnu,
                        grndFlrCnt,
                        ugrndFlrCnt,
                        ROW_NUMBER() OVER (
                            PARTITION BY pnu
                            ORDER BY FIELD(regstrKindCdNm,'총괄표제부','표제부')
                        ) AS rn
                    FROM {$bldTitle}
                ) x
                WHERE rn = 1
            ) tf ON ti_base.pnu = tf.pnu

            WHERE ti_base.pnu IN ({$pnuIn})
            GROUP BY ti_base.pnu
            ORDER BY ti_base.pnu
        ";
        */
        $sql = "
            SELECT
                ti.pnu,

                MAX(t.mainPurpsCdNm) AS mainPurpsCdNm,
                MAX(t.etcPurps) AS etcPurps,

                -- 🔥 Total (bldrgst_total)
                MAX(t.totArea)  AS total_totArea,
                MAX(t.platArea) AS total_platArea,
                MAX(t.archArea) AS total_archArea,
                MAX(t.useAprDay) AS useAprDay,

                -- 🔥 Title 기본정보
                MAX(ti.bun) AS bun,
                MAX(ti.ji) AS ji,
                MAX(ti.regstrKindCdNm) AS regstrKindCdNm,

                -- 🔥 Title 면적 (표제부 기준)
                MAX(CASE 
                        WHEN ti.regstrKindCdNm IN ('표제부','일반건축물')
                        THEN ti.totArea
                    END
                ) AS title_totArea,

                MAX(
                    CASE 
                        WHEN ti.regstrKindCdNm IN ('표제부','일반건축물')
                        THEN ti.platArea
                    END
                ) AS title_platArea,

                MAX(
                    CASE 
                        WHEN ti.regstrKindCdNm IN ('표제부','일반건축물')
                        THEN ti.archArea
                    END
                ) AS title_archArea,

                -- 🔥 층수 (총괄표제부 우선)
                MAX(
                    CASE
                        WHEN ti.regstrKindCdNm = '총괄표제부'
                        THEN ti.grndFlrCnt
                    END
                ) AS grndFlrCnt,

                MAX(
                    CASE
                        WHEN ti.regstrKindCdNm = '총괄표제부'
                        THEN ti.ugrndFlrCnt
                    END
                ) AS ugrndFlrCnt,

                -- 🔥 토지 면적 추가
                MAX(lc.lndpclAr) AS land_lndpclAr

            FROM {$bldTitle} ti FORCE INDEX (idx_title_pnu_kind)

            -- 🔥 total은 보조정보
            LEFT JOIN {$bldTotal} t
                ON ti.pnu = t.pnu

            -- 🔥 land_characteristics 추가
            LEFT JOIN {$land_charact} lc
                ON ti.pnu = lc.pnu

            WHERE ti.pnu IN ({$pnuIn})

            GROUP BY ti.pnu
           
        ";

        $result = mysqli_query($conn, $sql);
        if (!$result) {
            throw new Exception('JOIN_QUERY_FAILED: ' . mysqli_error($conn), 500);
        }

         /* =====================================================
       3️⃣ Redis 적재 (기존 로직 그대로)
        ====================================================== */

        $rowCount = 0;

        while ($row = mysqli_fetch_assoc($result)) {
            $pnu = $row['pnu'] ?? '';
            if (empty($pnu)) {
                log_to_db($historyId, "PNU 값이 비어있는 레코드를 건너뜁니다.", $conn, 'WARN');
                continue;
            }

            if ($pnu === $lastFetchedPnu) {
                // 이 경우 무한 루프 가능성이 있어 중대한 오류로 간주하고 중단
                $errorMessage = "[WARN] Detected repeated PNU {$pnu}. Infinite loop suspected.";
                log_to_db($historyId, $errorMessage, $conn, 'CRITICAL');
                //mysqli_free_result($result);
                throw new Exception($errorMessage, 500); // 예외 발생시켜 catch 블록으로 이동
            }

            $lastFetchedPnu = $pnu;
            $lastPnu = $pnu;

            $rowCount++;
            $totalProcessed++;
           
            // PNU를 행정구역/본번 단위로 분해해 인덱스 키 구성 (기존 로직 그대로)
            $sggCd = substr($pnu, 0, 5);
            $umdCd = substr($pnu, 5, 3);
            $mCode = substr($pnu, 10, 1);  // 1:대지, 2:산
            if ($mCode == '5') {
                $mCode = '1';   // 블록은 일반으로 통합
            }
           
            $bonbun = str_pad(substr($pnu, 11, 4), 4, '0', STR_PAD_LEFT);
            $bubun  = substr($pnu, 15, 4);
            
            $hashKey = $prefix . $pnu;
            //$indexKey = "bld_pnu_idx:$sggCd:$umdCd:$mCode:$bonbun";
            //$indexKey = "bld:{$sidoCd}:pnu_idx:$sggCd:$umdCd:$mCode:$bonbun";
            /* ① 동 전체 인덱스 */
            $dongIndexKey = "bld:{$sidoCd}:pnu_idx:{$sggCd}:{$umdCd}:{$mCode}";

            /* ② hash 데이터 먼저 구성 */
            $hashPairs = [
                'pnu', $pnu,
                // 🔥 건축물 주요 정보
                'mainPurpsCdNm', (string)$row['mainPurpsCdNm'],
                'etcPurps', (string)$row['etcPurps'],

                // 🔥 Total 면적
                'total_totArea', (string)($row['total_totArea'] ?? 0),      // 연 면적
                'total_platArea', (string)($row['total_platArea'] ?? 0),    // 대지 면적
                'total_archArea', (string)($row['total_archArea'] ?? 0),    //건축 면적

                // 🔥 Title 면적
                'title_totArea', (string)($row['title_totArea'] ?? 0),
                'title_platArea', (string)($row['title_platArea'] ?? 0),
                'title_archArea', (string)($row['title_archArea'] ?? 0),

                // 🔥 토지 면적
                'land_lndpclAr', (string)($row['land_lndpclAr'] ?? 0),

                // 🔥 층수
                'grndFlrCnt', (string)$row['grndFlrCnt'],
                'ugrndFlrCnt', (string)$row['ugrndFlrCnt'],

                // 🔥 사용승인일
                'useAprDay', (string)$row['useAprDay'],

                // 🔥 지번 정보
                'bun', (string)$row['bun'],
                'ji', (string)($row['ji'] ?? '0'),

                // 🔥 PNU 분해 정보
                'sggCd', $sggCd,
                'umdCd', $umdCd,
                'mCode', $mCode,
                'bonbun', $bonbun,
                'bubun', $bubun,
            ];

            /* Lua로 hash + 동 인덱스 */
            $evalArgs = array_merge([$hashKey, $dongIndexKey], $hashPairs, [(string)$pnu]);
            $pipeline->evalSha($luaSha, $evalArgs, 2);

            $pipelineOps++;

            if ($pipelineOps >= $pipelineFlushSize) {
                $pipeResults = $pipeline->exec();
                if ($pipeResults === false) {
                    $totalFlushErrors += $pipelineOps;
                    log_to_db($historyId, "[ERROR] Redis pipeline exec 실패 (timeout/연결 끊김). 처리중 PNU: {$lastPnu}, 누적 실패: {$totalFlushErrors}건", $conn, 'ERROR');
                    try {
                        $redis->close();
                        $redis = new Redis();
                        $redis->connect('127.0.0.1', 6379, 30);
                        $redis->setOption(Redis::OPT_READ_TIMEOUT, -1);
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
                        log_to_db($historyId, "[WARN] Redis pipeline 부분 실패: {$errCount}/{$pipelineOps}건. 누적 실패: {$totalFlushErrors}건", $conn, 'WARN');
                    }
                }
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
        $pipeResults = $pipeline->exec();
        if ($pipeResults === false) {
            $totalFlushErrors += $pipelineOps;
            log_to_db($historyId, "[ERROR] Redis 마지막 pipeline exec 실패. 누적 실패: {$totalFlushErrors}건", $conn, 'ERROR');
        } elseif (is_array($pipeResults)) {
            $errCount = 0;
            foreach ($pipeResults as $r) {
                if ($r === false) $errCount++;
            }
            if ($errCount > 0) {
                $totalFlushErrors += $errCount;
                log_to_db($historyId, "[WARN] Redis 마지막 pipeline 부분 실패: {$errCount}/{$pipelineOps}건. 누적 실패: {$totalFlushErrors}건", $conn, 'WARN');
            }
        }
    }

    $endTime = microtime(true);
    $duration = $endTime - $startTime;
    $durationFormatted = sprintf("%02d분 %02d초", (int)floor($duration / 60), (int)round(fmod($duration, 60)));

    $errorSuffix = $totalFlushErrors > 0 ? " (Redis 실패 {$totalFlushErrors}건 발생)" : "";
    $successMessage = "Sido {$sidoCd} 건축물대장 정보 Redis 캐시 적재 완료. 총 {$totalProcessed}건 처리{$errorSuffix}. 소요 시간: {$durationFormatted}. SUCCESS";
    // ----------------------------------------------------

    log_to_db($historyId, $successMessage, $conn, 'INFO');
    update_history_status($historyId, 'success', $successMessage, $conn);
    

    echo $successMessage . PHP_EOL;
   
} catch (Exception $e) {
    echo "Sido {$sidoCd} 건축물대장 정보 Redis 캐시 적재 실패: " . $e->getMessage() . " FAILED" . PHP_EOL;
    exit(1); // 오류 시 헬퍼 스크립트 자체를 종료
} finally {
    if ($conn) $conn->close();
    if ($redis) $redis->close();
   
}

exit(0);
?>