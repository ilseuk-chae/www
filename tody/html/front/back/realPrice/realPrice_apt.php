<?php
// CORS 허용 (필요할 경우 도메인을 제한할 수 있음)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

error_reporting(E_ALL);
ini_set("display_errors", 1);


include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/realPrice/poligon_center.php');

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();


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

// 지적도 폴리곤
function getCtnlgsSpceWFS($apiKey, $bbox, $pnu, $domain, $crs) {
    $url = "http://api.vworld.kr/ned/wfs/getCtnlgsSpceWFS";
    $queryParams = "?" . http_build_query([
        'typename' => 'dt_d002',
        'bbox' => $bbox,
        'pnu' => $pnu,
        'maxFeatures' => '1000',
        'resultType' => 'results',
        'srsName' => $crs,
        'output' => 'application/json',
        'key' => $apiKey,
        'domain' => $domain,
    ]);
    
    // echo $url.$queryParams;exit;
    
    return makeApiRequest($url, $queryParams);
}

// 중심 좌표를 계산하는 함수 호출 추가
function extractCoordinates($polygonText) {
    // MULTIPOLYGON 형식 문자열을 파싱하여 좌표 배열로 변환
    preg_match_all('/\(([^()]+)\)/', $polygonText, $matches);
    $coords = [];
    foreach ($matches[1] as $polygon) {
        $points = explode(',', $polygon);
        $polygonCoords = [];
        foreach ($points as $point) {
            $latLng = array_map('floatval', explode(' ', trim($point)));
            $polygonCoords[] = $latLng;
        }
        $coords[] = [$polygonCoords];
    }
    return $coords;
}


// 예제 사용: POST 데이터를 받아와서 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Redis 연결
    $redis = new Redis();
    $redis->connect('127.0.0.1', 6379);
    // $redis->flushDB();  // 현재 DB의 모든 키 삭제

    // // 모든 키 가져오기
    // $keys = $redis->keys('*');

    // // 키와 값 출력
    // foreach ($keys as $key) {
    //     $value = $redis->get($key);
    //     echo "Key: $key, Value: $value<br>";
    // }
    // exit;

    // VWorld API 요청
    // $domain = $_ENV['domain'];
    // $apiKey = $_ENV['vworld_key'];
    // $serviceKey = $_ENV['public_data_key'];
    // $geomFilter = isset($_POST['geomFilter']) ? $_POST['geomFilter'] : '';
    // $geometry = isset($_POST['geometry']) ? $_POST['geometry'] : 'true';
    // $attribute = isset($_POST['attribute']) ? $_POST['attribute'] : 'true';
    // $crs = 'EPSG:4326';

    $sggCd = isset($_POST['sggCd']) ? urldecode($_POST['sggCd']) : '';
    $bbox = isset($_POST['bbox']) ? urldecode($_POST['bbox']) : '';
    if (!empty($bbox)) {
        list($minLat, $minLng, $maxLat, $maxLng) = array_slice(explode(',', $bbox), 0, 4);
    }

    // echo $minLng;exit;

    // Redis에서 sggCd 캐시 확인
    $cacheKey = "realPrice:all:latest:{$sggCd}";
    $cachedData = $redis->get($cacheKey);

    if ($cachedData) {
        // 캐시된 데이터 존재 - bbox 범위 내로 필터링 후 응답
        $allData = json_decode($cachedData, true);
        $response_data = [];

        foreach ($allData as $row) {
            if (!empty($row['poligon'])) {
                $coordinates = extractCoordinates($row['poligon']);
                $centerCoords = getPolygonCentroid($coordinates);
                $row['center_latitude'] = $centerCoords[1];
                $row['center_longitude'] = $centerCoords[0];

                // bbox 범위 내에 있는지 확인
                if (
                    $centerCoords[1] >= $minLat && $centerCoords[1] <= $maxLat &&
                    $centerCoords[0] >= $minLng && $centerCoords[0] <= $maxLng
                ) {
                    $response_data[] = $row;  // bbox 내에 있으면 결과 배열에 추가
                }
            }
        }
        responseApi(200, 'SUCCESS', $response_data);
        exit;
    } else {
        $sql = 
            "SELECT 
                rap.aptSeq,
                rap.excluUseAr,
                rap.dealYear,
                rap.dealMonth,
                rap.dealDay,
                rap.dealAmount,
                rap.pnu,
                'apt' AS estate_type,
                ST_AsText(admg.WKT) AS poligon
                -- ST_X(ST_PointOnSurface(admg.WKT)) AS center_longitude,
                -- ST_Y(ST_PointOnSurface(admg.WKT)) AS center_latitude
            FROM realPrice_apt_41 AS rap

            INNER JOIN administrative_district_map_41 AS admg
            ON admg.pnu_cd = rap.pnu

            INNER JOIN 
            (
                SELECT aptSeq, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                FROM realPrice_apt_41
                GROUP BY aptSeq
            ) AS latest 
            ON rap.aptSeq = latest.aptSeq 
            AND CONCAT(rap.dealYear, LPAD(rap.dealMonth, 2, '0'), LPAD(rap.dealDay, 2, '0')) = latest.max_date

            WHERE rap.pnu LIKE ?
            GROUP BY rap.aptSeq

            UNION ALL

            SELECT 
                null AS aptSeq,
                rmf.excluUseAr,
                rmf.dealYear,
                rmf.dealMonth,
                rmf.dealDay,
                rmf.dealAmount,
                rmf.pnu,
                'multi' AS estate_type,
                ST_AsText(admg.WKT) AS poligon
                -- ST_X(ST_PointOnSurface(admg.WKT)) AS center_longitude,
                -- ST_Y(ST_PointOnSurface(admg.WKT)) AS center_latitude
            FROM realPrice_multiFamily_41 AS rmf

            INNER JOIN administrative_district_map_41 AS admg
            ON admg.pnu_cd = rmf.pnu

            INNER JOIN 
            (
                SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                FROM realPrice_multiFamily_41
                GROUP BY pnu
            ) AS latest 
            ON rmf.pnu = latest.pnu 
            AND CONCAT(rmf.dealYear, LPAD(rmf.dealMonth, 2, '0'), LPAD(rmf.dealDay, 2, '0')) = latest.max_date

            WHERE rmf.pnu LIKE ?
            GROUP BY rmf.pnu -- pnu 기준 중복 제거

            UNION ALL

            SELECT 
                null AS aptSeq,
                rot.excluUseAr,
                rot.dealYear,
                rot.dealMonth,
                rot.dealDay,
                rot.dealAmount,
                rot.pnu,
                'officetel' AS estate_type,
                ST_AsText(admg.WKT) AS poligon
                -- ST_X(ST_PointOnSurface(admg.WKT)) AS center_longitude,
                -- ST_Y(ST_PointOnSurface(admg.WKT)) AS center_latitude
            FROM realPrice_officetel_41 AS rot

            INNER JOIN administrative_district_map_41 AS admg
            ON admg.pnu_cd = rot.pnu

            INNER JOIN 
            (
                SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                FROM realPrice_officetel_41
                GROUP BY pnu
            ) AS latest 
            ON rot.pnu = latest.pnu 
            AND CONCAT(rot.dealYear, LPAD(rot.dealMonth, 2, '0'), LPAD(rot.dealDay, 2, '0')) = latest.max_date

            WHERE rot.pnu LIKE ?
            GROUP BY rot.pnu -- pnu 기준 중복 제거

            UNION ALL

            SELECT 
                null AS aptSeq,
                rl.dealArea AS excluUseAr,
                rl.dealYear,
                rl.dealMonth,
                rl.dealDay,
                rl.dealAmount,
                rl.pnu,
                'land' AS estate_type,
                ST_AsText(admg.WKT) AS poligon
                -- ST_X(ST_PointOnSurface(admg.WKT)) AS center_longitude,
                -- ST_Y(ST_PointOnSurface(admg.WKT)) AS center_latitude
            FROM realPrice_land_41 AS rl

            INNER JOIN administrative_district_map_41 AS admg
            ON admg.pnu_cd = rl.pnu

            INNER JOIN 
            (
                SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                FROM realPrice_land_41
                GROUP BY pnu
            ) AS latest 
            ON rl.pnu = latest.pnu 
            AND CONCAT(rl.dealYear, LPAD(rl.dealMonth, 2, '0'), LPAD(rl.dealDay, 2, '0')) = latest.max_date

            WHERE rl.pnu LIKE ?
            AND rl.jimok != '도로'
            GROUP BY rl.pnu; -- pnu 기준 중복 제거
            ";
        $stmt = $conn->prepare($sql);
        $sggCdLike = "{$sggCd}%"; // $sggCd 값으로 시작하는 모든 값
        // echo get_bound_query($sql, [$sggCdLike]);exit;
        $stmt->bind_param("ssss", $sggCdLike, $sggCdLike, $sggCdLike, $sggCdLike);
        $stmt->execute();
        $result = $stmt->get_result();

        // 전체 데이터를 배열에 저장
        $allData = [];
        while ($row = $result->fetch_assoc()) {
            $allData[] = $row;
        }

        // Redis에 캐시 저장, TTL 한달 설정 (3600초)
        $redis->setex($cacheKey, 2592000, json_encode($allData));

        // 결과 처리
        $response_data = [];
        foreach ($allData as $row) {
            // $response_data[] = $row;
            if (!empty($row['poligon'])) {
                $coordinates = extractCoordinates($row['poligon']);
                $centerCoords = getPolygonCentroid($coordinates);
                $row['center_latitude'] = $centerCoords[1];
                $row['center_longitude'] = $centerCoords[0];

                // bbox 범위 내에 있는지 확인
                if (
                    $centerCoords[1] >= $minLat && $centerCoords[1] <= $maxLat &&
                    $centerCoords[0] >= $minLng && $centerCoords[0] <= $maxLng
                ) {
                    $response_data[] = $row;  // bbox 내에 있으면 결과 배열에 추가
                }
            }
            // $response_data[] = $row;
        }

        responseApi(200, 'SUCCESS', $response_data);
        exit;

    }
        


    // $result = getCtnlgsSpceWFS($apiKey, $bbox, $domain, $crs);

    // // echo json_encode($result);exit;
    // if ($result && $result['features']) {
    //     $features = $result['features'];

    //     foreach ($features as $feature) {
    //         if (isset($feature['properties']['pnu'])) {
    //             $pnuList[] = $feature['properties']['pnu']; // pnu 배열에 추가
    //         }
    //     }

    //     // 중복된 pnu 값 제거 (선택 사항)
    //     $pnuList = array_unique($pnuList);

    //     echo json_encode($pnuList);exit;
        
    //     // 3. pnu 리스트가 비어 있지 않은 경우 데이터베이스 조회
    //     if (!empty($pnuList)) {
    //         // pnu 리스트를 SQL 쿼리에 맞는 문자열로 변환
    //         $pnuPlaceholders = implode(', ', array_fill(0, count($pnuList), '?'));
    //         $sql = "SELECT * FROM realPrice_apt_gyeonggi WHERE pnu IN ($pnuPlaceholders)";
    //         // echo get_bound_query($sql, $pnuList);exit;
    //         $stmt = $conn->prepare($sql);

    //         // pnu 리스트 값을 바인딩하여 쿼리 실행
    //         $stmt->bind_param(str_repeat('s', count($pnuList)), ...$pnuList);
    //         $stmt->execute();
    //         $result = $stmt->get_result();

    //         // 조회 결과 배열로 변환
    //         $matchingRows = [];
    //         while ($row = $result->fetch_assoc()) {
    //             $matchingRows[] = $row;
    //         }

    //         // 결과 확인
    //         $response_array['matchingData'] = $matchingRows;
    //     } else {
    //         $response_array['error'] = 'No matching pnu found in features.';
    //     }
    // }


    // exit;

    // // 지적도 폴리곤 요청
    // $landPolygonData = getLandPolygon($apiKey, $geomFilter, $domain, $crs);
    // // echo json_encode($landPolygonData);exit;

    // // 1. pnu 배열 초기화
    // $pnuList = [];

    // if (isset($landPolygonData['response']['status']) && $landPolygonData['response']['status'] === 'OK') {
    //     // 지적도 응답에서 좌표 추출 및 WKT 형식 변환
    //     // $bbox = $landPolygonData['response']['result']['featureCollection']['bbox'];
    //     $features = $landPolygonData['response']['result']['featureCollection']['features'];

    //     foreach ($features as $feature) {
    //         if (isset($feature['properties']['pnu'])) {
    //             $pnuList[] = $feature['properties']['pnu']; // pnu 배열에 추가
    //         }
    //     }


    //     // 중복된 pnu 값 제거 (선택 사항)
    //     $pnuList = array_unique($pnuList);
        
    //     // 3. pnu 리스트가 비어 있지 않은 경우 데이터베이스 조회
    //     if (!empty($pnuList)) {
    //         // pnu 리스트를 SQL 쿼리에 맞는 문자열로 변환
    //         $pnuPlaceholders = implode(', ', array_fill(0, count($pnuList), '?'));
    //         $sql = "SELECT * FROM your_table_name WHERE pnu IN ($pnuPlaceholders)";
    //         echo get_bound_query($sql, $pnuList);exit;
    //         $stmt = $conn->prepare($sql);

    //         // pnu 리스트 값을 바인딩하여 쿼리 실행
    //         $stmt->bind_param(str_repeat('s', count($pnuList)), ...$pnuList);
    //         $stmt->execute();
    //         $result = $stmt->get_result();

    //         // 조회 결과 배열로 변환
    //         $matchingRows = [];
    //         while ($row = $result->fetch_assoc()) {
    //             $matchingRows[] = $row;
    //         }

    //         // 결과 확인
    //         $response_array['matchingData'] = $matchingRows;
    //     } else {
    //         $response_array['error'] = 'No matching pnu found in features.';
    //     }
    // } else {
    //     $response_array['error'] = 'Failed to retrieve land polygon data';
    // }

    // // 결과를 클라이언트로 반환합니다.
    // header('Content-Type: application/json');
    // echo json_encode($response_array);
}