(function (_0x743e90, _0x3155d9) {
    const _0xb99dbc = a13_0x55ec,
        _0x5cccb2 = _0x743e90();
    while (!![]) {
        try {
            const _0xd6bb5d =
                (parseInt(_0xb99dbc(0x187)) / 0x1) * (parseInt(_0xb99dbc(0x1b2)) / 0x2) +
                (parseInt(_0xb99dbc(0x1b7)) / 0x3) * (parseInt(_0xb99dbc(0x183)) / 0x4) +
                parseInt(_0xb99dbc(0x198)) / 0x5 +
                parseInt(_0xb99dbc(0x1e0)) / 0x6 +
                (parseInt(_0xb99dbc(0x212)) / 0x7) * (-parseInt(_0xb99dbc(0x193)) / 0x8) +
                parseInt(_0xb99dbc(0x211)) / 0x9 +
                (-parseInt(_0xb99dbc(0x1d4)) / 0xa) * (parseInt(_0xb99dbc(0x1da)) / 0xb);
            if (_0xd6bb5d === _0x3155d9) break;
            else _0x5cccb2["push"](_0x5cccb2["shift"]());
        } catch (_0x5bbb7e) {
            _0x5cccb2["push"](_0x5cccb2["shift"]());
        }
    }
})(a13_0x41f8, 0xda2e8);
var mainSearchBoxChk = 0x0;
$(document)["ready"](function () {
    initScroll(), initSwiper(), getFaq(), getNews(), initEvents();
});
function initScroll() {
    SmoothScroll({ animationTime: 0x4b0, stepSize: 0x64, accelerationDelta: 0x32, accelerationMax: 0x3, touchpadSupport: ![] });
}
async function initSwiper() {
    const _0x4f343d = a13_0x55ec;
    try {
        await getRelatedSite();
    } catch (_0x43822c) {
    } finally {
        var _0x36a88a = new Swiper(_0x4f343d(0x1e2), {
            loop: !![],
            slidesPerView: 0x1,
            spaceBetween: 0x0,
            breakpoints: {
                0x578: { slidesPerView: 0x7, spaceBetween: 0xa },
                0x4b0: { slidesPerView: 0x7, spaceBetween: 0xa },
                0x3e0: { slidesPerView: 0x7, spaceBetween: 0xa },
                0x300: { slidesPerView: 0x4, spaceBetween: 0xa },
                0x1e0: { slidesPerView: 0x3, spaceBetween: 0xa },
                0x143: { slidesPerView: 0x2, spaceBetween: 0xa },
            },
        });
    }
    try {
        await getNotice();
    } catch (_0x19eca5) {
    } finally {
        var _0x36a88a = new Swiper(".default-swiper", { loop: !![], direction: _0x4f343d(0x19f), slidesPerView: 0x2, autoplay: { delay: 0x9c4, disableOnInteraction: !0x1 }, breakpoints: { 0x3e0: { slidesPerView: 0x2, spaceBetween: 0x32, direction: "horizontal" } } });
    }
}
function initEvents() {
    const _0x3239a1 = a13_0x55ec;
    $(_0x3239a1(0x200))["click"](function () {
        const _0x45d7bf = _0x3239a1;
        $(_0x45d7bf(0x196))[_0x45d7bf(0x210)] > 0x0 && ($(_0x45d7bf(0x19e))[_0x45d7bf(0x1a5)](0xc8, _0x45d7bf(0x1cc)), (mainSearchBoxChk = 0x1));
    }),
        $(_0x3239a1(0x20f))[_0x3239a1(0x1c5)](function (_0x3a4036) {
            const _0x334f64 = _0x3239a1;
            $(_0x334f64(0x19e))[_0x334f64(0x202)](_0x334f64(0x1d1)) == _0x334f64(0x1f1) && !$(_0x334f64(0x200))[_0x334f64(0x1c4)](_0x3a4036[_0x334f64(0x1f0)])["length"] && ($("#mainSearchKeyword")["slideUp"](0xc8, _0x334f64(0x1cc)), (mainSearchBoxChk = 0x0));
        }),
        $(_0x3239a1(0x197))["on"](
            _0x3239a1(0x1aa),
            debounce(async function (_0x50dbb0) {
                const _0x2c42be = _0x3239a1;
                if (_0x50dbb0["key"] == _0x2c42be(0x1ae)) return;
                _0x50dbb0[_0x2c42be(0x1b4)]();
                const _0x37562c = $(this)[_0x2c42be(0x1d6)]();
                if (!_0x37562c) {
                    $(_0x2c42be(0x209))["empty"](), $(_0x2c42be(0x19e))[_0x2c42be(0x201)](0xc8, "easeOutQuad"), (mainSearchBoxChk = 0x0);
                    return;
                }
                $(_0x2c42be(0x209))[_0x2c42be(0x1fe)](_0x2c42be(0x20c));
                mainSearchBoxChk == 0x0 && ($(_0x2c42be(0x19e))[_0x2c42be(0x1a5)](0xc8, _0x2c42be(0x1cc)), (mainSearchBoxChk = 0x1));
                var _0x12d864 = document[_0x2c42be(0x192)]("placesList");
                removeAllChildNods(_0x12d864),
                    await Promise[_0x2c42be(0x194)]([keywordSearch(_0x37562c), addressSearch(_0x37562c)]),
                    setTimeout(() => {
                        const _0x51872a = _0x2c42be;
                        $("#placesList")[_0x51872a(0x1cf)](_0x51872a(0x188))[_0x51872a(0x210)] === 0x0 && $(_0x51872a(0x1c6))[_0x51872a(0x1cf)](_0x51872a(0x18c))[_0x51872a(0x210)] === 0x0 && $(_0x51872a(0x1c6))["append"]("<li\x20class=\x27empty-li\x27>검색\x20결과가\x20없습니다.</li>");
                    }, 0x1f4);
            }, 0x12c)
        ),
        $(_0x3239a1(0x197))["on"](_0x3239a1(0x1aa), function (_0xe144e9) {
            const _0x42cc0c = _0x3239a1;
            if (_0xe144e9[_0x42cc0c(0x1fd)] !== "Enter") return;
            _0xe144e9[_0x42cc0c(0x1b4)]();
            if (!$(_0x42cc0c(0x197))[_0x42cc0c(0x1d6)]()) {
                alert("건물명, 지번, 도로명을 입력해주세요.");
                // location[_0x42cc0c(0x19a)] = _0x42cc0c(0x1f2);
                return;
            }
            $("#placesList\x20li:first")[_0x42cc0c(0x1c5)]();
        }),
        $("#search_btn")["on"](_0x3239a1(0x1c5), function () {
            const _0x40eff2 = _0x3239a1;
            if (!$("#search_input")[_0x40eff2(0x1d6)]()) {
                alert("건물명, 지번, 도로명을 입력해주세요.");
                // location[_0x40eff2(0x19a)] = _0x40eff2(0x1f2);
                return;
            }
            if ($(_0x40eff2(0x216))["length"] == 0x0) return;
            $(_0x40eff2(0x19d))[_0x40eff2(0x1c5)]();
        });
}
async function keywordSearch(_0x3e871a) {
    const _0x223d95 = a13_0x55ec;
    $[_0x223d95(0x1b5)]({
        url: "https://dapi.kakao.com/v2/local/search/keyword.json",
        type: _0x223d95(0x1b1),
        data: { page: 0x1, size: 0x5, sort: _0x223d95(0x1d9), query: _0x3e871a },
        headers: { Authorization: _0x223d95(0x1b3) },
        success: async function (_0x367be3) {
            const _0x291f59 = _0x223d95,
                { documents: _0x2fe6f4, meta: _0x5f2166 } = _0x367be3;
            if (_0x2fe6f4["length"] == 0x0) return;
            await displayPlaces(_0x2fe6f4), mainSearchBoxChk == 0x0 && ($("#mainSearchKeyword")[_0x291f59(0x1a5)](0xc8, _0x291f59(0x1cc)), (mainSearchBoxChk = 0x1));
        },
        error: function (_0x1ff8f0, _0x16efdd, _0x6d2b06) {
            const _0x408c6d = _0x223d95;
            console[_0x408c6d(0x20a)](_0x408c6d(0x1fa) + _0x6d2b06);
        },
    });
}
async function addressSearch(_0x3ed6bd) {
    const _0x67f907 = a13_0x55ec;
    $[_0x67f907(0x1b5)]({
        url: _0x67f907(0x1f6),
        type: "GET",
        data: { page: 0x1, size: 0x5, sort: _0x67f907(0x1d9), query: _0x3ed6bd, analyze_type: _0x67f907(0x190) },
        headers: { Authorization: _0x67f907(0x1b3) },
        success: async function (_0x124e72) {
            const _0x3febfd = _0x67f907,
                { documents: _0x56bfd8, meta: _0x1cb122 } = _0x124e72;
            if (_0x56bfd8[_0x3febfd(0x210)] == 0x0) {
            }
            await displayPlaces(_0x56bfd8), mainSearchBoxChk == 0x0 && ($("#mainSearchKeyword")["slideDown"](0xc8, _0x3febfd(0x1cc)), (mainSearchBoxChk = 0x1));
        },
        error: function (_0x582e0b, _0x4331eb, _0x4a8df1) {
            console["error"]("Error:\x20" + _0x4a8df1);
        },
    });
}
function placesSearchCB(_0x31abd1, _0x3012ea, _0x535470) {
    const _0x4372fe = a13_0x55ec;
    if (_0x3012ea === kakao[_0x4372fe(0x1e4)]["services"][_0x4372fe(0x1de)]["OK"]) displayPlaces(_0x31abd1), mainSearchBoxChk == 0x0 && ($(_0x4372fe(0x19e))[_0x4372fe(0x1a5)](0xc8, _0x4372fe(0x1cc)), (mainSearchBoxChk = 0x1));
    else {
        if (_0x3012ea === kakao[_0x4372fe(0x1e4)][_0x4372fe(0x184)][_0x4372fe(0x1de)][_0x4372fe(0x18e)]) return;
        else {
            if (_0x3012ea === kakao[_0x4372fe(0x1e4)]["services"]["Status"][_0x4372fe(0x1a3)]) return;
        }
    }
}
async function displayPlaces(_0xd6774d) {
    const _0x4442c4 = a13_0x55ec;
    var _0x30fed4 = document[_0x4442c4(0x192)](_0x4442c4(0x217)),
        _0x5d005a = document[_0x4442c4(0x1d3)](),
        _0x4740f0 = "";
    for (var _0x334c7c = 0x0; _0x334c7c < _0xd6774d[_0x4442c4(0x210)]; _0x334c7c++) {
        let _0xe984a2 = getListItem(_0x334c7c, _0xd6774d[_0x334c7c]);
        (function (_0x2f1740) {
            const _0x1bdc2f = _0x4442c4;
            _0xe984a2[_0x1bdc2f(0x1b6)] = function () {
                const _0x3f409d = _0x1bdc2f;
                sessionStorage[_0x3f409d(0x1ef)](_0x3f409d(0x213), JSON[_0x3f409d(0x1d8)](_0x2f1740)), (location["href"] = _0x3f409d(0x1bb) + _0x2f1740["y"] + "&curLng=" + _0x2f1740["x"]);
            };
        })(_0xd6774d[_0x334c7c]),
            _0x5d005a[_0x4442c4(0x1b9)](_0xe984a2);
    }
    $("#placesList")["find"](_0x4442c4(0x18c))[_0x4442c4(0x1ce)](), _0x30fed4[_0x4442c4(0x1b9)](_0x5d005a), (_0x30fed4[_0x4442c4(0x207)] = 0x0);
}
function getListItem(_0x113e31, _0x1c177b) {
    const _0x29538a = a13_0x55ec;
    let _0x1f7c89 = "";
    var _0x2c6c95 = document[_0x29538a(0x189)]("li");
    const _0xa512c3 = document["getElementById"](_0x29538a(0x1f9))[_0x29538a(0x1e7)][_0x29538a(0x18b)]()[_0x29538a(0x1cb)](/\s+/),
        _0x4c153b = document["getElementById"](_0x29538a(0x1f9))[_0x29538a(0x1e7)][_0x29538a(0x18b)](),
        _0x3febfa = (_0x1004e4) => {
            const _0x24c257 = _0x29538a,
                _0x2b17db = new RegExp("(" + _0xa512c3["join"]("|") + ")", "gi");
            return _0x1004e4[_0x24c257(0x1b0)](_0x2b17db, _0x24c257(0x180));
        },
        _0x1ddb6 = {
            MT1: _0x29538a(0x1c9),
            CS2: _0x29538a(0x181),
            PS3: _0x29538a(0x1ad),
            SC4: _0x29538a(0x1ab),
            AC5: _0x29538a(0x1c1),
            PK6: "<i\x20class=\x22las\x20la-lg\x20la-parking\x22></i>",
            OL7: "<i\x20class=\x22las\x20la-lg\x20la-gas-pump\x22></i>",
            SW8: _0x29538a(0x205),
            BK9: _0x29538a(0x20e),
            CT1: _0x29538a(0x1db),
            AG2: _0x29538a(0x186),
            PO3: "<i\x20class=\x22las\x20la-lg\x20la-landmark\x22></i>",
            AT4: _0x29538a(0x1ac),
            AD5: _0x29538a(0x1a9),
            FD6: _0x29538a(0x1f4),
            CE7: _0x29538a(0x1d7),
            HP8: _0x29538a(0x18d),
            PM9: _0x29538a(0x1ee),
        };
    let _0x38969f = "";
    return (
        _0x1c177b[_0x29538a(0x1bf)] ? (_0x38969f = _0x1ddb6[_0x1c177b[_0x29538a(0x1bf)]] || "") : (_0x38969f = _0x29538a(0x1fb)),
        _0x1c177b["place_name"] ? (_0x1f7c89 += _0x38969f + "\x20" + _0x3febfa(_0x1c177b[_0x29538a(0x19c)]) + _0x29538a(0x1cd) + _0x3febfa(_0x1c177b["place_name"]) + "\x20</strong>") : (_0x1f7c89 += _0x29538a(0x18f) + _0x3febfa(_0x1c177b[_0x29538a(0x19c)])),
        (_0x2c6c95["innerHTML"] = _0x1f7c89),
        (_0x2c6c95[_0x29538a(0x191)] = _0x29538a(0x1ca)),
        _0x2c6c95
    );
}
function removeAllChildNods(_0x5f45e7) {
    const _0x1b3835 = a13_0x55ec;
    while (_0x5f45e7[_0x1b3835(0x1ba)]()) {
        _0x5f45e7[_0x1b3835(0x1a2)](_0x5f45e7[_0x1b3835(0x214)]);
    }
}
async function getRelatedSite() {
    const _0x2cd5cc = a13_0x55ec,
        _0x3c3ce1 = await callApi(_0x2cd5cc(0x1ec), _0x2cd5cc(0x1c2), {});
    if (!_0x3c3ce1) return;
    const { statusCode: _0x19c4f4, message: _0x10ed09, responseData: _0xd22997 } = _0x3c3ce1;
    if (!_0xd22997) return;
    const _0x37ce6d = _0xd22997[_0x2cd5cc(0x1ed)]((_0x56d66f) => "<a\x20target=\x22_blank\x22\x20href=\x22" + _0x56d66f[_0x2cd5cc(0x203)] + "\x22\x20class=\x22swiper-slide\x22><img\x20src=\x22" + _0x56d66f[_0x2cd5cc(0x215)] + _0x2cd5cc(0x1dc))["join"]("");
    $(".main-partner\x20.swiper-wrapper")["html"](_0x37ce6d);
}
async function getNotice() {
    const _0x2d2507 = a13_0x55ec,
        _0xc4167e = await callApi(_0x2d2507(0x1ec), _0x2d2507(0x1af), {});
    if (!_0xc4167e) return;
    const { statusCode: _0xb632e7, message: _0xed1e89, responseData: _0x2c3a80 } = _0xc4167e;
    if (!_0x2c3a80) return;
    const _0x294411 = _0x2d2507(0x199),
        _0x49c270 = new Date(),
        _0x1dcfe3 = new Date(_0x49c270);
    _0x1dcfe3[_0x2d2507(0x19b)](_0x49c270["getDate"]() - 0x7);
    const _0x1c91c7 = _0x2c3a80[_0x2d2507(0x1ed)](function (_0x19151d, _0x4cbb53) {
        const _0xccf6e8 = _0x2d2507,
            _0x28718e = new Date(_0x19151d[_0xccf6e8(0x1be)]),
            _0x29efde = _0x28718e >= _0x1dcfe3,
            _0x1828a8 = _0x29efde ? _0x19151d[_0xccf6e8(0x18a)] + "\x20" + _0x294411 : _0x19151d["title"];
        return (
            "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20class=\x22swiper-slide\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h2><a\x20href=\x22/front/views/support/notice_view.html?viewNo=" +
            _0x19151d[_0xccf6e8(0x1e9)] +
            "\x22>" +
            _0x1828a8 +
            _0xccf6e8(0x1a7) +
            _0x19151d["reg_date"] +
            _0xccf6e8(0x1f7)
        );
    })[_0x2d2507(0x1a1)]("");
    $(_0x2d2507(0x1c3))["html"](_0x1c91c7);
}
function a13_0x55ec(_0xf7193f, _0x4fe9da) {
    const _0x41f8bf = a13_0x41f8();
    return (
        (a13_0x55ec = function (_0x55ec79, _0x329bdf) {
            _0x55ec79 = _0x55ec79 - 0x180;
            let _0x4439dc = _0x41f8bf[_0x55ec79];
            return _0x4439dc;
        }),
        a13_0x55ec(_0xf7193f, _0x4fe9da)
    );
}
async function getFaq() {
    const _0xdd132a = a13_0x55ec,
        _0x23fcf4 = await callApi(_0xdd132a(0x1ec), "/front/back/main/faq.php", {});
    if (!_0x23fcf4) return;
    const { statusCode: _0x20277e, message: _0x3eceed, responseData: _0x426ea1 } = _0x23fcf4;
    if (!_0x426ea1) return;
    const _0x783fe6 = _0x426ea1[_0xdd132a(0x1ed)](
        (_0x48cf77) =>
            _0xdd132a(0x1eb) +
            _0x48cf77[_0xdd132a(0x18a)] +
            _0xdd132a(0x1e3) +
            _0x48cf77[_0xdd132a(0x1f8)] +
            _0xdd132a(0x1a8) +
            _0x48cf77[_0xdd132a(0x1a4)] +
            "</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dd>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dl>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>"
    )["join"]("\x0a");
    $(_0xdd132a(0x1bd))["html"](_0x783fe6);
}
async function getNews() {
    const _0x5f227f = a13_0x55ec;
    try {
        const _0x2c9e7a = 0x3,
            _0x1ba474 = { items_per_page: _0x2c9e7a },
            _0x5a7ecd = "/front/back/support/news_list.php",
            _0x48e218 = await callApi(_0x5f227f(0x1ec), _0x5a7ecd, _0x1ba474),
            { statusCode: _0x5d73c6, message: _0x3308a1, responseData: _0x45b36b } = _0x48e218;
        if (_0x5d73c6 != 0xc8 && _0x3308a1 != _0x5f227f(0x1df)) return;
        const { displasy: _0x1c8c12, items: _0x22fe6b, lastBuildDate: _0x2b1403, start: _0x4ccd2d, total: _0x3f9315 } = _0x45b36b;
        let _0x2f2aed = "";
        if (_0x22fe6b["length"] > 0x0) {
            const _0x463cfb = _0x5f227f(0x199),
                _0xedda66 = new Date(),
                _0x427ffb = new Date(_0xedda66);
            _0x427ffb[_0x5f227f(0x19b)](_0xedda66["getDate"]() - 0x7),
                (_0x2f2aed = _0x22fe6b[_0x5f227f(0x1ed)](function (_0x133426, _0x5e0a5d) {
                    const _0x1113c5 = _0x5f227f,
                        _0x297cfb = new Date(_0x133426[_0x1113c5(0x1e8)]),
                        _0x13afcb = _0x297cfb >= _0x427ffb,
                        _0x1f5e0c = _0x13afcb ? _0x133426[_0x1113c5(0x18a)] + "\x20" + _0x463cfb : _0x133426[_0x1113c5(0x18a)],
                        _0x36b8f3 = _0x133426["pubDate"][_0x1113c5(0x1cb)]("\x20");
                    let _0x13a430 = _0x36b8f3[0x2];
                    switch (_0x13a430) {
                        case "Jan":
                            _0x13a430 = "01";
                            break;
                        case _0x1113c5(0x1ff):
                            _0x13a430 = "02";
                            break;
                        case _0x1113c5(0x20b):
                            _0x13a430 = "03";
                            break;
                        case _0x1113c5(0x204):
                            _0x13a430 = "04";
                            break;
                        case "May":
                            _0x13a430 = "05";
                            break;
                        case _0x1113c5(0x20d):
                            _0x13a430 = "06";
                            break;
                        case _0x1113c5(0x1ea):
                            _0x13a430 = "07";
                            break;
                        case _0x1113c5(0x1b8):
                            _0x13a430 = "08";
                            break;
                        case _0x1113c5(0x1d2):
                            _0x13a430 = "09";
                            break;
                        case _0x1113c5(0x1e1):
                            _0x13a430 = "10";
                            break;
                        case _0x1113c5(0x1d0):
                            _0x13a430 = "11";
                            break;
                        case _0x1113c5(0x1dd):
                            _0x13a430 = "12";
                            break;
                    }
                    const _0x218999 = _0x36b8f3[0x3] + "-" + _0x13a430 + "-" + _0x36b8f3[0x1];
                    return (
                        "<dl>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dt>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h2><a\x20target=\x22_blank\x22\x20href=\x22" +
                        _0x133426[_0x1113c5(0x1fc)] +
                        "\x22>" +
                        _0x1f5e0c +
                        _0x1113c5(0x206) +
                        _0x218999 +
                        _0x1113c5(0x1e5) +
                        _0x133426[_0x1113c5(0x1fc)] +
                        _0x1113c5(0x182)
                    );
                })[_0x5f227f(0x1a1)](""));
        } else _0x2f2aed = _0x5f227f(0x185);
        $(_0x5f227f(0x208))[_0x5f227f(0x1fe)](_0x2f2aed);
    } catch (_0x4467d2) {
    } finally {
    }
}
function debounce(_0x591500, _0x4f75cc) {
    let _0x2aa77c;
    return function (..._0x309d50) {
        const _0x200215 = a13_0x55ec,
            _0x36a6ff = this;
        clearTimeout(_0x2aa77c), (_0x2aa77c = setTimeout(() => _0x591500[_0x200215(0x1a6)](_0x36a6ff, _0x309d50), _0x4f75cc));
    };
}
function a13_0x41f8() {
    const _0x543b07 = [
        "replace",
        "GET",
        "368TtGBDJ",
        "KakaoAK\x20358571ae546aaa68be0d290878b351c1",
        "preventDefault",
        "ajax",
        "onclick",
        "1923qrCkVP",
        "Aug",
        "appendChild",
        "hasChildNodes",
        "/front/views/realPrice/realPrice.html?curLat=",
        "/front/assets/lottie/completion.json",
        ".main-faq\x20ul",
        "reg_date",
        "category_group_code",
        "#lottieCompletion",
        "<i\x20class=\x22las\x20la-lg\x20la-chalkboard-teacher\x22></i>",
        "/front/back/main/related_site.php",
        ".main-notice\x20.swiper-wrapper",
        "has",
        "click",
        "#placesList",
        "#lottieFail",
        "&quot;",
        "<i\x20class=\x22las\x20la-lg\x20la-store-alt\x22></i>",
        "item",
        "split",
        "easeOutQuad",
        "\x20<strong>\x20",
        "remove",
        "find",
        "Nov",
        "display",
        "Sep",
        "createDocumentFragment",
        "1110110OSnQcN",
        "setBottom",
        "val",
        "<i\x20class=\x22las\x20la-lg\x20la-coffee\x22></i>",
        "stringify",
        "accuracy",
        "264vAvFkr",
        "<i\x20class=\x22las\x20la-lg\x20la-theater-masks\x22></i>",
        "\x22\x20alt=\x22\x22\x20title=\x22\x22/></a>",
        "Dec",
        "Status",
        "SUCCESS",
        "9924630PKNYOX",
        "Oct",
        ".site-swiper",
        "</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<a\x20href=\x22/front/views/support/faq_view.html?viewNo=",
        "maps",
        "</h3>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dt>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dd>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<a\x20target=\x22_blank\x22\x20href=\x22",
        "iziModal",
        "value",
        "pubDate",
        "notice_no",
        "Jul",
        "<li\x20data-aos=\x22fade-up\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dl>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<!--\x20<dt><i\x20class=\x22fa-regular\x20fa-user\x22></i></dt>\x20-->\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dd\x20class=\x22w-100\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p\x20class=\x22faq-title-box\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>",
        "POST",
        "map",
        "<i\x20class=\x22las\x20la-lg\x20la-pills\x22></i>",
        "setItem",
        "target",
        "block",
        "/front/views/realPrice/realPrice.html",
        "&#039;",
        "<i\x20class=\x22las\x20la-lg\x20la-utensils\x22></i>",
        "&lt;",
        "https://dapi.kakao.com/v2/local/search/address.json",
        "</h3>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>",
        "faq_no",
        "search_input",
        "Error:\x20",
        "<i\x20class=\x22las\x20la-lg\x20la-building\x22></i>",
        "link",
        "key",
        "html",
        "Feb",
        "#mainSearchBox",
        "slideUp",
        "css",
        "site_url",
        "Apr",
        "<i\x20class=\x22las\x20la-lg\x20la-subway\x22></i>",
        "</a></h2>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h3>",
        "scrollTop",
        ".main-news\x20#news_list",
        "#mainSearchKeyword\x20ul",
        "error",
        "Mar",
        "<li>검색\x20중...</li>",
        "Jun",
        "<i\x20class=\x22las\x20la-lg\x20la-donate\x22></i>",
        "body",
        "length",
        "12342348xmfFog",
        "34993YWcvEH",
        "lastSearchedPlace",
        "lastChild",
        "site_image",
        "#placesList\x20li",
        "placesList",
        "<span\x20style=\x22color:coral;\x20font-weight:bold;\x22>$1</span>",
        "<i\x20class=\x22las\x20la-lg\x20la-store\x22></i>",
        "\x22><i\x20class=\x22fa-light\x20fa-chevron-right\x22></i></a>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dd>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dl>",
        "6652vTgNft",
        "services",
        "<dl>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dt>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h2><a\x20href=\x22#\x22>부동산\x20뉴스</a></h2>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h3>2024-05-05</h3>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dt>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dd>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<a\x20href=\x22#\x22><i\x20class=\x22fa-light\x20fa-chevron-right\x22></i></a>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dd>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dl>",
        "<i\x20class=\x22las\x20la-lg\x20la-balance-scale\x22></i>",
        "2369FOkuyt",
        "li.item",
        "createElement",
        "title",
        "trim",
        ".empty-li",
        "<i\x20class=\x22las\x20la-lg\x20la-hospital\x22></i>",
        "ZERO_RESULT",
        "<i\x20class=\x22las\x20la-lg\x20la-map-marker\x22></i>\x20",
        "similar",
        "className",
        "getElementById",
        "1784ljWZLy",
        "all",
        "470px",
        "#mainSearchKeyword\x20ul\x20li",
        "#search_input",
        "726785XbxRnC",
        "<img\x20src=\x22/front/assets/image/icn_new02.png\x22\x20height=\x2220\x22\x20alt=\x22\x22\x20title=\x22\x22>",
        "href",
        "setDate",
        "address_name",
        "#placesList\x20li:first",
        "#mainSearchKeyword",
        "vertical",
        "querySelector",
        "join",
        "removeChild",
        "ERROR",
        "content",
        "slideDown",
        "apply",
        "</a></h2>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h3>",
        "\x22><i\x20class=\x22fa-light\x20fa-chevron-right\x22></i></a>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22comtent-clamp\x20content-clamp-3\x22>",
        "<i\x20class=\x22las\x20la-lg\x20la-hotel\x22></i>",
        "keyup",
        "<i\x20class=\x22las\x20la-lg\x20la-school\x22></i>",
        "<i\x20class=\x22las\x20la-lg\x20la-camera-retro\x22></i>",
        "<i\x20class=\x22las\x20la-lg\x20las\x20la-shapes\x22></i>",
        "Enter",
        "/front/back/main/notice.php",
    ];
    a13_0x41f8 = function () {
        return _0x543b07;
    };
    return a13_0x41f8();
}
function escapeHtml(_0x1ef99a) {
    const _0x5451ce = a13_0x55ec;
    return _0x1ef99a[_0x5451ce(0x1b0)](/&/g, "&amp;")["replace"](/</g, _0x5451ce(0x1f5))[_0x5451ce(0x1b0)](/>/g, "&gt;")[_0x5451ce(0x1b0)](/"/g, _0x5451ce(0x1c8))[_0x5451ce(0x1b0)](/'/g, _0x5451ce(0x1f3));
}
function initModal() {
    const _0x1995cf = a13_0x55ec;
    _0xc6d891("#modalCompletion", _0x1995cf(0x1bc), _0x1995cf(0x1c0)), _0xc6d891("#modalFail", "/front/assets/lottie/failed.json", _0x1995cf(0x1c7));
    function _0xc6d891(_0x26873e, _0x5488a4, _0x517445) {
        const _0x4a94ab = _0x1995cf;
        $(_0x26873e)[_0x4a94ab(0x1e6)]({ width: _0x4a94ab(0x195) }), $(_0x26873e)["iziModal"]("setTop", 0x46), $(_0x26873e)["iziModal"](_0x4a94ab(0x1d5), 0x46);
        var _0x90317f = bodymovin["loadAnimation"]({ container: document[_0x4a94ab(0x1a0)](_0x517445), renderer: "svg", loop: !![], autoplay: !![], path: _0x5488a4 });
    }
}
