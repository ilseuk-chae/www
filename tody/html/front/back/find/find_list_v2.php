<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

// *** 변수 명시적 초기화 (Undefined variable 경고 방지) ***
$sido = '';
$sgg = '';
$estate_type = []; // estate_type을 빈 '배열'로 초기화
$sale_type = [];   // sale_type을 빈 '배열'로 초기화
$minPrice = '';
$maxPrice = '';
$minArea = '';
$maxArea = '';
$sort = '';
$page = 1;
$items_per_page = 12;
// *** 초기화 끝 ***

$sido = isset($_POST['sido']) ? urldecode($_POST['sido']) : $sido;
$sgg = isset($_POST['sgg']) ? urldecode($_POST['sgg']) : $sgg;
$estate_type = isset($_POST['estateType']) && is_array($_POST['estateType']) ? $_POST['estateType'] : $estate_type;
$sale_type = isset($_POST['saleType']) && is_array($_POST['saleType']) ? $_POST['saleType'] : $sale_type;
$minPrice = isset($_POST['minPrice']) ? urldecode($_POST['minPrice']) : $minPrice;
$maxPrice = isset($_POST['maxPrice']) ? urldecode($_POST['maxPrice']) : $maxPrice;
$minArea = isset($_POST['minArea']) ? urldecode($_POST['minArea']) : $minArea;
$maxArea = isset($_POST['maxArea']) ? urldecode($_POST['maxArea']) : $maxArea;
$sort = isset($_POST['sort']) ? urldecode($_POST['sort']) : $sort;
$page = isset($_POST['page']) ? intval($_POST['page']) : $page;
$items_per_page = isset($_POST['itemsPerPage']) ? intval($_POST['itemsPerPage']) : $items_per_page;
$offset = ($page - 1) * $items_per_page;

try {
    // SQL 쿼리
    $sql =
        "SELECT SQL_CALC_FOUND_ROWS
            a.idx AS wanted_no,
            a.sido_cd,
            a.sgg_cd,
            a.exchange_fg,
            (SELECT type_name FROM type_master WHERE group_code = 'SUB_ESTATE_TYPE' AND type_code = a.sub_estate LIMIT 1) AS sub_estate,
            a.min_price,
            a.max_price,
            a.min_area,
            a.max_area,
            a.phone,
            a.noti_count,
            a.view_count,
            a.public_fg,
            DATE_FORMAT(a.reg_date, '%Y.%m.%d') AS reg_date,

            b.type_name AS estate_type,
            c.type_name AS sale_type,

            d.locallow_nm AS sido,
            TRIM(SUBSTR(e.locatadd_nm, LOCATE(' ', e.locatadd_nm) + 1)) AS sgg

        FROM wanted_listings_v2 AS a

        INNER JOIN type_master AS b
        ON b.group_code = 'NEW_ESTATE_TYPE'
        AND a.estate_type = b.type_code

        INNER JOIN type_master AS c
        ON c.group_code = 'TRANSACTION_TYPE'
        AND a.sale_type = c.type_code

        LEFT JOIN bjd_master AS d
            ON a.sido_cd = d.sido_cd
            AND d.depth = 1 -- 시/도를 구분하는 조건 (시/도 레벨에 해당하는 조건)

        LEFT JOIN bjd_master AS e
            ON a.sido_cd = e.sido_cd
            AND a.sgg_cd = e.sgg_cd
            AND e.depth = 2 -- 시/군/구 레벨에 해당하는 조건

        WHERE a.active_fg = 'Y'
        AND a.public_fg IN ('Y', 'C')
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
    if (!empty($estate_type)) {
        $placeholders = implode(',', array_fill(0, count($estate_type), '?'));
        $sql .= " AND a.estate_type IN ($placeholders)";
        $params = array_merge($params, $estate_type);
        $types .= str_repeat('s', count($estate_type));
    }
    if (!empty($sale_type)) {
        $placeholders = implode(',', array_fill(0, count($sale_type), '?'));
        $sql .= " AND a.sale_type IN ($placeholders)";
        $params = array_merge($params, $sale_type);
        $types .= str_repeat('s', count($sale_type));
    }
    if ($minPrice !== '') {
        $sql .= " AND a.min_price >= ?";
        $params[] = $minPrice;
        $types .= 'i';
    }
    if ($maxPrice !== '') {
        $sql .= " AND a.max_price <= ?";
        $params[] = $maxPrice;
        $types .= 'i';
    }
    if ($minArea !== '') {
        $sql .= " AND a.min_area >= ?";
        $params[] = $minArea;
        $types .= 'i';
    }
    if ($maxArea !== '') {
        $sql .= " AND a.max_area <= ?";
        $params[] = $maxArea;
        $types .= 'i';
    }
    if ($sort == 'views') {
        $sql .= " ORDER BY a.view_count DESC, a.idx DESC ";
    } elseif ($sort == 'price') {
        $sql .= " ORDER BY a.max_price DESC, a.min_price DESC, a.idx DESC ";
    } else {
        $sql .= " ORDER BY a.idx DESC ";
    }

    // 페이징 추가
    $sql .= " LIMIT ? OFFSET ? ;";
    $params[] = $items_per_page;
    $params[] = $offset;
    $types .= 'ii';

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩
    if (!empty($params)) {
        if (strlen($types) !== count($params)) {
            throw new Exception('BINDING_PARAMS_MISMATCH', 500);
        }
        if (!mysqli_stmt_bind_param($stmt, $types, ...$params)) {
            throw new Exception('QUERY_BINDING_FAILED', 500);
        }
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

    // 전체 레코드 수 가져오기
    $count_sql = "SELECT FOUND_ROWS()";
    $count_result = mysqli_query($conn, $count_sql);
    $total_records = mysqli_fetch_array($count_result)[0];

    // 총 페이지 수 계산
    $total_pages = ceil($total_records / $items_per_page);

    $response_array = [
        'responseData' => $response_data,
        'total_records' => $total_records,
        'recordsFiltered' => $total_records,
        'total_pages' => $total_pages,
        'current_page' => $page,
        'statusCode' => '200',
        'message' => 'SUCCESS',
        'timestamp' => date('Y-m-d H:i:s'),
    ];

    // HTTP 응답 코드 설정
    http_response_code('200');
    header('Content-Type: application/json; charset=utf-8');
    // JSON 응답 출력
    echo json_encode($response_array);

} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'data' => [],
        'recordsTotal' => 0,
        'recordsFiltered' => 0,
        'error' => $e->getMessage()
    ]);

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
