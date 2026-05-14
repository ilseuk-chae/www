<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect.php';

// POST 데이터 가져오기
$id       = isset($_POST['id'])       ? urldecode($_POST['id']) : null;
$password = isset($_POST['password']) ? $_POST['password']      : null;
$force    = isset($_POST['force'])    ? $_POST['force']         : 'false';

// 입력 데이터 유효성 검사
if (!$id || !$password) {
    responseApi(400, '아이디 또는 비밀번호를 확인해주세요.', 'error');
    exit;
}

// User-Agent로 기기 타입 판별 (PC / MOBILE)
function getDeviceType() {
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    return preg_match('/(Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone)/i', $ua)
        ? 'MOBILE' : 'PC';
}

mysqli_autocommit($conn, FALSE);
mysqli_begin_transaction($conn);

try {
    ##################### 1. 사용자 인증 #####################
    $sql = "SELECT user_no, name, status, per_no
            FROM user_admin
            WHERE id = ? AND password = EBGA_CREATE_PW_SHA(?)";

    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) throw new Exception('QUERY_PREPARATION_FAILED', 500);
    mysqli_stmt_bind_param($stmt, "ss", $id, $password);
    if (!mysqli_stmt_execute($stmt)) throw new Exception('SQL_FAILED', 500);

    $result       = mysqli_stmt_get_result($stmt);
    $response_data = mysqli_fetch_assoc($result);

    if ($response_data === null)                        throw new Exception('회원 정보를 찾을 수 없습니다.', 404);
    if ($response_data['status'] === "WITHDRAWAL")      throw new Exception('탈퇴한 회원 정보입니다.', 403);

    $userNo = $response_data['user_no'];
    $name   = $response_data['name'];
    $perNo  = $response_data['per_no'];

    ##################### 2. 기기 타입 판별 #####################
    $deviceType = getDeviceType();

    ##################### 3. 기존 세션 확인 #####################
    $sql2 = "SELECT session_id, session_token
             FROM user_sessions
             WHERE user_no = ? AND user_type = 'ADMIN' AND device_type = ? AND is_forced_logout = 0";
    $stmt2 = mysqli_prepare($conn, $sql2);
    if (!$stmt2) throw new Exception('QUERY_PREPARATION_FAILED', 500);
    mysqli_stmt_bind_param($stmt2, "ss", $userNo, $deviceType);
    if (!mysqli_stmt_execute($stmt2)) throw new Exception('SQL_FAILED', 500);
    $result2        = mysqli_stmt_get_result($stmt2);
    $existingSession = mysqli_fetch_assoc($result2);

    ##################### 4. 중복 접속 감지 (force=false) #####################
    if ($existingSession && $force !== 'true') {
        mysqli_rollback($conn);
        responseApi(409, 'DUPLICATE_SESSION', [
            'existingSessionToken' => $existingSession['session_token'],
            'deviceType'           => $deviceType,
        ]);
        exit;
    }

    ##################### 5. 기존 세션 강제 로그아웃 처리 #####################
    if ($existingSession) {
        $sql3 = "UPDATE user_sessions SET is_forced_logout = 1 WHERE session_id = ?";
        $stmt3 = mysqli_prepare($conn, $sql3);
        if (!$stmt3) throw new Exception('QUERY_PREPARATION_FAILED', 500);
        mysqli_stmt_bind_param($stmt3, "i", $existingSession['session_id']);
        if (!mysqli_stmt_execute($stmt3)) throw new Exception('SQL_FAILED', 500);
    }

    ##################### 6. 인증 데이터 생성 #####################
    $auth          = generateAuthData($conn, $userNo);
    $auth['name']  = $name;
    $auth['perNo'] = $perNo;

    ##################### 7. 새 세션 등록 #####################
    $newSessionToken = bin2hex(random_bytes(16));
    $ipAddress       = $_SERVER['REMOTE_ADDR'] ?? '';

    $sql4 = "INSERT INTO user_sessions (user_no, user_type, device_type, session_token, ip_address)
             VALUES (?, 'ADMIN', ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                 session_token    = VALUES(session_token),
                 ip_address       = VALUES(ip_address),
                 is_forced_logout = 0,
                 created_at       = NOW(),
                 last_activity    = NOW()";
    $stmt4 = mysqli_prepare($conn, $sql4);
    if (!$stmt4) throw new Exception('QUERY_PREPARATION_FAILED', 500);
    mysqli_stmt_bind_param($stmt4, "ssss", $userNo, $deviceType, $newSessionToken, $ipAddress);
    if (!mysqli_stmt_execute($stmt4)) throw new Exception('SQL_FAILED', 500);

    $auth['sessionToken'] = $newSessionToken;

    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $auth);

} catch (Exception $e) {
    mysqli_rollback($conn);
    responseApi($e->getCode() ?: 500, $e->getMessage(), null);

} finally {
    if (isset($stmt))  mysqli_stmt_close($stmt);
    if (isset($stmt2)) mysqli_stmt_close($stmt2);
    if (isset($stmt3)) mysqli_stmt_close($stmt3);
    if (isset($stmt4)) mysqli_stmt_close($stmt4);
    mysqli_close($conn);
}
