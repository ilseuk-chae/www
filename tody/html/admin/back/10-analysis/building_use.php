<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    $pnu = isset($_POST['pnu']) ? $_POST['pnu'] : null;
    $radius = isset($_POST['radius']) ? $_POST['radius'] : null;
    $code = isset($_POST['code']) ? $_POST['code'] : null;
    $page = isset($_POST['page']) ? (int)$_POST['page'] : 0; // 페이지 파라미터 추가
    $limit = 10; // 한 번에 가져올 레코드 개수
    $offset = $page * $limit; // 페이지 오프셋 계산
    $jimoSettingIds = isset($_POST['jimoSettingIds']) ? $_POST['jimoSettingIds'] : array();
    $yongdoSettingIds = isset($_POST['yongdoSettingIds']) ? $_POST['yongdoSettingIds'] : array();
    $conditions = isset($_POST['conditions']) ? $_POST['conditions'] : array();

    // 기본 버퍼 거리 계산 (1m = 0.000009)
    if ($radius === null || $radius <= 0) {
        throw new Exception('반경이 유효하지 않습니다.', 400);
    }
    $defaltDistance = 0.000009; // 기본 1m
    $bufferDistance = $defaltDistance * $radius; 

    // echo json_encode(($conditions));exit;
    if (!$pnu || empty($conditions)) {
        throw new Exception('올바르지 않은 요청입니다.', 400);
    }

    $mainSql = 
        "SELECT 
            ST_AsText(lc.wkt) AS wkt, 
            ST_AsText(ST_Buffer(lc.wkt, 0.0009)) AS buffered_wkt, 
            lc.pnu AS pnu
        FROM (
            SELECT 
                wkt, 
                pnu
            FROM land_characteristics_polygon_41
            WHERE pnu LIKE ?
              AND prposArea1 IN (11)
              AND lndcgrCode IN (28, 02, 05, 01)
            LIMIT $limit OFFSET $offset
        ) AS lc
        WHERE EXISTS (
            SELECT 1
            FROM land_characteristics_polygon_41 AS buffer_table
            WHERE buffer_table.pnu LIKE ?
              AND buffer_table.lndcgrCode = ?
              AND ST_Contains(ST_Buffer(lc.wkt, ?), buffer_table.wkt)
        )
    ";

    $params = [$pnu . '%', $code, $pnu . '%', $bufferDistance]; // 두 번 사용
    $types = 'ssss';
    $stmt = executeQuery($conn, $mainSql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);
    $response_array = array();

    // 1. 임시 테이블 생성
    // $createTempTableSql = 
    //     "CREATE TEMPORARY TABLE temp_conditions (
    //         wkt GEOMETRY NOT NULL,
    //         pnu VARCHAR(255) NOT NULL,
    //         SPATIAL INDEX (wkt)
    //     )";
    // executeQuery($conn, $createTempTableSql);

    // // 2. 조건 데이터를 임시 테이블에 삽입
    // $insertSql = "INSERT INTO temp_conditions (wkt, pnu) VALUES ";
    // $insertParams = [];
    // $insertTypes = "";

    // foreach ($conditions as $condition) {
    //     $insertSql .= "(ST_GeomFromText(?), ?),";
    //     array_push($insertParams, $condition['wkt'], $condition['pnu']);
    //     $insertTypes .= "ss";
    // }

    // // 마지막 쉼표 제거
    // $insertSql = rtrim($insertSql, ",");
    // executeQuery($conn, $insertSql, $insertTypes, $insertParams);
    
    // 기존 좌표와 100m 더 넓은 버퍼 좌표값 조회를 위한 디버깅 쿼리
    // $debugSql = 
    //     "SELECT 
    //         ST_AsText(tc.wkt) AS original_wkt, 
    //         ST_AsText(ST_Buffer(tc.wkt, 0.0009)) AS buffered_wkt, 
    //         tc.pnu
    //     FROM temp_conditions AS tc
    //     ";

    // $debugStmt = executeQuery($conn, $debugSql);
    // $debugResult = mysqli_stmt_get_result($debugStmt);
    // $debug_array = array();

    // while ($row = mysqli_fetch_assoc($debugResult)) {
    //     $debug_array[] = $row;
    // }

    // responseApi(200, 'SUCCESS', $debug_array); 
    // exit;


    // 3. 교차 검사를 위한 메인 쿼리
    // $mainSql = 
    //     "SELECT 
    //         ST_AsText(temp.wkt) AS wkt, 
    //         ST_AsText(ST_Buffer(temp.wkt, 0.0009)) AS buffered_wkt, 
    //         temp.pnu AS pnu
    //     FROM (SELECT * FROM temp_conditions LIMIT $limit OFFSET $offset) AS temp
    //     WHERE EXISTS (
    //         SELECT 1
    //         FROM land_characteristics_polygon_41 AS buffer_table
    //         WHERE buffer_table.pnu LIKE ?
    //         AND buffer_table.lndcgrCode = '04'
    //         AND ST_Contains(ST_Buffer(temp.wkt, 0.0009), buffer_table.wkt)
    //     )";

    // $pnuParam = $pnu . '%';  // 와일드카드 추가
    // $params = [$pnuParam];
    // $types = 's';

    // $stmt = executeQuery($conn, $mainSql, $types, $params);
    // $result = mysqli_stmt_get_result($stmt);
    // $response_array = array();
    
    while ($row = mysqli_fetch_assoc($result)) {
        $response_array[] = $row;
    }

    responseApi(200, 'SUCCESS', $response_array); 

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);

}
