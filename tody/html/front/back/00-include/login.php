<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

// POST 데이터 가져오기
$id       = isset($_POST['id'])       ? urldecode($_POST['id'])       : null;
$password = isset($_POST['password']) ? urldecode($_POST['password']) : null;
$force    = isset($_POST['force'])    ? $_POST['force']               : 'false';

// 입력 데이터 유효성 검사
if (!$id || !$password) {
    responseApi(400, 'NO_PARAMETER', null);
    exit;
}

mysqli_autocommit($conn, FALSE);
mysqli_begin_transaction($conn);

try {
    $response_data = array();

    ##################### 1. 유저 정보 가져오기 #####################
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
        WHERE a.id = ?;";

    $params = [$id];
    $types  = 's';
    $stmt   = mysqli_prepare($conn, $sql);
    if (!$stmt)                     throw new Exception('QUERY_PREPARATION_FAILED', 500);
    mysqli_stmt_bind_param($stmt, $types, ...$params);
    if (!mysqli_stmt_execute($stmt)) throw new Exception('EXECUTION_FAILED', 500);

    $result    = mysqli_stmt_get_result($stmt);
    $user_data = mysqli_fetch_assoc($result);

    if (!$user_data)                                                         throw new Exception('등록된 회원 정보를 찾을 수 없습니다.', 401);
    if (!password_verify($password, $user_data["password"]))                 throw new Exception('비밀번호가 일치하지 않습니다.', 401);
    if ($user_data['status_code'] !== "001" && $user_data['status_code'] !== "006") throw new Exception($user_data['status'], 403);

    $secretKey      = 'tody2024';
    $hashed_user_no = hash_hmac('sha256', $user_data['user_no'], $secretKey);

    $response_data['userNo']      = $hashed_user_no;
    $response_data['name']        = $user_data['name'];
    $response_data['agency_name'] = $user_data['agency_name'];
    $response_data['role']        = $user_data['role'];
    $response_data['status']      = $user_data['status'];
    $response_data['userId']      = $id;

    ##################### 2. 기기 타입 판별 #####################
    $ua         = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $deviceType = preg_match('/(Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone)/i', $ua)
        ? 'MOBILE' : 'PC';
    $actualUserNo = $user_data['user_no'];

    ##################### 2-1. 만료 세션 자동 정리 #####################
    // 강제 로그아웃 후 피해 브라우저가 감지 못한 잔여 행, 2시간 이상 비활성 세션 정리
    $sql_clean = "DELETE FROM user_sessions
                  WHERE user_no = ? AND user_type = 'FRONT'
                    AND (is_forced_logout = 1 OR last_activity < DATE_SUB(NOW(), INTERVAL 2 HOUR))";
    $stmt_clean = mysqli_prepare($conn, $sql_clean);
    if ($stmt_clean) {
        mysqli_stmt_bind_param($stmt_clean, "s", $actualUserNo);
        mysqli_stmt_execute($stmt_clean);
        mysqli_stmt_close($stmt_clean);
    }

    ##################### 3. 기존 세션 확인 #####################
    $sql_sess = "SELECT session_id, session_token,
                        TIMESTAMPDIFF(SECOND, last_activity, NOW()) AS idle_seconds
                 FROM user_sessions
                 WHERE user_no = ? AND user_type = 'FRONT' AND device_type = ? AND is_forced_logout = 0";
    $stmt_sess = mysqli_prepare($conn, $sql_sess);
    if (!$stmt_sess) throw new Exception('QUERY_PREPARATION_FAILED', 500);
    mysqli_stmt_bind_param($stmt_sess, "ss", $actualUserNo, $deviceType);
    if (!mysqli_stmt_execute($stmt_sess)) throw new Exception('EXECUTION_FAILED', 500);
    $result_sess      = mysqli_stmt_get_result($stmt_sess);
    $existingSession  = mysqli_fetch_assoc($result_sess);

    ##################### 4. 중복 접속 감지 (force=false) #####################
    // 3분(180초) 이상 비활성 세션은 경고 없이 교체 (브라우저 닫은 후 재로그인 케이스)
    $isActiveSession = $existingSession && ($existingSession['idle_seconds'] < 180);
    if ($isActiveSession && $force !== 'true') {
        mysqli_rollback($conn);
        responseApi(200, 'DUPLICATE_SESSION', [
            'isDuplicate'          => true,
            'existingSessionToken' => $existingSession['session_token'],
            'deviceType'           => $deviceType,
        ]);
        exit;
    }

    ##################### 5. 기존 세션 강제 로그아웃 처리 #####################
    if ($existingSession) {
        $sql_force = "UPDATE user_sessions SET is_forced_logout = 1 WHERE session_id = ?";
        $stmt_force = mysqli_prepare($conn, $sql_force);
        if (!$stmt_force) throw new Exception('QUERY_PREPARATION_FAILED', 500);
        mysqli_stmt_bind_param($stmt_force, "i", $existingSession['session_id']);
        if (!mysqli_stmt_execute($stmt_force)) throw new Exception('EXECUTION_FAILED', 500);
    }

    ##################### 6. token 업데이트 #####################
    $sql2 =
        "UPDATE user_master SET
            token = substring(SHA1(CONCAT('2024tody@#$',now())), 3, 32)
        WHERE id = ?;";
    $stmt2 = mysqli_prepare($conn, $sql2);
    if (!$stmt2) throw new Exception('QUERY_PREPARATION_FAILED', 500);
    mysqli_stmt_bind_param($stmt2, $types, ...$params);
    if (!mysqli_stmt_execute($stmt2)) throw new Exception('EXECUTION_FAILED', 500);

    ##################### 7. token 가져오기 #####################
    $sql3 = "SELECT token FROM user_master WHERE id = ?;";
    $stmt3 = mysqli_prepare($conn, $sql3);
    if (!$stmt3) throw new Exception('QUERY_PREPARATION_FAILED', 500);
    mysqli_stmt_bind_param($stmt3, $types, ...$params);
    if (!mysqli_stmt_execute($stmt3)) throw new Exception('EXECUTION_FAILED', 500);
    $result3 = mysqli_stmt_get_result($stmt3);
    $row3    = mysqli_fetch_assoc($result3);
    $response_data['userToken'] = $row3['token'];

    ##################### 8. 새 세션 등록 #####################
    $newSessionToken = bin2hex(random_bytes(16));
    $ipAddress       = $_SERVER['REMOTE_ADDR'] ?? '';

    $sql4 = "INSERT INTO user_sessions (user_no, user_type, device_type, session_token, ip_address)
             VALUES (?, 'FRONT', ?, ?, ?)";
    $stmt4 = mysqli_prepare($conn, $sql4);
    if (!$stmt4) throw new Exception('QUERY_PREPARATION_FAILED', 500);
    mysqli_stmt_bind_param($stmt4, "ssss", $actualUserNo, $deviceType, $newSessionToken, $ipAddress);
    if (!mysqli_stmt_execute($stmt4)) throw new Exception('EXECUTION_FAILED', 500);

    $response_data['sessionToken'] = $newSessionToken;

    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $response_data);

} catch (Exception $e) {
    mysqli_rollback($conn);
    $statusCode = $e->getCode() ? $e->getCode() : 500;
    responseApi($statusCode, $e->getMessage(), null);

} finally {
    if (isset($stmt))       mysqli_stmt_close($stmt);
    if (isset($stmt2))      mysqli_stmt_close($stmt2);
    if (isset($stmt3))      mysqli_stmt_close($stmt3);
    if (isset($stmt4))      mysqli_stmt_close($stmt4);
    if (isset($stmt_sess))  mysqli_stmt_close($stmt_sess);
    if (isset($stmt_force)) mysqli_stmt_close($stmt_force);
    mysqli_close($conn);
}
