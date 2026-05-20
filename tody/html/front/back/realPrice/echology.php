<?php
// CORS 허용 (필요할 경우 도메인을 제한할 수 있음)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// 출력 버퍼링 시작
ob_start();

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

$response_array = array();

/**
 * 지적도 폴리곤 가져오는 함수
 * @param mixed $apiKey
 * @param mixed $geomFilter
 * @param mixed $domain
 * @param mixed $crs
 * @return mixed
 */
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

/**
 * 생태자연도 속성 가져오는 함수
 * @param mixed $serviceKey
 * @param mixed $pnu
 * @return never
 */
function getEcologyzmpAttr($serviceKey, $pnu) {
    $emdCd = substr($pnu, 0, 8);

    // API URL 및 쿼리 파라미터 설정
    $url = "http://apis.data.go.kr/B553084/ecoapi/EcologyzmpService/attr/getEcologyzmpAttr";
    $queryParams = "?" . http_build_query([
        'type' => 'json',
        'serviceKey' => $serviceKey,
        'pageNo' => '1',
        'numOfRows' => '1000',
        'eczmGr' => '2',
        // 'typeName' => 'tbl_opn_eczm',
        'emdCd' => $emdCd
    ]);
    // echo $url.$queryParams;exit;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url . $queryParams);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_HEADER, FALSE);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
    curl_setopt($ch, CURLOPT_TIMEOUT, 7); // 요청 타임아웃 설정 (초 단위)

    // 리디렉션을 따르도록 설정
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE); 

    // 응답 실행
    $response = curl_exec($ch);
    echo $response;exit;
    // HTTP 상태 코드 및 응답 형식 검사
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    
    // cURL 세션 닫기
    curl_close($ch);
    // 응답 확인
    if ($response === false || $httpCode != 200) {
        echo "Error: HTTP Code $httpCode, Response: " . print_r($response, true);
        return false; // 요청 실패 시 false 반환
    }

    // 응답 결과 출력 (디버깅용)
    // echo "Response Content-Type: $contentType\n";
    return $response;

}

function convertXmlToJson($xmlString) {
    // XML 문자열을 SimpleXMLElement 객체로 변환
    $xml = simplexml_load_string($xmlString, 'SimpleXMLElement', LIBXML_NOCDATA);
    
    // SimpleXMLElement 객체를 JSON으로 변환하기 위해 배열로 변환
    $json = json_encode($xml);
    
    // JSON 문자열 반환
    return $json;
}

/**
 * 생태자연도 WFS 가져오는 함수
 * @param mixed $serviceKey
 * @param mixed $bbox
 * @param mixed $pnu
 * @param mixed $eczmGr
 * @return bool|string
 */
function getEcologyzmpWFS($serviceKey, $bbox, $pnu, $eczmGr) {
    $emdCd = substr($pnu, 0, 8);

    // bbox 정렬 (하단 좌표: lc1, lc2 / 상단 좌표: uc1, uc2)
    // $lc1 = min($bbox[0], $bbox[2]); // 최소 경도
    // $lc2 = min($bbox[1], $bbox[3]); // 최소 위도
    // $uc1 = max($bbox[0], $bbox[2]); // 최대 경도
    // $uc2 = max($bbox[1], $bbox[3]); // 최대 위도

    // 정렬된 bbox를 문자열로 변환

    if ($eczmGr != '3') {
        // API URL 및 쿼리 파라미터 설정
        $bbox = $bbox[0]. ",".$bbox[1]. ",".$bbox[2]. ",".$bbox[3];
        $url = "http://apis.data.go.kr/B553084/ecoapi/EcologyzmpService/wfs/getEcologyzmpWFS";
        $queryParams = "?" . http_build_query([
            'serviceKey' => $serviceKey,
            'typeName' => 'tbl_opn_eczm',
            'bbox' => $bbox,
            'maxFeatures' => '500',
            'eczmGr' => $eczmGr,
            // 'emdCd' => $emdCd,
        ]);
    } else {
        // 확대할 범위 (예: 각 경도와 위도에 500미터씩 더하거나 빼서 범위 확장)
        $expandRange = 3000;

        // bbox 경계값 확대 (하단 좌표: lc1, lc2 / 상단 좌표: uc1, uc2)
        $lc1 = $bbox[0] - $expandRange; // 최소 경도에서 확장
        $lc2 = $bbox[1] - $expandRange; // 최소 위도에서 확장
        $uc1 = $bbox[2] + $expandRange; // 최대 경도에서 확장
        $uc2 = $bbox[3] + $expandRange; // 최대 위도에서 확장

        $expandedBbox = "$lc1,$lc2,$uc1,$uc2";
        $bbox = $bbox[0]. ",".$bbox[1]. ",".$bbox[2]. ",".$bbox[3];

        // API URL 및 쿼리 파라미터 설정
        $url = "http://apis.data.go.kr/B553084/ecoapi/EcologyzmpService/wfs/getEcologyzmpWFS";
        $queryParams = "?" . http_build_query([
            'serviceKey' => $serviceKey,
            'typeName' => 'tbl_opn_eczm',
            'bbox' => $bbox,
            'maxFeatures' => '500',
            'eczmGr' => $eczmGr,
            // 'emdCd' => $emdCd,
        ]);
    }

    // print_r($bbox);exit;
    // echo $url.$queryParams;exit;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url . $queryParams);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_HEADER, FALSE);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
    curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 요청 타임아웃 설정 (초 단위)

    // 리디렉션을 따르도록 설정
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE); 

    // 응답 실행
    $response = curl_exec($ch);

    // 타임아웃 또는 다른 curl 에러 처리
    if (curl_errno($ch)) {
        $error_msg = curl_error($ch);
        return json_encode(["error" => "Request timed out or other error: " . $error_msg]);
    }

    // 응답 성공 여부 확인
    if ($response === FALSE) {
        return json_encode(["error" => "No response from server"]);
    }
    
    // XML 데이터를 JSON으로 변환
    $json = xmlToJson($response);

    // JSON 변환 중 오류가 발생한 경우 처리
    if ($json === NULL) {
        return json_encode(["error" => "Failed to parse response"]);
    }

    return $json;
}

/**
 * 생태자연도 WMS 가져오는 함수
 * @param mixed $serviceKey
 * @param mixed $bbox
 * @param mixed $pnu
 * @return bool|string
 */
function getEcologyzmpWMS($serviceKey, $bbox, $pnu) {
    $emdCd = substr($pnu, 0, 8);

    // bbox 정렬 (하단 좌표: lc1, lc2 / 상단 좌표: uc1, uc2)
    $lc1 = min($bbox[0], $bbox[2]); // 최소 경도
    $lc2 = min($bbox[1], $bbox[3]); // 최소 위도
    $uc1 = max($bbox[0], $bbox[2]); // 최대 경도
    $uc2 = max($bbox[1], $bbox[3]); // 최대 위도

    // 정렬된 bbox를 문자열로 변환
    $sortedBbox = "$lc1,$lc2,$uc1,$uc2";

    // API URL 및 쿼리 파라미터 설정
    $url = "http://apis.data.go.kr/B553084/ecoapi/EcologyzmpService/wms/getEcologyzmpWMS";
    $queryParams = "?" . http_build_query([
        'serviceKey' => $serviceKey,
        'layers' => 'tbl_opn_eczm',
        'srs' => 'EPSG:5186',
        'bbox' => $sortedBbox,
        // 'width' => $width,
        // 'height' => $height,
        'format' => 'png',
        'transparent' => 'false',
        'bgcolor' => '0xFFFFFF',
        'exceptions' => 'BLANK', // 예외 처리 방법 BLANK: 빈 이미지, XML: 에러 코드
        'emdCd' => $emdCd,
    ]);
    // print_r($bbox);exit;
    // echo $url.$queryParams;exit;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url . $queryParams);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_HEADER, FALSE);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
    curl_setopt($ch, CURLOPT_TIMEOUT, 7); // 요청 타임아웃 설정 (초 단위)

    // 리디렉션을 따르도록 설정
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE); 

    // 응답 실행
    $response = curl_exec($ch);

    // HTTP 상태 코드 및 응답 형식 검사
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    
    // cURL 세션 닫기
    curl_close($ch);
    // 응답 확인
    if ($response === false || $httpCode != 200) {
        echo "Error: HTTP Code $httpCode, Response: " . print_r($response, true);
        return false; // 요청 실패 시 false 반환
    }

    // 응답 결과 출력 (디버깅용)
    // echo "Response Content-Type: $contentType\n";
    return $response;
}

function parseEcologyzmpResponse($response) {
    // XML 응답 파싱
    $xml = simplexml_load_string($response, "SimpleXMLElement", LIBXML_NOCDATA);
    if ($xml === false) {
        echo "XML 파싱 실패: " . print_r(libxml_get_errors(), true);
    }
    // echo $xml;exit;
    // return json_decode(json_encode($xml), true); // XML을 PHP 배열로 변환

    $namespaces = $xml->getNamespaces(true);
    $result = [];

    // FeatureCollection 내 featureMember 요소들 처리
    foreach ($xml->children($namespaces['gml'])->featureMember as $featureMember) {
        $feature = [];

        // featureMember 내 tbl_opn_eczm 요소 접근
        foreach ($featureMember->children($namespaces['open']) as $eczmFeature) {
            // 각 속성값 추출
            $feature['id'] = (string)$eczmFeature->attributes()['fid'];
            $feature['eczm_grad'] = (string)$eczmFeature->eczm_grad;
            $feature['vtn_evl_grad'] = (string)$eczmFeature->vtn_evl_grad;
            $feature['amplt_evl_grad'] = (string)$eczmFeature->amplt_evl_grad;
            $feature['smld_evl_grad'] = (string)$eczmFeature->smld_evl_grad;
            $feature['tpgrph_evl_grad'] = (string)$eczmFeature->tpgrph_evl_grad;
            $feature['cln_symbl'] = (string)$eczmFeature->cln_symbl;
            $feature['plnt_cln_ttle'] = (string)$eczmFeature->plnt_cln_ttle;

            // 좌표 추출
            $feature['coordinates'] = [];
            foreach ($eczmFeature->geom->children($namespaces['gml'])->MultiPolygon->polygonMember->Polygon->outerBoundaryIs->LinearRing->coordinates as $coordinate) {
                $feature['coordinates'][] = (string)$coordinate;
            }
        }
        $result[] = $feature;
    }

    return $result; // 배열 반환
}
function xmlToJson($xmlString) {
    // XML 문자열을 SimpleXML 객체로 변환
    $xmlObject = simplexml_load_string($xmlString, 'SimpleXMLElement', LIBXML_NOCDATA);
    if ($xmlObject === false) {
        echo "XML 파싱 실패: " . print_r(libxml_get_errors(), true);
        return false;
    }

    // SimpleXML 객체를 배열로 변환하여 모든 속성을 포함
    $array = xmlToArray($xmlObject, $xmlObject->getNamespaces(true));

    // 배열을 JSON으로 변환
    $json = json_encode($array, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    // echo $json; exit;
    return $json;
}

// XML 객체를 재귀적으로 배열로 변환하는 함수 (네임스페이스 포함)
function xmlToArray($xmlObject, $namespaces) {
    $array = [];

    // 요소의 속성(attribute)을 포함
    foreach ($xmlObject->attributes() as $attrName => $attrValue) {
        $array['@attributes'][$attrName] = (string) $attrValue;
    }

    // 각 네임스페이스에 대해 자식 요소를 처리
    foreach ($namespaces as $prefix => $namespace) {
        foreach ($xmlObject->children($namespace) as $childName => $child) {
            $childArray = xmlToArray($child, $namespaces);  // 재귀 호출

            // 동일한 이름의 자식 요소가 여러 개 있을 수 있으므로 배열로 처리
            if (!isset($array[$childName])) {
                $array[$childName] = $childArray;
            } else {
                if (!is_array($array[$childName]) || !isset($array[$childName][0])) {
                    $array[$childName] = [$array[$childName]];
                }
                $array[$childName][] = $childArray;
            }
        }
    }

    // 텍스트 값이 있는 경우 배열에 추가
    $text = trim((string) $xmlObject);
    if ($text !== '') {
        $array['@text'] = $text;
    }

    return $array;
}

// 예제 사용: POST 데이터를 받아와서 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // VWorld API 요청
    $apiKey = $_ENV['vworld_key'];
    $serviceKey = $_ENV['public_data_key'];
    $domain = $_ENV['domain'];

    // POST로 전달된 geomFilter 및 기타 필요한 값들 처리
    $pnu = isset($_POST['pnu']) ? $_POST['pnu'] : '';
    $bbox = isset($_POST['bbox']) ? $_POST['bbox'] : '';
    // $geomFilter = isset($_POST['geomFilter']) ? $_POST['geomFilter'] : '';
    // $geometry = isset($_POST['geometry']) ? $_POST['geometry'] : 'true';
    // $attribute = isset($_POST['attribute']) ? $_POST['attribute'] : 'true';
    // $crs = 'EPSG:5186';
    
    // $pnu = '4111514000105330000';

    // 생태자연도 속성 요청
    $ecologyzmpWFS1 = getEcologyzmpWFS($serviceKey, $bbox, $pnu, '1');
    $ecologyzmpWFS2 = getEcologyzmpWFS($serviceKey, $bbox, $pnu, '2');
    $ecologyzmpWFS3 = getEcologyzmpWFS($serviceKey, $bbox, $pnu, '3');

    // $response_array['ecologyzmpWFS_1'] = json_decode($ecologyzmpWFS1);
    // $response_array['ecologyzmpWFS_2'] = json_decode($ecologyzmpWFS2);
    // $response_array['ecologyzmpWFS_3'] = json_decode($ecologyzmpWFS3);

    // 에러가 발생한 경우 "error" 메시지를 response_array에 넣음
    $decodedWFS1 = json_decode($ecologyzmpWFS1, true);
    $decodedWFS2 = json_decode($ecologyzmpWFS2, true);
    $decodedWFS3 = json_decode($ecologyzmpWFS3, true);

    if (isset($decodedWFS1['error'])) {
        $response_array['ecologyzmpWFS_1'] = $decodedWFS1;
    } else {
        $response_array['ecologyzmpWFS_1'] = $decodedWFS1;
    }

    if (isset($decodedWFS2['error'])) {
        $response_array['ecologyzmpWFS_2'] = $decodedWFS2;
    } else {
        $response_array['ecologyzmpWFS_2'] = $decodedWFS2;
    }

    if (isset($decodedWFS3['error'])) {
        $response_array['ecologyzmpWFS_3'] = $decodedWFS3;
    } else {
        $response_array['ecologyzmpWFS_3'] = $decodedWFS3;
    }



    // 지적도 폴리곤 요청
    // $landPolygonData = getLandPolygon($apiKey, $geomFilter, $domain, $crs);

    // $landPolygonData = json_decode($landPolygonResponse, true);

    // if (isset($landPolygonData['response']['status']) && $landPolygonData['response']['status'] === 'OK') {
    //     // 지적도 응답에서 좌표 추출 및 WKT 형식 변환
    //     $pnu = $landPolygonData['response']['result']['featureCollection']['features'][0]['properties']['pnu'];
    //     $bbox = $landPolygonData['response']['result']['featureCollection']['bbox'];

    //     // 생태자연도 속성 요청
    //     $ecologyzmpWFS = getEcologyzmpAttr($serviceKey, $bbox, $pnu);
    //     $parsedEcologyResponse = parseEcologyzmpResponse($ecologyzmpWFS);



    //     // 생태자연도 WFS 요청
    //     // $ecologyzmpWFS = getEcologyzmpWFS($serviceKey, $bbox, $pnu);
    //     // $parsedEcologyResponse = parseEcologyzmpResponse($ecologyzmpWFS);
        
    //     // 응답을 배열에 추가
    //     // $response_array['ecologyzmpWFS'] = $parsedEcologyResponse;
    //     $response_array['ecologyzmpWFS'] = $parsedEcologyResponse;
    // } else {
    //     $response_array['error'] = 'Failed to retrieve land polygon data';
    // }



    // 결과를 클라이언트로 반환합니다.
    header('Content-Type: application/json');
    echo json_encode($response_array);
}
