<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

// print_r($_FILES["files"]);
// exit;
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$estate_no = isset($_POST['estateNo']) && $_POST['estateNo'] !== '' ? $_POST['estateNo'] : null;
$pnu = isset($_POST['pnu']) && $_POST['pnu'] !== '' ? urldecode($_POST['pnu']) : null;
$postal_code = isset($_POST['postal_code']) && $_POST['postal_code'] !== '' ? urldecode($_POST['postal_code']) : null;
$address_primary = isset($_POST['address_primary']) && $_POST['address_primary'] !== '' ? urldecode($_POST['address_primary']) : null;
$address_road = isset($_POST['address_road']) && $_POST['address_road'] !== '' ? urldecode($_POST['address_road']) : null;
$address_jibun = isset($_POST['address_jibun']) && $_POST['address_jibun'] !== '' ? urldecode($_POST['address_jibun']) : null;
$address_detail = isset($_POST['address_detail']) && $_POST['address_detail'] !== '' ? urldecode($_POST['address_detail']) : null;
$estate_type = isset($_POST['estate_type']) && $_POST['estate_type'] !== '' ? urldecode($_POST['estate_type']) : null;
$sale_type = isset($_POST['sale_type']) && $_POST['sale_type'] !== '' ? urldecode($_POST['sale_type']) : null;
$exchange_fg = isset($_POST['exchange_fg']) && $_POST['exchange_fg'] !== '' ? urldecode($_POST['exchange_fg']) : 'N';  
$urgent_sale_fg = isset($_POST['urgent_sale_fg']) && $_POST['urgent_sale_fg'] !== '' ? urldecode($_POST['urgent_sale_fg']) : 'N';
$lndcgrCode = isset($_POST['lndcgrCode']) && $_POST['lndcgrCode'] !== '' ? urldecode($_POST['lndcgrCode']) : null;
$lndcgrCodeNm = isset($_POST['lndcgrCodeNm']) && $_POST['lndcgrCodeNm'] !== '' ? urldecode($_POST['lndcgrCodeNm']) : null;
$prposArea = isset($_POST['prposArea']) && $_POST['prposArea'] !== '' ? urldecode($_POST['prposArea']) : null;
$prposAreaNm = isset($_POST['prposAreaNm']) && $_POST['prposAreaNm'] !== '' ? urldecode($_POST['prposAreaNm']) : null;
$strctCd = isset($_POST['strctCd']) && $_POST['strctCd'] !== '' ? urldecode($_POST['strctCd']) : null;
$strctCdNm = isset($_POST['strctCdNm']) && $_POST['strctCdNm'] !== '' ? urldecode($_POST['strctCdNm']) : null;
$etcStrct = isset($_POST['etcStrct']) && $_POST['etcStrct'] !== '' ? urldecode($_POST['etcStrct']) : null;
$useAprDay = isset($_POST['useAprDay']) && $_POST['useAprDay'] !== '' ? urldecode($_POST['useAprDay']) : null;
$mainPurpsCd = isset($_POST['mainPurpsCd']) && $_POST['mainPurpsCd'] !== '' ? urldecode($_POST['mainPurpsCd']) : null;
$mainPurpsCdNm = isset($_POST['mainPurpsCdNm']) && $_POST['mainPurpsCdNm'] !== '' ? urldecode($_POST['mainPurpsCdNm']) : null;
$realPurpsNm = isset($_POST['realPurpsNm']) && $_POST['realPurpsNm'] !== '' ? urldecode($_POST['realPurpsNm']) : null;
$related_jibun = isset($_POST['related_jibun']) && $_POST['related_jibun'] !== '' ? urldecode($_POST['related_jibun']) : null;
$feature = isset($_POST['feature']) && $_POST['feature'] !== '' ? urldecode($_POST['feature']) : null;
$description = isset($_POST['description']) && $_POST['description'] !== '' ? urldecode($_POST['description']) : null;
$notes = isset($_POST['notes']) && $_POST['notes'] !== '' ? urldecode($_POST['notes']) : null;
$mgmBldrgstPk = isset($_POST['mgmBldrgstPk']) && $_POST['mgmBldrgstPk'] !== '' ? urldecode($_POST['mgmBldrgstPk']) : null;

$sale_price = !empty($_POST['sale_price']) ? floatval($_POST['sale_price']) * 10000 : null;
$rent_price = !empty($_POST['rent_price']) ? floatval($_POST['rent_price']) * 10000 : null;
$maintenance_price = !empty($_POST['maintenance_price']) ? floatval($_POST['maintenance_price']) * 10000 : null;
$loan_price = !empty($_POST['loan_price']) ? floatval($_POST['loan_price']) * 10000 : null;
$platArea = !empty($_POST['platArea']) ? floatval($_POST['platArea']) : null;
$totArea = !empty($_POST['totArea']) ? floatval($_POST['totArea']) : null;
$archArea = !empty($_POST['archArea']) ? floatval($_POST['archArea']) : null;
$vlRat = !empty($_POST['vlRat']) ? floatval($_POST['vlRat']) : null;
$bcRat = !empty($_POST['bcRat']) ? floatval($_POST['bcRat']) : null;
$grndFlrCnt = !empty($_POST['grndFlrCnt']) ? intval($_POST['grndFlrCnt']) : null;
$ugrndFlrCnt = !empty($_POST['ugrndFlrCnt']) ? intval($_POST['ugrndFlrCnt']) : null;

$road_conditions = !empty($_POST['road_conditions']) ? intval($_POST['road_conditions']) : null;
$power = !empty($_POST['power']) ? intval($_POST['power']) : null;
$floor_height = !empty($_POST['floor_height']) ? intval($_POST['floor_height']) : null;
$water = isset($_POST['water']) && $_POST['water'] !== '' ? urldecode($_POST['water']) : null;

$latitude = isset($_POST['latitude']) && $_POST['latitude'] !== '' ? $_POST['latitude'] : null;
$longitude = isset($_POST['longitude']) && $_POST['longitude'] !== '' ? $_POST['longitude'] : null;

$files = isset($_FILES["files"]) ? $_FILES["files"] : array();
$existingRepresentativeImages = isset($_POST['existingRepresentativeImages']) ? json_decode($_POST['existingRepresentativeImages'], true) : null;
$selectedRepresentativeImages = isset($_POST['selectedRepresentativeImages']) ? json_decode($_POST['selectedRepresentativeImages'], true) : null;
$removeFileArray = isset($_POST['removeFileArray']) ? json_decode($_POST['removeFileArray'], true) : null;
$originArray = isset($_POST['originArray']) ? json_decode($_POST['originArray'], true) : null;

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $estate_no, 'type' => 'int', 'message' => '올바르지 않은 요청입니다.'],
    ['value' => $address_primary, 'type' => 'string', 'message' => '주소를 확인해주세요.'],
    ['value' => $estate_type, 'type' => 'string', 'message' => '매물종류를 확인해주세요.'],
    ['value' => $sale_type, 'type' => 'string', 'message' => '거래종류를 확인해주세요.'],
    ['value' => $sale_price, 'type' => 'int', 'message' => '가격을 확인해주세요.'],
    ['value' => $description, 'type' => 'string', 'message' => '매물설명을 확인해주세요.'],
];

foreach ($validations as $validation) {
    $validationResult = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['value'] != $validationResult) {
        responseApi(400, $validationResult, null);
        exit;
    }
}

if ($sale_type === '003') { // 월세
    $validationResult = validateInput($rent_price, 'int', '월세를 확인해주세요.');
    if ($rent_price != $validationResult) {
        responseApi(400, $validationResult, null);
        exit;
    }
}

// 파일 유효성 검사
if ($files) {
    $errorMessage = '이미지 파일을 확인해주세요.';

    foreach ($files['name'] as $index => $name) {
        $file = array(
            'name' => $files['name'][$index],
            'full_path' => $files['full_path'][$index],
            'type' => $files['type'][$index],
            'tmp_name' => $files['tmp_name'][$index],
            'error' => $files['error'][$index],
            'size' => $files['size'][$index]
        );

        // 파일 타입에 따른 유효성 검사 옵션 설정
        $fileMimeType = mime_content_type($file['tmp_name']);
        if (strpos($fileMimeType, 'image') !== false) {
            // 이미지 파일일 경우
            $options = array('type' => 'image', 'maxSize' => 100000000);
        } elseif (strpos($fileMimeType, 'video') !== false) {
            // 영상 파일일 경우
            $options = array('type' => 'video', 'maxSize' => 100000000);
        } else {
            // 허용되지 않는 파일 타입일 경우 오류 반환
            $errorMessage = "허용되지 않은 파일 형식입니다: {$file['name']}";
            responseApi(400, $errorMessage, null);
            exit;
        }

        // 파일 유효성 검사
        $validationResult = validateInput($file, 'file', $errorMessage, $options);
        // print_r($error);exit;
        if ($file != $validationResult) {
            $errorMessage = "파일 {$file['name']}에 오류가 있습니다. {$validationResult}\n";
            responseApi(400, $errorMessage, null);
            exit;
        }
    }
} else {
    if (empty($originArray)) {
        $errorMessage = '이미지/영상은 최소 1장 이상 등록해야 합니다.';
        responseApi(400, $errorMessage, null);
        exit;
    }
}

#######################################################
# 트랜잭션 처리 시작
#######################################################
mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    $user_no = get_user_no_for_hash($conn, $userNo);

    #######################################################
    # 매물 업데이트 처리
    #######################################################
    $sql =
        "UPDATE estate_listings
        SET 
            pnu = ?,
            postal_code = ?, 
            address_jibun = ?, 
            address_road = ?, 
            address_detail = ?, 
            estate_type = ?, 
            sale_type = ?,
            exchange_fg = ?,
            urgent_sale_fg = ?,
            lndcgrCode = ?, 
            lndcgrCodeNm = ?, 
            prposArea = ?, 
            prposAreaNm = ?,
            strctCd = ?, 
            strctCdNm = ?, 
            etcStrct = ?, 
            useAprDay = ?,
            mainPurpsCd = ?, 
            mainPurpsCdNm = ?, 
            realPurpsNm = ?,
            related_jibun = ?, 
            feature = ?, 
            description = ?, 
            notes = ?,
            mgmBldrgstPk = ?,
            sale_price = ?, 
            rent_price = ?, 
            maintenance_price = ?, 
            loan_price = ?,
            vlRat = ?, 
            bcRat = ?, 
            grndFlrCnt = ?, 
            ugrndFlrCnt = ?,
            platArea = ?, 
            totArea = ?, 
            archArea = ?,
            road_conditions = ?, 
            power = ?, 
            floor_height = ?, 
            water = ?,
            latitude = ?, 
            longitude = ?,
            lst_no = ?
        WHERE idx = ?
        AND reg_no = ?
        ";

    // 조건 추가
    $params = [
        $pnu, $postal_code, $address_jibun, $address_road, $address_detail, $estate_type, $sale_type, $exchange_fg, urgent_sale_fg,
        $lndcgrCode, $lndcgrCodeNm, $prposArea, $prposAreaNm, 
        $strctCd, $strctCdNm, $etcStrct, $useAprDay, 
        $mainPurpsCd, $mainPurpsCdNm, $realPurpsNm, 
        $related_jibun, $feature, $description, $notes, $mgmBldrgstPk,
        $sale_price, $rent_price, $maintenance_price, $loan_price, 
        $vlRat, $bcRat, $grndFlrCnt, $ugrndFlrCnt,
        $platArea, $totArea, $archArea,
        $road_conditions, $power, $floor_height, $water,
        $latitude, $longitude, $user_no, 
        $estate_no, $user_no
    ];
    // echo get_bound_query($sql, $params);exit;

    $types = 'sssssssss' . 'ssss' . 'ssss' . 'sss' . 'sssss' . 'iiii' . 'ddii' . 'ddd' . 'ddds' . 'ddi' . 'ii';
    executeQuery($conn, $sql, $types, $params);


    #######################################################
    # 기존 대표 이미지에서 제외된 이미지의 representative를 'N'으로 업데이트
    #######################################################
    if (!empty($existingRepresentativeImages)) {
        $sql = "UPDATE estate_files SET representative = 'N' WHERE group_type = 'sale' AND estate_idx = ? AND representative = 'Y' AND idx NOT IN (" . implode(',', array_map('intval', $existingRepresentativeImages)) . ")";
        executeQuery($conn, $sql, 'i', [$estate_no]);
    } else {
        $sql = "UPDATE estate_files SET representative = 'N' WHERE group_type = 'sale' AND estate_idx = ? AND representative = 'Y'";
        executeQuery($conn, $sql, 'i', [$estate_no]);
    }

    
    #######################################################
    # 신규 이미지가 없고, 기존 대표 이미지가 없으며, 기존 이미지가 있을 경우
    #######################################################
    if (empty($files) && empty($existingRepresentativeImages) && !empty($originArray)) {
        $counter = 0;
        foreach ($originArray as $fileId) {
            if ($counter < 2) {
                // 각 이미지에 대해 대표 이미지를 'Y'로 설정
                $sql = "UPDATE estate_files SET representative = 'Y' WHERE idx = ? AND estate_idx = ?";
                executeQuery($conn, $sql, 'ii', [$fileId, $estate_no]);
                $counter++;
            } else {
                break; // 최대 2개까지만 처리
            }
        }
    }
    

    #######################################################
    # 파일 업로드 처리
    #######################################################
    if ($files) {
        handleMultipleFileUploads($files, $user_no, $estate_no, $selectedRepresentativeImages, $existingRepresentativeImages);
    } 

    #######################################################
    # 파일 삭제 처리
    #######################################################
    if (!empty($removeFileArray)) {
        deleteFile($user_no, $estate_no, $removeFileArray);
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
    if (isset($stmt3))
        mysqli_stmt_close($stmt3);
    mysqli_close($conn);
}

/**
 * 파일 업로드 함수
 * @param mixed $files : 파일 모음
 * @param mixed $user_no : 유저 번호
 * @param mixed $estate_no : 게시글 번호
 * @param mixed $selectedRepresentativeImages : 신규 대표 이미지
 * @param mixed $existingRepresentativeImages : 기존 대표 이미지
 * @throws \Exception
 * @return boolean
 */
function handleMultipleFileUploads($files, $user_no, $estate_no, $selectedRepresentativeImages, $existingRepresentativeImages)
{
    global $conn;

    // 파일 경로 설정
    $filePath = "sale/" . $user_no . "/" . $estate_no . "/";
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
            $values[] = $estate_no;
            $values[] = $user_no;
            $values[] = $file_move_result["file_path"];
            $values[] = $file["name"];
            $types .= 'iiss';
        }
    }

    // 업로드에 성공한 파일이 있는 경우에만 INSERT
    if (!empty($values)) {
        $placeholders = implode(', ', array_fill(0, count($values) / 4, "(?, ?, ?, ?, 'sale')"));
        $sql =
            "INSERT INTO estate_files (
                estate_idx, user_no, file_path, file_name, group_type
            ) VALUES $placeholders";

        $stmt = mysqli_prepare($conn, $sql);

        if ($stmt) {
            mysqli_stmt_bind_param($stmt, $types, ...$values);
            if (mysqli_stmt_execute($stmt)) {
                $insertedFileIds = []; // 추가된 파일의 ID를 저장하는 배열
                $insertedFileIds[] = mysqli_insert_id($conn); // 첫 번째 파일의 ID 저장
        
                for ($i = 1; $i < count($values) / 4; $i++) {
                    $insertedFileIds[] = $insertedFileIds[0] + $i; // 나머지 파일 ID 추가
                }
            } else {
                throw new Exception('INSERT_QUERY_FAILED', 500);
            }
            mysqli_stmt_close($stmt);
        }

        // 1. 기존 대표 이미지가 없을 경우
        if (empty($existingRepresentativeImages)) {
            // 대표 이미지가 없을 경우 앞의 2개 이미지를 자동으로 대표 이미지로 설정
            if (empty($selectedRepresentativeImages)) {
                // 파일이 하나만 있을 경우, 대표 이미지를 1개만 설정
                if (count($insertedFileIds) === 1) {
                    $selectedRepresentativeImages = [0]; // 첫 번째 이미지만 대표 이미지로 설정
                } else {
                    $selectedRepresentativeImages = [0, 1]; // 첫 번째와 두 번째 이미지를 대표 이미지로 설정
                }
            }
        } 
        // 2. 기존 대표 이미지가 1개 있을 경우
        elseif (count($existingRepresentativeImages) === 1) {
            // 이미 1개의 대표 이미지가 존재하므로 추가로 설정하지 않음
            // $selectedRepresentativeImages = []; // 새로운 대표 이미지를 설정하지 않음

            // 대표 이미지가 없을 경우 신규 이미지 중 첫 번째 이미지를 대표 이미지로 설정
            if (empty($selectedRepresentativeImages)) {
                // 파일이 하나만 있을 경우 첫 번째 이미지만 대표 이미지로 설정
                if (count($insertedFileIds) >= 1) {
                    $selectedRepresentativeImages = [0]; // 첫 번째 신규 이미지를 대표 이미지로 설정
                }
            }
        }
        // 3. 기존 대표 이미지가 2개 있을 경우
        elseif (count($existingRepresentativeImages) === 2) {
            // 이미 2개의 대표 이미지가 존재하므로 추가로 설정하지 않음
            $selectedRepresentativeImages = []; // 새로운 대표 이미지를 설정하지 않음
        }

        // 예시: 대표 이미지 정보를 DB에 저장
        if ($selectedRepresentativeImages && is_array($selectedRepresentativeImages)) {
            foreach ($selectedRepresentativeImages as $imageIndex) {
                // 인덱스를 검증
                if (isset($insertedFileIds[$imageIndex])) {
                    $fileId = $insertedFileIds[$imageIndex]; // 대표 이미지로 선택된 파일의 ID 가져오기
                    $sql = "UPDATE estate_files SET representative = 'Y' WHERE group_type = 'sale' AND estate_idx = ? AND idx = ? ";
                    executeQuery($conn, $sql, 'ii', [$estate_no, $fileId]);
                } else {
                    throw new Exception('INVALID_REPRESENTATIVE_IMAGE_INDEX', 400);
                }
            }
        }
    }

    return true;
}

/**
 * 파일 삭제 함수
 */
function deleteFile($user_no, $estate_no, $removeFileArray) 
{
    global $conn;

    if ($removeFileArray && is_array($removeFileArray)) {
        foreach ($removeFileArray as $fileNo) {
            ##################### 1.파일 삭제를 위한 경로 가져오기 #####################
            $sql = "SELECT file_path FROM estate_files WHERE group_type = 'sale' AND user_no = ? AND idx = ? AND estate_idx = ?;";

            // 조건 추가
            $params = [$user_no, $fileNo, $estate_no];
            $types = 'iii';
            $stmt = executeQuery($conn, $sql, $types, $params);

            // 결과를 가져옵니다.
            $result = mysqli_stmt_get_result($stmt);
            $row = mysqli_fetch_assoc($result);
            if ($row === false) {
                throw new Exception('FILE_NOT_FOUND', 404);
            }
            $filePath = $row['file_path'];
            

            ##################### 2.파일 삭제 처리 #####################
            unlink($filePath);


            ##################### 3. DB 삭제 처리 #####################
            $sql = "DELETE FROM estate_files WHERE group_type = 'sale' AND user_no = ? AND idx = ? AND estate_idx = ?;";
            executeQuery($conn, $sql, $types, $params);
        }
    }
}