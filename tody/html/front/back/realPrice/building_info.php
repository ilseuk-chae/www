<?php
// CORS 허용 (필요할 경우 도메인을 제한할 수 있음)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

$response_array = array();

// 지적도 폴리곤
function getLandPolygon($apiKey, $geomFilter, $domain, $crs) {
    $url = "https://api.vworld.kr/req/data";
    $queryParams = "?" . http_build_query([
        'service' => 'data',
        'version' => '2.0',
        'request' => 'GetFeature',
        'key' => $apiKey,
        'format' => 'json',
        'data' => 'LP_PA_CBND_BUBUN',
        'geomFilter' => $geomFilter,
        'geometry' => 'true',
        'attribute' => 'true',
        'crs' => $crs,
        'domain' => $domain
    ]);
    
    // echo $url.$queryParams;exit;
    
    return makeApiRequest($url, $queryParams);
}

// 건물 폴리곤
function getBuildingPolygon($apiKey, $geomFilter, $domain) {
    $url = "https://api.vworld.kr/req/data";
    $queryParams = "?" . http_build_query([
        'service' => 'data',
        'version' => '2.0',
        'request' => 'GetFeature',
        'key' => $apiKey,
        'format' => 'json',
        'data' => 'LT_C_BLDGINFO',
        'geomFilter' => $geomFilter,
        'geometry' => 'true',
        'attribute' => 'true',
        'crs' => 'EPSG:4326',
        'domain' => $domain
    ]);
    
    // echo $url.$queryParams;exit;
    
    return makeApiRequest($url, $queryParams);
}

// 건물집합정보 폴리곤
function getGisAggrBuildingWFS($apiKey, $pnu, $domain) {
    $url = "http://api.vworld.kr/ned/wfs/getGisAggrBuildingWFS";
    $queryParams = "?" . http_build_query([
        'key' => $apiKey,
        'domain' => $domain,
        'typename' => 'dt_d164',
        'pnu' => $pnu,
        'maxFeatures' => '100',
        'resultType' => 'results',
        'srsName' => 'EPSG:4326',
        'output' => 'application/json'
    ]);
    
    // echo $url.$queryParams;exit;
    
    return makeApiRequest($url, $queryParams);
}

// 건물일반정보 폴리곤
function getGisGnrlBuildingWFS($apiKey, $pnu, $domain) {
    $url = "http://api.vworld.kr/ned/wfs/getGisGnrlBuildingWFS";
    $queryParams = "?" . http_build_query([
        'key' => $apiKey,
        'domain' => $domain,
        'typename' => 'dt_d162',
        'pnu' => $pnu,
        'maxFeatures' => '100',
        'resultType' => 'results',
        'srsName' => 'EPSG:4326',
        'output' => 'application/json'
    ]);
    
    // echo $url.$queryParams;exit;
    
    return makeApiRequest($url, $queryParams);
}

// 건물통합정보 폴리곤
function getBldgisSpceWFS($apiKey, $pnu, $domain) {
    $url = "http://api.vworld.kr/ned/wfs/getBldgisSpceWFS";
    $queryParams = "?" . http_build_query([
        'key' => $apiKey,
        'domain' => $domain,
        'typename' => 'dt_d010',
        'pnu' => $pnu,
        'maxFeatures' => '100',
        'resultType' => 'results',
        'srsName' => 'EPSG:4326',
        'output' => 'application/json'
    ]);
    
    // echo $url.$queryParams;exit;
    
    return makeApiRequest($url, $queryParams);
}


// 예제 사용: POST 데이터를 받아와서 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // VWorld API 요청
    $apiKey = $_ENV['vworld_key'];
    $serviceKey = $_ENV['public_data_key'];
    $domain = $_ENV['domain'];

    // POST로 전달된 geomFilter 및 기타 필요한 값들 처리
    $geomFilter = isset($_POST['geomFilter']) ? $_POST['geomFilter'] : '';
    $geometry = isset($_POST['geometry']) ? $_POST['geometry'] : 'true';
    $attribute = isset($_POST['attribute']) ? $_POST['attribute'] : 'true';
    $crs = 'EPSG:4326';
    
    // 지적도 폴리곤 요청
    $landPolygonData = getLandPolygon($apiKey, $geomFilter, $domain, $crs);

    // $landPolygonData = json_decode($landPolygonResponse, true);

    if (isset($landPolygonData['response']['status']) && $landPolygonData['response']['status'] === 'OK') {
        // 지적도 응답에서 좌표 추출 및 WKT 형식 변환
        // $bbox = $landPolygonData['response']['result']['featureCollection']['bbox'];
        $pnu = $landPolygonData['response']['result']['featureCollection']['features'][0]['properties']['pnu'];
        $polygonCoordinates = $landPolygonData['response']['result']['featureCollection']['features'][0]['geometry']['coordinates'];
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

        // 건물 폴리곤 요청
        // $buildingPolygonResponse = getBuildingPolygon($apiKey, $wktPolygon, $domain);
        $getBldgisSpceWFS = getBldgisSpceWFS($apiKey, $pnu, $domain); // 건물통합정보
        $getGisAggrBuildingWFS = getGisAggrBuildingWFS($apiKey, $pnu, $domain); // 건물집합정보
        // $getGisGnrlBuildingWFS = getGisGnrlBuildingWFS($apiKey, $pnu, $domain); // 건물일반정보
        // $ecologyzmpWFS = getEcologyzmpWFS($serviceKey, $bbox, $pnu);
        // $buildingPolygonData = json_decode($buildingPolygonResponse, true);

        // 최종 결과 처리
        $response_array['landPolygon'] = $landPolygonData;
        $response_array['buildingPolygon'] = $getBldgisSpceWFS;
        $response_array['buildingPolygon2'] = $getGisAggrBuildingWFS;
        // $response_array = $buildingPolygonResponse;
    } else {
        $response_array['error'] = 'Failed to retrieve land polygon data';
    }



    // 결과를 클라이언트로 반환합니다.
    header('Content-Type: application/json');
    echo json_encode($response_array);
}
