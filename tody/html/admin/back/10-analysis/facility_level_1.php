<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    $response_array = array();

    $sql = 
    "SELECT 
        category_id,
        name
    FROM analysis_facility_categories
    WHERE level = 1
    ORDER BY category_id ASC
    ";
    $params = [];
    $types = '';
    $stmt = executeQuery($conn, $sql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);
    while ($row = mysqli_fetch_assoc($result)) {
        $response_array[] = $row;
    }

    responseApi(200, 'SUCCESS', $response_array); 

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);

}