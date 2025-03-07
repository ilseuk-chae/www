<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

// 에러 메세지 표시
// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include_once '../00-include/common.php';
include_once '../00-include/validation.php';

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

try {
    // 변수 설정
    $jurirno = $_POST['jurirno'];
    $authkey = $_ENV['vworld_key'];
    $domain = $_ENV['domain'];

    // 입력값 검증
    if (!$jurirno) {
        throw new Exception('개설등록번호를 입력하세요.', 400);
    }

    $ch = curl_init();
    $url = "http://api.vworld.kr/ned/data/getEBOfficeInfo"; /*URL*/
    $queryParams = "?" . urlencode("key") . "=" . $authkey; /*key*/
    $queryParams .= "&" . urlencode("domain") . "=" . $domain; /*domain*/
    $queryParams .= '&' . urlencode('jurirno') . '=' . urlencode($jurirno); /* 법인등록번호 */
    $queryParams .= '&' . urlencode('format') . '=' . urlencode('json'); /* 응답결과 형식(xml 또는 json) */
    $queryParams .= '&' . urlencode('numOfRows') . '=' . urlencode('1'); /* 검색건수 */
    $queryParams .= '&' . urlencode('pageNo') . '=' . urlencode('1'); /* 페이지번호 */

    // print_r($queryParams);exit;
    curl_setopt($ch, CURLOPT_URL, $url . $queryParams);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_HEADER, FALSE);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
    $response = curl_exec($ch);
    curl_close($ch);

    $json_result = json_decode($response);
    // print_r($json_result);

    // resultCode 값 출력
    if ($json_result->EDOffices->totalCount <= 0) {
        throw new Exception('개설등록번호를 확인하세요.', 400);
    }
    responseApi(200, 'SUCCESS', $json_result->EDOffices->field);

} catch (Exception $e) {
    // 오류 발생 시 롤백
    responseApi($e->getCode(), $e->getMessage(), null);

}
?>