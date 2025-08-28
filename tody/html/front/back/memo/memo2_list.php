<?php
// PHP Header settings
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// Error reporting (for development - remove or restrict in production)
error_reporting(E_ALL);
ini_set("display_errors", 1); // ini_ini -> ini_set 오타 수정

// Include necessary files (assuming these provide $conn and functions like executeQuery, get_user_no_for_hash, responseApi)
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php'); // Assumes this sets $userNo

// --- Input Variables from POST Request ---
$owner = isset($_POST['owner']) ? urldecode($_POST['owner']) : 'all';
// Removed: $page, $items_per_page, $offset for pagination
$type = isset($_POST['type']) ? urldecode($_POST['type']) : '';
$keyword = isset($_POST['keyword']) ? urldecode($_POST['keyword']) : '';
$complete_filter = isset($_POST['complete']) ? urldecode($_POST['complete']) : 'all'; // 'Y', 'N', 'all'

// Map bounds (new filters)
$min_lat = isset($_POST['minLat']) ? doubleval($_POST['minLat']) : null;
$max_lat = isset($_POST['maxLat']) ? doubleval($_POST['maxLat']) : null;
$min_lng = isset($_POST['minLng']) ? doubleval($_POST['minLng']) : null;
$max_lng = isset($_POST['maxLng']) ? doubleval($_POST['maxLng']) : null;

// Validate $type to prevent direct column injection
$allowed_types = ['name', 'phone', 'estate_no', 'all'];
if (!in_array($type, $allowed_types)) {
    $type = ''; // Default to no specific column search if invalid type
}

try {
    // Initialize response data array
    $response_data = array();

    // 회원 번호
    $user_no = get_user_no_for_hash($conn, $userNo);
    
    // --- Prepare Dynamic WHERE clause, Parameters, and Types ---
    $where_parts = ["ml.reg_no = ?"]; // Start with the condition for memo owner (logged-in user)
    $query_params = [$user_no];       // Parameter for ml.reg_no
    $query_types = 'i';               // Type for ml.reg_no

    
    // 1. Owner condition: 'my'
    if ($owner === "my") {
        $where_parts[] = "el.reg_no = ?";
        $query_params[] = $user_no;
        $query_types .= 'i';
    }

    // 2. Keyword Search condition
    if (!empty($type) && !empty($keyword)) {
        if ($type === 'all') {
            $where_parts[] = "(ml.name LIKE ? OR ml.phone LIKE ? OR ml.estate_no LIKE ?)";
            $query_params[] = "%$keyword%";
            $query_params[] = "%$keyword%";
            $query_params[] = "%$keyword%";
            $query_types .= 'sss';
        } else {
            $column_for_search = "";
            switch ($type) {
                case 'name':      $column_for_search = 'ml.name'; break;
                case 'phone':     $column_for_search = 'ml.phone'; break;
                case 'estate_no': $column_for_search = 'ml.estate_no'; break;
            }
            if (!empty($column_for_search)) {
                $where_parts[] = "$column_for_search LIKE ?";
                $query_params[] = "%$keyword%";
                $query_types .= 's';
            }
        }
    }

    // 3. Complete status ('Y' or 'N')
    // ⭐ complete_filter 로직 수정 ⭐
    // 'Y'일 때는 전체(필터X), 'N'일 때만 'N'으로 필터, 'all'일 때도 전체(필터X)
    if ($complete_filter === 'N') { // 'N'이 명시적으로 요청될 때만 필터 적용
        $where_parts[] = "ml.complete = ?";
        $query_params[] = $complete_filter; // 이 경우 $complete_filter는 'N'
        $query_types .= 's';
    }
    // 4. Map Bounds (latitude and longitude)
    // isset()으로 변경되었으므로, null 대신 false로 초기화하고 != false로 검사
    if (isset($min_lat) && isset($max_lat) && isset($min_lng) && isset($max_lng)) {
        $where_parts[] = "ml.latitude BETWEEN ? AND ?";
        $where_parts[] = "ml.longitude BETWEEN ? AND ?";
        $query_params[] = $min_lat;
        $query_params[] = $max_lat;
        $query_params[] = $min_lng;
        $query_params[] = $max_lng;
        $query_types .= 'dddd';
    }

    // Combine all WHERE conditions
    $where_clause = " WHERE " . implode(" AND ", $where_parts);
    $where_clause .= " AND ml.top_fg = 'N'"; // Fixed condition

    // --- Main SELECT Query Construction ---
    // No LIMIT/OFFSET needed now
    $sql =
        "SELECT
            ml.idx AS memo_no,
            ml.name,
            ml.phone,
            ml.estate_no,
            ml.content,
            ml.top_fg,
            DATE_FORMAT(ml.reg_date, '%Y-%m-%d') AS reg_date,
            DATE_FORMAT(ml.reg_date, '%Y-%m-%d') AS lst_date,
            ml.latitude,
            ml.longitude,
            ml.type AS memo_type,
            ml.pnu,
            ml.complete,
            ml.my_idx,

            el.address_jibun,
            el.address_road,

            mc.idx AS comment_no,
            mc.comment,
            DATE_FORMAT(mc.reg_date, '%Y-%m-%d') AS comment_date

        FROM memo2_listings AS ml

        LEFT JOIN (  -- Changed to LEFT JOIN to include memos without estate listings
            SELECT idx, address_jibun, address_road, reg_no
            FROM estate_listings
            WHERE active_fg = 'Y' AND public_fg = 'Y'
        ) AS el
        ON ml.estate_no = el.idx

        LEFT JOIN memo_comment AS mc
        ON ml.idx = mc.memo_no ";
    
    $sql .= $where_clause;
    
    // Order By clause
    $sql .= " ORDER BY ml.top_fg ASC, ml.idx DESC, mc.reg_date DESC";

    // Execute the main SELECT query
    $stmt = executeQuery($conn, $sql, $query_types, $query_params); // Use query_types and query_params directly
    $result = mysqli_stmt_get_result($stmt);

    $num_rows_returned = mysqli_num_rows($result);
    
    // --- Data Processing for Response ---
    $memo_data = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $memo_no = $row['memo_no'];

        if (!isset($memo_data[$memo_no])) {
            $memo_data[$memo_no] = [
                'memo_no' => $row['memo_no'],
                'name' => $row['name'],
                'phone' => $row['phone'],
                'estate_no' => $row['estate_no'],
                'content' => $row['content'],
                'top_fg' => $row['top_fg'],
                'my_idx' => $row['my_idx'],
                'reg_date' => $row['reg_date'],
                'lst_date' => $row['lst_date'],
                'latitude' => $row['latitude'],
                'longitude' => $row['longitude'],
                'memo_type' => $row['memo_type'],
                'pnu' => $row['pnu'],
                'complete' => $row['complete'],
                'address_jibun' => $row['address_jibun'],
                'address_road' => $row['address_road'],
                'comments' => []
            ];
        }

        if (!empty($row['comment'])) {
            $memo_data[$memo_no]['comments'][] = [
                'comment_no' => $row['comment_no'],
                'comment' => $row['comment'],
                'comment_date' => $row['comment_date']
            ];
        }
    }

    $response_data = array_values($memo_data);

    // --- Final JSON Response Construction ---
    $response_array = [
        'responseData' => $response_data,
        'statusCode' => 200,
        'message' => 'SUCCESS',
        'timestamp' => date('Y-m-d H:i:s'),
    ];

    // Set HTTP response code and output JSON
    http_response_code(200);
    echo json_encode($response_array);

} catch (Exception $e) {
    // --- Error Handling ---
    responseApi(500, "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", null);
    error_log("API Error: " . $e->getMessage() . " on line " . $e->getLine() . " in " . $e->getFile());

} finally {
    // --- Connection and Statement Closing ---
    if (isset($stmt)) mysqli_stmt_close($stmt);
    mysqli_close($conn);
}