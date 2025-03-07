<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

$no = isset($_POST['no']) ? urldecode($_POST['no']) : '';

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

try {
    // SQL 쿼리
    $sql =
        "SELECT * FROM (
            SELECT 
                'prev' AS type,
                a.idx AS reference_no,
                a.title,
                DATE_FORMAT(a.reg_date, '%Y.%m.%d %H:%i') AS reg_date
            FROM reference_listings AS a
            WHERE a.idx < ?
            AND a.public_fg = 'Y'
            AND a.active_fg = 'Y'
            ORDER BY a.idx DESC
            LIMIT 1
        ) AS previous

        UNION ALL

        SELECT * FROM (
            SELECT 
                'next' AS type,
                a.idx AS reference_no,
                a.title,
                DATE_FORMAT(a.reg_date, '%Y.%m.%d %H:%i') AS reg_date
            FROM reference_listings AS a
            WHERE a.idx > ?
            AND a.public_fg = 'Y'
            AND a.active_fg = 'Y'
            ORDER BY a.idx ASC
            LIMIT 1
        ) AS next ; ";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, "ii", $no, $no);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('QUERY_EXECUTE_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array(
        'previous' => null,
        'next' => null
    );


    while ($row = mysqli_fetch_assoc($result)) {
        if ($row['type'] == 'prev') {
            $response_data['previous'] = $row;
        } elseif ($row['type'] == 'next') {
            $response_data['next'] = $row;
        }
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

