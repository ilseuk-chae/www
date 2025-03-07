const a39_0x363e4a = a39_0x57f5;
(function (_0xcfca19, _0x58517f) {
    const _0x20204a = a39_0x57f5,
        _0x4b6d1d = _0xcfca19();
    while (!![]) {
        try {
            const _0x14f903 =
                (-parseInt(_0x20204a(0x210)) / 0x1) * (-parseInt(_0x20204a(0x28d)) / 0x2) +
                (parseInt(_0x20204a(0x2b5)) / 0x3) * (-parseInt(_0x20204a(0x19c)) / 0x4) +
                parseInt(_0x20204a(0x1da)) / 0x5 +
                -parseInt(_0x20204a(0x282)) / 0x6 +
                (parseInt(_0x20204a(0x1d6)) / 0x7) * (-parseInt(_0x20204a(0x261)) / 0x8) +
                (parseInt(_0x20204a(0x169)) / 0x9) * (-parseInt(_0x20204a(0x231)) / 0xa) +
                (parseInt(_0x20204a(0x23d)) / 0xb) * (parseInt(_0x20204a(0x228)) / 0xc);
            if (_0x14f903 === _0x58517f) break;
            else _0x4b6d1d["push"](_0x4b6d1d["shift"]());
        } catch (_0x1bd613) {
            _0x4b6d1d["push"](_0x4b6d1d["shift"]());
        }
    }
})(a39_0x4e67, 0x64379);
const mapContainer = document[a39_0x363e4a(0x1c3)](a39_0x363e4a(0x229));
let geocoder = new kakao["maps"][a39_0x363e4a(0x1e6)]["Geocoder"](),
    ps = new kakao["maps"][a39_0x363e4a(0x1e6)][a39_0x363e4a(0x2ba)](),
    map,
    infowindow,
    clusterer,
    contentsMarkers = [],
    marker = new kakao["maps"][a39_0x363e4a(0x1db)](),
    markers = [],
    realPriceMarkers = [],
    historyMarkers = [],
    currentUnit = "m2",
    previousLat = new URLSearchParams(window["location"][a39_0x363e4a(0x28c)])[a39_0x363e4a(0x27f)]("curLat"),
    previousLng = new URLSearchParams(window[a39_0x363e4a(0x22a)]["search"])[a39_0x363e4a(0x27f)](a39_0x363e4a(0x1f7)),
    isMultiSelectMode = ![],
    selectedPolygons = [],
    buildingPolygons = [],
    landPolygons = [],
    landPolygonsMiniMap = [],
    analysisPolygonArray = [],
    landWFSArrays = [],
    isLoading = ![],
    manager = null,
    circleDrawer = null,
    lineDrawer = null,
    polygonDrawer = null;
var textModule = null,
    currentOverlay = null;
let existingBounds = [],
    currentOverlays = [],
    isMapClickable = !![],
    textModuleControl = null,
    realPriceOverlays = [];
$(document)[a39_0x363e4a(0x2be)](function () {
    const _0x2523a3 = a39_0x363e4a;
    initProj4(),
        initializeMap(),
        handleMapEvents(),
        window["addEventListener"](_0x2523a3(0x1a2), function (_0x265f95) {
            handleUrlChange();
        }),
        $(_0x2523a3(0x260))["on"](_0x2523a3(0x272), function () {
            return;
            const _0xf492f5 = map["getCenter"]();
            searchAddrFromCoords(_0xf492f5, async function (_0x385800, _0x48aab3) {
                const _0x3b635c = a39_0x57f5;
                if (_0x48aab3 === kakao[_0x3b635c(0x170)][_0x3b635c(0x1e6)][_0x3b635c(0x239)]["OK"]) {
                    const _0x39ae86 = _0x3b635c(0x20f),
                        _0x8a1811 = _0x3b635c(0x2bc);
                    for (var _0x21e79f = 0x0; _0x21e79f < _0x385800[_0x3b635c(0x2a9)]; _0x21e79f++) {
                        console[_0x3b635c(0x1e9)](_0x385800);
                        if (_0x385800[_0x21e79f][_0x3b635c(0x194)] == "B") {
                            let _0x3ca487 = _0x385800[_0x21e79f][_0x3b635c(0x2b3)];
                            _0x3ca487 = _0x3ca487[_0x3b635c(0x2aa)](0x0, 0x5);
                            const _0x50c971 = await callApi("POST", _0x39ae86, { lawd_cd: _0x3ca487, deal_ymd: _0x8a1811 });
                            if (_0x50c971["success"] && _0x50c971[_0x3b635c(0x201)]) {
                                const _0x27c976 = document[_0x3b635c(0x241)]("a");
                                (_0x27c976[_0x3b635c(0x220)] = _0x50c971["file_path"]), (_0x27c976[_0x3b635c(0x288)] = "land_trade_data.csv"), document[_0x3b635c(0x1d7)][_0x3b635c(0x1d9)](_0x27c976), _0x27c976[_0x3b635c(0x272)](), document[_0x3b635c(0x1d7)][_0x3b635c(0x2a6)](_0x27c976);
                            } else console["error"]("파일\x20생성에\x20실패했습니다.");
                            return;
                            if (_0x50c971[_0x3b635c(0x2b6)][_0x3b635c(0x2bd)] && _0x50c971[_0x3b635c(0x2b6)][_0x3b635c(0x2bd)] === "OK") {
                                const _0x2eed1b = _0x50c971[_0x3b635c(0x1d7)][_0x3b635c(0x18d)][_0x3b635c(0x164)];
                            }
                            break;
                        }
                    }
                }
            });
        }),
        $("#printBtn")["on"](_0x2523a3(0x272), function () {
            const _0x1591fc = _0x2523a3;
            return;
            const _0x2ec83d = map[_0x1591fc(0x1b5)]();
            searchAddrFromCoords(_0x2ec83d, async function (_0x86c78a, _0x30f9bb) {
                const _0x5f031e = _0x1591fc;
                if (_0x30f9bb === kakao[_0x5f031e(0x170)][_0x5f031e(0x1e6)]["Status"]["OK"]) {
                    const _0x415c43 = _0x5f031e(0x196),
                        _0x476820 = _0x5f031e(0x2bc);
                    for (var _0x40ea60 = 0x0; _0x40ea60 < _0x86c78a[_0x5f031e(0x2a9)]; _0x40ea60++) {
                        console["log"](_0x86c78a);
                        if (_0x86c78a[_0x40ea60][_0x5f031e(0x194)] == "B") {
                            let _0x24912d = _0x86c78a[_0x40ea60]["code"];
                            _0x24912d = _0x24912d[_0x5f031e(0x2aa)](0x0, 0x5);
                            const _0x3762da = await callApi(_0x5f031e(0x167), _0x415c43, { lawd_cd: _0x24912d, deal_ymd: _0x476820 });
                            if (_0x3762da[_0x5f031e(0x2c8)] && _0x3762da["file_path"]) {
                                const _0x5f4d80 = document["createElement"]("a");
                                (_0x5f4d80[_0x5f031e(0x220)] = _0x3762da[_0x5f031e(0x201)]), (_0x5f4d80[_0x5f031e(0x288)] = _0x5f031e(0x189)), document["body"][_0x5f031e(0x1d9)](_0x5f4d80), _0x5f4d80[_0x5f031e(0x272)](), document[_0x5f031e(0x1d7)][_0x5f031e(0x2a6)](_0x5f4d80);
                            } else console["error"](_0x5f031e(0x1b2));
                            return;
                            if (_0x3762da["header"]["resultMsg"] && _0x3762da[_0x5f031e(0x2b6)][_0x5f031e(0x2bd)] === "OK") {
                                const _0x59c1c4 = _0x3762da[_0x5f031e(0x1d7)]["items"]["item"];
                            }
                            break;
                        }
                    }
                }
            });
        });
});
function initProj4() {
    const _0x3bd16c = a39_0x363e4a;
    proj4[_0x3bd16c(0x2c9)]("EPSG:5186", "+proj=tmerc\x20+lat_0=38\x20+lon_0=127\x20+k=1\x20+x_0=200000\x20+y_0=600000\x20+ellps=GRS80\x20+units=m\x20+no_defs"),
        proj4[_0x3bd16c(0x2c9)]("EPSG:5179", _0x3bd16c(0x223)),
        proj4[_0x3bd16c(0x2c9)](_0x3bd16c(0x24f), "+proj=tmerc\x20+lat_0=38\x20+lon_0=127\x20+k=1\x20+x_0=600000\x20+y_0=200000\x20+ellps=GRS80\x20+units=m\x20+no_defs"),
        proj4["defs"](_0x3bd16c(0x2c3), _0x3bd16c(0x2c1)),
        proj4[_0x3bd16c(0x2c9)]("EPSG:3857", _0x3bd16c(0x27e));
}
function handleMapEvents() {
    const _0x52791a = a39_0x363e4a;
    kakao["maps"]["event"][_0x52791a(0x277)](map, _0x52791a(0x287), async function () {
        const _0x23e95c = _0x52791a,
            _0x9fb711 = map[_0x23e95c(0x1ed)]();
        let _0x395eb8 = 0x0;
        if (_0x9fb711 > 0x5) return;
        if (_0x9fb711 == 0x5) _0x395eb8 = 0x9c4;
        else {
            if (_0x9fb711 == 0x4) _0x395eb8 = 0x514;
            else {
                if (_0x9fb711 == 0x3) _0x395eb8 = 0x2bc;
                else {
                    if (_0x9fb711 == 0x2) _0x395eb8 = 0x12c;
                    else {
                        if (_0x9fb711 == 0x1) _0x395eb8 = 0xa0;
                    }
                }
            }
        }
        const _0x4643b3 = map[_0x23e95c(0x1b5)](),
            _0x3f1c90 = _0x4643b3[_0x23e95c(0x206)](),
            _0x5aa638 = _0x4643b3["getLng"]();
        updateURL({ curLat: _0x3f1c90, curLng: _0x5aa638 });
        let _0x4c87a7 = _0x23e95c(0x29f) + _0x5aa638 + "\x20" + _0x3f1c90 + ")";
    }),
        kakao[_0x52791a(0x170)]["event"][_0x52791a(0x277)](map, _0x52791a(0x286), async function () {
            const _0x4a9f3d = _0x52791a;
            realPriceOverlays[_0x4a9f3d(0x278)]((_0x9e84e7) => _0x9e84e7[_0x4a9f3d(0x1c4)](null)), (realPriceOverlays = []), Object[_0x4a9f3d(0x25a)](clusterersByType)[_0x4a9f3d(0x278)]((_0x4917bf) => _0x4917bf[_0x4a9f3d(0x255)]());
            const _0xb072cc = map["getCenter"](),
                _0x27c511 = map[_0x4a9f3d(0x1ed)]();
            console["log"](_0x4a9f3d(0x1df), _0x27c511), updateURL({ curZoom: _0x27c511 });
        }),
        kakao[_0x52791a(0x170)][_0x52791a(0x1cf)]["addListener"](map, _0x52791a(0x2a2), async function (_0x141dd6) {}),
        kakao[_0x52791a(0x170)]["event"][_0x52791a(0x277)](map, _0x52791a(0x272), async function (_0x31238f) {
            const _0x52e1ad = _0x52791a;
            if ($(_0x52e1ad(0x26f))[_0x52e1ad(0x299)](_0x52e1ad(0x197))) return;
            if ($(_0x52e1ad(0x1c8))[_0x52e1ad(0x299)](_0x52e1ad(0x197))) return;
            const _0x110680 = _0x31238f[_0x52e1ad(0x1c5)]["Ma"],
                _0x50fa86 = _0x31238f[_0x52e1ad(0x1c5)]["La"],
                _0x1c37a7 = { lat: _0x110680, lng: _0x50fa86 };
            updateURL({ curLat: _0x110680, curLng: _0x50fa86 });
            const _0x1af837 = map["getLevel"]();
            _0x1af837 < 0x6 && (handleMapClick(_0x1c37a7), searchArroundPlaces(_0x1c37a7)),
                searchDetailAddrFromCoords(_0x31238f[_0x52e1ad(0x1c5)], function (_0x10dd8f, _0x3e0d38) {
                    const _0x1fd8dd = _0x52e1ad;
                    if (_0x3e0d38 === kakao["maps"][_0x1fd8dd(0x1e6)]["Status"]["OK"]) {
                        const _0x12cc6c = _0x10dd8f[0x0][_0x1fd8dd(0x1fa)];
                        realPriceDetailLand(_0x1fd8dd(0x214), _0x12cc6c);
                    }
                    displayAddressInfo(_0x10dd8f, _0x3e0d38);
                });
        }),
        kakao["maps"][_0x52791a(0x1cf)]["addListener"](map, _0x52791a(0x26c), async function () {
            const _0x58e051 = _0x52791a,
                _0x48cd91 = map["getCenter"](),
                _0x652b1f = map[_0x58e051(0x1ed)]();
            if (_0x652b1f > 0x6) return;
            geocoder["coord2RegionCode"](_0x48cd91[_0x58e051(0x19b)](), _0x48cd91[_0x58e051(0x206)](), function (_0x177729, _0x271c1e) {
                const _0x32d219 = _0x58e051;
                if (_0x271c1e === kakao[_0x32d219(0x170)][_0x32d219(0x1e6)][_0x32d219(0x239)]["OK"]) {
                    let _0x2fcf9f = _0x177729[0x0][_0x32d219(0x2b3)][_0x32d219(0x2aa)](0x0, 0xa);
                    if (_0x652b1f <= "3") {
                    } else {
                        if (_0x652b1f == "4") _0x2fcf9f = _0x177729[0x0][_0x32d219(0x2b3)][_0x32d219(0x2aa)](0x0, 0xa);
                        else {
                            if (_0x652b1f == "5") _0x2fcf9f = _0x177729[0x0]["code"][_0x32d219(0x2aa)](0x0, 0xa);
                            else {
                                if (_0x652b1f == "6") _0x2fcf9f = _0x177729[0x0][_0x32d219(0x2b3)][_0x32d219(0x2aa)](0x0, 0x8);
                                else {
                                    if (_0x652b1f > "6" && _0x652b1f < "9") _0x2fcf9f = _0x177729[0x0][_0x32d219(0x2b3)][_0x32d219(0x2aa)](0x0, 0x5);
                                    else _0x652b1f >= "9" && (_0x2fcf9f = _0x177729[0x0][_0x32d219(0x2b3)][_0x32d219(0x2aa)](0x0, 0x2));
                                }
                            }
                        }
                    }
                    realPriceApt(_0x2fcf9f);
                }
            });
        });
}
function groundOverlayFunc() {
    const _0x137041 = a39_0x363e4a;
    function _0xcfaa84(_0x595d3f, _0x4f5d06) {
        const _0x57681f = a39_0x57f5;
        this[_0x57681f(0x1d5)] = _0x595d3f;
        var _0x585fee = (this["node"] = document[_0x57681f(0x241)]("div"));
        (_0x585fee[_0x57681f(0x172)][_0x57681f(0x1bb)] = _0x57681f(0x16a)), (_0x585fee[_0x57681f(0x172)][_0x57681f(0x1e8)] = _0x57681f(0x1a5)), (_0x585fee[_0x57681f(0x172)]["zIndex"] = "10");
        var _0x2de154 = (this[_0x57681f(0x21e)] = document[_0x57681f(0x241)](_0x57681f(0x21e)));
        (_0x2de154[_0x57681f(0x250)] = _0x57681f(0x246)), (_0x2de154["src"] = _0x4f5d06), (_0x2de154["style"][_0x57681f(0x1c2)] = _0x57681f(0x24c)), (_0x2de154[_0x57681f(0x172)]["height"] = _0x57681f(0x24c)), (_0x2de154["style"][_0x57681f(0x208)] = "10"), _0x585fee["appendChild"](_0x2de154);
    }
    (_0xcfaa84["prototype"] = Object[_0x137041(0x275)](kakao[_0x137041(0x170)][_0x137041(0x17c)][_0x137041(0x165)])),
        (_0xcfaa84[_0x137041(0x165)][_0x137041(0x171)] = _0xcfaa84),
        (_0xcfaa84[_0x137041(0x165)][_0x137041(0x19d)] = function () {
            const _0x183e00 = _0x137041;
            var _0x189228 = this[_0x183e00(0x1ba)]()[_0x183e00(0x1e7)];
            _0x189228[_0x183e00(0x1d9)](this[_0x183e00(0x233)]);
        }),
        (_0xcfaa84[_0x137041(0x165)][_0x137041(0x237)] = function () {
            const _0x113076 = _0x137041;
            var _0x46ae76 = this["getProjection"](),
                _0x4cd40d = _0x46ae76[_0x113076(0x1d2)](this[_0x113076(0x1d5)]["getNorthEast"]()),
                _0x212a25 = _0x46ae76[_0x113076(0x1d2)](this[_0x113076(0x1d5)]["getSouthWest"]()),
                _0x60398c = Math[_0x113076(0x2c4)](_0x212a25["x"], _0x4cd40d["x"]),
                _0x5c5c96 = Math["min"](_0x212a25["y"], _0x4cd40d["y"]),
                _0x530815 = Math[_0x113076(0x24b)](_0x212a25["x"], _0x4cd40d["x"]),
                _0x44a08e = Math[_0x113076(0x24b)](_0x212a25["y"], _0x4cd40d["y"]),
                _0x4e627b = _0x4cd40d["x"] - _0x212a25["x"],
                _0x4b5ba6 = _0x212a25["y"] - _0x4cd40d["y"];
            (this[_0x113076(0x233)]["style"]["left"] = _0x60398c + "px"), (this["node"][_0x113076(0x172)][_0x113076(0x176)] = _0x5c5c96 + "px"), (this["node"][_0x113076(0x172)][_0x113076(0x1c2)] = _0x4e627b + "px"), (this[_0x113076(0x233)][_0x113076(0x172)][_0x113076(0x1d3)] = _0x4b5ba6 + "px");
        }),
        (_0xcfaa84[_0x137041(0x165)][_0x137041(0x16b)] = function () {
            const _0xb6d465 = _0x137041;
            this["node"][_0xb6d465(0x23b)] && this[_0xb6d465(0x233)][_0xb6d465(0x23b)][_0xb6d465(0x2a6)](this[_0xb6d465(0x233)]);
        });
}
function getNonOverlappingBounds(_0x2def64, _0x4ea059) {
    const _0xd676cc = a39_0x363e4a;
    console[_0xd676cc(0x1e9)](_0x2def64), console["log"](_0x4ea059);
    const _0x1795ff = [],
        _0x5def82 = { lat: _0x2def64["qa"], lng: _0x2def64["ha"] },
        _0x374117 = { lat: _0x2def64["pa"], lng: _0x2def64["oa"] },
        _0x138f71 = { lat: _0x4ea059["qa"], lng: _0x4ea059["ha"] },
        _0x33a058 = { lat: _0x4ea059["pa"], lng: _0x4ea059["oa"] };
    console[_0xd676cc(0x1e9)](_0xd676cc(0x1c6), _0x5def82[_0xd676cc(0x1fe)], _0x5def82[_0xd676cc(0x25d)]),
        console[_0xd676cc(0x1e9)](_0xd676cc(0x253), _0x374117["lat"], _0x374117[_0xd676cc(0x25d)]),
        console[_0xd676cc(0x1e9)](_0xd676cc(0x245), _0x138f71[_0xd676cc(0x1fe)], _0x138f71[_0xd676cc(0x25d)]),
        console[_0xd676cc(0x1e9)]("boundsB\x20NorthEast:", _0x33a058[_0xd676cc(0x1fe)], _0x33a058[_0xd676cc(0x25d)]);
    if (_0x138f71[_0xd676cc(0x1fe)] > _0x5def82[_0xd676cc(0x1fe)]) {
        const _0x39f38e = new kakao["maps"][_0xd676cc(0x1cb)](new kakao[_0xd676cc(0x170)][_0xd676cc(0x16c)](_0x5def82[_0xd676cc(0x1fe)], _0x5def82[_0xd676cc(0x25d)]), new kakao[_0xd676cc(0x170)][_0xd676cc(0x16c)](_0x138f71[_0xd676cc(0x1fe)], _0x374117[_0xd676cc(0x25d)]));
        _0x1795ff["push"](_0x39f38e);
    }
    if (_0x33a058["lat"] < _0x374117[_0xd676cc(0x1fe)]) {
        const _0x580cac = new kakao[_0xd676cc(0x170)][_0xd676cc(0x1cb)](new kakao["maps"][_0xd676cc(0x16c)](_0x33a058["lat"], _0x5def82[_0xd676cc(0x25d)]), new kakao["maps"][_0xd676cc(0x16c)](_0x374117[_0xd676cc(0x1fe)], _0x374117[_0xd676cc(0x25d)]));
        _0x1795ff[_0xd676cc(0x200)](_0x580cac);
    }
    if (_0x138f71[_0xd676cc(0x25d)] > _0x5def82["lng"]) {
        const _0x3c89e9 = new kakao["maps"][_0xd676cc(0x1cb)](new kakao["maps"][_0xd676cc(0x16c)](_0x5def82[_0xd676cc(0x1fe)], _0x5def82["lng"]), new kakao[_0xd676cc(0x170)][_0xd676cc(0x16c)](_0x374117[_0xd676cc(0x1fe)], _0x138f71[_0xd676cc(0x25d)]));
        _0x1795ff[_0xd676cc(0x200)](_0x3c89e9);
    }
    if (_0x33a058[_0xd676cc(0x25d)] < _0x374117[_0xd676cc(0x25d)]) {
        const _0x1022d1 = new kakao["maps"][_0xd676cc(0x1cb)](new kakao[_0xd676cc(0x170)]["LatLng"](_0x5def82[_0xd676cc(0x1fe)], _0x33a058[_0xd676cc(0x25d)]), new kakao["maps"][_0xd676cc(0x16c)](_0x374117[_0xd676cc(0x1fe)], _0x374117[_0xd676cc(0x25d)]));
        _0x1795ff["push"](_0x1022d1);
    }
    return _0x1795ff;
}
function boundsIntersects(_0x3ca8d0, _0x5e95c5) {
    const _0x2a8981 = a39_0x363e4a,
        _0x385614 = !(
            _0x3ca8d0[_0x2a8981(0x2ab)]()[_0x2a8981(0x206)]() < _0x5e95c5[_0x2a8981(0x1f1)]()[_0x2a8981(0x206)]() ||
            _0x3ca8d0[_0x2a8981(0x1f1)]()[_0x2a8981(0x206)]() > _0x5e95c5["getNorthEast"]()["getLat"]() ||
            _0x3ca8d0[_0x2a8981(0x2ab)]()[_0x2a8981(0x19b)]() < _0x5e95c5["getSouthWest"]()["getLng"]() ||
            _0x3ca8d0[_0x2a8981(0x1f1)]()["getLng"]() > _0x5e95c5[_0x2a8981(0x2ab)]()["getLng"]()
        );
    return console[_0x2a8981(0x1e9)](_0x2a8981(0x243), _0x385614), _0x385614;
}
function updateOverlay() {
    const _0x387e47 = a39_0x363e4a;
    function _0x375964(_0x1e513c, _0x12c97c) {
        const _0x473d64 = a39_0x57f5;
        this[_0x473d64(0x1d5)] = _0x1e513c;
        var _0x1fcdbb = (this["node"] = document["createElement"]("div"));
        (_0x1fcdbb[_0x473d64(0x172)][_0x473d64(0x1bb)] = "absolute"), (_0x1fcdbb["style"][_0x473d64(0x1e8)] = "none"), (_0x1fcdbb[_0x473d64(0x172)]["zIndex"] = "10");
        var _0x10ddf3 = (this[_0x473d64(0x21e)] = document["createElement"](_0x473d64(0x21e)));
        (_0x10ddf3[_0x473d64(0x250)] = _0x473d64(0x246)),
            (_0x10ddf3["src"] = _0x12c97c),
            (_0x10ddf3[_0x473d64(0x172)][_0x473d64(0x1c2)] = _0x473d64(0x24c)),
            (_0x10ddf3["style"][_0x473d64(0x1d3)] = _0x473d64(0x24c)),
            (_0x10ddf3[_0x473d64(0x172)][_0x473d64(0x208)] = "10"),
            _0x1fcdbb["appendChild"](_0x10ddf3);
    }
    (_0x375964[_0x387e47(0x165)] = Object[_0x387e47(0x275)](kakao["maps"][_0x387e47(0x17c)][_0x387e47(0x165)])),
        (_0x375964[_0x387e47(0x165)]["constructor"] = _0x375964),
        (_0x375964[_0x387e47(0x165)][_0x387e47(0x19d)] = function () {
            const _0x227f35 = _0x387e47;
            var _0x5a9814 = this[_0x227f35(0x1ba)]()[_0x227f35(0x1e7)];
            _0x5a9814[_0x227f35(0x1d9)](this[_0x227f35(0x233)]);
        }),
        (_0x375964[_0x387e47(0x165)][_0x387e47(0x237)] = function () {
            const _0x580b10 = _0x387e47;
            var _0x319585 = this[_0x580b10(0x219)](),
                _0x3a1c89 = _0x319585[_0x580b10(0x1d2)](this[_0x580b10(0x1d5)]["getNorthEast"]()),
                _0x19a78c = _0x319585[_0x580b10(0x1d2)](this[_0x580b10(0x1d5)][_0x580b10(0x1f1)]()),
                _0x3eadca = Math[_0x580b10(0x2c4)](_0x19a78c["x"], _0x3a1c89["x"]),
                _0x38fc25 = Math[_0x580b10(0x2c4)](_0x19a78c["y"], _0x3a1c89["y"]),
                _0x138218 = Math["max"](_0x19a78c["x"], _0x3a1c89["x"]),
                _0x47e38d = Math["max"](_0x19a78c["y"], _0x3a1c89["y"]),
                _0x10a09f = _0x3a1c89["x"] - _0x19a78c["x"],
                _0x228d4d = _0x19a78c["y"] - _0x3a1c89["y"];
            (this[_0x580b10(0x233)][_0x580b10(0x172)][_0x580b10(0x22d)] = _0x3eadca + "px"), (this["node"][_0x580b10(0x172)][_0x580b10(0x176)] = _0x38fc25 + "px"), (this["node"][_0x580b10(0x172)]["width"] = _0x10a09f + "px"), (this["node"]["style"][_0x580b10(0x1d3)] = _0x228d4d + "px");
        }),
        (_0x375964[_0x387e47(0x165)][_0x387e47(0x16b)] = function () {
            const _0x450873 = _0x387e47;
            this[_0x450873(0x233)]["parentNode"] && this[_0x450873(0x233)]["parentNode"][_0x450873(0x2a6)](this[_0x450873(0x233)]);
        });
    var _0x5599a3 = map["getBounds"](),
        _0xe85bc2 = _0x5599a3[_0x387e47(0x1f1)](),
        _0x4658bd = _0x5599a3[_0x387e47(0x2ab)]();
    const _0x593943 = proj4(_0x387e47(0x1fb), _0x387e47(0x199), [_0xe85bc2[_0x387e47(0x19b)](), _0xe85bc2[_0x387e47(0x206)]()]),
        _0x6c4d2 = proj4(_0x387e47(0x1fb), _0x387e47(0x199), [_0x4658bd[_0x387e47(0x19b)](), _0x4658bd[_0x387e47(0x206)]()]),
        _0x5c079d = [_0x593943[0x0], _0x593943[0x1], _0x6c4d2[0x0], _0x6c4d2[0x1]],
        _0x12d7a8 = document["getElementById"](_0x387e47(0x229)),
        _0x2e0917 = _0x12d7a8[_0x387e47(0x244)],
        _0x3f6008 = _0x12d7a8[_0x387e47(0x20e)],
        _0x5d06a2 = _0x387e47(0x26e),
        _0x2d8b40 = { bbox: JSON["stringify"](_0x5c079d), width: _0x2e0917, height: _0x3f6008 };
    function _0x208283(_0xfd953d, _0x1335b8) {
        const _0x55249c = _0x387e47,
            _0x17fcd8 = _0xfd953d[_0x55249c(0x1f1)](),
            _0x257c9c = _0xfd953d["getNorthEast"](),
            _0x2a1fc6 = _0x1335b8[_0x55249c(0x1f1)](),
            _0x1bf1db = _0x1335b8[_0x55249c(0x2ab)](),
            _0x195ceb = new kakao[_0x55249c(0x170)][_0x55249c(0x16c)](Math[_0x55249c(0x2c4)](_0x17fcd8[_0x55249c(0x206)](), _0x2a1fc6[_0x55249c(0x206)]()), Math[_0x55249c(0x2c4)](_0x17fcd8[_0x55249c(0x19b)](), _0x2a1fc6["getLng"]())),
            _0x1e8651 = new kakao["maps"]["LatLng"](Math[_0x55249c(0x24b)](_0x257c9c[_0x55249c(0x206)](), _0x1bf1db[_0x55249c(0x206)]()), Math[_0x55249c(0x24b)](_0x257c9c[_0x55249c(0x19b)](), _0x1bf1db[_0x55249c(0x19b)]()));
        return new kakao["maps"][_0x55249c(0x1cb)](_0x195ceb, _0x1e8651);
    }
    callApiBlob(_0x387e47(0x167), _0x5d06a2, _0x2d8b40)
        [_0x387e47(0x269)]((_0x5973be) => {
            const _0x25afe9 = _0x387e47;
            if (_0x5973be) {
                const _0x422db7 = URL[_0x25afe9(0x2ad)](_0x5973be),
                    _0x2be945 = new kakao[_0x25afe9(0x170)][_0x25afe9(0x16c)](_0xe85bc2[_0x25afe9(0x206)](), _0xe85bc2[_0x25afe9(0x19b)]()),
                    _0x1befe4 = new kakao[_0x25afe9(0x170)][_0x25afe9(0x16c)](_0x4658bd["getLat"](), _0x4658bd[_0x25afe9(0x19b)]()),
                    _0x2144c5 = new kakao[_0x25afe9(0x170)][_0x25afe9(0x1cb)](_0x2be945, _0x1befe4);
                currentOverlay && currentOverlay[_0x25afe9(0x1c4)](null),
                    (currentOverlay = new _0x375964(_0x2144c5, _0x422db7)),
                    currentOverlay[_0x25afe9(0x1c4)](map),
                    _0x12d7a8[_0x25afe9(0x249)]("load", () => {
                        const _0x586371 = _0x25afe9;
                        URL[_0x586371(0x175)](_0x422db7);
                    });
            } else console["error"](_0x25afe9(0x212));
        })
        [_0x387e47(0x173)]((_0xf04113) => {
            console["error"]("API\x20요청\x20중\x20오류\x20발생:", _0xf04113);
        });
}
async function getEcologyWMSTileLayer() {
    const _0x55fe76 = a39_0x363e4a;
    let _0x4567d1 = [],
        _0x5a12f6 = ![];
    function _0x5e6949(_0x2df0eb, _0x1d5a6e, _0xc3bf0b) {
        return new Promise((_0x5482ba, _0x390aa4) => {
            const _0x28c792 = a39_0x57f5;
            $[_0x28c792(0x18e)]({
                type: _0x2df0eb,
                url: _0x1d5a6e,
                data: _0xc3bf0b,
                xhrFields: { responseType: _0x28c792(0x1b3) },
                success: function (_0x4b693a) {
                    _0x5482ba(_0x4b693a);
                },
                error: function (_0x4b96bb, _0x2d8b32, _0x470b0e) {
                    const _0x3c1224 = _0x28c792;
                    console[_0x3c1224(0x1bd)]("API\x20호출\x20중\x20오류\x20발생:", _0x470b0e), _0x390aa4(_0x470b0e);
                },
            });
        });
    }
    async function _0x25dfc3() {
        const _0x1d7839 = a39_0x57f5;
        if (!_0x5a12f6 && _0x4567d1[_0x1d7839(0x2a9)] > 0x0) {
            _0x5a12f6 = !![];
            const { x: _0x390b12, y: _0x19f1ae, z: _0x341049, bbox: _0x23a33b, div: _0x2aba1d } = _0x4567d1["shift"]();
            try {
                const _0x14b8cb = _0x1d7839(0x26e),
                    _0x303e80 = { bbox: JSON[_0x1d7839(0x1e4)](_0x23a33b), width: _0x1d7839(0x263), height: "256" },
                    _0x42d03c = await _0x5e6949("POST", _0x14b8cb, _0x303e80);
                if (_0x42d03c) {
                    const _0x3a2b51 = URL["createObjectURL"](_0x42d03c);
                    (_0x2aba1d["style"][_0x1d7839(0x2a8)] = _0x1d7839(0x1f5) + _0x3a2b51 + ")"),
                        (_0x2aba1d[_0x1d7839(0x172)][_0x1d7839(0x26d)] = _0x1d7839(0x29e)),
                        (_0x2aba1d[_0x1d7839(0x172)][_0x1d7839(0x16e)] = _0x1d7839(0x20a)),
                        (_0x2aba1d[_0x1d7839(0x172)][_0x1d7839(0x27b)] = "1px\x20dashed\x20#ff5050"),
                        _0x2aba1d[_0x1d7839(0x249)](_0x1d7839(0x205), () => {
                            URL["revokeObjectURL"](_0x3a2b51);
                        });
                } else console[_0x1d7839(0x1bd)](_0x1d7839(0x212));
            } catch (_0x215d61) {
                console[_0x1d7839(0x1bd)](_0x1d7839(0x1e2), _0x215d61);
            } finally {
                (_0x5a12f6 = ![]), _0x25dfc3();
            }
        }
    }
    var _0x2ff172 = 0x100,
        _0x10279e = 0x100;
    kakao[_0x55fe76(0x170)][_0x55fe76(0x19a)]["add"](
        _0x55fe76(0x1e0),
        new kakao[_0x55fe76(0x170)][_0x55fe76(0x19a)]({
            width: _0x2ff172,
            height: _0x10279e,
            getTile: function (_0x45f568, _0x5cb213, _0x4aaa96) {
                const _0x83deae = _0x55fe76;
                let _0x493f78 = document[_0x83deae(0x241)]("img");
                const _0x900ab7 = map[_0x83deae(0x1ed)]();
                if (_0x900ab7 >= 0xa) return _0x493f78;
                var _0x415fd8 = Math[_0x83deae(0x298)](0x2, _0x4aaa96 - 0x3),
                    _0x452024 = _0x45f568 * _0x415fd8 * _0x2ff172 - 0x7530,
                    _0x5da026 = (_0x5cb213 + 0x1) * _0x415fd8 * _0x10279e - 0xea60,
                    _0x3719e7 = (_0x45f568 + 0x1) * _0x415fd8 * _0x2ff172 - 0x7530,
                    _0x580ac0 = _0x5cb213 * _0x415fd8 * _0x10279e - 0xea60,
                    _0x39d739 = proj4(_0x83deae(0x271), _0x83deae(0x199), [_0x452024, _0x5da026]),
                    _0x5f14a5 = proj4(_0x83deae(0x271), _0x83deae(0x1fb), [_0x452024, _0x5da026]),
                    _0x15abc4 = proj4(_0x83deae(0x1fb), _0x83deae(0x199), [_0x5f14a5[0x0], _0x5f14a5[0x1]]),
                    _0x373702 = proj4("EPSG:5179", _0x83deae(0x199), [_0x3719e7, _0x580ac0]),
                    _0x24b15f = _0x39d739[0x0],
                    _0x4f4f18 = Math[_0x83deae(0x2c4)](_0x39d739[0x1], _0x373702[0x1]),
                    _0x5db6f9 = _0x373702[0x0],
                    _0x52dd07 = Math["max"](_0x39d739[0x1], _0x373702[0x1]);
                const _0x56fa5a = [_0x24b15f, _0x4f4f18, _0x5db6f9, _0x52dd07],
                    _0x2197ed =
                        "https://www.nie-ecobank.kr/ecoapi/EcologyzmpService/wms/getEcologyzmpWMS?serviceKey=mrknXy75DM9ok9NXMGZaqQBEBGUSqN9nJJ2d/zbUbR0VpNYgkDCTE6f2QpDxRSyS3bcMRkfdEZ+rOrJoDP7XrA==&layers=tbl_opn_eczm&srs=EPSG%3A5186&bbox=" +
                        encodeURIComponent(_0x56fa5a) +
                        _0x83deae(0x274) +
                        _0x2ff172 +
                        "&height=" +
                        _0x10279e +
                        _0x83deae(0x24d);
                _0x493f78[_0x83deae(0x1ac)] = _0x2197ed;
                return _0x493f78;
                const _0x13dacc = _0x83deae(0x26e),
                    _0x45240b = { bbox: JSON[_0x83deae(0x1e4)](_0x56fa5a), width: _0x83deae(0x263), height: _0x83deae(0x263) };
                return _0x4567d1[_0x83deae(0x200)]({ x: _0x45f568, y: _0x5cb213, z: _0x4aaa96, bbox: _0x56fa5a, div: _0x493f78 }), _0x25dfc3(), _0x493f78;
            },
        })
    ),
        map[_0x55fe76(0x1b7)](kakao[_0x55fe76(0x170)]["MapTypeId"][_0x55fe76(0x1e0)]);
    return;
    var _0x254162 = map["getBounds"](),
        _0x1834e9 = _0x254162[_0x55fe76(0x1f1)](),
        _0x414315 = _0x254162[_0x55fe76(0x2ab)]();
    console[_0x55fe76(0x1e9)](_0x1834e9), console[_0x55fe76(0x1e9)](_0x414315);
    function _0x39a388(_0x477d82, _0x338132) {
        const _0x259a46 = _0x55fe76;
        this["bounds"] = _0x477d82;
        var _0x25c747 = (this["node"] = document[_0x259a46(0x241)](_0x259a46(0x2a1)));
        (_0x25c747["style"][_0x259a46(0x1bb)] = "absolute"), (_0x25c747[_0x259a46(0x172)][_0x259a46(0x1e8)] = "none"), (_0x25c747[_0x259a46(0x172)][_0x259a46(0x208)] = "10");
        var _0x64c181 = (this[_0x259a46(0x21e)] = document["createElement"](_0x259a46(0x21e)));
        (_0x64c181[_0x259a46(0x250)] = _0x259a46(0x246)),
            (_0x64c181[_0x259a46(0x1ac)] = _0x338132),
            (_0x64c181[_0x259a46(0x172)][_0x259a46(0x1c2)] = _0x259a46(0x24c)),
            (_0x64c181[_0x259a46(0x172)][_0x259a46(0x1d3)] = "100%"),
            (_0x64c181["style"][_0x259a46(0x208)] = "10"),
            _0x25c747[_0x259a46(0x1d9)](_0x64c181);
    }
    (_0x39a388[_0x55fe76(0x165)] = Object[_0x55fe76(0x275)](kakao[_0x55fe76(0x170)][_0x55fe76(0x17c)][_0x55fe76(0x165)])),
        (_0x39a388[_0x55fe76(0x165)][_0x55fe76(0x171)] = _0x39a388),
        (_0x39a388[_0x55fe76(0x165)][_0x55fe76(0x19d)] = function () {
            const _0x1220ee = _0x55fe76;
            var _0x358a50 = this["getPanels"]()[_0x1220ee(0x1e7)];
            _0x358a50[_0x1220ee(0x1d9)](this[_0x1220ee(0x233)]);
        }),
        (_0x39a388[_0x55fe76(0x165)][_0x55fe76(0x237)] = function () {
            const _0x5dac79 = _0x55fe76;
            var _0x7220bf = this[_0x5dac79(0x219)](),
                _0x1ead29 = _0x7220bf[_0x5dac79(0x1d2)](this[_0x5dac79(0x1d5)][_0x5dac79(0x2ab)]()),
                _0x10a590 = _0x7220bf[_0x5dac79(0x1d2)](this[_0x5dac79(0x1d5)][_0x5dac79(0x1f1)]()),
                _0x12b4cc = Math[_0x5dac79(0x2c4)](_0x10a590["x"], _0x1ead29["x"]),
                _0x4c8b23 = Math[_0x5dac79(0x2c4)](_0x10a590["y"], _0x1ead29["y"]),
                _0x21797f = Math[_0x5dac79(0x24b)](_0x10a590["x"], _0x1ead29["x"]),
                _0xc95218 = Math["max"](_0x10a590["y"], _0x1ead29["y"]),
                _0x9aac55 = _0x1ead29["x"] - _0x10a590["x"],
                _0x5b6e42 = _0x10a590["y"] - _0x1ead29["y"];
            (this[_0x5dac79(0x233)][_0x5dac79(0x172)][_0x5dac79(0x22d)] = _0x12b4cc + "px"),
                (this[_0x5dac79(0x233)][_0x5dac79(0x172)][_0x5dac79(0x176)] = _0x4c8b23 + "px"),
                (this["node"]["style"]["width"] = _0x9aac55 + "px"),
                (this[_0x5dac79(0x233)][_0x5dac79(0x172)]["height"] = _0x5b6e42 + "px"),
                console[_0x5dac79(0x1e9)]("sw:", _0x10a590["x"], _0x10a590["y"]),
                console[_0x5dac79(0x1e9)](_0x5dac79(0x266), _0x1ead29["x"], _0x1ead29["y"]),
                console["log"](_0x5dac79(0x2bf), _0x9aac55, _0x5dac79(0x258), _0x5b6e42);
        }),
        (_0x39a388["prototype"][_0x55fe76(0x16b)] = function () {
            const _0x27f992 = _0x55fe76;
            this[_0x27f992(0x233)]["parentNode"] && this[_0x27f992(0x233)][_0x27f992(0x23b)][_0x27f992(0x2a6)](this[_0x27f992(0x233)]);
        });
    const _0x3b8354 = proj4(_0x55fe76(0x1fb), "EPSG:5186", [_0x1834e9[_0x55fe76(0x19b)](), _0x1834e9[_0x55fe76(0x206)]()]),
        _0x3cc625 = proj4(_0x55fe76(0x1fb), "EPSG:5186", [_0x414315["getLng"](), _0x414315[_0x55fe76(0x206)]()]),
        _0x4b6807 = [_0x3b8354[0x0], _0x3b8354[0x1], _0x3cc625[0x0], _0x3cc625[0x1]];
    console[_0x55fe76(0x1e9)](_0x4b6807);
    const _0x3d4c1f = document[_0x55fe76(0x1c3)]("map_bg"),
        _0x150bbe = _0x3d4c1f[_0x55fe76(0x244)],
        _0x4cb3d9 = _0x3d4c1f[_0x55fe76(0x20e)],
        _0x49f01a = _0x55fe76(0x26e),
        _0x5146a0 = { bbox: JSON[_0x55fe76(0x1e4)](_0x4b6807), width: _0x150bbe, height: _0x4cb3d9 };
    _0x5e6949(_0x55fe76(0x167), _0x49f01a, _0x5146a0)
        [_0x55fe76(0x269)]((_0x5bb468) => {
            const _0x399e3b = _0x55fe76;
            if (_0x5bb468) {
                console["log"](_0x399e3b(0x25e), _0x5bb468);
                const _0x51ffed = URL[_0x399e3b(0x2ad)](_0x5bb468);
                console[_0x399e3b(0x1e9)](_0x51ffed);
                const _0x194831 = new kakao[_0x399e3b(0x170)][_0x399e3b(0x16c)](_0x1834e9[_0x399e3b(0x206)](), _0x1834e9[_0x399e3b(0x19b)]()),
                    _0x4ffcd8 = new kakao[_0x399e3b(0x170)][_0x399e3b(0x16c)](_0x414315[_0x399e3b(0x206)](), _0x414315[_0x399e3b(0x19b)]()),
                    _0x1ddce4 = new kakao[_0x399e3b(0x170)]["LatLngBounds"](_0x194831, _0x4ffcd8);
                console["log"](_0x1ddce4);
                const _0x16fa88 = new _0x39a388(_0x1ddce4, _0x51ffed);
                console[_0x399e3b(0x1e9)](_0x16fa88), _0x16fa88[_0x399e3b(0x1c4)](map);
                var _0x2d1ab9 = new kakao[_0x399e3b(0x170)][_0x399e3b(0x1db)]({ position: _0x194831, map: map }),
                    _0x4d1889 = new kakao[_0x399e3b(0x170)][_0x399e3b(0x1db)]({ position: _0x4ffcd8, map: map });
                _0x3d4c1f[_0x399e3b(0x249)]("load", () => {
                    URL["revokeObjectURL"](_0x51ffed);
                });
            } else console["error"](_0x399e3b(0x212));
        })
        [_0x55fe76(0x173)]((_0x596b90) => {
            const _0x390c68 = _0x55fe76;
            console[_0x390c68(0x1bd)](_0x390c68(0x1e2), _0x596b90);
        });
    return;
    var _0x6a4c0d = new kakao[_0x55fe76(0x170)][_0x55fe76(0x17b)]({ map: map, content: _0x55fe76(0x276) + imageUrl + "\x22\x20style=\x22opacity:0.7;\x22>", position: sw, xAnchor: 0x0, yAnchor: 0x0 });
    function _0x2178f8(_0xfe1ea3) {
        const _0x281a87 = _0x55fe76,
            [_0x30541e, _0x407c9a, _0x3a0b46, _0x561f49] = _0xfe1ea3,
            _0x3281f0 = proj4("EPSG:3857", "EPSG:4326", [_0x30541e, _0x407c9a]),
            _0x20931f = proj4("EPSG:3857", _0x281a87(0x1fb), [_0x3a0b46, _0x561f49]);
        return [_0x3281f0[0x0], _0x3281f0[0x1], _0x20931f[0x0], _0x20931f[0x1]];
    }
    function _0xd7262d() {
        const _0x4cb48c = _0x55fe76;
        var _0x218300 = map[_0x4cb48c(0x219)](),
            _0x5ce7d1 = _0x218300["pointFromCoords"](sw),
            _0x2706e4 = _0x218300["pointFromCoords"](ne),
            _0x55faa8 = _0x2706e4["x"] - _0x5ce7d1["x"],
            _0xc7aa70 = _0x5ce7d1["y"] - _0x2706e4["y"],
            _0x4236ce = _0x6a4c0d[_0x4cb48c(0x2bb)]();
        console[_0x4cb48c(0x1e9)](_0x4236ce);
        return;
        (_0x4236ce["style"]["position"] = "absolute"),
            (_0x4236ce[_0x4cb48c(0x172)]["left"] = _0x5ce7d1["x"] + "px"),
            (_0x4236ce[_0x4cb48c(0x172)]["top"] = _0x2706e4["y"] + "px"),
            (_0x4236ce[_0x4cb48c(0x172)][_0x4cb48c(0x1c2)] = _0x55faa8 + "px"),
            (_0x4236ce["style"][_0x4cb48c(0x1d3)] = _0xc7aa70 + "px"),
            (_0x4236ce[_0x4cb48c(0x172)][_0x4cb48c(0x1e8)] = _0x4cb48c(0x1a5));
    }
    _0xd7262d();
}
function removeEcologyWMSTileLayer() {
    const _0x22fa52 = a39_0x363e4a;
    map[_0x22fa52(0x222)](kakao[_0x22fa52(0x170)][_0x22fa52(0x1f8)][_0x22fa52(0x1e0)]);
}
async function ecologyMap(_0x17e1b0, _0x52ade0, _0x4cf988) {
    const _0x2cebca = a39_0x363e4a;
    !isMultiSelectMode && (analysisPolygonArray[_0x2cebca(0x278)]((_0x5e2fff) => _0x5e2fff[_0x2cebca(0x1c4)](null)), (analysisPolygonArray = []));
    $(_0x2cebca(0x1a9))["empty"](), $(_0x2cebca(0x26b))[_0x2cebca(0x1ab)](), $(_0x2cebca(0x29d))[_0x2cebca(0x1ab)](), $(_0x2cebca(0x235))[_0x2cebca(0x1ab)]();
    const _0x2a7f8e = _0x2cebca(0x28f),
        _0x14833a = { pnu: _0x17e1b0, bbox: _0x52ade0 },
        _0x3a1515 = await callApi(_0x2cebca(0x167), _0x2a7f8e, _0x14833a, _0x2cebca(0x280)),
        _0x20b437 = [];
    let _0x1268f7 = {},
        _0x37aca = null;
    return (
        $[_0x2cebca(0x2c6)](_0x3a1515, function (_0x22f8e8, _0x414c02) {
            const _0x5532b0 = _0x2cebca;
            if (_0x414c02[_0x5532b0(0x1bd)]) return $("#modalAlert")["iziModal"](_0x5532b0(0x2b2)), $(_0x5532b0(0x279))[_0x5532b0(0x16f)](_0x5532b0(0x28a)), ![];
            let _0x20f3fd = _0x414c02[_0x5532b0(0x217)];
            if (!_0x20f3fd) return;
            _0x20f3fd = Array[_0x5532b0(0x296)](_0x20f3fd) ? _0x20f3fd : [_0x20f3fd];
            let _0x175160 = [];
            _0x20f3fd["forEach"]((_0x324f67) => {
                const _0x4be383 = _0x5532b0;
                if (!_0x324f67[_0x4be383(0x21c)] || !_0x324f67["tbl_opn_eczm"][_0x4be383(0x23f)] || !_0x324f67["tbl_opn_eczm"][_0x4be383(0x23f)]["MultiPolygon"]) return;
                const _0x292ee9 = _0x324f67["tbl_opn_eczm"]["geom"][_0x4be383(0x186)][_0x4be383(0x22e)][_0x4be383(0x22c)][_0x4be383(0x226)]["LinearRing"][_0x4be383(0x1ec)][_0x4be383(0x27c)],
                    _0x42df51 = _0x292ee9[_0x4be383(0x18a)]("\x20")["map"]((_0x3cad9d) => {
                        const _0x560fb4 = _0x4be383,
                            _0x9a87dc = _0x3cad9d[_0x560fb4(0x18a)](",")[_0x560fb4(0x23c)](Number);
                        return proj4("EPSG:5186", "EPSG:4326", _0x9a87dc);
                    });
                let _0x4e8f9d = [],
                    _0x3b5333 = [_0x42df51],
                    _0x85715d = _0x324f67[_0x4be383(0x21c)][_0x4be383(0x23f)]["MultiPolygon"][_0x4be383(0x22e)][_0x4be383(0x22c)][_0x4be383(0x25c)];
                _0x85715d &&
                    ((_0x4e8f9d = Array[_0x4be383(0x296)](_0x85715d)
                        ? _0x85715d[_0x4be383(0x23c)]((_0x479cfb) => {
                              const _0x5751d8 = _0x4be383,
                                  _0x2e1162 = _0x479cfb[_0x5751d8(0x23e)][_0x5751d8(0x1ec)][_0x5751d8(0x27c)];
                              return _0x2e1162[_0x5751d8(0x18a)]("\x20")[_0x5751d8(0x23c)]((_0x2866ea) => {
                                  const _0x272156 = _0x5751d8,
                                      _0x158071 = _0x2866ea[_0x272156(0x18a)](",")[_0x272156(0x23c)](Number);
                                  return proj4(_0x272156(0x199), _0x272156(0x1fb), _0x158071);
                              });
                          })
                        : [
                              _0x85715d[_0x4be383(0x23e)][_0x4be383(0x1ec)]["@text"][_0x4be383(0x18a)]("\x20")[_0x4be383(0x23c)]((_0x3c954a) => {
                                  const _0x5de466 = _0x4be383,
                                      _0x3fc28c = _0x3c954a[_0x5de466(0x18a)](",")[_0x5de466(0x23c)](Number);
                                  return proj4(_0x5de466(0x199), _0x5de466(0x1fb), _0x3fc28c);
                              }),
                          ]),
                    (_0x3b5333 = [_0x42df51, ..._0x4e8f9d]));
                const _0x12fd71 = turf[_0x4be383(0x1cc)](_0x3b5333);
                isValidPolygon(_0x12fd71) && _0x175160[_0x4be383(0x200)](_0x12fd71);
                if (!$(this)["is"](_0x4be383(0x2b7))) {
                    const _0x2c07e7 = _0x42df51[_0x4be383(0x23c)]((_0x406594) => new kakao[_0x4be383(0x170)][_0x4be383(0x16c)](_0x406594[0x1], _0x406594[0x0]));
                    let _0x218529 = [];
                    _0x85715d &&
                        (_0x218529 = _0x4e8f9d[_0x4be383(0x23c)]((_0x329b16) => {
                            const _0xf0892a = _0x4be383;
                            return _0x329b16[_0xf0892a(0x23c)]((_0x48cef8) => new kakao[_0xf0892a(0x170)][_0xf0892a(0x16c)](_0x48cef8[0x1], _0x48cef8[0x0]));
                        }));
                    const _0x49e5d3 = new kakao[_0x4be383(0x170)][_0x4be383(0x22c)]({
                        path: [_0x2c07e7, ..._0x218529],
                        strokeWeight: 0x1,
                        strokeColor: "" + (_0x22f8e8 == _0x4be383(0x188) ? "#16a800" : _0x22f8e8 == _0x4be383(0x216) ? _0x4be383(0x2a0) : _0x4be383(0x252)),
                        strokeOpacity: 0x1,
                        strokeStyle: _0x4be383(0x213),
                        fillColor: "" + (_0x22f8e8 == _0x4be383(0x188) ? "#16a800" : _0x22f8e8 == _0x4be383(0x216) ? _0x4be383(0x2a0) : "#e9e8d6"),
                        fillOpacity: 0x1,
                        zIndex: 0x5,
                    });
                    analysisPolygonArray[_0x4be383(0x200)](_0x49e5d3);
                }
            }),
                (_0x1268f7[_0x22f8e8] = _0x175160);
        }),
        analysisPolygonArray[_0x2cebca(0x278)]((_0x348d09) => _0x348d09[_0x2cebca(0x1c4)](map)),
        calculateOverlap(_0x4cf988, _0x1268f7),
        _0x37aca && map[_0x2cebca(0x234)](_0x37aca),
        _0x1268f7
    );
}
function isValidPolygon(_0x54323f) {
    const _0x50e4a2 = a39_0x363e4a;
    if (!_0x54323f || _0x54323f["type"] !== _0x50e4a2(0x28e) || !_0x54323f[_0x50e4a2(0x1c7)] || _0x54323f[_0x50e4a2(0x1c7)][_0x50e4a2(0x1e3)] !== "Polygon") return ![];
    const _0x5e2560 = _0x54323f[_0x50e4a2(0x1c7)]["coordinates"][0x0];
    if (_0x5e2560[_0x50e4a2(0x2a9)] < 0x4) return ![];
    const _0x93d8c = _0x5e2560[0x0],
        _0x59ec77 = _0x5e2560[_0x5e2560[_0x50e4a2(0x2a9)] - 0x1];
    return _0x93d8c[0x0] === _0x59ec77[0x0] && _0x93d8c[0x1] === _0x59ec77[0x1];
}
function calculateOverlap(_0x2c2b52, _0x373415) {
    const _0x223926 = a39_0x363e4a;
    !Array["isArray"](_0x2c2b52) && (_0x2c2b52 = [_0x2c2b52]);
    let _0x415207 = {};
    _0x2c2b52[_0x223926(0x278)]((_0x18cd3b) => {
        const _0x19ce07 = _0x223926;
        if (!isValidPolygon(_0x18cd3b)) {
            console["error"](_0x19ce07(0x1a6));
            return;
        }
        $[_0x19ce07(0x2c6)](_0x373415, function (_0x51209e, _0x1be0ea) {
            const _0x5c1f16 = _0x19ce07;
            let _0x57876f = 0x0;
            !_0x415207[_0x51209e] && (_0x415207[_0x51209e] = 0x0),
                _0x1be0ea[_0x5c1f16(0x278)]((_0x5c1c4a) => {
                    const _0x108883 = _0x5c1f16;
                    if (!isValidPolygon(_0x5c1c4a)) {
                        console["warn"](_0x108883(0x283));
                        return;
                    }
                    try {
                        const _0x1c57a1 = turf[_0x108883(0x230)](turf[_0x108883(0x1f6)]([_0x18cd3b, _0x5c1c4a]));
                        if (_0x1c57a1) {
                            const _0x3c886d = turf[_0x108883(0x16d)](_0x1c57a1);
                            _0x415207[_0x51209e] += _0x3c886d;
                        }
                    } catch (_0x3a2b7f) {
                        console[_0x108883(0x1bd)](_0x108883(0x1eb), _0x3a2b7f[_0x108883(0x191)]);
                    }
                });
        });
    });
    const _0x10e568 = _0x2c2b52[_0x223926(0x1bf)]((_0x168947, _0x502be3) => _0x168947 + turf[_0x223926(0x16d)](_0x502be3), 0x0);
    let _0x19b419 = $(_0x223926(0x1ee));
    isMultiSelectMode ? ((_0x19b419 = $(_0x223926(0x248))), $(_0x223926(0x235))[_0x223926(0x1a0)](formatArea(_0x10e568[_0x223926(0x2b0)](0x2)))) : $(_0x223926(0x26b))[_0x223926(0x1a0)](formatArea(_0x10e568[_0x223926(0x2b0)](0x2))),
        $[_0x223926(0x2c6)](_0x415207, function (_0x37f83a, _0x30e2d3) {
            const _0x550c54 = _0x223926;
            gradeValue = _0x37f83a == "ecologyzmpWFS_1" ? 0x1 : _0x37f83a == _0x550c54(0x216) ? 0x2 : _0x37f83a == "ecologyzmpWFS_3" ? 0x3 : "별도관리지역";
            let _0x2533ea = "";
            if (gradeValue == 0x1) _0x2533ea = "#16a800";
            else {
                if (gradeValue == 0x2) _0x2533ea = _0x550c54(0x2a0);
                else gradeValue == 0x3 && (_0x2533ea = _0x550c54(0x252));
            }
            const _0x2990a4 = ((_0x30e2d3 / _0x10e568) * 0x64)["toFixed"](0x3);
            _0x2990a4 > 0x0 &&
                _0x19b419[_0x550c54(0x21f)](_0x550c54(0x291))[_0x550c54(0x20b)](
                    _0x550c54(0x273) + _0x2533ea + _0x550c54(0x1ca) + gradeValue + "등급</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td\x20class=\x22text-center\x22>" + formatArea(_0x30e2d3[_0x550c54(0x2b0)](0x2)) + _0x550c54(0x218) + _0x2990a4 + _0x550c54(0x221)
                );
        });
}
async function nationalEnvMap(_0x31804c) {
    const _0x4288bb = a39_0x363e4a,
        _0x29d314 = _0x4288bb(0x2a7),
        _0x1a604e = { pnu: _0x31804c },
        _0x1e33b4 = await callApi(_0x4288bb(0x167), _0x29d314, _0x1a604e);
    console[_0x4288bb(0x1e9)](_0x1e33b4);
}
async function handleMapClick(_0x5ab26d) {
    const _0x277fca = a39_0x363e4a;
    if (isLoading) return;
    try {
        (isLoading = !![]), clearAllPolygons();
        let _0x393b81 = [],
            _0x162739 = [];
        const _0x28bd1e = await getLandBuildingPolygon(_0x5ab26d),
            { buildingPolygon: _0x14c7e4, buildingPolygon2: _0x5f22af, landPolygon: _0x286015 } = _0x28bd1e;
        ([_0x393b81, _0x162739] = await Promise[_0x277fca(0x1c9)]([getBuilindInfo({ buildingPolygon: _0x14c7e4, buildingPolygon2: _0x5f22af }), getLandInfo(_0x286015)])), addPolygonsToMap(buildingPolygons, landPolygons);
    } catch (_0x41c54d) {
        console[_0x277fca(0x1bd)](_0x277fca(0x270), _0x41c54d);
    } finally {
        isLoading = ![];
    }
}
function addPolygonsToMap(_0x300fd3 = [], _0x872d44 = []) {
    const _0x399823 = a39_0x363e4a;
    _0x300fd3[_0x399823(0x2a9)] > 0x0 && _0x300fd3[_0x399823(0x278)]((_0x13e610) => _0x13e610[_0x399823(0x1c4)](map)),
        _0x872d44["length"] > 0x0 && (_0x872d44[_0x399823(0x278)]((_0x3a0fab) => _0x3a0fab[_0x399823(0x1c4)](map)), landPolygonsMiniMap["forEach"]((_0x4c0aa7) => _0x4c0aa7[_0x399823(0x1c4)](miniMap)));
}
function clearAllPolygons() {
    const _0xee4739 = a39_0x363e4a;
    if (isMultiSelectMode) return;
    buildingPolygons[_0xee4739(0x278)]((_0x262de6) => _0x262de6[_0xee4739(0x1c4)](null)),
        landPolygons[_0xee4739(0x278)]((_0x215e98) => _0x215e98["setMap"](null)),
        landPolygonsMiniMap[_0xee4739(0x278)]((_0x5a41ee) => _0x5a41ee[_0xee4739(0x1c4)](null)),
        analysisPolygonArray[_0xee4739(0x278)]((_0x35612c) => _0x35612c[_0xee4739(0x1c4)](null)),
        (buildingPolygons = []),
        (landPolygons = []),
        (landPolygonsMiniMap = []),
        (analysisPolygonArray = []);
}
async function initializeMap() {
    const _0x5774c5 = a39_0x363e4a;
    let _0x331e9f = getCookie(_0x5774c5(0x251)) || 0x5;
    if (_0x331e9f > 0x5) _0x331e9f = 0x5;
    const _0x5429cb = new URLSearchParams(window[_0x5774c5(0x22a)]["search"]);
    let _0x4823c0 = _0x5429cb[_0x5774c5(0x27f)](_0x5774c5(0x22b)),
        _0x4fe87a = _0x5429cb["get"](_0x5774c5(0x1f7));
    !areValidCoordinatesInKorea(parseFloat(_0x4823c0), parseFloat(_0x4fe87a)) && ((_0x4823c0 = _0x5774c5(0x2ae)), (_0x4fe87a = _0x5774c5(0x264)));
    setCookie("curLat", _0x4823c0, 0x1), setCookie("curLng", _0x4fe87a, 0x1), console[_0x5774c5(0x1e9)](_0x4823c0, ",\x20", _0x4fe87a);
    const _0x21a65c = new kakao["maps"][_0x5774c5(0x16c)](_0x4823c0, _0x4fe87a);
    var _0x1d6170 = { center: _0x21a65c, level: _0x331e9f, minLevel: 0x0, maxLevel: 0xd, disableDoubleClickZoom: !![] };
    (map = new kakao[_0x5774c5(0x170)]["Map"](mapContainer, _0x1d6170)),
        (infowindow = new kakao[_0x5774c5(0x170)][_0x5774c5(0x1a8)]({ zIndex: 0x1 })),
        (clusterer = new kakao["maps"][_0x5774c5(0x2c2)]({
            map: map,
            averageCenter: !![],
            minLevel: 0x5,
            gridSize: 0x3c,
            minClusterSize: 0x1,
            styles: [
                { width: "50px", height: _0x5774c5(0x24e), backgroundColor: "#f48356", color: _0x5774c5(0x256), fontSize: _0x5774c5(0x2af), textAlign: _0x5774c5(0x20a), lineHeight: _0x5774c5(0x24e), borderRadius: "50%" },
                { width: "60px", height: _0x5774c5(0x225), backgroundColor: "#f48356", color: _0x5774c5(0x256), fontSize: _0x5774c5(0x295), textAlign: _0x5774c5(0x20a), lineHeight: _0x5774c5(0x225), borderRadius: "50%" },
                { width: _0x5774c5(0x166), height: _0x5774c5(0x166), backgroundColor: "#f48356", color: "#fff", fontSize: "18px", textAlign: _0x5774c5(0x20a), lineHeight: _0x5774c5(0x166), borderRadius: _0x5774c5(0x1b1) },
                { width: _0x5774c5(0x180), height: _0x5774c5(0x180), backgroundColor: _0x5774c5(0x211), color: "#fff", fontSize: _0x5774c5(0x257), textAlign: _0x5774c5(0x20a), lineHeight: _0x5774c5(0x180), borderRadius: _0x5774c5(0x1b1) },
            ],
            calculator: [0x1, 0xa, 0x1e, 0x32],
            disableClickZoom: ![],
            clickable: !![],
            hoverable: !![],
        })),
        toolbox(),
        (lineDrawer = createLineDrawer(map)),
        (circleDrawer = createCircleDrawer(map)),
        (polygonDrawer = createPolygonDrawer(map)),
        searchDetailAddrFromCoords(_0x21a65c, function (_0x499f66, _0xa8cf33) {
            const _0xb36759 = _0x5774c5;
            if (_0xa8cf33 === kakao[_0xb36759(0x170)]["services"][_0xb36759(0x239)]["OK"]) {
                const _0x51757c = _0x499f66[0x0][_0xb36759(0x1fa)];
                realPriceDetailLand(_0xb36759(0x214), _0x51757c);
            }
            displayAddressInfo(_0x499f66, _0xa8cf33);
        });
    let _0x394ecb = { lat: _0x4823c0, lng: _0x4fe87a };
    handleMapClick(_0x394ecb), searchArroundPlaces(_0x394ecb), (textModuleControl = addTextToMap(map)), initRoadView();
    return;
    const _0x1b0bb8 = [
            [
                [127.02412746223159, 37.4929645928441],
                [127.02429674560604, 37.49261019704831],
                [127.02455936894816, 37.49206026581284],
                [127.02479667590796, 37.491563407841404],
                [127.02365382860127, 37.49122007613731],
                [127.02306639969028, 37.49278819515432],
                [127.02406677745752, 37.493091555328974],
                [127.02412746223159, 37.4929645928441],
            ],
        ],
        _0x347e50 = [
            [
                [126.99556484762846, 37.507935286584306],
                [126.99819272463009, 37.50909236971659],
                [126.99820435230036, 37.509075611490665],
                [126.99869949620722, 37.50836194421412],
                [126.99908054045544, 37.50852912377377],
                [126.9991706316024, 37.508345772596314],
                [126.99925714807887, 37.508170295995015],
                [126.99944219203749, 37.50778513191741],
                [127.00009335017914, 37.506337039937655],
                [127.00042467092756, 37.50560481145891],
                [127.00056056072414, 37.50532660247273],
                [127.00063407526129, 37.50518643478012],
                [127.00054336301314, 37.50499513415802],
                [127.00034072942603, 37.504933864444205],
                [127.00012977428486, 37.50537656754941],
                [126.99864704685052, 37.504928168159054],
                [126.99861135080067, 37.50500314834691],
                [126.99777165768197, 37.504749187404904],
                [126.99556484762846, 37.507935286584306],
            ],
        ],
        _0x1af989 = [
            [
                [127.00035132738928, 37.500507567005045],
                [127.00050558776078, 37.50003751739384],
                [127.00085706838594, 37.49995138439665],
                [127.00112474796789, 37.500182581866824],
                [127.00100136652969, 37.5003808912112],
                [127.00105269762446, 37.50040171350381],
                [127.00110914067761, 37.500368818249264],
                [127.00130308938013, 37.50015032656872],
                [127.00142307719898, 37.4997774934347],
                [127.00094132202281, 37.49961134789164],
                [127.00091893065799, 37.49960098629407],
                [127.00084791103984, 37.49963351197094],
                [127.00080041359227, 37.49967793093419],
                [127.00081059074172, 37.49976190408399],
                [127.00032170542167, 37.50003841667617],
                [127.00022851991514, 37.500059769367525],
                [127.00017525480955, 37.50007562635287],
                [127.00012606114362, 37.50007724758192],
                [127.00004588198078, 37.500035890768366],
                [126.99998571893798, 37.50002724041613],
                [126.9999707894819, 37.500111753904534],
                [126.99993075556385, 37.5001333773438],
                [126.99991435780156, 37.500127340431014],
                [126.99988832494404, 37.50011783453838],
                [126.99987200512119, 37.50016787578231],
                [126.9998695834662, 37.50023852305899],
                [126.9999007149991, 37.50032608254421],
                [126.99985034357573, 37.50039340446788],
                [127.00011282251602, 37.500463865975874],
                [127.00035132738928, 37.500507567005045],
            ],
        ],
        _0x14995e = [
            [
                [127.0009667570799, 37.50094455581656],
                [127.00122187670034, 37.50104655878059],
                [127.001402154345, 37.50076697021016],
                [127.00154621954134, 37.50082402149551],
                [127.0020532145192, 37.50102478980221],
                [127.0021432105684, 37.50088467506445],
                [127.00127300648758, 37.50053162916422],
                [127.00121883656352, 37.50054442322143],
                [127.0009667570799, 37.50094455581656],
            ],
        ];
    drawPolygon(_0x14995e);
    const _0x4fe4e2 = getPolygonCenter(_0x14995e),
        _0x32dbb4 = getPolygonCentroid(_0x14995e),
        _0xf18bae = 126.99556484762846,
        _0x43ba99 = 37.504749187404904,
        _0x228e60 = 127.02306639969028,
        _0x3e155e = 37.49122007613731;
    var _0x24760c = new kakao[_0x5774c5(0x170)][_0x5774c5(0x16c)](_0x4fe4e2[0x1], _0x4fe4e2[0x0]);
    searchDetailAddrFromCoords(_0x24760c, displayAddressInfo);
    const _0x24ecc7 = new kakao[_0x5774c5(0x170)][_0x5774c5(0x1db)]({ map: map, position: new kakao["maps"][_0x5774c5(0x16c)](_0x32dbb4[0x1], _0x32dbb4[0x0]) });
    markers[_0x5774c5(0x278)]((_0x585513) => _0x585513[_0x5774c5(0x1c4)](null)), markers[_0x5774c5(0x200)](marker);
    return;
    const _0x41440a = new URL(window[_0x5774c5(0x22a)]["href"]),
        _0x5044bc = _0x41440a[_0x5774c5(0x1be)][_0x5774c5(0x27f)](_0x5774c5(0x1fa)),
        _0x1a874c = _0x41440a[_0x5774c5(0x1be)][_0x5774c5(0x27f)](_0x5774c5(0x1fe)),
        _0x2b1b4e = _0x41440a[_0x5774c5(0x1be)][_0x5774c5(0x27f)](_0x5774c5(0x25d));
    _0x1a874c && _0x2b1b4e && ((_0x4823c0 = _0x1a874c), (_0x4fe87a = _0x2b1b4e), setCookie(_0x5774c5(0x22b), _0x4823c0), setCookie(_0x5774c5(0x1f7), _0x4fe87a), map[_0x5774c5(0x234)](new kakao[_0x5774c5(0x170)][_0x5774c5(0x16c)](_0x4823c0, _0x4fe87a)));
    return;
    try {
        const _0x41a19d = await updateAddressInfo();
        buildingDetail(_0x41a19d), await renderInformation(0x1, $(_0x5774c5(0x22f))[_0x5774c5(0x203)]()), infiniteScroll();
    } catch (_0x47f82b) {
        console[_0x5774c5(0x1bd)](_0x5774c5(0x202), _0x47f82b);
    }
}
async function updateAddressInfo() {
    return new Promise(async (_0x3a1028, _0x568007) => {
        const _0x160185 = a39_0x57f5;
        setCookie("beforeKeyword", getCookie(_0x160185(0x2ca)));
        const _0x355ae4 = map[_0x160185(0x1b5)](),
            _0x37603d = _0x355ae4[_0x160185(0x206)](),
            _0x3afc13 = _0x355ae4[_0x160185(0x19b)]();
        setCookie("curLat", _0x37603d, 0x1), setCookie(_0x160185(0x1f7), _0x3afc13, 0x1);
        return;
        try {
            const _0x21ef2d = await searchDetailAddrFromCoords(_0x355ae4),
                _0x39b9a0 = await searchAddrFromCoords(_0x355ae4);
            if (_0x21ef2d && _0x21ef2d[_0x160185(0x2a9)] > 0x0) {
                const _0xeb6da6 = _0x21ef2d[0x0][_0x160185(0x1fa)]["address_name"],
                    _0x6e3e83 = _0x39b9a0[_0x160185(0x236)]((_0xfbd4ca) => _0xfbd4ca[_0x160185(0x194)] === "B"),
                    { code: _0x575164 } = _0x6e3e83[0x0],
                    _0x484214 = _0x39b9a0[_0x160185(0x236)]((_0x9adcc1) => _0x9adcc1[_0x160185(0x194)] === "H"),
                    { address_name: _0x17e476 } = _0x484214[0x0];
                setCookie(_0x160185(0x2ca), _0x17e476), $(_0x160185(0x22f))[_0x160185(0x203)](_0x17e476), _0x3a1028({ bjdCd: _0x575164, address_first: _0xeb6da6 });
            } else _0x568007(_0x160185(0x18c));
        } catch (_0x45a97f) {
            _0x568007(_0x160185(0x18c));
        }
    });
}
function searchAddrFromCoords(_0x3a4a9c, _0x25865e) {
    const _0x5c3956 = a39_0x363e4a;
    geocoder[_0x5c3956(0x192)](_0x3a4a9c[_0x5c3956(0x19b)](), _0x3a4a9c[_0x5c3956(0x206)](), _0x25865e);
}
function searchDetailAddrFromCoords(_0x2486b0, _0x1da817) {
    const _0xa6f8bb = a39_0x363e4a;
    geocoder["coord2Address"](_0x2486b0[_0xa6f8bb(0x19b)](), _0x2486b0[_0xa6f8bb(0x206)](), _0x1da817);
}
function displayAddressInfo(_0x22f5ee, _0x36ad9c) {
    const _0x227f8c = a39_0x363e4a;
    if (_0x36ad9c === kakao[_0x227f8c(0x170)][_0x227f8c(0x1e6)][_0x227f8c(0x239)]["OK"]) {
        var _0x2255e9 = document[_0x227f8c(0x182)](".road-address"),
            _0x511fca = document[_0x227f8c(0x182)](".jibun-address"),
            _0xcdf6b = _0x22f5ee[0x0][_0x227f8c(0x1a4)] ? _0x22f5ee[0x0][_0x227f8c(0x1a4)][_0x227f8c(0x1f9)] : "",
            _0x513b15 = _0x22f5ee[0x0][_0x227f8c(0x1fa)][_0x227f8c(0x1f9)];
        !_0x22f5ee[0x0][_0x227f8c(0x1a4)]
            ? _0x2255e9[_0x227f8c(0x278)](function (_0x5fb631) {
                  const _0x578a33 = _0x227f8c;
                  _0x5fb631[_0x578a33(0x172)][_0x578a33(0x1d8)] = _0x578a33(0x1a5);
              })
            : _0x2255e9[_0x227f8c(0x278)](function (_0x4b3d3d) {
                  const _0x4788a9 = _0x227f8c;
                  _0x4b3d3d[_0x4788a9(0x172)][_0x4788a9(0x1d8)] = _0x4788a9(0x2c7);
              }),
            _0x2255e9["forEach"](function (_0x534aab) {
                const _0x424581 = _0x227f8c;
                (_0x534aab[_0x424581(0x193)] = _0xcdf6b), _0x534aab[_0x424581(0x2b8)] === _0x424581(0x17f) && (_0x534aab[_0x424581(0x1dc)] = _0xcdf6b);
            }),
            _0x511fca[_0x227f8c(0x278)](function (_0x4452a4) {
                const _0xd87d5a = _0x227f8c;
                (_0x4452a4[_0xd87d5a(0x193)] = _0x513b15), _0x4452a4[_0xd87d5a(0x2b8)] === "INPUT" && (_0x4452a4["value"] = _0x513b15);
            }),
            recentVisit(_0x513b15);
    }
}
function addMarker(_0x250ce8, _0x36a610, _0xf15b02) {
    const _0x4b5baf = a39_0x363e4a;
    var _0x2a77a5 = _0x4b5baf(0x1b4),
        _0x13393b = new kakao[_0x4b5baf(0x170)][_0x4b5baf(0x1bc)](0x24, 0x25),
        _0x2d7ff7 = { spriteSize: new kakao["maps"]["Size"](0x24, 0x2b3), spriteOrigin: new kakao[_0x4b5baf(0x170)]["Point"](0x0, _0x36a610 * 0x2e + 0xa), offset: new kakao[_0x4b5baf(0x170)][_0x4b5baf(0x168)](0xd, 0x25) },
        _0x469bf2 = new kakao["maps"][_0x4b5baf(0x1c1)](_0x2a77a5, _0x13393b, _0x2d7ff7),
        _0x575c73 = new kakao["maps"][_0x4b5baf(0x1db)]({ position: _0x250ce8, image: _0x469bf2 });
    return markers[_0x4b5baf(0x200)](_0x575c73), _0x575c73;
}
function removeMarker(_0x432a20) {
    const _0x1c12f0 = a39_0x363e4a;
    for (var _0x5b0c6c = 0x0; _0x5b0c6c < _0x432a20[_0x1c12f0(0x2a9)]; _0x5b0c6c++) {
        _0x432a20[_0x5b0c6c][_0x1c12f0(0x1c4)](null);
    }
    _0x432a20 = [];
}
function displayPagination(_0x46983a) {
    const _0x48b3ae = a39_0x363e4a;
    var _0x522054 = document[_0x48b3ae(0x1c3)](_0x48b3ae(0x25f)),
        _0x1cdba9 = document[_0x48b3ae(0x185)](),
        _0x1c6bd6;
    while (_0x522054[_0x48b3ae(0x1d1)]()) {
        _0x522054["removeChild"](_0x522054[_0x48b3ae(0x238)]);
    }
    for (_0x1c6bd6 = 0x1; _0x1c6bd6 <= _0x46983a[_0x48b3ae(0x227)]; _0x1c6bd6++) {
        var _0x4c9ce9 = document[_0x48b3ae(0x241)]("a");
        (_0x4c9ce9[_0x48b3ae(0x220)] = "#"),
            (_0x4c9ce9["innerHTML"] = _0x1c6bd6),
            _0x1c6bd6 === _0x46983a["current"]
                ? (_0x4c9ce9[_0x48b3ae(0x250)] = "on")
                : (_0x4c9ce9[_0x48b3ae(0x179)] = (function (_0x3d023e) {
                      return function () {
                          const _0x3f069a = a39_0x57f5;
                          _0x46983a[_0x3f069a(0x28b)](_0x3d023e);
                      };
                  })(_0x1c6bd6)),
            _0x1cdba9["appendChild"](_0x4c9ce9);
    }
    _0x522054[_0x48b3ae(0x1d9)](_0x1cdba9);
}
function displayInfowindow(_0x2593ec, _0xe9cd21) {
    const _0x2a2ad5 = a39_0x363e4a;
    var _0x37cccc = _0x2a2ad5(0x2b4) + _0xe9cd21 + _0x2a2ad5(0x17e);
    infowindow[_0x2a2ad5(0x177)](_0x37cccc), infowindow["open"](map, _0x2593ec);
}
function removeAllChildNods(_0x547a25) {
    const _0x2cf9fd = a39_0x363e4a;
    while (_0x547a25[_0x2cf9fd(0x1d1)]()) {
        _0x547a25[_0x2cf9fd(0x2a6)](_0x547a25[_0x2cf9fd(0x238)]);
    }
}
function areValidCoordinatesInKorea(_0x31f58a, _0x3f6b20) {
    const _0xc43b3 = isValidCoordinate(_0x31f58a) && _0x31f58a >= 0x21 && _0x31f58a <= 0x2b,
        _0x3547a4 = isValidCoordinate(_0x3f6b20) && _0x3f6b20 >= 0x7c && _0x3f6b20 <= 0x84;
    return _0xc43b3 && _0x3547a4;
}
function isValidCoordinate(_0x27056d) {
    return _0x27056d !== null && _0x27056d !== undefined && _0x27056d !== "" && !isNaN(_0x27056d);
}
async function updateURL(_0x25703d) {
    const _0x418740 = a39_0x363e4a,
        _0x791d4a = new URL(window["location"][_0x418740(0x220)]),
        _0x57e17e = new URLSearchParams(_0x791d4a["search"]);
    for (const [_0x736515, _0x3cbfb5] of Object[_0x418740(0x289)](_0x25703d)) {
        _0x57e17e[_0x418740(0x29b)](_0x736515, _0x3cbfb5), setCookie(_0x736515, _0x3cbfb5);
    }
    (_0x791d4a[_0x418740(0x28c)] = _0x57e17e[_0x418740(0x2b9)]()), window[_0x418740(0x20c)][_0x418740(0x2a3)]({}, "", _0x791d4a);
}
function handleUrlChange() {
    const _0x166e3c = a39_0x363e4a,
        _0x2db574 = new URLSearchParams(window[_0x166e3c(0x22a)][_0x166e3c(0x28c)]),
        _0x521fbb = parseFloat(_0x2db574[_0x166e3c(0x27f)](_0x166e3c(0x22b))),
        _0x5d2533 = parseFloat(_0x2db574["get"]("curLng"));
    if (!_0x521fbb || !_0x5d2533) return;
    const _0x52ecbc = new kakao[_0x166e3c(0x170)][_0x166e3c(0x16c)](_0x521fbb, _0x5d2533),
        _0x556082 = { lat: _0x521fbb, lng: _0x5d2533 };
    map[_0x166e3c(0x1e5)](_0x52ecbc),
        searchDetailAddrFromCoords(_0x52ecbc, function (_0xd6bdbb, _0x3bd8f9) {
            const _0x5cb7f3 = _0x166e3c;
            _0x3bd8f9 === kakao[_0x5cb7f3(0x170)]["services"][_0x5cb7f3(0x239)]["OK"] && handleMapClick(_0x556082), displayAddressInfo(_0xd6bdbb, _0x3bd8f9);
        });
}
async function getLandBuildingPolygon(_0x2737e5) {
    const _0x41a794 = a39_0x363e4a,
        _0x3f2470 = "/front/back/realPrice/building_info.php",
        _0x5ce1a3 = { geomFilter: _0x41a794(0x29f) + _0x2737e5["lng"] + "\x20" + _0x2737e5[_0x41a794(0x1fe)] + ")", geometry: !![], attribute: !![] },
        _0x72f32d = await callApi("POST", _0x3f2470, _0x5ce1a3);
    return _0x72f32d;
}
async function getBuilindInfo(_0x3b8000) {
    const _0x4537aa = a39_0x363e4a;
    let _0x511002 = [];
    if (isMultiSelectMode) return _0x511002;
    let _0xba154c = new Map();
    function _0x59af41(_0x3273f8) {
        const _0x40ab69 = a39_0x57f5,
            _0x288f23 = _0x3273f8[_0x40ab69(0x1f2)];
        _0x288f23 &&
            _0x288f23[_0x40ab69(0x2a9)] > 0x0 &&
            _0x288f23["forEach"](function (_0x2cdd41) {
                const _0x17dd57 = _0x40ab69,
                    _0x333cbd = _0x2cdd41["properties"]["gis_idntfc_no"];
                if (!_0xba154c["has"](_0x333cbd)) {
                    _0xba154c[_0x17dd57(0x29b)](_0x333cbd, _0x2cdd41);
                    const _0x355df5 = _0x2cdd41[_0x17dd57(0x1c7)]["coordinates"][0x0][0x0],
                        _0x76e3cd = _0x355df5[_0x17dd57(0x23c)]((_0x185201) => new kakao[_0x17dd57(0x170)][_0x17dd57(0x16c)](_0x185201[0x1], _0x185201[0x0])),
                        _0x407dd7 = new kakao["maps"][_0x17dd57(0x22c)]({ path: _0x76e3cd, strokeWeight: 0x2, strokeColor: _0x17dd57(0x29c), strokeOpacity: 0x1, strokeStyle: _0x17dd57(0x267), fillColor: "#FFAAAA", fillOpacity: 0x0, zIndex: 0xa });
                    _0x511002[_0x17dd57(0x200)](_0x407dd7);
                }
            });
    }
    return _0x59af41(_0x3b8000[_0x4537aa(0x1de)]), _0x59af41(_0x3b8000[_0x4537aa(0x174)]), buildingPolygons[_0x4537aa(0x200)](..._0x511002), _0x511002;
}
function drawBBoxOnMap(_0x2edcb2) {
    const _0xf3918b = a39_0x363e4a,
        _0x387a2a = _0x2edcb2[0x0],
        _0x20c7bc = _0x2edcb2[0x1],
        _0x383b90 = _0x2edcb2[0x2],
        _0x3cb392 = _0x2edcb2[0x3],
        _0x45675d = [new kakao["maps"][_0xf3918b(0x16c)](_0x20c7bc, _0x387a2a), new kakao["maps"][_0xf3918b(0x16c)](_0x3cb392, _0x387a2a), new kakao[_0xf3918b(0x170)]["LatLng"](_0x3cb392, _0x383b90), new kakao[_0xf3918b(0x170)][_0xf3918b(0x16c)](_0x20c7bc, _0x383b90)],
        _0x1ddb4d = new kakao[_0xf3918b(0x170)][_0xf3918b(0x22c)]({ path: _0x45675d, strokeWeight: 0x1, strokeColor: _0xf3918b(0x29c), strokeOpacity: 0.8, strokeStyle: _0xf3918b(0x213), fillColor: _0xf3918b(0x187), fillOpacity: 0x0, zIndex: 0x1 });
    _0x1ddb4d[_0xf3918b(0x1c4)](map);
}
async function getLandInfo(_0x959d29) {
    const _0x543a02 = a39_0x363e4a;
    if (_0x959d29[_0x543a02(0x1ae)][_0x543a02(0x2c5)] && _0x959d29[_0x543a02(0x1ae)][_0x543a02(0x2c5)] === "OK") {
        const _0x12a71f = _0x959d29[_0x543a02(0x1ae)][_0x543a02(0x1d0)][_0x543a02(0x1f6)][_0x543a02(0x1f2)],
            _0x1b2009 = _0x959d29[_0x543a02(0x1ae)]["result"][_0x543a02(0x1f6)]["bbox"],
            _0x163f4d = proj4("EPSG:4326", _0x543a02(0x199), [_0x1b2009[0x0], _0x1b2009[0x1]]),
            _0x30f4db = proj4(_0x543a02(0x1fb), _0x543a02(0x199), [_0x1b2009[0x2], _0x1b2009[0x3]]),
            _0x2b77f7 = [_0x163f4d[0x0], _0x163f4d[0x1], _0x30f4db[0x0], _0x30f4db[0x1]];
        let _0x50e99e = [],
            _0x481200 = [],
            _0x1b4ec8 = null,
            _0x109eaa = _0x543a02(0x240),
            _0x2aa939 = _0x543a02(0x29a);
        isMultiSelectMode && ((_0x109eaa = $(_0x543a02(0x247))["val"]()), (_0x2aa939 = $(_0x543a02(0x247))["val"]()));
        _0x12a71f[_0x543a02(0x278)](function (_0x3cf68f) {
            const _0x2197d9 = _0x543a02,
                _0x43dd66 = _0x3cf68f["geometry"][_0x2197d9(0x1ec)][0x0][0x0],
                _0x5b7793 = _0x43dd66[_0x2197d9(0x23c)]((_0x2948ce) => new kakao[_0x2197d9(0x170)]["LatLng"](_0x2948ce[0x1], _0x2948ce[0x0])),
                _0x2a5f8d = new kakao[_0x2197d9(0x170)][_0x2197d9(0x22c)]({ path: _0x5b7793, strokeWeight: 0x1, strokeColor: _0x109eaa, strokeOpacity: 0x1, strokeStyle: _0x2197d9(0x213), fillColor: _0x2aa939, fillOpacity: 0.5, zIndex: 0x6 }),
                _0x35bbf2 = new kakao[_0x2197d9(0x170)]["Polygon"]({ path: _0x5b7793, strokeWeight: 0x1, strokeColor: _0x2197d9(0x240), strokeOpacity: 0x1, strokeStyle: "solid", fillColor: "#AAAAFF", fillOpacity: 0.5, zIndex: 0x5 });
            (_0x1b4ec8 = turf[_0x2197d9(0x1cc)]([_0x43dd66])), _0x50e99e["push"](_0x2a5f8d), landPolygons[_0x2197d9(0x200)](_0x2a5f8d), landPolygonsMiniMap[_0x2197d9(0x200)](_0x35bbf2);
            const _0x2de013 = new kakao["maps"][_0x2197d9(0x1cb)]();
            _0x43dd66[_0x2197d9(0x278)]((_0x42ccd4) => {
                const _0x4f104a = _0x2197d9,
                    _0xcc0f6a = new kakao[_0x4f104a(0x170)]["LatLng"](_0x42ccd4[0x1], _0x42ccd4[0x0]);
                _0x2de013[_0x4f104a(0x1a1)](_0xcc0f6a);
            });
            const _0x6856c4 = getPolygonCentroid(_0x3cf68f[_0x2197d9(0x1c7)][_0x2197d9(0x1ec)][0x0][0x0]);
            miniMap["setCenter"](new kakao["maps"][_0x2197d9(0x16c)](_0x6856c4[_0x2197d9(0x1fe)], _0x6856c4[_0x2197d9(0x25d)])), miniMap[_0x2197d9(0x21a)](_0x2de013);
        });
        const _0xe9b036 = _0x12a71f[0x0][_0x543a02(0x284)]["pnu"];
        return BuildingDetail(_0xe9b036), landDetail(_0xe9b036), getRequestHistory(_0xe9b036), !isMultiSelectMode && (landWFSArrays = []), landWFSArrays[_0x543a02(0x200)]({ pnu: _0xe9b036, bbox: _0x2b77f7, landGeoJson: _0x1b4ec8 }), _0x50e99e;
    }
}
function addBuildingPolygon(_0x1e46af) {
    const _0x41804a = a39_0x363e4a,
        _0x416399 = new kakao[_0x41804a(0x170)]["Polygon"]({ path: _0x1e46af, strokeWeight: 0x2, strokeColor: _0x41804a(0x29c), strokeOpacity: 0x1, strokeStyle: _0x41804a(0x267), fillColor: "#FFAAAA", fillOpacity: 0x0, zIndex: 0xa });
    _0x416399[_0x41804a(0x1c4)](map), buildingPolygons["push"](_0x416399);
}
function addLandPolygon(_0x39822f) {
    const _0x4ebe15 = a39_0x363e4a,
        _0x1a8c10 = new kakao[_0x4ebe15(0x170)][_0x4ebe15(0x22c)]({ path: _0x39822f, strokeWeight: 0x1, strokeColor: "#0000FF", strokeOpacity: 0x1, strokeStyle: _0x4ebe15(0x213), fillColor: "#AAAAFF", fillOpacity: 0.5, zIndex: 0x5 });
    _0x1a8c10[_0x4ebe15(0x1c4)](map), landPolygons[_0x4ebe15(0x200)](_0x1a8c10);
}
function addPolygon(_0x2e9a29, _0x4a729d) {
    const _0x52be4d = a39_0x363e4a;
    let _0x13596c, _0x3ec0e5, _0x310c0c;
    const _0x455975 = new kakao[_0x52be4d(0x170)]["Polygon"]({ path: _0x2e9a29, strokeWeight: 0x3, strokeColor: _0x13596c, strokeOpacity: 0x1, strokeStyle: _0x310c0c, fillColor: _0x3ec0e5, fillOpacity: 0.5 });
    _0x455975[_0x52be4d(0x1c4)](map), selectedPolygons["push"](_0x455975);
}
function addPolyline(_0x4cba30) {
    const _0x5ccf59 = a39_0x363e4a,
        _0x4b673b = new kakao[_0x5ccf59(0x170)][_0x5ccf59(0x242)]({ path: _0x4cba30, strokeWeight: 0x5, strokeColor: _0x5ccf59(0x29c), strokeOpacity: 0.7, strokeStyle: _0x5ccf59(0x213) });
    _0x4b673b[_0x5ccf59(0x1c4)](map);
}
async function getRealPrice(_0xbee8a4, _0x9cbf27) {
    const _0x3a409e = a39_0x363e4a;
    if (_0x9cbf27 === kakao["maps"]["services"]["Status"]["OK"]) {
        const _0x4da6d8 = "/front/back/realPrice/test.php",
            _0x2ecbda = _0x3a409e(0x20d);
        for (var _0x195f37 = 0x0; _0x195f37 < _0xbee8a4[_0x3a409e(0x2a9)]; _0x195f37++) {
            if (_0xbee8a4[_0x195f37][_0x3a409e(0x194)] === "B") {
                let _0x9723ff = _0xe8aa19[_0x195f37][_0x3a409e(0x2b3)];
                _0x9723ff = _0x9723ff[_0x3a409e(0x2aa)](0x0, 0x5);
                const _0xe8aa19 = await callApi(_0x3a409e(0x167), _0x4da6d8, { lawd_cd: _0x9723ff, deal_ymd: _0x2ecbda });
                break;
            }
        }
    }
}
async function showRealPrice(_0x485e5c, _0x3f12c7) {
    const _0x6451c3 = a39_0x363e4a,
        _0x4460f6 = _0x6451c3(0x21b),
        _0x21124e = { geomFilter: _0x485e5c, geometry: ![], attribute: !![], buffer: _0x3f12c7 },
        _0x4e2b6b = await callApi("POST", _0x4460f6, _0x21124e);
    (markers = []),
        $[_0x6451c3(0x2c6)](_0x4e2b6b, function (_0x52d3b0, _0x36d28a) {
            const _0x3189c3 = _0x6451c3,
                _0x35d851 = _0x36d28a[_0x3189c3(0x17a)],
                _0x1aca56 = _0x36d28a[_0x3189c3(0x18b)],
                _0x19addf = _0x36d28a[_0x3189c3(0x224)],
                _0x2f3c5c = new kakao[_0x3189c3(0x170)][_0x3189c3(0x16c)](_0x1aca56, _0x19addf),
                _0x2e0cc7 = { title: _0x35d851, latlng: _0x2f3c5c };
            markers[_0x3189c3(0x200)](_0x2e0cc7);
            var _0x2a6750 = _0x3189c3(0x183) + _0x36d28a[_0x3189c3(0x1b0)] + _0x3189c3(0x293) + _0x36d28a[_0x3189c3(0x254)] + _0x3189c3(0x1a7);
            let _0x1dc421 = new kakao[_0x3189c3(0x170)][_0x3189c3(0x16c)](_0x1aca56, _0x19addf),
                _0x13513e = ![];
            var _0x41c477 = new kakao[_0x3189c3(0x170)][_0x3189c3(0x17b)]({ clickable: !![], content: _0x2a6750, map: map, position: _0x1dc421, xAnchor: 0.5, yAnchor: 0.5, zIndex: 0x1 });
            _0x41c477[_0x3189c3(0x1c4)](map);
        });
    for (var _0x3e5948 = 0x0; _0x3e5948 < markers[_0x6451c3(0x2a9)]; _0x3e5948++) {}
    return _0x4e2b6b;
}
function transCoordCB(_0x51a978, _0x4dc61d) {
    const _0x4836df = a39_0x363e4a;
    if (_0x4dc61d === kakao[_0x4836df(0x170)][_0x4836df(0x1e6)][_0x4836df(0x239)]["OK"]) {
        console[_0x4836df(0x1e9)](_0x51a978),
            searchAddrFromCoords(new kakao[_0x4836df(0x170)][_0x4836df(0x16c)](_0x51a978[0x0]["y"], _0x51a978[0x0]["x"]), function () {
                const _0x317d6d = _0x4836df;
                console[_0x317d6d(0x1e9)](_0x51a978[0x0]["y"], _0x51a978[0x0]["x"]);
            });
        return;
        var _0x428269 = new kakao[_0x4836df(0x170)]["Marker"]({ position: new kakao[_0x4836df(0x170)]["LatLng"](_0x51a978[0x0]["y"], _0x51a978[0x0]["x"]), map: map });
    }
}
function drawPolygon(_0xde26e8) {
    const _0x3b32b2 = a39_0x363e4a,
        _0x34d005 = _0xde26e8[0x0][_0x3b32b2(0x23c)]((_0x461cfc) => new kakao[_0x3b32b2(0x170)][_0x3b32b2(0x16c)](_0x461cfc[0x1], _0x461cfc[0x0])),
        _0x690d97 = new kakao[_0x3b32b2(0x170)]["Polygon"]({ map: map, path: _0x34d005, strokeWeight: 0x3, strokeColor: "#FF0000", strokeOpacity: 0.8, strokeStyle: _0x3b32b2(0x213), fillColor: "#FF0000", fillOpacity: 0.5 });
    map[_0x3b32b2(0x234)](_0x34d005[0x0]);
}
function getPolygonCentroid(_0x390da5) {
    const _0x59ea5c = a39_0x363e4a;
    let _0x4d72b3 = _0x390da5[_0x59ea5c(0x2a9)],
        _0x3f079f = 0x0,
        _0x2fc1dd = 0x0,
        _0x361c32 = 0x0;
    _0x390da5[_0x59ea5c(0x278)]((_0x5b234e) => {
        const _0x2e2e22 = _0x59ea5c;
        let _0x2d110b = (_0x5b234e[0x1] * Math["PI"]) / 0xb4,
            _0x5d5bc1 = (_0x5b234e[0x0] * Math["PI"]) / 0xb4,
            _0x30ecab = Math[_0x2e2e22(0x204)](_0x2d110b) * Math["cos"](_0x5d5bc1),
            _0xb75a7f = Math["cos"](_0x2d110b) * Math[_0x2e2e22(0x1ad)](_0x5d5bc1),
            _0x12a0cd = Math[_0x2e2e22(0x1ad)](_0x2d110b);
        (_0x3f079f += _0x30ecab), (_0x2fc1dd += _0xb75a7f), (_0x361c32 += _0x12a0cd);
    }),
        (_0x3f079f /= _0x4d72b3),
        (_0x2fc1dd /= _0x4d72b3),
        (_0x361c32 /= _0x4d72b3);
    let _0x3ae0e8 = Math[_0x59ea5c(0x1ff)](_0x2fc1dd, _0x3f079f),
        _0x58732a = Math[_0x59ea5c(0x1f0)](_0x3f079f * _0x3f079f + _0x2fc1dd * _0x2fc1dd),
        _0x25d7c6 = Math["atan2"](_0x361c32, _0x58732a),
        _0x2bf883 = { lat: (_0x25d7c6 * 0xb4) / Math["PI"], lng: (_0x3ae0e8 * 0xb4) / Math["PI"] };
    if (isPointInPolygon([_0x2bf883[_0x59ea5c(0x25d)], _0x2bf883[_0x59ea5c(0x1fe)]], _0x390da5)) return _0x2bf883;
    else {
        let _0x5994df = findClosestPointOnPolygon([_0x2bf883[_0x59ea5c(0x25d)], _0x2bf883["lat"]], _0x390da5);
        return { lat: _0x5994df[0x1], lng: _0x5994df[0x0] };
    }
}
function isPointInPolygon(_0x1b2f82, _0x51cde4) {
    const _0x5de278 = a39_0x363e4a;
    let [_0x33d91b, _0x27f2ec] = _0x1b2f82,
        _0x11aedf = ![];
    for (let _0x13ed1f = 0x0, _0x21aed0 = _0x51cde4["length"] - 0x1; _0x13ed1f < _0x51cde4[_0x5de278(0x2a9)]; _0x21aed0 = _0x13ed1f++) {
        let _0x41e8dd = _0x51cde4[_0x13ed1f][0x0],
            _0x5dd1e1 = _0x51cde4[_0x13ed1f][0x1],
            _0x2847e2 = _0x51cde4[_0x21aed0][0x0],
            _0x182f81 = _0x51cde4[_0x21aed0][0x1],
            _0x26cccd = _0x5dd1e1 > _0x27f2ec != _0x182f81 > _0x27f2ec && _0x33d91b < ((_0x2847e2 - _0x41e8dd) * (_0x27f2ec - _0x5dd1e1)) / (_0x182f81 - _0x5dd1e1) + _0x41e8dd;
        if (_0x26cccd) _0x11aedf = !_0x11aedf;
    }
    return _0x11aedf;
}
function findClosestPointOnPolygon(_0xe65e90, _0x5f2748) {
    const _0x5f5c0f = a39_0x363e4a;
    let _0x481c3a = null,
        _0x4c27f0 = Infinity;
    for (let _0xb225d1 = 0x0; _0xb225d1 < _0x5f2748[_0x5f5c0f(0x2a9)]; _0xb225d1++) {
        let _0x4808b2 = _0x5f2748[_0xb225d1],
            _0x244bbf = _0x5f2748[(_0xb225d1 + 0x1) % _0x5f2748[_0x5f5c0f(0x2a9)]],
            _0x35f770 = getClosestPointOnSegment(_0xe65e90, _0x4808b2, _0x244bbf),
            _0xe40071 = distanceBetweenPoints(_0xe65e90, _0x35f770);
        _0xe40071 < _0x4c27f0 && ((_0x4c27f0 = _0xe40071), (_0x481c3a = _0x35f770));
    }
    return _0x481c3a;
}
function getClosestPointOnSegment(_0x443ac2, _0x486d95, _0x1b5dae) {
    let _0x150aa6 = _0x443ac2[0x0],
        _0x3e194e = _0x443ac2[0x1],
        _0x1418cf = _0x486d95[0x0],
        _0x4b9a82 = _0x486d95[0x1],
        _0x28ed51 = _0x1b5dae[0x0],
        _0x32923f = _0x1b5dae[0x1],
        _0x21d19f = _0x28ed51 - _0x1418cf,
        _0x52b8c9 = _0x32923f - _0x4b9a82;
    if (_0x21d19f === 0x0 && _0x52b8c9 === 0x0) return _0x486d95;
    let _0x4472e4 = ((_0x150aa6 - _0x1418cf) * _0x21d19f + (_0x3e194e - _0x4b9a82) * _0x52b8c9) / (_0x21d19f * _0x21d19f + _0x52b8c9 * _0x52b8c9);
    if (_0x4472e4 < 0x0) return _0x486d95;
    else return _0x4472e4 > 0x1 ? _0x1b5dae : [_0x1418cf + _0x4472e4 * _0x21d19f, _0x4b9a82 + _0x4472e4 * _0x52b8c9];
}
function distanceBetweenPoints(_0x1f7082, _0x39c32a) {
    const _0x446b76 = a39_0x363e4a;
    let _0x5eefad = _0x1f7082[0x0] - _0x39c32a[0x0],
        _0x3a7e56 = _0x1f7082[0x1] - _0x39c32a[0x1];
    return Math[_0x446b76(0x1f0)](_0x5eefad * _0x5eefad + _0x3a7e56 * _0x3a7e56);
}
function toolbox() {
    const _0x2e6f64 = a39_0x363e4a;
    var _0x324b4d = _0x2e6f64(0x292),
        _0x4522b8 = _0x2e6f64(0x215),
        _0x52f246 = 0.5,
        _0x8fe38e = "dash",
        _0x29ef53 = {
            map: map,
            drawingMode: [
                kakao[_0x2e6f64(0x170)][_0x2e6f64(0x1fd)]["OverlayType"]["MARKER"],
                kakao[_0x2e6f64(0x170)]["Drawing"][_0x2e6f64(0x294)][_0x2e6f64(0x198)],
                kakao[_0x2e6f64(0x170)][_0x2e6f64(0x1fd)]["OverlayType"][_0x2e6f64(0x285)],
                kakao[_0x2e6f64(0x170)][_0x2e6f64(0x1fd)][_0x2e6f64(0x294)][_0x2e6f64(0x1aa)],
                kakao[_0x2e6f64(0x170)][_0x2e6f64(0x1fd)][_0x2e6f64(0x294)][_0x2e6f64(0x17d)],
                kakao[_0x2e6f64(0x170)]["Drawing"][_0x2e6f64(0x294)]["ELLIPSE"],
                kakao["maps"][_0x2e6f64(0x1fd)][_0x2e6f64(0x294)][_0x2e6f64(0x1e1)],
            ],
            guideTooltip: ["draw", _0x2e6f64(0x1af), _0x2e6f64(0x290)],
            markerOptions: { draggable: !![], removable: !![] },
            arrowOptions: { draggable: !![], removable: !![], strokeColor: _0x324b4d, hintStrokeStyle: _0x8fe38e },
            polylineOptions: { draggable: !![], removable: !![], strokeColor: _0x324b4d, hintStrokeStyle: _0x8fe38e },
            rectangleOptions: { draggable: !![], removable: !![], strokeColor: _0x324b4d, fillColor: _0x4522b8, fillOpacity: _0x52f246 },
            circleOptions: { draggable: !![], removable: !![], strokeColor: _0x324b4d, fillColor: _0x4522b8, fillOpacity: _0x52f246 },
            ellipseOptions: { draggable: !![], removable: !![], strokeColor: _0x324b4d, fillColor: _0x4522b8, fillOpacity: _0x52f246 },
            polygonOptions: { draggable: !![], removable: !![], strokeColor: _0x324b4d, fillColor: _0x4522b8, fillOpacity: _0x52f246 },
        };
    (manager = new kakao["maps"]["Drawing"][_0x2e6f64(0x1f4)](_0x29ef53)),
        manager[_0x2e6f64(0x277)](_0x2e6f64(0x1ef), function (_0x3cf861) {}),
        manager[_0x2e6f64(0x277)](_0x2e6f64(0x21d), function (_0x3dd95e) {
            const _0x268dfb = _0x2e6f64;
            var _0x167b50 = document[_0x268dfb(0x182)](_0x268dfb(0x1fc));
            _0x167b50[_0x268dfb(0x278)](function (_0x524773) {
                const _0x3a516b = _0x268dfb;
                var _0x1a6516 = _0x524773[_0x3a516b(0x1ce)](_0x3a516b(0x265));
                _0x1a6516 ? (_0x524773[_0x3a516b(0x172)][_0x3a516b(0x26a)] = _0x1a6516) : (_0x524773[_0x3a516b(0x172)][_0x3a516b(0x26a)] = _0x3a516b(0x209)), _0x524773[_0x3a516b(0x2a5)]("data-moved", "false");
            }),
                $(_0x268dfb(0x1c8))["removeClass"]("active");
        }),
        manager["addListener"](_0x2e6f64(0x23a), function (_0xf1d994) {
            const _0x20a684 = _0x2e6f64;
            var _0x3f90f = document["querySelectorAll"]("#draw_toolbox\x20a\x20span");
            _0x3f90f["forEach"](function (_0x543773) {
                const _0x43a1f6 = a39_0x57f5;
                var _0x178c9f = _0x543773[_0x43a1f6(0x1ce)]("data-original-position");
                _0x178c9f ? (_0x543773[_0x43a1f6(0x172)]["backgroundPosition"] = _0x178c9f) : (_0x543773["style"]["backgroundPosition"] = _0x43a1f6(0x209)), _0x543773[_0x43a1f6(0x2a5)](_0x43a1f6(0x262), _0x43a1f6(0x1c0));
            }),
                $(_0x20a684(0x1c8))[_0x20a684(0x1cd)]("active");
        });
    var _0x22d21f = ![];
    document[_0x2e6f64(0x1c3)](_0x2e6f64(0x232))["addEventListener"](_0x2e6f64(0x272), function () {
        const _0x3ef0de = _0x2e6f64;
        !_0x22d21f ? ($("#draw_toolbox")["show"](), (_0x22d21f = !![])) : ($(_0x3ef0de(0x181))["hide"](), (_0x22d21f = ![]), manager["cancel"]());
    });
}
function selectOverlay(_0x228268, _0x3f451c) {
    const _0x380804 = a39_0x363e4a;
    var _0x17a803 = _0x228268["classList"][_0x380804(0x178)](_0x380804(0x197));
    $(_0x380804(0x1c8))["removeClass"]("active");
    if (_0x17a803) {
        textModuleControl[_0x380804(0x297)](), manager["cancel"]();
        var _0x41c66d = _0x228268[_0x380804(0x19f)](_0x380804(0x281)),
            _0xe1834 = _0x41c66d[_0x380804(0x1ce)](_0x380804(0x265));
        _0xe1834 && (_0x41c66d[_0x380804(0x172)][_0x380804(0x26a)] = _0xe1834);
        return;
    }
    manager[_0x380804(0x23a)]();
    _0x3f451c == _0x380804(0x19e) ? textModuleControl[_0x380804(0x195)]() : (manager[_0x380804(0x1f3)](kakao[_0x380804(0x170)][_0x380804(0x24a)]["OverlayType"][_0x3f451c]), textModuleControl["stop"]());
    var _0x1ba5f9 = document[_0x380804(0x182)]("#draw_toolbox\x20a\x20span");
    _0x1ba5f9[_0x380804(0x278)](function (_0x56c73d) {
        const _0x5afdb1 = _0x380804;
        var _0x9d2c47 = getComputedStyle(_0x56c73d)["backgroundPosition"][_0x5afdb1(0x18a)]("\x20"),
            _0x40a47c = _0x9d2c47[0x1];
        !_0x56c73d[_0x5afdb1(0x1ce)](_0x5afdb1(0x265)) && _0x56c73d[_0x5afdb1(0x2a5)](_0x5afdb1(0x265), _0x56c73d[_0x5afdb1(0x172)][_0x5afdb1(0x26a)] || "0px\x20" + _0x40a47c),
            (_0x56c73d[_0x5afdb1(0x172)][_0x5afdb1(0x26a)] = "0px\x20" + _0x40a47c),
            _0x56c73d[_0x5afdb1(0x2a5)]("data-moved", "false");
    });
    var _0x41c66d = _0x228268["querySelector"](_0x380804(0x281));
    if (_0x41c66d) {
        var _0x24f2b7 = getComputedStyle(_0x41c66d)[_0x380804(0x26a)][_0x380804(0x18a)]("\x20"),
            _0xdbbce6 = _0x41c66d[_0x380804(0x1ce)]("data-moved") === _0x380804(0x25b);
        if (!_0xdbbce6) {
            var _0x2320c4 = parseInt(_0x24f2b7[0x0], 0xa) - 0x1e + "px",
                _0x33c0a0 = _0x24f2b7[0x1];
            (_0x41c66d[_0x380804(0x172)][_0x380804(0x26a)] = _0x2320c4 + "\x20" + _0x33c0a0), _0x41c66d[_0x380804(0x2a5)](_0x380804(0x262), "true");
        } else {
            var _0xe1834 = _0x41c66d[_0x380804(0x1ce)](_0x380804(0x265));
            (_0x41c66d[_0x380804(0x172)]["backgroundPosition"] = _0xe1834), _0x41c66d[_0x380804(0x2a5)]("data-moved", _0x380804(0x1c0));
        }
    }
    _0x228268["classList"][_0x380804(0x27a)](_0x380804(0x197));
}
function recentVisit(_0x46b313) {
    const _0x1e0d6d = a39_0x363e4a,
        _0x1c9dcd = userInfo();
    if (!_0x1c9dcd) return;
    geocoder[_0x1e0d6d(0x2a4)](
        _0x46b313,
        function (_0x5c3be7, _0x5735ff, _0x4391ae) {
            const _0x5d5b9e = _0x1e0d6d;
            if (_0x5735ff === daum[_0x5d5b9e(0x170)][_0x5d5b9e(0x1e6)][_0x5d5b9e(0x239)]["OK"]) {
                const _0x155f5c = _0x5c3be7[0x0],
                    _0x11e7ac = _0x155f5c["y"],
                    _0x5f5623 = _0x155f5c["x"],
                    _0x316485 = _0x155f5c[_0x5d5b9e(0x1f9)],
                    _0x1afa9e = _0x155f5c[_0x5d5b9e(0x1fa)][_0x5d5b9e(0x1b6)],
                    _0x102272 = _0x155f5c[_0x5d5b9e(0x1fa)][_0x5d5b9e(0x207)] === "Y" ? "1" : "0",
                    _0x2f253c = _0x155f5c[_0x5d5b9e(0x1fa)][_0x5d5b9e(0x27d)][_0x5d5b9e(0x2ac)](0x4, "0"),
                    _0x41c922 = _0x155f5c["address"]["sub_address_no"] ? _0x155f5c["address"][_0x5d5b9e(0x268)]["padStart"](0x4, "0") : _0x5d5b9e(0x2c0),
                    _0x136c3f = _0x1afa9e + _0x102272 + _0x2f253c + _0x41c922,
                    _0x35ce04 = { ..._0x1c9dcd, address: encodeURIComponent(_0x316485), lat: encodeURIComponent(_0x11e7ac), lng: encodeURIComponent(_0x5f5623), pnu: encodeURIComponent(_0x136c3f) };
                callApiAbort(_0x5d5b9e(0x184), _0x5d5b9e(0x167), _0x35ce04, _0x5d5b9e(0x1ea))
                    [_0x5d5b9e(0x269)]((_0x46f709) => {
                        if (!_0x46f709) return;
                        const { responseData: _0x35092c, message: _0x31ac35, statusCode: _0x305d4e } = _0x46f709;
                        if (_0x305d4e !== 0xc8) return;
                    })
                    [_0x5d5b9e(0x173)]((_0x19bdb6) => {
                        const _0x3572c0 = _0x5d5b9e;
                        console[_0x3572c0(0x1e9)](_0x19bdb6);
                    });
            }
        },
        { size: "5", analyze_type: _0x1e0d6d(0x1dd) }
    );
}
function saveSearchHistory(_0x86d212) {
    const _0x7d38ca = a39_0x363e4a,
        _0x224e6d = userInfo();
    if (!_0x224e6d) return;
    const _0x48b676 = _0x86d212[_0x7d38ca(0x1fa)],
        _0x42ed52 = _0x86d212["lat"],
        _0x3e06c8 = _0x86d212["lng"],
        _0x313bed = { ..._0x224e6d, address: encodeURIComponent(_0x48b676), lat: encodeURIComponent(_0x42ed52), lng: encodeURIComponent(_0x3e06c8) };
    callApiAbort(_0x7d38ca(0x259), _0x7d38ca(0x167), _0x313bed, _0x7d38ca(0x2b1))
        [_0x7d38ca(0x269)]((_0x35251d) => {
            if (!_0x35251d) return;
            const { responseData: _0x24e48c, message: _0x2e6bfb, statusCode: _0x402beb } = _0x35251d;
            if (_0x402beb !== 0xc8) return;
            getRescentHistory();
        })
        [_0x7d38ca(0x173)]((_0x4d593f) => {
            const _0x53e1d8 = _0x7d38ca;
            console[_0x53e1d8(0x1e9)](_0x4d593f);
        });
}
function a39_0x57f5(_0x4bff41, _0x221612) {
    const _0x4e6756 = a39_0x4e67();
    return (
        (a39_0x57f5 = function (_0x57f535, _0x221f63) {
            _0x57f535 = _0x57f535 - 0x164;
            let _0x4fa8f8 = _0x4e6756[_0x57f535];
            return _0x4fa8f8;
        }),
        a39_0x57f5(_0x4bff41, _0x221612)
    );
}
function cancelDrawingMode(_0x2f2948, _0x4834e6) {
    const _0x570919 = a39_0x363e4a;
    if ($(_0x2f2948)[_0x570919(0x299)](_0x570919(0x197))) {
        $(_0x570919(0x26f))[_0x570919(0x1cd)]("active"), lineDrawer["cancelDrawingMode"](_0x2f2948), polygonDrawer[_0x570919(0x190)](_0x2f2948), circleDrawer[_0x570919(0x190)](_0x2f2948);
        return;
    }
    $(_0x570919(0x26f))[_0x570919(0x1cd)](_0x570919(0x197)), lineDrawer["cancelDrawingMode"](_0x2f2948), polygonDrawer[_0x570919(0x190)](_0x2f2948), circleDrawer[_0x570919(0x190)](_0x2f2948);
    if (_0x4834e6 == _0x570919(0x1d4)) lineDrawer[_0x570919(0x1a3)](_0x2f2948);
    else {
        if (_0x4834e6 == "polygon") polygonDrawer[_0x570919(0x1a3)](_0x2f2948);
        else _0x4834e6 == _0x570919(0x1b8) && circleDrawer["onStartDrawing"](_0x2f2948);
    }
}
function a39_0x4e67() {
    const _0x2d8937 = [
        "each",
        "block",
        "success",
        "defs",
        "afterKeyword",
        "item",
        "prototype",
        "70px",
        "POST",
        "Point",
        "135045vAvduq",
        "absolute",
        "onRemove",
        "LatLng",
        "area",
        "textAlign",
        "html",
        "maps",
        "constructor",
        "style",
        "catch",
        "buildingPolygon2",
        "revokeObjectURL",
        "top",
        "setContent",
        "contains",
        "onclick",
        "pnu",
        "CustomOverlay",
        "AbstractOverlay",
        "CIRCLE",
        "</div>",
        "INPUT",
        "80px",
        "#draw_toolbox",
        "querySelectorAll",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22real-price-marker\x22\x20style=\x22padding:5px;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<ul\x20class=\x22text-center\x20bg-white\x20border\x20border-danger\x20overflow-hidden\x22\x20style=\x22border-radius:10px;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20class=\x22up\x20bg-white\x20p-1\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22number\x22>",
        "/front/back/history/recent_visit_register_realPrice.php",
        "createDocumentFragment",
        "MultiPolygon",
        "#FFAAAA",
        "ecologyzmpWFS_1",
        "land_trade_data.csv",
        "split",
        "latitude",
        "Failed\x20to\x20get\x20address\x20information",
        "items",
        "ajax",
        "clearPolygon",
        "cancelDrawingMode",
        "message",
        "coord2RegionCode",
        "innerHTML",
        "region_type",
        "start",
        "/front/back/realPrice/download_realPrice_apartment.php",
        "active",
        "ARROW",
        "EPSG:5186",
        "Tileset",
        "getLng",
        "12UIEheY",
        "onAdd",
        "TEXT",
        "querySelector",
        "text",
        "extend",
        "popstate",
        "toggleDrawingMode",
        "road_address",
        "none",
        "유효하지\x20않은\x20landPolygon입니다.",
        "</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</ul>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p\x20class=\x22position-absolute\x22\x20style=\x22margin:-5px\x200\x200\x2020px;\x20\x22><img\x20src=\x22/front/assets/image/icn_arr_mark.svg\x22\x20width=\x2215\x22\x20alt=\x22\x22\x20title=\x22\x22></p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20",
        "InfoWindow",
        "#analysis_info_table\x20tbody",
        "RECTANGLE",
        "empty",
        "src",
        "sin",
        "response",
        "drag",
        "dealAmount",
        "50%",
        "파일\x20생성에\x20실패했습니다.",
        "blob",
        "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png",
        "getCenter",
        "b_code",
        "addOverlayMapTypeId",
        "circle",
        "removeAllCircles",
        "getPanels",
        "position",
        "Size",
        "error",
        "searchParams",
        "reduce",
        "false",
        "MarkerImage",
        "width",
        "getElementById",
        "setMap",
        "latLng",
        "boundsA\x20SouthWest:",
        "geometry",
        "#draw_toolbox\x20a",
        "all",
        "\x22>◼︎</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td\x20class=\x22text-center\x22>",
        "LatLngBounds",
        "polygon",
        "removeClass",
        "getAttribute",
        "event",
        "result",
        "hasChildNodes",
        "pointFromCoords",
        "height",
        "line",
        "bounds",
        "7XhRyng",
        "body",
        "display",
        "appendChild",
        "1727785KccACT",
        "Marker",
        "value",
        "similar",
        "buildingPolygon",
        "줌\x20레벨:\x20",
        "TILE_NUMBER",
        "POLYGON",
        "API\x20요청\x20중\x20오류\x20발생:",
        "type",
        "stringify",
        "panTo",
        "services",
        "overlayLayer",
        "pointerEvents",
        "log",
        "recentVisit",
        "폴리곤\x20비교\x20중\x20오류\x20발생:",
        "coordinates",
        "getLevel",
        "#analysis_info_table",
        "drawstart",
        "sqrt",
        "getSouthWest",
        "features",
        "select",
        "DrawingManager",
        "url(",
        "featureCollection",
        "curLng",
        "MapTypeId",
        "address_name",
        "address",
        "EPSG:4326",
        "#draw_toolbox\x20a\x20span",
        "Drawing",
        "lat",
        "atan2",
        "push",
        "file_path",
        "Error\x20updating\x20address\x20information:",
        "val",
        "cos",
        "load",
        "getLat",
        "mountain_yn",
        "zIndex",
        "0px\x200px",
        "center",
        "append",
        "history",
        "20240701",
        "offsetHeight",
        "/front/back/realPrice/test.php",
        "273743pneEeW",
        "#f48356",
        "WMS\x20이미지가\x20로드되지\x20않았습니다.",
        "solid",
        "land",
        "#cce6ff",
        "ecologyzmpWFS_2",
        "featureMember",
        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td\x20class=\x22text-center\x22>",
        "getProjection",
        "setBounds",
        "/front/back/realPrice/realPrice_apartment.php",
        "tbl_opn_eczm",
        "drawend",
        "img",
        "find",
        "href",
        "</td>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>",
        "removeOverlayMapTypeId",
        "+proj=tmerc\x20+lat_0=38\x20+lon_0=127\x20+k=1\x20+x_0=200000\x20+y_0=500000\x20+ellps=GRS80\x20+units=m\x20+no_defs",
        "longitude",
        "60px",
        "outerBoundaryIs",
        "last",
        "996odwrQF",
        "map_bg",
        "location",
        "curLat",
        "Polygon",
        "left",
        "polygonMember",
        "#mapSearchInput",
        "intersect",
        "400FRNOtj",
        "draw_tool_btn",
        "node",
        "setCenter",
        "#land_analysis_total_area",
        "filter",
        "draw",
        "lastChild",
        "Status",
        "cancel",
        "parentNode",
        "map",
        "260194hPXnph",
        "LinearRing",
        "geom",
        "#0000FF",
        "createElement",
        "Polyline",
        "Bounds\x20intersect:",
        "offsetWidth",
        "boundsB\x20SouthWest:",
        "overlay-image",
        ".mo-land\x20input[type=radio]:checked",
        "#land_analysis_info_table",
        "addEventListener",
        "drawing",
        "max",
        "100%",
        "&format=png&transparent=true&exceptions=BLANK&SG_APIM=2ug8Dm9qNBfD32JLZGPN64f3EoTlkpD8kSOHWfXpyrY",
        "50px",
        "EPSG:5178",
        "className",
        "curZoom",
        "#e9e8d6",
        "boundsA\x20NorthEast:",
        "dealYear",
        "clear",
        "#fff",
        "20px",
        "height:",
        "/front/back/history/save_search_history.php",
        "values",
        "true",
        "innerBoundaryIs",
        "lng",
        "WMS\x20Blob\x20Response:\x20",
        "pagination",
        "#mapHistoryOpen",
        "6283696SIJqQX",
        "data-moved",
        "256",
        "126.831477350333",
        "data-original-position",
        "ne:",
        "shortdot",
        "sub_address_no",
        "then",
        "backgroundPosition",
        "#analysis_total_area",
        "tilesloaded",
        "lineHeight",
        "/front/back/realPrice/echologyWMS.php",
        ".mo-tool-option\x20button",
        "정보를\x20가져오는\x20중\x20오류가\x20발생했습니다:\x20",
        "EPSG:5179",
        "click",
        "<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<td\x20class=\x22text-center\x22\x20style=\x22color:",
        "&width=",
        "create",
        "<img\x20src=\x22",
        "addListener",
        "forEach",
        "#alert_message",
        "add",
        "border",
        "@text",
        "main_address_no",
        "+proj=merc\x20+lon_0=0\x20+k=1\x20+x_0=0\x20+y_0=0\x20+datum=WGS84\x20+units=m\x20+no_defs",
        "get",
        "loading",
        "span",
        "4525230nUVSaM",
        "유효하지\x20않은\x20ecologyPolygon이\x20있습니다.\x20건너뜁니다.",
        "properties",
        "POLYLINE",
        "zoom_changed",
        "dragend",
        "download",
        "entries",
        "<h2>분석\x20중\x20<span>문제</span>가\x20발생했습니다.\x20다시\x20시도해주세요.</h2>",
        "gotoPage",
        "search",
        "2FaYYic",
        "Feature",
        "/front/back/realPrice/echology.php",
        "edit",
        "tbody",
        "#39f",
        "</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20class=\x22text-white\x20p-1\x22\x20style=\x22background-color:var(--var-color-main-1)\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22number\x22>",
        "OverlayType",
        "16px",
        "isArray",
        "stop",
        "pow",
        "hasClass",
        "#AAAAFF",
        "set",
        "#FF0000",
        "#land_analysis_info_table\x20tbody",
        "256px",
        "POINT(",
        "#9ad37f",
        "div",
        "dblclick",
        "pushState",
        "addressSearch",
        "setAttribute",
        "removeChild",
        "/front/back/realPrice/test2.php",
        "backgroundImage",
        "length",
        "substring",
        "getNorthEast",
        "padStart",
        "createObjectURL",
        "37.199537203472",
        "14px",
        "toFixed",
        "saveSearchHistory",
        "open",
        "code",
        "<div\x20style=\x22padding:5px;z-index:1;\x22>",
        "32226ZQPLAn",
        "header",
        ":checked",
        "tagName",
        "toString",
        "Places",
        "getContent",
        "202407",
        "resultMsg",
        "ready",
        "width:",
        "0000",
        "+proj=tmerc\x20+lat_0=38\x20+lon_0=127.5\x20+k=1\x20+x_0=200000\x20+y_0=500000\x20+ellps=GRS80\x20+units=m\x20+no_defs",
        "MarkerClusterer",
        "EPSG:5176",
        "min",
        "status",
    ];
    a39_0x4e67 = function () {
        return _0x2d8937;
    };
    return a39_0x4e67();
}
function resetDrawing() {
    const _0x512fea = a39_0x363e4a;
    lineDrawer["clearAllLines"](), circleDrawer[_0x512fea(0x1b9)](), polygonDrawer[_0x512fea(0x18f)]();
}
