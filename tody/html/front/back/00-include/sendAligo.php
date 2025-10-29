<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");


require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";

$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

/* 
-----------------------------------------------------------------------------------
알림톡 토큰 생성
-----------------------------------------------------------------------------------
API호출 URL의 유효시간을 결정하며 URL 의 구성중 "30"은 요청의 유효시간을 의미하며, "s"는 y(년), m(월), d(일), h(시), i(분), s(초) 중 하나이며 설정한 시간내에서만 토큰이 유효합니다.
운영중이신 보안정책에 따라 토큰의 유효시간을 특정 기간만큼 지정할 경우 매번 호출할 필요없이 해당 유효시간내에 재사용 가능합니다.
주의하실 점은 서버를 여러대 운영하실 경우 토큰은 서버정보를 포함하므로 각 서버에서 생성된 토큰 문자열을 사용하셔야 하며 토큰 문자열을 공유해서 사용하실 수 없습니다.
*/
function createToken() {
    $_apikey = $_ENV['aligo_apikey'];
    $_userid = $_ENV['aligo_userid'];

    $_apiURL = 'https://kakaoapi.aligo.in/akv10/token/create/30/s/';
    $_hostInfo = parse_url($_apiURL);
    $_port = (strtolower($_hostInfo['scheme']) == 'https') ? 443 : 80;
    $_variables = array(
        'apikey' => $_apikey,
        'userid' => $_userid
    );

    $oCurl = curl_init();
    curl_setopt($oCurl, CURLOPT_PORT, $_port);
    curl_setopt($oCurl, CURLOPT_URL, $_apiURL);
    curl_setopt($oCurl, CURLOPT_POST, 1);
    curl_setopt($oCurl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($oCurl, CURLOPT_POSTFIELDS, http_build_query($_variables));
    curl_setopt($oCurl, CURLOPT_SSL_VERIFYPEER, FALSE);
    
    $ret = curl_exec($oCurl);
    $error_msg = curl_error($oCurl);
    curl_close($oCurl);
    
    // print_r($ret . PHP_EOL); // 리턴 JSON 문자열 확인
    $retArr = json_decode($ret, true); // JSON 문자열 배열 변환
    // print_r($retArr); // 결과값 출력
    
    // 토큰 생성 실패 시 
    if ($retArr['code'] !== 0) {
        // 트랜잭션 롤백
        echo $error_msg;
    
        exit;
    }
    
    return $token = $retArr['token'];
    $urlencode = $retArr['urlencode'];
}

/* 
-----------------------------------------------------------------------------------
알림톡 전송
-----------------------------------------------------------------------------------
버튼의 경우 템플릿에 버튼이 있을때만 버튼 파라메더를 입력하셔야 합니다.
버튼이 없는 템플릿인 경우 버튼 파라메더를 제외하시기 바랍니다.
*/
function sendAlimtalk($templete_cd, $paramList) {
    $apiKey = $_ENV['aligo_apikey'];
    $userid = $_ENV['aligo_userid'];
    $senderkey = $_ENV['aligo_senderkey'];
    $sender = $_ENV['aligo_sender'];
    
    $_apiURL = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';
    $_hostInfo = parse_url($_apiURL);
    $_port = (strtolower($_hostInfo['scheme']) == 'https') ? 443 : 80;
    $_variables = array(
        // 인증용 API Key
        'apikey' => $apiKey,
        // 사용자id
        'userid' => $userid,
        // 발신프로파일 키
        'senderkey' => $senderkey,
        // 템플릿 코드
        'tpl_code' => $templete_cd,
        // 발신자 연락처
        'sender' => $sender,
        // 생성한 토큰
        // 'token' => $token,
        // 예약일
        // 'senddate' => '예약일',   
        // 수신자 연락처
        // 'receiver_1' => $phone_number,  
        // 수신자 이름
        // 'recvname_1'  => '수신자 이름',  
        // 알림톡 제목
        // 'subject_1' => $aligoTitle,     
        // 알림톡 내용
        // 'message_1' => $verificationCode,   
        // 강조표기형의 타이틀
        // 'emtitle_1' => $verificationCode,    
        // 실패시 대체문자 제목
        // 'fsubject_1' => $aligoTitle,    
        // 실패시 대체문자 내용
        // 'fmessage_1' => $verificationCode,  
        // 실패시 대체문자 전송가능
        'failover' => 'Y',
        // 테스트 모드 적용여부 (Y or N)
        // 'testMode'  => 'Y'                                              
    );

    foreach($paramList as $key => $param) {
        $_variables['subject_' . ($key + 1)] = $param['subject'];
        // $_variables['emtitle_' . ($key + 1)] = $param['emtitle'];
        $_variables["message_" . ($key + 1)] = $param['message'];
        $_variables["receiver_" . ($key + 1)] = $param['phone'];
        // $_variables["button_" . ($key + 1)] = $param['button'];
        $_variables['fsubject_' . ($key + 1)] = $param['subject'];
        $_variables['fmessage_' . ($key + 1)] = $param['message'];
    }

    // print_r($_variables);exit;

    // 알림톡 제목, 내용, 강조표기형의 타이틀, 실패시 대체문자 제목, 실패시 대체문자 내용 추가
    // for ($i = 1; $i <= count($receivers); $i++) {
    //     $_variables['subject_' . $i] = $aligoTitle;
    //     $_variables['message_' . $i] = '테스트 알림 : ' . $verificationCode;
    //     // $_variables['emtitle_' . $i] = $verificationCode;
    //     $_variables['fsubject_' . $i] = $aligoTitle;
    //     $_variables['fmessage_' . $i] = '테스트 알림 : ' . $verificationCode;
    // }
    // echo json_encode($_variables);exit;
    
    /*
    -----------------------------------------------------------------
    치환자 변수에 대한 처리
    -----------------------------------------------------------------
    
    등록된 템플릿이 "#{이름}님 안녕하세요?" 일경우
    실제 전송할 메세지 (message_x) 에 들어갈 메세지는
    "홍길동님 안녕하세요?" 입니다.
    
    카카오톡에서는 전문과 템플릿을 비교하여 치환자이외의 부분이 일치할 경우
    정상적인 메세지로 판단하여 발송처리 하는 관계로
    반드시 개행문자도 템플릿과 동일하게 작성하셔야 합니다.
    
    예제 : message_1 = "홍길동님 안녕하세요?"
    */
    
    $oCurl = curl_init();
    curl_setopt($oCurl, CURLOPT_PORT, $_port);
    curl_setopt($oCurl, CURLOPT_URL, $_apiURL);
    curl_setopt($oCurl, CURLOPT_POST, 1);
    curl_setopt($oCurl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($oCurl, CURLOPT_POSTFIELDS, http_build_query($_variables));
    curl_setopt($oCurl, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($oCurl, CURLOPT_TIMEOUT, 30);

    $ret = curl_exec($oCurl);
    $error_msg = curl_error($oCurl);
    curl_close($oCurl);
    
    // 리턴 JSON 문자열 확인
    // print_r($ret . PHP_EOL);
    
    // JSON 문자열 배열 변환
    $retArr = json_decode($ret);
    
    //dump_go($retArr);
    
    if ($retArr->code === -99) {
        // $result_array['msg'] = 'fail';
        return false;
        // echo 'send Failed';
    } else {
        // $result_array['msg'] = 'success';
        //return true;
        // echo 'send Success';
        
        // code가 0이지만 실제 전송 성공 건수가 0일 경우도 있을 수 있음
        // 또는 info 객체 자체가 없거나, fcnt가 0이 아닐 경우 등
        if (isset($retArr->info) && isset($retArr->info->scnt) && $retArr->info->scnt > 0 && $retArr->info->fcnt === 0) {
            return true; // Aligo 측에서도 성공으로 판단
        } else if (isset($retArr->info) && isset($retArr->info->fcnt) && $retArr->info->fcnt > 0) {
            // 실패 건수가 있으면 false 반환
            error_log("Aligo send error: Some messages failed. RetArr: " . print_r($retArr, true));
            return false;
        } else {
            // 그 외의 경우 (예: code 0 이지만 scnt가 0인 경우, info 객체 없음 등)
            error_log("Aligo send ambiguity: RetArr: " . print_r($retArr, true));
            return false;
        }
    }
    // echo json_encode($result_array);
    
    // 결과값 출력
    // print_r($retArr);
    // exit;
}

?>