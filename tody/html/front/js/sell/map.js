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
let landPolygons = []; // 지적도 폴리곤 배열
let buildingPolygons = []; // 건물 폴리곤 배열
let currentMemoOverlays = []; // 현재 지도에 표시된 메모 오버레이들을 저장할 배열

$(document).ready(function () {
    initProj4(); // proj4 초기화
    initModal(); // 이지모달 초기화
    initializeMap(); // 지도 초기화
    handleMapEvents(); // 지도 이벤트
    // handleDefaultEvents(); // 기본 이벤트

    //displayMemoOnMap(); // 메모 표시
    // URL 변경 감지 이벤트
    window.addEventListener("popstate", function (e) {
        handleUrlChange();
    });

    initMemo(); // memo 초기화   
    //loadAdministrativeDistrictData(); // 행정구역 GeoJSON 데이터 로드 
});

function initProj4() {
    proj4.defs("EPSG:5186", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs");
    proj4.defs("EPSG:5179", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs");
    // proj4.defs("EPSG:5179", "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +towgs84=0,0,0 +no_defs");
    proj4.defs("EPSG:5178", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=600000 +y_0=200000 +ellps=GRS80 +units=m +no_defs");
    proj4.defs("EPSG:5176", "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs");
    // proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
    proj4.defs("EPSG:3857", "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs");
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

    //searchArroundPlaces(coords);  // 현재 이함수는 하는 일이 없음
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
        const coords = { lat: lat, lng: lng };
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
        //for test
        const level = map.getLevel();
        if (level < 6) {
            // 건물 및 토지 정보를 동시에 가져오기
            handleMapClick(coords);

            // 주변 시설 정보 가져오기
            searchArroundPlaces(coords);
        }
        if (level < 7) {
            // 읍면동 경계
            //handleAddressMapClick(coords);
        }

    });

    // [EVENT] 지도 타일 이미지 로드가 모두 완료 후 이벤트 처리
    kakao.maps.event.addListener(map, "tilesloaded", function () {
        // 매물번호를 검색하여 지도가 이동됐을 때는 전체검색 중단
        if (searchEstateNo) {
            return;
        }
        // $(".mcs-list").empty();
        removeMarker(contentsMarkers);
        //estateList();
        estateNewList();
        if($("#mapOptionMemoOpen2").hasClass("active")) {
            displayMemoOnMap();
        }        
    });

    // kakao.maps.load 콜백 내부 또는 handleMapEvents 함수 내부
    kakao.maps.event.addListener(map, 'rightclick', function(mouseEvent) {
        const clickedPoint = mouseEvent.latLng; // 클릭된 위경도 (kakao.maps.LatLng 객체)
        const clickedScreenPoint = mouseEvent.point; // 클릭된 화면 픽셀 좌표 (메뉴 위치 지정용)

        let foundPolygon = null;

        // 1단계: 토지 폴리곤에서 Point-in-Polygon 검사
        for (let i = 0; i < landPolygons.length; i++) {
            const polygon = landPolygons[i];
            if (polygon.originalCoordinates) {
                const turfPolygon = turf.polygon([polygon.originalCoordinates]); // 저장된 원본 좌표로 Turf.js 폴리곤 생성
                const turfPoint = turf.point([clickedPoint.getLng(), clickedPoint.getLat()]); // 클릭된 지점을 Turf.js 포인트로 변환

                if (turf.booleanPointInPolygon(turfPoint, turfPolygon)) {
                    foundPolygon = polygon;
                    break; // 폴리곤을 찾았으니 루프 종료
                }
            }
        }

        // 2단계: 토지 폴리곤에서 찾지 못했다면 건물 폴리곤에서 검사
        if (!foundPolygon) {
            for (let i = 0; i < buildingPolygons.length; i++) {
                const polygon = buildingPolygons[i];
                if (polygon.originalCoordinates) {
                    const turfPolygon = turf.polygon([polygon.originalCoordinates]);
                    const turfPoint = turf.point([clickedPoint.getLng(), clickedPoint.getLat()]);

                    if (turf.booleanPointInPolygon(turfPoint, turfPolygon)) {
                        foundPolygon = polygon;
                        break;
                    }
                }
            }
        }

        // 폴리곤이 찾아졌다면 메모 등록 메뉴 띄우기
        if (foundPolygon) {
            // 실제 메모 등록 메뉴를 띄우는 함수 호출
            showMemoContextMenu(
                clickedPoint,          // 클릭된 위경도
                clickedScreenPoint,    // 클릭된 화면 픽셀 좌표
                foundPolygon.pnu,      // 폴리곤의 PNU 정보
                foundPolygon.uniquePolygonId, // 폴리곤의 고유 ID
                foundPolygon.type      // 폴리곤의 종류 ('land' 또는 'building')
            );
        } else {
            const contextMenu = $('#memoContextMenu');
            contextMenu.fadeOut(100, function() {
                // 완전히 숨겨진 후 데이터 초기화 (메모등록하기를 다시 누르기 전까지)
                currentMemoData = null;
            });
        }
});
}


// 전역 변수 (또는 모듈 스코프)
let administrativeDistrictGeoJSON = null; // 로드된 GeoJSON 데이터를 저장할 변수
let currentAdministrativePolygons = []; // 지도에 그려진 동/면 폴리곤 객체를 관리할 배열

const GEOJSON_DATA_KEY = 'administrativeDistrictsGeoJsonData'; // GeoJSON 데이터를 저장할 키
const GEOJSON_VERSION_KEY = 'administrativeDistrictsGeoJsonVersion'; // GeoJSON 버전 정보를 저장할 키

// 서버로부터 최신 GeoJSON 버전 정보를 가져오는 함수 (서버 구현에 따라 달라집니다)
async function getLatestGeoJsonVersionFromServer() {
    // 예시 1: 별도 API 엔드포인트에서 버전 가져오기
    // const response = await fetch('/api/geojson/version');
    // const data = await response.json();
    // return data.version; // 예: "1.0.1"

    // 예시 2: HTML meta 태그에서 버전 가져오기
    // const meta = document.querySelector('meta[name="geojson-version"]');
    // return meta ? meta.content : null;

    // 예시 3: 개발 시 임시로 사용할 버전
    return "1.0.3"; // <<< 실제 배포 시에는 반드시 서버에서 가져오도록 수정해야 합니다!
}

// GeoJSON 데이터를 비동기적으로 로드하는 함수
// 이 함수는 앱이 처음 시작될 때 한 번 호출하거나, 필요할 때마다 호출하여 데이터를 캐싱합니다.
// 행정구역 GeoJSON 데이터 준비 및 로드
// GeoJSON 데이터를 비동기적으로 로드하고 IndexedDB (localforage)에 캐싱하는 함수
async function loadAdministrativeDistrictData() {
    // 1. 메모리 캐시 확인 (가장 빠른 경로)
    if (administrativeDistrictGeoJSON) {
        //console.log("행정구역 GeoJSON 데이터 (메모리에서) 바로 반환합니다.");
        return administrativeDistrictGeoJSON;
    }

    // 2. 서버에서 최신 버전 정보 가져오기
    const serverVersion = await getLatestGeoJsonVersionFromServer();
    if (!serverVersion) {
        console.error("서버로부터 GeoJSON 버전 정보를 가져오지 못했습니다. 캐싱 로직을 건너뜁니다.");
        // 버전 정보를 가져오지 못하면 그냥 네트워크에서 로드하거나, 오류 처리
        return await fetchAndCacheGeoJson(); // 아래 별도 함수 참조
    }

    // 3. IndexedDB (localforage)에서 캐시된 데이터 및 버전 확인
    let cachedData = null;
    let cachedVersion = null;
    try {
        cachedData = await localforage.getItem(GEOJSON_DATA_KEY);
        cachedVersion = await localforage.getItem(GEOJSON_VERSION_KEY);
    } catch (e) {
        console.error("IndexedDB에서 캐시 데이터/버전 로드 중 오류 발생:", e);
        // 오류 발생 시 네트워크에서 다시 시도
    }

    // 4. 버전 비교 및 데이터 로드 결정
    if (cachedData && cachedVersion === serverVersion) {
        // 캐시된 데이터가 있고, 버전도 서버와 동일하면 캐시 사용
        administrativeDistrictGeoJSON = cachedData;
        return administrativeDistrictGeoJSON;
    } else {
        // 캐시 데이터가 없거나, 캐시 버전이 서버 버전과 다르면 (오래되었거나 업데이트 필요)
        return await fetchAndCacheGeoJson(serverVersion); // 새 데이터를 가져와 캐시
    }
}

// GeoJSON을 네트워크에서 가져오고 IndexedDB에 저장하는 별도 함수
async function fetchAndCacheGeoJson(versionToCache) {
    try {
        console.log("행정구역 GeoJSON 데이터 네트워크에서 fetching합니다...");
        const response = await fetch('/front/assets/data/korea_administrative_districts_eupmyeondong.geojson');
        // 응답이 유효한지 먼저 확인 (HTTP 상태 코드 200번대인지)
        if (!response.ok) {
            const errorText = await response.text();
            console.error("서버 응답 오류 (HTTP Status):", response.status, response.statusText, errorText);
            return null;
        }
    
        const rawResponseText = await response.text();
        //console.log("map.js:519 서버에서 받은 원본 응답 텍스트:", rawResponseText);

        // ✨ 핵심: 응답 텍스트가 비어있는지 확인하는 로직 추가
        if (!rawResponseText || rawResponseText.trim().length === 0) {
            //console.error("GeoJSON 데이터 로드 중 오류: 서버 응답 본문이 비어있습니다. 파일이 없거나 내용이 손상되었을 수 있습니다.");
            return null;
        }

         const fetchedData = JSON.parse(rawResponseText); // 이제 빈 문자열로 인한 오류는 여기서 걸러짐

        administrativeDistrictGeoJSON = fetchedData;
        await localforage.setItem(GEOJSON_DATA_KEY, fetchedData);
        if (versionToCache) {
            await localforage.setItem(GEOJSON_VERSION_KEY, versionToCache);
        }

        return administrativeDistrictGeoJSON;
    } catch (error) {
        
        if (response) {
        //    console.error("오류 발생 시점의 HTTP 상태:", response.status, response.statusText);
        } else {
        //    console.error("fetch() 요청 자체가 실패하여 response 객체가 생성되지 않았습니다.");
        }
        return null;
    }
}

///currentAdministrativePolygons 배열을 사용하여 이전에 그려진 동/면 폴리곤을 지우고 새로운 폴리곤을 그립니다.
function clearAdministrativePolygons() {
    currentAdministrativePolygons.forEach(polygon => polygon.setMap(null));
    currentAdministrativePolygons = [];
}

/**
 * 특정 동/면의 GeoJSON 데이터를 파싱하여 카카오맵에 폴리곤으로 그립니다.
 * @param {string} dongName - 그릴 동/면의 이름 (예: "금곡동")
 * @param {kakao.maps.Map} mapInstance - 폴리곤을 그릴 카카오맵 인스턴스
 */
async function drawAdministrativeDistrictPolygon(dongName, mapInstance) {
    clearAdministrativePolygons(); // 기존 동/면 폴리곤을 먼저 지웁니다.

    const geojsonData = await loadAdministrativeDistrictData(); // GeoJSON 데이터 로드 (캐싱 로직 포함)
    if (!geojsonData) {
        return;
    }

    // 1. dongName이 제대로 넘어오는지 확인
    // GeoJSON 데이터에서 dongName에 해당하는 feature를 찾습니다.
    const targetFeature = geojsonData.features.find(
        feature => feature.properties.EMD_KOR_NM === dongName
    );

    // 2. targetFeature가 제대로 찾아지는지 확인
    if (!targetFeature) {
        console.warn(`[drawAdmin] GeoJSON 데이터에서 '${dongName}'에 해당하는 행정구역을 찾을 수 없습니다. (EMD_KOR_NM 불일치)`);
        // 찾을 수 없는 경우, 해당 지역에 대한 로그를 남기고 함수 종료
        return;
    }
    // 3. geometry 정보의 유효성 확인
    if (!targetFeature.geometry) {
        console.warn(`[drawAdmin] '${dongName}'의 geometry 정보가 없습니다.`);
        return;
    }
    if (!targetFeature.geometry.coordinates || targetFeature.geometry.coordinates.length === 0) {
        console.warn(`[drawAdmin] '${dongName}'의 geometry 좌표 데이터가 비어있습니다.`);
        return;
    }

    // geometry 타입과 좌표가 제대로 파싱되는지 확인 (디버깅 메시지)
    // 카카오맵 Polygon 객체 생성을 위한 path 데이터 정의
    // Polygon 타입과 MultiPolygon 타입의 파싱 로직을 분리합니다.
    if (targetFeature.geometry.type === 'Polygon') {
        const paths = []; // kakao.maps.LatLng[] 형태
        const coordinatesArray = targetFeature.geometry.coordinates[0]; // GeoJSON Polygon의 외부 링

        if (coordinatesArray) {
            coordinatesArray.forEach(coord => {
                // GeoJSON은 일반적으로 [경도, 위도] 순서입니다. Kakao Maps LatLng는 (위도, 경도) 순서입니다.
                paths.push(new kakao.maps.LatLng(coord[1], coord[0]));
            });
        } else {
            console.error("[drawAdmin] Polygon type but coordinates[0] is null or undefined.");
            return;
        }

        // 폴리곤을 닫힌 형태로 만들기: 마지막 좌표가 첫 번째 좌표와 다르면 추가
        if (paths.length >= 3) {
            const firstCoord = paths[0];
            const lastCoord = paths[paths.length - 1];
            if (firstCoord.getLat() !== lastCoord.getLat() || firstCoord.getLng() !== lastCoord.getLng()) {
                paths.push(firstCoord);
                console.warn(`[drawAdmin] Polygon이 닫힌 형태로 생성되지 않아 첫 번째 좌표를 추가했습니다.`);
            }
        } else if (paths.length > 0) {
            console.warn(`[drawAdmin] Polygon의 좌표 수가 부족하여 그릴 수 없습니다. (좌표 수: ${paths.length})`);
            return;
        } else {
             console.warn(`[drawAdmin] ${dongName} Polygon을 그릴 Path 데이터가 없습니다.`);
             return;
        }

        // Polygon 객체 생성
        const polygon = new kakao.maps.Polygon({
            path: paths, // LatLng[] 형태
            strokeWeight: 3,
            strokeColor: '#FF00FF', // 기본 보라색
            strokeOpacity: 0.8,
            fillColor: '#FF00FF',
            fillOpacity: 0.1,
            zIndex: 1
        });
        polygon.setMap(mapInstance);
        currentAdministrativePolygons.push(polygon);
        
        
    } else if (targetFeature.geometry.type === 'MultiPolygon') {
        // GeoJSON MultiPolygon은 여러 개의 독립적인 Polygon으로 구성될 수 있으므로,
        // 각 내부 Polygon에 대해 개별적인 kakao.maps.Polygon 객체를 생성하여 지도에 추가합니다.

        targetFeature.geometry.coordinates.forEach((singlePolygonCoords, multiPolygonIndex) => {
            const polygonPathForKakao = []; // LatLng[][] 형태: [ [outer_ring_LatLng[]], [inner_ring1_LatLng[]], ... ]

            // singlePolygonCoords는 하나의 GeoJSON Polygon의 coordinates (예: [[outer_ring], [inner_ring1]])
            singlePolygonCoords.forEach((ringCoords, ringIndex) => {
                const currentRingLatLngs = []; // 각 링의 LatLng[]

                ringCoords.forEach((coord, coordIndex) => {
                    // 유효성 검사: 각 개별 좌표의 숫자 및 범위 유효성
                    if (!Array.isArray(coord) || coord.length < 2 || isNaN(coord[0]) || isNaN(coord[1])) {
                        // 문제가 있는 좌표는 추가하지 않고 건너뜁니다.
                        return;
                    }
                    // GeoJSON: [경도, 위도] -> Kakao LatLng: (위도, 경도)
                    currentRingLatLngs.push(new kakao.maps.LatLng(coord[1], coord[0]));
                });

                // 링이 최소 3개의 유효한 좌표를 가지고 있다면 polygonPathForKakao에 추가
                if (currentRingLatLngs.length >= 3) {
                    // 링을 닫힌 형태로 만들기 (첫 좌표와 마지막 좌표가 다를 경우)
                    const firstCoord = currentRingLatLngs[0];
                    const lastCoord = currentRingLatLngs[currentRingLatLngs.length - 1];
                    if (firstCoord.getLat() !== lastCoord.getLat() || firstCoord.getLng() !== lastCoord.getLng()) {
                        currentRingLatLngs.push(firstCoord);
                        console.warn(`[drawAdmin] MultiPolygon ${multiPolygonIndex}번째 폴리곤의 ${ringIndex}번째 링이 닫히지 않아 첫 번째 좌표를 추가했습니다.`);
                    }
                    polygonPathForKakao.push(currentRingLatLngs);
                } else if (currentRingLatLngs.length > 0) {
                    console.warn(`[drawAdmin] MultiPolygon ${multiPolygonIndex}번째 폴리곤의 ${ringIndex}번째 링의 좌표 수가 부족하여 무시됩니다. (좌표 수: ${currentRingLatLngs.length})`);
                }
            });

            // 하나의 GeoJSON 내부 Polygon에 대해 kakao.maps.Polygon 객체 생성
            if (polygonPathForKakao.length > 0) {
                const polygon = new kakao.maps.Polygon({
                    path: polygonPathForKakao, // LatLng[][] 형태 (외부 링과 내부 링/홀을 포함)
                    strokeWeight: 2,
                    strokeColor: '#FF00FF',
                    strokeOpacity: 0.8,
                    fillColor: '#FF00FF',
                    fillOpacity: 0.0,
                    zIndex: 1
                });

                polygon.setMap(mapInstance);
                currentAdministrativePolygons.push(polygon);
                
            } else {
                console.warn(`[drawAdmin] ${dongName} MultiPolygon 내부 ${multiPolygonIndex}번째 폴리곤을 그릴 Path 데이터가 없습니다.`);
            }
        });
    } else {
        console.warn("[drawAdmin] 지원되지 않는 Geometry Type:", targetFeature.geometry.type);
        return;
    }
}
/**
 * 지도 클릭 시 건물과 토지 정보를 동시에 가져오는 함수
 20250811 add*/
async function handleMapClick(coords) {
    if (isLoading) return; // 이전 작업이 완료되지 않았으면 새로운 작업을 시작하지 않음

    try {
        isLoading = true; // 작업 시작 플래그 설정
        
        clearAllPolygons(); // 기존 폴리곤을 모두 지움

        // 폴리곤 정보 가져오기
        const polygons = await getLandBuildingPolygon(coords);
        const { buildingPolygon, buildingPolygon2, landPolygon } = polygons;

        // 건물 정보와 토지 정보를 동시에 가져옴
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

        // 두 작업이 완료된 후 폴리곤을 한 번에 지도에 추가
        addPolygonsToMap(buildingPolygons, landPolygons);
        const addressResult = await searchDetailAddrFromCoordsMy(coords);
        if (addressResult && addressResult.status === kakao.maps.services.Status.OK && addressResult.result && addressResult.result[0]) {
            const result = addressResult.result[0];
            let jibunAddr = result.address ? result.address.address_name : '';
            $("#click_location").val(jibunAddr); // 
        }
       
    } catch (error) {
        console.error("정보를 가져오는 중 오류가 발생했습니다: ", error);
    } finally {
        isLoading = false; // 작업 완료 플래그 해제
    }
}

async function handleAddressMapClick(coords) {
    //if (isLoading) return; // 이전 작업이 완료되지 않았으면 새로운 작업을 시작하지 않음

    try {
        
        isLoading = true; // 작업 시작 플래그 설정
        //20250917 add 시험용 추후 동별경계선 그리기

        const addressResult = await searchDetailAddrFromCoordsMy(coords);
        if (addressResult && addressResult.status === kakao.maps.services.Status.OK && addressResult.result && addressResult.result[0]) {
            const result = addressResult.result[0];
            let jibunAddr = result.address ? result.address.address_name : '';
            $("#click_location").val(jibunAddr); // 

            // 동/면 이름 추출 (예: '수원시 팔달구 매산로1가' -> '매산로1가' 또는 '팔달구')
            // 카카오 Geocoder API의 `coord2RegionCode` 결과나 `address_name`의 파싱 규칙에 따라 달라질 수 있습니다.
            // 여기서는 'region_3depth_name'을 사용하거나, 'address_name'을 파싱하는 예시를 보여드립니다.
            let dongName = '';
            if (result.address && result.address.region_3depth_name) {
                const parts = result.address.region_3depth_name.split(' ');
                if (parts.length >= 1) {
                    dongName = parts[0]; // '표선면 표선리" 에서 '표선면' 추출 예시
                }
            } else if (jibunAddr) {
                const parts = jibunAddr.split(' ');
                if (parts.length >= 3) {
                    dongName = parts[2]; // '서울특별시 강남구 신사동' 에서 '신사동' 추출 예시
                }
            }

            if (dongName) {
                await drawAdministrativeDistrictPolygon(dongName, map); // 추출된 동 이름으로 폴리곤 그리기
            }
        }
        
    } catch (error) {
        console.error("정보를 가져오는 중 오류가 발생했습니다: ", error);
    } finally {
        isLoading = false; // 작업 완료 플래그 해제
    }
}

/**
 * 모든 폴리곤을 제거하는 함수 (싱글 모드에서 호출)
 *20250811 add*/
function clearAllPolygons() {
    // 모든 건물 폴리곤과 지적도 폴리곤을 지도에서 제거
    // 지도에 현재 그려진 모든 landPolygons (전역 배열)의 폴리곤들을 지도에서 지웁니다.
    landPolygons.forEach(polygon => {
        if (polygon) { // null 체크 (안전 장치)
            polygon.setMap(null);
        }
    });
    // 건물 폴리곤들도 지웁니다 (buildingPolygons도 전역 배열이라고 가정)
    buildingPolygons.forEach(polygon => {
        if (polygon) {
            polygon.setMap(null);
        }
    });
    $("#click_location").val(""); // 
    // 폴리곤 배열 초기화
    buildingPolygons = [];
    landPolygons = [];
}
// 건물 정보 가져오기 함수 2025.08.11 add
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
                        fillOpacity: 0.2, // 투명도를 0.1로 변경
                        zIndex: 10, // zIndex를 높게 설정하여 지적도 폴리곤 위에 표시
                    });
                    polygon.pnu = feature.properties.pnu;
                    polygon.uniquePolygonId = Math.random().toString(36).substr(2, 9);
                    polygon.originalCoordinates = coordinates; // Turf.js에서 사용할 원본 GeoJSON 좌표 저장
                    polygon.type = 'building'; // 폴리곤 종류를 저장 (메뉴 호출 시 구분용)

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

    
    // 전역 변수 buildingPolygons returnPolygons의 값들을 추가
    buildingPolygons.push(...returnPolygons);

    return returnPolygons;
}
/**
 * 토지정보 가져오는 함수
 * @param {*} coords
 */
async function getLandInfo(result) {
    // 성공적으로 데이터가 반환된 경우
    if (result.response.status && result.response.status === "OK") {
        const features = result.response.result.featureCollection.features;
        const bbox = result.response.result.featureCollection.bbox;
        
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

        // returnPolygons 초기화
        let returnPolygons = [];
        let turfLandPolygons = []; // Turf.js로 사용할 폴리곤 리스트
        let geojsonPolygon = null; // Turf.js로 사용할 토지 폴리곤

        let strokeColor = "#0000FF";
        let fillColor = "#AAAAFF";

        
        // 받은 지적도 정보를 바탕으로 returnPolygons에 실제 Polygon 객체를 저장
        features.forEach(function (feature) {
            const coordinates = feature.geometry.coordinates[0][0];
            const polygonPath = coordinates.map((coord) => new kakao.maps.LatLng(coord[1], coord[0]));
            const polygon = new kakao.maps.Polygon({
                path: polygonPath,
                strokeWeight: 1,
                strokeColor: strokeColor,
                strokeOpacity: 1,
                strokeStyle: "solid",
                fillColor: fillColor,
                fillOpacity: 0.5,
                zIndex: 6,//9999, // zIndex를 낮게 설정하여 건물 폴리곤 아래에 표시
            });
            
            polygon.pnu = feature.properties.pnu;
            polygon.uniquePolygonId = Math.random().toString(36).substr(2, 9); // 임시 Unique ID 부여
            polygon.originalCoordinates = coordinates; // Turf.js에서 사용할 원본 GeoJSON 좌표 저장
            polygon.type = 'land'; // 폴리곤 종류를 저장 (메뉴 호출 시 구분용)

            geojsonPolygon = turf.polygon([coordinates]); // GeoJSON 형식으로 변환

            returnPolygons.push(polygon);
            // 전역 변수 landPolygons에 지적도 폴리곤 값들을 추가
            landPolygons.push(polygon);
        });

        return returnPolygons;
    }
    // TODO: result.response.status가 "OK"가 아닌 경우의 예외 처리 로직 추가 고려
    return []; // 오류 발생 시 빈 배열 반환
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

    // 토지 폴리곤을 map에 추가
    if (landPolygonPaths.length > 0) {
        // 메인 지도에 토지 폴리곤 추가
        landPolygonPaths.forEach((polygon) => polygon.setMap(map));
    }
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
        //console.log("아이템 클릭됨:", data); // 로그 출력
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

function initMemo() {
    if($("#mapOptionMemoOpen2").hasClass("active")) {
        displayMemoOnMap();
    }
    
}
/**
 * 메모 리스트 가져오는 함수
 * @param {*} searchNo = 매물번호 검색
 */
async function fetchMemoList() {
    // 1. 필요한 모든 데이터를 수집합니다.
    const filterObj = collectFilterMemo(); // 필터 조건 (type, keyword, complete)

    const bounds = map.getBounds();       // 지도의 현재 영역
    const currentUserInfo = userInfo();   // 현재 로그인 사용자 정보 (reg_no 등을 포함)

    const swLatLng = bounds.getSouthWest(); // 영역의 남서쪽 좌표
    const neLatLng = bounds.getNorthEast(); // 영역의 북동쪽 좌표

    // 'radio_memo'는 owner 필터 (all/my)로 예상됩니다.
    // PHP 스크립트에서 $_POST['owner']로 받는 필드입니다.
    const owner = $('input[name="radio_memo"]:checked').val(); 
    
    // 2. PHP 스크립트로 전달할 dataObj를 구성합니다.
    const dataObj = {
        // 필터 객체 내용 병합 (type, keyword 등)
        ...filterObj, 
        
        // PHP 스크립트에서 $_POST['owner']로 받는 필드
        owner: owner, 

        // 사용자 정보 병합 (PHP 스크립트에서 get_user_no_for_hash로 userNo를 사용하는 경우)
        // userInfo()가 undefined를 반환할 수도 있으니 안전하게 처리합니다.
        ...(currentUserInfo ? currentUserInfo : {}), 
        
        // 지도 경계 정보: PHP의 minLat, maxLat, minLng, maxLng와 이름 일치!
        minLat: swLatLng.getLat(),
        maxLat: neLatLng.getLat(),
        minLng: swLatLng.getLng(),
        maxLng: neLatLng.getLng(),
        
    };
    const url = "/front/back/memo/memo2_list.php"; 
    
    try {
        // 4. callApi 함수에 모든 데이터를 담은 dataObj를 전달
        const result = await callApi("POST", url, dataObj);

        if (!result) {
            // callApi 함수 자체에서 오류가 발생했거나 반환값이 없는 경우
            sweetAlertMessage("메모 목록 조회에 실패했습니다. 다시 시도해주세요.","","e");
            return []; // 실패 시 빈 배열 반환
        }

        const { message, responseData, statusCode } = result;

        if (statusCode === 200 && message === "SUCCESS") {
            // API 호출 성공 및 데이터 처리 성공
            return responseData; // 실제 메모 목록 데이터 (배열 형태) 반환
        } else {
            // API는 응답했지만, 백엔드에서 처리 실패 메시지를 반환한 경우
            sweetAlertMessage("메모 목록 조회 실패: " + message,"","e");
            return []; // 실패 시 빈 배열 반환
        }
    } catch (error) {
        sweetAlertMessage("메모 목록 가져오는 중 문제가 발생했습니다. 콘솔을 확인해주세요.","","e");
        return [];
    }
}

//가져온 메모 데이터를 지도에 표시합니다. 
//메모 데이터를 기반으로 kakao.maps.Marker 또는 kakao.maps.CustomOverlay를 생성하여 지도에 추가합니다.
async function displayMemoOnMap(updatedMemoData = null) {
    if (updatedMemoData) {
        // 특정 메모만 업데이트하는 로직을 호출 (아래 updateSingleMemoOnMap)
        await updateSingleMemoOnMap(updatedMemoData);
    } else {
        removeExistingMemoOverlays();
        // fetchMemoList() 호출하여 최신 메모 목록 가져오기
        if (!map || !(map instanceof kakao.maps.Map)) {
            console.error("지도 객체(map)가 유효하지 않습니다. 지도 초기화 상태를 확인해주세요.", map);
            return;
        }
        const memoList = await fetchMemoList();

        if (!Array.isArray(memoList)) {
            console.error("fetchMemoList에서 유효한 배열을 반환하지 않았습니다.", memoList);
            return;
        }

        if (memoList.length === 0) {
            //console.log("fetchMemoList에서 가져온 메모가 없습니다. 지도에 표시할 오버레이가 없습니다.");
            return;
        }
        
        memoList.forEach((memo, index) => {
            if (typeof memo.latitude !== 'number' || typeof memo.longitude !== 'number') {
                console.error(`메모 ${index} (${memo.memo_no})의 위경도 값이 유효한 숫자가 아닙니다.`, memo.latitude, memo.longitude);
                return;
            }
            
            const position = new kakao.maps.LatLng(memo.latitude, memo.longitude);

            // 이미지 마커 URL (기본 이미지 또는 memo 객체에 image_url 필드가 있다면 사용)
            let markerImageUrl;
            if (memo.complete === 'Y') {
                markerImageUrl = '/front/assets/image/markerStar_orange2.png';
                //markerImageUrl = '/front/assets/image/markerStar.png';
            } else if (memo.complete === 'N') { // complete === 'N' 이면 거래진행이므로 green2
                markerImageUrl = '/front/assets/image/markerStar_green2.png';
            } else {
                // 그 외의 경우 (예: complete 필드가 없거나 다른 값)에 대한 기본 이미지 경로
                markerImageUrl = '/front/assets/image/markerStar.png'; // 기본 마커 (혹은 다른 기본값)
            }

            const markerImageHeight = 34; // ⭐️ 마커 이미지의 실제 높이를 여기에 입력해주세요 (예: 30, 40, 50 등) ⭐️
            const popupOffsetFromMarker = 10; // 마커와 팝업 사이의 간격 (조정 가능)
            const markerImageWidth = 32;  // ⭐ 마커 이미지의 실제 너비 ⭐ (일반적으로 정사각형이 많음)

            // 콘텐츠 HTML 구성 (마커 이미지와 상세 정보 팝업을 모두 포함)
            const completeStatusText = memo.complete === 'Y' ? '<span class="label-default bg-orange2">거래완료</span>' : '<span class="label-default bg-green2">거래진행</span>';
            const estateNoText = (memo.estate_no && memo.estate_no !== 0) ? `매물번호 : ${memo.estate_no}` : '매물번호 : 없음';
            const dateText = memo.lst_date ? memo.lst_date : memo.reg_date; 
            const summarizedContent = memo.content ? 
                (memo.content.length > 10 ? memo.content.substring(0, 10) + '...' : memo.content) : '내용 없음'; 
                
            const overlayContent = `
                <div class="memo-marker-container" style="
                    position: relative; /* 자식 팝업의 absolute 포지셔닝 기준 */
                    width: ${markerImageWidth}px;
                    height: ${markerImageHeight}px;
                ">
                    <img src="${markerImageUrl}" class="memo-marker-image" 
                        id="marker-${memo.memo_no}" 
                        style="display: block; cursor: pointer; width: 100%; height: 100%;" />
                    
                    <!-- 상세 정보 팝업 부분 -->
                    <div class="memo-details-popup" style="
                        display: none; 
                        position: absolute; 
                        /* ⭐⭐ 팝업의 top 위치 계산 핵심 수정 ⭐⭐ */
                        /* 목표: 팝업의 '하단'이 마커 이미지의 '상단' + '간격' 에 오도록 */
                        /* 현재 top은 팝업의 상단을 기준으로 함 */
                        /* 팝업의 실제 높이를 알아야 정확한 계산 가능. 여기서는 팝업 콘텐츠의 예상 높이 (대략 150px)로 추정 */
                        /* 또는 markerImageHeight + popupOffsetFromMarker 로 팝업 바닥이 마커 상단에 위치하도록 함 */
                        
                        top: -${popupOffsetFromMarker}px; /* ⭐ 마커 이미지 상단에 팝업 하단이 오도록 (10px 간격) ⭐ */
                        transform: translateX(-50%) translateY(-100%); /* ⭐ X축 중앙, Y축 상단으로 정렬 ⭐ */
                        left: 50%; /* X축 중앙 정렬을 위한 기준점 */
                        z-index: 100;
                        background: white; 
                        border: 1px solid blue; 
                        padding: 5px; 
                        border-radius: 5px; 
                        min-width:150px; max-width:250px; 
                        box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
                    ">
                        <div class="memo-overlay-content">
                            <h5 style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; 
                                    font-size:12px; font-weight:bold; padding-bottom: 5px; border-bottom: 1px solid #e0e0e0;">
                                <span>내 메모번호: ${memo.my_idx ? memo.my_idx : '-'}</span>
                                ${completeStatusText}
                            </h5>
                            <p style="margin-bottom: 3px; font-size:12px; color:#555;">
                                ${estateNoText}
                            </p>
                            <p style="margin-bottom: 0; font-size:13px;">
                                ${summarizedContent}
                            </p>
                            <p style="margin-bottom: 0; font-size:10px;">
                                ${dateText}
                            </p>
                        </div>
                    </div>
                </div>
            `;

            const customOverlay = new kakao.maps.CustomOverlay({
                position: position,
                content: overlayContent,
                xAnchor: 0.5,
                yAnchor: 1.0, // 이미지 하단 중앙에 오버레이가 위치하도록 설정 (마커 핀처럼)
                zIndex: 10
            });

            // ⭐ 지도에 오버레이 추가 후 이벤트 리스너 바인딩 ⭐
            customOverlay.setMap(map);
            currentMemoOverlays.push(customOverlay);

            // CustomOverlay가 DOM에 추가된 후, 마커 이미지에 이벤트 리스너를 바인딩
            kakao.maps.event.addListener(customOverlay, 'customOverlay:onAdd', function() { // 가상의 이벤트
                // 실제 CustomOverlay의 content 요소는 div로 감싸져 있고 그 안에 우리의 overlayContent HTML이 들어갑니다.
                const overlayWrapper = customOverlay.a; // 이 부분은 카카오맵 내부 구현에 따라 달라질 수 있으니 디버깅 필요 (a 속성이 content의 부모 div일 경우)
                // 더 안전하게는 jQuery를 사용하여 데이터 속성으로 찾기
                const $markerImage = $(overlayWrapper).find(`.memo-marker-image[data-memo-id="${memo.memo_no}"]`);
                const $detailsPopup = $(overlayWrapper).find('.memo-details-popup');
                
                // 마우스 오버 시 상세 팝업 표시
                $markerImage.on('mouseover', function() {
                    $detailsPopup.css('display', 'block');
                });

                // 마우스 아웃 시 상세 팝업 숨김
                $markerImage.on('mouseout', function() {
                    $detailsPopup.css('display', 'none');
                });

                // (선택 사항) 상세 팝업 자체에 마우스가 올라가면 팝업이 사라지지 않도록
                $detailsPopup.on('mouseover', function() {
                    $detailsPopup.css('display', 'block');
                });
                $detailsPopup.on('mouseout', function() {
                    $detailsPopup.css('display', 'none');
                });
            });
            // ⭐️ 중요: customOverlay.a 대신 querySelector로 content 내부의 특정 클래스를 찾거나,
            // 카카오맵 문서에서 CustomOverlay의 content가 실제 DOM에 어떻게 붙는지 확인하여 올바르게 접근해야 합니다.
            // jQuery의 find()나 JavaScript의 querySelector() 사용이 더 안전합니다.
            // content가 이미 HTML 문자열이므로, setMap() 호출 후 DOM에 붙었을 때 ID나 클래스를 이용해 접근하는 것이 일반적입니다.
            // 다음은 setMap() 직후 접근하는 일반적인 방법입니다.
            
            // setMap() 호출은 비동기적이지 않지만, DOM에 요소가 실제로 삽입되는 데는 미세한 지연이 있을 수 있습니다.
            // 가장 확실한 방법은 ID를 주고 setTimeout으로 살짝 딜레이를 주거나,
            // CustomOverlay에 onAdd 콜백 함수가 있으면 활용하는 것입니다 (하지만 KakaoMap에 명시적으로 그런 이벤트는 없는 듯)
            // 따라서, CustomOverlay의 content에 특정 id를 부여하고 setTimeout(..., 0)으로 비동기 호출을 한번 래핑하여 DOM 준비를 기다립니다.

            const tempMarkerId = `marker-${memo.memo_no}`;
            customOverlay.setContent(overlayContent.replace('class="memo-marker-image"', `class="memo-marker-image" id="${tempMarkerId}"`));
            
            // DOM 요소가 추가된 후 이벤트 바인딩 (짧은 setTimeout으로 DOM 준비 대기)
            setTimeout(() => {
                const markerElement = document.getElementById(`marker-${memo.memo_no}`);
                if (markerElement) {
                    const detailsPopup = markerElement.closest('.memo-marker-container').querySelector('.memo-details-popup');
                    
                    // 마우스 오버/아웃 이벤트 (기존 기능)
                    if (detailsPopup) {
                        markerElement.onmouseover = () => { detailsPopup.style.display = 'block'; };
                        markerElement.onmouseout = () => { detailsPopup.style.display = 'none'; };
                        detailsPopup.onmouseover = () => { detailsPopup.style.display = 'block'; }; // 팝업 위에서 마우스 떼도 사라지지 않도록
                        detailsPopup.onmouseout = () => { detailsPopup.style.display = 'none'; };
                    } else {
                        console.warn(`Details popup not found for marker-${memo.memo_no}`);
                    }

                    // ⭐ 마커 클릭 이벤트 추가 ⭐
                    markerElement.onclick = (e) => {
                        e.stopPropagation(); // 이벤트 버블링 방지 (지도 클릭 이벤트 등에 영향을 주지 않도록)
                        
                        // 기존 openMemoModal 함수를 활용하여 수정 팝업 띄우기
                        // openMemoModal 함수는 이미 메모등록시 위경도, PNU 등을 인자로 받도록 되어있습니다.
                        // 이제 이 함수가 수정 모드와 등록 모드를 구분할 수 있어야 합니다.
                        // 여기서는 수정할 memo의 전체 데이터를 넘겨서 팝업을 띄웁니다.
                        // openMemoModal 함수를 수정할 것입니다.
                        openMemoModifyModal(memo , e.clientX, e.clientY); // ⭐ event.clientX, event.clientY 전달 ⭐
                    };

                } else {
                    console.warn(`Marker element marker-${memo.memo_no} not found in DOM.`);
                }
            }, 0); // 0ms setTimeout으로 DOM이 업데이트될 기회를 줍니다.
       });
    }
}

/**
 * 지도상의 특정 메모(마커, 오버레이)를 업데이트하는 함수
 * 이 함수는 기존 CustomOverlay를 찾아서 content를 변경하거나, 필요시 새로 생성합니다.
 * @param {object} memoData - 업데이트된 단일 메모 데이터
 */
async function updateSingleMemoOnMap(memoData) {
    // 1. 기존 CustomOverlay 찾기 (memo_no 기준으로)
    const existingOverlayIndex = currentMemoOverlays.findIndex(overlay => {
        // 오버레이 content 내부에 memo_no가 있는 요소를 찾기 위해 DOM을 파싱해야 할 수 있음
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = overlay.getContent();
        return tempDiv.querySelector(`#marker-${memoData.memo_no}`);
    });

    if (existingOverlayIndex !== -1) {
        // 2. 기존 오버레이 제거
        currentMemoOverlays[existingOverlayIndex].setMap(null);
        currentMemoOverlays.splice(existingOverlayIndex, 1);
       
    }

    // 3. 업데이트된 데이터로 새로운 마커/오버레이 생성 (기존 displayMemoOnMap 루프 내부 로직 재활용)
    const position = new kakao.maps.LatLng(memoData.latitude, memoData.longitude);

    let markerImageUrl;
    if (memoData.complete === 'Y') {
        markerImageUrl = '/front/assets/image/markerStar_orange2.png';
    } else if (memoData.complete === 'N') {
        markerImageUrl = '/front/assets/image/markerStar_green2.png';
    } else {
        markerImageUrl = '/front/assets/image/markerStar.png';
    }

    const markerImageWidth = 32;   // 실제 마커 이미지의 너비 (픽셀)
    const markerImageHeight = 34;  // 실제 마커 이미지의 높이 (픽셀)
    const popupOffsetFromMarker = 10; 

    // 콘텐츠 HTML 구성 (기존 displayMemoOnMap 내부의 overlayContent 로직 재활용)
    const completeStatusText = memoData.complete === 'Y' ? '<span class="label-default bg-orange2">거래완료</span>' : '<span class="label-default bg-green2">거래진행</span>';
    const estateNoText = (memoData.estate_no && memoData.estate_no !== 0) ? `매물번호 : ${memoData.estate_no}` : '매물번호 : 없음';
    const dateText = memoData.lst_date ? memoData.lst_date : memoData.reg_date; 
    const summarizedContent = memoData.content ? 
        (memoData.content.length > 10 ? memoData.content.substring(0, 10) + '...' : memoData.content) : '내용 없음'; 

    const overlayContent = `
        <div class="memo-marker-container" style="
            position: relative; /* 자식 팝업의 absolute 포지셔닝 기준 */
            width: ${markerImageWidth}px;
            height: ${markerImageHeight}px;
        ">
            <img src="${markerImageUrl}" class="memo-marker-image" 
                id="marker-${memoData.memo_no}" 
                style="display: block; cursor: pointer; width: 100%; height: 100%;" />
            
            <!-- 상세 정보 팝업 부분 -->
            <div class="memo-details-popup" style="
                display: none; 
                position: absolute; 
                /* ⭐⭐ 팝업의 top 위치 계산 핵심 수정 ⭐⭐ */
                /* 목표: 팝업의 '하단'이 마커 이미지의 '상단' + '간격' 에 오도록 */
                /* 현재 top은 팝업의 상단을 기준으로 함 */
                /* 팝업의 실제 높이를 알아야 정확한 계산 가능. 여기서는 팝업 콘텐츠의 예상 높이 (대략 150px)로 추정 */
                /* 또는 markerImageHeight + popupOffsetFromMarker 로 팝업 바닥이 마커 상단에 위치하도록 함 */
                
                top: -${popupOffsetFromMarker}px; /* ⭐ 마커 이미지 상단에 팝업 하단이 오도록 (10px 간격) ⭐ */
                transform: translateX(-50%) translateY(-100%); /* ⭐ X축 중앙, Y축 상단으로 정렬 ⭐ */
                left: 50%; /* X축 중앙 정렬을 위한 기준점 */
                z-index: 100;
                background: white; 
                border: 1px solid blue; 
                padding: 5px; 
                border-radius: 5px; 
                min-width:150px; max-width:250px; 
                box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
            ">
                <div class="memo-overlay-content">
                    <h5 style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; 
                            font-size:12px; font-weight:bold; padding-bottom: 5px; border-bottom: 1px solid #e0e0e0;">
                        <span>내 메모번호: ${memoData.my_idx ? memoData.my_idx : '-'}</span>
                        ${completeStatusText}
                    </h5>
                    <p style="margin-bottom: 3px; font-size:12px; color:#555;">
                        ${estateNoText}
                    </p>
                    <p style="margin-bottom: 0; font-size:13px;">
                        ${summarizedContent}
                    </p>
                    <p style="margin-bottom: 0; font-size:10px;">
                        ${dateText}
                    </p>
                </div>
            </div>
        </div>
    `;

    const customOverlay = new kakao.maps.CustomOverlay({
        position: position,
        content: overlayContent,
        xAnchor: 0.5, 
        yAnchor: 1.0, 
        zIndex: 10
    });

    customOverlay.setMap(map);
    currentMemoOverlays.push(customOverlay); // 배열에 추가 (혹은 {overlay: customOverlay, memoNo: memoData.memo_no})

    // 이벤트 리스너 바인딩 (기존 displayMemoOnMap 내 로직 재활용)
    setTimeout(() => {
        const markerElement = document.getElementById(`marker-${memoData.memo_no}`);
        if (markerElement) {
            const detailsPopup = markerElement.closest('.memo-marker-container').querySelector('.memo-details-popup');
            if (detailsPopup) {
                markerElement.onmouseover = () => { detailsPopup.style.display = 'block'; };
                markerElement.onmouseout = () => { detailsPopup.style.display = 'none'; };
                detailsPopup.onmouseover = () => { detailsPopup.style.display = 'block'; };
                detailsPopup.onmouseout = () => { detailsPopup.style.display = 'none'; };
            }
            markerElement.onclick = (e) => {
                e.stopPropagation(); 
                openMemoModifyModal(memoData, e.clientX, e.clientY);
            };
        }
    }, 0); 

}
// 기존 오버레이를 모두 지우는 함수
function removeExistingMemoOverlays() {
    currentMemoOverlays.forEach(overlay => overlay.setMap(null));
    currentMemoOverlays = []; // 배열 초기화
}

/**
 * 필터 파라미터를 수집하는 함수
 * @returns {Object} 필터 파라미터 객체
 */
function collectFilterMemo() {
    
    const completeStatus = $("#opt_complet").is(':checked') ? 'Y' : 'N';
    return {
        complete: completeStatus,
    };
}
