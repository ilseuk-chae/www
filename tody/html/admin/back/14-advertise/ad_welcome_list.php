<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect.php';

try {
    $sql =
        "SELECT 
            a.idx AS ad_no,
            a.ad_name,
            a.ad_url,
            a.ad_image_name,
            a.active_fg,
            a.show_fg,
            DATE_FORMAT(a.start_date, '%Y-%m-%d') AS start_date, -- 이 부분 수정
            DATE_FORMAT(a.end_date, '%Y-%m-%d') AS end_date,     -- 이 부분도 수정
            a.reg_date,
            a.ad_image -- CONCAT('adwelcome/', a.idx, '/', a.ad_image) AS ad_image            
        FROM advertise_welcome AS a
        -- WHERE
        -- a.active_fg = 'Y' AND  -- 활성화된 광고만
        -- a.show_fg = 'Y' AND    -- 노출 설정된 광고만
        -- a.start_date <= CURDATE() AND -- 시작일이 오늘 이하인 광고
        -- a.end_date >= CURDATE()       -- 종료일이 오늘 이상인 광고
        ORDER BY a.idx ASC;";

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

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        // if ($row["image_path"]) {
        //     $row["image_path"] = "/uploads/" . $row['image_path'];
        // }
        $response_data[] = $row;
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
    mysqli_close($conn);
}