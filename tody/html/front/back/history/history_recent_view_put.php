<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

try {
    $type    = isset($_POST['type'])    ? urldecode($_POST['type'])  : '';
    $limit   = isset($_POST['limit'])   ? urldecode($_POST['limit']) : 5;
    $offset  = isset($_POST['offset'])  ? intval($_POST['offset'])   : 0;
    $v2_mode = isset($_POST['v2_mode']) ? intval($_POST['v2_mode'])  : 0;

    // 회원 번호
    $user_no = get_user_no_for_hash($conn, $userNo);

    $table_name = '';
    if ($type == 'find') {
        $table_name = $v2_mode ? 'wanted_listings_v2' : 'wanted_listings';
    } elseif ($type == 'put') {
        $table_name = $v2_mode ? 'put_listings_v2' : 'put_listings';
    } else {
        throw new Exception("Invalid type provided", 400);
    }

    // 결과를 배열로 변환합니다.
    $response_data = array();

    // SQL 쿼리
    $sql =
        "SELECT 
            a.idx AS history_no,
            a.view_type,
            a.board_no, 
            DATE_FORMAT(a.reg_date, '%Y.%m.%d') AS reg_date,
            
            b.sale_price,
            (SELECT locatadd_nm FROM bjd_master WHERE sido_cd = b.sido_cd AND sgg_cd = b.sgg_cd ORDER BY region_cd ASC LIMIT 1) AS locatadd_nm

        FROM history_recent_view AS a

        INNER JOIN $table_name AS b
        ON b.idx = a.board_no
        AND b.active_fg = 'Y'
        AND b.public_fg = 'Y'

        WHERE a.user_no = ?
        AND a.view_type = ?

        ORDER BY a.reg_date DESC
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
