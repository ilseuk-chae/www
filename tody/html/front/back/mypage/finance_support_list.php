<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$status_fg = isset($_POST['public_fg']) ? urldecode($_POST['public_fg']) : '';

// 결과를 배열로 변환합니다.
$response_data = array();

try {
    $user_no = get_user_no_for_hash($conn, $userNo);

    #######################################################
    # 1. 매물 리스트 가져오기
    #######################################################
    $sql = 
        "SELECT 
            fs.idx AS support_no,
            fs.name,
            CASE WHEN fsla.phone_fg = 'Y' THEN fs.phone ELSE '' END AS phone,
            fs.address_jibun,        
            fs.address_road,
            fs.address_detail,
            fs.pnu_cd,
            fs.loan_desired_amount,
            fs.additional_note,

            fsla.idx AS apply_no,
            fsla.reg_no,
            fsla.status_code,
            DATE_FORMAT(fsla.reg_date, '%Y-%m-%d') AS reg_date

        FROM finance_support AS fs

        INNER JOIN finance_support_list_applied AS fsla
        ON fs.idx = fsla.finance_support_idx

        WHERE fsla.manager_no = ?
    ";

    // 조건 추가
    $params = [$user_no];
    $types = 'i';

    // 공개 필터 추가
    if ($status_fg !== '') {
        $sql .= " AND el.public_fg = ?";
        $params[] = $status_fg;
        $types .= 's';
    }

    $sql .= " ORDER BY fsla.reg_date DESC, fsla.idx DESC";
    // echo (get_bound_query($sql, $params));exit;

    $stmt = executeQuery($conn, $sql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $response_data[] = $row;
    }

    // 모든 작업 성공 시 커밋
    responseApi(200, 'SUCCESS', $response_data);

} catch (\Throwable $e) {
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


