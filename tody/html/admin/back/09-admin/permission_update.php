<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include_once '../00-include/validation.php';

$no = addslashes((urldecode(($_POST['no']))));
$per_title = addslashes((urldecode(($_POST['per_title']))));
$selectedMenus = isset($_POST['selectedMenus']) ? $_POST['selectedMenus'] : [];

##################### 0. 유효성 검사 #####################
$errorMessage = "문제가 발생했습니다.";
$valid = validateInput($per_title, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    ##################### 0. 유저 번호 #####################
    $userNo = get_admin_no_for_hash($conn, $saNo);

    ##################### 1. 수정 #####################
    
    // 기존 메뉴가 있을 경우
    if ($no) {
        // 권한에 대한 기존 메뉴를 삭제
        $deleteQuery = "DELETE FROM admin_menu_permission WHERE per_no = ?";
        $stmt = $conn->prepare($deleteQuery);
        $stmt->bind_param("i", $no);
        $stmt->execute();
    } else {
        // 신규 등록일 경우
        $maxPerNoQuery = "SELECT IFNULL(MAX(per_no), 0) + 1 AS new_per_no FROM admin_menu_permission";
        $result = $conn->query($maxPerNoQuery);
        if ($result) {
            $row = $result->fetch_assoc();
            $no = $row['new_per_no'];
        } else {
            throw new Exception('FAILED_TO_GET_MAX_PER_NO', 500);
        }
    }

    if (!empty($selectedMenus)) {
        // 새로운 메뉴 항목을 다중 행 INSERT로 삽입
        $values = [];
        $types = "";
        foreach ($selectedMenus as $menu) {
            $values[] = $no;
            $values[] = $per_title;
            $values[] = $menu['menu_cd'];
            $values[] = $menu['menu_sub_cd'];
            $types .= "isss";
        }

        // 쿼리 문자열 생성
        $placeholders = implode(", ", array_fill(0, count($selectedMenus), "(?, ?, ?, ?)"));
        $insertQuery = "INSERT INTO admin_menu_permission (per_no, per_title, menu_cd, menu_sub_cd) VALUES " . $placeholders;

        // SQL 문장을 준비합니다.
        $stmt = mysqli_prepare($conn, $insertQuery);

        // SQL 준비 실패 시,
        if (!$stmt) {
            throw new Exception('QUERY_PREPARATION_FAILED', 500);
        }

        // 변수 바인딩 (s: string, i: integer 등)
        if (!empty($values)) {
            mysqli_stmt_bind_param($stmt, $types, ...$values);
        }

        // SQL 문장을 실행합니다.
        if (!mysqli_stmt_execute($stmt)) {
            // 중복 항목 에러 처리
            $errorCode = mysqli_stmt_errno($stmt);
            $errorMessage = mysqli_stmt_error($stmt);

            if ($errorCode == 1062) {
                throw new Exception('DUPLICATE_ENTRY', 409);
            } else {
                throw new Exception('EXECUTION_FAILED: ' . $errorMessage, 500);
            }
        }
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, "SUCCESS", null);

} catch (Exception $e) {
    mysqli_rollback($conn);  // 트랜잭션 롤백
    responseApi($e->getCode(), $e->getMessage(), null);
} finally {
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    if (isset($stmt2)) {
        mysqli_stmt_close($stmt2);
    }
    mysqli_close($conn);
}
