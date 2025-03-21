const a14_0x12cd09 = a14_0x4e6f;
(function (_0x1957be, _0x19e495) {
    const _0x58be20 = a14_0x4e6f,
        _0x471b6e = _0x1957be();
    while (!![]) {
        try {
            const _0x3b57d0 =
                parseInt(_0x58be20(0xf3)) / 0x1 +
                (-parseInt(_0x58be20(0xea)) / 0x2) * (-parseInt(_0x58be20(0xf8)) / 0x3) +
                -parseInt(_0x58be20(0xe5)) / 0x4 +
                (parseInt(_0x58be20(0xf7)) / 0x5) * (parseInt(_0x58be20(0xf0)) / 0x6) +
                (-parseInt(_0x58be20(0x110)) / 0x7) * (parseInt(_0x58be20(0x107)) / 0x8) +
                (parseInt(_0x58be20(0xfb)) / 0x9) * (-parseInt(_0x58be20(0x104)) / 0xa) +
                (-parseInt(_0x58be20(0xf1)) / 0xb) * (-parseInt(_0x58be20(0x116)) / 0xc);
            if (_0x3b57d0 === _0x19e495) break;
            else _0x471b6e["push"](_0x471b6e["shift"]());
        } catch (_0x380db5) {
            _0x471b6e["push"](_0x471b6e["shift"]());
        }
    }
})(a14_0x20fd, 0x7beb4),
    $(document)[a14_0x12cd09(0x10f)](async function () {
        countTime(), initEvent();
    });
function initEvent() {
    const _0x2dc8ee = a14_0x12cd09;
    $("#email_send_btn")["on"](_0x2dc8ee(0x113), function () {
        send_auth_code();
    }),
        $(_0x2dc8ee(0xe6))["on"](_0x2dc8ee(0x113), function () {
            auth_code_check();
        });
}

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

    //20250320_cis change $("#email_send_btn").hide();
    $("#btn_spinner").removeClass("d-none");

    const result = await callApi("POST", "/front/back/oauth/auth_num_send.php", dataObj);
    const { statusCode, message, responseData } = result;
    if (statusCode == 200 && message == "SUCCESS") {
        sweetAlertMessage("인증번호가 발송되었습니다.", "", "s");
        //20250320_cis change$("#email_send_group").hide();
        //20250320_cis change$("#auth_code_group").show();

        // 3분 카운팅
        $(".certificationTime").attr("hidden", false); // 3분 카운트 보여줌
        $.closeTime(); // 기존의 setInterval 함수를 멈춤
        $.time(599); // 새로운 setInterval 함수 실행
    } else if (statusCode == 400) {
        sweetAlertMessage(message, "", "w");
        //20250320_cis change$("#email_send_group").show();
        //20250320_cis change$("#auth_code_group").hide();

        // 3분 카운팅
        // $(".certificationTime").attr("hidden", false); // 3분 카운트 보여줌
        // $.closeTime(); // 기존의 setInterval 함수를 멈춤
        // $.time(599); // 새로운 setInterval 함수 실행
    } else if (statusCode == 429 && message == "TOO_MANY_REQUESTS") {
        sweetAlertMessage("요청이 너무 많습니다. 10분 후에 다시 시도해주세요.", "", "e");
        //20250320_cis change$("#email_send_group").show();
        //20250320_cis change$("#auth_code_group").hide();

        // 3분 카운팅
        // $(".certificationTime").attr("hidden", false); // 3분 카운트 보여줌
        // $.closeTime(); // 기존의 setInterval 함수를 멈춤
        // $.time(599); // 새로운 setInterval 함수 실행
    } else {
        sweetAlertMessage("인증번호가 발송에 실패했습니다.", "", "e");
        //20250320_cis change$("#email_send_group").show();
        //20250320_cis change$("#auth_code_group").hide();
    }

    //20250320_cis change$("#email_send_btn").show();
    $("#btn_spinner").addClass("d-none");
}
// async function send_auth_code() {
//     const _0x23c3f6 = a14_0x12cd09,
//         _0x1c2c20 = $(_0x23c3f6(0xfe));
//     let _0x8cc4c6 = !![];
//     const _0x36b349 = [{ input: _0x1c2c20, type: _0x23c3f6(0x10e), message: _0x23c3f6(0xe2) }];
//     _0x36b349["forEach"]((_0x3c2931) => {
//         const _0x1d3e08 = _0x23c3f6;
//         _0x8cc4c6 = validateInput(_0x3c2931[_0x1d3e08(0x105)], _0x3c2931[_0x1d3e08(0xed)], _0x3c2931[_0x1d3e08(0x106)]) && _0x8cc4c6;
//     }),
//         console[_0x23c3f6(0xe4)](_0x8cc4c6);
//     if (!_0x8cc4c6) {
//         sweetAlertMessage(_0x23c3f6(0xe2), "", "w");
//         return;
//     }
//     const _0x47409b = { email: encodeURIComponent(_0x1c2c20[_0x23c3f6(0x10c)]()) };
//     $("#email_send_btn")[_0x23c3f6(0xfa)](), $(_0x23c3f6(0xfc))[_0x23c3f6(0x111)](_0x23c3f6(0x114));
//     const _0x269527 = await callApi(_0x23c3f6(0xe8), _0x23c3f6(0xef), _0x47409b),
//         { statusCode: _0x59b615, message: _0x47a68d, responseData: _0x251b18 } = _0x269527;
//     if (_0x59b615 == 0xc8 && _0x47a68d == "SUCCESS") sweetAlertMessage("인증번호가\x20발송되었습니다.", "", "s"), $(_0x23c3f6(0x108))[_0x23c3f6(0xfa)](), $("#auth_code_group")["show"](), $(_0x23c3f6(0xf6))[_0x23c3f6(0x103)](_0x23c3f6(0x112), ![]), $["closeTime"](), $[_0x23c3f6(0x10b)](0x257);
//     else if (statusCode == 400) {
//         sweetAlertMessage(_0x47a68d, "", "w");
//         $("#email_send_group").show();
//         $("#auth_code_group").hide();
//     }
//     else
//         _0x59b615 == 0x1ad && _0x47a68d == _0x23c3f6(0x10d)
//             ? (sweetAlertMessage(_0x23c3f6(0xec), "", "e"), $("#email_send_group")[_0x23c3f6(0xf4)](), $(_0x23c3f6(0x101))["hide"]())
//             : (sweetAlertMessage(_0x23c3f6(0xe3), "", "e"), $("#email_send_group")[_0x23c3f6(0xf4)](), $(_0x23c3f6(0x101))[_0x23c3f6(0xfa)]());
//     $(_0x23c3f6(0x102))[_0x23c3f6(0xf4)](), $(_0x23c3f6(0xfc))["addClass"](_0x23c3f6(0x114));
// }
async function auth_code_check() {
    const _0x1404d5 = a14_0x12cd09,
        _0x263ccf = $(_0x1404d5(0xf6)),
        _0x36cc60 = $(_0x1404d5(0xfe)),
        _0x13bdd6 = $("#auth_code");
    if (_0x263ccf[_0x1404d5(0xe7)]() == _0x1404d5(0x109)) {
        sweetAlertMessage(_0x1404d5(0x10a), "", "w"), $(_0x1404d5(0x108))["show"](), $(_0x1404d5(0x101))["hide"]();
        return;
    }
    let _0x2b4aa1 = !![];
    const _0x20438e = [{ input: _0x36cc60, type: "email", message: _0x1404d5(0xe2) }];
    _0x20438e[_0x1404d5(0xf5)]((_0x55d040) => {
        const _0x4add2d = _0x1404d5;
        _0x2b4aa1 = validateInput(_0x55d040[_0x4add2d(0x105)], _0x55d040[_0x4add2d(0xed)], _0x55d040[_0x4add2d(0x106)]) && _0x2b4aa1;
    });
    if (!_0x2b4aa1) {
        sweetAlertMessage(_0x20438e["message"], "", "w");
        return;
    }
    if (!_0x13bdd6[_0x1404d5(0x10c)]()) {
        sweetAlertMessage(_0x1404d5(0xf9), "", "w");
        return;
    }
    const _0x1e1f14 = { email: encodeURIComponent(_0x36cc60[_0x1404d5(0x10c)]()), authCode: encodeURIComponent(_0x13bdd6[_0x1404d5(0x10c)]()) },
        _0x1ebf2 = await callApi(_0x1404d5(0xe8), "/front/back/oauth/auth_code_check.php", _0x1e1f14),
        { statusCode: _0x4add50, message: _0x1ea97f, responseData: _0x4a6935 } = _0x1ebf2;
    if (_0x4add50 == 0xc8 && _0x1ea97f == "SUCCESS") {
        const { id: _0x20c2fa, platform: _0x220b69 } = _0x4a6935[0x0];
        let _0x152329;
        _0x220b69 == _0x1404d5(0xeb) ? (_0x152329 = await sweetAlertForReturn(_0x1404d5(0xf2) + _0x20c2fa, "", "")) : (_0x152329 = await sweetAlertForReturn(_0x220b69 + "\x20sns\x20회원입니다.", "", "")), _0x152329 && (location[_0x1404d5(0x100)] = _0x1404d5(0xff));
    } else {
        if (_0x1ea97f == _0x1404d5(0xe9)) {
            const _0x29ea73 = await sweetAlertForReturn(_0x1404d5(0xee), "", "w");
        } else {
            const _0x121918 = await sweetAlertForReturn(_0x1404d5(0x115), "", "w");
        }
    }
}
function a14_0x4e6f(_0x1d3bd4, _0x5b6b4b) {
    const _0x20fdc5 = a14_0x20fd();
    return (
        (a14_0x4e6f = function (_0x4e6f5d, _0xfd6bb7) {
            _0x4e6f5d = _0x4e6f5d - 0xe2;
            let _0x28796d = _0x20fdc5[_0x4e6f5d];
            return _0x28796d;
        }),
        a14_0x4e6f(_0x1d3bd4, _0x5b6b4b)
    );
}
function a14_0x20fd() {
    const _0xeb02f2 = [
        "POST",
        "AUTH_CODE_ERROR",
        "38946tpEZDg",
        "general",
        "요청이\x20너무\x20많습니다.\x2010분\x20후에\x20다시\x20시도해주세요.",
        "type",
        "인증번호가\x20일치하지\x20않습니다.",
        "/front/back/oauth/auth_num_send.php",
        "7698LLyTQw",
        "2431726JUlZPT",
        "ID\x20:\x20",
        "582195UloWcW",
        "show",
        "forEach",
        ".certificationTime",
        "575tRkTPe",
        "39acwiSh",
        "인증번호를\x20입력하세요.",
        "hide",
        "6840vcFncI",
        "#btn_spinner",
        "closeTime",
        "#email",
        "/index.html",
        "href",
        "#auth_code_group",
        "#email_send_btn",
        "attr",
        "3260vzOmcP",
        "input",
        "message",
        "139304hxcubQ",
        "#email_send_group",
        "0:00",
        "유효시간이\x20경과했습니다.\x20인증번호를\x20다시\x20발송해주세요.",
        "time",
        "val",
        "TOO_MANY_REQUESTS",
        "email",
        "ready",
        "21hSXByg",
        "removeClass",
        "hidden",
        "click",
        "d-none",
        "가입된\x20회원정보를\x20찾을\x20수\x20없습니다.",
        "12vTXRPa",
        "이메일을\x20입력하세요.",
        "인증번호가\x20발송에\x20실패했습니다.",
        "log",
        "1585536UTnWKN",
        "#check_btn",
        "text",
    ];
    a14_0x20fd = function () {
        return _0xeb02f2;
    };
    return a14_0x20fd();
}
function countTime() {
    const _0x388a14 = a14_0x12cd09;
    let _0x1adb26 = 0x0,
        _0x27d07a;
    ($[_0x388a14(0x10b)] = function (_0x37a090) {
        (_0x1adb26 = _0x37a090), (_0x27d07a = setInterval(_0x3bfb4e, 0x3e8));
    }),
        ($[_0x388a14(0xfd)] = function () {
            clearInterval(_0x27d07a);
        });
    function _0x3bfb4e() {
        const _0x510cf9 = _0x388a14;
        let _0x467d35 = Math["floor"](_0x1adb26 / 0x3c),
            _0x48a9b1 = _0x1adb26 - 0x3c * _0x467d35;
        _0x48a9b1 > 0x9 ? $(_0x510cf9(0xf6))[_0x510cf9(0xe7)](_0x467d35 + ":" + _0x48a9b1 + "") : $(".certificationTime")["text"](_0x467d35 + ":0" + _0x48a9b1 + ""), _0x1adb26 <= 0x0 && clearInterval(_0x27d07a), _0x1adb26--;
    }
}
