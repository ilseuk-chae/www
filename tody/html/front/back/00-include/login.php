<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// phpinfo();

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

// POST 데이터 가져오기
$id = isset($_POST['id']) ? urldecode($_POST['id']) : null;
$password = isset($_POST['password']) ? urldecode($_POST['password']) : null;
$secretKey = 'tody2024';

// $user_pw = password_hash($_POST['password'], PASSWORD_BCRYPT); // Encrypt the password
// echo $user_pw;
// exit;

// 입력 데이터 유효성 검사
if (!$id || !$password) {
    responseApi(400, 'NO_PARAMETER', null);
    exit;
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 결과를 담을 배열 선언.
    $response_data = array();

    // ----------------------------------------------------------------------------------------------------------------
    // 유저 정보 가져오기 ---------------------------------------------------------------------------------------------
    // SQL 쿼리
    $sql =
        "SELECT 
            a.user_no, 
            a.password,
            a.name, 
            a.agency_name,
            a.role,
            a.status_code,
            b.description_ko AS status
        FROM user_master as a

        INNER JOIN status_code AS b
        ON b.group_code = 'USER_STATUS'
        AND a.status_code = b.status_code

        WHERE a.id = ?; ";

    // 조건 추가
    $params = [$id];
    $types = 's';

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, $types, ...$params);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('EXECUTION_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);
    
    // 결과를 배열로 변환합니다.
    $user_data = mysqli_fetch_assoc($result);
    
    // 일치하는 사용자 데이터가 없을 경우
    if (!$user_data) {
        throw new Exception('등록된 회원 정보를 찾을 수 없습니다.', 401);
    }

    // 비밀번호가 일치하지 않을 경우
    if (!password_verify($password, $user_data["password"])) {
        throw new Exception('비밀번호가 일치하지 않습니다.', 401);
    }

    // 사용자 상태 확인
    if ($user_data['status_code'] !== "001" && $user_data['status_code'] !== "006") {
        throw new Exception($user_data['status'], 403);
    }

    $secretKey = 'tody2024';
    $hashed_user_no = hash_hmac('sha256', $user_data['user_no'], $secretKey);

    $response_data['userNo'] = $hashed_user_no;
    $response_data['name'] = $user_data['name'];
    $response_data['agency_name'] = $user_data['agency_name'];
    $response_data['role'] = $user_data['role'];
    $response_data['status'] = $user_data['status'];
    $response_data['userId'] = $id;


    // ----------------------------------------------------------------------------------------------------------------
    // token 업데이트 -------------------------------------------------------------------------------------------------
    $sql2 =
        "UPDATE user_master SET
            token = substring(SHA1(CONCAT('2024tody@#$',now())), 3, 32)
        WHERE id = ?;
    ";

    // SQL 문장을 준비합니다.
    $stmt2 = mysqli_prepare($conn, $sql2);

    // SQL 준비 실패 시,
    if (!$stmt2) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt2, $types, ...$params);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt2)) {
        throw new Exception('EXECUTION_FAILED', 500);
    }


    // ----------------------------------------------------------------------------------------------------------------
    // token 가져오기 -------------------------------------------------------------------------------------------------
    $sql3 =
        "SELECT token
        FROM user_master
        WHERE id = ?;
    ";

    // SQL 문장을 준비합니다.
    $stmt3 = mysqli_prepare($conn, $sql3);

    // SQL 준비 실패 시,
    if (!$stmt3) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt3, $types, ...$params);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt3)) {
        throw new Exception('EXECUTION_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result3 = mysqli_stmt_get_result($stmt3);
    $row3 = mysqli_fetch_assoc($result3);

    $response_data['userToken'] = $row3['token'];

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $response_data);

} catch (Exception $e) {
    mysqli_rollback($conn);  // 트랜잭션 롤백

    $statusCode = $e->getCode() ? $e->getCode() : 500; // 코드가 없을 경우 500으로 설정

    responseApi($statusCode, $e->getMessage(), null);
} finally {
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    if (isset($stmt2)) {
        mysqli_stmt_close($stmt2);
    }
    if (isset($stmt3)) {
        mysqli_stmt_close($stmt3);
    }
    mysqli_close($conn);
}

?>