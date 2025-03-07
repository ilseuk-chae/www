<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect.php';

$fin_no = urldecode($_POST['fin_no']);

try {
    $sql =
        "SELECT 
            a.idx AS support_no,
            a.address_road,
            a.address_jibun,
            a.address_detail,
            a.loan_desired_amount,
            a.additional_note,
            DATE_FORMAT(a.reg_date, '%Y-%m-%d') AS reg_date, 

            c.name AS c_name,
            d.name AS b_name,

            e.name AS reg_name,
            e.mobile AS mobile,

            f.description_ko AS status_description

        FROM finance_support AS a

        INNER JOIN finance_support_list_applied AS b
        ON a.idx = b.finance_support_idx

        INNER JOIN finance_company AS c 
        ON b.finance_company_idx = c.idx

        INNER JOIN finance_branches AS d
        ON b.finance_company_idx = d.finance_company_idx
        AND b.finance_branch_idx = d.finance_branch_idx

        INNER JOIN user_master AS e
        ON a.reg_no = e.user_no

        INNER JOIN status_code AS f
        ON f.group_code = 'SUPPORT_STATUS'
        AND b.status_code = f.status_code
        AND f.use_fg = 'Y'

        WHERE a.idx = ?
        
        ORDER BY a.idx DESC, b.finance_company_idx ASC, b.finance_branch_idx ASC;";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // SQL 준비 실패 시,
    if (!$stmt) {
        responseApi(500, 'QUERY_PREPARATION_FAILED', null);
        exit;
    }


    // 변수 바인딩 (s: string, i: integer 등)
    if (!mysqli_stmt_bind_param($stmt, "i", $fin_no)) {
        throw new Exception('BINDING_FAILED', 500);
    }

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('EXECUTION_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();
    $supports = array();
    $current_support_no = null;

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        if ($current_support_no !== $row['support_no']) {
            // 새로운 support_no가 등장하면, 새로운 지원 정보를 시작
            $current_support_no = $row['support_no'];

            // 회사가 아직 배열에 없다면 추가
            $supports = array(
                'support_no' => $row['support_no'],
                'address_total' => $row['address_total'],
                'address_road' => $row['address_road'],
                'address_jibun' => $row['address_jibun'],
                'address_detail' => $row['address_detail'],
                'loan_desired_amount' => comma($row['loan_desired_amount']) . '원',
                'additional_note' => $row['additional_note'],
                'reg_date' => $row['reg_date'],
                'reg_name' => $row['reg_name'],
                'mobile' => $row['mobile'],
                'branches' => array()
            );
        }

        // 지점 정보 추가
        if ($row['b_name']) {
            $supports['branches'][] = array(
                'c_name' => $row['c_name'],
                'b_name' => $row['b_name'],
                'status_description' => $row['status_description']
            );
        }
    }

    $response_data = $supports;

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