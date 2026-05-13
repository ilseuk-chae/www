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

try {
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
    // $code = '04';

    // 입력값 검증
    if (!$pnu || empty($facilitys)) {
        throw new Exception('올바르지 않은 요청입니다.', 400);
    }
    if ($radius === null || $radius <= 0) {
        throw new Exception('유효하지 않은 반경 값입니다.', 400);
    }
    
    // 기본 버퍼 거리 계산 (1m = 0.000009)
    $bufferDistance = 0.000009 * $radius;

    // =============================
    // 임시 테이블을 사용하는 방식
    // ============================= 
    // 1. 임시 테이블 생성
    $createTempTableSql = 
        "CREATE TEMP TABLE temp_facilitys (
            wkt GEOMETRY(Geometry, 4326) NOT NULL,
            pnu VARCHAR(255) NOT NULL
        )";
    executeQueryPDO($pdo, $createTempTableSql);
    $indexingTempTableSql = 'CREATE INDEX idx_temp_facilitys_geom ON temp_facilitys USING GIST (wkt);';
    executeQueryPDO($pdo, $indexingTempTableSql);

    // 2. 조건 데이터를 임시 테이블에 삽입
    $insertSql = "INSERT INTO temp_facilitys (wkt, pnu) VALUES ";
    $insertParams = [];
    foreach ($facilitys as $i => $facility) {
        $insertSql .= "(ST_SetSRID(ST_GeomFromText(:wkt$i), 4326), :pnu$i),";
        $insertParams[":wkt$i"] = $facility['wkt'];
        $insertParams[":pnu$i"] = $facility['pnu'];
    }
    // 마지막 쉼표 제거
    $insertSql = rtrim($insertSql, ",");
    executeQueryPDO($pdo, $insertSql, $insertParams);

    // $sql = "SELECT 
    //     ST_AsText(temp.wkt) AS wkt, 
    //     temp.pnu AS pnu
    // FROM temp_facilitys AS temp";
    // $stmt = executeQueryPDO($pdo, $sql);

    // 3. 교차 검사를 위한 메인 쿼리

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
                wkt,
                pnu
            FROM tody.building_use_polygon_41 
            WHERE pnu LIKE :pnuParam AND "mainPrposCode" = :code
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
    //         FROM tody.building_use_polygon_41 AS buffer_table
    //         WHERE buffer_table.pnu LIKE :pnuParam
    //         AND buffer_table."mainPrposCode" = :code
    //         AND ST_Intersects(
    //             ST_Buffer(temp.wkt, :bufferDistance),
    //             ST_SetSRID(buffer_table.wkt, 4326) -- SRID 4326으로 변환
    //         )
    //     )';

    // 쿼리 실행을 위한 매개변수 설정
    $params = [
        ':bufferDistance' => $bufferDistance,
        ':tempLimit' => $tempLimit,
        ':tempOffset' => $tempOffset,
        ':limit' => $limit,
        ':offset' => $offset,
        ':pnuParam' => $pnu . '%',
        ':code' => $code,
    ];

    // SQL 실행
    $stmt = executeQueryPDO($pdo, $mainSql, $params);
    
    // 5. 결과 가져오기
    $response_array = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $response_array[] = $row;
    }

    responseApi(200, 'SUCCESS', $response_array); 

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    executeQueryPDO($pdo, "DROP TABLE IF EXISTS temp_facilitys");
}
exit;

try {
    $pnu = isset($_POST['pnu']) ? $_POST['pnu'] : null;
    $page = (int)($_POST['page'] ?? 0);
    $limit = isset($_POST['limit']) ? $_POST['limit'] : '50'; // 한 번에 가져올 레코드 개수
    $offset = $page * $limit; // 페이지 오프셋 계산
    $facilitys = isset($_POST['facilitys']) ? $_POST['facilitys'] : array(); // 분석 시설 배열
    $condition = isset($_POST['condition']) ? $_POST['condition'] : array(); // 분석 조건 배열
    $radius = isset($condition['radius']) ? $condition['radius'] : null; // 조건 반경
    $code = isset($condition['code']) ? $condition['code'] : null; // 조건 코드

    // 기본 버퍼 거리 계산 (1m = 0.000009)
    if ($radius === null || $radius <= 0) {
        throw new Exception('유효하지 않은 반경 값입니다.', 400);
    }

    // echo json_encode(($conditions));exit;
    if (!$pnu || empty($facilitys)) {
        throw new Exception('올바르지 않은 요청입니다.', 400);
    }

    $bufferDistance = 0.000009 * $radius;

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
    // $createTempTableSql = 
    //     "CREATE TABLE anaysis_test (
    //         wkt GEOMETRY NOT NULL,
    //         pnu VARCHAR(255) NOT NULL,
    //         SPATIAL INDEX (wkt)
    //     )";
    // executeQuery($conn, $createTempTableSql);

    // 2. 조건 데이터를 임시 테이블에 삽입
    $insertSql = "INSERT INTO anaysis_test (wkt, pnu) VALUES ";
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

    // 3. 교차 검사를 위한 메인 쿼리
    $mainSql = 
        "SELECT 
            ST_AsText(temp.wkt) AS wkt, 
            ST_AsText(ST_Buffer(temp.wkt, ?)) AS buffered_wkt, 
            temp.pnu AS pnu
        FROM (SELECT * FROM temp_facilitys LIMIT $limit OFFSET $offset) AS temp
        WHERE EXISTS (
            SELECT 1
            FROM building_use_polygon_41 AS buffer_table
            WHERE buffer_table.pnu LIKE ?
            AND buffer_table.mainPrposCode = ?
            AND ST_Intersects(ST_Buffer(temp.wkt, ?), buffer_table.wkt)
        )";

    $pnuParam = $pnu . '%';  // 와일드카드 추가
    $params = [$bufferDistance, $pnuParam, $code, $bufferDistance];
    $types = 'dssd';

    // $mainSql = "SELECT pnu FROM temp_facilitys";
    // $types = '';
    // $params = [];

    // =============================
    // 직접 SQL에 데이터를 포함하는 방식
    // ============================= 
    // // 시설 데이터를 바로 SQL에 포함
    // $values = [];
    // $params = [];
    // $types = '';

    // foreach ($facilitys as $facility) {
    //     $values[] = "SELECT ST_GeomFromText(?) AS wkt, ? AS pnu";
    //     $params[] = $facility['wkt'];
    //     $params[] = $facility['pnu'];
    //     $types .= 'ss';
    // }
    // $valuesSql = implode(" UNION ALL ", $values);

    // // 메인 쿼리 작성
    // $mainSql =
    // "SELECT 
    //     ST_AsText(temp.wkt) AS wkt, 
    //     ST_AsText(ST_Buffer(temp.wkt, ?)) AS buffered_wkt, 
    //     temp.pnu AS pnu
    // FROM (
    //     SELECT * 
    //     FROM (
    //         $valuesSql
    //     ) AS temp_inner
    //     LIMIT $limit OFFSET $offset
    // ) AS temp
    // WHERE EXISTS (
    //     SELECT 1
    //     FROM land_characteristics_polygon_41 AS buffer_table
    //     WHERE buffer_table.pnu LIKE ?
    //     AND buffer_table.lndcgrCode = ?
    //     AND ST_Contains(ST_Buffer(temp.wkt, ?), buffer_table.wkt)
    // )
    // ";

    // $code = '04';
    // $pnuParam = $pnu . '%';  // 와일드카드 추가

    // // 추가 파라미터 바인딩
    // $params = array_merge([$bufferDistance], $params, [$pnuParam, $code, $bufferDistance]);
    // $types = 'd' . $types . 'ssd';

    // echo get_bound_query($mainSql, $params);exit;


    $stmt = executeQuery($conn, $mainSql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);
    $response_array = array();
    
    while ($row = mysqli_fetch_assoc($result)) {
        $response_array[] = $row;
    }

    responseApi(200, 'SUCCESS', $response_array); 

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);

}

