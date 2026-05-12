<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

try {
    $user_no = get_user_no_for_hash($conn, $userNo);

    // SQL 쿼리
    $sql =
        "SELECT 
            role
        FROM user_master
        WHERE user_no = ?
        AND status_code = '001'
        ";

    // 조건 추가
    $params = [$user_no];
    $types = 'i';

    $stmt = executeQuery($conn, $sql, $types, $params);

    // 결과를 가져옵니다.
    $result = mysqli_stmt_get_result($stmt);

    // 결과를 배열로 변환합니다.
    $response_data = array();

    // 결과를 배열로 변환합니다.
    $row = mysqli_fetch_assoc($result);

    $role = $row['role'];

    if ($role === '001') {
        $menuHtml = 
            '<div class="text-center">
                <a href="mypage_v2.html">내 정보</a>
                <a href="mypage_find_v2.html">삽니다 관리</a>
                <a href="mypage_put_v2.html">팝니다 관리</a>
                <a href="mypage_history_v2.html">최근 이력</a>
                <a href="mypage_noti_v2.html">알림 설정</a>
            </div>';
    } elseif ($role === '002') {
        $menuHtml = 
            '<div class="text-center">
                <a href="mypage_realtor_v2.html">내 정보</a>
                <a href="mypage_sale_v2.html">내 매물</a>
                <a href="mypage_find_v2.html">삽니다 관리</a>
                <a href="mypage_put_v2.html">팝니다 관리</a>
                <a href="mypage_history_v2.html">최근 이력</a>
                <a href="mypage_noti_v2.html">알림 설정</a>
            </div>';
    } elseif ($role === '003') {
        $menuHtml = 
            '<div class="text-center">
                <a href="mypage_finance_v2.html">내 정보</a>
                <a href="mypage_finance_list.html">금융 신청 관리</a>
                <a href="mypage_noti_v2.html">알림 설정</a>
            </div>';
    }

    $response_data['menu'] = $menuHtml;

    // 모든 작업 성공 시 커밋
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
