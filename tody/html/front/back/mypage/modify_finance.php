<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$name = urldecode($_POST['name']) ?? null;
$email = urldecode($_POST['email']) ?? null;
$mobile = urldecode($_POST['mobile']) ?? null;
$term_fg = urldecode($_POST['term_fg']);
$branchArray = $_POST['branchArray'] ?? null;


#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $name, 'type' => 'string', 'message' => '이름을 확인해주세요.'],
    ['value' => $email, 'type' => 'email', 'message' => '이메일 주소를 확인해주세요.'],
    ['value' => $mobile, 'type' => 'phone', 'message' => '휴대폰번호를 확인해주세요.'],
];

foreach ($validations as $validation) {
    $errorMessage = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['message'] == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}

// 이용약관 유효성 검사
$errorMessage = "이용약관에 동의해주세요.";
if ($term_fg !== 'Y') {
    responseApi(400, $errorMessage, null);
    exit;
}
#######################################################
# 0. 유효성 검사 - 끝
#######################################################


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 해시로 유저넘버 얻기
    $user_no = get_user_no_for_hash($conn, $userNo);

    #######################################################
    ##################### 1. 유저 정보 업데이트 #####################
    $sql =
        "UPDATE user_master SET
            name = ?,
            email = ?, 
            mobile = ?, 
            term_fg = ?,
            lst_no = ?
        WHERE user_no = ?
        ";

    // 조건 추가
    $params = [$name, $email, $mobile, $term_fg, $user_no, $user_no];
    $types = 'ssssii';
    $stmt = executeQuery($conn, $sql, $types, $params);


    #######################################################
    # 2. 내선 번호 업데이트
    if (!empty($branchArray)) {
        $sql = "UPDATE finance_branches SET phone = ? WHERE finance_company_idx = ? AND finance_branch_idx = ?";
        $stmt2 = mysqli_prepare($conn, $sql);
    
        if (!$stmt2) {
            throw new Exception('QUERY_PREPARATION_FAILED_FOR_BRANCH_UPDATE', 500);
        }
    
        foreach ($branchArray as $branch) {
            $branchPhone = $branch['phone'];
            $companyNo = $branch['company_no'];
            $branchNo = $branch['branch_no'];
    
            // Prepare binding parameters and execute
            mysqli_stmt_bind_param($stmt2, 'sii', $branchPhone, $companyNo, $branchNo);
    
            if (!mysqli_stmt_execute($stmt2)) {
                throw new Exception('BRANCH_UPDATE_FAILED', 500);
            }
        }
        
    }

    // 모든 SQL 작업이 성공적으로 완료되면 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    mysqli_rollback($conn);  // 트랜잭션 롤백

    $statusCode = $e->getCode() ? $e->getCode() : 500; // 코드가 없을 경우 500으로 설정
    responseApi($statusCode, $e->getMessage(), null);

} finally {
    // 준비된 문장 닫기
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    if (isset($stmt2)) {
        mysqli_stmt_close($stmt2);
    }
    if (isset($stmt3)) {
        mysqli_stmt_close($stmt3);
    }

    // 데이터베이스 연결 닫기
    mysqli_close($conn);
}