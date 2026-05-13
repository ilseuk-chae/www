<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect_postgre.php';

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();


try {
    $domain = $_ENV['domain'];
    $apiKey = $_ENV['vworld_key'];
    $pnu = isset($_POST['pnu']) ? $_POST['pnu'] : null;
    $condition = isset($_POST['condition']) ? $_POST['condition'] : array(); // 분석 조건 배열
    $code = isset($condition['code']) ? $condition['code'] : null; // 조건 코드
    $title_name = isset($condition['parent_name_level_1']) ? $condition['parent_name_level_1'] : null;

    // 입력값 검증
    if (!$pnu || empty($condition)) {
        throw new Exception('올바르지 않은 요청입니다.', 400);
    }

    $response_array = [];

    switch ($title_name) {
        case '지목':
            $mainSql = 
                'SELECT count(*) AS count
                FROM tody.land_characteristics_polygon_41 
                WHERE pnu LIKE :pnuParam 
                AND "lndcgrCode" = :code
            ';

            // 쿼리 실행을 위한 매개변수 설정
            $params = [
                ':pnuParam' => $pnu . '%',
                ':code' => $code,
            ];

            // SQL 실행
            $stmt = executeQueryPDO($pdo, $mainSql, $params);
            
            // 5. 결과 가져오기
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $response_array['count'] = $row['count'];
            }
            break;
        case '주용도':
            $mainSql = 
                'SELECT count(*) AS count
                FROM tody.building_use_polygon_41 
                WHERE pnu LIKE :pnuParam 
                AND "mainPrposCode" = :code
            ';

            // 쿼리 실행을 위한 매개변수 설정
            $params = [
                ':pnuParam' => $pnu . '%',
                ':code' => $code,
            ];

            // SQL 실행
            $stmt = executeQueryPDO($pdo, $mainSql, $params);
            
            // 5. 결과 가져오기
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $response_array['count'] = $row['count'];
            }
            break;
        case '농업진흥지역':
            $apiResult = getaAriculturalPolygon($domain, $apiKey, $pnu, $code);

            if (!$apiResult['response']['status'] || $apiResult['response']['status'] !== 'OK') {
                responseApi(200, 'NO POLYGON DATA FOUND', []);
                exit;
            }

            $count = $apiResult['response']['record']['total'] ?? 0;
            $response_array['count'] = $count;
            break;
        case '교통시설':
            $apiResult = getaRoadPolygon($domain, $apiKey, $pnu, $code);

            if (!$apiResult['response']['status'] || $apiResult['response']['status'] !== 'OK') {
                responseApi(200, 'NO POLYGON DATA FOUND', []);
                exit;
            }

            $count = $apiResult['response']['record']['total'] ?? 0;
            $response_array['count'] = $count;
        default:
            break;
    }


    responseApi(200, 'SUCCESS', $response_array); 

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);

}



// 농업진흥지역
function getaAriculturalPolygon($domain, $apiKey, $pnu, $code) {
    // PNU에서 8자리만 추출
    $pnu = substr($pnu, 0, 8);
    $apiUrl = "https://api.vworld.kr/req/data";
    $params = [
        'service' => 'data',
        'version' => '2.0',
        'request' => 'GetFeature',
        'key' => $apiKey,
        'format' => 'json',
        'size' => '1000',
        'page' => '1',
        'data' => 'LT_C_AGRIXUE101',
        'attrFilter' => 'emdCd:like:' . $pnu . '|ucode:like:' . $code,
        'geometry' => 'false',
        'attribute' => 'false',
        'crs' => 'EPSG:4326',
        'domain' => $domain
    ];
    $url = $apiUrl . '?' . http_build_query($params);

    $response = file_get_contents($url);
    $responseData = json_decode($response, true);
    // echo json_encode($responseData);exit;
    return $responseData; // Return null if no coordinates are found
}

// 도로
function getaRoadPolygon($domain, $apiKey, $pnu) {
    // PNU에서 8자리만 추출
    $pnu = substr($pnu, 0, 8);
    $apiUrl = "https://api.vworld.kr/req/data";
    $params = [
        'service' => 'data',
        'version' => '2.0',
        'request' => 'GetFeature',
        'key' => $apiKey,
        'format' => 'json',
        'size' => '1000',
        'page' => '1',
        'data' => 'LT_C_UPISUQ151',
        'attrFilter' => 'emdCd:like:' . $pnu,
        'crs' => 'EPSG:4326',
        'domain' => $domain
    ];
    $url = $apiUrl . '?' . http_build_query($params);

    $response = file_get_contents($url);
    $responseData = json_decode($response, true);
    // echo json_encode($responseData);exit;
    return $responseData; // Return null if no coordinates are found
}