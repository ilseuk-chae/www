<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/sendAligo.php');

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $user_no = get_user_no_for_hash($conn, $userNo);
    if ($user_no === null) {
        throw new Exception('사용자 정보를 찾을 수 없습니다.', 400);
    }

    // 0. 일반 회원인지 확인
    $sql = 'SELECT role FROM user_master WHERE user_no = ?';
    $stmt = executeQuery($conn, $sql, 'i', [$user_no]);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    if ($row['role'] != '001') {
        throw new Exception('일반 회원만 신청 가능합니다.', 400);
    }

    // 1. 데이터 할당
    $pnu = $_POST['pnu'];

    // 2. 영업점 ID와 영업점명으로 영업점 담당자 전화번호 조회
    $sql = 
    "SELECT 
        a.idx AS request_no,
        DATE_FORMAT(a.reg_date, '%Y.%m.%d') AS reg_date,

        b.finance_company_idx AS company_no,
        b.finance_branch_idx AS branch_no
    FROM finance_support AS a

    INNER JOIN finance_support_list_applied AS b
    ON b.finance_support_idx = a.idx
    
    WHERE a.reg_no = ?
    AND a.pnu_cd = ?";

    $stmt = executeQuery($conn, $sql, 'is', [$user_no, $pnu]);
    $result = mysqli_stmt_get_result($stmt);

    $response_array = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $response_array[] = $row;
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $response_array);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
    // 연결 종료
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    mysqli_close($conn);
}