<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$no = isset($_POST['no']) ? urldecode($_POST['no']) : '';
$type = isset($_POST['type']) ? urldecode($_POST['type']) : '';

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $no, 'type' => 'int', 'message' => '올바른 요청이 아닙니다.'],
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
    $table = '';
    if ($type == 'search') {
        $table = 'history_recent_search';
    } elseif ($type == 'favorite') {
        $table = 'history_favorite_map';
    } elseif ($type == 'print') {
        $table = 'history_print';
    } else {
        throw new Exception('유효하지 않은 type 값입니다.');
    }

    // 회원 번호
    $user_no = get_user_no_for_hash($conn, $userNo);

    // 검색 이력 쿼리
    $sql = "DELETE FROM $table WHERE idx = ? AND user_no = ?";
        
    // 공통 파라미터 및 타입 설정
    $params = [$no, $user_no];
    $types = 'ii';

    // 각각의 쿼리 실행 및 결과 처리
    $stmt = executeQuery($conn, $sql, $types, $params);
    $result = mysqli_stmt_get_result($stmt);

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

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
