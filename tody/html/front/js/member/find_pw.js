// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(document).ready(async function () {
    // 인증번호 발송 후 3분 카운팅 함수
    countTime();

    initEvent();
});

/**
 * 이벤트 모음 함수
 */
function initEvent() {
    $("#email_send_btn").on("click", function () {
        send_auth_code();
    });

    $("#check_btn").on("click", function () {
        auth_code_check();
    });
}

/**
 * 인증번호 발송 함수
 * @returns
 */
async function send_auth_code() {
    const email = $("#email");

    // ##################################
    // 유효성 검사 시작
    // ##################################
    let isValid = true;
    const fieldsToValidate = [{ input: email, type: "email", message: "이메일을 입력하세요." }];

    fieldsToValidate.forEach((field) => {
        isValid = validateInput(field.input, field.type, field.message) && isValid;
    });
    console.log(isValid);
    if (!isValid) {
        sweetAlertMessage("이메일을 입력하세요.", "", "w");
        return; // 폼 제출 방지
    }
    // ##################################
    // 유효성 검사 종료
    // ##################################

    const dataObj = {
        email: encodeURIComponent(email.val()),
    };

    //20250320_cis $("#email_send_btn").hide();
    $("#btn_spinner").removeClass("d-none");

    const result = await callApi("POST", "/front/back/oauth/auth_num_send.php", dataObj);
    const { statusCode, message, responseData } = result;
    if (statusCode == 200 && message == "SUCCESS") {
        sweetAlertMessage("인증번호가 발송되었습니다.", "", "s");
        //20250320_cis $("#email_send_group").hide();
        //20250320_cis $("#auth_code_group").show();

        // 3분 카운팅
        $(".certificationTime").attr("hidden", false); // 3분 카운트 보여줌
        $.closeTime(); // 기존의 setInterval 함수를 멈춤
        $.time(599); // 새로운 setInterval 함수 실행
    } else if (statusCode == 400) {
        sweetAlertMessage(message, "", "w");
        //20250320_cis change $("#email_send_group").show();
        //20250320_cis change $("#auth_code_group").hide();

        // 3분 카운팅
        // $(".certificationTime").attr("hidden", false); // 3분 카운트 보여줌
        // $.closeTime(); // 기존의 setInterval 함수를 멈춤
        // $.time(599); // 새로운 setInterval 함수 실행
    } else if (statusCode == 429 && message == "TOO_MANY_REQUESTS") {
        sweetAlertMessage("요청이 너무 많습니다. 10분 후에 다시 시도해주세요.", "", "e");
        //20250320_cis $("#email_send_group").show();
        //20250320_cis $("#auth_code_group").hide();

        // 3분 카운팅
        // $(".certificationTime").attr("hidden", false); // 3분 카운트 보여줌
        // $.closeTime(); // 기존의 setInterval 함수를 멈춤
        // $.time(599); // 새로운 setInterval 함수 실행
    } else {
        sweetAlertMessage("인증번호가 발송에 실패했습니다.", "", "e");
        //20250320_cis $("#email_send_group").show();
        //20250320_cis $("#auth_code_group").hide();
    }

    //20250320_cis $("#email_send_btn").show();
    $("#btn_spinner").addClass("d-none");
}

/**
 * 인증번호 확인 함수
 * @returns
 */
async function auth_code_check() {
    const remainTime = $(".certificationTime");
    const email = $("#email");
    const authCode = $("#auth_code");

    // ##################################
    // 유효성 검사 시작
    // ##################################
    if (remainTime.text() == "0:00") {
        sweetAlertMessage("유효시간이 경과했습니다. 인증번호를 다시 발송해주세요.", "", "w");
        $("#email_send_group").show();
        $("#auth_code_group").hide();
        return;
    }
    let isValid = true;
    const fieldsToValidate = [{ input: email, type: "email", message: "이메일을 입력하세요." }];
    fieldsToValidate.forEach((field) => {
        isValid = validateInput(field.input, field.type, field.message) && isValid;
    });
    if (!isValid) {
        sweetAlertMessage(fieldsToValidate.message, "", "w");
        return; // 폼 제출 방지
    }
    if (!authCode.val()) {
        sweetAlertMessage("인증번호를 입력하세요.", "", "w");
        return;
    }
    // ##################################
    // 유효성 검사 종료
    // ##################################

    const dataObj = {
        email: encodeURIComponent(email.val()),
        authCode: encodeURIComponent(authCode.val()),
    };

    const result = await callApi("POST", "/front/back/oauth/auth_code_check.php", dataObj);
    const { statusCode, message, responseData } = result;
    if (statusCode == 200 && message == "SUCCESS") {
        if (responseData.length == 0) {
            const alertResult = await sweetAlertForReturn(`가입된 회원정보를 찾을 수 없습니다.`, "", "w");
            return;
        }

        const index = responseData.findIndex((item) => item.platform === "general");
        if (index == -1) {
            const alertResult = await sweetAlertForReturn(`SNS로 가입한 회원입니다.`, "", "w");
            return;
        }

        const { platform, user_no } = responseData[index];
        if (platform == "general") {
            setCookie("user_no", user_no);
            location.href = `/front/views/member/find_pw_step02.html`;
        }

        // let alertResult;
        // if (alertResult) {
        //     location.href = "/index.html";
        // }
    } else {
        if (message == "AUTH_CODE_ERROR") {
            const alertResult = await sweetAlertForReturn(`인증번호가 일치하지 않습니다.`, "", "w");
        } else {
            const alertResult = await sweetAlertForReturn(`가입된 회원정보를 찾을 수 없습니다.`, "", "w");
        }
    }
}

/**
 * 3분 카운팅 함수
 */
function countTime() {
    // 인증하기 3분 카운팅을 위한 코드
    let countTime = 0;
    let intervalCall;

    // 주어진 time 값을 기준으로 시간을 카운트 다운한다.
    $.time = function (time) {
        // countTime 변수에 time 값을 저장
        countTime = time;
        // 1초마다 alertFunc() 함수 호출
        intervalCall = setInterval(alertFunc, 1000);
    };

    // 시간 카운트 다운을 멈추기 위해 setInterval() 함수 멈춘다.
    $.closeTime = function () {
        clearInterval(intervalCall);
    };

    // [EVENT] 인증하기 클릭 시 카운팅(3분)
    // $("#send_number").on("click", function () {
    //     $.time(179);
    // });

    /**
     * 시간을 계산하여 텍스트로 표시하는 함수
     */
    function alertFunc() {
        // countTime 변수를 분과 초로 변환하여 .certificationTime 요소에 텍스트를 업데이트한다.
        let min = Math.floor(countTime / 60);
        let sec = countTime - 60 * min;
        if (sec > 9) {
            $(".certificationTime").text(min + ":" + sec + "");
        } else {
            $(".certificationTime").text(min + ":0" + sec + "");
        }

        // 시간이 0이하가 되면 setInterval() 함수를 멈춘다.
        if (countTime <= 0) {
            clearInterval(intervalCall);
        }
        countTime--;
    }
}
