<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

$estate_no = isset($_POST['estate_no']) ? urldecode($_POST['estate_no']) : '';

#######################################################
# 0. 유효성 검사 - 시작
#######################################################
// 유효성 검사할 배열
$validations = [
    ['value' => $estate_no, 'type' => 'int', 'message' => '올바르지 않은 요청입니다.'],
];

foreach ($validations as $validation) {
    $errorMessage = validateInput($validation['value'], $validation['type'], $validation['message']);
    if ($validation['message'] == $errorMessage) {
        responseApi(400, $errorMessage, null);
        exit;
    }
}

// 결과를 배열로 변환합니다.
$response_data = array();
$estateArray = array();

try {
    #######################################################
    # 1. 매물 리스트 가져오기
    #######################################################
    $sql = 
        "SELECT 
            el.idx AS estate_no,
            el.pnu,
            el.address_jibun,
            el.address_road,
            el.latitude,
            el.longitude,
            el.related_jibun,
            el.notes,
            el.sale_price,
            el.rent_price,
            el.deposit_price,
            el.archArea,
            el.platArea,
            el.totArea,
            el.lndcgrCodeNm,
            el.prposAreaNm,
            el.vlRat,
            el.bcRat,
            el.grndFlrCnt,
            el.ugrndFlrCnt,
            el.strctCdNm,
            el.mainPurpsCdNm,
            el.realPurpsNm,
            el.maintenance_price,
            el.loan_price,
            el.exchange_fg,
            DATE_FORMAT(el.useAprDay, '%Y-%m-%d') AS useAprDay, 
            el.car_parking,
            el.description,
            el.feature,
            el.road_conditions,
            el.power,
            el.water,
            el.floor_height,
            el.view_count,
            DATE_FORMAT(el.reg_date, '%Y-%m-%d') AS reg_date, 

            tm.type_name AS estate_type,

            tm2.type_name AS sale_type,

            um.agency_name,
            um.registered_broker_name,
            CONCAT(um.address_primary, ' ', um.address_detail) AS broker_address,
            um.homepage_url,
            um.phone AS broker_phone,

            ef.file_path
        FROM estate_listings AS el

        INNER JOIN type_master AS tm
        ON tm.group_code = 'ESTATE_TYPE'
        AND el.estate_type = tm.type_code

        INNER JOIN type_master AS tm2
        ON tm2.group_code = 'TRANSACTION_TYPE'  -- ON tm2.group_code = 'SALE_TYPE'
        AND el.sale_type = tm2.type_code

        INNER JOIN user_master AS um
        ON um.user_no = el.reg_no
        AND um.status_code = '001'
        -- AND um.role = '002'
    
        LEFT JOIN estate_files AS ef
        ON ef.group_type = 'sale'
        AND ef.estate_idx = el.idx
        -- AND ef.representative = 'Y'

        WHERE el.public_fg = 'Y'
        AND el.active_fg = 'Y'
        AND el.idx = ?
    ";

    // 조건 추가
    $params = [$estate_no];
    $types = 'i';

    // echo (get_bound_query($sql, $params));exit;

    // 쿼리 실행
    $stmt = executeQuery($conn, $sql, $types, $params);

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $estate_no = $row['estate_no'];

        // 매물 정보가 처음일 때만 설정
        if (empty($estateArray)) {
            $estateArray = array(
                'estate_no' => $row['estate_no'],
                'pnu' => $row['pnu'],
                'address_jibun' => $row['address_jibun'],
                'address_road' => $row['address_road'],
                'related_jibun' => isset($row['related_jibun']) && $row['related_jibun'] ? 'Y' : 'N',
                'notes' => $row['notes'],
                'archArea' => $row['archArea'],
                'platArea' => $row['platArea'],
                'totArea' => $row['totArea'],
                'sale_price' => $row['sale_price'],
                'rent_price' => $row['rent_price'],
                'exchange_fg' => $row['exchange_fg'],
                'deposit_price' => $row['deposit_price'],
                'lndcgrCodeNm' => $row['lndcgrCodeNm'],
                'prposAreaNm' => $row['prposAreaNm'],
                'vlRat' => $row['vlRat'],
                'bcRat' => $row['bcRat'],
                'grndFlrCnt' => $row['grndFlrCnt'],
                'ugrndFlrCnt' => $row['ugrndFlrCnt'],
                'strctCdNm' => $row['strctCdNm'],
                'mainPurpsCdNm' => $row['mainPurpsCdNm'],
                'realPurpsNm' => $row['realPurpsNm'],
                'maintenance_price' => $row['maintenance_price'],
                'loan_price' => $row['loan_price'],
                'useAprDay' => $row['useAprDay'],
                'car_parking' => $row['car_parking'],
                'road_conditions' => $row['road_conditions'],
                'power' => $row['power'],
                'water' => $row['water'],
                'floor_height' => $row['floor_height'],
                'view_count' => $row['view_count'],
                'reg_date' => $row['reg_date'],
                'description' => $row['description'],
                'feature' => $row['feature'],
                'lat' => $row['latitude'],
                'lng' => $row['longitude'],
                'estate_type' => $row['estate_type'],
                'sale_type' => $row['sale_type'],
                'agency_name' => $row['agency_name'],
                'registered_broker_name' => $row['registered_broker_name'],
                'broker_address' => $row['broker_address'],
                'homepage_url' => $row['homepage_url'],
                'broker_phone' => $row['broker_phone'],
                'data.exclusive_building' => 'N',
                'imageArray' => array()
            );
        }

        // 이미지 정보 추가
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
        
            $estateArray['imageArray'][] = array(
                'imageToken' => $token,
                'fileType' => $fileType // 이미지 또는 영상 파일 타입 추가
            );
        }
    }

    // 성공 응답 반환
    $response_data = $estateArray;

    // 모든 작업 성공 시 커밋
    responseApi(200, 'SUCCESS', $response_data);

} catch (\Throwable $e) {
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
function getToken($filePath, $estateNo, $expiryTime = 900)
{
    try {
        $secretKey = 'tody2024';
        $cipher = "aes-256-cbc";
        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($cipher));

        $encryptedFilePath = openssl_encrypt($filePath, $cipher, $secretKey, 0, $iv);

        // 현재 시간 기준으로 토큰 유효기간을 설정 (예: 1시간)
        $expiration = time() + $expiryTime; // 3600초 = 1시간

        $tokenData = [
            'estateNo' => $estateNo,
            'filePath' => $encryptedFilePath,
            'iv' => base64_encode($iv),
            'key' => bin2hex(random_bytes(16)),
            'expiry' => $expiration // 만료 시간 추가
        ];

        $tokenPayload = json_encode($tokenData, JSON_UNESCAPED_SLASHES);
        $signature = hash_hmac('sha256', $tokenPayload, $secretKey);

        $tokenPayload = base64_encode($tokenPayload);
        $token = $tokenPayload . '.' . $signature;

        return $token;
    } catch (\Exception $e) {
        error_log("Token creation failed: " . $e->getMessage());
        return null;
    }
}

