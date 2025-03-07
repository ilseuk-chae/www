(function (_0x2ea8f3, _0x156870) {
    const _0x3a07b4 = a4_0x37c9,
        _0xebdacc = _0x2ea8f3();
    while (!![]) {
        try {
            const _0xe9465e =
                (parseInt(_0x3a07b4(0x1ca)) / 0x1) * (-parseInt(_0x3a07b4(0x1e4)) / 0x2) +
                -parseInt(_0x3a07b4(0x1d8)) / 0x3 +
                parseInt(_0x3a07b4(0x1df)) / 0x4 +
                (parseInt(_0x3a07b4(0x1e0)) / 0x5) * (parseInt(_0x3a07b4(0x1cd)) / 0x6) +
                -parseInt(_0x3a07b4(0x1f2)) / 0x7 +
                parseInt(_0x3a07b4(0x1cc)) / 0x8 +
                (parseInt(_0x3a07b4(0x1e1)) / 0x9) * (parseInt(_0x3a07b4(0x1d9)) / 0xa);
            if (_0xe9465e === _0x156870) break;
            else _0xebdacc["push"](_0xebdacc["shift"]());
        } catch (_0x137418) {
            _0xebdacc["push"](_0xebdacc["shift"]());
        }
    }
})(a4_0x37a7, 0xa5033),
    $(function () {
        const _0x3a80b7 = a4_0x37c9;
        $(document)["on"](_0x3a80b7(0x1d5), _0x3a80b7(0x1ed), function () {
            login();
        }),
            $(document)["on"]("keyup", _0x3a80b7(0x1d7), function (_0x10df76) {
                const _0x39ff76 = _0x3a80b7;
                _0x10df76[_0x39ff76(0x1d6)] === _0x39ff76(0x1e8) && login();
            }),
            kakaoLogin(),
            naverLogin();
    });
async function login() {
    const _0x280bc3 = a4_0x37c9,
        _0x46ae9d = $("#login_id")[_0x280bc3(0x1f1)](),
        _0x2f80c2 = $("#login_pw")["val"](),
        _0x3757f0 = { id: encodeURIComponent(_0x46ae9d), password: encodeURIComponent(_0x2f80c2) },
        _0xa27608 = await callApi(_0x280bc3(0x1e6), _0x280bc3(0x1f0), _0x3757f0);
    if (!_0xa27608) {
        alert("no\x20result");
        return;
    }
    const { statusCode: _0x5d6e7e, message: _0x389a2b, responseData: _0x73dd8a } = _0xa27608,
        _0x1132b6 = await loginHandleError(_0x389a2b, _0x5d6e7e);
    if (!_0x1132b6) return;
    const { userNo: _0x2e2a69, userToken: _0x1d7321, name: _0x1801e2, agency_name: _0x3c2c5c, role: _0xb63895, status: _0x39be9b } = _0x73dd8a;
    setCookie(_0x280bc3(0x1e5), _0x2e2a69),
        setCookie(_0x280bc3(0x1e2), _0x1d7321),
        setCookie(_0x280bc3(0x1d0), _0xb63895 == _0x280bc3(0x1dd) ? encodeURIComponent(_0x1801e2) : _0xb63895 == _0x280bc3(0x1f3) ? encodeURIComponent(_0x3c2c5c) : encodeURIComponent(_0x1801e2)),
        setCookie(_0x280bc3(0x1c8), encodeURIComponent(_0xb63895)),
        location[_0x280bc3(0x1c9)]();
}
function kakaoLogin() {
    const _0x32516e = a4_0x37c9,
        _0x4006a9 = _0x32516e(0x1d1),
        _0x2e7d64 = "/front/views/callback/kakao.html",
        _0x19825f = window[_0x32516e(0x1c6)][_0x32516e(0x1d3)] + (location[_0x32516e(0x1e3)] ? ":" + location[_0x32516e(0x1e3)] : "") + _0x2e7d64,
        _0x2bc4c3 = generateNonce(0x10);
    Kakao["init"](_0x4006a9),
        Kakao["isInitialized"](),
        $("#kakao_login_btn")["on"]("click", function () {
            const _0x1abe66 = _0x32516e,
                _0x538bb4 = _0x1abe66(0x1de) + _0x4006a9 + _0x1abe66(0x1cb) + encodeURIComponent(_0x19825f) + _0x1abe66(0x1d2) + _0x2bc4c3,
                _0x54d561 = window["open"](_0x538bb4, _0x1abe66(0x1e9), _0x1abe66(0x1ce));
            window[_0x1abe66(0x1da)](
                "message",
                function (_0x6c3e75) {
                    const _0x1be6d3 = _0x1abe66;
                    if (_0x6c3e75[_0x1be6d3(0x1d3)] !== window[_0x1be6d3(0x1c6)][_0x1be6d3(0x1d3)]) return;
                    const _0x3f9caf = _0x6c3e75["data"];
                    console["log"](_0x1be6d3(0x1ee), _0x3f9caf);
                },
                ![]
            );
        });
}
function naverLogin() {
    const _0x1c0eb4 = a4_0x37c9,
        _0x330ea9 = _0x1c0eb4(0x1c5),
        _0xcd23c9 = _0x1c0eb4(0x1ea),
        _0x38b00e = window[_0x1c0eb4(0x1c6)][_0x1c0eb4(0x1d3)] + (location[_0x1c0eb4(0x1e3)] ? ":" + location[_0x1c0eb4(0x1e3)] : "") + _0xcd23c9;
    var _0x4c17e9 = new naver[_0x1c0eb4(0x1ec)]({ clientId: _0x330ea9, callbackUrl: _0x38b00e, isPopup: !![] });
    _0x4c17e9[_0x1c0eb4(0x1dc)]();
}
async function loginHandleError(_0x48921f, _0x3ae3f6, _0x215f51) {
    const _0x2bf48b = a4_0x37c9;
    switch (_0x3ae3f6) {
        case 0xc8:
            return !![];
        case 0x190:
            sweetAlertMessage(_0x2bf48b(0x1ef), "", "w");
            return ![];
        case 0x191:
            sweetAlertMessage(_0x48921f, "", "w");
            return ![];
        case 0x193:
            sweetAlertMessage(_0x48921f + _0x2bf48b(0x1c7), "", "w");
            return ![];
        default:
            sweetAlertMessage(_0x48921f, "", "e");
            return ![];
    }
}
function a4_0x37c9(_0x516bad, _0x5a141f) {
    const _0x37a74c = a4_0x37a7();
    return (
        (a4_0x37c9 = function (_0x37c95a, _0x2ef42c) {
            _0x37c95a = _0x37c95a - 0x1c5;
            let _0x11d6e4 = _0x37a74c[_0x37c95a];
            return _0x11d6e4;
        }),
        a4_0x37c9(_0x516bad, _0x5a141f)
    );
}
function a4_0x37a7() {
    const _0x59450c = [
        "566824FzkioS",
        "168gYttDq",
        "width=500,height=600",
        "random",
        "user_name",
        "847d6b0bbbc2dbfe6b7c0c1f82d8cd71",
        "&prompt=\x22select_account\x22&nonce=",
        "origin",
        "length",
        "click",
        "key",
        "#login_id,\x20#login_pw",
        "2458626VbNCwy",
        "10huKEZF",
        "addEventListener",
        "floor",
        "init",
        "001",
        "https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=",
        "3137236AFvuom",
        "23150mColKP",
        "14469471BFzHfP",
        "user_token",
        "port",
        "1279834vNandY",
        "user_no",
        "POST",
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        "Enter",
        "kakao_login",
        "/front/views/callback/naver.html",
        "charAt",
        "LoginWithNaverId",
        "#login_btn",
        "Received\x20user\x20data\x20from\x20popup:",
        "아이디와\x20비밀번호를\x20입력하세요.",
        "/front/back/00-include/login.php",
        "val",
        "3200197WVqgUd",
        "002",
        "51uqj3T1dAORiqMsBTFv",
        "location",
        "\x20유저입니다.",
        "user_role",
        "reload",
        "1KOfDXF",
        "&redirect_uri=",
    ];
    a4_0x37a7 = function () {
        return _0x59450c;
    };
    return a4_0x37a7();
}
function generateNonce(_0xe70ac6) {
    const _0x1fabbf = a4_0x37c9,
        _0x306657 = _0x1fabbf(0x1e7);
    let _0x494181 = "";
    for (let _0x3e5b7a = 0x0; _0x3e5b7a < _0xe70ac6; _0x3e5b7a++) {
        _0x494181 += _0x306657[_0x1fabbf(0x1eb)](Math[_0x1fabbf(0x1db)](Math[_0x1fabbf(0x1cf)]() * _0x306657[_0x1fabbf(0x1d4)]));
    }
    return _0x494181;
}
