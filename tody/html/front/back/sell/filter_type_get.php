<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

try {
    // SQL 쿼리
    $sql =
        "SELECT 
            type_code, type_name, 'ESTATE_TYPE' AS group_type
        FROM
            type_master
        WHERE group_code = 'ESTATE_TYPE'
        AND context_type = 'sale'
        AND use_fg = 'Y'

        UNION ALL

        SELECT 
            type_code, type_name, 'SALE_TYPE' AS group_type
        FROM
            type_master
        WHERE group_code = 'SALE_TYPE'
        AND use_fg = 'Y'

        ORDER BY group_type ASC, type_code ASC;
        ";

    $params = [];
    $types = '';

    $stmt = executeQuery($conn, $sql, $types, $params);

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array(
        'ESTATE_TYPE' => array(),
        'SALE_TYPE' => array()
    );

    // 결과를 배열로 변환하여 group_type별로 저장합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $group_type = $row['group_type'];
        $response_data[$group_type][] = array(
            'type_code' => $row['type_code'],
            'type_name' => $row['type_name']
        );
    }

    // 모든 작업 성공 시 커밋
    responseApi(200, 'SUCCESS', $response_data);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    // 연결 종료
    if (isset($stmt))
        mysqli_stmt_close($stmt);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    if (isset($stmt3))
        mysqli_stmt_close($stmt3);
    mysqli_close($conn);
}
