<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/authChk.php';
include_once '../00-include/common.php';

$lang = $_POST['langCode'];
$rcvUserNo = $_POST['rcvUser'];

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    ##################### 1. 유저 정보 가져오기 #####################
    $sql =
        "SELECT 
        a.user_no, 
        a.id, 
        a.name, 
        a.email, 
        a.mobile, 
        a.status_code,
        b.idx AS branch_select,
        c.idx AS company_select
    FROM user_master AS a

    LEFT JOIN finance_branches AS b 
    ON b.manager_no = a.user_no

    LEFT JOIN finance_company AS c 
    ON b.finance_company_idx = c.idx

    WHERE SHA2(a.user_no, 256) = ?
    ";

    // 1-1. SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // 1-2. SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 1-3. 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, "s", $rcvUserNo);

    // 1-4. SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('UPDATE_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $row['user_no'] = hash('sha256', $row['user_no']);
        $response_data = $row;
    }

    // 데이터가 없을 경우
    if (empty($response_data)) {
        throw new Exception('NO_DATA', 404);
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $response_data);

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
