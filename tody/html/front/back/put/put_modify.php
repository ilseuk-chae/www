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
$umd = isset($_POST['umd']) ? urldecode($_POST['umd']) : '';
$address_primary = isset($_POST['address_primary']) ? urldecode($_POST['address_primary']) : '';
$address_road = isset($_POST['address_road']) ? urldecode($_POST['address_road']) : '';
$address_jibun = isset($_POST['address_jibun']) ? urldecode($_POST['address_jibun']) : '';
$address_detail = isset($_POST['address_detail']) ? urldecode($_POST['address_detail']) : '';
$latitude = isset($_POST['latitude']) ? urldecode($_POST['latitude']) : '';
$longitude = isset($_POST['longitude']) ? urldecode($_POST['longitude']) : '';
$estate_type = isset($_POST['estate_type']) ? urldecode($_POST['estate_type']) : '';
$sale_type = isset($_POST['sale_type']) ? urldecode($_POST['sale_type']) : '';
$exchange_fg = isset($_POST['exchange_fg']) ? urldecode($_POST['exchange_fg']) : '';
$sale_price = isset($_POST['sale_price']) ? intval(urldecode($_POST['sale_price'])) : '';
$rent_price = isset($_POST['rent_price']) ? intval(urldecode($_POST['rent_price'])) : '';
$area = isset($_POST['area']) ? intval(urldecode($_POST['area'])) : '';
$phone = isset($_POST['phone']) ? urldecode($_POST['phone']) : '';
$description = isset($_POST['description']) ? urldecode($_POST['description']) : '';
$files = isset($_FILES["files"]) ? $_FILES["files"] : array();

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $no, 'type' => 'int', 'message' => '올바른 요청이 아닙니다.'],
    ['value' => $sido, 'type' => 'int', 'message' => '주소를 확인해주세요.'],
    ['value' => $sgg, 'type' => 'int', 'message' => '주소를 확인해주세요.'],
    ['value' => $estate_type, 'type' => 'string', 'message' => '매물종류를 확인해주세요.'],
    ['value' => $sale_type, 'type' => 'string', 'message' => '거래방식을 확인해주세요.'],
    ['value' => $sale_price, 'type' => 'int', 'message' => '가격대를 확인해주세요.'],
    ['value' => $area, 'type' => 'int', 'message' => '면적을 확인해주세요.'],
    ['value' => $phone, 'type' => 'phone', 'message' => '연락처를 확인해주세요.'],
];

foreach ($validations as $validation) {
    $validationResult = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['value'] != $validationResult) {
        responseApi(400, $validationResult, null);
        exit;
    }
}

// 파일 유효성 검사
if ($files) {
    $errorMessage = '이미지 파일을 확인해주세요.';
    $options = array('type' => 'image');

    foreach ($files['name'] as $index => $name) {
        $file = array(
            'name' => $files['name'][$index],
            'full_path' => $files['full_path'][$index],
            'type' => $files['type'][$index],
            'tmp_name' => $files['tmp_name'][$index],
            'error' => $files['error'][$index],
            'size' => $files['size'][$index]
        );

        // 파일 유효성 검사
        $validationResult = validateInput($file, 'file', $errorMessage, $options);
        // print_r($error);exit;
        if ($file != $validationResult) {
            $errorMessage = "파일 {$file['name']}에 오류가 있습니다. {$validationResult}\n";
            responseApi(400, $errorMessage, null);
            exit;
        }
    }
}

mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $user_no = get_user_no_for_hash($conn, $userNo);

    ##################### 1.삭제 처리 #####################
    $sql =
        "UPDATE put_listings 
        SET 
            sido_cd = ?, 
            sgg_cd = ?, 
            umd_cd = ?,
            address_jibun = ?, 
            address_road = ?, 
            address_detail = ?,
            latitude = ?, 
            longitude = ?, 
            estate_type = ?, 
            sale_type = ?, 
            exchange_fg = ?, 
            sale_price = ?, 
            rent_price = ?, 
            area = ?,
            phone = ?, 
            description = ?, 
            lst_no = ?
        WHERE idx = ? 
        AND reg_no = ? ;
        ";

    // 조건 추가
    $params = [$sido, $sgg, $umd, $address_jibun, $address_road, $address_detail, $latitude, $longitude, $estate_type, $sale_type, $exchange_fg, $sale_price, $rent_price, $area, $phone, $description, $user_no, $no, $user_no];
    $types = 'sss' . 'sss' . 'dd' . 'sss' . 'iii' . 'ssi' . 'ii';
    executeQuery($conn, $sql, $types, $params);

    $put_no = $no;


    #######################################################
    # 파일 이동 및 DB에 저장 
    #######################################################
    if ($files) {
        handleMultipleFileUploads($files, $user_no, $put_no);
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
    if (isset($stmt))
        mysqli_stmt_close($stmt);
    if (isset($stmt2))
        mysqli_stmt_close($stmt2);
    mysqli_close($conn);
}

/**
 * 파일 업로드 함수
 * @param mixed $files : 파일 모음
 * @param mixed $user_no : 유저 번호
 * @param mixed $put_no : 게시글 번호
 * @throws \Exception
 * @return void
 */
function handleMultipleFileUploads($files, $user_no, $put_no)
{
    global $conn;

    // 파일 경로 설정
    $filePath = "put/" . $user_no . "/" . $put_no . "/";
    $values = [];
    $types = '';

    foreach ($files['name'] as $index => $name) {
        $file = [
            'name' => $files['name'][$index],
            'full_path' => $files['full_path'][$index],
            'type' => $files['type'][$index],
            'tmp_name' => $files['tmp_name'][$index],
            'error' => $files['error'][$index],
            'size' => $files['size'][$index]
        ];

        // 파일 업로드 및 경로가 이미 존재하는지 확인
        $file_move_result = upload_file_one($file, $filePath, "Y");

        // 파일 업로드가 성공한 경우에만 처리
        if ($file_move_result['result'] == 'success') {
            $values[] = $put_no;
            $values[] = $user_no;
            $values[] = $file_move_result["file_path"];
            $values[] = $file["name"];
            $types .= 'iiss';
        }
    }

    // 업로드에 성공한 파일이 있는 경우에만 INSERT
    if (!empty($values)) {
        $placeholders = implode(', ', array_fill(0, count($values) / 4, "(?, ?, ?, ?, 'put')"));
        $sql =
            "INSERT INTO estate_files (
                estate_idx, user_no, file_path, file_name, group_type
            ) VALUES $placeholders";

        $stmt = mysqli_prepare($conn, $sql);

        if ($stmt) {
            mysqli_stmt_bind_param($stmt, $types, ...$values);
            if (!mysqli_stmt_execute($stmt)) {
                throw new Exception('INSERT_QUERY_FAILED', 500);
            }
            mysqli_stmt_close($stmt);
        }
    }
}
