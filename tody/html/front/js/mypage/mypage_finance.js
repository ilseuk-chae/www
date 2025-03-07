(function (_0xacca2c, _0x1bfe6e) {
    const _0x513d7e = a21_0x3e68,
        _0x51f625 = _0xacca2c();
    while (!![]) {
        try {
            const _0x4cce8b =
                (-parseInt(_0x513d7e(0x243)) / 0x1) * (parseInt(_0x513d7e(0x1cc)) / 0x2) +
                -parseInt(_0x513d7e(0x1ed)) / 0x3 +
                parseInt(_0x513d7e(0x253)) / 0x4 +
                -parseInt(_0x513d7e(0x25b)) / 0x5 +
                parseInt(_0x513d7e(0x202)) / 0x6 +
                parseInt(_0x513d7e(0x1eb)) / 0x7 +
                parseInt(_0x513d7e(0x1f2)) / 0x8;
            if (_0x4cce8b === _0x1bfe6e) break;
            else _0x51f625["push"](_0x51f625["shift"]());
        } catch (_0x55d5c8) {
            _0x51f625["push"](_0x51f625["shift"]());
        }
    }
})(a21_0x1e0d, 0x42903),
    $(function () {
        const _0x284a72 = a21_0x3e68,
            _0x564843 = userInfo();
        if (!_0x564843) {
            alert(_0x284a72(0x222)), (location["href"] = _0x284a72(0x24e));
            return;
        }
        initMenu(_0x564843), user_info(), initModal(), initEvents(), initRelationshipFlag(), initValidation();
    });
async function user_info(_0x30318c) {
    const _0x94e12f = a21_0x3e68,
        _0x28ba92 = localStorage[_0x94e12f(0x219)]("langCode") ?? "kr",
        _0x1d9376 = { ...userInfo(), langCode: _0x28ba92, rcvUser: _0x30318c },
        _0x3e0c38 = await callApi(_0x94e12f(0x226), _0x94e12f(0x22c), _0x1d9376);
    if (!_0x3e0c38) return;
    const { status: _0x4a7e39, message: _0x426be0, responseData: _0x148448 } = _0x3e0c38;
    if (!_0x148448) {
        console["log"](_0x426be0);
        return;
    }
    const { id: _0x492ddd, name: _0x5dfead, email: _0x3382bb, mobile: _0x59a2b5, term_fg: _0x558259, role: _0x1b1472, finance_info: _0xaa021e } = _0x148448;
    if (_0x1b1472 == _0x94e12f(0x206)) location[_0x94e12f(0x1c9)] = _0x94e12f(0x23e);
    else _0x1b1472 == _0x94e12f(0x232) && (location[_0x94e12f(0x1c9)] = _0x94e12f(0x236));
    const [_0x4ce76f, _0x1ecb4a] = _0x3382bb[_0x94e12f(0x1d4)]("@");
    $(_0x94e12f(0x1ce))[_0x94e12f(0x1da)](_0x492ddd), $(_0x94e12f(0x207))[_0x94e12f(0x1da)](_0x5dfead), $(_0x94e12f(0x264))[_0x94e12f(0x1da)](_0x4ce76f), $(_0x94e12f(0x1f3))[_0x94e12f(0x1da)](_0x1ecb4a), $("#mobile")[_0x94e12f(0x1da)](phoneOnDash(_0x59a2b5) || "");
    _0x558259 == "Y" ? $(_0x94e12f(0x1d5))[_0x94e12f(0x1fe)]("checked", !![]) : $("#term_fg")["prop"](_0x94e12f(0x211), ![]);
    if (_0xaa021e) {
        let _0x6e26b6 = "";
        (_0x6e26b6 = _0xaa021e[_0x94e12f(0x22f)](function (_0x29dd96, _0x3702ee) {
            const _0x3fbb52 = _0x94e12f,
                { branch_no: _0x44e0fd, branch_name: _0x81f8de, branch_phone: _0x1a8146, company_no: _0x482f14, company_name: _0x1084c5 } = _0x29dd96;
            return (
                _0x3fbb52(0x21f) +
                (_0x3702ee > 0x0 ? _0x3702ee + 0x1 : "") +
                "</h2>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p\x20class=\x22pt-3\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<input\x20type=\x22text\x22\x20class=\x22form-control\x20input-box\x20w100p\x22\x20placeholder=\x22\x22\x20value=\x22" +
                (_0x1084c5 || "") +
                _0x3fbb52(0x25f) +
                (_0x3702ee > 0x0 ? _0x3702ee + 0x1 : "") +
                "</h2>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p\x20class=\x22pt-3\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<input\x20type=\x22text\x22\x20class=\x22form-control\x20input-box\x20w100p\x22\x20placeholder=\x22\x22\x20value=\x22" +
                (_0x81f8de || "") +
                _0x3fbb52(0x239) +
                (_0x3702ee > 0x0 ? _0x3702ee + 0x1 : "") +
                "</h2>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p\x20class=\x22pt-3\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<input\x20type=\x22tel\x22\x20class=\x22branch-phone\x20form-control\x20input-box\x20w100p\x20modify-input\x22\x20placeholder=\x22\x22\x20value=\x22" +
                (phoneOnDash(_0x1a8146) || "") +
                "\x22\x20data-company_no=\x22" +
                _0x482f14 +
                _0x3fbb52(0x1f8) +
                _0x44e0fd +
                _0x3fbb52(0x255)
            );
        })[_0x94e12f(0x21a)]("")),
            $("#finance_list")[_0x94e12f(0x1fa)](_0x6e26b6);
    }
}
function initModal() {
    const _0x879a69 = a21_0x3e68;
    _0x22472(_0x879a69(0x213), _0x879a69(0x26b), _0x879a69(0x1cb)), _0x22472(_0x879a69(0x241), "/front/assets/lottie/completion.json", _0x879a69(0x251));
    function _0x22472(_0x1e506f, _0xf6170a, _0x2a7efc) {
        const _0x37b6b4 = _0x879a69;
        $(_0x1e506f)["iziModal"]({ width: _0x37b6b4(0x24c) }), $(_0x1e506f)["iziModal"](_0x37b6b4(0x25a), 0x46), $(_0x1e506f)[_0x37b6b4(0x23a)](_0x37b6b4(0x204), 0x46);
        var _0x5d380f = bodymovin[_0x37b6b4(0x212)]({ container: document[_0x37b6b4(0x249)](_0x2a7efc), renderer: _0x37b6b4(0x22e), loop: !![], autoplay: !![], path: _0xf6170a });
    }
}
function initEvents() {
    const _0xfe9886 = a21_0x3e68;
    $(document)["on"]("input", "#mobile,\x20.branch-phone", function () {
        const _0x37b8ea = a21_0x3e68,
            _0x3d6512 = $(this)
                [_0x37b8ea(0x1da)]()
                [_0x37b8ea(0x266)]()
                ["replace"](/[^0-9]/g, ""),
            _0x365058 = phoneOnDash(_0x3d6512);
        $(this)[_0x37b8ea(0x1da)](_0x365058), $(this)[_0x37b8ea(0x1ec)](_0x37b8ea(0x20f)) && (_0x3d6512 ? $(this)["prop"](_0x37b8ea(0x246), !![]) : $(this)[_0x37b8ea(0x1fe)](_0x37b8ea(0x246), ![]));
    }),
        $(document)["on"](_0xfe9886(0x1dd), _0xfe9886(0x1f9), function () {
            const _0x1d3f9d = _0xfe9886,
                _0x164f06 = $(this)
                    [_0x1d3f9d(0x1da)]()
                    [_0x1d3f9d(0x266)]()
                    [_0x1d3f9d(0x1db)](/[^0-9]/g, ""),
                _0x12cb55 = /^(0\d{1,2})(\d{3,4})(\d{4})$/;
            _0x164f06 && !_0x12cb55[_0x1d3f9d(0x1d2)](_0x164f06) && sweetAlertMessage("", _0x1d3f9d(0x218), "w");
        }),
        $("#select_domain")["on"](_0xfe9886(0x20e), function (_0x42ebb4) {
            const _0x36b97b = _0xfe9886,
                _0x5e3d15 = $(this)["val"]();
            $(_0x36b97b(0x1f3))[_0x36b97b(0x1da)](_0x5e3d15);
        }),
        $(_0xfe9886(0x268))["on"](_0xfe9886(0x1f7), function (_0x4ffb22) {
            const _0x41a3db = _0xfe9886;
            $(this)["is"](_0x41a3db(0x1f6)) ? $(_0x41a3db(0x1ef))[_0x41a3db(0x20d)]("show") : $(_0x41a3db(0x1ef))[_0x41a3db(0x20d)]("hide");
        }),
        $(_0xfe9886(0x230))["on"](_0xfe9886(0x1f7), function () {
            const _0x5735ca = _0xfe9886;
            $(_0x5735ca(0x203))["removeClass"]("d-none"), $(_0x5735ca(0x230))["addClass"](_0x5735ca(0x267)), $(_0x5735ca(0x256))["prop"](_0x5735ca(0x242), ![]), $("#select_domain")[_0x5735ca(0x1fe)]("disabled", ![]);
        }),
        $(_0xfe9886(0x231))["on"]("click", function () {}),
        $(_0xfe9886(0x1fc))["on"]("click", function () {
            getPlatform();
        });
}
function a21_0x1e0d() {
    const _0x12a4b2 = [
        "length",
        "#save_btn\x20found",
        "open",
        "prototype",
        "#save_btn\x20not\x20found",
        "text",
        "1459745ZigLQy",
        "hasClass",
        "1565517uTPBgc",
        "/front/back/oauth/naver_login.php",
        "#job_list_collapse",
        "비밀번호",
        "no\x20result",
        "6577104SNTgcv",
        "#domain",
        "을(를)\x20입력해주세요.",
        "저장\x20중\x20<span>문제가</span>\x20발생했습니다.",
        ":checked",
        "click",
        "\x22\x20data-branch_no=\x22",
        "#mobile,\x20.branch-phone",
        "html",
        "tel",
        "#withdrawal_btn",
        "form.needs-validation",
        "prop",
        "call",
        "stopPropagation",
        "입력값",
        "1496484JOqxnJ",
        "#submit_btn",
        "setBottom",
        "platform",
        "001",
        "#name",
        "체크박스",
        "select",
        "phone",
        "&redirect_uri=",
        "#modalConfirm",
        "collapse",
        "change",
        "branch-phone",
        ".needs-validation",
        "checked",
        "loadAnimation",
        "#modalCompletion",
        "API\x20호출\x20실패",
        "data",
        "&prompt=\x22none\x22&state=",
        "type",
        "잘못된\x20전화번호입니다.\x20올바른\x20형식으로\x20입력해주세요.",
        "getItem",
        "join",
        "validation\x20finished",
        "querySelectorAll",
        "</h2>",
        "https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x20pt-0\x20pb-3\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22label-wrap\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h2\x20class=\x22label-text\x22>은행\x20",
        "hide",
        "을(를)\x20확인해주세요.",
        "로그인\x20후\x20이용\x20가능합니다.",
        "/front/back/oauth/get_platform.php",
        "scrollIntoView",
        "width=500,height=600",
        "POST",
        ".invalid-feedback",
        "port",
        "addEventListener",
        "/front/assets/lottie/save.json",
        "getElementById",
        "/front/back/mypage/user_info_finance.php",
        "error",
        "svg",
        "map",
        "#modify_ready_btn",
        "#save_btn",
        "002",
        "/front/assets/lottie/loading.json",
        "setCustomValidity",
        "358571ae546aaa68be0d290878b351c1",
        "mypage_realtor",
        "#lottieConfirm",
        "fromCharCode",
        "\x22\x20maxlength=\x2215\x22\x20disabled\x20/>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-12\x20pt-0\x20pb-3\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22label-wrap\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h2\x20class=\x22label-text\x22>내선\x20번호\x20",
        "iziModal",
        "find",
        "#lottieFail",
        "#lottieLoading",
        "mypage",
        "data-company_no",
        "checkbox",
        "#modalWithdrawal",
        "disabled",
        "107585kykpsZ",
        "문제가\x20발생했습니다.",
        "each",
        "required",
        "탈퇴\x20처리되었습니다.",
        "toLowerCase",
        "querySelector",
        "kakao_login",
        "#mobile",
        "470px",
        "slice",
        "/index",
        "location",
        "<h2>",
        "#lottieWithdrawal",
        "smooth",
        "1881620trhtrn",
        "&state=",
        "\x22\x20maxlength=\x2213\x22\x20disabled\x20/>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>",
        "input:disabled.modify-input",
        "parent",
        "show",
        "/index.html",
        "setTop",
        "2090425aghkrY",
        "탈퇴완료",
        "is-valid",
        "message",
        "\x22\x20maxlength=\x2215\x22\x20disabled\x20/>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x20pt-0\x20pb-3\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22label-wrap\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h2\x20class=\x22label-text\x22>영업점\x20",
        "password",
        "/front/views/callback/kakao_unlinked.html",
        "preventDefault",
        "NaverLogin",
        "#email",
        "data-branch_no",
        "trim",
        "d-none",
        "#relationship_fg",
        "closing",
        "removeClass",
        "/front/assets/lottie/completion.json",
        "#modalLoading",
        "href",
        "#fail_message",
        "#lottieCompletion",
        "10eWDFtl",
        "kakao",
        "#id",
        "attr",
        "/front/back/oauth/naver_delete_account.php",
        "is-invalid",
        "test",
        "close",
        "split",
        "#term_fg",
        "/front/assets/lottie/failed.json",
        "tagName",
        "reportValidity",
        "/front/back/oauth/withdrawal.php",
        "val",
        "replace",
        "input[required],\x20select[required],\x20textarea[required]",
        "focusout",
        "origin",
        "setItem",
        "center",
        "log",
        "#modalFail",
        "addClass",
        "51uqj3T1dAORiqMsBTFv",
    ];
    a21_0x1e0d = function () {
        return _0x12a4b2;
    };
    return a21_0x1e0d();
}
function initRelationshipFlag() {
    const _0x317d88 = a21_0x3e68;
    $(_0x317d88(0x268))["is"](":checked") ? $(_0x317d88(0x1ef))["collapse"](_0x317d88(0x258)) : $(_0x317d88(0x1ef))[_0x317d88(0x20d)](_0x317d88(0x220));
}
function a21_0x3e68(_0x4733e1, _0x53b3c2) {
    const _0x1e0d4c = a21_0x1e0d();
    return (
        (a21_0x3e68 = function (_0x3e6807, _0x491061) {
            _0x3e6807 = _0x3e6807 - 0x1c8;
            let _0x3415ee = _0x1e0d4c[_0x3e6807];
            return _0x3415ee;
        }),
        a21_0x3e68(_0x4733e1, _0x53b3c2)
    );
}
async function getPlatform() {
    const _0x48aab2 = a21_0x3e68;
    try {
        const _0x2bb62f = _0x48aab2(0x223),
            _0x57359d = await callApi(_0x48aab2(0x226), _0x2bb62f, { ...userInfo() });
        if (!_0x57359d) {
            alert(_0x48aab2(0x1f1));
            return;
        }
        const { statusCode: _0x346dc6, message: _0x267a33, responseData: _0x17f66b } = _0x57359d;
        if (!_0x17f66b[0x0]) return;
        const _0x3c061f = _0x17f66b[0x0][_0x48aab2(0x205)];
        if (_0x3c061f == "naver") naverUnlinkAndWithdrawal();
        else _0x3c061f == _0x48aab2(0x1cd) ? kakaoUnlinkAndWithdrawal() : withdrawal();
    } catch (_0x5e333b) {
        console["error"](_0x48aab2(0x214), _0x5e333b);
    }
}
function kakaoUnlinkAndWithdrawal() {
    const _0x17b005 = a21_0x3e68,
        _0x56c430 = _0x17b005(0x235),
        _0x4e9968 = _0x17b005(0x261),
        _0xc4440a = window[_0x17b005(0x24f)][_0x17b005(0x1de)] + (location[_0x17b005(0x228)] ? ":" + location[_0x17b005(0x228)] : "") + _0x4e9968,
        _0x2d1d63 = generateState();
    sessionStorage[_0x17b005(0x1df)]("kakao_state", _0x2d1d63);
    const _0x4bdc80 = _0x17b005(0x21e) + _0x56c430 + _0x17b005(0x20b) + encodeURIComponent(_0xc4440a) + _0x17b005(0x216) + encodeURIComponent(_0x2d1d63),
        _0x508ba3 = window["open"](_0x4bdc80, _0x17b005(0x24a), _0x17b005(0x225));
    window[_0x17b005(0x229)](
        _0x17b005(0x25e),
        function (_0x51f50a) {
            const _0x16ca29 = _0x17b005;
            if (_0x51f50a[_0x16ca29(0x1de)] !== window[_0x16ca29(0x24f)]["origin"]) return;
            const _0x369658 = _0x51f50a[_0x16ca29(0x215)];
            _0x369658 == "unlinked" && withdrawal();
        },
        ![]
    );
}
function naverUnlinkAndWithdrawal() {
    const _0x68e62e = a21_0x3e68,
        _0x2e2547 = _0x68e62e(0x1e4),
        _0x538981 = _0x68e62e(0x1ee),
        _0x36fdc0 = "" + window[_0x68e62e(0x24f)][_0x68e62e(0x1de)] + (location[_0x68e62e(0x228)] ? ":" + location[_0x68e62e(0x228)] : "") + _0x538981,
        _0x1b531c = generateState(),
        _0x4a63d3 = "https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=" + _0x2e2547 + _0x68e62e(0x20b) + _0x36fdc0 + _0x68e62e(0x254) + _0x1b531c;
    window[_0x68e62e(0x1e7)](_0x4a63d3, _0x68e62e(0x263), "width=500,height=600");
}
async function naver_delete_account() {
    const _0x3d3ed1 = a21_0x3e68;
    try {
        const _0x49c06b = _0x3d3ed1(0x1d0),
            _0x3c0761 = await callApi(_0x3d3ed1(0x226), _0x49c06b, {});
        if (!_0x3c0761) {
            alert(_0x3d3ed1(0x1f1));
            return;
        }
        console[_0x3d3ed1(0x1e1)](_0x3c0761);
        const { statusCode: _0x48d6a8, message: _0x3d54eb } = _0x3c0761;
        switch (_0x48d6a8) {
            case 0xc8:
                await withdrawal();
                break;
            case 0x190:
                sweetAlertMessage(_0x3d54eb, "", "w");
                break;
            default:
                sweetAlertMessage(_0x3d3ed1(0x244), "", "w");
                break;
        }
    } catch (_0x5714b3) {
        console[_0x3d3ed1(0x22d)](_0x3d3ed1(0x214), _0x5714b3);
    }
}
async function withdrawal() {
    const _0x3ace5c = a21_0x3e68;
    try {
        const _0x329aef = { ...userInfo() },
            _0x14af13 = await callApi(_0x3ace5c(0x226), _0x3ace5c(0x1d9), _0x329aef),
            { statusCode: _0x237660, message: _0x605602 } = _0x14af13;
        switch (_0x237660) {
            case 0xc8:
                const _0x1b2db7 = await sweetAlertForReturn(_0x3ace5c(0x247), "", "s");
                _0x1b2db7 && (console["log"](_0x3ace5c(0x25c)), logout(), (location["href"] = _0x3ace5c(0x259)));
                break;
            default:
                sweetAlertMessage(_0x3ace5c(0x244), "", "w");
                break;
        }
    } catch (_0x35a865) {
        console["error"](_0x3ace5c(0x214), _0x35a865);
    }
}
function generateState() {
    const _0x2915ad = a21_0x3e68;
    return btoa(String[_0x2915ad(0x238)](...crypto["getRandomValues"](new Uint8Array(0x10))));
}
function initValidation() {
    const _0x5d424e = a21_0x3e68;
    var _0x56d8cd = document[_0x5d424e(0x21c)](_0x5d424e(0x210));
    Array[_0x5d424e(0x1e8)][_0x5d424e(0x24d)][_0x5d424e(0x1ff)](_0x56d8cd)["forEach"](function (_0x224855) {
        const _0x67911a = _0x5d424e,
            _0x384e02 = document[_0x67911a(0x22b)]("save_btn");
        if (!_0x384e02) {
            console[_0x67911a(0x22d)](_0x67911a(0x1e9));
            return;
        } else console["log"](_0x67911a(0x1e6));
        _0x384e02["addEventListener"](
            _0x67911a(0x1f7),
            async function (_0x5b277c) {
                const _0x5c8242 = _0x67911a;
                _0x5b277c[_0x5c8242(0x262)](), $(_0x5c8242(0x20c))[_0x5c8242(0x23a)](_0x5c8242(0x1d3));
                const _0x47a15e = $(_0x224855)[_0x5c8242(0x23b)]("[required]");
                let _0x21210a = !![],
                    _0x8e48dd = null;
                _0x47a15e[_0x5c8242(0x245)]((_0x49bcec, _0x552635) => {
                    const _0x46e5ac = _0x5c8242,
                        _0x432da6 = $(_0x552635),
                        _0x262c6f = _0x432da6[_0x46e5ac(0x1cf)](_0x46e5ac(0x217)) || _0x432da6[_0x46e5ac(0x1fe)](_0x46e5ac(0x1d7))[_0x46e5ac(0x248)]();
                    let _0x3923e3, _0x344a7a;
                    switch (_0x262c6f) {
                        case _0x46e5ac(0x1ea):
                            (_0x3923e3 = _0x46e5ac(0x1ea)), (_0x344a7a = _0x46e5ac(0x201));
                            break;
                        case _0x46e5ac(0x260):
                            (_0x3923e3 = _0x46e5ac(0x260)), (_0x344a7a = _0x46e5ac(0x1f0));
                            break;
                        case _0x46e5ac(0x1fb):
                            (_0x3923e3 = _0x46e5ac(0x20a)), (_0x344a7a = "번호");
                            break;
                        case "checkbox":
                            (_0x3923e3 = "checkbox"), (_0x344a7a = "체크박스");
                            break;
                        case _0x46e5ac(0x209):
                            (_0x3923e3 = _0x46e5ac(0x209)), (_0x344a7a = "옵션");
                            break;
                        default:
                            (_0x3923e3 = _0x262c6f), (_0x344a7a = "값");
                    }
                    const _0xc8148a = validateInput(_0x432da6, _0x3923e3, _0x344a7a + _0x46e5ac(0x221)),
                        _0x52ba64 = _0x432da6[_0x46e5ac(0x257)]()["find"](_0x46e5ac(0x227))[_0x46e5ac(0x1e5)] != 0x0 ? _0x432da6["parent"]()[_0x46e5ac(0x23b)](_0x46e5ac(0x227)) : _0x432da6[_0x46e5ac(0x257)]()[_0x46e5ac(0x257)]()[_0x46e5ac(0x23b)](_0x46e5ac(0x227));
                    !_0xc8148a
                        ? (_0x52ba64[_0x46e5ac(0x1e5)] > 0x0 ? (_0x52ba64[_0x46e5ac(0x258)](), _0x432da6[0x0][_0x46e5ac(0x234)](_0x52ba64[_0x46e5ac(0x1ea)]())) : _0x432da6[0x0][_0x46e5ac(0x234)](_0x344a7a + _0x46e5ac(0x221)),
                          _0x432da6[0x0][_0x46e5ac(0x1d8)](),
                          _0x432da6[_0x46e5ac(0x1e3)](_0x46e5ac(0x1d1)),
                          (_0x21210a = ![]),
                          !_0x8e48dd && (_0x8e48dd = _0x432da6))
                        : (_0x52ba64["hide"](), _0x432da6[0x0]["setCustomValidity"](""), _0x432da6[_0x46e5ac(0x26a)]("is-invalid"));
                });
                !_0x21210a
                    ? (_0x8e48dd && (_0x8e48dd[0x0][_0x5c8242(0x224)]({ behavior: _0x5c8242(0x252), block: _0x5c8242(0x1e0) }), _0x8e48dd[0x0][_0x5c8242(0x1d8)](), _0x8e48dd["focus"]()), _0x5b277c[_0x5c8242(0x262)](), _0x5b277c[_0x5c8242(0x200)]())
                    : (_0x5b277c[_0x5c8242(0x262)](), _0x5b277c[_0x5c8242(0x200)](), console[_0x5c8242(0x1e1)](_0x5c8242(0x21b)), user_info_modify());
                return;
            },
            ![]
        ),
            _0x224855[_0x67911a(0x21c)](_0x67911a(0x1dc))["forEach"](function (_0x483c86) {
                const _0x385495 = _0x67911a;
                _0x483c86[_0x385495(0x229)]("input", function () {
                    const _0x4a72cd = _0x385495,
                        _0xeb607a = $(_0x483c86),
                        _0x579518 = _0xeb607a[_0x4a72cd(0x1cf)](_0x4a72cd(0x217)) || _0xeb607a[_0x4a72cd(0x1fe)](_0x4a72cd(0x1d7))[_0x4a72cd(0x248)]();
                    let _0x3732cf, _0x33e21b;
                    switch (_0x579518) {
                        case _0x4a72cd(0x1ea):
                            (_0x3732cf = "text"), (_0x33e21b = "값");
                            break;
                        case _0x4a72cd(0x260):
                            (_0x3732cf = _0x4a72cd(0x260)), (_0x33e21b = _0x4a72cd(0x1f0));
                            break;
                        case _0x4a72cd(0x1fb):
                            (_0x3732cf = "phone"), (_0x33e21b = "번호");
                            break;
                        case "checkbox":
                            (_0x3732cf = _0x4a72cd(0x240)), (_0x33e21b = _0x4a72cd(0x208));
                            break;
                        case _0x4a72cd(0x209):
                            (_0x3732cf = "select"), (_0x33e21b = "옵션");
                            break;
                        default:
                            _0x3732cf = _0x579518;
                    }
                    const _0x472792 = validateInput(_0xeb607a, _0x3732cf, _0x33e21b + _0x4a72cd(0x221)),
                        _0xe2e122 = _0xeb607a[_0x4a72cd(0x257)]()[_0x4a72cd(0x23b)](_0x4a72cd(0x227))["length"] != 0x0 ? _0xeb607a["parent"]()["find"](_0x4a72cd(0x227)) : _0xeb607a[_0x4a72cd(0x257)]()[_0x4a72cd(0x257)]()[_0x4a72cd(0x23b)](_0x4a72cd(0x227));
                    _0x472792
                        ? (_0xeb607a["removeClass"](_0x4a72cd(0x1d1))[_0x4a72cd(0x1e3)](_0x4a72cd(0x25d)), _0xeb607a[0x0]["setCustomValidity"](""), _0xe2e122[_0x4a72cd(0x220)]())
                        : (_0xeb607a["removeClass"](_0x4a72cd(0x25d))[_0x4a72cd(0x1e3)](_0x4a72cd(0x1d1)),
                          _0xe2e122[_0x4a72cd(0x1e5)] > 0x0 ? (_0xeb607a[0x0]["setCustomValidity"](_0xe2e122[_0x4a72cd(0x1ea)]()), _0xe2e122[_0x4a72cd(0x258)]()) : _0xeb607a[0x0]["setCustomValidity"](_0x33e21b + _0x4a72cd(0x1f4)),
                          _0xeb607a[0x0][_0x4a72cd(0x1d8)]());
                });
            });
    });
}
async function user_info_modify() {
    const _0x172b8f = a21_0x3e68;
    try {
        const _0x36a2e4 = $(_0x172b8f(0x1fd)),
            _0x2a9c76 = _0x36a2e4["find"]("#name")[_0x172b8f(0x1da)]()[_0x172b8f(0x266)](),
            _0x2e597b = _0x36a2e4[_0x172b8f(0x23b)](_0x172b8f(0x264))[_0x172b8f(0x1da)]()[_0x172b8f(0x266)]() + "@" + _0x36a2e4[_0x172b8f(0x23b)](_0x172b8f(0x1f3))["val"]()[_0x172b8f(0x266)](),
            _0x40c366 = _0x36a2e4[_0x172b8f(0x23b)](_0x172b8f(0x24b))["val"]()["replace"](/-/g, "")[_0x172b8f(0x266)](),
            _0xf9405 = $(_0x172b8f(0x1d5))["is"](_0x172b8f(0x1f6)) ? "Y" : "N",
            _0x5d942b = $(".branch-phone")
                [_0x172b8f(0x22f)](function () {
                    const _0x462444 = _0x172b8f,
                        _0x3a0b5f = $(this),
                        _0x555ac0 = _0x3a0b5f["val"]()["replace"](/-/g, "")[_0x462444(0x266)]();
                    if (_0x555ac0) return { company_no: _0x3a0b5f[_0x462444(0x1cf)](_0x462444(0x23f)), branch_no: _0x3a0b5f[_0x462444(0x1cf)](_0x462444(0x265)), phone: _0x555ac0 };
                })
                ["get"](),
            _0x5c796a = { ...userInfo(), name: _0x2a9c76 ? encodeURIComponent(_0x2a9c76) : "", email: _0x2e597b ? encodeURIComponent(_0x2e597b) : "", mobile: _0x40c366 ? encodeURIComponent(_0x40c366) : "", term_fg: _0xf9405 ? encodeURIComponent(_0xf9405) : "", branchArray: _0x5d942b };
        $(_0x172b8f(0x1c8))[_0x172b8f(0x23a)](_0x172b8f(0x1e7));
        const _0x380cdc = await callApi(_0x172b8f(0x226), "/front/back/mypage/modify_finance.php", _0x5c796a);
        if (_0x380cdc && _0x380cdc["statusCode"] === 0xc8 && _0x380cdc[_0x172b8f(0x25e)] === "SUCCESS")
            $(_0x172b8f(0x213))[_0x172b8f(0x23a)](_0x172b8f(0x1e7)),
                $(_0x172b8f(0x213))["on"](_0x172b8f(0x269), async function (_0x4dc9f4) {
                    location["reload"]();
                });
        else {
            const _0x49cf92 = _0x380cdc?.["statusCode"] === 0x190 ? _0x380cdc[_0x172b8f(0x25e)] : _0x172b8f(0x1f5);
            $(_0x172b8f(0x1ca))[_0x172b8f(0x1fa)](_0x172b8f(0x250) + _0x49cf92 + _0x172b8f(0x21d)),
                $("#modalFail")[_0x172b8f(0x23a)]("open"),
                $(_0x172b8f(0x1e2))["on"](_0x172b8f(0x269), async function (_0x5ba696) {
                    location["reload"]();
                });
        }
    } catch (_0x2da645) {
        console[_0x172b8f(0x1e1)](_0x2da645), $("#fail_message")[_0x172b8f(0x1fa)]("<h2>저장\x20중\x20<span>문제가</span>\x20발생했습니다.</h2>"), $(_0x172b8f(0x1e2))[_0x172b8f(0x23a)](_0x172b8f(0x1e7));
    } finally {
        $(_0x172b8f(0x1c8))[_0x172b8f(0x23a)](_0x172b8f(0x1d3));
    }
}
function initModal() {
    const _0x122001 = a21_0x3e68;
    _0x1118ed("#modalConfirm", "/front/assets/lottie/save.json", _0x122001(0x237)),
        _0x1118ed(_0x122001(0x213), _0x122001(0x22a), _0x122001(0x1cb)),
        _0x1118ed(_0x122001(0x1e2), _0x122001(0x1d6), _0x122001(0x23c)),
        _0x1118ed(_0x122001(0x1c8), _0x122001(0x233), _0x122001(0x23d)),
        _0x1118ed("#modalWithdrawal", "", _0x122001(0x251));
    function _0x1118ed(_0x5e109d, _0x4429b5, _0x9cd346) {
        const _0x3acd91 = _0x122001;
        $(_0x5e109d)["iziModal"]({ width: "470px" }), $(_0x5e109d)[_0x3acd91(0x23a)](_0x3acd91(0x25a), 0x46), $(_0x5e109d)["iziModal"]("setBottom", 0x46);
        var _0x21a102 = bodymovin[_0x3acd91(0x212)]({ container: document[_0x3acd91(0x249)](_0x9cd346), renderer: _0x3acd91(0x22e), loop: !![], autoplay: !![], path: _0x4429b5 });
    }
}
