<?php
// 파일 위치: front/back/visit2/get_statistics.php

ob_start();

header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version, Content-Type");
header("Content-Type: application/json; charset=utf-8");

// 세션이 필요한 경우 주석 해제 (예: 관리자 로그인 여부 확인)
// session_start(); 
// if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
//     echo json_encode(['status' => 'error', 'message' => '로그인 후 이용해주세요.']);
//     exit;
// }

// dbconnect.php는 기존 경로를 그대로 사용한다고 가정
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php'); 

$response = ['status' => 'error', 'message' => '초기 상태: 처리 중 오류 발생', 'data' => []];

if (!isset($conn) || !($conn instanceof mysqli)) {
    $response['message'] = '데이터베이스 연결 문제';
    ob_clean(); // 중요! 이전에 버퍼에 쌓인 모든 출력을 제거합니다.
    echo json_encode($response);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    $startDate = $input['startDate'] ?? null;
    $endDate = $input['endDate'] ?? null;
    $statType = $input['statType'] ?? null;

    if (!$startDate || !$endDate || !$statType) {
        $response['message'] = '필수 파라미터 (startDate, endDate, statType) 누락';
        ob_clean(); // 중요! 이전에 버퍼에 쌓인 모든 출력을 제거합니다.
        echo json_encode($response);
        exit;
    }

    // 날짜 형식 유효성 검사 (YYYY-MM-DD)
    if (!preg_match("/^\d{4}-\d{2}-\d{2}$/", $startDate) || !preg_match("/^\d{4}-\d{2}-\d{2}$/", $endDate)) {
        $response['message'] = '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)';
        ob_clean(); // 중요! 이전에 버퍼에 쌓인 모든 출력을 제거합니다.
        echo json_encode($response);
        exit;
    }

    $data = [];
    $stmt = null; // Prepare statement 변수 초기화

    switch ($statType) {
        // 1. 일자별 가입자수 (user_master table 참조)
        // 가정: user_master 테이블에 user_id, reg_date 컬럼이 있음
        case 'dailyNewUsers':
            if (!$conn->query("SET @rn := -1")) {
                error_log("Failed to initialize @rn variable: " . mysqli_error($conn));
                throw new Exception("Failed to initialize session variable for date generation.");
            }
            $stmt = mysqli_prepare($conn, "
                SELECT
                    calculated_data.stat_date,
                    calculated_data.role,
                    -- 조회 시작일의 초기 누적값과 일별 누적값의 합산
                    COALESCE(
                        calculated_data.cumulative_value_at_date,
                        calculated_data.start_of_period_cumulative -- 현재 날짜에 값이 없으면, 기간 시작점의 누적값을 사용
                    ) AS cumulative_user_count
                FROM (
                    SELECT
                        ds.report_date AS stat_date,
                        ur.role,
                        -- 1. 조회 기간 시작일 직전까지의 총 누적 가입자 수 (시작점)
                        COALESCE((
                            SELECT SUM(base.daily_user_count)
                            FROM (
                                SELECT
                                    DATE(reg_date) AS reg_day,
                                    role,
                                    COUNT(user_no) AS daily_user_count
                                FROM user_master
                                WHERE status_code IN ('001', '006') AND role IN ('001', '002', '003')
                                GROUP BY DATE(reg_date), role
                            ) AS base
                            WHERE base.role = ur.role AND base.reg_day < ds.report_date
                        ), 0) AS start_of_period_cumulative, -- 날짜 시퀀스의 현재 report_date 이전까지의 총합
                        
                        -- 2. cumulative_daily_total 에서 현재 report_date까지의 누적 가입자 수
                        cumulative_daily_total.cumulative_user_count AS cumulative_value_at_date
                        
                    FROM (
                        SELECT DATE_ADD(? , INTERVAL n.num DAY) AS report_date
                        FROM (
                            SELECT @rn := @rn + 1 AS num
                            FROM (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) n1,
                            (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) n2,
                            (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) n3,
                            (SELECT @rn := -1) vars
                        ) n
                        WHERE DATE_ADD(? , INTERVAL n.num DAY) <= ? -- endDate
                    ) AS ds
                    CROSS JOIN (
                        SELECT DISTINCT role FROM user_master WHERE role IN ('001','002','003')
                    ) AS ur
                    LEFT JOIN (
                        -- 전체 기간에 대한 일별 가입자 수를 계산하고, 이를 다시 누적합합니다. (가장 정확히 나온 그 쿼리 부분)
                        SELECT
                            reg_day,
                            role,
                            SUM(daily_user_count) OVER (PARTITION BY role ORDER BY reg_day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_user_count
                        FROM (
                            SELECT
                                DATE(reg_date) AS reg_day,
                                role,
                                COUNT(user_no) AS daily_user_count
                            FROM user_master
                            WHERE status_code IN ('001', '006')
                              AND role IN ('001', '002', '003')
                            GROUP BY DATE(reg_date), role
                        ) AS daily_counts_base
                    ) AS cumulative_daily_total
                    ON ds.report_date = cumulative_daily_total.reg_day
                       AND ur.role = cumulative_daily_total.role
                    ORDER BY ds.report_date, ur.role
                ) AS calculated_data
                ORDER BY calculated_data.stat_date, calculated_data.role;
            ");
            mysqli_stmt_bind_param($stmt, "sss", $startDate, $startDate, $endDate);
            break;
        // 2. 일별 방문자수 (사용자 유형 (registered, guest))
        case 'dailyVisitors':
            $query = "
                WITH RECURSIVE date_series AS (
                    SELECT DATE(?) AS stat_date
                    UNION ALL
                    SELECT DATE_ADD(stat_date, INTERVAL 1 DAY)
                    FROM date_series
                    WHERE stat_date < DATE(?)
                )
                SELECT
                    ds.stat_date,
                    ut.user_type,
                    COALESCE(uv.visitor_count, 0) AS visitor_count
                FROM date_series ds
                CROSS JOIN (
                    SELECT DISTINCT user_type FROM user_visits
                ) ut
                LEFT JOIN (
                    SELECT
                        DATE(start_time) AS stat_date,
                        user_type,
                        COUNT(DISTINCT client_session_id) AS visitor_count
                    FROM user_visits
                    WHERE DATE(start_time) BETWEEN ? AND ?
                    GROUP BY stat_date, user_type
                ) uv ON ds.stat_date = uv.stat_date AND ut.user_type = uv.user_type
                ORDER BY ds.stat_date, ut.user_type;
            ";
            $stmt = mysqli_prepare($conn, $query);
            mysqli_stmt_bind_param($stmt, "ssss", $startDate, $endDate, $startDate, $endDate);
            break;

        // 3. 시간대별 방문자수 (사용자 유형 (registered, guest) 통합)
        case 'hourlyVisitors':
            $stmt = mysqli_prepare($conn, "
                SELECT
                    HOUR(start_time) AS stat_hour,
                    COUNT(DISTINCT client_session_id) AS visitor_count
                FROM user_visits
                WHERE DATE(start_time) BETWEEN ? AND ?
                GROUP BY stat_hour
                ORDER BY stat_hour;
            ");
            mysqli_stmt_bind_param($stmt, "ss", $startDate, $endDate);
            break;

        // 4. 요일별 방문자수 (사용자 유형 (registered, guest) 통합)
        case 'weekdayVisitors':
            // WEEKDAY(): 0=월요일, 6=일요일. DAYOFWEEK(): 1=일요일, 7=토요일. -> DAYOFWEEK 사용
            $stmt = mysqli_prepare($conn, "
                SELECT
                    DAYOFWEEK(start_time) - 1 AS stat_weekday, -- 0=일요일, 6=토요일
                    COUNT(DISTINCT client_session_id) AS visitor_count
                FROM user_visits
                WHERE DATE(start_time) BETWEEN ? AND ?
                GROUP BY stat_weekday
                ORDER BY stat_weekday;
            ");
            mysqli_stmt_bind_param($stmt, "ss", $startDate, $endDate);
            break;

        // 5. 시간대별 머문시간 (24시간)
        case 'hourlyDuration':
            $stmt = mysqli_prepare($conn, "
                SELECT
                    HOUR(start_time) AS stat_hour,
                    SUM(duration_minutes) / COUNT(DISTINCT client_session_id) AS average_duration_per_user_minutes
                FROM user_visits
                WHERE DATE(start_time) BETWEEN ? AND ?
                GROUP BY stat_hour
                ORDER BY stat_hour;
            ");
            mysqli_stmt_bind_param($stmt, "ss", $startDate, $endDate);
            break;

        // 6. 요일별 머문시간
        case 'weekdayDuration':
                    $stmt = mysqli_prepare($conn, "
                SELECT
                    DAYOFWEEK(start_time) - 1 AS stat_weekday, -- 0=일요일, 6=토요일
                    SUM(duration_minutes) / COUNT(DISTINCT client_session_id) AS average_duration_per_user_minutes
                FROM user_visits
                WHERE DATE(start_time) BETWEEN ? AND ?
                GROUP BY stat_weekday
                ORDER BY stat_weekday;
            ");
            mysqli_stmt_bind_param($stmt, "ss", $startDate, $endDate);
            break;

        // 7. 월별 머문시간
        case 'monthlyDuration':
            $stmt = mysqli_prepare($conn, "
                SELECT
                    DATE_FORMAT(start_time, '%Y-%m') AS stat_month,
                    SUM(duration_minutes) / COUNT(DISTINCT client_session_id) AS average_duration_per_user_minutes
                FROM user_visits
                WHERE DATE(start_time) BETWEEN ? AND ?
                GROUP BY stat_month
                ORDER BY stat_month;
            ");
            mysqli_stmt_bind_param($stmt, "ss", $startDate, $endDate);
            break;

        // 8. 페이지별 머문시간
        case 'pageDuration':
            $stmt = mysqli_prepare($conn, "
                SELECT
                    page_title AS stat_page_title, -- 페이지 제목 컬럼 추가
                    SUM(duration_minutes) / COUNT(DISTINCT client_session_id) AS average_duration_per_user_on_page_minutes
                FROM user_visits
                WHERE DATE(start_time) BETWEEN ? AND ?
                GROUP BY page_title
                ORDER BY page_title; -- 페이지 제목으로 정렬
            ");
            mysqli_stmt_bind_param($stmt, "ss", $startDate, $endDate);
            break;

        // 9. 사용자별 머문시간 (사용자 유형 기준)
        case 'userDuration':
            // user_total_durations와 guest_total_durations를 합쳐서 조회
            case 'overallUserAverageDuration': // 의미를 명확히 하는 새로운 case 이름 제안
                $stmt = mysqli_prepare($conn, "
                    SELECT
                        CASE WHEN user_id IS NOT NULL THEN 'registered' ELSE 'guest' END AS user_type,
                        AVG(duration_minutes) AS average_duration_minutes -- 평균 체류 시간
                    FROM user_visits
                    WHERE DATE(start_time) BETWEEN ? AND ?
                    GROUP BY user_type
                    ORDER BY user_type;
                ");
                // SQL 쿼리에서 '?'는 두 개이므로, $startDate와 $endDate를 한 번씩만 바인딩합니다.
                mysqli_stmt_bind_param($stmt, "ss", $startDate, $endDate); 
                break;
        default:
            $response['message'] = '유효하지 않은 통계 유형입니다.';
            ob_clean(); // 중요! 이전에 버퍼에 쌓인 모든 출력을 제거합니다.
            echo json_encode($response);
            exit;
    }

    if ($stmt) {
        // @rn 변수 초기화 쿼리 실행 (dailyNewUsers 쿼리에서 @rn을 사용한다면 반드시 필요)
        
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        
        if (!$result) {
            error_log("SQL 쿼리 결과 가져오기 실패: " . mysqli_error($conn));
            $response['message'] = "SQL 쿼리 실행 후 결과 가져오기 실패.";
        } else {
            while ($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }
            mysqli_stmt_close($stmt);

            // --- 여기에서 $response['status']와 $response['message']를 설정해야 합니다 ---
            if (count($data) > 0) {
                $response['status'] = 'success';
                $response['message'] = '데이터 조회 성공';
                $response['data'] = $data;
            } else {
                $response['status'] = 'no_data'; // 새로운 상태: 데이터 없음
                $response['message'] = '조회 기간 내 데이터가 없습니다.';
                $response['data'] = $data; // 빈 배열이라도 보냄
            }
        }
    } else {
        $response['message'] = '통계 쿼리 준비에 실패했습니다.';
    }

} catch (Exception $e) {
    error_log('get_statistics.php Error: ' . $e->getMessage());
    $response['message'] = '서버 내부 오류: ' . $e->getMessage();
    $response['status'] = 'error'; // 예외 발생 시 반드시 error 상태
} finally {
    if ($conn) mysqli_close($conn);
    
    // 버퍼에 쌓인 모든 예상치 못한 출력을 제거합니다.
    $unexpectedOutput = ob_get_clean();
    if (!empty($unexpectedOutput)) {
        error_log("Unexpected output captured before JSON: " . $unexpectedOutput);
        // 클라이언트에게는 여전히 JSON을 보내되, 에러 로그에 남깁니다.
        // 또는, $response['message']에 이 내용을 추가할 수도 있습니다.
        if ($response['status'] !== 'error') { // 원래 에러가 아니었다면 예상치 못한 출력으로 인한 에러로 변경
            $response['status'] = 'error';
            $response['message'] = 'PHP Warning/Notice 발생: ' . $unexpectedOutput;
        } else { // 원래 에러였다면 메시지에 추가
            $response['message'] .= ' (PHP Warnings: ' . $unexpectedOutput . ')';
        }
    }
}

echo json_encode($response);
exit;
?>