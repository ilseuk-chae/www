<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$search_no = isset($_POST['searchNo']) ? urldecode($_POST['searchNo']) : '';
$estate_type = isset($_POST['estateType']) ? urldecode($_POST['estateType']) : '';
$sale_type = isset($_POST['saleType']) ? urldecode($_POST['saleType']) : '';
$min_price = isset($_POST['minPrice']) && is_numeric(urldecode($_POST['minPrice'])) 
    ? (float)urldecode($_POST['minPrice']) * 10000 
    : 0;
$max_price = isset($_POST['maxPrice']) && is_numeric(urldecode($_POST['maxPrice'])) 
    ? (float)urldecode($_POST['maxPrice']) * 10000 
    : PHP_INT_MAX;
$public_fg = isset($_POST['public_fg']) ? urldecode($_POST['public_fg']) : '';

// 결과를 배열로 변환합니다.
$response_data = array();
$estateArray = array();

try {
    $user_no = get_user_no_for_hash($conn, $userNo);

    #######################################################
    # 1. 매물 리스트 가져오기
    #######################################################
    $sql = 
        "SELECT 
            el.idx AS estate_no,
            el.latitude,
            el.longitude,
            el.sale_price,
            el.rent_price,
            el.deposit_price,
            el.totArea,
            el.description,
            el.feature,
            el.additional_note,
            el.view_count,
            el.address_jibun,
            el.address_road,
            el.address_detail,
            el.public_fg,
            DATE_FORMAT(el.reg_date, '%Y-%m-%d') AS reg_date, 

            tm.type_name AS estate_type,

            tm2.type_name AS sale_type,

            um.agency_name,

            ef.file_path
        FROM estate_listings AS el

        INNER JOIN type_master AS tm
        ON tm.group_code = 'ESTATE_TYPE'
        AND el.estate_type = tm.type_code

        INNER JOIN type_master AS tm2
        ON tm2.group_code = 'SALE_TYPE'
        AND el.sale_type = tm2.type_code

        INNER JOIN user_master AS um
        ON um.user_no = el.reg_no
        AND um.status_code = '001'
        -- AND um.role = '002'
    
        LEFT JOIN estate_files AS ef
        ON ef.group_type = 'sale'
        AND ef.estate_idx = el.idx
        AND ef.representative = 'Y'

        WHERE el.reg_no = ?
        AND el.active_fg = 'Y'
    ";

    // 조건 추가
    $params = [$user_no];
    $types = 'i';

    // 매물 번호로 검색하는 경우
    if ($search_no) {
        $sql .= " AND el.idx = ?";
        $params[] = $search_no;
        $types .= 'i';
    }

    // 매물 타입 필터 추가
    if ($estate_type !== '') {
        $sql .= " AND el.estate_type = ?";
        $params[] = $estate_type;
        $types .= 's';
    }

    // 거래 타입 필터 추가
    if ($sale_type !== '') {
        $sql .= " AND el.sale_type = ?";
        $params[] = $sale_type;
        $types .= 's';
    }

    // 가격 범위 필터 추가
    if ($min_price !== '') {
        $sql .= " AND el.sale_price >= ?";
        $params[] = $min_price;
        $types .= 'i';
    }

    // 가격 범위 필터 추가
    if ($max_price !== '') {
        $sql .= " AND el.sale_price <= ?";
        $params[] = $max_price;
        $types .= 'i';
    }

    // 공개 필터 추가
    if ($public_fg !== '') {
        $sql .= " AND el.public_fg = ?";
        $params[] = $public_fg;
        $types .= 's';
    }

    $sql .= " ORDER BY el.reg_date DESC, el.idx DESC";
    // echo (get_bound_query($sql, $params));exit;

    // 쿼리 실행
    $stmt = executeQuery($conn, $sql, $types, $params);

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $estate_no = $row['estate_no'];

        if (!isset($estateArray[$estate_no])) {
            $estateArray[$estate_no] = array(
                'estate_no' => $row['estate_no'],
                'totArea' => $row['totArea'],
                'sale_price' => $row['sale_price'],
                'rent_price' => $row['rent_price'],
                'deposit_price' => $row['deposit_price'],
                'view_count' => $row['view_count'],
                'address_jibun' => $row['address_jibun'],
                'address_road' => $row['address_road'],
                'address_detail' => $row['address_detail'],
                'public_fg' => $row['public_fg'],
                'reg_date' => $row['reg_date'],
                'description' => $row['description'],
                'feature' => $row['feature'],
                'additional_note' => $row['additional_note'],
                'lat' => $row['latitude'],
                'lng' => $row['longitude'],
                'estate_type' => $row['estate_type'],
                'sale_type' => $row['sale_type'],
                'agency_name' => $row['agency_name'],
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

            $estateArray[$estate_no]['imageArray'][] = array(
                'fileType' => $fileType, // 이미지 또는 영상 파일 타입 추가
                'imageToken' => $token
            );
        }
    }

    // 성공 응답 반환
    $response_data = array_values($estateArray);

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
    $secretKey = 'tody2024';
    $cipher = "aes-256-cbc";
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($cipher));

    $encryptedFilePath = openssl_encrypt($filePath, $cipher, $secretKey, 0, $iv);

    // 현재 시간 기준으로 토큰 유효기간을 설정 (예: 1시간)
    $expiration = time() + $expiryTime; // 3600초 = 1시간

    $tokenData = [
        'estateNo' => $estateNo,
        'filePath' => $encryptedFilePath,
        'iv' => base64_encode($iv), // IV를 포함해야 복호화 가능
        'key' => bin2hex(random_bytes(16)),
        'expiry' => $expiration // 만료 시간 추가
    ];

    $tokenPayload = json_encode($tokenData, JSON_UNESCAPED_SLASHES); // 슬래시를 이스케이프하지 않음
    $signature = hash_hmac('sha256', $tokenPayload, $secretKey);

    // Base64 인코딩 전에 확실히 파일 경로가 올바르게 인코딩되었는지 확인
    $tokenPayload = base64_encode($tokenPayload);
    $token = $tokenPayload . '.' . $signature;

    return $token;
}

