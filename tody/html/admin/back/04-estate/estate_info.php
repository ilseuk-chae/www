<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/validation.php';
include_once '../00-include/authChk.php';

$no = isset($_POST['no']) ? urldecode($_POST['no']) : '';

##################### 0. 유효성 검사 #####################
// 은행명 유효성 검사
$errorMessage = "문제가 발생했습니다.";
$valid = validateInput($no, 'int', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}

try {
    // SQL 쿼리
    $sql =
        "SELECT 
            a.idx AS estate_no,
            a.sale_price,
            a.rent_price,
            a.deposit_price,
            CONCAT(a.address_road, ' ', a.address_detail) AS address_total,
            a.latitude,
            a.longitude,
            a.related_jibun,
            a.platArea,
            a.totArea,
            a.archArea,
            a.lndcgrCodeNm,
            a.vlRat,
            a.bcRat,
            a.grndFlrCnt,
            a.ugrndFlrCnt,
            a.strctCdNm,
            DATE_FORMAT(a.useAprDay, '%Y-%m-%d') AS useAprDay,
            a.car_parking,
            a.mainPurpsCdNm,
            a.realPurpsNm,
            a.maintenance_price,
            a.loan_price,
            a.feature,
            a.description,
            DATE_FORMAT(a.reg_date, '%Y-%m-%d') AS reg_date,
            a.additional_note,
            a.public_fg,
            a.view_count,
            a.exchange_fg,
            a.urgent_sale_fg,
    
            b.type_name AS estate_type,
            c.type_name AS sale_type,
            d.agency_name,
            d.phone,
            f.file_path
        FROM estate_listings AS a
    
        INNER JOIN type_master AS b
        ON b.group_code = 'ESTATE_TYPE'
        AND a.estate_type = b.type_code
    
        INNER JOIN type_master AS c
        ON c.group_code = 'TRANSACTION_TYPE'  -- ON c.group_code = 'SALE_TYPE'
        AND a.sale_type = c.type_code
    
        INNER JOIN user_master AS d
        ON a.reg_no = d.user_no
    
        -- LEFT JOIN user_images AS e
        -- ON a.reg_no = e.user_no
        -- AND e.image_type = 'sale'

        LEFT JOIN estate_files AS f
        ON a.idx = f.estate_idx
        AND f.group_type = 'sale'
        -- AND f.representative = 'Y'
    
        WHERE a.idx = ?
        ";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, "i", $no);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('UPDATE_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();
    $estateArray = array();

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $estate_no = $row['estate_no'];

        if (!isset($estateArray[$estate_no])) {
            $estateArray[$estate_no] = array(
                'estate_no' => $row['estate_no'],
                'sale_price' => !empty($row['sale_price']) ? comma($row['sale_price']) : '0',
                'rent_price' => !empty($row['rent_price']) ? comma($row['rent_price']) : '0',
                'deposit_price' => !empty($row['deposit_price']) ? comma($row['deposit_price']) : '0',
                'address_total' => $row['address_total'],
                'related_jibun' => $row['related_jibun'],
                'latitude' => !empty($row['latitude']) ? comma($row['latitude']) : '0',
                'longitude' => !empty($row['longitude']) ? comma($row['longitude']) : '0',
                'platArea' => !empty($row['platArea']) ? comma($row['platArea']) : '0',
                'totArea' => !empty($row['totArea']) ? comma($row['totArea']) : '0',
                'archArea' => !empty($row['archArea']) ? comma($row['archArea']) : '0',
                'lndcgrCodeNm' => $row['lndcgrCodeNm'],
                'vlRat' => !empty($row['vlRat']) ? comma($row['vlRat']) : '0',
                'bcRat' => !empty($row['bcRat']) ? comma($row['bcRat']) : '0',
                'grndFlrCnt' => !empty($row['grndFlrCnt']) ? comma($row['grndFlrCnt']) : '0',
                'ugrndFlrCnt' => !empty($row['ugrndFlrCnt']) ? comma($row['ugrndFlrCnt']) : '0',
                'strctCdNm' => $row['strctCdNm'],
                'useAprDay' => $row['useAprDay'],
                'car_parking' => $row['car_parking'],
                'mainPurpsCdNm' => $row['mainPurpsCdNm'],
                'realPurpsNm' => $row['realPurpsNm'],
                'maintenance_price' => !empty($row['maintenance_price']) ? comma($row['maintenance_price']) : '0',
                'loan_price' => !empty($row['loan_price']) ? comma($row['loan_price']) : '0',
                'feature' => $row['feature'],
                'description' => $row['description'],
                'reg_date' => $row['reg_date'],
                'additional_note' => $row['additional_note'],
                'public_fg' => $row['public_fg'],
                'view_count' => !empty($row['view_count']) ? comma($row['view_count']) : '0',
                'estate_type' => $row['estate_type'],
                'sale_type' => $row['sale_type'],
                'agency_name' => $row['agency_name'],
                'exchange_fg' => $row['exchange_fg'],
                'urgent_sale_fg' => $row['urgent_sale_fg'],
                'phone' => $row['phone'],
                'imageArray' => array()
            );
        }

        // 지점 정보 추가
        if ($row['file_path']) {
            $filePath = $row['file_path'];
            $token = getToken($filePath, $estate_no);
    
            // 파일 MIME 타입 확인
            if (file_exists($filePath)) {
                $fileMimeType = mime_content_type($filePath);

                // MIME 타입을 통해 이미지 또는 영상 구분
                if (strpos($fileMimeType, 'image') !== false) {
                    $fileType = 'image'; // 이미지 파일
                } elseif (strpos($fileMimeType, 'video') !== false) {
                    $fileType = 'video'; // 영상 파일
                } else {
                    $fileType = 'unknown'; // 구분되지 않는 파일
                }
            } else {
                // 파일이 없을 때의 처리 로직 (예: 기본값 반환 등)
                $fileType = 'unknown';
            }

            $estateArray[$estate_no]['imageArray'][] = array(
                'imageToken' => $token,
                'fileType' => $fileType // 이미지 또는 영상 파일 타입 추가
            );
        }
    }

    // 성공 응답 반환
    $response_data = array_values($estateArray);

    // 모든 작업 성공 시 커밋
    responseApi(200, 'SUCCESS', $response_data[0]);

} catch (Exception $e) {
    // 오류 발생 시 롤백
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


// 토큰 생성 함수 (HMAC 서명 추가, openSSL 암호화 추가)
function getToken($filePath, $estateNo)
{
    $secretKey = 'tody2024';
    $cipher = "aes-256-cbc";
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($cipher));

    $encryptedFilePath = openssl_encrypt($filePath, $cipher, $secretKey, 0, $iv);
    $tokenData = [
        'estateNo' => $estateNo,
        'filePath' => $encryptedFilePath,
        'iv' => base64_encode($iv), // IV를 포함해야 복호화 가능
        'key' => bin2hex(random_bytes(16))
    ];

    $tokenPayload = json_encode($tokenData, JSON_UNESCAPED_SLASHES); // 슬래시를 이스케이프하지 않음
    $signature = hash_hmac('sha256', $tokenPayload, $secretKey);

    // Base64 인코딩 전에 확실히 파일 경로가 올바르게 인코딩되었는지 확인
    $tokenPayload = base64_encode($tokenPayload);
    $token = $tokenPayload . '.' . $signature;

    return $token;
}
