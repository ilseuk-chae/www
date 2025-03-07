<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    $category_id = isset($_POST['category_id']) ? $_POST['category_id'] : null;
    if (!$category_id) {
        throw new Exception(400, '올바르지 않은 요청입니다.');
    }

    $response_array = array();

    $sql = 
        "SELECT 
            afs.setting_id,
            
            ac.code,
            
            CASE 
                WHEN ac.level = 2 THEN ac.name
                WHEN ac2.level = 2 THEN ac2.name
                ELSE ''
            END AS parent_name_level_2,
        
            CASE 
                WHEN ac.level = 1 THEN ac.name
                WHEN ac2.level = 1 THEN ac2.name
                ELSE ''
            END AS parent_name_level_1
        
        FROM analys_facility_settings AS afs

        INNER JOIN analysis_conditions AS ac
        ON afs.condition_id = ac.condition_id

        LEFT JOIN analysis_conditions AS ac2
        ON ac.parent_id = ac2.condition_id

        WHERE afs.category_id = ?

        ORDER BY ac.parent_id ASC
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