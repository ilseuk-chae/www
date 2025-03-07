<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect.php';

// POST 데이터 가져오기
$id = isset($_POST['id']) ? urldecode($_POST['id']) : null;
$password = isset($_POST['password']) ? $_POST['password'] : null;

// 입력 데이터 유효성 검사
if (!$id || !$password) {
    responseApi(400, '아이디 또는 비밀번호를 확인해주세요.', 'error');
    exit;
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    ##################### 1. 로그인 #####################
    // SQL 쿼리
    $sql = "SELECT user_no, name, status, per_no
            FROM user_admin
            WHERE id = ? AND password = EBGA_CREATE_PW_SHA(?)";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    
    // SQL 준비 실패 시,
     if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

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
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('SQL_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array(); // 결과를 저장할 배열

    // 결과를 배열로 변환합니다.
    $response_data = mysqli_fetch_assoc($result);

    // 일치하는 사용자 데이터가 없을 경우
    if ($response_data === null) {
        throw new Exception('회원 정보를 찾을 수 없습니다.', 404);
    }

    // 사용자 상태 확인
    if ($response_data['status'] === "WITHDRAWAL") {
        throw new Exception('탈퇴한 회원 정보입니다.', 403);
    }

    // 사용자 정보 추출
    $userNo = $response_data['user_no'];
    $name = $response_data['name'];
    $perNo = $response_data['per_no'];

    // 사용자 인증 정보를 생성
    $auth = generateAuthData($conn, $userNo);
    $auth['name'] = $name;
    $auth['perNo'] = $perNo;

    
    // 모든 작업 성공 시 성공 응답 반환
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $auth);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
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