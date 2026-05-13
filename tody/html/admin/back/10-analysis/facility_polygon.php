<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
// include_once '../00-include/authChk.php';
include_once '../00-include/dbconnect_postgre.php';

try {
    $pnu = isset($_POST['pnu']) ? $_POST['pnu'] : null;
    $yongdoSettingIds = isset($_POST['yongdoSettingIds']) ? $_POST['yongdoSettingIds'] : array();
    $jimoSettingIds = isset($_POST['jimoSettingIds']) ? $_POST['jimoSettingIds'] : array();
    if (!$pnu) {
        throw new Exception('지역을 선택하세요', 400);
    }

    // $sql = 
    //     "SELECT 
    //         ST_AsText(wkt) AS wkt, 
    //         -- ST_AsText(ST_Buffer(wkt, 0.0009)) AS buffered_wkt, 
    //         pnu,
    //         ldCodeNm,
    //         mnnmSlno
    //     FROM land_characteristics_polygon_41
    //     WHERE pnu LIKE ?";
    // $pnuParam = $pnu . '%';  // 와일드카드 추가
    // $params = [$pnuParam];
    // $types = 's';

    // // 용도지역이 제공된 경우 조건 추가
    // if (!empty($yongdoSettingIds)) {
    //     $placeholders = implode(',', array_fill(0, count($yongdoSettingIds), '?'));
    //     $sql .= " AND prposArea1 IN ($placeholders)";
    //     $params = array_merge($params, $yongdoSettingIds);
    //     $types .= str_repeat('s', count($yongdoSettingIds));
    // }
    
    // // 지목 코드가 제공된 경우 조건 추가
    // if (!empty($jimoSettingIds)) {
    //     $placeholders = implode(',', array_fill(0, count($jimoSettingIds), '?'));
    //     $sql .= " AND lndcgrCode IN ($placeholders)";
    //     $params = array_merge($params, $jimoSettingIds);
    //     $types .= str_repeat('s', count($jimoSettingIds));
    // }

    // echo get_bound_query($sql, $params);exit;

    // SQL 초기화
    $sql = 
        'SELECT 
            ST_AsText("wkt") AS wkt, 
            "pnu",
            "ldCodeNm",
            "mnnmSlno"
        FROM land_characteristics_polygon_41
        WHERE "pnu" LIKE :pnuParam';

    $params = [':pnuParam' => $pnu . '%'];

    // 용도지역 조건 추가
    if (is_array($yongdoSettingIds) && !empty($yongdoSettingIds)) {
        $placeholders = implode(',', array_map(fn($i) => ":yongdo_$i", array_keys($yongdoSettingIds)));
        $sql .= " AND \"prposArea1\" IN ($placeholders)";

        foreach ($yongdoSettingIds as $i => $value) {
            $params[":yongdo_$i"] = $value;
        }
    }

    // 지목 코드 조건 추가
    if (is_array($jimoSettingIds) && !empty($jimoSettingIds)) {
        $placeholders = implode(',', array_map(fn($i) => ":jimo_$i", array_keys($jimoSettingIds)));
        $sql .= " AND \"lndcgrCode\" IN ($placeholders)";

        foreach ($jimoSettingIds as $i => $value) {
            $params[":jimo_$i"] = $value;
        }
    }

    // echo $sql;exit;
    // 50m 버퍼와 겹치는 폴리곤을 제외하는 조건 추가
    // $sql .= " AND EXISTS (
    //     SELECT 1
    //     FROM land_characteristics_polygon_41 AS buffer_table
    //     WHERE buffer_table.pnu LIKE ?
    //     AND buffer_table.lndcgrCode = '09'
    //     AND ST_Intersects(ST_Buffer(land_characteristics_polygon_41.wkt, 0.0009), buffer_table.wkt)
    // )";
    // $params[] = $pnuParam;
    // $types .= 's';


    // SQL 실행
    $stmt = executeQueryPDO($pdo, $sql, $params);

    // 결과 가져오기
    $response_array = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $response_array[] = $row;
    }

    // $stmt = executeQuery($conn, $sql, $types, $params);
    // $result = mysqli_stmt_get_result($stmt);
    // $response_array = array();
    // while ($row = mysqli_fetch_assoc($result)) {
    //     $response_array[] = $row;
    // }

    responseApi(200, 'SUCCESS', $response_array); 

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);

}
