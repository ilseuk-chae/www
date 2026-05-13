<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$type = isset($_POST['type']) ? urldecode($_POST['type']) : '';


#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $type, 'type' => 'string', 'message' => '올바른 요청이 아닙니다.']
];
foreach ($validations as $validation) {
    $validationResult = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['value'] != $validationResult) {
        responseApi(400, $validationResult, null);
        exit;
    }
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 각각의 결과를 배열로 저장
    $search_history = array();
    $favorites_history = array();
    $print_history = array();

    // 회원 번호
    $user_no = get_user_no_for_hash($conn, $userNo);

    // 공통 파라미터 및 타입 설정
    $params = [$user_no, $type];
    $types = 'is';

    // 검색 이력 쿼리
    $sql =
        "SELECT idx, type, jibun_address, latitude, longitude FROM history_recent_search
        WHERE user_no = ? AND type = ? ORDER BY reg_date DESC 
        LIMIT 10";
    
    // 찜 이력 쿼리
    $sql2 =
        "SELECT idx, type, jibun_address, latitude, longitude FROM history_favorite_map
        WHERE user_no = ? AND type = ? ORDER BY reg_date DESC 
        LIMIT 10";

    // 인쇄 이력 쿼리
    $sql3 = 
        "SELECT idx, type, jibun_address, latitude, longitude FROM history_print
        WHERE user_no = ? AND type = ? ORDER BY reg_date DESC 
        LIMIT 10";
        
    // 각각의 쿼리 실행 및 결과 처리
    $stmt = executeQuery($conn, $sql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);
    while ($row = mysqli_fetch_assoc($result)) {
        $search_history[] = $row;
    }

    $stmt2 = executeQuery($conn, $sql2, $types, $params);
    $result2 = mysqli_stmt_get_result($stmt2);
    while ($row = mysqli_fetch_assoc($result2)) {
        $favorites_history[] = $row;
    }

    $stmt3 = executeQuery($conn, $sql3, $types, $params);
    $result3 = mysqli_stmt_get_result($stmt3);
    while ($row = mysqli_fetch_assoc($result3)) {
        $print_history[] = $row;  // print_history에 저장하도록 수정
    }

    // 결과를 JSON 형식으로 반환
    $response = array(
        "search_history" => $search_history,
        "favorites_history" => $favorites_history,
        "print_history" => $print_history
    );

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $response);

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
