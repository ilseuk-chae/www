<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

try {
    $type = isset($_POST['type']) ? urldecode($_POST['type']) : '';
    $limit = isset($_POST['limit']) ? urldecode($_POST['limit']) : 5;
    $offset = isset($_POST['offset']) ? intval($_POST['offset']) : 0;

    // 회원 번호
    $user_no = get_user_no_for_hash($conn, $userNo);

    // 결과를 배열로 변환합니다.
    $response_data = array();

    // SQL 쿼리
    $sql =
        "SELECT 
            idx AS history_no,
            type,
            jibun_address,
            latitude,
            longitude,
            estate_no,
            DATE_FORMAT(reg_date, '%Y.%m.%d') AS reg_date

        FROM history_favorite_map 

        WHERE user_no = ?
        AND type = ?

        ORDER BY reg_date DESC
        LIMIT ? OFFSET ?
        ";
        
    // 조건 추가
    $params = [$user_no, $type, $limit, $offset];
    $types = 'isii';
    $stmt = executeQuery($conn, $sql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $response_data[] = $row;
    }

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
