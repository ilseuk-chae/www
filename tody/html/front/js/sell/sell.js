const a53_0xca03c6 = a53_0x3dc2;
(function (_0x35ddd6, _0x309dfa) {
    const _0x36c8c4 = a53_0x3dc2,
        _0x5812e2 = _0x35ddd6();
    while (!![]) {
        try {
            const _0x6f2a26 =
                (parseInt(_0x36c8c4(0x360)) / 0x1) * (parseInt(_0x36c8c4(0x1f0)) / 0x2) +
                -parseInt(_0x36c8c4(0x36b)) / 0x3 +
                (-parseInt(_0x36c8c4(0x219)) / 0x4) * (parseInt(_0x36c8c4(0x2f6)) / 0x5) +
                -parseInt(_0x36c8c4(0x261)) / 0x6 +
                parseInt(_0x36c8c4(0x359)) / 0x7 +
                -parseInt(_0x36c8c4(0x2bf)) / 0x8 +
                (parseInt(_0x36c8c4(0x22e)) / 0x9) * (parseInt(_0x36c8c4(0x389)) / 0xa);
            if (_0x6f2a26 === _0x309dfa) break;
            else _0x5812e2["push"](_0x5812e2["shift"]());
        } catch (_0x259460) {
            _0x5812e2["push"](_0x5812e2["shift"]());
        }
    }
})(a53_0x4ff3, 0x4d430);
let searchPlacesExecuted = ![],
    searchEstateNo = ![],
    isKeyDown = ![];
$(document)[a53_0xca03c6(0x351)](async function () {
    const _0x3c9b6b = a53_0xca03c6;
    initAction(),
        initSearchEvents(),
        initHandleEvents(),
        initListEvents(),
        initFilters(),
        initMemoEvents(),
        handleUrlChangeForEstateNo(),
        window[_0x3c9b6b(0x246)](_0x3c9b6b(0x277), function (_0x5304ec) {
            handleUrlChangeForEstateNo();
        });
});
function handleUrlChangeForEstateNo() {
    const _0x4e1e00 = a53_0xca03c6,
        _0x3419de = new URLSearchParams(window[_0x4e1e00(0x251)][_0x4e1e00(0x342)]),
        _0x5a6df5 = parseFloat(_0x3419de["get"](_0x4e1e00(0x201)));
    _0x5a6df5 && estateDetail(_0x5a6df5);
}
function initAction() {
    const _0x3cda87 = a53_0xca03c6;
    $(window)[_0x3cda87(0x226)]() <= 0x3df && $(_0x3cda87(0x28d))["toggleClass"](_0x3cda87(0x1fa));
    $(_0x3cda87(0x317))[_0x3cda87(0x322)](function () {
        const _0x4f0f8f = _0x3cda87;
        $(_0x4f0f8f(0x2dc))[_0x4f0f8f(0x1ef)](0x190, _0x4f0f8f(0x258));
    }),
        $(_0x3cda87(0x210))[_0x3cda87(0x322)](function () {
            const _0x2e98eb = _0x3cda87;
            $(_0x2e98eb(0x2dc))[_0x2e98eb(0x274)](0x190, _0x2e98eb(0x258)), $(_0x2e98eb(0x1b8))[_0x2e98eb(0x274)](0x190, "easeOutQuad");
        }),
        $(_0x3cda87(0x347))[_0x3cda87(0x322)](function () {
            const _0x5c606a = _0x3cda87;
            $(_0x5c606a(0x1b8))[_0x5c606a(0x1f3)](_0x5c606a(0x2df)) == "none" ? $(".mo-tool-option")["fadeIn"](0x190, "easeOutQuad") : $(".mo-tool-option")["fadeOut"](0x190, _0x5c606a(0x258)), $(this)[_0x5c606a(0x20f)](_0x5c606a(0x1fa));
        }),
        $("#mapOptionToolOptionClose")["click"](function () {
            const _0x1e6c97 = _0x3cda87;
            $(_0x1e6c97(0x1b8))[_0x1e6c97(0x274)](0x190, _0x1e6c97(0x258)), $(_0x1e6c97(0x347))["removeClass"](_0x1e6c97(0x1fa));
        }),
        $(_0x3cda87(0x21c))[_0x3cda87(0x322)](function () {
            const _0x4e63a5 = _0x3cda87;
            $(this)[_0x4e63a5(0x20f)](_0x4e63a5(0x1fa));
        });
    var _0x2fc3cb = 0x0;
    $(_0x3cda87(0x2a6))[_0x3cda87(0x322)](function () {
        const _0x5f2462 = _0x3cda87;
        $(_0x5f2462(0x28d))[_0x5f2462(0x220)](_0x5f2462(0x1fa))
            ? ($(_0x5f2462(0x28d))[_0x5f2462(0x37b)](_0x5f2462(0x1fa)), $(_0x5f2462(0x350))["removeClass"](_0x5f2462(0x1fa)), $(".map-bg")[_0x5f2462(0x1ce)](_0x5f2462(0x1e1)), $(_0x5f2462(0x1f7))[_0x5f2462(0x1ce)](_0x5f2462(0x1e1)), $(".map-sell-view")[_0x5f2462(0x37b)]("active"))
            : ($(_0x5f2462(0x28d))[_0x5f2462(0x1ce)]("active"), $(_0x5f2462(0x350))[_0x5f2462(0x1ce)]("active"), $(_0x5f2462(0x355))[_0x5f2462(0x37b)](_0x5f2462(0x1e1)), $(_0x5f2462(0x1f7))[_0x5f2462(0x37b)](_0x5f2462(0x1e1))),
            $(".map-bg")[_0x5f2462(0x358)](_0x5f2462(0x28e), function () {
                const _0x34a7b6 = _0x5f2462;
                map[_0x34a7b6(0x2c0)]();
            });
    }),
        $(_0x3cda87(0x266))[_0x3cda87(0x322)](function () {
            const _0x2c9322 = _0x3cda87;
            if ($(this)[_0x2c9322(0x220)](_0x2c9322(0x329))) $(_0x2c9322(0x28d))["removeClass"](_0x2c9322(0x329)), $(this)[_0x2c9322(0x37b)]("active\x20full");
            else $(this)[_0x2c9322(0x220)](_0x2c9322(0x1fa)) ? ($(".map-content")["addClass"](_0x2c9322(0x1e1)), $(this)[_0x2c9322(0x1ce)](_0x2c9322(0x1e1))) : ($(_0x2c9322(0x28d))["addClass"](_0x2c9322(0x329)), $(this)["addClass"](_0x2c9322(0x329)));
        }),
        $(_0x3cda87(0x346))["click"](function () {
            const _0x58171b = _0x3cda87;
            $(_0x58171b(0x29a))[_0x58171b(0x20f)](_0x58171b(0x1fa));
        }),
        $(_0x3cda87(0x35f))["click"](function () {
            const _0x59347a = _0x3cda87;
            $(_0x59347a(0x29a))[_0x59347a(0x20f)](_0x59347a(0x1fa));
        }),
        $(_0x3cda87(0x1d6))["click"](function () {
            const _0x7bb699 = _0x3cda87;
            $("#mapShare")["slideToggle"](0xc8, _0x7bb699(0x258))[_0x7bb699(0x20f)](_0x7bb699(0x1fa));
        }),
        $(_0x3cda87(0x33e))[_0x3cda87(0x322)](function () {
            const _0x161631 = _0x3cda87;
            $(_0x161631(0x2e1))[_0x161631(0x2d3)](0xc8, _0x161631(0x258))["removeClass"](_0x161631(0x1fa));
        }),
        $(_0x3cda87(0x24c))["click"](function () {
            const _0x14cc4c = _0x3cda87;
            $(".print-opt")[_0x14cc4c(0x2ec)](0xc8, _0x14cc4c(0x258))["toggleClass"]("active");
        }),
        $(".print-opt")["on"]("click", _0x3cda87(0x2cd), function () {
            const _0xd23035 = _0x3cda87;
            $(_0xd23035(0x365))[_0xd23035(0x2d3)](0xc8, "easeOutQuad")[_0xd23035(0x37b)](_0xd23035(0x1fa));
        }),
        $(_0x3cda87(0x36c))["on"](_0x3cda87(0x322), "button", function () {
            const _0x9e60ac = _0x3cda87;
            if ($(this)["is"](_0x9e60ac(0x24e))) {
                $(this)["toggleClass"](_0x9e60ac(0x1fa));
                return;
            } else {
                if ($(this)["is"](_0x9e60ac(0x31d))) return;
                else $(_0x9e60ac(0x319))[_0x9e60ac(0x2c3)](_0x9e60ac(0x24e))["removeClass"](_0x9e60ac(0x1fa)), $(this)["addClass"](_0x9e60ac(0x1fa));
            }
        }),
        $(_0x3cda87(0x21e))["on"](_0x3cda87(0x322), "dl", function (_0x3d89de) {
            const _0x110042 = _0x3cda87;
            if ($(_0x3d89de[_0x110042(0x352)])[_0x110042(0x339)](_0x110042(0x32d))[_0x110042(0x2b6)]) {
                _0x3d89de[_0x110042(0x1df)]();
                return;
            }
            $(_0x110042(0x283))[_0x110042(0x1ce)](_0x110042(0x1fa));
        }),
        $(_0x3cda87(0x357))[_0x3cda87(0x322)](function () {
            const _0x3dc9a2 = _0x3cda87;
            $(_0x3dc9a2(0x283))[_0x3dc9a2(0x37b)]("active");
        }),
        $(_0x3cda87(0x1ea))[_0x3cda87(0x274)](),
        $(_0x3cda87(0x30c))[_0x3cda87(0x274)](),
        $(_0x3cda87(0x372))["on"](_0x3cda87(0x2b7), function () {
            const _0x49655e = _0x3cda87;
            $(this)[_0x49655e(0x334)]() > 0x0 ? $("#list_top_btn")[_0x49655e(0x1ef)]() : $(_0x49655e(0x1ea))[_0x49655e(0x274)]();
        }),
        $(_0x3cda87(0x1c6))["on"](_0x3cda87(0x2b7), function () {
            const _0x329507 = _0x3cda87;
            $(this)[_0x329507(0x334)]() > 0x0 ? $(_0x329507(0x30c))[_0x329507(0x1ef)]() : $(_0x329507(0x30c))[_0x329507(0x274)]();
        }),
        $(_0x3cda87(0x1ea))["on"]("click", function () {
            const _0x9d563a = _0x3cda87;
            $(_0x9d563a(0x372))[_0x9d563a(0x1d1)]({ scrollTop: 0x0 }, _0x9d563a(0x25d));
        }),
        $(_0x3cda87(0x30c))["on"](_0x3cda87(0x322), function () {
            const _0x3d5e3f = _0x3cda87;
            $(_0x3d5e3f(0x1c6))[_0x3d5e3f(0x1d1)]({ scrollTop: 0x0 }, _0x3d5e3f(0x25d));
        });
}
function initSearchEvents() {
    const _0xf881b5 = a53_0xca03c6;
    $(document)["on"](
        _0xf881b5(0x23e),
        _0xf881b5(0x363),
        debounce(function (_0x1f1415) {
            const _0x2b815e = _0xf881b5,
                { resultListItems: _0x485486, searchBox: _0x4878e2, searchInput: _0x5bf646 } = getSearchElements(),
                _0x561e53 = $(this)[_0x2b815e(0x1d2)]()[_0x2b815e(0x2c4)](),
                _0x164615 = _0x485486[_0x2b815e(0x380)]($(_0x2b815e(0x361)));
            if (_0x1f1415["key"] === _0x2b815e(0x287) || _0x1f1415[_0x2b815e(0x2a2)] === "ArrowRight") return;
            if (_0x1f1415["key"] === _0x2b815e(0x203) || _0x1f1415["key"] === "ArrowDown") {
                _0x1f1415[_0x2b815e(0x2d9)](), _0x1f1415[_0x2b815e(0x1df)](), upDownEvent(_0x1f1415, _0x561e53, _0x485486, _0x164615);
                return;
            }
            if (_0x1f1415[_0x2b815e(0x2a2)] === _0x2b815e(0x21f)) {
                _0x1f1415[_0x2b815e(0x2d9)](), enterEvent(_0x1f1415, _0x561e53, _0x485486, _0x164615);
                return;
            }
            /^\d+$/[_0x2b815e(0x316)](_0x561e53) ? (_0x4878e2[_0x2b815e(0x2d3)](0x64, _0x2b815e(0x258)), (searchPlacesExecuted = ![])) : (searchPlaces(), (searchPlacesExecuted = !![]));
        }, 0x64)
    ),
        $(document)["on"](_0xf881b5(0x322), "#search_input,\x20#search_input_mobile", function () {
            const _0x216fe8 = _0xf881b5,
                { searchBox: _0x4ef432 } = getSearchElements();
            _0x4ef432["find"](_0x216fe8(0x1e8))[_0x216fe8(0x2b6)] > 0x0 && _0x4ef432[_0x216fe8(0x1d9)](0x64, _0x216fe8(0x258));
        }),
        $(document)["on"](_0xf881b5(0x322), _0xf881b5(0x207), function (_0x599ff1) {
            const _0xcde6bf = _0xf881b5,
                { resultListItems: _0x662d7b, searchInput: _0x240d7d } = getSearchElements(),
                _0x56c668 = _0x240d7d[_0xcde6bf(0x1d2)]()[_0xcde6bf(0x2c4)](),
                _0x1d9e3f = _0x662d7b[_0xcde6bf(0x380)]($(_0xcde6bf(0x361)));
            enterEvent(_0x599ff1, _0x56c668, _0x662d7b, _0x1d9e3f);
        }),
        $(_0xf881b5(0x262))["click"](function (_0x449658) {
            const _0x2da10b = _0xf881b5,
                { searchBox: _0x278604, searchInput: _0x5ea3ec } = getSearchElements();
            if (_0x5ea3ec["is"](_0x449658[_0x2da10b(0x352)]) || _0x5ea3ec["has"](_0x449658[_0x2da10b(0x352)])["length"]) return;
            _0x278604[_0x2da10b(0x1f3)](_0x2da10b(0x2df)) == _0x2da10b(0x300) && _0x278604[_0x2da10b(0x2d3)](0x64, _0x2da10b(0x258));
        });
}
function initHandleEvents() {
    const _0x240add = a53_0xca03c6;
    $("#filter_apply_btn")["on"]("click", function () {
        estateList();
    }),
        $(_0x240add(0x249))["on"](_0x240add(0x322), function () {
            resetFilters();
        }),
        $(_0x240add(0x332))["on"](_0x240add(0x322), function () {
            const _0x1c5de2 = _0x240add;
            abortRequest("landDetail"), $(_0x1c5de2(0x284))[_0x1c5de2(0x220)](_0x1c5de2(0x1fa)) ? (clearAllPolygons(), (isMultiSelectMode = !![])) : ((isMultiSelectMode = ![]), clearAllPolygons()), (landWFSArrays = []), $(_0x1c5de2(0x288))[_0x1c5de2(0x1de)](), landAnalysisTotal();
        }),
        $(_0x240add(0x26e))["on"](_0x240add(0x322), function () {
            const _0x3a0d86 = _0x240add;
            printDiv(_0x3a0d86(0x2d8));
        }),
        $(_0x240add(0x1f5))["on"]("click", function () {
            const _0x251e78 = _0x240add;
            saveMap(_0x251e78(0x2d8));
        }),
        $(_0x240add(0x371))["on"](_0x240add(0x322), function () {
            initShareEvents();
        }),
        $("#copy_url_btn")["on"]("click", function () {
            copyUrl();
        }),
        $("#favorite_btn")["on"](_0x240add(0x322), function () {
            const _0x2b9d11 = $(this);
            toggleFavorite(_0x2b9d11);
        }),
        $(_0x240add(0x38c))["on"](_0x240add(0x322), function () {
            printSelectedSections();
        }),
        $("#mapHistoryOpen")["on"]("click", function () {
            getRescentHistory();
        }),
        $(document)["on"](_0x240add(0x322), ".remove-history-btn", function () {
            const _0x280c67 = $(this);
            removeHistory(_0x280c67);
        }),
        $(".mhl-more-btn")["on"](_0x240add(0x322), function () {
            const _0x32199c = _0x240add;
            $(this)[_0x32199c(0x339)](_0x32199c(0x278))[_0x32199c(0x25c)]("dl.d-none")[_0x32199c(0x37b)](_0x32199c(0x25f));
        }),
        $(document)["on"](_0x240add(0x322), _0x240add(0x338), function () {
            const _0x2a0522 = _0x240add,
                _0x5d3149 = $(this)[_0x2a0522(0x245)](_0x2a0522(0x212)),
                _0xc2bcaa = $(this)[_0x2a0522(0x245)](_0x2a0522(0x382)),
                _0x5affa8 = new kakao["maps"][_0x2a0522(0x2d6)](_0x5d3149, _0xc2bcaa);
            map[_0x2a0522(0x27f)](_0x5affa8), map["setLevel"](0x4), updateURL({ curLat: _0x5d3149, curLng: _0xc2bcaa });
        }),
        $(_0x240add(0x37f))["on"](_0x240add(0x322), function () {
            const _0x215051 = $(this);
            onHistoryMarkers(_0x215051);
        }),
        $(_0x240add(0x1b7))["on"](_0x240add(0x322), function () {
            const _0xc33f5a = _0x240add;
            historyMarkers["forEach"]((_0x22a1a7) => _0x22a1a7[_0xc33f5a(0x1e2)](null));
        });
}
function initListEvents() {
    const _0x1f1c63 = a53_0xca03c6;
    $(_0x1f1c63(0x325))["on"](_0x1f1c63(0x322), function () {
        estateList();
    }),
        $(_0x1f1c63(0x21e))["on"](_0x1f1c63(0x322), "dl", function (_0x4dbc30) {
            const _0x51687e = _0x1f1c63;
            if ($(_0x4dbc30[_0x51687e(0x352)])[_0x51687e(0x339)](_0x51687e(0x32d))[_0x51687e(0x2b6)]) {
                _0x4dbc30["stopPropagation"]();
                return;
            }
            const _0x22132c = $(this)[_0x51687e(0x245)](_0x51687e(0x1b9));
            updateURL({ estateNo: _0x22132c });
        }),
        $(_0x1f1c63(0x21e))["on"](_0x1f1c63(0x322), _0x1f1c63(0x22f), function () {
            const _0x5ebc07 = _0x1f1c63,
                _0x27a8f = $(this)[_0x5ebc07(0x245)](_0x5ebc07(0x1b9));
            estateList("", _0x27a8f);
        }),
        $(_0x1f1c63(0x373))[_0x1f1c63(0x322)](function () {
            updateURL({ estateNo: "" });
        }),
        $("#msv_content")["on"](_0x1f1c63(0x322), ".agency_name", function () {
            const _0x544045 = _0x1f1c63,
                _0x2b08e3 = $(_0x544045(0x1f2))[_0x544045(0x1dc)]();
            estateList("", _0x2b08e3);
        });
}
async function estateList(_0x4509d3 = "", _0x4032aa = "") {
    const _0x2a5dce = a53_0xca03c6,
        _0x4ded09 = collectFilterParams(),
        _0x27dd88 = $(_0x2a5dce(0x21e)),
        _0x1f2033 = _0x27dd88[_0x2a5dce(0x23d)]("dl")[_0x2a5dce(0x2b6)],
        _0x11c572 = map[_0x2a5dce(0x2b4)](),
        _0x2e4d33 = _0x11c572[_0x2a5dce(0x267)](),
        _0x4ce20b = _0x11c572["getNorthEast"](),
        _0x205990 = { ..._0x4ded09, searchNo: _0x4509d3, propertyNo: _0x4032aa, swLat: _0x2e4d33["getLat"](), swLng: _0x2e4d33[_0x2a5dce(0x2a0)](), neLat: _0x4ce20b[_0x2a5dce(0x356)](), neLng: _0x4ce20b["getLng"]() };
    callApiAbort("/front/back/sell/estate_list.php", _0x2a5dce(0x335), _0x205990, _0x2a5dce(0x312))
        [_0x2a5dce(0x2e6)]((_0xcc341d) => {
            const _0x5a3ea8 = _0x2a5dce;
            if (!_0xcc341d) return;
            const { statusCode: _0x55e59b, message: _0x3a6abd, responseData: _0x325bd7 } = _0xcc341d;
            if (_0x55e59b !== 0xc8) return;
            Object[_0x5a3ea8(0x1be)](clusterersByType)["forEach"]((_0x4b6813) => _0x4b6813["clear"]());
            let _0x1bd3f0 = "";
            !Array["isArray"](_0x325bd7) || _0x325bd7[_0x5a3ea8(0x2b6)] === 0x0
                ? (_0x1bd3f0 = _0x5a3ea8(0x379))
                : (_0x1bd3f0 = _0x325bd7["map"](function (_0x4a8e16, _0x341aa6) {
                      const _0x57c027 = _0x5a3ea8;
                      _0x4509d3 && _0x341aa6 === 0x0 && map[_0x57c027(0x26c)](new kakao[_0x57c027(0x35d)]["LatLng"](_0x4a8e16["lat"], _0x4a8e16[_0x57c027(0x1e9)]));
                      const _0x2c5ce1 = map["getLevel"]();
                      let _0x24b614 = null;
                      _0x2c5ce1 > 0x5 ? (_0x24b614 = createClustererAll(_0x57c027(0x2e4))) : (_0x24b614 = createClusterer(_0x4a8e16["estate_type"], _0x4a8e16["sale_type"]));
                      const _0x291842 = createClusteredMarker(_0x4a8e16);
                      _0x24b614[_0x57c027(0x1bc)](_0x291842);
                      const _0x5025ad = _0x4a8e16["exclusive_building"] === "Y";
                      let _0x458c27 = _0x5025ad ? _0x57c027(0x318) : _0x57c027(0x333),
                          _0x43db87 = "",
                          _0x19b159 = "";
                      switch (_0x4a8e16[_0x57c027(0x230)]) {
                          case "임대":
                              (_0x43db87 = _0x57c027(0x2a1)), (_0x19b159 = "<span\x20class=\x22text-nowrap\x22>" + formatPrice(_0x4a8e16[_0x57c027(0x1b0)], _0x57c027(0x2e4), !![]) + _0x57c027(0x385) + formatPrice(_0x4a8e16[_0x57c027(0x200)], "all", !![]) + _0x57c027(0x290));
                              break;
                          case "매매":
                              (_0x43db87 = _0x57c027(0x368)), (_0x19b159 = "" + formatPrice(_0x4a8e16["sale_price"], "all", !![]));
                              break;
                          case "교환":
                              (_0x43db87 = "<span\x20class=\x22label-default\x20bg-indigo1\x22>교환</span>"), (_0x19b159 = "" + formatPrice(_0x4a8e16["sale_price"], _0x57c027(0x2e4), !![]));
                              break;
                      }
                      let _0x598754 = "";
                      switch (_0x4a8e16[_0x57c027(0x296)]) {
                          case "토지":
                              _0x598754 = formatArea(_0x4a8e16[_0x57c027(0x32a)]);
                              break;
                          default:
                              _0x598754 = formatArea(_0x4a8e16[_0x57c027(0x270)]);
                      }
                      let _0x40f6ff = "";
                      if (_0x4a8e16[_0x57c027(0x27c)][_0x57c027(0x2b6)] > 0x0) {
                          const _0x23fb35 = "/front/back/00-include/image.php?token=" + encodeURIComponent(_0x4a8e16[_0x57c027(0x27c)][0x0]["imageToken"]);
                          if (_0x4a8e16[_0x57c027(0x27c)][0x0][_0x57c027(0x2fe)] === "image") _0x40f6ff = _0x57c027(0x2d7) + _0x23fb35 + _0x57c027(0x313);
                          else
                              _0x4a8e16[_0x57c027(0x27c)][0x0]["fileType"] === _0x57c027(0x324)
                                  ? (_0x40f6ff =
                                        _0x57c027(0x331) +
                                        _0x23fb35 +
                                        "\x22\x20type=\x22video/mp4\x22\x20class=\x22h-100\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20Your\x20browser\x20does\x20not\x20support\x20the\x20video\x20tag.\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</video>")
                                  : (_0x40f6ff = _0x57c027(0x374));
                      } else _0x40f6ff = _0x57c027(0x374);
                      return (
                          _0x57c027(0x341) +
                          _0x458c27 +
                          _0x57c027(0x366) +
                          _0x4a8e16[_0x57c027(0x367)] +
                          _0x57c027(0x27e) +
                          _0x43db87 +
                          "\x20" +
                          _0x4a8e16[_0x57c027(0x296)] +
                          _0x57c027(0x260) +
                          _0x19b159 +
                          "</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20class=\x22text-nowrap\x22>" +
                          _0x598754 +
                          _0x57c027(0x386) +
                          (_0x4a8e16[_0x57c027(0x38d)] ? _0x4a8e16["description"] : "매물설명\x20없음") +
                          _0x57c027(0x233) +
                          _0x4a8e16[_0x57c027(0x367)] +
                          _0x57c027(0x34a) +
                          _0x4a8e16["agency_name"] +
                          _0x57c027(0x1e4) +
                          _0x4a8e16[_0x57c027(0x255)] +
                          _0x57c027(0x32c) +
                          _0x40f6ff +
                          "</dd>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dl>"
                      );
                  })),
                _0x27dd88["children"]("dl")
                    [_0x5a3ea8(0x274)](0x64)
                    [_0x5a3ea8(0x30d)]()
                    ["done"](function () {
                        const _0x5f1130 = _0x5a3ea8;
                        _0x27dd88[_0x5f1130(0x1de)]()[_0x5f1130(0x291)](_0x1bd3f0), _0x27dd88[_0x5f1130(0x23d)]("dl")[_0x5f1130(0x36a)]()[_0x5f1130(0x348)](0x96)[_0x5f1130(0x1ef)](0x190);
                    });
        })
        [_0x2a5dce(0x2a4)]((_0x48465d) => {
            const _0x460b59 = _0x2a5dce;
            console[_0x460b59(0x2ed)](_0x48465d);
        });
}
async function estateDetail(_0x3c045b) {
    const _0x35b9d3 = a53_0xca03c6;
    $(_0x35b9d3(0x283))["removeClass"](_0x35b9d3(0x1fa));
    if (isNaN(_0x3c045b)) return;
    const _0x227d55 = _0x35b9d3(0x208),
        _0x3a8194 = { estate_no: _0x3c045b };
    callApiAbort(_0x227d55, _0x35b9d3(0x335), _0x3a8194, _0x35b9d3(0x234))
        [_0x35b9d3(0x2e6)](async (_0x1dc7e0) => {
            const _0x5c4c70 = _0x35b9d3;
            if (!_0x1dc7e0) return;
            const { statusCode: _0x53586b, message: _0x2fbd96, responseData: _0x2e8ec7 } = _0x1dc7e0;
            if (_0x53586b !== 0xc8 || _0x2fbd96 !== _0x5c4c70(0x1e6)) return;
            favoriteCheck(_0x3c045b), await renderEstateDetail(_0x2e8ec7), $(_0x5c4c70(0x283))["addClass"](_0x5c4c70(0x1fa)), recentVisit(_0x2e8ec7);
        })
        [_0x35b9d3(0x2a4)]((_0x2f3fdb) => {
            const _0xaee004 = _0x35b9d3;
            console[_0xaee004(0x2ed)](_0x2f3fdb);
        })
        [_0x35b9d3(0x2b9)](function () {});
}
async function renderEstateDetail(_0x43caf6) {
    const _0x872328 = a53_0xca03c6;
    swiper_image(_0x43caf6[_0x872328(0x27c)]);
    let _0x297312 = "",
        _0x7cdf89 = "";
    switch (_0x43caf6[_0x872328(0x230)]) {
        case "임대":
            (_0x297312 = _0x872328(0x2a1)), (_0x7cdf89 = _0x872328(0x31a) + formatPrice(_0x43caf6["rent_price"], "all", !![]) + "원\x20/\x20보증금\x20" + formatPrice(_0x43caf6[_0x872328(0x215)], "all", !![]) + "원");
            break;
        case "매매":
            (_0x297312 = _0x872328(0x368)), (_0x7cdf89 = _0x872328(0x1f9) + formatPrice(_0x43caf6[_0x872328(0x1b0)], "all", !![]) + "원");
            break;
        case "교환":
            (_0x297312 = _0x872328(0x2cc)), (_0x7cdf89 = _0x872328(0x21a) + formatPrice(_0x43caf6[_0x872328(0x1b0)], _0x872328(0x2e4), !![]) + "원");
            break;
    }
    $("#map_sell_view\x20.msv-info\x20dt")[_0x872328(0x222)](_0x297312 + "\x20" + _0x43caf6[_0x872328(0x296)]),
        $(_0x872328(0x280))[_0x872328(0x1dc)](_0x43caf6[_0x872328(0x367)]),
        $(_0x872328(0x280))[_0x872328(0x245)](_0x872328(0x212), _0x43caf6[_0x872328(0x2d4)]),
        $(_0x872328(0x280))[_0x872328(0x245)]("data-lng", _0x43caf6[_0x872328(0x1e9)]);
    const _0x1f0cd6 = $(_0x872328(0x2bb));
    _0x1f0cd6[_0x872328(0x1dc)](_0x7cdf89);
    const _0x5aeb19 = $("#msv_content");
    _0x5aeb19[_0x872328(0x1de)]();
    const _0x7aae25 = _0x872328(0x204),
        _0x4d0b5e = [
            { name: _0x872328(0x293), title: _0x872328(0x29d), value: _0x43caf6["address_jibun"] || "" },
            { name: _0x872328(0x295), title: _0x872328(0x2f3), value: _0x43caf6[_0x872328(0x295)] || "" },
            { name: "related_jibun", title: _0x872328(0x28b), value: _0x43caf6["related_jibun"] == "Y" ? _0x872328(0x33d) : _0x872328(0x2db) },
            { name: _0x872328(0x2b5), title: _0x872328(0x297), value: _0x43caf6[_0x872328(0x2b5)] || "" },
            { name: _0x872328(0x296), title: _0x872328(0x1cd), value: _0x43caf6[_0x872328(0x296)] || "" },
            { name: "sale_type", title: _0x872328(0x23c), value: _0x43caf6[_0x872328(0x230)] || "" },
            {
                name: _0x872328(0x369),
                title: "가격",
                value:
                    _0x43caf6[_0x872328(0x230)] == "매매" || _0x43caf6[_0x872328(0x230)] == "교환"
                        ? "" + formatPrice(_0x43caf6[_0x872328(0x1b0)], _0x872328(0x2e4), !![])
                        : formatPrice(_0x43caf6[_0x872328(0x1b0)], "all", !![]) + _0x872328(0x243) + formatPrice(_0x43caf6[_0x872328(0x200)], _0x872328(0x2e4), !![]),
            },
            { name: _0x872328(0x32a), title: _0x872328(0x364), value: "" + (_0x43caf6[_0x872328(0x32a)] ? parseFloat(_0x43caf6[_0x872328(0x32a)])[_0x872328(0x289)](0x2) + "㎡" : "") },
            { name: "archArea", title: _0x872328(0x375), value: "" + (_0x43caf6[_0x872328(0x1c5)] ? parseFloat(_0x43caf6[_0x872328(0x1c5)])["toFixed"](0x2) + "㎡" : "") },
            { name: "totArea", title: _0x872328(0x309), value: "" + (_0x43caf6[_0x872328(0x270)] ? parseFloat(_0x43caf6[_0x872328(0x270)])[_0x872328(0x289)](0x2) + "㎡" : "") },
            { name: _0x872328(0x30a), title: "지목", value: _0x43caf6[_0x872328(0x30a)] || "" },
            { name: _0x872328(0x1d5), title: _0x872328(0x2e2), value: _0x43caf6["prposAreaNm"] || "" },
            { name: "vlRat", title: _0x872328(0x1e3), value: "" + (_0x43caf6["vlRat"] ? parseFloat(_0x43caf6[_0x872328(0x1cf)])[_0x872328(0x289)](0x2) + "%" : "") },
            { name: _0x872328(0x388), title: "건폐율", value: "" + (_0x43caf6["bcRat"] ? parseFloat(_0x43caf6[_0x872328(0x388)])["toFixed"](0x2) + "%" : "") },
            { name: _0x872328(0x1ca), title: "층수", value: _0x872328(0x247) + (_0x43caf6[_0x872328(0x299)] || 0x1) + _0x872328(0x2d1) + (_0x43caf6[_0x872328(0x34e)] || 0x0) },
            { name: "strctCdNm", title: "구조", value: "" + (_0x43caf6["strctCdNm"] || "") },
            { name: _0x872328(0x240), title: _0x872328(0x381), value: _0x43caf6[_0x872328(0x240)] || "" },
            { name: _0x872328(0x263), title: "주차\x20가능\x20대수", value: "" + (_0x43caf6[_0x872328(0x263)] ? _0x43caf6[_0x872328(0x263)] + "대" : "") },
            { name: _0x872328(0x27b), title: _0x872328(0x214), value: _0x43caf6["mainPurpsCdNm"] || "" },
            { name: "realPurpsNm", title: "실제\x20사용용도", value: _0x43caf6["realPurpsNm"] || "" },
            { name: _0x872328(0x2d0), title: _0x872328(0x235), value: "" + formatPrice(_0x43caf6[_0x872328(0x2d0)], _0x872328(0x2e4), !![]) },
            { name: _0x872328(0x30f), title: _0x872328(0x303), value: "" + formatPrice(_0x43caf6[_0x872328(0x30f)], _0x872328(0x2e4), !![]) },
            { name: _0x872328(0x1db), title: "도로여건", value: "" + (_0x43caf6[_0x872328(0x1db)] ? _0x43caf6[_0x872328(0x1db)] + _0x872328(0x2ef) : "") },
            { name: _0x872328(0x384), title: "전기", value: "" + (_0x43caf6[_0x872328(0x384)] ? _0x43caf6[_0x872328(0x384)] + "Kw\x20이하" : "") },
            { name: _0x872328(0x26a), title: "용수", value: _0x43caf6[_0x872328(0x26a)] ? (_0x43caf6[_0x872328(0x26a)] === _0x872328(0x1c7) ? _0x872328(0x20e) : _0x43caf6[_0x872328(0x26a)] === "underground" ? _0x872328(0x1d7) : "") : "" },
            { name: _0x872328(0x305), title: _0x872328(0x1bb), value: "" + (_0x43caf6[_0x872328(0x305)] ? _0x43caf6[_0x872328(0x305)] + "m" : "") },
            { name: _0x872328(0x2c6), title: "특장점", value: _0x43caf6[_0x872328(0x2c6)] || "" },
            { name: "description", title: "상세\x20설명", value: _0x43caf6["description"] || _0x872328(0x28c) },
            // { name: _0x872328(0x33c), title: _0x872328(0x326), value: "" + (_0x43caf6[_0x872328(0x33c)] ? "<button\x20type=\x22button\x22\x20class=\x22p-0\x22>" + _0x43caf6["agency_name"] + _0x872328(0x310) : "") },
            // { name: _0x872328(0x2ba), title: "중개사\x20대표", value: _0x43caf6[_0x872328(0x2ba)] || "" },
            // { name: "broker_address", title: _0x872328(0x1f6), value: _0x43caf6["broker_address"] || "" },
            // { name: _0x872328(0x33b), title: _0x872328(0x275), value: "" + (_0x43caf6[_0x872328(0x33b)] ? _0x872328(0x2e3) + _0x43caf6["homepage_url"] + _0x872328(0x31e) : "") },
            // { name: _0x872328(0x29f), title: _0x872328(0x38a), value: "" + (_0x43caf6["broker_phone"] ? _0x7aae25 + _0x872328(0x213) + phoneOnDash(_0x43caf6[_0x872328(0x29f)]) + "\x22>" + phoneOnDash(_0x43caf6[_0x872328(0x29f)]) + "</a>" : "") },
        ];
    const agencyItems = [
        { name: _0x872328(0x33c), title: _0x872328(0x326), value: "" + (_0x43caf6[_0x872328(0x33c)] ? "<button\x20type=\x22button\x22\x20class=\x22p-0\x22>" + _0x43caf6["agency_name"] + _0x872328(0x310) : "") },
        { name: _0x872328(0x2ba), title: "중개사\x20대표", value: _0x43caf6[_0x872328(0x2ba)] || "" },
        { name: "broker_address", title: _0x872328(0x1f6), value: _0x43caf6["broker_address"] || "" },
        { name: _0x872328(0x33b), title: _0x872328(0x275), value: "" + (_0x43caf6[_0x872328(0x33b)] ? _0x872328(0x2e3) + _0x43caf6["homepage_url"] + _0x872328(0x31e) : "") },
        { name: _0x872328(0x29f), title: _0x872328(0x38a), value: "" + (_0x43caf6["broker_phone"] ? _0x7aae25 + _0x872328(0x213) + phoneOnDash(_0x43caf6[_0x872328(0x29f)]) + "\x22>" + phoneOnDash(_0x43caf6[_0x872328(0x29f)]) + "</a>" : "") },
    ];
    $[_0x872328(0x239)](_0x4d0b5e, function (_0x40465b, _0x556151) {
        const _0x422197 = _0x872328;
        _0x5aeb19["append"](_0x422197(0x1d4) + _0x556151[_0x422197(0x321)] + _0x422197(0x236) + _0x556151[_0x422197(0x28a)] + "\x22>" + _0x556151[_0x422197(0x276)] + "</dd></dl>");
    });
    _0x5aeb19.append("<hr>");
    $[_0x872328(0x239)](agencyItems, function (_0x40465b, _0x556151) {
        const _0x422197 = _0x872328;
        _0x5aeb19["append"](_0x422197(0x1d4) + _0x556151[_0x422197(0x321)] + _0x422197(0x236) + _0x556151[_0x422197(0x28a)] + "\x22>" + _0x556151[_0x422197(0x276)] + "</dd></dl>");
    });
}
function swiper_image(_0x4579d8) {
    const _0x5dce1c = a53_0xca03c6,
        _0x4da4ac = $(_0x5dce1c(0x272));
    if (!_0x4579d8 || _0x4579d8["length"] === 0x0) {
        const _0x45be10 = _0x5dce1c(0x298);
        _0x4da4ac["html"](_0x45be10)[_0x5dce1c(0x291)](_0x45be10);
    } else {
        const _0x112b2f = _0x4579d8[_0x5dce1c(0x1e0)]((_0xbb2510) => {
            const _0x3696c8 = _0x5dce1c,
                _0x3ac25f = _0xbb2510[_0x3696c8(0x2fa)] ? _0x3696c8(0x2e8) + encodeURIComponent(_0xbb2510["imageToken"]) : _0x3696c8(0x1ec);
            let _0x5059a4 = "";
            if (_0xbb2510[_0x3696c8(0x2fe)] === "image")
                _0x5059a4 =
                    "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22swiper-slide\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<a\x20target=\x22_blank\x22\x20href=\x22" +
                    _0x3ac25f +
                    _0x3696c8(0x252) +
                    _0x3ac25f +
                    _0x3696c8(0x29c);
            else
                _0xbb2510[_0x3696c8(0x2fe)] === _0x3696c8(0x324)
                    ? (_0x5059a4 =
                          _0x3696c8(0x223) +
                          _0x3ac25f +
                          "\x22\x20type=\x22video/mp4\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20Your\x20browser\x20does\x20not\x20support\x20the\x20video\x20tag.\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</video>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20")
                    : (_0x5059a4 = _0x3696c8(0x1eb));
            return _0x5059a4;
        })[_0x5dce1c(0x34c)]("");
        _0x4579d8[_0x5dce1c(0x2b6)] === 0x1 ? _0x4da4ac[_0x5dce1c(0x222)](_0x112b2f)[_0x5dce1c(0x291)](_0x112b2f) : _0x4da4ac[_0x5dce1c(0x222)](_0x112b2f);
    }
    var _0x35e480 = new Swiper(_0x5dce1c(0x1b1), { loop: ![], spaceBetween: 0x18, slidesPerView: 0x2, freeMode: !![], navigation: { nextEl: ".swiper-button-next", prevEl: _0x5dce1c(0x1b6) }, watchSlidesProgress: !![] });
}
function initFilters() {
    const _0x9d690d = a53_0xca03c6;
    getFilterTypes();
    var _0x4369f7 = document["getElementById"](_0x9d690d(0x2bd));
    setPriceSlider(_0x4369f7), setIniSliderValues(_0x4369f7);
}
function collectFilterParams() {
    const _0x9ad19e = a53_0xca03c6;
    return { estateType: $(_0x9ad19e(0x314))["val"](), saleType: $(_0x9ad19e(0x218))["val"](), minPrice: $("#input_price_start")[_0x9ad19e(0x1d2)](), maxPrice: $(_0x9ad19e(0x35a))[_0x9ad19e(0x1d2)]() };
}
function a53_0x3dc2(_0x5b34eb, _0x2d554e) {
    const _0x4ff32e = a53_0x4ff3();
    return (
        (a53_0x3dc2 = function (_0x3dc276, _0x5d3990) {
            _0x3dc276 = _0x3dc276 - 0x1b0;
            let _0x54fe90 = _0x4ff32e[_0x3dc276];
            return _0x54fe90;
        }),
        a53_0x3dc2(_0x5b34eb, _0x2d554e)
    );
}
function resetFilters() {
    const _0xb0a352 = a53_0xca03c6;
    $(_0xb0a352(0x314))[_0xb0a352(0x1d2)]("")[_0xb0a352(0x209)](_0xb0a352(0x343)), $(_0xb0a352(0x218))[_0xb0a352(0x1d2)]("")[_0xb0a352(0x209)]("change");
    var _0x385988 = document[_0xb0a352(0x29b)]("price_slider");
    _0x385988["noUiSlider"][_0xb0a352(0x2ab)]([0x0, 0x1e8480]), estateList();
}
async function getFilterTypes() {
    const _0x17f3ce = a53_0xca03c6,
        _0x47e6f7 = _0x17f3ce(0x34f);
    try {
        const _0x3e5345 = await callApi("POST", _0x47e6f7, {});
        if (!_0x3e5345) return;
        const { message: _0x5a07a1, responseData: _0x52a931, statusCode: _0x161771 } = _0x3e5345;
        if (_0x161771 !== 0xc8 || _0x52a931[_0x17f3ce(0x2b6)] == 0x0) return;
        const { ESTATE_TYPE: _0x6a585e, SALE_TYPE: _0x176970 } = _0x52a931,
            _0xf45989 = _0x6a585e[_0x17f3ce(0x1e0)](function (_0x27785f, _0x282584) {
                const _0x592962 = _0x17f3ce,
                    { type_code: _0x17e32b, type_name: _0x2aae4c } = _0x27785f;
                return _0x592962(0x311) + _0x17e32b + "\x22>" + _0x2aae4c + _0x592962(0x30b);
            }),
            _0xf3ed1d = _0x176970["map"](function (_0x6af219, _0x2e7548) {
                const _0x5b7aab = _0x17f3ce,
                    { type_code: _0x474812, type_name: _0x42e805 } = _0x6af219;
                return _0x5b7aab(0x311) + _0x474812 + "\x22>" + _0x42e805 + "</option>";
            });
        $("#estate_type_filter")[_0x17f3ce(0x291)](_0xf45989), $("#sale_type_filter")[_0x17f3ce(0x291)](_0xf3ed1d);
    } catch (_0x8451a) {
        console[_0x17f3ce(0x286)](_0x17f3ce(0x20c), _0x8451a);
    }
}
function setPriceSlider(_0x587501) {
    const _0x247372 = a53_0xca03c6,
        _0x598800 = 0x0,
        _0x347aaf = 100000000;
    noUiSlider["create"](_0x587501, {
        start: [_0x598800, _0x347aaf],
        connect: !![],
        tooltips: [
            {
                to: function (_0x157909) {
                    const _0x365527 = a53_0x3dc2;
                    return formatPrice(Math[_0x365527(0x2c8)](_0x157909 * 0x64) / 0x64);
                },
            },
            {
                to: function (_0x3dd046) {
                    const _0x3d8568 = a53_0x3dc2;
                    return formatPrice(Math[_0x3d8568(0x2c8)](_0x3dd046 * 0x64) / 0x64);
                },
            },
        ],
        step: 1000,
        keyboardSupport: !![],
        keyboardDefaultStep: 1000,
        keyboardPageMultiplier: 0xa,
        range: { min: _0x598800, max: _0x347aaf },
        format: wNumb({ decimals: 0x0, suffix: "" }),
    });
    const _0x15e1dc = document[_0x247372(0x29b)](_0x247372(0x241)),
        _0x28890a = document["getElementById"]("input_price_end");
    _0x15e1dc &&
        _0x28890a &&
        _0x587501 &&
        (_0x587501[_0x247372(0x1b3)]["on"]("update", function (_0xc5b448, _0x438aaf) {
            const _0x5de80e = _0x247372;
            (_0xc5b448 = _0xc5b448[_0x438aaf]), _0x438aaf ? (_0x28890a[_0x5de80e(0x276)] = _0xc5b448) : (_0x15e1dc[_0x5de80e(0x276)] = _0xc5b448);
        }),
        _0x15e1dc[_0x247372(0x246)](_0x247372(0x343), function () {
            const _0x4a9155 = _0x247372;
            _0x587501[_0x4a9155(0x1b3)][_0x4a9155(0x2ab)]([this[_0x4a9155(0x276)], null]);
        }),
        _0x28890a[_0x247372(0x246)](_0x247372(0x343), function () {
            const _0x4ef86e = _0x247372;
            _0x587501[_0x4ef86e(0x1b3)][_0x4ef86e(0x2ab)]([null, this[_0x4ef86e(0x276)]]);
        }));
}
function setIniSliderValues(_0x2390ec) {
    const _0x476cfd = a53_0xca03c6;
    _0x2390ec["noUiSlider"][_0x476cfd(0x2ab)](["0", "100000000"]);
}
function upDownEvent(_0x54e1b4, _0x21e510, _0xdc1dc8, _0x116745) {
    const _0xe85ab0 = a53_0xca03c6;
    currentIndex = -0x1;
    const { searchBox: _0x1d69bf } = getSearchElements();
    if (_0x1d69bf["is"](":visible") && _0xdc1dc8["length"] > 0x0) {
        currentIndex === -0x1 && (currentIndex = _0x116745 !== -0x1 ? _0x116745 : 0x0);
        if (_0x54e1b4[_0xe85ab0(0x2a2)] === _0xe85ab0(0x282)) currentIndex = (currentIndex + 0x1) % _0xdc1dc8["length"];
        else _0x54e1b4[_0xe85ab0(0x2a2)] === _0xe85ab0(0x203) && (currentIndex = (currentIndex - 0x1 + _0xdc1dc8[_0xe85ab0(0x2b6)]) % _0xdc1dc8[_0xe85ab0(0x2b6)]);
        _0xdc1dc8[_0xe85ab0(0x37b)]("selected"), _0xdc1dc8["eq"](currentIndex)[_0xe85ab0(0x1ce)](_0xe85ab0(0x2b2)), _0xdc1dc8["eq"](currentIndex)[0x0][_0xe85ab0(0x1dd)]({ block: _0xe85ab0(0x2f5), behavior: "smooth" });
    }
}
function enterEvent(_0x43443d, _0x5aa0fa, _0x53403e, _0x1d1841) {
    const _0x1ecef7 = a53_0xca03c6,
        { searchBox: _0x730b5f } = getSearchElements();
    if (_0x5aa0fa === "" || /^\d+$/[_0x1ecef7(0x316)](_0x5aa0fa)) (searchEstateNo = !![]), estateList(_0x5aa0fa), _0x730b5f[_0x1ecef7(0x2d3)](0x64, "easeOutQuad"), (searchPlacesExecuted = ![]);
    else searchPlacesExecuted && ((searchEstateNo = ![]), _0x53403e["eq"](_0x1d1841)["click"](), estateList());
}
function searchPlaces() {
    const _0x85be7f = a53_0xca03c6,
        { listEl: _0x363b13, searchBox: _0x330a62, palcesList: _0x17724d, searchInput: _0x15c927 } = getSearchElements(),
        _0x357ce2 = _0x15c927["val"]()[_0x85be7f(0x2c4)]();
    removeAllChildNods(_0x363b13);
    if (!_0x357ce2) return _0x17724d[_0x85be7f(0x1de)](), _0x330a62[_0x85be7f(0x2d3)](0xc8, "easeOutQuad"), ![];
    let _0x4c1002 = 0x0,
        _0x1d7e59 = ![];
    ps[_0x85be7f(0x216)](_0x357ce2, function (_0x34fbc3, _0x143872, _0x4e5bc4) {
        const _0x344785 = _0x85be7f;
        _0x4c1002++, _0x143872 === kakao[_0x344785(0x35d)][_0x344785(0x1cc)][_0x344785(0x1bf)]["OK"] && (displayPlaces(_0x34fbc3), (_0x1d7e59 = !![]), _0x330a62["slideDown"](0x64, "easeOutQuad")), checkSearchCompletion(_0x4c1002, _0x1d7e59);
    }),
        geocoder["addressSearch"](_0x357ce2, function (_0x2c5223, _0x5ee9ee, _0x113e73) {
            const _0xedcaff = _0x85be7f;
            _0x4c1002++, _0x5ee9ee === kakao[_0xedcaff(0x35d)][_0xedcaff(0x1cc)][_0xedcaff(0x1bf)]["OK"] && (displayPlaces(_0x2c5223), (_0x1d7e59 = !![]), _0x330a62["slideDown"](0x64, _0xedcaff(0x258))), checkSearchCompletion(_0x4c1002, _0x1d7e59);
        });
}
function checkSearchCompletion(_0x5b1b0f, _0x48c5e6) {
    const _0x5266bd = a53_0xca03c6,
        { palcesList: _0x2acd17 } = getSearchElements();
    if (_0x5b1b0f === 0x2) {
        if (_0x48c5e6) _0x2acd17[_0x5266bd(0x23d)]("li")["eq"](0x0)[_0x5266bd(0x1ce)]("selected");
        else {
            const _0x382cdc = _0x5266bd(0x2af);
            _0x2acd17[_0x5266bd(0x222)](_0x382cdc);
        }
    }
}
function placesSearchCB(_0x2b199d, _0x407ec4, _0x4e14c2) {
    const _0x37d1ad = a53_0xca03c6;
    if (_0x407ec4 === kakao[_0x37d1ad(0x35d)]["services"][_0x37d1ad(0x1bf)]["OK"]) displayPlaces(_0x2b199d), $("#search_result_box")["slideDown"](0x64, "easeOutQuad");
    else {
    }
}
function displayPlaces(_0x687c9f) {
    const _0x53c7b6 = a53_0xca03c6,
        { listEl: _0x20ad62 } = getSearchElements();
    let _0xcd4c33 = document["createDocumentFragment"]();
    removeMarker(markers);
    for (var _0x358453 = 0x0; _0x358453 < _0x687c9f["length"]; _0x358453++) {
        var _0x39cff7 = new kakao[_0x53c7b6(0x35d)]["LatLng"](_0x687c9f[_0x358453]["y"], _0x687c9f[_0x358453]["x"]);
        let _0x46502b = getListItem(_0x358453, _0x687c9f[_0x358453]);
        (function (_0x1421ad, _0x2f56ba) {
            _0x46502b["onclick"] = async function () {
                const _0x3f504f = a53_0x3dc2;
                sessionStorage[_0x3f504f(0x23b)](_0x3f504f(0x21b), JSON[_0x3f504f(0x265)](_0x2f56ba)), updateURL({ curLat: _0x2f56ba["y"], curLng: _0x2f56ba["x"] });
                var _0x23437c = new kakao[_0x3f504f(0x35d)]["LatLng"](_0x2f56ba["y"], _0x2f56ba["x"]);
                map[_0x3f504f(0x27f)](_0x23437c), map[_0x3f504f(0x271)](0x4), saveSearchHistory({ address: _0x2f56ba[_0x3f504f(0x2ad)], lat: _0x2f56ba["y"], lng: _0x2f56ba["x"] });
            };
        })(marker, _0x687c9f[_0x358453]),
            _0xcd4c33[_0x53c7b6(0x33a)](_0x46502b);
    }
    _0x20ad62["appendChild"](_0xcd4c33), (_0x20ad62["scrollTop"] = 0x0);
}
function removeAllChildNods(_0x644d29) {
    const _0x298878 = a53_0xca03c6;
    while (_0x644d29[_0x298878(0x353)]()) {
        _0x644d29["removeChild"](_0x644d29[_0x298878(0x2da)]);
    }
}
function getListItem(_0x45eef7, _0x2d1eb9) {
    const _0x8ad4c3 = a53_0xca03c6,
        { searchInput: _0x309074 } = getSearchElements(),
        _0x396e23 = _0x309074[_0x8ad4c3(0x1d2)]()[_0x8ad4c3(0x2c4)](),
        _0x340df2 = _0x309074["val"]()[_0x8ad4c3(0x2c4)]()[_0x8ad4c3(0x31c)](/\s+/);
    let _0x3bd4a3 = "";
    var _0x4fcbfd = document[_0x8ad4c3(0x2e7)]("li");
    const _0x113b24 = (_0x486f26) => {
            const _0x706bcd = _0x8ad4c3,
                _0x17921e = new RegExp("(" + _0x340df2[_0x706bcd(0x34c)]("|") + ")", "gi");
            return _0x486f26[_0x706bcd(0x37e)](_0x17921e, "<span\x20style=\x22color:coral;\x20font-weight:bold;\x22>$1</span>");
        },
        _0x3cbdee = {
            MT1: _0x8ad4c3(0x21d),
            CS2: _0x8ad4c3(0x2ae),
            PS3: _0x8ad4c3(0x20b),
            SC4: "<i\x20class=\x22las\x20la-lg\x20la-school\x22></i>",
            AC5: "<i\x20class=\x22las\x20la-lg\x20la-chalkboard-teacher\x22></i>",
            PK6: _0x8ad4c3(0x2bc),
            OL7: "<i\x20class=\x22las\x20la-lg\x20la-gas-pump\x22></i>",
            SW8: "<i\x20class=\x22las\x20la-lg\x20la-subway\x22></i>",
            BK9: "<i\x20class=\x22las\x20la-lg\x20la-donate\x22></i>",
            CT1: _0x8ad4c3(0x229),
            AG2: _0x8ad4c3(0x20d),
            PO3: _0x8ad4c3(0x2f4),
            AT4: "<i\x20class=\x22las\x20la-lg\x20la-camera-retro\x22></i>",
            AD5: _0x8ad4c3(0x330),
            FD6: "<i\x20class=\x22las\x20la-lg\x20la-utensils\x22></i>",
            CE7: _0x8ad4c3(0x1f4),
            HP8: _0x8ad4c3(0x308),
            PM9: "<i\x20class=\x22las\x20la-lg\x20la-pills\x22></i>",
        };
    let _0x12e980 = "";
    return (
        _0x2d1eb9[_0x8ad4c3(0x238)] ? (_0x12e980 = _0x3cbdee[_0x2d1eb9["category_group_code"]] || "") : (_0x12e980 = "<i\x20class=\x22las\x20la-lg\x20la-building\x22></i>"),
        _0x2d1eb9[_0x8ad4c3(0x205)]
            ? (_0x3bd4a3 += _0x8ad4c3(0x250) + _0x2d1eb9["y"] + "\x22\x20data-lng=\x22" + _0x2d1eb9["x"] + _0x8ad4c3(0x35b) + _0x12e980 + "\x20" + _0x113b24(_0x2d1eb9[_0x8ad4c3(0x205)]) + _0x8ad4c3(0x2f1))
            : (_0x3bd4a3 += _0x8ad4c3(0x250) + _0x2d1eb9["y"] + _0x8ad4c3(0x22a) + _0x2d1eb9["x"] + _0x8ad4c3(0x28f) + _0x113b24(_0x2d1eb9[_0x8ad4c3(0x2ad)]) + _0x8ad4c3(0x2f1)),
        _0x2d1eb9["road_address_name"]
            ? ((_0x3bd4a3 += _0x8ad4c3(0x37a) + _0x113b24(_0x2d1eb9[_0x8ad4c3(0x35c)]) + _0x8ad4c3(0x2fc)), (_0x3bd4a3 += _0x8ad4c3(0x2ca) + _0x113b24(_0x2d1eb9[_0x8ad4c3(0x2ad)]) + _0x8ad4c3(0x2fc)))
            : (_0x3bd4a3 += _0x8ad4c3(0x2ca) + _0x113b24(_0x2d1eb9[_0x8ad4c3(0x2ad)]) + "</p>"),
        (_0x3bd4a3 += _0x8ad4c3(0x2c1)),
        (_0x4fcbfd["innerHTML"] = _0x3bd4a3),
        (_0x4fcbfd["className"] = _0x8ad4c3(0x27d)),
        _0x4fcbfd
    );
}
function createClusteredMarker(_0x32e4fe) {
    const _0x5d24b3 = a53_0xca03c6,
        _0x425378 = () => (Math[_0x5d24b3(0x281)]() - 0.5) * 0.0001,
        _0x10f678 = new kakao[_0x5d24b3(0x35d)][_0x5d24b3(0x2d6)](_0x32e4fe[_0x5d24b3(0x2d4)] + _0x425378(), _0x32e4fe[_0x5d24b3(0x1e9)] + _0x425378());
    var _0x137dff = new kakao["maps"][_0x5d24b3(0x315)]({ position: _0x10f678 });
    (_0x137dff["estate_no"] = _0x32e4fe[_0x5d24b3(0x367)]),
        (_0x137dff[_0x5d24b3(0x296)] = _0x32e4fe["estate_type"]),
        (_0x137dff[_0x5d24b3(0x230)] = _0x32e4fe["sale_type"]),
        (_0x137dff[_0x5d24b3(0x2d4)] = _0x32e4fe[_0x5d24b3(0x2d4)]),
        (_0x137dff[_0x5d24b3(0x1e9)] = _0x32e4fe["lng"]),
        (_0x137dff[_0x5d24b3(0x1b0)] = _0x32e4fe[_0x5d24b3(0x1b0)]),
        (_0x137dff["rent_price"] = _0x32e4fe[_0x5d24b3(0x200)]);
    return _0x137dff;
    let _0x228ed3 = "";
    switch (_0x32e4fe["sale_type"]) {
        case "임대":
            _0x228ed3 = "" + formatPrice(_0x32e4fe[_0x5d24b3(0x200)], _0x5d24b3(0x24a));
            break;
        case "매매":
            _0x228ed3 = "" + formatPrice(_0x32e4fe[_0x5d24b3(0x1b0)], _0x5d24b3(0x24a));
            break;
        case "교환":
            _0x228ed3 = "" + formatPrice(_0x32e4fe[_0x5d24b3(0x1b0)], _0x5d24b3(0x24a));
            break;
    }
}
let clusterersByType = {};
function createClustererAll(_0x53430f) {
    const _0x477a4c = a53_0xca03c6,
        _0x448688 = _0x53430f;
    if (clusterersByType[_0x448688]) return clusterersByType[_0x448688];
    const _0x239e71 = new kakao[_0x477a4c(0x35d)][_0x477a4c(0x1e7)]({
        map: map,
        gridSize: 0x5a,
        averageCenter: !![],
        minLevel: 0x0,
        calculator: [0x1, 0xa, 0x32],
        minClusterSize: 0x1,
        disableClickZoom: !![],
        styles: [
            {
                width: _0x477a4c(0x36d),
                height: _0x477a4c(0x36d),
                background: _0x477a4c(0x378),
                opacity: _0x477a4c(0x30e),
                border: _0x477a4c(0x253),
                borderRadius: "50%",
                color: "#fff",
                textAlign: _0x477a4c(0x2c2),
                fontWeight: "600",
                lineHeight: _0x477a4c(0x33f),
                fontSize: _0x477a4c(0x340),
                display: _0x477a4c(0x1c9),
                alignItems: _0x477a4c(0x2c2),
                justifyContent: _0x477a4c(0x2c2),
                transform: _0x477a4c(0x31b),
            },
            {
                width: _0x477a4c(0x36d),
                height: _0x477a4c(0x36d),
                background: _0x477a4c(0x378),
                opacity: _0x477a4c(0x30e),
                border: _0x477a4c(0x253),
                borderRadius: _0x477a4c(0x24d),
                color: _0x477a4c(0x2a5),
                textAlign: _0x477a4c(0x2c2),
                fontWeight: _0x477a4c(0x244),
                lineHeight: _0x477a4c(0x33f),
                fontSize: "1.5rem",
                display: _0x477a4c(0x1c9),
                alignItems: _0x477a4c(0x2c2),
                justifyContent: _0x477a4c(0x2c2),
                transform: _0x477a4c(0x31b),
            },
            {
                width: _0x477a4c(0x2de),
                height: _0x477a4c(0x2de),
                background: _0x477a4c(0x378),
                opacity: "0.75",
                border: _0x477a4c(0x253),
                borderRadius: _0x477a4c(0x24d),
                color: _0x477a4c(0x2a5),
                textAlign: _0x477a4c(0x2c2),
                fontWeight: _0x477a4c(0x244),
                lineHeight: _0x477a4c(0x33f),
                fontSize: _0x477a4c(0x340),
                display: _0x477a4c(0x1c9),
                alignItems: _0x477a4c(0x2c2),
                justifyContent: _0x477a4c(0x2c2),
                transform: _0x477a4c(0x31b),
            },
            {
                width: "85px",
                height: _0x477a4c(0x2a9),
                background: _0x477a4c(0x378),
                opacity: _0x477a4c(0x30e),
                border: _0x477a4c(0x253),
                borderRadius: "50%",
                color: "#fff",
                textAlign: "center",
                fontWeight: "600",
                lineHeight: _0x477a4c(0x33f),
                fontSize: _0x477a4c(0x340),
                display: _0x477a4c(0x1c9),
                alignItems: "center",
                justifyContent: _0x477a4c(0x2c2),
                transform: _0x477a4c(0x31b),
            },
        ],
    });
    return (clusterersByType[_0x448688] = _0x239e71), initClusterEvent(_0x239e71), _0x239e71;
}
function createClusterer(_0x45da22) {
    const _0x4c8fa6 = a53_0xca03c6,
        _0xe79298 = "" + _0x45da22;
    if (clusterersByType[_0xe79298]) return clusterersByType[_0xe79298];
    const _0x5822b5 = new kakao[_0x4c8fa6(0x35d)][_0x4c8fa6(0x1e7)]({
        map: map,
        gridSize: 0x5a,
        averageCenter: !![],
        minLevel: 0x0,
        minClusterSize: 0x1,
        disableClickZoom: !![],
        styles: [
            {
                width: _0x4c8fa6(0x268),
                height: _0x4c8fa6(0x268),
                background: "transparent",
                border: _0x4c8fa6(0x253),
                borderRadius: _0x4c8fa6(0x24d),
                color: _0x4c8fa6(0x2a5),
                textAlign: _0x4c8fa6(0x2c2),
                fontWeight: _0x4c8fa6(0x320),
                fontSize: _0x4c8fa6(0x340),
                lineHeight: "inherit",
                display: _0x4c8fa6(0x1c9),
                alignItems: _0x4c8fa6(0x2c2),
                justifyContent: "center",
            },
        ],
    });
    return (
        (clusterersByType[_0xe79298] = _0x5822b5),
        kakao[_0x4c8fa6(0x35d)][_0x4c8fa6(0x22b)][_0x4c8fa6(0x362)](_0x5822b5, _0x4c8fa6(0x2eb), function (_0x15b241) {
            const _0x42f805 = _0x4c8fa6;
            _0x15b241[_0x42f805(0x294)](function (_0x3ebfbb) {
                const _0x28ae92 = _0x42f805,
                    _0x35e2ed = _0x3ebfbb[_0x28ae92(0x2f8)](),
                    _0x42216e = _0x35e2ed[0x0][_0x28ae92(0x296)],
                    _0x2c480f = _0x35e2ed[0x0][_0x28ae92(0x230)],
                    _0x20c458 = _0x35e2ed[_0x28ae92(0x2b6)],
                    _0x345a09 =
                        _0x28ae92(0x2cb) +
                        _0x42216e +
                        "</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20class=\x22text-white\x20p-1\x22\x20style=\x22background-color:var(--var-color-main-1)\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22\x22>" +
                        _0x20c458 +
                        "</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</ul>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<!--\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p\x20class=\x22position-absolute\x22\x20style=\x22margin:-5px\x200\x200\x2020px;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<img\x20src=\x22/front/assets/image/icn_arr_mark.svg\x22\x20width=\x2215\x22\x20alt=\x22\x22\x20title=\x22\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20-->\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
                    _0x4b1679 = _0x3ebfbb[_0x28ae92(0x328)](),
                    _0x44ca7c = _0x4b1679["getContent"]();
                (_0x44ca7c[_0x28ae92(0x337)] = _0x345a09), (_0x44ca7c[_0x28ae92(0x2ac)]["transform"] = "scale(0.8)"), _0x44ca7c[_0x28ae92(0x246)](_0x28ae92(0x2e9), function () {}), _0x44ca7c[_0x28ae92(0x246)]("mouseout", function () {});
            });
        }),
        initClusterEvent(_0x5822b5),
        _0x5822b5
    );
}
function initClusterEvent(_0x3db5eb) {
    const _0x47f1d7 = a53_0xca03c6;
    let _0x3b52ad = null;
    kakao[_0x47f1d7(0x35d)][_0x47f1d7(0x22b)][_0x47f1d7(0x362)](_0x3db5eb, "clusterclick", function (_0x9b650c) {
        if (_0x3b52ad) clearTimeout(_0x3b52ad);
        _0x3b52ad = setTimeout(function () {
            const _0x269308 = a53_0x3dc2;
            (_0x3b52ad = null), $(".mcs-list")["children"]("dl")[_0x269308(0x274)](0x64);
            const _0xe9ca3f = _0x9b650c[_0x269308(0x2f8)](),
                _0x3a3fd2 = _0xe9ca3f[_0x269308(0x1e0)]((_0x3098fa) => _0x3098fa[_0x269308(0x367)]);
            _0x3a3fd2[_0x269308(0x294)](function (_0x2ed293) {
                const _0x234dc7 = _0x269308;
                $(".mcs-list")
                    [_0x234dc7(0x23d)](_0x234dc7(0x1b4) + _0x2ed293 + "\x22]")
                    ["delay"](0x64)
                    ["fadeIn"](0x190);
            }),
                $(_0x269308(0x28d))[_0x269308(0x1ce)](_0x269308(0x1fa)),
                $(_0x269308(0x350))[_0x269308(0x1ce)]("active"),
                $(_0x269308(0x355))["removeClass"]("full"),
                $(_0x269308(0x1f7))[_0x269308(0x37b)](_0x269308(0x1e1));
        }, 0xfa);
    }),
        kakao["maps"][_0x47f1d7(0x22b)]["addListener"](_0x3db5eb, _0x47f1d7(0x1d8), function (_0x36aa86) {
            const _0x126249 = _0x47f1d7;
            if (_0x3b52ad) clearTimeout(_0x3b52ad);
            const _0x168125 = _0x36aa86["getCenter"]();
            map[_0x126249(0x27f)](_0x168125), map[_0x126249(0x271)](map[_0x126249(0x264)]() - 0x1);
        }),
        kakao[_0x47f1d7(0x35d)][_0x47f1d7(0x22b)][_0x47f1d7(0x362)](_0x3db5eb, _0x47f1d7(0x248), function (_0xe39689) {
            const _0xba421d = _0x47f1d7,
                _0xdd097e = _0xe39689[_0xba421d(0x328)](),
                _0x294fe8 = _0xdd097e[_0xba421d(0x2c7)]();
            (_0x294fe8[_0xba421d(0x34b)][_0xba421d(0x2ac)][_0xba421d(0x242)] = "1"), (_0x294fe8[_0xba421d(0x2ac)][_0xba421d(0x227)] = _0xba421d(0x23f)), (_0x294fe8[_0xba421d(0x2ac)][_0xba421d(0x1b5)] = _0xba421d(0x26f)), (_0x294fe8[_0xba421d(0x2ac)][_0xba421d(0x254)] = _0xba421d(0x2c2));
        }),
        kakao[_0x47f1d7(0x35d)]["event"][_0x47f1d7(0x362)](_0x3db5eb, "clusterout", function (_0x1068b2) {
            const _0x7c6719 = _0x47f1d7,
                _0x37a521 = _0x1068b2["getClusterMarker"](),
                _0x5b1504 = _0x37a521[_0x7c6719(0x2c7)]();
            (_0x5b1504[_0x7c6719(0x34b)][_0x7c6719(0x2ac)][_0x7c6719(0x242)] = "0"), (_0x5b1504[_0x7c6719(0x2ac)]["transform"] = _0x7c6719(0x31b)), (_0x5b1504["style"][_0x7c6719(0x1b5)] = _0x7c6719(0x26f)), (_0x5b1504[_0x7c6719(0x2ac)][_0x7c6719(0x254)] = _0x7c6719(0x2c2));
        });
}
function printDiv(_0x40e44e) {
    const _0x1250fc = a53_0xca03c6;
    alert(_0x1250fc(0x1ee));
    var _0x2985c3 = document[_0x1250fc(0x29b)](_0x40e44e)["outerHTML"],
        _0x26b7b7 = _0x2985c3;
    while (_0x26b7b7 && _0x26b7b7["scrollTop"] === undefined) {
        _0x26b7b7 = _0x26b7b7[_0x1250fc(0x34b)];
    }
    var _0x1d1ddf = document[_0x1250fc(0x29b)](_0x40e44e),
        _0x3f6e38 = _0x1d1ddf[_0x1250fc(0x2e5)] + 0x32,
        _0x1f16c6 = _0x1d1ddf[_0x1250fc(0x2f2)],
        _0x91d6f7 = window["open"]("", "", _0x1250fc(0x2c5)),
        _0x46af77 = _0x26b7b7 ? _0x26b7b7[_0x1250fc(0x334)] : 0x0,
        _0x560461 = _0x26b7b7 ? _0x26b7b7[_0x1250fc(0x1f1)] : window[_0x1250fc(0x273)],
        _0x335b80 = Array[_0x1250fc(0x237)](document[_0x1250fc(0x1f8)](_0x1250fc(0x323)))
            [_0x1250fc(0x1e0)]((_0x270268) => _0x270268[_0x1250fc(0x2d5)])
            [_0x1250fc(0x34c)]("");
    _0x91d6f7[_0x1250fc(0x2c9)]["write"](
        _0x1250fc(0x26b) +
            _0x560461 +
            _0x1250fc(0x1c8) +
            _0x560461 +
            "px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20zoom:\x201;\x20/*\x20기본값\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20/*\x20인쇄할\x20콘텐츠의\x20스타일\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20#print-content\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20relative;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20//\x20top:\x20-" +
            _0x46af77 +
            _0x1250fc(0x1fe) +
            _0x3f6e38 +
            "px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20//\x20overflow:\x20hidden;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20width:\x20100%;\x20/*\x20콘텐츠\x20너비\x20조정\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20max-width:\x20100%;\x20/*\x20최대\x20너비를\x20제한\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transform:\x20scale(1);\x20/*\x20기본\x20값\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transform-origin:\x20top\x20left;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20/*\x20지도\x20영역의\x20스타일\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20#map_bg\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20//\x20width:\x20100%\x20!important;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20width:\x20" +
            _0x1f16c6 +
            _0x1250fc(0x2fb) +
            _0x3f6e38 +
            _0x1250fc(0x25b) +
            _0x335b80 +
            "\x20<!--\x20스타일시트\x20추가\x20-->\x0a\x20\x20\x20\x20\x20\x20\x20\x20</head>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<body\x20id=\x22body\x22>\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20id=\x22print-content\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
            _0x2985c3 +
            "\x20<!--\x20인쇄할\x20div의\x20콘텐츠\x20-->\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<!--\x20설명\x20텍스트\x20-->\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20id=\x22des\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>-\x20출처\x20:\x20카카오맵\x20(https://map.kakao.com)</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>[본\x20서비스에서\x20제공하는\x20지도는\x20사용자의\x20편의를\x20위해\x20단순\x20열람조회용으로\x20제공되는\x20것으로\x20데이터\x20오류\x20등의\x20이유로\x20실제\x20내용과\x20일치하지\x20않을\x20수\x20있습니다.]</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<!--\x20인쇄할\x20때\x20하단에\x20표시되는\x20바닥글\x20-->\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22print-footer\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20©\x202024\x20투에스종합개발\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</body>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</html>\x0a\x20\x20\x20\x20"
    ),
        _0x91d6f7[_0x1250fc(0x2c9)]["close"](),
        _0x91d6f7[_0x1250fc(0x35e)](),
        (_0x91d6f7[_0x1250fc(0x2ea)] = function () {
            const _0x149006 = _0x1250fc;
            _0x91d6f7[_0x149006(0x1ff)](),
                setTimeout(function () {
                    _0x91d6f7["close"]();
                }, 0x3e8);
        });
}
async function saveMap(_0x32d12b) {
    const _0x3a8dd0 = a53_0xca03c6;
    function _0x4bbe23(_0x47db87) {
        const _0xc30a4c = a53_0x3dc2,
            _0x376391 = new TextEncoder(),
            _0x32ecd3 = _0x376391[_0xc30a4c(0x336)](_0x47db87);
        return btoa(String[_0xc30a4c(0x23a)](..._0x32ecd3));
    }
    const _0x19dc82 = document[_0x3a8dd0(0x29b)](_0x32d12b),
        _0x502abf = _0x19dc82[_0x3a8dd0(0x337)],
        _0x49c791 = _0x19dc82[_0x3a8dd0(0x2e5)],
        _0x2342d4 = _0x19dc82[_0x3a8dd0(0x2f2)],
        _0x45393a = _0x3a8dd0(0x22c) + _0x49c791 + _0x3a8dd0(0x2f9) + _0x2342d4 + _0x3a8dd0(0x345) + _0x502abf + _0x3a8dd0(0x1b2),
        _0x174b84 = _0x4bbe23(_0x45393a),
        _0x4cde00 = _0x3a8dd0(0x2a8),
        _0x41604f = { html: _0x174b84, width: _0x2342d4, height: _0x49c791 };
    try {
        const _0x395cdd = await callApi(_0x3a8dd0(0x335), _0x4cde00, _0x41604f);
        if (_0x395cdd[_0x3a8dd0(0x31f)]) {
            var _0x58159e = document[_0x3a8dd0(0x2e7)]("a");
            (_0x58159e["href"] = _0x395cdd[_0x3a8dd0(0x2ff)]), (_0x58159e[_0x3a8dd0(0x2a7)] = "map_image.png"), document[_0x3a8dd0(0x262)][_0x3a8dd0(0x33a)](_0x58159e), _0x58159e[_0x3a8dd0(0x322)](), document[_0x3a8dd0(0x262)]["removeChild"](_0x58159e);
        } else alert(_0x3a8dd0(0x37d) + _0x395cdd[_0x3a8dd0(0x354)]);
    } catch (_0xfc2c91) {
        console["log"](_0x3a8dd0(0x37d) + _0xfc2c91);
    }
}
function initShareEvents() {
    const _0x5e525f = a53_0xca03c6;
    !Kakao["isInitialized"]() && Kakao[_0x5e525f(0x1c3)](_0x5e525f(0x279));
    const _0x749db1 = location["href"];
    console[_0x5e525f(0x2ed)](_0x749db1), Kakao[_0x5e525f(0x36f)][_0x5e525f(0x202)]({ objectType: _0x5e525f(0x1dc), text: _0x5e525f(0x1e5), link: { mobileWebUrl: _0x749db1, webUrl: _0x749db1 } });
}
function copyUrl() {
    const _0x2c638e = a53_0xca03c6;
    navigator[_0x2c638e(0x259)]
        [_0x2c638e(0x349)](location[_0x2c638e(0x2ee)])
        [_0x2c638e(0x2e6)](function () {
            const _0x547aaf = _0x2c638e;
            $(_0x547aaf(0x285))[_0x547aaf(0x1cb)](_0x547aaf(0x2f7)), $(_0x547aaf(0x224))[_0x547aaf(0x222)]("<h2><span>URL</span>이\x20클립보드에\x20복사되었습니다.</h2>");
        })
        [_0x2c638e(0x2a4)](function (_0x196a63) {
            const _0x475f51 = _0x2c638e;
            console[_0x475f51(0x2ed)](_0x475f51(0x2ce) + _0x196a63);
        });
}
function toggleFavorite(_0x3d93f6) {
    const _0x21ba74 = a53_0xca03c6;
    _0x3d93f6[_0x21ba74(0x220)](_0x21ba74(0x1fa)) ? favoriteCancel() : favoriteRegister();
}
async function favoriteRegister() {
    const _0x505291 = a53_0xca03c6,
        _0x19a084 = userInfo();
    if (!_0x19a084) {
        $(_0x505291(0x285))[_0x505291(0x1cb)](_0x505291(0x2f7)), $(_0x505291(0x224))["html"]("<h2><span>회원\x20전용</span>\x20기능입니다.</h2>");
        return;
    }
    const _0x85a73f = $("#map_sell_view\x20.estate-no"),
        _0x503e1d = _0x85a73f[_0x505291(0x1dc)](),
        _0x127d47 = $("#msv_content")[_0x505291(0x25c)](_0x505291(0x25a))[_0x505291(0x1dc)](),
        _0x3a3721 = _0x85a73f[_0x505291(0x245)](_0x505291(0x212)),
        _0x41b91f = _0x85a73f[_0x505291(0x245)](_0x505291(0x382)),
        _0x14b78a = { ..._0x19a084, address: encodeURIComponent(_0x127d47), lat: encodeURIComponent(_0x3a3721), lng: encodeURIComponent(_0x41b91f), type: encodeURIComponent(_0x505291(0x217)), estateNo: encodeURIComponent(_0x503e1d) };
    callApiAbort(_0x505291(0x302), _0x505291(0x335), _0x14b78a, "favoriteRegister")
        [_0x505291(0x2e6)]((_0x536df6) => {
            const _0x2b2ab3 = _0x505291;
            if (!_0x536df6) {
                $("#modalAlert")[_0x2b2ab3(0x1cb)](_0x2b2ab3(0x2f7)), $(_0x2b2ab3(0x224))[_0x2b2ab3(0x222)](_0x2b2ab3(0x292));
                return;
            }
            const { responseData: _0x2f7263, message: _0x371f9e, statusCode: _0x3b594a } = _0x536df6;
            if (_0x3b594a !== 0xc8) return;
            $(_0x2b2ab3(0x285))[_0x2b2ab3(0x1cb)](_0x2b2ab3(0x2f7)), $(_0x2b2ab3(0x224))[_0x2b2ab3(0x222)]("<h2><span>찜</span>으로\x20등록되었습니다.</h2>"), $("#favorite_btn")[_0x2b2ab3(0x1ce)](_0x2b2ab3(0x1fa)), getRescentHistory();
        })
        [_0x505291(0x2a4)]((_0x1ff262) => {
            const _0x41bbbc = _0x505291;
            console[_0x41bbbc(0x2ed)](_0x1ff262);
        });
}
async function favoriteCancel() {
    const _0x2f58a2 = a53_0xca03c6,
        _0x326876 = userInfo();
    if (!_0x326876) {
        $(_0x2f58a2(0x285))[_0x2f58a2(0x1cb)]("open"), $("#alert_message")[_0x2f58a2(0x222)](_0x2f58a2(0x2b3));
        return;
    }
    const _0x80bdae = $(_0x2f58a2(0x344)),
        _0x18fbe6 = _0x80bdae["text"]();
    console[_0x2f58a2(0x2ed)](_0x18fbe6);
    const _0x2f1b23 = { ..._0x326876, estateNo: encodeURIComponent(_0x18fbe6), type: encodeURIComponent("estate") };
    callApiAbort("/front/back/favorite/favorite_cancel_estate.php", _0x2f58a2(0x335), _0x2f1b23, _0x2f58a2(0x304))
        [_0x2f58a2(0x2e6)]((_0x443a87) => {
            const _0x5b7572 = _0x2f58a2;
            if (!_0x443a87) {
                $(_0x5b7572(0x285))[_0x5b7572(0x1cb)](_0x5b7572(0x2f7)), $(_0x5b7572(0x224))["html"](_0x5b7572(0x292));
                return;
            }
            const { responseData: _0x5acc97, message: _0x2bf953, statusCode: _0x4cabcf } = _0x443a87;
            if (_0x4cabcf !== 0xc8) return;
            $(_0x5b7572(0x285))[_0x5b7572(0x1cb)](_0x5b7572(0x2f7)), $(_0x5b7572(0x224))[_0x5b7572(0x222)](_0x5b7572(0x38b)), $(_0x5b7572(0x24b))[_0x5b7572(0x37b)](_0x5b7572(0x1fa)), getRescentHistory();
        })
        [_0x2f58a2(0x2a4)]((_0x30c7e2) => {
            const _0x9d30d4 = _0x2f58a2;
            console[_0x9d30d4(0x2ed)](_0x30c7e2);
        });
}
async function favoriteCheck(_0x426188) {
    const _0x1c7362 = a53_0xca03c6,
        _0x4ef8e5 = userInfo();
    if (!_0x4ef8e5) return;
    const _0x1de738 = { ..._0x4ef8e5, estateNo: encodeURIComponent(_0x426188) };
    callApiAbort(_0x1c7362(0x25e), _0x1c7362(0x335), _0x1de738, _0x1c7362(0x1c4))
        [_0x1c7362(0x2e6)]((_0x591cb8) => {
            const _0x563f66 = _0x1c7362;
            if (!_0x591cb8) return;
            let { responseData: _0x4b27e2, message: _0x1f385a, statusCode: _0x351a64 } = _0x591cb8;
            if (_0x351a64 !== 0xc8) return;
            _0x4b27e2 && _0x4b27e2[_0x563f66(0x2e0)] > 0x0 ? $(_0x563f66(0x24b))[_0x563f66(0x1ce)](_0x563f66(0x1fa)) : $(_0x563f66(0x24b))[_0x563f66(0x37b)](_0x563f66(0x1fa));
        })
        ["catch"]((_0x2ec5ad) => {
            const _0x180730 = _0x1c7362;
            console[_0x180730(0x2ed)](_0x2ec5ad);
        });
}
function printSelectedSections() {
    const _0x219bfd = a53_0xca03c6;
    var _0x44a59e = $(_0x219bfd(0x327))["clone"](),
        _0x11de89 = window[_0x219bfd(0x2f7)]("", _0x219bfd(0x29e), _0x219bfd(0x2c5));
    if (!_0x11de89) {
        $(_0x219bfd(0x285))[_0x219bfd(0x1cb)](_0x219bfd(0x2f7)), $(_0x219bfd(0x224))[_0x219bfd(0x222)]("<h2>새\x20창이\x20<span>차단</span>되었습니다.\x20팝업\x20차단을\x20해제해주세요.</h2>");
        return;
    }
    var _0x13954f = Array[_0x219bfd(0x237)](document["styleSheets"])
            [_0x219bfd(0x2fd)](function (_0xef4141) {
                const _0x1b6a44 = _0x219bfd;
                return _0xef4141[_0x1b6a44(0x2ee)];
            })
            [_0x219bfd(0x1e0)](function (_0x79d4b8) {
                const _0x2a593e = _0x219bfd;
                return _0x2a593e(0x377) + _0x79d4b8[_0x2a593e(0x2ee)] + _0x2a593e(0x1fc);
            })
            ["join"]("\x0a"),
        _0x293b9f = Array[_0x219bfd(0x237)](document[_0x219bfd(0x32e)])
            ["filter"](function (_0x3f3481) {
                return !_0x3f3481["href"];
            })
            ["map"](function (_0x309845) {
                const _0x3cbbc2 = _0x219bfd;
                try {
                    return Array[_0x3cbbc2(0x237)](_0x309845[_0x3cbbc2(0x2b0)])
                        [_0x3cbbc2(0x1e0)](function (_0x2fa58b) {
                            return _0x2fa58b["cssText"];
                        })
                        [_0x3cbbc2(0x34c)]("\x0a");
                } catch (_0x208a7e) {
                    return console[_0x3cbbc2(0x228)](_0x3cbbc2(0x2cf), _0x309845["href"]), "";
                }
            })
            [_0x219bfd(0x34c)]("\x0a"),
        _0x17dabd = _0x11de89[_0x219bfd(0x2c9)],
        _0x29f45e = _0x219bfd(0x232) + _0x13954f + _0x219bfd(0x2b8) + _0x293b9f + _0x219bfd(0x225) + _0x44a59e["html"]() + _0x219bfd(0x26d);
    _0x17dabd[_0x219bfd(0x2f7)](),
        _0x17dabd["write"](_0x29f45e),
        _0x17dabd[_0x219bfd(0x206)](),
        (_0x11de89["onload"] = function () {
            const _0x426d00 = _0x219bfd;
            _0x11de89[_0x426d00(0x1ff)](),
                savePrintHistory(),
                setTimeout(function () {
                    const _0x3104bc = _0x426d00;
                    _0x11de89[_0x3104bc(0x206)]();
                }, 0x3e8);
        });
}
function savePrintHistory() {
    const _0x23deb6 = a53_0xca03c6,
        _0x4b412b = userInfo();
    if (!_0x4b412b) return;
    const _0x2191d4 = $("#map_sell_view\x20.estate-no"),
        _0x105e5d = _0x2191d4[_0x23deb6(0x1dc)](),
        _0x4367b4 = $("#msv_content")[_0x23deb6(0x25c)](_0x23deb6(0x25a))[_0x23deb6(0x1dc)](),
        _0x5f4db2 = _0x2191d4["attr"](_0x23deb6(0x212)),
        _0x2f1585 = _0x2191d4[_0x23deb6(0x245)]("data-lng"),
        _0x28a542 = { ..._0x4b412b, address: encodeURIComponent(_0x4367b4), lat: encodeURIComponent(_0x5f4db2), lng: encodeURIComponent(_0x2f1585), estateNo: encodeURIComponent(_0x105e5d), type: encodeURIComponent(_0x23deb6(0x217)) };
    callApiAbort(_0x23deb6(0x2dd), _0x23deb6(0x335), _0x28a542, "savePrintHistory")
        [_0x23deb6(0x2e6)]((_0x45a668) => {
            if (!_0x45a668) return;
            const { responseData: _0x299436, message: _0x580a06, statusCode: _0x5eeba3 } = _0x45a668;
            if (_0x5eeba3 !== 0xc8) return;
            getRescentHistory();
        })
        [_0x23deb6(0x2a4)]((_0x109d66) => {
            console["log"](_0x109d66);
        });
}
function getRescentHistory() {
    const _0x331cb3 = a53_0xca03c6,
        _0x2ea84f = userInfo();
    if (!_0x2ea84f) return;
    const _0x5bf425 = { ..._0x2ea84f, type: encodeURIComponent(_0x331cb3(0x217)) };
    callApiAbort(_0x331cb3(0x256), _0x331cb3(0x335), _0x5bf425, _0x331cb3(0x1d0))
        [_0x331cb3(0x2e6)]((_0x1b6d31) => {
            const _0x1bd017 = _0x331cb3;
            if (!_0x1b6d31) return;
            const { responseData: _0xc8652, message: _0xe3d75, statusCode: _0x270736 } = _0x1b6d31;
            if (_0x270736 !== 0xc8) return;
            const _0x54f900 = _0xc8652[_0x1bd017(0x1c1)],
                _0x395f6c = _0xc8652[_0x1bd017(0x27a)],
                _0x30569c = _0xc8652[_0x1bd017(0x1fb)],
                _0x50e40f = $(".mh-list");
            if (_0x54f900) {
                const _0x2f1d92 = _0x54f900[_0x1bd017(0x1e0)](function (_0x55104a, _0x526b71) {
                    const _0x4a3072 = _0x1bd017;
                    return (
                        _0x4a3072(0x2f0) +
                        (_0x526b71 >= 0x3 ? _0x4a3072(0x25f) : "") +
                        "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dt\x20class=\x22history-address\x20cursor-pointer\x22\x20data-lat=\x22" +
                        _0x55104a["latitude"] +
                        _0x4a3072(0x22a) +
                        _0x55104a[_0x4a3072(0x1da)] +
                        "\x22>" +
                        _0x55104a["jibun_address"] +
                        "</dt>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dd><button\x20class=\x22remove-history-btn\x20btn-line-red-s\x22\x20data-no=\x22" +
                        _0x55104a[_0x4a3072(0x1c0)] +
                        _0x4a3072(0x370)
                    );
                })[_0x1bd017(0x34c)]("");
                _0x50e40f["find"](_0x1bd017(0x32f))[_0x1bd017(0x222)](_0x2f1d92);
            }
            if (_0x395f6c) {
                const _0x5b23ec = _0x395f6c[_0x1bd017(0x1e0)](function (_0x30bae3, _0xc62562) {
                    const _0x39861f = _0x1bd017;
                    return (
                        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dl\x20class=\x22" +
                        (_0xc62562 >= 0x3 ? "d-none" : "") +
                        _0x39861f(0x1c2) +
                        _0x30bae3["latitude"] +
                        _0x39861f(0x22a) +
                        _0x30bae3["longitude"] +
                        "\x22>" +
                        _0x30bae3[_0x39861f(0x211)] +
                        "</dt>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dd><button\x20class=\x22remove-history-btn\x20btn-line-red-s\x22\x20data-no=\x22" +
                        _0x30bae3[_0x39861f(0x1c0)] +
                        _0x39861f(0x383)
                    );
                })["join"]("");
                _0x50e40f[_0x1bd017(0x25c)](_0x1bd017(0x22d))[_0x1bd017(0x222)](_0x5b23ec);
            }
            if (_0x30569c) {
                const _0x2f7407 = _0x30569c[_0x1bd017(0x1e0)](function (_0x2b203c, _0x1ec0d3) {
                    const _0xfb7811 = _0x1bd017;
                    return _0xfb7811(0x2f0) + (_0x1ec0d3 >= 0x3 ? _0xfb7811(0x25f) : "") + _0xfb7811(0x1c2) + _0x2b203c[_0xfb7811(0x306)] + _0xfb7811(0x22a) + _0x2b203c["longitude"] + "\x22>" + _0x2b203c[_0xfb7811(0x211)] + _0xfb7811(0x32b) + _0x2b203c[_0xfb7811(0x1c0)] + _0xfb7811(0x2be);
                })[_0x1bd017(0x34c)]("");
                _0x50e40f["find"](".mhl-print")[_0x1bd017(0x222)](_0x2f7407);
            }
        })
        [_0x331cb3(0x2a4)]((_0x293e68) => {
            const _0x333b0d = _0x331cb3;
            console[_0x333b0d(0x2ed)](_0x293e68);
        });
}
async function removeHistory(_0x443bb4) {
    const _0xe7b80c = a53_0xca03c6,
        _0x5caad7 = userInfo();
    if (!_0x5caad7) return;
    const _0x5c32d9 = _0x443bb4[_0xe7b80c(0x245)]("data-no"),
        _0x4a1923 = _0x443bb4[_0xe7b80c(0x245)](_0xe7b80c(0x301)),
        _0x5a0739 = { ..._0x5caad7, no: encodeURIComponent(_0x5c32d9), type: encodeURIComponent(_0x4a1923) },
        _0x4d0527 = await callApi("POST", _0xe7b80c(0x2d2), _0x5a0739);
    _0x4d0527[_0xe7b80c(0x1d3)] == 0xc8 && _0x4d0527[_0xe7b80c(0x354)] == "SUCCESS" && (getRescentHistory(), favoriteCheck());
}
function saveSearchHistory(_0x1741a6) {
    const _0x1ad2db = a53_0xca03c6,
        _0x34e74b = userInfo();
    if (!_0x34e74b) return;
    const _0x48cff1 = _0x1741a6[_0x1ad2db(0x1fd)],
        _0x3b0984 = _0x1741a6[_0x1ad2db(0x2d4)],
        _0x384f3f = _0x1741a6[_0x1ad2db(0x1e9)],
        _0x640370 = { ..._0x34e74b, address: encodeURIComponent(_0x48cff1), lat: encodeURIComponent(_0x3b0984), lng: encodeURIComponent(_0x384f3f), type: encodeURIComponent(_0x1ad2db(0x217)) };
    callApiAbort(_0x1ad2db(0x376), _0x1ad2db(0x335), _0x640370, _0x1ad2db(0x2b1))
        [_0x1ad2db(0x2e6)]((_0x5b261c) => {
            if (!_0x5b261c) return;
            const { responseData: _0x1d7bf5, message: _0x1075ca, statusCode: _0x1d840c } = _0x5b261c;
            if (_0x1d840c !== 0xc8) return;
            getRescentHistory();
        })
        ["catch"]((_0x31872c) => {
            const _0xf8d31a = _0x1ad2db;
            console[_0xf8d31a(0x2ed)](_0x31872c);
        });
}
function a53_0x4ff3() {
    const _0x48173c = [
        "50%",
        ":nth-child(4)",
        "#search_result_box",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22info\x22\x20data-lat=\x22",
        "location",
        "\x22\x20class=\x22image-popup\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<img\x20src=\x22",
        "none",
        "transformOrigin",
        "reg_date",
        "/front/back/history/get_recent_history.php",
        "placesList",
        "easeOutQuad",
        "clipboard",
        ".address_jibun",
        ";\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20right:\x20auto\x20!important;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20left:\x2050%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transform:\x20translateX(-50%);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20/*\x20인쇄에\x20표시되지\x20않도록\x20설정된\x20요소들\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20#draw_toolbox\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20display:\x20none\x20!important;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20/*\x20설명\x20텍스트\x20스타일\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20#des\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-align:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding-bottom:\x2060px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20/*\x20바닥글\x20스타일\x20(고정\x20위치)\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.print-footer\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20display:\x20block;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20fixed;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20bottom:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20left:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20width:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-align:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2012px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-top:\x201px\x20solid\x20#000;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20/*\x20인쇄할\x20때\x20적용될\x20미디어\x20쿼리\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20@media\x20print\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20//\x20@page\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20//\x20\x20\x20\x20\x20size:\x20A4;\x20/*\x20A4\x20용지로\x20인쇄\x20설정\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20//\x20\x20\x20\x20\x20margin:\x2010mm;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20//\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</style>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "find",
        "slow",
        "/front/back/favorite/favorite_check_estate.php",
        "d-none",
        "</h2>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<ul>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li>",
        "1271838WTtkds",
        "body",
        "car_parking",
        "getLevel",
        "stringify",
        ".mc-mo-open-close",
        "getSouthWest",
        "1px",
        "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
        "water",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<html>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<head>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<title>원스톱\x20부동산\x20종합\x20플랫폼\x20서비스\x20토디</title>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<style>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20/*\x20인쇄될\x20페이지의\x20기본\x20스타일\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20body\x20{\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin:\x2020px;\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-family:\x20Arial,\x20sans-serif;\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20line-height:\x201.5;\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20#fff\x20!important;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20//\x20overflow:\x20hidden\x20!important;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20height:\x20",
        "panTo",
        "\x20<!--\x20선택한\x20콘텐츠가\x20여기에\x20포함됨\x20-->\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22print-footer\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20©\x202024\x20투에스종합개발\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</body>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</html>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "#print_map_btn",
        "transform\x200.3s\x20ease",
        "totArea",
        "setLevel",
        ".sale-thumbnail-slider\x20.swiper-wrapper",
        "innerHeight",
        "fadeOut",
        "중개사\x20홈페이지",
        "value",
        "popstate",
        "div",
        "847d6b0bbbc2dbfe6b7c0c1f82d8cd71",
        "favorites_history",
        "mainPurpsCdNm",
        "imageArray",
        "item",
        "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dt>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h2\x20class=\x22d-flex\x20align-items-center\x20gap-1\x22>",
        "setCenter",
        "#map_sell_view\x20.msv-info\x20dd\x20.estate-no",
        "random",
        "ArrowDown",
        ".map-sell-view",
        ".mo-land",
        "#modalAlert",
        "error",
        "ArrowLeft",
        ".ml-info",
        "toFixed",
        "name",
        "관련지번",
        "정보\x20없음",
        ".map-content",
        "transitionend",
        "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h5>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<i\x20class=\x22las\x20la-lg\x20la-map-marker\x22></i>\x20",
        "</span>",
        "append",
        "<h2>다시\x20시도해주세요.</h2>",
        "address_jibun",
        "forEach",
        "address_road",
        "estate_type",
        "참고사항",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22swiper-slide\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<img\x20src=\x22/front/assets/image/building_empty.png\x22\x20alt=\x22No\x20Image\x20Available\x22\x20class=\x22img-fluid\x20d-block\x20rounded\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20",
        "grndFlrCnt",
        ".mh-list",
        "getElementById",
        "\x22\x20alt=\x22Estate\x20Image\x22\x20class=\x22gallery-img\x20img-fluid\x20mx-auto\x20rounded\x22\x20onerror=\x22this.onerror=null;this.src=\x27/front/assets/image/building_empty.png\x27;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</a>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "소재지(지번)",
        "_blank",
        "broker_phone",
        "getLng",
        "<span\x20class=\x22label-default\x20bg-violet1\x22>임대</span>",
        "key",
        "#search_result_box_mobile",
        "catch",
        "#fff",
        "#mapContentOpenClose",
        "download",
        "/front/back/realPrice/download_map_image.php",
        "85px",
        "/front/back/history/recent_visit_register_sale.php",
        "set",
        "style",
        "address_name",
        "<i\x20class=\x22las\x20la-lg\x20la-store\x22></i>",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20class=\x22item\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22info\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h5>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20검색\x20결과가\x20없습니다.\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</h5>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>",
        "cssRules",
        "saveSearchHistory",
        "selected",
        "<h2><span>회원\x20전용</span>\x20기능입니다.</h2>",
        "getBounds",
        "notes",
        "length",
        "scroll",
        "\x20<!--\x20외부\x20스타일시트를\x20link\x20태그로\x20추가\x20-->\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<style>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20body\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background-color:\x20#fff;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.map-content\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-left:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20height:\x20auto;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20top:\x200\x20!important;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.map-sell-view\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20overflow:\x20unset;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20max-width:\x20500px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.map-sell-view\x20.msv-content\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20overflow:\x20unset;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "finally",
        "registered_broker_name",
        "#map_sell_view\x20.msv-price-option\x20dt",
        "<i\x20class=\x22las\x20la-lg\x20la-parking\x22></i>",
        "price_slider",
        "\x22\x20data-type=\x22print\x22>삭제</button></dd>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dl>",
        "4602472scmjnL",
        "relayout",
        "</div>",
        "center",
        "not",
        "trim",
        "fullscreen=yes",
        "feature",
        "getContent",
        "round",
        "document",
        "<p\x20class=\x22jibun\x20gray\x22>",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<ul\x20class=\x22custom-cluster-content\x20position-absolute\x20text-center\x20font14\x20bg-white\x20border\x20border-danger\x20overflow-hidden\x22\x20style=\x22min-width:55px;\x20border-radius:10px;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20class=\x22color-gray\x20bg-white\x20p-1\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22\x22>",
        "<span\x20class=\x22label-default\x20bg-indigo1\x22>교환</span>",
        ".close-btn",
        "복사\x20실패:\x20",
        "크로스\x20오리진\x20문제로\x20인해\x20스타일시트를\x20가져올\x20수\x20없습니다:",
        "maintenance_price",
        "\x20/\x20지하\x20",
        "/front/back/history/history_delete_map.php",
        "slideUp",
        "lat",
        "outerHTML",
        "LatLng",
        "<img\x20src=\x22",
        "map_bg",
        "preventDefault",
        "lastChild",
        "관련지번\x20없음",
        ".mo-tool",
        "/front/back/history/save_print_history.php",
        "75px",
        "display",
        "cnt",
        "#mapShare",
        "용도지역",
        "<a\x20target=\x22_blank\x22\x20href=\x22",
        "all",
        "offsetHeight",
        "then",
        "createElement",
        "/front/back/00-include/image.php?token=",
        "mouseover",
        "onload",
        "clustered",
        "slideToggle",
        "log",
        "href",
        "m\x20도로\x20접속",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dl\x20class=\x22",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</h5>",
        "offsetWidth",
        "소재지(도로명)",
        "<i\x20class=\x22las\x20la-lg\x20la-landmark\x22></i>",
        "nearest",
        "15305XCCFRz",
        "open",
        "getMarkers",
        "px;\x20width:",
        "imageToken",
        ";\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20height:\x20",
        "</p>",
        "filter",
        "fileType",
        "image_url",
        "block",
        "data-type",
        "/front/back/favorite/favorite_register_realPrice.php",
        "융자금",
        "favoriteCancel",
        "floor_height",
        "latitude",
        "#placesList",
        "<i\x20class=\x22las\x20la-lg\x20la-hospital\x22></i>",
        "총면적",
        "lndcgrCodeNm",
        "</option>",
        "#detail_top_btn",
        "promise",
        "0.75",
        "loan_price",
        "</button>",
        "<option\x20value=\x22",
        "estateList",
        "\x22\x20alt=\x22\x22\x20width=\x22100\x22\x20onerror=\x22this.onerror=null;this.src=\x27/front/assets/image/building_empty.png\x27;\x22>",
        "#estate_type_filter",
        "Marker",
        "test",
        "#mapOptionToolOpen",
        "exclusive",
        ".map-select-group\x20button",
        "임대\x20",
        "scale(0.8)",
        "split",
        ":nth-child(5)",
        "\x22\x20class=\x22btn-default-s\x20bg-main\x20align-content-center\x22>홈페이지\x20바로가기</a>",
        "success",
        "bold",
        "title",
        "click",
        "link[rel=\x22stylesheet\x22],\x20style",
        "video",
        "#more_btn",
        "중개사\x20상호",
        "#map_sell_view",
        "getClusterMarker",
        "active\x20full",
        "platArea",
        "</dt>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dd><button\x20class=\x22remove-history-btn\x20btn-line-red-s\x22\x20data-no=\x22",
        "</dd>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dl>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dt>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dd>",
        ".agency-name",
        "styleSheets",
        ".mhl-search",
        "<i\x20class=\x22las\x20la-lg\x20la-hotel\x22></i>",
        "<video\x20muted\x20width=\x22100%\x22\x20class=\x22img-fluid\x20mx-auto\x20rounded\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<source\x20src=\x22",
        "#mapOptionLandOpen",
        "non-exclusive",
        "scrollTop",
        "POST",
        "encode",
        "innerHTML",
        ".history-address",
        "closest",
        "appendChild",
        "homepage_url",
        "agency_name",
        "관련지번\x20있음",
        "#mapShareClose",
        "18px",
        "1.5rem",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dl\x20class=\x22",
        "search",
        "change",
        "#map_sell_view\x20.estate-no",
        "px;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "#mapHistoryOpen",
        "#mapOptionToolOptionOpen",
        "delay",
        "writeText",
        "\x22><button\x20type=\x22button\x22>",
        "parentElement",
        "join",
        "#search_input",
        "ugrndFlrCnt",
        "/front/back/sell/filter_type_get.php",
        ".map-history",
        "ready",
        "target",
        "hasChildNodes",
        "message",
        ".map-bg",
        "getLat",
        ".msv-close\x20button",
        "one",
        "2487380lLVCze",
        "#input_price_end",
        "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h5>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "road_address_name",
        "maps",
        "focus",
        ".mh-list\x20>\x20dl\x20>\x20dd\x20>\x20button",
        "42019pnnSTc",
        ".selected",
        "addListener",
        "#search_input,\x20#search_input_mobile",
        "토지면적",
        ".print-opt",
        "\x22\x20data-estate-no=\x22",
        "estate_no",
        "<span\x20class=\x22label-default\x20bg-green1\x22>매매</span>",
        "price",
        "hide",
        "251025bkyApH",
        ".map-select-group",
        "65px",
        "placesListMobile",
        "Share",
        "\x22\x20data-type=\x22search\x22>삭제</button></dd>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dl>",
        "#kakaotalk_sharing_btn",
        ".mc-sell",
        ".msv-close",
        "<img\x20src=\x22/front/assets/image/building_empty.png\x22\x20width=\x22100%\x22\x20alt=\x22\x22\x20title=\x22\x22\x20/>",
        "건축면적",
        "/front/back/history/save_search_history.php",
        "<link\x20rel=\x22stylesheet\x22\x20href=\x22",
        "#702bfe",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22no_data_area_inner\x20d-flex\x20flex-column\x20justify-content-center\x20gap-3\x20text-center\x20position-absolute\x22\x20style=\x22top:50%;\x20left:50%;\x20transform:\x20translate(-50%,\x20-50%);\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20xmlns=\x22http://www.w3.org/2000/svg\x22\x20height=\x223em\x22\x20viewBox=\x220\x200\x20512\x20512\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<!--!\x20Font\x20Awesome\x20Free\x206.4.0\x20by\x20@fontawesome\x20-\x20https://fontawesome.com\x20License\x20-\x20https://fontawesome.com/license\x20(Commercial\x20License)\x20Copyright\x202023\x20Fonticons,\x20Inc.\x20-->\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<path\x20d=\x22M256\x20512A256\x20256\x200\x201\x200\x20256\x200a256\x20256\x200\x201\x200\x200\x20512zm0-384c13.3\x200\x2024\x2010.7\x2024\x2024V264c0\x2013.3-10.7\x2024-24\x2024s-24-10.7-24-24V152c0-13.3\x2010.7-24\x2024-24zM224\x20352a32\x2032\x200\x201\x201\x2064\x200\x2032\x2032\x200\x201\x201\x20-64\x200z\x22\x20style=\x22fill:\x20var(--var-color-main-1)\x22></path>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>매물이\x20없습니다.</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>",
        "<p>",
        "removeClass",
        "#placesListMobile",
        "Error:\x20",
        "replace",
        ".history-marker",
        "index",
        "사용승인일",
        "data-lng",
        "\x22\x20data-type=\x22favorite\x22>삭제</button></dd>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</dl>",
        "power",
        "</span>\x20/\x20<span\x20class=\x22text-nowrap\x22>",
        "</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</ul>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p\x20class=\x22text-clamp\x22>",
        "toString",
        "bcRat",
        "10vbQobe",
        "중개사\x20전화번호",
        "<h2><span>해제</span>되었습니다.</h2>",
        "#print_confirm_btn",
        "description",
        "sale_price",
        ".sale-thumbnail-slider",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20",
        "noUiSlider",
        "dl[data-estate-no=\x22",
        "transition",
        ".swiper-button-prev",
        "#remove_history_marker",
        ".mo-tool-option",
        "data-estate-no",
        "pushState",
        "건물층고",
        "addMarker",
        "#search_input_mobile",
        "values",
        "Status",
        "idx",
        "search_history",
        "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dt\x20class=\x22history-address\x20cursor-pointer\x22\x20data-lat=\x22",
        "init",
        "favoriteCheck",
        "archArea",
        "#msv_content",
        "waterworks",
        "px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20//\x20max-height:\x20",
        "flex",
        "floor",
        "iziModal",
        "services",
        "매물구분",
        "addClass",
        "vlRat",
        "getRescentHistory",
        "animate",
        "val",
        "statusCode",
        "<dl><dt>",
        "prposAreaNm",
        "#mapShareOpen",
        "지하수",
        "clusterdblclick",
        "slideDown",
        "longitude",
        "road_conditions",
        "text",
        "scrollIntoView",
        "empty",
        "stopPropagation",
        "map",
        "full",
        "setMap",
        "용적률",
        "</button></dt>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dd>등록일.\x20",
        "[매물\x20공유]\x20#토디\x20#매물정보\x20#부동산",
        "SUCCESS",
        "MarkerClusterer",
        "ul\x20li",
        "lng",
        "#list_top_btn",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22swiper-slide\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<img\x20src=\x22/front/assets/image/building_empty.png\x22\x20alt=\x22Estate\x20Image\x22\x20class=\x22gallery-img\x20img-fluid\x20mx-auto\x20rounded\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "/front/assets/image/building_empty.png",
        "recentVisit",
        "PDF로\x20저장하려면\x20\x22PDF로\x20저장\x22\x20옵션을\x20선택해주세요.",
        "fadeIn",
        "2FBARQW",
        "clientHeight",
        "#map_sell_view\x20.msv-info\x20.estate-no",
        "css",
        "<i\x20class=\x22las\x20la-lg\x20la-coffee\x22></i>",
        "#save_img_btn",
        "중개사\x20주소",
        "#rvWrapper",
        "querySelectorAll",
        "매매\x20",
        "active",
        "print_history",
        "\x22\x20/>",
        "address",
        "px;\x20/*\x20스크롤된\x20위치에서\x20인쇄\x20시작\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20height:\x20",
        "print",
        "rent_price",
        "estateNo",
        "sendDefault",
        "ArrowUp",
        "\x0a\x20\x20\x20\x20<svg\x20width=\x2220\x22\x20height=\x2219\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20xmlns=\x22http://www.w3.org/2000/svg\x22>\x0a\x20\x20\x20\x20<path\x20fill-rule=\x22evenodd\x22\x20clip-rule=\x22evenodd\x22\x20d=\x22M5.84\x209.85601C7.63075\x2013.7544\x2010.8125\x2016.8438\x2014.762\x2018.519L14.774\x2018.524L15.538\x2018.864C16.0099\x2019.0744\x2016.5399\x2019.1161\x2017.0388\x2018.9818C17.5378\x2018.8476\x2017.9753\x2018.5458\x2018.278\x2018.127L19.552\x2016.364C19.5895\x2016.3121\x2019.6056\x2016.2478\x2019.597\x2016.1843C19.5884\x2016.1209\x2019.5559\x2016.0631\x2019.506\x2016.023L17.282\x2014.228C17.2558\x2014.2068\x2017.2255\x2014.1912\x2017.193\x2014.182C17.1606\x2014.1729\x2017.1266\x2014.1703\x2017.0932\x2014.1746C17.0597\x2014.1789\x2017.0275\x2014.19\x2016.9984\x2014.207C16.9694\x2014.2241\x2016.944\x2014.2469\x2016.924\x2014.274L16.058\x2015.442C15.956\x2015.5798\x2015.8098\x2015.6785\x2015.6439\x2015.7216C15.4779\x2015.7647\x2015.3022\x2015.7497\x2015.146\x2015.679C12.1871\x2014.3386\x209.81644\x2011.968\x208.476\x209.00901C8.40531\x208.8528\x208.39027\x208.67709\x208.43339\x208.51114C8.47652\x208.34519\x208.5752\x208.19903\x208.713\x208.09701L9.88\x207.23001C9.90712\x207.20996\x209.9299\x207.18464\x209.94698\x207.15557C9.96405\x207.12649\x209.97507\x207.09426\x209.97937\x207.06082C9.98367\x207.02737\x209.98115\x206.99341\x209.97198\x206.96096C9.96281\x206.92851\x209.94717\x206.89825\x209.926\x206.87201L8.132\x204.64801C8.09186\x204.59814\x208.03412\x204.56557\x207.97067\x204.55701C7.90723\x204.54845\x207.84292\x204.56456\x207.791\x204.60201L6.018\x205.88201C5.5964\x206.18611\x205.2931\x206.62682\x205.15966\x207.12924C5.02622\x207.63166\x205.07086\x208.16478\x205.286\x208.63801L5.84\x209.85601ZM14.17\x2019.897C9.8791\x2018.075\x206.4226\x2014.7173\x204.477\x2010.481L4.475\x2010.479L3.921\x209.25901C3.56242\x208.47044\x203.48791\x207.58205\x203.71013\x206.74477C3.93234\x205.9075\x204.43758\x205.17298\x205.14\x204.66601L6.913\x203.38601C7.27613\x203.12393\x207.72591\x203.01103\x208.16976\x203.07056C8.61362\x203.13009\x209.01776\x203.35751\x209.299\x203.70601L11.094\x205.93101C11.2421\x206.11458\x2011.3516\x206.3262\x2011.4159\x206.55316C11.4802\x206.78013\x2011.4979\x207.01774\x2011.468\x207.25172C11.4381\x207.4857\x2011.3612\x207.71123\x2011.242\x207.91475C11.1227\x208.11826\x2010.9635\x208.29557\x2010.774\x208.43601L10.104\x208.93201C11.2368\x2011.1283\x2013.0257\x2012.9172\x2015.222\x2014.05L15.719\x2013.38C15.8594\x2013.1906\x2016.0367\x2013.0316\x2016.2401\x2012.9124C16.4436\x2012.7933\x2016.669\x2012.7164\x2016.9028\x2012.6865C17.1367\x2012.6566\x2017.3742\x2012.6743\x2017.601\x2012.7385C17.8279\x2012.8027\x2018.0395\x2012.912\x2018.223\x2013.06L20.448\x2014.855C20.7968\x2015.1363\x2021.0244\x2015.5406\x2021.0839\x2015.9847C21.1434\x2016.4288\x2021.0304\x2016.8788\x2020.768\x2017.242L19.494\x2019.006C18.9897\x2019.7039\x2018.2606\x2020.2071\x2017.4291\x2020.4309C16.5977\x2020.6547\x2015.7145\x2020.5855\x2014.928\x2020.235L14.17\x2019.897Z\x22\x20fill=\x22#525252\x22></path>\x0a\x20\x20\x20\x20</svg>",
        "place_name",
        "close",
        "#search_btn_mobile",
        "/front/back/sell/estate_detail.php",
        "trigger",
        "Size",
        "<i\x20class=\x22las\x20la-lg\x20las\x20la-shapes\x22></i>",
        "getFilterTypes\x20error:",
        "<i\x20class=\x22las\x20la-lg\x20la-balance-scale\x22></i>",
        "상수도",
        "toggleClass",
        ".mo-tool\x20>\x20dl\x20>\x20dd\x20>\x20button",
        "jibun_address",
        "data-lat",
        "<a\x20href=\x22tel:",
        "주용도",
        "deposit_price",
        "keywordSearch",
        "estate",
        "#sale_type_filter",
        "164hbrazS",
        "교환\x20",
        "lastSearchedPlace",
        "#draw_tool_btn",
        "<i\x20class=\x22las\x20la-lg\x20la-store-alt\x22></i>",
        ".mcs-list",
        "Enter",
        "hasClass",
        "2000000",
        "html",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22swiper-slide\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<video\x20controls\x20width=\x22100%\x22\x20height=\x22100%\x22\x20class=\x22img-fluid\x20mx-auto\x20rounded\x20h-100\x22\x20controlslist=\x22nodownload\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<source\x20src=\x22",
        "#alert_message",
        "\x20<!--\x20내부\x20스타일시트를\x20스타일로\x20추가\x20-->\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</style>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</head>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<body>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20id=\x22print-content\x22\x20class=\x22map-sell-view\x20active\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "width",
        "transform",
        "warn",
        "<i\x20class=\x22las\x20la-lg\x20la-theater-masks\x22></i>",
        "\x22\x20data-lng=\x22",
        "event",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22position:relative;\x20height:",
        ".mhl-favorite",
        "8240067eJqqWg",
        ".agency_name",
        "sale_type",
        "#placesListMobile\x20li",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<html>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<head>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<title>인쇄\x20미리보기</title>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dl>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<dt\x20class=\x22agency-name\x22\x20data-estate-no=\x22",
        "estateDetail",
        "월\x20관리비",
        "</dt><dd\x20class=\x22",
        "from",
        "category_group_code",
        "each",
        "fromCharCode",
        "setItem",
        "거래종류",
        "children",
        "keyup",
        "scale(1)",
        "useAprDay",
        "input_price_start",
        "zIndex",
        "\x20/\x20",
        "600",
        "attr",
        "addEventListener",
        "지상\x20",
        "clusterover",
        "#filter_reset_btn",
        "only-uk",
        "#favorite_btn",
        "#print_btn",
    ];
    a53_0x4ff3 = function () {
        return _0x48173c;
    };
    return a53_0x4ff3();
}
async function recentVisit(_0x7793a4) {
    const _0x3c7cc3 = a53_0xca03c6,
        _0x97242e = userInfo() || {},
        _0x1dd969 = _0x7793a4["pnu"],
        _0x231ea9 = _0x7793a4["latitude"],
        _0x57882f = _0x7793a4["longitude"],
        _0x594bd6 = _0x7793a4[_0x3c7cc3(0x293)],
        _0x5c4edb = _0x7793a4[_0x3c7cc3(0x367)],
        _0x4e0096 = { ..._0x97242e, address: encodeURIComponent(_0x594bd6), lat: encodeURIComponent(_0x231ea9), lng: encodeURIComponent(_0x57882f), pnu: encodeURIComponent(_0x1dd969), estate_no: encodeURIComponent(_0x5c4edb) };
    callApiAbort(_0x3c7cc3(0x2aa), _0x3c7cc3(0x335), _0x4e0096, _0x3c7cc3(0x1ed))
        [_0x3c7cc3(0x2e6)]((_0x1d0140) => {
            if (!_0x1d0140) return;
            const { responseData: _0x36772f, message: _0x47c9ed, statusCode: _0x1a54c9 } = _0x1d0140;
            if (_0x1a54c9 !== 0xc8) return;
        })
        [_0x3c7cc3(0x2a4)]((_0x3f68c2) => {
            const _0x267ac0 = _0x3c7cc3;
            console[_0x267ac0(0x2ed)](_0x3f68c2);
        });
}
function onHistoryMarkers(_0x10eab3) {
    const _0x408d40 = a53_0xca03c6;
    historyMarkers[_0x408d40(0x294)]((_0x44ff68) => _0x44ff68[_0x408d40(0x1e2)](null));
    var _0x554ba1 = [];
    const _0xe18852 = _0x10eab3[_0x408d40(0x339)](_0x408d40(0x278))[_0x408d40(0x25c)]("dt");
    $["each"](_0xe18852, function (_0x4a058c, _0x1b4c4c) {
        const _0x399c53 = _0x408d40,
            _0x193f2c = $(_0x1b4c4c)[_0x399c53(0x245)](_0x399c53(0x212)),
            _0x3ba401 = $(_0x1b4c4c)[_0x399c53(0x245)](_0x399c53(0x382));
        _0x554ba1["push"]({ title: $(_0x1b4c4c)[_0x399c53(0x1dc)](), latlng: new kakao["maps"][_0x399c53(0x2d6)](_0x193f2c, _0x3ba401) });
    });
    var _0x3403ce = _0x408d40(0x269);
    for (var _0x4609d1 = 0x0; _0x4609d1 < _0x554ba1[_0x408d40(0x2b6)]; _0x4609d1++) {
        var _0x352cd9 = new kakao[_0x408d40(0x35d)][_0x408d40(0x20a)](0x18, 0x23),
            _0x36cf55 = new kakao["maps"]["MarkerImage"](_0x3403ce, _0x352cd9),
            _0x5a35af = new kakao[_0x408d40(0x35d)]["Marker"]({ map: map, position: _0x554ba1[_0x4609d1]["latlng"], title: _0x554ba1[_0x4609d1][_0x408d40(0x321)], image: _0x36cf55 });
        historyMarkers["push"](_0x5a35af);
    }
}
function getSearchElements() {
    const _0x4c142f = a53_0xca03c6;
    return $(window)[_0x4c142f(0x226)]() <= 0x3df
        ? { resultListItems: $(_0x4c142f(0x231)), searchBox: $(_0x4c142f(0x2a3)), searchInput: $(_0x4c142f(0x1bd)), palcesList: $(_0x4c142f(0x37c)), searchInput: $(_0x4c142f(0x1bd)), listEl: document["getElementById"](_0x4c142f(0x36e)) }
        : { resultListItems: $("#placesList\x20li"), searchBox: $(_0x4c142f(0x24f)), searchInput: $(_0x4c142f(0x34d)), palcesList: $(_0x4c142f(0x307)), searchInput: $("#search_input"), listEl: document["getElementById"](_0x4c142f(0x257)) };
}
function removeMarker(_0x222311) {
    const _0x2e49cd = a53_0xca03c6;
    for (var _0x3f0d83 = 0x0; _0x3f0d83 < _0x222311["length"]; _0x3f0d83++) {
        _0x222311[_0x3f0d83][_0x2e49cd(0x1e2)](null);
    }
    _0x222311 = [];
}
async function updateURL(_0x47f84b) {
    const _0x219347 = a53_0xca03c6,
        _0x58e43c = new URL(window["location"][_0x219347(0x2ee)]),
        _0x30c893 = new URLSearchParams(_0x58e43c[_0x219347(0x342)]);
    for (const [_0x86288c, _0x461f9c] of Object["entries"](_0x47f84b)) {
        _0x30c893[_0x219347(0x2ab)](_0x86288c, _0x461f9c), setCookie(_0x86288c, _0x461f9c);
    }
    (_0x58e43c[_0x219347(0x342)] = _0x30c893[_0x219347(0x387)]()), window["history"][_0x219347(0x1ba)]({}, "", _0x58e43c), handleUrlChangeForEstateNo();
}
