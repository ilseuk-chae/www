const a9_0x4eeaff = a9_0x5d58;
(function (_0x4832ba, _0x4502e3) {
    const _0x5b5ced = a9_0x5d58,
        _0x3b0ee8 = _0x4832ba();
    while (!![]) {
        try {
            const _0x4b8104 =
                parseInt(_0x5b5ced(0x115)) / 0x1 +
                -parseInt(_0x5b5ced(0xce)) / 0x2 +
                (-parseInt(_0x5b5ced(0xfd)) / 0x3) * (-parseInt(_0x5b5ced(0xa0)) / 0x4) +
                (-parseInt(_0x5b5ced(0x128)) / 0x5) * (parseInt(_0x5b5ced(0xda)) / 0x6) +
                (-parseInt(_0x5b5ced(0xdd)) / 0x7) * (-parseInt(_0x5b5ced(0xc2)) / 0x8) +
                parseInt(_0x5b5ced(0xc3)) / 0x9 +
                -parseInt(_0x5b5ced(0xe0)) / 0xa;
            if (_0x4b8104 === _0x4502e3) break;
            else _0x3b0ee8["push"](_0x3b0ee8["shift"]());
        } catch (_0x5da2a0) {
            _0x3b0ee8["push"](_0x3b0ee8["shift"]());
        }
    }
})(a9_0x39f4, 0x62164),
    $(document)[a9_0x4eeaff(0xfb)](async function () {
        const _0x392f82 = a9_0x4eeaff;
        if (!userInfo()) {
            alert("정상적인\x20접근이\x20아닙니다."), (location[_0x392f82(0xc8)] = "/index");
            return;
        }
        try {
            const _0x5d2a22 = await initSelect();
            _0x5d2a22 && initDetail();
        } catch (_0x18b3a8) {}
        initModal(), initEvents(), initValidation();
    });
async function initSelect() {
    return await estate_type_get(), await sale_type_get(), await sido_get(), !![];
}
function initEvents() {
    const _0x2350a7 = a9_0x4eeaff;
    $(_0x2350a7(0xfa))["on"](_0x2350a7(0xc9), function () {
        const _0x555c45 = _0x2350a7,
            _0x4dcc32 = $(this)[_0x555c45(0xb6)]();
        sgg_get(_0x4dcc32);
    }),
        $(_0x2350a7(0xcd))["on"](_0x2350a7(0xd0), function () {
            const _0x1a34b3 = _0x2350a7;
            console[_0x1a34b3(0xc6)](_0x1a34b3(0x124)), location[_0x1a34b3(0xc7)]();
        }),
        $(_0x2350a7(0xf1))["on"](_0x2350a7(0xaf), function () {
            autoResize(this);
        }),
        $(_0x2350a7(0xd4))["on"](_0x2350a7(0xbc), function () {
            const _0x55cd9b = _0x2350a7;
            $(_0x55cd9b(0x112))[_0x55cd9b(0x111)](_0x55cd9b(0xc5))[_0x55cd9b(0xe7)](_0x55cd9b(0xe3), ![]), $(_0x55cd9b(0xd4))[_0x55cd9b(0xfc)](), $(_0x55cd9b(0xd2))[_0x55cd9b(0xe5)]();
        }),
        $(_0x2350a7(0xd2))["on"](_0x2350a7(0xbc), async function () {
            const _0x52947b = _0x2350a7;
            $(_0x52947b(0xe8))[_0x52947b(0x113)]("open");
        }),
        $(_0x2350a7(0xe4))["on"](_0x2350a7(0xbc), async function () {
            const _0x499135 = _0x2350a7,
                _0x26abfc = await sweetConfirm(_0x499135(0x11e), "", "q");
            _0x26abfc && findDelete();
        });
}
function initValidation() {
    const _0x3863eb = a9_0x4eeaff;
    var _0x10c64c = document[_0x3863eb(0x118)](_0x3863eb(0xca));
    Array["prototype"][_0x3863eb(0xff)]["call"](_0x10c64c)[_0x3863eb(0xd6)](function (_0x47176f) {
        const _0x504fad = _0x3863eb,
            _0x1fbfe7 = document[_0x504fad(0xa5)](_0x504fad(0xbe)),
            _0x2372be = document["getElementById"](_0x504fad(0xf4)),
            _0x53dd7d = [_0x1fbfe7];
        if (!_0x1fbfe7) {
            console[_0x504fad(0x123)](_0x504fad(0xbb));
            return;
        } else console["log"]("#save_confirm_btn\x20found");
        _0x1fbfe7[_0x504fad(0xa2)](
            "click",
            async function (_0x141eb9) {
                const _0x2319b9 = _0x504fad;
                _0x141eb9[_0x2319b9(0xe9)](), $(_0x2319b9(0xe8))[_0x2319b9(0x113)]("close");
                const _0x101a90 = $(_0x47176f)[_0x2319b9(0x111)](_0x2319b9(0x11b));
                let _0x1a54fc = !![],
                    _0x120502 = null;
                _0x101a90[_0x2319b9(0xd8)]((_0x535a95, _0x123e44) => {
                    const _0x273b17 = _0x2319b9,
                        _0x2220ed = $(_0x123e44);
                    console[_0x273b17(0xc6)](_0x2220ed);
                    const _0x559d6f = _0x2220ed[_0x273b17(0xf0)](_0x273b17(0x110)) || _0x2220ed[_0x273b17(0xe7)](_0x273b17(0xd1))[_0x273b17(0x10c)]();
                    let _0x2432c4, _0x187531;
                    switch (_0x559d6f) {
                        case _0x273b17(0x106):
                            (_0x2432c4 = _0x273b17(0x106)), (_0x187531 = _0x273b17(0xa7));
                            break;
                        case _0x273b17(0xde):
                            (_0x2432c4 = "password"), (_0x187531 = "비밀번호");
                            break;
                        case "tel":
                            (_0x2432c4 = _0x273b17(0xf5)), (_0x187531 = _0x273b17(0xae));
                            break;
                        case _0x273b17(0xeb):
                            (_0x2432c4 = _0x273b17(0xeb)), (_0x187531 = _0x273b17(0xfe));
                            break;
                        case _0x273b17(0xef):
                            (_0x2432c4 = "select"), (_0x187531 = "옵션");
                            break;
                        default:
                            (_0x2432c4 = _0x559d6f), (_0x187531 = "값");
                    }
                    const _0x42f4d8 = validateInput(_0x2220ed, _0x2432c4, _0x187531 + _0x273b17(0xa4)),
                        _0x42b450 = _0x2220ed[_0x273b17(0xcf)]()["find"](".invalid-feedback")["length"] != 0x0 ? _0x2220ed[_0x273b17(0xcf)]()[_0x273b17(0x111)](".invalid-feedback") : _0x2220ed[_0x273b17(0xcf)]()[_0x273b17(0xcf)]()[_0x273b17(0x111)](_0x273b17(0x11f));
                    !_0x42f4d8
                        ? (_0x42b450[_0x273b17(0xa1)] > 0x0 ? (_0x42b450["show"](), _0x2220ed[0x0]["setCustomValidity"](_0x42b450["text"]())) : _0x2220ed[0x0]["setCustomValidity"](_0x187531 + _0x273b17(0xa4)),
                          _0x2220ed[0x0][_0x273b17(0x120)](),
                          _0x2220ed[_0x273b17(0x122)](_0x273b17(0xd9)),
                          (_0x1a54fc = ![]),
                          !_0x120502 && (_0x120502 = _0x2220ed))
                        : (_0x42b450[_0x273b17(0xfc)](), _0x2220ed[0x0][_0x273b17(0x12e)](""), _0x2220ed[_0x273b17(0x10a)](_0x273b17(0xd9)));
                });
                !_0x1a54fc
                    ? (_0x120502 && (_0x120502[0x0]["scrollIntoView"]({ behavior: _0x2319b9(0xe1), block: _0x2319b9(0x108) }), _0x120502[0x0][_0x2319b9(0x120)](), _0x120502[_0x2319b9(0x119)]()), _0x141eb9[_0x2319b9(0xe9)](), _0x141eb9[_0x2319b9(0xdc)]())
                    : (_0x141eb9["preventDefault"](), _0x141eb9["stopPropagation"](), findModify());
                return;
            },
            ![]
        ),
            _0x47176f["querySelectorAll"](_0x504fad(0xb9))["forEach"](function (_0x44c129) {
                const _0x2c1146 = _0x504fad;
                _0x44c129[_0x2c1146(0xa2)](_0x2c1146(0xaf), function () {
                    const _0x4d55d5 = _0x2c1146,
                        _0x177930 = $(_0x44c129),
                        _0x572362 = _0x177930[_0x4d55d5(0xf0)](_0x4d55d5(0x110)) || _0x177930[_0x4d55d5(0xe7)](_0x4d55d5(0xd1))[_0x4d55d5(0x10c)]();
                    let _0x2e8fff, _0x14a9e5;
                    switch (_0x572362) {
                        case _0x4d55d5(0x106):
                            (_0x2e8fff = _0x4d55d5(0x106)), (_0x14a9e5 = "값");
                            break;
                        case _0x4d55d5(0xde):
                            (_0x2e8fff = _0x4d55d5(0xde)), (_0x14a9e5 = _0x4d55d5(0x103));
                            break;
                        case _0x4d55d5(0xbd):
                            (_0x2e8fff = _0x4d55d5(0xf5)), (_0x14a9e5 = "연락처");
                            break;
                        case "checkbox":
                            (_0x2e8fff = "checkbox"), (_0x14a9e5 = _0x4d55d5(0xfe));
                            break;
                        case _0x4d55d5(0xef):
                            (_0x2e8fff = _0x4d55d5(0xef)), (_0x14a9e5 = "옵션");
                            break;
                        default:
                            (_0x2e8fff = _0x572362), (_0x14a9e5 = "값");
                    }
                    const _0x5ea1e1 = validateInput(_0x177930, _0x2e8fff, _0x14a9e5 + _0x4d55d5(0xa4)),
                        _0x58313c = _0x177930[_0x4d55d5(0xcf)]()[_0x4d55d5(0x111)](_0x4d55d5(0x11f))[_0x4d55d5(0xa1)] != 0x0 ? _0x177930["parent"]()[_0x4d55d5(0x111)](_0x4d55d5(0x11f)) : _0x177930[_0x4d55d5(0xcf)]()[_0x4d55d5(0xcf)]()[_0x4d55d5(0x111)](".invalid-feedback");
                    _0x5ea1e1
                        ? (_0x177930[_0x4d55d5(0x10a)](_0x4d55d5(0xd9))[_0x4d55d5(0x122)]("is-valid"), _0x177930[0x0][_0x4d55d5(0x12e)](""), _0x58313c[_0x4d55d5(0xfc)]())
                        : (_0x177930[_0x4d55d5(0x10a)](_0x4d55d5(0x121))[_0x4d55d5(0x122)](_0x4d55d5(0xd9)),
                          _0x58313c["length"] > 0x0 ? (_0x177930[0x0][_0x4d55d5(0x12e)](_0x58313c[_0x4d55d5(0x106)]()), _0x58313c["show"]()) : _0x177930[0x0][_0x4d55d5(0x12e)](_0x14a9e5 + "을(를)\x20확인해주세요."),
                          _0x177930[0x0][_0x4d55d5(0x120)]());
                });
            });
    });
}
async function estate_type_get() {
    const _0x10dd92 = a9_0x4eeaff,
        _0x5466c3 = {};
    callApiAbort("/front/back/find/estate_type_get.php", _0x10dd92(0xf7), _0x5466c3, _0x10dd92(0xbf))
        [_0x10dd92(0x12f)]((_0x4cf47f) => {
            const _0x4de2fb = _0x10dd92;
            populateOptions(_0x4de2fb(0x117), _0x4cf47f[_0x4de2fb(0x10e)], _0x4de2fb(0x11a), "type_name");
        })
        [_0x10dd92(0xe2)]((_0x25c1cc) => {
            const _0x4efa12 = _0x10dd92;
            console[_0x4efa12(0x123)](_0x4efa12(0xf3), _0x25c1cc);
        })
        ["finally"](() => {});
}
async function sale_type_get() {
    const _0x4aa567 = a9_0x4eeaff,
        _0x2e66ee = {};
    try {
        const _0x424e3a = await callApiAbort(_0x4aa567(0xe6), _0x4aa567(0xf7), _0x2e66ee, _0x4aa567(0xc1));
        populateOptions(_0x4aa567(0xb2), _0x424e3a["responseData"], _0x4aa567(0x11a), _0x4aa567(0xdb));
    } catch (_0x6f78fe) {
        console[_0x4aa567(0x123)](_0x4aa567(0xf3), _0x6f78fe);
        throw _0x6f78fe;
    }
}
async function sido_get() {
    const _0x500896 = a9_0x4eeaff,
        _0x5a57fd = {};
    try {
        const _0x47aa72 = await callApiAbort("/front/back/find/sido_get.php", _0x500896(0xf7), _0x5a57fd, _0x500896(0xa3));
        populateOptions(_0x500896(0xfa), _0x47aa72[_0x500896(0x10e)], _0x500896(0xc0), _0x500896(0x130));
    } catch (_0x430e7c) {
        console[_0x500896(0x123)](_0x500896(0xf3), _0x430e7c);
        throw _0x430e7c;
    }
}
async function sgg_get(_0x4da6eb) {
    const _0x43939f = a9_0x4eeaff,
        _0x4f065f = { sido_cd: encodeURIComponent(_0x4da6eb || getParameter(_0x43939f(0xba))) };
    try {
        const _0x1d9445 = await callApiAbort(_0x43939f(0x12b), "POST", _0x4f065f, "sgg_get");
        return $(_0x43939f(0x109))["empty"]()["append"](_0x43939f(0x131)), populateOptions("#sgg", _0x1d9445["responseData"], "sgg_cd", _0x43939f(0xad)), _0x1d9445[_0x43939f(0x10e)];
    } catch (_0x3bfc5e) {
        console["error"](_0x43939f(0xf3), _0x3bfc5e);
        throw _0x3bfc5e;
    }
}
function initDetail() {
    const _0x1502ba = a9_0x4eeaff,
        _0x290f48 = getParameter(_0x1502ba(0xf6));
    if (!_0x290f48) {
        alert(_0x1502ba(0x127)), (location[_0x1502ba(0xc8)] = _0x1502ba(0xcc));
        return;
    }
    const _0xd95905 = { ...userInfo(), viewNo: encodeURIComponent(_0x290f48) };
    callApiAbort(_0x1502ba(0xa6), "POST", _0xd95905, _0x1502ba(0x10b))
        [_0x1502ba(0x12f)](async (_0x38a2c6) => {
            const _0x4d4ec7 = _0x1502ba;
            let { responseData: _0x37f0e1, message: _0x195c71, statusCode: _0x3c476c } = _0x38a2c6;
            if (!handleError(_0x195c71, _0x3c476c)) return;
            if (_0x37f0e1["length"] == 0x0) {
                sweetAlertMessage("정상적인\x20접근이\x20아닙니다.", "", "e");
                return;
            }
            (data = _0x37f0e1[0x0]), $(_0x4d4ec7(0xd2))["attr"](_0x4d4ec7(0xb3), data[_0x4d4ec7(0xd3)]), $("#sido")["val"](data[_0x4d4ec7(0xc0)]);
            try {
                await sgg_get(data[_0x4d4ec7(0xc0)]), $(_0x4d4ec7(0x109))["val"](data[_0x4d4ec7(0x107)]);
            } catch (_0x487668) {
                console[_0x4d4ec7(0x123)](_0x4d4ec7(0xc4), _0x487668);
            }
            $(_0x4d4ec7(0xb0))[_0x4d4ec7(0x106)](data[_0x4d4ec7(0xba)] + "\x20" + (data["sido"] !== data[_0x4d4ec7(0x10d)] ? data["sgg"] : "")),
                $(_0x4d4ec7(0x117))[_0x4d4ec7(0xb6)](data[_0x4d4ec7(0xac)]),
                $(_0x4d4ec7(0xb2))[_0x4d4ec7(0xb6)](data[_0x4d4ec7(0xa8)]),
                data[_0x4d4ec7(0x9f)] == "Y" ? $("#exchange_fg")[_0x4d4ec7(0xe7)](_0x4d4ec7(0xea), !![]) : $(_0x4d4ec7(0x12a))["prop"](_0x4d4ec7(0xea), ![]),
                $(_0x4d4ec7(0x10f))[_0x4d4ec7(0xb6)](data[_0x4d4ec7(0x105)]),
                $(_0x4d4ec7(0xb4))["val"](data[_0x4d4ec7(0xed)]),
                $(_0x4d4ec7(0x9d))["val"](data["min_area"]),
                $(_0x4d4ec7(0x12c))[_0x4d4ec7(0xb6)](data[_0x4d4ec7(0x9e)]),
                $(_0x4d4ec7(0xf2))["val"](data[_0x4d4ec7(0xf5)]),
                $(_0x4d4ec7(0xf1))[_0x4d4ec7(0xb6)](data[_0x4d4ec7(0x12d)]);
        })
        [_0x1502ba(0xe2)]((_0x13f57b) => {
            const _0x2ab5c6 = _0x1502ba;
            console[_0x2ab5c6(0xc6)](_0x13f57b);
        });
}
function findModify() {
    const _0x3c1ca6 = a9_0x4eeaff,
        _0x354703 = {
            ...userInfo(),
            no: $(_0x3c1ca6(0xd2))[_0x3c1ca6(0xf0)](_0x3c1ca6(0xb3)) || "",
            sido: $(_0x3c1ca6(0xfa))[_0x3c1ca6(0xb6)]() || "",
            sgg: $(_0x3c1ca6(0x109))[_0x3c1ca6(0xb6)]() || "",
            estate_type: encodeURIComponent($(_0x3c1ca6(0x117))[_0x3c1ca6(0xb6)]() || ""),
            sale_type: encodeURIComponent($("#sale_type")["val"]() || ""),
            exchange_fg: encodeURIComponent($(_0x3c1ca6(0x12a))["is"](_0x3c1ca6(0xaa)) ? "Y" : "N"),
            min_price: $(_0x3c1ca6(0x10f))["val"]() || "",
            max_price: $(_0x3c1ca6(0xb4))[_0x3c1ca6(0xb6)]() || "",
            min_area: $(_0x3c1ca6(0x9d))["val"]() || "",
            max_area: $(_0x3c1ca6(0x12c))["val"]() || "",
            phone: encodeURIComponent($(_0x3c1ca6(0xf2))["val"]()[_0x3c1ca6(0xab)](/-/g, "") || ""),
            description: encodeURIComponent($(_0x3c1ca6(0xf1))["val"]() || ""),
        };
    callApiAbort(_0x3c1ca6(0xb1), _0x3c1ca6(0xf7), _0x354703, _0x3c1ca6(0x125))
        ["then"]((_0x2584e1) => {
            const _0x34c8e9 = _0x3c1ca6;
            if (!_0x2584e1) {
                $(_0x34c8e9(0xb7))[_0x34c8e9(0x113)](_0x34c8e9(0xdf));
                return;
            }
            const { statusCode: _0x49a808, message: _0x462880, responseData: _0x1a3578 } = _0x2584e1;
            _0x49a808 == 0xc8 && _0x462880 == "SUCCESS"
                ? ($(_0x34c8e9(0xcd))["iziModal"]("open"),
                  $(_0x34c8e9(0xcd))["on"](_0x34c8e9(0xd0), function () {
                      const _0x449fe9 = _0x34c8e9;
                      console[_0x449fe9(0xc6)](_0x449fe9(0x124)), location[_0x449fe9(0xc7)]();
                  }))
                : $(_0x34c8e9(0xb7))[_0x34c8e9(0x113)]("open");
        })
        [_0x3c1ca6(0xe2)]((_0xfcba1a) => {
            const _0x52fb86 = _0x3c1ca6;
            console[_0x52fb86(0x123)](_0x52fb86(0xf3), _0xfcba1a);
        })
        [_0x3c1ca6(0xcb)](() => {});
}
async function findDelete() {
    const _0x3ecd08 = a9_0x4eeaff;
    //     _0xd31f5b = await sweetConfirm(_0x3ecd08(0x104), "", "w");
    // if (!_0xd31f5b) return;
    const _0x2c6ddb = { ...userInfo(), rcvNo: $(_0x3ecd08(0xd2))[_0x3ecd08(0xf0)]("data-no") || "" },
        _0x10d981 = await callApi(_0x3ecd08(0xf7), _0x3ecd08(0x100), _0x2c6ddb);
    if (!_0x10d981) return;
    const { status: _0x40b4d8, message: _0x23c046 } = _0x10d981;
    if (_0x23c046 === _0x3ecd08(0xf9)) {
        const _0x2f77f5 = await sweetAlertForReturn(_0x3ecd08(0xec), "", "s");
        if (_0x2f77f5) location[_0x3ecd08(0xc8)] = _0x3ecd08(0x126);
    } else {
        const _0x1e0df0 = await sweetAlertForReturn(_0x3ecd08(0x11d), "", "e");
        if (_0x1e0df0) location[_0x3ecd08(0xc7)]();
    }
}
function populateOptions(_0x2b419a, _0x1f0535, _0x34027c, _0x91dbd9) {
    const _0x3b4f2f = a9_0x4eeaff;
    if (_0x1f0535["length"] > 0x0) {
        _0x1f0535[_0x3b4f2f(0x101)]((_0x1e8171, _0x4d8d90) => _0x1e8171[_0x91dbd9][_0x3b4f2f(0x114)](_0x4d8d90[_0x91dbd9]));
        const _0x1040b5 = _0x1f0535[_0x3b4f2f(0xb8)]((_0x1582f3) => _0x3b4f2f(0x102) + _0x1582f3[_0x34027c] + "\x22>" + _0x1582f3[_0x91dbd9] + "</option>")[_0x3b4f2f(0x129)]("");
        $(_0x2b419a)[_0x3b4f2f(0xb5)](_0x1040b5);
    }
}
function a9_0x5d58(_0x347f96, _0xb1a700) {
    const _0x39f4a4 = a9_0x39f4();
    return (
        (a9_0x5d58 = function (_0x5d585b, _0x3d9475) {
            _0x5d585b = _0x5d585b - 0x9d;
            let _0x1b63c7 = _0x39f4a4[_0x5d585b];
            return _0x1b63c7;
        }),
        a9_0x5d58(_0x347f96, _0xb1a700)
    );
}
function initModal() {
    const _0x532439 = a9_0x4eeaff;
    _0x541297(_0x532439(0xe8), "/front/assets/lottie/save.json", _0x532439(0xd5)), _0x541297(_0x532439(0xcd), _0x532439(0xd7), _0x532439(0xa9)), _0x541297(_0x532439(0xb7), _0x532439(0x11c), "#lottieFail");
    function _0x541297(_0x4ce620, _0x1cfc05, _0x2c1b4f) {
        const _0x361f44 = _0x532439;
        $(_0x4ce620)[_0x361f44(0x113)]({ width: _0x361f44(0xf8), onOpened: function (_0xed6403) {} });
        var _0x204c92 = bodymovin["loadAnimation"]({ container: document["querySelector"](_0x2c1b4f), renderer: _0x361f44(0x116), loop: !![], autoplay: !![], path: _0x1cfc05 });
    }
}
function a9_0x39f4() {
    const _0xfc137c = [
        "비밀번호",
        "삭제\x20하시겠습니까?",
        "min_price",
        "text",
        "sgg_cd",
        "center",
        "#sgg",
        "removeClass",
        "initDetail",
        "toLowerCase",
        "sgg",
        "responseData",
        "#min_price",
        "type",
        "find",
        "form.needs-validation",
        "iziModal",
        "localeCompare",
        "674306NXyqlp",
        "svg",
        "#estate_type",
        "querySelectorAll",
        "focus",
        "type_code",
        "[required]",
        "/front/assets/lottie/failed.json",
        "삭제를\x20실패했습니다.",
        "삭제하시겠습니까?",
        ".invalid-feedback",
        "reportValidity",
        "is-valid",
        "addClass",
        "error",
        "Modal\x20closed",
        "findModify",
        "/front/views/mypage/mypage_find",
        "정상적인\x20접근이\x20아닙니다.",
        "465805lmDcSn",
        "join",
        "#exchange_fg",
        "/front/back/find/sgg_get.php",
        "#max_area",
        "description",
        "setCustomValidity",
        "then",
        "locallow_nm",
        "<option\x20value=\x22\x22>선택하세요.</option>",
        "#min_area",
        "max_area",
        "exchange_fg",
        "91804NcroTk",
        "length",
        "addEventListener",
        "sido_get",
        "을(를)\x20확인해주세요.",
        "getElementById",
        "/front/back/find/find_detail.php",
        "입력값",
        "sale_type_cd",
        "#lottieCompletion",
        ":checked",
        "replace",
        "estate_type_cd",
        "locatadd_nm",
        "연락처",
        "input",
        "#address",
        "/front/back/find/find_modify.php",
        "#sale_type",
        "data-no",
        "#max_price",
        "append",
        "val",
        "#modalFail",
        "map",
        "input[required],\x20select[required],\x20textarea[required]",
        "sido",
        "#save_confirm_btn\x20not\x20found",
        "click",
        "tel",
        "save_confirm_btn",
        "estate_type_get",
        "sido_cd",
        "sale_type_get",
        "2293208NbcNDT",
        "414387mPDeAA",
        "SGG\x20설정\x20실패",
        "input,\x20select,\x20checkbox,\x20textarea",
        "log",
        "reload",
        "href",
        "change",
        ".needs-validation",
        "finally",
        "/index",
        "#modalCompletion",
        "354560JxObJC",
        "parent",
        "closed",
        "tagName",
        "#save_btn",
        "wanted_no",
        "#modify_btn",
        "#lottieConfirm",
        "forEach",
        "/front/assets/lottie/save.json",
        "each",
        "is-invalid",
        "42eKzJix",
        "type_name",
        "stopPropagation",
        "7rQfDkV",
        "password",
        "open",
        "2118980BtcVgi",
        "smooth",
        "catch",
        "disabled",
        "#delete_btn",
        "show",
        "/front/back/find/sale_type_get.php",
        "prop",
        "#modalConfirm",
        "preventDefault",
        "checked",
        "checkbox",
        "처리\x20되었습니다.",
        "max_price",
        "문제가\x20발생했습니다.\x20",
        "select",
        "attr",
        "#description",
        "#phone",
        "API\x20호출\x20실패",
        "save_btn",
        "phone",
        "viewNo",
        "POST",
        "470px",
        "SUCCESS",
        "#sido",
        "ready",
        "hide",
        "57HDviWc",
        "체크박스",
        "slice",
        "/front/back/mypage/find_delete.php",
        "sort",
        "<option\x20value=\x22",
    ];
    a9_0x39f4 = function () {
        return _0xfc137c;
    };
    return a9_0x39f4();
}
function handleError(_0x205d09, _0x182648) {
    const _0x2bdf2e = a9_0x4eeaff;
    switch (_0x182648) {
        case 0x190:
            sweetAlertMessage(_0x205d09, "", "e");
            return ![];
            break;
        case 0x194:
            sweetAlertMessage(_0x2bdf2e(0xee), "", "e");
            return ![];
            break;
        case 0x1f4:
            sweetAlertMessage(_0x2bdf2e(0xee), "", "e");
            return ![];
            break;
        default:
            return !![];
            break;
    }
}
