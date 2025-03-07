<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');

$searchType = isset($_POST['searchType']) ? urldecode($_POST['searchType']) : '';
$searchKey = isset($_POST['searchKey']) ? urldecode($_POST['searchKey']) : '';
$page = isset($_POST['page']) ? intval($_POST['page']) : 1;
$items_per_page = isset($_POST['items_per_page']) ? intval($_POST['items_per_page']) : 10;
$offset = ($page - 1) * $items_per_page;

try {
    // SQL 쿼리
    $sql =
        "SELECT SQL_CALC_FOUND_ROWS
            a.idx AS no,
            a.title,
            a.view_count,
            a.public_fg,
            DATE_FORMAT(a.reg_date, '%Y-%m-%d') AS reg_date,
            DATE_FORMAT(a.lst_date, '%Y-%m-%d') AS lst_date,

            b.type_name AS head_type
    
        FROM reference_listings AS a
            
        LEFT JOIN type_master AS b
        ON group_code = 'REF_HEAD_TYPE'
        AND a.head_type = b.type_code
        
        WHERE a.active_fg = 'Y'
        AND a.public_fg = 'Y'
        ";

    // 조건 추가
    $params = [];
    $types = '';

    if ($searchKey !== '') {
        if ($searchType === 'title') {
            $sql .= "AND a.title LIKE ?";
            $params[] = '%' . $searchKey . '%';
            $types .= 's';
        } elseif ($searchType === 'no') {
            $sql .= "AND a.idx LIKE ?";
            $params[] = '%' . $searchKey . '%';
            $types .= 's';
        } elseif ($searchType === 'headType') {
            $sql .= "AND b.type_name LIKE ?";
            $params[] = '%' . $searchKey . '%';
            $types .= 's';
        } elseif ($searchType === 'all') {
            $sql .= "AND (a.title LIKE ? OR a.idx LIKE ? OR b.type_name LIKE ?)";
            $params[] = '%' . $searchKey . '%';
            $params[] = '%' . $searchKey . '%';
            $params[] = '%' . $searchKey . '%';
            $types .= 'sss';
        }
    }

    $sql .=
        "
        ORDER BY a.idx DESC 
        LIMIT ? OFFSET ? ";
    $params[] = $items_per_page;
    $params[] = $offset;
    $types .= 'ii';

    // echo $sql;exit;

    // 쿼리 실행
    $stmt = executeQuery($conn, $sql, $types, $params);

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();
    while ($row = mysqli_fetch_assoc($result)) {
        $response_data[] = $row;
    }

    // 전체 레코드 수 가져오기
    $count_sql = "SELECT FOUND_ROWS()";
    $count_result = mysqli_query($conn, $count_sql);
    $total_records = mysqli_fetch_array($count_result)[0];

    // 총 페이지 수 계산
    $total_pages = ceil($total_records / $items_per_page);

    // 응답 데이터에 총 레코드 수, 총 페이지 수, 현재 페이지 추가
    $response_array = [
        'responseData' => $response_data,
        'total_records' => $total_records,
        'total_pages' => $total_pages,
        'current_page' => $page,
        'items_per_page' => $items_per_page,
        'statusCode' => '200',
        'message' => 'SUCCESS',
        'timestamp' => date('Y-m-d H:i:s'),
    ];

    // HTTP 응답 코드 설정
    http_response_code('200');
    // JSON 응답 출력
    echo json_encode($response_array);
    // 모든 작업 성공 시 커밋
    // responseApi(200, 'SUCCESS', $response_array);

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
