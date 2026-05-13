<?php
// echo ini_get('max_input_vars');exit;
// phpinfo();exit;
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect.php';

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

$domain = $_ENV['domain'];
$apiKey = $_ENV['vworld_key'];
$pnu = isset($_POST['pnu']) ? $_POST['pnu'] : '';
$condition = isset($_POST['condition']) ? $_POST['condition'] : array(); // 분석 조건 배열
$code = isset($condition['code']) ? $condition['code'] : null; // 조건 코드

// 입력값 검증
if (empty($pnu) || empty($pnu)) {
    responseApi(400, '지역 코드가 제공되지 않았습니다.', null);
    exit;
}

try {
    // 지적도 폴리곤 요청
    $featureData = getaAriculturalPolygon($domain, $apiKey, $pnu);

    // 결과를 배열로 변환합니다.
    $response_data = array();

    if (isset($featureData['response']['status']) && $featureData['response']['status'] === 'OK') {
        // $pnu = $featureData['response']['result']['featureCollection']['features'][0]['properties']['pnu'];
        $features = $featureData['response']['result']['featureCollection']['features'];

        // 모든 폴리곤 데이터를 배열로 변환
        foreach ($features as $feature) {
            if (isset($feature['geometry']['type'], $feature['geometry']['coordinates'])) {
                $geometryType = $feature['geometry']['type'];
                $coordinates = $feature['geometry']['coordinates'];

                try {
                    $wkt = convertCoordinatesToWKT($geometryType, $coordinates);
                    $response_data[] = [
                        'geometryType' => $geometryType,
                        'wkt' => $wkt,
                        'coordinates' => $coordinates
                    ];
                } catch (Exception $e) {
                    // 지원되지 않는 타입은 건너뜀
                    continue;
                }
            }
        }

        responseApi(200, 'SUCCESS', $response_data);
    } else {
        throw new Exception('폴리곤 정보를 받지 못 했습니다.', 500);
    }

} catch (Exception $e) {
    // 오류 발생 시 롤백
    responseApi($e->getCode(), $e->getMessage(), null);

}


// PNU로 좌표를 가져오는 함수
function getaAriculturalPolygon($domain, $apiKey, $pnu) {
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

function convertCoordinatesToWKT($geometryType, $coordinates) {

    if ($geometryType === 'MultiPolygon') {
        $wkt = "MULTIPOLYGON(((";
        foreach ($coordinates[0][0] as $point) {
            $wkt .= "{$point[0]} {$point[1]},";
        }
        return rtrim($wkt, ',') . ")))";
    } elseif ($geometryType === 'Polygon') {
        $wkt = "POLYGON((";
        foreach ($coordinates[0] as $point) {
            $wkt .= "{$point[0]} {$point[1]},";
        }
        return rtrim($wkt, ',') . "))";
    }
    throw new Exception("지원되지 않는 지오메트리 타입: " . $geometryType, 400);
}