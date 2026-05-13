<?php
// add_unique_keys_to_realprice_tables.php
// 스크립트를 이용한 UNIQUE 키 일괄 추가 방법:
// 1. 데이터베이스 연결 설정

$script_root = dirname(__FILE__); // /var/www/tody/html/front/back/admin/
$project_base = dirname($script_root, 1); // /var/www/tody/html/front/back/ (admin에서 2단계 위로)

require_once $project_base . '/00-include/dbconnect.php';
require_once $project_base . '/00-include/common.php';
require_once $project_base . '/admin/batch_helpers.php'; // admin 폴더도 common.php와 같은 레벨에 있으니 경로 수정

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$conn->set_charset("utf8mb4");

echo "Database connected successfully.\n";

// 2. UNIQUE 키를 추가할 테이블 패턴 및 컬럼 정의
//    여기에 테이블 타입별 UNIQUE 키 컬럼 조합을 정의합니다.
//    이전에 제안 드린 조합을 바탕으로 예시를 만듭니다.
$table_patterns = [
    'apt' => [
        'prefix' => 'realPrice_apt_',
        'columns' => ['pnu', 'aptNm', 'dealYear', 'dealMonth', 'dealDay', 'excluUseAr', 'floor', 'dealAmount'],
        'index_name' => 'ux_apt_trade'
    ],
    'land' => [
        'prefix' => 'realPrice_land_',
        'columns' => ['pnu', 'dealYear', 'dealMonth', 'dealDay', 'dealArea', 'dealAmount', 'shareDealingType'],
        'index_name' => 'ux_land_trade'
    ],
    'multiFamily' => [ // multiFamily 또는 apt-mf-xx 테이블 이름 패턴에 따라 prefix 조정
        'prefix' => 'realPrice_multiFamily_', // 또는 'realPrice_apt-mf_'
        'columns' => ['pnu', 'mhouseNm', 'dealYear', 'dealMonth', 'dealDay', 'excluUseAr', 'floor', 'dealAmount'],
        'index_name' => 'ux_mf_trade'
    ],
    'officetel' => [ // officetel 또는 apt-ot-xx 테이블 이름 패턴에 따라 prefix 조정
        'prefix' => 'realPrice_officetel_', // 또는 'realPrice_apt-ot_'
        'columns' => ['pnu', 'offiNm', 'dealYear', 'dealMonth', 'dealDay', 'excluUseAr', 'floor', 'dealAmount'],
        'index_name' => 'ux_offi_trade'
    ],
    // 다른 부동산 유형이 있다면 여기에 추가하세요.
];

// 3. 각 테이블 패턴에 따라 UNIQUE 키 추가
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

            echo "\nProcessing table: {$table_name}\n";

            // 해당 테이블에 UNIQUE INDEX가 이미 존재하는지 확인 (선택 사항이지만 안전)
            $sql_check_index = "SHOW INDEX FROM `{$table_name}` WHERE Key_name = '{$index_name}'";
            $result_check_index = $conn->query($sql_check_index);

            if ($result_check_index && $result_check_index->num_rows > 0) {
                echo "  - Index '{$index_name}' already exists on '{$table_name}'. Skipping.\n";
            } else {
                // ALTER TABLE SQL 생성
                $columns_quoted = array_map(function($col){ return "`{$col}`"; }, $columns_to_index);
                $sql_alter_table = "ALTER TABLE `{$table_name}` ADD UNIQUE INDEX `{$index_name}` (" . implode(', ', $columns_quoted) . ")";

                echo "  - Executing: {$sql_alter_table}\n";

                // SQL 실행
                if ($conn->query($sql_alter_table) === TRUE) {
                    echo "  - Successfully added UNIQUE INDEX '{$index_name}' to '{$table_name}'.\n";
                } else {
                    echo "  - ERROR adding UNIQUE INDEX to '{$table_name}': " . $conn->error . "\n";
                    // 만약 특정 테이블에서 오류가 나더라도 다른 테이블 처리를 계속할지, 아니면 중단할지 결정할 수 있습니다.
                    // 여기서는 오류가 나도 계속 진행하도록 합니다.
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