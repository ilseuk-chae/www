<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set('display_errors', '1');

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

// 건축물대장 표제부
function getBrTitleInfo($pnu) {
    $sigunguCd = substr($pnu, 0, 5); // PNU의 앞 5자리를 가져옴
    $bjdongCd = substr($pnu, 5, 5); // 그 다음 5자리를 법정동 코드로 사용
    $platGbCd = substr($pnu, 10, 1); // 11번째 자리를 대지구분 코드로 사용
    $bun = substr($pnu, 11, 4); // 12번째부터 4자리를 번으로 사용
    $ji = substr($pnu, 15, 4); // 16번째부터 4자리를 지로 사용

    $serviceKey = $_ENV['public_data_key'];

    $url = 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo'; /*URL*/
    $queryParams = "?" . http_build_query([
        'serviceKey' => $serviceKey,
        'sigunguCd' => $sigunguCd,
        'bjdongCd' => $bjdongCd,
        // 'platGbCd' => '0',
        'bun' => $bun,
        'ji' => $ji,
        '_type' => 'json',
        'numOfRows' => '100',
        'pageNo' => '1'
    ]);
    // echo $url.$queryParams;exit;
    
    return makeApiRequest($url, $queryParams);
}


// 건축물대장 총괄 표제부
function getBrRecapTitleInfo($pnu) {
    $sigunguCd = substr($pnu, 0, 5); // PNU의 앞 5자리를 가져옴
    $bjdongCd = substr($pnu, 5, 5); // 그 다음 5자리를 법정동 코드로 사용
    $platGbCd = substr($pnu, 10, 1); // 11번째 자리를 대지구분 코드로 사용
    $bun = substr($pnu, 11, 4); // 12번째부터 4자리를 번으로 사용
    $ji = substr($pnu, 15, 4); // 16번째부터 4자리를 지로 사용

    $serviceKey = $_ENV['public_data_key'];

    $url = 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrRecapTitleInfo'; /*URL*/
    $queryParams = "?" . http_build_query([
        'serviceKey' => $serviceKey,
        'sigunguCd' => $sigunguCd,
        'bjdongCd' => $bjdongCd,
        // 'platGbCd' => $platGbCd,
        'bun' => $bun,
        'ji' => $ji,
        '_type' => 'json',
        'numOfRows' => '100',
        'pageNo' => '1'
    ]);
    // echo $url.$queryParams;exit;
    
    return makeApiRequest($url, $queryParams);
}

function getBuildingData($pnu) {
    $response_array = [];

    // 건축물대장 표제부
    $brTitleInfo = getBrTitleInfo($pnu);
    if (isset($brTitleInfo['response'])) {
        // 'body' -> 'items' 구조를 확인하여 response_array에 저장
        if (isset($brTitleInfo['response']['body']['items'])) {
            $response_array['brTitleInfo'] = $brTitleInfo['response']['body']['items'];
        } 
    } else {
        // 'response'가 없을 때의 디버깅 출력
        $response_array['brTitleInfo'] = array();
    }

    // 건축물대장 총괄표제부
    $brRecapTitleInfo = getBrRecapTitleInfo($pnu);
    if (isset($brRecapTitleInfo['response'])) {
        // 'body' -> 'items' 구조를 확인하여 response_array에 저장
        if (isset($brRecapTitleInfo['response']['body']['items'])) {
            $response_array['brRecapTitleInfo'] = $brRecapTitleInfo['response']['body']['items'];
        } 
    } else {
        // 'response'가 없을 때의 디버깅 출력
        $response_array['brRecapTitleInfo'] = array();
    }

    return $response_array;
}

// 예제 사용: POST 데이터를 받아와서 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pnuCd = urldecode($_POST['pnu']);
    $response = getBuildingData($pnuCd);
    echo json_encode($response);
}


