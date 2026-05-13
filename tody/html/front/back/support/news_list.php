<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

// error_reporting(E_ALL);
// ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');

/* 네이버 뉴스 조회 */
try {
    $page = isset($_POST['page']) ? intval($_POST['page']) : 1;
    $items_per_page = isset($_POST['items_per_page']) ? intval($_POST['items_per_page']) : 10;
    $offset = ($page - 1) * $items_per_page + 1;
    $sort = isset($_POST['sort']) ? intval($_POST['sort']) : "date";
    $client_id = "51uqj3T1dAORiqMsBTFv";
    $client_secret = "DGZY4NdHi6";
    $keywords = "토지 부동산 건물";

    // 여러 단어를 OR로 구분
    $keywords = str_replace(" ", " OR ", $keywords);

    // 검색어 인코딩
    $encText = urlencode($keywords);

    // 네이버 뉴스 검색 API URL
    $url = "https://openapi.naver.com/v1/search/news"; // 기본 URL
    $queryParams = "?query=" . $encText; // 검색어 추가
    $queryParams .= "&" . urlencode("display") . "=" . $items_per_page; /* 한 번에 표시할 검색 결과 개수 */
    $queryParams .= "&" . urlencode("start") . "=" . $offset; /* 검색 시작 위치 */
    $queryParams .= "&" . urlencode("sort") . "=" . $sort; /* sim: 정확도순으로 내림차순, date: 날짜순으로 내림차순  */

    $is_post = false; // GET 요청을 사용할 것이므로 POST를 false로 설정
    $ch = curl_init(); // cURL 세션 초기화

    // cURL 옵션 설정
    curl_setopt($ch, CURLOPT_URL, $url . $queryParams); // 요청할 URL
    curl_setopt($ch, CURLOPT_POST, $is_post); // POST 요청 여부 (false면 GET 요청)
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // 응답 결과를 문자열로 반환하도록 설정
    curl_setopt($ch, CURLOPT_HTTPHEADER, array( // 요청 헤더 설정
        "X-Naver-Client-Id: ".$client_id, // 클라이언트 ID
        "X-Naver-Client-Secret: ".$client_secret // 클라이언트 시크릿
    ));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0); // SSL 인증서 검증을 생략 (테스트용으로 권장되지 않음)
    curl_setopt($ch, CURLOPT_TIMEOUT, 5); // 요청 타임아웃을 5초로 설정
    
    $response = curl_exec($ch); // API 요청을 실행하고 응답을 받음
    $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE); // 응답 상태 코드를 가져옴
    curl_close($ch); // cURL 세션을 닫음

    $response_data = json_decode($response, true);
    // 응답 상태 코드에 따라 처리
    if ($status_code == 200) {
        responseApi(200, 'SUCCESS', $response_data);
    } else {
        throw new Exception('Error: ' . $status_code, $status_code);
    }

    // 모든 작업 성공 시 커밋

} catch (Exception $e) {
    // 오류 발생 시 롤백
    responseApi($e->getCode(), $e->getMessage(), null);

} finally {
}

