<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

$no = isset($_POST['no']) ? urldecode($_POST['no']) : '';

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    // SQL 쿼리
    $sql =
        "SELECT 
            a.idx AS no,
            a.title,
            a.content,
            DATE_FORMAT(a.reg_date, '%Y-%m-%d') AS reg_date,
            
            b.type_name AS proposal_type
    
        FROM proposal_master AS a

        LEFT JOIN type_master AS b
        ON b.group_code = 'PROPOSAL_TYPE'
        AND a.proposal_type = b.type_code

        WHERE a.idx = ?;
        ";

    // 조건 추가
    $params = [$no];
    $types = 'i';

    // if ($public_fg !== '') {
    //     $sql .= " AND a.public_fg = ?";
    //     $params[] = $public_fg;
    //     $types .= 's';
    // }

    // // 디버깅용으로 최종 쿼리 출력
    // $debug_sql = $sql;
    // foreach ($params as $i => $param) {
    //     $debug_sql = preg_replace('/\?/', "'$param'", $debug_sql, 1);
    // }
    // echo $debug_sql;
    // exit;

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    if (!empty($params)) {
        mysqli_stmt_bind_param($stmt, $types, ...$params);
    }

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('QUERY_EXECUTE_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $response_data = $row;
    }

    // 모든 작업 성공 시 커밋
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

