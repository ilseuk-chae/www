<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect.php';

try {
    $sql =
        "SELECT 
            a.idx AS company_no,
            a.name AS company_name,
            a.image_path,

            b.idx AS branch_no,
            b.finance_branch_idx,
            b.name AS branch_name,
            b.max_loan_amount AS max_loan_amount,
            b.min_loan_rate AS min_loan_rate,
            b.top_fg,

            c.mobile AS branch_phone,
            c.email AS branch_email,
            c.name AS manager_name

        FROM finance_company AS a

        LEFT JOIN finance_branches AS b
        ON a.idx = b.finance_company_idx
        AND b.active_fg = 'Y'

        LEFT JOIN (
            SELECT user_no, role, name, email, mobile, status_code
            FROM user_master
            WHERE status_code != '005'
            AND role = '003'
        ) AS c
        ON b.manager_no = c.user_no

        WHERE a.active_fg = 'Y'
        ORDER BY a.idx ASC, b.finance_branch_idx ASC;";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('SQL_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();
    $companies = array();

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        // if ($row["image_path"]) {
        //     $row["image_path"] = "/uploads/" . $row['image_path'];
        // }
        $company_no = $row['company_no'];

        // 회사가 아직 배열에 없다면 추가
        if (!isset($companies[$company_no])) {
            $companies[$company_no] = array(
                'company_no' => $row['company_no'],
                'company_name' => $row['company_name'],
                'image_path' => $row['image_path'],
                'branches' => array()
            );
        }

        // 지점 정보 추가
        if ($row['branch_no']) {
            $companies[$company_no]['branches'][] = array(
                'branch_no' => $row['branch_no'],
                'branch_idx' => $row['finance_branch_idx'],
                'branch_name' => $row['branch_name'],
                'branch_phone' => $row['branch_phone'],
                'branch_email' => $row['branch_email'],
                'manager_name' => $row['manager_name'],
                'max_loan_amount' => $row['max_loan_amount'],
                'min_loan_rate' => $row['min_loan_rate'],
                'top_fg' => $row['top_fg']
            );
        }

        // 배열을 인덱스가 있는 형태에서 리스트 형태로 변환
        $response_data = array_values($companies);
    }

    // 성공 응답 반환
    responseApi(200, 'SUCCESS', $response_data);

} catch (Exception $e) {
    // 오류 발생 시 롤백
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