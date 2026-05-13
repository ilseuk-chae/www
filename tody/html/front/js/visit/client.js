// 파일 위치: front\back\visit\client.js

// 방문 추적을 위한 전역 변수
let currentClientSessionId = null;
let currentUserId = null; // 로그인한 사용자의 ID (SNS ID)
let lastUpdateTime = Date.now(); // 마지막으로 update_visit_time.php를 호출한 시점 (밀리초)
const VISIT_UPDATE_INTERVAL_SECONDS = 60; // 서버로 업데이트 보낼 주기 (초)

// ----------------------------------------------------
// 유틸리티 함수 (공통 사용)
// ----------------------------------------------------

// 쿠키에서 특정 이름의 값을 가져오는 함수
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// 쿠키에 값을 설정하는 함수
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax; Secure`; // Secure 속성 추가
}

// ----------------------------------------------------
// 페이지별 제목을 분류하는 로직 (PHP와 동일하게 맞춰야 함)
// ----------------------------------------------------
function getCategorizedPageTitle(url, defaultTitle) {
    const path = new URL(url).pathname;
    let pageTitle = defaultTitle;

    if (path === '/' || path.includes('/index.html')) {
        pageTitle = '메인';
    } else if (path.includes('/front/views/realPrice')) {
        pageTitle = '실거래가';
    } else if (path.includes('/front/views/sell')) {
        pageTitle = '매물정보';
    } else if (path.includes('/front/views/find')) {
        pageTitle = '삽니다';
    } else if (path.includes('/front/views/put')) {
        pageTitle = '팝니다';
    } else if (path.includes('/front/views/finance')) {
        pageTitle = '금융지원';
    } else if (path.includes('/front/views/support')) {
        pageTitle = '제휴/제안';
    } else if (path.includes('/front/views/mypage') || path.includes('/front/views/member')) {
        pageTitle = '나의정보';
    }
    // 기본값은 클라이언트가 보낸 defaultTitle (document.title 등) 그대로 사용
    return pageTitle;
}

// ----------------------------------------------------
// API 호출 함수
// ----------------------------------------------------
async function callVisitApi(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            //console.error(`Visit API call failed: ${url} status ${response.status}`);
            return null;
        }
        const jsonResponse = await response.json();
        if (jsonResponse.status !== 'success') {
            console.warn(`Visit API call reported non-success: ${url}, Message: ${jsonResponse.message}`);
        }
        return jsonResponse;
    } catch (error) {
        console.error(`Error calling Visit API: ${url}`, error);
        return null;
    }
}

// ----------------------------------------------------
// 핵심 방문 추적 로직
// ----------------------------------------------------

// 1. client_session_id 초기화
async function initializeClientSessionId() {
    // 1-1. 클라이언트 쿠키에서 client_session_id를 먼저 시도
    let storedSessionId = getCookie('client_session_id');

    if (storedSessionId) {
        currentClientSessionId = storedSessionId;
        //console.log('client.js: Existing client_session_id from cookie:', currentClientSessionId);
    } else {
        //console.log('client.js: No client_session_id cookie found, requesting new ID from server.');
        // 1-2. 서버 (PHP)에 새로운 client_session_id를 요청하고 쿠키에 저장
        const response = await callVisitApi('/front/back/visit2/get_or_create_client_session_id.php', {});
        if (response && response.status === 'success') {
            currentClientSessionId = response.clientSessionId;
            // setCookie 함수는 서버 응답 시점에 이미 서버에서 쿠키를 설정했으므로 여기서 다시 호출할 필요 없음
            //console.log('client.js: Server confirmed/generated client_session_id:', currentClientSessionId);
        } else {
            console.error('client.js: Failed to get or create client_session_id from server.');
            // 실패 시 임시로 고유 ID 생성 (매우 드물게 발생)
            currentClientSessionId = 'temp_' + Date.now() + Math.random().toString(36).substring(2, 8);
        }
    }
    // 1-3. 로그인된 userId를 로드 (예: 로그인 후 쿠키에 저장된 user_id)
    currentUserId = getCookie('user_id'); // 'user_id' 쿠키에서 로그인 ID를 가져온다고 가정

    // 모든 초기화 완료 후 방문 추적 시작
    startVisitTracking();
}

// 2. 주기적인 방문 시간 업데이트 시작
let visitTrackingInterval = null;
function startVisitTracking() {
    if (!currentClientSessionId) {
        console.warn("client.js: Cannot start visit tracking: client_session_id is not set.");
        return;
    }
    if (visitTrackingInterval) {
        clearInterval(visitTrackingInterval); // 이전에 시작된 인터벌이 있다면 중지
    }

    // 10초마다 (VISIT_UPDATE_INTERVAL_SECONDS) 서버로 현재 페이지 정보 업데이트
    visitTrackingInterval = setInterval(async () => {
        // --- 이 부분을 추가합니다! ---
        const now = Date.now(); // 현재 시점 (밀리초)
        const passedSeconds = Math.floor((now - lastUpdateTime) / 1000); // 이전 호출 이후 경과한 초
        lastUpdateTime = now; // 마지막 업데이트 시간 갱신
        //console.log(`client.js: setInterval 콜백 실행됨. passedSeconds: ${passedSeconds}`); // 추가된 로그

        //console.log(`client.js: setInterval 콜백 실행됨. clientSessionId: ${currentClientSessionId}, userId: ${currentUserId}`);
        // --- 추가 끝 ---
        const pageUrl = window.location.href;
        const pageTitle = getCategorizedPageTitle(pageUrl, document.title);

        const dataToSend = {
            clientSessionId: currentClientSessionId,
            userId: currentUserId, // 로그인되어 있으면 ID, 아니면 null
            pageUrl: pageUrl,
            pageTitle: pageTitle,
            passedSeconds: passedSeconds // <-- 이 값을 서버로 보냅니다!
        };
        const apiResponse = await callVisitApi('/front/back/visit2/update_visit_time.php', dataToSend);
        
        // --- 이 부분을 추가합니다! ---
        if (apiResponse) {
            //console.log(`client.js: update_visit_time.php 응답:`, apiResponse);
        } else {
            console.warn(`client.js: update_visit_time.php 호출 결과 응답 없음.`);
        }
        // --- 추가 끝 ---
    }, VISIT_UPDATE_INTERVAL_SECONDS * 1000); // 밀리초로 변환
    //console.log(`client.js: Started periodic visit tracking every ${VISIT_UPDATE_INTERVAL_SECONDS} seconds.`);

    // 초기 로드 시에도 한 번 업데이트 실행
    // --- 이 부분을 추가합니다! ---
    //console.log(`client.js: 초기 update_visit_time.php 호출.`);
    // --- 추가 끝 ---
    const pageUrl = window.location.href;
    const pageTitle = getCategorizedPageTitle(pageUrl, document.title);
    callVisitApi('/front/back/visit2/update_visit_time.php', {
        clientSessionId: currentClientSessionId,
        userId: currentUserId,
        pageUrl: pageUrl,
        pageTitle: pageTitle,
        passedSeconds: 0 // 첫 호출은 0초 경과로 보냄
    });
}

// 3. 페이지 전환 감지 및 업데이트 (SPA가 아니라면 필요 없을 수 있지만, 정확도를 위해 추가)
let previousPageUrl = window.location.href;
window.addEventListener('popstate', async () => {
    // 페이지 전환 발생 시, 이전 페이지의 duration을 즉시 업데이트하고 새 페이지 방문을 시작
    if (window.location.href !== previousPageUrl) {
        //console.log(`client.js: Page navigation detected from ${previousPageUrl} to ${window.location.href}`);
        // 이전 페이지 업데이트 (여기서도 update_visit_time.php가 새로운 visit 레코드를 만들 것임)
        await callVisitApi('/front/back/visit2/update_visit_time.php', {
            clientSessionId: currentClientSessionId,
            userId: currentUserId,
            pageUrl: previousPageUrl, // 이전 페이지 URL을 보냄으로써 이전 기록을 업데이트
            pageTitle: getCategorizedPageTitle(previousPageUrl, "Previous Page")
        });

        // 현재 페이지에 대한 업데이트 시작 (setInterval에 의해 자동으로 이루어짐)
        // setInterval 로직은 새로운 페이지 정보를 다음 업데이트 주기에 보낼 것
        previousPageUrl = window.location.href;
    }
});


// 4. 로그인 이벤트 핸들러 (로그인 성공 시 외부에서 호출될 함수)
// 예시: 카카오 로그인 성공 후 이 함수를 호출해야 함
window.handleLoginSuccess = async function (loggedInUserId) {
    //console.log('client.js: Login successful, updating user info.');
    currentUserId = loggedInUserId; // 로그인한 사용자의 ID로 업데이트
    setCookie('user_id', loggedInUserId, 30); // user_id를 쿠키에 30일간 저장 (선택 사항)

    const dataToSend = {
        clientSessionId: currentClientSessionId,
        userId: currentUserId,
        userType: 'registered'
    };
    await callVisitApi('/front/back/visit2/update_visit_user_info.php', dataToSend);

    // 로그인 후 바로 현재 페이지 방문 정보도 업데이트 (user_id가 이제 연결되었으므로)
    const pageUrl = window.location.href;
    const pageTitle = getCategorizedPageTitle(pageUrl, document.title);
    await callVisitApi('/front/back/visit2/update_visit_time.php', {
        clientSessionId: currentClientSessionId,
        userId: currentUserId,
        pageUrl: pageUrl,
        pageTitle: pageTitle
    });

    // 만약 주기 업데이트에 바로 반영되지 않을 수 있다면, 인터벌을 재시작할 수도 있음
    // startVisitTracking(); // (필요시 호출, currentUserId 변경사항 반영)
};

// 5. 로그아웃 이벤트 핸들러 (로그아웃 성공 시 외부에서 호출될 함수)
window.handleLogout = function () {
    //console.log('client.js: User logged out.');
    currentUserId = null; // userId 초기화
    setCookie('user_id', '', -1); // user_id 쿠키 삭제
    // 로그아웃 후에도 비회원(guest)으로 추적은 계속
    // 주기 업데이트가 자동으로 userId: null로 업데이트할 것
    // startVisitTracking(); // (필요시 호출, currentUserId 변경사항 반영)
};


// ----------------------------------------------------
// 페이지 로드 시 초기화
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', initializeClientSessionId);