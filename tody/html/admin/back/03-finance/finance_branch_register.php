<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';
include_once '../00-include/validation.php';

$companyNo = urldecode($_POST['c_no']);
$name = urldecode($_POST['name']);
$max_loan_amount = (isset($_POST['max_loan_amount']) && !empty($_POST['max_loan_amount'])) ? urldecode($_POST['max_loan_amount']) : NULL;
$min_loan_rate = (isset($_POST['min_loan_rate']) && !empty($_POST['min_loan_rate'])) ? urldecode($_POST['min_loan_rate']) : NULL;

##################### 0. 유효성 검사 #####################
// 은행명 유효성 검사
$errorMessage = "은행명을 확인해주세요.";
$valid = validateInput($name, 'string', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}

if ($max_loan_amount) {
    $errorMessage = "최대 대출금액을 확인해주세요.";
    $valid = validateInput($max_loan_amount, 'float', $errorMessage, array());
    if ($valid == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}
if ($min_loan_rate) {
    $errorMessage = "최저 대출이율을 확인해주세요.";
    $valid = validateInput($min_loan_rate, 'float', $errorMessage, array());
    if ($valid == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    ##################### 1. 영업점 마지막 번호 조회 #####################
    $sql_max_idx =
        "SELECT IFNULL(MAX(finance_branch_idx), 0) + 1 AS next_branch_idx
        FROM finance_branches
        WHERE finance_company_idx = ? ";

    $stmt_max = $conn->prepare($sql_max_idx);
    $stmt_max->bind_param("i", $companyNo);
    $stmt_max->execute();
    $stmt_max->bind_result($next_branch_idx);
    $stmt_max->fetch();
    $stmt_max->close();

    ##################### 2. 영업점 등록 #####################
    $sql =
        "INSERT INTO finance_branches (
            finance_company_idx,
            finance_branch_idx,
            name,
            max_loan_amount,
            min_loan_rate
        ) VALUES (
            ?,
            ?,
            ?,
            ?,
            ?
        ); ";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // SQL 준비 실패 시,
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    if (!mysqli_stmt_bind_param($stmt, "iisdd", $companyNo, $next_branch_idx, $name, $max_loan_amount, $min_loan_rate)) {
        throw new Exception('BINDING_FAILED', 500);
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

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

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
