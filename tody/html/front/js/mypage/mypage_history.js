(function (_0x7dd05b, _0x399ff9) {
    const _0x525f89 = a25_0xa6f7,
        _0x4bebd3 = _0x7dd05b();
    while (!![]) {
        try {
            const _0x3671e9 =
                (parseInt(_0x525f89(0x13a)) / 0x1) * (-parseInt(_0x525f89(0x12d)) / 0x2) +
                parseInt(_0x525f89(0x137)) / 0x3 +
                (-parseInt(_0x525f89(0x146)) / 0x4) * (-parseInt(_0x525f89(0x127)) / 0x5) +
                -parseInt(_0x525f89(0x143)) / 0x6 +
                (parseInt(_0x525f89(0x15f)) / 0x7) * (-parseInt(_0x525f89(0x124)) / 0x8) +
                parseInt(_0x525f89(0xf8)) / 0x9 +
                -parseInt(_0x525f89(0x168)) / 0xa;
            if (_0x3671e9 === _0x399ff9) break;
            else _0x4bebd3["push"](_0x4bebd3["shift"]());
        } catch (_0x231ec7) {
            _0x4bebd3["push"](_0x4bebd3["shift"]());
        }
    }
})(a25_0x165b, 0x2cb6b),
    $(function () {
        const _0x1d4034 = a25_0xa6f7;
        if (!userInfo()) {
            alert(_0x1d4034(0xee)), (location[_0x1d4034(0x10b)] = _0x1d4034(0x164));
            return;
        }
        initMenu(), initEvents(), initTables();
    });
function initEvents() {
    const _0x5124a9 = a25_0xa6f7;
    $(_0x5124a9(0x139))["on"](_0x5124a9(0x10e), ".nav-link", function () {
        const _0x3f691d = _0x5124a9;
        $(_0x3f691d(0x14f))[_0x3f691d(0x11e)](_0x3f691d(0x169))
            ? $("#recent_search_more_btn")[_0x3f691d(0x166)](_0x3f691d(0x10b), _0x3f691d(0xf4) + encodeURIComponent(_0x3f691d(0x115)) + "&table=search&type=real")
            : $(_0x3f691d(0x111))[_0x3f691d(0x166)](_0x3f691d(0x10b), _0x3f691d(0xf4) + encodeURIComponent(_0x3f691d(0xfc)) + _0x3f691d(0x158));
    }),
        $("#favorite_table_1")["on"](_0x5124a9(0x10e), ".nav-link", function () {
            const _0x4ac723 = _0x5124a9;
            $(_0x4ac723(0x132))[_0x4ac723(0x11e)](_0x4ac723(0x169))
                ? $(_0x4ac723(0xef))[_0x4ac723(0x166)]("href", _0x4ac723(0xf4) + encodeURIComponent(_0x4ac723(0x162)) + _0x4ac723(0xf0))
                : $("#favorite_btn_1")[_0x4ac723(0x166)](_0x4ac723(0x10b), _0x4ac723(0xf4) + encodeURIComponent("찜(매물정보)") + _0x4ac723(0x108));
        }),
        $(_0x5124a9(0x130))["on"](_0x5124a9(0x10e), _0x5124a9(0x16d), function () {
            const _0x28fc63 = _0x5124a9;
            $(_0x28fc63(0x163))[_0x28fc63(0x11e)]("active")
                ? $("#favorite_btn_2")["attr"](_0x28fc63(0x10b), "mypage_history_popup.html?title=" + encodeURIComponent("찜(삽니다)") + _0x28fc63(0x11f))
                : $(_0x28fc63(0x12a))[_0x28fc63(0x166)](_0x28fc63(0x10b), _0x28fc63(0xf4) + encodeURIComponent(_0x28fc63(0x13e)) + "&table=favorite&type=put");
        }),
        $(_0x5124a9(0x145))["on"](_0x5124a9(0x10e), _0x5124a9(0x16d), function () {
            const _0x574fdc = _0x5124a9;
            $(_0x574fdc(0x152))[_0x574fdc(0x11e)](_0x574fdc(0x169))
                ? $(_0x574fdc(0x10a))[_0x574fdc(0x166)](_0x574fdc(0x10b), _0x574fdc(0xf4) + encodeURIComponent("최근\x20본\x20삽니다") + _0x574fdc(0x102))
                : $(_0x574fdc(0x10a))[_0x574fdc(0x166)](_0x574fdc(0x10b), "mypage_history_popup.html?title=" + encodeURIComponent(_0x574fdc(0x13c)) + _0x574fdc(0x150));
        }),
        $(_0x5124a9(0x117))["on"](_0x5124a9(0x10e), _0x5124a9(0x16d), function () {
            const _0x237d54 = _0x5124a9;
            $(_0x237d54(0xf2))[_0x237d54(0x11e)]("active")
                ? $("#recent_print_btn")[_0x237d54(0x166)](_0x237d54(0x10b), _0x237d54(0xf4) + encodeURIComponent(_0x237d54(0x11a)) + _0x237d54(0x109))
                : $(_0x237d54(0x144))["attr"](_0x237d54(0x10b), "mypage_history_popup.html?title=" + encodeURIComponent(_0x237d54(0x134)) + "&table=print&type=estate");
        }),
        $(_0x5124a9(0x139))["on"](_0x5124a9(0x10e), _0x5124a9(0x15d), function (_0x1ae0c6) {
            const _0x1de870 = _0x5124a9,
                _0x1c6ea9 = $(this)[_0x1de870(0x166)]("data-type"),
                _0x108482 = $(this)["attr"]("data-history_no");
            deleteHistory(_0x1de870(0x167), _0x1c6ea9, _0x108482);
        }),
        $(_0x5124a9(0x16a))["on"]("click", ".delete-btn", function (_0x1b1c1e) {
            const _0x4fd77c = _0x5124a9,
                _0x20c180 = $(this)["attr"](_0x4fd77c(0x15c)),
                _0x38dff3 = $(this)["attr"](_0x4fd77c(0x147));
            deleteHistory(_0x4fd77c(0xf3), _0x20c180, _0x38dff3);
        }),
        $("#favorite_table_2")["on"](_0x5124a9(0x10e), _0x5124a9(0x15d), function (_0x4c38b0) {
            const _0x9e52ee = _0x5124a9,
                _0x4bc9c6 = $(this)[_0x9e52ee(0x166)](_0x9e52ee(0x15c)),
                _0x512039 = $(this)[_0x9e52ee(0x166)]("data-history_no");
            deleteHistory(_0x9e52ee(0xf3), _0x4bc9c6, _0x512039);
        }),
        $("#recent_view_table_2")["on"](_0x5124a9(0x10e), _0x5124a9(0x15d), function (_0x51a742) {
            const _0x4f6262 = _0x5124a9,
                _0x2bc66d = $(this)[_0x4f6262(0x166)](_0x4f6262(0x15c)),
                _0x3843b2 = $(this)[_0x4f6262(0x166)](_0x4f6262(0x147));
            deleteHistory(_0x4f6262(0x101), _0x2bc66d, _0x3843b2);
        }),
        $(_0x5124a9(0x117))["on"]("click", _0x5124a9(0x15d), function (_0xa4b369) {
            const _0x368e56 = _0x5124a9,
                _0x54ec63 = $(this)[_0x368e56(0x166)]("data-type"),
                _0x51d334 = $(this)[_0x368e56(0x166)](_0x368e56(0x147));
            deleteHistory(_0x368e56(0x116), _0x54ec63, _0x51d334);
        });
}
async function initTables() {
    const _0x57aadb = a25_0xa6f7,
        [_0x1443d1, _0x40636f, _0xa8f576, _0x4bbb90, _0x2b71c5, _0x255de7, _0x55c59c, _0x59f743, _0x563dd7, _0xb5e74] = await Promise["all"]([
            initRecentSearch(_0x57aadb(0x112), 0x5, 0x0),
            initRecentSearch("estate", 0x5, 0x0),
            initFavorite1(_0x57aadb(0x112), 0x5, 0x0),
            initFavorite1(_0x57aadb(0x14c), 0x5, 0x0),
            initFavorite2("find", 0x5, 0x0),
            initFavorite2("put", 0x5, 0x0),
            initRecentView(_0x57aadb(0x170), 0x5, 0x0),
            initRecentView(_0x57aadb(0x121), 0x5, 0x0),
            initRecentPrint(_0x57aadb(0x112), 0x5, 0x0),
            initRecentPrint(_0x57aadb(0x14c), 0x5, 0x0),
        ]);
    $("#recent_search_real")[_0x57aadb(0x170)](_0x57aadb(0x120))[_0x57aadb(0x128)]()["append"](_0x1443d1[_0x57aadb(0x13f)]),
        $("#recent_search_real")["find"]("tbody")[_0x57aadb(0x128)]()["append"](_0x1443d1["tbodyHtml"]),
        $("#recent_search_sale")[_0x57aadb(0x170)](_0x57aadb(0x120))[_0x57aadb(0x128)]()[_0x57aadb(0xfb)](_0x40636f[_0x57aadb(0x13f)]),
        $("#recent_search_sale")["find"](_0x57aadb(0x15b))[_0x57aadb(0x128)]()[_0x57aadb(0xfb)](_0x40636f["tbodyHtml"]),
        $(_0x57aadb(0x132))[_0x57aadb(0x170)](_0x57aadb(0x120))[_0x57aadb(0x128)]()[_0x57aadb(0xfb)](_0xa8f576[_0x57aadb(0x13f)]),
        $("#recent_favorite_real")[_0x57aadb(0x170)](_0x57aadb(0x15b))["empty"]()[_0x57aadb(0xfb)](_0xa8f576["tbodyHtml"]),
        $(_0x57aadb(0x142))[_0x57aadb(0x170)]("thead")[_0x57aadb(0x128)]()[_0x57aadb(0xfb)](_0x4bbb90["theadHtml"]),
        $(_0x57aadb(0x142))["find"](_0x57aadb(0x15b))["empty"]()[_0x57aadb(0xfb)](_0x4bbb90["tbodyHtml"]),
        $(_0x57aadb(0x163))[_0x57aadb(0x170)]("thead")[_0x57aadb(0x128)]()["append"](_0x2b71c5[_0x57aadb(0x13f)]),
        $(_0x57aadb(0x163))[_0x57aadb(0x170)](_0x57aadb(0x15b))["empty"]()[_0x57aadb(0xfb)](_0x2b71c5[_0x57aadb(0x141)]),
        $("#recent_favorite_put")[_0x57aadb(0x170)](_0x57aadb(0x120))[_0x57aadb(0x128)]()["append"](_0x255de7[_0x57aadb(0x13f)]),
        $(_0x57aadb(0xf6))["find"](_0x57aadb(0x15b))[_0x57aadb(0x128)]()[_0x57aadb(0xfb)](_0x255de7[_0x57aadb(0x141)]),
        $(_0x57aadb(0x152))[_0x57aadb(0x170)](_0x57aadb(0x120))["empty"]()[_0x57aadb(0xfb)](_0x55c59c[_0x57aadb(0x13f)]),
        $("#recent_view_find")[_0x57aadb(0x170)](_0x57aadb(0x15b))["empty"]()[_0x57aadb(0xfb)](_0x55c59c[_0x57aadb(0x141)]),
        $(_0x57aadb(0x153))["find"](_0x57aadb(0x120))[_0x57aadb(0x128)]()[_0x57aadb(0xfb)](_0x59f743[_0x57aadb(0x13f)]),
        $("#recent_view_put")[_0x57aadb(0x170)]("tbody")[_0x57aadb(0x128)]()[_0x57aadb(0xfb)](_0x59f743["tbodyHtml"]),
        $(_0x57aadb(0xf2))["find"](_0x57aadb(0x120))[_0x57aadb(0x128)]()[_0x57aadb(0xfb)](_0x563dd7[_0x57aadb(0x13f)]),
        $(_0x57aadb(0xf2))[_0x57aadb(0x170)]("tbody")[_0x57aadb(0x128)]()["append"](_0x563dd7[_0x57aadb(0x141)]),
        $(_0x57aadb(0x126))[_0x57aadb(0x170)](_0x57aadb(0x120))["empty"]()[_0x57aadb(0xfb)](_0xb5e74["theadHtml"]),
        $(_0x57aadb(0x126))["find"]("tbody")[_0x57aadb(0x128)]()[_0x57aadb(0xfb)](_0xb5e74[_0x57aadb(0x141)]);
}
async function initRecentSearch(_0x3342d8, _0xb3f75c, _0x5eaffd) {
    const _0x33cc6e = a25_0xa6f7,
        _0x546a3b = { ...userInfo(), type: _0x3342d8, limit: _0xb3f75c, offset: _0x5eaffd },
        _0x29476a = await callApi(_0x33cc6e(0x123), "/front/back/history/history_recent_search.php", _0x546a3b);
    if (!_0x29476a) return;
    const _0x590d46 = _0x29476a["responseData"]
            [_0x33cc6e(0xfd)](function (_0x2b8b2f) {
                const _0x2b0133 = _0x33cc6e;
                let _0x3916fa = "";
                if (_0x3342d8 === _0x2b0133(0x112)) _0x3916fa = _0x2b0133(0x12b) + _0x2b8b2f[_0x2b0133(0xff)] + _0x2b0133(0x161) + _0x2b8b2f[_0x2b0133(0x159)];
                else _0x3342d8 === _0x2b0133(0x14c) && (_0x3916fa = _0x2b0133(0x129) + _0x2b8b2f[_0x2b0133(0xff)] + _0x2b0133(0x161) + _0x2b8b2f[_0x2b0133(0x159)]);
                return _0x2b0133(0x154) + _0x2b8b2f[_0x2b0133(0x15e)] + _0x2b0133(0x119) + _0x3916fa + "\x22>" + _0x2b8b2f[_0x2b0133(0x103)] + _0x2b0133(0xf5) + _0x2b8b2f[_0x2b0133(0x135)] + "\x22\x20data-history_no=\x22" + _0x2b8b2f[_0x2b0133(0x156)] + _0x2b0133(0x133);
            })
            [_0x33cc6e(0x122)](""),
        _0x6897cf = _0x33cc6e(0x16e);
    return { theadHtml: _0x6897cf, tbodyHtml: _0x590d46 };
}
async function initFavorite1(_0x3d7e4c, _0x43b11d, _0x20a04e) {
    const _0x4b322e = a25_0xa6f7,
        _0x1875ef = { ...userInfo(), type: _0x3d7e4c, limit: _0x43b11d, offset: _0x20a04e },
        _0x2f4615 = await callApi("POST", _0x4b322e(0x10f), _0x1875ef);
    if (!_0x2f4615) return;
    const _0x54fbe2 = _0x2f4615["responseData"]
        [_0x4b322e(0xfd)](function (_0x383943) {
            const _0x4975da = _0x4b322e;
            let _0x1ee56e = "",
                _0x3c0c8c = "";
            if (_0x3d7e4c === _0x4975da(0x112))
                (_0x1ee56e = _0x4975da(0x12b) + _0x383943["latitude"] + "&curLng=" + _0x383943[_0x4975da(0x159)]),
                    (_0x3c0c8c = _0x4975da(0x157) + _0x383943[_0x4975da(0x15e)] + _0x4975da(0x16c) + _0x1ee56e + "\x22>" + _0x383943[_0x4975da(0x103)] + _0x4975da(0x140) + _0x383943[_0x4975da(0x135)] + _0x4975da(0x171) + _0x383943["history_no"] + _0x4975da(0xf1));
            else
                _0x3d7e4c === _0x4975da(0x14c) &&
                    ((_0x1ee56e = "/front/views/sell/sell.html?curLat=" + _0x383943["latitude"] + _0x4975da(0x161) + _0x383943["longitude"]),
                    (_0x3c0c8c =
                        _0x4975da(0x157) +
                        _0x383943["reg_date"] +
                        _0x4975da(0x16c) +
                        _0x1ee56e +
                        "\x22>" +
                        _0x383943["jibun_address"] +
                        _0x4975da(0x14e) +
                        _0x1ee56e +
                        _0x4975da(0x14b) +
                        _0x383943[_0x4975da(0xf7)] +
                        "\x22>" +
                        _0x383943[_0x4975da(0xf7)] +
                        _0x4975da(0x140) +
                        _0x383943[_0x4975da(0x135)] +
                        _0x4975da(0x171) +
                        _0x383943[_0x4975da(0x156)] +
                        _0x4975da(0xf1)));
            return _0x3c0c8c;
        })
        [_0x4b322e(0x122)]("");
    let _0x1d157c = "";
    if (_0x3d7e4c === _0x4b322e(0x112))
        _0x1d157c =
            "<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22\x20class=\x22col-3\x22>찜\x20날짜</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22>소재지</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22></th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>";
    else
        _0x3d7e4c === _0x4b322e(0x14c) &&
            (_0x1d157c =
                "<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22\x20class=\x22col-3\x22>찜\x20날짜</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22>소재지</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22>매물번호</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22></th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>");
    return { theadHtml: _0x1d157c, tbodyHtml: _0x54fbe2 };
}
async function initFavorite2(_0xeea159, _0x3b7b00, _0x15706a) {
    const _0x597234 = a25_0xa6f7,
        _0x2c843a = { ...userInfo(), type: _0xeea159, limit: _0x3b7b00, offset: _0x15706a },
        _0x52957e = await callApi("POST", _0x597234(0x105), _0x2c843a);
    if (!_0x52957e) return;
    const _0x1e1c7b = _0x52957e[_0x597234(0x14d)]
            ["map"](function (_0x310826) {
                const _0x569cc5 = _0x597234;
                return (
                    "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>검색날짜\x20:\x20</font>\x20" +
                    _0x310826[_0x569cc5(0x15e)] +
                    _0x569cc5(0xf9) +
                    _0x310826[_0x569cc5(0x11c)] +
                    "/" +
                    _0x310826["favorite_type"] +
                    _0x569cc5(0x125) +
                    _0x310826[_0x569cc5(0xfe)] +
                    "\x22>" +
                    _0x310826[_0x569cc5(0x118)] +
                    _0x569cc5(0xf5) +
                    _0x310826[_0x569cc5(0x11c)] +
                    "\x22\x20data-history_no=\x22" +
                    _0x310826[_0x569cc5(0x156)] +
                    _0x569cc5(0x133)
                );
            })
            ["join"](""),
        _0x59bea2 = _0x597234(0x149);
    return { tbodyHtml: _0x1e1c7b, theadHtml: _0x59bea2 };
}
function a25_0x165b() {
    const _0x14738e = [
        "_view.html?viewNo=",
        "#recent_print_sale",
        "5HBYkgl",
        "empty",
        "/front/views/sell/sell.html?curLat=",
        "#favorite_btn_2",
        "/front/views/realPrice/realPrice.html?curLat=",
        "\x20~\x20",
        "24NOldqV",
        "#lottieCompletion",
        "470px",
        "#favorite_table_2",
        "view_type",
        "#recent_favorite_real",
        "\x22>삭제</button></td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>",
        "최근\x20인쇄\x20매물정보",
        "type",
        "<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22\x20class=\x22col-3\x22>인쇄일</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22>소재지</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22>매물번호</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22></th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>",
        "804591XhJItY",
        "/front/assets/lottie/completion.json",
        "#recent_search_table",
        "13535XWqQRE",
        "setTop",
        "최근\x20본\x20팝니다",
        "삭제되었습니다.",
        "찜(팝니다)",
        "theadHtml",
        "</a></td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td\x20class=\x22text-end\x22><font>삭제\x20:\x20</font>\x20<button\x20type=\x22button\x22\x20class=\x22delete-btn\x20btn\x20btn-danger\x22\x20data-type=\x22",
        "tbodyHtml",
        "#recent_favorite_sale",
        "296448FIIaOJ",
        "#recent_print_btn",
        "#recent_view_table_2",
        "337980heFrRq",
        "data-history_no",
        "message",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22\x20class=\x22col-3\x22>찜\x20날짜</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22>소재지</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22></th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</tr>",
        "/front/back/history/history_delete_search.php",
        "&estateNo=",
        "estate",
        "responseData",
        "</a></td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>매물번호\x20:\x20</font>\x20<a\x20href=\x22",
        "#recent_search_realPrice",
        "&table=view&type=put",
        "\x22>삭제</button></td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>",
        "#recent_view_find",
        "#recent_view_put",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>조회\x20날짜\x20:\x20</font>\x20",
        "loadAnimation",
        "history_no",
        "<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>조회\x20날짜\x20:\x20</font>\x20",
        "&table=search&type=estate",
        "longitude",
        "svg",
        "tbody",
        "data-type",
        ".delete-btn",
        "reg_date",
        "69461cMvPHP",
        "</a></td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>가격대\x20:\x20</font>\x20",
        "&curLng=",
        "찜(실거래가)",
        "#recent_favorite_find",
        "/index",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>조회\x20날짜\x20:\x20</font>\x20",
        "attr",
        "search",
        "1011790ogwbBD",
        "active",
        "#favorite_table_1",
        "/front/back/history/history_recent_view_put.php",
        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>주소\x20:\x20</font>\x20<a\x20href=\x22",
        ".nav-link",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22\x20class=\x22col-3\x22>검색일</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22>소재지</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22></th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</tr>",
        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td\x20class=\x22text-end\x22><font>삭제\x20:\x20</font>\x20<button\x20type=\x22button\x22\x20class=\x22delete-btn\x20btn\x20btn-danger\x22\x20data-type=\x22",
        "find",
        "\x22\x20data-history_no=\x22",
        "sale_price",
        "로그인\x20후\x20이용\x20가능합니다.",
        "#favorite_btn_1",
        "&table=favorite&type=real",
        "\x22>삭제</button></td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>",
        "#recent_print_real",
        "favorite",
        "mypage_history_popup.html?title=",
        "</a></td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td\x20class=\x22text-end\x22><font>삭제\x20:\x20</font>\x20<button\x20type=\x22button\x22\x20class=\x22delete-btn\x20btn\x20btn-danger\x22\x20data-type=\x22",
        "#recent_favorite_put",
        "estate_no",
        "2452149rPLIIY",
        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>주소\x20:\x20</font>\x20<a\x20href=\x22/front/views/",
        "<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22\x20class=\x22col-3\x22>인쇄일</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22>소재지</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22></th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>",
        "append",
        "최근\x20검색\x20매물정보",
        "map",
        "board_no",
        "latitude",
        "querySelector",
        "view",
        "&table=view&type=find",
        "jibun_address",
        "/front/back/history/history_print_map.php",
        "/front/back/history/history_favorite.php",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22\x20class=\x22col-2\x22>조회일</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22>주소</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22>가격대</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22></th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>",
        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>주소\x20:\x20</font>\x20<a\x20href=\x22/front/views/",
        "&table=favorite&type=estate",
        "&table=print&type=real",
        "#recent_view_btn_2",
        "href",
        "min_price",
        "setBottom",
        "click",
        "/front/back/history/history_favorite_map.php",
        "<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>인쇄일\x20:\x20</font>\x20",
        "#recent_search_more_btn",
        "real",
        "/front/back/history/history_delete_favorite_map.php",
        "iziModal",
        "최근\x20검색\x20실거래가",
        "print",
        "#recent_print_table",
        "locatadd_nm",
        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>주소\x20:\x20</font>\x20<a\x20href=\x22",
        "최근\x20인쇄\x20실거래가",
        "/front/back/history/history_recent_view_find.php",
        "favorite_type",
        "\x22\x20data-board_no=\x22",
        "hasClass",
        "&table=favorite&type=find",
        "thead",
        "put",
        "join",
        "POST",
        "104CuCIKf",
    ];
    a25_0x165b = function () {
        return _0x14738e;
    };
    return a25_0x165b();
}
async function initRecentView(_0x454beb, _0x245c52, _0x512702) {
    const _0x173734 = a25_0xa6f7,
        _0x296c82 = { ...userInfo(), type: _0x454beb, limit: _0x245c52, offset: _0x512702 };
    if (_0x454beb === _0x173734(0x170)) {
        const _0x3e1dd1 = await callApi(_0x173734(0x123), _0x173734(0x11b), _0x296c82);
        if (!_0x3e1dd1) return;
        const _0x34d79b = _0x3e1dd1[_0x173734(0x14d)]
                [_0x173734(0xfd)](function (_0x18a0c4) {
                    const _0x3f78f2 = _0x173734;
                    return (
                        _0x3f78f2(0x165) +
                        _0x18a0c4["reg_date"] +
                        _0x3f78f2(0x107) +
                        _0x18a0c4[_0x3f78f2(0x131)] +
                        "/" +
                        _0x18a0c4[_0x3f78f2(0x131)] +
                        _0x3f78f2(0x125) +
                        _0x18a0c4["board_no"] +
                        "\x22>" +
                        _0x18a0c4["locatadd_nm"] +
                        "</a></td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>가격대\x20:\x20</font>\x20" +
                        formatPrice(_0x18a0c4[_0x3f78f2(0x10c)]) +
                        _0x3f78f2(0x12c) +
                        formatPrice(_0x18a0c4["max_price"]) +
                        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td\x20class=\x22text-end\x22><font>삭제\x20:\x20</font>\x20<button\x20type=\x22button\x22\x20class=\x22delete-btn\x20btn\x20btn-danger\x22\x20data-type=\x22" +
                        _0x18a0c4["view_type"] +
                        _0x3f78f2(0x171) +
                        _0x18a0c4[_0x3f78f2(0x156)] +
                        _0x3f78f2(0x11d) +
                        _0x18a0c4[_0x3f78f2(0xfe)] +
                        "\x22>삭제</button></td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>"
                    );
                })
                [_0x173734(0x122)](""),
            _0x3697ac = _0x173734(0x106);
        return { tbodyHtml: _0x34d79b, theadHtml: _0x3697ac };
    } else {
        if (_0x454beb === _0x173734(0x121)) {
            const _0x23e0ff = await callApi(_0x173734(0x123), _0x173734(0x16b), _0x296c82);
            if (!_0x23e0ff) return;
            const _0x77195b = _0x23e0ff["responseData"]
                    [_0x173734(0xfd)](function (_0x5b7306) {
                        const _0x103a7d = _0x173734;
                        return (
                            _0x103a7d(0x165) +
                            _0x5b7306["reg_date"] +
                            _0x103a7d(0x107) +
                            _0x5b7306[_0x103a7d(0x131)] +
                            "/" +
                            _0x5b7306[_0x103a7d(0x131)] +
                            _0x103a7d(0x125) +
                            _0x5b7306[_0x103a7d(0xfe)] +
                            "\x22>" +
                            _0x5b7306["locatadd_nm"] +
                            _0x103a7d(0x160) +
                            formatPrice(_0x5b7306[_0x103a7d(0x172)]) +
                            _0x103a7d(0x16f) +
                            _0x5b7306["view_type"] +
                            _0x103a7d(0x171) +
                            _0x5b7306[_0x103a7d(0x156)] +
                            "\x22\x20data-board_no=\x22" +
                            _0x5b7306[_0x103a7d(0xfe)] +
                            _0x103a7d(0x151)
                        );
                    })
                    [_0x173734(0x122)](""),
                _0x3176ab =
                    "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22\x20class=\x22col-2\x22>조회일</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22>주소</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22>가격대</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th\x20scope=\x22col\x22></th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>";
            return { theadHtml: _0x3176ab, tbodyHtml: _0x77195b };
        }
    }
}
async function initRecentPrint(_0x4c06b8, _0x3f4e0a, _0x133f42) {
    const _0x30f797 = a25_0xa6f7,
        _0x20349c = { ...userInfo(), type: _0x4c06b8, limit: _0x3f4e0a, offset: _0x133f42 },
        _0x461967 = await callApi(_0x30f797(0x123), _0x30f797(0x104), _0x20349c);
    if (!_0x461967) return;
    const _0x530e19 = _0x461967[_0x30f797(0x14d)]
        [_0x30f797(0xfd)](function (_0x545f69) {
            const _0x41c482 = _0x30f797;
            let _0x48a2c5 = "",
                _0x151775 = "";
            if (_0x4c06b8 === _0x41c482(0x112))
                (_0x48a2c5 = _0x41c482(0x12b) + _0x545f69[_0x41c482(0xff)] + "&curLng=" + _0x545f69["longitude"]),
                    (_0x151775 =
                        _0x41c482(0x110) +
                        _0x545f69[_0x41c482(0x15e)] +
                        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>주소\x20:\x20</font>\x20<a\x20href=\x22" +
                        _0x48a2c5 +
                        "\x22>" +
                        _0x545f69[_0x41c482(0x103)] +
                        _0x41c482(0x140) +
                        _0x545f69[_0x41c482(0x135)] +
                        _0x41c482(0x171) +
                        _0x545f69[_0x41c482(0x156)] +
                        _0x41c482(0xf1));
            else
                _0x4c06b8 === "estate" &&
                    ((_0x48a2c5 = _0x41c482(0x129) + _0x545f69[_0x41c482(0xff)] + "&curLng=" + _0x545f69["longitude"] + _0x41c482(0x14b) + _0x545f69[_0x41c482(0xf7)]),
                    (_0x151775 =
                        _0x41c482(0x110) +
                        _0x545f69[_0x41c482(0x15e)] +
                        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td><font>주소\x20:\x20</font>\x20<a\x20href=\x22" +
                        _0x48a2c5 +
                        "\x22>" +
                        _0x545f69["jibun_address"] +
                        _0x41c482(0x14e) +
                        _0x48a2c5 +
                        "\x22>" +
                        _0x545f69[_0x41c482(0xf7)] +
                        _0x41c482(0x140) +
                        _0x545f69[_0x41c482(0x135)] +
                        "\x22\x20data-history_no=\x22" +
                        _0x545f69[_0x41c482(0x156)] +
                        _0x41c482(0xf1)));
            return _0x151775;
        })
        [_0x30f797(0x122)]("");
    let _0x40fdc0 = "";
    if (_0x4c06b8 === _0x30f797(0x112)) _0x40fdc0 = _0x30f797(0xfa);
    else _0x4c06b8 === "estate" && (_0x40fdc0 = _0x30f797(0x136));
    return { theadHtml: _0x40fdc0, tbodyHtml: _0x530e19 };
}
function a25_0xa6f7(_0x2201b8, _0x485641) {
    const _0x165b87 = a25_0x165b();
    return (
        (a25_0xa6f7 = function (_0xa6f729, _0x45ea5d) {
            _0xa6f729 = _0xa6f729 - 0xee;
            let _0x448b88 = _0x165b87[_0xa6f729];
            return _0x448b88;
        }),
        a25_0xa6f7(_0x2201b8, _0x485641)
    );
}
function initModal() {
    const _0xd2ad8 = a25_0xa6f7;
    _0x3a277f("#modalCompletion", _0xd2ad8(0x138), _0xd2ad8(0x12e));
    function _0x3a277f(_0x10fdcd, _0x5bf063, _0x4cef95) {
        const _0x36047e = _0xd2ad8;
        $(_0x10fdcd)[_0x36047e(0x114)]({ width: _0x36047e(0x12f) }), $(_0x10fdcd)[_0x36047e(0x114)](_0x36047e(0x13b), 0x46), $(_0x10fdcd)["iziModal"](_0x36047e(0x10d), 0x46);
        var _0x3221e8 = bodymovin[_0x36047e(0x155)]({ container: document[_0x36047e(0x100)](_0x4cef95), renderer: _0x36047e(0x15a), loop: !![], autoplay: !![], path: _0x5bf063 });
    }
}
async function deleteHistory(_0x366150, _0x2650f5, _0x30c3fc) {
    const _0x2e1bf0 = a25_0xa6f7;
    let _0x313f7c = "";
    if (_0x366150 == _0x2e1bf0(0xf3)) {
        if (_0x2650f5 === "real" || _0x2650f5 === _0x2e1bf0(0x14c)) _0x313f7c = _0x2e1bf0(0x113);
        else (_0x2650f5 === _0x2e1bf0(0x121) || _0x2650f5 === _0x2e1bf0(0x170)) && (_0x313f7c = "/front/back/history/history_delete.php");
    } else {
        if (_0x366150 == _0x2e1bf0(0x101)) _0x313f7c = "/front/back/history/history_delete_view.php";
        else {
            if (_0x366150 == _0x2e1bf0(0x167)) _0x313f7c = _0x2e1bf0(0x14a);
            else _0x366150 == _0x2e1bf0(0x116) && (_0x313f7c = "/front/back/history/history_delete_print.php");
        }
    }
    const _0x3f351c = { ...userInfo(), type: _0x2650f5, history_no: _0x30c3fc },
        _0x1b96cd = await callApi("POST", _0x313f7c, _0x3f351c);
    if (!_0x1b96cd) return;
    return _0x1b96cd[_0x2e1bf0(0x148)] == "SUCCESS" && (sweetAlertForReturn(_0x2e1bf0(0x13d), "", "s"), initTables()), !![];
}
