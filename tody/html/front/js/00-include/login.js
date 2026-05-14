// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(function () {
    // 로그인 버튼 클릭 이벤트
    $(document).on("click", "#login_btn", function () {
        login();
    });

    // 로그인 input에서 엔터 키 입력시 로그인 이벤트
    $(document).on("keyup", "#login_id, #login_pw", function (event) {
        if (event.key === "Enter") {
            login();
        }
    });

    // 카카오 로그인 초기화
    kakaoLogin();

    // 네이버 로그인 초기화
    naverLogin();

    window.addEventListener(
        "message",
        function (event) {
            if (event.origin !== window.location.origin) return;

            const messageData = event.data;

            // 카카오 로그인 성공 메시지 처리
            if (messageData && messageData.type === 'kakaoLoginSuccess' && messageData.userId) {
                onLoginSuccess(messageData.userId);
                window.handleLoginSuccess(messageData.userId);
                location.reload();
            }
            // 네이버 로그인 성공 메시지 처리
            else if (messageData && messageData.type === 'naverLoginSuccess' && messageData.userId) {
                onLoginSuccess(messageData.userId);
                window.handleLoginSuccess(messageData.userId);
                location.reload();
            }
        },
        false
    );
});

async function login(force) {
    const id       = $("#login_id").val();
    const password = $("#login_pw").val();

    if (!id) {
        sweetAlertMessage("아이디를 입력하세요.", "", "w");
        $("#login_id").focus();
        return;
    }
    if (!password) {
        sweetAlertMessage("비밀번호를 입력하세요.", "", "w");
        $("#login_pw").focus();
        return;
    }

    if (typeof currentClientSessionId === 'undefined' || currentClientSessionId === null) {
        if (typeof initializeClientSessionId === 'function') {
            await initializeClientSessionId();
        }
    }

    const dataObj = {
        id:              encodeURIComponent(id),
        password:        encodeURIComponent(password),
        force:           force ? 'true' : 'false',
        clientSessionId: (typeof currentClientSessionId !== 'undefined') ? currentClientSessionId : '',
    };

    const result = await callApi("POST", "/front/back/00-include/login.php", dataObj);
    if (!result) return;

    const { statusCode, message, responseData } = result;

    // 중복 접속 감지 — 사용자 확인 후 강제 진행
    if (statusCode === 409 && message === 'DUPLICATE_SESSION') {
        const deviceLabel = responseData.deviceType === 'MOBILE' ? '모바일' : 'PC';
        const confirmed = await Swal.fire({
            title:              '이미 접속 중입니다',
            html:               `다른 ${deviceLabel}에서 이미 접속 중입니다.<br>계속 진행하면 <b>이전 접속이 끊어집니다.</b>`,
            icon:               'warning',
            showCancelButton:   true,
            confirmButtonText:  '계속 진행',
            cancelButtonText:   '취소',
            confirmButtonColor: '#d33',
        });

        if (confirmed.isConfirmed) {
            await login(true); // force=true 로 재시도
        }
        return;
    }

    const alertResult = await loginHandleError(message, statusCode);
    if (!alertResult) return;

    const { userNo, userToken, name, agency_name, role, status, userId, sessionToken } = responseData;

    // 쿠키 설정
    setCookie("user_no",           userNo);
    setCookie("user_token",        userToken);
    setCookie("user_name",         role == "001" ? encodeURIComponent(name) : role == "002" ? encodeURIComponent(agency_name) : encodeURIComponent(name));
    setCookie("user_role",         encodeURIComponent(role));
    setCookie("user_id",           userId);
    setCookie("user_session_token", sessionToken);

    if (userNo && typeof window.handleLoginSuccess === 'function' && userId) {
        await window.handleLoginSuccess(userId);
    }

    location.reload();
}

/**
 * 카카오 로그인 초기화 함수
 */
function kakaoLogin() {
    const serviceKey  = "847d6b0bbbc2dbfe6b7c0c1f82d8cd71";
    const redirectPath = "/front/views/callback/kakao.html";
    const redirectUri  = window.location.origin + (location.port ? ":" + location.port : "") + redirectPath;
    const nonce        = generateNonce(16);

    Kakao.init(serviceKey);
    Kakao.isInitialized();

    $("#kakao_login_btn").on("click", function () {
        const authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${serviceKey}&redirect_uri=${encodeURIComponent(redirectUri)}&prompt=login&nonce=${nonce}`;
        window.open(authUrl, "kakao_login", "width=500,height=600");
    });
}

// 네이버 로그인 초기화 함수
function naverLogin() {
    const clientId    = "51uqj3T1dAORiqMsBTFv";
    const callbackPath = "/front/views/callback/naver.html";
    const callbackUrl  = window.location.origin + (location.port ? ":" + location.port : "") + callbackPath;

    var naverLogin = new naver.LoginWithNaverId({
        clientId:    clientId,
        callbackUrl: callbackUrl,
        isPopup:     true,
    });

    naverLogin.init();
}

// 로그인 오류 처리 함수
async function loginHandleError(message, statusCode) {
    switch (statusCode) {
        case 200:
            return true;
        case 400:
            sweetAlertMessage("아이디와 비밀번호를 입력하세요.", "", "w");
            return false;
        case 401:
            sweetAlertMessage(message, "", "w");
            return false;
        case 403:
            sweetAlertMessage(message + " 유저입니다.", "", "w");
            return false;
        default:
            sweetAlertMessage(message, "", "e");
            return false;
    }
}

function generateNonce(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let nonce = "";
    for (let i = 0; i < length; i++) {
        nonce += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return nonce;
}
