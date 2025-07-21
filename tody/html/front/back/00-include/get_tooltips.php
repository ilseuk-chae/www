<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

$screenType = isset($_GET['screen']) ? $_GET['screen'] : '';

$sql =
    "SELECT 
        element_id,
        tooltip_text
    FROM tooltips
    WHERE screen_type = ?";


// 조건 추가
$params = [$screenType];
$types = 's';

// 쿼리 실행
$stmt = executeQuery($conn, $sql, $types, $params);

// 결과를 가져옵니다.
$result = mysqli_stmt_get_result($stmt);


// 결과를 배열로 변환합니다.
$response_data = array();

// 결과를 배열로 변환합니다.
while ($row = mysqli_fetch_assoc($result)) {
    //$response_data[] = $row;
    $response_data[$row['element_id']] = $row['tooltip_text']; // element_id를 키로 사용
}

// 성공 응답 반환
responseApi(200, 'SUCCESS', $response_data);

// 데이터베이스 연결 종료
mysqli_close($conn);