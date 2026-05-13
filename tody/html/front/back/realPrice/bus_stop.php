<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set('display_errors', '1');

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

$response_array = array();


function getBusStop($lat, $lng) {
    $serviceKey = $_ENV['public_data_key'];

    $url = 'https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList'; /*URL*/
    $queryParams = "?" . http_build_query([
        'serviceKey' => $serviceKey,
        'gpsLati' => $lat,
        'gpsLong' => $lng,
        '_type' => 'json',
        'numOfRows' => '100',
        'pageNo' => '1'
    ]);
    // echo $url.$queryParams;exit;
    
    return makeApiRequest($url, $queryParams);
}


// 예제 사용: POST 데이터를 받아와서 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $lng = isset($_POST['lng']) ? $_POST['lng'] : '';
    $lat = isset($_POST['lat']) ? $_POST['lat'] : '';
    $response = getBusStop($lat, $lng);

    // 'response' 키가 있는지 확인
    if (isset($response['response']['body'])) {
        $response_array = $response['response']['body'];
    }

    echo json_encode($response_array);
}


