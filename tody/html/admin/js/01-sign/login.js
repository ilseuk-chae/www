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

async function login() {
    const id = $("#user_id").val();
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

    const dataObj = { id: encodeURIComponent(id), password: SHA256(password) };
    const langCode = localStorage.getItem("langCode") ?? "KR";
    const result = await callApi("POST", "/admin/back/01-sign/login.php", dataObj);

    if (!result) return;

    const { status, message, responseData } = result;

    const { saNo, saToken, saContNo, saContToken, name, perNo } = responseData;

    setCookie("sa_no", saNo);
    setCookie("sa_token", saToken);
    setCookie("sa_cont_no", saContNo);
    setCookie("sa_cont_token", saContToken);
    setCookie("sa_name", encodeURIComponent(name));
    setCookie("sa_per_no", encodeURIComponent(perNo));

    if ($("#auth-remember-check").prop("checked")) {
        setCookie("remember_sa_id", encodeURIComponent(id));
    } else {
        deleteCookie("remember_sa_id");
    }

    location.href = "./views/user_manage/general";
}
