<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

$sql =
    "SELECT 
        c.menu_class,
        -- c.menu_cd,
        GROUP_CONCAT(c.menu_sub_cd ORDER BY c.menu_sub_cd ASC) AS menu_sub_cd,
        GROUP_CONCAT(c.menu_title ORDER BY c.menu_sub_cd ASC) AS menu_title,
        GROUP_CONCAT(c.menu_title_link ORDER BY c.menu_sub_cd ASC) AS menu_title_link,
        GROUP_CONCAT(c.menu_icon ORDER BY c.menu_sub_cd ASC) AS menu_icon
    FROM user_admin AS a
    
    INNER JOIN (
        SELECT per_no, menu_cd, menu_sub_cd
        FROM admin_menu_permission 
        ) AS b
    ON b.per_no = a.per_no
    
    INNER JOIN (
        SELECT menu_class, menu_cd, menu_sub_cd, menu_title, menu_title_link, menu_icon
        FROM admin_menu
        ) AS c
    ON c.menu_cd = b.menu_cd
    AND c.menu_sub_cd = b.menu_sub_cd
    
    WHERE SHA2(a.user_no, 256) = ?
    GROUP BY c.menu_cd";

// SQL 문장을 준비합니다.
$stmt = mysqli_prepare($conn, $sql);
// 변수 바인딩
mysqli_stmt_bind_param($stmt, "s", $saNo);



// # 쿼리문 디버깅 ##################################################################
// // 실제로 실행된 쿼리문을 생성하기 위해 쿼리와 변수를 조합합니다.
// $executed_query = $sql;
// // 변수들을 배열에 저장합니다.
// $params = array($saNo);
// // 각 바인딩된 변수에 대해 ?를 실제 값으로 대체합니다.
// foreach ($params as $param) {
//     // ?를 해당 변수의 값으로 대체합니다.
//     $executed_query = preg_replace('/\?/', "'$param'", $executed_query, 1);
// }
// // 실행된 쿼리문 출력 (디버깅 용도)
// // exit($executed_query);
// # ################################################################################


// SQL 문장을 실행합니다.
mysqli_stmt_execute($stmt);
// 결과를 가져옵니다.
$result = mysqli_stmt_get_result($stmt);
// 결과를 배열로 변환합니다.
while ($row = mysqli_fetch_assoc($result)) {
    $response_data[] = $row;
}

// 데이터가 없을 경우
if ($response_data === null) {
    responseApi(404, 'NO_DATA', null);
    exit;
}


// 성공 응답 반환
responseApi(200, 'SUCCESS', $response_data);

// 데이터베이스 연결 종료
mysqli_close($conn);

// session_start();
// // 세션에 사용자 정보를 저장합니다.
// $_SESSION['user_no'] = $user_no;
// $_SESSION['name'] = $name;
// $_SESSION['status'] = $status;
// session_destroy();
?>