<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

// POST 데이터 가져오기
$email = isset($_POST['email']) ? urldecode($_POST['email']) : null;
$name = isset($_POST['name']) ? urldecode($_POST['name']) : null;
$id = isset($_POST['id']) ? urldecode($_POST['id']) : null;
$mobile = isset($_POST['mobile']) ? urldecode($_POST['mobile']) : null;

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 결과를 담을 배열 선언.
    $response_data = array();

    // ----------------------------------------------------------------------------------------------------------------
    // 유저 정보 가져오기 
    // ----------------------------------------------------------------------------------------------------------------
    // SQL 쿼리
    $user_sql =
        "SELECT 
            a.user_no, 
            a.user_no_hmac,
            a.name, 
            a.role,
            a.email,
            a.status_code,
            b.description_ko AS status
        FROM user_master as a

        INNER JOIN status_code AS b
        ON b.group_code = 'USER_STATUS'
        AND a.status_code = b.status_code

        WHERE a.sns_id = ?
        AND a.platform = 'kakao' ; ";

    // 조건 추가
    $params = [$id];
    $types = 's';

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $user_sql);
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
    $user_data = mysqli_fetch_assoc($result); // 결과를 배열로 변환합니다.

    // ----------------------------------------------------------------------------------------------------------------
    // 유저 정보가 없는 경우, 회원 가입 처리
    // ----------------------------------------------------------------------------------------------------------------
    if (!$user_data) {
        $loginParams = [$id, $name, $email, $mobile];
        $loginTypes = 'ssss';

        $register_sql =
            "INSERT INTO user_master (
                role, platform, sns_id, name, email, mobile, relationship_fg, event_rcv_fg, term_fg, status_code
            ) VALUES (
                '001', 'kakao', ?, ?, ?, ?, 'N', 'Y', 'Y', '001'
            ); ";

        // SQL 문장을 준비합니다.
        $register_stmt = mysqli_prepare($conn, $register_sql);
        if (!$register_stmt) {
            throw new Exception('QUERY_PREPARATION_FAILED', 500);
        }

        // 변수 바인딩 (s: string, i: integer 등)
        mysqli_stmt_bind_param($register_stmt, $loginTypes, ...$loginParams);

        // SQL 문장을 실행합니다.
        if (!mysqli_stmt_execute($register_stmt)) {
            throw new Exception('EXECUTION_FAILED', 500);
        }

        // 새로 생성된 primary key 가져오기
        $user_no = mysqli_insert_id($conn);
        if (!$user_no) {
            throw new Exception('FAILED_TO_RETRIEVE_INSERT_ID', 500);
        }

        // HMAC(SHA-256) hash key 생성
        $secretKey = 'tody2024';
        $hashed_user_no = hash_hmac('sha256', $user_no, $secretKey);

        $update_hmac_sql =
            "UPDATE user_master 
            SET user_no_hmac = ?
            WHERE sns_id = ? ;";

        // SQL 문장을 준비합니다.
        $update_hmac_stmt = mysqli_prepare($conn, $update_hmac_sql);
        if (!$update_hmac_stmt) {
            throw new Exception('QUERY_PREPARATION_FAILED', 500);
        }

        // 변수 바인딩 (s: string, i: integer 등)
        mysqli_stmt_bind_param($update_hmac_stmt, 'ss', $hashed_user_no, $id);

        // SQL 문장을 실행합니다.
        if (!mysqli_stmt_execute($update_hmac_stmt)) {
            throw new Exception('EXECUTION_FAILED', 500);
        }

        // 결과에 담을 데이터
        $role = '001';
        $status = '활성';

    } else {
        // 사용자 상태 확인
        if ($user_data['status_code'] !== "001") {
            throw new Exception($user_data['status'], 403);
        }

        // 결과에 담을 데이터
        $user_no = $user_data['user_no'];
        $hashed_user_no = $user_data['user_no_hmac'];
        $name = $user_data['name'];
        $role = $user_data['role'];
        $status = $user_data['status'];
    }

    // 사용자 정보 응답 데이터에 추가
    $response_data['userNo'] = $hashed_user_no;
    $response_data['name'] = $name;
    $response_data['role'] = $role;
    $response_data['status'] = $status;
    $response_data['userId'] = $id;

    // ----------------------------------------------------------------------------------------------------------------
    // token 업데이트
    // ----------------------------------------------------------------------------------------------------------------
    $update_token_sql =
        "UPDATE user_master SET
            token = substring(SHA1(CONCAT('2024tody@#$',now())), 3, 32)
        WHERE sns_id = ?;
    ";

    // SQL 문장을 준비합니다.
    $update_token_sql = mysqli_prepare($conn, $update_token_sql);
    if (!$update_token_sql) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($update_token_sql, $types, ...$params);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($update_token_sql)) {
        throw new Exception('EXECUTION_FAILED', 500);
    }


    // ----------------------------------------------------------------------------------------------------------------
    // token 가져오기
    // ----------------------------------------------------------------------------------------------------------------
    $select_token_sql =
        "SELECT token
        FROM user_master
        WHERE sns_id = ?;
    ";

    // SQL 문장을 준비합니다.
    $select_token_stmt = mysqli_prepare($conn, $select_token_sql);
    if (!$select_token_stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($select_token_stmt, $types, ...$params);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($select_token_stmt)) {
        throw new Exception('EXECUTION_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $token_result = mysqli_stmt_get_result($select_token_stmt);
    $token_row = mysqli_fetch_assoc($token_result);

    $response_data['userToken'] = $token_row['token'];

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
    if (isset($register_stmt)) {
        mysqli_stmt_close($register_stmt);
    }
    if (isset($update_hmac_stmt)) {
        mysqli_stmt_close($update_hmac_stmt);
    }
    if (isset($update_token_stmt))
        mysqli_stmt_close($update_token_stmt);
    if (isset($select_token_stmt))
        mysqli_stmt_close($select_token_stmt);
    mysqli_close($conn);
}

?>