<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

$user_role = isset($_POST['user_role']) ? $_POST['user_role'] : '';
$event_rcv_fg = isset($_POST['event_rcv_fg']) ? urldecode($_POST['event_rcv_fg']) : '';
$find_rcv_fg = isset($_POST['find_rcv_fg']) ? urldecode($_POST['find_rcv_fg']) : '';
$put_rcv_fg = isset($_POST['put_rcv_fg']) ? urldecode($_POST['put_rcv_fg']) : '';
$finance_rcv_fg = isset($_POST['finance_rcv_fg']) ? urldecode($_POST['finance_rcv_fg']) : '';
$find_array = isset($_POST['find_array']) ? $_POST['find_array'] : array();
$put_array = isset($_POST['put_array']) ? $_POST['put_array'] : array();

if (empty($find_array)) {
    $find_rcv_fg = 'N';
}

if (empty($put_array)) {
    $put_rcv_fg = 'N';
}

#######################################################
# 0-1. 유효성 검사
#######################################################
if (!$event_rcv_fg || ($user_role === "002" && (!$find_rcv_fg || !$put_rcv_fg))) {
    responseApi(400, '정상적인 접근이 아닙니다.', null);
    exit;
}


mysqli_autocommit($conn, FALSE);  // 자동 커밋 비활성화
mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 해시로 유저넘버 얻기
    $user_no = get_user_no_for_hash($conn, $userNo);

    #######################################################
    # 0-2. 역할 확인
    #######################################################
    $sql = "SELECT role FROM user_master WHERE user_no = ? AND role = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('is', $user_no, $user_role);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();

    // 예시: role 값 확인
    if ($row) {
        $user_role = $row['role'];
    } else {
        throw new Exception("User not found", 404);
    }


    #######################################################
    # 1. 기존 알림 설정 제거 
    #######################################################
    $sql1 = "DELETE FROM user_notification_preferences WHERE user_no = ?";
    $stmt1 = $conn->prepare($sql1);
    $stmt1->bind_param('i', $user_no);
    $stmt1->execute();


    #######################################################
    # 2. 알림 설정 등록 
    #######################################################
    // 알림 설정 등록 (user_role에 따라 분기)
    if ($user_role === "001") {
        $sql2 = "INSERT INTO user_notification_preferences (user_no, type_name, active_fg) VALUES (?, 'event', ?)";
        $stmt2 = $conn->prepare($sql2);
        $stmt2->bind_param('is', $user_no, $event_rcv_fg);
    }
    elseif ($user_role === "002") {
        $sql2 = "INSERT INTO user_notification_preferences (user_no, type_name, active_fg) VALUES (?, 'event', ?), (?, 'find', ?), (?, 'put', ?)";
        $stmt2 = $conn->prepare($sql2);
        $stmt2->bind_param('isisis', $user_no, $event_rcv_fg, $user_no, $find_rcv_fg, $user_no, $put_rcv_fg);
    }
    elseif ($user_role === "003") {
        $sql2 = "INSERT INTO user_notification_preferences (user_no, type_name, active_fg) VALUES (?, 'event', ?), (?, 'finance', ?)";
        $stmt2 = $conn->prepare($sql2);
        $stmt2->bind_param('isis', $user_no, $event_rcv_fg, $user_no, $finance_rcv_fg);
    }
    $stmt2->execute();


    #######################################################
    # 3. 기존 알림 구역 리스트 제거 
    #######################################################
    $sql3 = "DELETE FROM user_notification_list WHERE user_no = ?";
    $stmt3 = $conn->prepare($sql3);
    $stmt3->bind_param('i', $user_no);
    $stmt3->execute();


    if ($user_role === "002") {
        #######################################################
        # 4. 알림 구역 등록 - 삽니다
        #######################################################
        if (!empty($find_array)) {
            // 다중 행 삽입을 위한 SQL 쿼리 생성
            $sql4 = "INSERT INTO user_notification_list (user_no, noti_type, estate_type, sido_cd, sgg_cd) VALUES ";
            $values = [];
            $params = [];
            $types = '';  // types 문자열 초기화
        
            foreach ($find_array as $item) {
                $type = isset($item['type']) ? $item['type'] : null;
                $sido = isset($item['sido']) ? $item['sido'] : null;
                $sgg = isset($item['sgg']) ? $item['sgg'] : null;
        
                $values[] = "(?, ?, ?, ?, ?)";
                $params[] = $user_no;
                $params[] = 'find';
                $params[] = $type;
                $params[] = $sido;
                $params[] = $sgg;
        
                // 각 변수 타입에 맞게 types 문자열 추가
                $types .= 'issss'; 
            }
        
            $sql4 .= implode(', ', $values);
            $stmt4 = $conn->prepare($sql4);
            $stmt4->bind_param($types, ...$params);
            $stmt4->execute();
        }

        #######################################################
        # 5. 알림 구역 등록 - 팝니다
        #######################################################
        if (!empty($put_array)) {
            // 다중 행 삽입을 위한 SQL 쿼리 생성
            $sql5 = "INSERT INTO user_notification_list (user_no, noti_type, estate_type, sido_cd, sgg_cd) VALUES ";
            $values = [];
            $params = [];
            $types = '';  // user_no의 타입

            foreach ($put_array as $item) {
                $type = isset($item['type']) ? $item['type'] : null;
                $sido = isset($item['sido']) ? $item['sido'] : null;
                $sgg = isset($item['sgg']) ? $item['sgg'] : null;

                $values[] = "(?, ?, ?, ?, ?)";
                $params[] = $user_no;
                $params[] = 'put';
                $params[] = $type;
                $params[] = $sido;
                $params[] = $sgg;
        
                // 각 변수 타입에 맞게 types 문자열 추가
                $types .= 'issss'; 
            }

            $sql5 .= implode(', ', $values);
            $stmt5 = $conn->prepare($sql5);
            $stmt5->bind_param($types, ...$params);
            $stmt5->execute();
        }
    }

    // 모든 SQL 작업이 성공적으로 완료되면 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', null);

} catch (Exception $e) {
    mysqli_rollback($conn);  // 트랜잭션 롤백

    $statusCode = $e->getCode() ? $e->getCode() : 500; // 코드가 없을 경우 500으로 설정
    responseApi($statusCode, $e->getMessage(), null);

} finally {
    // 준비된 문장 닫기
    if (isset($stmt1)) $stmt1->close();
    if (isset($stmt2)) $stmt2->close();
    if (isset($stmt3)) $stmt3->close();
    if (isset($stmt4)) $stmt4->close();
    if (isset($stmt5)) $stmt5->close(); 

    // 데이터베이스 연결 닫기
    mysqli_close($conn);
}