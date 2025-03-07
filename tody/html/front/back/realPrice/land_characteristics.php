<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set('display_errors', '1');

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

function getLandCharacteristics($pnu, $year = "2024") {
    $serviceKey = $_ENV['vworld_key'];
    $domain = $_ENV['domain'];

    $url = "http://api.vworld.kr/ned/data/getLandCharacteristics";
    $queryParams = "?" . http_build_query([
        'key' => $serviceKey,
        'domain' => $domain,
        'pnu' => $pnu,
        'stdrYear' => $year,
        'json' => 'json',
        'numOfRows' => '20',
        'pageNo' => '1'
    ]);

    return makeApiRequest($url, $queryParams);
}

function getLandCharacteristicsWFS($pnu) {
    $serviceKey = $_ENV['vworld_key'];
    $domain = $_ENV['domain'];

    $url = "http://api.vworld.kr/ned/wfs/getLandCharacteristicsWFS";
    $queryParams = "?" . http_build_query([
        'typename' => 'dt_d194',
        'pnu' => $pnu,
        'srsName' => 'EPSG:4326',
        'output' => 'application/json',
        'key' => $serviceKey,
        'domain' => $domain,
    ]);

    return makeApiRequest($url, $queryParams);
}

function getIndvdLandPrices($pnu) {
    $serviceKey = $_ENV['vworld_key'];
    $domain = $_ENV['domain'];

    $url = "http://api.vworld.kr/ned/data/getIndvdLandPriceAttr";
    $queryParams = "?" . http_build_query([
        'key' => $serviceKey,
        'domain' => $domain,
        'pnu' => $pnu,
        // 'stdrYear' => $year,
        'json' => 'json',
        'numOfRows' => '100',
        'pageNo' => '1'
    ]);

    return makeApiRequest($url, $queryParams);
}


function getLandData($pnu) {
    $response_array = [];

    // 토지특성속성조회
    $landCharacteristics = getLandCharacteristics($pnu);
    if (isset($landCharacteristics['landCharacteristicss']['field'])) {
        $response_array['landCharacteristicss'] = $landCharacteristics['landCharacteristicss']['field'];
    } else {
        $landCharacteristicsWFS = getLandCharacteristicsWFS($pnu);
        if (isset($landCharacteristicsWFS['features'][0]['properties'])) {
            $response_array['landCharacteristicss'] = $landCharacteristicsWFS['features'][0]['properties'];
        }
    }

    // 개별공시지가속성조회
    $indvdLandPrices = getIndvdLandPrices($pnu);
    if (isset($indvdLandPrices['indvdLandPrices']['field'])) {
        $response_array['indvdLandPrices'] = $indvdLandPrices['indvdLandPrices']['field'];
    }

    return $response_array;
}

// 예제 사용: POST 데이터를 받아와서 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pnuCd = urldecode($_POST['pnu']);
    $response = getLandData($pnuCd);
    echo json_encode($response);
}

// // $pnuCd = '116501080011333';
// // $pnuCd = '4113511000005410000';
// $domain = $_ENV['domain'];
// $response_array = array();

// // echo $pnuCd;
// // exit;

// /* PHP 샘플 코드 */
// $serviceKey = $_ENV['vworld_key'];


// =================================================================================================
/* 토지특성속성조회 */
// $ch = curl_init();
// $url = "http://api.vworld.kr/ned/data/getLandCharacteristics"; /*URL*/
// $queryParams = "?" . urlencode("key") . "=" . $serviceKey; /*key*/
// $queryParams .= "&" . urlencode("domain") . "=" . $domain; /*domain*/
// $queryParams .= "&" . urlencode("pnu") . "=" . urlencode($pnuCd); /* 고유번호(8자리 이상) */
// $queryParams .= "&" . urlencode("stdrYear") . "=" . urlencode("2024"); /* 기준연도(YYYY: 4자리) */
// $queryParams .= "&" . urlencode("json") . "=" . urlencode("json"); /* 응답결과 형식(xml 또는 json) */
// $queryParams .= "&" . urlencode("numOfRows") . "=" . urlencode("20"); /* 검색건수 (최대 1000) */
// $queryParams .= "&" . urlencode("pageNo") . "=" . urlencode("1"); /* 페이지 번호 */


// curl_setopt($ch, CURLOPT_URL, $url . $queryParams);
// curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
// curl_setopt($ch, CURLOPT_HEADER, FALSE);
// curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
// curl_setopt($ch, CURLOPT_TIMEOUT, 5); // 요청 타임아웃 설정 (초 단위)
// $response = curl_exec($ch);
// curl_close($ch);
// // echo $response;
// // exit;

// $responseData = json_decode($response, true); // JSON 문자열을 PHP 배열로 변환


// // 응답 데이터를 확인하고 적절하게 처리
// if (isset($responseData['landCharacteristicss'])) {
//     $response_array['landCharacteristicss'] = $responseData['landCharacteristicss']['field'];
//     // $response_array['landCharacteristicss'] = end($responseData['landCharacteristicss']['field']);
// }


//  =================================================================================================
/* 토지소유정보속성조회 */
// $ch = curl_init();
// $url = "http://api.vworld.kr/ned/data/getPossessionAttr"; /*URL*/
// // $url = "http://api.vworld.kr/ned/data/ladfrlList"; /*URL*/
// $queryParams = "?" . urlencode("key") . "=" . $serviceKey; /*key*/
// $queryParams .= "&" . urlencode("domain") . "=" . $domain; /*domain*/
// $queryParams .= "&" . urlencode("pnu") . "=" . urlencode($pnuCd); /* 고유번호(8자리 이상) */
// $queryParams .= "&" . urlencode("json") . "=" . urlencode("json"); /* 응답결과 형식(xml 또는 json) */
// // $queryParams .= "&" . urlencode("numOfRows") . "=" . urlencode("1"); /* 검색건수 (최대 1000) */
// // $queryParams .= "&" . urlencode("pageNo") . "=" . urlencode("1"); /* 페이지 번호 */


// curl_setopt($ch, CURLOPT_URL, $url . $queryParams);
// curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
// curl_setopt($ch, CURLOPT_HEADER, FALSE);
// curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
// curl_setopt($ch, CURLOPT_TIMEOUT, 5); // 요청 타임아웃 설정 (초 단위)
// $response = curl_exec($ch);
// curl_close($ch);
// // echo $response;
// // exit;

// // $response_array = array();
// $responseData = json_decode($response, true); // JSON 문자열을 PHP 배열로 변환


// // 응답 데이터를 확인하고 적절하게 처리
// if (isset($responseData['possessions']['field'][0])) {
//     $possessions = $responseData['possessions']['field'];
//     $response_array['possessions'] = $possessions;
//     // foreach ($responseData['possessions']['field'][0] as $key => $value) {
//     //     $response_array[$key] = $value;
//     // }
// }


//  =================================================================================================
/* 토지이용계획속성조회 */
// $ch = curl_init();
// $url = "http://api.vworld.kr/ned/data/getLandUseAttr"; /*URL*/
// $queryParams = "?" . urlencode("key") . "=" . $serviceKey; /*key*/
// $queryParams .= "&" . urlencode("domain") . "=" . $domain; /*domain*/
// $queryParams .= "&" . urlencode("pnu") . "=" . urlencode($pnuCd); /* 고유번호(8자리 이상) */
// // $queryParams .= "&" . urlencode("cnflcAt") . "=" . urlencode("1"); /* 저촉여부코드(1:포함,2:저촉,3:접합) */  
// // $queryParams .= "&" . urlencode("prposAreaDstrcCodeNm") . "=" . urlencode("아파트지구"); /* 용도지역지구명 */  
// $queryParams .= "&" . urlencode("json") . "=" . urlencode("json"); /* 응답결과 형식(xml 또는 json) */
// $queryParams .= "&" . urlencode("numOfRows") . "=" . urlencode("100"); /* 검색건수 (최대 1000) */
// $queryParams .= "&" . urlencode("pageNo") . "=" . urlencode("1"); /* 페이지 번호 */


// curl_setopt($ch, CURLOPT_URL, $url . $queryParams);
// curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
// curl_setopt($ch, CURLOPT_HEADER, FALSE);
// curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
// curl_setopt($ch, CURLOPT_TIMEOUT, 5); // 요청 타임아웃 설정 (초 단위)
// $response = curl_exec($ch);
// curl_close($ch);
// // echo $response;
// // exit;

// // $response_array = array();
// $responseData = json_decode($response, true); // JSON 문자열을 PHP 배열로 변환


// // 응답 데이터를 확인하고 적절하게 처리
// if (isset($responseData['landUses']['field'][0])) {
//     $landUses = $responseData['landUses']['field'];
//     $response_array['landUses'] = $landUses;
// }


//  =================================================================================================
/* 개별공시지가속성조회 */
// $ch = curl_init();
// $url = "http://api.vworld.kr/ned/data/getIndvdLandPriceAttr"; /*URL*/
// // $url = "http://api.vworld.kr/ned/data/ladfrlList"; /*URL*/
// $queryParams = "?" . urlencode("key") . "=" . $serviceKey; /*key*/
// $queryParams .= "&" . urlencode("domain") . "=" . $domain; /*domain*/
// $queryParams .= "&" . urlencode("pnu") . "=" . urlencode($pnuCd); /* 고유번호(8자리 이상) */
// $queryParams .= "&" . urlencode("stdrYear") . "=" . urlencode("2024"); /* 기준연도(YYYY: 4자리) */  
// $queryParams .= "&" . urlencode("json") . "=" . urlencode("json"); /* 응답결과 형식(xml 또는 json) */
// $queryParams .= "&" . urlencode("numOfRows") . "=" . urlencode("100"); /* 검색건수 (최대 1000) */
// $queryParams .= "&" . urlencode("pageNo") . "=" . urlencode("1"); /* 페이지 번호 */


// curl_setopt($ch, CURLOPT_URL, $url . $queryParams);
// curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
// curl_setopt($ch, CURLOPT_HEADER, FALSE);
// curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
// curl_setopt($ch, CURLOPT_TIMEOUT, 5); // 요청 타임아웃 설정 (초 단위)
// $response = curl_exec($ch);
// curl_close($ch);
// // echo $response;
// // exit;

// // $response_array = array();
// $responseData = json_decode($response, true); // JSON 문자열을 PHP 배열로 변환


// // 응답 데이터를 확인하고 적절하게 처리
// if (isset($responseData['indvdLandPrices']['field'])) {
//     // $data = end($responseData['indvdLandPrices']['field']);
//     $data = $responseData['indvdLandPrices']['field'];
//     $response_array['indvdLandPrices'] = $data;
// }

// echo json_encode($response_array);
?>