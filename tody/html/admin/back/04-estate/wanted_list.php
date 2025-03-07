<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

$sido = isset($_POST['sido']) ? urldecode($_POST['sido']) : '';
$sgg = isset($_POST['sgg']) ? urldecode($_POST['sgg']) : '';
$estate_type = isset($_POST['estate_type']) ? urldecode($_POST['estate_type']) : '';
$sale_type = isset($_POST['sale_type']) ? urldecode($_POST['sale_type']) : '';
$min_price = isset($_POST['min_price']) ? urldecode($_POST['min_price']) : '';
$max_price = isset($_POST['max_price']) ? urldecode($_POST['max_price']) : '';
$min_area = isset($_POST['min_area']) ? urldecode($_POST['min_area']) : '';
$max_area = isset($_POST['max_area']) ? urldecode($_POST['max_area']) : '';
$public_fg = isset($_POST['public_fg']) ? urldecode($_POST['public_fg']) : '';

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    // SQL 쿼리
    $sql =
        "SELECT 
            a.idx AS wanted_no,
            a.sido_cd,
            a.sgg_cd,
            a.exchange_fg,
            a.min_price,
            a.max_price,
            a.min_area,
            a.max_area,
            a.phone,
            a.noti_count,
            a.view_count,
            a.public_fg,
            DATE_FORMAT(a.reg_date, '%Y-%m-%d') AS reg_date,
    
            b.type_name AS estate_type,
            c.type_name AS sale_type,

            d.locallow_nm AS sido,
            TRIM(SUBSTR(e.locatadd_nm, LOCATE(' ', e.locatadd_nm) + 1)) AS sgg

        FROM wanted_listings AS a
    
        INNER JOIN type_master AS b
        ON b.group_code = 'ESTATE_TYPE'
        AND a.estate_type = b.type_code
    
        INNER JOIN type_master AS c
        ON c.group_code = 'SALE_TYPE'
        AND a.sale_type = c.type_code

        LEFT JOIN bjd_master AS d
            ON a.sido_cd = d.sido_cd 
            AND d.depth = 1 -- 시/도를 구분하는 조건 (시/도 레벨에 해당하는 조건)

        LEFT JOIN bjd_master AS e
            ON a.sido_cd = e.sido_cd
            AND a.sgg_cd = e.sgg_cd
            AND e.depth = 2 -- 시/군/구 레벨에 해당하는 조건
        
        WHERE a.active_fg = 'Y'
        ";

    // 조건 추가
    $params = [];
    $types = '';

    if ($sido !== '') {
        $sql .= " AND a.sido_cd = ?";
        $params[] = $sido;
        $types .= 's';
    }
    if ($sgg !== '') {
        $sql .= " AND a.sgg_cd = ?";
        $params[] = $sgg;
        $types .= 's';
    }
    if ($estate_type !== '') {
        $sql .= " AND a.estate_type = ?";
        $params[] = $estate_type;
        $types .= 's';
    }
    if ($sale_type !== '') {
        $sql .= " AND a.sale_type = ?";
        $params[] = $sale_type;
        $types .= 's';
    }
    if ($min_price !== '') {
        $sql .= " AND a.min_price >= ?";
        $params[] = $min_price;
        $types .= 'i';
    }
    if ($max_price !== '') {
        $sql .= " AND a.max_price <= ?";
        $params[] = $max_price;
        $types .= 'i';
    }
    if ($min_area !== '') {
        $sql .= " AND a.min_area >= ?";
        $params[] = $min_area;
        $types .= 'i';
    }
    if ($max_area !== '') {
        $sql .= " AND a.max_area <= ?";
        $params[] = $max_area;
        $types .= 'i';
    }
    if ($public_fg !== '') {
        $sql .= " AND a.public_fg = ?";
        $params[] = $public_fg;
        $types .= 's';
    }

    $sql .= " ORDER BY a.idx DESC; ";

    // 디버깅용으로 최종 쿼리 출력
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
