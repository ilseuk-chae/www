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
    $filtered = '';
    // 빈 값 체크
    if (empty($input) || !$input) {
        return $errorMessage; // 빈 값이면 에러 메시지 반환
    }

    switch ($type) {
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
            // 비밀번호는 특정한 규칙에 따라 검사할 필요가 있습니다.
            // 여기에 비밀번호 유효성 검사 로직을 추가하세요.
            // 예시: 최소 8자 이상, 영문 대소문자, 숫자, 특수문자 포함
            // 예시 로직은 아래에 추가되었습니다.
            if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}$/', $input)) {
                return $errorMessage;
            }
            $filtered = $input; // 비밀번호는 추가적인 필터링 없이 그대로 반환합니다.
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
            switch ($options['type']) {
                case 'image':
                    $allowedExtensions = array('jpg', 'jpeg', 'png', 'gif');
                    $allowedMimeTypes = array('image/jpeg', 'image/png', 'image/gif');
                    break;
                case 'video':
                    $allowedExtensions = array('mp4', 'avi', 'mov');
                    $allowedMimeTypes = array('video/mp4', 'video/x-msvideo', 'video/quicktime');
                    break;
                case 'doc':
                    $allowedExtensions = array('pdf', 'doc', 'docx', 'xls', 'xlsx', 'hwp');
                    $allowedMimeTypes = array('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/haansofthwp', 'application/x-hwp');
                    break;
                case 'archive':
                    $allowedExtensions = array('zip', 'rar', 'tar', 'gz', '7z');
                    $allowedMimeTypes = array('application/zip', 'application/x-rar-compressed', 'application/x-tar', 'application/gzip', 'application/x-7z-compressed');
                    break;
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
                        'hwp',
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
                        'application/haansofthwp',
                        'application/x-hwp',
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
                return "파일 사이즈는 1KB 이상 10MB 이하만 가능합니다.";
            }

            $filtered = $input;
            break;
        default:
            // 기본적으로는 입력값 그대로 반환
            $filtered = $input;
    }

    // 값 범위 검사
    if (isset($options['min']) && isset($options['max'])) {
        if ($type === 'int' || $type === 'length') {
            if ($filtered < $options['min'] || $filtered > $options['max']) {
                return $errorMessage;
            }
        }
    } elseif (isset($options['min'])) {
        if ($type === 'int' || $type === 'length') {
            if ($filtered < $options['min']) {
                return $errorMessage;
            }
        }
    } elseif (isset($options['max'])) {
        if ($type === 'int' || $type === 'length') {
            if ($filtered > $options['max']) {
                return $errorMessage;
            }
        }
    }


    // 유효성 검사 결과 반환
    $result = $filtered !== false ? $filtered : $errorMessage;
    return $result; // 필터링된 값 또는 에러 메시지와 true 반환
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
    // print_r($files);exit;
    // $_FILES 배열 순회
    foreach ($files as $file) {
        // 여러 파일이 배열 형태로 업로드된 경우 처리
        if (is_array($file['error'])) {
            $fileCount = count($file['error']);
            for ($i = 0; $i < $fileCount; $i++) {
                if ($file['error'][$i] != UPLOAD_ERR_OK) {
                    $message = "파일 업로드 중 문제가 발생하였습니다.1";
                    return $message;
                }
            }
        } else {
            if ($file['error'] != UPLOAD_ERR_OK) {
                $message = "파일 업로드 중 문제가 발생하였습니다.2";
                // return "파일 업로드 중 문제가 발생하였습니다. 에러 코드: " . $file['error'];
                return $message;
            }
        }
    }

    return true;
}