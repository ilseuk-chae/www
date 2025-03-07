const a10_0x1ffc2e = a10_0x139a;
(function (_0x31a8d9, _0x744bf7) {
    const _0x495522 = a10_0x139a,
        _0x56259f = _0x31a8d9();
    while (!![]) {
        try {
            const _0x5b1cb5 =
                -parseInt(_0x495522(0xfb)) / 0x1 + parseInt(_0x495522(0x131)) / 0x2 + (parseInt(_0x495522(0x130)) / 0x3) * (-parseInt(_0x495522(0xf6)) / 0x4) + parseInt(_0x495522(0x124)) / 0x5 + parseInt(_0x495522(0x101)) / 0x6 + -parseInt(_0x495522(0x108)) / 0x7 + -parseInt(_0x495522(0x12a)) / 0x8;
            if (_0x5b1cb5 === _0x744bf7) break;
            else _0x56259f["push"](_0x56259f["shift"]());
        } catch (_0x2eb510) {
            _0x56259f["push"](_0x56259f["shift"]());
        }
    }
})(a10_0x5075, 0x3a567),
    $(document)[a10_0x1ffc2e(0xf5)](function () {
        const _0x368c7f = a10_0x1ffc2e,
            _0x3fd7b = getParameter(_0x368c7f(0x11a));
        userInfo() && viewHistoryAdd(_0x3fd7b), countUp(_0x3fd7b), initDetail(_0x3fd7b), initEvents(_0x3fd7b), favoriteCheck(_0x3fd7b);
    });
function viewHistoryAdd(_0x1726a7) {
    const _0x10e7fc = a10_0x1ffc2e,
        _0x2f8d94 = _0x10e7fc(0xf8),
        _0x139ce3 = { ...userInfo(), viewNo: encodeURIComponent(_0x1726a7), type: encodeURIComponent(_0x2f8d94) };
    callApiAbort("/front/back/history/view_history_add.php", _0x10e7fc(0x104), _0x139ce3, "viewHistoryAdd")
        [_0x10e7fc(0x133)]((_0x5423da) => {
            let { responseData: _0x55d9b1, message: _0x2af351, statusCode: _0x4b2584 } = _0x5423da;
        })
        [_0x10e7fc(0x135)]((_0x2ac6a9) => {
            const _0x5daf17 = _0x10e7fc;
            console[_0x5daf17(0x10d)](_0x2ac6a9);
        });
}
function a10_0x139a(_0x2c58d4, _0x3ca46c) {
    const _0x507528 = a10_0x5075();
    return (
        (a10_0x139a = function (_0x139a50, _0x595236) {
            _0x139a50 = _0x139a50 - 0xf1;
            let _0x44a8c0 = _0x507528[_0x139a50];
            return _0x44a8c0;
        }),
        a10_0x139a(_0x2c58d4, _0x3ca46c)
    );
}
function countUp(_0x3832f6) {
    const _0x583587 = a10_0x1ffc2e;
    if (!_0x3832f6) return;
    const _0x3b66ad = { viewNo: encodeURIComponent(_0x3832f6) };
    callApiAbort(_0x583587(0x100), _0x583587(0x104), _0x3b66ad, _0x583587(0x120))
        [_0x583587(0x133)]((_0x24fa2b) => {
            let { responseData: _0x5b87b6, message: _0x381695, statusCode: _0x12c9b9 } = _0x24fa2b;
        })
        [_0x583587(0x135)]((_0x205d7e) => {
            const _0xb8c690 = _0x583587;
            console[_0xb8c690(0x10d)](_0x205d7e);
        });
}
function initDetail(_0x3a1cf1) {
    const _0xcafeb0 = a10_0x1ffc2e;
    if (!_0x3a1cf1) {
        alert(_0xcafeb0(0x126)), (location[_0xcafeb0(0x109)] = "/index");
        return;
    }
    const _0x139780 = { viewNo: encodeURIComponent(_0x3a1cf1) };
    callApiAbort(_0xcafeb0(0x11f), _0xcafeb0(0x104), _0x139780, _0xcafeb0(0x116))
        ["then"](async (_0x45cc82) => {
            const _0x584df4 = _0xcafeb0;
            let { responseData: _0x268e8c, message: _0x4e9834, statusCode: _0x1d5176 } = _0x45cc82;
            if (!handleError(_0x4e9834, _0x1d5176)) return;
            if (_0x268e8c[_0x584df4(0x123)] == 0x0) {
                (await sweetAlertForReturn(_0x584df4(0x126), "", "e")) && (location[_0x584df4(0x109)] = _0x584df4(0xf3));
                return;
            }
            const _0x2a6023 = _0x268e8c[0x0];
            $(_0x584df4(0x132))[_0x584df4(0x12e)](_0x2a6023[_0x584df4(0x11b)] + "\x20" + (_0x2a6023[_0x584df4(0x11b)] !== _0x2a6023["sgg"] ? _0x2a6023[_0x584df4(0x10f)] : "")),
                $(_0x584df4(0x11c))[_0x584df4(0x12e)](_0x2a6023["estate_type"]),
                $(_0x584df4(0x127))[_0x584df4(0x12e)](_0x2a6023[_0x584df4(0x105)] + "(" + (_0x2a6023[_0x584df4(0x10c)] == "Y" ? "교환가능" : _0x584df4(0x115)) + ")"),
                $("#price")[_0x584df4(0x12e)](formatPrice(_0x2a6023["min_price"]) + _0x584df4(0x10e) + formatPrice(_0x2a6023[_0x584df4(0x128)])),
                $("#area")[_0x584df4(0x12e)](comma(_0x2a6023[_0x584df4(0x11e)]) + _0x584df4(0x12d) + comma(_0x2a6023[_0x584df4(0xf1)]) + "㎡"),
                $("#phone")[_0x584df4(0x12e)](phoneOnDash(_0x2a6023[_0x584df4(0x10a)])),
                $(_0x584df4(0x102))[_0x584df4(0x129)](_0x2a6023["description"]["replace"](/\n/g, _0x584df4(0x122))),
                initShareEvents();
        })
        [_0xcafeb0(0x135)]((_0x4f9cc3) => {
            const _0x59f8a9 = _0xcafeb0;
            console[_0x59f8a9(0x10d)](_0x4f9cc3);
        });
}
function initEvents(_0xc8b319) {
    const _0xc7c983 = a10_0x1ffc2e;
    $("#copy_url_btn")["on"](_0xc7c983(0x10b), copyUrl),
        $(_0xc7c983(0xfa))["on"](_0xc7c983(0x10b), function () {
            const _0x5dc699 = $(this);
            toggleFavorite(_0x5dc699, _0xc8b319);
        });
    var _0x1b6656 = 0x0;
    $(_0xc7c983(0xf2))["click"](function () {
        const _0x511437 = _0xc7c983;
        _0x1b6656 == 0x0 ? ($("#mapShare")[_0x511437(0x125)](0xc8, _0x511437(0x136)), $("#mapShareOpen")["addClass"]("active"), (_0x1b6656 = 0x1)) : ($(_0x511437(0x11d))[_0x511437(0xff)](0xc8, _0x511437(0x136)), $(_0x511437(0xf2))["removeClass"](_0x511437(0x12c)), (_0x1b6656 = 0x0));
    }),
        $(_0xc7c983(0x103))[_0xc7c983(0x10b)](function () {
            const _0x24372b = _0xc7c983;
            $(_0x24372b(0x11d))[_0x24372b(0xff)](0xc8, _0x24372b(0x136)), $(_0x24372b(0xf2))["removeClass"](_0x24372b(0x12c)), (_0x1b6656 = 0x0);
        });
}
function toggleFavorite(_0x474f6e, _0x27327a) {
    const _0x252d81 = a10_0x1ffc2e;
    _0x474f6e["hasClass"](_0x252d81(0x12c)) ? favoriteCancel(_0x27327a) : favoriteRegister(_0x27327a);
}
async function favoriteCheck(_0x42232d) {
    const _0x701740 = a10_0x1ffc2e;
    if (!userInfo()) return;
    if (!_0x42232d) return;
    const _0x3d1dac = { ...userInfo(), viewNo: encodeURIComponent(_0x42232d), type: encodeURIComponent(_0x701740(0xf8)) };
    callApiAbort("/front/back/favorite/favorite_check.php", _0x701740(0x104), _0x3d1dac, _0x701740(0x107))
        [_0x701740(0x133)]((_0x246b83) => {
            const _0x116e80 = _0x701740;
            if (!_0x246b83) return;
            let { responseData: _0x3330ac, message: _0x2b1162, statusCode: _0x2623df } = _0x246b83;
            if (_0x2623df !== 0xc8) return;
            _0x3330ac && _0x3330ac[_0x116e80(0xfd)] > 0x0 && $(_0x116e80(0xfa))["addClass"](_0x116e80(0x12c));
        })
        [_0x701740(0x135)]((_0x215310) => {
            const _0x4191d5 = _0x701740;
            console[_0x4191d5(0x10d)](_0x215310);
        });
}
async function favoriteRegister(_0x1449f9) {
    const _0x34bae8 = a10_0x1ffc2e;
    if (!userInfo()) {
        const _0x7299e5 = await sweetAlertForReturn("로그인\x20후\x20시도해주세요.");
        if (_0x7299e5) {
            const _0x4907cb = _0x34bae8(0xf4);
            ajaxLoad(_0x4907cb);
        }
        return;
    }
    if (!_0x1449f9) return;
    const _0xff4c6e = { ...userInfo(), viewNo: encodeURIComponent(_0x1449f9), type: encodeURIComponent(_0x34bae8(0xf8)) };
    callApiAbort(_0x34bae8(0x112), _0x34bae8(0x104), _0xff4c6e, _0x34bae8(0x12b))
        [_0x34bae8(0x133)]((_0x5e520d) => {
            const _0x53fff4 = _0x34bae8;
            if (!_0x5e520d) {
                sweetAlertMessage(_0x53fff4(0x110));
                return;
            }
            const { responseData: _0x4b17a1, message: _0x261b74, statusCode: _0x504025 } = _0x5e520d;
            if (_0x504025 !== 0xc8) return;
            sweetAlertMessage("찜\x20등록되었습니다.", "", "s"), $("#favorite_btn")["addClass"](_0x53fff4(0x12c));
        })
        [_0x34bae8(0x135)]((_0x1fca95) => {
            console["log"](_0x1fca95);
        });
}
async function favoriteCancel(_0x1257aa) {
    const _0x12ddfc = a10_0x1ffc2e;
    if (!_0x1257aa) return;
    const _0x485004 = { ...userInfo(), viewNo: encodeURIComponent(_0x1257aa), type: encodeURIComponent("find") };
    callApiAbort(_0x12ddfc(0x134), "POST", _0x485004, _0x12ddfc(0x114))
        [_0x12ddfc(0x133)]((_0x3712b5) => {
            const _0x3fe327 = _0x12ddfc;
            if (!_0x3712b5) {
                sweetAlertMessage(_0x3fe327(0x110));
                return;
            }
            const { responseData: _0x4909b6, message: _0x57131b, statusCode: _0x32b557 } = _0x3712b5;
            if (_0x32b557 !== 0xc8) return;
            sweetAlertMessage(_0x3fe327(0x12f), "", "s"), $(_0x3fe327(0xfa))["removeClass"](_0x3fe327(0x12c));
        })
        [_0x12ddfc(0x135)]((_0x42b18a) => {
            const _0x37423c = _0x12ddfc;
            console[_0x37423c(0x10d)](_0x42b18a);
        });
}
function copyUrl() {
    const _0x58c6ed = a10_0x1ffc2e;
    navigator[_0x58c6ed(0x137)]
        [_0x58c6ed(0x119)](location[_0x58c6ed(0x109)])
        [_0x58c6ed(0x133)](function () {
            const _0x139c36 = _0x58c6ed;
            sweetAlertMessage(_0x139c36(0xf7), "", "s");
        })
        [_0x58c6ed(0x135)](function (_0x5bdce9) {
            const _0x9cc831 = _0x58c6ed;
            console[_0x9cc831(0x10d)](_0x9cc831(0x121) + _0x5bdce9);
        });
}
function initShareEvents() {
    const _0x4ecd48 = a10_0x1ffc2e;
    Kakao["init"](_0x4ecd48(0x106));
    const _0x4790c1 = window[_0x4ecd48(0x118)]["origin"] + (location[_0x4ecd48(0x111)] ? ":" + location[_0x4ecd48(0x111)] : "") + _0x4ecd48(0x117),
        _0x5819c9 =
            "[삽니다]\x20#토디\x20#삽니다\x20#부동산\x0a" + $(_0x4ecd48(0x132))[_0x4ecd48(0x12e)]() + "\x20" + $(_0x4ecd48(0x11c))[_0x4ecd48(0x12e)]() + "\x20" + $("#sale_type")[_0x4ecd48(0x12e)]() + "\x0a" + $(_0x4ecd48(0xfc))[_0x4ecd48(0x12e)]() + "\x0a" + $(_0x4ecd48(0xf9))[_0x4ecd48(0x12e)](),
        _0x58f516 = location[_0x4ecd48(0x109)];
    console["log"](_0x58f516), Kakao[_0x4ecd48(0xfe)][_0x4ecd48(0x113)]({ container: "#kakaotalk_sharing_btn", objectType: _0x4ecd48(0x12e), text: _0x5819c9, link: { mobileWebUrl: _0x58f516, webUrl: _0x58f516 } });
}
function handleError(_0x5c1148, _0x1a6aec) {
    switch (_0x1a6aec) {
        case 0x190:
            sweetAlertMessage(_0x5c1148, "", "e");
            return ![];
            break;
        case 0x194:
            sweetAlertMessage("문제가\x20발생했습니다.\x20", "", "e");
            return ![];
            break;
        case 0x1f4:
            sweetAlertMessage("문제가\x20발생했습니다.\x20", "", "e");
            return ![];
            break;
        default:
            return !![];
            break;
    }
}
function a10_0x5075() {
    const _0x2a5918 = [
        "1431582YaHjmX",
        "#description",
        "#mapShareClose",
        "POST",
        "sale_type",
        "847d6b0bbbc2dbfe6b7c0c1f82d8cd71",
        "favoriteCheck",
        "838733jWSznU",
        "href",
        "phone",
        "click",
        "exchange_fg",
        "log",
        "\x20~\x20",
        "sgg",
        "다시\x20시도해주세요.",
        "port",
        "/front/back/favorite/favorite_register.php",
        "createDefaultButton",
        "favoriteCancel",
        "교환불가능",
        "initDetail",
        "/front/assets/image/favicon.png",
        "location",
        "writeText",
        "viewNo",
        "sido",
        "#estate_type",
        "#mapShare",
        "min_area",
        "/front/back/find/find_view.php",
        "countUp",
        "복사\x20실패:\x20",
        "<br>",
        "length",
        "1171040nRDxAL",
        "slideDown",
        "정상적인\x20접근이\x20아닙니다.",
        "#sale_type",
        "max_price",
        "html",
        "458928oRXTDE",
        "favoriteRegister",
        "active",
        "㎡\x20~\x20",
        "text",
        "해제되었습니다.",
        "409473eNytVI",
        "816040LgulsH",
        "#address",
        "then",
        "/front/back/favorite/favorite_cancel.php",
        "catch",
        "easeOutQuad",
        "clipboard",
        "max_area",
        "#mapShareOpen",
        "/front/views/find/find_list",
        "/front/views/00-include/login.html",
        "ready",
        "8ZsjsKW",
        "URL이\x20클립보드에\x20복사되었습니다.",
        "find",
        "#area",
        "#favorite_btn",
        "191707cbTMsU",
        "#price",
        "cnt",
        "Share",
        "slideUp",
        "/front/back/find/count_up.php",
    ];
    a10_0x5075 = function () {
        return _0x2a5918;
    };
    return a10_0x5075();
}
