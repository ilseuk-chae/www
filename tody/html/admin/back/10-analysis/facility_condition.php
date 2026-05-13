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
            acs.setting_id,
            acs.radius,
            acs.inclusion_fg,

            ac.name,

            ac2.name AS parent_name
        
        FROM analysis_conditions_settings AS acs

        INNER JOIN analysis_conditions AS ac
        ON acs.condition_id = ac.condition_id

        LEFT JOIN analysis_conditions AS ac2
        ON ac.parent_id = ac2.condition_id

        LEFT JOIN analysis_conditions AS ac3
        ON ac2.parent_id = ac3.condition_id

        WHERE acs.category_id = ?

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