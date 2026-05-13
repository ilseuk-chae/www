<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

// *** 변수 명시적 초기화 (Undefined variable 경고 방지) *** --- 추가됨 ---
$sido = '';
$sgg = '';
//$estate_type = '';
$estate_type = []; // estate_type을 빈 '배열'로 초기화 --- 수정됨 ---
//$sale_type = '';
$sale_type = [];  // sale_type을 빈 '배열'로 초기화 --- 수정됨 ---
$minPrice = ''; // 카멜 케이스로 초기화
$maxPrice = ''; // 카멜 케이스로 초기화
$minArea = '';  // 카멜 케이스로 초기화
$maxArea = '';  // 카멜 케이스로 초기화
$sort = '';
$page = 1;
$items_per_page = 12;
// *** 초기화 끝 ***

//카멜 케이스(Camel case)와 스네이크 케이스(Snake case)는 프로그래밍이나 데이터베이스 등에서 여러 단어로 이루어진 변수, 함수, 파일 등의 이름을 지을 때 사용하는 대표적인 **명명 규칙(Naming Convention)**입니다.
//스네이크 케이스(Snake case) 를 카멜 케이스(Camel case)로 변환
// 클라이언트가 보낸 파라미터 읽어오기 (카멜 케이스 이름 사용)

//$sido = isset($_POST['sido']) ? urldecode($_POST['sido']) : '';
$sido = isset($_POST['sido']) ? urldecode($_POST['sido']) : $sido; // 초기화된 값 또는 POST 값 사용
//$sgg = isset($_POST['sgg']) ? urldecode($_POST['sgg']) : '';
$sgg = isset($_POST['sgg']) ? urldecode($_POST['sgg']) : $sgg;
//$estate_type = isset($_POST['estate_type']) ? urldecode($_POST['estate_type']) : '';
$estate_type = isset($_POST['estateType']) && is_array($_POST['estateType']) ? $_POST['estateType'] : $estate_type; // 배열인지 확인
//$sale_type = isset($_POST['sale_type']) ? urldecode($_POST['sale_type']) : '';
$sale_type = isset($_POST['saleType']) && is_array($_POST['saleType']) ? $_POST['saleType'] : $sale_type;     // 배열인지 확인
//$min_price = isset($_POST['min_price']) ? urldecode($_POST['min_price']) : '';
$minPrice = isset($_POST['minPrice']) ? urldecode($_POST['minPrice']) : $minPrice;     // 'min_price' -> 'minPrice'     --- 수정됨 ---
//$max_price = isset($_POST['max_price']) ? urldecode($_POST['max_price']) : '';
$maxPrice = isset($_POST['maxPrice']) ? urldecode($_POST['maxPrice']) : $maxPrice;      // 'max_price' -> 'maxPrice'     --- 수정됨 ---
//$min_area = isset($_POST['min_area']) ? urldecode($_POST['min_area']) : '';
$minArea = isset($_POST['minArea']) ? urldecode($_POST['minArea']) : $minArea;       // 'min_area' -> 'minArea'       --- 수정됨 ---
//$max_area = isset($_POST['max_area']) ? urldecode($_POST['max_area']) : '';
$maxArea = isset($_POST['maxArea']) ? urldecode($_POST['maxArea']) : $maxArea;       // 'max_area' -> 'maxArea'       --- 수정됨 ---
//$sort = isset($_POST['sort']) ? urldecode($_POST['sort']) : '';
$sort = isset($_POST['sort']) ? urldecode($_POST['sort']) : $sort;
//$page = isset($_POST['page']) ? intval($_POST['page']) : 1;
$page = isset($_POST['page']) ? intval($_POST['page']) : $page;
//$items_per_page = isset($_POST['page']) ? intval($_POST['items_per_page']) : 12;
$items_per_page = isset($_POST['itemsPerPage']) ? intval($_POST['itemsPerPage']) : $items_per_page;  // 'items_per_page' -> 'itemsPerPage' --- 수정됨 ---
$offset = ($page - 1) * $items_per_page;
// echo $min_area;
// exit;
try {
    // SQL 쿼리
    $sql =
        "SELECT SQL_CALC_FOUND_ROWS
            a.idx AS put_no,
            a.sido_cd,
            a.sgg_cd,
            a.exchange_fg,
            a.sale_price,
            a.rent_price,
            a.area,
            a.phone,
            a.noti_count,
            a.view_count,
            a.public_fg,
            DATE_FORMAT(a.reg_date, '%Y-%m-%d') AS reg_date,
    
            b.type_name AS estate_type,
            c.type_name AS sale_type,

            d.locallow_nm AS sido,
            TRIM(SUBSTR(e.locatadd_nm, LOCATE(' ', e.locatadd_nm) + 1)) AS sgg,
            
            f.file_path
            
        FROM put_listings AS a
    
        INNER JOIN type_master AS b
        ON b.group_code = 'ESTATE_TYPE'
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
        
        WHERE a.active_fg = 'Y'
        AND a.public_fg IN ('Y', 'C')
        ";

    // 조건 추가
    $params = [];
    $types = '';
    // ... (sido, sgg, estate_type, sale_type 조건 추가 로직 - 변수 이름은 수정된 대로 사용) ...
    // estate_type과 sale_type은 클라이언트에서 배열이 아닌 쉼표로 구분된 문자열로 보내고 있으므로,
    // 이 부분의 로직은 현재대로 유지합니다. 변수 이름만 client와 일치하도록 읽으면 됩니다.
    if ($sido !== '') {
        $sql .= " AND a.sido_cd = ?";
        $params[] = $sido;
        $types .= 's';
    }
    if ($sgg !== '') {
        $sql .= " AND a.sgg_cd = ?";
        $params[] = $sgg;
        $types .= 's';
    }
    //if ($estate_type !== '') {
    //    $estate_type_array = explode(',', $estate_type); // 쉼표로 구분된 문자열 estate_type을 쉼표를 기준으로 나누어 배열로 변환
    //    $placeholders = implode(',', array_fill(0, count($estate_type_array), '?')); // 배열의 크기만큼 ? 문자열을 채운 배열을 생성
    //    $sql .= " AND a.estate_type IN ($placeholders)";
    //    $params = array_merge($params, $estate_type_array); // 기존의 $params 배열에 estate_type_array의 값을 추가
    //    $types .= str_repeat('s', count($estate_type_array)); // 각 매개변수의 유형을 's'로 추가
    //}
    // *** estate_type 조건 추가 및 바인딩 로직 (배열 사용) *** --- 수정됨 ---
    // $estate_type 변수 자체가 이미 클라이언트에서 온 배열이라고 가정
    if (!empty($estate_type)) { // 배열이 비어있지 않으면 실행 (count($estate_type) > 0 와 동일)
        //error_log("estate_type condition is TRUE. Array value: " . print_r($estate_type, true)); // 배열 내용 확인

        // 플레이스홀더 생성 (배열 크기 이용)
        $placeholders = implode(',', array_fill(0, count($estate_type), '?'));
        //error_log("estate_type placeholders: " . $placeholders); // 플레이스홀더 문자열 확인

        $sql .= " AND a.estate_type IN ($placeholders)"; // SQL에 조건 추가
        //error_log("SQL updated with estate_type IN clause: " . $sql); // SQL 확인

        // 파라미터 병합 (estate_type 자체가 배열이므로 바로 병합)
        $params = array_merge($params, $estate_type); // !!! $params 배열에 값 추가 !!!
        //error_log("params array after merging estate_type: " . print_r($params, true)); // $params 상태 확인

        // 타입 문자열 추가 (배열 크기 이용)
        $types .= str_repeat('s', count($estate_type)); // !!! $types 문자열에 's' 추가 !!!
        //error_log("types string after adding estate_type types: " . $types); // $types 상태 확인
    } else {
         //error_log("estate_type condition is FALSE (empty array)."); // 조건문 실행 안 됨 확인
    }
    // *** estate_type 로직 수정 끝 ***
    //if ($sale_type !== '') {
    //    $sale_type_array = explode(',', $sale_type); // 쉼표로 구분된 문자열 sale_type 쉼표를 기준으로 나누어 배열로 변환
    //    $placeholders = implode(',', array_fill(0, count($sale_type_array), '?')); // 배열의 크기만큼 ? 문자열을 채운 배열을 생성
    //    $sql .= " AND a.sale_type IN ($placeholders)";
    //    $params = array_merge($params, $sale_type_array); // 기존의 $params 배열에 estate_type_array의 값을 추가
    //    $types .= str_repeat('s', count($sale_type_array)); // 각 매개변수의 유형을 's'로 추가
    //}
    // *** sale_type 조건 추가 및 바인딩 로직 (배열 사용) (estate_type과 동일하게 수정) *** --- 수정됨 ---
    if (!empty($sale_type)) { // 배열이 비어있지 않으면 실행
        //error_log("sale_type condition is TRUE. Array value: " . print_r($sale_type, true)); // 배열 내용 확인

        // 쉼표로 분리 (이 부분 제거)
        // $sale_type_array = explode(',', $sale_type); // 클라이언트에서 온 $sale_type 사용

        // 플레이스홀더 생성 (배열 크기 이용)
        $placeholders = implode(',', array_fill(0, count($sale_type), '?'));
        //error_log("sale_type placeholders: " . $placeholders); // 플레이스홀더 문자열 확인

        $sql .= " AND a.sale_type IN ($placeholders)"; // SQL에 조건 추가
        //error_log("SQL updated with sale_type IN clause: " . $sql); // SQL 확인

        // 파라미터 병합 (sale_type 자체가 배열이므로 바로 병합)
        $params = array_merge($params, $sale_type); // !!! $params 배열에 값 추가 !!!
        //error_log("params array after merging sale_type: " . print_r($params, true)); // $params 상태 확인

        // 타입 문자열 추가 (배열 크기 이용)
        $types .= str_repeat('s', count($sale_type)); // !!! $types 문자열에 's' 추가 !!!
        //error_log("types string after adding sale_type types: " . $types); // $types 상태 확인
    } else {
         //error_log("sale_type condition is FALSE (empty array)."); // 조건문 실행 안 됨 확인
    }
    // *** sale_type 로직 수정 끝 ***

    //if ($min_price !== '') {
    //    $sql .= " AND a.sale_price >= ?";
    //    $params[] = $min_price;
    //    $types .= 'i';
    //}
    if ($minPrice !== '') { // 라인 43이 이 부분일 가능성이 높습니다.
        //error_log("minPrice condition is TRUE. Value: " . $minPrice); // 디버깅 로그 추가
        $sql .= " AND a.sale_price >= ?";
        $params[] = $minPrice; // 변수 이름 일치
        $types .= 'i';
    }
    
    //if ($max_price !== '') {
    //    error_log("maxPrice condition is TRUE. Value: " . $maxPrice);
    //    $sql .= " AND a.sale_price <= ?";
    //    $params[] = $maxPrice; // 필요시 형변환
    //    $types .= 'i';
    //    error_log("SQL updated for maxPrice. Current SQL segment: " . substr($sql, -20)); // SQL 마지막 부분 확인
    //    error_log("Current params array: " . print_r($params, true));
    //    error_log("Current types string: " . $types);
    //} else {
    //     error_log("maxPrice condition is FALSE. Value: " . $maxPrice); // 왜 FALSE가 되었는지 확인
    //}

    if ($maxPrice !== '') { // 이 부분일 수도 있습니다.
        //error_log("maxPrice condition is TRUE. Value: " . $maxPrice); // 디버깅 로그 추가
        $sql .= " AND a.sale_price <= ?";
        $params[] = $maxPrice; // 변수 이름 일치
        $types .= 'i';
        //error_log("SQL updated for maxPrice. Current SQL segment: " . substr($sql, -20)); // SQL 마지막 부분 확인
        //error_log("Current params array: " . print_r($params, true));
        //error_log("Current types string: " . $types);
    }
    //if ($min_area !== '') {
    //    $sql .= " AND a.min_area >= ?";
    //    $params[] = $min_area;
    //    $types .= 'i';
    //}
    if ($minArea !== '') {
        $sql .= " AND a.area >= ?";
        $params[] = $minArea;
        $types .= 'i';
    }
    //if ($max_area !== '') {
    //    $sql .= " AND a.max_area <= ?";
    //    $params[] = $max_area;
    //    $types .= 'i';
    //}
    if ($maxArea !== '') {
        $sql .= " AND a.area <= ?";
        $params[] = $maxArea;
        $types .= 'i';
    }
    $sql .= " GROUP BY a.idx ";
    if ($sort == 'views') {
        $sql .= " ORDER BY a.view_count DESC, a.idx DESC ";
    } elseif ($sort == 'price') {
        $sql .= " ORDER BY a.sale_price DESC, a.rent_price DESC, a.idx DESC ";
    } else {
        $sql .= " ORDER BY a.idx DESC ";
    }

    // 페이징 추가
    $sql .= " LIMIT ? OFFSET ? ;";
    $params[] = $items_per_page;
    $params[] = $offset;
    $types .= 'ii';

    // *** 디버깅 로그 다시 추가 (수정된 $types 값 확인) ***
    // 모든 조건 처리 및 페이징 추가 후 최종 $sql, $params, $types 상태 확인
    //error_log("Final SQL query string before prepare: " . $sql);
    //error_log("Parameters array (\$params) before binding: " . print_r($params, true));
    //error_log("Types string (\$types) before binding: " . $types); // 수정된 $types 확인
    //error_log("Types string length: " . strlen($types) . ", Params count: " . count($params)); // 길이/개수 일치 확인
    // *** 디버깅 로그 끝 ***

    // *** 최종 SQL 준비 및 바인딩 직전 정보 확인 (필수) ***
    //error_log("--- Final Check before Prepare/Execute ---");
    //error_log("Final SQL query string: " . $sql);
    //error_log("Final Parameters array (\$params): " . print_r($params, true)); // !!! 최종 $params 순서/값 확인 !!!
    //error_log("Final Types string (\$types): " . $types); // !!! 최종 $types 순서/문자 확인 !!!
    //error_log("Types string length: " . strlen($types) . ", Params count: " . count($params)); // 길이/개수 일치 확인
    //error_log("--- End Final Check ---");
    // *** 디버깅 끝 ***

    // SQL 문장을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        //error_log("MySQLi Prepare failed: " . mysqli_error($conn) . " | SQL: " . $sql);
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 변수 바인딩 (s: string, i: integer 등)
    if (!empty($params)) {
        if (strlen($types) !== count($params)) {
            //error_log("Binding error: Types string length (" . strlen($types) . ") and params array count (" . count($params) . ") mismatch. Types: " . $types . " | Params: " . print_r($params, true));
            throw new Exception('BINDING_PARAMS_MISMATCH', 500);
        }
        if (!mysqli_stmt_bind_param($stmt, $types, ...$params)) {
            //error_log("MySQLi Bind Param failed: " . mysqli_stmt_error($stmt) . " | Types: " . $types . " | Params: " . print_r($params, true));
            throw new Exception('QUERY_BINDING_FAILED', 500);
        }
        //error_log("mysqli_stmt_bind_param successful."); // 바인딩 성공 로그 추가
    } else {
        //error_log("No parameters to bind.");
    }


    // SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        //error_log("MySQLi Execute failed: " . mysqli_stmt_error($stmt) . " | SQL: " . $sql . " | Types: " . $types . " | Params: " . print_r($params, true)); // 상세 로그
        throw new Exception('QUERY_EXECUTE_FAILED', 500);
    }

    //error_log("mysqli_stmt_execute successful."); // 실행 성공 로그 추가


    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);
    
    // 결과를 배열로 변환합니다.
    $response_data = array();
    $estateArray = array();

    // 결과를 배열로 변환합니다.
    while ($row = mysqli_fetch_assoc($result)) {
        $response_data[] = $row;

        $put_no = $row['put_no'];

        if (!isset($estateArray[$put_no])) {
            $estateArray[$put_no] = array(
                'put_no' => $row['put_no'],
                'sido_cd' => $row['sido_cd'],
                'sgg_cd' => $row['sgg_cd'],
                'exchange_fg' => $row['exchange_fg'],
                'sale_price' => !empty($row['sale_price']) ? $row['sale_price'] : '0',
                'rent_price' => !empty($row['rent_price']) ? $row['rent_price'] : '0',
                'area' => !empty($row['area']) ? $row['area'] : '0',
                'phone' => $row['phone'],
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
            // $filePath = '/home/project/tody/upload/'.$row['file_path'];
            $filePath = $row['file_path'];
            $token = getToken($filePath, $put_no);
            $estateArray[$put_no]['imageArray'][] = array(
                'imageToken' => $token
            );
        }
    }

    // 성공 응답 반환
    $response_data = array_values($estateArray);

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
        'statusCode' => '200',
        'message' => 'SUCCESS',
        'timestamp' => date('Y-m-d H:i:s'),
    ];

    // HTTP 응답 코드 설정
    http_response_code('200');
    header('Content-Type: application/json; charset=utf-8'); // Content-Type 헤더 설정 --- 추가됨 ---
    // JSON 응답 출력
    echo json_encode($response_array);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    // 오류 발생 시 롤백
    // 오류 발생 시 DataTables가 인식할 수 있는 형태의 응답을 보내는 것이 좋습니다.
    // responseApi 함수가 내부적으로 어떤 처리를 하는지 확인하거나,
    // DataTables 에러 응답 형식에 맞게 직접 구현합니다.
    // DataTables는 success: false 와 같은 속성이나, 빈 데이터 배열 등을 예상할 수 있습니다.
    // DataTables 에러 응답 예시:
    http_response_code(500); // 또는 적절한 에러 코드
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'data' => [], // 데이터 배열은 비워둡니다.
        'recordsTotal' => 0,
        'recordsFiltered' => 0,
        'error' => $e->getMessage() // 에러 메시지를 포함할 수 있습니다.
    ]);

    // 기존 responseApi 호출은 제거하거나 DataTables 형식으로 수정
    //responseApi($e->getCode(), $e->getMessage(), null);

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
