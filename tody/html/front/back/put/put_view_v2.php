<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

$viewNo = isset($_POST['viewNo']) ? urldecode($_POST['viewNo']) : '';

##################### 0. 유효성 검사 #####################
// 은행명 유효성 검사
$errorMessage = "정상적인 접근이 아닙니다.";
$valid = validateInput($viewNo, 'int', $errorMessage, array());
if ($valid == $errorMessage) {
    responseApi(400, $errorMessage, null);
    exit;
}

try {
    // SQL 쿼리
    $sql =
        "SELECT
            a.idx AS put_no,
            a.address_jibun,
            a.address_road,
            a.sido_cd,
            a.sgg_cd,
            a.exchange_fg,
            (SELECT type_name FROM type_master WHERE group_code = 'SUB_ESTATE_TYPE' AND type_code = a.sub_estate LIMIT 1) AS sub_estate,
            a.sale_price,
            a.rent_price,
            a.area,
            a.phone,
            a.noti_count,
            a.view_count,
            a.description,
            a.public_fg,
            DATE_FORMAT(a.reg_date, '%Y.%m.%d') AS reg_date,

            b.type_name AS estate_type,
            b.type_code AS estate_type_cd,
            c.type_name AS sale_type,
            c.type_code AS sale_type_cd,

            d.locallow_nm AS sido,
            TRIM(SUBSTR(e.locatadd_nm, LOCATE(' ', e.locatadd_nm) + 1)) AS sgg,

            f.file_path

        FROM put_listings_v2 AS a

        INNER JOIN type_master AS b
        ON b.group_code = 'NEW_ESTATE_TYPE'
        AND a.estate_type = b.type_code

        INNER JOIN type_master AS c
        ON c.group_code = 'TRANSACTION_TYPE'
        AND a.sale_type = c.type_code

        LEFT JOIN bjd_master AS d
            ON a.sido_cd = d.sido_cd
            AND d.depth = 1 -- 시/도를 구분하는 조건 (시/도 레벨에 해당하는 조건)

        LEFT JOIN bjd_master AS e
            ON a.sido_cd = e.sido_cd
            AND a.sgg_cd = e.sgg_cd
            AND e.depth = 2 -- 시/군/구 레벨에 해당하는 조건

        LEFT JOIN estate_files AS f
        ON a.idx = f.estate_idx
        AND f.group_type = 'put'
        -- AND f.representative = 'Y'

        WHERE a.idx = ?
        AND a.active_fg = 'Y'
        AND a.public_fg IN ('Y', 'C')
        ";

    // 조건 추가
    $params = [$viewNo];
    $types = 'i';

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    mysqli_stmt_bind_param($stmt, $types, ...$params);

    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('QUERY_EXECUTE_FAILED', 500);
    }

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();
    $estateArray = array();

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        // $response_data = $row;

        $put_no = $row['put_no'];

        if (!isset($estateArray[$put_no])) {
            $estateArray[$put_no] = array(
                'put_no' => $row['put_no'],
                'address_jibun' => $row['address_jibun'],
                'address_road' => $row['address_road'],
                'sido_cd' => $row['sido_cd'],
                'sgg_cd' => $row['sgg_cd'],
                'exchange_fg' => $row['exchange_fg'],
                'sub_estate' => $row['sub_estate'],
                'sale_price' => !empty($row['sale_price']) ? $row['sale_price'] : '0',
                'rent_price' => !empty($row['rent_price']) ? $row['rent_price'] : '0',
                'area' => !empty($row['area']) ? $row['area'] : '0',
                'phone' => $row['phone'],
                'description' => $row['description'],
                'noti_count' => !empty($row['noti_count']) ? $row['noti_count'] : '0',
                'view_count' => !empty($row['view_count']) ? $row['view_count'] : '0',
                'public_fg' => $row['public_fg'],
                'reg_date' => $row['reg_date'],
                'estate_type' => $row['estate_type'],
                'sale_type' => $row['sale_type'],
                'sido' => $row['sido'],
                'sgg' => $row['sgg'],
                'imageArray' => array()
            );
        }

        // 이미지 정보 추가
        if ($row['file_path']) {
            $filePath = $row['file_path'];
            $token = getToken($filePath, $put_no);
            $estateArray[$put_no]['imageArray'][] = array(
                'imageToken' => $token
            );
        }
    }

    // 성공 응답 반환
    $response_data = array_values($estateArray);

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
        'iv' => base64_encode($iv),
        'key' => bin2hex(random_bytes(16))
    ];

    $tokenPayload = json_encode($tokenData, JSON_UNESCAPED_SLASHES);
    $signature = hash_hmac('sha256', $tokenPayload, $secretKey);

    $tokenPayload = base64_encode($tokenPayload);
    $token = $tokenPayload . '.' . $signature;

    return $token;
}
