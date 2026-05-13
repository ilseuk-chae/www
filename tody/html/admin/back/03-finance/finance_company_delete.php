<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

$companyNo = urldecode($_POST['c_no']);

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    ##################### 1. 금융사 제거 #####################
    $sql2 =
        "UPDATE finance_company 
        SET
            active_fg = 'N'
        WHERE idx = ?;
        ";

    // 바인딩할 변수들
    $params = array($rcvUserNo);
    // 실제 실행될 쿼리문
    $bound_query = get_bound_query($sql2, $params);
    // 로그 출력 (이 부분은 실제 코드에서는 로그 파일에 기록하거나 디버깅 콘솔에 출력)
    // echo ($bound_query);

    // 2-1. SQL 문장을 준비합니다.
    $stmt2 = mysqli_prepare($conn, $sql2);

    // 2-2. SQL 준비 실패 시,
    if (!$stmt2) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 203. 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt2, "i", $companyNo);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt2)) {
        throw new Exception('DELETE_FAILED', 500);
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

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
    mysqli_close($conn);
}
?>