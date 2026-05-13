<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type: application/json; charset=utf-8");
// header("Content-Type:text/html;charset=utf-8");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/authChk.php');

// $event_rcv_fg = isset($_POST['event_rcv_fg']) ? urldecode($_POST['event_rcv_fg']) : '';
// $find_rcv_fg = isset($_POST['find_rcv_fg']) ? urldecode($_POST['find_rcv_fg']) : '';
// $put_rcv_fg = isset($_POST['put_rcv_fg']) ? urldecode($_POST['put_rcv_fg']) : '';
// $find_array = isset($_POST['find_array']) ? $_POST['find_array'] : array();
// $put_array = isset($_POST['put_array']) ? $_POST['put_array'] : array();


mysqli_begin_transaction($conn);  // 트랜잭션 시작

try {
    // 해시로 유저넘버 얻기
    $user_no = get_user_no_for_hash($conn, $userNo);

    #######################################################
    # 1. 체크 유무 가져오기
    #######################################################
    $sql1 = "SELECT type_name, active_fg FROM user_notification_preferences WHERE user_no = ?";
    $stmt1 = $conn->prepare($sql1);
    $stmt1->bind_param('i', $user_no);
    $stmt1->execute();
    $result1 = $stmt1->get_result();

    # 기존 알림 설정을 배열에 저장
    $existing_preferences = array();
    while ($row = $result1->fetch_assoc()) {
        $existing_preferences[] = $row;
    }


    #######################################################
    # 2. 알림 구역 가져오기
    #######################################################
    $sql2 = 
    "SELECT 
        a.noti_type, 
        a.estate_type, 
        a.sido_cd, 
        a.sgg_cd,
        sm_sido.locallow_nm AS sido_nm,
        sm_sgg.locallow_nm AS sgg_nm,
        b.type_name
    FROM user_notification_list AS a
    
    LEFT JOIN (
        SELECT sido_cd, MIN(region_cd) as min_region_cd
        FROM bjd_master
        GROUP BY sido_cd
    ) as min_sido ON a.sido_cd = min_sido.sido_cd

    LEFT JOIN bjd_master as sm_sido
    ON sm_sido.sido_cd = min_sido.sido_cd AND sm_sido.region_cd = min_sido.min_region_cd

    LEFT JOIN (
        SELECT sido_cd, sgg_cd, MIN(region_cd) as min_region_cd
        FROM bjd_master
        GROUP BY sido_cd, sgg_cd
    ) as min_sgg ON a.sido_cd = min_sgg.sido_cd AND a.sgg_cd = min_sgg.sgg_cd

    LEFT JOIN bjd_master as sm_sgg
    ON sm_sgg.sido_cd = min_sgg.sido_cd AND sm_sgg.sgg_cd = min_sgg.sgg_cd AND sm_sgg.region_cd = min_sgg.min_region_cd

    LEFT JOIN type_master AS b 
    ON b.group_code = 'ESTATE_TYPE'
    AND a.estate_type = b.type_code

    WHERE a.user_no = ?
    GROUP BY a.noti_type, a.estate_type, a.sido_cd, a.sgg_cd, sm_sido.locallow_nm, sm_sgg.locallow_nm, b.type_name";
    
    // $sql2 = 
    //     "SELECT 
    //         a.noti_type, 
    //         a.estate_type, 
    //         a.sido_cd, 
    //         a.sgg_cd,
    //         (SELECT locallow_nm FROM bjd_master WHERE sido_cd = a.sido_cd ORDER BY region_cd ASC LIMIT 1) AS sido_nm,
    //         (SELECT locallow_nm FROM bjd_master WHERE sido_cd = a.sido_cd AND sgg_cd = a.sgg_cd ORDER BY region_cd ASC LIMIT 1) AS sgg_nm,
    //         b.type_name
    //     FROM user_notification_list AS a

    //     LEFT JOIN type_master AS b 
    //     ON b.group_code = 'ESTATE_TYPE'
    //     AND a.estate_type = b.type_code

    //     WHERE a.user_no = ?";
    
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param('i', $user_no);
    $stmt2->execute();
    $result2 = $stmt2->get_result();

    # 기존 알림 설정을 배열에 저장
    $noti_lists = array();
    while ($row = $result2->fetch_assoc()) {
        $noti_type = $row['noti_type'];
        if (!isset($noti_lists[$noti_type])) {
            $noti_lists[$noti_type] = array();
        }
        $noti_lists[$noti_type][] = $row;
    }

    $response_data = array();
    $response_data['existing_preferences'] = $existing_preferences;
    $response_data['noti_lists'] = $noti_lists;


    // 모든 SQL 작업이 성공적으로 완료되면 커밋
    mysqli_commit($conn);
    responseApi(200, 'SUCCESS', $response_data);

} catch (Throwable $e) {
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