<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

// 에러 메세지 표시
// error_reporting(E_ALL);
// ini_set("display_errors", 1);

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

include_once '../00-include/common.php';
include_once '../00-include/validation.php';

try {
    // 변수 설정
    $business_license_code = $_POST['b_no'];
    $serviceKey = $_ENV['public_data_key'];

    // 입력값 검증
    if (!$business_license_code) {
        throw new Exception('사업자 등록번호를 입력하세요.', 400);
    }

    // 전송 방식 설정
    $method = "POST";

    // url 설정
    $url = "https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=" . $serviceKey;

    // 파라미터 설정
    $data = array('b_no' => [$business_license_code]);
    $data_string = json_encode($data);

    $ch = curl_init();                                 //curl 초기화
    curl_setopt($ch, CURLOPT_URL, $url);               //URL 지정하기
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);    //요청 결과를 문자열로 반환 
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);      //connection timeout 10초 
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);   //원격 서버의 인증서가 유효한지 검사 안함
    curl_setopt(
        $ch,
        CURLOPT_HTTPHEADER,
        array(        // header 설정
            'Content-Type: application/json',
            'accept: application/json'
        )
    );
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string); //POST data
    curl_setopt($ch, CURLOPT_POST, true);               //true시 post 전송 

    $response = curl_exec($ch);                         //결과값
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    // 문자열 값을 연관배열로 변환
    $data = json_decode($response, true);

    // exit;
    if ($data['status_code'] !== 'OK') {
        throw new Exception('사업자 등록번호를 확인하세요.', 400);
    }

    if ($data['data'][0]['b_stt_cd'] !== '01') {
        throw new Exception('사업자번호 인증이 되지 않습니다..', 400);
    }

    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    responseApi($e->getCode(), $e->getMessage(), null);

}
?>