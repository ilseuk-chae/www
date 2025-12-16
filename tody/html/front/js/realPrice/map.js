const mapContainer = document.getElementById("map_bg"); // 지도를 표시할 div
let geocoder = new kakao.maps.services.Geocoder(); // 주소-좌표 변환 객체를 생성합니다
let ps = new kakao.maps.services.Places(); // 장소 검색 객체를 생성합니다
let map; // 맵
let infowindow; // 인포윈도우
let clusterer; // 클러스터
let contentsMarkers = []; // 컨텐츠 마커 배열 정의
let marker = new kakao.maps.Marker(); // 클릭한 위치를 표시할 마커입니다
let markers = []; // 클릭, 선택된 마커 배열 정의
let realPriceMarkers = []; // 클릭, 선택된 마커 배열 정의
let historyMarkers = []; // 최근 이력 마커 배열 정의
let currentUnit = "m2"; // 현재 단위를 추적
let previousLat = new URLSearchParams(window.location.search).get("curLat");
let previousLng = new URLSearchParams(window.location.search).get("curLng");
let isMultiSelectMode = false; // 다중 선택 모드 여부를 추적
let selectedPolygons = []; // 선택된 폴리곤 배열 (사용 X)
let buildingPolygons = []; // 건물 폴리곤 배열
let landPolygons = []; // 지적도 폴리곤 배열
let landPolygonsMiniMap = []; // 지적도 폴리곤 배열(미니맵)
let analysisPolygonArray = []; // 분석주제도 폴리곤 배열
let landWFSArrays = []; // 합필분석 지적도WFS 배열
let isLoading = false; // 현재 비동기 작업이 진행 중인지 추적하기 위한 플래그
let manager = null; // Drawing manager
let circleDrawer = null; // 원 반경 모듈
let lineDrawer = null; // 직선 거리 모듈
let polygonDrawer = null; // 다각형 거리 모듈
var textModule = null; // 텍스트 입력 모듈 상태를 저장하는 변수
var currentOverlay = null; // 지도 오버레이(ex. 생태자연도)
let existingBounds = []; // 기존 오버레이의 경계들을 추적
let currentOverlays = []; // 현재 오버레이 목록을 저장
let isMapClickable = true; // 지도 클릭 가능 여부
let textModuleControl = null; // 텍스트 모듈
let realPriceOverlays = []; // 실거래가 오버래이 저장 배열
const flag = false; // 경계용 플래그  true:EPSG:5179 경계용, false:EPSG:4326 
let boundaryFlag= false; // 행정경계 표시 여부 플래그

let hoverTimer = null;             // 마우스가 멈춰있는지 감지하는 타이머 ID
let lastHoverLatLng = null;        // 마지막으로 마우스가 멈췄다고 감지된 LatLng
const HOVER_DELAY_MS = 500;       // 마우스 멈춤 감지 시간 (1.초)
let isHoverDrawingPending = false; // 현재 호버 폴리곤 그리기가 예약되었는지 여부
/*===========================================
*  실거래가 폴리곤 모드 설절 플래그
*============================================*/
const REALPRICE_POLYGON_MODE = 3; // 1: 원모드, 2: multi 모드, 3: auto 모드

$(document).ready(function () {

    //console.log("***** REALPRICE_POLYGON_MODE:",REALPRICE_POLYGON_MODE);
    initProj4();
    initializeMap(); // 지도 초기화
    handleMapEvents(); // 지도 이벤트

    // URL 변경 감지 이벤트
    window.addEventListener("popstate", function (e) {
        handleUrlChange();
    });

    // 테스트용 코드 (현재는 동작하지 않음)
    $("#mapHistoryOpen").on("click", function () {
        return;
        const center = map.getCenter();
        searchAddrFromCoords(center, async function (result, status) {
            if (status === kakao.maps.services.Status.OK) {
                const url = "/front/back/realPrice/test.php";
                const deal_ymd = "202407";

                for (var i = 0; i < result.length; i++) {
                    // // 행정동의 region_type 값은 'H' 이므로
                    // if (result[i].region_type === "H") {
                    //     let lawd_cd = result[i].code;
                    //     lawd_cd = lawd_cd.substring(0, 5);
                    //     const result = await callApi("POST", url, { lawd_cd, deal_ymd });
                    //     break;
                    // }
                    console.log(result);

                    // 행정동의 region_type 값은 'H' 이므로
                    if (result[i].region_type == "B") {
                        let lawd_cd = result[i].code;

                        lawd_cd = lawd_cd.substring(0, 5);
                        const response = await callApi("POST", url, { lawd_cd, deal_ymd });

                        if (response.success && response.file_path) {
                            // 파일을 다운로드할 링크를 생성
                            const downloadLink = document.createElement("a");
                            downloadLink.href = response.file_path;
                            downloadLink.download = "land_trade_data.csv";
                            document.body.appendChild(downloadLink);
                            downloadLink.click();
                            document.body.removeChild(downloadLink);
                        } else {
                            console.error("파일 생성에 실패했습니다.");
                        }
                        return;

                        if (response.header.resultMsg && response.header.resultMsg === "OK") {
                            const item = response.body.items.item;
                        }
                        break;
                    }
                }
            }
        });
    });

    // 지도 출력 버튼 클릭 시 실행되는 테스트용 코드 (현재는 동작하지 않음)
    $("#printBtn").on("click", function () {
        return;
        const center = map.getCenter();
        searchAddrFromCoords(center, async function (result, status) {
            if (status === kakao.maps.services.Status.OK) {
                const url = "/front/back/realPrice/download_realPrice_apartment.php";
                const deal_ymd = "202407";

                for (var i = 0; i < result.length; i++) {
                    // // 행정동의 region_type 값은 'H' 이므로
                    // if (result[i].region_type === "H") {
                    //     let lawd_cd = result[i].code;
                    //     lawd_cd = lawd_cd.substring(0, 5);
                    //     const result = await callApi("POST", url, { lawd_cd, deal_ymd });
                    //     break;
                    // }
                    console.log(result);

                    // 행정동의 region_type 값은 'H' 이므로
                    if (result[i].region_type == "B") {
                        let lawd_cd = result[i].code;

                        lawd_cd = lawd_cd.substring(0, 5);
                        const response = await callApi("POST", url, { lawd_cd, deal_ymd });

                        if (response.success && response.file_path) {
                            // 파일을 다운로드할 링크를 생성
                            const downloadLink = document.createElement("a");
                            downloadLink.href = response.file_path;
                            downloadLink.download = "land_trade_data.csv";
                            document.body.appendChild(downloadLink);
                            downloadLink.click();
                            document.body.removeChild(downloadLink);
                        } else {
                            console.error("파일 생성에 실패했습니다.");
                        }
                        return;

                        if (response.header.resultMsg && response.header.resultMsg === "OK") {
                            const item = response.body.items.item;
                        }
                        break;
                    }
                }
            }
        });
    });
});

function initProj4() {
    proj4.defs("EPSG:5186", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs");
    if(flag){
        proj4.defs("EPSG:5179", "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    }
    else{
        //(org)
        proj4.defs("EPSG:5179", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs");
    }
    // proj4.defs("EPSG:5179", "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +towgs84=0,0,0 +no_defs");
    proj4.defs("EPSG:5178", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=600000 +y_0=200000 +ellps=GRS80 +units=m +no_defs");
    proj4.defs("EPSG:5176", "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs");
    // proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
    proj4.defs("EPSG:3857", "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs");
}

/**
 * 지도 이벤트를 처리하는 함수
*/
function handleMapEvents() {

    let fetchTimeout; // 디바운스 타이머
/*
    kakao.maps.event.addListener(map, 'idle', function() {
        //console.log(`[${new Date().toLocaleTimeString()}] 지도 idle 이벤트 발생!`);
        //console.trace('idle 이벤트 호출 스택:');
        if (REALPRICE_POLYGON_MODE == 1) {
            debouncedFetchRealPriceApt();
        } else if (REALPRICE_POLYGON_MODE == 2) {
            debouncedFetchRealPriceAptArray();
        } else if (REALPRICE_POLYGON_MODE == 3) {
            debouncedFetchRealPriceAptArrayWithCash();
        }
    });
*/
    // [EVENT] 지도가 줌인 줌아웃 후 이벤트 처리
    kakao.maps.event.addListener(map, "dragend", async function () {

        //debouncedFetchRealPrice(map); // 맵 객체를 인자로 전달 (혹은 함수가 필요한 다른 인자들)
/*        
        if (REALPRICE_POLYGON_MODE == 1) {
            debouncedFetchRealPriceApt();
        } else if (REALPRICE_POLYGON_MODE == 2) {
            debouncedFetchRealPriceAptArray();
        } else if (REALPRICE_POLYGON_MODE == 3) {
            debouncedFetchRealPriceAptArrayWithCash();
        }
*/
        const level = map.getLevel();

        let buffer = 0;
        if (level > 6) return;  // 5레벨 이하에서만 처리  //zoomLevel 변경 5->6

        // 줌 레벨에 따른 버퍼 설정
        //if (level == 5) buffer = 2500;
        if (level == 5 || level == 6) buffer = 2500;  //zoomLevel 변경
        else if (level == 4) buffer = 1300;
        else if (level == 3) buffer = 700;
        else if (level == 2) buffer = 300;
        else if (level == 1) buffer = 160;

        const center = map.getCenter();
        const lat = center.getLat();
        const lng = center.getLng();
        updateURL({ curLat: lat, curLng: lng }); // url 파라미터 및 쿠키 변경
        let point = `POINT(${lng} ${lat})`;

        // 지도 바운드
        // var bounds = map.getBounds();
        // var sw = bounds.getSouthWest(); // 남서쪽 좌표
        // var ne = bounds.getNorthEast(); // 북동쪽 좌표
        // var boxString = `BOX(${sw.getLng()},${sw.getLat()},${ne.getLng()},${ne.getLat()})`; // BOX 형식으로 변환
        // console.log(boxString);
        // const geomFilter = point;
        // const realPriceApart = await showRealPrice(geomFilter, buffer); // 실거래가 가져오는 함수
    });

    // [EVENT] 지도가 드래그된 후 이벤트 처리
    kakao.maps.event.addListener(map, "zoom_changed", async function () {

        //debouncedFetchRealPrice(map); // 맵 객체를 인자로 전달
/*        
        if (REALPRICE_POLYGON_MODE == 1) {
            debouncedFetchRealPriceApt();
        } else if (REALPRICE_POLYGON_MODE == 2) {
            debouncedFetchRealPriceAptArray();
        } else if (REALPRICE_POLYGON_MODE == 3) {
            debouncedFetchRealPriceAptArrayWithCash();
        }
*/
        // 기존 오버레이 제거
        realPriceOverlays.forEach((overlay) => overlay.setMap(null));
        realPriceOverlays = []; // 배열 초기화

        // 모든 클러스터러 초기화
        Object.values(clusterersByType).forEach((clusterer) => {
            // clusterer가 null 또는 undefined가 아닐 때만 clear() 호출
            if (clusterer) {
                clusterer.clear();
            }
        });

        const center = map.getCenter();
        const level = map.getLevel();
        console.log("줌 레벨: ", level);

        updateURL({ curZoom: level });

        // geocoder.coord2RegionCode(center.getLng(), center.getLat(), function (result, status) {
        //     if (status === kakao.maps.services.Status.OK) {
        //         let sggCd = result[0].code.substring(0, 10);
        //         if (level <= "3") {
        //         } else if (level == "4") {
        //             sggCd = result[0].code.substring(0, 7);
        //         } else if (level == "5") {
        //             sggCd = result[0].code.substring(0, 6);
        //         } else if (level > "5") {
        //             sggCd = result[0].code.substring(0, 5);
        //         }
        //         console.log(sggCd);

        //         realPriceApt(sggCd);
        //     }
        // });

        // if (level > 5) {
        //     realPriceOverlays.forEach((overlay) => overlay.setVisible(false));
        // } else {
        //     // realPriceOverlays.forEach((overlay) => overlay.setVisible(true));
        // }
    });

    
    kakao.maps.event.addListener(map, "dblclick", async function (mouseEvent) {});

    // [EVENT] 지도가 클릭 이벤트 처리
    kakao.maps.event.addListener(map, "click", async function (mouseEvent) {
        // ⭐ 호버 타이머가 있다면 취소하고, 클릭 폴리곤 그리기를 실행
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
        isHoverDrawingPending = false; // pending 상태 초기화
        // 클릭 차단
        // if (!isMapClickable) return;
        if ($(".mo-tool-option button").hasClass("active")) return;
        if ($("#draw_toolbox a").hasClass("active")) return;

        // 좌표
        const clickLatLng = mouseEvent.latLng;
        const lat = mouseEvent.latLng.Ma;
        const lng = mouseEvent.latLng.La;
        const coords = { lat: lat, lng: lng };
        updateURL({ curLat: lat, curLng: lng }); // url 파라미터 및 쿠키 변경

        const level = map.getLevel();
        if (level < 5) {                    //zoomLevel 6->5
            // 건물 및 토지 정보를 동시에 가져오기
            handleMapClick(coords);

            // 주변 시설 정보 가져오기
            searchArroundPlaces(coords);
        }
        else {
            //clickCoordTodisplayAddress(coords);
        }

        // 주소 요청
        searchDetailAddrFromCoords(mouseEvent.latLng, function (result, status) {
            if (status === kakao.maps.services.Status.OK) {
                const addressData = result[0].address;
                // 토지 실거래가 조회 및 바인딩
                realPriceDetailLand("land", addressData);
            }

            // 지도 주소 정보 바인딩
            displayAddressInfo(result, status);
        });

        // 신규 추가 행정 경계 폴리곤 클릭 처리 함수 호출
        //console.log(`지도 클릭: 위도 ${clickLatLng.getLat()}, 경도 ${clickLatLng.getLng()}`);
        if(boundaryFlag == true || boundaryFlag == "true"){
            await handleMapClickForPolygon(map, clickLatLng);
        }

        // searchAddrFromCoords(mouseEvent.latLng, function (result, status) {
        //     let miniMapCoords = null;
        //     if (status === kakao.maps.services.Status.OK) {
        //         for (var i = 0; i < result.length; i++) {
        //             // 법정동의 region_type 값은 'B' 이므로
        //             if (result[i].region_type == "B") {
        //                 console.log(result);
        //                 miniMapCoords = new kakao.maps.LatLng(result[i].y, result[i].x);
        //             }
        //         }
        //     } else {
        //         miniMapCoords = mouseEvent.latLng;
        //     }

        //     miniMap.setCenter(miniMapCoords); // 미니맵 위치 변경
        // });
    });

    // ⭐ 지도 마우스 이동(mousemove) 이벤트 리스너 등록
    kakao.maps.event.addListener(map, 'mousemove', function(mouseEvent) {
        const currentLatLng = mouseEvent.latLng;

        // 마우스가 이전 위치와 충분히 다르게 움직였는지 확인 (미세한 떨림 방지)
        // LatLng 객체 자체 비교는 부정확할 수 있으므로, 위경도 값의 차이로 판단
        const hasMovedSignificantly = !lastHoverLatLng ||
            Math.abs(currentLatLng.getLat() - lastHoverLatLng.getLat()) > 0.000001 || // 0.000001은 대략 0.1미터 미만의 거리
            Math.abs(currentLatLng.getLng() - lastHoverLatLng.getLng()) > 0.000001;

        if (hasMovedSignificantly) {
            // 마우스가 움직였으므로 기존 타이머 취소
            if (hoverTimer) {
                clearTimeout(hoverTimer);
                hoverTimer = null;
            }
            isHoverDrawingPending = false; // pending 상태 초기화

            lastHoverLatLng = currentLatLng; // 새로운 현재 위치 저장

            // 새로운 위치에서 1.5초 후 폴리곤을 그리기 위한 타이머 시작
            hoverTimer = setTimeout(async () => {
                if (!isHoverDrawingPending) { // 이전에 이미 그리기 요청이 대기 중이지 않은 경우에만
                    
                    isHoverDrawingPending = true; // 그리기 요청이 시작됨을 표시

                    // 기존 폴리곤을 지우고 새로운 폴리곤을 그리는 로직 호출
                    // (클릭 이벤트와 동일한 handleMapClickForPolygon 함수 재활용)
                    // (또는 호버 전용 함수를 만들어 현재HoverPolygons에만 영향을 주게 할 수 있습니다.)
                    if(boundaryFlag == true || boundaryFlag == "true"){
                        await handleMapClickForPolygon(map, currentLatLng); // ⭐ 중요: 기존 함수 재활용
                    }
                    isHoverDrawingPending = false; // 그리기 완료 또는 에러 발생 후 pending 해제
                }
                hoverTimer = null; // 타이머 실행 후 초기화
            }, HOVER_DELAY_MS);
        }
    });

    // ⭐ (선택 사항) 마우스가 지도를 벗어났을 때 타이머 취소
    kakao.maps.event.addListener(map, 'mouseout', function() {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
        isHoverDrawingPending = false;
        // ⭐ 마우스 아웃 시 호버 폴리곤을 지우고 싶다면 아래 코드 추가
        // clearAdministrativePolygons(); // 모든 폴리곤 및 라벨 제거 (클릭 폴리곤도 지워짐)
        // 또는 특정 호버 폴리곤만 제거하는 함수를 따로 구현 (예: clearHoverPolygons())
    });

    // 지도에서 idle 이벤트가 발생할 때마다 오버레이를 갱신
    // `tilesloaded` 이벤트는 지도 처음 로딩 및 줌 레벨 변경 시 발생하지만,
    // 데이터 로딩은 `idle` 이벤트에서 전담하도록 하는 것이 더 명확합니다.
    // 따라서 여기서 `fetchRealPriceAptArrayBasedOnMapCenter()` 호출은 제거합니다.
    // 초기 데이터 로딩은 맵 로드 완료 시 단 한 번만 호출하면 됩니다.
    /*
    kakao.maps.event.addListener(map, "tilesloaded", async function () {

        // 맵 타일이 로드될 때도 기존처럼 호출
        // 기존 동단위 호출
        //fetchRealPriceAptBasedOnMapCenter();

        // 개선된 다중 sggCd 호출(현재는 중앙 + 4군데)
    //    fetchRealPriceAptArrayBasedOnMapCenter();
        /*
        //const center = map.getCenter();
        const level = map.getLevel();
        if (level > 6) return;

        geocoder.coord2RegionCode(center.getLng(), center.getLat(), function (result, status) {
            if (status === kakao.maps.services.Status.OK) {
                let sggCd = result[0].code.substring(0, 10);
                if (level <= "3") {
                } else if (level == "4") {
                    sggCd = result[0].code.substring(0, 10);
                } else if (level == "5") {
                    sggCd = result[0].code.substring(0, 10);
                } else if (level == "6") {
                    sggCd = result[0].code.substring(0, 8);
                } else if (level > "6" && level < "9") {
                    sggCd = result[0].code.substring(0, 5);
                } else if (level >= "9") {
                    sggCd = result[0].code.substring(0, 2);
                }
                realPriceApt(sggCd);
            }
        });
       /
    });
    */
}

/**
 * UI에서 부동산 유형 필터의 선택 상태를 읽어 `currentEstateTypes` 전역 변수를 갱신합니다.
 * onedol님 프로젝트의 UI 요소에 맞춰 이 함수를 구현해야 합니다.
 */
function updateEstateTypeFiltersFromUI() {
    const newEstateTypes = []; // 임시 배열

    const allToggleButton = $('.realmap-estate-group button').eq(0); // 첫 번째 버튼을 '전체' 버튼으로 간주
    const isAllActive = allToggleButton.hasClass("active"); // '전체' 버튼이 활성화된 상태인지 확인

    if (isAllActive) {
        // '전체' 버튼이 활성화된 경우, 모든 부동산 유형을 명시적으로 추가
        // // 여기서 '전체' 버튼을 눌렀을 때만 실행되므로 중복될 일이 없습니다.
        newEstateTypes.push("apt", "multi", "officetel", "land"); // 일괄 푸시
    } else {
        // '전체' 버튼이 비활성화된 경우, 활성화된 개별 유형 버튼들만 확인
        // 주의: 첫 번째 버튼(전체 버튼)은 여기 루프에서 제외해야 합니다.
        $('.realmap-estate-group button.active').not(allToggleButton).each(function () {
            const btn_text = $(this).text().trim();
            // 개별 유형 버튼의 텍스트를 이용해 값을 추가
            newEstateTypes.push(estateTypeToValue(btn_text));
        });
    }

    // 만약 아무것도 선택되지 않았다면 기본값으로 모두 포함하도록 설정
    if (newEstateTypes.length === 0) {
        currentEstateTypes = ['apt', 'multi', 'officetel', 'land'];
    } else {
        currentEstateTypes = newEstateTypes;
    }
    
    //console.log("Current Estate Types: ", currentEstateTypes);
}

/**
 * * 최종 목표
 * 지도 화면 내 여러 시군구 코드를 자동으로 찾아와 레벨을 기반으로 sggCd 배열(nxn)을 계산하고 realPriceAptArrayWithCache를 호출하는 함수
 * 새로운 캐시 API를 호출하는 메인 함수
 * 이 함수는 `map`의 `idle` 이벤트 리스너에서 호출됩니다.
 * 레벨에 맞춰 지도의 보이는 영역에 해당하는 sggCd들을 모두 가져오는 방식
 */
async function fetchRealPriceAptArrayBasedOnMapCenterWidthCash_AutoPoint() {
    //console.trace('idle fetchRealPriceAptArrayBasedOnMapCenterWidthCash_AutoPoint 호출 스택:');
    if (!clusterersByType["all"]) {
        initializeClusterers();
    }
    //console.log(`(1)실거래가(AutoPoint) 시작시간 : ${getFormattedDateTime()} `);
    
    const currentBounds = map.getBounds();
    const currentLevel = map.getLevel();

    // 줌 레벨 조정: 가장 낮은 디테일 레벨(시도)을 넘어서면 중단
    // 읍면동(31M), 시군구(22M), 시도(11M) 파일이 있으니 레벨 10 이상에서도 충분히 데이터를 사용할 수 있도록 조정

    if (currentLevel > 11) { // 줌 레벨 조정: 가장 낮은 디테일 레벨(시도)을 넘어서면 중단
        clearAllRealEstateOverlays();
        //console.log(`[${getFormattedDateTime()}] Zoom level (${currentLevel}) is too high (>10). Skipping data fetch and clearing overlays.`);
        hideLoadingSpinner();
        return;
    }

    updateEstateTypeFiltersFromUI();
    const estateTypesToFetch = currentEstateTypes;

    const uniqueSggCds = new Set();
    
    const minLng = currentBounds.getSouthWest().getLng();
    const minLat = currentBounds.getSouthWest().getLat();
    const maxLng = currentBounds.getNorthEast().getLng();
    const maxLat = currentBounds.getNorthEast().getLat();

    // API에 전달할 bbox 파라미터용 배열
    const bboxArrayForApi = [minLng, minLat, maxLng, maxLat]; // [minX, minY, maxX, maxY] 형식

    // turf.bboxPolygon은 그대로 사용하세요 (booleanIntersects용)
    const mapBoundsPolygon = turf.bboxPolygon(bboxArrayForApi);


    let geojsonToProcess;
    let geojsonTypeToLoad; // GeoJSON 파일 Type
    
    // 현재 레벨에 따라 사용할 GeoJSON 데이터와 파일 이름을 결정
    if (currentLevel <= 5) { // 5 레벨: 가장 상세한 읍면동 코드 (10자리)
        geojsonTypeToLoad = 'emd';
        geojsonFileName = 'EMD_CD_3pro.geojson'; // 이 부분만 실제 파일명으로 바꿔주세요!
    } else if (currentLevel >= 6 && currentLevel <= 8) { // 6~8 레벨: 시군구 코드 (5자리)
        geojsonTypeToLoad = 'sigungu';
        geojsonFileName = 'SIG_CD_3pro.geojson'; // 이 부분만 실제 파일명으로 바꿔주세요!
    } else if (currentLevel >= 9) { // 9 레벨 이상: 시도 코드 (2자리)
        geojsonTypeToLoad = 'sido';
        geojsonFileName = 'CTPRVN_CD_2pro.geojson'; // 이 부분만 실제 파일명으로 바꿔주세요!
    }

    //console.log(` ==> ${geojsonTypeToLoad}(Level:${currentLevel}) geojson load 시작시간 : ${getFormattedDateTime()} `);
    geojsonToProcess = await loadOrGetGeoJSON(geojsonTypeToLoad, geojsonFileName);
    //console.log(` ==> ${geojsonTypeToLoad}(Level:${currentLevel}) geojsonload 종료 시간 : ${getFormattedDateTime()} `);

    if (!geojsonToProcess) {
        hideLoadingSpinner();
        return;
    }
    
    const currentVisibleGeoJsonFeatures = []; // 이 배열에 현재 화면에 보이는 GeoJSON feature들을 담을 겁니다.
    // GeoJSON 데이터가 제대로 로드되었는지 확인 후 forEach 실행
    if (geojsonToProcess.features && Array.isArray(geojsonToProcess.features)) {
        geojsonToProcess.features.forEach(feature => {  //
            // GeoJSON 파일에 포함된 각 행정구역(GeoJSON feature)을 순회 개별적으로 처리
            if (feature.properties && feature.properties.BJCD) {
                // 1. 현재 지도 화면 경계 내에 GeoJSON 폴리곤이 있는지 확인
                //각 feature 객체에 행정 코드가 담긴 properties 속성이 있고, 그 properties 안에 실제 코드(여기서는 BJCD)가 존재하는지 확인
                if (mapBoundsPolygon && mapBoundsPolygon.geometry && feature.geometry) { // null 체크 
                    
                    if (turf.booleanIntersects(mapBoundsPolygon.geometry, feature.geometry)) { // 특정 지리적 객체가 현재 지도 화면에 보이는지 판단
                                            //지금 사용자가 보고 있는 지도 영역과 GeoJSON feature의 지오메트리가 공간적으로 교차하는지 확인
                        //지도 화면에 보이는 영역(mapBoundsPolygon) 안에 현재 feature의 지오메트리(feature.geometry)가 일부라도 걸쳐 있는지 공간적으로 교차하는지 확인
                        const pnuCodeFull = String(feature.properties.BJCD); // GeoJSON에서 가져온 코드 (문자열로 변환)
                        let sggCd = "";
        
                        // 2. 현재 줌 레벨(currentLevel)에 따라 필요한 행정 코드 길이 결정
                        // GeoJSON의 'BJCD' 속성이 이 로직에 맞게 10자리 PNU 코드를 포함하고 있어야 합니다.
                        if (currentLevel <= 3) {
                            sggCd = pnuCodeFull.substring(0, 10);
                        } else if (currentLevel >= 4 && currentLevel <= 5) {  //10자리: 읍면동
                            sggCd = pnuCodeFull.substring(0, 10);
                        //} else if (currentLevel === 7) {
                        //    sggCd = pnuCodeFull.substring(0, 8);
                        } else if (currentLevel >= 6 && currentLevel <= 8) {  //5자리: 시군구 (SGG)
                            sggCd = pnuCodeFull.substring(0, 5);
                        } else if (currentLevel >= 9) {
                            sggCd = pnuCodeFull.substring(0, 2);               //2자리: 시도 (SIDO)
                        }
                        // 3. 중복을 제거하며 추출된 코드 저장(중복된 값을 허용하지 않는 자료구조)
                    //console.log(`추출된 sggCd: ${sggCd} from BJCD: ${pnuCodeFull} at level ${currentLevel}`);
                        uniqueSggCds.add(sggCd);
                        
                        // 현재 지도 화면 경계와 교차하는 feature를 저장합니다.
                        currentVisibleGeoJsonFeatures.push(feature); 
                    }
                } else {
                    //console.warn("mapBoundsPolygon.geometry 또는 feature.geometry가 유효하지 않습니다.");
                } 
                
            } else {
                // 경고: GeoJSON Feature에 'properties' 또는 'BJCD' 속성이 없을 때
                //console.warn(`[${getFormattedDateTime()}] Feature missing 'properties' or 'BJCD' for GeoJSON type ${geojsonTypeToLoad}:`, feature);
            }
        });
    } else {
        // 에러: 로드된 GeoJSON 데이터가 유효한 'features' 배열을 포함하지 않을 때
        //console.error(`[${getFormattedDateTime()}] Loaded GeoJSON data does not contain a valid 'features' array.`, geojsonToProcess);
        hideLoadingSpinner();
    }

    const sggCdsToFetch = Array.from(uniqueSggCds);
                        
    //console.log(`모드3 지도에서 샘플 포인트 개수(level:${currentLevel}): (${sggCdsToFetch.length})`);
    //console.log(`모드3 지도에서 샘플 포인트(unique codes): ${sggCdsToFetch}`);
    const startTime = Date.now();
    const bboxParameterString = bboxArrayForApi.join(','); // 예: "126.9,37.5,127.1,37.6"
    
    if (sggCdsToFetch.length > 0) {
        showLoadingSpinner(); // 로딩 스피너 표시
        try {
            //await realPriceAptArrayWithCache(sggCdsToFetch, estateTypesToFetch);
            await realPriceAptArrayWithCache(sggCdsToFetch, currentVisibleGeoJsonFeatures);
            //await realPriceAptArrayWithCache(bboxParameterString, sggCdsToFetch);
            //console.log(`[${getFormattedDateTime()}] 모든 폴리곤/마커 지시가 완료되었습니다. 지도 렌더링이 곧 완료될 것입니다.`);
        } catch (error) {
            //console.error(`[${getFormattedDateTime()}] 데이터 로드 중 에러 발생:`, error);
            alert("부동산 데이터를 불러오는 중 오류가 발생했습니다: " + error.message);
        } finally {
            hideLoadingSpinner();
        }
    } else {
        console.warn(`[${getFormattedDateTime()}] 조회할 유효한 sggCds가 없습니다.`);
        clearAllRealEstateOverlays();
        hideLoadingSpinner();
    }
    const elapsedTime = Date.now() - startTime;
    //console.log(`실거래가(AutoPoint) 종료시간 소요시간: ${elapsedTime/1000}초`);
}

/**
 * 지도 nxn Point 와 레벨을 기반으로 sggCd 배열(nxn)을 계산하고 realPriceAptArray를 호출하는 함수
 * 새로운 캐시 API를 호출하는 메인 함수
 * 레벨에 맞춰 지도의 보이는 영역에 해당하는 sggCd들을 모두 가져오는 방식
 */
async function fetchRealPriceAptArrayBasedOnMapCenter() {
    //console.trace('fetchRealPriceAptArrayBasedOnMapCenter 호출 스택:');
    const center = map.getCenter();
    const level = map.getLevel();

    if (level > 6) return;

    //const samplePoints = getSamplePointsFromMapBounds(map); // 지도 화면 내 여러 샘플링 지점들을 가져오는 함수
    const samplePoints = getGridPointsFromMapBounds(map, 10);  //샘플링 포인트 개수 조절 함수(5X5)
    
    const uniqueSggCds = new Set(); // 중복 제거를 위한 Set

    // 모든 샘플 포인트에 대해 비동기적으로 지오코딩 수행
    const geocodingPromises = samplePoints.map(point => {
        return new Promise((resolve) => {
            // **여기서 point 객체 및 좌표 유효성 검사 시작!**
            if (!point || typeof point.getLng !== 'function' || typeof point.getLat !== 'function') {
                //console.error("Geocoding skip: 유효하지 않은 point 객체 또는 메서드 없음.", point);
                resolve(null); // 유효하지 않은 포인트는 건너뛰고 null 반환
                return;
            }

            const lng = point.getLng();
            const lat = point.getLat();

            if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
                //console.error(`Geocoding skip: point에서 유효하지 않은 좌표 감지. (Lng: ${lng}, Lat: ${lat})`, point);
                resolve(null); // 유효하지 않은 좌표는 건너뛰고 null 반환
                return;
            }
            // **유효성 검사 끝**

            // 디버깅을 위해 실제로 geocoder에 전달되는 좌표를 확인해볼 수 있어요.
            // console.log(`Geocoding 요청: Lat=${lat}, Lng=${lng}`);

            geocoder.coord2RegionCode(lng, lat, function (result, status) {
                if (status === kakao.maps.services.Status.OK && result[0]) {
                    let sggCd = result[0].code;
                    // 레벨에 따라 sggCd 길이 조정 로직 (기존 로직 유지)
                    if (level <= 3) {
                        sggCd = sggCd.substring(0, 10); // 10자리 (시군구+법정동 전체)
                    } else if (level === 4 || level === 5 || level === 6) { // 4-6레벨 시군구+법정동
                        sggCd = sggCd.substring(0, 10);
                    } else if (level === 7) { // 7레벨 시군구
                        sggCd = sggCd.substring(0, 8); // 8자리 (시군구)
                    } else if (level > 7 && level < 10) { // 8-9레벨 광역 시도 (prefix 5자리)
                        sggCd = sggCd.substring(0, 5);
                    } else if (level >= 10) { // 10레벨 이상 시도 (prefix 2자리)
                        sggCd = sggCd.substring(0, 2);
                    }
                    resolve(sggCd);
                    //console.warn(`Geocoding success for point (${lat}, ${lng}):`, status, result); // 어떤 좌표가 실패했는지 경고 로그
                } else {
                    //console.warn(`Geocoding failed for point (${lat}, ${lng}):`, status, result); // 어떤 좌표가 실패했는지 경고 로그
                    resolve(null); // 실패 시 null 반환
                }
            });
        });
    });
    
    const sggCdResults = await Promise.all(geocodingPromises); // 모든 지오코딩 결과 대기

    sggCdResults.forEach(code => {
        if (code) {
            uniqueSggCds.add(code); // 유효한 코드만 Set에 추가
        }
    });

    const sggCdsToFetch = Array.from(uniqueSggCds); // Set을 배열로 변환
    // debugging logs
    //console.log(`모드2 샘플 포인트 (sggCds 개수): ${samplePoints.length} (${sggCdsToFetch.length})`);
    //console.log(`sggCds: ${sggCdsToFetch}`);

    const startTime = Date.now();
    //console.log(getFormattedDateTime());

    if (sggCdsToFetch.length > 0) {
        showLoadingSpinner(); 

        //realPriceAptArray(sggCdsToFetch); // 변경된 API 호출 함수
        try {
            await realPriceAptArray(sggCdsToFetch); // Promise가 resolve될 때까지 기다림
            //console.log("모든 폴리곤/마커 지시가 완료되었습니다. 지도 렌더링이 곧 완료될 것입니다.");
            // 여기서 로딩 스피너 숨기기, UI 활성화 등 후처리
            hideLoadingSpinner(); 
        } catch (error) {
            //console.error("데이터 로드 중 에러 발생:", error);
            // 에러 메시지 표시, 로딩 스피너 숨기기 등
            hideLoadingSpinner(); 
        }
    } else {
        console.warn("조회할 유효한 sggCds가 없습니다.");
        // 에러 처리 또는 UI 초기화 로직
    }
    // debugging logs
    const elapsedTime = Date.now() - startTime; // 현재 시각 - 시작 시각 (밀리초)
    //console.log(`소요시간: ${elapsedTime/1000}초`);
}
/**
 * 원래 함수
 * 지도 중심 좌표와 레벨을 기반으로 sggCd를 계산하고 realPriceApt를 호출하는 함수
 * 새로운 캐시 API를 호출하는 메인 함수
 * * 이 함수는 `map`의 `tilesloaded` 이벤트 리스너에서 호출됩니다.
 * 레벨에 맞춰 지도의 보이는 영역에 해당하는 sggCd들을 모두 가져오는 방식
 */
function fetchRealPriceAptBasedOnMapCenter() {
    const center = map.getCenter();
    const level = map.getLevel();

    // 현재 레벨이 6을 초과하면 리턴 (기존 로직 유지)
    if (level > 6) return;

    // geocoder를 사용하여 좌표로부터 지역 코드를 얻어옴
    geocoder.coord2RegionCode(center.getLng(), center.getLat(), function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
            let sggCd = result[0].code; // 초기 sggCd는 전체 코드

            // 레벨에 따라 sggCd 길이 조정 (기존 로직 유지)
            if (level <= 3) {
                sggCd = result[0].code.substring(0, 10); // 10자리 (시군구+법정동 전체)
            } else if (level === 4 || level === 5 || level === 6) { // 4-5레벨 시군구+법정동 //zoomLevel 변경 4~5 ==> 4~6
                sggCd = result[0].code.substring(0, 10);
            } else if (level === 7) { // 6레벨 시군구  ////zoomLevel 변경 6->7
                sggCd = result[0].code.substring(0, 8); // 8자리 (시군구)
            } else if (level > 7 && level < 10) { // 7-8레벨 광역 시도 (prefix 5자리)  ////zoomLevel 변경 7-8 >8-9
                sggCd = result[0].code.substring(0, 5);
            } else if (level >= 10) { // 9레벨 이상 시도 (prefix 2자리) ////zoomLevel 변경 9=>10
                sggCd = result[0].code.substring(0, 2);
            }

            // 최종 sggCd로 realPriceApt 호출
            realPriceApt(sggCd);
        } else {
            console.error("Geocoding failed:", status);
            // 오류 처리 로직 추가
        }
    });
}

const cachedGeoJSONs = {};
/*==================================================================================
// "메모리 캐시 → IndexedDB 캐시 → 네트워크 요청" 순서로 데이터를 효율적으로 가져오는 함수
==================================================================================*/
async function loadOrGetGeoJSON(type, fileName) { // fileName 인자 추가
    
    //console.log(`loadOrGetGeoJSON 호출됨 (${type})  파일명: ${fileName}`);
    if (cachedGeoJSONs[type]) {  //메모리 캐시 확인 (1차 캐시)
        //console.log(`[${getFormattedDateTime()}] ${type} 메모리 캐쉬에서 GeoJSON loaded.`);
        return cachedGeoJSONs[type];
    }

    const url = `/front/assets/data/${fileName}`; // 파일 경로를 여기에 설정
    let geojsonData = await localforage.getItem(`geojson_${type}`);  //IndexedDB 캐시 확인 (2차 캐시)// 캐시 키는 'type'으로 유지
    
    if (!geojsonData) {
        //console.log(`[${getFormattedDateTime()}] ${type} DB 경계 파일에서 GeoJSON loaded 시작 : ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${type} GeoJSON from ${url}: ${response.statusText}`);
        }
        geojsonData = await response.json();
        await localforage.setItem(`geojson_${type}`, geojsonData);
        //console.log(`[${getFormattedDateTime()}] ${type} DB 경계 파일에서 GeoJSON loaded(메모리 캐쉬로 로드 포함) 완료.`);
    } else {
        //console.log(`[${getFormattedDateTime()}] ${type} GeoJSON loaded from localforage.`);
    }
    cachedGeoJSONs[type] = geojsonData; //// 메모리에도 캐시 (네트워크에서 로드했든, localforage에서 로드했든 모든 경우에 메모리 캐시)
    return geojsonData;
}

// 참고: preloadAllGeoJSONs() 함수를 사용하신다면 이곳의 파일명도 정확히 맞춰야 합니다.
// 예시:
async function preloadAllGeoJSONs() {
     await loadOrGetGeoJSON('sido', 'CTPRVN_CD_2pro.geojson');
     await loadOrGetGeoJSON('sigungu', 'SIG_CD_3pro.geojson');
     await loadOrGetGeoJSON('emd', 'EMD_CD_3pro.geojson');
     //console.log(`[${getFormattedDateTime()}] All GeoJSON files preloaded.`);
}
//preloadAllGeoJSONs();

let loadingSpinnerElement = null; // 스피너 요소를 저장할 변수

/**
 * 로딩 스피너를 화면에 표시합니다.
 * 스피너가 이미 존재하면 아무것도 하지 않습니다.
 */
function showLoadingSpinner() {
    if (loadingSpinnerElement) {
        // 이미 스피너가 표시되어 있으면 다시 만들지 않습니다.
        return;
    }

    loadingSpinnerElement = document.createElement('div');
    loadingSpinnerElement.id = 'global-loading-spinner'; // ID 부여 (선택 사항)
    loadingSpinnerElement.className = 'loading-overlay'; // CSS 클래스 적용

    const spinnerInner = document.createElement('div');
    spinnerInner.className = 'spinner'; // 스피너 애니메이션 클래스 적용
    
    loadingSpinnerElement.appendChild(spinnerInner);
    document.body.appendChild(loadingSpinnerElement); // body에 스피너 요소 추가
    
    //console.log("로딩 스피너 표시"); // 디버깅용
}

/**
 * 로딩 스피너를 화면에서 숨깁니다.
 * 스피너가 존재하지 않으면 아무것도 하지 않습니다.
 */
function hideLoadingSpinner() {
    if (loadingSpinnerElement && loadingSpinnerElement.parentNode) {
        loadingSpinnerElement.parentNode.removeChild(loadingSpinnerElement); // 부모로부터 요소 제거
        loadingSpinnerElement = null; // 변수 초기화
        //console.log("로딩 스피너 숨김"); // 디버깅용
    }
}

function getFormattedDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
    const day = String(now.getDate()).padStart(2, '0');
    
    // 시간(hour)과 분(minutes), 초(seconds)를 가져와서 두 자리 숫자로 만듭니다.
    const hours = String(now.getHours()).padStart(2, '0'); // 시간 (HH)
    const minutes = String(now.getMinutes()).padStart(2, '0'); // 분 (MM)
    const seconds = String(now.getSeconds()).padStart(2, '0'); // 초 (SS)

    // yyyy-mm-dd HH:MM:SS 형식으로 조합
    //const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    const formattedDateTime = `${hours}:${minutes}:${seconds}`;

    return formattedDateTime;
}


function getSamplePointsFromMapBounds(map) {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // 남서, 북서, 남동, 북동 좌표
    const nw = new kakao.maps.LatLng(ne.getLat(), sw.getLng());
    const se = new kakao.maps.LatLng(sw.getLat(), ne.getLng());

    // 4개 변의 중간 좌표
    const midLeft = new kakao.maps.LatLng((sw.getLat() + ne.getLat()) / 2, sw.getLng());
    const midRight = new kakao.maps.LatLng((sw.getLat() + ne.getLat()) / 2, ne.getLng());
    const midTop = new kakao.maps.LatLng(ne.getLat(), (sw.getLng() + ne.getLng()) / 2);
    const midBottom = new kakao.maps.LatLng(sw.getLat(), (sw.getLng() + ne.getLng()) / 2);

    const points = [];
    // 중앙
    points.push(map.getCenter());
    // 4개 코너점
    points.push(sw);      // 남서
    points.push(nw);      // 북서
    points.push(se);      // 남동
    points.push(ne);      // 북동
    // 4개 변 중간점
    points.push(midLeft);
    points.push(midRight);
    points.push(midTop);
    points.push(midBottom);

    return points;
}

function getGridPointsFromMapBounds(map, gridSize = 5) {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const latStart = sw.getLat();
    const latEnd = ne.getLat();
    const lngStart = sw.getLng();
    const lngEnd = ne.getLng();

    const latStep = (latEnd - latStart) / (gridSize - 1);
    const lngStep = (lngEnd - lngStart) / (gridSize - 1);

    const points = [];
    for(let i = 0; i < gridSize; i++) {
        for(let j = 0; j < gridSize; j++) {
            const lat = latStart + latStep * i;
            const lng = lngStart + lngStep * j;
            points.push(new kakao.maps.LatLng(lat, lng));
        }
    }

    return points;
}

function groundOverlayFunc() {
    function GroundOverlay(bounds, imgSrc) {
        this.bounds = bounds;
        var node = (this.node = document.createElement("div"));
        node.style.position = "absolute";
        node.style.pointerEvents = "none"; // 이벤트를 지도에 전달
        node.style.zIndex = "10"; // 오버레이가 지도 위에 나타나도록 z-index 설정

        var img = (this.img = document.createElement("img"));
        img.className = "overlay-image"; // 스타일 적용을 위한 클래스명 지정
        img.src = imgSrc;
        img.style.width = "100%"; // 이미지가 오버레이 영역을 채우도록 설정
        img.style.height = "100%"; // 이미지가 오버레이 영역을 채우도록 설정
        img.style.zIndex = "10"; // 이미지의 z-index도 설정

        node.appendChild(img);
    }

    // 프로토타입 상속 설정 (수정된 부분)
    GroundOverlay.prototype = Object.create(kakao.maps.AbstractOverlay.prototype);
    GroundOverlay.prototype.constructor = GroundOverlay;

    GroundOverlay.prototype.onAdd = function () {
        var panel = this.getPanels().overlayLayer; // 오버레이 레이어에 추가
        panel.appendChild(this.node);
    };

    GroundOverlay.prototype.draw = function () {
        var projection = this.getProjection();

        // 남서쪽과 북동쪽 좌표를 화면 좌표로 변환
        var ne = projection.pointFromCoords(this.bounds.getNorthEast());
        var sw = projection.pointFromCoords(this.bounds.getSouthWest());

        // 위치 및 크기 계산
        var left = Math.min(sw.x, ne.x);
        var top = Math.min(sw.y, ne.y);
        var right = Math.max(sw.x, ne.x);
        var bottom = Math.max(sw.y, ne.y);

        var width = ne.x - sw.x;
        var height = sw.y - ne.y;

        // 오버레이 위치 및 크기 설정
        this.node.style.left = left + "px";
        this.node.style.top = top + "px";
        this.node.style.width = width + "px";
        this.node.style.height = height + "px";
        // this.node.style.width = "100%";
        // this.node.style.height = "100%";

        // console.log("sw:", sw.x, sw.y);
        // console.log("ne:", ne.x, ne.y);
        // console.log("width:", width, "height:", height);
    };

    GroundOverlay.prototype.onRemove = function () {
        if (this.node.parentNode) {
            this.node.parentNode.removeChild(this.node);
        }
    };
}

/**
 * 두 경계가 겹치는 경우, 겹치지 않는 부분을 계산하여 반환하는 함수
 * @param {LatLngBounds} boundsA 기존 오버레이 경계
 * @param {LatLngBounds} boundsB 새로운 오버레이 경계
 * @returns {Array} 중복되지 않는 경계 영역 배열
 */
function getNonOverlappingBounds(boundsA, boundsB) {
    //console.log(boundsA);
    //console.log(boundsB);

    const nonOverlappingBounds = [];
    const swA = {
        lat: boundsA.qa, // boundsA의 남서쪽 위도
        lng: boundsA.ha, // boundsA의 남서쪽 경도
    };
    const neA = {
        lat: boundsA.pa, // boundsA의 북동쪽 위도
        lng: boundsA.oa, // boundsA의 북동쪽 경도
    };

    const swB = {
        lat: boundsB.qa, // boundsB의 남서쪽 위도
        lng: boundsB.ha, // boundsB의 남서쪽 경도
    };
    const neB = {
        lat: boundsB.pa, // boundsB의 북동쪽 위도
        lng: boundsB.oa, // boundsB의 북동쪽 경도
    };

    // 로그로 각 좌표 확인
    //console.log("boundsA SouthWest:", swA.lat, swA.lng);
    //console.log("boundsA NorthEast:", neA.lat, neA.lng);
    //console.log("boundsB SouthWest:", swB.lat, swB.lng);
    //console.log("boundsB NorthEast:", neB.lat, neB.lng);

    // 하단 (boundsA의 남서쪽, boundsB의 남서쪽)
    if (swB.lat > swA.lat) {
        const lowerBounds = new kakao.maps.LatLngBounds(new kakao.maps.LatLng(swA.lat, swA.lng), new kakao.maps.LatLng(swB.lat, neA.lng));
        nonOverlappingBounds.push(lowerBounds);
    }

    // 상단 (boundsA의 북동쪽, boundsB의 북동쪽)
    if (neB.lat < neA.lat) {
        const upperBounds = new kakao.maps.LatLngBounds(new kakao.maps.LatLng(neB.lat, swA.lng), new kakao.maps.LatLng(neA.lat, neA.lng));
        nonOverlappingBounds.push(upperBounds);
    }

    // 좌측 (boundsA의 남서쪽, boundsB의 남서쪽)
    if (swB.lng > swA.lng) {
        const leftBounds = new kakao.maps.LatLngBounds(new kakao.maps.LatLng(swA.lat, swA.lng), new kakao.maps.LatLng(neA.lat, swB.lng));
        nonOverlappingBounds.push(leftBounds);
    }

    // 우측 (boundsA의 북동쪽, boundsB의 북동쪽)
    if (neB.lng < neA.lng) {
        const rightBounds = new kakao.maps.LatLngBounds(new kakao.maps.LatLng(swA.lat, neB.lng), new kakao.maps.LatLng(neA.lat, neA.lng));
        nonOverlappingBounds.push(rightBounds);
    }

    return nonOverlappingBounds;
}

/**
 * 두 경계가 중복되는지 확인하는 함수
 * @param {LatLngBounds} boundsA 기존 오버레이 경계
 * @param {LatLngBounds} boundsB 새로운 오버레이 경계
 * @returns {boolean} 중복 여부
 */
function boundsIntersects(boundsA, boundsB) {
    const intersecting = !(
        boundsA.getNorthEast().getLat() < boundsB.getSouthWest().getLat() ||
        boundsA.getSouthWest().getLat() > boundsB.getNorthEast().getLat() ||
        boundsA.getNorthEast().getLng() < boundsB.getSouthWest().getLng() ||
        boundsA.getSouthWest().getLng() > boundsB.getNorthEast().getLng()
    );

    //console.log("Bounds intersect:", intersecting);
    return intersecting;
}

function updateOverlay() {
    function GroundOverlay(bounds, imgSrc) {
        this.bounds = bounds;
        var node = (this.node = document.createElement("div"));
        node.style.position = "absolute";
        node.style.pointerEvents = "none"; // 이벤트를 지도에 전달
        node.style.zIndex = "10"; // 오버레이가 지도 위에 나타나도록 z-index 설정

        var img = (this.img = document.createElement("img"));
        img.className = "overlay-image"; // 스타일 적용을 위한 클래스명 지정
        img.src = imgSrc;
        img.style.width = "100%"; // 이미지가 오버레이 영역을 채우도록 설정
        img.style.height = "100%"; // 이미지가 오버레이 영역을 채우도록 설정
        img.style.zIndex = "10"; // 이미지의 z-index도 설정

        node.appendChild(img);
    }

    // 프로토타입 상속 설정 (수정된 부분)
    GroundOverlay.prototype = Object.create(kakao.maps.AbstractOverlay.prototype);
    GroundOverlay.prototype.constructor = GroundOverlay;

    GroundOverlay.prototype.onAdd = function () {
        var panel = this.getPanels().overlayLayer; // 오버레이 레이어에 추가
        panel.appendChild(this.node);
    };

    GroundOverlay.prototype.draw = function () {
        var projection = this.getProjection();

        // 남서쪽과 북동쪽 좌표를 화면 좌표로 변환
        var ne = projection.pointFromCoords(this.bounds.getNorthEast());
        var sw = projection.pointFromCoords(this.bounds.getSouthWest());

        // 위치 및 크기 계산
        var left = Math.min(sw.x, ne.x);
        var top = Math.min(sw.y, ne.y);
        var right = Math.max(sw.x, ne.x);
        var bottom = Math.max(sw.y, ne.y);

        var width = ne.x - sw.x;
        var height = sw.y - ne.y;

        // 오버레이 위치 및 크기 설정
        this.node.style.left = left + "px";
        this.node.style.top = top + "px";
        this.node.style.width = width + "px";
        this.node.style.height = height + "px";
        // this.node.style.width = "100%";
        // this.node.style.height = "100%";

        // console.log("sw:", sw.x, sw.y);
        // console.log("ne:", ne.x, ne.y);
        // console.log("width:", width, "height:", height);
    };

    GroundOverlay.prototype.onRemove = function () {
        if (this.node.parentNode) {
            this.node.parentNode.removeChild(this.node);
        }
    };

    var mapBounds = map.getBounds();
    var mapSw = mapBounds.getSouthWest(); // 남서쪽 좌표
    var mapNe = mapBounds.getNorthEast(); // 북동쪽 좌표

    // 남서쪽(SW) 좌표 및 북동쪽(NE) 좌표를 EPSG:5186으로 변환
    const lowerLeft = proj4("EPSG:4326", "EPSG:5186", [mapSw.getLng(), mapSw.getLat()]); // 좌하단 좌표 변환
    const upperRight = proj4("EPSG:4326", "EPSG:5186", [mapNe.getLng(), mapNe.getLat()]); // 우상단 좌표 변환

    // 변환된 bbox 값 (하단 좌표, 상단 좌표 형식 유지)
    const bbox = [
        lowerLeft[0],
        lowerLeft[1], // 변환된 하단 좌표
        upperRight[0],
        upperRight[1], // 변환된 상단 좌표
    ];

    // #map_bg 요소의 크기를 가져옴
    const mapBg = document.getElementById("map_bg");
    const width = mapBg.offsetWidth;
    const height = mapBg.offsetHeight;

    // 비동기적으로 WMS 이미지를 로드하는 부분
    const url = "/front/back/realPrice/echologyWMS.php";
    const dataObj = {
        bbox: JSON.stringify(bbox), // JSON 문자열로 변환하여 전송
        width: width,
        height: height,
    };

    // 경계 확장 함수: 기존 경계와 새로운 경계를 병합하여 확장된 경계를 반환
    function mergeBounds(boundsA, boundsB) {
        const swA = boundsA.getSouthWest();
        const neA = boundsA.getNorthEast();

        const swB = boundsB.getSouthWest();
        const neB = boundsB.getNorthEast();

        const mergedSW = new kakao.maps.LatLng(
            Math.min(swA.getLat(), swB.getLat()), // 더 남쪽인 위도를 선택
            Math.min(swA.getLng(), swB.getLng()) // 더 서쪽인 경도를 선택
        );
        const mergedNE = new kakao.maps.LatLng(
            Math.max(neA.getLat(), neB.getLat()), // 더 북쪽인 위도를 선택
            Math.max(neA.getLng(), neB.getLng()) // 더 동쪽인 경도를 선택
        );

        return new kakao.maps.LatLngBounds(mergedSW, mergedNE);
    }

    // 비동기적으로 이미지 로드
    callApiBlob("POST", url, dataObj)
        .then((blobResponse) => {
            if (blobResponse) {
                const imageUrl = URL.createObjectURL(blobResponse); // Blob 데이터를 URL로 변환
                const sw = new kakao.maps.LatLng(mapSw.getLat(), mapSw.getLng()); // GroundOverlay의 이미지를 교체하기 위한 코드
                const ne = new kakao.maps.LatLng(mapNe.getLat(), mapNe.getLng());
                const bounds = new kakao.maps.LatLngBounds(sw, ne); // LatLngBounds 객체 생성

                // 이전 오버레이 제거
                if (currentOverlay) {
                    currentOverlay.setMap(null); // 기존 오버레이 제거
                }

                // GroundOverlay 인스턴스 생성 및 지도에 추가
                currentOverlay = new GroundOverlay(bounds, imageUrl);
                currentOverlay.setMap(map);

                // 기존 오버레이가 있으면 확장, 없으면 새로 추가
                // if (currentOverlays.length > 0) {
                //     currentOverlays.forEach((overlay) => {
                //         const mergedBounds = mergeBounds(overlay.bounds, bounds);
                //         overlay.setMap(null); // 기존 오버레이 제거
                //         const newOverlay = new GroundOverlay(mergedBounds, imageUrl);
                //         newOverlay.setMap(map); // 병합된 오버레이 추가
                //         currentOverlays.push(newOverlay);
                //     });
                // } else {
                //     const newOverlay = new GroundOverlay(bounds, imageUrl);
                //     newOverlay.setMap(map);
                //     currentOverlays.push(newOverlay); // 첫 오버레이 추가
                // }

                // 메모리 누수를 방지하기 위해 이미지 로드 후 객체 URL 해제
                mapBg.addEventListener("load", () => {
                    URL.revokeObjectURL(imageUrl);
                });
            } else {
                console.error("WMS 이미지가 로드되지 않았습니다.");
            }
        })
        .catch((error) => {
            console.error("API 요청 중 오류 발생:", error);
        });
}

async function getEcologyWMSTileLayer() {
    // 타일 요청 큐를 관리하기 위한 배열과 상태 변수
    let tileRequestQueue = [];
    let isRequestInProgress = false;

    // API 요청 함수 (Ajax)
    function callApiBlob(method, url, data) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: method,
                url: url,
                data: data,
                xhrFields: {
                    responseType: "blob", // Blob 데이터를 수신
                },
                success: function (response) {
                    resolve(response); // Blob 데이터를 반환
                },
                error: function (xhr, status, error) {
                    console.error("API 호출 중 오류 발생:", error);
                    reject(error);
                },
            });
        });
    }
    // 타일 요청을 순차적으로 처리하는 함수
    async function processTileQueue() {
        // 현재 요청이 진행 중이 아니고, 큐에 요청이 있으면 처리
        if (!isRequestInProgress && tileRequestQueue.length > 0) {
            isRequestInProgress = true;

            // 큐에서 첫 번째 요청을 가져옴
            const { x, y, z, bbox, div } = tileRequestQueue.shift();

            try {
                // 비동기적으로 API 요청 처리
                const url = "/front/back/realPrice/echologyWMS.php";
                const dataObj = {
                    bbox: JSON.stringify(bbox),
                    width: "256",
                    height: "256",
                };
                const blobResponse = await callApiBlob("POST", url, dataObj);

                if (blobResponse) {
                    // Blob 데이터를 URL로 변환하여 타일 배경 이미지로 설정
                    const imageUrl = URL.createObjectURL(blobResponse);
                    div.style.backgroundImage = `url(${imageUrl})`;
                    div.style.lineHeight = "256px";
                    div.style.textAlign = "center";
                    div.style.border = "1px dashed #ff5050";

                    // 메모리 누수를 방지하기 위해 이미지 로드 후 객체 URL 해제
                    div.addEventListener("load", () => {
                        URL.revokeObjectURL(imageUrl);
                    });
                } else {
                    console.error("WMS 이미지가 로드되지 않았습니다.");
                }
            } catch (error) {
                console.error("API 요청 중 오류 발생:", error);
            } finally {
                // 요청이 완료된 후 다음 요청을 처리
                isRequestInProgress = false;
                processTileQueue(); // 큐에 다음 요청이 있는 경우 처리
            }
        }
    }

    // 타일 크기 변수 정의
    var tileWidth = 256;
    var tileHeight = 256;

    // Tileset을 생성하고 지도 오버레이로 추가합니다
    kakao.maps.Tileset.add(
        "TILE_NUMBER",
        new kakao.maps.Tileset({
            width: tileWidth,
            height: tileHeight,
            getTile: function (x, y, z) {
                // console.log("x: " + x + " y: " + y + " z: " + z);

                // div 생성
                let div = document.createElement("img");
                // div.style.width = tileWidth + "px";
                // div.style.height = tileHeight + "px";
                // div.style.border = "0px dashed #ff5050";

                // const anaysisMap = $("#analysis_select").val();
                // if (anaysisMap !== "ecology") return div;

                // 줌 레벨
                const level = map.getLevel();
                if (level >= 10) return div;

                // 스케일 계산
                var scale = Math.pow(2, z - 3);

                // WTM 좌표 계산 (타일의 우하단 좌표)
                var wtm_x1 = x * scale * tileWidth - 30000;
                var wtm_y1 = (y + 1) * scale * tileHeight - 60000;
                // WTM 좌표 계산 (타일의 우상단 좌표)
                var wtm_x2 = (x + 1) * scale * tileWidth - 30000;
                var wtm_y2 = y * scale * tileHeight - 60000;

                var coordsA = proj4("EPSG:5179", "EPSG:5186", [wtm_x1, wtm_y1]);
                var coordsA1 = proj4("EPSG:5179", "EPSG:4326", [wtm_x1, wtm_y1]);
                var coordsA2 = proj4("EPSG:4326", "EPSG:5186", [coordsA1[0], coordsA1[1]]);
                var coordsB = proj4("EPSG:5179", "EPSG:5186", [wtm_x2, wtm_y2]);
                // console.log(wtm_x1, wtm_y1);
                // console.log("pro4j5186:" + coordsA);
                // console.log("pro4j4326:" + coordsA1);
                // console.log(coordsA2);

                // BBOX 생성 (좌하단의 minX, minY와 우상단의 maxX, maxY를 올바르게 설정)
                var minX = coordsA[0];
                var minY = Math.min(coordsA[1], coordsB[1]); // minY와 maxY를 비교해 올바른 값을 설정
                var maxX = coordsB[0];
                var maxY = Math.max(coordsA[1], coordsB[1]); // minY와 maxY를 비교해 올바른 값을 설정

                const bbox = [
                    minX,
                    minY, // 변환된 하단 좌표
                    maxX,
                    maxY, // 변환된 상단 좌표
                ];

                const imageUrl = `https://www.nie-ecobank.kr/ecoapi/EcologyzmpService/wms/getEcologyzmpWMS?serviceKey=mrknXy75DM9ok9NXMGZaqQBEBGUSqN9nJJ2d/zbUbR0VpNYgkDCTE6f2QpDxRSyS3bcMRkfdEZ+rOrJoDP7XrA==&layers=tbl_opn_eczm&srs=EPSG%3A5186&bbox=${encodeURIComponent(
                    bbox
                )}&width=${tileWidth}&height=${tileHeight}&format=png&transparent=true&exceptions=BLANK&SG_APIM=2ug8Dm9qNBfD32JLZGPN64f3EoTlkpD8kSOHWfXpyrY`;
                div.src = imageUrl;

                return div;
            },
        })
    );

    map.addOverlayMapTypeId(kakao.maps.MapTypeId.TILE_NUMBER);
}

/**
 * 타일 레이어를 제거하는 함수
 */
function removeEcologyWMSTileLayer() {
    // 오버레이 타일을 제거
    map.removeOverlayMapTypeId(kakao.maps.MapTypeId.TILE_NUMBER);
}

/**
 * 생태자연도 폴리곤 값 가져오는 함수
 * @param {*} pnu
 * @param {*} bbox
 * @returns
 */
async function ecologyMap(pnu, bbox, geojsonPolygon) {
    // 합필분석 모드 아닐 때, 분석도 폴리곤 초기화
    if (!isMultiSelectMode) {
        analysisPolygonArray.forEach((polygon) => polygon.setMap(null)); //폴리곤을 지도에서 제거
        analysisPolygonArray = []; // 폴리곤 배열 초기화
    }

    $("#analysis_info_table tbody").empty(); // 분석 - 테이블 초기화
    $("#analysis_total_area").empty(); // 분석 - 면적 초기화
    $("#land_analysis_info_table tbody").empty(); // 합필분석 - 테이블 초기화
    $("#land_analysis_total_area").empty(); // 합필분석 - 면적 초기화

    // const urlWMS = "/front/back/realPrice/echologyWMS.php";
    // const dataObjWMS = {
    //     pnu: pnu,
    //     bbox: bbox,
    // };
    // const resultWMS = await callApi("POST", urlWMS, dataObjWMS);
    // console.log(resultWMS);

    // 생태자연도 가져오기
    const url = "/front/back/realPrice/echology.php";
    const dataObj = {
        pnu: pnu,
        bbox: bbox,
    };
    const result = await callApi("POST", url, dataObj, "loading");

    const polygonArray = [];
    let ecologyPolygons = {}; // turf.js를 사용하기위한 폴리곤 배열 객체

    // 첫 번째 폴리곤의 첫 번째 좌표를 담을 변수
    let firstPolygonCenter = null;

    $.each(result, function (index, value) {
        if (value.error) {
            $("#modalAlert").iziModal("open");
            $("#alert_message").html("<h2>분석 중 <span>문제</span>가 발생했습니다. 다시 시도해주세요.</h2>");
            return false;
        }
        let featureMember = value.featureMember;

        // featureMember가 객체일 수 있으므로 배열인지 확인하고 처리
        if (!featureMember) {
            return; // featureMember가 없으면 무시하고 다음 index로 넘어감
        }

        // featureMember가 배열이 아니라 객체라면, 객체를 배열로 변환하여 처리
        featureMember = Array.isArray(featureMember) ? featureMember : [featureMember];

        // turf.js로 계산하기 위해 폴리곤을 GeoJSON 형식으로 저장
        let turfEcologyPolygons = [];

        featureMember.forEach((feature) => {
            // feature에 tbl_opn_eczm이 있는지 확인
            if (!feature.tbl_opn_eczm || !feature.tbl_opn_eczm.geom || !feature.tbl_opn_eczm.geom.MultiPolygon) {
                return; // 유효하지 않은 feature는 건너뜀
            }

            // 좌표 문자열에서 좌표 변환 (외부 경계)
            const coordString = feature.tbl_opn_eczm.geom.MultiPolygon.polygonMember.Polygon.outerBoundaryIs.LinearRing.coordinates["@text"];

            // EPSG:5186에서 EPSG:4326으로 좌표 변환 (proj4 사용)
            const transformedCoordinates = coordString.split(" ").map((pair) => {
                const coords = pair.split(",").map(Number);
                return proj4("EPSG:5186", "EPSG:4326", coords);
            });

            // 구멍 처리
            let holeTransformedCoordinates = [];
            let geoJsonCoordinates = [transformedCoordinates]; // 외부 경계 포함
            let holeCoordinatesArray = feature.tbl_opn_eczm.geom.MultiPolygon.polygonMember.Polygon.innerBoundaryIs;

            if (holeCoordinatesArray) {
                // 구멍이 여러 개일 경우 처리
                holeTransformedCoordinates = Array.isArray(holeCoordinatesArray)
                    ? holeCoordinatesArray.map((hole) => {
                          const holeCoordString = hole.LinearRing.coordinates["@text"];
                          return holeCoordString.split(" ").map((pair) => {
                              const coords = pair.split(",").map(Number);
                              return proj4("EPSG:5186", "EPSG:4326", coords);
                          });
                      })
                    : [
                          holeCoordinatesArray.LinearRing.coordinates["@text"].split(" ").map((pair) => {
                              const coords = pair.split(",").map(Number);
                              return proj4("EPSG:5186", "EPSG:4326", coords);
                          }),
                      ];

                // 외부 경계와 내부 경계(여러 구멍이 있는 경우 처리)
                geoJsonCoordinates = [transformedCoordinates, ...holeTransformedCoordinates];
            }

            // turf.js를 사용하여 다중 폴리곤으로 변환
            const ecologyPolygon = turf.polygon(geoJsonCoordinates);

            // 유효성 검사 후 저장 (turf.js를 위해)
            if (isValidPolygon(ecologyPolygon)) {
                turfEcologyPolygons.push(ecologyPolygon);
            }

            // 첫 번째 폴리곤의 첫 번째 좌표로 지도 중심 설정 (디버깅 용)
            // if (!firstPolygonCenter) {
            //     firstPolygonCenter = polygonPath[0]; // 첫 좌표 설정
            // }

            // #########################################################################
            if (!$(this).is(":checked")) {
                // 하위 주석 해제 시, 지도에 생태자연도 폴리곤 생성
                // 카카오맵 폴리곤 경로 생성
                const polygonPath = transformedCoordinates.map((coord) => new kakao.maps.LatLng(coord[1], coord[0]));
                let holePolygonPath = [];

                if (holeCoordinatesArray) {
                    holePolygonPath = holeTransformedCoordinates.map((hole) => {
                        return hole.map((coord) => new kakao.maps.LatLng(coord[1], coord[0]));
                    });
                }

                // 폴리곤 객체 생성
                const polygon = new kakao.maps.Polygon({
                    path: [polygonPath, ...holePolygonPath], // 외부 경계와 구멍을 포함한 경로
                    strokeWeight: 1,
                    strokeColor: `${index == "ecologyzmpWFS_1" ? "#16a800" : index == "ecologyzmpWFS_2" ? "#9ad37f" : "#e9e8d6"}`,
                    strokeOpacity: 1,
                    strokeStyle: "solid",
                    fillColor: `${index == "ecologyzmpWFS_1" ? "#16a800" : index == "ecologyzmpWFS_2" ? "#9ad37f" : "#e9e8d6"}`,
                    fillOpacity: 1,
                    zIndex: 5, // 폴리곤을 건물 아래에 표시
                });
                analysisPolygonArray.push(polygon);
            }
            // #########################################################################
        });

        // 폴리곤 배열을 담는다. (turf.js를 위해)
        ecologyPolygons[index] = turfEcologyPolygons;
    });

    // 폴리곤을 지도에 표시
    // if (!isMultiSelectMode) {
    analysisPolygonArray.forEach((polygon) => polygon.setMap(map));
    // }

    // 필지와 생체자연도의 폴리곤 교집합 계산 (분석 탭)
    calculateOverlap(geojsonPolygon, ecologyPolygons);

    // 지도 중심을 첫 번째 폴리곤의 첫 좌표로 설정
    if (firstPolygonCenter) {
        map.setCenter(firstPolygonCenter);
    }

    // polygonArray.forEach((polygon) => polygon.setMap(map));

    return ecologyPolygons;
}

function isValidPolygon(polygon) {
    // 폴리곤이 Feature 객체이고, geometry.type이 Polygon인지 확인
    if (!polygon || polygon.type !== "Feature" || !polygon.geometry || polygon.geometry.type !== "Polygon") {
        return false;
    }
    // 첫 좌표와 마지막 좌표가 동일한지 확인 (폴리곤의 닫힘 확인)
    const coordinates = polygon.geometry.coordinates[0];
    if (coordinates.length < 4) {
        return false; // 유효한 폴리곤이 되려면 최소 4개의 좌표가 필요
    }
    const firstCoord = coordinates[0];
    const lastCoord = coordinates[coordinates.length - 1];
    return firstCoord[0] === lastCoord[0] && firstCoord[1] === lastCoord[1];
}

/**
 * 필지와 생체자연도의 폴리곤 교집합 계산하는 함수
 * @param {*} landPolygon = 필지 폴리곤
 * @param {*} ecologyPolygonsObject = 생태자연도 폴리곤
 * @returns
 */

function calculateOverlap(landPolygons, ecologyPolygonsObject) {
    // landPolygons이 배열이 아닌 경우 배열로 변환
    if (!Array.isArray(landPolygons)) {
        landPolygons = [landPolygons];
    }

    let intersectArea = {}; // 교차 면적 객체

    // 각 landPolygon에 대해 처리
    landPolygons.forEach((landPolygon) => {
        // landPolygon이 유효한지 확인
        if (!isValidPolygon(landPolygon)) {
            //console.error("유효하지 않은 landPolygon입니다.");
            return;
        }

        $.each(ecologyPolygonsObject, function (index, ecologyPolygons) {
            let totalIntersectionArea = 0; // 총 교차 면적
            // intersectArea[index]가 이미 있는 경우에는 기존 값에 누적
            if (!intersectArea[index]) {
                intersectArea[index] = 0; // 없으면 초기화
            }

            ecologyPolygons.forEach((ecologyPolygon) => {
                // 각 ecologyPolygon이 유효한지 확인
                if (!isValidPolygon(ecologyPolygon)) {
                    //console.warn("유효하지 않은 ecologyPolygon이 있습니다. 건너뜁니다.");
                    return;
                }

                try {
                    // 두 개의 폴리곤을 featureCollection으로 묶어서 교차 구하기
                    const intersection = turf.intersect(turf.featureCollection([landPolygon, ecologyPolygon]));

                    if (intersection) {
                        const intersectionArea = turf.area(intersection); // 겹친 부분의 면적 계산
                        // totalIntersectionArea += intersectionArea;
                        intersectArea[index] += intersectionArea; // 면적을 누적
                    }
                } catch (error) {
                    //console.error("폴리곤 비교 중 오류 발생:", error.message);
                }
            });
            // console.log("등급별 겹치는 면적:", totalIntersectionArea, "평방미터");
            // intersectArea[index] = totalIntersectionArea;
            // console.log(intersectArea);
        });
    });

    // const langArea = globalLandCharacter[0].lndpclAr;
    // const langArea = turf.area(landPolygon);
    const combinedLangArea = landPolygons.reduce((totalArea, polygon) => totalArea + turf.area(polygon), 0); // 전체 landPolygons의 면적

    let table = $("#analysis_info_table");

    if (isMultiSelectMode) {
        table = $("#land_analysis_info_table");
        $("#land_analysis_total_area").text(formatArea(combinedLangArea.toFixed(2)));
    } else {
        $("#analysis_total_area").text(formatArea(combinedLangArea.toFixed(2)));
    }

    // table.find("tbody").empty(); // 테이블 초기화
    // $("#analysis_total_area").text(formatArea(langArea.toFixed(2)));
    // $("#land_analysis_total_area").text(formatArea(combinedLangArea.toFixed(2)));

    // console.log(intersectArea);

    // intersectArea를 순회하며 테이블에 등급과 면적 추가
    $.each(intersectArea, function (index, area) {
        gradeValue = index == "ecologyzmpWFS_1" ? 1 : index == "ecologyzmpWFS_2" ? 2 : index == "ecologyzmpWFS_3" ? 3 : "별도관리지역";

        let color = "";
        if (gradeValue == 1) {
            color = "#16a800";
        } else if (gradeValue == 2) {
            color = "#9ad37f";
        } else if (gradeValue == 3) {
            color = "#e9e8d6";
        }

        // const areaPercentage = ((area / langArea) * 100).toFixed(3); // 소수점 둘째 자리까지 비율 계산
        const areaPercentage = ((area / combinedLangArea) * 100).toFixed(3); // 소수점 둘째 자리까지 비율 계산

        // areaPercentage가 0이 아닌 경우에만 append
        if (areaPercentage > 0) {
            table.find("tbody").append(
                `<tr>
                <td class="text-center" style="color:${color}">◼︎</td>
                <td class="text-center">${gradeValue}등급</td>
                <td class="text-center">${formatArea(area.toFixed(2))}</td>
                <td class="text-center">${areaPercentage}</td>
            </tr>`
            );
        }
    });
}
/*
async function nationalEnvMap(pnu) {
    const url = "/front/back/realPrice/test2.php";
    const dataObj = {
        pnu: pnu,
    };
    const result = await callApi("POST", url, dataObj);
    console.log(result);
}
*/

/**
 * 지도 클릭 시 건물과 토지 정보를 동시에 가져오는 함수
 */
async function handleMapClick(coords) {
    if (isLoading) return; // 이전 작업이 완료되지 않았으면 새로운 작업을 시작하지 않음

    try {
        isLoading = true; // 작업 시작 플래그 설정
        
        // isMultiSelectMode 일 때는 clearAllPolygons를 호출하지 않고,
        // addPolygonsToMap을 직접 호출하지도 않습니다.
        // 이 모드에서는 landAnalysis 함수가 개별 폴리곤 렌더링을 담당합니다.
        if (!isMultiSelectMode) { // 단일 선택 모드일 때만 초기화 및 렌더링
            clearAllPolygons(); // 기존 폴리곤을 모두 지움
        }
        let returnBuildingPolygons = [];
        let returnLandPolygons = [];

        // 폴리곤 정보 가져오기
        const polygons = await getLandBuildingPolygon(coords);
        const { buildingPolygon, buildingPolygon2, landPolygon } = polygons;

        // 건물 정보와 토지 정보를 동시에 가져옴
        /*
        [returnBuildingPolygons, returnLandPolygons] = await Promise.all([
            getBuilindInfo({ buildingPolygon, buildingPolygon2 }), // 건물 정보 가져오기
            getLandInfo(landPolygon), // 토지 정보 가져오기
        ]);
        */
        await Promise.all([
            getBuilindInfo({ buildingPolygon, buildingPolygon2 }), // 건물 정보 가져오기
            getLandInfo(landPolygon), // 토지 정보 가져오기
        ]);

        // 두 작업이 완료된 후 폴리곤을 한 번에 지도에 추가
        // addPolygonsToMap(returnBuildingPolygons, returnLandPolygons);
        // 단일 선택 모드일 때만 addPolygonsToMap을 호출합니다.
        // 합필 분석 모드에서는 landAnalysis 함수가 폴리곤 렌더링을 담당합니다.

        // --- 여기에 sessionStorage 저장 로직 추가 ---
        // 폴리곤의 PNU와 함께 해당 폴리곤을 불러온 coords 정보도 저장합니다.
        const polygonDataToStore = {
            pnu: landPolygon.pnu, // 또는 `coords`를 통해 얻은 다른 식별자
            lat: coords.lat,
            lng: coords.lng
        };
        sessionStorage.setItem('lastViewedPolygonInfo', JSON.stringify(polygonDataToStore));
        // --- sessionStorage 저장 로직 끝 ---

        if (!isMultiSelectMode) {
            addPolygonsToMap(buildingPolygons, landPolygons);
            //clickCoordTodisplayAddress(coords);
       }
    } catch (error) {
        console.error("정보를 가져오는 중 오류가 발생했습니다: ", error);
    } finally {
        isLoading = false; // 작업 완료 플래그 해제
    }
}
/**
 * 클릭 좌표기준 주소표시 함수
*/
async function clickCoordTodisplayAddress(coords) {
    const addressResult = await searchDetailAddrFromCoordsMy(coords);
        if (addressResult && addressResult.status === kakao.maps.services.Status.OK && addressResult.result && addressResult.result[0]) {
            const result = addressResult.result[0];
            let jibunAddr = result.address ? result.address.address_name : '';
            $("#click_location").val(jibunAddr); // 
        }
}
/**
 * 주소 검색
 * @param {*} coords
 */
async function searchDetailAddrFromCoordsMy(coords) {
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
 * 건물 폴리곤과 토지 폴리곤을 지도에 동시에 추가하는 함수
 * @param {Array} buildingPolygonPaths - 건물 폴리곤 경로 배열
 * @param {Array} landPolygonPaths - 토지 폴리곤 경로 배열
 */
function addPolygonsToMap(buildingPolygonPaths = [], landPolygonPaths = []) {
    // 건물 폴리곤 추가
    if (buildingPolygonPaths.length > 0) {
        buildingPolygonPaths.forEach((polygon) => polygon.setMap(map));
    }

    // 토지 폴리곤을 map과 miniMap 모두에 추가
    if (landPolygonPaths.length > 0) {
        // 메인 지도에 토지 폴리곤 추가
        //landPolygonPaths.forEach((polygon) => polygon.setMap(map));
        // 미니 지도에 토지 폴리곤 추가
        //landPolygonsMiniMap.forEach((polygon) => polygon.setMap(miniMap));
        // 메인 지도에 토지 폴리곤 추가
        landPolygonPaths.forEach((polygon) => {
            //console.log("addPolygonsToMap: Drawing Land Polygon", { pnu: polygon.pnu, id: polygon.uniqueId, instance: polygon });
            polygon.setMap(map);
        });
        // 미니 지도에 토지 폴리곤 추가
        landPolygonsMiniMap.forEach((polygon) => { 
            //console.log("addPolygonsToMap: Drawing MiniMap Polygon", { pnu: polygon.pnu, id: polygon.uniqueId, instance: polygon });
            polygon.setMap(miniMap);
        });
    }
}

/**
 * 모든 폴리곤을 제거하는 함수 (싱글 모드에서 호출)
 */
function clearAllPolygons() {
    // 합필분석 모드일 때 제거 중단
    if (isMultiSelectMode) return;

    // 모든 건물 폴리곤과 지적도 폴리곤을 지도에서 제거
    // 지도에 현재 그려진 모든 landPolygons (전역 배열)의 폴리곤들을 지도에서 지웁니다.
    landPolygons.forEach(polygon => {
        if (polygon) { // null 체크 (안전 장치)
            polygon.setMap(null);
        }
    });
    // miniMap에 그려진 폴리곤들도 지웁니다.
    landPolygonsMiniMap.forEach(polygon => {
        if (polygon) {
            polygon.setMap(null);
        }
    });

    // 건물 폴리곤들도 지웁니다 (buildingPolygons도 전역 배열이라고 가정)
    buildingPolygons.forEach(polygon => {
        if (polygon) {
            polygon.setMap(null);
        }
    });

    // 분석 폴리곤 배열의 폴리곤들을 지도에서 제거
    analysisPolygonArray.forEach(polygon => {
        if (polygon) {
            polygon.setMap(null);
        }
    });

    // 폴리곤 배열 초기화
    buildingPolygons = [];
    landPolygons = [];
    landPolygonsMiniMap = [];
    analysisPolygonArray = [];
    globalAnalysisArrays = []; // 합필분석 모드에서 사용되는 전역 배열 초기화
}


function initializeClusterers() {
    if (!map) {
        //console.error("Map object is not initialized. Cannot initialize clusterers.");
        return;
    }
    // 'all' 클러스터러 초기화 (필요시 다른 타입별 클러스터러도 여기서 초기화)
    createClustererAll("all");
}
/**
 * 카카오맵 적용 함수
 */
async function initializeMap() {
    let zoomLevel = getCookie("curZoom") || 6;  // //zoomLevel 변경 5->6기본 줌 레벨 설정
    if (zoomLevel > 6) zoomLevel = 6;           // //zoomLevel 변경 5->6기본 줌 레벨 설정

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
    
    kakao.maps.event.addListener(map, 'tilesloaded', function() {
        //console.log("==== tilesloaded 이벤트 발생! ==="); // ✨ 이 로그가 콘솔에 찍히는지 확인
        //console.log("현재 REALPRICE_POLYGON_MODE 값:", REALPRICE_POLYGON_MODE); // ✨ REALPRICE_POLYGON_MODE 값도 확인
    
        initializeClusterers();
        handleMapEvents();
    
        if(REALPRICE_POLYGON_MODE == 1){
            //console.log("Mode 1 진입: BasedOnMapCenter 호출 시도"); // ✨
            fetchRealPriceAptBasedOnMapCenter();
        }
        else if(REALPRICE_POLYGON_MODE == 2){
            //console.log("Mode 2 진입: ArrayBasedOnMapCenter 호출 시도"); // ✨
            fetchRealPriceAptArrayBasedOnMapCenter();
        }
        else if(REALPRICE_POLYGON_MODE == 3){
            //console.log("Mode 3 진입: WidthCash_AutoPoint 호출 시도"); // ✨
            fetchRealPriceAptArrayBasedOnMapCenterWidthCash_AutoPoint();
        } else {
            //console.log("REALPRICE_POLYGON_MODE 값이 1, 2, 3이 아님. 현재 값:", REALPRICE_POLYGON_MODE); // ✨
        }
    }, { once: true });

    // 1) 초기 복원(= URL 있으면 저장 동기화만, 없으면 스토리지/쿠키/기본으로 복원)
    applyGlobalViewOnInit(map, { persist: 'both' });

    // 2) 이후 변경 자동 저장(dual-write)
    attachGlobalViewSaver(map, { persist: 'both' });

    infowindow = new kakao.maps.InfoWindow({ zIndex: 1 }); // 검색 결과 목록이나 마커를 클릭했을 때 장소명을 표출할 인포윈도우를 생성합니다

    // 마커 클러스터러를 생성합니다
    clusterer = new kakao.maps.MarkerClusterer({
        map: map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
        averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
        minLevel: 5, // 클러스터 할 최소 지도 레벨. 지정한 숫자에 해당하는 레벨 미만에서는 클러스터링 하지 않는다 (default : 0)
        gridSize: 60, // Number : 클러스터의 격자 크기. 화면 픽셀 단위이며 해당 격자 영역 안에 마커가 포함되면 클러스터에 포함시킨다 (default : 60)
        minClusterSize: 1, //  Number : 클러스터링 할 최소 마커 수 (default: 2)
        styles: [
            {
                width: "50px",
                height: "50px",
                backgroundColor: "#f48356",
                color: "#fff",
                fontSize: "14px",
                textAlign: "center",
                lineHeight: "50px", // lineHeight를 height와 동일하게 설정하여 텍스트를 수직 중앙에 위치시킵니다
                borderRadius: "50%", // 원형으로 만들기 위해 border-radius를 50%로 설정합니다
            },
            {
                width: "60px",
                height: "60px",
                backgroundColor: "#f48356",
                color: "#fff",
                fontSize: "16px",
                textAlign: "center",
                lineHeight: "60px", // lineHeight를 height와 동일하게 설정하여 텍스트를 수직 중앙에 위치시킵니다
                borderRadius: "50%", // 원형으로 만들기 위해 border-radius를 50%로 설정합니다
            },
            {
                width: "70px",
                height: "70px",
                backgroundColor: "#f48356",
                color: "#fff",
                fontSize: "18px",
                textAlign: "center",
                lineHeight: "70px", // lineHeight를 height와 동일하게 설정하여 텍스트를 수직 중앙에 위치시킵니다
                borderRadius: "50%", // 원형으로 만들기 위해 border-radius를 50%로 설정합니다
            },
            {
                width: "80px",
                height: "80px",
                backgroundColor: "#f48356",
                color: "#fff",
                fontSize: "20px",
                textAlign: "center",
                lineHeight: "80px", // lineHeight를 height와 동일하게 설정하여 텍스트를 수직 중앙에 위치시킵니다
                borderRadius: "50%", // 원형으로 만들기 위해 border-radius를 50%로 설정합니다
            },
        ], // Array.< Object > : 클러스터의 스타일. 여러개를 선언하면 calculator 로 구분된 사이즈 구간마다 서로 다른 스타일을 적용시킬 수 있다
        calculator: [1, 10, 30, 50], // Array.< Number > | Function : 클러스터 크기를 구분하는 값을 가진 배열 또는 구분값 생성함수 (default : [10, 100, 1000, 10000])
        disableClickZoom: false, // Boolean : 클러스터 클릭 시 지도 확대 여부. true로 설정하면 클러스터 클릭 시 확대 되지 않는다 (default: false)
        clickable: true, // Boolean : 클러스터 클릭 가능 여부 지정 옵션. false일 경우 클러스터의 clusterclick, clusterdblclick, clusterrightclick 이벤트가 발생하지 않으며, 커서가 변경되지 않는다. (default: true)
        hoverable: true, // Boolean : 클러스터에 마우스 over/out 가능 여부 지정 옵션. false일 경우 클러스터의 clusterover, clusterout 이벤트가 발생하지 않는다. (default: true)
    });

    // 툴박스
    toolbox();

    // 직선 거리 계산
    lineDrawer = createLineDrawer(map);
    // 원 반경 계산
    circleDrawer = createCircleDrawer(map);
    // 다각형 면적 계산
    polygonDrawer = createPolygonDrawer(map);

    // 법정동 상세 주소 정보를 요청
    searchDetailAddrFromCoords(kakaoCoords, function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
            const addressData = result[0].address;
            // 토지 실거래가 조회 및 바인딩
            realPriceDetailLand("land", addressData);
        }
        displayAddressInfo(result, status);
    });

    ///let coords = { lat: lat, lng: lng };
    // 건물 및 토지 정보를 동시에 가져오기
    ///handleMapClick(coords);
    // 주변 시설 정보 가져오기

    // --- 여기에 sessionStorage 로드 및 폴리곤 재현 로직 수정 ---
    const storedPolygonInfoString = sessionStorage.getItem('lastViewedPolygonInfo');
    let shouldCallHandleMapClick = true; // handleMapClick 호출 여부 제어

    if (storedPolygonInfoString) {
        try {
            const storedInfo = JSON.parse(storedPolygonInfoString);
            if (storedInfo && storedInfo.lat && storedInfo.lng) {
                const loadedCoords = { lat: storedInfo.lat, lng: storedInfo.lng };
                
                // 불러온 좌표로 handleMapClick을 호출합니다.
                // isLoading 플래그는 handleMapClick 내부에서 관리됩니다.
                await handleMapClick(loadedCoords); 
                shouldCallHandleMapClick = false; // 기본 handleMapClick 호출 방지
            }
        } catch (e) {
            console.error("sessionStorage 데이터 파싱 오류:", e);
        }
    }

    // sessionStorage에 정보가 없거나 오류 발생 시, 기존 URL/쿠키 기반 로직으로 처리
    if (shouldCallHandleMapClick) {
        let initialCoords = { lat: lat, lng: lng }; // URL/쿠키에서 가져온 기본 좌표
        await handleMapClick(initialCoords);
    }
    // --- sessionStorage 로드 및 폴리곤 재현 로직 끝 ---

    //const coords = { lat: lat, lng: lng };
    //searchArroundPlaces(coords);  // 현재 이함수는 하는 일이 없음

    // 텍스트 모듈과 selectOverlay 함수 결합
    textModuleControl = addTextToMap(map); // 지도에 텍스트 모듈을 연결

    initRoadView();

    // geocoder.coord2RegionCode(lng, lat, function (result, status) {
    //     if (status === kakao.maps.services.Status.OK) {
    //         let sggCd = result[0].code.substring(0, 7);
    //         // if (level <= "3") {
    //         // } else if (level == "4") {
    //         //     sggCd = result[0].code.substring(0, 8);
    //         // } else if (level == "5") {
    //         //     sggCd = result[0].code.substring(0, 8);
    //         // } else if (level == "6") {
    //         //     sggCd = result[0].code.substring(0, 7);
    //         // } else if (level > "6" && level < "9") {
    //         //     sggCd = result[0].code.substring(0, 5);
    //         // } else if (level >= "9") {
    //         //     sggCd = result[0].code.substring(0, 2);
    //         // }
    //         realPriceApt(sggCd);
    //     }
    // });

    
    return;

    // =================================================================
    // url에 좌표 값이 있을 때
    // =================================================================
    // 필요한 파라미터 및 쿠키를 한 번에 업데이트합니다

    // 이동할 위도 경도 위치를 생성합니다
    // var coords = new kakao.maps.LatLng(lat, lng);

    // 법정동 상세 주소 정보를 요청
    // searchDetailAddrFromCoords(coords, displayAddressInfo);

    // =================================================================
    // 폴리곤 테스트
    // =================================================================

    const polygonArray = [
        [
            [127.02412746223159, 37.492964592844103],
            [127.024296745606037, 37.492610197048307],
            [127.024559368948161, 37.492060265812839],
            [127.024796675907965, 37.491563407841404],
            [127.023653828601269, 37.49122007613731],
            [127.023066399690279, 37.492788195154318],
            [127.02406677745752, 37.493091555328974],
            [127.02412746223159, 37.492964592844103],
        ],
    ];

    const polygonArray2 = [
        [
            [126.995564847628458, 37.507935286584306],
            [126.998192724630087, 37.509092369716591],
            [126.998204352300363, 37.509075611490665],
            [126.998699496207223, 37.508361944214123],
            [126.999080540455438, 37.508529123773769],
            [126.999170631602396, 37.508345772596314],
            [126.999257148078868, 37.508170295995015],
            [126.999442192037492, 37.507785131917409],
            [127.000093350179142, 37.506337039937655],
            [127.000424670927558, 37.505604811458909],
            [127.000560560724139, 37.505326602472728],
            [127.000634075261289, 37.505186434780121],
            [127.000543363013136, 37.504995134158023],
            [127.000340729426028, 37.504933864444205],
            [127.000129774284858, 37.505376567549412],
            [126.998647046850522, 37.504928168159054],
            [126.998611350800672, 37.505003148346908],
            [126.997771657681966, 37.504749187404904],
            [126.995564847628458, 37.507935286584306],
        ],
    ];

    const polygonArray3 = [
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
    ];

    const polygonArray4 = [
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

    drawPolygon(polygonArray4);
    const testCoords = getPolygonCenter(polygonArray4);
    const testCoords2 = getPolygonCentroid(polygonArray4);

    const testLng = 126.99556484762846;
    const testLat = 37.504749187404904;
    const testLng2 = 127.02306639969028;
    const testLat2 = 37.49122007613731;

    // 이동할 위도 경도 위치를 생성합니다
    var testCoordsKakao = new kakao.maps.LatLng(testCoords[1], testCoords[0]);

    // 법정동 상세 주소 정보를 요청
    searchDetailAddrFromCoords(testCoordsKakao, displayAddressInfo);

    // // 이동된 중심에 마커를 생성하고 지도에 표시한다.
    // const marker1 = new kakao.maps.Marker({
    //     map: map,
    //     position: new kakao.maps.LatLng(testCoords[1], testCoords[0]),
    // });

    // 이동된 중심에 마커를 생성하고 지도에 표시한다.
    const marker2 = new kakao.maps.Marker({
        map: map,
        position: new kakao.maps.LatLng(testCoords2[1], testCoords2[0]),
    });

    // 클릭된 마커
    markers.forEach((marker) => marker.setMap(null)); // 기존 마커를 모두 제거한다.
    markers.push(marker); // 새로운 마커를 마커 배열에 추가한다.

    // geocoder.coord2RegionCode(wtmX, wtmY, callback, {
    //     input_coord: kakao.maps.services.Coords.TM,
    //     output_coord: kakao.maps.services.Coords.WGS84,
    // });

    // // WTM 좌표를 WGS84 좌표계의 좌표로 변환합니다
    // geocoder.transCoord(wtmX, wtmY, transCoordCB, {
    //     input_coord: kakao.maps.services.Coords.TM, // 변환을 위해 입력한 좌표계 입니다
    //     output_coord: kakao.maps.services.Coords.WGS84, // 변환 결과로 받을 좌표계 입니다
    // });

    // updateURL({
    //     curLat: lat,
    //     curLng: lng,
    // });

    // URL에서 좌표 값이 있을 경우 지도 중심 설정
    // handleUrlChange();
    return;

    // URL에서 좌표 및 주소를 가져와 지도를 설정합니다.
    const url = new URL(window.location.href);
    const addressText = url.searchParams.get("address");
    const latText = url.searchParams.get("lat");
    const lngText = url.searchParams.get("lng");

    // URL에서 좌표 쿼리 파라미터가 있다면 지도 중심 좌표로 설정한다.
    if (latText && lngText) {
        lat = latText;
        lng = lngText;

        setCookie("curLat", lat);
        setCookie("curLng", lng);

        map.setCenter(new kakao.maps.LatLng(lat, lng));
    }

    // // 이동된 중심에 마커를 생성하고 지도에 표시한다.
    // const marker = new kakao.maps.Marker({
    //     map: map,
    //     position: new kakao.maps.LatLng(lat, lng),
    // });

    // // 클릭된 마커
    // markers.forEach((marker) => marker.setMap(null)); // 기존 마커를 모두 제거한다.
    // markers.push(marker); // 새로운 마커를 마커 배열에 추가한다.

    return;
    try {
        // 지도 중심 좌표 업데이트
        const addressInfo = await updateAddressInfo();

        // 건물, 토지 정보 업데이트
        buildingDetail(addressInfo);

        // 정보탭 랜더링
        await renderInformation(1, $("#mapSearchInput").val());

        // 무한 스크롤
        infiniteScroll();
    } catch (error) {
        console.error("Error updating address information:", error);
    }
}

/**
 * 지도 중심 좌표의 주소 정보를 업데이트하는 함수
 */
async function updateAddressInfo() {
    return new Promise(async (resolve, reject) => {
        setCookie("beforeKeyword", getCookie("afterKeyword"));

        const center = map.getCenter();
        const lat = center.getLat();
        const lng = center.getLng();
        setCookie("curLat", lat, 1);
        setCookie("curLng", lng, 1);

        return;
        try {
            const bjdAddressInfo = await searchDetailAddrFromCoords(center);
            const hjdAddressInfo = await searchAddrFromCoords(center);

            if (bjdAddressInfo && bjdAddressInfo.length > 0) {
                // 지번 주소
                const bjdAddressName = bjdAddressInfo[0].address.address_name;

                // 법정동 코드 (리 까지)
                const hjdResult = hjdAddressInfo.filter((item) => item.region_type === "B");
                const { code: bjdCode } = hjdResult[0];

                // 행정동 주소 (읍면동 까지)
                const hjdResult2 = hjdAddressInfo.filter((item) => item.region_type === "H");
                const { address_name: hjdAddressName2 } = hjdResult2[0];

                setCookie("afterKeyword", hjdAddressName2);
                $("#mapSearchInput").val(hjdAddressName2);

                // // 건물, 토지 정보 업데이트
                // buildingDetail({ bjdCd: bjdCode, address_first: bjdAddressName });

                resolve({ bjdCd: bjdCode, address_first: bjdAddressName });
            } else {
                reject("Failed to get address information");
            }
        } catch (error) {
            reject("Failed to get address information");
        }
    });
}

/**
 * 좌표를 이용해 행정동 주소 정보를 요청하는 함수
 *
 * @param {kakao.maps.LatLng} coords - 검색할 위치의 좌표 객체 (위도와 경도 포함)
 * @param {function} callback - 주소 정보를 반환받을 콜백 함수. 요청 결과와 상태를 인자로 받습니다.
 */
function searchAddrFromCoords(coords, callback) {
    geocoder.coord2RegionCode(coords.getLng(), coords.getLat(), callback);
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
 * 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
 * @param {*} position
 * @param {*} idx
 * @param {*} title
 * @returns
 */
function addMarker(position, idx, title) {
    var imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png", // 마커 이미지 url, 스프라이트 이미지를 씁니다
        imageSize = new kakao.maps.Size(36, 37), // 마커 이미지의 크기
        imgOptions = {
            spriteSize: new kakao.maps.Size(36, 691), // 스프라이트 이미지의 크기
            spriteOrigin: new kakao.maps.Point(0, idx * 46 + 10), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
            offset: new kakao.maps.Point(13, 37), // 마커 좌표에 일치시킬 이미지 내에서의 좌표
        },
        markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions),
        marker = new kakao.maps.Marker({
            position: position, // 마커의 위치
            image: markerImage,
        });

    // marker.setMap(map); // 지도 위에 마커를 표출합니다
    markers.push(marker); // 배열에 생성된 마커를 추가합니다

    return marker;
}

/**
 * 지도 위에 표시되고 있는 마커를 모두 제거합니다
 */
function removeMarker(markerGroup) {
    for (var i = 0; i < markerGroup.length; i++) {
        markerGroup[i].setMap(null);
    }
    markerGroup = [];
}

/**
 * 검색결과 목록 하단에 페이지번호를 표시는 함수입니다
 * @param {*} pagination
 */
function displayPagination(pagination) {
    var paginationEl = document.getElementById("pagination"),
        fragment = document.createDocumentFragment(),
        i;

    // 기존에 추가된 페이지번호를 삭제합니다
    while (paginationEl.hasChildNodes()) {
        paginationEl.removeChild(paginationEl.lastChild);
    }

    for (i = 1; i <= pagination.last; i++) {
        var el = document.createElement("a");
        el.href = "#";
        el.innerHTML = i;

        if (i === pagination.current) {
            el.className = "on";
        } else {
            el.onclick = (function (i) {
                return function () {
                    pagination.gotoPage(i);
                };
            })(i);
        }

        fragment.appendChild(el);
    }
    paginationEl.appendChild(fragment);
}

/**
 * 검색결과 목록 또는 마커를 클릭했을 때 호출되는 함수입니다
 * 인포윈도우에 장소명을 표시합니다
 * @param {*} marker
 * @param {*} title
 */
function displayInfowindow(marker, title) {
    var content = '<div style="padding:5px;z-index:1;">' + title + "</div>";

    infowindow.setContent(content);
    infowindow.open(map, marker);
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
 * url 파라미터 변경 함수
 * @param {*} paramsToUpdate = object
 */
async function updateURL(paramsToUpdate) {
    // 현재 URL을 가져옵니다
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    // 여러 파라미터를 업데이트합니다
    for (const [key, value] of Object.entries(paramsToUpdate)) {
        params.set(key, value);
        setCookie(key, value); // 쿠키 업데이트
    }

    // 새로 수정된 query string을 URL에 반영합니다
    url.search = params.toString();

    // 변경된 URL을 브라우저 히스토리에 반영합니다
    window.history.pushState({}, "", url); // URL을 변경하지만 페이지를 새로고침하지 않음
}

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

    // 주소 요청
    searchDetailAddrFromCoords(kakaoCoords, function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
            handleMapClick(coords); // 건물 및 토지 정보를 동시에 가져오기
            // searchArroundPlaces(coords); // 주변 시설 정보 가져오기
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

async function getLandBuildingPolygon(coords) {
    const url = "/front/back/realPrice/building_info.php";
    const dataObj = {
        geomFilter: `POINT(${coords.lng} ${coords.lat})`, // 좌표
        geometry: true, // 폴리곤 정보를 포함
        attribute: true, // 속성 정보를 포함
    };
    const result = await callApi("POST", url, dataObj);

    return result;
}

/**
 * 건축물정보 가져오는 함수
 * @param {*} buildingInfos
 */
async function getBuilindInfo(buildingInfos) {
    // returnPolygons 초기화
    let returnPolygons = [];

    // 합필분석 모드시 빈값 반환
    if (isMultiSelectMode) return returnPolygons;

    // 중복을 제거하기 위한 Map
    let uniqueFeaturesMap = new Map();

    // buildingPolygon과 buildingPolygon2의 features 처리 함수
    function processPolygon(polygonData) {
        const features = polygonData.features;

        // features가 비어있지 않으면 처리
        if (features && features.length > 0) {
            features.forEach(function (feature) {
                const gisIdntfcNo = feature.properties.gis_idntfc_no;

                // 중복되지 않은 경우에만 처리
                if (!uniqueFeaturesMap.has(gisIdntfcNo)) {
                    uniqueFeaturesMap.set(gisIdntfcNo, feature);

                    const coordinates = feature.geometry.coordinates[0][0];
                    const polygonPath = coordinates.map((coord) => new kakao.maps.LatLng(coord[1], coord[0]));
                    const polygon = new kakao.maps.Polygon({
                        path: polygonPath,
                        strokeWeight: 2,
                        strokeColor: "#FF0000",
                        strokeOpacity: 1,
                        strokeStyle: "shortdot",
                        fillColor: "#FFAAAA",
                        fillOpacity: 0,
                        zIndex: 10, // zIndex를 높게 설정하여 지적도 폴리곤 위에 표시
                    });
                    returnPolygons.push(polygon);
                    buildingPolygons.push(polygon); // 전역 변수에도 추가
                }
            });
        }
    }

    // buildingPolygon 처리
    processPolygon(buildingInfos.buildingPolygon);

    // buildingPolygon2 처리
    processPolygon(buildingInfos.buildingPolygon2);

    // const features = result.features;

    // features.forEach(function (feature) {
    //     const coordinates = feature.geometry.coordinates[0][0];
    //     const polygonPath = coordinates.map((coord) => new kakao.maps.LatLng(coord[1], coord[0]));
    //     const polygon = new kakao.maps.Polygon({
    //         path: polygonPath,
    //         strokeWeight: 2,
    //         strokeColor: "#FF0000",
    //         strokeOpacity: 1,
    //         strokeStyle: "shortdot",
    //         fillColor: "#FFAAAA",
    //         fillOpacity: 0,
    //         zIndex: 10, // zIndex를 높게 설정하여 지적도 폴리곤 위에 표시
    //     });
    //     returnPolygons.push(polygon);
    // });

    // // 성공적으로 데이터가 반환된 경우
    // if (result.response.status && result.response.status === "OK") {
    //     const features = result.response.result.featureCollection.features;

    //     if (features.length > 50) return;

    //     // returnPolygons 초기화
    //     let returnPolygons = [];

    //     // 받은 건물 정보를 바탕으로 returnPolygons에 실제 Polygon 객체를 저장
    //     features.forEach(function (feature) {
    //         const coordinates = feature.geometry.coordinates[0][0];
    //         const polygonPath = coordinates.map((coord) => new kakao.maps.LatLng(coord[1], coord[0]));
    //         const polygon = new kakao.maps.Polygon({
    //             path: polygonPath,
    //             strokeWeight: 2,
    //             strokeColor: "#FF0000",
    //             strokeOpacity: 1,
    //             strokeStyle: "shortdot",
    //             fillColor: "#FFAAAA",
    //             fillOpacity: 0,
    //             zIndex: 10, // zIndex를 높게 설정하여 지적도 폴리곤 위에 표시
    //         });
    //         returnPolygons.push(polygon);
    //     });

    // 전역 변수 buildingPolygons returnPolygons의 값들을 추가
    buildingPolygons.push(...returnPolygons);

    return returnPolygons;

    //     // polygonPaths.forEach(addBuildingPolygon);

    //     // features.forEach(function (feature) {
    //     //     const properties = feature.properties;
    //     //     const coordinates = feature.geometry.coordinates[0][0];

    //     //     // 좌표를 카카오 맵의 LatLng 객체로 변환
    //     //     const polygonPath = coordinates.map((coord) => new kakao.maps.LatLng(coord[1], coord[0]));

    //     //     addBuildingPolygon(polygonPath);
    //     // });

    //     // return bbox;
    // }
}
// bbox를 받아서 카카오맵에 폴리곤을 그리는 함수
function drawBBoxOnMap(bbox) {
    // bbox 배열은 [minLon, minLat, maxLon, maxLat] 형식일 것임
    const minLon = bbox[0]; // 좌하단 경도
    const minLat = bbox[1]; // 좌하단 위도
    const maxLon = bbox[2]; // 우상단 경도
    const maxLat = bbox[3]; // 우상단 위도

    // 직사각형의 네 꼭짓점을 정의
    const polygonPath = [
        new kakao.maps.LatLng(minLat, minLon), // 좌하단
        new kakao.maps.LatLng(maxLat, minLon), // 좌상단
        new kakao.maps.LatLng(maxLat, maxLon), // 우상단
        new kakao.maps.LatLng(minLat, maxLon), // 우하단
    ];

    // 카카오맵에 폴리곤을 그리기 위한 객체 생성
    const polygon = new kakao.maps.Polygon({
        path: polygonPath, // 폴리곤 경로 설정
        strokeWeight: 1, // 선 두께
        strokeColor: "#FF0000", // 선 색상
        strokeOpacity: 0.8, // 선 불투명도
        strokeStyle: "solid", // 선 스타일
        fillColor: "#FFAAAA", // 채우기 색상
        fillOpacity: 0, // 채우기 불투명도
        zIndex: 1, // 폴리곤 우선순위
    });

    // 생성한 폴리곤을 지도에 표시
    polygon.setMap(map);
}

/**
 * 토지정보 가져오는 함수
 * @param {*} coords
 */
async function getLandInfo(result) {
    // 토지만 따로 가져오기
    // async function getLandInfo(coords) {
    // const geomFilter = `POINT(${coords.lng} ${coords.lat})`;
    // const url = "/front/back/realPrice/land_info.php";
    // const dataObj = {
    //     geomFilter: geomFilter,
    //     geometry: true, // 폴리곤 정보를 포함
    //     attribute: true, // 속성 정보를 포함
    // };
    // const result = await callApi("POST", url, dataObj);

    // 성공적으로 데이터가 반환된 경우
    if (result.response.status && result.response.status === "OK") {
        const features = result.response.result.featureCollection.features;
        const bbox = result.response.result.featureCollection.bbox;
        // drawBBoxOnMap(bbox);
        // bbox 좌표 변환
        // 좌하단 좌표와 우상단 좌표 각각 변환
        const lowerLeft = proj4("EPSG:4326", "EPSG:5186", [bbox[0], bbox[1]]); // 좌하단 좌표 (lc1, lc2)
        const upperRight = proj4("EPSG:4326", "EPSG:5186", [bbox[2], bbox[3]]); // 우상단 좌표 (uc1, uc2)

        // 변환된 bbox 값 (하단좌표, 상단좌표 형식 유지)
        const transformedBbox = [
            lowerLeft[0],
            lowerLeft[1], // 변환된 하단 좌표
            upperRight[0],
            upperRight[1], // 변환된 상단 좌표
        ];

        // console.log("Original BBox:", bbox);
        // console.log("Transformed BBox:", transformedBbox);

        // returnPolygons 초기화
        let returnPolygons = [];
        let turfLandPolygons = []; // Turf.js로 사용할 폴리곤 리스트
        let geojsonPolygon = null; // Turf.js로 사용할 토지 폴리곤

        let strokeColor = "#0000FF";
        let fillColor = "#AAAAFF";

        // 합필분석 모드일 때, 선택된 색으로 변경
        if (isMultiSelectMode) {
            strokeColor = $(".mo-land input[type=radio]:checked").val();
            fillColor = $(".mo-land input[type=radio]:checked").val();
        }

        // 받은 지적도 정보를 바탕으로 returnPolygons에 실제 Polygon 객체를 저장
        features.forEach(function (feature) {
            const coordinates = feature.geometry.coordinates[0][0];
            // const testCoords2 = getPolygonCentroid(coordinates);
            // console.log(testCoords2);
            // const centerCoords = new kakao.maps.LatLng(testCoords2[1], testCoords2[0]);

            const polygonPath = coordinates.map((coord) => new kakao.maps.LatLng(coord[1], coord[0]));
            const polygon = new kakao.maps.Polygon({
                path: polygonPath,
                strokeWeight: 1,
                strokeColor: strokeColor,
                strokeOpacity: 1,
                strokeStyle: "solid",
                fillColor: fillColor,
                fillOpacity: 0.5,
                zIndex: 6, // zIndex를 낮게 설정하여 건물 폴리곤 아래에 표시
            });

            const miniMapPolygon = new kakao.maps.Polygon({
                path: polygonPath,
                strokeWeight: 1,
                strokeColor: "#0000FF",
                strokeOpacity: 1,
                strokeStyle: "solid",
                fillColor: "#AAAAFF",
                fillOpacity: 0.5,
                zIndex: 5, // zIndex를 낮게 설정하여 건물 폴리곤 아래에 표시
            });

            polygon.pnu = feature.properties.pnu;
            polygon.uniqueId = Math.random().toString(36).substr(2, 9); // 임시 Unique ID 부여
            miniMapPolygon.pnu = feature.properties.pnu;
            
            //console.log("Newly created polygon PNU:", polygon.pnu); // 이 로그가 찍히는지, 값이 맞는지 확인
            //console.log("Feature properties PNU:", feature.properties.pnu); // 원본 PNU도 확인

            geojsonPolygon = turf.polygon([coordinates]); // GeoJSON 형식으로 변환

            returnPolygons.push(polygon);

            // 전역 변수 landPolygons에 지적도 폴리곤 값들을 추가
            landPolygons.push(polygon);
            landPolygonsMiniMap.push(miniMapPolygon);

            //console.log("getLandInfo: Polygon Created & Pushed", { pnu: polygon.pnu, id: polygon.uniqueId, instance: polygon });

            // =================================================
            // 미니맵 관련 로직
            // =================================================
            // 폴리곤의 좌표 배열에서 LatLngBounds 생성
            const bounds = new kakao.maps.LatLngBounds();

            // 이중 배열을 풀어서 폴리곤의 모든 좌표를 bounds에 추가
            coordinates.forEach((coord) => {
                const latLng = new kakao.maps.LatLng(coord[1], coord[0]); // 좌표를 kakao.maps.LatLng 객체로 변환
                bounds.extend(latLng); // LatLngBounds에 좌표를 추가하여 범위를 확장

                // 최소/최대 경도 및 위도 계산
                // if (coord[0] < minLon) minLon = coord[0];
                // if (coord[1] < minLat) minLat = coord[1];
                // if (coord[0] > maxLon) maxLon = coord[0];
                // if (coord[1] > maxLat) maxLat = coord[1];
            });

            // 폴리곤의 중심 좌표 계산
            const centerCoords = getPolygonCentroid(feature.geometry.coordinates[0][0]);
            miniMap.setCenter(new kakao.maps.LatLng(centerCoords.lat, centerCoords.lng)); // 미니맵에 중심 좌표 설정
            miniMap.setBounds(bounds); // 폴리곤이 표시될 수 있도록 지도 레벨을 자동 조정
        });

        // bbox 생성
        // const newBbox = [minLon, minLat, maxLon, maxLat];
        // console.log("Calculated BBox:", newBbox);

        const pnu = features[0].properties.pnu;
        BuildingDetail(pnu); // 건축물대장조회
        landDetail(pnu); // 토지특성속성조회
        getRequestHistory(pnu); // 금융 신청일 가져오기

        // 합필분석 모드가 아닐 때, 토지 폴리곤 초기화
        if (!isMultiSelectMode) {
            landWFSArrays = [];
        }
        // 분석탭을 위한 토지 폴리곤 저장
        landWFSArrays.push({ pnu, bbox: transformedBbox, landGeoJson: geojsonPolygon });

        return returnPolygons;

        // features.forEach(function (feature) {
        //     const properties = feature.properties;
        //     const coordinates = feature.geometry.coordinates[0][0];

        //     // 좌표를 카카오 맵의 LatLng 객체로 변환
        //     const polygonPath = coordinates.map((coord) => new kakao.maps.LatLng(coord[1], coord[0]));

        //     addLandPolygon(polygonPath);
        // });
        // miniMap.setCenter(miniMapCoords); // 미니맵 위치 변경
    }
}

/**
 * 건물 폴리곤을 추가하는 함수
 * @param {Array} polygonPath
 */
function addBuildingPolygon(polygonPath) {
    const polygon = new kakao.maps.Polygon({
        path: polygonPath,
        strokeWeight: 2,
        strokeColor: "#FF0000",
        strokeOpacity: 1,
        strokeStyle: "shortdot",
        fillColor: "#FFAAAA",
        fillOpacity: 0,
        zIndex: 10, // zIndex를 높게 설정하여 지적도 폴리곤 위에 표시
    });

    polygon.setMap(map);
    buildingPolygons.push(polygon);
}

/**
 * 토지 폴리곤을 추가하는 함수
 * @param {Array} polygonPath
 */
function addLandPolygon(polygonPath) {
    const polygon = new kakao.maps.Polygon({
        path: polygonPath,
        strokeWeight: 1,
        strokeColor: "#0000FF",
        strokeOpacity: 1,
        strokeStyle: "solid",
        fillColor: "#AAAAFF",
        fillOpacity: 0.5,
        zIndex: 5, // zIndex를 낮게 설정하여 건물 폴리곤 아래에 표시
    });

    polygon.setMap(map);
    landPolygons.push(polygon);
}

/**
 * 다중 선택 모드에서 새로 선택된 영역을 추가
 * 사용 X
 * @param {*} polygonPath
 * @param {*} type
 */
function addPolygon(polygonPath, type) {
    let strokeColor, fillColor, strokeStyle;

    const polygon = new kakao.maps.Polygon({
        path: polygonPath,
        strokeWeight: 3,
        strokeColor: strokeColor,
        strokeOpacity: 1,
        strokeStyle: strokeStyle,
        fillColor: fillColor,
        fillOpacity: 0.5,
    });

    polygon.setMap(map);
    selectedPolygons.push(polygon);
}

/**
 * 폴리라인 그리는 함수
 * @param {*} path
 */
function addPolyline(path) {
    const polyline = new kakao.maps.Polyline({
        path: path,
        strokeWeight: 5,
        strokeColor: "#FF0000",
        strokeOpacity: 0.7,
        strokeStyle: "solid",
    });

    polyline.setMap(map);
}

/**
 * 실거래가 가져오는 함수
 * @param {*} result
 * @param {*} status
 */
async function getRealPrice(result, status) {
    if (status === kakao.maps.services.Status.OK) {
        const url = "/front/back/realPrice/test.php";
        const deal_ymd = "20240701";

        for (var i = 0; i < result.length; i++) {
            // // 행정동의 region_type 값은 'H' 이므로
            // if (result[i].region_type === "H") {
            //     let lawd_cd = result[i].code;
            //     lawd_cd = lawd_cd.substring(0, 5);
            //     const result = await callApi("POST", url, { lawd_cd, deal_ymd });
            //     break;
            // }

            // 행정동의 region_type 값은 'H' 이므로
            if (result[i].region_type === "B") {
                let lawd_cd = result[i].code;
                lawd_cd = lawd_cd.substring(0, 5);
                const result = await callApi("POST", url, { lawd_cd, deal_ymd });
                break;
            }
        }
    }
}

async function showRealPrice(geomFilter, buffer) {
    const url = "/front/back/realPrice/realPrice_apartment.php";
    const dataObj = {
        geomFilter: geomFilter,
        geometry: false, // 폴리곤 정보를 포함
        attribute: true, // 속성 정보를 포함
        buffer: buffer, // 반경
    };
    const result = await callApi("POST", url, dataObj);

    markers = [];
    $.each(result, function (index, item) {
        const pnu = item.pnu;
        const lat = item.latitude;
        const lng = item.longitude;
        const latlng = new kakao.maps.LatLng(lat, lng);

        // 이동된 중심에 마커를 생성하고 지도에 표시한다.
        const marker = {
            title: pnu,
            latlng: latlng,
        };

        // 클릭된 마커
        markers.push(marker); // 새로운 마커를 마커 배열에 추가한다.

        var iwContent = `
        <div class="real-price-marker" style="padding:5px;">
            <ul class="text-center bg-white border border-danger overflow-hidden" style="border-radius:10px;">
                <li class="up bg-white p-1">
                    <span class="number">${item.dealAmount}</span>
                </li>
                <li class="text-white p-1" style="background-color:var(--var-color-main-1)">
                    <span class="number">${item.dealYear}</span>
                </li>
            </ul>
            <p class="position-absolute" style="margin:-5px 0 0 20px; "><img src="/front/assets/image/icn_arr_mark.svg" width="15" alt="" title=""></p>
        </div>
        `; // 인포윈도우에 표출될 내용으로 HTML 문자열이나 document element가 가능합니다
        let iwPosition = new kakao.maps.LatLng(lat, lng); //인포윈도우 표시 위치입니다
        let iwRemoveable = false; // removeable 속성을 ture 로 설정하면 인포윈도우를 닫을 수 있는 x버튼이 표시됩니다

        // <div class="map-mark1" style="top:300px; left:50%; z-index:1;">
        //     <h2>${item.dealAmount}</h2>
        //     <h3>${item.dealYear}</h3>
        //     <p><img src="/front/assets/image/icn_arr_mark.svg" width="15" alt="" title=""></p>
        // </div>
        // // 인포윈도우를 생성하고 지도에 표시합니다
        // var infowindow = new kakao.maps.InfoWindow({
        //     map: map, // 인포윈도우가 표시될 지도
        //     position: iwPosition,
        //     content: iwContent,
        //     removable: iwRemoveable,
        // });

        // 커스텀 오버레이를 생성합니다
        var customOverlay = new kakao.maps.CustomOverlay({
            clickable: true,
            content: iwContent,
            map: map,
            position: iwPosition,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 1,
        });

        // 커스텀 오버레이를 지도에 표시합니다
        customOverlay.setMap(map);
    });

    for (var i = 0; i < markers.length; i++) {}

    return result;
}

// 좌표 변환 결과를 받아서 처리할 콜백함수 입니다.
function transCoordCB(result, status) {
    // 정상적으로 검색이 완료됐으면
    if (status === kakao.maps.services.Status.OK) {
        //console.log(result);
        searchAddrFromCoords(new kakao.maps.LatLng(result[0].y, result[0].x), function () {
            //console.log(result[0].y, result[0].x);
        });

        return;

        // 마커를 변환된 위치에 표시합니다
        var marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(result[0].y, result[0].x), // 마커를 표시할 위치입니다
            map: map, // 마커를 표시할 지도객체입니다
        });
    }
}

function drawPolygon(polygonArray) {
    // 폴리곤을 그리기 위한 경로 배열 생성
    const path = polygonArray[0].map((coord) => new kakao.maps.LatLng(coord[1], coord[0]));

    // 폴리곤 옵션 설정
    const polygon = new kakao.maps.Polygon({
        map: map,
        path: path, // 그려질 폴리곤 경로
        strokeWeight: 3, // 선의 두께
        strokeColor: "#FF0000", // 선의 색
        strokeOpacity: 0.8, // 선의 불투명도
        strokeStyle: "solid", // 선의 스타일
        fillColor: "#FF0000", // 채우기 색깔
        fillOpacity: 0.5, // 채우기 불투명도
    });

    // 지도 중심을 폴리곤의 첫 번째 좌표로 이동
    map.setCenter(path[0]);
}

/**
 * 면좌표계에서 무게 중심을 계산한 후, 해당 점이 폴리곤 내부에 있는지 확인
 * 외부에 있다면 가장 가까운 폴리곤 경계점으로 보정
 *
 * @param {*} coords
 * @returns
 */
function getPolygonCentroid(coords) {
    let countCoords = coords.length;
    let xcos = 0.0;
    let ycos = 0.0;
    let zsin = 0.0;

    coords.forEach((coord) => {
        let lat = (coord[1] * Math.PI) / 180; // 위도
        let lon = (coord[0] * Math.PI) / 180; // 경도

        let acos = Math.cos(lat) * Math.cos(lon);
        let bcos = Math.cos(lat) * Math.sin(lon);
        let csin = Math.sin(lat);

        xcos += acos;
        ycos += bcos;
        zsin += csin;
    });

    xcos /= countCoords;
    ycos /= countCoords;
    zsin /= countCoords;

    let lon = Math.atan2(ycos, xcos);
    let sqrt = Math.sqrt(xcos * xcos + ycos * ycos);
    let lat = Math.atan2(zsin, sqrt);

    let centroid = {
        lat: (lat * 180) / Math.PI,
        lng: (lon * 180) / Math.PI,
    };

    // 폴리곤 내부에 있는지 확인
    if (isPointInPolygon([centroid.lng, centroid.lat], coords)) {
        return centroid; // 폴리곤 내부에 있다면 그대로 반환
    } else {
        // 폴리곤 외부에 있다면 가장 가까운 점을 찾음
        let closestPoint = findClosestPointOnPolygon([centroid.lng, centroid.lat], coords);
        return {
            lat: closestPoint[1],
            lng: closestPoint[0],
        };
    }
}

/**
 * 주어진 점이 폴리곤 내부에 있는지 확인
 * @param {*} point
 * @param {*} polygon
 * @returns
 */
function isPointInPolygon(point, polygon) {
    let [x, y] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0],
            yi = polygon[i][1];
        let xj = polygon[j][0],
            yj = polygon[j][1];
        let intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * 폴리곤 경계에서 주어진 점과 가장 가까운 점을 찾기
 * @param {*} point
 * @param {*} polygon
 * @returns
 */
function findClosestPointOnPolygon(point, polygon) {
    let closestPoint = null;
    let closestDist = Infinity;

    for (let i = 0; i < polygon.length; i++) {
        let p1 = polygon[i];
        let p2 = polygon[(i + 1) % polygon.length];
        let candidate = getClosestPointOnSegment(point, p1, p2);
        let dist = distanceBetweenPoints(point, candidate);
        if (dist < closestDist) {
            closestDist = dist;
            closestPoint = candidate;
        }
    }

    return closestPoint;
}

/**
 * 선분(p1, p2) 위에서 주어진 점과 가장 가까운 점을 찾
 * @param {*} p
 * @param {*} p1
 * @param {*} p2
 * @returns
 */
function getClosestPointOnSegment(p, p1, p2) {
    let x = p[0],
        y = p[1];
    let x1 = p1[0],
        y1 = p1[1];
    let x2 = p2[0],
        y2 = p2[1];

    let dx = x2 - x1;
    let dy = y2 - y1;

    if (dx === 0 && dy === 0) {
        // p1과 p2가 동일한 점이라면
        return p1;
    }

    let t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);

    if (t < 0) {
        return p1;
    } else if (t > 1) {
        return p2;
    } else {
        return [x1 + t * dx, y1 + t * dy];
    }
}

/**
 * 두 점 사이의 유클리드 거리를 계산
 * @param {*} p1
 * @param {*} p2
 * @returns
 */
function distanceBetweenPoints(p1, p2) {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
}

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

// 버튼 클릭 시 호출되는 핸들러 입니다
function selectOverlay(element, type) {
    // 이미 활성화된 버튼인지 확인
    var isActive = element.classList.contains("active");

    // 모든 a 요소의 active 클래스 제거
    $("#draw_toolbox a").removeClass("active");

    // 만약 활성화된 상태에서 다시 클릭되었으면 취소하고 return
    if (isActive) {
        // 텍스트 모듈 중지
        textModuleControl.stop(); // 텍스트 입력 중지
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
        textModuleControl.start();
    } else {
        // 클릭한 그리기 요소 타입을 선택합니다
        manager.select(kakao.maps.drawing.OverlayType[type]);
        textModuleControl.stop(); // 텍스트 입력 중지
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

function recentVisit(address) {
    const user = userInfo();
    if (!user) return;

    geocoder.addressSearch(
        address,
        function (data, status, pagination) {
            if (status === daum.maps.services.Status.OK) {
                const result = data[0];

                const lat = result.y;
                const lng = result.x;
                const address_name = result.address_name;
                const b_code = result.address.b_code; // 법정동코드
                const mountain_yn = result.address.mountain_yn === "Y" ? "1" : "0"; // 산 여부 (평지면 0, 산이면 1)
                const main_address_no = result.address.main_address_no.padStart(4, "0"); // 본번 (4자리로 변환, 앞에 0을 채워서 4자리로 만듦)
                const sub_address_no = result.address.sub_address_no ? result.address.sub_address_no.padStart(4, "0") : "0000"; // 부번 (부번이 없으면 0000, 있으면 4자리로 변환)
                const pnu = b_code + mountain_yn + main_address_no + sub_address_no; // PNU 생성

                const dataObj = {
                    ...user,
                    address: encodeURIComponent(address_name),
                    lat: encodeURIComponent(lat),
                    lng: encodeURIComponent(lng),
                    pnu: encodeURIComponent(pnu),
                };

                callApiAbort("/front/back/history/recent_visit_register_realPrice.php", "POST", dataObj, "recentVisit")
                    .then((response) => {
                        if (!response) {
                            return;
                        }

                        const { responseData, message, statusCode } = response;
                        if (statusCode !== 200) return;
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
        },
        { size: "5", analyze_type: "similar" }
    ); // 장소 검색
}

/**
 * 최근 검색 주소 이력 저장하는 함수
 * @param {*} data
 * @returns
 */
function saveSearchHistory(data) {
    const user = userInfo();
    if (!user) return;

    const address = data.address;
    const lat = data.lat;
    const lng = data.lng;

    const dataObj = {
        ...user,
        address: encodeURIComponent(address),
        lat: encodeURIComponent(lat),
        lng: encodeURIComponent(lng),
    };

    callApiAbort("/front/back/history/save_search_history.php", "POST", dataObj, "saveSearchHistory")
        .then((response) => {
            if (!response) {
                return;
            }

            const { responseData, message, statusCode } = response;
            if (statusCode !== 200) return;
            getRescentHistory();
        })
        .catch((error) => {
            console.log(error);
        });
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
    circleDrawer.removeAllCircles(); // 원 모두 제거
    polygonDrawer.clearPolygon(); // 다각형 모두 제거
}
function debounce(func, delay) {
    let timeoutId; // 타이머 ID를 저장할 변수

    return;
    // debounce가 적용된 함수를 반환
    return function(...args) { // 이벤트 객체 등 인자들을 받기 위해 ...args 사용
        const context = this; // func가 실행될 때의 this 컨텍스트 보존

        // 이전 타이머가 있다면 취소 (이벤트가 다시 발생했으므로)
        clearTimeout(timeoutId);

        // 새로운 타이머 설정: delay 시간 후 func 실행
        timeoutId = setTimeout(() => {
            func.apply(context, args); // 원래 함수를 호출
        }, delay);
    };
}