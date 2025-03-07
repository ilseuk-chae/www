const a51_0x140d6d = a51_0x2e04;
(function (_0x23daf3, _0x5f36c1) {
    const _0x494d87 = a51_0x2e04,
        _0x18d1a3 = _0x23daf3();
    while (!![]) {
        try {
            const _0x35b59b =
                (-parseInt(_0x494d87(0xa3)) / 0x1) * (-parseInt(_0x494d87(0xdb)) / 0x2) +
                -parseInt(_0x494d87(0xe6)) / 0x3 +
                (parseInt(_0x494d87(0x120)) / 0x4) * (-parseInt(_0x494d87(0xff)) / 0x5) +
                (parseInt(_0x494d87(0x98)) / 0x6) * (-parseInt(_0x494d87(0x106)) / 0x7) +
                (-parseInt(_0x494d87(0x9d)) / 0x8) * (-parseInt(_0x494d87(0x80)) / 0x9) +
                parseInt(_0x494d87(0xf2)) / 0xa +
                parseInt(_0x494d87(0x139)) / 0xb;
            if (_0x35b59b === _0x5f36c1) break;
            else _0x18d1a3["push"](_0x18d1a3["shift"]());
        } catch (_0xe8a045) {
            _0x18d1a3["push"](_0x18d1a3["shift"]());
        }
    }
})(a51_0x41d4, 0x318bc);
let geocoder = new kakao[a51_0x140d6d(0x7b)][a51_0x140d6d(0x8d)][a51_0x140d6d(0xb4)](),
    globalBrTitleInfo = null,
    globalBrRecapTitleInfo = null,
    useAprDayPickr,
    swiper,
    fileManager,
    mainSearchBoxChk = 0;

$(document)["ready"](async function () {
    const user = userInfo();
    if (!user) {
        alert("로그인이 필요합니다.");
        location.href = "/";
    }

    if (user.user_role !== "002") {
        alert("중개사 회원 전용 페이지입니다.");
        location.href = "/";
    }
    initModal(), initMenu(user), checkUser(), initDefaultSet(), initEvents(), (fileManager = initImageEvents()), initValidation();
});

async function checkUser() {
    const user = userInfo();

    try {
        const result = await callApi("POST", "/front/back/oauth/check_user.php", user);
        if (!result) return;

        const { message, responseData, statusCode } = result;
        if (statusCode == 200 && responseData.length !== 0) {
            if (responseData.role !== "002") {
                alert("중개사 회원 전용 페이지입니다.");
                location.href = "/";
            }
        } else if (statusCode == 400) {
            alert(message);
            location.href = "/";
        } else {
            alert("서버와의 통신에 실패하였습니다.");
            location.href = "/";
        }
    } catch (error) {
        alert("서버와의 통신에 실패하였습니다.");
        location.href = "/";
    }
}

function initDefaultSet() {
    const _0x182f78 = a51_0x140d6d;
    (useAprDayPickr = flatpickr(_0x182f78(0x72), { dateFormat: "Y-m-d", altFormat: _0x182f78(0x128), altInput: !![], locale: "ko" })),
        $(_0x182f78(0x10f))[_0x182f78(0x81)](),
        $(_0x182f78(0x146))[_0x182f78(0x81)](),
        $(".rent-group")[_0x182f78(0x81)](),
        (swiper = new Swiper(_0x182f78(0x7f), { slidesPerView: _0x182f78(0xc5), spaceBetween: 0xf })),
        initSelect();
}
function a51_0x2e04(_0x35d32e, _0x3f323a) {
    const _0x41d4de = a51_0x41d4();
    return (
        (a51_0x2e04 = function (_0x2e04fb, _0x4bad4e) {
            _0x2e04fb = _0x2e04fb - 0x6d;
            let _0x2e7a4e = _0x41d4de[_0x2e04fb];
            return _0x2e7a4e;
        }),
        a51_0x2e04(_0x35d32e, _0x3f323a)
    );
}
async function initSelect() {
    const _0x345d40 = a51_0x140d6d,
        _0x185154 = "/front/back/sell/filter_type_get.php";
    try {
        const _0x3224cf = await callApi("POST", _0x185154, {});
        if (!_0x3224cf) return;
        const { message: _0xff9726, responseData: _0x4553b0, statusCode: _0x41dcb4 } = _0x3224cf;
        if (_0x41dcb4 !== 0xc8 || _0x4553b0[_0x345d40(0x10c)] == 0x0) return;
        const { ESTATE_TYPE: _0x2cc766, SALE_TYPE: _0x2c55f2 } = _0x4553b0,
            _0x21d38e = _0x2cc766[_0x345d40(0xd5)](function (_0x3b7792, _0x109ff4) {
                const _0x4162da = _0x345d40,
                    { type_code: _0x142f57, type_name: _0x207041 } = _0x3b7792;
                return _0x4162da(0x97) + _0x142f57 + "\x22>" + _0x207041 + "</option>";
            }),
            _0x402c41 = _0x2c55f2[_0x345d40(0xd5)](function (_0x27560e, _0x174762) {
                const _0x4e6c22 = _0x345d40,
                    { type_code: _0xaa61fb, type_name: _0x5505db } = _0x27560e;
                return _0x4e6c22(0x97) + _0xaa61fb + "\x22>" + _0x5505db + _0x4e6c22(0xd1);
            });
        $(_0x345d40(0xd7))[_0x345d40(0xfb)](_0x21d38e), $(_0x345d40(0x131))[_0x345d40(0xfb)](_0x402c41);
    } catch (_0x56f919) {
        console[_0x345d40(0x13d)](_0x345d40(0xe0), _0x56f919);
    }
}
function initEvents() {
    const _0x8acd1c = a51_0x140d6d;
    (function (_0x1c4e46) {
        const _0x111d21 = a51_0x2e04;
        var _0x182db5 = _0x1c4e46["fn"][_0x111d21(0x111)],
            _0x297e28 = ![];
        _0x1c4e46["fn"]["val"] = function () {
            const _0x27b1b1 = _0x111d21;
            var _0x539ee9 = _0x182db5[_0x27b1b1(0xa5)](this, arguments);
            return arguments[_0x27b1b1(0x10c)] > 0x0 && !_0x297e28 && ((_0x297e28 = !![]), this["trigger"]("input"), (_0x297e28 = ![])), _0x539ee9;
        };
    })(jQuery),
        // $(_0x8acd1c(0x12f))["on"](_0x8acd1c(0x83), function () {
        //     const _0x2dcd90 = _0x8acd1c;
        //     searchAddress($(this)[_0x2dcd90(0x111)]());
        // }),
        $("#sale_type")["on"](_0x8acd1c(0x82), function () {
            const _0x1d7e40 = _0x8acd1c,
                _0x9cc911 = $(this)[_0x1d7e40(0x111)]();
            _0x9cc911 === _0x1d7e40(0xde)
                ? ($(_0x1d7e40(0x101))[_0x1d7e40(0x122)](), $(_0x1d7e40(0xc4))[_0x1d7e40(0x13b)]("placeholder", _0x1d7e40(0x77)), $(_0x1d7e40(0x11e))[_0x1d7e40(0x12a)]("required", !![]))
                : ($(_0x1d7e40(0x101))[_0x1d7e40(0x81)](), $("#sale_price")[_0x1d7e40(0x13b)](_0x1d7e40(0xc7), "금액"), $(_0x1d7e40(0x11e))[_0x1d7e40(0x12a)](_0x1d7e40(0xcc), ![]));
        }),
        $(_0x8acd1c(0xd7))["on"](_0x8acd1c(0x82), function () {
            const _0x1d5011 = _0x8acd1c,
                _0x57a0a9 = $(this)["val"]();
            _0x57a0a9 === "006" ? ($(_0x1d5011(0x10f))[_0x1d5011(0x81)](), $(_0x1d5011(0x8a))[_0x1d5011(0x81)]()) : ($(".building-group")["show"](), $(".building-select")["show"]()), _0x57a0a9 === _0x1d5011(0x6d) ? $(_0x1d5011(0x146))["show"]() : $(".factory-group")[_0x1d5011(0x81)]();
        }),
        $("#building_type")["on"]("change", function () {
            const _0x1ed1f8 = _0x8acd1c,
                _0xb3d3e1 = $(_0x1ed1f8(0xcd))["val"]();
            if (_0xb3d3e1) {
                console.log(globalBrTitleInfo);

                const _0x173373 = globalBrTitleInfo["find"](function (_0x2a74b8) {
                    console.log(_0x2a74b8["mgmBldrgstPk"]);

                    return _0x2a74b8["mgmBldrgstPk"] == _0xb3d3e1;
                });
                console.log(_0x173373);

                _0x173373 && buildingInfoBind(_0x173373);
            }
        }),
        $(_0x8acd1c(0xf3))["on"](_0x8acd1c(0x12b), function () {
            const _0x290071 = _0x8acd1c,
                _0xeff6d2 = $(this)
                    [_0x290071(0x111)]()
                    ["trim"]()
                    [_0x290071(0x9a)](/,/g, "")
                    [_0x290071(0x9a)](/[^0-9.]/g, "")
                    [_0x290071(0x9a)](/(\..*)\./g, "$1")
                    [_0x290071(0x9a)](/^0+(\d)/, "$1"),
                _0x53cc87 = $(this)[_0x290071(0x13b)]("id"),
                _0x2a6f4d = _0x53cc87 + _0x290071(0x133);
            $("#" + _0x2a6f4d)[_0x290071(0x111)](comma(convertToPyeong(_0xeff6d2)));
        }),
        $("#platArea,\x20#totArea,\x20#archArea,\x20#sale_price,\x20#rent_price,\x20#loan_price,\x20#maintenance_price,\x20#vlRat,\x20#bcRat,\x20#grndFlrCnt,\x20#ugrndFlrCnt,\x20#power,\x20#road_conditions,\x20#floor_height")["on"](_0x8acd1c(0x12b), function () {
            const _0x48976a = _0x8acd1c,
                _0x10009e = $(this)
                    [_0x48976a(0x111)]()
                    [_0x48976a(0x11a)]()
                    [_0x48976a(0x9a)](/,/g, "")
                    [_0x48976a(0x9a)](/[^0-9.]/g, "")
                    [_0x48976a(0x9a)](/(\..*)\./g, "$1")
                    [_0x48976a(0x9a)](/^0+(\d)/, "$1");
            $(this)[_0x48976a(0x111)](comma(_0x10009e));
        }),
        $(_0x8acd1c(0xd0))["on"](_0x8acd1c(0x12b), function () {
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

            // const addressList = await fetchAddressList(keyword);
            const addressList = await searchAddress($(this).val());
            console.log(addressList);
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
            console.log(result);
            console.log(status);

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
    // 검색 결과 목록에 추가된 항목들을 제거합니다
    // var listEl = document.getElementById("placesList");

    var listEl = document.getElementById("placesList"),
        fragment = document.createDocumentFragment();
    removeAllChildNods(listEl);

    for (var i = 0; i < places.length; i++) {
        // 마커를 생성하고 지도에 표시합니다
        let itemEl = getListItem(i, places[i]); // 검색 결과 항목 Element를 생성

        // 마커와 검색결과 항목에 mouseover 했을때 해당 장소에 인포윈도우에 장소명을 표시합니다
        // mouseout 했을 때는 인포윈도우를 닫습니다
        (function (place) {
            // 리스트 click
            itemEl.onclick = async function () {
                console.log(place);

                const data = place;
                const address = data.address;
                const lat = data.y;
                const lng = data.x;

                // 지번 있을 때
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
                    // 지번 없으면 좌표로 검색
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
                }

                // 세션에 검색장소 저장
                // sessionStorage.setItem("lastSearchedPlace", JSON.stringify(places));
                // 실거래가 페이지로 이동한다
                // location.href = `/front/views/realPrice/realPrice.html?curLat=${places.y}&curLng=${places.x}`;
            };
        })(places[i]);

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
    const _0x34a451 = a51_0x140d6d;
    let _0xebb2f = {},
        _0x2b273d = 0x0,
        _0xe525f3 = [],
        _0x5340a3 = [];
    $(_0x34a451(0x9b))["on"]("change", async function (_0x3d3075) {
        await _0x56b7ca(_0x3d3075);
    }),
        $(_0x34a451(0x73))["on"](_0x34a451(0xc3), _0x34a451(0xb9), function () {
            const _0x1d465e = _0x34a451,
                _0x5abd3d = $(this)[_0x1d465e(0xd2)](_0x1d465e(0xef));
            _0x234a9a(_0x5abd3d);
        }),
        $(document)["on"](_0x34a451(0xc3), _0x34a451(0xea), function () {
            _0x528549(_0xebb2f, $(this));
        });
    function _0x304b22() {
        return _0xebb2f;
    }
    function _0x2255aa() {
        return _0xe525f3;
    }
    function _0x2ce8c8() {
        return _0x5340a3;
    }
    async function _0x56b7ca(_0x1a16c1) {
        const _0x401fdb = _0x34a451,
            _0x48f6f2 = _0x1a16c1["target"][_0x401fdb(0xcb)],
            _0x2f12b0 = $(".swiper-wrapper");
        _0x2f12b0["not"](_0x401fdb(0x144))[_0x401fdb(0x10d)]();
        for (let _0x12d9a2 = 0x0; _0x12d9a2 < _0x48f6f2[_0x401fdb(0x10c)]; _0x12d9a2++) {
            const _0x39987f = _0x48f6f2[_0x12d9a2],
                _0x23c6ea = _0x2b273d++;
            let _0xcf7dff = "";
            if (_0x39987f[_0x401fdb(0xbb)][_0x401fdb(0x90)]("image/")) {
                const _0x33d71e = await handleFileInputChangeMultiple(_0x39987f);
                _0xcf7dff = "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20type=\x22button\x22\x20class=\x22swiper-slide\x20new-image\x22\x20data-id=\x22" + _0x23c6ea + _0x401fdb(0x71) + _0x33d71e + _0x401fdb(0xb5);
            } else {
                if (_0x39987f[_0x401fdb(0xbb)][_0x401fdb(0x90)](_0x401fdb(0xae))) {
                    const _0x494f43 = URL["createObjectURL"](_0x39987f);
                    _0xcf7dff =
                        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20type=\x22button\x22\x20class=\x22swiper-slide\x20new-image\x22\x20data-id=\x22" +
                        _0x23c6ea +
                        _0x401fdb(0xcf) +
                        _0x494f43 +
                        _0x401fdb(0x132) +
                        _0x39987f["type"] +
                        "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20Your\x20browser\x20does\x20not\x20support\x20the\x20video\x20tag.\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</video>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22close-btn-box\x22><i\x20class=\x22fa-sharp\x20fa-solid\x20fa-circle-xmark\x22></i></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20";
                }
            }
            _0x2f12b0[_0x401fdb(0xfb)](_0xcf7dff), (_0xebb2f[_0x23c6ea] = _0x39987f);
        }
        swiper[_0x401fdb(0xd8)](), $(_0x401fdb(0x9b))["val"]("");
    }
    async function _0x528549(_0x51af7a, _0xfb6ca5) {
        const _0x4a25e5 = _0x34a451,
            _0x216651 = await sweetConfirm(_0x4a25e5(0xbd), "", "w");
        if (!_0x216651) return;
        const _0x138d40 = _0xfb6ca5[_0x4a25e5(0xd2)](_0x4a25e5(0xef)),
            _0x94edba = _0x138d40["attr"](_0x4a25e5(0x10b));
        (_0x5340a3 = _0x5340a3[_0x4a25e5(0x11b)]((_0x474933) => _0x474933 !== _0x94edba)), delete _0x51af7a[_0x94edba], _0x138d40[_0x4a25e5(0x12d)](), swiper[_0x4a25e5(0xd8)]();
    }
    function _0x486071(_0x22ad74) {
        const _0x2a4352 = _0x34a451,
            _0x24331b = _0x2a4352(0xa0);
        _0x22ad74[_0x2a4352(0x91)](_0x24331b), _0x22ad74[_0x2a4352(0x78)]("representative");
    }
    async function _0x234a9a(_0x1c5f33) {
        const _0x59ba5a = _0x34a451,
            _0x3b94e2 = Number(_0x1c5f33[_0x59ba5a(0x13b)](_0x59ba5a(0x10b))),
            _0x9a7c0 = _0x1c5f33["attr"]("data-origin");
        if (_0x1c5f33["hasClass"]("representative")) {
            const _0x6e7dbb = await sweetConfirm("대표이미지를\x20취소하시겠습니까?", "", "q");
            if (!_0x6e7dbb) return;
            _0x9a7c0 === "Y" ? (_0xe525f3 = _0xe525f3[_0x59ba5a(0x11b)]((_0xc6f9e8) => _0xc6f9e8 !== _0x3b94e2)) : (_0x5340a3 = _0x5340a3[_0x59ba5a(0x11b)]((_0x57deab) => _0x57deab !== _0x3b94e2)),
                _0x1c5f33[_0x59ba5a(0x11d)]("representative"),
                _0x1c5f33[_0x59ba5a(0xd9)](_0x59ba5a(0x70))[_0x59ba5a(0x12d)]();
        } else {
            const _0x5046f8 = await sweetConfirm(_0x59ba5a(0xa8), "", "q");
            if (!_0x5046f8) return;
            const _0x1c252e = _0xe525f3[_0x59ba5a(0x10c)] + _0x5340a3[_0x59ba5a(0x10c)];
            if (_0x1c252e >= 0x2) {
                sweetAlertMessage(_0x59ba5a(0xe7), "", "i");
                return;
            }
            _0x9a7c0 === "Y"
                ? !_0xe525f3[_0x59ba5a(0xda)](_0x3b94e2)
                    ? (_0xe525f3["push"](_0x3b94e2), _0x486071(_0x1c5f33))
                    : sweetAlertMessage(_0x59ba5a(0x88), "", "i")
                : !_0x5340a3["includes"](_0x3b94e2)
                ? (_0x5340a3[_0x59ba5a(0xb2)](_0x3b94e2), _0x486071(_0x1c5f33))
                : sweetAlertMessage("이미\x20대표\x20이미지로\x20설정된\x20파일입니다.", "", "i");
        }
    }
    return { getFileList: _0x304b22, getSelectedRepresentativeImages: _0x2ce8c8, getExistingRepresentativeImages: _0x2255aa };
}
// function searchAddress(_0x2e0844) {
//     geocoder["addressSearch"](_0x2e0844, function (_0x25d684, _0x32d47f) {
//         const _0x4b1034 = a51_0x2e04;
//         if (_0x32d47f === kakao["maps"][_0x4b1034(0x8d)][_0x4b1034(0x112)]["OK"]) {
//             console[_0x4b1034(0xd4)](_0x25d684);
//             const _0x1491d9 = _0x25d684[0x0],
//                 _0x39bd31 = _0x1491d9[_0x4b1034(0xaf)],
//                 _0x1d6be3 = _0x39bd31[_0x4b1034(0xfe)] === "Y" ? "2" : "1",
//                 _0x2a5618 = (_0x39bd31[_0x4b1034(0xe9)] || _0x4b1034(0xe5))[_0x4b1034(0x9e)](0x4, "0"),
//                 _0x142d63 = (_0x39bd31[_0x4b1034(0xf5)] || _0x4b1034(0xe5))["padStart"](0x4, "0"),
//                 _0x155c76 = _0x39bd31[_0x4b1034(0x12c)] + _0x1d6be3 + _0x2a5618 + _0x142d63;
//             $(_0x4b1034(0xa1))[_0x4b1034(0x111)](_0x155c76), $(_0x4b1034(0x145))[_0x4b1034(0x111)](_0x1491d9["y"]), $(_0x4b1034(0xac))[_0x4b1034(0x111)](_0x1491d9["x"]), BuildingDetail(_0x155c76), landInfo(_0x155c76);
//         }
//     });
// }
async function BuildingDetail(_0x1fdd75) {
    const _0x2e766c = a51_0x140d6d,
        _0x398f75 = { pnu: _0x1fdd75 },
        _0x1c80eb = await callApiAbort(_0x2e766c(0xed), _0x2e766c(0xfa), _0x398f75, _0x2e766c(0x143));
    let _0x4d6612 = _0x1c80eb[_0x2e766c(0xa9)][_0x2e766c(0xb1)],
        _0x58ecf0 = _0x1c80eb["brRecapTitleInfo"]["item"];
    _0x4d6612["length"] === 0x0 && sweetAlertMessage(_0x2e766c(0x10e), "", "i"),
        Array[_0x2e766c(0xa6)](_0x4d6612)
            ? (_0x4d6612[_0x2e766c(0x93)](function (_0x515f08, _0x4091b5) {
                  const _0x536e1c = _0x2e766c,
                      _0x2539ad = String(_0x515f08["mainPurpsCdNm"]),
                      _0x57af4d = String(_0x4091b5[_0x536e1c(0xb3)]);
                  return _0x2539ad[_0x536e1c(0x9c)](_0x57af4d);
              }),
              (globalBrTitleInfo = _0x4d6612),
              (globalBrRecapTitleInfo = _0x58ecf0))
            : ((globalBrTitleInfo = [_0x4d6612]), (globalBrRecapTitleInfo = [_0x58ecf0])),
        createBuildingOptions(globalBrTitleInfo, globalBrRecapTitleInfo);
}
function createBuildingOptions(_0x573c6e, _0x28942b) {
    const _0x5042aa = a51_0x140d6d;
    if (!_0x573c6e || _0x573c6e[_0x5042aa(0x10c)] === 0x0 || _0x573c6e[_0x5042aa(0xb8)]((_0x39ef94) => _0x39ef94 === null || _0x39ef94 === undefined)) return;
    _0x573c6e = _0x573c6e[_0x5042aa(0x11b)]((_0x3d6fb4) => _0x3d6fb4 !== null && _0x3d6fb4 !== undefined);
    if (_0x573c6e[_0x5042aa(0x10c)] === 0x0) return;
    const _0x3e5025 = $(_0x5042aa(0xcd));
    _0x3e5025[_0x5042aa(0xd9)](_0x5042aa(0x142))[_0x5042aa(0x12d)](),
        $[_0x5042aa(0x129)](_0x573c6e, function (_0x1a4ea8, _0x154934) {
            const _0x1bfab3 = _0x5042aa,
                _0x3528ec = $(_0x1bfab3(0x104))
                    ["val"](_0x154934[_0x1bfab3(0x8b)])
                    ["text"]("" + (_0x154934[_0x1bfab3(0x13a)] + "\x20") + (_0x154934[_0x1bfab3(0x75)] + "\x20") + _0x154934[_0x1bfab3(0xf8)]);
            if (_0x1a4ea8 === 0x0) {
            }
            _0x3e5025["append"](_0x3528ec);
        });
}
function buildingInfoBind(_0x2442e6) {
    const _0x1fbaf9 = a51_0x140d6d,
        {
            platPlc: _0x45b7cf,
            newPlatPlc: _0xe426b1,
            bldNm: _0x5d6a46,
            etcPurps: _0x523d46,
            mainPurpsCd: _0x828b28,
            mainPurpsCdNm: _0x2a4f01,
            strctCd: _0x559102,
            strctCdNm: _0x12d882,
            etcStrct: _0x3c50b3,
            roofCdNm: _0x52e1d8,
            etcRoof: _0x59ccf2,
            heit: _0x56e1e1,
            grndFlrCnt: _0x10bec9,
            ugrndFlrCnt: _0x30891f,
            platArea: _0x3a48a7,
            archArea: _0x248e2f,
            totArea: _0x5bb471,
            vlRatEstmTotArea: _0x51803a,
            vlRat: _0x257a7a,
            bcRat: _0x279aca,
            hhldCnt: _0x2b0b77,
            fmlyCnt: _0x3f940b,
            bylotCnt: _0x90375d,
            rideUseElvtCnt: _0x2890fb,
            emgenUseElvtCnt: _0x1e091b,
            useAprDay: _0x16359d,
            pmsDay: _0x382428,
            stcnsDay: _0x321466,
            sigunguCd: _0x5a373f,
            bjdongCd: _0x359ebb,
            platGbCd: _0x3e9617,
            bun: _0x58ad54,
            ji: _0x4b31a6,
        } = _0x2442e6;
    $("#platArea")["val"](comma(_0x3a48a7)),
        $(_0x1fbaf9(0x6f))[_0x1fbaf9(0x111)](comma(convertToPyeong(_0x3a48a7))),
        $(_0x1fbaf9(0x94))[_0x1fbaf9(0x111)](comma(_0x248e2f)),
        $(_0x1fbaf9(0xc8))["val"](comma(convertToPyeong(_0x248e2f))),
        $(_0x1fbaf9(0x124))[_0x1fbaf9(0x111)](comma(_0x5bb471)),
        $("#totArea_py")["val"](comma(convertToPyeong(_0x5bb471))),
        $(_0x1fbaf9(0xa2))[_0x1fbaf9(0x111)](comma(_0x257a7a)),
        $("#bcRat")[_0x1fbaf9(0x111)](comma(_0x279aca)),
        $(_0x1fbaf9(0xc6))[_0x1fbaf9(0x111)](comma(_0x10bec9)),
        $(_0x1fbaf9(0x7e))[_0x1fbaf9(0x111)](comma(_0x30891f)),
        $(_0x1fbaf9(0x6e))[_0x1fbaf9(0x111)](_0x559102),
        $(_0x1fbaf9(0x96))[_0x1fbaf9(0x111)](_0x12d882),
        $(_0x1fbaf9(0xfc))[_0x1fbaf9(0x111)](_0x3c50b3),
        $(_0x1fbaf9(0x74))["val"](_0x828b28),
        $("#mainPurpsCdNm")[_0x1fbaf9(0x111)](_0x2a4f01);
    const _0x5f1151 = formatDate(_0x16359d);
    useAprDayPickr[_0x1fbaf9(0x141)](_0x5f1151), globalBrRecapTitleInfo && globalBrRecapTitleInfo["totPkngCnt"] ? $(_0x1fbaf9(0xe4))[_0x1fbaf9(0x111)](globalBrRecapTitleInfo[_0x1fbaf9(0x11c)]) : $(_0x1fbaf9(0xe4))[_0x1fbaf9(0x111)]("");
}
function a51_0x41d4() {
    const _0x3a2b99 = [
        "[required]",
        "<span\x20class=\x22badge\x20badge-label\x20bg-danger\x22><i\x20class=\x22mdi\x20mdi-circle-medium\x22></i>\x20대표</span>",
        "#pnu",
        "#vlRat",
        "1nkNbtk",
        "prototype",
        "apply",
        "isArray",
        "svg",
        "대표\x20이미지로\x20설정하시겠습니까?",
        "brTitleInfo",
        "open",
        "estate_type",
        "#longitude",
        "#lottieFail",
        "video/",
        "address",
        "iziModal",
        "item",
        "push",
        "mainPurpsCdNm",
        "Geocoder",
        "\x22\x20width=\x22100%\x22\x20alt=\x22\x22\x20title=\x22\x22\x20/>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22close-btn-box\x22><i\x20class=\x22fa-sharp\x20fa-solid\x20fa-circle-xmark\x22></i></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20",
        "을(를)\x20확인해주세요.",
        "tagName",
        "every",
        ".swiper-slide\x20img",
        "#modalConfirm",
        "type",
        "#floor_height",
        "삭제하시겠습니까?",
        "/front/views/mypage/mypage_sale",
        "/front/assets/lottie/failed.json",
        ".needs-validation",
        "stringify",
        "연락처",
        "click",
        "#sale_price",
        "auto",
        "#grndFlrCnt",
        "placeholder",
        "#archArea_py",
        "SUCCESS",
        "data-preloader",
        "files",
        "required",
        "#building_type",
        "#address_detail",
        "\x22\x20data-origin=\x22N\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<video\x20muted\x20controls\x20width=\x22100%\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<source\x20src=\x22",
        "#description",
        "</option>",
        "closest",
        "phone",
        "log",
        "map",
        "stopPropagation",
        "#estate_type",
        "update",
        "find",
        "includes",
        "234048SHHxPh",
        "parent",
        "#address_primary",
        "002",
        "#lndcgrCode",
        "getFilterTypes\x20error:",
        "focus",
        "checkbox",
        "#mainPurpsCdNm",
        "#totPkngCnt",
        "0000",
        "1074534NmgNXt",
        "대표\x20이미지는\x20최대\x202장까지\x20설정\x20가능합니다.",
        "disable",
        "main_address_no",
        ".fa-circle-xmark",
        "addEventListener",
        "querySelector",
        "/front/back/sale/buiding_register_title_info.php",
        "preventDefault",
        ".swiper-slide",
        "#feature",
        "비밀번호",
        "2212500ybnSJU",
        "#platArea,\x20#totArea,\x20#archArea",
        "password",
        "sub_address_no",
        "enable",
        "catch",
        "mainAtchGbCdNm",
        "#address_jibun",
        "POST",
        "append",
        "#etcStrct",
        "submit",
        "mountain_yn",
        "5UXLrKx",
        "representativeImages",
        ".rent-group",
        "/front/back/sale/land_characteristics.php",
        "center",
        "<option>",
        ".invalid-feedback",
        "46627WzDMQh",
        "input[required],\x20select[required],\x20textarea[required]",
        "이미지/영상은\x20최소\x201장\x20이상\x20등록해야\x20합니다.",
        "Field:\x20",
        "textarea",
        "data-id",
        "length",
        "empty",
        "건축물대장\x20정보가\x20없습니다.",
        ".building-group",
        "getFileList",
        "val",
        "Status",
        "API\x20호출\x20실패",
        "470px",
        "/front/assets/lottie/completion.json",
        "#water",
        "forEach",
        "string",
        "getExistingRepresentativeImages",
        "trim",
        "filter",
        "totPkngCnt",
        "removeClass",
        "#rent_price",
        "querySelectorAll",
        "1285484MzfnWX",
        "다시\x20시도해\x20주세요.",
        "show",
        "toString",
        "#totArea",
        "/front/back/sale/sale_regist.php",
        "#related_jibun",
        "#postal_code",
        "F\x20j,\x20Y",
        "each",
        "prop",
        "input",
        "b_code",
        "remove",
        "scrollIntoView",
        "input[name=\x27address_primary\x27]",
        "setBottom",
        "#sale_type",
        "\x22\x20type=\x22",
        "_py",
        "#lndcgrCodeNm",
        "/front/assets/lottie/save.json",
        "select",
        "toLowerCase",
        "call",
        "3153524rsjDOk",
        "dongNm",
        "attr",
        "text",
        "error",
        "then",
        "#address_road",
        "체크박스",
        "setDate",
        "option:not(:first)",
        "BuildingDetail",
        ":first",
        "#latitude",
        ".factory-group",
        "003",
        "#strctCd",
        "#platArea_py",
        ".badge",
        "\x22\x20data-origin=\x22N\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<img\x20src=\x22",
        "#useAprDay",
        ".swiper-wrapper",
        "#mainPurpsCd",
        "bldNm",
        "tel",
        "보증금",
        "addClass",
        "slice",
        "을(를)\x20입력해주세요.",
        "maps",
        "#modalCompletion",
        "reportValidity",
        "#ugrndFlrCnt",
        ".fw-file",
        "102303RZfQxa",
        "hide",
        "change",
        "input\x20change\x20valueSet",
        "#prposAreaNm",
        "#prposArea",
        "html",
        "입력값",
        "이미\x20대표\x20이미지로\x20설정된\x20파일입니다.",
        "number",
        ".building-select",
        "mgmBldrgstPk",
        "#modalFail",
        "services",
        "hasOwnProperty",
        "#bcRat",
        "startsWith",
        "prepend",
        "loadAnimation",
        "sort",
        "#archArea",
        "setCustomValidity",
        "#strctCdNm",
        "<option\x20value=\x22",
        "24CvAZhL",
        "#notes",
        "replace",
        "#file_input",
        "localeCompare",
        "200KatPaA",
        "padStart",
    ];
    a51_0x41d4 = function () {
        return _0x3a2b99;
    };
    return a51_0x41d4();
}
async function landInfo(_0x450144) {
    const _0x50eb43 = a51_0x140d6d,
        _0x3a83f8 = { pnu: _0x450144 },
        _0x5309a5 = _0x50eb43(0x102);
    callApiAbort(_0x5309a5, "POST", _0x3a83f8, "landInfo")
        [_0x50eb43(0x13e)]((_0x5b0f0b) => {
            const _0x388c74 = _0x50eb43;
            if (!_0x5b0f0b) return;
            const { landCharacteristicss: _0x217e40 } = _0x5b0f0b;
            if (!_0x217e40 || !_0x217e40[0x0]) return;
            const { lndcgrCode: _0x183be2, lndcgrCodeNm: _0x1ad717, prposArea1: _0x29caf5, prposArea1Nm: _0x21e46f, lndpclAr: _0x5f15a1 } = _0x217e40[0x0];
            $("#lndcgrCode")[_0x388c74(0x111)](_0x183be2),
                $(_0x388c74(0x134))[_0x388c74(0x111)](_0x1ad717),
                $(_0x388c74(0x85))[_0x388c74(0x111)](_0x29caf5),
                $(_0x388c74(0x84))[_0x388c74(0x111)](_0x21e46f),
                $("#platArea")[_0x388c74(0x111)](comma(_0x5f15a1)),
                $("#platArea_py")[_0x388c74(0x111)](comma(convertToPyeong(_0x5f15a1)));
        })
        [_0x50eb43(0xf7)]((_0x50d5f7) => {
            const _0x778b23 = _0x50eb43;
            console[_0x778b23(0xd4)](_0x50d5f7);
        });
}
function formatDate(_0x347613) {
    const _0x16c1cf = a51_0x140d6d;
    typeof _0x347613 === _0x16c1cf(0x89) && (_0x347613 = _0x347613[_0x16c1cf(0x123)]());
    if (typeof _0x347613 !== _0x16c1cf(0x118) || _0x347613[_0x16c1cf(0x10c)] !== 0x8) return "";
    return _0x347613[_0x16c1cf(0x79)](0x0, 0x4) + "-" + _0x347613[_0x16c1cf(0x79)](0x4, 0x6) + "-" + _0x347613[_0x16c1cf(0x79)](0x6, 0x8);
}
function initModal() {
    const _0x141584 = a51_0x140d6d;
    _0xfa000c(_0x141584(0xba), _0x141584(0x135)), _0xfa000c(_0x141584(0x8c), _0x141584(0xbf), _0x141584(0xad)), _0xfa000c(_0x141584(0x7c), _0x141584(0x115), "#lottieCompletion");
    function _0xfa000c(_0x599751, _0xbccf90, _0x5b1797) {
        const _0x467265 = _0x141584;
        $(_0x599751)["iziModal"]({ width: _0x467265(0x114) }), $(_0x599751)[_0x467265(0xb0)]("setTop", 0x46), $(_0x599751)[_0x467265(0xb0)](_0x467265(0x130), 0x46);
        var _0xaf2259 = bodymovin[_0x467265(0x92)]({ container: document[_0x467265(0xec)](_0x5b1797), renderer: _0x467265(0xa7), loop: !![], autoplay: !![], path: _0xbccf90 });
    }
}
function initValidation() {
    const _0x5d1262 = a51_0x140d6d;
    var _0x1d9652 = document["querySelectorAll"](_0x5d1262(0xc0));
    Array[_0x5d1262(0xa4)][_0x5d1262(0x79)]["call"](_0x1d9652)[_0x5d1262(0x117)](function (_0x1d5e53) {
        const _0x4de74d = _0x5d1262;
        _0x1d5e53[_0x4de74d(0xeb)](
            _0x4de74d(0xfd),
            async function (_0x2cc0de) {
                const _0x53b801 = _0x4de74d;
                _0x2cc0de[_0x53b801(0xee)]();
                const _0x27ca03 = $(_0x1d5e53)[_0x53b801(0xd9)](_0x53b801(0x9f));
                let _0x1f5d85 = !![],
                    _0x2ee5b9 = null;
                _0x27ca03[_0x53b801(0x129)]((_0x206c39, _0x42bd81) => {
                    const _0x34d373 = _0x53b801,
                        _0x44a242 = $(_0x42bd81),
                        _0x3bd22f = _0x44a242["attr"](_0x34d373(0xbb)) || _0x44a242[_0x34d373(0x12a)](_0x34d373(0xb7))[_0x34d373(0x137)]();
                    let _0x33ca71, _0x225a8f;
                    switch (_0x3bd22f) {
                        case _0x34d373(0x13c):
                            (_0x33ca71 = _0x34d373(0x13c)), (_0x225a8f = _0x34d373(0x87));
                            break;
                        case "password":
                            (_0x33ca71 = "password"), (_0x225a8f = _0x34d373(0xf1));
                            break;
                        case _0x34d373(0x76):
                            (_0x33ca71 = _0x34d373(0xd3)), (_0x225a8f = _0x34d373(0xc2));
                            break;
                        case _0x34d373(0xe2):
                            (_0x33ca71 = _0x34d373(0xe2)), (_0x225a8f = "체크박스");
                            break;
                        case _0x34d373(0x136):
                            (_0x33ca71 = "select"), (_0x225a8f = "옵션");
                            break;
                        case _0x34d373(0x10a):
                            (_0x33ca71 = _0x34d373(0x13c)), (_0x225a8f = "값");
                            break;
                        default:
                            (_0x33ca71 = _0x3bd22f), (_0x225a8f = "값");
                    }
                    const _0x445e15 = validateInput(_0x44a242, _0x33ca71, _0x225a8f + _0x34d373(0xb6)),
                        _0x1f25f9 = _0x44a242[_0x34d373(0xdc)]()[_0x34d373(0xd9)](".invalid-feedback")[_0x34d373(0x10c)] != 0x0 ? _0x44a242[_0x34d373(0xdc)]()[_0x34d373(0xd9)](_0x34d373(0x105)) : _0x44a242[_0x34d373(0xdc)]()[_0x34d373(0xdc)]()["find"](".invalid-feedback");
                    !_0x445e15
                        ? (console[_0x34d373(0xd4)](_0x34d373(0x109) + _0x44a242[_0x34d373(0x13b)]("id") + ",\x20Is\x20Valid:\x20" + _0x445e15),
                          _0x1f25f9["length"] > 0x0 ? (_0x1f25f9[_0x34d373(0x122)](), _0x44a242[0x0]["setCustomValidity"](_0x1f25f9["text"]())) : _0x44a242[0x0]["setCustomValidity"](_0x225a8f + _0x34d373(0xb6)),
                          _0x44a242[0x0][_0x34d373(0x7d)](),
                          (_0x1f5d85 = ![]),
                          !_0x2ee5b9 && (_0x2ee5b9 = _0x44a242))
                        : (_0x1f25f9["hide"](), _0x44a242[0x0]["setCustomValidity"](""));
                }),
                    console["log"](_0x1f5d85);
                !_0x1f5d85
                    ? (_0x2ee5b9 && (_0x2ee5b9[0x0][_0x53b801(0x12e)]({ behavior: "smooth", block: _0x53b801(0x103) }), _0x2ee5b9[0x0][_0x53b801(0x7d)](), _0x2ee5b9[_0x53b801(0xe1)]()), _0x2cc0de[_0x53b801(0xee)](), _0x2cc0de[_0x53b801(0xd6)]())
                    : (_0x2cc0de[_0x53b801(0xee)](), _0x2cc0de[_0x53b801(0xd6)](), saleRegist(fileManager[_0x53b801(0x110)]()));
                return;
            },
            ![]
        ),
            _0x1d5e53[_0x4de74d(0x11f)](_0x4de74d(0x107))[_0x4de74d(0x117)](function (_0x18187f) {
                const _0x144f43 = _0x4de74d;
                _0x18187f["addEventListener"](_0x144f43(0x12b), function () {
                    const _0x225f3d = _0x144f43,
                        _0x1d9dd1 = $(_0x18187f),
                        _0x57182c = _0x1d9dd1["attr"](_0x225f3d(0xbb)) || _0x1d9dd1[_0x225f3d(0x12a)](_0x225f3d(0xb7))["toLowerCase"]();
                    let _0x39922a, _0x57f01c;
                    switch (_0x57182c) {
                        case _0x225f3d(0x13c):
                            (_0x39922a = _0x225f3d(0x13c)), (_0x57f01c = "값");
                            break;
                        case "password":
                            (_0x39922a = _0x225f3d(0xf4)), (_0x57f01c = _0x225f3d(0xf1));
                            break;
                        case _0x225f3d(0x76):
                            (_0x39922a = "phone"), (_0x57f01c = _0x225f3d(0xc2));
                            break;
                        case _0x225f3d(0xe2):
                            (_0x39922a = _0x225f3d(0xe2)), (_0x57f01c = _0x225f3d(0x140));
                            break;
                        case _0x225f3d(0x136):
                            (_0x39922a = "select"), (_0x57f01c = "옵션");
                            break;
                        case _0x225f3d(0x10a):
                            (_0x39922a = _0x225f3d(0x13c)), (_0x57f01c = "값");
                            break;
                        default:
                            (_0x39922a = _0x57182c), (_0x57f01c = "값");
                    }
                    const _0x577c5c = validateInput(_0x1d9dd1, _0x39922a, _0x57f01c + _0x225f3d(0xb6)),
                        _0x4c3b03 = _0x1d9dd1[_0x225f3d(0xdc)]()[_0x225f3d(0xd9)](_0x225f3d(0x105))[_0x225f3d(0x10c)] != 0x0 ? _0x1d9dd1[_0x225f3d(0xdc)]()["find"](_0x225f3d(0x105)) : _0x1d9dd1["parent"]()["parent"]()[_0x225f3d(0xd9)](".invalid-feedback");
                    _0x577c5c
                        ? (_0x1d9dd1[0x0][_0x225f3d(0x95)](""), _0x4c3b03[_0x225f3d(0x81)]())
                        : (_0x4c3b03[_0x225f3d(0x10c)] > 0x0 ? (_0x1d9dd1[0x0][_0x225f3d(0x95)](_0x4c3b03[_0x225f3d(0x13c)]()), _0x4c3b03["show"]()) : _0x1d9dd1[0x0][_0x225f3d(0x95)](_0x57f01c + _0x225f3d(0x7a)), _0x1d9dd1[0x0][_0x225f3d(0x7d)]());
                });
            });
    });
}
async function saleRegist(_0xccd08b) {
    const _0x278fc0 = a51_0x140d6d;
    if ($(".swiper-slide")[_0x278fc0(0x10c)] === 0x0) {
        const _0x1d2123 = await sweetAlertMessage(_0x278fc0(0x108), "", "e");
        return;
    }
    const _0x5c112c = userInfo(),
        _0x9e2960 = getNumberData(),
        _0x10dc46 = getStringData(),
        _0x4f9a00 = getFactoryData();
    let _0x31e6c0 = new FormData();
    for (const _0x3d12e0 in _0xccd08b) {
        _0xccd08b["hasOwnProperty"](_0x3d12e0) && _0x31e6c0[_0x278fc0(0xfb)]("files[]", _0xccd08b[_0x3d12e0]);
    }
    const _0x3bda18 = fileManager[_0x278fc0(0x119)](),
        _0x5b7fec = fileManager["getSelectedRepresentativeImages"]();
    if (_0x3bda18[_0x278fc0(0x10c)] + _0x5b7fec[_0x278fc0(0x10c)] > 0x2) {
        sweetAlertMessage(_0x278fc0(0xe7), "", "i");
        return;
    }
    _0x31e6c0[_0x278fc0(0xfb)](_0x278fc0(0x100), JSON[_0x278fc0(0xc1)](_0x5b7fec));
    let _0x598b33 = { ..._0x5c112c, ..._0x9e2960, ..._0x10dc46, latitude: $(_0x278fc0(0x145))[_0x278fc0(0x111)]() || "", longitude: $("#longitude")["val"]() || "" };
    _0x10dc46[_0x278fc0(0xab)] === _0x278fc0(0x6d) && (_0x598b33 = { ..._0x598b33, ..._0x4f9a00 });
    for (const _0x58911d in _0x598b33) {
        if (Object[_0x278fc0(0x8e)][_0x278fc0(0x138)](_0x598b33, _0x58911d)) {
            const _0x3b265b = _0x598b33[_0x58911d];
            _0x31e6c0[_0x278fc0(0xfb)](_0x58911d, _0x3b265b);
        }
    }
    $(_0x278fc0(0x86))[_0x278fc0(0x13b)](_0x278fc0(0xca), _0x278fc0(0xf6)),
        callApiFormData(_0x278fc0(0xfa), _0x278fc0(0x125), _0x31e6c0)
            [_0x278fc0(0x13e)]((_0x5f4d52) => {
                const _0x2a04b4 = _0x278fc0;
                if (!_0x5f4d52) {
                    $("#modalFail")[_0x2a04b4(0xb0)]("open");
                    return;
                }
                const { statusCode: _0x580f12, message: _0xa8d36f, responseData: _0x1a3195 } = _0x5f4d52;
                _0x580f12 == 0xc8 && _0xa8d36f == _0x2a04b4(0xc9)
                    ? ($("#modalCompletion")["iziModal"](_0x2a04b4(0xaa)),
                      $(_0x2a04b4(0x7c))["on"]("closed", function () {
                          const _0x2a4347 = _0x2a04b4;
                          location["href"] = _0x2a4347(0xbe);
                      }))
                    : sweetAlertMessage(_0xa8d36f, "", "w");
            })
            [_0x278fc0(0xf7)]((_0x2a8e60) => {
                const _0x4d4daf = _0x278fc0;
                console[_0x4d4daf(0x13d)](_0x4d4daf(0x113), _0x2a8e60);
            })
            ["finally"](() => {
                const _0x24cf15 = _0x278fc0;
                $(_0x24cf15(0x86))[_0x24cf15(0x13b)]("data-preloader", _0x24cf15(0xe8));
            });
}
function getNumberData() {
    const _0x38a21d = a51_0x140d6d;
    return {
        sale_price: ($(_0x38a21d(0xc4))[_0x38a21d(0x111)]() || "")[_0x38a21d(0x11a)]()[_0x38a21d(0x9a)](/,/g, "") || "",
        rent_price: ($(_0x38a21d(0x11e))[_0x38a21d(0x111)]() || "")[_0x38a21d(0x11a)]()[_0x38a21d(0x9a)](/,/g, "") || "",
        platArea: ($("#platArea")[_0x38a21d(0x111)]() || "")[_0x38a21d(0x11a)]()[_0x38a21d(0x9a)](/,/g, "") || "",
        totArea: ($(_0x38a21d(0x124))[_0x38a21d(0x111)]() || "")[_0x38a21d(0x11a)]()["replace"](/,/g, "") || "",
        archArea: ($("#archArea")[_0x38a21d(0x111)]() || "")["trim"]()[_0x38a21d(0x9a)](/,/g, "") || "",
        vlRat: ($(_0x38a21d(0xa2))[_0x38a21d(0x111)]() || "")["trim"]()[_0x38a21d(0x9a)](/,/g, "") || "",
        bcRat: ($(_0x38a21d(0x8f))[_0x38a21d(0x111)]() || "")[_0x38a21d(0x11a)]()[_0x38a21d(0x9a)](/,/g, "") || "",
        grndFlrCnt: ($(_0x38a21d(0xc6))[_0x38a21d(0x111)]() || "")["trim"]()[_0x38a21d(0x9a)](/,/g, "") || "",
        ugrndFlrCnt: ($("#ugrndFlrCnt")["val"]() || "")[_0x38a21d(0x11a)]()[_0x38a21d(0x9a)](/,/g, "") || "",
        maintenance_price: ($("#maintenance_price")[_0x38a21d(0x111)]() || "")["trim"]()[_0x38a21d(0x9a)](/,/g, "") || "",
        loan_price: ($("#loan_price")["val"]() || "")[_0x38a21d(0x11a)]()[_0x38a21d(0x9a)](/,/g, "") || "",
        totPkngCnt: ($(_0x38a21d(0xe4))[_0x38a21d(0x111)]() || "")[_0x38a21d(0x11a)]()[_0x38a21d(0x9a)](/,/g, "") || "",
    };
}
function getStringData() {
    const _0x1bb7ba = a51_0x140d6d;
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
    const _0x411a95 = a51_0x140d6d;
    return {
        road_conditions: ($("#road_conditions")[_0x411a95(0x111)]() || "")[_0x411a95(0x11a)]()["replace"](/,/g, "") || "",
        water: ($(_0x411a95(0x116))["val"]() || "")[_0x411a95(0x11a)]()["replace"](/,/g, "") || "",
        floor_height: ($(_0x411a95(0xbc))[_0x411a95(0x111)]() || "")[_0x411a95(0x11a)]()[_0x411a95(0x9a)](/,/g, "") || "",
        power: ($("#power")[_0x411a95(0x111)]() || "")[_0x411a95(0x11a)]()[_0x411a95(0x9a)](/,/g, "") || "",
        water: encodeURIComponent($(_0x411a95(0x116))[_0x411a95(0x111)]()["trim"]() || ""),
    };
}
