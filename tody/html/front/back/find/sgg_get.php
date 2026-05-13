<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

$sido_cd = isset($_POST['sido_cd']) ? urldecode($_POST['sido_cd']) : '';

try {
    // SQL 쿼리
    $sql =
        "SELECT 
            sgg_cd, 
            umd_cd,
            TRIM(SUBSTRING(locatadd_nm, LOCATE(' ', locatadd_nm) + 1)) AS locatadd_nm,
            locat_order
        FROM
            bjd_master
        WHERE 
            sido_cd = ?
            AND depth = 2
            AND NOT (
                SUBSTRING(sgg_cd, 3, 1) = '0' -- sgg_cd의 세번째 문자가 '0'인 경우
                AND EXISTS (
                    SELECT 1
                    FROM bjd_master bm2
                    WHERE bm2.sido_cd = bjd_master.sido_cd
                    AND bm2.depth = 2
                    AND SUBSTRING(bm2.sgg_cd, 1, 2) = SUBSTRING(bjd_master.sgg_cd, 1, 2) -- 서브쿼리와 메인쿼리의 sgg_cd의 앞 두 자리가 서로 일치하는 경우
                    AND bm2.sgg_cd != bjd_master.sgg_cd -- 서브쿼리와 메인쿼리의 sgg_cd가 서로 같지 않는 경우
                )
            )
        ORDER BY 
            locatadd_nm ASC;
        ";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, "s", $sido_cd);

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
