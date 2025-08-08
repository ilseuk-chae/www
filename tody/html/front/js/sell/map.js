const mapContainer = document.getElementById("map_bg"); // 지도를 표시할 div
let geocoder = new kakao.maps.services.Geocoder(); // 주소-좌표 변환 객체를 생성합니다
let ps = new kakao.maps.services.Places(); // 장소 검색 객체를 생성합니다
let map = null; // 맵
let infowindow = null; // 인포윈도우
let clusterer = null; // 클러스터
let marker = null; // 클릭한 위치를 표시할 마커입니다
let markers = []; // 클릭, 선택된 마커 배열 정의
let historyMarkers = []; // 최근 이력 마커 배열 정의
let contentsMarkers = []; // 컨텐츠 마커 배열 정의
let customOverlays = []; // 커스텀 오버레이 배열 정의
let currentUnit = "m2"; // 현재 단위를 추적
let previousLat = new URLSearchParams(window.location.search).get("curLat");
let previousLng = new URLSearchParams(window.location.search).get("curLng");
let isLoading = false; // 현재 비동기 작업이 진행 중인지 추적하기 위한 플래그
let manager = null; // Drawing manager
let circleDrawer = null; // 원 반경 모듈
let lineDrawer = null; // 직선 거리 모듈
let polygonDrawer = null; // 다각형 거리 모듈
var textModule = null; // 텍스트 입력 모듈

$(document).ready(function () {
    initModal(); // 이지모달 초기화
    initializeMap(); // 지도 초기화
    handleMapEvents(); // 지도 이벤트
    // handleDefaultEvents(); // 기본 이벤트

    // URL 변경 감지 이벤트
    window.addEventListener("popstate", function (e) {
        handleUrlChange();
    });
});

/**
 * URL 변경 후 즉시 파라미터를 체크하고 좌표 변경하는 함수
 */
function handleUrlChange() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentLat = parseFloat(urlParams.get("curLat")); // 숫자로 변환
    const currentLng = parseFloat(urlParams.get("curLng")); // 숫자로 변환
    if (!currentLat || !currentLng) return;

    const kakaoCoords = new kakao.maps.LatLng(currentLat, currentLng);
    const coords = { lat: currentLat, lng: currentLng };

    map.panTo(kakaoCoords);

    return;

    // 주소 요청
    searchDetailAddrFromCoords(kakaoCoords, function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
            handleMapClick(coords); // 건물 및 토지 정보를 동시에 가져오기
            searchArroundPlaces(coords); // 주변 시설 정보 가져오기
        }
        displayAddressInfo(result, status); // 지도 주소 정보 바인딩
    });

    // // 좌표가 변경되었을 때만 지도 중심을 업데이트
    // if (currentLat !== previousLat || currentLng !== previousLng) {
    //     console.log(`Latitude changed to: ${currentLat} from ${previousLat}`);
    //     console.log(`Longitude changed to: ${currentLng} from ${previousLng}`);

    //     // 지도 중심을 새 좌표로 이동
    //     const newCenter = new kakao.maps.LatLng(currentLat, currentLng);
    //     map.setCenter(newCenter);

    //     // 이전 값을 현재 값으로 업데이트
    //     previousLat = currentLat;
    //     previousLng = currentLng;
    // }
}

/**
 * 좌표를 이용해 법정동 상세 주소 정보를 요청하는 함수
 *
 * @param {kakao.maps.LatLng} coords - 검색할 위치의 좌표 객체 (위도와 경도 포함)
 * @param {function} callback - 상세 주소 정보를 반환받을 콜백 함수. 요청 결과와 상태를 인자로 받습니다.
 */
function searchDetailAddrFromCoords(coords, callback) {
    geocoder.coord2Address(coords.getLng(), coords.getLat(), callback);
}

/**
 * 지도 좌측상단에 지도 중심좌표에 대한 주소정보를 표출하는 함수입니다
 * @param {*} result
 * @param {*} status
 */
function displayAddressInfo(result, status) {
    if (status === kakao.maps.services.Status.OK) {
        var roadDivs = document.querySelectorAll(".road-address");
        var jibunDivs = document.querySelectorAll(".jibun-address");

        var roadAddress = result[0].road_address ? result[0].road_address.address_name : "";
        var jibunAddress = result[0].address.address_name;

        // 도로명 주소가 없으면 도로명 주소 숨기기
        if (!result[0].road_address) {
            roadDivs.forEach(function (roadDiv) {
                roadDiv.style.display = "none";
            });
        } else {
            roadDivs.forEach(function (roadDiv) {
                roadDiv.style.display = "block";
            });
        }

        // roadDivs의 각 요소에 대해 roadAddress 설정
        roadDivs.forEach(function (roadDiv) {
            roadDiv.innerHTML = roadAddress;
            if (roadDiv.tagName === "INPUT") {
                roadDiv.value = roadAddress; // input 요소의 value 속성에 값 설정
            }
        });

        // jibunDivs의 각 요소에 대해 jibunAddress 설정
        jibunDivs.forEach(function (jibunDiv) {
            jibunDiv.innerHTML = jibunAddress;
            if (jibunDiv.tagName === "INPUT") {
                jibunDiv.value = jibunAddress; // input 요소의 value 속성에 값 설정
            }
        });

        recentVisit(jibunAddress); // 최근 방문
    }
}
/**
 * 카카오맵 적용 함수
 */
async function initializeMap() {
    let zoomLevel = getCookie("curZoom") || 5;
    if (zoomLevel > 5) zoomLevel = 5;

    const urlParams = new URLSearchParams(window.location.search);

    let lat = parseFloat(urlParams.get('curLat'));
    let lng = parseFloat(urlParams.get('curLng'));

    // 유효성 검사(온돌님 함수로 대체 가능)
    if (!areValidCoordinatesInKorea(lat, lng)) {
        // 쿠키 선호 시, 먼저 쿠키를 보시고 없으면 기본값으로
        const cLat = parseFloat(getCookie('curLat'));
        const cLng = parseFloat(getCookie('curLng'));
        if (areValidCoordinatesInKorea(cLat, cLng)) {
            lat = cLat; lng = cLng;
        } else {
            lat = 37.199537203472; // 화성시청
            lng = 126.831477350333;
        }
    }

    // 쿠키는 선택 사항(유지 원하시면 그대로 두세요)
    setCookie('curLat', String(lat), 1);
    setCookie('curLng', String(lng), 1);

    const kakaoCoords = new kakao.maps.LatLng(lat, lng);
    const mapOption = {
        center: kakaoCoords,
        level: zoomLevel, // clamp(zoomLevel, 0, 13) 검토 권장
        minLevel: 0,
        maxLevel: 13,
        disableDoubleClickZoom: true
    };

    map = new kakao.maps.Map(mapContainer, mapOption);

    // 1) 초기 복원(= URL 있으면 저장 동기화만, 없으면 스토리지/쿠키/기본으로 복원)
    applyGlobalViewOnInit(map, { persist: 'both' });

    // 2) 이후 변경 자동 저장(dual-write)
    attachGlobalViewSaver(map, { persist: 'both' });

    // // 마커 클러스터러를 생성합니다
    // clusterer = new kakao.maps.MarkerClusterer({
    //     map: map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
    //     averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
    //     minLevel: 1, // 클러스터 할 최소 지도 레벨
    //     minClusterSize: 1, // 클러스터링 할 최소 마커 수 (default: 2)
    //     disableClickZoom: true,
    //     styles: [
    //         {
    //             // calculator 각 사이 값 마다 적용될 스타일을 지정한다
    //             width: "50px",
    //             height: "50px",
    //             background: "rgba(37,133,237,.9)",
    //             border: "1px solid rgba(37,133,237,.9)",
    //             borderRadius: "50%",
    //             color: "#fff",
    //             textAlign: "center",
    //             fontWeight: "bold",
    //             lineHeight: "48px",
    //             fontSize: "1.7rem",
    //         },
    //     ],
    // });

    // 로드맵
    initRoadView();

    // 툴박스
    toolbox();
    // 직선 거리 계산
    lineDrawer = createLineDrawer(map);
    // 원 반경 계산
    circleDrawer = createCircleDrawer(map);
    // 다각형 면적 계산
    polygonDrawer = createPolygonDrawer(map);
    // 텍스트 모듈과 selectOverlay 함수 결합
    textModule = addTextToMap(map); // 지도에 텍스트 모듈을 연결
}

/**
 * 지도 이벤트를 처리하는 함수
 */
function handleMapEvents() {
    // [EVENT] 지도가 줌인 줌아웃 후 이벤트 처리
    kakao.maps.event.addListener(map, "dragend", async function () {
        const level = map.getLevel();

        let buffer = 0;
        if (level > 5) return;

        // 줌 레벨에 따른 버퍼 설정
        if (level == 5) buffer = 2500;
        else if (level == 4) buffer = 1300;
        else if (level == 3) buffer = 700;
        else if (level == 2) buffer = 300;
        else if (level == 1) buffer = 160;

        const center = map.getCenter();
        const lat = center.getLat();
        const lng = center.getLng();
        updateURL({ curLat: lat, curLng: lng, estateNo: "" }); // url 파라미터 및 쿠키 변경
        let point = `POINT(${lng} ${lat})`;

        // 지도 바운드
        var bounds = map.getBounds();
        var sw = bounds.getSouthWest(); // 남서쪽 좌표
        var ne = bounds.getNorthEast(); // 북동쪽 좌표
        var boxString = `BOX(${sw.getLng()},${sw.getLat()},${ne.getLng()},${ne.getLat()})`; // BOX 형식으로 변환
        // console.log(boxString);

        const geomFilter = point;
        // const realPriceApart = await showRealPrice(geomFilter, buffer); // 실거래가 가져오는 함수
    });

    // [EVENT] 지도가 드래그된 후 이벤트 처리
    kakao.maps.event.addListener(map, "zoom_changed", async function () {
        const level = map.getLevel();
        console.log("줌 레벨: ", level);
        updateURL({ curZoom: level, estateNo: "" });
    });

    // [EVENT] 지도가 클릭 이벤트 처리
    kakao.maps.event.addListener(map, "click", async function (mouseEvent) {
        // 좌표
        const lat = mouseEvent.latLng.Ma;
        const lng = mouseEvent.latLng.La;
        updateURL({ curLat: lat, curLng: lng, estateNo: "" }); // url 파라미터 및 쿠키 변경

        // 리스트를 부드럽게 나타나게 함
        if (
            $(".mcs-list")
                .children("dl")
                .filter(function () {
                    return $(this).css("display") === "none";
                }).length > 0
        ) {
            $(".mcs-list")
                .children("dl")
                .hide() // 먼저 숨긴 상태에서
                .delay(150) // 일정 시간 지연
                .fadeIn(400); // 부드럽게 나타나게 설정
        }
    });

    // [EVENT] 지도 타일 이미지 로드가 모두 완료 훟 이벤트 처리
    kakao.maps.event.addListener(map, "tilesloaded", function () {
        // 매물번호를 검색하여 지도가 이동됐을 때는 전체검색 중단
        if (searchEstateNo) {
            return;
        }
        // $(".mcs-list").empty();
        removeMarker(contentsMarkers);
        //estateList();
        estateNewList();
    });
}

// 매물 수 표시 함수
const totalMarker = (className, sale_classifi, tran_method, count) => {
    let typeName = "";
    let backgroundColor = "background: rgba(240, 101, 72, 1)";
    let colorCode = "rgba(240, 101, 72, 1)";

    // 매물 종류에 따라 분류
    switch (sale_classifi) {
        case "SC01":
        case "SC02":
            typeName = "공장";
            break;
        case "SC03":
            typeName = "창고";
            break;
        case "SC04":
            typeName = "토지";
            break;
        case "SC05":
            typeName = "상가";
            break;
        case "SC06":
            typeName = "지산";
            break;
        default:
            typeName = "기타";
            break;
    }

    // 매매 방식에 따른 배경색 설정
    if (tran_method === "TM02") {
        backgroundColor = "background: rgba(57, 144, 238, 1)";
        colorCode = "rgba(57, 144, 238, 1)";
    }

    // 매물 수 표시하는 클러스터 마커
    return `
        <div class="${className}" style="position: relative; flex-grow:1; display:flex; justify-content:center; align-items:center; width: 55px; height: 55px; ${backgroundColor}; border-radius: 50%; z-index:${className === "overList" ? 1100 : 1000}">
            <span style="display:block; margin:0 auto; font-size: 12px;text-align: center;color: rgba(255, 255, 255, 1);">${typeName}</span>
            <span style="display:block; width:20px; height:20px; position: absolute; top:-6px; right:-6px; line-height:normal; font-size: 10px; border-radius:50%; border: 1px solid ${colorCode}; background:transparent; color:${colorCode}; background:white; display:flex; justify-content: center; flex-wrap: wrap; align-content: center;">${count}</span>
        </div>
    `;
};

// 매물의 세부 정보 표시 함수
const tradeMarkerEl = (className, sale_classifi, tran_method, tran_method_comment, sell_price, deposit, month_rent, exclusive_building) => {
    let typeName = "";
    let backgroundColor = "background: rgba(240, 101, 72, 1);";
    let price_phrase = tran_method === "TM01" ? convertAmount(sell_price) : month_rent;

    switch (sale_classifi) {
        case "SC01":
        case "SC02":
            typeName = "공장";
            break;
        case "SC03":
            typeName = "창고";
            break;
        case "SC04":
            typeName = "토지";
            break;
        case "SC05":
            typeName = "상가";
            break;
        case "SC06":
            typeName = "지산";
            break;
        default:
            typeName = "기타";
            break;
    }

    if (tran_method === "TM02") {
        backgroundColor = "background: rgba(57, 144, 238, 1);";
    }

    let firstDivContents = `<div class="${className}" style="width: 55px; height: 55px; ${backgroundColor} border-radius: 50%; z-index:${className === "overList" ? 10100 : 10000}">`;

    if (exclusive_building === "Y") {
        return (
            firstDivContents +
            `<span style="display:block; margin:0 auto; font-size: 12px;padding-top: 5px;line-height: 14.32px;text-align: center;color: rgba(255, 255, 255, 1);">${typeName}</span>` +
            `<span style="display:block; margin:0 auto; font-size: 16px;line-height: 19.09px;text-align: center;color: rgba(255, 255, 255, 1);">${price_phrase}</span>` +
            `<div><div style="border-top: 0.8px solid rgba(255, 255, 255, 1); width:48px; margin:0 auto"></div><span style="display:block; margin:0 auto; font-size: 10px;line-height: 11.93px;text-align: center;color: rgba(255, 255, 255, 1); padding-top:2px">전속</span></div>` +
            "</div>"
        );
    } else {
        return (
            firstDivContents +
            `<div style="width:100%; height:100%; display:flex; flex-direction: column; justify-content: center;">` +
            `<span style="display:block; margin:0 auto; font-size: 12px; line-height: 14.32px;text-align: center;color: rgba(255, 255, 255, 1);">${typeName}</span>` +
            `<span style=" display:block; margin:0 auto; font-size: 14px;line-height: 19.09px;text-align: center;color: rgba(255, 255, 255, 1);">${price_phrase}</span>` +
            `</div>` +
            "</div>"
        );
    }
};

function toolbox() {
    // 도형 스타일을 변수로 설정합니다
    var strokeColor = "#39f",
        fillColor = "#cce6ff",
        fillOpacity = 0.5,
        hintStrokeStyle = "dash";

    var options = {
        // Drawing Manager를 생성할 때 사용할 옵션입니다
        map: map, // Drawing Manager로 그리기 요소를 그릴 map 객체입니다
        drawingMode: [
            kakao.maps.Drawing.OverlayType.MARKER,
            kakao.maps.Drawing.OverlayType.ARROW,
            kakao.maps.Drawing.OverlayType.POLYLINE,
            kakao.maps.Drawing.OverlayType.RECTANGLE,
            kakao.maps.Drawing.OverlayType.CIRCLE,
            kakao.maps.Drawing.OverlayType.ELLIPSE,
            kakao.maps.Drawing.OverlayType.POLYGON,
        ],
        // 사용자에게 제공할 그리기 가이드 툴팁입니다
        // 사용자에게 도형을 그릴때, 드래그할때, 수정할때 가이드 툴팁을 표시하도록 설정합니다
        guideTooltip: ["draw", "drag", "edit"],
        markerOptions: {
            draggable: true,
            removable: true,
        },
        arrowOptions: {
            draggable: true,
            removable: true,
            strokeColor: strokeColor,
            hintStrokeStyle: hintStrokeStyle,
        },
        polylineOptions: {
            draggable: true,
            removable: true,
            strokeColor: strokeColor,
            hintStrokeStyle: hintStrokeStyle,
        },
        rectangleOptions: {
            draggable: true,
            removable: true,
            strokeColor: strokeColor,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
        },
        circleOptions: {
            draggable: true,
            removable: true,
            strokeColor: strokeColor,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
        },
        ellipseOptions: {
            draggable: true,
            removable: true,
            strokeColor: strokeColor,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
        },
        polygonOptions: {
            draggable: true,
            removable: true,
            strokeColor: strokeColor,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
        },
    };

    // 위에 작성한 옵션으로 Drawing Manager를 생성합니다
    manager = new kakao.maps.Drawing.DrawingManager(options);

    // 그리기 관련 이벤트 등록 =================================

    // 그리기 시작 시 발생하는 이벤트
    manager.addListener("drawstart", function (data) {
        // console.log("그리기 시작: ", data);
        // 모든 a 요소의 active 클래스를 제거
        // $("#draw_toolbox a").removeClass("active");
    });

    // 그리기 진행 중 마우스 이동 시 발생하는 이벤트
    // manager.addListener("draw", function (data) {
    //     console.log("그리기 중: ", data);
    // });

    // 그리기가 완료되었을 때 발생하는 이벤트
    manager.addListener("drawend", function (data) {
        // console.log("그리기 끝: ", data);

        // 모든 span의 background-position을 원래대로 복원
        var allSpans = document.querySelectorAll("#draw_toolbox a span");
        allSpans.forEach(function (span) {
            var originalPosition = span.getAttribute("data-original-position");
            if (originalPosition) {
                span.style.backgroundPosition = originalPosition;
            } else {
                span.style.backgroundPosition = "0px 0px";
            }

            // data-moved 상태를 false로 변경
            span.setAttribute("data-moved", "false");
        });

        // 모든 a 요소에서 active 클래스를 제거
        $("#draw_toolbox a").removeClass("active");
    });

    // 그리기가 취소되었을 때 발생하는 이벤트
    manager.addListener("cancel", function (e) {
        // console.log("그리기 취소: ", e.overlayType);

        // 모든 span의 background-position을 원래대로 복원
        var allSpans = document.querySelectorAll("#draw_toolbox a span");
        allSpans.forEach(function (span) {
            var originalPosition = span.getAttribute("data-original-position");
            if (originalPosition) {
                span.style.backgroundPosition = originalPosition;
            } else {
                span.style.backgroundPosition = "0px 0px";
            }

            // data-moved 상태를 false로 변경
            span.setAttribute("data-moved", "false");
        });

        // 모든 a 요소에서 active 클래스를 제거
        $("#draw_toolbox a").removeClass("active");
    });

    // 그리기 상태가 변경되었을 때 발생하는 이벤트 (생성, 수정, 삭제 등)
    // manager.addListener("state_changed", function () {
    //     console.log("그리기 상태 변경");
    // });

    var toolboxAdded = false; // 툴박스가 추가된 상태인지 여부를 저장하는 변수

    // 버튼 클릭 시 툴박스를 나타내거나 숨기는 기능
    document.getElementById("draw_tool_btn").addEventListener("click", function () {
        if (!toolboxAdded) {
            $("#draw_toolbox").show();
            toolboxAdded = true;
        } else {
            $("#draw_toolbox").hide();
            toolboxAdded = false;

            // 현재 진행 중인 그리기 작업을 취소
            manager.cancel();
        }
    });
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

/* =================================================================
 * helper 관련 함수
 * ================================================================= */

/**
 * 좌표가 대한민국 내의 유효한 좌표인지 확인하는 함수
 * @param {string|number} lat - 위도
 * @param {string|number} lng - 경도
 * @returns {boolean}
 */
function areValidCoordinatesInKorea(lat, lng) {
    const isLatValid = isValidCoordinate(lat) && lat >= 33.0 && lat <= 43.0;
    const isLngValid = isValidCoordinate(lng) && lng >= 124.0 && lng <= 132.0;
    return isLatValid && isLngValid;
}

/**
 * 좌표가 유효한지 확인하는 함수
 * @param {*} value
 * @returns
 */
function isValidCoordinate(value) {
    return value !== null && value !== undefined && value !== "" && !isNaN(value);
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
        return comma(convertSquareMetersToPyeong(area)) + "원/평"; // 현재 단위가 평일 경우 포맷
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

function addContentsMarker(data, estateTypeClass) {
    const latlng = new kakao.maps.LatLng(data.lat, data.lng);

    let priceHtml = "";
    switch (data.sale_type) {
        case "임대":
            priceHtml = `${formatPrice(data.rent_price, "only-uk")}`;
            break;
        case "매매":
            priceHtml = `${formatPrice(data.sale_price, "only-uk")}`;
            break;
        case "교환":
            priceHtml = `${formatPrice(data.sale_price, "only-uk")}`;
            break;
    }

    var iwContent = document.createElement("div");
    iwContent.className = `estate-marker ${estateTypeClass}`;
    iwContent.style.padding = "5px";
    iwContent.innerHTML = `
        <ul class="text-center bg-white border border-danger overflow-hidden" style="min-width:55px; border-radius:10px;">
            <li class="up bg-white p-1">
                <span class="number">${data.estate_type}</span>
            </li>
            <li class="text-white p-1" style="background-color:var(--var-color-main-1)">
                <span class="number">${priceHtml}</span>
            </li>
        </ul>
        <p class="position-absolute" style="margin:-5px 0 0 20px;">
            <img src="/front/assets/image/icn_arr_mark.svg" width="15" alt="" title="">
        </p>
    `;

    // iwContent에 클릭 이벤트 추가
    iwContent.addEventListener("click", function () {
        console.log("아이템 클릭됨:", data); // 로그 출력
    });

    // 커스텀 오버레이를 생성합니다
    var customOverlay = new kakao.maps.CustomOverlay({
        clickable: true,
        content: iwContent,
        map: map,
        position: latlng,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 1,
    });

    // 커스텀 오버레이를 지도에 표시합니다
    // customOverlay.setMap(map);

    // 오버레이를 배열에 추가하여 관리
    customOverlays.push(customOverlay);

    // 클러스터러에 커스텀 오버레이를 추가
    clusterer.addMarker(customOverlay);
}

// 버튼 클릭 시 호출되는 핸들러 입니다
function selectOverlay(element, type) {
    // 이미 활성화된 버튼인지 확인
    var isActive = element.classList.contains("active");

    // 모든 a 요소의 active 클래스 제거
    $("#draw_toolbox a").removeClass("active");

    // 만약 활성화된 상태에서 다시 클릭되었으면 취소하고 return
    if (isActive) {
        // 텍스트 모듈 중지
        textModule.stop(); // 텍스트 입력 중지
        manager.cancel(); // 다른 그리기 작업 취소

        // 클릭된 element 하위의 span을 원래의 background-position 값으로 복원
        var span = element.querySelector("span");
        var originalPosition = span.getAttribute("data-original-position");
        if (originalPosition) {
            span.style.backgroundPosition = originalPosition; // 원래 배경 위치로 복원
        }

        return; // 함수 종료
    }

    // 그리기 중이면 그리기를 취소합니다
    manager.cancel();

    if (type == "TEXT") {
        // 텍스트 입력 시작
        textModule.start();
    } else {
        // 클릭한 그리기 요소 타입을 선택합니다
        manager.select(kakao.maps.drawing.OverlayType[type]);
        textModule.stop(); // 텍스트 입력 중지
    }

    // #draw_toolbox 내 모든 a 요소의 span을 0px로 초기화 (y값 유지)
    var allSpans = document.querySelectorAll("#draw_toolbox a span");
    allSpans.forEach(function (span) {
        // 기존 background-position 값을 가져오기 (y값 유지)
        var currentPosition = getComputedStyle(span).backgroundPosition.split(" ");
        var newPositionY = currentPosition[1]; // y 값은 그대로 유지

        // 원래의 background-position 값을 저장
        if (!span.getAttribute("data-original-position")) {
            span.setAttribute("data-original-position", span.style.backgroundPosition || "0px " + newPositionY);
        }

        // x 값을 0으로 설정
        span.style.backgroundPosition = "0px " + newPositionY;
        span.setAttribute("data-moved", "false"); // 상태를 'false'로 변경
    });

    // element 하위의 span 요소 선택
    var span = element.querySelector("span");

    if (span) {
        // 현재 background-position 값을 가져오기
        var currentPosition = getComputedStyle(span).backgroundPosition.split(" ");

        // 현재 상태를 data 속성으로 관리 (isMoved 상태를 data-moved로 저장)
        var isMoved = span.getAttribute("data-moved") === "true";

        if (!isMoved) {
            // background-position의 x 값을 -30px로 이동
            var newPositionX = parseInt(currentPosition[0], 10) - 30 + "px";
            var newPositionY = currentPosition[1]; // y 값은 그대로 유지

            // 새로운 background-position 적용
            span.style.backgroundPosition = newPositionX + " " + newPositionY;

            span.setAttribute("data-moved", "true"); // 상태를 'true'로 변경
        } else {
            // background-position을 원래 값으로 복구
            var originalPosition = span.getAttribute("data-original-position");
            span.style.backgroundPosition = originalPosition;

            span.setAttribute("data-moved", "false"); // 상태를 'false'로 변경
        }
    }

    // 선택된 버튼에 active 클래스 추가
    element.classList.add("active");
}

/**
 * 그리기 모드 전환 함수
 * @param {*} button
 * @param {*} type
 * @returns
 */
function cancelDrawingMode(button, type) {
    if ($(button).hasClass("active")) {
        $(".mo-tool-option button").removeClass("active");
        lineDrawer.cancelDrawingMode(button);
        polygonDrawer.cancelDrawingMode(button);
        circleDrawer.cancelDrawingMode(button);
        return;
    }

    $(".mo-tool-option button").removeClass("active");
    lineDrawer.cancelDrawingMode(button);
    polygonDrawer.cancelDrawingMode(button);
    circleDrawer.cancelDrawingMode(button);

    if (type == "line") {
        lineDrawer.toggleDrawingMode(button);
    } else if (type == "polygon") {
        polygonDrawer.toggleDrawingMode(button);
    } else if (type == "circle") {
        circleDrawer.onStartDrawing(button);
    }
}

/**
 * 지도위 거리/면적 제거
 */
function resetDrawing() {
    lineDrawer.clearAllLines(); // 선 모두 제거
    polygonDrawer.clearPolygon(); // 다각형 모두 제거
    circleDrawer.removeAllCircles(); // 원 모두 제거
}

/**
 * 모달 초기화 함수
 */
function initModal() {
    // 모달 - 필터 //
    $("#modalSellFilter").iziModal({ width: "350px" });
    $("#modalSellFilter").iziModal("setTop", 130);
    $("#modalSellFilter").iziModal("setBottom", 130);

    // 모달 - 알림
    initializeModal("#modalAlert", "/front/assets/lottie/save.json", "#lottieConfirm");

    // 모달 설정 함수
    function initializeModal(modalId, lottiePath, lottieContainerId) {
        $(modalId).iziModal({
            width: "470px",
            onOpened: function (modal) {},
        });

        // Lottie 애니메이션 로드
        var animation = bodymovin.loadAnimation({
            container: document.querySelector(lottieContainerId),
            renderer: "svg",
            loop: true,
            autoplay: true,
            path: lottiePath,
        });
    }
}
