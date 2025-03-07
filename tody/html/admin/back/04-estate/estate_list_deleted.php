<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

$public_fg = isset($_POST['public_fg']) ? urldecode($_POST['public_fg']) : '';

include_once '../00-include/common.php';
include_once '../00-include/authChk.php';

try {
    // SQL 쿼리
    $sql =
        "SELECT 
            a.idx AS estate_no,
            a.address_jibun, 
            a.address_road, 
            a.address_detail,
            a.platArea,
            a.sale_price,
            a.rent_price,
            a.deposit_price,
            DATE_FORMAT(a.reg_date, '%Y-%m-%d') AS reg_date,
            a.additional_note,
            a.public_fg,
            a.view_count,
    
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
        ON c.group_code = 'SALE_TYPE'
        AND a.sale_type = c.type_code
    
        INNER JOIN user_master AS d
        ON a.reg_no = d.user_no
    
        LEFT JOIN user_images AS e
        ON a.reg_no = e.user_no
        AND e.image_type = 'sale'

        LEFT JOIN estate_files AS f
        ON a.idx = f.estate_idx
        AND f.representative = 'Y'
    
        WHERE a.active_fg = 'N'
        ";


    // Add public_fg condition if it's set
    if ($public_fg !== '') {
        $sql .= " AND a.public_fg = ?";
    }

    $sql .= " ORDER BY a.idx DESC; ";

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    if ($public_fg !== '') {
        // 변수 바인딩 (s: string, i: integer 등)
        mysqli_stmt_bind_param($stmt, "s", $public_fg);
    }

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
                'address_jibun' => $row['address_jibun'],
                'address_road' => $row['address_road'],
                'address_detail' => $row['address_detail'],
                'platArea' => $row['platArea'],
                'sale_price' => $row['sale_price'],
                'rent_price' => $row['rent_price'],
                'deposit_price' => $row['deposit_price'],
                'reg_date' => $row['reg_date'],
                'additional_note' => $row['additional_note'],
                'public_fg' => $row['public_fg'],
                'view_count' => $row['view_count'],
                'estate_type' => $row['estate_type'],
                'sale_type' => $row['sale_type'],
                'agency_name' => $row['agency_name'],
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
                'fileType' => $fileType, // 이미지 또는 영상 파일 타입 추가
                'imageToken' => $token
            );
        }
    }

    // 성공 응답 반환
    $response_data = array_values($estateArray);

    // 모든 작업 성공 시 커밋
    responseApi(200, 'SUCCESS', $response_data);

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
