<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$name = isset($_POST['name']) ? urldecode($_POST['name']) : null;
$phone = isset($_POST['phone']) ? urldecode($_POST['phone']) : null;
//$estate_no = isset($_POST['estateNo']) ? urldecode($_POST['estateNo']) : null;
$estate_no_raw = isset($_POST['estateNo']) ? urldecode($_POST['estateNo']) : null;
$content = isset($_POST['content']) ? urldecode($_POST['content']) : null;
//$type = isset($_POST['type']) ? urldecode($_POST['type']) : null;
//$latitude = isset($_POST['latitude']) ? urldecode($_POST['latitude']) : null;
//$longitude = isset($_POST['longitude']) ? urldecode($_POST['longitude']) : null;
//$pnu = isset($_POST['pnu']) ? urldecode($_POST['pnu']) : null;
$complete = isset($_POST['complete']) ? urldecode($_POST['complete']) : null;
$memo_no = isset($_POST['memo_idx']) ? $_POST['memo_idx'] : null; // JS에서 memo_idx로 보냄

if ($estate_no_raw === '' || $estate_no_raw === '0') { // 또는 빈 문자열 체크만
    $estate_no = null;
} else {
    $estate_no = intval($estate_no_raw); // 확실히 정수로 변환
}
#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $memo_no, 'type' => 'string', 'message' => '메모 ID가 없습니다.', 'options' => array('min_length' => 1)], // type을 'string'으로 변경
    ['value' => $name, 'type' => 'string', 'message' => '이름이 50자 이내인지 확인해주세요.', 'options' => array('max' => 50)],
    ['value' => $phone, 'type' => 'phone', 'message' => '연락처를 확인해주세요.', 'options' => array()],
    //['value' => $estate_no, 'type' => 'int', 'message' => '매물번호를 확인해주세요.', 'options' => array()],
];

foreach ($validations as $validation) {
    $validationResult = validateInput($validation['value'], $validation['type'], $validation['message'], $validation['options']);
    if ($validation['message'] == $validationResult) {
        responseApi(400, $validationResult, null);
        exit;
    }
}


// 은행명 유효성 검사
$errorMessage = "메모 내용이 255자 이내인지 확인해주세요.";
if ($content) {
    $valid = validateInput($content, 'string', $errorMessage, array('max' => 255));
    if ($valid == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 매물 존재 유무 확인 (estate_no가 null이 아닐 때만 확인)
    if ($estate_no !== null) {
        $sql_check_estate = "SELECT idx FROM estate_listings WHERE idx = ? AND public_fg = 'Y' AND active_fg = 'Y'";
        $stmt_check_estate = executeQuery($conn, $sql_check_estate, 'i', [$estate_no]);
        $result_check_estate = mysqli_stmt_get_result($stmt_check_estate);
        if (!mysqli_fetch_assoc($result_check_estate)) {
            responseApi(404, "확인되지 않는 매물번호입니다.", null);
            // $stmt_check_estate를 닫고 exit
            if (isset($stmt_check_estate)) mysqli_stmt_close($stmt_check_estate);
            exit;
        }
        if (isset($stmt_check_estate)) mysqli_stmt_close($stmt_check_estate);
    }


    // 회원 번호
    $user_no = get_user_no_for_hash($conn, $userNo);

    // SQL 쿼리
    $sql_update  =
        "UPDATE memo2_listings SET
            name = ?,
            phone = ?,
            estate_no = ?,
            content = ?,
            complete =?
        WHERE idx = ? ";

    // 조건 추가
    $params_update  = [$name, $phone, $estate_no, $content,$complete, $memo_no];
    $types_update  = 'ssissi';
    executeQuery($conn, $sql_update , $types_update , $params_update );

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);

    // ⭐⭐ 수정된 메모의 최신 데이터를 다시 조회하여 반환 ⭐⭐
    
    $sql_select_updated_memo =
    "SELECT
        ml.idx AS memo_no,
        ml.name,
        ml.phone,
        ml.estate_no,
        ml.content,
        ml.top_fg,
        DATE_FORMAT(ml.reg_date, '%Y-%m-%d') AS reg_date,
        DATE_FORMAT(ml.lst_date, '%Y-%m-%d') AS lst_date, -- ⭐ lst_date도 포함 ⭐
        ml.latitude,
        ml.longitude,
        ml.type AS memo_type,
        ml.pnu,
        ml.complete,
        ml.my_idx,
        el.address_jibun,
        el.address_road
    FROM memo2_listings AS ml
    LEFT JOIN estate_listings AS el ON ml.estate_no = el.idx
    WHERE ml.idx = ? LIMIT 1";

    $stmt_select_updated_memo = executeQuery($conn, $sql_select_updated_memo, 'i', [$memo_no]);
    $updated_memo_data = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt_select_updated_memo));
    mysqli_stmt_close($stmt_select_updated_memo);

    // 댓글 정보도 함께 반환해야 한다면, 여기서 다시 조회하여 배열에 추가
    // ⭐⭐ 해당 메모의 댓글 목록도 다시 조회하여 배열에 추가 ⭐⭐
    if ($updated_memo_data) {
        $updated_memo_data['comments'] = []; // 기본값 빈 배열
        $sql_select_comments = "SELECT idx AS comment_no, comment, DATE_FORMAT(reg_date, '%Y-%m-%d') AS comment_date FROM memo_comment WHERE memo_no = ? ORDER BY reg_date DESC"; // ⭐ 댓글 정렬은 오래된 순서대로 ⭐
        $stmt_select_comments = executeQuery($conn, $sql_select_comments, 'i', [$memo_no]);
        $comments_result = mysqli_stmt_get_result($stmt_select_comments);
        while ($comment_row = mysqli_fetch_assoc($comments_result)) {
            $updated_memo_data['comments'][] = $comment_row;
        }
        mysqli_stmt_close($stmt_select_comments);
    } else {
        // 메모를 찾지 못한 경우 처리 (매우 드뭄, 업데이트 성공했으므로)
        responseApi(404, "업데이트된 메모 정보를 찾을 수 없습니다.", null);
        exit;
    }

    //responseApi(200, 'SUCCESS', null);
    // ⭐ 반환 데이터에 updated_memo_data 포함 ⭐
    responseApi(200, 'SUCCESS', $updated_memo_data);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
    responseApi($e->getCode(), "처리 중 문제가 발생했습니다.", $e->getMessage());

} finally {
    // 연결 종료
    if (isset($stmt))
        mysqli_stmt_close($stmt);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    if (isset($stmt3))
        mysqli_stmt_close($stmt3);
    if (isset($stmt_check_estate)) 
        mysqli_stmt_close($stmt_check_estate); // 추가
    mysqli_close($conn);
}
