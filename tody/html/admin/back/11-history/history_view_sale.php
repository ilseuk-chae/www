<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/validation.php';
include_once '../00-include/authChk.php';

try {
    $period = isset($_POST['period']) ? intval($_POST['period']) : 1;
    $pnu = isset($_POST['pnu']) ? urldecode($_POST['pnu']) : '';
    $limit = isset($_POST['limit']) ? intval($_POST['limit']) : 5;
    $offset = isset($_POST['offset']) ? intval($_POST['offset']) : 0;
    // pnu 조건이 있을 경우와 없을 경우 SQL 다르게 구성
    if (!empty($pnu)) {
        // pnu가 있는 경우
        $sql =
            "SELECT 
                pnu,
                address_jibun, 
                latitude,
                longitude,
                estate_no,
                COUNT(estate_no) AS count
                
            FROM history_recent_sale

            WHERE pnu LIKE CONCAT(?, '%')
            AND reg_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)

            GROUP BY estate_no
            ORDER BY count DESC
            LIMIT ? OFFSET ?";

        // SQL 문장을 준비합니다.
        $stmt = mysqli_prepare($conn, $sql);
        if (!$stmt) {
            throw new Exception('QUERY_PREPARATION_FAILED', 500);
        }

        // 변수 바인딩 (s: string, i: integer 등)
        mysqli_stmt_bind_param($stmt, "siii", $pnu, $period, $limit, $offset);
    } else {
        // pnu가 없는 경우 (전체 데이터 조회)
        // SQL 쿼리
        $sql =
            "SELECT 
                pnu,
                address_jibun, 
                latitude,
                longitude,
                estate_no,
                COUNT(estate_no) AS count
                
            FROM history_recent_sale

            WHERE reg_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)

            GROUP BY estate_no
            ORDER BY count DESC
            LIMIT ? OFFSET ?
            ";

        // SQL 문장을 준비합니다.
        $stmt = mysqli_prepare($conn, $sql);
        if (!$stmt) {
            throw new Exception('QUERY_PREPARATION_FAILED', 500);
        }

        // 변수 바인딩 (s: string, i: integer 등)
        mysqli_stmt_bind_param($stmt, "iii", $period, $limit, $offset);
    }

    // echo get_bound_query($sql, [$period, $limit, $offset]);
    
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
        $response_data[] = $row;
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
