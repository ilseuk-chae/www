<?php

/**
 * Http Response 정보를 입력받아, 형태를 정의하고 반환하는 함수
 * 버전 : v0.1
 * 작성일 : 2023-09-08
 * 작성자 : IT7
 * @param $statusCode : HTTP 상태 코드
 * @param $message : 상태 메시지
 * @param $data : 반환할 데이터
 * @return $response_array : 반환할 데이터를 담은 배열
 */
function responseApi($statusCode, $message, $data)
{
    // $statusCode가 숫자가 아닌 경우 정수로 변환
    $statusCode = (int)$statusCode;
    
    $response_array = array();
    $response_array['statusCode'] = $statusCode;
    $response_array['message'] = $message;
    $response_array['responseData'] = $data;
    $response_array['timestamp'] = date('Y-m-d H:i:s');

    // HTTP 응답 코드 설정
    http_response_code($statusCode);
    // JSON 응답 출력
    echo json_encode($response_array);
}

/**
 * 페이징 관련 정보를 입력 받아, 반환하는 함수 
 * 버전 : v0.1
 * 작성일 : 2023-09-08
 * 작성자 : IT7
 * @param $pageNo : 현재 페이지 번호
 * @param $count : 전체 데이터 개수
 * @param $listSize : 한 페이지에 보여줄 데이터 개수
 * @param $pagingCountNumber : 한번에 보여줄 페이징 개수
 * 
 * @return $pagingInfo : 페이징 관련 정보를 담은 배열
 */
function getPagingData($pageNo, $count, $listSize, $pagingCountNumber)
{
    // 변수를 정수화 한다.
    $count = (Int) $count;

    // 전달받은 list_size 또한 정수화 한다.
    $listSize = (Int) $listSize;

    // 전달받은 paging_cnt_num 또한 정수화 한다.
    $pagingCountNumber = (Int) $pagingCountNumber;

    // 페이징수를 계산한다.
    $totalPagingCnt = (int) (($count - 1) / $listSize) + 1;

    // 페이징번호 구하기 ( 시작과 끝)
    $pagingInitNumber = ((int) (($pageNo - 1) / $pagingCountNumber)) * $pagingCountNumber + 1;
    $pagingEndNumber = $pagingInitNumber + $pagingCountNumber - 1;

    if ($totalPagingCnt <= $pagingEndNumber) {
        $pagingEndNumber = $totalPagingCnt;
    }

    $listStartNumber = ($pageNo - 1) * $listSize;
    $listEndNumber = $listStartNumber + $listSize;

    $pagingInfo = array();
    $pagingInfo['count'] = $count;
    $pagingInfo['totalPagingCount'] = $totalPagingCnt;
    $pagingInfo['pagingInitNumber'] = $pagingInitNumber;
    $pagingInfo['pagingEndNumber'] = $pagingEndNumber;
    $pagingInfo['listStartNumber'] = $listStartNumber;
    $pagingInfo['listEndNumber'] = $listEndNumber;
    $pagingInfo['prevPageNo'] = ($pageNo - 5) > 0 ? ($pageNo - 5) : 1;
    $pagingInfo['nextPageNo'] = ($pageNo + 5) < $totalPagingCnt ? ($pageNo + 5) : $totalPagingCnt;
    $pagingInfo['listSize'] = $listSize;

    return $pagingInfo;
}

/**
 * 사용자 인증 정보를 가져오는 함수
 * 버전 : v0.1
 * 작성일 : 2023-09-09
 * 작성자 : IT7
 * @param $conn : DB 연결 객체
 * @param $userNo : 사용자 번호
 * @return $resultArray : 생성된 인증 정보를 담은 배열
 */
function generateAuthData($conn, $userNo)
{
    //중복 로그인 방지를 위한 cont_no 발급
    $sessionId = $userNo;
    $addressIp = $_SERVER['REMOTE_ADDR']; //접속자 ip
    $pageUrl = $_SERVER['PHP_SELF']; // 현재 페이지 url
    $userAgent = $_SERVER['HTTP_USER_AGENT'];

    //contact 번호 생성
    $sql = "SELECT EBGA_SA_PAGE_CONTACT_LOG ('" . $addressIp . "', '" . $userAgent . "', '" . $sessionId . "', '" . $pageUrl . "') as cont_no_max";
    $rs = mysqli_query($conn, $sql) or die(mysqli_error($conn));
    $contMax = mysqli_fetch_row($rs);
    $contMax = $contMax[0];

    //cont_token 발급
    $sql = "SELECT " . $contMax . " as cont_no, EBGA_CREATE_PW_SHA(" . $contMax . ") as cont_token";
    $rs = mysqli_query($conn, $sql) or die(mysqli_error($conn));
    $cont = mysqli_fetch_assoc($rs);
    $contToken = $cont['cont_token'];

    //local Storage(ex.쿠키)로 가지고 다닐 개인정보(token) 반환
    $hashUserNo = hash('sha256', $userNo);
    $sql = "SELECT " . $userNo . " as cont_no, EBGA_CREATE_PW_SHA('{$hashUserNo}') as token";
    $rs = mysqli_query($conn, $sql) or die(mysqli_error($conn));
    $token = mysqli_fetch_assoc($rs);
    $userToken = $token['token'];

    $resultArray = array();

    $resultArray['saNo'] = hash('sha256', $userNo);
    $resultArray['saContNo'] = $contMax;
    $resultArray['saContToken'] = $contToken;
    $resultArray['saToken'] = $userToken;

    return $resultArray;
}

// 파일의 확장자를 가져온다.
function getFileExt($fileName)
{
    $fileExt = explode('.', $fileName);
    $fileActualExt = strtolower(end($fileExt));

    return $fileActualExt;
}

// 파일의 정보를 가져온다
function getFileInfo($file)
{

    $mime_type = mime_content_type($file['tmp_name']);

    if (!$file['tmp_name']) {
        responseApi(400, "FILE_ERROR", null);
        exit;
    }
    ;

    checkFileExt($file);

    $file_info = array();
    $file_info['name'] = $file['name'];
    $file_info['type'] = $file['type'];
    $file_info['tmp_name'] = $file['tmp_name'];
    $file_info['error'] = $file['error'];
    $file_info['size'] = $file['size'];
    $file_info['ext'] = getFileExt($file['name']);
    $file_info['mime_type'] = $mime_type;

    return $file_info;
}

// 파일을 파라미터로 받아, 파일 확장자를 체크하여 서버에 업로드되면 안되는 파일인지 체크한다.
function checkFileExt($file)
{

    $mime_type = mime_content_type($file['tmp_name']);

    // 업로드가 가능한 Mime/type을 정의한다.
    // 문서 : 워드, PDF, PPT, txt, 엑셀
    // 이미지 : gif, jpg, jpeg, png, webp
    $mime_array = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/gif',
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/webp',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    // 업로드가 가능한 파일 확장자를 정의한다.
    $ext_array = ['doc', 'docx', 'gif', 'jpg', 'jpeg', 'png', 'pdf', 'ppt', 'pptx', 'txt', 'webp', 'xls', 'xlsx'];

    $is_allowed_mime = in_array($mime_type, $mime_array);

    // 업로드가 불가능한 파일 확장자를 체크한다.
    if (!$is_allowed_mime) {
        responseApi(400, "MIME_TYPE_ERROR", null);
        exit;
    }

    return true;
}

// 파일 사이즈를 체크한다. 파일은 MB 단위로 체크한다.
function checkFileSize($file, $maxSize)
{
    $fileSize = convertFileSize($file['size'], 'MB');

    if ($fileSize > $maxSize) {
        responseApi(400, "FILE_SIZE_ERROR", null);
        exit;
    }
}

/**
 * 파일 사이즈 단위와 파일 사이즈(Byte)를 입력받아, 입력받은 단위로 변환하여 반환한다.
 * 버전 : v0.1
 * 작성일 : 2023-09-09
 * 작성자 : IT7
 * @param $fileSize : 파일 사이즈(Byte)
 * @param $unit : 파일 사이즈 단위
 * @return $fileSize : 변환된 파일 사이즈
 *  */
function convertFileSize($fileSize, $unit)
{
    $fileSize = (Int) $fileSize;
    $unit = strtoupper($unit);

    switch ($unit) {
        case 'KB':
            $fileSize = $fileSize / 1024;
            break;
        case 'MB':
            $fileSize = $fileSize / 1024 / 1024;
            break;
        case 'GB':
            $fileSize = $fileSize / 1024 / 1024 / 1024;
            break;
        default:
            $fileSize = $fileSize / 1024 / 1024;
            break;
    }

    return $fileSize;
}

// 랜덤 문자열 생성
function genRandom($length = 5)
{
    $char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $char .= 'abcdefghijklmnopqrstuvwxyz';
    $char .= '0123456789';
    $result = '';
    $charLength = strlen($char); // 문자열 길이를 미리 계산합니다.
    for ($i = 0; $i < $length; $i++) {
        $result .= $char[mt_rand(0, $charLength - 1)]; // 랜덤 인덱스 생성시 문자열 길이에서 1을 뺍니다.
    }
    return $result;
}

// 이미지 리사이징
function resize_image($destination, $departure, $size, $quality = '80', $ratio = 'false')
{
    if ($size[2] == 1) {    //-- GIF
        $src = imagecreatefromgif($departure);
    } elseif ($size[2] == 2) { //-- JPG
        $src = imagecreatefromjpeg($departure);
    } else {    //-- $size[2] == 3, PNG
        $src = imagecreatefrompng($departure);
    }

    $dst = imagecreatetruecolor($size['w'], $size['h']);


    $dstX = 0;
    $dstY = 0;
    $dstW = $size['w'];
    $dstH = $size['h'];

    if ($ratio != 'false' && $size['w'] / $size['h'] <= $size[0] / $size[1]) {
        $srcX = ceil(($size[0] - $size[1] * ($size['w'] / $size['h'])) / 2);
        $srcY = 0;
        $srcW = $size[1] * ($size['w'] / $size['h']);
        $srcH = $size[1];
    } elseif ($ratio != 'false') {
        $srcX = 0;
        $srcY = ceil(($size[1] - $size[0] * ($size['h'] / $size['w'])) / 2);
        $srcW = $size[0];
        $srcH = $size[0] * ($size['h'] / $size['w']);
    } else {
        $srcX = 0;
        $srcY = 0;
        $srcW = $size[0];
        $srcH = $size[1];
    }

    @imagecopyresampled($dst, $src, $dstX, $dstY, $srcX, $srcY, $dstW, $dstH, $srcW, $srcH);
    @imagejpeg($dst, $destination, $quality);
    @imagedestroy($src);
    @imagedestroy($dst);

    return true;
}

// $img : 원본이미지
// $m : 목표크기 pixel
// $ratio : 비율 강제설정
function _getimagesize($img, $m, $ratio = 'false')
{
    $v = @getImageSize($img);

    if ($v === false || $v[2] < 1 || $v[2] > 3) {
        return false;
    }

    $m = intval($m);

    if ($m > $v[0] && $m > $v[1]) {
        return array_merge($v, array("w" => $v[0], "h" => $v[1]));
    }

    if ($ratio != 'false') {
        $xy = explode(':', $ratio);
        return array_merge($v, array("w" => $m, "h" => ceil($m * intval(trim($xy[1])) / intval(trim($xy[0])))));
    } elseif ($v[0] > $v[1]) {
        $t = $v[0] / $m;
        $s = floor($v[1] / $t);
        $m = ($m > 0) ? $m : 1;
        $s = ($s > 0) ? $s : 1;
        return array_merge($v, array("w" => $m, "h" => $s));
    } else {
        $t = $v[1] / intval($m);
        $s = floor($v[0] / $t);
        $m = ($m > 0) ? $m : 1;
        $s = ($s > 0) ? $s : 1;
        return array_merge($v, array("w" => $s, "h" => $m));
    }
}

/**
 * snake_case를 camelCase로 변환한다.
 */
function snakeCaseToCamelCase($str)
{
    $str = str_replace('_', ' ', $str);
    $str = ucwords($str);
    $str = str_replace(' ', '', $str);

    return $str;
}

/** 
 * snake_case를 PascalCase로 변환한다.
 */
function snakeCaseToPascalCase($str)
{
    $str = str_replace('_', ' ', $str);
    $str = ucwords($str);
    $str = str_replace(' ', '', $str);

    return $str;
}

/** 
 * 쿼리와 바인딩된 변수들을 결합하여 전체 쿼리문을 출력하는 함수
 */
function get_bound_query($query, $params)
{
    foreach ($params as &$value) {
        // Ensure proper escaping of the value
        $value = is_numeric($value) ? $value : "'" . mysqli_real_escape_string($GLOBALS['conn'], $value) . "'";
        // echo $value;
    }
    // Split the query by "?" and then interleave the parameters
    $parts = explode('?', $query);
    $query = array_shift($parts);
    foreach ($parts as $part) {
        $query .= array_shift($params) . $part;
    }
    return $query;
}

/** 
 * hash 값으로 user_no 가져오는 함수
 */
function get_user_no_for_hash($conn, $rcvUserHash)
{
    ##################### 1. user_no 가져오기 #####################
    $user_sql =
        "SELECT user_no
        FROM user_master
        WHERE SHA2(user_no, 256) = ?;";

    // 바인딩할 변수들
    // $params = array($rcvUserHash);
    // 실제 실행될 쿼리문
    // $bound_query = get_bound_query($user_sql, $params);
    // 로그 출력 (이 부분은 실제 코드에서는 로그 파일에 기록하거나 디버깅 콘솔에 출력)
    // error_log($bound_query);

    // 1-1. SQL 문장을 준비합니다.
    $user_stmt = mysqli_prepare($conn, $user_sql);

    // 1-2. 변수 바인딩
    mysqli_stmt_bind_param($user_stmt, "s", $rcvUserHash);

    // 1-3. SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($user_stmt)) {
        throw new Exception('SELECT_FAILED', 500);
    }

    // 1-4. 결과를 가져옵니다.
    $user_result = mysqli_stmt_get_result($user_stmt);

    // 1-5. 결과를 배열로 변환합니다.
    $response_data = mysqli_fetch_assoc($user_result);
    if (!$response_data) {
        // throw new Exception('USER_NOT_FOUND', 500);
    }

    // 1-6. user no 변수처리
    $user_no = $response_data['user_no'];

    return $user_no;
}


/** 
 * hash 값으로 관리자 user_no 가져오는 함수
 */
function get_admin_no_for_hash($conn, $rcvUserHash)
{
    ##################### 1. user_no 가져오기 #####################
    $user_sql =
        "SELECT user_no
        FROM user_admin
        WHERE SHA2(user_no, 256) = ?;";

    // 바인딩할 변수들
    // $params = array($rcvUserHash);
    // 실제 실행될 쿼리문
    // $bound_query = get_bound_query($user_sql, $params);
    // 로그 출력 (이 부분은 실제 코드에서는 로그 파일에 기록하거나 디버깅 콘솔에 출력)
    // error_log($bound_query);

    // 1-1. SQL 문장을 준비합니다.
    $user_stmt = mysqli_prepare($conn, $user_sql);

    // 1-2. 변수 바인딩
    mysqli_stmt_bind_param($user_stmt, "s", $rcvUserHash);

    // 1-3. SQL 문장을 실행합니다.
    if (!mysqli_stmt_execute($user_stmt)) {
        throw new Exception('SELECT_FAILED', 500);
    }

    // 1-4. 결과를 가져옵니다.
    $user_result = mysqli_stmt_get_result($user_stmt);

    // 1-5. 결과를 배열로 변환합니다.
    $response_data = mysqli_fetch_assoc($user_result);
    if (!$response_data) {
        // throw new Exception('USER_NOT_FOUND', 500);
    }

    // 1-6. user no 변수처리
    $user_no = $response_data['user_no'];

    return $user_no;
}

/**
 * 파일(폴더) 삭제 함수
 * @param {*} $dir = 파일(폴더)명
 */
function removeDirectory($dir)
{
    // 1. 주어진 디렉토리가 존재하지 않으면 바로 true를 반환
    if (!file_exists($dir)) {
        return true;
    }

    // 2. 주어진 경로가 파일이라면 해당 파일을 삭제하고 true를 반환
    if (!is_dir($dir)) {
        return unlink($dir);
    }

    // 3. 디렉토리인 경우, 해당 디렉토리 안에 있는 모든 항목을 검사하고 각 항목을 재귀적으로 삭제
    foreach (scandir($dir) as $item) {
        // 만약 항목이 현재 디렉토리나 상위 디렉토리인 경우(. 또는 ..)에는 무시
        if ($item == '.' || $item == '..') {
            continue;
        }

        // removeDirectory() 함수를 호출하여 해당 디렉토리와 그 안의 내용물을 모두 삭제
        // 만약 삭제 작업이 실패한 경우에는 상위 호출자에게 false를 반환
        if (!removeDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
            return false;
        }
    }

    // 4. 마지막으로 해당 디렉토리를 삭제하고 결과를 반환
    return rmdir($dir);
}


/**
 * 이 함수는 주어진 파일을 지정된 유저 ID와 폴더 이름에 따라 서버의 특정 디렉토리에 업로드합니다.
 * 업로드된 파일의 경로와 상태를 반환합니다.
 *
 * @param array $file 업로드된 파일 ($_FILES['file'] 형태)
 * @param string $filePath 저장할 경로
 * @return array 업로드 결과를 나타내는 배열 (성공 또는 실패 메시지와 파일 경로)
 */
function upload_file_one($file, $filePath)
{
    $result_array = array();
    // 사이즈 체크
    if ($file['size'] <= 0) {
        $result_array['result'] = 'error';
        $result_array['message'] = 'File size is zero or negative';
        exit;
    }

    $saveFileName = $file["name"];	// 날짜를 덧붙여서 파일 이름을 만듬
    $uploadPath = "/home/project/tody/upload/";
    $uploadDir = $uploadPath . $filePath;

    // 업로드 폴더 경로 확인
    if (!file_exists($uploadPath)) {
        $result_array['result'] = 'error';
        $result_array['message'] = 'Upload path does not exist';
        exit;
    }

    // 폴더가 없으면 생성
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            $result_array['result'] = 'error';
            $result_array['message'] = 'Failed to create user directory';
            exit;
        }
    }

    $uploadFileName = basename($file['name']);
    $uploadFile = $uploadDir . $uploadFileName;

    // 업로드 파일을 저장 경로로 옮김.
    // iconv(기존셋, 바꿀셋, 바꿀 문자열) : 문자셋을 바꾸어 준다.(호스트에 따라 한글이 안될수 있음)
    // if (move_uploaded_file($file['tmp_name'], $uploadDir . iconv("UTF-8", "EUC-KR", $uploadFileName))) {
    if (move_uploaded_file($file['tmp_name'], $uploadFile)) {
        // 파일 권한 설정
        // chmod($uploadFile, 0777);

        $result_array['result'] = 'success';
        // $result_array['file_path'] = "/uploads/" . $filePath;
        $result_array['file_path'] = $uploadFile;
        return $result_array;
    } else {
        $result_array['result'] = 'error';
        $result_array['message'] = 'Failed to move uploaded file';
        exit;
    }
}

function upload_file_one_new($file_data, $target_path_prefix)
{
    // UPLOAD_BASE_DIR_ABSOLUTE, UPLOAD_WEB_ROOT_URL 상수는 함수 외부 또는 common.php에 정의되어야 합니다.
    // 여기서는 설명을 위해 다시 포함합니다.
    define('UPLOAD_BASE_DIR_ABSOLUTE', "/home/project/tody/upload/"); 
    define('UPLOAD_WEB_ROOT_URL', "/uploads/");

    $result_array = array();

    // 1. 사이즈 체크
    if ($file_data['size'] <= 0) {
        $result_array['result'] = 'error';
        $result_array['message'] = 'File size is zero or negative';
        return $result_array;
    }
    
    // 2. 업로드 타겟 디렉토리 설정
    $upload_target_dir_absolute = UPLOAD_BASE_DIR_ABSOLUTE . $target_path_prefix;
    
    // 3. 업로드 디렉토리 존재 여부 확인 및 생성
    if (!file_exists($upload_target_dir_absolute)) {
        if (!mkdir($upload_target_dir_absolute, 0777, true)) {
            $result_array['result'] = 'error';
            $result_array['message'] = 'Failed to create user directory: ' . $upload_target_dir_absolute;
            return $result_array;
        }
    }

    // ⭐⭐⭐ 이 부분을 수정합니다: 고유 파일명 대신 원본 파일명 사용 ⭐⭐⭐
    // $file_extension = pathinfo($file_data['name'], PATHINFO_EXTENSION); // 필요하면 확장자는 추출
    // $unique_filename = uniqid('ad_', true) . '.' . $file_extension; // <- 이 줄을 주석 처리하거나 삭제
    $target_filename = basename($file_data['name']); // ✅ 사용자 업로드 원본 파일명 그대로 사용
    $target_file_absolute_path = $upload_target_dir_absolute . $target_filename; // $unique_filename 대신 $target_filename 사용

    // 5. 파일 이동
    if (move_uploaded_file($file_data['tmp_name'], $target_file_absolute_path)) {
        $result_array['result'] = 'success';
        
        // ⭐⭐⭐ 여기서 반환하는 파일 경로에도 $target_filename 사용 ⭐⭐⭐
        // $result_array['file_path'] = "/uploads/" . $filePath;
        //$result_array['file_path'] = UPLOAD_WEB_ROOT_URL . $target_path_prefix . $target_filename; 
        $result_array['file_path'] = $target_path_prefix . $target_filename; 
        
        return $result_array;
    } else {
        $php_upload_error_code = $file_data['error'];
        $error_message = "Failed to move uploaded file. PHP Error Code: " . $php_upload_error_code;
        $error_message .= " (Source: {$file_data['tmp_name']}, Target: {$target_file_absolute_path})";
        error_log($error_message);

        $result_array['result'] = 'error';
        $result_array['message'] = 'Failed to move uploaded file';
        return $result_array;
    }
}

function upload_file_temp($file, $uploadFolder)
{
    // 10MB를 바이트 단위로 정의
    $maxFileSize = 10 * 1024 * 1024; // 10MB = 10 * 1024 * 1024 bytes

    // 사이즈 체크
    if ($file['size'][0] <= 0 || $file['size'][0] >= $maxFileSize) {
        $result_array['result']['message'] = 'size error';
        return $result_array;
        // exit(json_encode($result_array));
    }

    $date_filedir = date("YmdHis");	// 현재시간 추출
    $ext = substr(strrchr($file["name"][0], "."), 1);	// 확장자 추출
    $ext = strtolower($ext);	// 확장자 소문자로 바꿈

    $ranStr = genRandom();	// 랜덤 문자열
    $ranStr = $ranStr . '.' . $ext;

    $saveFileName = $date_filedir . "_" . str_replace(" ", "_", $ranStr);	// 날짜를 덧붙여서 파일 이름을 만듬

    // 업로드 폴더가 없거나 문자열 "null"이거나 실제 null일 때(첫 등록)
    if (empty($uploadFolder) || $uploadFolder === "null" || is_null($uploadFolder)) {
        $uploadFolder = $date_filedir . "_" . genRandom();	//날짜를 덧붙여서 폴더명 만듬
    }

    // $uploadpath = $_SERVER['DOCUMENT_ROOT'] . "/uploads/"; //이미지 저장된 경로 + 폴더

    // 임시 폴더 경로 확인
    $uploadPath = "/home/project/tody/temp";
    if (!file_exists($uploadPath)) {
        $result_array['error']['message'] = 'path error';
        return $result_array;
        // exit(json_encode($result_array));
    }

    // 업로드 폴더 경로 확인
    $uploadPath = "/home/project/tody/temp/" . $uploadFolder;
    if (!file_exists($uploadPath)) {
        mkdir($uploadPath, 0775, true); // 폴더 없으면 디렉토리 생성 (파일 퍼미션은 0777로 설정)
    }

    // 확장자 체크
    if ($ext !== 'jpg' && $ext !== "png" && $ext !== "jpeg") {
        $result_array['error']['message'] = 'ext error';
        return $result_array;
        // exit(json_encode($result_array));
    }

    // 저장경로 임시폴더로 이동
    if (move_uploaded_file($file['tmp_name'][0], $uploadPath . "/" . iconv("UTF-8", "EUC-KR", $saveFileName))) {
        //move_uploaded_file($_FILES['upload']['tmp_name'], 저장 경로 + 파일명) : 업로드 파일을 저장 경로로 옮김.
        //iconv(기존셋, 바꿀셋, 바꿀 문자열) : 문자셋을 바꾸어 준다.(호스트에 따라 한글이 안될수 있음)
        $uploadFile = $saveFileName;

        // 파일 권한 설정
        // chmod($uploadPath . "/" . $saveFileName, 0777);

        // $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
        // $uploadSrc = $_SERVER['HTTP_HOST'] . "/temp/" . $uploadFolder . "/";
        // $result_array['url'] = $protocol . $uploadSrc . $saveFileName;

        $result_array['result'] = 'success';
        $result_array['uploadFolder'] = $uploadFolder;	// 결과값에 폴더명 저장
        $result_array['url'] = "/temp/" . $uploadFolder . "/" . $saveFileName;
        return $result_array;
        // exit(json_encode($result_array));
    } else {
        $result_array['result'] = 'move error';
        return $result_array;
        // exit(json_encode($result_array));
    }
}

/**
 * 게시글 생성할 때, temp -> upload 이미지 폴더 옮기는 함수
 * @param {*} upload_folder = 업로드 폴더명
 * @param {*} content = 내용(한글)
 * @param {*} content_en = 내용(영어)
 */
function tempToUploadForCreate($upload_folder, $content, $type)
{
    // 이미지 폴더 없으면 종료
    if (!$upload_folder) {
        return "success";
    }

    $tempPath = "/home/project/tody/temp/";	// 임시폴더 경로
    $uploadPath = "/home/project/tody/upload/";	// 업로드폴더 경로
    $tempFolder = $tempPath . $upload_folder;	// 임시폴더 경로 + 폴더명
    $uploadFolder = $uploadPath . "/" . $type . "/" . $upload_folder;	// 엄로드폴더 경로 + 폴더명
    $imageFileNames = array();	// 이미지 파일명을 담을 배열 초기화

    // $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    // $uploadSrc = $protocol . $_SERVER['HTTP_HOST'] . "/temp/";

    if (!empty($content)) {
        // 역슬래시 제거
        $content = stripslashes($content);
        // figure 태그를 div 태그로 변경하는 정규 표현식
        $content = preg_replace("/<figure[^>]*?>(.*?)<\/figure>/is", "<div>$1</div>", $content);

        // 이미지 태그에서 src 속성 추출
        $doc = new DOMDocument();
        $doc->loadHTML($content);
        $imgs = $doc->getElementsByTagName('img');

        // 이미지 배열에 담기
        foreach ($imgs as $img) {
            $src = $img->getAttribute('src');	// src 속성값 가져오기
            $src = stripslashes($src);	// 백슬래시 제거
            $src = trim($src, '"'); // 쌍따옴표 제거

            // temp로 시작한다면 0 반환
            if (strpos($src, "/temp/") === 0) {
                // $pathSegments = explode('/', $src);
                // $imageFileNames[] = end($pathSegments);

                // 이름 부분만 추출
                $imageFileNames[] = basename(parse_url($src, PHP_URL_PATH));
            }
        }
    }

    // print_r($imageFileNames);exit;

    // 새로운 이미지가 있으면 일치하지 않는 파일 제거
    if (count($imageFileNames) > 0) {
        // 특정 폴더 경로
        $folderPath = $tempPath . $upload_folder;

        // 특정 폴더에서 모든 파일 목록 가져오기
        $files = scandir($folderPath);

        // 이미지 파일명 배열과 비교하여 일치하지 않는 파일 제거
        foreach ($files as $file) {
            // 현재 파일이 . 또는 ..이거나 디렉토리인 경우 건너뜀
            if ($file === '.' || $file === '..' || is_dir($folderPath . '/' . $file)) {
                continue;
            }

            // 현재 파일이 imageFileNames 배열에 없으면 파일 삭제
            if (!in_array($file, $imageFileNames)) {
                unlink($folderPath . '/' . $file);
            }
        }
    } else {
        // 새로운 이미지가 없다면, temp 폴더 제거 
        removeDirectory($tempFolder);
    }
    ###########################################################################################################


    ##################### 파일 이동 Start ###############################################################
    // 원본 폴더 없으면 종류
    if (!is_dir($tempFolder)) {
        return "path error";
    }

    // 업로드 폴더 경로 확인
    if (!file_exists($uploadFolder)) {
        mkdir($uploadFolder, 0775, true); // 폴더 없으면 디렉토리 생성 (파일 퍼미션은 0777로 설정)
    }

    // 파일을 목적지 폴더로 이동
    if (rename($tempFolder, $uploadFolder)) {
        return "success";
    } else {
        return "move error";
    }
    ################## 파일 이동 End #####################################################################
}

/**
 * 게시글 수정할 때, temp -> upload 이미지 폴더 옮기는 함수
 * @param {*} upload_folder = 업로드 폴더명
 * @param {*} content = 내용(한글)
 * @param {*} content_en = 내용(영어)
 */
function tempToUploadForModify($upload_folder, $content, $type)
{
    // 이미지 폴더 없으면 종료
    if (!$upload_folder) {
        return 'success';
    }

    $tempPath = "/home/project/tody/temp/";	// 임시폴더 경로
    $uploadPath = "/home/project/tody/upload/";	// 업로드폴더 경로
    $tempFolder = $tempPath . $upload_folder;	// 임시폴더 경로 + 폴더명
    $uploadFolder = $uploadPath . $type . "/" . $upload_folder;	// 엄로드폴더 경로 + 폴더명

    // $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    // $uploadSrc = $protocol . $_SERVER['HTTP_HOST'] . "/temp/";

    // 이미지 파일명을 담을 배열 초기화
    $newImageFileNames = array();
    $oldImageFileNames = array();

    if (!empty($content)) {
        // 역슬래시 제거
        $content = stripslashes($content);
        // figure 태그를 div 태그로 변경하는 정규 표현식
        $content = preg_replace("/<figure[^>]*?>(.*?)<\/figure>/is", "<div>$1</div>", $content);

        // 이미지 태그에서 src 속성 추출
        $doc = new DOMDocument();
        $doc->loadHTML($content);
        $imgs = $doc->getElementsByTagName('img');

        // 신규 이미지 배열에 담기
        foreach ($imgs as $img) {
            $src = $img->getAttribute('src');	// src 속성값 가져오기
            $src = stripslashes($src);	// 백슬래시 제거
            $src = trim($src, '"'); // 쌍따옴표 제거

            // temp로 시작한다면 0 반환
            if (strpos($src, '/temp/') === 0) {
                // $pathSegments = explode('/', $src);
                // $newImageFileNames[] = end($pathSegments);

                // 이름 부분만 추출(새 파일 array)
                $newImageFileNames[] = basename(parse_url($src, PHP_URL_PATH));
            } else if (strpos($src, '/uploads/' . $type . '/') === 0) {
                // 이름 부분만 추출(기존 파일 array)
                $oldImageFileNames[] = basename(parse_url($src, PHP_URL_PATH));
            }
        }
    }

    // 새로운 이미지가 있으면 일치하지 않는 파일 제거
    if (count($newImageFileNames) > 0) {
        // 특정 폴더 경로
        // $folderPath = $tempPath . $upload_folder;

        // 특정 폴더에서 모든 파일 목록 가져오기
        $files = scandir($tempFolder);

        // 이미지 파일명 배열과 비교하여 일치하지 않는 파일 제거
        foreach ($files as $file) {
            // 현재 파일이 . 또는 ..이거나 디렉토리인 경우 건너뜀
            if ($file === '.' || $file === '..' || is_dir($tempFolder . '/' . $file)) {
                continue;
            }

            // 현재 파일이 newImageFileNames 배열에 없으면 파일 삭제
            if (!in_array($file, $newImageFileNames)) {
                unlink($tempFolder . '/' . $file);
            }
        }
    } else {
        // 새로운 이미지가 없다면, temp 폴더 제거 
        removeDirectory($tempFolder);
    }

    // 기존 이미지가 있으면 일치하지 않는 파일 제거
    if (count($oldImageFileNames) > 0) {
        // 특정 폴더 경로
        // $folderPath = $uploadPath . $upload_folder;

        // 특정 폴더에서 모든 파일 목록 가져오기
        $files = scandir($uploadFolder);

        // 이미지 파일명 배열과 비교하여 일치하지 않는 파일 제거
        foreach ($files as $file) {
            // 현재 파일이 . 또는 ..이거나 디렉토리인 경우 건너뜀
            if ($file === '.' || $file === '..' || is_dir($uploadFolder . '/' . $file)) {
                continue;
            }

            // 현재 파일이 oldImageFileNames 배열에 없으면 파일 삭제
            if (!in_array($file, $oldImageFileNames)) {
                // echo $folderPath . '/' . $file;
                unlink($uploadFolder . '/' . $file);
            }
        }
    } else {
        // 기존 이미지가 없다면, upload 폴더 제거 
        removeDirectory($uploadFolder);
    }

    ###########################################################################################################


    ##################### 파일 이동 Start ###############################################################
    // 원본 폴더 없으면 종료
    if (!is_dir($tempFolder)) {
        return "path error";
    }
    if (!file_exists($uploadFolder)) {
    }
    // 만약 목적지 폴더가 이미 존재한다면
    if (file_exists($uploadFolder) && is_dir($uploadFolder)) {
        // 내부 파일을 이동하기 위해 폴더 내 파일 목록을 가져옴
        $files = glob($tempFolder . '/*');

        // 각 파일을 목적지 폴더로 이동
        foreach ($files as $file) {
            // 파일을 이동할 때는 파일 이름만 추출하여 목적지 폴더에 복사
            $new_file = $uploadFolder . '/' . basename($file);
            rename($file, $new_file);
        }

        // 이동이 끝나면 원래 폴더를 삭제
        removeDirectory($tempFolder);

        return "success";

    } else {
        mkdir($uploadFolder, 0775, true); // 폴더 없으면 디렉토리 생성 (파일 퍼미션은 0777로 설정)
        // 파일을 목적지 폴더로 이동
        if (rename($tempFolder, $uploadFolder)) {
            return "success";
        } else {
            return "move error";
        }
    }
    ################## 파일 이동 End #####################################################################
}

/**
 * 숫자 또는 문자열을 받아서, 3자리마다 콤마를 찍어서 반환하는 함수
 * @param string|number $str
 * @return string 3자리마다 콤마가 찍힌 문자열
 */
function comma($str)
{
    // 숫자 문자열로 변환
    $str = (string) $str;
    if (empty($str) || $str == "null")
        return "";

    // 소수점 분리
    $parts = explode(".", $str);
    $wholeNumber = $parts[0];
    $decimal = isset($parts[1]) ? $parts[1] : "";

    // 콤마 추가
    $formattedWholeNumber = number_format($wholeNumber);

    // 소수점 있으면 붙이기
    return $decimal ? $formattedWholeNumber . "." . $decimal : $formattedWholeNumber;
}

/**
 * 콤마 처리 되어 있는 문자열을 받아서, 콤마를 해제하여 반환하는 함수
 * @param string|number $str
 * @return string 콤마가 해제된 문자열
 */
function uncomma($str)
{
    // 숫자 문자열로 변환
    $str = (string) $str;
    return preg_replace('/[^\d.]+/', '', $str);
}


/**
 * 주어진 매개변수를 사용하여 준비된 SQL 문을 실행합니다.
 *
 * 이 함수는 SQL 문을 준비하고, 주어진 매개변수를 바인딩하며,
 * 문을 실행한 후, 문 객체를 반환합니다. 준비, 바인딩 또는 실행 중에 오류가 발생하면
 * 적절한 오류 메시지와 상태 코드와 함께 예외를 던집니다.
 *
 * @param mysqli $conn MySQLi 연결 객체
 * @param string $sql 실행할 SQL 문
 * @param string $types 바인딩할 매개변수의 유형
 * @param array $params SQL 문에 바인딩할 매개변수 배열
 * @return mysqli_stmt 실행된 문 객체
 * @throws Exception 준비, 바인딩 또는 실행 중 오류가 발생한 경우
 */
function executeQuery($conn, $sql, $types = '', $params = [])
{
    // SQL 문을 준비합니다.
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('QUERY_PREPARATION_FAILED', 500);
    }

    // 매개변수를 바인딩합니다. 매개변수가 있을 때만 바인딩을 수행합니다.
    if (!empty($types) && !empty($params)) {
        // null 값이 있는 경우, 이를 처리하기 위해 레퍼런스를 사용
        $bindParams = [];
        foreach ($params as $key => $value) {
            $bindParams[$key] = ($value === null) ? null : $value;
        }

        // 바인딩을 위해 레퍼런스를 전달
        mysqli_stmt_bind_param($stmt, $types, ...$bindParams);
    }
    
    // SQL 문을 실행합니다.
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('EXECUTION_FAILED', 500);
    }

    // 실행된 문 객체를 반환합니다.
    return $stmt;
}

/**
 * PDO를 사용하여 SQL 문을 실행합니다.
 *
 * @param PDO $pdo PDO 객체
 * @param string $sql 실행할 SQL 문
 * @param array $params 바인딩할 매개변수 배열
 * @return PDOStatement 실행된 문 객체
 * @throws Exception 실행 중 오류가 발생한 경우
 */
function executeQueryPDO(PDO $pdo, string $sql, array $params = []): PDOStatement
{
    try {
        // SQL 준비
        $stmt = $pdo->prepare($sql);
        
        // 매개변수 바인딩 및 실행
        $stmt->execute($params);

        return $stmt;
    } catch (PDOException $e) {
        throw new Exception("QUERY_EXECUTION_FAILED: " . $e->getMessage(), 500);
    }
}