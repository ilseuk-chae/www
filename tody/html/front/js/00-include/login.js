// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(function () {
    // 아이디 기억 (필요시 주석 해제)
    // const rememberChk = $("#auth-remember-check");
    // const rememberId = getCookie("remember_sa_id");
    // if (rememberId) {
    //     $("#user_id").val(decodeURIComponent(rememberId));
    //     rememberChk.prop("checked", true);
    // }

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
                //console.log('Kakao login: userNo received for onLoginSuccess:', messageData.userId);
                onLoginSuccess(messageData.userId);
                window.handleLoginSuccess(messageData.userId); // userId는 `varchar(100)`에 맞는 ID 형식
                location.reload(); // 새로고침은 여기서 하는 것이 일관적입니다.
            }
            // 네이버 로그인 성공 메시지 처리
            else if (messageData && messageData.type === 'naverLoginSuccess' && messageData.userId) {
                //console.log('Naver login: userId received for onLoginSuccess:', messageData.userId);
                onLoginSuccess(messageData.userId);
                window.handleLoginSuccess(messageData.userId); // userId는 `varchar(100)`에 맞는 ID 형식
                location.reload(); // 새로고침은 여기서 하는 것이 일관적입니다.
            }
        },
        false
    );
    // !!! 새로 추가되는 부분 끝 !!!
});

async function login() {
    const id = $("#login_id").val();
    const password = $("#login_pw").val();

    // client.js에서 초기화된 currentClientSessionId를 가져옵니다.
    // client.js가 먼저 로드되고 initializeClientSessionId()가 호출되어 currentClientSessionId가 설정되어 있어야 합니다.
    // 만약 currentClientSessionId가 아직 설정되지 않았다면, initializeClientSessionId()를 호출하여 강제로 초기화합니다.
    if (typeof currentClientSessionId === 'undefined' || currentClientSessionId === null) {
        console.warn("login(): currentClientSessionId is not initialized, attempting to initialize...");
        await initializeClientSessionId(); // client.js의 함수 호출 (await 필수)
        if (currentClientSessionId === null) { // 초기화 후에도 null이면 문제
            alert("방문 세션 ID 초기화에 실패했습니다. 다시 시도해 주세요.");
            return;
        }
    }

    const dataObj = { 
        id: encodeURIComponent(id), 
        password: encodeURIComponent(password),
        // 새로 추가된 파라미터: clientSessionId를 로그인 시 서버로 함께 보냅니다.
        // 이를 통해 서버 측 로그인 처리 로직에서도 clientSessionId를 사용하여 추가 작업을 수행할 수 있습니다.
        clientSessionId: currentClientSessionId 
    };

    const result = await callApi("POST", "/front/back/00-include/login.php", dataObj);

    if (!result) {
        alert("로그인 처리 결과가 없습니다.");
        return;
    }
    
    const { statusCode, message, responseData } = result;
    const alertResult = await loginHandleError(message, statusCode);
    if (!alertResult) return;

    const { userNo, userToken, name, agency_name, role, status, userId } = responseData;


    // 쿠키 설정
    setCookie("user_no", userNo);
    setCookie("user_token", userToken);
    setCookie("user_name", role == "001" ? encodeURIComponent(name) : role == "002" ? encodeURIComponent(agency_name) : encodeURIComponent(name));
    setCookie("user_role", encodeURIComponent(role));
    setCookie("user_id", userId);
    // 아이디 기억 (필요시 주석 해제)
    // if ($("#auth-remember-check").prop("checked")) {
    //     setCookie("remember_sa_id", encodeURIComponent(id));
    // } else {
    //     deleteCookie("remember_sa_id");
    // }

    // --- 여기에 onLoginSuccess 호출 ---
    // 기존 onLoginSuccess 로직 (새로운 추적 시스템과 별개로 작동하는 기존 로직이라고 가정)
    // 일반적으로는 id (로그인 ID) 대신 userNo나 userId (실제 사용자 PK)를 넘기는 것이 좋습니다.
    if (userNo) { // userNo가 실제 사용자를 식별하는 키라고 가정합니다.
        // 기존 시스템의 onLoginSuccess 호출
        // onLoginSuccess(userNo); 
        // 만약 기존 onLoginSuccess가 user_id를 필요로 한다면 onLoginSuccess(userId); 로 변경

        // 새로운 방문 추적 시스템에 로그인 성공을 알립니다.
        // client.js의 handleLoginSuccess 함수를 호출합니다.
        // 이 함수는 user_visits, user_total_durations 테이블 업데이트를 트리거합니다.
        if (typeof window.handleLoginSuccess === 'function' && userId) {
            await window.handleLoginSuccess(userId); 
        } else {
            console.warn("client.js의 handleLoginSuccess 함수를 찾을 수 없거나 userId가 유효하지 않습니다. 방문자 추적 업데이트가 누락될 수 있습니다.");
        }
    }

    location.reload();

    // 주의사항:
    // 1. initializeClientSessionId() 함수가 정의된 client.js 파일이 이 login() 함수보다 먼저 로드되어야 합니다.
    // 2. handleLoginSuccess() 함수도 client.js에 정의되어 있으므로, client.js 로드 순서가 중요합니다.
    // 3. onLoginSuccess(id)는 기존 시스템에 특화된 함수라고 가정하며, 이 호출은 변경하지 않았습니다.
    //    다만, 새로운 방문 추적 시스템의 handleLoginSuccess에는 정확한 사용자 식별자(userId)를 전달합니다.
    //    (userNo는 내부적인 PK일 수 있고, userId는 SNS 로그인 등에 사용되는 외부 식별자일 수 있으므로 구분)
}

/**
 * 카카오 로그인 초기화 함수
 */
function kakaoLogin() {
    // SDK 초기화
    const serviceKey = "847d6b0bbbc2dbfe6b7c0c1f82d8cd71"; //orginal
    //const serviceKey = "9b6daa25fe1bfdc411ee3e7ddd88121d";  //it7
    const redirectPath = "/front/views/callback/kakao.html";
    const redirectUri = window.location.origin + (location.port ? ":" + location.port : "") + redirectPath;
    const nonce = generateNonce(16); // 16자리 nonce 생성
    
    Kakao.init(serviceKey);
    //console.log(Kakao.isInitialized()); // 이 값이 true여야 합니다.
    Kakao.isInitialized();
    
    $("#kakao_login_btn").on("click", function () {
        // const authUrl = Kakao.Auth.authorize({
        //     redirectUri: redirectUri, // 인가 코드를 전달받을 서비스 서버의 URI
        //     throughTalk: true, // 간편로그인 사용 여부 (기본값: true)
        //     nonce: nonce, // ID 토큰 유효성 검증 시 대조할 임의의 문자열(정해진 형식 없음)
        //     prompt: "select_account",
        // });

        // 인증 URL 생성
        //const authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${serviceKey}&redirect_uri=${encodeURIComponent(redirectUri)}&prompt="select_account"&nonce=${nonce}`;

        const authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${serviceKey}&redirect_uri=${encodeURIComponent(redirectUri)}&prompt=login&nonce=${nonce}`;
//                                                                                   👆 "select_account" 대신 "login"으로 변경하고 따옴표 제거

        // 팝업 창 열기
        const popup = window.open(authUrl, "kakao_login", "width=500,height=600");

        const test1 = popup;
        // 팝업 창에서 인증 완료 후 부모 창으로 결과 전달
        //window.addEventListener(
        //    "message",
        //    function (event) {
        //        if (event.origin !== window.location.origin) return;

        //        const userData = event.data;
        //        console.log("Received user data from popup:", userData);
        //        // 사용자 정보를 활용한 추가 작업 수행
        //    },
        //    false
        //);
      
    });
/*  추후 참고용
    $("#kakao_login_btn").on("click", function () {
        
        Kakao.Auth.authorize({
            redirectUri: redirectUri, // 인가 코드를 전달받을 서비스 서버의 URI
            throughTalk: false, // 카카오톡으로 간편 로그인 사용 여부 (기본값: true)
            nonce: nonce, // ID 토큰 유효성 검증 시 대조할 임의의 문자열
            prompt: 'select_account', // 계정 선택 팝업 강제 (선택 사항)
            //scope: 'profile_nickname, profile_image, account_email' // 필요한 동의 항목
            scope: 'name, phone_number, account_email' // 필요한 동의 항목
            // 그 외 추가 파라미터 (예: state, login_hint 등)
        })
        .then(function (response) {
            console.log("Kakao authorize success:", response);
            // 인가 코드 받기 성공 후 redirectUri로 이동
            // redirectUri에서 인가 코드를 받아 토큰 요청
        })
        .catch(function (error) {
            console.error("Kakao authorize error:", error);
            // 에러 처리
        });

    });
*/
}


// 네이버 로그인 초기화 함수
function naverLogin() {
    const clientId = "51uqj3T1dAORiqMsBTFv";
    const callbackPath = "/front/views/callback/naver.html";
    const callbackUrl = window.location.origin + (location.port ? ":" + location.port : "") + callbackPath;

    var naverLogin = new naver.LoginWithNaverId({
        clientId: clientId,
        callbackUrl: callbackUrl,
        isPopup: true,
        // loginButton: { color: "green", type: 3, height: 60 },
    });

    /* (4) 네아로 로그인 정보를 초기화하기 위하여 init을 호출 */
    naverLogin.init();

    /* (4-1) 임의의 링크를 설정해줄 필요가 있는 경우 */
    // $("#naver_login_btn").attr("href", naverLogin.generateAuthorizeUrl());
}

// 로그인 오류 처리 함수
async function loginHandleError(message, statusCode, data) {
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

/**
 * 로그인을 위해 임의의 문자열 생성
 * @param {*} length
 * @returns
 */
function generateNonce(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let nonce = "";
    for (let i = 0; i < length; i++) {
        nonce += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return nonce;
}
