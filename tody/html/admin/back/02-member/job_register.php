<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

$jobName = urldecode($_POST['jobName']);
if (!$jobName) {
    responseApi(400, 'NO_PARAMETER', null);
    exit;
}

$sql = "INSERT INTO relationship_job (
            job_name
        ) VALUES (
            ?
        ); ";

try {
    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    // SQL 준비 실패 시,
    if (!$stmt) {
        responseApi(500, 'QUERY_PREPARATION_FAILED', null);
        exit;
    }

    // 변수 바인딩 (s: string, i: integer 등)
    if (!mysqli_stmt_bind_param($stmt, "s", $jobName)) {
        responseApi(500, 'BINDING_FAILED', null);
        exit;
    }

    // SQL 문장을 실행합니다.
    if (mysqli_stmt_execute($stmt)) {
        // 성공 시 응답
        responseApi(200, 'SUCCESS', null);
    } else {
        // 중복 항목 에러 처리
        $errorCode = mysqli_stmt_errno($stmt);
        $errorMessage = mysqli_stmt_error($stmt);

        responseApi(500, 'FAILED', null);
        // responseApi(500, 'FAILED', ['errorCode' => $errorCode, 'errorMessage' => $errorMessage]);
    }
} catch (mysqli_sql_exception $e) {
    // 예외 처리
    if ($e->getCode() == 1062) {
        responseApi(409, 'DUPLICATE_ENTRY', null);
    } else {
        responseApi(500, 'SQL_ERROR', null);
        // responseApi(500, 'SQL_ERROR', ['errorMessage' => $e->getMessage()]);
    }
} finally {
    // 연결 종료
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    mysqli_close($conn);
}
