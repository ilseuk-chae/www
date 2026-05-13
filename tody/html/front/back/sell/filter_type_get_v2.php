<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

try {
    // 메인 타입 조회 (NEW_ESTATE_TYPE + TRANSACTION_TYPE)
    $sql =
        "SELECT
            type_code, type_name, 'ESTATE_TYPE' AS group_type
        FROM
            type_master
        WHERE group_code = 'NEW_ESTATE_TYPE'
        AND use_fg = 'Y'

        UNION ALL

        SELECT
            type_code, type_name, 'SALE_TYPE' AS group_type
        FROM
            type_master
        WHERE group_code = 'TRANSACTION_TYPE'
        AND use_fg = 'Y'

        ORDER BY group_type ASC, type_code ASC;
        ";

    $params = [];
    $types = '';
    $stmt = executeQuery($conn, $sql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);

    $response_data = array(
        'ESTATE_TYPE' => array(),
        'SALE_TYPE'   => array()
    );

    // 메인 타입 저장 (ESTATE_TYPE은 type_code 키로 임시 저장)
    $estate_map = array();
    while ($row = mysqli_fetch_assoc($result)) {
        $group_type = $row['group_type'];
        $entry = array(
            'type_code' => $row['type_code'],
            'type_name' => $row['type_name']
        );
        if ($group_type === 'ESTATE_TYPE') {
            $entry['sub'] = array();
            $estate_map[$row['type_code']] = $entry;
        } else {
            $response_data['SALE_TYPE'][] = $entry;
        }
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

    $params2 = [];
    $types2 = '';
    $stmt2 = executeQuery($conn, $sql2, $types2, $params2);
    $result2 = mysqli_stmt_get_result($stmt2);

    while ($row = mysqli_fetch_assoc($result2)) {
        $parent = $row['context_type'];
        if (isset($estate_map[$parent])) {
            $estate_map[$parent]['sub'][] = array(
                'type_code' => $row['type_code'],
                'type_name' => $row['type_name']
            );
        }
    }

    $response_data['ESTATE_TYPE'] = array_values($estate_map);

    responseApi(200, 'SUCCESS', $response_data);

} catch (Exception $e) {
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    if (isset($stmt))
        mysqli_stmt_close($stmt);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    if (isset($stmt3))
        mysqli_stmt_close($stmt3);
    mysqli_close($conn);
}
