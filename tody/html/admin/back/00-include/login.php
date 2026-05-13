<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// phpinfo();

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/authChk.php';
include_once '../00-include/common.php';

// POST 데이터 가져오기
$id = isset($_POST['id']) ? urldecode($_POST['id']) : null;
$password = isset($_POST['password']) ? $_POST['password'] : null;

// 입력 데이터 유효성 검사
if (!$id || !$password) {
    responseApi(400, 'NO_PARAMETER', null);
    exit;
}
// echo $password;
// exit;

// $sql = "SELECT user_no, name, status
//         FROM user_admin
//         WHERE id ='{$id}' AND password = EBGA_CREATE_PW_SHA('{$password}')";

// $rs = mysqli_query($conn, $sql);

// while ($row = mysqli_fetch_assoc($rs)) {
//     $response_data[] = $row;
// }
// ;

// $userNo = $response_data[0]['user_no'];
// $status = $response_data[0]['status'];
// $name = $response_data[0]['name'];


// SQL 쿼리
$sql = "SELECT user_no, name, status
        FROM user_admin
        WHERE id = ? AND password = EBGA_CREATE_PW_SHA(?)";

// SQL 문장을 준비합니다.
$stmt = mysqli_prepare($conn, $sql);

// 변수 바인딩
mysqli_stmt_bind_param($stmt, "ss", $id, $password);


# 쿼리문 디버깅 ##################################################################
// 실제로 실행된 쿼리문을 생성하기 위해 쿼리와 변수를 조합합니다.
$executed_query = $sql;
// 변수들을 배열에 저장합니다.
$params = array($id, $password);
// 각 바인딩된 변수에 대해 ?를 실제 값으로 대체합니다.
foreach ($params as $param) {
    // ?를 해당 변수의 값으로 대체합니다.
    $executed_query = preg_replace('/\?/', "'$param'", $executed_query, 1);
}
// 실행된 쿼리문 출력 (디버깅 용도)
// exit($executed_query);
# ################################################################################


// SQL 문장을 실행합니다.
mysqli_stmt_execute($stmt);

// 결과를 가져옵니다.
$result = mysqli_stmt_get_result($stmt);

// 결과를 배열로 변환합니다.
$response_data = array();

// 결과를 배열로 변환합니다.
$response_data = mysqli_fetch_assoc($result);


// 일치하는 사용자 데이터가 없을 경우
if ($response_data === null) {
    responseApi(404, 'USER_NOT_FOUND', null);
    exit;
}

// 사용자 상태 확인
if ($response_data['status'] === "WITHDRAWAL") {
    responseApi(403, 'WITHDRAWAL_USER', null);
    exit;
}

// // 결과를 배열로 변환합니다.
// while ($row = mysqli_fetch_assoc($result)) {
//     $response_data = $row;
// }

// 사용자 정보 추출
$userNo = $response_data['user_no'];
$name = $response_data['name'];

// 사용자 인증 정보를 생성
$auth = generateAuthData($conn, $userNo);
$auth['name'] = $name;

// 성공 응답 반환
responseApi(200, 'SUCCESS', $auth);

// 데이터베이스 연결 종료
mysqli_close($conn);

// session_start();
// // 세션에 사용자 정보를 저장합니다.
// $_SESSION['user_no'] = $user_no;
// $_SESSION['name'] = $name;
// $_SESSION['status'] = $status;
// session_destroy();
?>