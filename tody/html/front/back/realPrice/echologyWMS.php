<?php
// 클라이언트의 요청 중단을 감지하고 처리할 수 있도록 설정
ignore_user_abort(false); // 클라이언트가 연결을 중단해도 스크립트를 계속 실행하도록 설정 (false로 설정하면 요청 중단 시 PHP도 중단됨)

// CORS 허용 (필요할 경우 도메인을 제한할 수 있음)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// 출력 버퍼링 시작
// ob_start();

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

$response_array = array();

// 생태자연도WMS
function getEcologyzmpWMS($serviceKey, $bbox, $width, $height) {
    $bbox = $bbox[0]. ",".$bbox[1]. ",".$bbox[2]. ",".$bbox[3];
    // echo $bbox;exit;
    
    // API URL 및 쿼리 파라미터 설정
    $url = "http://apis.data.go.kr/B553084/ecoapi/EcologyzmpService/wms/getEcologyzmpWMS";
    // $url = "http://www.nie-ecobank.kr/ecoapi/EcologyzmpService/wms/getEcologyzmpWMS";
    $queryParams = "?" . http_build_query([
        'serviceKey' => $serviceKey,
        'layers' => 'tbl_opn_eczm',
        'srs' => 'EPSG:5186',
        'bbox' => $bbox,
        'width' => $width,
        'height' => $height,
        'format' => 'png',
        'transparent' => 'true',
        // 'bgcolor' => '0xFFFFFF',
        'exceptions' => 'BLANK', // 예외 처리 방법 BLANK: 빈 이미지, XML: 에러 코드
        // 'SG_APIM' => '2ug8Dm9qNBfD32JLZGPN64f3EoTlkpD8kSOHWfXpyrY'
    ]);
    // print_r($bbox);exit;
    // echo $url.$queryParams;exit;
    
    $retryCount = 3; // 재시도 횟수
    $retryDelay = 2; // 재시도 전 대기 시간 (초 단위)
    $response = false;

    while ($retryCount > 0) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url . $queryParams);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch, CURLOPT_HEADER, FALSE);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
        curl_setopt($ch, CURLOPT_TIMEOUT, value: 2); // 요청 타임아웃 설정 (초 단위)
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE); 

        $response = curl_exec($ch);

        // curl 에러를 확인
        if (curl_errno($ch)) {
            $error_msg = curl_error($ch);
            curl_close($ch);

            // 로그에 에러 출력 (필요시)
            error_log("CURL Error: $error_msg. Remaining retry attempts: $retryCount");

            // 재시도 전에 대기
            sleep($retryDelay);
            $retryCount--; // 재시도 횟수 감소
        } else {
            // 응답이 성공적으로 도착하면 루프 종료
            curl_close($ch);
            break;
        }
    }


    // $ch = curl_init();
    // curl_setopt($ch, CURLOPT_URL, $url . $queryParams);
    // curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    // curl_setopt($ch, CURLOPT_HEADER, FALSE);
    // curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
    // curl_setopt($ch, CURLOPT_TIMEOUT, value: 10); // 요청 타임아웃 설정 (초 단위)

    // 리디렉션을 따르도록 설정
    // curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE); 

    // 응답 실행
    // $response = curl_exec($ch);
    // curl_close($ch); // curl 세션 종료
    // echo $response;exit;
    return $response;
}

// 예제 사용: POST 데이터를 받아와서 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // VWorld API 요청
    $apiKey = $_ENV['vworld_key'];
    $serviceKey = $_ENV['public_data_key'];
    $domain = $_ENV['domain'];

    // POST로 전달된 geomFilter 및 기타 필요한 값들 처리
    $bbox = isset($_POST['bbox']) ? json_decode($_POST['bbox'], true) : '';
    $width = isset($_POST['width']) ? json_decode($_POST['width'], true) : '';
    $height = isset($_POST['height']) ? json_decode($_POST['height'], true) : '';
    // print_r($bbox);exit;

    if ($bbox) {
        // 클라이언트 요청이 중단되었는지 확인
        if (connection_aborted()) {
            exit('클라이언트가 연결을 중단했습니다.');
        }

        // 생태자연도 WMS 요청
        $wmsImage = getEcologyzmpWMS($serviceKey, $bbox, $width, $height);

        // WMS 이미지 응답이 정상일 경우
        if ($wmsImage !== false) {
            // 이미지 형식으로 Content-Type 설정
            header('Content-Type: image/png');
            echo $wmsImage;
            exit(); // 스크립트 종료
        } else {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Failed to fetch WMS image']);
            exit(); // 스크립트 종료
        }
    } else {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid BBOX']);
        exit(); // 스크립트 종료
    }

}
