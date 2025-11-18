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
    $sidoCd = substr($sggCd, 0, 2); // 시도 코드 추출 (앞의 두 자리)
    $bbox = isset($_POST['bbox']) ? urldecode($_POST['bbox']) : '';
    if (!empty($bbox)) {
        list($minLat, $minLng, $maxLat, $maxLng) = array_slice(explode(',', $bbox), 0, 4);
    }
    // echo $minLng;exit;
    // 클라이언트에서 요청한 특정 부동산 유형을 가져옵니다.
    $requested_estate_types = isset($_POST['estateType']) && is_array($_POST['estateType']) ? $_POST['estateType'] : [];
    $estate_info = isset($_POST['estateInfo']) ? urldecode($_POST['estateInfo']) : '';

    if (empty($requested_estate_types)) {
        responseApi(200, 'SUCCESS', []); // 빈 배열을 응답하고 종료
        exit;
    }
    if (strlen($sidoCd) !== 2) {
        responseApi(400, 'INVALID_SGGCD', []);
        exit;
    }
    // Redis에서 sggCd 캐시 확인
    $cacheKey = "realPrice:all:latest:{$sggCd}";
    $cachedData = $redis->get($cacheKey);

    if ($cachedData) {
        // 캐시된 데이터 존재 - bbox 범위 내로 필터링 후 응답
        $allData = json_decode($cachedData, true);
        $response_data = [];

        foreach ($allData as $row) {
            if (!empty($row['poligon'])) {
                // *** 추가된 로직: 요청된 estateType으로 필터링 ***
                // 현재 row의 estate_type이 요청된 목록에 없다면 건너뜁니다.
                if (!in_array($row['estate_type'], $requested_estate_types)) { 
                    continue;
                }
                // ... 기존의 bbox 필터링 로직 ...
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
        
        // estate_type이 선택된 경우에만 쿼리 실행
        // --- 캐시 미스: DB에서 데이터 가져와야 함 ---
        $union_queries = []; // 각 부동산 유형별 쿼리를 저장할 배열
        $adminTableName = "AL_D002_{$sidoCd}";  //AL_D002_ 연속지적도
        $tableNames = [
            'apt' => "realPrice_apt_{$sidoCd}",
            'multi' => "realPrice_multiFamily_{$sidoCd}",
            'officetel' => "realPrice_officetel_{$sidoCd}",
            'land' => "realPrice_land_{$sidoCd}"
        ];

        // 아파트 쿼리 템플릿
        $apt_query_template = "
            SELECT
                rap.aptSeq,
                rap.excluUseAr,
                rap.dealYear,
                rap.dealMonth,
                rap.dealDay,
                rap.dealAmount,
                rap.pnu,
                null AS jimok,
                'apt' AS estate_type,
                ST_AsText(admg.WKT) AS poligon
            FROM {$tableNames['apt']} AS rap
            INNER JOIN {$adminTableName} AS admg
            ON admg.pnu_cd = rap.pnu
            INNER JOIN
            (
                SELECT aptSeq, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                FROM {$tableNames['apt']}
                GROUP BY aptSeq
            ) AS latest
            ON rap.aptSeq = latest.aptSeq
            AND CONCAT(rap.dealYear, LPAD(rap.dealMonth, 2, '0'), LPAD(rap.dealDay, 2, '0')) = latest.max_date
            WHERE rap.pnu LIKE ?
            GROUP BY rap.aptSeq";

        // 다세대/연립 쿼리 템플릿
        $multi_query_template = "
            SELECT
                null AS aptSeq,
                rmf.excluUseAr,
                rmf.dealYear,
                rmf.dealMonth,
                rmf.dealDay,
                rmf.dealAmount,
                rmf.pnu,
                null AS jimok,
                'multi' AS estate_type,
                ST_AsText(admg.WKT) AS poligon
            FROM {$tableNames['multi']} AS rmf
            INNER JOIN {$adminTableName} AS admg
            ON admg.pnu_cd = rmf.pnu
            INNER JOIN
            (
                SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                FROM {$tableNames['multi']}
                GROUP BY pnu
            ) AS latest
            ON rmf.pnu = latest.pnu
            AND CONCAT(rmf.dealYear, LPAD(rmf.dealMonth, 2, '0'), LPAD(rmf.dealDay, 2, '0')) = latest.max_date
            WHERE rmf.pnu LIKE ?
            GROUP BY rmf.pnu";

        // 오피스텔 쿼리 템플릿
        $officetel_query_template = "
            SELECT
                null AS aptSeq,
                rot.excluUseAr,
                rot.dealYear,
                rot.dealMonth,
                rot.dealDay,
                rot.dealAmount,
                rot.pnu,
                null AS jimok,
                'officetel' AS estate_type,
                ST_AsText(admg.WKT) AS poligon
            FROM {$tableNames['officetel']} AS rot
            INNER JOIN {$adminTableName} AS admg
            ON admg.pnu_cd = rot.pnu
            INNER JOIN
            (
                SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                FROM {$tableNames['officetel']}
                GROUP BY pnu
            ) AS latest
            ON rot.pnu = latest.pnu
            AND CONCAT(rot.dealYear, LPAD(rot.dealMonth, 2, '0'), LPAD(rot.dealDay, 2, '0')) = latest.max_date
            WHERE rot.pnu LIKE ?
            GROUP BY rot.pnu";

        // 토지 쿼리 템플릿
        $land_query_template = "
            SELECT
                null AS aptSeq,
                rl.dealArea AS excluUseAr,
                rl.dealYear,
                rl.dealMonth,
                rl.dealDay,
                rl.dealAmount,
                rl.pnu,
                rl.jimok,
                'land' AS estate_type,
                ST_AsText(admg.WKT) AS poligon
            FROM {$tableNames['land']} AS rl
            INNER JOIN {$adminTableName} AS admg
            ON admg.pnu_cd = rl.pnu
            INNER JOIN
            (
                SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                FROM {$tableNames['land']}
                GROUP BY pnu
            ) AS latest
            ON rl.pnu = latest.pnu
            AND CONCAT(rl.dealYear, LPAD(rl.dealMonth, 2, '0'), LPAD(rl.dealDay, 2, '0')) = latest.max_date
            WHERE rl.pnu LIKE ? AND rl.jimok != '도로'
            GROUP BY rl.pnu";
    
        foreach ($requested_estate_types as $type) {
            switch ($type) {
                case 'apt':
                    $union_queries[] = $apt_query_template;
                    //$params[] = $pnu_filter_value;
                    break;
                case 'multi':
                    $union_queries[] = $multi_query_template;
                    //$params[] = $pnu_filter_value;
                    break;
                case 'officetel':
                    $union_queries[] = $officetel_query_template;
                    //$params[] = $pnu_filter_value;
                    break;
                case 'land':
                    $union_queries[] = $land_query_template;
                    //$params[] = $pnu_filter_value;
                    break;
                // 추가적인 부동산 유형이 있다면 여기에 case 추가
            }
        }
        if (empty($union_queries)) {
            // $estate_types에 유효하지 않은 타입만 있어서 union_queries가 비어있는 경우
            $response_data = [];
            responseApi(200, 'SUCCESS', $response_data);
            exit;
        }
        /*
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
        */
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        // --- $sql 변수가 이 시점에서 확실히 정의되고 값이 할당됩니다 ---
        $sql = implode(" UNION ALL ", $union_queries);

        // --- *** 중요 *** ---
        // 여기서 최종 생성된 $sql 문자열을 로그에 기록하여 확인합니다.
        // 이 로그 내용을 DB 클라이언트 (MySQL Workbench, DBeaver 등)에 복사하여
        // "PREPARE stmt FROM '복사한 SQL 문자열'; EXECUTE stmt USING @param1, @param2...; DEALLOCATE PREPARE stmt;" 와 같이
        // 직접 실행하여 어떤 오류가 나는지 확인해야 합니다.
        //error_log("Final SQL query string: " . $sql);

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            // 쿼리 준비 실패 시 오류 처리 (실제 운영에서는 로그를 사용)
            error_log("Failed to prepare statement: " . $conn->error);
            // 클라이언트에게 오류 응답 전송
            responseApi(500, 'ERROR', ['message' => 'Statement preparation failed.']);
            exit;
        }
        $sggCdLike = "{$sggCd}%"; // $sggCd 값으로 시작하는 모든 값
        // echo get_bound_query($sql, [$sggCdLike]);exit;
        // 1. 바인딩할 파라미터의 개수를 결정합니다.
    
        $num_params = count($requested_estate_types);

        // 2. 바인딩 타입 문자열을 동적으로 생성합니다.
        // 이 경우 모든 파라미터는 문자열('s')이므로 's'를 필요한 개수만큼 반복합니다.
        $types_string = str_repeat('s', $num_params);

        // 3. call_user_func_array를 위해 bind_param에 전달할 인자 배열을 구성합니다.
        // 첫 번째 요소는 타입 문자열($types_string)이고,
        // 그 이후의 요소들은 실제 바인딩될 변수들입니다.
        // bind_param은 변수의 참조(&)를 요구하므로, $sggCdLike의 참조를 사용합니다.
        $bind_args = [$types_string]; // 첫 번째 인자는 타입 문자열

        // $sggCdLike 변수의 참조를 필요한 개수만큼 배열에 추가합니다.
        for ($i = 0; $i < $num_params; $i++) {
            $bind_args[] = &$sggCdLike; // $sggCdLike 변수의 참조를 추가
        }
        // 4. call_user_func_array를 사용하여 bind_param 메서드를 동적으로 호출합니다.
        // 첫 번째 인자는 호출할 객체($stmt), 두 번째 인자는 호출할 메서드 이름('bind_param'),
        // 세 번째 인자는 메서드에 전달될 인자들의 배열($bind_args)입니다.
        // SQL 바인딩 및 실행 부분
        try {
            call_user_func_array([$stmt, 'bind_param'], $bind_args);
        } catch (Throwable $e) { // PHP 7 이상에서 Fatal Error도 잡을 수 있음
            //error_log("Error during bind_param: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            responseApi(500, 'ERROR', ['message' => 'bind_param error. Check logs.']);
            exit;
        }   
        //$stmt->bind_param("ssss", $sggCdLike, $sggCdLike, $sggCdLike, $sggCdLike);
        try {
            $stmt->execute();
        } catch (Throwable $e) {
            //error_log("Error during execute: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            responseApi(500, 'ERROR', ['message' => 'SQL execute error. Check logs.']);
            exit;
        }        
        $result = $stmt->get_result();

        // 전체 데이터를 배열에 저장
        $allData = [];
        while ($row = $result->fetch_assoc()) {
            $allData[] = $row;
        }
        //error_log("Fetched allData: " . var_export($allData, true)); // 이전에 말씀드린 var_dump 대신 var_export 사용

        // Redis에 캐시 저장, TTL 한달 설정 (3600초)
        $redis->setex($cacheKey, 2592000, json_encode($allData,JSON_FORCE_OBJECT));

        // 결과 처리
        $response_data = [];
        foreach ($allData as $row) {
            // $response_data[] = $row;
            // 1. 여기서 $row에 'jimok' 필드가 있는지 확인하고, 없거나 null일 경우 빈 문자열로 강제 할당
            // array_key_exists를 사용하면 키가 있고 값이 null인 경우도 걸러낼 수 있습니다.
            // 또한, isset으로 체크하여 키 자체가 없는 경우를 처리할 수도 있습니다.
            if (!array_key_exists('jimok', $row) || $row['jimok'] === null) {
                $row['jimok'] = ''; // jimok 필드가 없거나 null일 경우 빈 문자열로 초기화
            }
            // 만약 jimok 값이 존재하지만, 비어있을 수도 있다고 가정한다면
            // if (empty($row['jimok']) && $row['jimok'] !== '0') { // 0 값은 제외
            //     $row['jimok'] = '';
            // }

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
