<?php
// echo ini_get('max_input_vars');exit;
// phpinfo();exit;
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
// include_once '../00-include/dbconnect.php';
include_once '../00-include/dbconnect_postgre.php';

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

try {
    $apiKey = $_ENV['vworld_key'];
    $pnu = isset($_POST['pnu']) ? $_POST['pnu'] : null;
    $facilitys = isset($_POST['facilitys']) ? $_POST['facilitys'] : array(); // 분석 시설 배열
    $condition = isset($_POST['condition']) ? $_POST['condition'] : array(); // 분석 조건 배열

    $tempPage = (int)($_POST['tempPage'] ?? 0);
    $tempLimit = isset($_POST['tempLimit']) ? $_POST['tempLimit'] : '50'; // 한 번에 가져올 레코드 개수
    $tempOffset = $tempPage * $tempLimit; // 페이지 오프셋 계산

    $page = (int)($_POST['page'] ?? 0);
    $limit = isset($_POST['limit']) ? $_POST['limit'] : '50'; // 한 번에 가져올 레코드 개수
    $offset = $page * $limit; // 페이지 오프셋 계산

    $radius = isset($condition['radius']) ? $condition['radius'] : null; // 조건 반경
    $code = isset($condition['code']) ? $condition['code'] : null; // 조건 코드

    if (!$pnu || empty($facilitys) || $radius === null || $radius <= 0) {
        throw new Exception('올바르지 않은 요청입니다.', 400);
    }

    $bufferDistance = 0.000009 * $radius;

    // 임시 테이블 생성
    $createTempTableSql = 
        "CREATE TEMP TABLE temp_facilitys (
            wkt GEOMETRY(Geometry, 4326) NOT NULL,
            pnu VARCHAR(255) NOT NULL
        )";
    executeQueryPDO($pdo, $createTempTableSql);
    $indexingApiTempTableSql = 'CREATE INDEX idx_temp_facilitys_geom ON temp_facilitys USING GIST (wkt);';
    executeQueryPDO($pdo, $indexingApiTempTableSql);

    // 시설 데이터 삽입
    $insertSql = "INSERT INTO temp_facilitys (wkt, pnu) VALUES ";
    $insertParams = [];
    foreach ($facilitys as $i => $facility) {
        $insertSql .= "(ST_SetSRID(ST_GeomFromText(:wkt$i), 4326), :pnu$i),";
        $insertParams[":wkt$i"] = $facility['wkt'];
        $insertParams[":pnu$i"] = $facility['pnu'];
    }
    $insertSql = rtrim($insertSql, ",");
    executeQueryPDO($pdo, $insertSql, $insertParams);

    // API 데이터 가져오기
    $ariculturalPolygon = getaAriculturalPolygon($apiKey, $pnu, $code);

    if (!isset($ariculturalPolygon['response']['status'])) {
        throw new Exception('API 호출 실패', 500);
    } 
    if ($ariculturalPolygon['response']['status'] !== 'OK' && $ariculturalPolygon['response']['status'] !== 'NOT_FOUND') {
        throw new Exception('API 호출 실패', 500);
    }
    if ($ariculturalPolygon['response']['status'] === 'NOT_FOUND') {
        responseApi(200, 'NO POLYGON DATA FOUND', []);
        exit;
    } 

    $features = $ariculturalPolygon['response']['result']['featureCollection']['features'];
    if (empty($features)) {
        responseApi(200, 'NO POLYGON DATA FOUND', []);
        exit;
    }

    // API 데이터 임시 테이블 생성
    $createApiTempTableSql = 
        "CREATE TEMP TABLE temp_api_polygons (
            wkt GEOMETRY(Geometry, 4326) NOT NULL
        )";
    executeQueryPDO($pdo, $createApiTempTableSql);
    $indexingApiTempTableSql = 'CREATE INDEX idx_temp_api_polygons_geom ON temp_api_polygons USING GIST (wkt);';
    executeQueryPDO($pdo, $indexingApiTempTableSql);

    // API 데이터 삽입
    $insertApiSql = "INSERT INTO temp_api_polygons (wkt) VALUES ";
    $insertApiParams = [];
    foreach ($features as $i => $feature) {
        $geometryType = $feature['geometry']['type'];
        $coordinates = $feature['geometry']['coordinates'];

        if (!in_array($geometryType, ['Polygon', 'MultiPolygon'])) {
            continue;
        }

        $wkt = convertCoordinatesToWKT($geometryType, $coordinates);
        $insertApiSql .= "(ST_SetSRID(ST_GeomFromText(:wkt_api$i), 4326)),";
        $insertApiParams[":wkt_api$i"] = $wkt;
    }
    $insertApiSql = rtrim($insertApiSql, ",");
    executeQueryPDO($pdo, $insertApiSql, $insertApiParams);

    // 교차 검사를 위한 메인 쿼리
    $mainSql = 
        'SELECT 
            ST_AsText(temp.wkt) AS wkt,
            ST_AsText(ST_Buffer(temp.wkt, :bufferDistance)) AS buffered_wkt,
            temp.pnu AS pnu
        FROM (
            SELECT 
                wkt,
                pnu
            FROM temp_facilitys LIMIT :tempLimit OFFSET :tempOffset
        ) AS  temp
        JOIN (
            SELECT 
                wkt
            FROM temp_api_polygons
            LIMIT :limit OFFSET :offset
        ) AS buffer_table
        ON 
            ST_Intersects(
                ST_Buffer(temp.wkt, :bufferDistance),
                ST_SetSRID(buffer_table.wkt, 4326)
            )
    ';

    // $mainSql = 
    //     'SELECT 
    //         ST_AsText(temp.wkt) AS wkt, 
    //         ST_AsText(ST_Buffer(temp.wkt, :bufferDistance)) AS buffered_wkt, 
    //         temp.pnu AS pnu
    //     FROM (
    //         SELECT * FROM temp_facilitys LIMIT :limit OFFSET :offset
    //     ) AS temp
    //     WHERE EXISTS (
    //         SELECT 1
    //         FROM temp_api_polygons AS api_table
    //         WHERE ST_Intersects(
    //             ST_Buffer(temp.wkt, :bufferDistance),
    //             ST_SetSRID(api_table.wkt, 4326) -- SRID 4326으로 변환
    //         )
    //     )';

    $params = [
        ':bufferDistance' => $bufferDistance,
        ':tempLimit' => $tempLimit,
        ':tempOffset' => $tempOffset,
        ':limit' => $limit,
        ':offset' => $offset,
    ];

    $stmt = executeQueryPDO($pdo, $mainSql, $params);

    // 결과 처리
    $response_array = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $response_array[] = $row;
    }

    responseApi(200, 'SUCCESS', $response_array);

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    executeQueryPDO($pdo, "DROP TABLE IF EXISTS temp_facilitys");
    executeQueryPDO($pdo, "DROP TABLE IF EXISTS temp_api_polygons");
}
exit;

try {
    $domain = $_ENV['domain'];
    $apiKey = $_ENV['vworld_key'];
    $pnu = isset($_POST['pnu']) ? $_POST['pnu'] : null;
    $page = (int)($_POST['page'] ?? 0);
    $limit = isset($_POST['limit']) ? $_POST['limit'] : '50'; // 한 번에 가져올 레코드 개수
    $offset = $page * $limit; // 페이지 오프셋 계산
    $facilitys = isset($_POST['facilitys']) ? $_POST['facilitys'] : array(); // 분석 시설 배열
    $condition = isset($_POST['condition']) ? $_POST['condition'] : array(); // 분석 조건 배열
    $code = isset($condition['code']) ? $condition['code'] : null; // 조건 코드
    $radius = isset($condition['radius']) ? $condition['radius'] : null; // 조건 반경
    $bufferDistance = 0.000009 * $radius;

    // 기본 버퍼 거리 계산 (1m = 0.000009)
    if ($radius === null || $radius <= 0) {
        throw new Exception('유효하지 않은 반경 값입니다.', 400);
    }

    // echo json_encode(($conditions));exit;
    if (!$pnu || empty($facilitys)) {
        throw new Exception('올바르지 않은 요청입니다.', 400);
    }

    // =============================
    // 임시 테이블을 사용하는 방식
    // ============================= 
    // 1. 임시 테이블 생성
    $createTempTableSql = 
        "CREATE TEMPORARY TABLE temp_facilitys (
            wkt GEOMETRY NOT NULL,
            pnu VARCHAR(255) NOT NULL,
            SPATIAL INDEX (wkt)
        )";
    executeQuery($conn, $createTempTableSql);

    // 2. 조건 데이터를 임시 테이블에 삽입
    $insertSql = "INSERT INTO temp_facilitys (wkt, pnu) VALUES ";
    $insertParams = [];
    $insertTypes = "";

    foreach ($facilitys as $facility) {
        $insertSql .= "(ST_GeomFromText(?), ?),";
        array_push($insertParams, $facility['wkt'], $facility['pnu']);
        $insertTypes .= "ss";
    }

    // 마지막 쉼표 제거
    $insertSql = rtrim($insertSql, ",");
    executeQuery($conn, $insertSql, $insertTypes, $insertParams);

    // 3. API 응답 가져오기
    $ariculturalPolygon = getaAriculturalPolygon($domain, $apiKey, $pnu, $code);
    if (!isset($ariculturalPolygon['response']['status']) || $ariculturalPolygon['response']['status'] !== 'OK') {
        throw new Exception('API 호출 실패', 500);
    }

    // API 응답에서 폴리곤 데이터 추출
    $features = $ariculturalPolygon['response']['result']['featureCollection']['features'];
    if (empty($features)) {
        responseApi(200, 'NO POLYGON DATA FOUND', []);
        exit;
    }

    // 4. API 데이터를 임시 테이블로 생성
    $createApiTempTableSql = 
    "CREATE TEMPORARY TABLE temp_api_polygons (
        wkt GEOMETRY NOT NULL,
        SPATIAL INDEX (wkt)
    )";
    executeQuery($conn, $createApiTempTableSql);

    // 5. API 데이터를 임시 테이블에 삽입
    $insertApiSql = "INSERT INTO temp_api_polygons (wkt) VALUES ";
    $insertApiParams = [];
    $insertApiTypes = "";

    foreach ($features as $feature) {
        $geometryType = $feature['geometry']['type'];
        $coordinates = $feature['geometry']['coordinates'];
        

        // Point 및 LineString 타입은 무시
        if (in_array($geometryType, ['Point', 'LineString'])) {
            // 무시하고 다음 feature로 이동
            continue;
        }

        try {
            $wkt = convertCoordinatesToWKT($geometryType, $coordinates);
            // $response_array[] = $wkt;

        } catch (Exception $e) {
            throw new Exception("WKT 변환 실패: " . $e->getMessage(), 400);
        }

        // 임시 테이블에 추가
        $insertApiSql .= "(ST_GeomFromText(?)),";
        $insertApiParams[] = $wkt;
        $insertApiTypes .= "s";
    }
    // responseApi(200, 'SUCCESS', $response_array); exit;

    // 마지막 쉼표 제거
    $insertApiSql = rtrim($insertApiSql, ",");
    executeQuery($conn, $insertApiSql, $insertApiTypes, $insertApiParams);

    // 6. 교차 검사를 위한 메인 쿼리
    $mainSql = 
        "SELECT 
            ST_AsText(temp.wkt) AS wkt, 
            ST_AsText(ST_Buffer(temp.wkt, ?)) AS buffered_wkt, 
            temp.pnu AS pnu
        FROM (SELECT * FROM temp_facilitys LIMIT $limit OFFSET $offset) AS temp
        WHERE EXISTS (
            SELECT 1
            FROM temp_api_polygons AS api_table
            WHERE ST_Intersects(ST_Buffer(temp.wkt, ?), api_table.wkt)
        )";

    $params = [$bufferDistance, $bufferDistance];
    $types = 'dd';

    $stmt = executeQuery($conn, $mainSql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);
    $response_array = array();
    
    while ($row = mysqli_fetch_assoc($result)) {
        $response_array[] = $row;
    }

    responseApi(200, 'SUCCESS', $response_array); 

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    executeQuery($conn, "DROP TEMPORARY TABLE IF EXISTS temp_facilitys");
    executeQuery($conn, "DROP TEMPORARY TABLE IF EXISTS temp_api_polygons");
}


// PNU로 좌표를 가져오는 함수
function getaAriculturalPolygon($domain, $apiKey, $pnu, $code) {
    // PNU에서 8자리만 추출
    $pnu = substr($pnu, 0, 8);
    $apiUrl = "https://api.vworld.kr/req/data";
    $params = [
        'service' => 'data',
        'version' => '2.0',
        'request' => 'GetFeature',
        'key' => $apiKey,
        'format' => 'json',
        'size' => '1000',
        'page' => '1',
        'data' => 'LT_C_AGRIXUE101',
        'attrFilter' => 'emdCd:like:' . $pnu . '|ucode:like:' . $code,
        'crs' => 'EPSG:4326',
        'domain' => $domain
    ];
    $url = $apiUrl . '?' . http_build_query($params);

    $response = file_get_contents($url);
    $responseData = json_decode($response, true);
    // echo json_encode($responseData);exit;
    return $responseData; // Return null if no coordinates are found
}

function convertCoordinatesToWKT($geometryType, $coordinates) {

    if ($geometryType === 'MultiPolygon') {
        $wkt = "MULTIPOLYGON(((";
        foreach ($coordinates[0][0] as $point) {
            $wkt .= "{$point[0]} {$point[1]},";
        }
        return rtrim($wkt, ',') . ")))";
    } elseif ($geometryType === 'Polygon') {
        $wkt = "POLYGON((";
        foreach ($coordinates[0] as $point) {
            $wkt .= "{$point[0]} {$point[1]},";
        }
        return rtrim($wkt, ',') . "))";
    }
    throw new Exception("지원되지 않는 지오메트리 타입: " . $geometryType, 400);
}