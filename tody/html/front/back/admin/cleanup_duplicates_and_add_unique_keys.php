<?php
// cleanup_duplicates_and_add_unique_keys.php
//이 작업을 realPrice_apt_XX처럼 시도 코드로 나뉜 모든 테이블에 적용하려면, 앞서 제가 제안해 드린 add_unique_keys_to_realprice_tables.php 스크립트를 약간 수정하여
// DELETE 쿼리를 동적으로 생성하고 실행하도록 할 수 있습니다.
// 1. 데이터베이스 연결 설정
//$servername = "localhost"; // DB 서버 주소
//$username = "your_db_username"; // DB 사용자명
//$password = "your_db_password"; // DB 비밀번호
//$dbname = "your_db_name"; // DB 이름

$script_root = dirname(__FILE__); // /var/www/tody/html/front/back/admin/
$project_base = dirname($script_root, 1); // /var/www/tody/html/front/back/ (admin에서 2단계 위로)

require_once $project_base . '/00-include/dbconnect.php';
require_once $project_base . '/00-include/common.php';
require_once $project_base . '/admin/batch_helpers.php'; // admin 폴더도 common.php와 같은 레벨에 있으니 경로 수정


//$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$conn->set_charset("utf8mb4");

echo "Database connected successfully.\n";

// 2. 각 테이블 유형별 UNIQUE 키 컬럼 정의 (이전과 동일)
$table_patterns = [
    'apt' => [
        'prefix' => 'realPrice_apt_',
        // 'dealDay' 다음에 'cdealDay'를 추가
        'columns' => ['pnu', 'aptNm', 'dealYear', 'dealMonth', 'dealDay', 'cdealDay', 'excluUseAr', 'floor', 'dealAmount'],
        'index_name' => 'ux_apt_trade'
    ],
    'land' => [
        'prefix' => 'realPrice_land_',
        // 'dealDay' 다음에 'cdealDay'를 추가
        'columns' => ['pnu', 'dealYear', 'dealMonth', 'dealDay', 'cdealDay', 'dealArea', 'dealAmount', 'shareDealingType'],
        'index_name' => 'ux_land_trade'
    ],
    'multiFamily' => [
        'prefix' => 'realPrice_multiFamily_', // 또는 실제 테이블명 패턴
        // 'dealDay' 다음에 'cdealDay'를 추가
        'columns' => ['pnu', 'mhouseNm', 'dealYear', 'dealMonth', 'dealDay', 'cdealDay', 'excluUseAr', 'floor', 'dealAmount'],
        'index_name' => 'ux_mf_trade'
    ],
    'officetel' => [
        'prefix' => 'realPrice_officetel_', // 또는 실제 테이블명 패턴
        // 'dealDay' 다음에 'cdealDay'를 추가
        'columns' => ['pnu', 'offiNm', 'dealYear', 'dealMonth', 'dealDay', 'cdealDay', 'excluUseAr', 'floor', 'dealAmount'],
        'index_name' => 'ux_offi_trade'
    ],
    
    // ... (land, multiFamily, officetel 등 다른 테이블 패턴도 여기에 추가) ...
];

// 3. 각 테이블 패턴에 대해 중복 정리 및 UNIQUE 키 추가
foreach ($table_patterns as $type_info) {
    $prefix = $type_info['prefix'];
    $columns_to_index = $type_info['columns'];
    $index_name = $type_info['index_name'];

    // 현재 DB에서 패턴에 맞는 테이블 목록 가져오기
    $sql_get_tables = "SHOW TABLES LIKE '{$prefix}%'";
    $result_tables = $conn->query($sql_get_tables);

    if ($result_tables->num_rows > 0) {
        while ($row = $result_tables->fetch_array(MYSQLI_NUM)) {
            $table_name = $row[0];

            echo "\n--- Processing table: {$table_name} ---\n";

            // 중복 확인 및 삭제 SQL 생성
            $columns_quoted_for_group = array_map(function($col){ return "`{$col}`"; }, $columns_to_index);
            $group_by_cols = implode(', ', $columns_quoted_for_group);

            $sql_preview_delete = "SELECT T1.* FROM `{$table_name}` AS T1 
                JOIN (
                    SELECT MAX(idx) AS max_idx, {$group_by_cols} 
                    FROM `{$table_name}` 
                    GROUP BY {$group_by_cols} 
                    HAVING COUNT(*) > 1
                ) AS Duplicates ON 
                    " . implode(' AND ', array_map(fn($col) => "T1.`{$col}` = Duplicates.`{$col}`", $columns_to_index)) . " 
                WHERE 
                    T1.idx < Duplicates.max_idx;";

            echo "  - Previewing rows to be deleted (RUN THIS IN YOUR SQL CLIENT FIRST): {$sql_preview_delete}\n";
            
            //exit;   // 미리보기 후 스크립트 종료 - 실제 삭제 전에 반드시 확인하세요!

            // 실제 삭제 쿼리
            $sql_delete_duplicates = "
                DELETE T1 FROM `{$table_name}` AS T1
                JOIN (
                    SELECT MAX(idx) as max_idx, {$group_by_cols}
                    FROM `{$table_name}`
                    GROUP BY {$group_by_cols}
                    HAVING COUNT(*) > 1
                ) AS Duplicates ON
                    " . implode(' AND ', array_map(fn($col) => "T1.`{$col}` = Duplicates.`{$col}`", $columns_to_index)) . "
                WHERE
                    T1.idx < Duplicates.max_idx;
            ";

            echo "  - Attempting to delete duplicate rows from '{$table_name}'...\n";
            echo "  - Running query: {$sql_delete_duplicates}\n"; // 디버깅을 위해 쿼리 출력
            if ($conn->query($sql_delete_duplicates) === TRUE) {
                $affected_rows = $conn->affected_rows;
                echo "  - Successfully deleted {$affected_rows} duplicate rows from '{$table_name}'.\n";
            } else {
                echo "  - ERROR deleting duplicates from '{$table_name}': " . $conn->error . "\n";
            }

            // --- 중복 정리 후, UNIQUE INDEX 추가 (기존 add_unique_keys 스크립트 로직) ---
            $sql_check_index = "SHOW INDEX FROM `{$table_name}` WHERE Key_name = '{$index_name}'";
            $result_check_index = $conn->query($sql_check_index);

            if ($result_check_index && $result_check_index->num_rows > 0) {
                echo "  - Index '{$index_name}' already exists on '{$table_name}'. Skipping adding index.\n";
            } else {
                $columns_quoted_for_index = array_map(function($col){ return "`{$col}`"; }, $columns_to_index);
                $sql_alter_table = "ALTER TABLE `{$table_name}` ADD UNIQUE INDEX `{$index_name}` (" . implode(', ', $columns_quoted_for_index) . ")";

                echo "  - Executing: {$sql_alter_table}\n";
                if ($conn->query($sql_alter_table) === TRUE) {
                    echo "  - Successfully added UNIQUE INDEX '{$index_name}' to '{$table_name}'.\n";
                } else {
                    echo "  - ERROR adding UNIQUE INDEX to '{$table_name}': " . $conn->error . "\n";
                }
            }
        }
    } else {
        echo "No tables found matching pattern '{$prefix}%'\n";
    }
}

// 4. 데이터베이스 연결 닫기
$conn->close();

echo "\nScript finished.\n";
?>