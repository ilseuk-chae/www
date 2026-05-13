let geocoder = new kakao.maps.services.Geocoder(); // 주소검색
let globalBrTitleInfo = null; // 표제부
let globalBrRecapTitleInfo = null; // 총괄표제부
let useAprDayPickr; // 전역 flatpickr 인스턴스
let swiper; // 이미지 스와이퍼
let fileManager; // 전역 변수 대신 클로저에서 접근할 수 있는 객체
let isEventEnabled = true; // 이벤트 활성화 여부를 결정하는 플래그
var mainSearchBoxChk = 0;

$(document).ready(async function () {
    // 매물번호
    const urlParams = new URLSearchParams(window.location.search);
    const estateNo = parseFloat(urlParams.get("no")); // 숫자로 변환
    if (!estateNo) {
        const result = await sweetAlertMessage("올바르지 않은 요청입니다.", "", "e");
        if (result) {
            history.back();
        }
    }

    initModal();
    initDefaultSet(estateNo); // 초기 셋팅
    initEvents(estateNo);
    fileManager = initImageEvents(); // 클로저에서 반환된 객체를 저장
    initValidation(estateNo);
});

/**
 * 초기 셋팅 함수
 */
async function initDefaultSet(estateNo) {
    // 로그인 확인
    if (!userInfo()) {
        alert("정상적인 접근이 아닙니다.");
        location.href = "/index";
        return;
    }

    // 사용승인일
    useAprDayPickr = flatpickr("#useAprDay", {
        dateFormat: "Y-m-d", // 날짜 형식을 yyyy-mm-dd로 설정
        altFormat: "F j, Y", // altInput이 true일 때 표시할 형식 (옵션)
        altInput: true, // 보기 편한 형식으로 대체 입력 필드 생성 (옵션)
        locale: "ko", // 한글 로케일 설정
    });

    //  이미지
    swiper = new Swiper(".fw-file", {
        slidesPerView: "auto",
        spaceBetween: 15,
    });

    $("form button").not(".btn-box *").prop("disabled", true);
    $("form input").prop("disabled", true);
    $("form select").prop("disabled", true);
    $("form textarea").prop("disabled", true);
    $(".building-group").hide();
    $(".factory-group").hide();
    $(".rent-group").hide();

    try {
        // 거래종류, 매물종류 가져오기
        await initSelect();
    } finally {
        // 매물 상세 가져오기
        saleInfo(estateNo);
    }
}

/**
 * 매물종류, 거래종류 가져오는 함수
 * @returns
 */
async function initSelect() {
    const url = "/front/back/sell/filter_type_get.php";
    try {
        const result = await callApi("POST", url, {});
        if (!result) return;

        const { message, responseData, statusCode } = result;
        if (statusCode !== 200 || responseData.length == 0) return;

        const { ESTATE_TYPE, SALE_TYPE ,TRANSATION_TYPE} = responseData;

        const estateOptionHtml = ESTATE_TYPE.map(function (item, index) {
            const { type_code, type_name } = item;

            return `<option value="${type_code}">${type_name}</option>`;
        });

        const saleOptionHtml = SALE_TYPE.map(function (item, index) {
        //const saleOptionHtml = TRANSATION_TYPE.map(function (item, index) {
            const { type_code, type_name } = item;

            return `<option value="${type_code}">${type_name}</option>`;
        });

        $("#estate_type").append(estateOptionHtml);
        $("#sale_type").append(saleOptionHtml);

        return true;
    } catch (error) {
        console.error("getFilterTypes error:", error);
        return false;
    }
}

/**
 * 이벤트 모음 함수
 */
function initEvents(estateNo) {
    // jQuery val 메서드 오버라이드
    (function ($) {
        // 원래의 jQuery val 메서드를 저장
        var originalVal = $.fn.val;

        // 재귀 호출 방지를 위한 플래그
        var isValTriggered = false;

        // jQuery val 메서드를 새롭게 정의
        $.fn.val = function () {
            // 원래의 val 메서드를 호출하여 값을 설정하거나 가져옴
            var result = originalVal.apply(this, arguments);

            // 만약 arguments가 존재하고, 재귀 방지 플래그가 false일 때만 이벤트를 트리거
            if (arguments.length > 0 && !isValTriggered) {
                isValTriggered = true; // 재귀 방지를 위해 플래그 설정
                this.trigger("input"); // input 이벤트 트리거
                isValTriggered = false; // 다시 플래그를 해제
            }

            // 원래의 val 메서드 결과를 반환
            return result;
        };
    })(jQuery);

    // 수정 버튼
    $("#modify_btn").on("click", function () {
        $(".search-address-group").removeClass("d-none");
        $(".plus-desc-box").removeClass("d-none");
        $("#modify_btn").hide();
        $("form.needs-validation").find("input, select, checkbox, textarea, button").not(".btn-box *").prop("disabled", false);
        $("#save_btn").show();
        $(".swiper-wrapper").find("i").show();
        swiper.update();
    });

    // 저장 버튼
    $("#save_btn").on("click", function () {
        $("#modalConfirm").iziModal("open");
    });

    // 삭제 버튼
    $("#delete_btn").on("click", function () {
        saleDelete(estateNo);
    });

    // 기본주소 변경 감지
    $("input[name='address_primary']").on("input change valueSet", async function () {
        if (isEventEnabled) {
            // 좌표, pnu 검색
            // searchAddress($(this).val());
            // const addressList = await searchAddress($(this).val());
            // if (addressList.status === "OK") {
            //     console.log(addressList);
            //     const address = addressList.result[0].address;
            //     const lat = addressList.result[0].y;
            //     const lng = addressList.result[0].x;
            //     const address_name = addressList.result[0].address_name;
            //     const road_address = addressList.result[0].road_address;
            //     const mountain_yn = address.mountain_yn === "Y" ? "2" : "1";
            //     const main_address_no_padded = String(address.main_address_no || "0000").padStart(4, "0");
            //     const sub_address_no_padded = String(address.sub_address_no || "0000").padStart(4, "0");
            //     const pnu = (address.b_code ? String(address.b_code) : String(address.h_code)) + mountain_yn + main_address_no_padded + sub_address_no_padded;
            //     $("#address_primary").val(address_name);
            //     $("#address_road").val(road_address ? road_address.address_name : "");
            //     $("#address_jibun").val(address ? address.address_name : "");
            //     $("#pnu").val(pnu);
            //     $("#latitude").val(lat);
            //     $("#longitude").val(lng);
            //     BuildingDetail(pnu); // 건축물대장 조회
            //     landInfo(pnu); // 토지대장 조회
            // }
        }
    });

    // 거래종류 변경
    $("#sale_type").on("change", function () {
        const value = $(this).val();
        // 임대일 때
        if (value === "003") {
            $(".rent-group").show(); // rent_group (월세 입력 필드와 span 텍스트) 보이기
            $("#sale_price").attr("placeholder", "보증금");
            $("#rent_price").prop("required", true);
        } else {
            $(".rent-group").hide(); // rent_group (월세 입력 필드와 span 텍스트) 숨기기
            $("#sale_price").attr("placeholder", "금액");
            $("#rent_price").prop("required", false);
        }
    });

    // 매물구분 선택
    $("#estate_type").on("change", function () {
        const value = $(this).val();

        // 토지일 때
        if (value === "006") {
            $(".building-group").hide();
            $(".building-select").hide();
            resetBuildingGroupInputs(); // 건물 input 초기화
        } else {
            $(".building-group").show();
            $(".building-select").show();
        }

        // 공장일 때
        if (value === "003") {
            $(".factory-group").show();
        } else {
            $(".factory-group").hide();
            resetFactoryGroupInputs(); // 공장 input 초기화
        }
    });

    // 건물종류 변경
    $("#building_type").on("change", function () {
        const selectedValue = $("#building_type").val(); // 선택된 옵션값 가져오기
        if (selectedValue) {
            // selectedValue에 해당하는 항목을 globalBrTitleInfo 배열에서 찾음
            const selectedBuilding = globalBrTitleInfo.find(function (building) {
                return building.mgmBldrgstPk == selectedValue;
            });

            if (selectedBuilding) {
                buildingInfoBind(selectedBuilding); // 건물 정보 바인딩
            }
        }

        // const selectedIndex = $("#building_type").prop("selectedIndex"); // 선택된 인덱스 가져오기
        // if (selectedIndex > 0) {
        //     // 첫 번째 옵션은 건너뜀
        //     const selectedBuilding = globalBrTitleInfo[selectedIndex - 1]; // 인덱스는 0부터 시작하므로 -1
        //     buildingInfoBind(selectedBuilding); // 건물 정보 바인딩
        // }
    });

    // 면적(m2) 변경 감지
    $("#platArea, #totArea, #archArea").on("input", function () {
        const value = $(this)
            .val()
            .trim()
            .replace(/,/g, "")
            .replace(/[^0-9.]/g, "") // 숫자와 소수점만 허용
            .replace(/(\..*)\./g, "$1") // 소수점이 두 번 이상 나오는 것을 방지
            .replace(/^0+(\d)/, "$1"); // 선행 0 제거 (예: "012" => "12")

        const id = $(this).attr("id");
        const pyId = id + "_py";
        $(`#${pyId}`).val(comma(convertToPyeong(value)));
    });

    // 면적(평) 변경 감지
    // $("#platArea_py, #totArea_py, #archArea_py").on("input", function () {
    //     const value = $(this).val();
    //     const id = $(this).attr("id");
    //     const m2Id = id.replace("_py", "");
    //     $(`#${m2Id}`).val(convertToM2(value));
    // });

    // 숫자 콤마
    $("#platArea, #totArea, #archArea, #sale_price, #rent_price, #loan_price, #maintenance_price, #vlRat, #bcRat, #grndFlrCnt, #ugrndFlrCnt, #power, #road_conditions, #floor_height").on("input", function () {
        const value = $(this)
            .val()
            .trim()
            .replace(/,/g, "")
            .replace(/[^0-9.]/g, "") // 숫자와 소수점만 허용
            .replace(/(\..*)\./g, "$1") // 소수점이 두 번 이상 나오는 것을 방지
            .replace(/^0+(\d)/, "$1"); // 선행 0 제거 (예: "012" => "12")

        $(this).val(comma(value));
    });

    // Textarea 높이 자동증가 이벤트 - 설명
    $("#description").on("input", function () {
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
 * daum 주소 api 실행 및 바인딩 함수
 */
function openDaumAddressAPI() {
    new daum.Postcode({
        oncomplete: function (data) {
            console.log(data);
            $("input[name='postal_code']").val(data.zonecode);
            $("input[name='address_road']").val(data.roadAddress);
            $("input[name='address_jibun']").val(data.jibunAddress || data.autoJibunAddress);
            $("input[name='address_primary']").val(data.address);
            $("input[name='sido']").val(data.sido);
            $("input[name='sigungu']").val(data.sigungu);
            $("input[name='sigungu_code']").val(data.sigunguCode);
            $("input[name='bcode']").val(data.bcode);
            $("input[name='dong_code']").val(data.bcode);
            $("input[name='dong']").val(data.bname);
            $("input[name='buildingCode']").val(data.buildingCode);
            $("input[name='pnu']").val(data.buildingCode.slice(0, 19));
            $("input[name='address_detail']").focus();
        },
        onclose: function (state) {
            //state는 우편번호 찾기 화면이 어떻게 닫혔는지에 대한 상태 변수 이며, 상세 설명은 아래 목록에서 확인하실 수 있습니다.
            if (state === "FORCE_CLOSE") {
                //사용자가 브라우저 닫기 버튼을 통해 팝업창을 닫았을 경우, 실행될 코드를 작성하는 부분입니다.
            } else if (state === "COMPLETE_CLOSE") {
                //사용자가 검색결과를 선택하여 팝업창이 닫혔을 경우, 실행될 코드를 작성하는 부분입니다.
                //oncomplete 콜백 함수가 실행 완료된 후에 실행됩니다.
            }
        },
    }).open({
        q: $("#search_address_input").val(),
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

/**
 * 이미지 관련 이벤트 및 처리 함수 모음
 * @returns
 */
function initImageEvents() {
    let fileList = {}; // 파일 목록을 저장하는 객체
    let fileIndex = 0; // 파일 순서를 나타내는 인덱스
    let originArray = []; // 기존 파일 저장하는 배열
    let remvoeFileArray = []; // 삭제한 파일 ID를 저장하는 배열
    let existingRepresentativeImages = []; // 기존 대표 이미지 ID를 저장하는 배열
    let selectedRepresentativeImages = []; // 신규 대표 이미지 ID를 저장하는 배열

    // 파일 - 선택
    $("#file_input").on("change", async function (e) {
        await handleFileInputChange(e);
    });

    // 이미지 - 대표이미지 - 설정
    $(".swiper-wrapper").on("click", ".swiper-slide img, .swiper-slide video", async function () {
        const slide = $(this).closest(".swiper-slide");
        representativeSet(slide);
    });

    // 이미지 - 삭제
    $(document).on("click", ".fa-circle-xmark", async function () {
        handleImageDelete(fileList, $(this));
    });

    // =============================================
    // 함수 시작
    // =============================================

    /**
     * 파일 목록 반환 함수
     * @returns {Object} fileList - 파일 목록을 반환
     */
    function getFileList() {
        return fileList;
    }

    /**
     * 기존 파일 목록 반환 함수
     * @returns {Object} fileList - 파일 목록을 반환
     */
    function getOriginArray() {
        return originArray;
    }

    /**
     * 파일 목록 반환 함수
     * @returns {Object} fileList - 파일 목록을 반환
     */
    function getRemoveFileArray() {
        return remvoeFileArray;
    }

    /**
     * 선택된 기존 대표 이미지 목록 반환 함수
     * @returns {Array} existingRepresentativeImages - 선택된 대표 이미지 파일 ID 목록을 반환
     */
    function getExistingRepresentativeImages() {
        return existingRepresentativeImages;
    }

    /**
     * 선택된 신규 대표 이미지 목록 반환 함수
     * @returns {Array} selectedRepresentativeImages - 선택된 대표 이미지 파일 ID 목록을 반환
     */
    function getSelectedRepresentativeImages() {
        return selectedRepresentativeImages;
    }

    /**
     * 파일 선택 후 처리 함수
     * 파일을 선택한 후, 이미지와 영상을 구분하여 Swiper 슬라이드에 표시하고 목록에 추가
     * @param {Event} e - 파일 선택 이벤트
     */
    async function handleFileInputChange(e) {
        const files = e.target.files;
        const container = $(".swiper-wrapper");
        container.not(":first").empty();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileId = fileIndex++;

            // 이미지와 영상 파일 구분
            let slide = "";

            if (file.type.startsWith("image/")) {
                // 이미지 파일 처리
                const filePreview = await handleFileInputChangeMultiple(file);
                slide = `
                    <div type="button" class="swiper-slide new-image" data-id="${fileId}" data-origin="N">
                        <img src="${filePreview}" width="100%" alt="" title="" />
                        <span class="close-btn-box"><i class="fa-sharp fa-solid fa-circle-xmark"></i></span>
                    </div>
                `;
            } else if (file.type.startsWith("video/")) {
                // 영상 파일 처리
                const videoURL = URL.createObjectURL(file);
                slide = `
                    <div type="button" class="swiper-slide new-image" data-id="${fileId}" data-origin="N">
                        <video muted controls width="100%">
                            <source src="${videoURL}" type="${file.type}">
                            Your browser does not support the video tag.
                        </video>
                        <span class="close-btn-box"><i class="fa-sharp fa-solid fa-circle-xmark"></i></span>
                    </div>
                `;
            }

            container.append(slide);
            fileList[fileId] = file;
        }

        swiper.update();
        $("#file_input").val("");
    }

    /**
     * 이미지 삭제 처리 함수
     * 삭제 버튼을 클릭하면 해당 파일을 목록에서 제거하고, 대표 이미지에서 제거
     * @param {Object} fileList - 파일 목록
     * @param {Element} element - 클릭한 삭제 버튼 요소
     */
    async function handleImageDelete(fileList, element) {
        const alertResult = await sweetConfirm("삭제하시겠습니까?", "", "w");
        if (!alertResult) {
            return;
        }

        const slide = element.closest(".swiper-slide");
        const fileId = Number(slide.attr("data-id"));
        const oriFg = slide.attr("data-origin");

        // 대표 이미지에서 제거
        if (oriFg === "Y") {
            existingRepresentativeImages = existingRepresentativeImages.filter((id) => id !== fileId);
            originArray = originArray.filter((id) => id !== fileId);
            remvoeFileArray.push(fileId);
        } else {
            selectedRepresentativeImages = selectedRepresentativeImages.filter((id) => id !== fileId);
            delete fileList[fileId];
        }

        slide.remove();
        swiper.update();
    }

    /**
     * 기존 대표 이미지 처리 함수
     * @param {Object} data - 서버에서 가져온 이미지 데이터
     */
    function loadExistingRepresentativeImages(data) {
        data.imageArray.forEach(function (image) {
            if (image.representative === "Y") {
                existingRepresentativeImages.push(image.fileNo);
            }
        });
    }

    /**
     * 대표 이미지 배지 설정 함수
     * 슬라이드 위에 대표 이미지 배지를 추가하고, 대표 이미지 스타일을 적용
     * @param {Element} slide - 대표 이미지로 설정할 슬라이드 요소
     */
    function setRepresentativeBadge(slide) {
        const badgeHtml = `<span class="badge badge-label bg-danger"><i class="mdi mdi-circle-medium"></i> 대표</span>`;
        slide.prepend(badgeHtml); // 배지를 이미지 위에 추가
        slide.addClass("representative"); // 대표 이미지 스타일 추가
    }

    /**
     * 대표 이미지 설정 및 취소 처리 함수
     * 슬라이드 클릭 시, 대표 이미지를 설정하거나 이미 설정된 대표 이미지를 취소하는 처리
     * @param {Element} slide - 클릭한 슬라이드 요소
     */
    async function representativeSet(slide) {
        const fileId = Number(slide.attr("data-id")); // fileId를 숫자로 변환
        const oriFg = slide.attr("data-origin");

        if (slide.hasClass("representative")) {
            const alert = await sweetConfirm("대표이미지를 취소하시겠습니까?", "", "q");
            if (!alert) return;

            if (oriFg === "Y") {
                existingRepresentativeImages = existingRepresentativeImages.filter((id) => id !== fileId);
            } else {
                selectedRepresentativeImages = selectedRepresentativeImages.filter((id) => id !== fileId);
            }

            slide.removeClass("representative");
            slide.find(".badge").remove();
        } else {
            const alert = await sweetConfirm("대표 이미지로 설정하시겠습니까?", "", "q");
            if (!alert) return;

            // 기존 및 신규 대표 이미지를 합쳐서 2개 이상인지 확인
            const totalRepresentativeCount = existingRepresentativeImages.length + selectedRepresentativeImages.length;

            if (totalRepresentativeCount >= 2) {
                sweetAlertMessage("대표 이미지는 최대 2장까지 설정 가능합니다.", "", "i");
                return;
            }

            // 대표 이미지로 설정된 경우 처리
            if (oriFg === "Y") {
                // 기존 이미지
                if (!existingRepresentativeImages.includes(fileId)) {
                    existingRepresentativeImages.push(fileId);
                    setRepresentativeBadge(slide);
                } else {
                    sweetAlertMessage("이미 대표 이미지로 설정된 파일입니다.", "", "i");
                }
            } else {
                // 신규 이미지
                if (!selectedRepresentativeImages.includes(fileId)) {
                    selectedRepresentativeImages.push(fileId);
                    setRepresentativeBadge(slide);
                } else {
                    sweetAlertMessage("이미 대표 이미지로 설정된 파일입니다.", "", "i");
                }
            }
        }
    }

    // 객체 반환
    return {
        getFileList,
        getOriginArray,
        getRemoveFileArray,
        getExistingRepresentativeImages,
        getSelectedRepresentativeImages,
        loadExistingRepresentativeImages,
    };
}

/**
 * 주소 검색
 * @param {*} param
 */
// function searchAddress(param) {
//     // 주소로 좌표를 검색합니다
//     geocoder.addressSearch(param, function (result, status) {
//         // 정상적으로 검색이 완료됐으면
//         if (status === kakao.maps.services.Status.OK) {
//             const data = result[0];
//             const address = data.address;
//             const mountain_yn = address.mountain_yn === "Y" ? "2" : "1";
//             const main_address_no_padded = (address.main_address_no || "0000").padStart(4, "0");
//             const sub_address_no_padded = (address.sub_address_no || "0000").padStart(4, "0");
//             const pnu = address.b_code + mountain_yn + main_address_no_padded + sub_address_no_padded;
//             $("#pnu").val(pnu);
//             $("#latitude").val(data.y);
//             $("#longitude").val(data.x);

//             BuildingDetail(pnu); // 건축물대장 조회
//             landInfo(pnu); // 토지대장 조회
//         }
//     });
// }

/**
 * 건축물대장 정보를 가져오는 함수
 * @param {*} pnu - PNU 번호
 * @returns
 */
async function BuildingDetail(pnu) {
    // pnu의 처음 15자리만 추출(시도, 시군구, 읍면동, 리, 필지구분, 본번까지)
    // pnu = pnu.substring(0, 15);

    const dataObj = {
        pnu: pnu,
    };
    const responseData = await callApiAbort(`/front/back/sale/buiding_register_title_info.php`, "POST", dataObj, "BuildingDetail");

    let brTitleInfo = responseData.brTitleInfo.item;
    let brRecapTitleInfo = responseData.brRecapTitleInfo.item;

    // item이 객체일 때와 배열일 때를 구분하여 처리
    if (Array.isArray(brTitleInfo)) {
        // dongNm 기준으로 brTitleInfo 배열을 정렬
        brTitleInfo.sort(function (a, b) {
            // a와 b의 dongNm이 비어 있으면 mainPurpsCdNm을 사용
            const aSortKey = String(a.dongNm).trim() !== "" ? String(a.dongNm) : a.mainPurpsCdNm;
            const bSortKey = String(b.dongNm).trim() !== "" ? String(b.dongNm) : b.mainPurpsCdNm;

            // 문자열 비교를 위해 localeCompare 사용
            return aSortKey.localeCompare(bSortKey);
        });

        // item이 배열일 경우
        globalBrTitleInfo = brTitleInfo;
        globalBrRecapTitleInfo = brRecapTitleInfo;
    } else {
        // item이 객체일 경우 배열로 변환하여 첫 번째 요소로 추가
        globalBrTitleInfo = [brTitleInfo];
        globalBrRecapTitleInfo = [brRecapTitleInfo];
    }

    // 건물 옵션 생성
    createBuildingOptions(globalBrTitleInfo, globalBrRecapTitleInfo);
}

/**
 * 건물 관련 버튼을 동적으로 생성하는 함수
 *
 * 이 함수는 주어진 건물 정보(brTitleInfo)를 기반으로 부번 버튼들을 동적으로 생성합니다.
 * 각 버튼을 클릭하면 해당 부번의 건물 정보를 표시하는 기능을 수행합니다.
 *
 * @param {*} brTitleInfo
 */
function createBuildingOptions(brTitleInfo, brRecapTitleInfo) {
    // brTitleInfo가 undefined, null이거나, 빈 배열이거나, 배열의 모든 요소가 undefined 또는 null인 경우 중단
    if (!brTitleInfo || brTitleInfo.length === 0 || brTitleInfo.every((item) => item === null || item === undefined)) return;

    // undefined 또는 null 값을 필터링하여 제거
    brTitleInfo = brTitleInfo.filter((item) => item !== null && item !== undefined);

    // 필터링 후 배열이 비어있는지 다시 확인
    if (brTitleInfo.length === 0) return;

    const $select = $("#building_type");
    $select.find("option:not(:first)").remove(); // 첫 번째 option을 제외하고 나머지를 제거

    // 옵션 추가
    $.each(brTitleInfo, function (index, building) {
        const $option = $("<option>")
            .val(building.mgmBldrgstPk) // 값을 설정
            .text(`${building.dongNm.toString().trim() != "" ? building.dongNm : building.mainPurpsCdNm}`); // 표시할 텍스트
        if (index === 0) {
            // $option.prop("selected", true); // 첫 번째 옵션을 기본 선택
            // buildingRegisterTable(building); // 첫 번째 부번의 데이터를 기본으로 건물정보 표시
        }
        $select.append($option);
    });
}

/**
 * 건축물대장 바인딩 함수
 * @param {*} building
 */
function buildingInfoBind(building) {
    const {
        platPlc, // 지번주소
        newPlatPlc, // 도로명주소
        bldNm, // 건물명
        etcPurps, // 기타용도
        mainPurpsCd, // 주용도코드
        mainPurpsCdNm, // 주용도코드명
        strctCd, // 구조코드
        strctCdNm, // 구조코드명
        etcStrct, // 기타구조
        roofCdNm, // 지붕코드명
        etcRoof, // 기타지붕
        heit, // 높이
        grndFlrCnt, // 지상층수
        ugrndFlrCnt, // 지하층수
        platArea, // 대지면적
        archArea, // 건축면적
        totArea, // 연면적
        vlRatEstmTotArea, // 용적률산정연면적
        vlRat, // 용적률
        bcRat, // 건폐율
        hhldCnt, // 세대수
        fmlyCnt, // 가구수
        bylotCnt, // 외필지수
        rideUseElvtCnt, // 승용승강기수
        emgenUseElvtCnt, // 비상용승강기수
        useAprDay, // 사용승인일
        pmsDay, // 허가일
        stcnsDay, // 착공일
        sigunguCd, // 시군구코드
        bjdongCd, // 법정동코드
        platGbCd, // 대지구분코드
        bun, // 번
        ji, // 지
    } = building;

    $("#platArea").val(comma(platArea));
    $("#platArea_py").val(comma(convertToPyeong(platArea)));
    $("#archArea").val(comma(archArea));
    $("#archArea_py").val(comma(convertToPyeong(archArea)));
    $("#totArea").val(comma(totArea));
    $("#totArea_py").val(comma(convertToPyeong(totArea)));
    $("#vlRat").val(comma(vlRat));
    $("#bcRat").val(comma(bcRat));
    $("#grndFlrCnt").val(comma(grndFlrCnt));
    $("#ugrndFlrCnt").val(comma(ugrndFlrCnt));
    $("#strctCd").val(strctCd);
    $("#strctCdNm").val(strctCdNm);
    $("#etcStrct").val(etcStrct);
    $("#mainPurpsCd").val(mainPurpsCd);
    $("#mainPurpsCdNm").val(mainPurpsCdNm);
    const useAprDayFormat = formatDate(useAprDay);
    useAprDayPickr.setDate(useAprDayFormat);

    if (globalBrRecapTitleInfo && globalBrRecapTitleInfo.totPkngCnt) {
        $("#totPkngCnt").val(globalBrRecapTitleInfo.totPkngCnt);
    } else {
        $("#totPkngCnt").val("");
    }
}

/**
 * 토지특성정보 가져오는 함수
 * @param {*} pnu
 */
async function landInfo(pnu) {
    const dataObj = { pnu };
    const url = "/front/back/sale/land_characteristics.php";
    callApiAbort(url, "POST", dataObj, "landInfo")
        .then((response) => {
            if (!response) return;

            const { landCharacteristicss } = response;
            if (!landCharacteristicss || !landCharacteristicss[0]) return;

            const {
                lndcgrCode, // 지목코드
                lndcgrCodeNm, // 지목명
                prposArea1, // 용도지역코드1
                prposArea1Nm, // 용도지역명1
                lndpclAr, // 토지면적
            } = landCharacteristicss[0];

            $("#lndcgrCode").val(lndcgrCode);
            $("#lndcgrCodeNm").val(lndcgrCodeNm);
            $("#prposArea").val(prposArea1);
            $("#prposAreaNm").val(prposArea1Nm);
            $("#platArea").val(comma(lndpclAr));
            $("#platArea_py").val(comma(convertToPyeong(lndpclAr)));
        })
        .catch((error) => {
            console.log(error);
        });
}

// yyyymmdd 형식의 날짜를 yyyy-mm-dd 형식으로 변환하는 함수
function formatDate(yyyymmdd) {
    // 숫자인 경우 문자열로 변환
    if (typeof yyyymmdd === "number") {
        yyyymmdd = yyyymmdd.toString();
    }

    // yyyymmdd가 문자열이 아닌 경우 빈 문자열 반환
    if (typeof yyyymmdd !== "string" || yyyymmdd.length !== 8) {
        return ""; // 잘못된 값인 경우 빈 문자열 반환
    }

    return yyyymmdd.slice(0, 4) + "-" + yyyymmdd.slice(4, 6) + "-" + yyyymmdd.slice(6, 8);
}

/**
 * 유효성 검사 함수
 */
function initValidation(estateNo) {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll(".needs-validation");

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms).forEach(function (form) {
        const saveConfirmBtn = document.getElementById("save_confirm_btn");

        if (!saveConfirmBtn) {
            console.error("#save_confirm_btn not found"); // 디버그 메시지
            return;
        }

        saveConfirmBtn.addEventListener(
            "click",
            async function (event) {
                event.preventDefault();

                $("#modalConfirm").iziModal("close");

                // required 속성이 있는 필드만 선택
                const requiredFields = $(form).find("[required]");
                let isFormValid = true;
                let firstInvalidField = null;

                // 유효성 검사 수행
                requiredFields.each((index, field) => {
                    const $field = $(field);
                    const type = $field.attr("type") || $field.prop("tagName").toLowerCase();
                    let fieldType;
                    let valName;

                    switch (type) {
                        case "text":
                            fieldType = "text";
                            valName = "입력값";
                            break;
                        case "password":
                            fieldType = "password";
                            valName = "비밀번호";
                            break;
                        case "tel":
                            fieldType = "phone";
                            valName = "연락처";
                            break;
                        case "checkbox":
                            fieldType = "checkbox";
                            valName = "체크박스";
                            break;
                        case "select":
                            fieldType = "select";
                            valName = "옵션";
                            break;
                        case "textarea":
                            fieldType = "text";
                            valName = "값";
                            break;
                        default:
                            fieldType = type;
                            valName = "값";
                    }

                    const isValid = validateInput($field, fieldType, `${valName}을(를) 확인해주세요.`);
                    const errorElement = $field.parent().find(".invalid-feedback").length != 0 ? $field.parent().find(".invalid-feedback") : $field.parent().parent().find(".invalid-feedback");

                    if (!isValid) {
                        console.log(`Field: ${$field.attr("id")}, Is Valid: ${isValid}`);

                        if (errorElement.length > 0) {
                            errorElement.show();
                            $field[0].setCustomValidity(errorElement.text());
                            // $field[0].reportValidity();
                        } else {
                            $field[0].setCustomValidity(`${valName}을(를) 확인해주세요.`);
                        }
                        $field[0].reportValidity(); // 직접 유효성 검사 메시지 표시
                        // $field.addClass("is-invalid");
                        isFormValid = false;
                        if (!firstInvalidField) {
                            firstInvalidField = $field;
                        }
                    } else {
                        errorElement.hide();
                        $field[0].setCustomValidity("");
                        // $field.removeClass("is-invalid");
                    }
                });

                console.log(isFormValid);

                if (!isFormValid) {
                    if (firstInvalidField) {
                        // 해당 필드를 화면에 보이게 스크롤
                        firstInvalidField[0].scrollIntoView({ behavior: "smooth", block: "center" });
                        // 유효성 검사 메시지 표시
                        firstInvalidField[0].reportValidity();
                        firstInvalidField.focus();
                    }
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    // 유효성 검사가 통과되었을 때 모달을 띄웁니다.
                    event.preventDefault(); // 이 라인을 제거하면 실제로 폼이 제출됩니다.
                    event.stopPropagation();

                    saleRegist(fileManager.getFileList(), estateNo); // 여기서 getFileList로 fileList를 가져옴
                }

                return;
            },
            false
        );

        // 입력 필드에 이벤트 리스너 추가
        form.querySelectorAll("input[required], select[required], textarea[required]").forEach(function (field) {
            field.addEventListener("input", function () {
                const $field = $(field);
                const type = $field.attr("type") || $field.prop("tagName").toLowerCase();
                let fieldType;
                let valName;

                switch (type) {
                    case "text":
                        fieldType = "text";
                        valName = "값";
                        break;
                    case "password":
                        fieldType = "password";
                        valName = "비밀번호";
                        break;
                    case "tel":
                        fieldType = "phone";
                        valName = "연락처";
                        break;
                    case "checkbox":
                        fieldType = "checkbox";
                        valName = "체크박스";
                        break;
                    case "select":
                        fieldType = "select";
                        valName = "옵션";
                        break;
                    case "textarea":
                        fieldType = "text";
                        valName = "값";
                        break;
                    default:
                        fieldType = type;
                        valName = "값";
                }

                const isValid = validateInput($field, fieldType, `${valName}을(를) 확인해주세요.`);
                const errorElement = $field.parent().find(".invalid-feedback").length != 0 ? $field.parent().find(".invalid-feedback") : $field.parent().parent().find(".invalid-feedback");
                if (isValid) {
                    // $field.removeClass("is-invalid").addClass("is-valid");
                    $field[0].setCustomValidity("");
                    errorElement.hide();
                } else {
                    // $field.removeClass("is-valid").addClass("is-invalid");
                    if (errorElement.length > 0) {
                        $field[0].setCustomValidity(errorElement.text());
                        errorElement.show();
                    } else {
                        $field[0].setCustomValidity(`${valName}을(를) 입력해주세요.`);
                    }
                    $field[0].reportValidity(); // 직접 유효성 검사 메시지 표시
                }
            });
        });
    });
}

/**
 * 저장 함수
 */
async function saleRegist(fileList, estateNo) {
    if (!estateNo) {
        const result = await sweetAlertMessage("올바르지 않은 요청입니다.", "", "e");
        if (result) {
            history.back();
        }
    }

    if ($(".swiper-slide").length === 0) {
        const result = await sweetAlertMessage("이미지/영상은 최소 1장 이상 등록해야 합니다.", "", "e");
        return;
    }

    const user = userInfo();
    const numberData = getNumberData();
    const stringData = getStringData();
    const factoryData = getFactoryData();

    // formData 초기화
    let formData = new FormData();

    // fileList에 있는 파일 추가
    for (const fileId in fileList) {
        if (fileList.hasOwnProperty(fileId)) {
            formData.append("files[]", fileList[fileId]);
        }
    }

    const existingRepresentativeImages = fileManager.getExistingRepresentativeImages();
    const selectedRepresentativeImages = fileManager.getSelectedRepresentativeImages();
    const originArray = fileManager.getOriginArray();
    const removeFileArray = fileManager.getRemoveFileArray();

    // 대표 이미지가 2개 이상이면 경고 후 반환
    if (existingRepresentativeImages.length + selectedRepresentativeImages.length > 2) {
        sweetAlertMessage("대표 이미지는 최대 2장까지 설정 가능합니다.", "", "w");
        return;
    }

    // 대표 이미지 정보 추가
    formData.append("existingRepresentativeImages", JSON.stringify(existingRepresentativeImages)); // 대표 이미지 정보 배열을 JSON으로 직렬화하여 전송
    formData.append("selectedRepresentativeImages", JSON.stringify(selectedRepresentativeImages)); // 대표 이미지 정보 배열을 JSON으로 직렬화하여 전송
    formData.append("originArray", JSON.stringify(originArray)); // 대표 이미지 정보 배열을 JSON으로 직렬화하여 전송
    formData.append("removeFileArray", JSON.stringify(removeFileArray)); // 대표 이미지 정보 배열을 JSON으로 직렬화하여 전송

    // 두 객체를 하나로 병합
    let dataObj = {
        ...user,
        ...numberData, // 숫자 데이터
        ...stringData, // 문자 데이터 (쉼표 제거 안함)
        latitude: $("#latitude").val() || "", // 위도, 경도는 따로 처리
        longitude: $("#longitude").val() || "",
        estateNo: estateNo,
    };

    // estate_type이 "003"일 경우 factoryData를 병합
    if (stringData.estate_type === "003") {
        dataObj = {
            ...dataObj,
            ...factoryData, // 공장 관련 데이터 추가
        };
    }

    for (const key in dataObj) {
        // if (dataObj.hasOwnProperty(key)) {
        if (Object.hasOwnProperty.call(dataObj, key)) {
            const value = dataObj[key];
            formData.append(key, value);
        }
    }

    // // FormData 내용을 자바스크립트 객체로 변환
    // const formDataObj = {};
    // for (let pair of formData.entries()) {
    //     // "files[]"에 여러 파일이 있을 경우 배열로 처리
    //     if (pair[0] === "files[]") {
    //         if (!formDataObj[pair[0]]) {
    //             formDataObj[pair[0]] = []; // 배열 초기화
    //         }
    //         formDataObj[pair[0]].push(pair[1]); // 배열에 파일 추가
    //     } else {
    //         formDataObj[pair[0]] = pair[1];
    //     }
    // }

    // 객체 형태로 formData 확인
    // console.log([...formData.entries()]);
    // return;

    // API 호출 시작 전 로딩 스피너 활성화
    $("html").attr("data-preloader", "enable");

    callApiFormData("POST", "/front/back/sale/sale_modify.php", formData)
        .then((response) => {
            if (!response) {
                $("#modalFail").iziModal("open");
                return;
            }

            // API 호출 성공
            const { statusCode, message, responseData } = response;
            if (statusCode == 200 && message == "SUCCESS") {
                $("#modalCompletion").iziModal("open");

                // 모달 닫힘 이벤트 설정
                $("#modalCompletion").on("closed", function () {
                    location.reload();
                    // location.href = "/front/views/mypage/mypage_sale";
                });
            } else {
                sweetAlertMessage(message, "", "w");
                // $("#modalFail").iziModal("open");
            }
        })
        .catch((error) => {
            // API 호출 실패
            console.error("API 호출 실패", error);
        })
        .finally(() => {
            // API 호출 완료 후 로딩 스피너 비활성화
            $("html").attr("data-preloader", "disable");
        });
}

/**
 * 매물 상세정보 가져오는 함수
 * @param {*} estateNo
 * @returns
 */
async function saleInfo(estateNo) {
    const user = userInfo();

    if (isNaN(estateNo) || !user) {
        const alert = await sweetAlertMessage("올바르지 않은 요청입니다.");
        if (alert) {
            history.back();
            return;
        }
    }

    const url = "/front/back/sale/sale_detail.php";
    const dataObj = {
        ...user,
        estate_no: estateNo,
    };
    callApiAbort(url, "POST", dataObj, "saleInfo")
        .then(async (response) => {
            if (!response) return;

            const { statusCode, message, responseData } = response;
            if (statusCode !== 200 || message !== "SUCCESS") {
                sweetAlertMessage("정상적인 접근이 아닙니다.", "", "e");
                return;
            }
            if (!responseData || responseData.length === 0) {
                sweetAlertMessage("정상적인 접근이 아닙니다.", "", "e");
                return;
            }

            try {
                const addressList = await searchAddress(responseData.address_primary);

                if (addressList.status === "OK") {
                    const address = addressList.result[0].address;
                    const lat = addressList.result[0].y;s
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
                detailBind(responseData);
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * 매물 정보 바인딩 함수
 * @param {*} data
 */
async function detailBind(data) {
    // 데이터를 순회하면서 각 키에 해당하는 id 값을 가진 input, select 요소의 값을 설정
    $.each(data, function (key, value) {
        var $element = $("#" + key); // 해당 id를 가진 요소를 찾음

        if ($element.length > 0) {
            // 요소가 존재하는지 확인
            if (key === "useAprDay" && value) {
                // useAprDay 필드가 존재하고 값이 있을 경우 flatpickr로 설정
                const useAprDayFormat = new Date(value); // 문자열을 Date 객체로 변환
                useAprDayPickr.setDate(useAprDayFormat); // flatpickr에 날짜 설정
            } else if (key === "building_type" && value) {
                setTimeout(() => {
                    // isEventEnabled = false; // 이벤트 활성화 여부를 결정하는 플래그
                    $(`#${key}`).val(value !== null ? value : ""); // input 또는 textarea에 값을 설정
                }, 1000);
            // **********************************************
            // 여기! exchange_fg ,urgent_sale_fg 체크박스 처리 로직을 추가합니다.
            }else if ((key === "exchange_fg")  || (key === "urgent_sale_fg")) {
                // jQuery의 .prop() 메서드를 사용하여 checked 상태를 설정합니다.
                // value가 "Y"이면 체크하고, 그렇지 않으면 체크 해제합니다.
                $element.prop("checked", value === "Y");
            } else if ($element.is("input, textarea")) {
                $element.val(value !== null ? value : ""); // input 또는 textarea에 값을 설정
            } else if ($element.is("select")) {
                $element.val(value !== null ? value : ""); // select에 값을 설정
                $element.trigger("change"); // select 요소의 change 이벤트 트리거
            }
        }
    });
    
    // 이미지 처리
    const container = $(".swiper-wrapper");
    container.not(":first").empty();

    let fileIndex = 0; // 파일 순서를 나타내는 인덱스

    // 기존 대표 이미지 배열 가져오기
    const existingRepresentativeImages = fileManager.getExistingRepresentativeImages();

    // 기존 이미지 배열 가져오기
    const originArray = fileManager.getOriginArray();

    // existingRepresentativeImages = [];

    if (data.imageArray.length > 0) {
        for (let i = 0; i < data.imageArray.length; i++) {
            const representative = data.imageArray[i].representative;
            const fileType = data.imageArray[i].fileType;
            const imgSrc = data.imageArray[i].imgSrc;
            const fileNo = data.imageArray[i].fileNo;

            // 기존 이미지 배열에 저장
            originArray.push(fileNo);

            // 기존 대표 이미지인 경우 배열에 저장
            if (representative === "Y") {
                existingRepresentativeImages.push(fileNo);
            }

            // 대표 유무
            const repHtml = representative === "Y" ? '<span class="badge badge-label bg-danger"><i class="mdi mdi-circle-medium"></i> 대표</span>' : "";

            // 이미지 or 비디오
            let image = "";
            if (fileType === "image") {
                image = `<img src="${imgSrc}" alt="" width="100" onerror="this.onerror=null;this.src='/front/assets/image/building_empty.png';">`;
            } else if (fileType === "video") {
                image = `<video controls width="100%" class="img-fluid mx-auto rounded" controlslist="nodownload">
                            <source src="${imgSrc}" type="video/mp4" class="h-100">
                            Your browser does not support the video tag.
                        </video>`;
            } else {
                image = `<img src="/front/assets/image/building_empty.png" width="100%" alt="" title="" />`;
            }

            // Swiper 슬라이드 추가
            const slide = `<div type="button" class="swiper-slide ori-image ${representative === "Y" ? "representative" : ""}" data-id="${fileNo}" data-origin="Y" >
                            ${repHtml}
                            ${image}
                            <span class="close-btn-box"><i class="fa-sharp fa-solid fa-circle-xmark ori-close-btn pointer"></i></span>
                        </div>
                    `;

            container.append(slide);
        }
        container.find("i").hide();
    }
}

/**
 * 삭제처리 함수
 * @param {*} estateNo
 * @returns
 */
async function saleDelete(estateNo) {
    const user = userInfo();
    if (isNaN(estateNo) || !user) {
        const alert = await sweetAlertMessage("올바르지 않은 요청입니다.");
        if (alert) {
            history.back();
            return;
        }
    }

    const alert = await sweetConfirm("삭제 하시겠습니까?", "", "w");
    if (!alert) return;

    const dataObj = {
        ...user,
        rcvNo: estateNo,
    };

    const result = await callApi("POST", "/front/back/mypage/sale_delete.php", dataObj);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const alert = await sweetAlertMessage("처리 되었습니다.", "", "s");
        if (alert) location.href = "/front/views/mypage/mypage_sale";
    } else {
        const alert = await sweetAlertMessage("삭제를 실패했습니다.", "", "e");
        if (alert) return;
    }
}

/**
 * 파일 삭제 함수
 * @param {*} fileNo
 */
function removeFile(fileNo) {
    const dataObj = {
        ...userInfo(),
        fileNo,
    };
    callApiAbort("/front/back/sale/sale_file_remove.php", "POST", dataObj, "removeFile")
        .then((response) => {
            // API 호출 성공
            if (!response) {
                $("#modalFail").iziModal("open");
                return;
            }

            const { statusCode, message, responseData } = response;
            if (statusCode == 200 && message == "SUCCESS") {
                sweetAlertMessage("삭제되었습니다.", "", "s");
            } else {
                sweetAlertMessage("삭제에 실패했습니다.", "", "e");
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

// =============================================================================
// 헬퍼 함수
// =============================================================================

/**
 * 모달 초기화 함수
 */
function initModal() {
    // 모달 - 대표 확인
    initializeModal("#modalConfirm", "/front/assets/lottie/save.json", "#lottieConfirm");
    // 모달 - 대표 취소
    initializeModal("#modalCancel", "/front/assets/lottie/save.json");
    // 모달 - 등록 실패
    initializeModal("#modalFail", "/front/assets/lottie/failed.json", "#lottieFail");
    // 모달 - 등록 완료
    initializeModal("#modalCompletion", "/front/assets/lottie/completion.json", "#lottieCompletion");

    // Lottie 애니메이션 인스턴스를 저장할 객체
    const animations = {};

    // 모달 설정 함수
    function initializeModal(modalId, lottiePath, lottieContainerId) {
        $(modalId).iziModal({
            width: "470px",
            top: null, // 기본값으로 설정
            bottom: null, // 기본값으로 설정
            transitionIn: "fadeIn", // 모달 등장 애니메이션
            transitionOut: "fadeOut", // 모달 사라짐 애니메이션
            overlayClose: false, // 오버레이 클릭으로 닫기 방지
            closeButton: true, // 닫기 버튼 표시
            zindex: 999, // z-index 설정
            onOpening: function (modal) {
                modal.startLoading();

                // Lottie 애니메이션이 이미 로드된 경우, 다시 로드하지 않음
                if (!animations[lottieContainerId]) {
                    animations[lottieContainerId] = bodymovin.loadAnimation({
                        container: document.querySelector(lottieContainerId),
                        renderer: "svg",
                        loop: true,
                        autoplay: true,
                        path: lottiePath,
                    });
                }

                modal.stopLoading();
            },
            // onClosing: function () {
            //     // 모달이 닫힐 때 애니메이션을 정지시키고 필요 시 제거
            //     if (animations[lottieContainerId]) {
            //         animations[lottieContainerId].stop();
            //     }
            // },
        });
    }
}

// 숫자 데이터를 처리하는 함수 (쉼표 제거)
function getNumberData() {
    return {
        sale_price: ($("#sale_price").val() || "").trim().replace(/,/g, "") || "",
        rent_price: ($("#rent_price").val() || "").trim().replace(/,/g, "") || "",
        platArea: ($("#platArea").val() || "").trim().replace(/,/g, "") || "",
        totArea: ($("#totArea").val() || "").trim().replace(/,/g, "") || "",
        archArea: ($("#archArea").val() || "").trim().replace(/,/g, "") || "",
        vlRat: ($("#vlRat").val() || "").trim().replace(/,/g, "") || "",
        bcRat: ($("#bcRat").val() || "").trim().replace(/,/g, "") || "",
        grndFlrCnt: ($("#grndFlrCnt").val() || "").trim().replace(/,/g, "") || "",
        ugrndFlrCnt: ($("#ugrndFlrCnt").val() || "").trim().replace(/,/g, "") || "",
        maintenance_price: ($("#maintenance_price").val() || "").trim().replace(/,/g, "") || "",
        loan_price: ($("#loan_price").val() || "").trim().replace(/,/g, "") || "",
        totPkngCnt: ($("#totPkngCnt").val() || "").trim().replace(/,/g, "") || "",
    };
}

// 문자 데이터를 처리하는 함수 (쉼표 유지)
function getStringData() {
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
        // 체크박스가 체크되어 있으면 'Y', 아니면 'N'
        exchange_fg: $("#exchange_fg").is(":checked") ? "Y" : "N",
        urgent_sale_fg:$("#urgent_sale_fg").is(":checked") ? "Y" : "N",
    };
}

// 문자 데이터를 처리하는 함수 (쉼표 유지)
function getFactoryData() {
    return {
        road_conditions: ($("#road_conditions").val() || "").trim().replace(/,/g, "") || "",
        water: ($("#water").val() || "").trim().replace(/,/g, "") || "",
        floor_height: ($("#floor_height").val() || "").trim().replace(/,/g, "") || "",
        power: ($("#power").val() || "").trim().replace(/,/g, "") || "",
        water: encodeURIComponent($("#water").val().trim() || ""),
    };
}

/**
 * 건물 인풋 박스 초기화
 */
function resetBuildingGroupInputs() {
    // building-group 클래스 내의 모든 input 요소들을 찾음
    $(".building-group input, .building-group select").each(function () {
        $(this).val(""); // input 요소의 값을 빈 문자열로 초기화
    });
}

/**
 * 공장 인풋 박스 초기화
 */
function resetFactoryGroupInputs() {
    // building-group 클래스 내의 모든 input 요소들을 찾음
    $(".factory-group input, .factory-group select").each(function () {
        $(this).val(""); // input 요소의 값을 빈 문자열로 초기화
    });
}
