<?php
// CORS 허용 (필요할 경우 도메인을 제한할 수 있음)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

error_reporting(E_ALL);
ini_set("display_errors", 1); // <<--- 0으로 변경
//ini_set("log_errors", 1); // <<--- 에러를 로그 파일에 기록하도록 설정 (추가 또는 확인)

// 기존 include 파일들
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
// poligon_center.php에는 getPolygonCentroid가, 이 파일에는 extractCoordinates가 있다고 가정
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


// --- POST 요청 처리 ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Redis 연결
    $redis = new Redis();
    $redis->connect('127.0.0.1', 6379);
    
    // --- 변경점 1: sggCd 대신 sggCds 배열을 받습니다 ---
    $requested_sggCds = isset($_POST['sggCds']) && is_array($_POST['sggCds']) ? $_POST['sggCds'] : [];
    
    // --- 기존 코드의 bbox, estateType 등은 그대로 유지 ---
    $bbox = isset($_POST['bbox']) ? urldecode($_POST['bbox']) : '';
    if (!empty($bbox)) {
        list($minLat, $minLng, $maxLat, $maxLng) = array_slice(explode(',', $bbox), 0, 4);
    }
    // 클라이언트에서 요청한 특정 부동산 유형을 가져옵니다.
    $requested_estate_types = isset($_POST['estateType']) && is_array($_POST['estateType']) ? $_POST['estateType'] : [];
    $estate_info = isset($_POST['estateInfo']) ? urldecode($_POST['estateInfo']) : '';

    // --- 초기 유효성 검사 ---
    if (empty($requested_estate_types) || empty($requested_sggCds)) {
        responseApi(200, 'SUCCESS', []); // 빈 배열을 응답하고 종료 (요청된 유형 또는 sggCd가 없으면)
        exit;
    }
    
    // 결과 데이터를 저장할 배열
    $final_response_data = []; 
    // 캐시 저장용 데이터 전체를 담을 배열 (여러 sggCd의 데이터를 합침)
    $data_to_cache_per_sggCd = []; // 각 sggCd별로 DB에서 가져온 데이터를 담음 (캐시 미스 시)

    $union_queries = []; // 각 부동산 유형별 쿼리를 저장할 배열
    $bind_params_for_db = []; // DB 쿼리에 바인딩할 파라미터들을 모음
    $types_string_for_db = ''; // DB 쿼리 바인딩 타입 문자열


    // --- 변경점 2: 각 sggCd에 대해 Redis 캐시를 조회합니다 ---
    $all_cached_data = []; // 모든 sggCd로부터 가져온 캐시 데이터를 담을 배열
    $sggCds_for_db_query = []; // 캐시 미스 발생한 sggCd들을 담을 배열

    foreach ($requested_sggCds as $sggCd) {
        $sidoCd = substr($sggCd, 0, 2); // 각 sggCd에서 sidoCd 추출 (테이블명 구성용)

        // 각 sggCd별 캐시 키
        $cacheKey_for_sgg = "realPrice:all:latest:{$sggCd}";
        $cachedData_for_sgg = $redis->get($cacheKey_for_sgg);

        if ($cachedData_for_sgg) {
            // 캐시 히트: 해당 sggCd의 데이터를 디코딩하여 $all_cached_data에 추가
            $decoded_data = json_decode($cachedData_for_sgg, true);
            $all_cached_data = array_merge($all_cached_data, $decoded_data);
            // $data_to_cache_per_sggCd에 미리 캐시된 데이터를 넣어둘 필요는 없습니다.
            // 아래 DB 조회 로직 후 Redis에 저장할 때만 사용되기 때문
        } else {
            // 캐시 미스: DB에서 조회해야 할 sggCd 목록에 추가
            $sggCds_for_db_query[] = $sggCd;

            // --- 변경점 3: 캐시 미스인 경우에만 DB 쿼리 템플릿을 생성합니다 ---
            // 그리고 해당 sggCd에 대한 쿼리가 union_queries에 추가되도록 로직 변경
            // (동일한 estateType이라도 sggCd마다 테이블명이 다르므로 쿼리 문자열이 달라짐)
            
            $adminTableName = "AL_D002_{$sidoCd}"; 
            $tableNames = [
                'apt' => "realPrice_apt_{$sidoCd}",
                'multi' => "realPrice_multiFamily_{$sidoCd}",
                'officetel' => "realPrice_officetel_{$sidoCd}",
                'land' => "realPrice_land_{$sidoCd}",
                'single' => "realPrice_single_{$sidoCd}",
                'commercial' => "realPrice_commercial_{$sidoCd}",
                'factory' => "realPrice_factory_{$sidoCd}"
            ];

            // 아파트 쿼리 템플릿
            $apt_query_template_current_sgg = "
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
                WHERE rap.pnu LIKE ? AND rap.cdealDay IS NULL
                GROUP BY rap.aptSeq";
                
            // 다세대/연립 쿼리 템플릿
            $multi_query_template_current_sgg = "
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
                WHERE rmf.pnu LIKE ? AND rmf.cdealDay IS NULL
                GROUP BY rmf.pnu";
                
            // 오피스텔 쿼리 템플릿
            $officetel_query_template_current_sgg = "
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
                WHERE rot.pnu LIKE ? AND rot.cdealDay IS NULL 
                GROUP BY rot.pnu";
                
            // 토지 쿼리 템플릿
            $land_query_template_current_sgg = "
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
                WHERE rl.pnu LIKE ? AND rl.jimok != '도로' AND rl.cdealDay IS NULL AND rl.shareDealingType IS NULL
                GROUP BY rl.pnu";
            // 단독 쿼리 템플릿
            $single_query_template_current_sgg = "
                SELECT
                    null AS aptSeq,
                    rs.plottageAr as excluUseAr,  -- 대지면적을 excluUseAr로 매핑
                    rs.dealYear,
                    rs.dealMonth,
                    rs.dealDay,
                    rs.dealAmount,
                    rs.pnu,
                    rs.housetype AS jimok,          -- single의 경우 housetype을 jimok로 매핑(예: 단독주택, 다가구주택)
                    'single' AS estate_type,
                    ST_AsText(admg.WKT) AS poligon
                FROM {$tableNames['single']} AS rs
                INNER JOIN {$adminTableName} AS admg
                ON admg.pnu_cd = rs.pnu
                INNER JOIN
                (
                    SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                    FROM {$tableNames['single']}
                    GROUP BY pnu
                ) AS latest
                ON rs.pnu = latest.pnu
                AND CONCAT(rs.dealYear, LPAD(rs.dealMonth, 2, '0'), LPAD(rs.dealDay, 2, '0')) = latest.max_date
                WHERE rs.pnu LIKE ?  AND rs.cdealDay IS NULL
                GROUP BY rs.pnu";

            // 상업용 쿼리 템플릿
            $commercial_query_template_current_sgg = "
                SELECT
                    null AS aptSeq,
                    rc.buildingAr as excluUseAr,  -- 건물면적(전용)을 excluUseAr로 매핑
                    rc.dealYear,
                    rc.dealMonth,
                    rc.dealDay,
                    rc.dealAmount,
                    rc.pnu,
                    rc.buildingUse AS usage_type,      -- 집합 건물주용도(예: 업무,근린 판매, 숙박 등)를 usage_type으로 매핑
                    'commercial' AS estate_type,
                    ST_AsText(admg.WKT) AS poligon
                FROM {$tableNames['commercial']} AS rc
                INNER JOIN {$adminTableName} AS admg
                ON admg.pnu_cd = rc.pnu
                INNER JOIN
                (
                    SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                    FROM {$tableNames['commercial']}
                    GROUP BY pnu
                ) AS latest
                ON rc.pnu = latest.pnu
                AND CONCAT(rc.dealYear, LPAD(rc.dealMonth, 2, '0'), LPAD(rc.dealDay, 2, '0')) = latest.max_date
                WHERE rc.pnu LIKE ? AND rc.cdealDay IS NULL AND rc.shareDealingType IS NULL
                GROUP BY rc.pnu";

            // 공장 쿼리 템플릿
            $factory_query_template_current_sgg = "
                SELECT
                    null AS aptSeq,
                    rf.buildingAr as excluUseAr,  -- 건물면적(전용)을 excluUseAr로 매핑
                    rf.dealYear,
                    rf.dealMonth,
                    rf.dealDay,
                    rf.dealAmount,
                    rf.pnu,
                    rf.buildingUse AS usage_type,      -- 집합 건물주용도(예: 업무,근린 판매, 숙박 등)를 usage_type으로 매핑
                    'factory' AS estate_type,
                    ST_AsText(admg.WKT) AS poligon
                FROM {$tableNames['factory']} AS rf
                INNER JOIN {$adminTableName} AS admg
                ON admg.pnu_cd = rf.pnu
                INNER JOIN
                (
                    SELECT pnu, MAX(CONCAT(dealYear, LPAD(dealMonth, 2, '0'), LPAD(dealDay, 2, '0'))) AS max_date
                    FROM {$tableNames['factory']}
                    GROUP BY pnu
                ) AS latest
                ON rf.pnu = latest.pnu
                AND CONCAT(rf.dealYear, LPAD(rf.dealMonth, 2, '0'), LPAD(rf.dealDay, 2, '0')) = latest.max_date
                WHERE rf.pnu LIKE ? AND rf.cdealDay IS NULL AND rf.shareDealingType IS NULL
                GROUP BY rf.pnu";

            foreach ($requested_estate_types as $type) {
                switch ($type) {
                    case 'apt':
                        $union_queries[] = $apt_query_template_current_sgg;
                        break;
                    case 'multi':
                        $union_queries[] = $multi_query_template_current_sgg;
                        break;
                    case 'officetel':
                        $union_queries[] = $officetel_query_template_current_sgg;
                        break;
                    case 'land':
                        $union_queries[] = $land_query_template_current_sgg;
                        break;
                    case 'single':
                        $union_queries[] = $single_query_template_current_sgg;
                        //$params[] = $pnu_filter_value;
                        break;
                    case 'commercial':
                        $union_queries[] = $commercial_query_template_current_sgg;
                        //$params[] = $pnu_filter_value;
                        break;
                    case 'factory':
                        $union_queries[] = $factory_query_template_current_sgg;
                        //$params[] = $pnu_filter_value;
                        break;
                }
                // --- 변경점 4: 바인딩할 파라미터 배열에 현재 sggCdLike 값을 추가 ---
                $bind_params_for_db[] = "{$sggCd}%"; 
                $types_string_for_db .= 's'; // 타입 문자열도 동적으로 추가
            }
        }
    } // End of foreach ($requested_sggCds as $sggCd)


    // --- 캐시 미스 처리: DB 쿼리 실행 ---
    if (!empty($sggCds_for_db_query)) { // DB에서 조회할 sggCd가 하나라도 있으면
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        
        $sql = implode(" UNION ALL ", $union_queries);

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            error_log("Failed to prepare statement (multi_sgg): " . $conn->error);
            responseApi(500, 'ERROR', ['message' => 'Statement preparation failed for multi_sgg.']);
            exit;
        }

        // --- 변경점 5: bind_param을 위한 인자 배열 재구성 (multi_sgg 처리) ---
        // $bind_params_for_db 배열에 이미 'sggCd%' 값들이 순서대로 담겨 있음
        $bind_args_for_call = [$types_string_for_db]; // 첫 번째 인자는 동적으로 생성된 타입 문자열

        // bind_param은 변수의 참조를 요구하므로, 각 요소를 참조로 추가
        foreach ($bind_params_for_db as &$param) {
            $bind_args_for_call[] = &$param;
        }
        
        try {
            call_user_func_array([$stmt, 'bind_param'], $bind_args_for_call);
        } catch (Throwable $e) {
            error_log("Error during bind_param (multi_sgg): " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            responseApi(500, 'ERROR', ['message' => 'bind_param error for multi_sgg. Check logs.']);
            exit;
        }   
        
        try {
            $stmt->execute();
        } catch (Throwable $e) {
            error_log("Error during execute (multi_sgg): " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            responseApi(500, 'ERROR', ['message' => 'SQL execute error for multi_sgg. Check logs.']);
            exit;
        }        
        $result = $stmt->get_result();

        // 전체 데이터를 배열에 저장하고, 각 sggCd별 캐시 데이터에도 저장
        $fetched_data_from_db = [];
        while ($row = $result->fetch_assoc()) {
            $fetched_data_from_db[] = $row;
            // 각 sggCd별로 캐시할 데이터를 준비 (나중에 json_encode하여 Redis에 저장)
            $row_sggCd = substr($row['pnu'], 0, 8); // PNU에서 sggCd 추출
            if (!isset($data_to_cache_per_sggCd[$row_sggCd])) {
                $data_to_cache_per_sggCd[$row_sggCd] = [];
            }
            $data_to_cache_per_sggCd[$row_sggCd][] = $row;
        }
        
        // --- 변경점 6: 각 sggCd별로 Redis에 캐시 저장 (한 달 TTL) ---
        foreach($data_to_cache_per_sggCd as $sggCd_key => $sggCd_data) {
            $cacheKey_for_sgg = "realPrice:all:latest:{$sggCd_key}";
            $redis->setex($cacheKey_for_sgg, 2592000, json_encode($sggCd_data, JSON_FORCE_OBJECT));
        }

        // DB에서 가져온 데이터도 $all_cached_data에 합칩니다.
        $all_cached_data = array_merge($all_cached_data, $fetched_data_from_db);
    } // End of if (!empty($sggCds_for_db_query))


    // --- 최종 결과 처리 ---
    // $all_cached_data에는 캐시 또는 DB에서 가져온 모든 sggCd의 부동산 데이터가 들어 있습니다.
    // 이제 이 데이터를 기존처럼 estateType과 bbox로 필터링합니다.
    foreach ($all_cached_data as $row) {
        // 기존과 동일하게 jimok 필드 처리
        if (!array_key_exists('jimok', $row) || $row['jimok'] === null) {
            $row['jimok'] = '';
        }

        if (!empty($row['poligon'])) {
            // *** 변경점: extractCoordinates, getPolygonCentroid 함수는 위에 포함되어 있어야 함 ***
            $coordinates = extractCoordinates($row['poligon']);
            $centerCoords = getPolygonCentroid($coordinates);
            $row['center_latitude'] = $centerCoords[1];
            $row['center_longitude'] = $centerCoords[0];

            // bbox 범위 내에 있는지 확인
            // *** 추가된 로직: 요청된 estateType으로 필터링 *** (캐시 히트 부분과 동일)
            if (!in_array($row['estate_type'], $requested_estate_types)) { 
                continue; // 요청된 유형이 아니면 건너뜥
            }

            if (
                $centerCoords[1] >= $minLat && $centerCoords[1] <= $maxLat &&
                $centerCoords[0] >= $minLng && $centerCoords[0] <= $maxLng
            ) {
                $final_response_data[] = $row;  // bbox 내에 있고 유형 필터링 통과한 데이터를 최종 결과에 추가
            }
        }
    }

    responseApi(200, 'SUCCESS', $final_response_data);
    exit;

} // End of if ($_SERVER['REQUEST_METHOD'] === 'POST')