const REST_API_KEY = "358571ae546aaa68be0d290878b351c1";
let currCategory = ""; // 현재 선택된 카테고리를 가지고 있을 변수입니다
let placeMarkers = [];
var placeOverlay = new kakao.maps.CustomOverlay({ zIndex: 1 }); // 마커를 클릭했을 때 해당 장소의 상세정보를 보여줄 커스텀오버레이입니다
let placeOverlayNode = document.createElement("div"); // 커스텀 오버레이의 컨텐츠 엘리먼트 입니다
let placeRangePolygon; // 주변시설 반경 원 폴리곤
let globalBrTitleInfo = {}; // 건축물대장 표제부
let globalLandCharacter = {}; // 토지특성속성
let globalLandPrices = {}; // 개별공시지가(토지)
let miniMap = null; // 미니맵

$(document).ready(function () {
    initializeTab();
    initializeMiniMap();
    initTabEvents();
    updateTabOnScroll();

    placeOverlayNode.className = "placeinfo_wrap position-absolute rounded-3 overflow-auto"; // 커스텀 오버레이의 컨텐츠 노드에 css class를 추가합니다

    // 커스텀 오버레이의 컨텐츠 노드에 mousedown, touchstart 이벤트가 발생했을때
    // 지도 객체에 이벤트가 전달되지 않도록 이벤트 핸들러로 kakao.maps.event.preventMap 메소드를 등록합니다
    addEventHandle(placeOverlayNode, "mousedown", kakao.maps.event.preventMap);
    addEventHandle(placeOverlayNode, "touchstart", kakao.maps.event.preventMap);

    placeOverlay.setContent(placeOverlayNode); // 커스텀 오버레이 컨텐츠를 설정합니다
});

// ***************************
// 메인 함수 (Primary Functions)
// ***************************

// 엘리먼트에 이벤트 핸들러를 등록하는 함수입니다
function addEventHandle(target, type, callback) {
    if (target.addEventListener) {
        target.addEventListener(type, callback);
    } else {
        target.attachEvent("on" + type, callback);
    }
}

function initializeTab() {
    let places = JSON.parse(sessionStorage.getItem("lastSearchedPlace"));
    if (places) {
        const address_name = places.address_name;
        $("#search_input").val(address_name);
    }
}

function initializeMiniMap() {
    const urlParams = new URLSearchParams(window.location.search);
    let lat = urlParams.get("curLat");
    let lng = urlParams.get("curLng");

    // 유효한 중심 좌표가 없는 경우 기본 좌표로 설정.
    if (!areValidCoordinatesInKorea(parseFloat(lat), parseFloat(lng))) {
        lat = "37.4917882876857"; // 기본 좌표 (양평군청)
        lng = "127.487578470072";
    }

    setCookie("curLat", lat, 1);
    setCookie("curLng", lng, 1);

    const kakaoCoords = new kakao.maps.LatLng(lat, lng);
    var miniMapContainer = document.getElementById("mini_map"); // 지도를 표시할 div
    var mapOption = {
        center: kakaoCoords, // 지도의 중심좌표
        level: 4, // 지도의 확대 레벨,
        draggable: false,
        scrollwheel: false,
        disableDoubleClick: false,
        disableDoubleClickZoom: true,
    };

    miniMap = new kakao.maps.Map(miniMapContainer, mapOption); // 지도를 생성합니다

    kakao.maps.event.addListener(miniMap, "idle", function () {
        miniMap.relayout();
    });
}

/**
 * 탭 이벤트 및 버튼 클릭 이벤트를 초기화하는 함수
 */
function initTabEvents() {
    // 탭 메뉴 클릭 이벤트
    $(".mc-tab-menu").on("click", ".tab-btn", function () {
        $(".mc-tab-menu .tab-btn").removeClass("active");
        $(this).addClass("active");

        const tabContent = $(this).attr("data-target");
        const $targetElement = $("." + tabContent);

        if ($targetElement.length) {
            $(".mc-tab-content").animate(
                {
                    scrollTop: $targetElement.offset().top - $(".mc-tab-content").offset().top + $(".mc-tab-content").scrollTop(),
                },
                400 // 400ms 동안 애니메이션
            );
        } else {
            console.error("Element not found for selector:", tabContent);
        }
    });

    // 실거래가 '더보기' 버튼 클릭 이벤트
    $("#more_realPrice_btn").on("click", function () {
        const rows = $(".more-realPrice");
        const hiddenRows = rows.filter(".d-none");

        if ($(this).text().includes("더보기")) {
            // 처음 10개의 hiddenRows의 d-none 클래스를 제거
            hiddenRows.slice(0, 20).removeClass("d-none");

            // 남아있는 숨겨진 항목이 없을 경우 버튼을 "숨기기"로 변경
            if (hiddenRows.length <= 20) {
                $(this).html(`<i class="fa-sharp fa-light fa-circle-minus"></i>숨기기`);
            }
        } else {
            // "숨기기" 버튼을 클릭했을 때, 위에서 5개를 제외하고 나머지에 d-none 추가
            rows.slice(5).addClass("d-none");

            // 버튼을 다시 "더보기"로 변경
            $(this).html(`<i class="fa-sharp fa-light fa-circle-plus"></i>더보기`);
        }
    });

    // 개별공시지가 '더보기' 버튼 클릭 이벤트
    $("#more_price_btn").on("click", function () {
        const showingMore = $(".more-price").toggleClass("d-none").hasClass("d-none");
        $(this).html(showingMore ? `<i class="fa-sharp fa-light fa-circle-plus"></i>더보기` : `<i class="fa-sharp fa-light fa-circle-minus"></i>숨기기`);
    });

    // 단위 전환 버튼 클릭 이벤트 핸들러
    $("#toggle_unit_btn").on("click", function () {
        const toggleUnit = !$("#unit_pyeong").hasClass("active");
        $("#unit_pyeong").toggleClass("active", toggleUnit);
        $("#unit_m2").toggleClass("active", !toggleUnit);

        currentUnit = currentUnit === "m2" ? "pyeong" : "m2";

        // 실거래가 업데이트
        updateRealPriceTable();
        updateRealEstimatedPrice();

        // 토지 정보가 있다면
        if (globalLandCharacter) {
            // Active 클래스를 가진 버튼의 인덱스 찾기
            const activeIndex = $(".mnnmSlno-btn").index($(".mnnmSlno-btn.active"));
            // landCharacteristics 배열에서 해당 인덱스의 데이터를 가져옴
            const landInfo = globalLandCharacter[activeIndex];

            if (landInfo) {
                const pnu = landInfo.pnu;
                landCharacterTable(landInfo);
                landPriceTable(pnu);
            }
        }

        // 건물 정보가 있다면
        if (globalBrTitleInfo) {
            // Active 클래스를 가진 버튼의 인덱스 찾기
            const activeIndex = $(".buidRegi-btn").index($(".buidRegi-btn.active"));
            // landCharacteristics 배열에서 해당 인덱스의 데이터를 가져옴
            const buildInfo = globalBrTitleInfo[activeIndex];

            if (buildInfo) {
                buildingRegisterTable(buildInfo);
            }

            let buildingTotalArea = 0; // 총 건물 면적
            $.each(globalBrTitleInfo, function (index, building) {
                if (!building) return;
                buildingTotalArea += parseFloat(building.totArea); // 총 건물 면적 계산
            });
            $("#top_build_area").text(formatArea(buildingTotalArea) + "(" + globalBrTitleInfo.length + "동)");
        }
    });

    // 분석 - 분석주제도 변경
    $("#analysis_select").on("change", function () {
        // clearAllPolygons();
        // 선택된 option의 value 값을 가져옵니다.
        const selectedValue = $(this).val(); 
        const selectedText = $(this).find('option:selected').text(); // 선택된 option의 텍스트를 가져올 수도 있습니다.

        // 선택된 값에 따라 다른 동작을 수행할 수 있습니다.
        switch (selectedValue) {
            case 'initial':
                //분석 초기화
                initialAnalysis();
                break;
            case 'ecology':
                break;
            // 다른 option 값이 추가된다면 여기에 case를 추가할 수 있습니다.
            // case 'another_topic':
            //     console.log("다른 주제를 선택했습니다.");
            //     // handleAnotherTopic();
            //     break;
            default:
                // 예상치 못한 값이 선택되었을 때의 처리 (선택 사항)
                console.log("알 수 없는 분석 주제가 선택되었습니다.");
                break;
        }
    });

    $("#analysis_btn").on("click", function () {
        const analysisVal = $("#analysis_select").val();
        const lastIndex = landWFSArrays.length - 1; // 마지막 인덱스 계산
        const lastElement = landWFSArrays[lastIndex]; // 마지막 요소에 접근

        if (analysisVal == "ecology") {
            ecologyMap(lastElement.pnu, lastElement.bbox, lastElement.landGeoJson);
        } else if (analysisVal == 'slope') {
            slopeMap(lastElement.pnu, lastElement.bbox, lastElement.landGeoJson);
        } else if (analysisVal == 'elevation') {
            elevationMap(lastElement.pnu, lastElement.bbox, lastElement.landGeoJson);
        } else if (analysisVal == 'nationalEnv') {
            nationalEnvMap(lastElement.pnu, lastElement.bbox, lastElement.landGeoJson);
        }
        // 분석주제도 - 합필분석
        else if (analysisVal == "initial") {
            sweetAlertMessage("분석주제도를 선택해주세요", "", "e");
        }
    });
}

function initialAnalysis() {
    
    if (!isMultiSelectMode) {
        analysisPolygonArray.forEach((polygon) => polygon.setMap(null)); //폴리곤을 지도에서 제거
        analysisPolygonArray = []; // 폴리곤 배열 초기화
    }

    $("#analysis_info_table tbody").empty(); // 분석 - 테이블 초기화
    $("#analysis_total_area").empty(); // 분석 - 면적 초기화
    $("#land_analysis_info_table tbody").empty(); // 합필분석 - 테이블 초기화
    $("#land_analysis_total_area").empty(); // 합필분석 - 면적 초기화

};
async function getEcologyMap() {
    // 타일 좌표를 WTM 좌표로 변환하는 함수
    function tileCoordsToWTM(tileX, tileY, level, tileSize) {
        return {
            wtm_x: tileX * Math.pow(2, level - 3) * tileSize - 30000,
            wtm_y: tileY * Math.pow(2, level - 3) * tileSize - 60000,
        };
    }

    const url = "";
    const dataObj = {};
    // const result = await callApi();
}

/**
 * 건축물대장 정보를 가져오는 함수
 * @param {*} info
 * @returns
 */
async function BuildingDetail(pnu) {
    // pnu의 처음 15자리만 추출(시도, 시군구, 읍면동, 리, 필지구분, 본번까지)
    // pnu = pnu.substring(0, 15);

    $("#buidRegi_btn_group").empty(); // 건축물 대장 선택 리스트 초기화
    $(".mc-building table").find("th").text(""); // 건물정보 초기화

    const dataObj = {
        pnu: pnu,
    };

    // ✅ 디버깅 로그 추가
//    console.log("BuildingDetail 호출 pnu:", pnu);

    const responseData = await callApiAbort(`/front/back/realPrice/buiding_register_title_info.php`, "POST", dataObj, "BuildingDetail");

    // ✅ 실제 응답값 확인
//    console.log("responseData 원본:", responseData);
//    console.log("responseData 타입:", typeof responseData);
//    console.log("brTitleInfo:", responseData?.brTitleInfo);
//    console.log("brRecapTitleInfo:", responseData?.brRecapTitleInfo);

    // ===>> 여기에서 responseData가 유효한지 먼저 확인합니다. <<===
    const buildingButton = $('.tab-btn[data-target="mc-building"]'); // 건물 탭
    const buildingContent = $(".mc-tab-content .mc-building"); // 건물 컨텐츠

    if (!responseData) {
        console.warn("BuildingDetail: API 응답 데이터가 없습니다.");
        buildingButton.hide();
        buildingContent.hide();
        globalBrTitleInfo = []; // 데이터가 없으므로 빈 배열로 초기화
        createBuildingButtons(globalBrTitleInfo); // 빈 버튼 목록 생성 또는 비움
        return; // 함수 종료
    }
    
    const brTitleInfo = responseData.brTitleInfo;
    const brRecapTitleInfo = responseData.brRecapTitleInfo; // 이 부분도 사용 가능성이 있어 보입니다.

    // 데이터를 기준으로 건물 탭과 컨텐츠를 표시하거나 숨김
    //const hasData = responseData.brTitleInfo && responseData.brTitleInfo.item && responseData.brTitleInfo.item.length > 0;
    const hasData = brTitleInfo?.item?.length > 0 || brRecapTitleInfo?.item?.length > 0; // brRecapTitleInfo도 고려

    // const hasData = responseData.brTitleInfo || responseData.brRecapTitleInfo;
    if (hasData) {
        // brTitleInfo가 있을 때 버튼을 보여줌
        buildingButton.show();
        buildingContent.show();
    } else {
        // brTitleInfo가 없을 때 버튼을 숨김
        buildingButton.hide();
        buildingContent.hide();
    }

    // buildingButton.toggle(hasData); // 데이터가 있을 때 표시
    // buildingContent.toggle(hasData); // 데이터가 있을 때 표시

    //let items = responseData.brTitleInfo.item;
    // let items = responseData.brTitleInfo.item || responseData.brRecapTitleInfo.item;
    let items = []; // 기본적으로 빈 배열로 초기화
    if (brTitleInfo && brTitleInfo.item) {
        items = brTitleInfo.item;
    } else if (brRecapTitleInfo && brRecapTitleInfo.item) { // brTitleInfo가 없으면 brRecapTitleInfo 시도
        items = brRecapTitleInfo.item;
    }

    // item이 객체일 때와 배열일 때를 구분하여 처리
    if (Array.isArray(items)) {
        // dongNm 기준으로 brTitleInfo 배열을 정렬
        /*
        items.sort(function (a, b) {
            // a와 b의 dongNm이 비어 있으면 mainPurpsCdNm을 사용
            const aSortKey = String(a.dongNm).trim() !== "" ? String(a.dongNm) : a.mainPurpsCdNm;
            const bSortKey = String(b.dongNm).trim() !== "" ? String(b.dongNm) : b.mainPurpsCdNm;

            // 문자열 비교를 위해 localeCompare 사용
            return aSortKey.localeCompare(bSortKey);
        });
        */
        // dongNm 기준으로 brTitleInfo 배열을 정렬
        items.sort(function (a, b) {
            const aSortKey = String(a.dongNm || a.mainPurpsCdNm || "").trim();
            const bSortKey = String(b.dongNm || b.mainPurpsCdNm || "").trim();
            return aSortKey.localeCompare(bSortKey);
        });

        // item이 배열일 경우
        globalBrTitleInfo = items;
    } else if (items) { // items가 배열은 아니지만 빈 값이 아닌 단일 객체일 경우
        globalBrTitleInfo = [items];
    } else { // items 자체가 빈 값 (undefined, null, 빈 문자열 등)일 경우
        globalBrTitleInfo = [];
    }

    // 건물 버튼 생성
    createBuildingButtons(globalBrTitleInfo);
}

/**
 * 토지대장 정보를 가져오는 함수
 * @param {*} info
 * @returns
 */

async function landDetail(pnu) {
    if (isMultiSelectMode) {
        $("html").attr("data-preloader", "enable");
    }

    const dataObj = { pnu: pnu };
    const responseData = await callApiAbort(
        `/front/back/realPrice/land_characteristics.php`,
        "POST", dataObj, "landDetail"
    );

    if (!responseData || responseData.length === 0) {
        console.warn("데이터가 없습니다.");
        return;
    }

    // ✅ landCharacteristicss 유효성 검사 추가
    const landCharacteristicss = responseData.landCharacteristicss;
    // ✅ 기존 if (!landCharacteristicss) 블록을 아래로 교체
    if (!landCharacteristicss || landCharacteristicss.length === 0) {
        console.warn("토지특성 데이터 없음 - pnu:", pnu);
        globalLandCharacter = [];  // ✅ 이 줄 추가
        // 공시지가만 있으면 공시지가 테이블만 표시
        globalLandPrices = responseData.indvdLandPrices;
        if (globalLandPrices && globalLandPrices.length > 0) {
            landPriceTable(pnu);
        }
        return;
    }

    // ✅ 배열 여부에 따라 처리
    globalLandCharacter = Array.isArray(landCharacteristicss)
        ? landCharacteristicss
        : [landCharacteristicss];

    // ✅ undefined/null 요소 필터링
    globalLandCharacter = globalLandCharacter.filter(item => item != null && item.pnu);

    if (globalLandCharacter.length === 0) {
        console.warn("유효한 landCharacter 데이터가 없습니다.");
        return;
    }

    globalLandPrices = responseData.indvdLandPrices;

    createMnnmSlnoButtons(globalLandCharacter);

    if (isMultiSelectMode) {
        landAnalysis();
        $("html").attr("data-preloader", "disable");
    }
}
/**
 * 건물 관련 버튼을 동적으로 생성하는 함수
 *
 * 이 함수는 주어진 건물 정보(brTitleInfo)를 기반으로 부번 버튼들을 동적으로 생성합니다.
 * 각 버튼을 클릭하면 해당 부번의 건물 정보를 표시하는 기능을 수행합니다.
 *
 * @param {*} brTitleInfo
 */
function createBuildingButtons(brTitleInfo) {
    // brTitleInfo가 undefined, null이거나, 빈 배열이거나, 배열의 모든 요소가 undefined 또는 null인 경우 중단
    if (!brTitleInfo || brTitleInfo.length === 0 || brTitleInfo.every((item) => item === null || item === undefined)) return;

    // undefined 또는 null 값을 필터링하여 제거
    brTitleInfo = brTitleInfo.filter((item) => item !== null && item !== undefined);

    // 필터링 후 배열이 비어있는지 다시 확인
    if (brTitleInfo.length === 0) return;

    const $btnGroup = $("#buidRegi_btn_group");
    $btnGroup.empty(); // 기존 버튼 초기화

    let buildingTotalArea = 0; // 총 건물 면적

    $.each(brTitleInfo, function (index, building) {
        buildingTotalArea += parseFloat(building.totArea); // 총 건물 면적 계산

        const $button = $("<button>")
            .addClass("buidRegi-btn font14 p-2")
            .html(`${building.dongNm ? building.dongNm.toString().trim() : building.mainPurpsCdNm}`)
            .on("click", function () {
                $(".buidRegi-btn").removeClass("active"); // 모든 버튼에서 active 클래스 제거
                $(this).addClass("active"); // 현재 클릭된 버튼에 active 클래스 추가
                buildingRegisterTable(building); //건물정보 테이블 생성
            });

        if (index === 0) {
            $button.addClass("active");
            buildingRegisterTable(building); // 첫 번째 부번의 데이터를 기본으로 건물정보 표시
        }

        $btnGroup.append($button);
    });

    $("#top_build_area").text(formatArea(buildingTotalArea.toFixed(2)) + "(" + brTitleInfo.length + "동)");
}

/**
 * 토지특성정보, 개별공시지가 버튼을 생성하는 함수
 *
 * 이 함수는 주어진 토지 특성 정보(landCharacteristics)를 기반으로 부번 버튼들을 동적으로 생성합니다.
 * 각 버튼을 클릭하면 해당 부번의 토지 특성과 공시지가 정보를 표시하는 기능을 수행합니다.
 *
 * @param {*} landCharacteristics
 */

function createMnnmSlnoButtons(landCharacteristics) {
    const $btnGroup = $("#mnnmSlno_btn_group");
    $btnGroup.empty();

    // ✅ globalLandCharacter 유효성 검사
    if (!globalLandCharacter || globalLandCharacter.length === 0) {
        console.warn('globalLandCharacter 가 비어있습니다.');
        return;
    }

    $.each(globalLandCharacter, function (index, land) {

        // ✅ land 개별 요소 undefined 체크
        if (!land || !land.pnu) {
            console.warn(`[index: ${index}] land 또는 land.pnu 가 없습니다.`, land);
            return true; // $.each 에서 continue 역할 → 다음 요소로 넘어감
        }

        const pnu = land.pnu;
        const $button = $("<button>")
            .addClass("mnnmSlno-btn font14 p-2")
            .text(`${land.mnnmSlno || String(land.mnnm) + "-" + String(land.slno)}`)
            .on("click", function () {
                $(".mnnmSlno-btn").removeClass("active");
                $(this).addClass("active");
                landCharacterTable(land);
                landPriceTable(pnu);
            });

        if (index === 0) {
            $button.addClass("active");
            landCharacterTable(land);
            landPriceTable(pnu);
        }

        $btnGroup.append($button);
    });
}

/**
 * 건물 테이블을 업데이트하는 함수
 * @param {object} info - 건축물 정보
 */
function buildingRegisterTable(info) {
    const {
        platPlc, // 지번주소
        newPlatPlc, // 도로명주소
        bldNm, // 건물명
        etcPurps, // 기타용도
        mainPurpsCdNm, // 주용도코드명
        etcStrct, // 구조코드명
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
    } = info;

    let building_rows = "";
    let lift_rows = "";
    let date_rows = "";
    building_rows += createTableRow("건물명", bldNm || "-");
    building_rows += createTableRow("주용도", mainPurpsCdNm);
    building_rows += createTableRow("기타용도", etcPurps);
    building_rows += createTableRow("구조코드명", etcStrct);
    building_rows += createTableRow("지붕코드명", roofCdNm);
    building_rows += createTableRow("기타지붕", etcRoof);
    building_rows += createTableRow("높이", comma(heit) + "m");
    building_rows += createTableRow("층수", "지상" + grndFlrCnt + " 층 / 지하" + ugrndFlrCnt + " 층");
    building_rows += createTableRow("건축면적", formatArea(archArea));
    building_rows += createTableRow("연면적", formatArea(totArea));
    building_rows += createTableRow("용적률산정연면적", formatArea(vlRatEstmTotArea));
    building_rows += createTableRow("용적률", comma(vlRat) + "%");
    building_rows += createTableRow("건폐율", comma(bcRat) + "%");
    building_rows += createTableRow("세대수", comma(hhldCnt) + "세대");
    building_rows += createTableRow("가구수", comma(fmlyCnt) + "가구");
    building_rows += createTableRow("연관토지 개수", bylotCnt);

    const hasLift = rideUseElvtCnt != 0 || emgenUseElvtCnt != 0;
    $(".mcb-lift").toggle(hasLift); // 승강기 정보가 있으면 표시, 없으면 숨기기
    lift_rows += createTableRow("승용승강기수", rideUseElvtCnt);
    lift_rows += createTableRow("비상용승강기수", emgenUseElvtCnt);

    const hasDate = pmsDay || stcnsDay || useAprDay;
    if (hasDate) {
        $(".mcb-date").attr("hidden", false); // 날짜 정보가 있으면 표시, 없으면 숨기기
    } else {
        $(".mcb-date").attr("hidden", true); // 날짜 정보가 있으면 표시, 없으면 숨기기
    }
    // $(".mcb-date").toggle(hasDate); // 날짜 정보가 있으면 표시, 없으면 숨기기
    date_rows += createTableRow("허가일", formatDate(pmsDay) || "-");
    date_rows += createTableRow("착공일", formatDate(stcnsDay) || "-");
    date_rows += createTableRow("사용승인일", formatDate(useAprDay) || "-");

    $("#building_info tbody").html(building_rows);
    $("#lift_info tbody").html(lift_rows);
    $("#date_info tbody").html(date_rows);

    const useAprDayOnlyYear = extractFirstWord(formatDate(useAprDay)); // 사용승인일 년도만
    const useAprDaySince = useAprDayOnlyYear ? calculateYearDifference(useAprDayOnlyYear) : 0; // 사용승인일 후 현재까지 차이
    const top_useAprDay = useAprDaySince ? useAprDayOnlyYear + "년(" + useAprDaySince + "년)" : ""; // 사용승인일 상단 표시부분

    // $(".jibun-address").text(platPlc);
    // $(".road-address").text(newPlatPlc);
    // $("#top_build_area").text(formatArea(totArea));
    // $("#top_land_area").text("토지 " + formatArea(platArea));
    $("#top_putps").text(mainPurpsCdNm);
    $("#top_useAprDay").text(top_useAprDay);
    $("#top_floor").text("B" + ugrndFlrCnt + "/" + grndFlrCnt + "F");
}

/**
 * 토지특성속성 테이블 업데이트 함수
 * @param {*} landDetails
 * @returns
 */
async function landCharacterTable(landDetails) {
    // 토지정보 있을 때
    if (landDetails) {
        // const {
        //     lndcgrCodeNm, // 지목명
        //     lndpclAr, // 토지면적
        //     ladUseSittnNm, // 토지이용상황
        //     prposArea1Nm, // 용도지역명1
        //     prposArea2Nm, // 용도지역명2
        //     tpgrphHgCodeNm, // 지형높이
        //     tpgrphFrmCodeNm, // 지형형상
        //     roadSideCodeNm, // 도로접면
        //     // pblntfPclnd, // 공시지가
        // } = landDetails;

        // return;
        let land_rows = "";
        land_rows += createTableRow("지목명", landDetails.lndcgrCodeNm || landDetails.lndcgr_code_nm || "-");
        land_rows += createTableRow("토지면적", formatArea(landDetails.lndpclAr || landDetails.lndpcl_ar) || "-");
        land_rows += createTableRow("토지이용상황", landDetails.ladUseSittnNm || landDetails.lad_use_sittn_nm || "-");
        land_rows += createTableRow("용도지역명", landDetails.prposArea1Nm || landDetails.prpos_area_1_nm || "-");
        land_rows += createTableRow("지형높이", landDetails.tpgrphHgCodeNm || landDetails.tpgrph_hg_code_nm || "-");
        land_rows += createTableRow("지형형상", landDetails.tpgrphFrmCodeNm || landDetails.tpgrph_frm_code_nm || "-");
        land_rows += createTableRow("도로접면", landDetails.roadSideCodeNm || landDetails.road_side_code_nm || "-");

        $("#land_info tbody").html(land_rows);

        $("#top_land_area").text(formatArea(landDetails.lndpclAr || landDetails.lndpcl_ar) || "-");
        $("#top_prposArea1Nm").text(landDetails.prposArea1Nm || landDetails.prpos_area_1_nm || "-");
        $("#top_land_pups").text(landDetails.lndcgrCodeNm || landDetails.lndcgr_code_nm || "-");
    }
}

/**
 * 토지 가격 정보를 테이블에 업데이트하는 함수
 * @param {string} pnu
 */
function landPriceTable(pnu) {
    indvdLandPrices = globalLandPrices;

    // 공시지가 있을 때
    if (indvdLandPrices) {
        // 특정 pnu 값을 가진 항목들만 필터링
        const filteredPrices = indvdLandPrices.filter((item) => item.pnu === pnu);

        // stdrYear 당 하나씩, 동일한 stdrYear일 경우 가장 최근의 lastUpdtDt를 가진 데이터만 선택
        const uniquePrices = filteredPrices
            .slice() // 원본 배열을 변경하지 않기 위해 복사
            .sort((a, b) => {
                if (a.stdrYear === b.stdrYear) {
                    return new Date(b.lastUpdtDt) - new Date(a.lastUpdtDt); // 동일한 stdrYear일 경우, lastUpdtDt를 기준으로 내림차순 정렬
                }
                return b.stdrYear - a.stdrYear; // stdrYear 기준으로 내림차순 정렬
            })
            .filter(
                (item, index, self) => index === self.findIndex((t) => t.stdrYear === item.stdrYear) // stdrYear가 동일한 첫 번째 항목만 유지
            );

        let landPriceList = uniquePrices
            .map(function (item, index) {
                // 공시지가(만 단위 까지) = (공시지가 * 토지면적) / 10000
                // officialPrice = Math.floor(officialPrice / 10000);

                // 마지막 item의 공시지가
                if (index === 0) {
                    let officialPrice = 0;
                    // ✅ globalLandCharacter[0] 과 lndpclAr 존재 여부 확인
                    const lndpclAr = globalLandCharacter?.[0]?.lndpclAr;

                    //officialPrice = parseInt(item.pblntfPclnd) * parseInt(globalLandCharacter[0].lndpclAr); // 총 공시지가 = 공시지가 * 토지면적
                    //officialPrice = Math.floor(officialPrice / 10000); // 총 공시지가(만 단위 까지) = (공시지가 * 토지면적) / 10000
                    //officialPrice = formatPrice(officialPrice, "only-uk"); // 총 공시지가(억 단위 까지)

                    //$("#top_official_land_price").text("공시지가 " + officialPrice);

                    if (lndpclAr) {
                        officialPrice = parseInt(item.pblntfPclnd) * parseInt(lndpclAr);
                        officialPrice = Math.floor(officialPrice / 10000);
                        officialPrice = formatPrice(officialPrice, "only-uk");
                        $("#top_official_land_price").text("공시지가 " + officialPrice);
                    } else {
                        // 토지면적 없을 때 공시지가(단가)만 표시
                        console.warn("lndpclAr 없음 - globalLandCharacter:", globalLandCharacter);
                        officialPrice = formatAreaPrice(parseInt(item.pblntfPclnd));
                        $("#top_official_land_price").text("공시지가 " + officialPrice + "/㎡");
                    }
                }

                // 개별공시지가
                const landPrice = formatAreaPrice(parseInt(item.pblntfPclnd));

                return `
                    <tr class="${index >= 5 ? "more-price d-none" : ""}">
                        <td>${item.stdrYear}</td>
                        <td>${item.pblntfDe}</td>
                        <th>${landPrice}</th>
                    </tr>`;
            })
            .join("");

        $("#land_price_table tbody").html(landPriceList);
    }
}

// ****************************
// 도우미 함수 (Helper Functions)
// ****************************

/**
 * <tr>생성 함수
 * @param {*} key
 * @param {*} value
 * @returns {string}
 */
function createTableRow(key, value) {
    return `
        <tr>
            <td>${key}</td>
            <th class="text-end">${value}</th>
        </tr>`;
}

/**
 * 면적을 현재 단위에 맞게 포맷하는 함수
 * @param {number} area - 면적 값
 * @returns {string} - 포맷된 면적 값
 */
function formatArea(area) {
    // if (!area) return 0;
    if (currentUnit === "m2") {
        $("#area_unit").text("㎡");
        return comma(area) + "㎡";
    } else {
        $("#area_unit").text("평");
        return comma(convertSquareMetersToPyeong(area)) + "평";
    }
}

/**
 * 면적을 현재 단위(㎡ 또는 평)에 맞게 포맷하는 함수
 * @param {number} area - 면적 값 (㎡ 단위)
 * @returns {string} - 포맷된 면적 값 (현재 단위에 맞춰 "원/㎡" 또는 "원/평" 형식으로 반환)
 */
function formatAreaPrice(area) {
    if (currentUnit === "m2") {
        return comma(area) + "원/㎡"; // 현재 단위가 ㎡일 경우 포맷
    } else {
        return comma(convertSquareMeterPriceToPyeong(area)) + "원/평"; // 현재 단위가 평일 경우 포맷
    }
}

/**
 * 제곱미터(m²)를 평으로 변환하는 함수
 * @param {number} squareMeters - 제곱미터 값
 * @returns {number} - 변환된 평 값
 */
function convertSquareMetersToPyeong(squareMeters) {
    const conversionFactor = 3.3058;
    return (squareMeters / conversionFactor).toFixed(2);
}

/**
 * ㎡ 단위의 가격을 평 단위로 변환하는 경우 (가격 변환)
 * @param {*} squareMeterPrice - 제곱미터 단위 당 가격
 * @returns {number} - 변환된 평당 가격 값
 */
function convertSquareMeterPriceToPyeong(squareMeterPrice) {
    const conversionFactor = 3.3058;
    return (squareMeterPrice * conversionFactor).toFixed(2); // ㎡ 단위 가격을 평 단위로 변환
}

/**
 * 첫 번째 구분자(/ 또는 ,)를 찾기
 * @param {*} text
 * @returns {string}
 */
function extractFirstWord(text) {
    const delimiters = /[\/,-]/;
    const match = text.split(delimiters);
    return match[0];
}

/**
 * 특정 연도와 현재 연도의 차이를 계산하는 함수
 * @param {number} specificYear
 * @returns {number}
 */
function calculateYearDifference(specificYear) {
    const currentYear = new Date().getFullYear();
    return currentYear - specificYear;
}

/**
 * 날짜 폼 변환
 * @param {*} dateString
 * @returns {string}
 */
function formatDate(dateString) {
    // 숫자가 들어왔을 경우 문자열로 변환
    dateString = dateString.toString();

    // dateString의 길이가 8이 아니면 빈 문자열을 반환
    if (dateString.length !== 8) return "";

    // 연, 월, 일을 추출
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);

    // YYYY-MM-DD 형식으로 반환
    return `${year}-${month}-${day}`;
}

/**
 * 카테고리 검색을 요청하는 함수입니다
 * @returns
 */
/*
async function searchArroundPlaces(coords) {
    
    // 합필분석 모드에서는 중단
    if (isMultiSelectMode) return;

    // 지도에 표시되고 있는 마커를 제거합니다
    removeMarker(placeMarkers);
    // 커스텀 오버레이를 숨깁니다
    placeOverlay.setMap(null);
    // 반경 폴리곤 제거
    if (placeRangePolygon) placeRangePolygon.setMap(null);

    searchCategory(coords, "SW8");
    searchCategory(coords, "SC4");
    searchCategory(coords, "PS3");
    searchCategory(coords, "AC5");
    searchCategory(coords, "BK9");
    searchCategory(coords, "PO3");
    searchCategory(coords, "PM9");
    searchCategory(coords, "HP8");
    searchCategory(coords, "MT1");
    searchCategory(coords, "CS2");
    searchCategory(coords, "FD6");
    searchCategory(coords, "CE7");
    searchCategory(coords, "CT1");
    searchCategory(coords, "AT4");
    searchCategory(coords, "AD5");
    searchCategory(coords, "PK6");
    searchCategory(coords, "OL7");
    searchBusStop(coords);
}
*/
// ✅ searchArroundPlaces 상단에 실행 중 플래그 추가
let isSearchingPlaces = false;
// ✅ map.js 에서 searchArroundPlaces 호출 부분에 debounce 적용
const debouncedSearchArroundPlaces = debounce(searchArroundPlaces, 500);
   

async function searchArroundPlaces(coords) {

    // 합필분석 모드에서는 중단
    if (isMultiSelectMode) return;

    // ✅ 이미 실행 중이면 이전 것 취소하고 새로 시작
    if (isSearchingPlaces) {
        //console.warn("searchArroundPlaces 중복 호출 - 이전 취소 후 재시작");
        isSearchingPlaces = false;
    }
    
    isSearchingPlaces = true; // 실행 시작
    try {
        // 지도에 표시되고 있는 마커를 제거합니다
        removeMarker(placeMarkers);
        // 커스텀 오버레이를 숨깁니다
        placeOverlay.setMap(null);
        // 반경 폴리곤 제거
        if (placeRangePolygon) placeRangePolygon.setMap(null);

        // ✅ 동시 호출 → 100ms 간격 순차 호출로 변경
        const categoryCodes = [
            "SW8", "SC4", "PS3", "AC5", "BK9", "PO3",
            "PM9", "HP8", "MT1", "CS2", "FD6", "CE7",
            "CT1", "AT4", "AD5", "PK6", "OL7"
        ];

        for (const code of categoryCodes) {
            if (!isSearchingPlaces) break; // ✅ 취소 신호 감지 시 중단
            await searchCategory(coords, code);
            await delay(100); // 100ms 간격으로 순차 호출
        }

        // 버스 정류장은 카카오 카테고리 API 와 별도이므로 마지막에 호출
        if (isSearchingPlaces) searchBusStop(coords);

    } finally {
        isSearchingPlaces = false; // ✅ 완료 후 반드시 해제
    }
}
// ✅ delay 유틸 함수 (파일 상단에 추가)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * 장소검색이 완료됐을 때 호출되는 콜백함수 입니다
 * @param {*} data
 * @param {*} status
 * @param {*} pagination
 */
async function arroundPlacesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
        // 정상적으로 검색이 완료됐으면 지도에 마커를 표출합니다
        // searchArroundPlacesTable(data, pagination);
        // displayArroundPlaces(data);
    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        // 검색결과가 없는경우 해야할 처리가 있다면 이곳에 작성해 주세요
    } else if (status === kakao.maps.services.Status.ERROR) {
        // 에러로 인해 검색결과가 나오지 않은 경우 해야할 처리가 있다면 이곳에 작성해 주세요
    }
}

/**
 * 주변 시설 리스트 생성 함수
 * @param {*} result
 * @returns
 */
function searchArroundPlacesTable(result, coords) {
    const places = result.documents;
    const meta = result.meta;

    if (!places[0]) return;

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
    let className = "";
    let contents = "";

    $.each(places, function (index, place) {
        // 카테고리 그룹 코드가 있을 경우 아이콘을 할당
        if (place.category_group_code) {
            // icon = categoryIcons[place.category_group_code] || "";
            className = place.category_group_code;
        } else {
            // 카테고리 그룹 코드가 없을 경우 기본 아이콘 할당
            // icon = '<i class="las la-lg la-building"></i>';
            className = "default";
        }

        // 리스트 5개 이하만 표시
        if (index < 5) {
            const htmm = `
            <div class="my-1">
                <strong class="place-name font15 mx-2">${place.place_name}</strong>
                <span class="place-distance font13">${place.distance}m</span>
            </div>`;

            contents += htmm;
        }
    });

    // 분류에 따른 넣을 위치 설정
    const placeCd = places[0].category_group_code;

    $(`.place-${placeCd} .place-contents`).html(contents);
    $(`.place-${placeCd} .count`).text(meta.total_count);

    $(`.place-${placeCd}`).on("click", function () {
        displayArroundPlaces(places, coords, 1000);
    });
}

/**
 * 지도에 마커를 표출하는 함수입니다
 * @param {*} places
 */
function displayArroundPlaces(places, coords, range) {
    // 주변 마커 제거
    removeMarker(placeMarkers);
    // 커스텀 오버레이를 숨깁니다
    placeOverlay.setMap(null);
    // 반경 폴리곤 제거
    if (placeRangePolygon) placeRangePolygon.setMap(null);

    // 지도에 표시할 원을 생성합니다
    var circle = new kakao.maps.Circle({
        center: new kakao.maps.LatLng(coords.lat, coords.lng), // 원의 중심좌표 입니다
        radius: range, // 미터 단위의 원의 반지름입니다
        strokeWeight: 5, // 선의 두께입니다
        strokeColor: "#75B8FA", // 선의 색깔입니다
        strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
        strokeStyle: "dashed", // 선의 스타일 입니다
        fillColor: "#CFE7FF", // 채우기 색깔입니다
        fillOpacity: 0.4, // 채우기 불투명도 입니다
    });
    placeRangePolygon = circle;
    // 지도에 원을 표시합니다
    placeRangePolygon.setMap(map);

    // 카테고리 코드와 아이콘을 매핑하는 객체
    const categoryIcons = {
        MT1: "/front/assets/image/icn_shop.svg", // 대형마트
        CS2: "/front/assets/image/icn_store.svg", // 편의점
        PS3: "/front/assets/image/icn_kindergarten.svg", // 어린이집
        SC4: "/front/assets/image/icn_school.svg", // 학교
        AC5: "/front/assets/image/icn_academy.svg", // 학원
        PK6: "/front/assets/image/icn_parking.svg", // 주차장
        OL7: "/front/assets/image/icn_gas_station.svg", // 주유소
        SW8: "/front/assets/image/icn_subway.svg", // 지하철역
        BK9: "/front/assets/image/icn_bank.svg", // 은행
        CT1: "/front/assets/image/icn_culture_facility.svg", // 문화시설
        AG2: "/front/assets/image/icn_real_estate.svg", // 중개업소
        PO3: "/front/assets/image/icn_landmark.svg", // 공공기관
        AT4: "/front/assets/image/icn_tourist_spot.svg", // 관광명소
        AD5: "/front/assets/image/icn_hotel.svg", // 숙박
        FD6: "/front/assets/image/icn_restaurant.svg", // 음식점
        CE7: "/front/assets/image/icn_cafe.svg", // 카페
        HP8: "/front/assets/image/icn_hospital.svg", // 병원
        PM9: "/front/assets/image/icn_pharmacy.svg", // 약국
        BUS: "/front/assets/image/icn_bus.svg", // 버스정류장
    };

    let icon = "";
    icon = categoryIcons[places[0].category_group_code] || "";

    for (var i = 0; i < places.length; i++) {
        // 마커를 생성하고 지도에 표시합니다
        var marker = addPlaceMarker(new kakao.maps.LatLng(places[i].y, places[i].x), icon);

        // 마커와 검색결과 항목을 클릭 했을 때
        // 장소정보를 표출하도록 클릭 이벤트를 등록합니다
        (function (marker, place) {
            kakao.maps.event.addListener(marker, "click", function () {
                displayPlaceInfo(place);
            });
        })(marker, places[i]);
    }
}

/**
 * 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
 * @param {*} position
 * @param {*} order
 * @returns
 */
function addPlaceMarker(position, icon) {
    var currentUrl = window.location.origin; // 현재 URL의 origin을 가져옵니다.
    var imageSrc = currentUrl + icon, // 마커 이미지 url, 스프라이트 이미지를 씁니다
        imageSize = new kakao.maps.Size(28, 28), // 마커 이미지의 크기
        imgOptions = {
            // spriteSize: new kakao.maps.Size(72, 208), // 스프라이트 이미지의 크기
            // spriteOrigin: new kakao.maps.Point(46, order * 36), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
            offset: new kakao.maps.Point(15, 28), // 마커 좌표에 일치시킬 이미지 내에서의 좌표
        },
        markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions),
        marker = new kakao.maps.Marker({
            position: position, // 마커의 위치
            image: markerImage,
        });

    marker.setMap(map); // 지도 위에 마커를 표출합니다
    placeMarkers.push(marker); // 배열에 생성된 마커를 추가합니다

    return marker;
}

/**
 * 지정된 좌표와 카테고리 코드를 사용하여 카카오 API에서 장소를 검색하는 함수
 * @param {*} coords - 검색의 중심이 되는 좌표 객체 (경도: lng, 위도: lat)
 * @param {*} code - 카테고리 그룹 코드 (예: HP8는 병원, FD6는 음식점 등)
 */
async function searchCategory(coords, code) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "https://dapi.kakao.com/v2/local/search/category.json",
            type: "GET",
            data: {
                category_group_code: code, // 카테고리 코드
                x: coords.lng, // 중심 좌표의 경도 (longitude)
                y: coords.lat, // 중심 좌표의 위도 (latitude)
                radius: 1000, // 반경 m단위
                size: 15, // 한 페이지에 보여질 결과 개수
                page: 1, // 결과 페이지 번호
                sort: "distance", // 결과 정렬 순서 (거리 기준)
            },
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", `KakaoAK ${REST_API_KEY}`); // API 키 설정

                $(`.place-${code} .count`).text(0); // place-contents 요소 비우기
                $(`.place-${code} .place-contents`).empty(); // place-contents 요소 비우기
            },
            success: function (response) {
                searchArroundPlacesTable(response, coords);
                resolve(response); // ✅ 완료 신호
            },
            error: function (xhr, status, error) {
                if (xhr.status === 429) {
                    console.warn(`[${code}] API 호출 한도 초과 (429) - 잠시 후 재시도`);
                } else {
                    console.error(`[${code}] API 요청 오류:`, status, error);
                }
                resolve(null); // ✅ 에러여도 다음 진행
            },
        });
    });
}

/**
 * 버스 정류장 조회 함수
 * @param {*} coords
 * @param {*} code
 */
async function searchBusStop(coords) {
    $(`.place-BUS .count`).text(0); // place-contents 요소 비우기
    $(`.place-BUS .place-contents`).empty(); // place-contents 요소 비우기

    const url = "/front/back/realPrice/bus_stop.php";
    const dataObj = {
        lng: coords.lng,
        lat: coords.lat,
    };

    const result = await callApiAbort(url, "POST", dataObj, "searchBusStop");

    if (!result || !result.items) return;

    let places = result.items.item;
    const count = result.totalCount;
    let contents = "";

    $.each(places, function (index, place) {
        // 'gpslati'를 'y'로, 'gpslong'을 'x'로 변경
        place.y = place.gpslati;
        place.x = place.gpslong;

        // 'category_group_code' 값을 'bus'로 추가
        place.category_group_code = "BUS";

        // 이제 필요에 따라 'gpslati'와 'gpslong' 속성 제거 (선택 사항)
        delete place.gpslati;
        delete place.gpslong;

        // 거리 계산
        const lat = parseFloat(place.y);
        const lng = parseFloat(place.x);
        const distance = Math.round(calculateDistance(coords.lat, coords.lng, lat, lng));

        // 리스트 5개 이하만 표시
        if (index < 5) {
            const htmm = `
            <div class="my-1">
                <strong class="place-name font15 mx-2">${place.nodenm}</strong>
                <span class="place-distance font13">${distance}m</span>
            </div>`;

            contents += htmm;
        }
    });

    $(`.place-BUS .place-contents`).html(contents);
    $(`.place-BUS .count`).text(count);

    $(`.place-BUS`).on("click", function () {
        displayArroundPlaces(places, coords, 500);
    });
}

/**
 * 위도와 경도로 두 지점 사이의 거리를 계산하는 함수 (하버사인 공식 사용)
 * @param {number} lat1 - 첫 번째 지점의 위도
 * @param {number} lon1 - 첫 번째 지점의 경도
 * @param {number} lat2 - 두 번째 지점의 위도
 * @param {number} lon2 - 두 번째 지점의 경도
 * @returns {number} - 두 지점 사이의 거리 (단위: 미터)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 지구의 반지름 (미터 단위)
    const φ1 = (lat1 * Math.PI) / 180; // 위도1을 라디안으로 변환
    const φ2 = (lat2 * Math.PI) / 180; // 위도2를 라디안으로 변환
    const Δφ = ((lat2 - lat1) * Math.PI) / 180; // 위도 차이를 라디안으로 변환
    const Δλ = ((lon2 - lon1) * Math.PI) / 180; // 경도 차이를 라디안으로 변환

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // 두 지점 사이의 거리 (미터 단위)
    return distance;
}

/**
 * 클릭한 마커에 대한 장소 상세정보를 커스텀 오버레이로 표시하는 함수입니다
 * @param {*} place
 */
function displayPlaceInfo(place) {
    const groupCd = place.category_group_code;
    if (groupCd !== "BUS") {
        const address = place.road_address_name ? `<p class="" title="${place.road_address_name}">${place.road_address_name}</p><p class="jibun font11 weight400" title="${place.address_name}">(지번 : ${place.address_name})</p>` : `<p title="${place.address_name}">${place.address_name}</p>`;

        var content = `
        <div class="placeinfo position-relative shadow">
            <div class="d-flex align-items-center justify-content-between bg-main">
                <a class="title p-2 font15 text-bold text-white" href="${place.place_url}" target="_blank" title="${place.place_name}">${place.place_name}</a>
                <button class="btn-close p-2" style="filter:invert(100%);" onclick="closePlaceOverlay()" title="닫기"></button>
            </div>
            <div class="p-2 bg-white">
                ${address}
                <p class="tel pt-1 font12 color-green1">${place.phone}</p>
            </div>
        </div>
        <div class="after" style="content:'';position:relative;margin-left:-12px;left:50%;width:22px;height:12px;background:url('https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/vertex_white.png')"></div>`;
    } else {
        var content = `
        <div class="placeinfo position-relative shadow">
            <p class="title d-block bg-main p-2 font15 text-white text-bold" title="${place.nodenm}">${place.nodenm}</p>
            <div class="p-2 bg-white">
                <p>정류소ID : ${place.nodeid}</p>
            </div>
        </div>
        <div class="after" style="content:'';position:relative;margin-left:-12px;left:50%;width:22px;height:12px;background:url('https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/vertex_white.png')"></div>`;
    }

    placeOverlayNode.innerHTML = content;
    placeOverlay.setPosition(new kakao.maps.LatLng(place.y, place.x));
    placeOverlay.setMap(map);
}

// 커스텀 오버레이를 닫기 위해 호출되는 함수입니다
function closePlaceOverlay() {
    placeOverlay.setMap(null);
}

// 지도에 추가된 지도타입정보를 가지고 있을 변수입니다
var currentTypeId;
// 버튼이 클릭되면 호출되는 함수입니다
function setOverlayMapTypeId(maptype, mapSelect) {
    var changeMaptype;

    // maptype에 따라 지도에 추가할 지도타입을 결정합니다
    switch (maptype) {
        case "traffic":
            changeMaptype = kakao.maps.MapTypeId.TRAFFIC; // 교통정보 지도타입
            break;
        case "roadview":
            changeMaptype = kakao.maps.MapTypeId.ROADVIEW; // 로드뷰 도로정보 지도타입
            break;
        case "terrain":
            changeMaptype = kakao.maps.MapTypeId.TERRAIN; // 지형정보 지도타입
            break;
        case "use_district":
            changeMaptype = kakao.maps.MapTypeId.USE_DISTRICT; // 지적편집도 지도타입
            break;
        default:
            return; // 유효하지 않은 타입일 경우 함수 종료
    }

    // 모든 오버레이 맵 타입을 제거합니다
    mapSelect.removeOverlayMapTypeId(kakao.maps.MapTypeId.TRAFFIC);
    mapSelect.removeOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
    mapSelect.removeOverlayMapTypeId(kakao.maps.MapTypeId.TERRAIN);
    mapSelect.removeOverlayMapTypeId(kakao.maps.MapTypeId.USE_DISTRICT);

    // 현재 선택된 지도 타입과 동일한지 확인
    if (currentTypeId !== changeMaptype) {
        // maptype에 해당하는 지도타입을 지도에 추가합니다
        mapSelect.addOverlayMapTypeId(changeMaptype);
        currentTypeId = changeMaptype; // 현재 선택된 타입 저장
    } else {
        currentTypeId = null; // 선택된 타입 초기화
    }
}

/**
 * 지도 타입을 변경하는 함수
 * @param {string} mapType - 변경할 지도 타입 (roadmap, skyview, hybrid)
 * @param {object} map - 지도 객체 (kakao.maps.Map)
 */
function changeBaseMapType(mapType, map) {
    switch (mapType.toLowerCase()) {
        case "roadmap":
            map.setMapTypeId(kakao.maps.MapTypeId.ROADMAP); // 일반 지도
            break;
        case "skyview":
            map.setMapTypeId(kakao.maps.MapTypeId.SKYVIEW); // 스카이뷰(위성) 지도
            break;
        case "hybrid":
            map.setMapTypeId(kakao.maps.MapTypeId.HYBRID); // 하이브리드(위성 + 도로) 지도
            break;
        default:
            console.error("유효하지 않은 지도 타입입니다.");
            break;
    }
}

/**
 * mc-tab-content 스크롤 위치에 따라 탭 버튼의 active 클래스를 업데이트하는 함수
 */
function updateTabOnScroll() {
    // 각 섹션별로 id 값을 매핑
    const sections = {
        "mc-real": $('.tab-btn[data-target="mc-real"]'),
        "mc-ground": $('.tab-btn[data-target="mc-ground"]'),
        "mc-building": $('.tab-btn[data-target="mc-building"]'),
        "mc-surrounding": $('.tab-btn[data-target="mc-surrounding"]'),
        "mc-analysis": $('.tab-btn[data-target="mc-analysis"]'),
        "mc-finance": $('.tab-btn[data-target="mc-finance"]'),
    };
    // 각 섹션 요소를 배열로 저장
    const sectionElements = Object.keys(sections).map((sectionClass) => $("." + sectionClass));

    // mc-tab-content의 스크롤 이벤트
    $(".mc-tab-content").on("scroll", function () {
        let scrollTop = $(this).scrollTop();
        let foundActive = false;

        // 최상단 스크롤일 경우 강제로 mc-real 탭을 활성화
        if (scrollTop === 0) {
            $(".tab-btn").removeClass("active");
            sections["mc-real"].addClass("active");
            return;
        }

        // 섹션별 스크롤 위치에 따라 탭 활성화
        sectionElements.forEach((sectionElement, index) => {
            if (!sectionElement.is(":visible")) return; // 보이지 않는 섹션은 무시

            let sectionOffsetTop = sectionElement.offset().top - $(".mc-tab-content").offset().top + scrollTop;
            let sectionHeight = sectionElement.outerHeight();

            // 현재 스크롤 위치가 해당 섹션의 범위 안에 있는지 확인
            if (scrollTop >= sectionOffsetTop - 50 && scrollTop < sectionOffsetTop + sectionHeight - 50) {
                $(".tab-btn").removeClass("active");

                // 해당 탭 버튼을 활성화
                const sectionClass = sectionElement.attr("class").split(" ")[0];
                if (sections[sectionClass]) {
                    sections[sectionClass].addClass("active");
                    foundActive = true;
                }
            }
        });

        // 맨 아래쪽 탭 활성화를 위한 보정
        if (!foundActive) {
            $(".tab-btn").removeClass("active");
            sections["mc-finance"].addClass("active");
        }
    });
}
