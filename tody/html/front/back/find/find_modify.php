<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$no = isset($_POST['no']) ? urldecode($_POST['no']) : '';
$sido = isset($_POST['sido']) ? urldecode($_POST['sido']) : '';
$sgg = isset($_POST['sgg']) ? urldecode($_POST['sgg']) : '';
$estate_type = isset($_POST['estate_type']) ? urldecode($_POST['estate_type']) : '';
$sale_type = isset($_POST['sale_type']) ? urldecode($_POST['sale_type']) : '';
$exchange_fg = isset($_POST['exchange_fg']) ? urldecode($_POST['exchange_fg']) : '';
$min_price = isset($_POST['min_price']) ? urldecode($_POST['min_price']) : '';
$max_price = isset($_POST['max_price']) ? urldecode($_POST['max_price']) : '';
$min_area = isset($_POST['min_area']) ? urldecode($_POST['min_area']) : '';
$max_area = isset($_POST['max_area']) ? urldecode($_POST['max_area']) : '';
$phone = isset($_POST['phone']) ? urldecode($_POST['phone']) : '';
$description = isset($_POST['description']) ? urldecode($_POST['description']) : '';

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $no, 'type' => 'int', 'message' => '게시글 번호를 확인해주세요.'],
    ['value' => $sido, 'type' => 'int', 'message' => '시/도를 확인해주세요.'],
    ['value' => $sgg, 'type' => 'int', 'message' => '시/군/구를 확인해주세요.'],
    ['value' => $estate_type, 'type' => 'string', 'message' => '매물종류를 확인해주세요.'],
    ['value' => $sale_type, 'type' => 'string', 'message' => '거래방식을 확인해주세요.'],
    ['value' => $min_price, 'type' => 'int', 'message' => '가격대를 확인해주세요.'],
    ['value' => $max_price, 'type' => 'int', 'message' => '가격대를 확인해주세요.'],
    ['value' => $min_area, 'type' => 'int', 'message' => '면적을 확인해주세요.'],
    ['value' => $max_area, 'type' => 'int', 'message' => '면적을 확인해주세요.'],
    ['value' => $phone, 'type' => 'phone', 'message' => '연락처를 확인해주세요.'],
];

foreach ($validations as $validation) {
    $errorMessage = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['message'] == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}
// exit;
mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $user_no = get_user_no_for_hash($conn, $userNo);

    ##################### 1.삭제 처리 #####################
    $sql =
        "UPDATE wanted_listings 
        SET
            sido_cd = ?, 
            sgg_cd = ?, 
            estate_type = ?, 
            sale_type = ?, 
            exchange_fg = ?, 
            min_price = ?, 
            max_price = ?, 
            min_area = ?, 
            max_area = ?, 
            phone = ?, 
            description = ?, 
            lst_no = ?
        WHERE reg_no = ?
        AND idx = ?;
        ";

    // 조건 추가
    $params = [$sido, $sgg, $estate_type, $sale_type, $exchange_fg, $min_price, $max_price, $min_area, $max_area, $phone, $description, $user_no,  $user_no, $no];
    $types = 'sssssiiiissiii';
    executeQuery($conn, $sql, $types, $params);

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
    mysqli_close($conn);
}
?>