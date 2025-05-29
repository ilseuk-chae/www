<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

//$public_fg = isset($_POST['public_fg']) ? urldecode($_POST['public_fg']) : '';

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

$stmt = null; // mysqli statement 변수 초기화

try {
    // SQL 쿼리
    // SQL 쿼리 작성: partnership_master 테이블에서 view_count가 0인 행의 개수를 셉니다.
    // 결과 컬럼 이름을 unseenCount로 별칭(alias) 지정합니다.
    $sql =
        "SELECT COUNT(*) AS
            unseenCount

        FROM partnership_master
        
        WHERE view_count = 0;
        ";

    
    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    
    if (!$stmt) {
        // 준비 실패 시 예외 throw
        throw new Exception('QUERY_PREPARATION_FAILED: ' . mysqli_error($conn), 500);
    }
    
    
    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        // 실행 실패 시 예외 throw
        throw new Exception('QUERY_EXECUTE_FAILED: ' . mysqli_stmt_error($stmt), 500);
    }

    // 결과를 가져옵니다.   (COUNT(*) 결과는 단일 행, 단일 컬럼입니다.)
    $result = mysqli_stmt_get_result($stmt);
    
    // 결과를 associative array 형태로 가져옴
    $row = mysqli_fetch_assoc($result);

    // unseenCount 별칭으로 지정한 컬럼 값(개수)을 추출
    $unseenCount = 0; // 기본값 설정
    if ($row && isset($row['unseenCount'])) {
         $unseenCount = (int)$row['unseenCount']; // 추출 및 정수로 캐스팅
    } else {
        // 결과를 가져왔으나 예상한 컬럼이 없는 경우 (쿼리 오류 가능성)
        throw new Exception('개수 정보를 가져오는데 실패했습니다.', 500);
    }

    // 성공 응답 구성 및 반환 (responseApi 함수 사용)
    // 클라이언트 (JavaScript)에서 예상하는 형식: { status: 'success', message: '...', responseData: { unseenCount: N } }
    // responseApi 함수가 이 형식을 만든다고 가정합니다.
    //responseApi(200, '미확인 제안 개수 조회 성공', ['unseenCount' => $unseenCount]);


    // 모든 작업 성공 시 커밋
    //responseApi(200, 'SUCCESS', $response_data);
    //responseApi(200, 'SUCCESS', ['unseenCount' => $response_data]);
    responseApi(200, 'SUCCESS', ['unseenCount' => $unseenCount]);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    $statusCode = ($e->getCode() >= 100 && $e->getCode() < 600) ? $e->getCode() : 500;
    
    responseApi($statusCode, 'Error: ' . $e->getMessage(), null);

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

