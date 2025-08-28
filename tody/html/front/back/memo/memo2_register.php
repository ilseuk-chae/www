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
$type = isset($_POST['type']) ? urldecode($_POST['type']) : null;
$latitude = isset($_POST['latitude']) ? urldecode($_POST['latitude']) : null;
$longitude = isset($_POST['longitude']) ? urldecode($_POST['longitude']) : null;
$pnu = isset($_POST['pnu']) ? urldecode($_POST['pnu']) : null;
$complete = isset($_POST['complete']) ? urldecode($_POST['complete']) : null;

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
    if($estate_no === null || $estate_no === '') {
     
    }else {
        // 매물 존재 유무 확인
        $sql = 
            "SELECT * FROM estate_listings WHERE idx = ? AND public_fg = 'Y' AND active_fg = 'Y' ";
        $stmt = executeQuery($conn, $sql, 'i', [$estate_no]);
        $result = mysqli_stmt_get_result($stmt);
        if (!$row = mysqli_fetch_assoc($result)) {
            // 값이 없을 때의 처리 (예: 에러 메시지와 함께 종료)
            responseApi(404, "확인되지 않는 매물번호입니다.", null);
            exit;
        }
    }
    

    // 회원 번호
    $user_no = get_user_no_for_hash($conn, $userNo);

    // ⭐⭐ 새로운 my_idx 값 계산 로직 ⭐⭐
    $next_my_idx = 1; // 기본값은 1 (메모가 없을 경우)

    // 해당 reg_no를 가진 사용자의 memo_listings에서 my_idx의 최댓값 조회
    $sql_max_idx = "SELECT MAX(my_idx) AS max_idx FROM memo2_listings WHERE reg_no = ?";
    $stmt_max_idx = executeQuery($conn, $sql_max_idx, 'i', [$user_no]);

    // ⭐ 디버깅 시작: MAX(my_idx) 쿼리 결과 확인 ⭐
    if ($stmt_max_idx === false) {
        //error_log("ERROR: MAX(my_idx) executeQuery failed for user_no: " . $user_no . " - " . mysqli_error($conn));
        // 이 경우 쿼리 실패이므로 next_my_idx는 1로 유지됨
    } else {
        $result_max_idx = mysqli_stmt_get_result($stmt_max_idx);
        
        // mysqli_stmt_get_result()가 실패할 수도 있으니 확인
        if ($result_max_idx === false) {
            //error_log("ERROR: mysqli_stmt_get_result failed after executeQuery for MAX(my_idx): " . mysqli_error($conn));
            // 이 경우 next_my_idx는 1로 유지됨
        } else {
            $row_max_idx = mysqli_fetch_assoc($result_max_idx);
            //error_log("MAX(my_idx) raw result row: " . print_r($row_max_idx, true));

            if ($row_max_idx && array_key_exists('max_idx', $row_max_idx) && $row_max_idx['max_idx'] !== null) {
                // MAX(my_idx)가 NULL이 아닌 유효한 숫자를 반환했을 때
                $next_my_idx = $row_max_idx['max_idx'] + 1;
                //error_log("Calculated next_my_idx: " . $next_my_idx . " (based on max_idx: " . $row_max_idx['max_idx'] . ")");
            } else {
                // MAX(my_idx)가 NULL을 반환했거나 결과 행이 없는 경우 (첫 메모이거나, 모든 my_idx가 NULL인 경우)
                //error_log("MAX(my_idx) returned NULL or no previous memos found for user_no: " . $user_no . ". Setting next_my_idx to 1.");
                $next_my_idx = 1; // 첫 메모이므로 1로 설정
            }
        }
    }
    mysqli_stmt_close($stmt_max_idx); // Statement 닫기

    // ⭐⭐ my_idx 계산 로직 디버깅 끝 ⭐⭐

    // SQL 쿼리 (컬럼명 확인: estate_no, reg_no 등이 DB 테이블 컬럼명과 일치하는지 확인)
    $sql =
    "INSERT INTO memo2_listings (
        name, phone, estate_no, content, reg_no, type, latitude, longitude, pnu,complete,my_idx
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ? ,? ,?
    )";

    // 파라미터 배열 (순서가 SQL 쿼리의 플레이스홀더 순서와 정확히 일치해야 합니다)
    $params = [
        $name,
        $phone,
        $estate_no,
        $content,
        $user_no,       // reg_no에 매핑
        $type,
        $latitude,
        $longitude,
        $pnu,
        $complete,       // complete에 매핑
        $next_my_idx // ⭐ my_idx 값 추가 ⭐
      ];
    // 타입 문자열
    // s: string, i: integer, d: double (float), b: blob
    // name(s), phone(s), estate_no(i), content(s), reg_no(i), type(s), latitude(d), longitude(d), pnu(s),complete(s)
    
    $types = 'ssisisddssi'; 
    // 만약 estate_no도 문자열이라면: 'sssisiisds' (첫번째 'i' 대신 's')
    // 만약 PNU가 숫자라면: 'ssisisid' (마지막 's' 대신 'i')

    executeQuery($conn, $sql, $types, $params);

    // 모든 작업 성공 시 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

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
    mysqli_close($conn);
}
