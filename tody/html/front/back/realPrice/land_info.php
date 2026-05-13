<?php
// CORS 허용 (필요할 경우 도메인을 제한할 수 있음)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
// include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/realPrice/land_characteristics.php');

// 지적도 API 요청
function getLandPnuFromVWorld($service, $version, $request, $apiKey, $format, $landData, $geomFilter, $geometry, $attribute, $crs, $domain) {
    $apiUrl = "https://api.vworld.kr/req/data";
    
    $queryParams = "?service=" . urlencode($service);
    $queryParams .= "&version=" . urlencode($version);
    $queryParams .= "&request=" . urlencode($request);
    $queryParams .= "&key=" . urlencode($apiKey);
    $queryParams .= "&format=" . urlencode($format);
    $queryParams .= "&data=" . urlencode($landData);
    $queryParams .= "&geomFilter=" . urlencode($geomFilter);
    $queryParams .= "&geometry=" . urlencode($geometry);
    $queryParams .= "&attribute=" . urlencode($attribute);
    // $queryParams .= "&buffer=" . urlencode($buffer); // 필요 시 사용
    $queryParams .= "&crs=" . urlencode($crs);
    $queryParams .= "&domain=" . urlencode($domain);

    // API 요청 및 응답 처리
    $responseData = makeApiRequest($apiUrl, $queryParams);

    return $responseData;
}

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

// VWorld API 요청
$apiKey = $_ENV['vworld_key'];
$domain = $_ENV['domain'];
$service = "data";
$version = "2.0";
$request = "GetFeature";
$format = "json";
$landData = "LP_PA_CBND_BUBUN";
$buildData = "LT_C_BLDGINFO";
$geomFilter = isset($_POST['geomFilter']) ? ($_POST['geomFilter']) : ''; // URL 인코딩
$geometry = isset($_POST['geometry']) ? $_POST['geometry'] : 'true';
$attribute = isset($_POST['attribute']) ? $_POST['attribute'] : 'true';
$buffer = '0';
$crs = "EPSG:4326";

$response = getLandPnuFromVWorld($service, $version, $request, $apiKey, $format, $landData, $geomFilter, $geometry, $attribute, $crs, $domain);
echo json_encode($response);
exit;

// // PNU 코드 추출
// if (isset($response['response']['result']['featureCollection']['features'][0]['properties']['pnu'])) {
//     $pnuCd = $response['response']['result']['featureCollection']['features'][0]['properties']['pnu'];
// } else {
//     echo null;
//     exit;
// }

// $landInfoArray = getLandData($pnuCd);
// $landInfoArray['features'] = $response;


// echo json_encode($landInfoArray);

################################
# 건축물대장
// $apiUrl = "https://api.vworld.kr/req/data";
// $apiUrl .= "?service={$service}";
// $apiUrl .= "&version={$version}";
// $apiUrl .= "&request={$request}";
// $apiUrl .= "&key={$apiKey}";
// $apiUrl .= "&format={$format}";
// $apiUrl .= "&data={$buildData}";
// $apiUrl .= "&geomFilter={$geomFilter}";
// $apiUrl .= "&geometry={$geometry}";
// $apiUrl .= "&attribute={$attribute}";
// $apiUrl .= "&crs={$crs}";
// $apiUrl .= "&domain={$domain}";

// // API 요청을 보내고 결과를 가져옵니다.
// $response = file_get_contents($apiUrl);
// $responseData = json_decode($response, true);

// // $responseData 구조 확인을 위한 디버깅 출력 (디버깅 후 삭제)
// // print_r($responseData); 
// // exit;

// // 배열 구조 확인 및 데이터 처리
// if ($responseData['response']['status'] == 'OK') {
//     $features = $responseData['response']['result']['featureCollection']['features'];

//     if (!empty($features)) {
//         // 건축물대장 정보가 있는 경우, geomFilter 값을 MULTIPOLYGON으로 변경
//         $coordinates = $features[0]['geometry']['coordinates']; // 좌표 배열 가져오기

//         // 좌표가 배열 형태인지 확인하고 처리
//         if (is_array($coordinates) && isset($coordinates[0][0])) {
//             // MULTIPOLYGON 형식으로 좌표를 구성
//             $polygonParts = [];
//             foreach ($coordinates as $polygon) {
//                 $coordString = implode(", ", array_map(function($coord) {
//                     return "{$coord[0]} {$coord[1]}";
//                 }, $polygon[0])); // $polygon[0]은 각 폴리곤의 외곽 경계
//                 $polygonParts[] = "(($coordString))";
//             }
//             // $geomFilter = urlencode("MULTIPOLYGON(" . implode(", ", $polygonParts) . ")");

//         } else {
//             // 좌표 데이터가 예상된 형식이 아닐 때의 처리
//             exit("Unexpected coordinates format: " . print_r($coordinates, true));
//         }
//     }
// } 

// exit($geomFilter);
// $geomFilter = 'MULTIPOLYGON(((127.4890697606227 37.49135536436228, 127.4889669678922 37.4913019452454, 127.48895550805793 37.49131677779916, 127.48885894384257 37.49127000923895, 127.48883531325963 37.49129816359095, 127.4888415302052 37.49133612375739, 127.48901671362076 37.49142613090488, 127.4890697606227 37.49135536436228)))';

// ################################
// # 지적도
// $apiUrl = "https://api.vworld.kr/req/data";
// $apiUrl .= "?service={$service}";
// $apiUrl .= "&version={$version}";
// $apiUrl .= "&request={$request}";
// $apiUrl .= "&key={$apiKey}";
// $apiUrl .= "&format={$format}";
// $apiUrl .= "&data={$landData}";
// $apiUrl .= "&geomFilter={$geomFilter}";
// $apiUrl .= "&geometry={$geometry}";
// $apiUrl .= "&attribute={$attribute}";
// // $apiUrl .= "&buffer={$buffer}";
// $apiUrl .= "&crs={$crs}";
// $apiUrl .= "&domain=" . urlencode($domain);

// // echo $apiUrl;exit;

// // API 요청을 보내고 결과를 가져옵니다.
// $response = file_get_contents($apiUrl);

// // JSON 응답을 배열로 변환
// $responseData = json_decode($response, true);

// // PNU 코드 추출
// if (isset($responseData['response']) && isset($responseData['result']["featureCollection"]["features"][0]['properties']['pnu'])) {
//     $pnuCd = $responseData['result']["featureCollection"]["features"][0]['properties']['pnu'];
//     return $pnuCd;
// }


// echo $pnuCd['response'];exit;

// $pnuCd = $response['result']["featureCollection"]["features"][0]['properties']['pnu'];
// echo $pnuCd;exit;

// // 결과를 클라이언트로 반환합니다.
// header('Content-Type: application/json');
// echo $response;