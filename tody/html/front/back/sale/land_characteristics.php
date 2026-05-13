<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set('display_errors', '1');

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();


// 토지특성속성조회
function getLandCharacteristics($pnu, $year = "2024") {
    $serviceKey = $_ENV['vworld_key'];
    $domain = $_ENV['domain'];

    $url = "http://api.vworld.kr/ned/data/getLandCharacteristics";
    $queryParams = "?" . http_build_query([
        'pnu' => $pnu,
        'stdrYear' => $year,
        'format' => 'json',
        'numOfRows' => '20',
        'pageNo' => '1',
        'key' => $serviceKey,
        'domain' => $domain
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
        $response_array['landCharacteristicss'] = array();
    }

    return $response_array;
}

// 예제 사용: POST 데이터를 받아와서 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pnuCd = urldecode($_POST['pnu']);
    $response = getLandData($pnuCd);
    echo json_encode($response);
}


