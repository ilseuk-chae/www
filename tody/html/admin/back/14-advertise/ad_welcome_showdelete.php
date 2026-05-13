<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// 개발 시점에만 활성화하여 상세 오류를 확인하세요. 운영 시에는 비활성화 또는 파일로 로깅하도록 설정
// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/dbconnect.php';

// s_no는 광고 ID를 의미한다고 가정합니다.
// $_POST로 받는 값은 이미 URL 디코딩이 된 상태이므로 urldecode는 보통 필요 없습니다.
// 그러나 클라이언트에서 명시적으로 encodeURIComponent 등으로 인코딩해서 보내는 경우를 대비해
// 유연하게 처리할 수 있도록 그대로 두겠습니다.
$ad_no_to_hide = $_POST['ad_no'] ?? ''; // 수정할 광고의 ID
$show_fg_value = 'N'; // 숨김(Hide)을 의미하는 'N'으로 고정

// 트랜잭션 시작 (자동 커밋 비활성화)
mysqli_autocommit($conn, FALSE);
mysqli_begin_transaction($conn);

try {
    // 0. 필수 입력값 검증 (s_no가 없으면 오류)
    if (empty($ad_no_to_hide) || !is_numeric($ad_no_to_hide)) {
        throw new Exception('유효한 광고 ID가 필요합니다.', 400); // 400 Bad Request
    }

    // UPDATE 쿼리 준비
    $sql_update = "
        UPDATE advertise_welcome SET
            show_fg = ?
        WHERE idx = ?
    ";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql_update);

    // SQL 준비 실패 시 처리
    if (!$stmt) {
        throw new Exception('쿼리 준비 실패: ' . mysqli_error($conn), 500);
    }

    // ⭐⭐⭐ 핵심 수정: 변수 바인딩 ⭐⭐⭐
    // `show_fg_value`는 문자열(s), `ad_no_to_hide`는 정수(i)
    $bind_types = "si"; 
    $bind_values = [
        $show_fg_value,
        $ad_no_to_hide
    ];

    // `mysqli_stmt_bind_param`은 인자를 참조로 전달받아야 하므로 `call_user_func_array`를 사용합니다.
    // 첫 번째 인자는 `mysqli_stmt` 객체의 `bind_param` 메서드를 호출하는 형태로 전달합니다.
    $bind_refs = array();
    $bind_refs[] = $bind_types; // 첫 번째 인자는 타입 문자열
    foreach ($bind_values as $key => $value) {
        $bind_refs[] = &$bind_values[$key]; // 각 값을 참조로 전달
    }

    if (!call_user_func_array([$stmt, 'bind_param'], $bind_refs)) {
        throw new Exception('바인딩 실패: ' . mysqli_stmt_error($stmt), 500);
    }
    // ⭐⭐⭐ 변수 바인딩 수정 끝 ⭐⭐⭐

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('쿼리 실행 실패: ' . mysqli_stmt_error($stmt), 500);
    }
    
    // 영향을 받은 행이 없으면, 해당 ID의 광고가 없거나 이미 N 상태일 수 있습니다.
    if (mysqli_stmt_affected_rows($stmt) === 0) {
        // 이미 'N'이거나, 없는 ID이거나, 권한 문제일 수 있습니다.
        // 여기서는 'SUCCESS'로 간주하고 넘어가지만, 필요시 '해당 광고를 찾을 수 없거나 이미 숨김 처리되어 있습니다.' 등의 메시지를 줄 수 있습니다.
    }


    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    mysqli_rollback($conn);
    // Exception 코드가 0일 경우를 대비하여 기본값 500을 사용합니다.
    $statusCode = $e->getCode() ?: 500;
    responseApi($statusCode, '실패: ' . $e->getMessage(), null);

} finally {
    // 리소스 정리 (statement와 connection 닫기)
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    // $stmt2는 정의되지 않은 변수이므로 제거합니다.
    // if (isset($stmt2)) {
    //     mysqli_stmt_close($stmt2);
    // }
    if (isset($conn)) {
        mysqli_close($conn);
    }
}
?>