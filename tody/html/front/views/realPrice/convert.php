<?php
// 변환할 HTML 파일 경로
$htmlFile = __DIR__ . '/testresult.html';  // 슬래시 추가

// 변환된 이미지가 저장될 경로
$outputImage = __DIR__ . '/map_capture.jpg';  // 슬래시 추가

// wkhtmltoimage 명령어 실행
$command = "wkhtmltoimage $htmlFile $outputImage";
$output = shell_exec($command);

// 결과 확인
if (file_exists($outputImage)) {
    echo "이미지가 성공적으로 생성되었습니다: <a href='map_capture.jpg'>이미지 다운로드</a>";
} else {
    echo "이미지 생성에 실패했습니다.";
}
?>
