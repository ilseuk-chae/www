// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(function () {
    Array.from(document.querySelectorAll(".auth-pass-inputgroup")).forEach(function (e) {
        Array.from(e.querySelectorAll(".password-addon")).forEach(function (r) {
            r.addEventListener("click", function (r) {
                var o = e.querySelector(".password-input");
                "password" === o.type ? (o.type = "text") : (o.type = "password");
            });
        });
    });

    const rememberChk = $("#auth-remember-check");
    const rememberId = getCookie("remember_sa_id");
    if (rememberId) {
        $("#user_id").val(decodeURIComponent(rememberId));
        rememberChk.prop("checked", true);
    }

    $("#login_btn").on("click", function () {
        login();
    });

    $('#user_id, #user_password').on('keypress', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            $('#login_btn').trigger('click');
        }
    });
});

async function login(force) {
    const id       = $("#user_id").val();
    const password = $("#user_password").val();

    if (!id) {
        sweetAlertMessage("아이디를 입력하세요.", "", "w");
        $("#user_id").focus();
        return;
    }
    if (!password) {
        sweetAlertMessage("비밀번호를 입력하세요.", "", "w");
        $("#user_password").focus();
        return;
    }

    const dataObj = {
        id:       encodeURIComponent(id),
        password: SHA256(password),
        force:    force ? 'true' : 'false',
    };

    const result = await callApi("POST", "/admin/back/01-sign/login.php", dataObj);
    if (!result) return;

    const { statusCode, message, responseData } = result;

    // 중복 접속 감지 — 사용자 확인 후 강제 진행
    if (message === 'DUPLICATE_SESSION' && responseData && responseData.isDuplicate) {
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

    if (statusCode !== 200) {
        sweetAlertMessage(message || '로그인에 실패했습니다.', "", "e");
        return;
    }

    const { saNo, saToken, saContNo, saContToken, name, perNo, sessionToken } = responseData;

    setCookie("sa_no",         saNo);
    setCookie("sa_token",      saToken);
    setCookie("sa_cont_no",    saContNo);
    setCookie("sa_cont_token", saContToken);
    setCookie("sa_name",       encodeURIComponent(name));
    setCookie("sa_per_no",     encodeURIComponent(perNo));
    setCookie("sa_session_token", sessionToken);

    if ($("#auth-remember-check").prop("checked")) {
        setCookie("remember_sa_id", encodeURIComponent(id));
    } else {
        deleteCookie("remember_sa_id");
    }

    location.href = "./views/user_manage/general";
}
