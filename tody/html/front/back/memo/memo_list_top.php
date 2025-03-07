<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$owner = isset($_POST['owner']) ? urldecode($_POST['owner']) : 'all';
$type = isset($_POST['type']) ? urldecode($_POST['type']) : '';
$keyword = isset($_POST['keyword']) ? urldecode($_POST['keyword']) : '';

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 결과 배열 초기화
    $response_data = [];

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

        LEFT JOIN (
            SELECT idx, address_jibun, address_road, reg_no
            FROM estate_listings
            WHERE active_fg = 'Y' AND public_fg = 'Y'
        ) AS el
        ON ml.estate_no = el.idx 

        LEFT JOIN memo_comment AS mc 
        ON ml.idx = mc.memo_no

        WHERE ml.reg_no = ? $where_clause
        AND ml.top_fg = 'Y'
        ORDER BY ml.top_fg ASC, ml.idx DESC, mc.reg_date DESC
         ";
        
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

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $response_data);

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
