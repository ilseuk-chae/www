<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");
$html = isset($_POST['content']) ? urldecode($_POST['content']) : "";
// echo $html;exit;
// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

$start = isset($_POST['start']) ? urldecode($_POST['start']) : 0;

try {

    $sql =
        "SELECT 
            a.idx AS branch_no,
            a.name AS branch_name,
            a.max_loan_amount AS max_loan_amount,
            a.min_loan_rate AS min_loan_rate,
            
            b.name AS company_name,
            b.image_path

        FROM finance_branches AS a

        INNER JOIN finance_company AS b
        ON a.finance_company_idx = b.idx
        AND b.active_fg = 'Y'

        WHERE a.active_fg = 'Y'
        ORDER BY 
            CASE WHEN a.top_fg = 'Y' THEN 1 ELSE 2 END ASC,  -- top_fg='Y'를 먼저 우선순위로
            -- a.top_fg DESC,  -- top_fg가 'Y'일 때, 우선순위가 유지되도록 추가 정렬
            a.max_loan_amount DESC, 
            a.min_loan_rate ASC, 
            a.idx ASC
        LIMIT 10 OFFSET ?
        ;";

    // 조건 추가
    $params = [$start];
    $types = 'i';

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }
    
    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, $types, ...$params);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('SQL_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();
    $branches = array();

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        // if ($row["image_path"]) {
        //     $row["image_path"] = "/uploads/" . $row['image_path'];
        // }

        // 지점 정보 추가
        $response_data[] = array(
            'branch_no' => $row['branch_no'],
            'branch_name' => $row['branch_name'],
            'max_loan_amount' => $row['max_loan_amount'],
            'min_loan_rate' => $row['min_loan_rate'],
            'company_name' => $row['company_name'],
            'image_path' => $row['image_path'],
        );

    }

    // 배열을 인덱스가 있는 형태에서 리스트 형태로 변환
    // $response_data = array_values($branches);
    
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
