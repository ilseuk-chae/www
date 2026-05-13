<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/validation.php';
include_once '../00-include/authChk.php';

try {
    // 메인 타입 조회 (NEW_ESTATE_TYPE)
    $sql =
        "SELECT
            type_code, type_name
        FROM
            type_master
        WHERE group_code = 'NEW_ESTATE_TYPE'
        AND use_fg = 'Y'
        ORDER BY type_code ASC;
        ";

    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('QUERY_EXECUTE_FAILED', 500);
    }
    $result = mysqli_stmt_get_result($stmt);

    $main_types = array();
    while ($row = mysqli_fetch_assoc($result)) {
        $main_types[$row['type_code']] = array(
            'type_code' => $row['type_code'],
            'type_name' => $row['type_name'],
            'sub'       => array()
        );
    }

    // 서브 타입 조회 (SUB_ESTATE_TYPE)
    $sql2 =
        "SELECT
            type_code, type_name, context_type
        FROM
            type_master
        WHERE group_code = 'SUB_ESTATE_TYPE'
        AND use_fg = 'Y'
        ORDER BY context_type ASC, type_code ASC;
        ";

    $stmt2 = mysqli_prepare($conn, $sql2);
    if (!$stmt2) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }
    if (!mysqli_stmt_execute($stmt2)) {
        throw new Exception('QUERY_EXECUTE_FAILED', 500);
    }
    $result2 = mysqli_stmt_get_result($stmt2);

    while ($row = mysqli_fetch_assoc($result2)) {
        $parent = $row['context_type'];
        if (isset($main_types[$parent])) {
            $main_types[$parent]['sub'][] = array(
                'type_code' => $row['type_code'],
                'type_name' => $row['type_name']
            );
        }
    }

    $response_data = array_values($main_types);

    responseApi(200, 'SUCCESS', $response_data);

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    if (isset($stmt))
        mysqli_stmt_close($stmt);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    mysqli_close($conn);
}
