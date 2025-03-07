function a47_0x3137(_0x5c6e6a, _0x4ab5ac) {
    const _0xbb906c = a47_0xbb90();
    return (
        (a47_0x3137 = function (_0x3137a8, _0x3079ef) {
            _0x3137a8 = _0x3137a8 - 0x74;
            let _0xc3ba6 = _0xbb906c[_0x3137a8];
            return _0xc3ba6;
        }),
        a47_0x3137(_0x5c6e6a, _0x4ab5ac)
    );
}
const a47_0x186095 = a47_0x3137;
(function (_0x366332, _0x245080) {
    const _0x560819 = a47_0x3137,
        _0x35371a = _0x366332();
    while (!![]) {
        try {
            const _0x1d398e =
                parseInt(_0x560819(0x118)) / 0x1 +
                (parseInt(_0x560819(0xce)) / 0x2) * (parseInt(_0x560819(0x16d)) / 0x3) +
                (parseInt(_0x560819(0x77)) / 0x4) * (parseInt(_0x560819(0x132)) / 0x5) +
                (-parseInt(_0x560819(0x168)) / 0x6) * (parseInt(_0x560819(0xc8)) / 0x7) +
                -parseInt(_0x560819(0x13f)) / 0x8 +
                (parseInt(_0x560819(0x146)) / 0x9) * (parseInt(_0x560819(0xe6)) / 0xa) +
                -parseInt(_0x560819(0x9d)) / 0xb;
            if (_0x1d398e === _0x245080) break;
            else _0x35371a["push"](_0x35371a["shift"]());
        } catch (_0x4f8360) {
            _0x35371a["push"](_0x35371a["shift"]());
        }
    }
})(a47_0xbb90, 0x6c1ca);
const REST_API_KEY = a47_0x186095(0x135);
let currCategory = "",
    placeMarkers = [];
var placeOverlay = new kakao[a47_0x186095(0x170)][a47_0x186095(0x88)]({ zIndex: 0x1 });
let placeOverlayNode = document[a47_0x186095(0x141)]("div"),
    placeRangePolygon,
    globalBrTitleInfo = {},
    globalLandCharacter = {},
    globalLandPrices = {},
    miniMap = null;
$(document)[a47_0x186095(0x18f)](function () {
    const _0x5c2545 = a47_0x186095;
    initializeTab(),
        initializeMiniMap(),
        initTabEvents(),
        updateTabOnScroll(),
        (placeOverlayNode[_0x5c2545(0xa9)] = "placeinfo_wrap\x20position-absolute\x20rounded-3\x20overflow-auto"),
        addEventHandle(placeOverlayNode, _0x5c2545(0x1a2), kakao[_0x5c2545(0x170)][_0x5c2545(0x171)][_0x5c2545(0xe4)]),
        addEventHandle(placeOverlayNode, _0x5c2545(0x177), kakao[_0x5c2545(0x170)][_0x5c2545(0x171)][_0x5c2545(0xe4)]),
        placeOverlay[_0x5c2545(0x12d)](placeOverlayNode);
});
function addEventHandle(_0x3c90e6, _0x55c6f4, _0xdb5cab) {
    const _0x36707d = a47_0x186095;
    _0x3c90e6[_0x36707d(0x128)] ? _0x3c90e6[_0x36707d(0x128)](_0x55c6f4, _0xdb5cab) : _0x3c90e6[_0x36707d(0x86)]("on" + _0x55c6f4, _0xdb5cab);
}
function initializeTab() {
    const _0x2faab0 = a47_0x186095;
    let _0xe2cdb3 = JSON[_0x2faab0(0x14f)](sessionStorage[_0x2faab0(0xe5)](_0x2faab0(0xea)));
    if (_0xe2cdb3) {
        const _0x5d9d0a = _0xe2cdb3[_0x2faab0(0x19a)];
        $(_0x2faab0(0xc5))[_0x2faab0(0x7b)](_0x5d9d0a);
    }
}
function initializeMiniMap() {
    const _0x3b9f5d = a47_0x186095,
        _0x4ef9e5 = new URLSearchParams(window[_0x3b9f5d(0xa5)][_0x3b9f5d(0x154)]);
    let _0x199ade = _0x4ef9e5["get"](_0x3b9f5d(0x11d)),
        _0x4ef1c8 = _0x4ef9e5[_0x3b9f5d(0xcf)](_0x3b9f5d(0x149));
    !areValidCoordinatesInKorea(parseFloat(_0x199ade), parseFloat(_0x4ef1c8)) && ((_0x199ade = _0x3b9f5d(0x12c)), (_0x4ef1c8 = _0x3b9f5d(0x8c)));
    setCookie(_0x3b9f5d(0x11d), _0x199ade, 0x1), setCookie("curLng", _0x4ef1c8, 0x1);
    const _0x5c945a = new kakao["maps"][_0x3b9f5d(0xb4)](_0x199ade, _0x4ef1c8);
    var _0x2ced74 = document[_0x3b9f5d(0x7a)](_0x3b9f5d(0x16f)),
        _0x39ddb4 = { center: _0x5c945a, level: 0x4, draggable: ![], scrollwheel: ![], disableDoubleClick: ![], disableDoubleClickZoom: !![] };
    (miniMap = new kakao[_0x3b9f5d(0x170)]["Map"](_0x2ced74, _0x39ddb4)),
        kakao[_0x3b9f5d(0x170)][_0x3b9f5d(0x171)][_0x3b9f5d(0x187)](miniMap, _0x3b9f5d(0x1b1), function () {
            const _0x5b8500 = _0x3b9f5d;
            miniMap[_0x5b8500(0x15a)]();
        });
}
function initTabEvents() {
    const _0x8e23a7 = a47_0x186095;
    $(_0x8e23a7(0x182))["on"](_0x8e23a7(0xc4), _0x8e23a7(0x9f), function () {
        const _0x17c7a0 = _0x8e23a7;
        $(_0x17c7a0(0x15c))[_0x17c7a0(0x85)](_0x17c7a0(0xa2)), $(this)["addClass"](_0x17c7a0(0xa2));
        const _0x44b823 = $(this)["attr"](_0x17c7a0(0x90)),
            _0x75cc33 = $("." + _0x44b823);
        _0x75cc33[_0x17c7a0(0xe2)]
            ? $(_0x17c7a0(0xee))[_0x17c7a0(0x12b)]({ scrollTop: _0x75cc33[_0x17c7a0(0xc7)]()["top"] - $(".mc-tab-content")[_0x17c7a0(0xc7)]()[_0x17c7a0(0xbd)] + $(_0x17c7a0(0xee))["scrollTop"]() }, 0x190)
            : console[_0x17c7a0(0x15e)]("Element\x20not\x20found\x20for\x20selector:", _0x44b823);
    }),
        $(_0x8e23a7(0x173))["on"]("click", function () {
            const _0x3a8883 = _0x8e23a7,
                _0x28f5b9 = $(_0x3a8883(0x167)),
                _0x453fd2 = _0x28f5b9[_0x3a8883(0x16e)](_0x3a8883(0x7f));
            $(this)[_0x3a8883(0xf9)]()[_0x3a8883(0x94)](_0x3a8883(0x10a))
                ? (_0x453fd2[_0x3a8883(0x185)](0x0, 0x14)[_0x3a8883(0x85)](_0x3a8883(0x9e)), _0x453fd2[_0x3a8883(0xe2)] <= 0x14 && $(this)[_0x3a8883(0x17e)](_0x3a8883(0x183)))
                : (_0x28f5b9[_0x3a8883(0x185)](0x5)["addClass"](_0x3a8883(0x9e)), $(this)[_0x3a8883(0x17e)]("<i\x20class=\x22fa-sharp\x20fa-light\x20fa-circle-plus\x22></i>더보기"));
        }),
        $(_0x8e23a7(0xed))["on"]("click", function () {
            const _0x5847f5 = _0x8e23a7,
                _0x7e6fac = $(".more-price")[_0x5847f5(0x199)](_0x5847f5(0x9e))[_0x5847f5(0x1a5)]("d-none");
            $(this)[_0x5847f5(0x17e)](_0x7e6fac ? _0x5847f5(0x144) : "<i\x20class=\x22fa-sharp\x20fa-light\x20fa-circle-minus\x22></i>숨기기");
        }),
        $("#toggle_unit_btn")["on"]("click", function () {
            const _0x28edb8 = _0x8e23a7,
                _0x52e03a = !$(_0x28edb8(0x8d))[_0x28edb8(0x1a5)](_0x28edb8(0xa2));
            $(_0x28edb8(0x8d))[_0x28edb8(0x199)](_0x28edb8(0xa2), _0x52e03a), $(_0x28edb8(0xeb))["toggleClass"](_0x28edb8(0xa2), !_0x52e03a);
        }),
        $(_0x8e23a7(0x16a))["on"](_0x8e23a7(0xc4), function () {
            const _0xdc51e7 = _0x8e23a7;
            (currentUnit = currentUnit === "m2" ? _0xdc51e7(0x18c) : "m2"), updateRealPriceTable(), updateRealEstimatedPrice();
            if (globalLandCharacter) {
                const _0x1714fc = $(".mnnmSlno-btn")[_0xdc51e7(0x18e)]($(_0xdc51e7(0x137))),
                    _0x25834e = globalLandCharacter[_0x1714fc];
                if (_0x25834e) {
                    const _0x43fed1 = _0x25834e["pnu"];
                    landCharacterTable(_0x25834e), landPriceTable(_0x43fed1);
                }
            }
            if (globalBrTitleInfo) {
                const _0x5378e4 = $(_0xdc51e7(0xd0))["index"]($(_0xdc51e7(0xfa))),
                    _0x596119 = globalBrTitleInfo[_0x5378e4];
                _0x596119 && buildingRegisterTable(_0x596119);
                let _0xa3abbf = 0x0;
                $[_0xdc51e7(0x74)](globalBrTitleInfo, function (_0x2fa716, _0x5ddaec) {
                    const _0x42aefc = _0xdc51e7;
                    if (!_0x5ddaec) return;
                    _0xa3abbf += parseFloat(_0x5ddaec[_0x42aefc(0x102)]);
                }),
                    $(_0xdc51e7(0x10e))[_0xdc51e7(0xf9)](formatArea(_0xa3abbf) + "(" + globalBrTitleInfo["length"] + "동)");
            }
        }),
        $(_0x8e23a7(0x151))["on"](_0x8e23a7(0x16c), function () {}),
        $(_0x8e23a7(0x184))["on"]("click", function () {
            const _0x50a2cc = _0x8e23a7,
                _0x2f841d = $("#analysis_select")[_0x50a2cc(0x7b)](),
                _0x218dc9 = landWFSArrays[_0x50a2cc(0xe2)] - 0x1,
                _0x49f90b = landWFSArrays[_0x218dc9];
            if (_0x2f841d == _0x50a2cc(0xe1)) ecologyMap(_0x49f90b[_0x50a2cc(0x140)], _0x49f90b[_0x50a2cc(0x8a)], _0x49f90b[_0x50a2cc(0x91)]);
            else _0x2f841d == "nationalEnv" && nationalEnvMap(pnu);
        });
}
async function getEcologyMap() {
    function _0x45a06f(_0x3f90bf, _0x30a28f, _0x5e601, _0x5bb9c8) {
        const _0x3fd631 = a47_0x3137;
        return { wtm_x: _0x3f90bf * Math[_0x3fd631(0xd8)](0x2, _0x5e601 - 0x3) * _0x5bb9c8 - 0x7530, wtm_y: _0x30a28f * Math[_0x3fd631(0xd8)](0x2, _0x5e601 - 0x3) * _0x5bb9c8 - 0xea60 };
    }
    const _0x51942b = "",
        _0x305e20 = {};
}
async function BuildingDetail(_0x1aad47) {
    const _0x337b16 = a47_0x186095;
    $(_0x337b16(0x8e))[_0x337b16(0x17b)](), $(_0x337b16(0x134))[_0x337b16(0x116)]("th")[_0x337b16(0xf9)]("");
    const _0x37ef44 = { pnu: _0x1aad47 },
        _0x16153f = await callApiAbort(_0x337b16(0x12f), _0x337b16(0xba), _0x37ef44, _0x337b16(0x10c)),
        _0x2f9000 = $(_0x337b16(0x1ad)),
        _0x2f7cc2 = $(_0x337b16(0x10b));
    // _0x34d3a6 = _0x16153f[_0x337b16(0xca)];
    const _0x34d3a6 = _0x16153f.brTitleInfo && _0x16153f.brTitleInfo.item && _0x16153f.brTitleInfo.item.length > 0;
    _0x34d3a6 ? (_0x2f9000[_0x337b16(0x97)](), _0x2f7cc2[_0x337b16(0x97)]()) : (_0x2f9000[_0x337b16(0x145)](), _0x2f7cc2[_0x337b16(0x145)]());
    let _0x2340e0 = _0x16153f[_0x337b16(0xca)]["item"];
    Array[_0x337b16(0x175)](_0x2340e0)
        ? (_0x2340e0[_0x337b16(0xaa)](function (_0x41fdfa, _0x46e27d) {
              const _0x29bd94 = _0x337b16,
                  _0x1d19df = String(_0x41fdfa[_0x29bd94(0x80)])["trim"]() !== "" ? String(_0x41fdfa["dongNm"]) : _0x41fdfa["mainPurpsCdNm"],
                  _0x1248bd = String(_0x46e27d[_0x29bd94(0x80)])[_0x29bd94(0x107)]() !== "" ? String(_0x46e27d[_0x29bd94(0x80)]) : _0x46e27d[_0x29bd94(0xb2)];
              return _0x1d19df[_0x29bd94(0xe7)](_0x1248bd);
          }),
          (globalBrTitleInfo = _0x2340e0))
        : (globalBrTitleInfo = [_0x2340e0]),
        createBuildingButtons(globalBrTitleInfo);
}
async function landDetail(_0x520b93) {
    const _0xe7b36e = a47_0x186095;
    isMultiSelectMode && $("html")[_0xe7b36e(0xf1)](_0xe7b36e(0xec), _0xe7b36e(0x105));
    const _0x1ae33e = { pnu: _0x520b93 },
        _0x4e8859 = await callApiAbort("/front/back/realPrice/land_characteristics.php", _0xe7b36e(0xba), _0x1ae33e, _0xe7b36e(0x15b));
    if (!_0x4e8859 || _0x4e8859[_0xe7b36e(0xe2)] == 0x0) {
        console[_0xe7b36e(0x18d)](_0xe7b36e(0xb5));
        return;
    }
    Array[_0xe7b36e(0x175)](_0x4e8859["landCharacteristicss"]) ? (globalLandCharacter = _0x4e8859[_0xe7b36e(0x194)]) : (globalLandCharacter = [_0x4e8859[_0xe7b36e(0x194)]]),
        (globalLandPrices = _0x4e8859[_0xe7b36e(0x15d)]),
        createMnnmSlnoButtons(_0x4e8859[_0xe7b36e(0x194)]),
        isMultiSelectMode && (landAnalysis(), $(_0xe7b36e(0x17e))["attr"](_0xe7b36e(0xec), _0xe7b36e(0xfb)));
}
function createBuildingButtons(_0x5eea3f) {
    const _0x12c96c = a47_0x186095;
    if (!_0x5eea3f || _0x5eea3f["length"] === 0x0 || _0x5eea3f[_0x12c96c(0x1a9)]((_0x19da18) => _0x19da18 === null || _0x19da18 === undefined)) return;
    _0x5eea3f = _0x5eea3f[_0x12c96c(0x16e)]((_0x1a1f86) => _0x1a1f86 !== null && _0x1a1f86 !== undefined);
    if (_0x5eea3f[_0x12c96c(0xe2)] === 0x0) return;
    const _0x593140 = $(_0x12c96c(0x8e));
    _0x593140["empty"]();
    let _0x1027c1 = 0x0;
    $[_0x12c96c(0x74)](_0x5eea3f, function (_0x206eb8, _0x539412) {
        const _0x13128f = _0x12c96c;
        _0x1027c1 += parseFloat(_0x539412["totArea"]);
        const _0x1a6bd9 = $("<button>")
            ["addClass"](_0x13128f(0x79))
            [_0x13128f(0x17e)]("" + (_0x539412["dongNm"] ? _0x539412[_0x13128f(0x80)][_0x13128f(0x124)]()[_0x13128f(0x107)]() : _0x539412["mainPurpsCdNm"]))
            ["on"]("click", function () {
                const _0x2d8620 = _0x13128f;
                $(_0x2d8620(0xd0))["removeClass"](_0x2d8620(0xa2)), $(this)[_0x2d8620(0x9c)](_0x2d8620(0xa2)), buildingRegisterTable(_0x539412);
            });
        _0x206eb8 === 0x0 && (_0x1a6bd9[_0x13128f(0x9c)](_0x13128f(0xa2)), buildingRegisterTable(_0x539412)), _0x593140[_0x13128f(0x164)](_0x1a6bd9);
    }),
        $("#top_build_area")[_0x12c96c(0xf9)](formatArea(_0x1027c1["toFixed"](0x2)) + "(" + _0x5eea3f["length"] + "동)");
}
function createMnnmSlnoButtons(_0xb313e0) {
    const _0x2f4c67 = a47_0x186095,
        _0x54f1ab = $(_0x2f4c67(0xc6));
    _0x54f1ab["empty"](),
        $[_0x2f4c67(0x74)](globalLandCharacter, function (_0x43df05, _0x2a9b4e) {
            const _0x9abb46 = _0x2f4c67,
                _0x10c0f2 = _0x2a9b4e[_0x9abb46(0x140)],
                _0x35f82e = $("<button>")
                    ["addClass"](_0x9abb46(0x17d))
                    [_0x9abb46(0xf9)]("" + (_0x2a9b4e[_0x9abb46(0x153)] || String(_0x2a9b4e[_0x9abb46(0x13a)]) + "-" + String(_0x2a9b4e[_0x9abb46(0x18a)])))
                    ["on"]("click", function () {
                        const _0x31cf36 = _0x9abb46;
                        $(_0x31cf36(0x1a8))[_0x31cf36(0x85)](_0x31cf36(0xa2)), $(this)[_0x31cf36(0x9c)]("active"), landCharacterTable(_0x2a9b4e), landPriceTable(_0x10c0f2);
                    });
            _0x43df05 === 0x0 && (_0x35f82e[_0x9abb46(0x9c)](_0x9abb46(0xa2)), landCharacterTable(_0x2a9b4e), landPriceTable(_0x10c0f2)), _0x54f1ab["append"](_0x35f82e);
        });
}
function buildingRegisterTable(_0x1bec8a) {
    const _0x1db8c5 = a47_0x186095,
        {
            platPlc: _0x80f9e5,
            newPlatPlc: _0x1e2a58,
            bldNm: _0x95c00a,
            etcPurps: _0x30f981,
            mainPurpsCdNm: _0x4843fc,
            etcStrct: _0x358ca9,
            roofCdNm: _0x394e93,
            etcRoof: _0x2d8852,
            heit: _0x150470,
            grndFlrCnt: _0x31b9d3,
            ugrndFlrCnt: _0x424b1a,
            platArea: _0x35b22b,
            archArea: _0x321b46,
            totArea: _0x5501f9,
            vlRatEstmTotArea: _0x334689,
            vlRat: _0x2677f4,
            bcRat: _0x21920b,
            hhldCnt: _0x164a16,
            fmlyCnt: _0x5700b7,
            bylotCnt: _0x1d4ff2,
            rideUseElvtCnt: _0x4962d3,
            emgenUseElvtCnt: _0x4aafd3,
            useAprDay: _0x4974ac,
            pmsDay: _0x433a4e,
            stcnsDay: _0x26db63,
            sigunguCd: _0x691480,
            bjdongCd: _0x32d2fe,
            platGbCd: _0xd0f6e6,
            bun: _0xd7c446,
            ji: _0x392338,
        } = _0x1bec8a;
    let _0x4573fd = "",
        _0x15fb91 = "",
        _0x4952d6 = "";
    (_0x4573fd += createTableRow(_0x1db8c5(0x163), _0x95c00a || "-")),
        (_0x4573fd += createTableRow(_0x1db8c5(0x138), _0x4843fc)),
        (_0x4573fd += createTableRow(_0x1db8c5(0xe0), _0x30f981)),
        (_0x4573fd += createTableRow("구조코드명", _0x358ca9)),
        (_0x4573fd += createTableRow(_0x1db8c5(0x14a), _0x394e93)),
        (_0x4573fd += createTableRow("기타지붕", _0x2d8852)),
        (_0x4573fd += createTableRow("높이", comma(_0x150470) + "m")),
        (_0x4573fd += createTableRow("층수", "지상" + _0x31b9d3 + "\x20층\x20/\x20지하" + _0x424b1a + "\x20층")),
        (_0x4573fd += createTableRow(_0x1db8c5(0xcb), formatArea(_0x321b46))),
        (_0x4573fd += createTableRow(_0x1db8c5(0xcd), formatArea(_0x5501f9))),
        (_0x4573fd += createTableRow(_0x1db8c5(0xd2), formatArea(_0x334689))),
        (_0x4573fd += createTableRow(_0x1db8c5(0x101), comma(_0x2677f4) + "%")),
        (_0x4573fd += createTableRow(_0x1db8c5(0x186), comma(_0x21920b) + "%")),
        (_0x4573fd += createTableRow(_0x1db8c5(0x15f), comma(_0x164a16) + "세대")),
        (_0x4573fd += createTableRow(_0x1db8c5(0x156), comma(_0x5700b7) + "가구")),
        (_0x4573fd += createTableRow(_0x1db8c5(0x161), _0x1d4ff2));
    const _0x4bd17e = _0x4962d3 != 0x0 || _0x4aafd3 != 0x0;
    $(_0x1db8c5(0x1a1))[_0x1db8c5(0x14c)](_0x4bd17e), (_0x15fb91 += createTableRow(_0x1db8c5(0x75), _0x4962d3)), (_0x15fb91 += createTableRow(_0x1db8c5(0x103), _0x4aafd3));
    const _0x21c379 = _0x433a4e || _0x26db63 || _0x4974ac;
    _0x21c379 ? $(_0x1db8c5(0xc1))[_0x1db8c5(0xf1)](_0x1db8c5(0x123), ![]) : $(_0x1db8c5(0xc1))[_0x1db8c5(0xf1)](_0x1db8c5(0x123), !![]);
    (_0x4952d6 += createTableRow("허가일", formatDate(_0x433a4e) || "-")),
        (_0x4952d6 += createTableRow(_0x1db8c5(0x176), formatDate(_0x26db63) || "-")),
        (_0x4952d6 += createTableRow(_0x1db8c5(0x112), formatDate(_0x4974ac) || "-")),
        $(_0x1db8c5(0xf5))[_0x1db8c5(0x17e)](_0x4573fd),
        $("#lift_info\x20tbody")[_0x1db8c5(0x17e)](_0x15fb91),
        $(_0x1db8c5(0xe3))[_0x1db8c5(0x17e)](_0x4952d6);
    const _0x201255 = extractFirstWord(formatDate(_0x4974ac)),
        _0x373b85 = _0x201255 ? calculateYearDifference(_0x201255) : 0x0,
        _0x431174 = _0x373b85 ? _0x201255 + "년(" + _0x373b85 + "년)" : "";
    $(_0x1db8c5(0x1ac))["text"](_0x4843fc), $(_0x1db8c5(0xa6))[_0x1db8c5(0xf9)](_0x431174), $(_0x1db8c5(0x174))[_0x1db8c5(0xf9)]("B" + _0x424b1a + "/" + _0x31b9d3 + "F");
}
async function landCharacterTable(_0x201660) {
    const _0x4d9aa2 = a47_0x186095;
    if (_0x201660) {
        let _0xba5841 = "";
        (_0xba5841 += createTableRow(_0x4d9aa2(0xd4), _0x201660[_0x4d9aa2(0xb8)] || _0x201660["lndcgr_code_nm"] || "-")),
            (_0xba5841 += createTableRow(_0x4d9aa2(0x13e), formatArea(_0x201660[_0x4d9aa2(0x169)] || _0x201660[_0x4d9aa2(0x100)]) || "-")),
            (_0xba5841 += createTableRow(_0x4d9aa2(0x120), _0x201660[_0x4d9aa2(0x165)] || _0x201660[_0x4d9aa2(0x122)] || "-")),
            (_0xba5841 += createTableRow("용도지역명", _0x201660["prposArea1Nm"] || _0x201660["prpos_area_1_nm"] || "-")),
            (_0xba5841 += createTableRow("지형높이", _0x201660[_0x4d9aa2(0x84)] || _0x201660[_0x4d9aa2(0xa4)] || "-")),
            (_0xba5841 += createTableRow(_0x4d9aa2(0x9a), _0x201660[_0x4d9aa2(0xf0)] || _0x201660["tpgrph_frm_code_nm"] || "-")),
            (_0xba5841 += createTableRow(_0x4d9aa2(0xc2), _0x201660[_0x4d9aa2(0x10d)] || _0x201660[_0x4d9aa2(0x1ab)] || "-")),
            $(_0x4d9aa2(0x16b))[_0x4d9aa2(0x17e)](_0xba5841),
            $("#top_land_area")[_0x4d9aa2(0xf9)](formatArea(_0x201660[_0x4d9aa2(0x169)] || _0x201660[_0x4d9aa2(0x100)]) || "-"),
            $(_0x4d9aa2(0xc0))[_0x4d9aa2(0xf9)](_0x201660["prposArea1Nm"] || _0x201660[_0x4d9aa2(0x179)] || "-"),
            $(_0x4d9aa2(0x147))[_0x4d9aa2(0xf9)](_0x201660[_0x4d9aa2(0xb8)] || _0x201660[_0x4d9aa2(0xb1)] || "-");
    }
}
function landPriceTable(_0x2d75bc) {
    const _0x215910 = a47_0x186095;
    indvdLandPrices = globalLandPrices;
    if (indvdLandPrices) {
        const _0x1ef636 = indvdLandPrices[_0x215910(0x16e)]((_0x26bae1) => _0x26bae1[_0x215910(0x140)] === _0x2d75bc),
            _0x46c0b2 = _0x1ef636[_0x215910(0x185)]()
                [_0x215910(0xaa)]((_0x23c5f6, _0x3bc112) => {
                    const _0x139984 = _0x215910;
                    if (_0x23c5f6["stdrYear"] === _0x3bc112[_0x139984(0x11a)]) return new Date(_0x3bc112[_0x139984(0x148)]) - new Date(_0x23c5f6[_0x139984(0x148)]);
                    return _0x3bc112[_0x139984(0x11a)] - _0x23c5f6[_0x139984(0x11a)];
                })
                [_0x215910(0x16e)]((_0xe1f5e0, _0x7c9de5, _0x242579) => _0x7c9de5 === _0x242579[_0x215910(0x1a6)]((_0x2fe1a0) => _0x2fe1a0[_0x215910(0x11a)] === _0xe1f5e0["stdrYear"]));
        let _0x4d36c9 = _0x46c0b2["map"](function (_0x30fe05, _0x55f560) {
            const _0x46c442 = _0x215910;
            if (_0x55f560 === 0x0) {
                let _0x3c0a36 = 0x0;
                (_0x3c0a36 = parseInt(_0x30fe05["pblntfPclnd"]) * parseInt(globalLandCharacter[0x0][_0x46c442(0x169)])), (_0x3c0a36 = Math[_0x46c442(0xb7)](_0x3c0a36 / 0x2710)), (_0x3c0a36 = formatPrice(_0x3c0a36, _0x46c442(0x193))), $(_0x46c442(0x17c))["text"](_0x46c442(0x131) + _0x3c0a36);
            }
            const _0x326cfd = formatAreaPrice(parseInt(_0x30fe05[_0x46c442(0xbc)]));
            return (
                _0x46c442(0x14e) +
                (_0x55f560 >= 0x5 ? "more-price\x20d-none" : "") +
                _0x46c442(0xc9) +
                _0x30fe05[_0x46c442(0x11a)] +
                _0x46c442(0xd6) +
                _0x30fe05["pblntfDe"] +
                _0x46c442(0xbb) +
                _0x326cfd +
                "</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>"
            );
        })[_0x215910(0x92)]("");
        $(_0x215910(0x139))[_0x215910(0x17e)](_0x4d36c9);
    }
}
function createTableRow(_0x160d4a, _0x5eed66) {
    const _0x4cdc2b = a47_0x186095;
    return _0x4cdc2b(0x195) + _0x160d4a + _0x4cdc2b(0x19e) + _0x5eed66 + "</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</tr>";
}
function formatArea(_0x4f1e1a) {
    const _0x15a0da = a47_0x186095;
    return currentUnit === "m2" ? ($(_0x15a0da(0x158))["text"]("㎡"), comma(_0x4f1e1a) + "㎡") : ($(_0x15a0da(0x158))["text"]("평"), comma(convertSquareMetersToPyeong(_0x4f1e1a)) + "평");
}
function formatAreaPrice(_0x1ec31d) {
    const _0x27cfdf = a47_0x186095;
    return currentUnit === "m2" ? comma(_0x1ec31d) + "원/㎡" : comma(convertSquareMeterPriceToPyeong(_0x1ec31d)) + _0x27cfdf(0x160);
}
function convertSquareMetersToPyeong(_0x564542) {
    const _0x212afb = 3.3058;
    return (_0x564542 / _0x212afb)["toFixed"](0x2);
}
function convertSquareMeterPriceToPyeong(_0x5a5f9c) {
    const _0x534469 = a47_0x186095,
        _0x679a72 = 3.3058;
    return (_0x5a5f9c * _0x679a72)[_0x534469(0xa0)](0x2);
}
function extractFirstWord(_0x6a0d80) {
    const _0x18a09d = a47_0x186095,
        _0x14ed50 = /[\/,-]/,
        _0x54c883 = _0x6a0d80[_0x18a09d(0x13d)](_0x14ed50);
    return _0x54c883[0x0];
}
function calculateYearDifference(_0x4e21c9) {
    const _0x4ad8ff = a47_0x186095,
        _0x1f561f = new Date()[_0x4ad8ff(0x19d)]();
    return _0x1f561f - _0x4e21c9;
}
function formatDate(_0x25c1d7) {
    const _0xe1776e = a47_0x186095;
    _0x25c1d7 = _0x25c1d7[_0xe1776e(0x124)]();
    if (_0x25c1d7[_0xe1776e(0xe2)] !== 0x8) return "";
    const _0x2745c6 = _0x25c1d7[_0xe1776e(0x1a0)](0x0, 0x4),
        _0x500780 = _0x25c1d7[_0xe1776e(0x1a0)](0x4, 0x6),
        _0x35d445 = _0x25c1d7[_0xe1776e(0x1a0)](0x6, 0x8);
    return _0x2745c6 + "-" + _0x500780 + "-" + _0x35d445;
}
async function searchArroundPlaces(_0x5364a6) {
    const _0x3f92e7 = a47_0x186095;
    if (isMultiSelectMode) return;
    removeMarker(placeMarkers), placeOverlay["setMap"](null);
    if (placeRangePolygon) placeRangePolygon[_0x3f92e7(0xc3)](null);
    searchCategory(_0x5364a6, _0x3f92e7(0x115)),
        searchCategory(_0x5364a6, _0x3f92e7(0x8b)),
        searchCategory(_0x5364a6, _0x3f92e7(0xff)),
        searchCategory(_0x5364a6, _0x3f92e7(0x1a7)),
        searchCategory(_0x5364a6, "BK9"),
        searchCategory(_0x5364a6, _0x3f92e7(0x78)),
        searchCategory(_0x5364a6, _0x3f92e7(0x7c)),
        searchCategory(_0x5364a6, _0x3f92e7(0x111)),
        searchCategory(_0x5364a6, _0x3f92e7(0x155)),
        searchCategory(_0x5364a6, _0x3f92e7(0x130)),
        searchCategory(_0x5364a6, _0x3f92e7(0x166)),
        searchCategory(_0x5364a6, _0x3f92e7(0x143)),
        searchCategory(_0x5364a6, "CT1"),
        searchCategory(_0x5364a6, _0x3f92e7(0xd7)),
        searchCategory(_0x5364a6, _0x3f92e7(0xf6)),
        searchCategory(_0x5364a6, _0x3f92e7(0xb9)),
        searchCategory(_0x5364a6, _0x3f92e7(0x11b)),
        searchBusStop(_0x5364a6);
}
function a47_0xbb90() {
    const _0x1b7f18 = [
        "BUS",
        "<i\x20class=\x22las\x20la-lg\x20la-subway\x22></i>",
        "nodenm",
        "addEventListener",
        "/front/assets/image/icn_bank.svg",
        "<i\x20class=\x22las\x20la-lg\x20las\x20la-shapes\x22></i>",
        "animate",
        "37.4917882876857",
        "setContent",
        "forEach",
        "/front/back/realPrice/buiding_register_title_info.php",
        "CS2",
        "공시지가\x20",
        "1747605YSbMzA",
        "map",
        ".mc-building\x20table",
        "358571ae546aaa68be0d290878b351c1",
        "<i\x20class=\x22las\x20la-lg\x20la-store-alt\x22></i>",
        ".mnnmSlno-btn.active",
        "주용도",
        "#land_price_table\x20tbody",
        "mnnm",
        ".tab-btn[data-target=\x22mc-real\x22]",
        "atan2",
        "split",
        "토지면적",
        "2902448esenoQ",
        "pnu",
        "createElement",
        "MapTypeId",
        "CE7",
        "<i\x20class=\x22fa-sharp\x20fa-light\x20fa-circle-plus\x22></i>더보기",
        "hide",
        "6390UJEBYx",
        "#top_land_pups",
        "lastUpdtDt",
        "curLng",
        "지붕코드명",
        "/front/assets/image/icn_store.svg",
        "toggle",
        "\x20.place-contents",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<tr\x20class=\x22",
        "parse",
        "<i\x20class=\x22las\x20la-lg\x20la-coffee\x22></i>",
        "#analysis_select",
        "<p\x20title=\x22",
        "mnnmSlno",
        "search",
        "MT1",
        "가구수",
        "nodeid",
        "#area_unit",
        "/front/assets/image/icn_hotel.svg",
        "relayout",
        "landDetail",
        ".mc-tab-menu\x20.tab-btn",
        "indvdLandPrices",
        "error",
        "세대수",
        "원/평",
        "연관토지 개수",
        "lat",
        "건물명",
        "append",
        "ladUseSittnNm",
        "FD6",
        ".more-realPrice",
        "1152behUPM",
        "lndpclAr",
        "#toggle_unit_btn",
        "#land_info\x20tbody",
        "change",
        "12vcskLX",
        "filter",
        "mini_map",
        "maps",
        "event",
        "road_address_name",
        "#more_realPrice_btn",
        "#top_floor",
        "isArray",
        "착공일",
        "touchstart",
        "<i\x20class=\x22las\x20la-lg\x20la-hospital\x22></i>",
        "prpos_area_1_nm",
        "removeOverlayMapTypeId",
        "empty",
        "#top_official_land_price",
        "mnnmSlno-btn\x20font14\x20p-2",
        "html",
        "dashed",
        "GET",
        "items",
        ".mc-tab-menu",
        "<i\x20class=\x22fa-sharp\x20fa-light\x20fa-circle-minus\x22></i>숨기기",
        "#analysis_btn",
        "slice",
        "건폐율",
        "addListener",
        "/front/assets/image/icn_cafe.svg",
        "/front/assets/image/icn_academy.svg",
        "slno",
        "</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22p-2\x20bg-white\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>정류소ID\x20:\x20",
        "pyeong",
        "log",
        "index",
        "ready",
        "mc-real",
        "<i\x20class=\x22las\x20la-lg\x20la-utensils\x22></i>",
        "hybrid",
        "only-uk",
        "landCharacteristicss",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td>",
        "lng",
        "API\x20요청\x20중\x20오류\x20발생:",
        "keys",
        "toggleClass",
        "address_name",
        "phone",
        ".place-BUS",
        "getFullYear",
        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20class=\x22text-end\x22>",
        "<i\x20class=\x22las\x20la-lg\x20la-donate\x22></i>",
        "substring",
        ".mcb-lift",
        "mousedown",
        "\x22>(지번\x20:\x20",
        "<i\x20class=\x22las\x20la-lg\x20la-chalkboard-teacher\x22></i>",
        "hasClass",
        "findIndex",
        "AC5",
        ".mnnmSlno-btn",
        "every",
        "</strong>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22place-distance\x20font13\x22>",
        "road_side_code_nm",
        "#top_putps",
        ".tab-btn[data-target=\x22mc-building\x22]",
        "#CFE7FF",
        "scrollTop",
        "ROADVIEW",
        "idle",
        "\x22\x20target=\x22_blank\x22\x20title=\x22",
        "each",
        "승용승강기수",
        "Status",
        "4rEgsfQ",
        "PO3",
        "buidRegi-btn\x20font14\x20p-2",
        "getElementById",
        "val",
        "PM9",
        "<p\x20class=\x22\x22\x20title=\x22",
        "/front/back/realPrice/bus_stop.php",
        ".d-none",
        "dongNm",
        "sqrt",
        "유효하지\x20않은\x20지도\x20타입입니다.",
        "gpslati",
        "tpgrphHgCodeNm",
        "removeClass",
        "attachEvent",
        "use_district",
        "CustomOverlay",
        "cos",
        "bbox",
        "SC4",
        "127.487578470072",
        "#unit_pyeong",
        "#buidRegi_btn_group",
        "m</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>",
        "data-target",
        "landGeoJson",
        "join",
        ".tab-btn[data-target=\x22mc-ground\x22]",
        "includes",
        "round",
        "skyview",
        "show",
        "#75B8FA",
        "</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22after\x22\x20style=\x22content:\x27\x27;position:relative;margin-left:-12px;left:50%;width:22px;height:12px;background:url(\x27https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/vertex_white.png\x27)\x22></div>",
        "지형형상",
        "/front/assets/image/icn_restaurant.svg",
        "addClass",
        "5621858rwYHmd",
        "d-none",
        ".tab-btn",
        "toFixed",
        "\x20.count",
        "active",
        "/front/assets/image/icn_real_estate.svg",
        "tpgrph_hg_code_nm",
        "location",
        "#top_useAprDay",
        "<i\x20class=\x22las\x20la-lg\x20la-store\x22></i>",
        ")</p>",
        "className",
        "sort",
        "<i\x20class=\x22las\x20la-lg\x20la-pills\x22></i>",
        "<i\x20class=\x22las\x20la-lg\x20la-balance-scale\x22></i>",
        "place_name",
        "services",
        ".place-BUS\x20.count",
        "/front/assets/image/icn_culture_facility.svg",
        "lndcgr_code_nm",
        "mainPurpsCdNm",
        "innerHTML",
        "LatLng",
        "데이터가\x20없습니다.",
        "distance",
        "floor",
        "lndcgrCodeNm",
        "PK6",
        "POST",
        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th>",
        "pblntfPclnd",
        "top",
        "Authorization",
        "/front/assets/image/icn_landmark.svg",
        "#top_prposArea1Nm",
        ".mcb-date",
        "도로접면",
        "setMap",
        "click",
        "#search_input",
        "#mnnmSlno_btn_group",
        "offset",
        "22918oQJSjq",
        "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td>",
        "brTitleInfo",
        "건축면적",
        "ZERO_RESULT",
        "연면적",
        "322676flQcQr",
        "get",
        ".buidRegi-btn",
        "sin",
        "용적률산정연면적",
        "/front/assets/image/icn_hospital.svg",
        "지목명",
        "ajax",
        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td>",
        "AT4",
        "pow",
        "outerHeight",
        "roadview",
        "TRAFFIC",
        "gpslong",
        "/front/assets/image/icn_parking.svg",
        "meta",
        "/front/assets/image/icn_kindergarten.svg",
        "기타용도",
        "ecology",
        "length",
        "#date_info\x20tbody",
        "preventMap",
        "getItem",
        "9330XQpISI",
        "localeCompare",
        "origin",
        "traffic",
        "lastSearchedPlace",
        "#unit_m2",
        "data-preloader",
        "#more_price_btn",
        ".mc-tab-content",
        "MarkerImage",
        "tpgrphFrmCodeNm",
        "attr",
        "setPosition",
        ".tab-btn[data-target=\x22mc-surrounding\x22]",
        "setMapTypeId",
        "#building_info\x20tbody",
        "AD5",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p\x20class=\x22tel\x20pt-1\x20font12\x20color-green1\x22>",
        "USE_DISTRICT",
        "text",
        ".buidRegi-btn.active",
        "disable",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22placeinfo\x20position-relative\x20shadow\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22d-flex\x20align-items-center\x20justify-content-between\x20bg-main\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<a\x20class=\x22title\x20p-2\x20font15\x20text-bold\x20text-white\x22\x20href=\x22",
        "KakaoAK\x20",
        "/front/assets/image/icn_tourist_spot.svg",
        "PS3",
        "lndpcl_ar",
        "용적률",
        "totArea",
        "비상용승강기수",
        ".place-BUS\x20.place-contents",
        "enable",
        "TERRAIN",
        "trim",
        "https://dapi.kakao.com/v2/local/search/category.json",
        "<i\x20class=\x22las\x20la-lg\x20la-hotel\x22></i>",
        "더보기",
        ".mc-tab-content\x20.mc-building",
        "BuildingDetail",
        "roadSideCodeNm",
        "#top_build_area",
        "searchBusStop",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22my-1\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong\x20class=\x22place-name\x20font15\x20mx-2\x22>",
        "HP8",
        "사용승인일",
        "/front/assets/image/icn_school.svg",
        "totalCount",
        "SW8",
        "find",
        "place_url",
        "288015eSJEuv",
        "toLowerCase",
        "stdrYear",
        "OL7",
        ".place-",
        "curLat",
        "category_group_code",
        "/front/assets/image/icn_pharmacy.svg",
        "토지이용상황",
        "addOverlayMapTypeId",
        "lad_use_sittn_nm",
        "hidden",
        "toString",
    ];
    a47_0xbb90 = function () {
        return _0x1b7f18;
    };
    return a47_0xbb90();
}
async function arroundPlacesSearchCB(_0x2dbffa, _0x263918, _0x4295ab) {
    const _0x40a469 = a47_0x186095;
    if (_0x263918 === kakao["maps"][_0x40a469(0xae)][_0x40a469(0x76)]["OK"]) {
    } else {
        if (_0x263918 === kakao[_0x40a469(0x170)][_0x40a469(0xae)][_0x40a469(0x76)][_0x40a469(0xcc)]) {
        } else {
            if (_0x263918 === kakao["maps"][_0x40a469(0xae)][_0x40a469(0x76)]["ERROR"]) {
            }
        }
    }
}
function searchArroundPlacesTable(_0x155d36, _0x2d22fd) {
    const _0xc5206 = a47_0x186095,
        _0x2e0ea3 = _0x155d36["documents"],
        _0x2cd1ec = _0x155d36[_0xc5206(0xde)];
    if (!_0x2e0ea3[0x0]) return;
    const _0x148e80 = {
        MT1: _0xc5206(0x136),
        CS2: _0xc5206(0xa7),
        PS3: _0xc5206(0x12a),
        SC4: "<i\x20class=\x22las\x20la-lg\x20la-school\x22></i>",
        AC5: _0xc5206(0x1a4),
        PK6: "<i\x20class=\x22las\x20la-lg\x20la-parking\x22></i>",
        OL7: "<i\x20class=\x22las\x20la-lg\x20la-gas-pump\x22></i>",
        SW8: _0xc5206(0x126),
        BK9: _0xc5206(0x19f),
        CT1: "<i\x20class=\x22las\x20la-lg\x20la-theater-masks\x22></i>",
        AG2: _0xc5206(0xac),
        PO3: "<i\x20class=\x22las\x20la-lg\x20la-landmark\x22></i>",
        AT4: "<i\x20class=\x22las\x20la-lg\x20la-camera-retro\x22></i>",
        AD5: _0xc5206(0x109),
        FD6: _0xc5206(0x191),
        CE7: _0xc5206(0x150),
        HP8: _0xc5206(0x178),
        PM9: _0xc5206(0xab),
    };
    let _0x15a5e7 = "",
        _0x2a7452 = "",
        _0x544b61 = "";
    $[_0xc5206(0x74)](_0x2e0ea3, function (_0x59b0d3, _0x3c01ed) {
        const _0x46bcc4 = _0xc5206;
        _0x3c01ed[_0x46bcc4(0x11e)] ? (_0x2a7452 = _0x3c01ed[_0x46bcc4(0x11e)]) : (_0x2a7452 = "default");
        if (_0x59b0d3 < 0x5) {
            const _0xbf923a = _0x46bcc4(0x110) + _0x3c01ed[_0x46bcc4(0xad)] + _0x46bcc4(0x1aa) + _0x3c01ed[_0x46bcc4(0xb6)] + "m</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>";
            _0x544b61 += _0xbf923a;
        }
    });
    const _0x349344 = _0x2e0ea3[0x0][_0xc5206(0x11e)];
    $(_0xc5206(0x11c) + _0x349344 + "\x20.place-contents")[_0xc5206(0x17e)](_0x544b61),
        $(_0xc5206(0x11c) + _0x349344 + _0xc5206(0xa1))[_0xc5206(0xf9)](_0x2cd1ec["total_count"]),
        $(_0xc5206(0x11c) + _0x349344)["on"](_0xc5206(0xc4), function () {
            displayArroundPlaces(_0x2e0ea3, _0x2d22fd, 0x3e8);
        });
}
function displayArroundPlaces(_0x396788, _0x458ee6, _0x33e0b3) {
    const _0x549eb0 = a47_0x186095;
    removeMarker(placeMarkers), placeOverlay[_0x549eb0(0xc3)](null);
    if (placeRangePolygon) placeRangePolygon["setMap"](null);
    var _0x14830a = new kakao[_0x549eb0(0x170)]["Circle"]({
        center: new kakao[_0x549eb0(0x170)][_0x549eb0(0xb4)](_0x458ee6[_0x549eb0(0x162)], _0x458ee6[_0x549eb0(0x196)]),
        radius: _0x33e0b3,
        strokeWeight: 0x5,
        strokeColor: _0x549eb0(0x98),
        strokeOpacity: 0x1,
        strokeStyle: _0x549eb0(0x17f),
        fillColor: _0x549eb0(0x1ae),
        fillOpacity: 0.4,
    });
    (placeRangePolygon = _0x14830a), placeRangePolygon["setMap"](map);
    const _0x35857d = {
        MT1: "/front/assets/image/icn_shop.svg",
        CS2: _0x549eb0(0x14b),
        PS3: _0x549eb0(0xdf),
        SC4: _0x549eb0(0x113),
        AC5: _0x549eb0(0x189),
        PK6: _0x549eb0(0xdd),
        OL7: "/front/assets/image/icn_gas_station.svg",
        SW8: "/front/assets/image/icn_subway.svg",
        BK9: _0x549eb0(0x129),
        CT1: _0x549eb0(0xb0),
        AG2: _0x549eb0(0xa3),
        PO3: _0x549eb0(0xbf),
        AT4: _0x549eb0(0xfe),
        AD5: _0x549eb0(0x159),
        FD6: _0x549eb0(0x9b),
        CE7: _0x549eb0(0x188),
        HP8: _0x549eb0(0xd3),
        PM9: _0x549eb0(0x11f),
        BUS: "/front/assets/image/icn_bus.svg",
    };
    let _0x32e2e9 = "";
    _0x32e2e9 = _0x35857d[_0x396788[0x0][_0x549eb0(0x11e)]] || "";
    for (var _0x293aea = 0x0; _0x293aea < _0x396788[_0x549eb0(0xe2)]; _0x293aea++) {
        var _0x486308 = addPlaceMarker(new kakao[_0x549eb0(0x170)][_0x549eb0(0xb4)](_0x396788[_0x293aea]["y"], _0x396788[_0x293aea]["x"]), _0x32e2e9);
        (function (_0x1c863b, _0x561a54) {
            const _0x31c26f = _0x549eb0;
            kakao[_0x31c26f(0x170)]["event"][_0x31c26f(0x187)](_0x1c863b, _0x31c26f(0xc4), function () {
                displayPlaceInfo(_0x561a54);
            });
        })(_0x486308, _0x396788[_0x293aea]);
    }
}
function addPlaceMarker(_0x195d88, _0x1827d8) {
    const _0xabca79 = a47_0x186095;
    var _0x1c878a = window[_0xabca79(0xa5)][_0xabca79(0xe8)],
        _0x4b5e79 = _0x1c878a + _0x1827d8,
        _0x153b09 = new kakao[_0xabca79(0x170)]["Size"](0x1c, 0x1c),
        _0x19457a = { offset: new kakao[_0xabca79(0x170)]["Point"](0xf, 0x1c) },
        _0x3bcb4e = new kakao["maps"][_0xabca79(0xef)](_0x4b5e79, _0x153b09, _0x19457a),
        _0x5733b4 = new kakao[_0xabca79(0x170)]["Marker"]({ position: _0x195d88, image: _0x3bcb4e });
    return _0x5733b4[_0xabca79(0xc3)](map), placeMarkers["push"](_0x5733b4), _0x5733b4;
}
async function searchCategory(_0x400a12, _0x5aab81) {
    const _0x45874b = a47_0x186095;
    $[_0x45874b(0xd5)]({
        url: _0x45874b(0x108),
        type: _0x45874b(0x180),
        data: { category_group_code: _0x5aab81, x: _0x400a12[_0x45874b(0x196)], y: _0x400a12[_0x45874b(0x162)], radius: 0x3e8, size: 0xf, page: 0x1, sort: "distance" },
        beforeSend: function (_0x5dc971) {
            const _0x57851b = _0x45874b;
            _0x5dc971["setRequestHeader"](_0x57851b(0xbe), _0x57851b(0xfd) + REST_API_KEY), $(_0x57851b(0x11c) + _0x5aab81 + _0x57851b(0xa1))[_0x57851b(0xf9)](0x0), $(".place-" + _0x5aab81 + _0x57851b(0x14d))[_0x57851b(0x17b)]();
        },
        success: function (_0x53ebbb) {
            searchArroundPlacesTable(_0x53ebbb, _0x400a12);
        },
        error: function (_0x4375ef, _0x574cf8, _0x369e87) {
            const _0x164639 = _0x45874b;
            console[_0x164639(0x15e)](_0x164639(0x197), _0x574cf8, _0x369e87);
        },
    });
}
async function searchBusStop(_0x39e933) {
    const _0x3515e3 = a47_0x186095;
    $(_0x3515e3(0xaf))[_0x3515e3(0xf9)](0x0), $(_0x3515e3(0x104))[_0x3515e3(0x17b)]();
    const _0x2c9c5c = _0x3515e3(0x7e),
        _0x38dc35 = { lng: _0x39e933["lng"], lat: _0x39e933["lat"] },
        _0x2760c5 = await callApiAbort(_0x2c9c5c, _0x3515e3(0xba), _0x38dc35, _0x3515e3(0x10f));
    if (!_0x2760c5 || !_0x2760c5[_0x3515e3(0x181)]) return;
    let _0xe94c4d = _0x2760c5[_0x3515e3(0x181)]["item"];
    const _0x4e9a68 = _0x2760c5[_0x3515e3(0x114)];
    let _0x3f76f6 = "";
    $[_0x3515e3(0x74)](_0xe94c4d, function (_0x1d9410, _0x2ab2be) {
        const _0x3c88b8 = _0x3515e3;
        (_0x2ab2be["y"] = _0x2ab2be[_0x3c88b8(0x83)]), (_0x2ab2be["x"] = _0x2ab2be["gpslong"]), (_0x2ab2be["category_group_code"] = _0x3c88b8(0x125)), delete _0x2ab2be[_0x3c88b8(0x83)], delete _0x2ab2be[_0x3c88b8(0xdc)];
        const _0x1f24e0 = parseFloat(_0x2ab2be["y"]),
            _0x4667fd = parseFloat(_0x2ab2be["x"]),
            _0x4dc00b = Math[_0x3c88b8(0x95)](calculateDistance(_0x39e933[_0x3c88b8(0x162)], _0x39e933[_0x3c88b8(0x196)], _0x1f24e0, _0x4667fd));
        if (_0x1d9410 < 0x5) {
            const _0x4eb11f = _0x3c88b8(0x110) + _0x2ab2be[_0x3c88b8(0x127)] + _0x3c88b8(0x1aa) + _0x4dc00b + _0x3c88b8(0x8f);
            _0x3f76f6 += _0x4eb11f;
        }
    }),
        $(".place-BUS\x20.place-contents")[_0x3515e3(0x17e)](_0x3f76f6),
        $(".place-BUS\x20.count")["text"](_0x4e9a68),
        $(_0x3515e3(0x19c))["on"]("click", function () {
            displayArroundPlaces(_0xe94c4d, _0x39e933, 0x1f4);
        });
}
function calculateDistance(_0x4f042b, _0x55d000, _0x4cd2d8, _0x4c0bfe) {
    const _0xef1b4a = a47_0x186095,
        _0x4e69c0 = 0x6136b8,
        _0x3d19ea = (_0x4f042b * Math["PI"]) / 0xb4,
        _0x45b743 = (_0x4cd2d8 * Math["PI"]) / 0xb4,
        _0x29bfd4 = ((_0x4cd2d8 - _0x4f042b) * Math["PI"]) / 0xb4,
        _0x2b3882 = ((_0x4c0bfe - _0x55d000) * Math["PI"]) / 0xb4,
        _0x2aa7ed = Math[_0xef1b4a(0xd1)](_0x29bfd4 / 0x2) * Math[_0xef1b4a(0xd1)](_0x29bfd4 / 0x2) + Math["cos"](_0x3d19ea) * Math[_0xef1b4a(0x89)](_0x45b743) * Math[_0xef1b4a(0xd1)](_0x2b3882 / 0x2) * Math["sin"](_0x2b3882 / 0x2),
        _0x5dea21 = 0x2 * Math[_0xef1b4a(0x13c)](Math[_0xef1b4a(0x81)](_0x2aa7ed), Math["sqrt"](0x1 - _0x2aa7ed)),
        _0x3e3226 = _0x4e69c0 * _0x5dea21;
    return _0x3e3226;
}
function displayPlaceInfo(_0x343f09) {
    const _0xc8ea7 = a47_0x186095,
        _0x68219d = _0x343f09["category_group_code"];
    if (_0x68219d !== _0xc8ea7(0x125)) {
        const _0x23b75c = _0x343f09["road_address_name"]
            ? _0xc8ea7(0x7d) + _0x343f09[_0xc8ea7(0x172)] + "\x22>" + _0x343f09[_0xc8ea7(0x172)] + "</p><p\x20class=\x22jibun\x20font11\x20weight400\x22\x20title=\x22" + _0x343f09[_0xc8ea7(0x19a)] + _0xc8ea7(0x1a3) + _0x343f09[_0xc8ea7(0x19a)] + _0xc8ea7(0xa8)
            : _0xc8ea7(0x152) + _0x343f09[_0xc8ea7(0x19a)] + "\x22>" + _0x343f09["address_name"] + "</p>";
        var _0x48759f =
            _0xc8ea7(0xfc) +
            _0x343f09[_0xc8ea7(0x117)] +
            _0xc8ea7(0x1b2) +
            _0x343f09[_0xc8ea7(0xad)] +
            "\x22>" +
            _0x343f09[_0xc8ea7(0xad)] +
            "</a>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20class=\x22btn-close\x20p-2\x22\x20style=\x22filter:invert(100%);\x22\x20onclick=\x22closePlaceOverlay()\x22\x20title=\x22닫기\x22></button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22p-2\x20bg-white\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
            _0x23b75c +
            _0xc8ea7(0xf7) +
            _0x343f09[_0xc8ea7(0x19b)] +
            _0xc8ea7(0x99);
    } else
        var _0x48759f =
            "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22placeinfo\x20position-relative\x20shadow\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p\x20class=\x22title\x20d-block\x20bg-main\x20p-2\x20font15\x20text-white\x20text-bold\x22\x20title=\x22" +
            _0x343f09[_0xc8ea7(0x127)] +
            "\x22>" +
            _0x343f09[_0xc8ea7(0x127)] +
            _0xc8ea7(0x18b) +
            _0x343f09[_0xc8ea7(0x157)] +
            "</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22after\x22\x20style=\x22content:\x27\x27;position:relative;margin-left:-12px;left:50%;width:22px;height:12px;background:url(\x27https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/vertex_white.png\x27)\x22></div>";
    (placeOverlayNode[_0xc8ea7(0xb3)] = _0x48759f), placeOverlay[_0xc8ea7(0xf2)](new kakao[_0xc8ea7(0x170)][_0xc8ea7(0xb4)](_0x343f09["y"], _0x343f09["x"])), placeOverlay[_0xc8ea7(0xc3)](map);
}
function closePlaceOverlay() {
    placeOverlay["setMap"](null);
}
var currentTypeId;
function setOverlayMapTypeId(_0x225844, _0x4b087d) {
    const _0x5a9df5 = a47_0x186095;
    var _0x7baa8f;
    switch (_0x225844) {
        case _0x5a9df5(0xe9):
            _0x7baa8f = kakao["maps"][_0x5a9df5(0x142)][_0x5a9df5(0xdb)];
            break;
        case _0x5a9df5(0xda):
            _0x7baa8f = kakao["maps"][_0x5a9df5(0x142)]["ROADVIEW"];
            break;
        case "terrain":
            _0x7baa8f = kakao[_0x5a9df5(0x170)]["MapTypeId"][_0x5a9df5(0x106)];
            break;
        case _0x5a9df5(0x87):
            _0x7baa8f = kakao[_0x5a9df5(0x170)]["MapTypeId"][_0x5a9df5(0xf8)];
            break;
        default:
            return;
    }
    _0x4b087d[_0x5a9df5(0x17a)](kakao[_0x5a9df5(0x170)]["MapTypeId"]["TRAFFIC"]),
        _0x4b087d[_0x5a9df5(0x17a)](kakao[_0x5a9df5(0x170)]["MapTypeId"][_0x5a9df5(0x1b0)]),
        _0x4b087d[_0x5a9df5(0x17a)](kakao["maps"][_0x5a9df5(0x142)][_0x5a9df5(0x106)]),
        _0x4b087d["removeOverlayMapTypeId"](kakao[_0x5a9df5(0x170)][_0x5a9df5(0x142)][_0x5a9df5(0xf8)]),
        currentTypeId !== _0x7baa8f ? (_0x4b087d[_0x5a9df5(0x121)](_0x7baa8f), (currentTypeId = _0x7baa8f)) : (currentTypeId = null);
}
function changeBaseMapType(_0x576233, _0x55ede9) {
    const _0x529a30 = a47_0x186095;
    switch (_0x576233[_0x529a30(0x119)]()) {
        case "roadmap":
            _0x55ede9[_0x529a30(0xf4)](kakao[_0x529a30(0x170)]["MapTypeId"]["ROADMAP"]);
            break;
        case _0x529a30(0x96):
            _0x55ede9[_0x529a30(0xf4)](kakao[_0x529a30(0x170)][_0x529a30(0x142)]["SKYVIEW"]);
            break;
        case _0x529a30(0x192):
            _0x55ede9[_0x529a30(0xf4)](kakao["maps"][_0x529a30(0x142)]["HYBRID"]);
            break;
        default:
            console["error"](_0x529a30(0x82));
            break;
    }
}
function updateTabOnScroll() {
    const _0x5857fb = a47_0x186095,
        _0x5b2d30 = { "mc-real": $(_0x5857fb(0x13b)), "mc-ground": $(_0x5857fb(0x93)), "mc-building": $(_0x5857fb(0x1ad)), "mc-surrounding": $(_0x5857fb(0xf3)), "mc-analysis": $(".tab-btn[data-target=\x22mc-analysis\x22]"), "mc-finance": $(".tab-btn[data-target=\x22mc-finance\x22]") },
        _0x5b6c14 = Object[_0x5857fb(0x198)](_0x5b2d30)[_0x5857fb(0x133)]((_0x24de9e) => $("." + _0x24de9e));
    $(_0x5857fb(0xee))["on"]("scroll", function () {
        const _0x535ea9 = _0x5857fb;
        let _0x591b7d = $(this)[_0x535ea9(0x1af)](),
            _0x1276f5 = ![];
        if (_0x591b7d === 0x0) {
            $(_0x535ea9(0x9f))[_0x535ea9(0x85)](_0x535ea9(0xa2)), _0x5b2d30[_0x535ea9(0x190)][_0x535ea9(0x9c)]("active");
            return;
        }
        _0x5b6c14[_0x535ea9(0x12e)]((_0x42ed76, _0x2bd296) => {
            const _0x536794 = _0x535ea9;
            if (!_0x42ed76["is"](":visible")) return;
            let _0x373864 = _0x42ed76[_0x536794(0xc7)]()[_0x536794(0xbd)] - $(_0x536794(0xee))[_0x536794(0xc7)]()[_0x536794(0xbd)] + _0x591b7d,
                _0x9c629a = _0x42ed76[_0x536794(0xd9)]();
            if (_0x591b7d >= _0x373864 - 0x32 && _0x591b7d < _0x373864 + _0x9c629a - 0x32) {
                $(".tab-btn")[_0x536794(0x85)](_0x536794(0xa2));
                const _0x3947e6 = _0x42ed76[_0x536794(0xf1)]("class")[_0x536794(0x13d)]("\x20")[0x0];
                _0x5b2d30[_0x3947e6] && (_0x5b2d30[_0x3947e6]["addClass"](_0x536794(0xa2)), (_0x1276f5 = !![]));
            }
        }),
            !_0x1276f5 && ($(_0x535ea9(0x9f))[_0x535ea9(0x85)](_0x535ea9(0xa2)), _0x5b2d30["mc-finance"][_0x535ea9(0x9c)](_0x535ea9(0xa2)));
    });
}
