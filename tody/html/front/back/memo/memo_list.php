<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$owner = isset($_POST['owner']) ? urldecode($_POST['owner']) : 'all';
$page = isset($_POST['page']) ? intval($_POST['page']) : 1;
$items_per_page = isset($_POST['page']) ? intval($_POST['items_per_page']) : 12;
$offset = ($page - 1) * $items_per_page;
$type = isset($_POST['type']) ? urldecode($_POST['type']) : '';
$keyword = isset($_POST['keyword']) ? urldecode($_POST['keyword']) : '';

// 허용된 컬럼 이름 목록 (type 값 검증)
$allowed_types = ['name', 'phone', 'estate_no', 'all'];

// $type이 허용된 값인지 확인
if (!in_array($type, $allowed_types)) {
    $type = ''; // 허용되지 않은 경우 기본값으로 설정
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 결과 배열 초기화
    $response_data = array();

    // 회원 번호
    $user_no = get_user_no_for_hash($conn, $userNo);

    // 기본 조건으로 사용되는 파라미터
    $params = [$user_no];
    $types = 'i';

    // 쿼리 조건을 owner에 따라 다르게 설정
    $where_clause = "";
    if ($owner === "my") {
        $where_clause .= "AND el.reg_no = ?";
        $params[] = $user_no;  // $user_no가 두 번 들어감 (ml.reg_no와 el.reg_no)
        $types .= 'i';
    }

    // 검색 조건 추가
    if (!empty($type) && !empty($keyword)) {
        if ($type === 'all') {
            // type이 all일 경우, name, phone, estate_no 모두에서 검색
            $where_clause .= " AND (ml.name LIKE ? OR ml.phone LIKE ? OR ml.estate_no LIKE ?)";
            $params[] = "%$keyword%";
            $params[] = "%$keyword%";
            $params[] = "%$keyword%";
            $types .= 'sss';  // 각 키워드 바인딩에 대한 타입 추가
        } else {
            // 특정 컬럼에서 검색
            $where_clause .= " AND ml.$type LIKE ?";
            $params[] = "%$keyword%"; // 키워드를 검색 조건으로 추가
            $types .= 's';
        }
    }

    // Limit, offset 부분
    $params[] = $items_per_page;
    $params[] = $offset;
    $types .= 'ii';

    $sql = 
        "SELECT SQL_CALC_FOUND_ROWS
            ml.idx AS memo_no,
            ml.name, 
            ml.phone, 
            ml.estate_no, 
            ml.content,
            ml.top_fg,
            DATE_FORMAT(ml.reg_date, '%Y-%m-%d') AS reg_date,

            el.address_jibun, 
            el.address_road,

            mc.idx AS comment_no,
            mc.comment,
            DATE_FORMAT(mc.reg_date, '%Y-%m-%d') AS comment_date

        FROM memo_listings AS ml

        INNER JOIN (
            SELECT idx, address_jibun, address_road, reg_no
            FROM estate_listings
            WHERE active_fg = 'Y' AND public_fg = 'Y'
        ) AS el
        ON ml.estate_no = el.idx 

        LEFT JOIN memo_comment AS mc 
        ON ml.idx = mc.memo_no

        WHERE ml.reg_no = ? $where_clause
        AND ml.top_fg = 'N'
        ORDER BY ml.top_fg ASC, ml.idx DESC, mc.reg_date DESC
        LIMIT ? OFFSET ? ";
        
    $stmt = executeQuery($conn, $sql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);

    // 메모를 기준으로 그룹화
    $memo_data = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $memo_no = $row['memo_no'];

        // 이미 추가된 메모인지 확인
        if (!isset($memo_data[$memo_no])) {
            $memo_data[$memo_no] = [
                'memo_no' => $row['memo_no'],
                'name' => $row['name'],
                'phone' => $row['phone'],
                'estate_no' => $row['estate_no'],
                'content' => $row['content'],
                'top_fg' => $row['top_fg'],
                'reg_date' => $row['reg_date'],
                'address_jibun' => $row['address_jibun'],
                'address_road' => $row['address_road'],
                'comments' => []  // 댓글을 담을 배열 초기화
            ];
        }

        // 댓글이 있는 경우만 추가
        if (!empty($row['comment'])) {
            $memo_data[$memo_no]['comments'][] = [
                'comment_no' => $row['comment_no'],
                'comment' => $row['comment'],
                'comment_date' => $row['comment_date']
            ];
        }
    }

    // 메모 데이터를 response_data로 변환
    $response_data = array_values($memo_data);
    
    // 전체 레코드 수를 가져오는 별도 쿼리
    $count_sql = "SELECT COUNT(*) FROM memo_listings AS ml
              LEFT JOIN estate_listings AS el ON ml.estate_no = el.idx
              WHERE ml.reg_no = ? $where_clause";

    // 레코드 수 쿼리에서 바인딩할 파라미터와 타입
    $count_params = [$user_no];  // 레코드 수 파라미터 설정
    $count_types = 'i';  // 기본적으로 reg_no에 대한 타입은 'i'
    
    // my일 경우 추가로 reg_no 조건 바인딩
    if ($owner === "my") {
        $count_params[] = $user_no;  // my일 경우 $user_no 두 번 바인딩
        $count_types .= 'i';  // my일 경우 추가로 'i' 타입 추가
    }

    // 검색어가 있는 경우 OR 조건을 추가하여 검색
    if (!empty($type) && !empty($keyword)) {
        if ($type === 'all') {
            $count_params[] = "%$keyword%";
            $count_params[] = "%$keyword%";
            $count_params[] = "%$keyword%";
            $count_types .= 'sss';
        } else {
            $count_params[] = "%$keyword%";
            $count_types .= 's';
        }
    }

    // print_r($count_params);exit;
    // echo $count_types;exit;

    // 레코드 수를 위한 쿼리 실행 (파라미터와 타입은 조회 쿼리와 동일하게 설정)
    $count_stmt = executeQuery($conn, $count_sql, $count_types, $count_params);
    $count_result = mysqli_stmt_get_result($count_stmt);
    $total_records = mysqli_fetch_array($count_result)[0];

    // 전체 레코드 수 가져오기
    // $count_sql = "SELECT FOUND_ROWS()";
    // $count_result = mysqli_query($conn, $count_sql);
    // $total_records = mysqli_fetch_array($count_result)[0];

    // 총 페이지 수 계산
    $total_pages = ceil($total_records / $items_per_page);

    // 응답 데이터에 총 레코드 수, 총 페이지 수, 현재 페이지 추가
    $response_array = [
        'responseData' => $response_data,
        'total_records' => $total_records,
        'total_pages' => $total_pages,
        'current_page' => $page,
        'statusCode' => 200,
        'message' => 'SUCCESS',
        'timestamp' => date('Y-m-d H:i:s'),
    ];

    // HTTP 응답 코드 설정
    http_response_code('200');
    // JSON 응답 출력
    echo json_encode($response_array);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
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
