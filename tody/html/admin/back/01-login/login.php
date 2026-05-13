<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

session_start();

include_once 'dbconnect.php';
include_once 'common.php';

$id = $_POST['id'];
$password = $_POST['password'];

$response_data = array();

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

// 바인딩할 변수들을 지정합니다.
mysqli_stmt_bind_param($stmt, "ss", $id, $password);

// SQL 문장을 실행합니다.
mysqli_stmt_execute($stmt);

// 결과를 바인딩할 변수를 선언합니다.
mysqli_stmt_bind_result($stmt, $user_no, $name, $status);

// 결과 집합을 가져옵니다.
mysqli_stmt_fetch($stmt);

// 결과를 응답 데이터에 추가합니다.
$response_data['user_no'] = $user_no;
$response_data['name'] = $name;
$response_data['status'] = $status;

// 세션에 사용자 정보를 저장합니다.
$_SESSION['user_no'] = $user_no;
$_SESSION['name'] = $name;
$_SESSION['status'] = $status;

// JSON 형태로 응답합니다.
header('Content-Type: application/json');
echo json_encode($response_data);


// 일치하는 사용자 데이터가 없을 경우
if (mysqli_num_rows($rs) == 0) {
    responseApi(404, 'USER_NOT_FOUND', null);
    exit;
    // 탈퇴한 사용자일 경우
} elseif ($status == "WITHDRAWAL") {
    responseApi(403, 'WITHDRAWAL_USER', null);
    exit;
}

// 사용자 인증 정보를 생성
$auth = generateAuthData($conn, $userNo);
$auth['name'] = $name;
responseApi(200, 'SUCCESS', $auth);

// 정상 로그인
mysqli_close($conn);

session_destroy();
?>