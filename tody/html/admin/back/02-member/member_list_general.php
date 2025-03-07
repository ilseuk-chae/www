<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

// SQL 쿼리
$sql = "SELECT a.user_no, a.id, a.name, a.email, DATE_FORMAT(a.reg_date, '%Y-%m-%d') AS reg_date, a.status_code, b.description_ko AS status_description
        FROM user_master AS a

        INNER JOIN status_code AS b
        ON group_code = 'USER_STATUS'
        AND a.status_code = b.status_code

        WHERE a.role = '001'

        ORDER BY a.user_no DESC; ";

// SQL 문장을 준비합니다.
$stmt = mysqli_prepare($conn, $sql);

// SQL 준비 실패 시,
if (!$stmt) {
    responseApi(500, 'QUERY_PREPARATION_FAILED', null);
    exit;
}

// SQL 문장을 실행합니다.
mysqli_stmt_execute($stmt);

// 결과를 가져옵니다.
$result = mysqli_stmt_get_result($stmt);

// 결과를 배열로 변환합니다.
$response_data = array();

// 결과를 배열로 변환합니다.
while ($row = mysqli_fetch_assoc($result)) {
    $row['user_no'] = hash('sha256', $row['user_no']);
    $response_data[] = $row;
}

// $row = mysqli_fetch_assoc($result);
// for ($i = 0; $i < 20; $i++) {
//     $response_data[] = $row;
// }

// 성공 응답 반환
responseApi(200, 'SUCCESS', $response_data);

// 데이터베이스 연결 종료
mysqli_close($conn);