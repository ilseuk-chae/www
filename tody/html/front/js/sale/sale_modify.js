const a50_0x2091a6 = a50_0xd6b2;
function a50_0xd6b2(_0x4b7559, _0x55fb89) {
    const _0x424937 = a50_0x4249();
    return (
        (a50_0xd6b2 = function (_0xd6b281, _0x3dff9f) {
            _0xd6b281 = _0xd6b281 - 0xec;
            let _0x5b98fa = _0x424937[_0xd6b281];
            return _0x5b98fa;
        }),
        a50_0xd6b2(_0x4b7559, _0x55fb89)
    );
}
(function (_0x3b7f14, _0x566ec8) {
    const _0x8c0cc2 = a50_0xd6b2,
        _0x55f052 = _0x3b7f14();
    while (!![]) {
        try {
            const _0x23460c =
                (-parseInt(_0x8c0cc2(0x18e)) / 0x1) * (parseInt(_0x8c0cc2(0x1f0)) / 0x2) +
                (parseInt(_0x8c0cc2(0x128)) / 0x3) * (-parseInt(_0x8c0cc2(0x1c7)) / 0x4) +
                (parseInt(_0x8c0cc2(0x1fa)) / 0x5) * (-parseInt(_0x8c0cc2(0x14b)) / 0x6) +
                -parseInt(_0x8c0cc2(0x1d9)) / 0x7 +
                (parseInt(_0x8c0cc2(0x1e9)) / 0x8) * (parseInt(_0x8c0cc2(0x165)) / 0x9) +
                (-parseInt(_0x8c0cc2(0x19b)) / 0xa) * (-parseInt(_0x8c0cc2(0x14e)) / 0xb) +
                (-parseInt(_0x8c0cc2(0x154)) / 0xc) * (-parseInt(_0x8c0cc2(0x173)) / 0xd);
            if (_0x23460c === _0x566ec8) break;
            else _0x55f052["push"](_0x55f052["shift"]());
        } catch (_0x493120) {
            _0x55f052["push"](_0x55f052["shift"]());
        }
    }
})(a50_0x4249, 0x439b9);
let geocoder = new kakao[a50_0x2091a6(0x172)][a50_0x2091a6(0x1e4)][a50_0x2091a6(0x192)](),
    globalBrTitleInfo = null,
    globalBrRecapTitleInfo = null,
    useAprDayPickr,
    swiper,
    fileManager,
    isEventEnabled = !![],
    mainSearchBoxChk = 0;

$(document)[a50_0x2091a6(0x18d)](async function () {
    const _0x183b4b = a50_0x2091a6,
        _0x96bff8 = new URLSearchParams(window[_0x183b4b(0x11c)][_0x183b4b(0x1a9)]),
        _0x210a8f = parseFloat(_0x96bff8[_0x183b4b(0xf5)]("no"));
    if (!_0x210a8f) {
        const _0x426c07 = await sweetAlertMessage("올바르지\x20않은\x20요청입니다.", "", "e");
        _0x426c07 && history[_0x183b4b(0x117)]();
    }
    initModal(), initDefaultSet(_0x210a8f), initEvents(_0x210a8f), (fileManager = initImageEvents()), initValidation(_0x210a8f);
});
async function initDefaultSet(_0x5914c7) {
    const _0x25d67e = a50_0x2091a6;
    if (!userInfo()) {
        alert(_0x25d67e(0x197)), (location[_0x25d67e(0x144)] = _0x25d67e(0x1d0));
        return;
    }
    (useAprDayPickr = flatpickr(_0x25d67e(0xf8), { dateFormat: _0x25d67e(0x1aa), altFormat: "F\x20j,\x20Y", altInput: !![], locale: "ko" })),
        (swiper = new Swiper(".fw-file", { slidesPerView: _0x25d67e(0x121), spaceBetween: 0xf })),
        $("form\x20button")[_0x25d67e(0x10c)](_0x25d67e(0x19a))[_0x25d67e(0xfb)](_0x25d67e(0x1da), !![]),
        $(_0x25d67e(0x15a))["prop"](_0x25d67e(0x1da), !![]),
        $(_0x25d67e(0x1bf))[_0x25d67e(0xfb)](_0x25d67e(0x1da), !![]),
        $(_0x25d67e(0x177))[_0x25d67e(0xfb)]("disabled", !![]),
        $(".building-group")[_0x25d67e(0x1d2)](),
        $(_0x25d67e(0x1dd))[_0x25d67e(0x1d2)](),
        $(_0x25d67e(0x13a))[_0x25d67e(0x1d2)]();
    try {
        await initSelect();
    } finally {
        saleInfo(_0x5914c7);
    }
}
async function initSelect() {
    const _0x3ee785 = a50_0x2091a6,
        _0x32fda8 = _0x3ee785(0x17c);
    try {
        const _0x2f8612 = await callApi(_0x3ee785(0x188), _0x32fda8, {});
        if (!_0x2f8612) return;
        const { message: _0x49e609, responseData: _0x35c2a4, statusCode: _0x4ac7da } = _0x2f8612;
        if (_0x4ac7da !== 0xc8 || _0x35c2a4[_0x3ee785(0x169)] == 0x0) return;
        const { ESTATE_TYPE: _0x44fd1c, SALE_TYPE: _0x8ad09b } = _0x35c2a4,
            _0x30a663 = _0x44fd1c[_0x3ee785(0x12b)](function (_0x26c24c, _0x4261a1) {
                const _0x113261 = _0x3ee785,
                    { type_code: _0x3c66db, type_name: _0x49a35a } = _0x26c24c;
                return _0x113261(0x182) + _0x3c66db + "\x22>" + _0x49a35a + _0x113261(0x11e);
            }),
            _0x2e759c = _0x8ad09b[_0x3ee785(0x12b)](function (_0x237315, _0x59caff) {
                const _0x18a147 = _0x3ee785,
                    { type_code: _0x29e7f2, type_name: _0x204b47 } = _0x237315;
                return "<option\x20value=\x22" + _0x29e7f2 + "\x22>" + _0x204b47 + _0x18a147(0x11e);
            });
        return $(_0x3ee785(0x127))[_0x3ee785(0x1ab)](_0x30a663), $(_0x3ee785(0xf9))[_0x3ee785(0x1ab)](_0x2e759c), !![];
    } catch (_0x2a248c) {
        return console["error"](_0x3ee785(0x140), _0x2a248c), ![];
    }
}
function initEvents(_0x20ecf) {
    const _0x4ea101 = a50_0x2091a6;
    (function (_0x5337c8) {
        const _0x284698 = a50_0xd6b2;
        var _0x1eb7a8 = _0x5337c8["fn"]["val"],
            _0x348619 = ![];
        _0x5337c8["fn"][_0x284698(0x111)] = function () {
            const _0x14b596 = _0x284698;
            var _0x159b50 = _0x1eb7a8["apply"](this, arguments);
            return arguments[_0x14b596(0x169)] > 0x0 && !_0x348619 && ((_0x348619 = !![]), this[_0x14b596(0x10f)]("input"), (_0x348619 = ![])), _0x159b50;
        };
    })(jQuery),
        $("#modify_btn")["on"](_0x4ea101(0x13d), function () {
            $(".search-address-group").removeClass("d-none");
            const _0x4f7da9 = _0x4ea101;
            $(".plus-desc-box")["removeClass"](_0x4f7da9(0x100)),
                $(_0x4f7da9(0xef))[_0x4f7da9(0x1d2)](),
                $(_0x4f7da9(0x12c))[_0x4f7da9(0xf4)]("input,\x20select,\x20checkbox,\x20textarea,\x20button")[_0x4f7da9(0x10c)](_0x4f7da9(0x19a))[_0x4f7da9(0xfb)]("disabled", ![]),
                $("#save_btn")[_0x4f7da9(0x1b2)](),
                $(".swiper-wrapper")[_0x4f7da9(0xf4)]("i")["show"](),
                swiper[_0x4f7da9(0x16c)]();
        }),
        $(_0x4ea101(0x14f))["on"]("click", function () {
            const _0x2eb134 = _0x4ea101;
            $(_0x2eb134(0x116))[_0x2eb134(0x1ca)]("open");
        }),
        $(_0x4ea101(0x1f4))["on"](_0x4ea101(0x13d), function () {
            saleDelete(_0x20ecf);
        }),
        // $(_0x4ea101(0xed))["on"](_0x4ea101(0x1b0), function () {
        //     isEventEnabled && searchAddress($(this)["val"]());
        // }),
        $(_0x4ea101(0xf9))["on"](_0x4ea101(0x151), function () {
            const _0x51e07c = _0x4ea101,
                _0x57f7f5 = $(this)["val"]();
            _0x57f7f5 === _0x51e07c(0x1a3)
                ? ($(_0x51e07c(0x13a))["show"](), $("#sale_price")[_0x51e07c(0x143)]("placeholder", _0x51e07c(0x1f3)), $(_0x51e07c(0x139))[_0x51e07c(0xfb)](_0x51e07c(0x19f), !![]))
                : ($(_0x51e07c(0x13a))["hide"](), $(_0x51e07c(0x181))[_0x51e07c(0x143)](_0x51e07c(0x1fc), "금액"), $(_0x51e07c(0x139))[_0x51e07c(0xfb)]("required", ![]));
        }),
        $(_0x4ea101(0x127))["on"](_0x4ea101(0x151), function () {
            const _0x145527 = _0x4ea101,
                _0x2a2e63 = $(this)[_0x145527(0x111)]();
            _0x2a2e63 === _0x145527(0xee) ? ($(_0x145527(0x145))[_0x145527(0x1d2)](), $(_0x145527(0x12d))[_0x145527(0x1d2)](), resetBuildingGroupInputs()) : ($(_0x145527(0x145))[_0x145527(0x1b2)](), $(_0x145527(0x12d))["show"]()),
                _0x2a2e63 === _0x145527(0xfc) ? $(_0x145527(0x1dd))[_0x145527(0x1b2)]() : ($(_0x145527(0x1dd))["hide"](), resetFactoryGroupInputs());
        }),
        $("#building_type")["on"]("change", function () {
            const _0x40397e = _0x4ea101,
                _0x336ca0 = $(_0x40397e(0x157))["val"]();
            if (_0x336ca0) {
                const _0x3d1eea = globalBrTitleInfo["find"](function (_0x94d31c) {
                    return _0x94d31c["mgmBldrgstPk"] == _0x336ca0;
                });
                _0x3d1eea && buildingInfoBind(_0x3d1eea);
            }
        }),
        $(_0x4ea101(0x135))["on"](_0x4ea101(0x1ae), function () {
            const _0x532f4c = _0x4ea101,
                _0x4b7d87 = $(this)
                    ["val"]()
                    [_0x532f4c(0x1fb)]()
                    [_0x532f4c(0x183)](/,/g, "")
                    ["replace"](/[^0-9.]/g, "")
                    ["replace"](/(\..*)\./g, "$1")
                    ["replace"](/^0+(\d)/, "$1"),
                _0x1022f0 = $(this)[_0x532f4c(0x143)]("id"),
                _0x77d5de = _0x1022f0 + _0x532f4c(0x1cb);
            $("#" + _0x77d5de)[_0x532f4c(0x111)](comma(convertToPyeong(_0x4b7d87)));
        }),
        $(_0x4ea101(0x102))["on"](_0x4ea101(0x1ae), function () {
            const _0x2b3da8 = _0x4ea101,
                _0x350274 = $(this)
                    ["val"]()
                    [_0x2b3da8(0x1fb)]()
                    [_0x2b3da8(0x183)](/,/g, "")
                    [_0x2b3da8(0x183)](/[^0-9.]/g, "")
                    ["replace"](/(\..*)\./g, "$1")
                    ["replace"](/^0+(\d)/, "$1");
            $(this)[_0x2b3da8(0x111)](comma(_0x350274));
        }),
        $("#description")["on"](_0x4ea101(0x1ae), function () {
            autoResize(this);
        });

    // 검색 박스 - 입력
    $("#search_address_input").on(
        "keyup",
        debounce(async function (e) {
            // Enter 키를 눌렀을 때
            if (e.key == "Enter") return;
            e.preventDefault(); // Enter 키로 인해 폼이 제출되는 것을 방지

            const keyword = $(this).val();
            if (!keyword) {
                $("#mainSearchKeyword ul").empty();
                $("#mainSearchKeyword").slideUp(200, "easeOutQuad");
                mainSearchBoxChk = 0;
                return;
            }

            // $("#mainSearchKeyword ul").html("<li>검색 중...</li>");
            if (mainSearchBoxChk == 0) {
                $("#mainSearchKeyword").slideDown(200, "easeOutQuad");
                mainSearchBoxChk = 1;
            }

            // await Promise.all([keywordSearch(keyword), addressSearch(keyword)]);

            // const addressList = await fetchAddressList(keyword);
            const addressList = await searchAddress($(this).val());
            if (addressList.status === "OK") {
                displayPlaces(addressList.result);
            } else {
                // openDaumPostcode();
            }

            setTimeout(() => {
                if ($("#placesList").find("li.item").length === 0) {
                    // 검색 결과가 없을 때
                    if ($("#placesList").find(".empty-li").length === 0) {
                        $("#placesList").append("<li class='empty-li'><div class='info'><h5>검색 결과가 없습니다.</h5></div></li>");
                    }
                }
            }, 500);
        }, 300)
    ); // 300ms 딜레이

    // 검색바 - 클릭
    $("#search_address_input").on("click", function () {
        const searchBox = $("#mainSearchKeyword");

        if (searchBox.find("ul li").length > 0) {
            searchBox.slideDown(100, "easeOutQuad");
        }
    });

    // 검색결과 - 닫기
    $("body").click(function (e) {
        const searchBox = $("#mainSearchKeyword");
        const searchInput = $("#search_address_input");

        // 클릭한 대상이 #search_input 또는 그 자식 요소인 경우
        if (searchInput.is(e.target) || searchInput.has(e.target).length) {
            return;
        }

        // 검색결과 숨김
        if (searchBox.css("display") == "block") {
            searchBox.slideUp(100, "easeOutQuad");
        }
    });
}

/**
 * 주소 검색
 * @param {*} param
 */
async function searchAddress(param) {
    return new Promise((resolve, reject) => {
        geocoder.addressSearch(param, function (result, status) {
            if (status === kakao.maps.services.Status.OK) {
                resolve({ result, status }); // 검색 결과를 Promise의 resolve로 반환
            } else {
                resolve({ result, status });
            }
        });
    });
}

/**
 * 주소 검색
 * @param {*} coords
 */
async function searchDetailAddrFromCoords(coords) {
    return new Promise((resolve, reject) => {
        geocoder.coord2Address(coords.lng, coords.lat, function (result, status) {
            if (status === kakao.maps.services.Status.OK) {
                resolve({ result, status }); // 검색 결과를 Promise의 resolve로 반환
            } else {
                resolve({ result, status });
            }
        });
    });
}

/**
 * 검색 결과 목록과 마커를 표출하는 함수입니다
 * @param {*} places
 */
async function displayPlaces(places) {
    // `address` 속성이 존재하는 객체들만 필터링
    // const filteredPlaces = places.filter((place) => place.address);
    const filteredPlaces = places;

    // 검색 결과 목록에 추가된 항목들을 제거합니다
    // var listEl = document.getElementById("placesList");

    var listEl = document.getElementById("placesList"),
        fragment = document.createDocumentFragment();
    removeAllChildNods(listEl);

    for (var i = 0; i < filteredPlaces.length; i++) {
        // 마커를 생성하고 지도에 표시합니다
        let itemEl = getListItem(i, filteredPlaces[i]); // 검색 결과 항목 Element를 생성

        // 마커와 검색결과 항목에 mouseover 했을때 해당 장소에 인포윈도우에 장소명을 표시합니다
        // mouseout 했을 때는 인포윈도우를 닫습니다
        (function (place) {
            // 리스트 click
            itemEl.onclick = async function () {
                const data = place;
                const address = data.address;
                const lat = data.y;
                const lng = data.x;

                if (address) {
                    const address_name = data.address_name;
                    const road_address = data.road_address;
                    const mountain_yn = address.mountain_yn === "Y" ? "2" : "1";
                    const main_address_no_padded = String(address.main_address_no || "0000").padStart(4, "0");
                    const sub_address_no_padded = String(address.sub_address_no || "0000").padStart(4, "0");
                    const pnu = (address.b_code ? String(address.b_code) : String(address.h_code)) + mountain_yn + main_address_no_padded + sub_address_no_padded;

                    $("#address_primary").val(address_name);
                    $("#address_road").val(road_address ? road_address.address_name : "");
                    $("#address_jibun").val(address ? address.address_name : "");
                    $("#pnu").val(pnu);
                    $("#latitude").val(lat);
                    $("#longitude").val(lng);

                    BuildingDetail(pnu); // 건축물대장 조회
                    landInfo(pnu); // 토지대장 조회
                } else {
                    const address = await searchDetailAddrFromCoords({ lat, lng });
                    console.log(address);

                    const result = address.result[0];
                    if (result) {
                        const addressList = await searchAddress(result.address.address_name);
                        if (addressList.status === "OK") {
                            console.log(addressList);
                            const address = addressList.result[0].address;
                            const lat = addressList.result[0].y;
                            const lng = addressList.result[0].x;
                            const address_name = addressList.result[0].address_name;
                            const road_address = addressList.result[0].road_address;
                            const mountain_yn = address.mountain_yn === "Y" ? "2" : "1";
                            const main_address_no_padded = String(address.main_address_no || "0000").padStart(4, "0");
                            const sub_address_no_padded = String(address.sub_address_no || "0000").padStart(4, "0");
                            const pnu = (address.b_code ? String(address.b_code) : String(address.h_code)) + mountain_yn + main_address_no_padded + sub_address_no_padded;

                            $("#address_primary").val(address_name);
                            $("#address_road").val(road_address ? road_address.address_name : "");
                            $("#address_jibun").val(address ? address.address_name : "");
                            $("#pnu").val(pnu);
                            $("#latitude").val(lat);
                            $("#longitude").val(lng);

                            BuildingDetail(pnu); // 건축물대장 조회
                            landInfo(pnu); // 토지대장 조회
                        }
                    }

                    // const mountain_yn = address.mountain_yn === "Y" ? "2" : "1";
                    // const main_address_no_padded = String(address.main_address_no || "0000").padStart(4, "0");
                    // const sub_address_no_padded = String(address.sub_address_no || "0000").padStart(4, "0");
                    // const pnu = (address.b_code ? String(address.b_code) : String(address.h_code)) + mountain_yn + main_address_no_padded + sub_address_no_padded;

                    // $("#address_primary").val(address_name);
                    // $("#address_road").val(road_address ? road_address.address_name : "");
                    // $("#address_jibun").val(address ? address.address_name : "");
                    // $("#pnu").val(pnu);
                    // $("#latitude").val(lat);
                    // $("#longitude").val(lng);

                    // BuildingDetail(pnu); // 건축물대장 조회
                    // landInfo(pnu); // 토지대장 조회
                }

                // 세션에 검색장소 저장
                // sessionStorage.setItem("lastSearchedPlace", JSON.stringify(places));
                // 실거래가 페이지로 이동한다
                // location.href = `/front/views/realPrice/realPrice.html?curLat=${places.y}&curLng=${places.x}`;
            };
        })(filteredPlaces[i]);

        fragment.appendChild(itemEl);
    }

    $("#placesList").find(".empty-li").remove();
    // 검색결과 항목들을 검색결과 목록 Element에 추가합니다
    listEl.appendChild(fragment);
    listEl.scrollTop = 0;
}

/**
 * 검색결과 항목을 Element로 반환하는 함수입니다
 * @param {*} index
 * @param {*} places
 * @returns
 */
function getListItem(index, places) {
    // if (!places.address) return;
    let itemStr = "";
    var el = document.createElement("li");

    // 검색어를 가져옵니다
    const keywords = document.getElementById("search_address_input").value.trim().split(/\s+/);
    const keyword = document.getElementById("search_address_input").value.trim();

    // 검색어와 일치하는 부분을 강조하는 함수
    const highlightKeyword = (text) => {
        // 한 단어를 정규 표현식으로 처리
        // const regex = new RegExp(`(${keyword})`, "gi"); // g: 전역검색, i: 대소문자 구분X
        // return text.replace(regex, '<span style="color:coral; font-weight:bold;">$1</span>');

        // 여러 단어를 정규 표현식으로 처리
        const regex = new RegExp(`(${keywords.join("|")})`, "gi"); // 단어들에 대해 전역 대소문자 구분 없이 검색
        return text.replace(regex, '<span style="color:coral; font-weight:bold;">$1</span>');
    };

    // itemStr += '<span class="markerbg marker_' + (index + 1) + '"></span>'; // 마커이미지
    // 카테고리 코드와 아이콘을 매핑하는 객체
    const categoryIcons = {
        MT1: '<i class="las la-lg la-store-alt"></i>', // 대형마트
        CS2: '<i class="las la-lg la-store"></i>', // 편의점
        PS3: '<i class="las la-lg las la-shapes"></i>', // 어린이집
        SC4: '<i class="las la-lg la-school"></i>', // 학교
        AC5: '<i class="las la-lg la-chalkboard-teacher"></i>', // 학원
        PK6: '<i class="las la-lg la-parking"></i>', // 주차장
        OL7: '<i class="las la-lg la-gas-pump"></i>', // 주유소
        SW8: '<i class="las la-lg la-subway"></i>', // 지하철역
        BK9: '<i class="las la-lg la-donate"></i>', // 은행
        CT1: '<i class="las la-lg la-theater-masks"></i>', // 문화시설
        AG2: '<i class="las la-lg la-balance-scale"></i>', // 중개업소
        PO3: '<i class="las la-lg la-landmark"></i>', // 공공기관
        AT4: '<i class="las la-lg la-camera-retro"></i>', // 관광명소
        AD5: '<i class="las la-lg la-hotel"></i>', // 숙박
        FD6: '<i class="las la-lg la-utensils"></i>', // 음식점
        CE7: '<i class="las la-lg la-coffee"></i>', // 카페
        HP8: '<i class="las la-lg la-hospital"></i>', // 병원
        PM9: '<i class="las la-lg la-pills"></i>', // 약국
    };

    let icon = "";

    // 카테고리 그룹 코드가 있을 경우 아이콘을 할당
    if (places.category_group_code) {
        icon = categoryIcons[places.category_group_code] || "";
    } else {
        // 카테고리 그룹 코드가 없을 경우 기본 아이콘 할당
        icon = '<i class="las la-lg la-building"></i>';
    }

    // 장소 이름이 있을 경우
    if (places.place_name) {
        // itemStr += `${icon} ${highlightKeyword(places.address_name)} <strong> ${highlightKeyword(places.place_name)} </strong>`;
        itemStr += `
        <div class="info" data-lat="${places.y}" data-lng="${places.x}">
            <h5>
                ${icon} ${highlightKeyword(places.place_name)}
            </h5>`;
    } else {
        // itemStr += `<i class="las la-lg la-map-marker"></i> ${highlightKeyword(places.address_name)}`;
        itemStr += `
        <div class="info" data-lat="${places.y}" data-lng="${places.x}">
            <h5>
               <i class="las la-lg la-map-marker"></i> ${highlightKeyword(places.address_name)}
            </h5>`;
    }

    // 도로명 주소가 있을 경우
    if (places.road_address_name) {
        itemStr += `<p>${highlightKeyword(places.road_address_name)}</p>`;
        itemStr += `<p class="jibun gray">${highlightKeyword(places.address_name)}</p>`; // 지번주소
    } else {
        // 지번 주소만 있을 경우
        if (places.address && places.address.address_name) {
            itemStr += `<p class="jibun gray">${highlightKeyword(places.address.address_name)}</p>`; // 지번주소
        } else {
            // itemStr += `<p class="jibun gray">${highlightKeyword(places.address_name)}</p>`; // 지번주소
        }
    }

    // itemStr += '  <span class="tel">' + places.phone + "</span>"; // 전화번호
    itemStr += `</div>`;

    el.innerHTML = itemStr;
    el.className = "item";

    return el;
}

/**
 * 검색결과 목록의 자식 Element를 제거하는 함수입니다
 * @param {*} el
 */
function removeAllChildNods(el) {
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
}

function initImageEvents() {
    const _0x23b220 = a50_0x2091a6;
    let _0x11a2c1 = {},
        _0x2d56c8 = 0x0,
        _0x31328a = [],
        _0x2cad6a = [],
        _0x2e866a = [],
        _0x282cc1 = [];
    $(_0x23b220(0x1d4))["on"]("change", async function (_0x16c104) {
        await _0x248662(_0x16c104);
    }),
        $(_0x23b220(0x167))["on"](_0x23b220(0x13d), _0x23b220(0x153), async function () {
            const _0x6bce5 = _0x23b220,
                _0x3e9d2f = $(this)["closest"](_0x6bce5(0x1a2));
            _0x5d79df(_0x3e9d2f);
        }),
        $(document)["on"](_0x23b220(0x13d), _0x23b220(0xf0), async function () {
            _0x3987c1(_0x11a2c1, $(this));
        });
    function _0x519ff3() {
        return _0x11a2c1;
    }
    function _0x3a07f3() {
        return _0x31328a;
    }
    function _0x2ff729() {
        return _0x2cad6a;
    }
    function _0x4e235() {
        return _0x2e866a;
    }
    function _0x3d7343() {
        return _0x282cc1;
    }
    async function _0x248662(_0x3e021d) {
        const _0x59c14a = _0x23b220,
            _0x29367c = _0x3e021d["target"][_0x59c14a(0x191)],
            _0x49caea = $(_0x59c14a(0x167));
        _0x49caea[_0x59c14a(0x10c)](_0x59c14a(0x17d))[_0x59c14a(0x106)]();
        for (let _0x530a88 = 0x0; _0x530a88 < _0x29367c[_0x59c14a(0x169)]; _0x530a88++) {
            const _0x14d969 = _0x29367c[_0x530a88],
                _0x742686 = _0x2d56c8++;
            let _0x1d05d4 = "";
            if (_0x14d969[_0x59c14a(0xf7)][_0x59c14a(0x149)](_0x59c14a(0x1c4))) {
                const _0x263e83 = await handleFileInputChangeMultiple(_0x14d969);
                _0x1d05d4 = "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20type=\x22button\x22\x20class=\x22swiper-slide\x20new-image\x22\x20data-id=\x22" + _0x742686 + _0x59c14a(0x1b1) + _0x263e83 + _0x59c14a(0x13b);
            } else {
                if (_0x14d969[_0x59c14a(0xf7)][_0x59c14a(0x149)](_0x59c14a(0x190))) {
                    const _0x778220 = URL[_0x59c14a(0x150)](_0x14d969);
                    _0x1d05d4 =
                        _0x59c14a(0x170) +
                        _0x742686 +
                        "\x22\x20data-origin=\x22N\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<video\x20muted\x20controls\x20width=\x22100%\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<source\x20src=\x22" +
                        _0x778220 +
                        _0x59c14a(0x1ef) +
                        _0x14d969[_0x59c14a(0xf7)] +
                        _0x59c14a(0x115);
                }
            }
            _0x49caea[_0x59c14a(0x1ab)](_0x1d05d4), (_0x11a2c1[_0x742686] = _0x14d969);
        }
        swiper[_0x59c14a(0x16c)](), $(_0x59c14a(0x1d4))[_0x59c14a(0x111)]("");
    }
    async function _0x3987c1(_0x13f199, _0x301090) {
        const _0x256fe1 = _0x23b220,
            _0x115ea3 = await sweetConfirm(_0x256fe1(0x15e), "", "w");
        if (!_0x115ea3) return;
        const _0x4fe74e = _0x301090["closest"](_0x256fe1(0x1a2)),
            _0x1ca03c = Number(_0x4fe74e[_0x256fe1(0x143)]("data-id")),
            _0x1dd890 = _0x4fe74e["attr"](_0x256fe1(0x1a6));
        _0x1dd890 === "Y"
            ? ((_0x2e866a = _0x2e866a[_0x256fe1(0x1cc)]((_0xeadeea) => _0xeadeea !== _0x1ca03c)), (_0x31328a = _0x31328a["filter"]((_0x3f1e77) => _0x3f1e77 !== _0x1ca03c)), _0x2cad6a[_0x256fe1(0x18b)](_0x1ca03c))
            : ((_0x282cc1 = _0x282cc1["filter"]((_0x252a20) => _0x252a20 !== _0x1ca03c)), delete _0x13f199[_0x1ca03c]),
            _0x4fe74e[_0x256fe1(0x17b)](),
            swiper[_0x256fe1(0x16c)]();
    }
    function _0xe0c3b1(_0x3420dc) {
        _0x3420dc["imageArray"]["forEach"](function (_0x514b62) {
            const _0x42e244 = a50_0xd6b2;
            _0x514b62[_0x42e244(0xec)] === "Y" && _0x2e866a[_0x42e244(0x18b)](_0x514b62[_0x42e244(0xf2)]);
        });
    }
    function _0x123094(_0x5ac350) {
        const _0x269bc8 = _0x23b220,
            _0x3da5c8 = _0x269bc8(0x1de);
        _0x5ac350["prepend"](_0x3da5c8), _0x5ac350[_0x269bc8(0x196)]("representative");
    }
    async function _0x5d79df(_0x5fac58) {
        const _0x4524fe = _0x23b220,
            _0x3a162e = Number(_0x5fac58[_0x4524fe(0x143)](_0x4524fe(0x104))),
            _0x3c9151 = _0x5fac58[_0x4524fe(0x143)](_0x4524fe(0x1a6));
        if (_0x5fac58[_0x4524fe(0x17f)](_0x4524fe(0xec))) {
            const _0x2abb8c = await sweetConfirm("대표이미지를\x20취소하시겠습니까?", "", "q");
            if (!_0x2abb8c) return;
            _0x3c9151 === "Y" ? (_0x2e866a = _0x2e866a["filter"]((_0x478e83) => _0x478e83 !== _0x3a162e)) : (_0x282cc1 = _0x282cc1["filter"]((_0x1a6434) => _0x1a6434 !== _0x3a162e)), _0x5fac58[_0x4524fe(0x1c0)](_0x4524fe(0xec)), _0x5fac58[_0x4524fe(0xf4)](_0x4524fe(0x16e))["remove"]();
        } else {
            const _0x3e437e = await sweetConfirm(_0x4524fe(0x141), "", "q");
            if (!_0x3e437e) return;
            const _0xcdb93e = _0x2e866a[_0x4524fe(0x169)] + _0x282cc1["length"];
            if (_0xcdb93e >= 0x2) {
                sweetAlertMessage(_0x4524fe(0x126), "", "i");
                return;
            }
            _0x3c9151 === "Y"
                ? !_0x2e866a[_0x4524fe(0x180)](_0x3a162e)
                    ? (_0x2e866a[_0x4524fe(0x18b)](_0x3a162e), _0x123094(_0x5fac58))
                    : sweetAlertMessage(_0x4524fe(0x1c3), "", "i")
                : !_0x282cc1["includes"](_0x3a162e)
                ? (_0x282cc1[_0x4524fe(0x18b)](_0x3a162e), _0x123094(_0x5fac58))
                : sweetAlertMessage(_0x4524fe(0x1c3), "", "i");
        }
    }
    return { getFileList: _0x519ff3, getOriginArray: _0x3a07f3, getRemoveFileArray: _0x2ff729, getExistingRepresentativeImages: _0x4e235, getSelectedRepresentativeImages: _0x3d7343, loadExistingRepresentativeImages: _0xe0c3b1 };
}
// function searchAddress(_0x453ee6) {
//     const _0x181df9 = a50_0x2091a6;
//     geocoder[_0x181df9(0x1cf)](_0x453ee6, function (_0x1aa7b5, _0x1640a0) {
//         const _0x5b84a5 = _0x181df9;
//         if (_0x1640a0 === kakao[_0x5b84a5(0x172)]["services"]["Status"]["OK"]) {
//             const _0x87ea80 = _0x1aa7b5[0x0],
//                 _0x2e6611 = _0x87ea80[_0x5b84a5(0x1ad)],
//                 _0x685b71 = _0x2e6611[_0x5b84a5(0x113)] === "Y" ? "2" : "1",
//                 _0x26ac33 = (_0x2e6611["main_address_no"] || _0x5b84a5(0x124))[_0x5b84a5(0x1c9)](0x4, "0"),
//                 _0x225577 = (_0x2e6611[_0x5b84a5(0x1f1)] || _0x5b84a5(0x124))[_0x5b84a5(0x1c9)](0x4, "0"),
//                 _0xf7e74e = _0x2e6611["b_code"] + _0x685b71 + _0x26ac33 + _0x225577;
//             $(_0x5b84a5(0x15b))[_0x5b84a5(0x111)](_0xf7e74e), $(_0x5b84a5(0x193))[_0x5b84a5(0x111)](_0x87ea80["y"]), $(_0x5b84a5(0x16b))["val"](_0x87ea80["x"]), BuildingDetail(_0xf7e74e), landInfo(_0xf7e74e);
//         }
//     });
// }
async function BuildingDetail(_0x55b9d5) {
    const _0x1708aa = a50_0x2091a6,
        _0x59afbd = { pnu: _0x55b9d5 },
        _0x4c7f59 = await callApiAbort(_0x1708aa(0x160), _0x1708aa(0x188), _0x59afbd, _0x1708aa(0x1d7));
    let _0x6d8803 = _0x4c7f59[_0x1708aa(0x185)][_0x1708aa(0x1c8)],
        _0x33c168 = _0x4c7f59[_0x1708aa(0x1a5)][_0x1708aa(0x1c8)];
    Array["isArray"](_0x6d8803)
        ? (_0x6d8803["sort"](function (_0x39bd47, _0x5c0716) {
              const _0x312d0c = _0x1708aa,
                  _0x3d3aed = String(_0x39bd47[_0x312d0c(0x109)])[_0x312d0c(0x1fb)]() !== "" ? String(_0x39bd47[_0x312d0c(0x109)]) : _0x39bd47[_0x312d0c(0x175)],
                  _0x4c9278 = String(_0x5c0716[_0x312d0c(0x109)])[_0x312d0c(0x1fb)]() !== "" ? String(_0x5c0716[_0x312d0c(0x109)]) : _0x5c0716[_0x312d0c(0x175)];
              return _0x3d3aed["localeCompare"](_0x4c9278);
          }),
          (globalBrTitleInfo = _0x6d8803),
          (globalBrRecapTitleInfo = _0x33c168))
        : ((globalBrTitleInfo = [_0x6d8803]), (globalBrRecapTitleInfo = [_0x33c168])),
        createBuildingOptions(globalBrTitleInfo, globalBrRecapTitleInfo);
}
function createBuildingOptions(_0x17eb10, _0xc90de9) {
    const _0xa22256 = a50_0x2091a6;
    if (!_0x17eb10 || _0x17eb10["length"] === 0x0 || _0x17eb10["every"]((_0x536553) => _0x536553 === null || _0x536553 === undefined)) return;
    _0x17eb10 = _0x17eb10["filter"]((_0x1b6dfd) => _0x1b6dfd !== null && _0x1b6dfd !== undefined);
    if (_0x17eb10[_0xa22256(0x169)] === 0x0) return;
    const _0xf0f777 = $(_0xa22256(0x157));
    _0xf0f777[_0xa22256(0xf4)]("option:not(:first)")[_0xa22256(0x17b)](),
        $[_0xa22256(0x15d)](_0x17eb10, function (_0x5af44d, _0x5dcfb8) {
            const _0x5c9e6a = _0xa22256,
                _0x52c2d5 = $(_0x5c9e6a(0x187))
                    ["val"](_0x5dcfb8["mgmBldrgstPk"])
                    [_0x5c9e6a(0x1b6)]("" + (_0x5dcfb8["dongNm"][_0x5c9e6a(0x1b7)]()[_0x5c9e6a(0x1fb)]() != "" ? _0x5dcfb8[_0x5c9e6a(0x109)] : _0x5dcfb8[_0x5c9e6a(0x175)]));
            if (_0x5af44d === 0x0) {
            }
            _0xf0f777[_0x5c9e6a(0x1ab)](_0x52c2d5);
        });
}
function buildingInfoBind(_0x1e2a8b) {
    const _0x4bb1a9 = a50_0x2091a6,
        {
            platPlc: _0x4be6e5,
            newPlatPlc: _0x7a272c,
            bldNm: _0x32ae1c,
            etcPurps: _0x4a07c4,
            mainPurpsCd: _0x5a1f82,
            mainPurpsCdNm: _0x1437d2,
            strctCd: _0x1cb7f5,
            strctCdNm: _0x43861f,
            etcStrct: _0x20bb3a,
            roofCdNm: _0x3eab8b,
            etcRoof: _0x1fce32,
            heit: _0x5edca7,
            grndFlrCnt: _0x34dc02,
            ugrndFlrCnt: _0x512dfa,
            platArea: _0x5d787e,
            archArea: _0x6dce90,
            totArea: _0x3df58d,
            vlRatEstmTotArea: _0x29efb7,
            vlRat: _0x21052d,
            bcRat: _0x396b12,
            hhldCnt: _0x43af0c,
            fmlyCnt: _0x3a657a,
            bylotCnt: _0x78031,
            rideUseElvtCnt: _0x1d3930,
            emgenUseElvtCnt: _0x3535e8,
            useAprDay: _0x23735a,
            pmsDay: _0x158d70,
            stcnsDay: _0x78048c,
            sigunguCd: _0x5478b8,
            bjdongCd: _0xaa7853,
            platGbCd: _0x18dccb,
            bun: _0x4921d6,
            ji: _0x4521cc,
        } = _0x1e2a8b;
    $("#platArea")[_0x4bb1a9(0x111)](comma(_0x5d787e)),
        $(_0x4bb1a9(0x1b3))[_0x4bb1a9(0x111)](comma(convertToPyeong(_0x5d787e))),
        $(_0x4bb1a9(0x1e0))[_0x4bb1a9(0x111)](comma(_0x6dce90)),
        $(_0x4bb1a9(0x1b8))["val"](comma(convertToPyeong(_0x6dce90))),
        $("#totArea")["val"](comma(_0x3df58d)),
        $(_0x4bb1a9(0x11b))[_0x4bb1a9(0x111)](comma(convertToPyeong(_0x3df58d))),
        $("#vlRat")[_0x4bb1a9(0x111)](comma(_0x21052d)),
        $(_0x4bb1a9(0x1e6))[_0x4bb1a9(0x111)](comma(_0x396b12)),
        $("#grndFlrCnt")[_0x4bb1a9(0x111)](comma(_0x34dc02)),
        $("#ugrndFlrCnt")["val"](comma(_0x512dfa)),
        $(_0x4bb1a9(0x125))[_0x4bb1a9(0x111)](_0x1cb7f5),
        $(_0x4bb1a9(0x114))[_0x4bb1a9(0x111)](_0x43861f),
        $(_0x4bb1a9(0x19d))[_0x4bb1a9(0x111)](_0x20bb3a),
        $(_0x4bb1a9(0x17e))[_0x4bb1a9(0x111)](_0x5a1f82),
        $(_0x4bb1a9(0x136))[_0x4bb1a9(0x111)](_0x1437d2);
    const _0x4967e7 = formatDate(_0x23735a);
    useAprDayPickr[_0x4bb1a9(0x199)](_0x4967e7), globalBrRecapTitleInfo && globalBrRecapTitleInfo[_0x4bb1a9(0xfa)] ? $(_0x4bb1a9(0x168))[_0x4bb1a9(0x111)](globalBrRecapTitleInfo[_0x4bb1a9(0xfa)]) : $(_0x4bb1a9(0x168))[_0x4bb1a9(0x111)]("");
}
async function landInfo(_0x3fa63e) {
    const _0x31f67e = a50_0x2091a6,
        _0x422f3d = { pnu: _0x3fa63e },
        _0xbf4940 = "/front/back/sale/land_characteristics.php";
    callApiAbort(_0xbf4940, "POST", _0x422f3d, _0x31f67e(0x1bd))
        [_0x31f67e(0x1ea)]((_0x1cd5ae) => {
            const _0x58851a = _0x31f67e;
            if (!_0x1cd5ae) return;
            const { landCharacteristicss: _0x172427 } = _0x1cd5ae;
            if (!_0x172427 || !_0x172427[0x0]) return;
            const { lndcgrCode: _0x41620c, lndcgrCodeNm: _0x5c0a6d, prposArea1: _0x569afe, prposArea1Nm: _0x395b3d, lndpclAr: _0x1a6735 } = _0x172427[0x0];
            $(_0x58851a(0x1be))[_0x58851a(0x111)](_0x41620c),
                $(_0x58851a(0x1c5))[_0x58851a(0x111)](_0x5c0a6d),
                $(_0x58851a(0x1d1))[_0x58851a(0x111)](_0x569afe),
                $(_0x58851a(0x12f))["val"](_0x395b3d),
                $(_0x58851a(0x1df))[_0x58851a(0x111)](comma(_0x1a6735)),
                $("#platArea_py")[_0x58851a(0x111)](comma(convertToPyeong(_0x1a6735)));
        })
        ["catch"]((_0x53c244) => {
            const _0x4e3e2f = _0x31f67e;
            console[_0x4e3e2f(0x123)](_0x53c244);
        });
}
function formatDate(_0x54d759) {
    const _0x184517 = a50_0x2091a6;
    typeof _0x54d759 === _0x184517(0x1c1) && (_0x54d759 = _0x54d759[_0x184517(0x1b7)]());
    if (typeof _0x54d759 !== _0x184517(0x1d6) || _0x54d759[_0x184517(0x169)] !== 0x8) return "";
    return _0x54d759[_0x184517(0x1fd)](0x0, 0x4) + "-" + _0x54d759[_0x184517(0x1fd)](0x4, 0x6) + "-" + _0x54d759[_0x184517(0x1fd)](0x6, 0x8);
}
function initValidation(_0x1bbdca) {
    const _0x351454 = a50_0x2091a6;
    var _0x44648e = document[_0x351454(0x17a)](_0x351454(0x13e));
    Array[_0x351454(0x14a)][_0x351454(0x1fd)][_0x351454(0x1b4)](_0x44648e)[_0x351454(0x129)](function (_0x1bce10) {
        const _0x19c655 = _0x351454,
            _0x32a590 = document["getElementById"]("save_confirm_btn");
        if (!_0x32a590) {
            console[_0x19c655(0x1e5)]("#save_confirm_btn\x20not\x20found");
            return;
        }
        _0x32a590[_0x19c655(0x18a)](
            _0x19c655(0x13d),
            async function (_0xa08665) {
                const _0x5b5bc2 = _0x19c655;
                _0xa08665[_0x5b5bc2(0x132)](), $(_0x5b5bc2(0x116))[_0x5b5bc2(0x1ca)](_0x5b5bc2(0x1e3));
                const _0x42d91b = $(_0x1bce10)[_0x5b5bc2(0xf4)](_0x5b5bc2(0x10d));
                let _0x2b63ab = !![],
                    _0x4eab79 = null;
                _0x42d91b[_0x5b5bc2(0x15d)]((_0x4ac3a7, _0x1af7e0) => {
                    const _0x118926 = _0x5b5bc2,
                        _0xffb40 = $(_0x1af7e0),
                        _0x4b1644 = _0xffb40[_0x118926(0x143)](_0x118926(0xf7)) || _0xffb40[_0x118926(0xfb)](_0x118926(0x1f9))[_0x118926(0x156)]();
                    let _0x192f3d, _0x564311;
                    switch (_0x4b1644) {
                        case _0x118926(0x1b6):
                            (_0x192f3d = _0x118926(0x1b6)), (_0x564311 = _0x118926(0x138));
                            break;
                        case _0x118926(0x19e):
                            (_0x192f3d = _0x118926(0x19e)), (_0x564311 = "비밀번호");
                            break;
                        case _0x118926(0xf3):
                            (_0x192f3d = "phone"), (_0x564311 = _0x118926(0x1a0));
                            break;
                        case _0x118926(0x184):
                            (_0x192f3d = _0x118926(0x184)), (_0x564311 = _0x118926(0x142));
                            break;
                        case _0x118926(0x1cd):
                            (_0x192f3d = _0x118926(0x1cd)), (_0x564311 = "옵션");
                            break;
                        case _0x118926(0x101):
                            (_0x192f3d = "text"), (_0x564311 = "값");
                            break;
                        default:
                            (_0x192f3d = _0x4b1644), (_0x564311 = "값");
                    }
                    const _0xc1e435 = validateInput(_0xffb40, _0x192f3d, _0x564311 + _0x118926(0x1f8)),
                        _0x17e788 = _0xffb40[_0x118926(0x1bc)]()["find"](_0x118926(0x198))["length"] != 0x0 ? _0xffb40["parent"]()["find"](_0x118926(0x198)) : _0xffb40["parent"]()[_0x118926(0x1bc)]()["find"](".invalid-feedback");
                    !_0xc1e435
                        ? (console[_0x118926(0x123)](_0x118926(0x1f6) + _0xffb40["attr"]("id") + ",\x20Is\x20Valid:\x20" + _0xc1e435),
                          _0x17e788["length"] > 0x0 ? (_0x17e788["show"](), _0xffb40[0x0][_0x118926(0x1ac)](_0x17e788[_0x118926(0x1b6)]())) : _0xffb40[0x0][_0x118926(0x1ac)](_0x564311 + _0x118926(0x1f8)),
                          _0xffb40[0x0]["reportValidity"](),
                          (_0x2b63ab = ![]),
                          !_0x4eab79 && (_0x4eab79 = _0xffb40))
                        : (_0x17e788[_0x118926(0x1d2)](), _0xffb40[0x0][_0x118926(0x1ac)](""));
                }),
                    console["log"](_0x2b63ab);
                !_0x2b63ab
                    ? (_0x4eab79 && (_0x4eab79[0x0][_0x5b5bc2(0x12a)]({ behavior: _0x5b5bc2(0x1b9), block: _0x5b5bc2(0x11f) }), _0x4eab79[0x0]["reportValidity"](), _0x4eab79[_0x5b5bc2(0x16a)]()), _0xa08665[_0x5b5bc2(0x132)](), _0xa08665[_0x5b5bc2(0x155)]())
                    : (_0xa08665[_0x5b5bc2(0x132)](), _0xa08665[_0x5b5bc2(0x155)](), saleRegist(fileManager["getFileList"](), _0x1bbdca));
                return;
            },
            ![]
        ),
            _0x1bce10[_0x19c655(0x17a)](_0x19c655(0x1eb))[_0x19c655(0x129)](function (_0xe4ef5a) {
                const _0x5ac136 = _0x19c655;
                _0xe4ef5a["addEventListener"](_0x5ac136(0x1ae), function () {
                    const _0x224eec = _0x5ac136,
                        _0x4bab5f = $(_0xe4ef5a),
                        _0x463b7e = _0x4bab5f[_0x224eec(0x143)]("type") || _0x4bab5f[_0x224eec(0xfb)](_0x224eec(0x1f9))[_0x224eec(0x156)]();
                    let _0xad97be, _0x43f83f;
                    switch (_0x463b7e) {
                        case _0x224eec(0x1b6):
                            (_0xad97be = _0x224eec(0x1b6)), (_0x43f83f = "값");
                            break;
                        case _0x224eec(0x19e):
                            (_0xad97be = _0x224eec(0x19e)), (_0x43f83f = _0x224eec(0x174));
                            break;
                        case "tel":
                            (_0xad97be = _0x224eec(0x195)), (_0x43f83f = _0x224eec(0x1a0));
                            break;
                        case _0x224eec(0x184):
                            (_0xad97be = _0x224eec(0x184)), (_0x43f83f = _0x224eec(0x142));
                            break;
                        case _0x224eec(0x1cd):
                            (_0xad97be = _0x224eec(0x1cd)), (_0x43f83f = "옵션");
                            break;
                        case _0x224eec(0x101):
                            (_0xad97be = _0x224eec(0x1b6)), (_0x43f83f = "값");
                            break;
                        default:
                            (_0xad97be = _0x463b7e), (_0x43f83f = "값");
                    }
                    const _0x1e25c5 = validateInput(_0x4bab5f, _0xad97be, _0x43f83f + _0x224eec(0x1f8)),
                        _0x83a994 = _0x4bab5f[_0x224eec(0x1bc)]()["find"](".invalid-feedback")["length"] != 0x0 ? _0x4bab5f[_0x224eec(0x1bc)]()["find"](_0x224eec(0x198)) : _0x4bab5f[_0x224eec(0x1bc)]()[_0x224eec(0x1bc)]()[_0x224eec(0xf4)](_0x224eec(0x198));
                    _0x1e25c5
                        ? (_0x4bab5f[0x0][_0x224eec(0x1ac)](""), _0x83a994["hide"]())
                        : (_0x83a994[_0x224eec(0x169)] > 0x0 ? (_0x4bab5f[0x0]["setCustomValidity"](_0x83a994[_0x224eec(0x1b6)]()), _0x83a994[_0x224eec(0x1b2)]()) : _0x4bab5f[0x0][_0x224eec(0x1ac)](_0x43f83f + "을(를)\x20입력해주세요."), _0x4bab5f[0x0]["reportValidity"]());
                });
            });
    });
}
async function saleRegist(_0x201ba3, _0x5e8f42) {
    const _0x11a176 = a50_0x2091a6;
    if (!_0x5e8f42) {
        const _0x3ba162 = await sweetAlertMessage("올바르지\x20않은\x20요청입니다.", "", "e");
        _0x3ba162 && history[_0x11a176(0x117)]();
    }
    if ($(".swiper-slide")[_0x11a176(0x169)] === 0x0) {
        const _0x353a7b = await sweetAlertMessage(_0x11a176(0x1ec), "", "e");
        return;
    }
    const _0x10b0bd = userInfo(),
        _0x363692 = getNumberData(),
        _0x4fb1d2 = getStringData(),
        _0x77c877 = getFactoryData();
    let _0x54fe6c = new FormData();
    for (const _0xe73557 in _0x201ba3) {
        _0x201ba3["hasOwnProperty"](_0xe73557) && _0x54fe6c["append"](_0x11a176(0x18c), _0x201ba3[_0xe73557]);
    }
    const _0x4d2b87 = fileManager[_0x11a176(0x131)](),
        _0x5e194f = fileManager[_0x11a176(0x164)](),
        _0x47d7fb = fileManager[_0x11a176(0x1c6)](),
        _0x479f50 = fileManager[_0x11a176(0xff)]();
    if (_0x4d2b87["length"] + _0x5e194f[_0x11a176(0x169)] > 0x2) {
        sweetAlertMessage(_0x11a176(0x126), "", "w");
        return;
    }
    _0x54fe6c["append"](_0x11a176(0x186), JSON[_0x11a176(0x120)](_0x4d2b87)),
        _0x54fe6c[_0x11a176(0x1ab)](_0x11a176(0x162), JSON["stringify"](_0x5e194f)),
        _0x54fe6c[_0x11a176(0x1ab)](_0x11a176(0x14c), JSON["stringify"](_0x47d7fb)),
        _0x54fe6c[_0x11a176(0x1ab)](_0x11a176(0xf6), JSON[_0x11a176(0x120)](_0x479f50));
    let _0xa753b1 = { ..._0x10b0bd, ..._0x363692, ..._0x4fb1d2, latitude: $(_0x11a176(0x193))["val"]() || "", longitude: $("#longitude")[_0x11a176(0x111)]() || "", estateNo: _0x5e8f42 };
    _0x4fb1d2[_0x11a176(0x10e)] === _0x11a176(0xfc) && (_0xa753b1 = { ..._0xa753b1, ..._0x77c877 });
    for (const _0x3233e8 in _0xa753b1) {
        if (Object[_0x11a176(0x1e1)][_0x11a176(0x1b4)](_0xa753b1, _0x3233e8)) {
            const _0x567eab = _0xa753b1[_0x3233e8];
            _0x54fe6c[_0x11a176(0x1ab)](_0x3233e8, _0x567eab);
        }
    }
    $("html")[_0x11a176(0x143)](_0x11a176(0x1db), _0x11a176(0x166)),
        callApiFormData("POST", _0x11a176(0x159), _0x54fe6c)
            [_0x11a176(0x1ea)]((_0x24edec) => {
                const _0x528032 = _0x11a176;
                if (!_0x24edec) {
                    $(_0x528032(0x12e))[_0x528032(0x1ca)](_0x528032(0x1d3));
                    return;
                }
                const { statusCode: _0x17c69e, message: _0x36f51e, responseData: _0x4fd288 } = _0x24edec;
                _0x17c69e == 0xc8 && _0x36f51e == _0x528032(0x13f)
                    ? ($(_0x528032(0x1b5))[_0x528032(0x1ca)](_0x528032(0x1d3)),
                      $(_0x528032(0x1b5))["on"](_0x528032(0x16f), function () {
                          const _0x26ea2e = _0x528032;
                          location[_0x26ea2e(0x1c2)]();
                      }))
                    : sweetAlertMessage(_0x36f51e, "", "w");
            })
            [_0x11a176(0x103)]((_0x2e6ec8) => {
                const _0x4a5304 = _0x11a176;
                console[_0x4a5304(0x1e5)](_0x4a5304(0x171), _0x2e6ec8);
            })
            [_0x11a176(0x105)](() => {
                const _0x1e61ba = _0x11a176;
                $(_0x1e61ba(0x1d5))[_0x1e61ba(0x143)]("data-preloader", _0x1e61ba(0x16d));
            });
}
function a50_0x4249() {
    const _0x392bec = [
        "#modify_btn",
        ".fa-circle-xmark",
        "\x22\x20data-origin=\x22Y\x22\x20>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "fileNo",
        "tel",
        "find",
        "get",
        "removeFileArray",
        "type",
        "#useAprDay",
        "#sale_type",
        "totPkngCnt",
        "prop",
        "003",
        "#related_jibun",
        "올바르지\x20않은\x20요청입니다.",
        "getRemoveFileArray",
        "d-none",
        "textarea",
        "#platArea,\x20#totArea,\x20#archArea,\x20#sale_price,\x20#rent_price,\x20#loan_price,\x20#maintenance_price,\x20#vlRat,\x20#bcRat,\x20#grndFlrCnt,\x20#ugrndFlrCnt,\x20#power,\x20#road_conditions,\x20#floor_height",
        "catch",
        "data-id",
        "finally",
        "empty",
        "#lottieConfirm",
        "470px",
        "dongNm",
        "useAprDay",
        "#lottieCompletion",
        "not",
        "[required]",
        "estate_type",
        "trigger",
        "\x22\x20alt=\x22\x22\x20width=\x22100\x22\x20onerror=\x22this.onerror=null;this.src=\x27/front/assets/image/building_empty.png\x27;\x22>",
        "val",
        "#notes",
        "mountain_yn",
        "#strctCdNm",
        "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20Your\x20browser\x20does\x20not\x20support\x20the\x20video\x20tag.\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</video>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22close-btn-box\x22><i\x20class=\x22fa-sharp\x20fa-solid\x20fa-circle-xmark\x22></i></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "#modalConfirm",
        "back",
        "#modalCancel",
        "#road_conditions",
        "startLoading",
        "#totArea_py",
        "location",
        "<video\x20controls\x20width=\x22100%\x22\x20class=\x22img-fluid\x20mx-auto\x20rounded\x22\x20controlslist=\x22nodownload\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<source\x20src=\x22",
        "</option>",
        "center",
        "stringify",
        "auto",
        "\x22\x20data-id=\x22",
        "log",
        "0000",
        "#strctCd",
        "대표\x20이미지는\x20최대\x202장까지\x20설정\x20가능합니다.",
        "#estate_type",
        "39BzsoIW",
        "forEach",
        "scrollIntoView",
        "map",
        "form.needs-validation",
        ".building-select",
        "#modalFail",
        "#prposAreaNm",
        "/front/assets/lottie/failed.json",
        "getExistingRepresentativeImages",
        "preventDefault",
        "#postal_code",
        "removeFile",
        "#platArea,\x20#totArea,\x20#archArea",
        "#mainPurpsCdNm",
        "#ugrndFlrCnt",
        "입력값",
        "#rent_price",
        ".rent-group",
        "\x22\x20width=\x22100%\x22\x20alt=\x22\x22\x20title=\x22\x22\x20/>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22close-btn-box\x22><i\x20class=\x22fa-sharp\x20fa-solid\x20fa-circle-xmark\x22></i></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "#address_primary",
        "click",
        ".needs-validation",
        "SUCCESS",
        "getFilterTypes\x20error:",
        "대표\x20이미지로\x20설정하시겠습니까?",
        "체크박스",
        "attr",
        "href",
        ".building-group",
        "/front/assets/lottie/completion.json",
        "처리\x20되었습니다.",
        "/front/views/mypage/mypage_sale",
        "startsWith",
        "prototype",
        "2814348DnWcAa",
        "originArray",
        "삭제\x20하시겠습니까?",
        "5637335XVtTMp",
        "#save_btn",
        "createObjectURL",
        "change",
        "/front/assets/lottie/save.json",
        ".swiper-slide\x20img,\x20.swiper-slide\x20video",
        "10395984ONlnUh",
        "stopPropagation",
        "toLowerCase",
        "#building_type",
        "삭제를\x20실패했습니다.",
        "/front/back/sale/sale_modify.php",
        "form\x20input",
        "#pnu",
        "<img\x20src=\x22/front/assets/image/building_empty.png\x22\x20width=\x22100%\x22\x20alt=\x22\x22\x20title=\x22\x22\x20/>",
        "each",
        "삭제하시겠습니까?",
        "#description",
        "/front/back/sale/buiding_register_title_info.php",
        "#floor_height",
        "selectedRepresentativeImages",
        "/front/back/sale/sale_detail.php",
        "getSelectedRepresentativeImages",
        "7227msTdYy",
        "enable",
        ".swiper-wrapper",
        "#totPkngCnt",
        "length",
        "focus",
        "#longitude",
        "update",
        "disable",
        ".badge",
        "closed",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20type=\x22button\x22\x20class=\x22swiper-slide\x20new-image\x22\x20data-id=\x22",
        "API\x20호출\x20실패",
        "maps",
        "13fjTitC",
        "비밀번호",
        "mainPurpsCdNm",
        "querySelector",
        "form\x20textarea",
        "imageArray",
        "saleInfo",
        "querySelectorAll",
        "remove",
        "/front/back/sell/filter_type_get.php",
        ":first",
        "#mainPurpsCd",
        "hasClass",
        "includes",
        "#sale_price",
        "<option\x20value=\x22",
        "replace",
        "checkbox",
        "brTitleInfo",
        "existingRepresentativeImages",
        "<option>",
        "POST",
        "fileType",
        "addEventListener",
        "push",
        "files[]",
        "ready",
        "31079FndglC",
        "\x22\x20type=\x22video/mp4\x22\x20class=\x22h-100\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20Your\x20browser\x20does\x20not\x20support\x20the\x20video\x20tag.\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</video>",
        "video/",
        "files",
        "Geocoder",
        "#latitude",
        "#address_road",
        "phone",
        "addClass",
        "정상적인\x20접근이\x20아닙니다.",
        ".invalid-feedback",
        "setDate",
        ".btn-box\x20*",
        "10ArtGvc",
        "building_type",
        "#etcStrct",
        "password",
        "required",
        "연락처",
        "#maintenance_price",
        ".swiper-slide",
        "002",
        "#loan_price",
        "brRecapTitleInfo",
        "data-origin",
        "<img\x20src=\x22",
        "삭제되었습니다.",
        "search",
        "Y-m-d",
        "append",
        "setCustomValidity",
        "address",
        "input",
        "#water",
        "input\x20change\x20valueSet",
        "\x22\x20data-origin=\x22N\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<img\x20src=\x22",
        "show",
        "#platArea_py",
        "call",
        "#modalCompletion",
        "text",
        "toString",
        "#archArea_py",
        "smooth",
        ".factory-group\x20input,\x20.factory-group\x20select",
        "#power",
        "parent",
        "landInfo",
        "#lndcgrCode",
        "form\x20select",
        "removeClass",
        "number",
        "reload",
        "이미\x20대표\x20이미지로\x20설정된\x20파일입니다.",
        "image/",
        "#lndcgrCodeNm",
        "getOriginArray",
        "34384baQtjd",
        "item",
        "padStart",
        "iziModal",
        "_py",
        "filter",
        "select",
        "loadAnimation",
        "addressSearch",
        "/index",
        "#prposArea",
        "hide",
        "open",
        "#file_input",
        "html",
        "string",
        "BuildingDetail",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22close-btn-box\x22><i\x20class=\x22fa-sharp\x20fa-solid\x20fa-circle-xmark\x20ori-close-btn\x20pointer\x22></i></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "1513113zQEGoE",
        "disabled",
        "data-preloader",
        "<div\x20type=\x22button\x22\x20class=\x22swiper-slide\x20ori-image\x20",
        ".factory-group",
        "<span\x20class=\x22badge\x20badge-label\x20bg-danger\x22><i\x20class=\x22mdi\x20mdi-circle-medium\x22></i>\x20대표</span>",
        "#platArea",
        "#archArea",
        "hasOwnProperty",
        "#totArea",
        "close",
        "services",
        "error",
        "#bcRat",
        ".building-group\x20input,\x20.building-group\x20select",
        "image",
        "368aJfyfX",
        "then",
        "input[required],\x20select[required],\x20textarea[required]",
        "이미지/영상은\x20최소\x201장\x20이상\x20등록해야\x20합니다.",
        "#feature",
        "fadeIn",
        "\x22\x20type=\x22",
        "22qCLknT",
        "sub_address_no",
        "#grndFlrCnt",
        "보증금",
        "#delete_btn",
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "Field:\x20",
        "/front/back/mypage/sale_delete.php",
        "을(를)\x20확인해주세요.",
        "tagName",
        "5qXEEoS",
        "trim",
        "placeholder",
        "slice",
        "representative",
        "input[name=\x27address_primary\x27]",
        "006",
    ];
    a50_0x4249 = function () {
        return _0x392bec;
    };
    return a50_0x4249();
}
async function saleInfo(_0x1b88ff) {
    const _0x57fbaa = a50_0x2091a6,
        _0x3e51e2 = userInfo();
    if (isNaN(_0x1b88ff) || !_0x3e51e2) {
        const _0x4d524d = await sweetAlertMessage(_0x57fbaa(0xfe));
        if (_0x4d524d) {
            history["back"]();
            return;
        }
    }
    const _0x3b53ee = _0x57fbaa(0x163),
        _0x125a8f = { ..._0x3e51e2, estate_no: _0x1b88ff };
    callApiAbort(_0x3b53ee, "POST", _0x125a8f, _0x57fbaa(0x179))
        [_0x57fbaa(0x1ea)](async (_0x192ccc) => {
            const _0x474e94 = _0x57fbaa;
            if (!_0x192ccc) return;
            const { statusCode: _0x5bcb6e, message: _0x572a74, responseData: _0x183438 } = _0x192ccc;
            if (_0x5bcb6e !== 0xc8 || _0x572a74 !== "SUCCESS") {
                sweetAlertMessage(_0x474e94(0x197), "", "e");
                return;
            }
            if (!_0x183438 || _0x183438[_0x474e94(0x169)] === 0x0) {
                sweetAlertMessage("정상적인\x20접근이\x20아닙니다.", "", "e");
                return;
            }

            try {
                const addressList = await searchAddress(_0x183438.address_primary);

                if (addressList.status === "OK") {
                    const address = addressList.result[0].address;
                    const lat = addressList.result[0].y;
                    const lng = addressList.result[0].x;
                    const address_name = addressList.result[0].address_name;
                    const road_address = addressList.result[0].road_address;
                    const mountain_yn = address.mountain_yn === "Y" ? "2" : "1";
                    const main_address_no_padded = String(address.main_address_no || "0000").padStart(4, "0");
                    const sub_address_no_padded = String(address.sub_address_no || "0000").padStart(4, "0");
                    const pnu = (address.b_code ? String(address.b_code) : String(address.h_code)) + mountain_yn + main_address_no_padded + sub_address_no_padded;
                    $("#address_primary").val(address_name);
                    $("#address_road").val(road_address ? road_address.address_name : "");
                    $("#address_jibun").val(address ? address.address_name : "");
                    $("#pnu").val(pnu);
                    $("#latitude").val(lat);
                    $("#longitude").val(lng);

                    await BuildingDetail(pnu); // 건축물대장 조회
                    // landInfo(pnu); // 토지대장 조회
                }
            } catch (error) {
            } finally {
                // 데이터 바인딩
                detailBind(_0x183438);
            }
        })
        [_0x57fbaa(0x103)]((_0x3266cd) => {
            console["log"](_0x3266cd);
        });
}
async function detailBind(_0xe461f) {
    const _0x19c02e = a50_0x2091a6;
    $[_0x19c02e(0x15d)](_0xe461f, function (_0x9e966f, _0x37df89) {
        const _0x24fdc9 = _0x19c02e;
        var _0x5e1c78 = $("#" + _0x9e966f);
        if (_0x5e1c78[_0x24fdc9(0x169)] > 0x0) {
            if (_0x9e966f === _0x24fdc9(0x10a) && _0x37df89) {
                const _0x2a5324 = new Date(_0x37df89);
                useAprDayPickr[_0x24fdc9(0x199)](_0x2a5324);
            } else {
                if (_0x9e966f === _0x24fdc9(0x19c) && _0x37df89)
                    setTimeout(() => {
                        const _0x1d5bdd = _0x24fdc9;
                        $("#" + _0x9e966f)[_0x1d5bdd(0x111)](_0x37df89 !== null ? _0x37df89 : "");
                    }, 0x3e8);
                else {
                    if (_0x5e1c78["is"]("input,\x20textarea")) _0x5e1c78[_0x24fdc9(0x111)](_0x37df89 !== null ? _0x37df89 : "");
                    else _0x5e1c78["is"]("select") && (_0x5e1c78[_0x24fdc9(0x111)](_0x37df89 !== null ? _0x37df89 : ""), _0x5e1c78[_0x24fdc9(0x10f)](_0x24fdc9(0x151)));
                }
            }
        }
    });
    const _0x107c82 = $(".swiper-wrapper");
    _0x107c82[_0x19c02e(0x10c)](_0x19c02e(0x17d))["empty"]();
    let _0x3cc7d3 = 0x0;
    const _0x3dd6ab = fileManager["getExistingRepresentativeImages"](),
        _0x5cb898 = fileManager[_0x19c02e(0x1c6)]();
    if (_0xe461f[_0x19c02e(0x178)][_0x19c02e(0x169)] > 0x0) {
        for (let _0x6b0eb5 = 0x0; _0x6b0eb5 < _0xe461f[_0x19c02e(0x178)][_0x19c02e(0x169)]; _0x6b0eb5++) {
            const _0x593dcc = _0xe461f[_0x19c02e(0x178)][_0x6b0eb5]["representative"],
                _0xb21e20 = _0xe461f["imageArray"][_0x6b0eb5][_0x19c02e(0x189)],
                _0x4f5a61 = _0xe461f["imageArray"][_0x6b0eb5]["imgSrc"],
                _0x1dd5ea = _0xe461f[_0x19c02e(0x178)][_0x6b0eb5][_0x19c02e(0xf2)];
            _0x5cb898[_0x19c02e(0x18b)](_0x1dd5ea);
            _0x593dcc === "Y" && _0x3dd6ab[_0x19c02e(0x18b)](_0x1dd5ea);
            const _0x21d1f9 = _0x593dcc === "Y" ? _0x19c02e(0x1de) : "";
            let _0x427c7e = "";
            if (_0xb21e20 === _0x19c02e(0x1e8)) _0x427c7e = _0x19c02e(0x1a7) + _0x4f5a61 + _0x19c02e(0x110);
            else _0xb21e20 === "video" ? (_0x427c7e = _0x19c02e(0x11d) + _0x4f5a61 + _0x19c02e(0x18f)) : (_0x427c7e = _0x19c02e(0x15c));
            const _0x3a7fd1 = _0x19c02e(0x1dc) + (_0x593dcc === "Y" ? _0x19c02e(0xec) : "") + _0x19c02e(0x122) + _0x1dd5ea + _0x19c02e(0xf1) + _0x21d1f9 + _0x19c02e(0x1f5) + _0x427c7e + _0x19c02e(0x1d8);
            _0x107c82[_0x19c02e(0x1ab)](_0x3a7fd1);
        }
        _0x107c82[_0x19c02e(0xf4)]("i")["hide"]();
    }
}
async function saleDelete(_0x1b523d) {
    const _0x47e6e4 = a50_0x2091a6,
        _0x43607d = userInfo();
    if (isNaN(_0x1b523d) || !_0x43607d) {
        const _0x7ad8b4 = await sweetAlertMessage("올바르지\x20않은\x20요청입니다.");
        if (_0x7ad8b4) {
            history[_0x47e6e4(0x117)]();
            return;
        }
    }
    const _0x5d04fd = await sweetConfirm(_0x47e6e4(0x14d), "", "w");
    if (!_0x5d04fd) return;
    const _0x20d8e2 = { ..._0x43607d, rcvNo: _0x1b523d },
        _0x39b32f = await callApi(_0x47e6e4(0x188), _0x47e6e4(0x1f7), _0x20d8e2);
    if (!_0x39b32f) return;
    const { status: _0x5f0d55, message: _0x5b6675 } = _0x39b32f;
    if (_0x5b6675 === _0x47e6e4(0x13f)) {
        const _0x163fd9 = await sweetAlertMessage(_0x47e6e4(0x147), "", "s");
        if (_0x163fd9) location[_0x47e6e4(0x144)] = _0x47e6e4(0x148);
    } else {
        const _0x37c6ed = await sweetAlertMessage(_0x47e6e4(0x158), "", "e");
        if (_0x37c6ed) return;
    }
}
function removeFile(_0x378387) {
    const _0x98de94 = a50_0x2091a6,
        _0x104185 = { ...userInfo(), fileNo: _0x378387 };
    callApiAbort("/front/back/sale/sale_file_remove.php", _0x98de94(0x188), _0x104185, _0x98de94(0x134))
        ["then"]((_0x10ce73) => {
            const _0x2e4be5 = _0x98de94;
            if (!_0x10ce73) {
                $("#modalFail")["iziModal"]("open");
                return;
            }
            const { statusCode: _0x4b9fa3, message: _0x25c9bd, responseData: _0x247937 } = _0x10ce73;
            _0x4b9fa3 == 0xc8 && _0x25c9bd == _0x2e4be5(0x13f) ? sweetAlertMessage(_0x2e4be5(0x1a8), "", "s") : sweetAlertMessage("삭제에\x20실패했습니다.", "", "e");
        })
        [_0x98de94(0x103)]((_0x2ab3ce) => {
            console["log"](_0x2ab3ce);
        });
}
function initModal() {
    const _0x146340 = a50_0x2091a6;
    _0x35395a(_0x146340(0x116), _0x146340(0x152), _0x146340(0x107)), _0x35395a(_0x146340(0x118), "/front/assets/lottie/save.json"), _0x35395a(_0x146340(0x12e), _0x146340(0x130), "#lottieFail"), _0x35395a(_0x146340(0x1b5), _0x146340(0x146), _0x146340(0x10b));
    const _0x485edc = {};
    function _0x35395a(_0x4e3944, _0x277bd9, _0x25e4fc) {
        const _0x6b7e64 = _0x146340;
        $(_0x4e3944)[_0x6b7e64(0x1ca)]({
            width: _0x6b7e64(0x108),
            top: null,
            bottom: null,
            transitionIn: _0x6b7e64(0x1ee),
            transitionOut: "fadeOut",
            overlayClose: ![],
            closeButton: !![],
            zindex: 0x3e7,
            onOpening: function (_0x383901) {
                const _0x133e45 = _0x6b7e64;
                _0x383901[_0x133e45(0x11a)](), !_0x485edc[_0x25e4fc] && (_0x485edc[_0x25e4fc] = bodymovin[_0x133e45(0x1ce)]({ container: document[_0x133e45(0x176)](_0x25e4fc), renderer: "svg", loop: !![], autoplay: !![], path: _0x277bd9 })), _0x383901["stopLoading"]();
            },
        });
    }
}
function getNumberData() {
    const _0x4a0ed7 = a50_0x2091a6;
    return {
        sale_price: ($(_0x4a0ed7(0x181))[_0x4a0ed7(0x111)]() || "")["trim"]()["replace"](/,/g, "") || "",
        rent_price: ($(_0x4a0ed7(0x139))[_0x4a0ed7(0x111)]() || "")["trim"]()[_0x4a0ed7(0x183)](/,/g, "") || "",
        platArea: ($("#platArea")[_0x4a0ed7(0x111)]() || "")[_0x4a0ed7(0x1fb)]()["replace"](/,/g, "") || "",
        totArea: ($(_0x4a0ed7(0x1e2))["val"]() || "")[_0x4a0ed7(0x1fb)]()[_0x4a0ed7(0x183)](/,/g, "") || "",
        archArea: ($(_0x4a0ed7(0x1e0))["val"]() || "")[_0x4a0ed7(0x1fb)]()[_0x4a0ed7(0x183)](/,/g, "") || "",
        vlRat: ($("#vlRat")[_0x4a0ed7(0x111)]() || "")[_0x4a0ed7(0x1fb)]()[_0x4a0ed7(0x183)](/,/g, "") || "",
        bcRat: ($(_0x4a0ed7(0x1e6))[_0x4a0ed7(0x111)]() || "")["trim"]()[_0x4a0ed7(0x183)](/,/g, "") || "",
        grndFlrCnt: ($(_0x4a0ed7(0x1f2))[_0x4a0ed7(0x111)]() || "")[_0x4a0ed7(0x1fb)]()[_0x4a0ed7(0x183)](/,/g, "") || "",
        ugrndFlrCnt: ($(_0x4a0ed7(0x137))[_0x4a0ed7(0x111)]() || "")[_0x4a0ed7(0x1fb)]()[_0x4a0ed7(0x183)](/,/g, "") || "",
        maintenance_price: ($(_0x4a0ed7(0x1a1))[_0x4a0ed7(0x111)]() || "")[_0x4a0ed7(0x1fb)]()[_0x4a0ed7(0x183)](/,/g, "") || "",
        loan_price: ($(_0x4a0ed7(0x1a4))[_0x4a0ed7(0x111)]() || "")[_0x4a0ed7(0x1fb)]()[_0x4a0ed7(0x183)](/,/g, "") || "",
        totPkngCnt: ($(_0x4a0ed7(0x168))["val"]() || "")[_0x4a0ed7(0x1fb)]()[_0x4a0ed7(0x183)](/,/g, "") || "",
    };
}
function getStringData() {
    const _0x4b03e1 = a50_0x2091a6;
    return {
        pnu: encodeURIComponent(($("#pnu").val() || "").trim()),
        postal_code: encodeURIComponent(($("#postal_code").val() || "").trim()),
        address_primary: encodeURIComponent(($("#address_primary").val() || "").trim()),
        address_road: encodeURIComponent(($("#address_road").val() || "").trim()),
        address_jibun: encodeURIComponent(($("#address_jibun").val() || "").trim()),
        address_detail: encodeURIComponent(($("#address_detail").val() || "").trim()),
        estate_type: encodeURIComponent(($("#estate_type").val() || "").trim()),
        sale_type: encodeURIComponent(($("#sale_type").val() || "").trim()),
        lndcgrCode: encodeURIComponent(($("#lndcgrCode").val() || "").trim()),
        lndcgrCodeNm: encodeURIComponent(($("#lndcgrCodeNm").val() || "").trim()),
        prposArea: encodeURIComponent(($("#prposArea").val() || "").trim()),
        prposAreaNm: encodeURIComponent(($("#prposAreaNm").val() || "").trim()),
        strctCd: encodeURIComponent(($("#strctCd").val() || "").trim()),
        strctCdNm: encodeURIComponent(($("#strctCdNm").val() || "").trim()),
        etcStrct: encodeURIComponent(($("#etcStrct").val() || "").trim()),
        useAprDay: encodeURIComponent(($("#useAprDay").val() || "").trim()),
        mainPurpsCd: encodeURIComponent(($("#mainPurpsCd").val() || "").trim()),
        mainPurpsCdNm: encodeURIComponent(($("#mainPurpsCdNm").val() || "").trim()),
        realPurpsNm: encodeURIComponent(($("#realPurpsNm").val() || "").trim()),
        related_jibun: encodeURIComponent(($("#related_jibun").val() || "").trim()),
        feature: encodeURIComponent(($("#feature").val() || "").trim()),
        description: encodeURIComponent(($("#description").val() || "").trim()),
        notes: encodeURIComponent(($("#notes").val() || "").trim()),
        mgmBldrgstPk: encodeURIComponent(($("#building_type").val() || "").trim()),
    };
}
function getFactoryData() {
    const _0x375186 = a50_0x2091a6;
    return {
        road_conditions: ($(_0x375186(0x119))["val"]() || "")["trim"]()["replace"](/,/g, "") || "",
        water: ($(_0x375186(0x1af))[_0x375186(0x111)]() || "")[_0x375186(0x1fb)]()[_0x375186(0x183)](/,/g, "") || "",
        floor_height: ($(_0x375186(0x161))["val"]() || "")[_0x375186(0x1fb)]()[_0x375186(0x183)](/,/g, "") || "",
        power: ($(_0x375186(0x1bb))[_0x375186(0x111)]() || "")["trim"]()[_0x375186(0x183)](/,/g, "") || "",
        water: encodeURIComponent($("#water")[_0x375186(0x111)]()[_0x375186(0x1fb)]() || ""),
    };
}
function resetBuildingGroupInputs() {
    const _0x471bd6 = a50_0x2091a6;
    $(_0x471bd6(0x1e7))[_0x471bd6(0x15d)](function () {
        const _0x16cae1 = _0x471bd6;
        $(this)[_0x16cae1(0x111)]("");
    });
}
function resetFactoryGroupInputs() {
    const _0xb6a34a = a50_0x2091a6;
    $(_0xb6a34a(0x1ba))[_0xb6a34a(0x15d)](function () {
        const _0x3c635c = _0xb6a34a;
        $(this)[_0x3c635c(0x111)]("");
    });
}
