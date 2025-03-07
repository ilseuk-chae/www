const a32_0x23f0e1 = a32_0x5d3c;
(function (_0x517591, _0x44c804) {
    const _0x25c4f4 = a32_0x5d3c,
        _0x4b4b75 = _0x517591();
    while (!![]) {
        try {
            const _0x1e184b =
                parseInt(_0x25c4f4(0x12f)) / 0x1 +
                (parseInt(_0x25c4f4(0x16a)) / 0x2) * (-parseInt(_0x25c4f4(0x13f)) / 0x3) +
                parseInt(_0x25c4f4(0x178)) / 0x4 +
                (-parseInt(_0x25c4f4(0x132)) / 0x5) * (parseInt(_0x25c4f4(0x176)) / 0x6) +
                parseInt(_0x25c4f4(0x151)) / 0x7 +
                parseInt(_0x25c4f4(0x161)) / 0x8 +
                -parseInt(_0x25c4f4(0x144)) / 0x9;
            if (_0x1e184b === _0x44c804) break;
            else _0x4b4b75["push"](_0x4b4b75["shift"]());
        } catch (_0x6bef64) {
            _0x4b4b75["push"](_0x4b4b75["shift"]());
        }
    }
})(a32_0x2676, 0xdabe7);
let swiper;
$(document)[a32_0x23f0e1(0x14c)](function () {
    const _0x163ca5 = a32_0x23f0e1,
        _0xadfe73 = getParameter("viewNo");
    userInfo() && viewHistoryAdd(_0xadfe73), countUp(_0xadfe73), initDetail(_0xadfe73), initEvents(_0xadfe73), favoriteCheck(_0xadfe73), (swiper = new Swiper(_0x163ca5(0x16b), { slidesPerView: _0x163ca5(0x139), spaceBetween: 0xf }));
});
function viewHistoryAdd(_0x23e65a) {
    const _0x43ccac = a32_0x23f0e1,
        _0x1bc578 = "put",
        _0x409ebb = { ...userInfo(), viewNo: encodeURIComponent(_0x23e65a), type: encodeURIComponent(_0x1bc578) };
    callApiAbort("/front/back/history/view_history_add.php", _0x43ccac(0x17a), _0x409ebb, _0x43ccac(0x148))
        [_0x43ccac(0x169)]((_0x41896f) => {
            let { responseData: _0x26fccf, message: _0x5a0ad3, statusCode: _0x537524 } = _0x41896f;
        })
        [_0x43ccac(0x15e)]((_0x4dd0bf) => {
            const _0x4b97a2 = _0x43ccac;
            console[_0x4b97a2(0x143)](_0x4dd0bf);
        });
}
function countUp(_0x43a0c7) {
    const _0x43c950 = a32_0x23f0e1;
    if (!_0x43a0c7) return;
    const _0xb7636d = { viewNo: encodeURIComponent(_0x43a0c7) };
    callApiAbort("/front/back/put/count_up.php", _0x43c950(0x17a), _0xb7636d, _0x43c950(0x152))
        [_0x43c950(0x169)]((_0x23f20) => {
            let { responseData: _0x16cfb7, message: _0x47c263, statusCode: _0x1584fd } = _0x23f20;
        })
        [_0x43c950(0x15e)]((_0x489e29) => {
            const _0x5d6cbf = _0x43c950;
            console[_0x5d6cbf(0x143)](_0x489e29);
        });
}
function initDetail(_0x4e7a) {
    const _0x176c37 = a32_0x23f0e1;
    if (!_0x4e7a) {
        alert(_0x176c37(0x158)), (location[_0x176c37(0x155)] = _0x176c37(0x13d));
        return;
    }
    const _0x30155f = { viewNo: encodeURIComponent(_0x4e7a) };
    callApiAbort(_0x176c37(0x160), _0x176c37(0x17a), _0x30155f, "initDetail")
        [_0x176c37(0x169)](async (_0x5352a8) => {
            const _0x4ced81 = _0x176c37;
            let { responseData: _0x9f7c2b, message: _0x2c3403, statusCode: _0x5e0c78 } = _0x5352a8;
            if (!handleError(_0x2c3403, _0x5e0c78)) return;
            if (_0x9f7c2b[_0x4ced81(0x140)] == 0x0) {
                (await sweetAlertForReturn(_0x4ced81(0x158), "", "e")) && (location["href"] = "/front/views/put/put_list");
                return;
            }
            const _0x3f344b = _0x9f7c2b[0x0];
            $(_0x4ced81(0x147))[_0x4ced81(0x133)](_0x3f344b[_0x4ced81(0x14e)] ? _0x3f344b[_0x4ced81(0x14e)] : _0x3f344b["address_road"]),
                $("#estate_type")[_0x4ced81(0x133)](_0x3f344b[_0x4ced81(0x14a)]),
                $(_0x4ced81(0x168))[_0x4ced81(0x133)](_0x3f344b[_0x4ced81(0x17f)] + "(" + (_0x3f344b[_0x4ced81(0x14d)] == "Y" ? _0x4ced81(0x149) : _0x4ced81(0x135)) + ")"),
                $(_0x4ced81(0x13c))[_0x4ced81(0x133)](_0x3f344b[_0x4ced81(0x17f)] == "월세" ? formatPrice(_0x3f344b[_0x4ced81(0x130)]) + "\x20/\x20월\x20" + formatPrice(_0x3f344b["rent_price"]) : formatPrice(_0x3f344b["sale_price"])),
                $(_0x4ced81(0x174))[_0x4ced81(0x133)](comma(_0x3f344b[_0x4ced81(0x12e)] || "") + "㎡"),
                $(_0x4ced81(0x131))[_0x4ced81(0x133)](phoneOnDash(_0x3f344b["phone"])),
                $(_0x4ced81(0x164))[_0x4ced81(0x166)](_0x3f344b["description"][_0x4ced81(0x165)](/\n/g, _0x4ced81(0x167)));
            const _0x5352f9 = $(_0x4ced81(0x171));
            if (_0x3f344b[_0x4ced81(0x159)][_0x4ced81(0x140)] > 0x0) {
                _0x5352f9[_0x4ced81(0x153)]();
                for (let _0xe77351 = 0x0; _0xe77351 < _0x3f344b[_0x4ced81(0x159)][_0x4ced81(0x140)]; _0xe77351++) {
                    const _0x3e9abd = _0x4ced81(0x16e) + encodeURIComponent(_0x3f344b[_0x4ced81(0x159)][_0xe77351][_0x4ced81(0x162)]) + _0x4ced81(0x173),
                        _0x413867 = _0x4ced81(0x172) + encodeURIComponent(_0x3f344b[_0x4ced81(0x159)][_0xe77351][_0x4ced81(0x162)]) + _0x4ced81(0x15f) + _0x3e9abd + _0x4ced81(0x17e);
                    _0x5352f9[_0x4ced81(0x137)](_0x413867);
                }
                swiper[_0x4ced81(0x13e)]();
            }
            initShareEvents();
        })
        [_0x176c37(0x15e)]((_0x347585) => {
            const _0x45dbef = _0x176c37;
            console[_0x45dbef(0x143)](_0x347585);
        });
}
function initEvents(_0x52868a) {
    const _0xcfd3b8 = a32_0x23f0e1;
    $("#copy_url_btn")["on"]("click", copyUrl),
        $("#favorite_btn")["on"](_0xcfd3b8(0x157), function () {
            const _0x176589 = $(this);
            toggleFavorite(_0x176589, _0x52868a);
        });
    var _0x101197 = 0x0;
    $(_0xcfd3b8(0x145))[_0xcfd3b8(0x157)](function () {
        const _0x514c86 = _0xcfd3b8;
        _0x101197 == 0x0 ? ($(_0x514c86(0x170))["slideDown"](0xc8, _0x514c86(0x15d)), $(_0x514c86(0x145))["addClass"](_0x514c86(0x16f)), (_0x101197 = 0x1)) : ($(_0x514c86(0x170))[_0x514c86(0x16d)](0xc8, _0x514c86(0x15d)), $(_0x514c86(0x145))[_0x514c86(0x13a)](_0x514c86(0x16f)), (_0x101197 = 0x0));
    }),
        $("#mapShareClose")[_0xcfd3b8(0x157)](function () {
            const _0x48d1c6 = _0xcfd3b8;
            $("#mapShare")[_0x48d1c6(0x16d)](0xc8, "easeOutQuad"), $(_0x48d1c6(0x145))[_0x48d1c6(0x13a)](_0x48d1c6(0x16f)), (_0x101197 = 0x0);
        });
}
function toggleFavorite(_0xc54da3, _0x9a29aa) {
    const _0x512bcb = a32_0x23f0e1;
    _0xc54da3["hasClass"](_0x512bcb(0x16f)) ? favoriteCancel(_0x9a29aa) : favoriteRegister(_0x9a29aa);
}
async function favoriteCheck(_0x12541e) {
    const _0x19c39d = a32_0x23f0e1;
    if (!userInfo()) return;
    if (!_0x12541e) return;
    const _0x40dbe4 = { ...userInfo(), viewNo: encodeURIComponent(_0x12541e), type: encodeURIComponent(_0x19c39d(0x13b)) };
    callApiAbort("/front/back/favorite/favorite_check.php", _0x19c39d(0x17a), _0x40dbe4, _0x19c39d(0x154))
        [_0x19c39d(0x169)]((_0x254ff7) => {
            const _0xb8e75a = _0x19c39d;
            if (!_0x254ff7) return;
            let { responseData: _0x3a54fa, message: _0xb194e9, statusCode: _0x5d287f } = _0x254ff7;
            if (_0x5d287f !== 0xc8) return;
            _0x3a54fa && _0x3a54fa[_0xb8e75a(0x142)] > 0x0 && $(_0xb8e75a(0x146))[_0xb8e75a(0x17c)]("active");
        })
        [_0x19c39d(0x15e)]((_0x572c4e) => {
            const _0x2788a7 = _0x19c39d;
            console[_0x2788a7(0x143)](_0x572c4e);
        });
}
async function favoriteRegister(_0x18aabf) {
    const _0x18b153 = a32_0x23f0e1;
    if (!userInfo()) {
        const _0x59ea01 = await sweetAlertForReturn(_0x18b153(0x14f));
        if (_0x59ea01) {
            const _0x1a6345 = _0x18b153(0x141);
            ajaxLoad(_0x1a6345);
        }
        return;
    }
    if (!_0x18aabf) return;
    const _0x26f0d8 = { ...userInfo(), viewNo: encodeURIComponent(_0x18aabf), type: encodeURIComponent(_0x18b153(0x13b)) };
    callApiAbort(_0x18b153(0x150), _0x18b153(0x17a), _0x26f0d8, "favoriteRegister")
        [_0x18b153(0x169)]((_0x4c40e9) => {
            const _0x442865 = _0x18b153;
            if (!_0x4c40e9) {
                sweetAlertMessage("다시\x20시도해주세요.");
                return;
            }
            const { responseData: _0x198246, message: _0x51ae2e, statusCode: _0x5916c6 } = _0x4c40e9;
            if (_0x5916c6 !== 0xc8) return;
            sweetAlertMessage(_0x442865(0x179), "", "s"), $(_0x442865(0x146))[_0x442865(0x17c)]("active");
        })
        [_0x18b153(0x15e)]((_0x3703b7) => {
            const _0x283f09 = _0x18b153;
            console[_0x283f09(0x143)](_0x3703b7);
        });
}
async function favoriteCancel(_0x5b7a6a) {
    const _0x180c0e = a32_0x23f0e1;
    if (!_0x5b7a6a) return;
    const _0x1137c5 = { ...userInfo(), viewNo: encodeURIComponent(_0x5b7a6a), type: encodeURIComponent("put") };
    callApiAbort(_0x180c0e(0x15c), _0x180c0e(0x17a), _0x1137c5, _0x180c0e(0x16c))
        [_0x180c0e(0x169)]((_0x494fcd) => {
            const _0x2b799e = _0x180c0e;
            if (!_0x494fcd) {
                sweetAlertMessage(_0x2b799e(0x175));
                return;
            }
            const { responseData: _0x81221d, message: _0x391146, statusCode: _0x485767 } = _0x494fcd;
            if (_0x485767 !== 0xc8) return;
            sweetAlertMessage("해제되었습니다.", "", "s"), $(_0x2b799e(0x146))[_0x2b799e(0x13a)](_0x2b799e(0x16f));
        })
        ["catch"]((_0x5d053c) => {
            const _0xea2d3f = _0x180c0e;
            console[_0xea2d3f(0x143)](_0x5d053c);
        });
}
function copyUrl() {
    const _0x4b3090 = a32_0x23f0e1;
    navigator["clipboard"]
        ["writeText"](location[_0x4b3090(0x155)])
        [_0x4b3090(0x169)](function () {
            sweetAlertMessage("URL이\x20클립보드에\x20복사되었습니다.", "", "s");
        })
        ["catch"](function (_0x2ee5cb) {
            const _0x16e063 = _0x4b3090;
            console["log"](_0x16e063(0x15b) + _0x2ee5cb);
        });
}
function a32_0x2676() {
    const _0x213090 = [
        "then",
        "3342RpLnfq",
        ".fv-file",
        "favoriteCancel",
        "slideUp",
        "<img\x20src=\x22/front/back/put/put_images.php?token=",
        "active",
        "#mapShare",
        ".swiper-wrapper",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22swiper-slide\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<a\x20href=\x22/front/back/put/put_images.php?token=",
        "\x22\x20alt=\x22\x22\x20width=\x22100%\x22>",
        "#area",
        "다시\x20시도해주세요.",
        "18GRqXsQ",
        "#estate_type",
        "3016220nIcALP",
        "찜\x20등록되었습니다.",
        "POST",
        "location",
        "addClass",
        "port",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</a>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "sale_type",
        "Share",
        "area",
        "1456609QyAVrA",
        "sale_price",
        "#phone",
        "1295030raSArm",
        "text",
        "/front/assets/image/favicon.png",
        "교환불가능",
        "origin",
        "append",
        "init",
        "auto",
        "removeClass",
        "put",
        "#price",
        "/index",
        "update",
        "1809myWTPp",
        "length",
        "/front/views/00-include/login.html",
        "cnt",
        "log",
        "4549374JqlVPv",
        "#mapShareOpen",
        "#favorite_btn",
        "#address",
        "viewHistoryAdd",
        "교환가능",
        "estate_type",
        "#kakaotalk_sharing_btn",
        "ready",
        "exchange_fg",
        "address_jibun",
        "회원\x20전용\x20기능입니다.",
        "/front/back/favorite/favorite_register.php",
        "1917265ZsKsav",
        "countUp",
        "empty",
        "favoriteCheck",
        "href",
        "847d6b0bbbc2dbfe6b7c0c1f82d8cd71",
        "click",
        "정상적인\x20접근이\x20아닙니다.",
        "imageArray",
        "문제가\x20발생했습니다.\x20",
        "복사\x20실패:\x20",
        "/front/back/favorite/favorite_cancel.php",
        "easeOutQuad",
        "catch",
        "\x22\x20target=\x22_blank\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "/front/back/put/put_view.php",
        "5612264ruZKcv",
        "imageToken",
        "[팝니다]\x20#토디\x20#팝니다\x20#부동산\x0a",
        "#description",
        "replace",
        "html",
        "<br>",
        "#sale_type",
    ];
    a32_0x2676 = function () {
        return _0x213090;
    };
    return a32_0x2676();
}
function a32_0x5d3c(_0x3a826a, _0x532e2a) {
    const _0x267650 = a32_0x2676();
    return (
        (a32_0x5d3c = function (_0x5d3c52, _0x3f8897) {
            _0x5d3c52 = _0x5d3c52 - 0x12e;
            let _0x598a91 = _0x267650[_0x5d3c52];
            return _0x598a91;
        }),
        a32_0x5d3c(_0x3a826a, _0x532e2a)
    );
}
function initShareEvents() {
    const _0x5d5d18 = a32_0x23f0e1;
    Kakao[_0x5d5d18(0x138)](_0x5d5d18(0x156));
    const _0x5ba031 = window[_0x5d5d18(0x17b)][_0x5d5d18(0x136)] + (location[_0x5d5d18(0x17d)] ? ":" + location["port"] : "") + _0x5d5d18(0x134),
        _0x523183 = _0x5d5d18(0x163) + $(_0x5d5d18(0x147))[_0x5d5d18(0x133)]() + "\x20" + $(_0x5d5d18(0x177))[_0x5d5d18(0x133)]() + "\x20" + $(_0x5d5d18(0x168))[_0x5d5d18(0x133)]() + "\x0a" + $(_0x5d5d18(0x13c))[_0x5d5d18(0x133)]() + "\x0a" + $(_0x5d5d18(0x174))["text"](),
        _0x312273 = location[_0x5d5d18(0x155)];
    Kakao[_0x5d5d18(0x180)]["createDefaultButton"]({ container: _0x5d5d18(0x14b), objectType: _0x5d5d18(0x133), text: _0x523183, link: { mobileWebUrl: _0x312273, webUrl: _0x312273 } });
}
function handleError(_0x5e0a77, _0x520e5c) {
    const _0x8c70c1 = a32_0x23f0e1;
    switch (_0x520e5c) {
        case 0x190:
            sweetAlertMessage(_0x5e0a77, "", "e");
            return ![];
            break;
        case 0x194:
            sweetAlertMessage(_0x8c70c1(0x15a), "", "e");
            return ![];
            break;
        case 0x1f4:
            sweetAlertMessage(_0x8c70c1(0x15a), "", "e");
            return ![];
            break;
        default:
            return !![];
            break;
    }
}
