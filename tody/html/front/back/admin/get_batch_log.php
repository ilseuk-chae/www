<?php
// get_batch_log.php
// 이 파일은 백그라운드 배치 스크립트의 로그를 웹에서 조회할 수 있도록 제공합니다.

// HTTP 응답 헤더를 일반 텍스트로 설정
header('Content-Type: text/plain; charset=UTF-8');

// 로그 파일 경로 설정
// 이 파일(get_batch_log.php)과 배치 스크립트(emd_cache_batch_output.log)가 동일한 디렉토리에 있다고 가정합니다.
// 로그 파일 경로 설정
// 현재 스크립트 위치: /www/tody/html/front/back/admin/
// 목표 로그 폴더:    /www/tody/logs/
$logFilePath = __DIR__ . '/../../../../logs/emd_cache_batch_output.log'; // <-- 이 부분을 수정했습니다.

// 로그 파일이 존재하는지, 읽기 가능한지 확인
if (file_exists($logFilePath) && is_readable($logFilePath)) {
    // 파일 내용을 읽어서 출력
    // readfile() 함수는 파일을 읽고 버퍼로 출력하며, 실패 시 false 반환
    if (!readfile($logFilePath)) {
        echo "오류: 로그 파일을 읽을 수 없습니다. 파일 권한을 확인하세요.";
    }
} else {
    // 파일이 존재하지 않거나 읽기 불가능한 경우 메시지 출력
    echo "로그 파일이 존재하지 않거나 접근할 수 없습니다. 경로: " . $logFilePath;
}

// 스크립트 종료
exit();
?>