<?php
/**
 * 입력값의 유효성을 검사하고 필터링합니다.
 *
 * @param mixed $input 입력값
 * @param string $type 유효성 타입 (email, ip, url, int, length, float, string, number, specialChars, trim, json, ipv4, ipv6, password, phone, postal_code, file)
 * @param array $options 옵션 (값 범위 설정 등)
 * @param string $errorMessage 유효성 검사 실패 시 출력할 에러 메시지
 * @return mixed 유효성 검사 및 필터링된 값 또는 지정된 에러 메시지
 */
function validateInput($input, $type, $errorMessage, $options = array())
{
    $filtered = ''; // 기본 값

    // 빈 값 체크
    if ($input === '' || $input === null) {
        return $errorMessage; // 빈 값이면 에러 메시지 반환
    }

    switch ($type) {
        case 'id':
            // 문자 또는 숫자로 이루어진 8~12자리
            if (!preg_match('/^[A-Za-z\d]{4,15}$/', $input)) {
                return $errorMessage;
            }
            $filtered = $input;
            break;
        case 'email':
            $filtered = filter_var($input, FILTER_VALIDATE_EMAIL);
            break;
        case 'ip':
            $filtered = filter_var($input, FILTER_VALIDATE_IP);
            break;
        case 'url':
            $filtered = filter_var($input, FILTER_VALIDATE_URL);
            break;
        case 'int':
            // 입력값이 숫자인지 먼저 확인 후 변환
            if (!is_numeric($input)) {
                return $errorMessage;
            }
            $input = intval($input);  // 입력값을 강제로 정수로 변환
            $filtered = filter_var($input, FILTER_VALIDATE_INT);
            break;
        case 'length':
            $filtered = filter_var(strlen($input), FILTER_VALIDATE_INT);
            break;
        case 'float':
            $filtered = filter_var($input, FILTER_VALIDATE_FLOAT);
            break;
        case 'string':
            $filtered = filter_var($input, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
            break;
        case 'number':
            $filtered = filter_var($input, FILTER_SANITIZE_NUMBER_INT);
            break;
        case 'specialChars':
            $filtered = filter_var($input, FILTER_SANITIZE_SPECIAL_CHARS);
            break;
        case 'trim':
            $filtered = trim($input);
            break;
        case 'json':
            $filtered = json_decode($input);
            break;
        case 'ipv4':
            $filtered = filter_var($input, FILTER_SANITIZE_STRING, FILTER_FLAG_IPV4);
            break;
        case 'ipv6':
            $filtered = filter_var($input, FILTER_SANITIZE_STRING, FILTER_FLAG_IPV6);
            break;
        case 'password':
            // 최소 8자 이상, 영문 대소문자, 숫자, 특수문자 포함
            // if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}$/', $input)) {
            //     return $errorMessage;
            // }

            // 문자와 숫자를 포함하여 8~12자리
            // if (!preg_match('/^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{8,12}$/', $input)) {
            //     return $errorMessage;
            // }

            // 문자 또는 숫자로 이루어진 8~12자리
            // if (!preg_match('/^[A-Za-z\d]{8,12}$/', $input)) {
            //     return $errorMessage;
            // }
            
            // 영문자와 숫자가 모두 포함된 8~12자리
            if (!preg_match('/[A-Za-z]/', $input) || !preg_match('/\d/', $input) || !preg_match('/^[A-Za-z\d]{8,12}$/', $input)) {
                return $errorMessage;
            }
            $filtered = $input;
            break;
        case 'phone':
            // 전화번호는 9~11자리 숫자로만 구성되어야 합니다.
            if (!preg_match('/^\d{9,11}$/', $input)) {
                return $errorMessage;
            }
            $filtered = $input;
            break;
        case 'postal_code':
            // 한국의 우편번호는 5자리 숫자로 구성되어야 합니다.
            if (!preg_match('/^\d{5}$/', $input)) {
                return $errorMessage;
            }
            $filtered = $input;
            break;
        case 'file':
            if (!is_array($input) || !isset($input['error']) || $input['error'] !== UPLOAD_ERR_OK) {
                return $errorMessage; // 파일 업로드 오류 또는 유효하지 않은 $input 형식
            }
            // 파일 타입 확인 및 확장자 검사
            if (!isset($options['type'])) {
                return $errorMessage;
            }

            $allowedExtensions = array();
            $allowedMimeTypes = array();
            switch ($options['type']) {
                case 'image':
                    $allowedExtensions = array('jpg', 'jpeg', 'png', 'gif');
                    $allowedMimeTypes = array('image/jpeg', 'image/png', 'image/gif');
                    break;
                case 'video':
                    $allowedExtensions = array('mp4', 'avi', 'mov', 'mpeg', 'wav');
                    $allowedMimeTypes = array('video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/mpeg', 'video/x-wav');
                    break;
                case 'doc':
                    $allowedExtensions = array('pdf', 'doc', 'docx', 'xls', 'xlsx');
                    $allowedMimeTypes = array('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    break;
                case 'archive':
                    $allowedExtensions = array('zip', 'rar', 'tar', 'gz', '7z');
                    $allowedMimeTypes = array('application/zip', 'application/x-rar-compressed', 'application/x-tar', 'application/gzip', 'application/x-7z-compressed');
                    break;
                case 'imagePdf':
                    $allowedExtensions = array('jpg', 'jpeg', 'png', 'pdf');
                    $allowedMimeTypes = array('image/jpeg', 'image/png', 'application/pdf');
                case 'all':
                    $allowedExtensions = array(
                        'jpg', // 이미지
                        'jpeg',
                        'png',
                        'gif',
                        'mp4', // 비디오
                        'avi',
                        'mov',
                        'pdf', // 문서
                        'doc',
                        'docx',
                        'xls',
                        'xlsx',
                        'zip', // 압축 파일
                        'rar',
                        'tar',
                        'gz',
                        '7z'
                    );
                    $allowedMimeTypes = array(
                        'image/jpeg', // 이미지
                        'image/png',
                        'image/gif',
                        'video/mp4', // 비디오
                        'video/x-msvideo',
                        'video/quicktime',
                        'application/pdf', // 문서
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/zip', // 압축 파일
                        'application/x-rar-compressed',
                        'application/x-tar',
                        'application/gzip',
                        'application/x-7z-compressed'
                    );
                    break;
                default:
                    return $errorMessage;
            }

            // 파일 확장자 확인
            $fileExtension = pathinfo($input['name'], PATHINFO_EXTENSION);
            if (!in_array(strtolower($fileExtension), $allowedExtensions)) {
                return $errorMessage;
            }

            // MIME 타입 확인
            $fileMimeType = mime_content_type($input['tmp_name']);
            if (!in_array($fileMimeType, $allowedMimeTypes)) {
                return $errorMessage;
            }

            // 파일 사이즈 확인
            $fileSize = $input['size'];
            $minSize = isset($options['minSize']) ? $options['minSize'] : 1000; // 기본값 1KB
            $maxSize = isset($options['maxSize']) ? $options['maxSize'] : 10000000; // 기본값 10MB
            if ($fileSize < $minSize || $fileSize > $maxSize) {
                return $errorMessage;
                // return "파일 사이즈는 1KB 이상 10MB 이하만 가능합니다.";
            }

            $filtered = $input;
            break;
        default:
            // 기본적으로는 입력값 그대로 반환
            $filtered = $input;
    }

    // 값 범위 검사

    // 값 범위 검사 (min/max)
    if (isset($options['min']) || isset($options['max'])) {
        if ($type === 'int' || $type === 'length') {
            if (isset($options['min']) && $filtered < $options['min']) {
                return $errorMessage;
            }
            if (isset($options['max']) && $filtered > $options['max']) {
                return $errorMessage;
            }
        } elseif ($type === 'string') {
            $length = mb_strlen($input, 'UTF-8');
            if (isset($options['min']) && $length < $options['min']) {
                return $errorMessage;
            }
            if (isset($options['max']) && $length > $options['max']) {
                return $errorMessage;
            }
        }
    }

    // 유효성 검사 결과 반환
    $result = $filtered !== false ? $filtered : $errorMessage;
    return $result; // 필터링된 값 또는 에러 메시지와 true 반환
}
function validateInput2($input, $type, $errorMessage, $options = array())
{
    $filtered = ''; // 기본 값

    // 빈 값 체크
    if ($input === '' || $input === null) {
        return $errorMessage; // 빈 값이면 에러 메시지 반환
    }

    switch ($type) {
        case 'id':
            // 문자 또는 숫자로 이루어진 8~12자리
            if (!preg_match('/^[A-Za-z\d]{4,15}$/', $input)) {
                return $errorMessage;
            }
            $filtered = $input;
            break;
        case 'email':
            $filtered = filter_var($input, FILTER_VALIDATE_EMAIL);
            break;
        case 'ip':
            $filtered = filter_var($input, FILTER_VALIDATE_IP);
            break;
        case 'url':
            $filtered = filter_var($input, FILTER_VALIDATE_URL);
            break;
        case 'int':
            // 입력값이 숫자인지 먼저 확인 후 변환
            if (!is_numeric($input)) {
                return $errorMessage;
            }
            $input = intval($input);  // 입력값을 강제로 정수로 변환
            $filtered = filter_var($input, FILTER_VALIDATE_INT);
            break;
        case 'length':
            $filtered = filter_var(strlen($input), FILTER_VALIDATE_INT);
            break;
        case 'float':
            $filtered = filter_var($input, FILTER_VALIDATE_FLOAT);
            break;
        case 'string':
            $filtered = filter_var($input, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
            break;
        case 'number':
            $filtered = filter_var($input, FILTER_SANITIZE_NUMBER_INT);
            break;
        case 'specialChars':
            $filtered = filter_var($input, FILTER_SANITIZE_SPECIAL_CHARS);
            break;
        case 'trim':
            $filtered = trim($input);
            break;
        case 'json':
            $filtered = json_decode($input);
            break;
        case 'ipv4':
            $filtered = filter_var($input, FILTER_SANITIZE_STRING, FILTER_FLAG_IPV4);
            break;
        case 'ipv6':
            $filtered = filter_var($input, FILTER_SANITIZE_STRING, FILTER_FLAG_IPV6);
            break;
        case 'password':
            // 최소 8자 이상, 영문 대소문자, 숫자, 특수문자 포함
            // if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}$/', $input)) {
            //     return $errorMessage;
            // }

            // 문자와 숫자를 포함하여 8~12자리
            // if (!preg_match('/^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{8,12}$/', $input)) {
            //     return $errorMessage;
            // }

            // 문자 또는 숫자로 이루어진 8~12자리
            // if (!preg_match('/^[A-Za-z\d]{8,12}$/', $input)) {
            //     return $errorMessage;
            // }
            
            // 영문자와 숫자가 모두 포함된 8~12자리
            if (!preg_match('/[A-Za-z]/', $input) || !preg_match('/\d/', $input) || !preg_match('/^[A-Za-z\d]{8,12}$/', $input)) {
                return $errorMessage;
            }
            $filtered = $input;
            break;
        case 'phone':
            // 전화번호는 9~11자리 숫자로만 구성되어야 합니다.
            if (!preg_match('/^\d{9,11}$/', $input)) {
                return $errorMessage;
            }
            $filtered = $input;
            break;
        case 'postal_code':
            // 한국의 우편번호는 5자리 숫자로 구성되어야 합니다.
            if (!preg_match('/^\d{5}$/', $input)) {
                return $errorMessage;
            }
            $filtered = $input;
            break;
        case 'file':
            
            // 파일 타입 확인 및 확장자 검사
            if (!isset($options['type'])) {
                return $errorMessage;
            }

            $allowedExtensions = array();
            $allowedMimeTypes = array();
            switch ($options['type']) {
                case 'image':
                    $allowedExtensions = array('jpg', 'jpeg', 'png', 'gif');
                    $allowedMimeTypes = array('image/jpeg', 'image/png', 'image/gif');
                    break;
                case 'video':
                    $allowedExtensions = array('mp4', 'avi', 'mov', 'mpeg', 'wav');
                    $allowedMimeTypes = array('video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/mpeg', 'video/x-wav');
                    break;
                case 'doc':
                    $allowedExtensions = array('pdf', 'doc', 'docx', 'xls', 'xlsx');
                    $allowedMimeTypes = array('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    break;
                case 'archive':
                    $allowedExtensions = array('zip', 'rar', 'tar', 'gz', '7z');
                    $allowedMimeTypes = array('application/zip', 'application/x-rar-compressed', 'application/x-tar', 'application/gzip', 'application/x-7z-compressed');
                    break;
                case 'imagePdf':
                    $allowedExtensions = array('jpg', 'jpeg', 'png', 'pdf');
                    $allowedMimeTypes = array('image/jpeg', 'image/png', 'application/pdf');
                case 'all':
                    $allowedExtensions = array(
                        'jpg', // 이미지
                        'jpeg',
                        'png',
                        'gif',
                        'mp4', // 비디오
                        'avi',
                        'mov',
                        'pdf', // 문서
                        'doc',
                        'docx',
                        'xls',
                        'xlsx',
                        'zip', // 압축 파일
                        'rar',
                        'tar',
                        'gz',
                        '7z'
                    );
                    $allowedMimeTypes = array(
                        'image/jpeg', // 이미지
                        'image/png',
                        'image/gif',
                        'video/mp4', // 비디오
                        'video/x-msvideo',
                        'video/quicktime',
                        'application/pdf', // 문서
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/zip', // 압축 파일
                        'application/x-rar-compressed',
                        'application/x-tar',
                        'application/gzip',
                        'application/x-7z-compressed'
                    );
                    break;
                default:
                    return $errorMessage;
            }

            // 파일 확장자 확인
            $fileExtension = pathinfo($input['name'], PATHINFO_EXTENSION);
            if (!in_array(strtolower($fileExtension), $allowedExtensions)) {
                return $errorMessage;
            }

            // MIME 타입 확인
            $fileMimeType = mime_content_type($input['tmp_name']);
            if (!in_array($fileMimeType, $allowedMimeTypes)) {
                return $errorMessage;
            }

            // 파일 사이즈 확인
            $fileSize = $input['size'];
            $minSize = isset($options['minSize']) ? $options['minSize'] : 1000; // 기본값 1KB
            $maxSize = isset($options['maxSize']) ? $options['maxSize'] : 10000000; // 기본값 10MB
            if ($fileSize < $minSize || $fileSize > $maxSize) {
                return $errorMessage;
                // return "파일 사이즈는 1KB 이상 10MB 이하만 가능합니다.";
            }

            return true; 
            $filtered = $input;
            break;
        default:
            // 기본적으로는 입력값 그대로 반환
            $filtered = $input;
            break; // 모든 검사 통과로 간주하고 최종 return ''로 이동
    }

    // 값 범위 검사

    // 값 범위 검사 (min/max)
    if (isset($options['min']) || isset($options['max'])) {
        if ($type === 'int' || $type === 'length') {
            if (isset($options['min']) && $filtered < $options['min']) {
                return $errorMessage;
            }
            if (isset($options['max']) && $filtered > $options['max']) {
                return $errorMessage;
            }
        } elseif ($type === 'string') {
            $length = mb_strlen($input, 'UTF-8');
            if (isset($options['min']) && $length < $options['min']) {
                return $errorMessage;
            }
            if (isset($options['max']) && $length > $options['max']) {
                return $errorMessage;
            }
        }
    }

    // 유효성 검사 결과 반환
    $result = $filtered !== false ? $filtered : $errorMessage;
    //return $result; // 필터링된 값 또는 에러 메시지와 true 반환
    return '';
}

#####################################################################################
# 사용 예시 #########################################################################
// // 1. 이메일 유효성 검사와 빈 값 체크:
// $email = ""; // 빈 값
// $errorMessage = "올바른 이메일 주소를 입력하세요.";
// $validatedEmail = validateInput($email, 'email', array(), $errorMessage);
// echo $validatedEmail;

// // 2. 숫자 범위 검사와 빈 값 체크:
// $number = ""; // 빈 값
// $options = array('min' => 1, 'max' => 100);
// $errorMessage = "1부터 100 사이의 숫자를 입력하세요.";
// $validatedNumber = validateInput($number, 'int', $options, $errorMessage);
// echo $validatedNumber;

// // 3. 문자열 길이 검사와 빈 값 체크:
// $string = ""; // 빈 값
// $options = array('min' => 1, 'max' => 10);
// $errorMessage = "문자열은 1자에서 10자 사이여야 합니다.";
// $validatedString = validateInput($string, 'length', $options, $errorMessage);
// echo $validatedString;

// // 4. URL 유효성 검사와 빈 값 체크:
// $url = ""; // 빈 값
// $errorMessage = "올바른 URL을 입력하세요.";
// $validatedURL = validateInput($url, 'url', array(), $errorMessage);
// echo $validatedURL;

// // 5. 특수문자 필터링과 빈 값 체크:
// $input = ""; // 빈 값
// $errorMessage = "특수문자를 제거했습니다.";
// $filteredInput = validateInput($input, 'specialChars', array(), $errorMessage);
// echo $filteredInput;
#####################################################################################
#####################################################################################


/**
 * 파일 업로드 error log 출력 함수
 */
function fileUploadErrorLog($file)
{
    $fileError = $file['error'];

    switch ($fileError) {
        case UPLOAD_ERR_OK:
            echo "파일이 성공적으로 업로드되었습니다.";
            break;
        case UPLOAD_ERR_INI_SIZE:
            echo "업로드한 파일이 php.ini의 upload_max_filesize 지시어를 초과합니다.";
            break;
        case UPLOAD_ERR_FORM_SIZE:
            echo "업로드한 파일이 HTML 폼에 지정된 MAX_FILE_SIZE 지시어를 초과합니다.";
            break;
        case UPLOAD_ERR_PARTIAL:
            echo "파일이 부분적으로만 업로드되었습니다.";
            break;
        case UPLOAD_ERR_NO_FILE:
            echo "파일이 업로드되지 않았습니다.";
            break;
        case UPLOAD_ERR_NO_TMP_DIR:
            echo "임시 폴더가 없습니다.";
            break;
        case UPLOAD_ERR_CANT_WRITE:
            echo "디스크에 파일을 쓸 수 없습니다.";
            break;
        case UPLOAD_ERR_EXTENSION:
            echo "PHP 확장에 의해 파일 업로드가 중지되었습니다.";
            break;
        default:
            echo "알 수 없는 오류가 발생했습니다.";
            break;
    }
}

/** 
 * 파일 업로드 error 체크 함수
 */
function file_upload_error_check($files)
{
    // $_FILES 배열 순회
    foreach ($files as $file) {
        // 여러 파일이 배열 형태로 업로드된 경우 처리
        if (is_array($file['error'])) {
            $fileCount = count($file['error']);
            for ($i = 0; $i < $fileCount; $i++) {
                if ($file['error'][$i] != UPLOAD_ERR_OK) {
                    $message = "파일 업로드 중 문제가 발생하였습니다.";
                    return $message;
                }
            }
        } else {
            if ($file['error'] != UPLOAD_ERR_OK) {
                $message = "파일 업로드 중 문제가 발생하였습니다.";
                return $message;
            }
        }
    }

    return true;
}