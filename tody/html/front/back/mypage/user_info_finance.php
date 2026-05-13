<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작
try {
    // 해시로 유저넘버 얻기
    $user_no = get_user_no_for_hash($conn, $userNo);

    ##################### 1. 유저 정보 가져오기 #####################
    $sql =
        "SELECT 
            um.user_no,
            um.id, 
            um.name, 
            um.email, 
            um.mobile,
            um.term_fg,
            um.role,

            fb.finance_branch_idx AS branch_no,
            fb.name AS branch_name,
            fb.phone AS branch_phone,

            fc.idx AS company_no,
            fc.name AS company_name

        FROM user_master AS um

        left JOIN finance_branches AS fb
        ON um.user_no = fb.manager_no
        AND fb.active_fg = 'Y'

        left JOIN finance_company AS fc
        ON fb.finance_company_idx = fc.idx
        AND fc.active_fg = 'Y'

        WHERE um.user_no = ?
        ";

    // 1-1. SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // 1-2. SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 1-3. 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, "i", $user_no);

    // 1-4. SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('UPDATE_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();
    $userArray = array();
    $financeArray = array();

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        // 유저 정보는 한 번만 설정
        if (empty($userInfo)) {
            $userInfo = [
                'id' => $row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'mobile' => $row['mobile'],
                'term_fg' => $row['term_fg'],
                'role' => $row['role']
            ];
        }

        // 금융사 정보가 있는 경우만 배열에 추가
        if (!is_null($row['branch_no']) && !is_null($row['company_no'])) {
            $financeArray[] = [
                'branch_no' => $row['branch_no'],
                'branch_name' => $row['branch_name'],
                'branch_phone' => $row['branch_phone'],
                'company_no' => $row['company_no'],
                'company_name' => $row['company_name']
            ];
        }

    }

    if ($userInfo) {
        $response_data = $userInfo;
        $response_data['finance_info'] = $financeArray;
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
