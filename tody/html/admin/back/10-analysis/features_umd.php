<?php
// CORS 허용
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/realPrice/poligon_center.php');

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

$pnu = isset($_POST['pnu']) ? $_POST['pnu'] : '';
$apiKey = $_ENV['vworld_key'];
$domain = $_ENV['domain'];

// 입력값 검증
if (empty($pnu) || empty($pnu)) {
    responseApi(400, '지역 코드가 제공되지 않았습니다.', null);
    exit;
}

try {
    // 지적도 폴리곤 요청
    $featureData = GetFeature($domain, $apiKey, $pnu);

    // 결과를 배열로 변환합니다.
    $response_data = array();

    if (isset($featureData['response']['status']) && $featureData['response']['status'] === 'OK') {
        // $pnu = $featureData['response']['result']['featureCollection']['features'][0]['properties']['pnu'];
        $polygonCoordinates = $featureData['response']['result']['featureCollection']['features'][0]['geometry']['coordinates'];
        responseApi(200, 'SUCCESS', $polygonCoordinates); 

        // $wktPolygon = 'MULTIPOLYGON(';
        
        // foreach ($polygonCoordinates as $polygonSet) {
        //     $wktPolygon .= '(';
        //     foreach ($polygonSet as $polygon) {
        //         $wktPolygon .= '(';
        //         foreach ($polygon as $coord) {
        //             $wktPolygon .= $coord[0] . ' ' . $coord[1] . ', ';
        //         }
        //         $wktPolygon = rtrim($wktPolygon, ', ') . '),';
        //     }
        //     $wktPolygon = rtrim($wktPolygon, ',') . '),';
        // }
        // $wktPolygon = rtrim($wktPolygon, ',') . ')';

        // responseApi(200, 'SUCCESS', $wktPolygon);

    } else {
        throw new Exception('폴리곤 정보를 받지 못 했습니다.', 500);
    }

} catch (Exception $e) {
    // 오류 발생 시 롤백
    responseApi($e->getCode(), $e->getMessage(), null);

}

// PNU로 좌표를 가져오는 함수
function GetFeature($domain, $apiKey, $pnu) {
    $apiUrl = "https://api.vworld.kr/req/data";
    $params = [
        'service' => 'data',
        'version' => '2.0',
        'request' => 'GetFeature',
        'key' => $apiKey,
        'format' => 'json',
        'data' => 'LT_C_ADEMD_INFO',
        'attrFilter' => 'emdCd:like:' . $pnu,
        'crs' => 'EPSG:4326',
        'domain' => $domain
    ];
    $url = $apiUrl . '?' . http_build_query($params);

    $response = file_get_contents($url);
    $responseData = json_decode($response, true);

    // echo json_encode($responseData);exit;

    // // Check if the response contains geometry data
    // if (isset($responseData['response']['result']['featureCollection']['features'][0]['geometry']['coordinates'])) {
    //     $coordinates = $responseData['response']['result']['featureCollection']['features'][0]['geometry']['coordinates'];
    //     // Calculate the centroid of the MultiPolygon
    //     // print_r($coordinates[0][0]);exit;
    //     // return $coordinates[0][0];
    //     // return calculateCentroid($coordinates);
    //     return getPolygonCentroid($coordinates);
    // }

    return $responseData; // Return null if no coordinates are found
}

// 중심점을 계산하는 함수
function calculateCentroid($multiPolygon) {
    $totalX = 0;
    $totalY = 0;
    $totalPoints = 0;

    foreach ($multiPolygon as $polygon) {
        foreach ($polygon[0] as $point) { // Assuming it's a simple polygon with one ring
            $totalX += $point[0];
            $totalY += $point[1];
            $totalPoints++;
        }
    }

    return [$totalX / $totalPoints, $totalY / $totalPoints];
}
