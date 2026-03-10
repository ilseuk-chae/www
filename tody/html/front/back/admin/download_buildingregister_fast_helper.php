<?php
// download_buildingregister_fast_helper.php
// 시도별 건축물대장(총괄/표제부) 적재 - 최소 안정 버전

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "CLI only\n");
    exit(1);
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
set_time_limit(0);

$script_root  = dirname(__FILE__);
$project_base = dirname($script_root, 1);

require_once $project_base . '/00-include/dbconnect.php';
require_once $project_base . '/00-include/common.php';
require_once $project_base . '/admin/batch_helpers.php';

fwrite(STDOUT, "### CLI ARGV: " . implode(' ', $argv) . "\n");

/* -------------------------------------------------
 * CLI 인자 파싱
 * ------------------------------------------------- */
$cli = parseCliKeyValueArgs($argv ?? []);

$historyId = (int)($cli['historyId'] ?? 0);
$sidoCdsString = $cli['sidoCds'] ?? '';

if ($historyId === 0) {
    fwrite(STDERR, "FAILED: historyId missing\n");
    exit(1);
}
if ( $sidoCdsString === '') {
    fwrite(STDERR, "FAILED: sidoCds missing\n");
    exit(1);
}

$sidoList = array_values(array_filter(
    array_map('trim', explode(',', $sidoCdsString)),
    fn($v) => preg_match('/^\d{2}$/', $v)
));

if (empty($sidoList)) {
    fwrite(STDERR, "FAILED: invalid sidoCds\n");
    exit(1);
}

/* -------------------------------------------------
 * 메인 처리
 * ------------------------------------------------- */
$totalProcessed = 0;
$overallSuccess = true;

try {
    foreach ($sidoList as $sidoCd) {
        // === 작업 취소 여부 주기적 확인 ===
        if (check_cancellation($historyId, $conn)) {
            throw new Exception("Sido {$sidoCd} 작업 도중 사용자 중단 요청 감지. 작업 중단.", 500);
        }

        log_to_db($historyId, "건축물대장 수집 시작 (sido={$sidoCd})", $conn, 'INFO');

        // 시군구 , 법정동 목록
        $sql = "
            SELECT
                LEFT(region_cd, 5)  AS sigunguCd,
                RIGHT(region_cd, 5) AS bjdongCd,
                region_cd
            FROM bjd_master
            WHERE depth = 3
            AND ri_cd = '00'
            AND LEFT(region_cd, 2) = ?
            ORDER BY CAST(LEFT(region_cd, 5) AS UNSIGNED), 
                     CAST(RIGHT(region_cd, 5) AS UNSIGNED);
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param('s', $sidoCd);
        $stmt->execute();
        $result = $stmt->get_result();
        $oldsigunguCd = '';

        while ($row = $result->fetch_assoc()) {
            $sigunguCd = $row['sigunguCd'];
            $bjdongCd = $row['bjdongCd'];
            if (!preg_match('/^\d{5}$/', $bjdongCd)) {
                throw new Exception("bjdongCd 형식 오류: {$bjdongCd}");
            }
            if($oldsigunguCd !== $sigunguCd) {
                log_to_db($historyId, "건축물대장 수집 시작 (sigunguCd={$sigunguCd})", $conn, 'INFO');
                $oldsigunguCd = $sigunguCd; // ⭐ 이 줄이 빠져 있었음
            }
            
            // 총괄 표제부
            $totalProcessed += collectBuildingRegisterAllPages(
                $conn,
                "{$sigunguCd}-{$bjdongCd}",
                "bldrgst_total_{$sidoCd}",
                function ($_, $pageNo) use ($sigunguCd, $bjdongCd) {
                    return getBrRecapTitleInfo($sigunguCd, $bjdongCd, $pageNo);
                },
                $historyId,
                'total',
                'active' 
            );

            // 말소 총괄 표제부
            $totalProcessed += collectBuildingRegisterAllPages(
                $conn,
                "{$sigunguCd}-{$bjdongCd}",
                "bldrgst_total_{$sidoCd}",
                function ($_, $pageNo) use ($sigunguCd, $bjdongCd) {
                    return getSrRecapTitleInfo($sigunguCd, $bjdongCd, $pageNo);
                },
                $historyId,
                'total',
                'deactive' // 🔹 말소도 같은 테이블에 저장
            );
            // 표제부
            $totalProcessed += collectBuildingRegisterAllPages(
                $conn,
                "{$sigunguCd}-{$bjdongCd}",
                "bldrgst_title_{$sidoCd}",
                function ($_, $pageNo) use ($sigunguCd, $bjdongCd) {
                    return getBrTitleInfo($sigunguCd, $bjdongCd, $pageNo);
                },
                $historyId,
                'title',
                'active'
            );

            // 말소 표제부
            $totalProcessed += collectBuildingRegisterAllPages(
                $conn,
                "{$sigunguCd}-{$bjdongCd}",
                "bldrgst_title_{$sidoCd}",
                function ($_, $pageNo) use ($sigunguCd, $bjdongCd) {
                    return getSrTitleInfo($sigunguCd, $bjdongCd, $pageNo);
                },
                $historyId,
                'title',
                'deactive'
            );
            if (check_cancellation($historyId, $conn)) {
                throw new Exception("Sido {$sidoCd} 작업 도중 사용자 중단 요청 감지. 작업 중단.", 500);
            }
        }

        $stmt->close();
    }

} catch (Exception $e) {
    log_to_db($historyId, "ERROR: " . $e->getMessage(), $conn, 'ERROR');
    $overallSuccess = false;
}

/* -------------------------------------------------
 * 결과 출력 (마스터에서 파싱)
 * ------------------------------------------------- */
if ($overallSuccess) {
    echo json_encode([
        'status' => 'SUCCESS',
        //'message' => '국토교통부 건축물대장 가져오기 완료.',
        'totalProcessedCount' => $totalProcessed
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL;
    exit(0);
}

echo json_encode([
    'status' => 'FAILED',
    //'message' => '국토교통부 건축물대장 가져오기 실패.',
    'error'  => '건축물대장 수집 실패'
], JSON_UNESCAPED_UNICODE) . PHP_EOL;
exit(1);


/* =================================================
 * 함수들
 * ================================================= */

/**
 * XML 문자열을 파싱해서 테이블에 저장
 * 반환: 처리 건수
 */
function saveBuildingXml(mysqli $conn, string $xmlStr, string $table, string $sigunguCd, string $type, String $is_Active): int
{
    if (trim($xmlStr) === '') {
        return 0;
    }

    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($xmlStr);

    if ($xml === false) {
        // XML 파싱 실패 → JSON 오류 가능성 확인
        $json = json_decode($xmlStr, true);
        if ($json !== null && isset($json['status']) && $json['status'] === 'FAILED') {
            throw new Exception("API JSON 오류: " . ($json['message'] ?? '알 수 없는 오류') . " (sigunguCd={$sigunguCd})");
        }

        $errs = libxml_get_errors();
        libxml_clear_errors();
        throw new Exception("XML 파싱 실패: " . ($errs[0]->message ?? 'unknown') . " (sigunguCd={$sigunguCd})");
    }

    $data = json_decode(json_encode($xml), true);

    checkBrApiResultOrThrow($data, $sigunguCd); 

    if (!isset($data['body']['items']['item'])) {
        return 0;
    }

    $items = $data['body']['items']['item'];
    if (!isset($items[0])) {
        $items = [$items];
    }

    $count = 0;
    foreach ($items as $item) {

        $isAble = true;
        $firedate = $item['shterDay'] ?? null;
        
        $item['isActive'] = $is_Active; // 말소,폐쇄 여부추가

        if($is_Active == 'deactive') {
            $totArea = $item['totArea'] ?? null;
            $platArea = $item['platArea'] ?? null;
            if ((is_null($totArea) || $totArea == 0) && (is_null($platArea) || $platArea == 0)) {
                $isAble = false;   // 🔴 말소/폐쇄는 면적 정보가 반드시 있어야 함 (말소/폐쇄도 면적이 있어야 표제부/총괄표제부에 저장)
            }
        }
        
        // 🔴 API 메타 컬럼 제거
        unset($item['rnum']);
        unset($item['shterGbCd']);
        unset($item['shterGbCdNm']);
        unset($item['shterDay']);
        if ( $is_Active === 'deactive') {
            $item['mgmBldrgstPk'] = $item['mgmShtregPk'];
            unset($item['mgmShtregPk']);
        }

        if($isAble){
            insertAssoc($conn, $table, $item);
            $count++;
        }
    }

    return $count;
}

/**
 * 연관배열 INSERT
 */
function insertAssoc(mysqli $conn, string $table, array $data): void
{
    foreach ($data as $k => $v) {
        //if (is_array($v)) {
        //    $data[$k] = json_encode($v, JSON_UNESCAPED_UNICODE);
        //}
        // 🔴 1. 배열이면 (ex: []) → NULL
        if (is_array($v)) {
            $data[$k] = null;
            continue;
        }

        // 🔴 2. 문자열인데 공백만 있으면 → NULL
        if (is_string($v)) {
            $v = trim($v);
            $data[$k] = ($v === '') ? null : $v;
        }
    }

    $cols = array_keys($data);
    $placeholders = implode(',', array_fill(0, count($cols), '?'));

    $sql = "INSERT IGNORE INTO {$table} (" . implode(',', $cols) . ") VALUES ({$placeholders})";
    $stmt = $conn->prepare($sql);

    $types = str_repeat('s', count($cols));
    $vals  = array_values($data);

    $stmt->bind_param($types, ...$vals);
    $stmt->execute();
    $stmt->close();
}

/**
 * key=value CLI 파싱
 */
function parseCliKeyValueArgs(array $argv): array
{
    $out = [];
    foreach (array_slice($argv, 1) as $arg) {
        if (strpos($arg, '=') !== false) {
            [$k, $v] = explode('=', $arg, 2);
            $out[trim($k)] = $v;
        }
    }
    return $out;
}
// 건축물대장 표제부
function getBrTitleInfo(string $sigunguCd, string $bjdongCd, int $pageNo = 1): string|false {
    $url = 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo';
    $queryParams = '?' . http_build_query([
        'serviceKey' => $_ENV['public_data_key'],
        'sigunguCd'  => $sigunguCd,
        'bjdongCd'   => $bjdongCd,
        '_type'      => 'xml',
        'numOfRows'  => 100,
        'pageNo'     => $pageNo
    ]);
    return makeApiRequest_Xml($url, $queryParams);
}

// 말소 건축물대장 표제부
function getSrTitleInfo(string $sigunguCd, string $bjdongCd, int $pageNo = 1): string|false {
    $url = 'https://apis.data.go.kr/1613000/ShtRgstHubService/getSrTitleInfo';
    $queryParams = '?' . http_build_query([
        'serviceKey' => $_ENV['public_data_key'],
        'sigunguCd'  => $sigunguCd,
        'bjdongCd'   => $bjdongCd,
        '_type'      => 'xml',
        'numOfRows'  => 100,
        'pageNo'     => $pageNo
    ]);
    return makeApiRequest_Xml($url, $queryParams);
}

// 건축물대장 총괄 표제부
function getBrRecapTitleInfo(string $sigunguCd, string $bjdongCd, int $pageNo = 1): string|false {
    $url = 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrRecapTitleInfo';
    $queryParams = '?' . http_build_query([
        'serviceKey' => $_ENV['public_data_key'],
        'sigunguCd'  => $sigunguCd,
        'bjdongCd'   => $bjdongCd,
        '_type'      => 'xml',
        'numOfRows'  => 100,
        'pageNo'     => $pageNo
    ]);

    return makeApiRequest_Xml($url, $queryParams);
}

// 말소 건축물대장 총괄 표제부
function getSrRecapTitleInfo(string $sigunguCd, string $bjdongCd, int $pageNo = 1): string|false {
    $url = 'https://apis.data.go.kr/1613000/ShtRgstHubService/getSrRecapTitleInfo';
    $queryParams = '?' . http_build_query([
        'serviceKey' => $_ENV['public_data_key'],
        'sigunguCd'  => $sigunguCd,
        'bjdongCd'   => $bjdongCd,
        '_type'      => 'xml',
        'numOfRows'  => 100,
        'pageNo'     => $pageNo
    ]);

    return makeApiRequest_Xml($url, $queryParams);
}

function checkBrApiResultOrThrow(array $data, string $sigunguCd): void
{
    $header = $data['header'] ?? null;

    if (!$header) {
        throw new Exception("API 응답에 header가 없음 (sigunguCd={$sigunguCd})");
    }

    $resultCode = (string)($header['resultCode'] ?? '');

    if ($resultCode !== '00') {
        $msg = $header['resultMsg'] ?? '알 수 없는 오류';
        throw new Exception("API 오류 ({$resultCode}) {$msg} (sigunguCd={$sigunguCd})");
    }
}

/**
 * 건축물대장 API 전체 페이지 수집 공통 헬퍼
 *
 * @param mysqli  $conn
 * @param string  $sigunguCd
 * @param string  $table
 * @param callable $apiCaller  (fn($sigunguCd, $pageNo): string)
 * @param int     $historyId
 * @return int    총 저장 건수
 */
function collectBuildingRegisterAllPages(mysqli $conn, string $sigunguCd, string $table, callable $apiCaller, int $historyId,string $type, String $is_Active): int {

    $page = 1;
    $maxPage = 1;
    $totalSaved = 0;

    do {
        $xmlStr = $apiCaller($sigunguCd, $page);
        if ($xmlStr === false || trim($xmlStr) === '') {
            // API 응답 없음 → 0 처리
            log_to_db($historyId, "API 응답 없음 (sigunguCd={$sigunguCd}, page={$page})", $conn, 'WARN');
            return 0;
        }

        // 🔹 XML인지 아닌지 확인
        $trimmed = ltrim($xmlStr);

        if (
            !str_starts_with($trimmed, '<response') &&  !str_starts_with($trimmed, '<?xml')
        ) {
            log_to_db($historyId, "XML 아님, API 응답: $xmlStr", $conn, 'WARN');
            return 0;
        }

        // 기존 XML 파싱 로직
        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($xmlStr);
        if ($xml === false) {
            $errs = libxml_get_errors();
            libxml_clear_errors();
            throw new Exception(
                "XML 파싱 실패 (sigunguCd={$sigunguCd}, page={$page}) " . ($errs[0]->message ?? '')
            );
        }

        $data = json_decode(json_encode($xml), true);
       

        // 🔴 핵심: API 상태 체크
        checkBrApiResultOrThrow($data, $sigunguCd);

        // 총 페이지 계산 (1회만)
        if ($page === 1) {
            $totalCount = (int)($data['body']['totalCount'] ?? 0);
            if ($totalCount === 0) {
                return 0;
            }
            $maxPage = (int)ceil($totalCount / 100);
            if (str_starts_with($table, 'bldrgst_total_')) {
                $label = '총괄표제부';
            } elseif (str_starts_with($table, 'bldrgst_title_')) {
                $label = '표제부';
            } else {
                $label = $table;
            }
            //log_to_db($historyId, "[{$label}] sigunguCd={$sigunguCd}, totalCount={$totalCount}, maxPage={$maxPage}",$conn,'INFO');
        }

        // 저장
        $saved = saveBuildingXml($conn, $xmlStr, $table, $sigunguCd, $type,  $is_Active);
        
        $totalSaved += $saved;

        // API 과부하 방지
        usleep(200000); // 0.2초

        $page++;

    } while ($page <= $maxPage);
    
    if($is_Active === 'deactive') {
        $statusLabel = '말소 ';
    }
    log_to_db($historyId, "[{$statusLabel}{$label}] sigunguCd={$sigunguCd}, total saved count ={$totalSaved}", $conn, 'INFO');
    return $totalSaved;
}

?>
