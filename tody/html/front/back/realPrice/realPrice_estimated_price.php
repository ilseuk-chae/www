<?php
// ai 추정가 계산
// CORS 허용 (필요할 경우 도메인을 제한할 수 있음)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();


// 예제 사용: POST 데이터를 받아와서 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // VWorld API 요청
    $apiKey = $_ENV['vworld_key'];
    $domain = $_ENV['domain'];

    $type = isset($_POST['type']) ? urldecode($_POST['type']) : '';
    $floor = isset($_POST['floor']) ? urldecode($_POST['floor']) : '';
    $excluUseAr = isset($_POST['excluUseAr']) ? urldecode($_POST['excluUseAr']) : '';
    $dealArea = isset($_POST['dealArea']) ? urldecode($_POST['dealArea']) : ''; // 토지일 때, 거래면적
    $dongNm = isset($_POST['dongNm']) ? urldecode($_POST['dongNm']) : '';
    $pnu = isset($_POST['pnu']) ? urldecode($_POST['pnu']) : '';
    $dealAmount = isset($_POST['dealAmount']) ? urldecode($_POST['dealAmount']) : '';
    $dealYear = isset($_POST['dealYear']) ? urldecode($_POST['dealYear']) : '';

    // 결과 배열 초기화
    $response_array = [];
    $filtered_results = [];

    // 공시가격 데이터를 가져올 함수 선택
    if ($type === 'land') {
        // 개별공시지가 조회 -- 마지막 거래년도 기준
        $lastYearData = getIndvdLandPriceAttr($apiKey, $domain, $pnu, $dealYear);
        if (!isset($lastYearData['indvdLandPrices']['field'])) {
            $lastYearData = getIndvdLandPriceAttr($apiKey, $domain, $pnu, $dealYear - 1);
        }
        $field = removeDuplicates($lastYearData['indvdLandPrices']['field'] ?? []);
        // 기준일자 최신순 내림차순 정렬
        usort($field, function($a, $b) {
            return strcmp($b['lastUpdtDt'], $a['lastUpdtDt']);
        });
        // 가격/m2 이므로 면적 곱해줌
        $averagePrice = isset($field[0]['pblntfPclnd']) ? (float)$field[0]['pblntfPclnd'] * $dealArea : 0;

        // 최신(올해 또는 작년) 공시지가 조회
        $currentYearData = getIndvdLandPriceAttr($apiKey, $domain, $pnu, date('Y'));
        if (!isset($currentYearData['indvdLandPrices']['field'])) {
            $currentYearData = getIndvdLandPriceAttr($apiKey, $domain, $pnu, date('Y') - 1);
        }
        $field = removeDuplicates($currentYearData['indvdLandPrices']['field'] ?? []);

        usort($field, function($a, $b) {
            return strcmp($b['lastUpdtDt'], $a['lastUpdtDt']);
        });
        $currentAveragePrice = isset($field[0]['pblntfPclnd']) ? (float)$field[0]['pblntfPclnd'] * $dealArea : 0;

    } else {
        // 공동주택가격 조회 및 공시가격 평균 계산
        $lastYearData = getApartHousingPriceAttr($apiKey, $domain, $pnu, $dealYear, $dongNm);
        if (!isset($lastYearData['apartHousingPrices']['field'])) {
            $lastYearData = getApartHousingPriceAttr($apiKey, $domain, $pnu, $dealYear - 1, $dongNm);
        }
        $field = removeDuplicates($lastYearData['apartHousingPrices']['field'] ?? []);

        // 필터링: floorNm이 floor와 같고, prvuseAr의 정수 부분이 excluUseAr의 정수 부분과 같은 데이터만 남김
        $filteredField = array_filter($field, function($item) use ($floor, $excluUseAr) {
            $prvuseArInt = (int) $item['prvuseAr']; // prvuseAr의 정수 부분
            $excluUseArInt = (int) $excluUseAr; // excluUseAr의 정수 부분
            return (int) $item['floorNm'] == (int) $floor && $prvuseArInt == $excluUseArInt;
        });
        // echo json_encode(($filteredField));exit;
        $averagePrice = calculateAveragePrice(['field' => $filteredField]); // 공시가격 평균

        // 최신(올해 또는 작년) 공동주택 공시가격 평균 계산
        $currentYearData = getApartHousingPriceAttr($apiKey, $domain, $pnu, date('Y'), $dongNm);
        if (!isset($currentYearData['apartHousingPrices']['field'])) {
            $currentYearData = getApartHousingPriceAttr($apiKey, $domain, $pnu, date('Y') - 1, $dongNm);
        }
        $currentField = removeDuplicates($currentYearData['apartHousingPrices']['field'] ?? []);

        // 필터링: floorNm이 floor와 같고, prvuseAr의 정수 부분이 excluUseAr의 정수 부분과 같은 데이터만 남김
        $currentFilteredField = array_filter($currentField, function($item) use ($floor, $excluUseAr) {
            $prvuseArInt = (int) $item['prvuseAr']; // prvuseAr의 정수 부분
            $excluUseArInt = (int) $excluUseAr; // excluUseAr의 정수 부분
            return (int) $item['floorNm'] == (int) $floor && $prvuseArInt == $excluUseArInt;
        });
        // echo json_encode(($filteredField));exit;
        $currentAveragePrice = calculateAveragePrice(['field' => $currentFilteredField]);
   
    }

    // dealAmount와 평균 공시가격의 퍼센트 차이 계산
    $percentageDifference = calculatePercentageDifference($dealAmount, $averagePrice);
    
    // 현재 연도 또는 작년 공시가격 평균에 퍼센트 차이를 적용하여 추정 값 계산
    $adjustedEstimatedPrice = $currentAveragePrice * (1 + ($percentageDifference / 100));
    
    // 최종 추정값을 만원 단위로 반올림
    $adjustedEstimatedPriceRounded = round($adjustedEstimatedPrice, -4);

    // echo "실거래가: " . $dealAmount . "0000원<br>";
    // echo "공시가격 평균: " . round($averagePrice, 2) . "원<br>";
    // echo "실거래가와 공시가격 평균의 퍼센트 차이: " . round($percentageDifference, 2) . "%<br>";
    // echo "현재 연도 또는 작년의 공시가격 평균: " . round($currentAveragePrice, 2) . "원<br>";
    // echo "퍼센트 차이를 적용한 최종 추정값 (만원 단위로 반올림): " . round($adjustedEstimatedPriceRounded) . "원<br>";

    $response_array['estimated_price'] = round($adjustedEstimatedPriceRounded / 10000);
    responseApi(200, 'SUCCESS', $response_array);
    
    exit;


    // 현재 연도 기준으로 최근 3년을 반복
    // for ($i = 0; $i < 3; $i++) {
    //     $stdrYear = date("Y") - $i; // 현재 연도에서 차감
    //     $result = getApartHousingPriceAttr($apiKey, $domain, $pnu, $stdrYear, $dongNm);
    //     echo json_encode($result);exit;
    //     if (isset($result['apartHousingPrices']['field'])) {
    //         // floor와 excluUseAr 값으로 필터링
    //         $filtered_data = array_filter($result['apartHousingPrices']['field'], function($item) use ($floor, $excluUseAr) {
    //             return $item['floorNm'] == $floor && $item['prvuseAr'] == $excluUseAr;
    //         });
    
    //         // lastUpdtDt 내림차순으로 정렬
    //         usort($filtered_data, function($a, $b) {
    //             return strcmp($b['lastUpdtDt'], $a['lastUpdtDt']);
    //         });
    
    //         // 정렬된 데이터 중 첫 번째 항목의 pblntfPc 값을 가져옴
    //         if (!empty($filtered_data)) {
    //             // $filtered_results[$stdrYear] = $filtered_data[0]['pblntfPc'];
    //             $filtered_results[$stdrYear] = $filtered_data[0]['pblntfPc'];
    //         }
    //     }
    // }

    // // 추정가를 일단 실거래가와 동일하게 설정
    // $estimated_price = $dealAmount;

    // // 공시지가 값이 2개 이상 존재하는 경우 백분율 차이를 계산
    // if (count($filtered_results) >= 2 && is_numeric(str_replace(',', '', $dealAmount))) {
    //     $recent_values = array_values($filtered_results);

    //     // 가장 최근 두 개의 공시지가 값에서 콤마 제거 후 숫자로 변환
    //     $latest_pblntfPc = is_numeric(str_replace(',', '', $recent_values[0])) ? (float)str_replace(',', '', $recent_values[0]) : 0;
    //     $previous_pblntfPc = is_numeric(str_replace(',', '', $recent_values[1])) ? (float)str_replace(',', '', $recent_values[1]) : 0;

    //     // 유효한 숫자 값이 있을 때만 백분율 차이 계산
    //     if ($latest_pblntfPc > 0 && $previous_pblntfPc > 0) {
    //         // 백분율 차이 계산
    //         $percentage_change = ($latest_pblntfPc - $previous_pblntfPc) / $previous_pblntfPc;

    //         // dealAmount 백분율 차이 적용
    //         $clean_dealAmount = (float)str_replace(',', '', $dealAmount); // 콤마 제거 후 숫자로 변환
    //         $estimated_price = $clean_dealAmount * (1 + $percentage_change);
    //         $estimated_price = round($estimated_price, 0);
    //     } 
    // } 

    // $response_array['estimated_price'] = $estimated_price;

    // // 결과 출력
    // responseApi(200, 'SUCCESS', $response_array);
}

/**
 * 공동주택가격속성조회 함수
 * @param mixed $apiKey
 * @param mixed $domain
 * @param mixed $pnu
 * @param mixed $stdrYear
 * @param mixed $dongNm
 * @param mixed $hoNm
 * @return mixed
 */
function getApartHousingPriceAttr($apiKey,  $domain, $pnu, $stdrYear, $dongNm) {
    $url = "https://api.vworld.kr/ned/data/getApartHousingPriceAttr";
    $queryParams = "?" . http_build_query([
        'pnu' => $pnu,
        'stdrYear' => $stdrYear,
        'dongNm' => $dongNm,
        'format' => 'json',
        'numOfRows' => '1000',
        'pageNo' => '1',
        'key' => $apiKey,
        'domain' => $domain
    ]);
    
    // echo $url.$queryParams;exit;
    
    return makeApiRequest($url, $queryParams);
}


/**
 * 개별공시지가조회 함수
 * @param mixed $apiKey
 * @param mixed $domain
 * @param mixed $pnu
 * @param mixed $stdrYear
 * @return mixed
 */
function getIndvdLandPriceAttr($apiKey,  $domain, $pnu, $stdrYear) {
    $url = "https://api.vworld.kr/ned/data/getIndvdLandPriceAttr";
    $queryParams = "?" . http_build_query([
        'pnu' => $pnu,
        'stdrYear' => $stdrYear,
        'format' => 'json',
        'numOfRows' => '1000',
        'pageNo' => '1',
        'key' => $apiKey,
        'domain' => $domain
    ]);
    
    // echo $url.$queryParams;exit;
    
    return makeApiRequest($url, $queryParams);
}



// 중복 제거 함수
function removeDuplicates($array) {
    // 각 항목의 속성을 직렬화하여 고유 키 생성
    $uniqueArray = array_map('serialize', $array);
    // 중복 제거 후 역직렬화하여 원래 배열로 복구
    $uniqueArray = array_unique($uniqueArray);
    return array_map('unserialize', $uniqueArray);
}

// 공시가격의 평균을 계산하는 함수
function calculateAveragePrice($data) {
    $totalPrice = 0;
    $count = 0;

    if (isset($data['field'])) {
        foreach ($data['field'] as $item) {
            if (isset($item['pblntfPc'])) {
                $totalPrice += (float)$item['pblntfPc'];
                $count++;
            }
        }
    }
    return $count > 0 ? $totalPrice / $count : 0;
}

// 퍼센트 차이 계산 함수
function calculatePercentageDifference($dealAmount, $averagePrice) {
    // 콤마 제거 및 숫자로 변환
    $dealAmount = is_numeric(str_replace(',', '', $dealAmount)) ? (float)str_replace(',', '', $dealAmount) : 0;
    $averagePrice = is_numeric(str_replace(',', '', $averagePrice)) ? (float)str_replace(',', '', $averagePrice) : 0;

    // 퍼센트 차이 계산
    return $averagePrice > 0 ? (($dealAmount * 10000 - $averagePrice) / $averagePrice) * 100 : 0;
}