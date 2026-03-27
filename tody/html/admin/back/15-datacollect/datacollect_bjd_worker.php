<?php
// 법정동코드 API를 이용하여 데이터를 수집하고 CSV로 저장하는 스크립트
//datacollect_bjd_worker.php

// 환경 설정
error_reporting(E_ALL);
ini_set('display_errors', 0);
set_time_limit(0);
ini_set('memory_limit', '-1');
//ini_set('memory_limit', '512M');


// CLI 실행 강제 (안정성 확보)
if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only be executed via CLI." . PHP_EOL);
    exit(1);
}
if (PHP_SAPI === 'cli') {

    
    if (empty($_SERVER['HTTP_REFERER'])) {
        $_SERVER['HTTP_REFERER'] = 'cli-worker';
    }

    if (empty($_SERVER['REMOTE_ADDR'])) {
        $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
    }

    if (empty($_SERVER['DOCUMENT_ROOT'])) {
        $_SERVER['DOCUMENT_ROOT'] = '/var/www/tody/html';
    }

}

$script_root = dirname(__FILE__); // /var/www/tody/html/front/back/admin/
$project_base = dirname($script_root, 1); // /var/www/tody/html/front/back/ (admin에서 2단계 위로)

require_once __DIR__ . '/../../../front/back/00-include/dbconnect.php';
require_once __DIR__ . '/../../../front/back/admin/batch_helpers.php';

// 발급받은 서비스키
$serviceKey = $_ENV['public_data_key_encoding']
           ?? getenv('public_data_key_encoding')
           ?? '';         
if (!$serviceKey) {
    fwrite(STDERR, "API KEY missing\n");
    exit(1);
}

// CLI 인자 파싱
$cliOptions = [];
foreach (array_slice($argv, 1) as $arg) {
    if (strpos($arg, '=') !== false) {
        [$key, $value] = explode('=', $arg, 2);
        // 여기서 ltrim($key, '-')를 사용해서 --sidoCds 가 sidoCds 가 됩니다.
        $cliOptions[ltrim($key, '-')] = $value; 
    }
}

$parentHistoryId = $cliOptions['historyId'] ?? 0;
$sidoCdsString = $cliOptions['sidoCds'] ?? ''; // 콤마로 구분된 시도 코드 문자열 (예: "36,50" 또는 "36")
$sidoCds = explode(',', $sidoCdsString); // ["36", "50"]

if (empty($sidoCdsString)) {
    // historyId가 없으면 로그를 남길 수 없음, 그냥 종료
    fwrite(STDERR, "Missing sidoCds for batch worker. Exiting.\n");
    exit(1);
}

// API URL
$url = "https://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList";

$baseSaveDir = realpath(__DIR__ . '/../../../../logs');
if ($baseSaveDir === false) {
    throw new Exception('csv 저장 디렉토리를 찾을 수 없습니다.');
}
$baseSaveDir .= '/';
$logFile =  $baseSaveDir . 'legal_dong_code_' . date('Ymd_His') . '.csv';

// 페이지 설정
$page = 1;
$rows = 1000;

$sidoMap = [
    "11" => "서울특별시",
    "26" => "부산광역시",
    "27" => "대구광역시",
    "28" => "인천광역시",
    "29" => "광주광역시",
    "30" => "대전광역시",
    "31" => "울산광역시",
    "36" => "세종특별자치시",
    "41" => "경기도",
    "42" => "강원특별자치도",
    "43" => "충청북도",
    "44" => "충청남도",
    "45" => "전라북도",
    "46" => "전라남도",
    "47" => "경상북도",
    "48" => "경상남도",
    "50" => "제주특별자치도"
];

$triggeredByUserId = 0; // batch

update_history_status($parentHistoryId, 'processing', '법정동  데이터 수집하기 시작', $conn, false);
$csvFile = fopen($logFile, "w");

if (!$csvFile) {
    throw new Exception("CSV 파일 생성 실패: {$logFile}");
}

// UTF-8 BOM 추가 (엑셀 한글 깨짐 방지)
fwrite($csvFile, "\xEF\xBB\xBF");
// CSV 헤더
fputcsv($csvFile, ["region_cd","sido_cd","sgg_cd","umd_cd","ri_cd",
                    "locatjumin_cd","locatjijuk_cd","locatadd_nm",
                    "locat_order","locat_rm","locathigh_cd",
                    "locallow_nm","adpt_de"]);

$sidoErrors = 0;
$successSidoCount = 0;
foreach ($sidoCds as $sidoCd) {

    if (!isset($sidoMap[$sidoCd])) {
        continue;
    }

    $sidoName = $sidoMap[$sidoCd];
    // 1. 각 시도 작업에 대한 upload_history 레코드 생성
    $stmt = $conn->prepare("INSERT INTO upload_history (task_type, sido_param, status, started_at, parent_history_id, log_message) VALUES (?, ?, ?, NOW(), ?, ?)");
    $taskType = 'collect_bjd'; // 건축물대장 정보 시도별 캐시 타입
    $status = 'processing';
    $subLogMessage = "Sido {$sidoCd} 법정동  데이터 수집하기 시작.";
    $stmt->bind_param("sssis", $taskType, $sidoCd, $status, $parentHistoryId, $subLogMessage);
    $stmt->execute();
    $sidoChildHistoryId = $conn->insert_id;
    $stmt->close();

    $page = 1;

    $context = stream_context_create([
        'http' => [
            'timeout' => 20,
            'header' => "User-Agent: PHP\r\n"
        ]
    ]);

    /* 1️⃣ 첫 페이지 호출 */
    $query = http_build_query([
        "pageNo" => 1,
        "numOfRows" => $rows,
        "type" => "json",
        "flag" => "Y",
        "locatadd_nm" => $sidoName
    ]);

    $requestUrl = $url . "?serviceKey=" . $serviceKey . "&" . $query;

    $response = file_get_contents($requestUrl,false,$context);

    if(!$response){
        update_history_status($sidoChildHistoryId,'failed',"API 호출 실패: {$sidoName}",$conn,true);
        continue;
    }

    $data = json_decode($response,true);
    if(!$data){
        log_to_db($sidoChildHistoryId,"JSON decode 실패", $conn,'ERROR');
        $sidoErrors++;
        continue;
    }
    $resultCode = $data['StanReginCd'][0]['head'][2]['RESULT']['resultCode'] ?? '';

    if($resultCode !== 'INFO-0'){
        log_to_db($sidoChildHistoryId,"API 오류: {$resultCode}",$conn,'ERROR');
        continue;
    }

    /* 2️⃣ totalCount 확인 */
    $totalCount = $data['StanReginCd'][0]['head'][0]['totalCount'] ?? 0;
    if($totalCount == 0){
        log_to_db($sidoChildHistoryId,"totalCount=0 API 오류 가능",$conn,'WARN');
        continue;
    }
    $totalPage = ceil($totalCount / $rows);
    
    /* 3️⃣ 페이지 루프 */
    while ($page <= $totalPage) {

        if($page > 1){

            $query = http_build_query([
                "pageNo" => $page,
                "numOfRows" => $rows,
                "type" => "json",
                "flag" => "Y",
                "locatadd_nm" => $sidoName
            ]);
    
            $requestUrl = $url . "?serviceKey=" . $serviceKey . "&" . $query;
    
            $response = file_get_contents($requestUrl,false,$context);
    
            if(!$response){
                $sidoErrors++;
                log_to_db($sidoChildHistoryId,"API 호출 실패 page {$page}",$conn,'ERROR');
                $page++;
                continue;
            }
    
            $data = json_decode($response,true);
            if(!$data){
                log_to_db($sidoChildHistoryId,"JSON decode 실패", $conn,'ERROR');
                $sidoErrors++;
                continue;
            }
            $resultCode = $data['StanReginCd'][0]['head'][2]['RESULT']['resultCode'] ?? '';

            if($resultCode !== 'INFO-0'){
                log_to_db($sidoChildHistoryId,"API 오류: {$resultCode}",$conn,'ERROR');
                continue;
            }

        }
        
        $rowsData = $data['StanReginCd'][1]['row'] ?? [];

        foreach($rowsData as $item){

            fputcsv($csvFile,[
                $item['region_cd'] ?? '',
                $item['sido_cd'] ?? '',
                $item['sgg_cd'] ?? '',
                $item['umd_cd'] ?? '', $item['ri_cd'] ?? '',
                $item['locatjumin_cd'] ?? '',
                $item['locatjijuk_cd'] ?? '',
                $item['locatadd_nm'] ?? '',
                $item['locat_order'] ?? '',
                $item['locat_rm'] ?? '',
                $item['locathigh_cd'] ?? '',
                $item['locallow_nm'] ?? '',
                $item['adpt_de'] ?? ''
            ]);
        }
        echo "page {$page} rows: ".count($rowsData)."\n";
        //echo "{$sidoName} page {$page} 저장 완료\n";

        $page++;
        usleep(200000); // 0.2초 대기
    }
    $sidoFinalStatus = 'success';
    $sidoFinalMessage = "Sido {$sidoCd} 법정동  데이터 수집하기 완료.";
    log_to_db($sidoChildHistoryId , $sidoFinalMessage, $conn, 'INFO');
    update_history_status($sidoChildHistoryId, $sidoFinalStatus, $sidoFinalMessage, $conn,true);
    $successSidoCount ++;
}
if ($sidoErrors > 0) {
    update_history_status($parentHistoryId,'failed',"법정동  데이터 수집하기 완료 (실패 {$sidoErrors}건)", $conn, true);
} else {
    $totalSido = count(array_intersect(array_keys($sidoMap), $sidoCds));
    update_history_status($parentHistoryId,'success',"법정동  데이터 수집하기 전체 성공 (총 시도: " . $totalSido . ", 성공 시도: {$successSidoCount})" ,$conn,true);
}
fclose($csvFile);

echo "CSV 생성 완료\n";