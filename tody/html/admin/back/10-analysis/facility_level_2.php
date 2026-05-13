<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    $category_id = isset($_POST['category_id']) ? $_POST['category_id'] : null;
    if (!$category_id) {
        throw new Exception(400, '분석 시설 (분류 1)을 선택해주세요.');
    }

    $response_array = array();

    $sql = 
        "SELECT 
            category_id,
            CASE
                WHEN area IS NOT NULL AND area_requirement = 'under' THEN CONCAT(name, '(', area, '㎡미만)')
                WHEN area IS NOT NULL AND area_requirement = 'over' THEN CONCAT(name, '(', area, '㎡이상)')
                WHEN area IS NOT NULL THEN CONCAT(name, '(', area, '㎡)')
                ELSE name
            END AS category_name
        FROM analysis_facility_categories
        WHERE parent_id = ?
        AND level = 2
        ORDER BY category_id ASC
        ";
    $params = [$category_id];
    $types = 'i';
    $stmt = executeQuery($conn, $sql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);
    while ($row = mysqli_fetch_assoc($result)) {
        $response_array[] = $row;
    }

    responseApi(200, 'SUCCESS', $response_array); 

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);

}