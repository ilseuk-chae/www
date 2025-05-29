<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

$viewNo = isset($_POST['viewNo']) ? urldecode($_POST['viewNo']) : '';

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // SQL 쿼리
    $sql =
        "UPDATE partnership_master 
        SET view_count = view_count + 1
        WHERE idx = ? ;
        ";

    // 조건 추가
    $params = [$viewNo];
    $types = 'i';

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);

    if (!$stmt) {
        // 준비 실패 시 예외 throw
        throw new Exception('QUERY_PREPARATION_FAILED: ' . mysqli_error($conn), 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    
    if (!mysqli_stmt_bind_param($stmt, $types, ...$params)) {
        
        throw new Exception('QUERY_BIND_FAILED: ' . mysqli_stmt_error($stmt), 500); // 바인딩 실패 시 예외 발생
    }

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('QUERY_EXECUTE_FAILED: ' . mysqli_stmt_error($stmt), 500);
    }

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
    //responseApi($e->getCode(), $e->getMessage(), null);
    $statusCode = ($e->getCode() >= 100 && $e->getCode() < 600) ? $e->getCode() : 500;
    responseApi($statusCode, '오류: ' . $e->getMessage(), null);

} finally {
    // 연결 종료
    //if (isset($stmt))
    //    mysqli_stmt_close($stmt);
    //if (isset($stmt2))
    //    mysqli_stmt_close($stmt2);
    //if (isset($stmt3))
    //    mysqli_stmt_close($stmt3);
    //mysqli_close($conn);

    // 연결 종료
    if (isset($stmt) && $stmt) { // 변수가 설정되어 있고 유효한 statement 객체인지 확인
        mysqli_stmt_close($stmt);
    }
     // 다른 statement 변수(stmt2, stmt3)도 사용하는 경우 유사하게 처리
     if (isset($stmt2) && $stmt2) {
         mysqli_stmt_close($stmt2);
     }
      if (isset($stmt3) && $stmt3) {
         mysqli_stmt_close($stmt3);
     }

    // common.php에서 DB 연결을 열고 닫는 방식에 따라 이 부분이 필요 없을 수 있습니다.
    
    // $conn 변수가 유효한 연결 객체인지 확인 후 닫습니다.
     if (isset($conn) && is_object($conn) && method_exists($conn, 'close')) {
         // mysqli_close($conn); // common.php의 종료 로직과 충돌할 수 있습니다.
     }
 
}
