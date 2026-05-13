<?php
/**
 * 매물 요약 - AI 특장점 자동 생성 API
 * POST /front/back/summary/ai_generate.php
 *
 * 지원 AI 엔진:
 *   - chatgpt (OpenAI ChatGPT, 기본값)
 *   - gemini (Google Gemini)
 *   - huggingface (HuggingFace Inference API)
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// .env 로드 (Dotenv 라이브러리 사용 - 프로젝트 공통 패턴)
include ($_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php');
require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

// AI API 키 (.env에서 읽기)
$OPENAI_API_KEY = $_ENV['OPENAI_API_KEY'] ?? '';
$GEMINI_API_KEY = $_ENV['GEMINI_API_KEY'] ?? '';
$HUGGINGFACE_API_KEY = $_ENV['HUGGINGFACE_API_KEY'] ?? '';

// 입력 파싱
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['statusCode' => 400, 'message' => '입력 데이터가 없습니다.', 'data' => null]);
    exit;
}

$estateType     = $input['estateType'] ?? '';
$address        = $input['address'] ?? '';
$addressDetail  = $input['addressDetail'] ?? '';
$sido           = $input['sido'] ?? '';
$sigungu        = $input['sigungu'] ?? '';
$landArea       = floatval($input['landArea'] ?? 0);
$buildingArea   = floatval($input['buildingArea'] ?? 0);
$totalFloorArea = floatval($input['totalFloorArea'] ?? 0);
$price          = intval($input['price'] ?? 0);
$priceText      = $input['priceText'] ?? '';
$exchangeYn     = $input['exchangeYn'] ?? '불가';
$aiProvider     = $input['aiProvider'] ?? 'gemini';

$fullAddress = $address . ($addressDetail ? ' ' . $addressDetail : '');

// 프롬프트 생성
$prompt = buildPrompt($estateType, $fullAddress, $sido, $sigungu, $landArea, $buildingArea, $totalFloorArea, $price, $priceText, $exchangeYn);

// AI 호출
$aiResult = null;
$errorMsg = '';

if ($aiProvider === 'chatgpt' && $OPENAI_API_KEY) {
    $aiResult = callOpenAI($OPENAI_API_KEY, $prompt);
} elseif ($aiProvider === 'gemini' && $GEMINI_API_KEY) {
    $aiResult = callGemini($GEMINI_API_KEY, $prompt);
} elseif ($aiProvider === 'huggingface' && $HUGGINGFACE_API_KEY) {
    $aiResult = callHuggingFace($HUGGINGFACE_API_KEY, $prompt);
} else {
    // API 키 미설정 시 기본 분석 결과 반환
    $aiResult = generateFallback($estateType, $fullAddress, $sido, $sigungu, $landArea, $buildingArea, $totalFloorArea, $price, $exchangeYn);
    $errorMsg = 'AI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY, GEMINI_API_KEY 등을 추가하세요.';
}

if ($aiResult === null) {
    $aiResult = generateFallback($estateType, $fullAddress, $sido, $sigungu, $landArea, $buildingArea, $totalFloorArea, $price, $exchangeYn);
    if (!$errorMsg) {
        $errorMsg = 'AI 호출 실패, 기본 분석 결과를 제공합니다.';
    }
}

echo json_encode([
    'statusCode' => 200,
    'message' => $errorMsg ?: '성공',
    'data' => [
        'features' => $aiResult,
        'provider' => $aiProvider
    ]
], JSON_UNESCAPED_UNICODE);
exit;


// ===== 프롬프트 빌드 =====
function buildPrompt($estateType, $address, $sido, $sigungu, $landArea, $buildingArea, $totalFloorArea, $price, $priceText, $exchangeYn) {
    $info = "매물유형: {$estateType}\n소재지: {$address}\n";
    if ($landArea > 0) $info .= "토지면적: {$landArea}평\n";
    if ($buildingArea > 0) $info .= "건축면적: {$buildingArea}평\n";
    if ($totalFloorArea > 0) $info .= "연면적: {$totalFloorArea}평\n";
    $info .= "매매가격: {$priceText} ({$price}원)\n";
    if ($landArea > 0 && $price > 0) {
        $perPyeong = round($price / $landArea);
        $info .= "평당가: 약 " . number_format($perPyeong) . "원\n";
    }
    $info .= "교환가능여부: {$exchangeYn}\n";

    return <<<PROMPT
당신은 한국 부동산 전문 분석가입니다. 아래 매물 정보를 바탕으로 해당 매물의 특장점을 6개 항목으로 분석해 주세요.

각 항목은 다음 형식으로 작성해 주세요:
<strong>항목명:</strong> 설명 내용

분석 항목 예시: 입지, 면적, 평당가, 교통, 교환 거래, 개발 전망, 활용 용도 등

매물 정보:
{$info}

반드시 한국어로 작성하고, 각 항목을 줄바꿈으로 구분해 주세요.
HTML 태그는 <strong>만 사용하세요.
PROMPT;
}


// ===== Google Gemini API =====
function callGemini($apiKey, $prompt) {
    // 모델: gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro 등 변경 가능
    $model = 'gemini-2.0-flash';
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . $apiKey;

    $payload = [
        'contents' => [
            ['parts' => [['text' => $prompt]]]
        ],
        'generationConfig' => [
            'temperature' => 0.7,
            'maxOutputTokens' => 1024
        ]
    ];

    $response = httpPost($url, $payload);
    if (!$response) {
        error_log("[callGemini] httpPost returned empty/null");
        return null;
    }

    $data = json_decode($response, true);
    if (!$data || !isset($data['candidates'][0]['content']['parts'][0]['text'])) {
        error_log("[callGemini] unexpected response: " . substr($response, 0, 500));
        return null;
    }

    $text = $data['candidates'][0]['content']['parts'][0]['text'];
    return parseAiResponse($text);
}


// ===== HuggingFace Inference API =====
function callHuggingFace($apiKey, $prompt) {
    $url = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

    $payload = [
        'inputs' => $prompt,
        'parameters' => [
            'max_new_tokens' => 1024,
            'temperature' => 0.7
        ]
    ];

    $headers = [
        'Authorization: Bearer ' . $apiKey
    ];

    $response = httpPost($url, $payload, $headers);
    if (!$response) return null;

    $data = json_decode($response, true);
    if (!$data || !isset($data[0]['generated_text'])) {
        return null;
    }

    $text = $data[0]['generated_text'];
    // 프롬프트 이후 응답만 추출
    $promptEnd = strpos($text, "HTML 태그는 <strong>만 사용하세요.");
    if ($promptEnd !== false) {
        $text = substr($text, $promptEnd + strlen("HTML 태그는 <strong>만 사용하세요."));
    }
    return parseAiResponse($text);
}


// ===== OpenAI ChatGPT API =====
function callOpenAI($apiKey, $prompt) {
    // 모델: gpt-4o-mini (저렴+고성능), gpt-4o, gpt-3.5-turbo 등 변경 가능
    $model = 'gpt-4o-mini';
    $url = "https://api.openai.com/v1/chat/completions";

    $payload = [
        'model' => $model,
        'messages' => [
            ['role' => 'system', 'content' => '당신은 한국 부동산 전문 분석가입니다. 반드시 한국어로 답변하세요.'],
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.7,
        'max_tokens' => 1024
    ];

    $headers = [
        'Authorization: Bearer ' . $apiKey
    ];

    $response = httpPost($url, $payload, $headers);
    if (!$response) {
        error_log("[callOpenAI] httpPost returned empty/null");
        return null;
    }

    $data = json_decode($response, true);
    if (!$data || !isset($data['choices'][0]['message']['content'])) {
        error_log("[callOpenAI] unexpected response: " . substr($response, 0, 500));
        return null;
    }

    $text = $data['choices'][0]['message']['content'];
    return parseAiResponse($text);
}


// ===== AI 응답 파싱 =====
function parseAiResponse($text) {
    $text = trim($text);
    $lines = preg_split('/\n+/', $text);
    $features = [];

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '') continue;
        // 번호 매기기 제거 (1. 2. 등)
        $line = preg_replace('/^\d+[\.\)]\s*/', '', $line);
        // 마크다운 볼드를 HTML로 변환
        $line = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $line);
        // 불릿 기호 제거
        $line = preg_replace('/^[\-\*\•]\s*/', '', $line);
        // <strong> 태그가 포함된 의미있는 줄만 수집
        if (strlen($line) > 10) {
            $features[] = $line;
        }
    }

    return count($features) > 0 ? array_slice($features, 0, 8) : null;
}


// ===== 기본 분석 결과 (API 키 미설정 또는 실패 시) =====
function generateFallback($estateType, $address, $sido, $sigungu, $landArea, $buildingArea, $totalFloorArea, $price, $exchangeYn) {
    $features = [];
    $location = $sido ? $sido . ' ' . $sigungu : $address;

    $features[] = "<strong>입지:</strong> {$location} 소재 {$estateType} 매물로, 해당 지역의 부동산 시장 동향을 확인해 보시기 바랍니다.";

    if ($landArea > 0) {
        $features[] = "<strong>토지면적:</strong> {$landArea}평 (약 " . number_format($landArea * 3.305785, 2) . "m²) 규모의 토지입니다.";
        if ($price > 0) {
            $perPyeong = round($price / $landArea);
            $features[] = "<strong>평당가:</strong> 약 " . number_format($perPyeong) . "원/평 수준입니다.";
        }
    }

    if ($buildingArea > 0) {
        $features[] = "<strong>건축면적:</strong> {$buildingArea}평 (약 " . number_format($buildingArea * 3.305785, 2) . "m²) 규모의 건축물입니다.";
    }

    if ($totalFloorArea > 0) {
        $features[] = "<strong>연면적:</strong> {$totalFloorArea}평 (약 " . number_format($totalFloorArea * 3.305785, 2) . "m²) 규모입니다.";
    }

    if ($exchangeYn === '가능') {
        $features[] = "<strong>교환 거래:</strong> 교환이 가능하여 현금 외 부동산 교환을 통한 유연한 거래 구조 설계가 가능합니다.";
    }

    $features[] = "<strong>참고:</strong> AI API 키 설정 후 더 상세한 입지 분석, 교통, 개발 전망 등의 정보를 자동으로 확인하실 수 있습니다.";

    return $features;
}


// ===== HTTP POST 유틸 =====
function httpPost($url, $payload, $extraHeaders = []) {
    $ch = curl_init($url);
    $jsonPayload = json_encode($payload, JSON_UNESCAPED_UNICODE);

    $headers = array_merge([
        'Content-Type: application/json',
        'Content-Length: ' . strlen($jsonPayload)
    ], $extraHeaders);

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $jsonPayload,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => false
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error || $httpCode >= 400) {
        error_log("AI API 호출 실패: HTTP {$httpCode}, Error: {$error}, Response: " . substr($response, 0, 300));
        return null;
    }

    return $response;
}
