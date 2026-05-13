<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/sendAligo.php');

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $name = isset($_POST['name']) ? urldecode($_POST['name']) : null;
    $mobileNumber = isset($_POST['mobileNumber']) ? urldecode($_POST['mobileNumber']) : null;
    $addressJibun = isset($_POST['addressJibun']) ? urldecode($_POST['addressJibun']) : null;
    $addressRoad = isset($_POST['addressRoad']) ? urldecode($_POST['addressRoad']) : null;
    $addressDetail = isset($_POST['addressDetail']) ? urldecode($_POST['addressDetail']) : null;
    $pnu = isset($_POST['pnu']) ? urldecode($_POST['pnu']) : null;
    $loanAmount = isset($_POST['loanAmount']) ? urldecode($_POST['loanAmount']) : null;
    $additionalMemo = isset($_POST['memo']) ? urldecode($_POST['memo']) : null;
    $consentAgreed = isset($_POST['consentAgreed']) && urldecode($_POST['consentAgreed']) == 'true' ? "Y" : "N";

    $selectedBranches = isset($_POST['branches']) ? $_POST['branches'] : null;

    // 1. 일반 회원 검사
    $user_no = get_user_no_for_hash($conn, $userNo);

    if ($user_no === null) {
        throw new Exception('사용자 정보를 찾을 수 없습니다.', 400);
    }

    $sql = 'SELECT role FROM user_master WHERE user_no = ?';

    $stmt = executeQuery($conn, $sql, 'i', [$user_no]);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    if ($row['role'] != '001') {
        throw new Exception('일반 회원만 신청 가능합니다.', 400);
    }


    // 2. 유효성 검사
    $validations = [
        ['value' => $_POST['name'], 'type' => 'string', 'message' => '이름을 확인해주세요.'],
        ['value' => $_POST['mobileNumber'], 'type' => 'string', 'message' => '유효한 연락처를 입력하세요.'],
        ['value' => $_POST['addressJibun'], 'type' => 'string', 'message' => '담보물 주소지를 확인해주세요.'],
        ['value' => $_POST['loanAmount'], 'type' => 'int', 'message' => '유효한 대출 희망 금액을 확인해주세요.', 'options' => array('min' => 0, 'max' => 1000000000000)],
        ['value' => $_POST['memo'], 'type' => 'string', 'message' => '기타 메모를 확인해주세요.']
    ];

    foreach ($validations as $validation) {
        $errorMessage = validateInput($validation['value'], $validation['type'], $validation['message'], isset($validation['options']) ? $validation['options'] : []);
        if ($validation['message'] == $errorMessage) {
            responseApi(400, $errorMessage, null);
            exit;
        }
    }

    if (empty($selectedBranches) || !is_array($selectedBranches)) {
        throw new Exception('영업점을 선택하세요.', 400);
    }

    if ($consentAgreed !== 'Y') {
        throw new Exception('개인정보 수집 및 활용 동의를 해주세요.', 400);
    }

    // 3-0. 영업점 ID와 영업점명으로 영업점 담당자 전화번호 조회

    // 3-1. branchNo와 companyNo 배열로 분리
    $companyIds = array_column($selectedBranches, 'companyNo');
    $branchIds = array_column($selectedBranches, 'branchNo');

    // 3-2. 플레이스홀더 생성
    $placeholders = implode(',', array_fill(0, count($branchIds), '(?, ?)'));

    // 3-3. SQL 쿼리 작성
    $sql = 
    "SELECT 
        a.idx, a.finance_branch_idx, a.finance_company_idx, a.name, 
        b.user_no,
        b.mobile 
    FROM finance_branches AS a

    INNER JOIN user_master AS b
    ON b.user_no = a.manager_no

    INNER JOIN user_notification_preferences AS unp
    ON unp.user_no = a.manager_no
    AND unp.type_name = 'finance'

    WHERE (a.finance_company_idx, a.finance_branch_idx) IN ($placeholders)
    AND unp.active_fg = 'Y'";

    // 3-4. 바인딩 값 준비 (branchIds와 companyIds를 병합하여 쌍으로 바인딩)
    $bindValues = [];
    foreach ($branchIds as $index => $branchId) {
        $bindValues[] = $companyIds[$index];
        $bindValues[] = $branchId;
    }

    // 쿼리문 디버깅
    // echo get_bound_query($sql, $bindValues);exit;

    $stmt = executeQuery($conn, $sql, str_repeat('ii', count($branchIds)), $bindValues);
    $result = mysqli_stmt_get_result($stmt);

    $branchesData = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $branchesData[] = [
            'branch_name' => $row['name'], // 영업점명
            'company_id' => $row['finance_company_idx'], 
            'branch_id' => $row['finance_branch_idx'],
            'phone' => $row['mobile'], // 담당자 전화번호
            'manager_no' => $row['user_no'] // 담당자 회원번호
        ];
    }

    // 4. 담당자 알림톡 발송
    $template_cd = "TX_6342"; // 템플릿 코드 입력
    foreach ($branchesData as $branch) {
        $paramList = [
            [
                'subject' => "[토디] 금융지원 신청 알림", 
                'message' => "[토디] 안녕하세요. {$branch['branch_name']}님.\n담당 지점으로 금융지원이 신청되었습니다.\n주소지: {$addressJibun}", 
                'phone' => $branch['phone']
            ]
        ];
        sendAlimtalk($template_cd, $paramList);
        // if (!$alimtalkResult) {
        //     throw new Exception("알림톡 발송에 실패했습니다.", 500);  // 발송 실패 시 예외 발생
        // }
    }

    // finance_support 테이블에 신청내역 저장
    $sql = 
    "INSERT INTO finance_support (
        name, address_jibun, address_road, address_detail, pnu_cd, 
        loan_desired_amount, additional_note, personal_info_consent, phone, reg_no
    ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
    )";
    
    $params = [
        $name, $addressJibun, $addressRoad, $addressDetail, $pnu, 
        $loanAmount, $additionalMemo, $consentAgreed, $mobileNumber, $user_no
    ];
    $types = 'sssssisssi';

    $stmt = executeQuery($conn, $sql, $types, $params);
    $financeSupportId = mysqli_insert_id($conn); // 저장된 신청 번호

    // 5. finance_support_list_applied 테이블에 신청한 영업점 리스트 저장
    $sql = 
    "INSERT INTO finance_support_list_applied (
        finance_support_idx, finance_company_idx, 
        finance_branch_idx, manager_no, reg_no
    ) VALUES (
        ?, ?, 
        ?, ?, ?
    )";
    
    foreach ($branchesData as $branch) {
        $params = [$financeSupportId, $branch['company_id'], $branch['branch_id'], $branch['manager_no'], $user_no];
        $types = 'iiiii';
        $stmt = executeQuery($conn, $sql, $types, $params);
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
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    mysqli_close($conn);
}