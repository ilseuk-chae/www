<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
// include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/validation.php');

$type = isset($_POST['type']) ? urldecode($_POST['type']) : '';
$viewNo = isset($_POST['viewNo']) ? urldecode($_POST['viewNo']) : '';

##################### 0. 유효성 검사 #####################
// 은행명 유효성 검사
$errorMessage = "정상적인 접근이 아닙니다.";
$valid = validateInput($viewNo, 'int', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}
$valid = validateInput($type, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    if ($type == "notice") {
        $table_name = "notice_listings";
    } elseif ($type == "faq") {
        $table_name = "faq_listings";
    } elseif ($type == "reference") {
        $table_name = "reference_listings";
    } else {
        throw new Exception('정상적인 접근이 아닙니다.', 400);
    }

    // SQL 쿼리
    $sql =
        "UPDATE $table_name
        SET view_count = view_count + 1
        WHERE idx = ? ;
        ";

    // 조건 추가
    $params = [$viewNo];
    $types = 'i';

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, $types, ...$params);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('QUERY_EXECUTE_FAILED', 500);
    }

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
