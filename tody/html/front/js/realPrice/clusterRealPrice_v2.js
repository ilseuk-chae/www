const clusterersByType = {
    "all": null, // 아래 createClustererAll 함수에서 map 객체가 준비되면 초기화
    // 필요한 경우 estateType별 클러스터러 추가:
    // "apt": null, "multi": null, "officetel": null, "land": null, "single" : null, "commercial" : null, "factory" : null
};
let realPriceData = []; // 실거래가 정보
let realEstimatedPrice = null; // 추정가



function countEstateTypes(apiResponseObject) {
    // 1. 실제 데이터 배열이 존재하는지 확인합니다.
    const dataRecords = apiResponseObject.responseData;
    const estateTypeCounts = {}; // 각 estate_type의 개수를 저장할 객체

    // 2. dataRecords 배열을 순회하며 estate_type별 개수를 집계합니다.
    dataRecords.forEach(record => {
        // 각 레코드가 'estate_type' 속성을 가지고 있는지 확인
        if (record && record.estate_type) {
            const type = record.estate_type;
            // 해당 type이 이미 객체에 있으면 1 증가, 없으면 1로 초기화
            estateTypeCounts[type] = (estateTypeCounts[type] || 0) + 1;
        }
    });

    // 3. 집계된 결과를 콘솔에 표시합니다.
    //console.log("Estate 총수 : " + dataRecords.length);
    if (Object.keys(estateTypeCounts).length === 0) {
        console.log("데이터 내에 estate_type이 없거나, 레코드가 없습니다.");
    } else {
        for (const type in estateTypeCounts) {
            //console.log(` - ${type}: ${estateTypeCounts[type]}개`);
        }
    }
}


// 전역 변수들: 기존 코드에서 사용하는 변수명과 일치시켜야 합니다.
let currentEstateTypes = ["apt", "multi", "officetel", "land", "single", "commercial", "factory"]; // 현재 선택된 부동산 유형 (UI에 따라 동적으로 갱신)
let realEstateMarkers = []; // 클러스터러에 추가되지 않는 일반 마커 (현재는 사용하지 않지만 기존 구조 유지를 위해 선언)

// Kakao Geocoder 이후 주소 처리 및 기타 액션 함수들 (맵핑 후 바로 사용되므로 그대로 두는 것이 좋음)
// searchDetailAddrFromCoords(kakaoCoords, function (result, status) { ... });
// handleMapClick(coords);
// searchArroundPlaces(coords);
// realPriceDetail(type, pnu);
// displayAddressInfo(result, status);
// getFormattedDateTime() (디버깅용)

// 지도에 모든 부동산 관련 오버레이 및 마커를 제거하는 유틸리티 함수
function clearAllRealEstateOverlays() {
    realPriceOverlays.forEach(overlay => overlay.setMap(null));
    realPriceOverlays = [];
    realEstateMarkers.forEach(marker => marker.setMap(null)); // 클러스터러에 추가되지 않은 일반 마커 (이 코드가 필요하다면)
    realEstateMarkers = [];
    // 클러스터러가 초기화된 후에만 clear 호출
    if (clusterersByType["all"]) {
        clusterersByType["all"].clear();
    }
    // 다른 타입별 클러스터러가 있다면 forEach 등으로 clear
    // Object.values(clusterersByType).forEach(clusterer => clusterer && clusterer.clear());
}


/**
 * Kakao Map에서 사용할 Marker 객체를 생성합니다. (클러스터링용)
 * 기존 `createClusteredMarker` 함수의 역할을 재현합니다.
 * @param {Object} data - 부동산 데이터 아이템
 * @returns {kakao.maps.Marker} Kakao Map Marker 객체
 */
function createClusteredMarker(data) {
    const position = new kakao.maps.LatLng(data.center_latitude, data.center_longitude);
    const marker = new kakao.maps.Marker({
        position: position,
        // 클러스터러가 관리하므로 직접 map에 추가하지 않음
        // 기타 옵션 (예: 이미지, draggable 등)은 기존 코드에 맞춰 추가
    });
    return marker; // 마커 이벤트는 realPriceAptArrayWithCache 내부에서 별도로 추가.
}

/**
 * Kakao 지도 경계 내의 그리드 포인트들을 생성합니다.
 * @param {kakao.maps.Map} mapObj - Kakao Map 객체
 * @param {number} numPoints - 가로/세로 축당 생성할 포인트 개수 (총 numPoints * numPoints 개 생성)
 * @returns {Array<kakao.maps.LatLng>} 그리드 포인트들의 배열
 */
function getGridPointsFromMapBounds(mapObj, numPoints) {
    const bounds = mapObj.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const minLat = sw.getLat();
    const minLng = sw.getLng();
    const maxLat = ne.getLat();
    const maxLng = ne.getLng();

    const latStep = (maxLat - minLat) / (numPoints - 1);
    const lngStep = (maxLng - minLng) / (numPoints - 1);

    const points = [];
    for (let i = 0; i < numPoints; i++) {
        const lat = minLat + i * latStep;
        for (let j = 0; j < numPoints; j++) {
            const lng = minLng + j * lngStep;
            points.push(new kakao.maps.LatLng(lat, lng));
        }
    }
    return points;
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
        // 여기서 '전체' 버튼을 눌렀을 때만 실행되므로 중복될 일이 없습니다.
        //"apt", "multi", "officetel", "land", "single", "commercial", "factory"
        newEstateTypes.push("apt");
        newEstateTypes.push("multi"); // 오타 수정!
        newEstateTypes.push("officetel");
        newEstateTypes.push("land");
        newEstateTypes.push("single");
        newEstateTypes.push("commercial");
        newEstateTypes.push("factory");
    } else {
        // '전체' 버튼이 비활성화된 경우, 활성화된 개별 유형 버튼들만 확인
        // 주의: 첫 번째 버튼(전체 버튼)은 여기 루프에서 제외해야 합니다.
        $('.realmap-estate-group button.active').not(allToggleButton).each(function () {
            const btn_text = $(this).text().trim();
            // 개별 유형 버튼의 텍스트를 이용해 값을 추가
            newEstateTypes.push(estateTypeToValueEng(btn_text));
        });
    }
    // 만약 아무것도 선택되지 않았다면 기본값으로 모두 포함하도록 설정
    if (newEstateTypes.length === 0) {
        currentEstateTypes = ["apt", "multi", "officetel", "land", "single", "commercial", "factory"];
    } else {
        currentEstateTypes = newEstateTypes;
    }
    
    //console.log("Current Estate Types: ", currentEstateTypes);
}

// 헬퍼 함수: 가격을 보기 좋게 포맷 (예: 소수점 둘째 자리까지)
function myformatPrice(price) {
    if (isNaN(price) || price === null) return 'N/A';
    const formatted = parseFloat(price).toFixed(2);
    const [intPart, decPart] = formatted.split('.');
    const intWithComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart ? `${intWithComma}.${decPart}` : intWithComma;
}
/**
 * 주어진 부동산 타입에 대한 가격 아이템 HTML 문자열을 생성합니다.
 * @param {string} estateType - 부동산 타입 ("apt", "multi", "officetel", "land", "single", "commercial", "factory").
 * @param {object} sigunguData - 해당 시군구의 모든 데이터.
 * @param {boolean} isPyeongDisplay - 현재 오버레이의 단위 표시 상태 (true: 평, false: ㎡).
 * @returns {string} 가격 정보가 담긴 HTML 문자열.
 */
function createPriceItem(estateType, sigunguData, isPyeongDisplay) { // isPyeongDisplay 인자 추가
    let estateTypeName = '';
    if (estateType === 'apt') estateTypeName = '(아파트)';
    else if (estateType === 'multi') estateTypeName = '(연립)';
    else if (estateType === 'officetel') estateTypeName = '(오피스)';
    else if (estateType === 'land') estateTypeName = '(토지)';
    else if (estateType === 'single') estateTypeName = '(단독)';
    else if (estateType === 'commercial') estateTypeName = '(상업)';
    else if (estateType === 'factory') estateTypeName = '(공장)';
    else estateTypeName = '';

    const estateTypeData = sigunguData.estateTypes[estateType];
    let priceText = 'N/A';

    if (estateTypeData && estateTypeData.all_average !== null && estateTypeData.all_average !== undefined) {
        // 가정: DB에서 받은 all_average는 '만원/평' 단위의 평균 가격입니다.
        // 이 가정에 따라 '㎡'로 변환 로직을 적용합니다.
        let averageType = getAveragetypeParams();
        let displayPrice = 0;
        switch(averageType) {
            case 'DB전체':
                displayPrice = estateTypeData.all_average; 
                break;
            case '최근5년':
                displayPrice = estateTypeData.last5Year_average; 
                break;
            case '최근1년':
                displayPrice = estateTypeData.last1Year_average; 
                break;
            case '최근3월':
                displayPrice = estateTypeData.last3Month_average; 
                break;
            case '최근1월':
                displayPrice = estateTypeData.last1Month_average; 
                break;
            default:
                displayPrice = estateTypeData.last5Year_average; 
                break;
        }
        
        if (!isPyeongDisplay) { // '㎡'로 표시해야 하는 경우
            // 1평 = 3.30578 제곱미터. 평당 가격을 제곱미터당 가격으로 변환.
            displayPrice = displayPrice / 3.3058; 
        }
        priceText = myformatPrice(displayPrice) + '만원'; // '/평' 또는 '/㎡' 단위를 제거합니다.
    }
    // 각 estate_type별로 다른 class를 줄 수도 있습니다. (예: estate-item-apt)
    return `<div class="estate-item estate-item-${estateType}"> ${estateTypeName} ${priceText}</div>`;
}

// -----------------------------------------------------
// 초기 데이터 로드 (맵이 완전히 초기화된 후 호출)
// -----------------------------------------------------
// map 객체와 Kakao API 스크립트 로딩, 그리고 `initializeClusterers()`가 완료된 시점에서
// `fetchRealPriceAptArrayBasedOnMapCenterWidthCash()`를 호출해야 합니다.
// (예시: map 객체 초기화 콜백 함수, 또는 window.onload 이벤트 내에서)
// 맵 초기화 및 클러스터러 초기화는 페이지 로드 시 단 한 번 이루어져야 합니다.

// Kakao Map 생성 및 초기화 코드
// var container = document.getElementById('map');
// var options = {
//     center: new kakao.maps.LatLng(37.566826, 126.9786567), // 서울 시청
//     level: 7 // 초기 지도 확대 레벨
// };
// map = new kakao.maps.Map(container, options);

// // 지도 로드 완료 후 클러스터러 초기화
// kakao.maps.event.addListener(map, 'tilesloaded', function() {
//     initializeClusterers(); // 클러스터러 초기화
//     fetchRealPriceAptArrayBasedOnMapCenterWidthCash(); // 초기 데이터 로드
// }, { once: true }); // 타일 로드 후 한 번만 실행


// 앱 초기화 시 한 번만 실행하여 문제 있는 feature 목록 출력
function validateGeoJson(geojsonData) {
    const issues = [];
    geojsonData.features.forEach(f => {
        const code = String(f.properties.BJCD || f.properties.SGC || '알수없음');
        if (!f.geometry) {
            issues.push({ code, reason: 'geometry 없음' });
        } else if (!['Polygon', 'MultiPolygon'].includes(f.geometry.type)) {
            issues.push({ code, reason: `예상치 못한 타입: ${f.geometry.type}` });
        } else if (!f.geometry.coordinates?.length) {
            issues.push({ code, reason: 'coordinates 비어있음' });
        }
    });

    if (issues.length > 0) {
        console.warn('⚠️ GeoJSON 유효성 문제 목록:', issues);
    } else {
        console.log('✅ GeoJSON 전체 유효');
    }
}
/**
 * 최종 목표
 * 지도 화면 내 여러 시군구 코드를 자동으로 찾아 그 기준으로 realPriceApt 데이터를 백엔드에서 가져오는 함수.
 * 부동산 실거래가 정보를 새로운 캐시 API로부터 가져와 지도에 시각화하는 비동기 함수.
 * 이 함수는 기존 `realPriceAptArray(sggCdArray)`의 역할을 완전히 대체합니다.
 *
 * @param {string[]} sggCdsToFetch - 조회할 시군구 PNU 코드들의 배열 (예: ['11110', '11140'])
 * @param {Array<string>} estateTypesToFetch - 조회할 부동산 유형 배열 (예: ["apt", "multi", "officetel", "land", "single", "commercial", "factory"])
 * @returns {Promise<void>} 데이터 로드 및 시각화 작업 완료 Promise
 */
async function realPriceAptArrayWithCache(sggCdsToFetch, currentVisibleGeoJsonFeatures) {  /// estateTypesToFetch는 이제 collectMultiFilterParams에서 가져옴
               
    // 1. 현재 지도 화면의 바운딩 박스(Bounding Box) 추출
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    
    const mapBoundsPolygon = (map && map.getBounds) ? (function() {
        const sw = map.getBounds().getSouthWest();
        const ne = map.getBounds().getNorthEast();
        
        // ✨ 수정된 부분: turf.polygon() 자체가 Geometry 객체를 반환합니다. ✨
        // turf.js의 turf.polygon() 함수는 { "type": "Polygon", "coordinates": [...] } 형태의 객체를 직접 반환합니다.
        return turf.polygon([[
            [sw.getLng(), sw.getLat()],
            [sw.getLng(), ne.getLat()],
            [ne.getLng(), ne.getLat()],
            [ne.getLng(), sw.getLat()],
            [sw.getLng(), sw.getLat()]
        ]]);
    })() : null; // map 객체나 getBounds가 없으면 null 할당

    // 단일 링 유효성 검사 (외곽 + 내부 링 모두 적용)
    const isValidRing = (ring) =>
        Array.isArray(ring) &&
        ring.length >= 4 &&
        Array.isArray(ring[0]) &&
        ring[0].length === 2 &&
        ring.every(coord => Array.isArray(coord) && coord.length >= 2 && isFinite(coord[0]) && isFinite(coord[1]));

    const isValidPolygon = (geometry) => {
        if (!geometry) return false;
        if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) return false;

        if (geometry.type === 'Polygon') {
            return geometry.coordinates.length > 0 && geometry.coordinates.every(isValidRing);
        }

        if (geometry.type === 'MultiPolygon') {
            return geometry.coordinates.every(
                (polygon) => Array.isArray(polygon) && polygon.length > 0 && polygon.every(isValidRing)
            );
        }

        return false;
    };

    // 유효하지 않은 링을 제거하여 geometry를 정리
    const sanitizeGeometry = (geometry) => {
        if (!geometry || !Array.isArray(geometry.coordinates)) return geometry;

        if (geometry.type === 'Polygon') {
            const validRings = geometry.coordinates.filter(isValidRing);
            if (validRings.length === 0) return null; // 외곽링도 무효하면 사용 불가
            return { ...geometry, coordinates: validRings };
        }

        if (geometry.type === 'MultiPolygon') {
            const validPolygons = geometry.coordinates
                .map(polygon => (Array.isArray(polygon) ? polygon.filter(isValidRing) : []))
                .filter(polygon => polygon.length > 0); // 외곽링이 남아있는 폴리곤만 유지
            if (validPolygons.length === 0) return null;
            return { ...geometry, coordinates: validPolygons };
        }

        return geometry;
    };
    // 2. 클라이언트 필터 파라미터 수집 (API에는 직접 전달하지 않지만 시각화에 필요할 수 있음)
    const filterObj = collectMultiFilterParams();
    // API에 보낼 estateTypes는 filterObj.estateType 입니다.
    const estateTypesFromFilter = filterObj.estateType; 

    // 필수 파라미터 유효성 검사
     if (!bounds || !estateTypesFromFilter || estateTypesFromFilter.length === 0 || !sggCdsToFetch || sggCdsToFetch.length === 0) {
        
        clearAllRealEstateOverlays(); // 데이터가 없으므로 지도 비우기
        hideLoadingSpinner(); // 혹시 로딩 중이라면 숨김
        return;
    }
    
    // 3. 백엔드 API 호출 데이터 객체 구성 (JSON POST Body)
    const requestBody = { 
        minLat: sw.getLat(),
        minLng: sw.getLng(),
        maxLat: ne.getLat(),
        maxLng: ne.getLng(),
        estateTypes: estateTypesFromFilter.join(','), // collectMultiFilterParams에서 가져온 estateType 배열 사용
        sggCds: sggCdsToFetch.join(',') // 이 파라미터는 `fetchRealPriceAptArrayBasedOnMapCenterWidthCash()`에서 넘어옴
    };

    showLoadingSpinner(); // 로딩 스피너 표시
    clearAllRealEstateOverlays(); // API 호출 전 기존 지도 객체 모두 제거
    
    // 추후 sggCdsToFetch 길이로 읍면동/시군구/시도 단위 처리 분기 가능
    if(sggCdsToFetch[0].length === 10){
        // 읍면동 단위 처리 로직 
        try {
            const response = await fetch("/front/back/realPrice/realPrice_apt_emd_cache.php", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody), // JSON 형태로 바디에 담아 전송
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // 5. API 응답 처리 시작
            if (!result.success) {
                console.error("API Error:", result.message);
                alert("부동산 데이터를 가져오는 중 오류가 발생했습니다: " + result.message);
                return;
            }

            const responseData = result.data; // 실제 데이터 배열
            const zoomLevel = map.getLevel(); // 현재 줌 레벨

            // 6. 데이터 반복 및 지도 객체 생성 (기존 로직과 거의 동일)
            console.log('[실거래가:읍면동] 표시할 실거래가 개수:', responseData.length);
            
            responseData.forEach((data) => {
                
                // 이제 'data' 객체 안에 'redis_cached_at' 필드가 포함되어 있습니다.
                const cachedAt = data.redis_cached_at; // 이 변수에 Redis 캐시된 시간 정보가 담깁니다.
                let markerString = ""; // 줌 레벨 4 이하에서 사용
                let estateString = "";
                let borderString = "";
                let liString = "";
                let imgString = "";
                let infoString = "";
                let jimokString = "";
                let badgeColor = "#999";
                let lightColor = "#BBBBBB";

                if (zoomLevel > 4) { // 줌 레벨이 5 이상일 경우 (원안에 숫자 표시)
                    // 클러스터러가 초기화되었는지 확인
                    if (!clusterersByType["all"]) {
                        //console.warn("MarkerClusterer 'all' is not initialized.");
                        return;
                    }
                    const marker = createClusteredMarker(data); // 마커 생성 (데이터는 그대로 전달)
                    
                    // 마커에 클릭 이벤트 추가 (클러스터러 마커와 구분되도록) - 데이터마다 다른 이벤트이므로 여기서 추가
                    kakao.maps.event.addListener(marker, 'click', function() {
                        if (window.mapContentClosingLock) return; // 패널 닫기 직후 무시
                        if ($(".mo-tool-option button").hasClass("active")) return;
                        if ($("#draw_toolbox a").hasClass("active")) return;
                        
                        const type = data.estate_type;
                        const pnu = data.pnu;
                        const lat = data.center_latitude;
                        const lng = data.center_longitude;
                        const coords = { lat: lat, lng: lng };
                        const kakaoCoords = new kakao.maps.LatLng(lat, lng);

                        searchDetailAddrFromCoords(kakaoCoords, function (result, status) {
                            if (status === kakao.maps.services.Status.OK) {
                                handleMapClick(coords);
                                searchArroundPlaces(coords);
                                realPriceDetail(type, pnu);
                            }
                            displayAddressInfo(result, status);
                        });
                    });

                    clusterersByType["all"].addMarker(marker); // 클러스터러에 마커 추가
                    
                } else if (zoomLevel === 4) { // 줌 레벨이 4일 경우 (점표시)
                    const smallMarker = document.createElement("div");
                    
                    // 부동산 유형에 따른 스타일 클래스 설정
                    switch(data.estate_type) {
                        case "apt": markerString = "small-marker bg-orange2 border-orange2"; break;  
                        case "land": markerString = "small-marker bg-yellow1 border-yellow1"; break;  
                        case "multi": markerString = "small-marker bg-red2 border-red2"; break;
                        case "officetel": markerString = "small-marker bg-indigo2 border-indigo2"; break;
                        case "single": markerString = "small-marker bg-violet1 border-violet1"; break;
                        case "commercial": markerString = "small-marker bg-blue1 border-blue1"; break;
                        case "factory": markerString = "small-marker bg-green1 border-green1"; break;
                        default: markerString = "small-marker bg-gray border-gray"; break;
                    }
                    
                    smallMarker.className = markerString;
                    smallMarker.style.cssText = `
                        width: 7px;
                        height: 7px;
                        border-radius: 50%;
                        cursor: pointer;
                    `;

                    // 커스텀 오버레이로 원형 점을 지도에 추가
                    let smallMarkerPosition = new kakao.maps.LatLng(data.center_latitude, data.center_longitude);
                    const smallMarkerOverlay = new kakao.maps.CustomOverlay({
                        content: smallMarker,
                        position: smallMarkerPosition,
                        map: map,
                        xAnchor: 0.5,
                        yAnchor: 0.5,
                        zIndex: 1,
                    });

                    // 작은 원형 점에 클릭 이벤트 추가
                    smallMarker.addEventListener("click", function () {
                        if (window.mapContentClosingLock) return; // 패널 닫기 직후 무시
                        if ($(".mo-tool-option button").hasClass("active")) return;
                        if ($("#draw_toolbox a").hasClass("active")) return;

                        // 패널 열기 + 실거래가 탭 활성화
                        if (typeof _openMapContent === 'function') _openMapContent();
                        if (typeof _switchLayerTab === 'function') {
                            _switchLayerTab('layer-realprice');
                        }

                        const type = data.estate_type;
                        const pnu = data.pnu;
                        const lat = data.center_latitude;
                        const lng = data.center_longitude;
                        const coords = { lat: lat, lng: lng };
                        const kakaoCoords = new kakao.maps.LatLng(lat, lng);
                        searchDetailAddrFromCoords(kakaoCoords, function (result, status) {
                            if (status === kakao.maps.services.Status.OK) {
                                handleMapClick(coords);
                                searchArroundPlaces(coords);
                                realPriceDetail(type, pnu);
                            }
                            displayAddressInfo(result, status);
                        });
                    });
                    realPriceOverlays.push(smallMarkerOverlay); // 오버레이 배열에 작은 원형 점 추가

                } else { // 줌 레벨이 3 이하일 경우 (상세도 상세표시) 
                    
                    const iwContent = document.createElement("div"); 
                    iwContent.className = "real-price-marker cursor-pointer";
                    
                    // 부동산 유형에 따른 스타일 및 텍스트 설정
                    switch(data.estate_type) {
                        case "apt":
                            markerString = "border-orange2"; borderString = "border-bottom-orange2"; liString = "bg-orange2";
                            imgString = "icn_arr_mark_orange2.svg"; badgeColor = "#FE6900"; lightColor = "#FFA55A";
                            estateString = makeEstateTypeName(data.estate_type,data.jimok, ""); break;
                        case "land":
                            markerString = "border-yellow1"; borderString = "border-bottom-yellow1"; liString = "bg-yellow1";
                            imgString = "icn_arr_mark_yellow1.svg"; badgeColor = "#FEB912"; lightColor = "#FDD055";
                            if (data.jimok != null && typeof data.jimok === 'string') { jimokString = data.jimok.replace(/용지/g, ""); } else { jimokString =""; }
                            estateString = makeEstateTypeName(data.estate_type,data.jimok, ""); break;
                        case "multi":
                            markerString = "border-red2"; borderString = "border-bottom-red2"; liString = "bg-red2";
                            imgString = "icn_arr_mark_red2.svg"; badgeColor = "#FE7D87"; lightColor = "#FFB0B7";
                            estateString = makeEstateTypeName(data.estate_type,data.jimok, ""); break;
                            break;
                        case "officetel":
                            markerString = "border-indigo2"; borderString = "border-bottom-indigo2"; liString = "bg-indigo2";
                            imgString = "icn_arr_mark_indigo2.svg"; badgeColor = "#F4AFCA"; lightColor = "#F8D0E3";
                            estateString = makeEstateTypeName(data.estate_type,data.jimok, ""); break;
                        case "single":
                            markerString = "border-violet1"; borderString = "border-bottom-violet1"; liString = "bg-violet1";
                            imgString = "icn_arr_mark_violet1.svg"; badgeColor = "#702BFE"; lightColor = "#9B6DFE";
                            estateString = makeEstateTypeName(data.estate_type,data.jimok, ""); break;
                        case "commercial":
                            markerString = "border-blue1"; borderString = "border-bottom-blue1"; liString = "bg-blue1";
                            imgString = "icn_arr_mark_blue1.svg"; badgeColor = "#2973D6"; lightColor = "#6BA4E8";
                            estateString = makeEstateTypeName(data.estate_type,data.jimok, data.usage_type); break; //(상업용)
                        case "factory":
                            markerString = "border-green1"; borderString = "border-bottom-green1"; liString = "bg-green1";
                            imgString = "icn_arr_mark_green1.svg"; badgeColor = "#039C55"; lightColor = "#40BD80";
                            estateString = makeEstateTypeName(data.estate_type, data.jimok, data.usage_type); break;
                        default:
                            markerString = "border-gray"; borderString = "border-bottom-gray"; liString = "bg-gray";
                            imgString = "icn_arr_mark_gray_black.svg"; badgeColor = "#999"; lightColor = "#BBBBBB"; estateString = "-"; break;
                    }

                    // 필터에 따른 정보 문자열 구성
                    switch(filterObj.estateinfo) {
                        case "거래면적":
                            infoString = `<span class="font12 number toggle-unit" data-raw-sqm="${data.excluUseAr}">${(data.excluUseAr / 3.3058).toFixed(2)}평</span>`;
                            break;
                        case "거래년도":
                            infoString = `<span class="font12">${data.dealYear}년</span>`;
                            break;
                        case "거래단가":
                            const originalAmount = parseFloat(data.dealAmount.replace(/,/g, ""));
                            const originalArea = data.excluUseAr / 3.3058;
                            const unitPrice = originalAmount / originalArea;
                            infoString = `<span class="font12 number toggle-unit" data-raw-sqm="${data.excluUseAr}" data-raw-amount="${originalAmount}">${formatPrice(unitPrice, "all", false, true)}/평</span>`;
                            break;
                        default: // filterObj.estateinfo === "거래가격"
                            infoString = `<span class="font12 ">-</span>`; 
                            break;
                    }

                    if (singlecolor_mode) {
                        lightColor = real_singlecolor;
                        badgeColor = real_singlecolor;
                    }

                    // HTML 콘텐츠 구성
                    iwContent.innerHTML = `
                    <ul class="text-center bg-white overflow-hidden" style="min-width:60px; border-radius:10px; border: 1px solid ${lightColor};" data-lat="${data.center_latitude}" data-lng="${data.center_longitude}" data-type="${data.estate_type
                    }" ondragstart="return false;" onselectstart="return false;">
                        <li class="up bg-white p-1" style="line-height:11px; display:flex; align-items:center; justify-content:center; gap:3px; border-bottom: 1px solid ${lightColor};">
                            <span style="display:inline-flex; align-items:center; justify-content:center; width:14px; height:14px; border-radius:50%; background:${badgeColor}; font-size:8px; font-weight:800; color:#fff; flex-shrink:0; line-height:1;">실</span>
                            <span class="font10">${estateString}</span>
                        </li>
                        <li class="up bg-white p-1">
                            <p class="font12" style="line-height: 12px;">${formatPrice(data.dealAmount.replace(/,/g, ""), "all", false, true)}</p>
                        </li>
                        <li class="text-white" style="background: ${lightColor};">
                            ${infoString}
                        </li>
                    </ul>
                    <div style="text-align:center; line-height:0; margin:0; padding:0;"><span style="display:inline-block; width:0; height:0; border-left:9px solid transparent; border-right:9px solid transparent; border-top:10px solid ${lightColor};"></span></div>
                    `;

                    // CustomOverlay 생성 및 지도에 추가
                    let iwPosition = new kakao.maps.LatLng(data.center_latitude, data.center_longitude); 
                    var realPriceOverlay = new kakao.maps.CustomOverlay({
                        clickable: true,
                        content: iwContent,
                        map: map,
                        position: iwPosition,
                        xAnchor: 0.45,
                        yAnchor: 1.2,
                        zIndex: 1,
                    });
                    
                    // HTML 내부의 toggle-unit 요소에 직접 클릭 이벤트 추가
                    iwContent.addEventListener("click", function (e) {
                        if ($(".mo-tool-option button").hasClass("active")) return;
                        if ($("#draw_toolbox a").hasClass("active")) return;
                        e.preventDefault(); // 기본 클릭 동작 (링크 이동 등) 방지

                        // Z-index 조절 로직
                        if (realPriceOverlay) {
                            const currentZIndex = parseInt(realPriceOverlay.getZIndex() || 0, 10);
                            if (currentZIndex >= globalEstateZIndex) {
                                globalEstateZIndex = currentZIndex + 1;
                            } else {
                                globalEstateZIndex++;
                            }
                            realPriceOverlay.setZIndex(globalEstateZIndex);
                        }

                        // 패널 열기 + 실거래가 탭 활성화
                        if (typeof _openMapContent === 'function') _openMapContent();
                        if (typeof _switchLayerTab === 'function') {
                            _switchLayerTab('layer-realprice');
                        }

                        // 상세 정보 호출 로직 (data 객체에서 직접 가져옴)
                        const type = data.estate_type;
                        const pnu = data.pnu;
                        const lat = data.center_latitude;
                        const lng = data.center_longitude;
                        const coords = { lat: lat, lng: lng };
                        const kakaoCoords = new kakao.maps.LatLng(lat, lng);

                        searchDetailAddrFromCoords(kakaoCoords, function (result, status) {
                            if (status === kakao.maps.services.Status.OK) {
                                handleMapClick(coords);
                                searchArroundPlaces(coords);
                                realPriceDetail(type, pnu);
                            }
                            displayAddressInfo(result, status);
                        });

                        // 단위 토글 로직
                        if(filterObj.estateinfo === "거래면적" || filterObj.estateinfo === "거래단가"){
                            const unitElement = iwContent.querySelector(".toggle-unit");
                            const isPyeong = unitElement.textContent.includes("평");
                            if(filterObj.estateinfo === "거래면적") {
                                unitElement.textContent = isPyeong ? `${parseFloat(data.excluUseAr).toFixed(2)}㎡` : `${(data.excluUseAr / 3.3058).toFixed(2)}평`;
                            } else if(filterObj.estateinfo === "거래단가") {
                                const originalAmount = parseFloat(data.dealAmount.replace(/,/g, ""));
                                const originalM2Area = data.excluUseAr;
                                const originalPyArea = data.excluUseAr / 3.3058;
                                const unitPyPrice = originalAmount / originalPyArea;
                                const unitM2Price = originalAmount / originalM2Area;
                                unitElement.textContent = isPyeong ? `${formatPrice(unitM2Price, "all", false, true)}/㎡` : `${formatPrice(unitPyPrice, "all", false, true)}/평`;
                            }
                        }
                    });
                    realPriceOverlays.push(realPriceOverlay); // 오버레이 배열에 인포윈도우 스타일 마커 추가
                }
            }); // responseData.forEach((data) => 끝
        
        } catch (error) {
            let userFriendlyMessage = "데이터를 불러오는 중 알 수 없는 오류가 발생했습니다.";
            if (error.message) {
                userFriendlyMessage = "(10)데이터를 불러오는 중 오류가 발생했습니다: " + error.message;
            } else if (error instanceof TypeError) {
                // 예를 들어 response.json()이 실패했거나, 네트워크 문제일 때 TypeError가 발생하기도 합니다.
                userFriendlyMessage = "네트워크 문제 또는 서버 응답 처리 오류가 발생했습니다.";
            } else if (error instanceof SyntaxError) {
                userFriendlyMessage = "서버로부터 유효하지 않은 데이터가 수신되었습니다. (JSON 파싱 오류)";
            }
            alert(userFriendlyMessage); // 사용자에게 더 친화적인 메시지 표시
        } finally {
            hideLoadingSpinner(); // 로딩 스피너 숨김
        }
    } 
    // 시군구 단위 처리 추가
    else if(sggCdsToFetch[0].length === 5){
        // 시군구 단위에서는 estateTypes를 고정 값으로 변경합니다.
        requestBody.estateTypes = "apt,multi,officetel,land,single,commercial,factory"; 
        
        try {
            const response = await fetch("/front/back/realPrice/realPrice_apt_sigungu_db.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(requestBody), // 읍면동과 동일한 requestBody 사용 가능
            });

            if (!response.ok) {
                const errorText = await response.text();
                hideLoadingSpinner();
                return;
            }

            const result = await response.json();
            if (!result.success) {
                alert("시군구 데이터를 가져오는 중 오류가 발생했습니다: " + result.message);
                return;
            }
            const responseData = result.data; // 시군구별, 타입별 평균 데이터 배열

            //console.log('[실거래가:시군구] 표시할 실거래가 개수:', responseData.length);

            if (!responseData || responseData.length === 0) {
                hideLoadingSpinner();
                return;
            }

            // 데이터 그룹화: 같은 시군구 코드를 가진 데이터를 모아서 처리 (클러스터 마커는 시군구별 1개)
            const groupedData = responseData.reduce((acc, current) => {
                if (!acc[current.code]) {
                    acc[current.code] = {
                        code: current.code,
                        code_name: current.code_name,
                        center_latitude: current.center_latitude,
                        center_longitude: current.center_longitude,
                        estateTypes: {} ,// 이 시군구의 각 estate_type별 평균 데이터를 담을 객체
                        // 각 estate_type별 단위 표시 상태를 여기서 초기화 (기본: 평)
                        
                        _unitDisplayStates: { 
                            'apt': true, 
                            'multi': true, 
                            'officetel': true, 
                            'land': true ,
                            'single': true,
                            'commercial': true,
                            'factory': true
                        }
                    };
                }
                // 각 estate_type별 평균 데이터를 저장
                acc[current.code].estateTypes[current.estate_type] = {
                    all_average: current.all_average,
                    last5Year_average: current.last5Year_average,
                    last1Year_average: current.last1Year_average,
                    last3Month_average: current.last3Month_average,
                    last1Month_average: current.last1Month_average,
                    // 필요한 경우 count 정보도 추가
                };
                return acc;
            }, {});

            // 그룹화된 데이터를 순회하며 지도에 표시
            Object.values(groupedData).forEach((sigunguData) => {  // sigunguData 변수 사용
                // 개별 타입이 아니라 마커 전체의 단일 상태로 관리
                if (!sigunguData._isPyeongDisplay) { // 혹시 이전에 정의되지 않았다면 기본값 설정
                    sigunguData._isPyeongDisplay = true; 
                }

                // 마커의 최종 위치
                let markerPosition = new kakao.maps.LatLng(sigunguData.center_latitude, sigunguData.center_longitude);
                
                // 1. 해당 시군구 코드(sigunguData.code)에 맞는 GeoJSON feature를 찾습니다.
                //    이 feature는 현재 화면에 보이는 GeoJSON 파일(예: SIG_CD_3pro.geojson)에서 와야 합니다.
                //    'currentVisibleGeoJsonFeatures'는 이미 화면 경계와 교차하는 필터링된 feature 배열이라고 가정합니다.
                // 해당 시군구의 GeoJSON feature 찾기 (Gist와 동일)
                // 1. GeoJSON feature 찾기
                const correspondingGeoJsonFeature = currentVisibleGeoJsonFeatures.find(
                    (feature) => {
                        const featureCode = String(feature.properties.BJCD || feature.properties.SGC).substring(0, sigunguData.code.length);
                        return featureCode === sigunguData.code;
                    }
                );
               
                // ✅ correspondingGeoJsonFeature 존재 여부 먼저 체크
                if (!correspondingGeoJsonFeature) {
                    console.warn(`[${sigunguData.code}] GeoJSON feature 없음 → DB centroid 사용`);
                    // markerPosition은 이미 DB centroid로 초기화되어 있으므로 그대로 사용
                } else {
                    // --- turf.intersect 호출 전에 유효성 검사 강화 ---
                    const sanitizedFeatureGeom = sanitizeGeometry(correspondingGeoJsonFeature.geometry);
                    const sanitizedMapBoundsGeom = sanitizeGeometry(mapBoundsPolygon.geometry);
                    const isFeatureGeometryValid = sanitizedFeatureGeom && isValidPolygon(sanitizedFeatureGeom);
                    const isMapBoundsValid = sanitizedMapBoundsGeom && isValidPolygon(sanitizedMapBoundsGeom);

                    if (isFeatureGeometryValid && isMapBoundsValid) {
                        try {

                            // 정리된 geometry로 Feature 객체 생성
                            const feature1_for_intersect = turf.feature(sanitizedFeatureGeom, correspondingGeoJsonFeature.properties);
                            const feature2_for_intersect = turf.feature(sanitizedMapBoundsGeom);
                            // 두 Feature를 FeatureCollection으로 만듭니다.
                            const featuresToIntersect = turf.featureCollection([feature1_for_intersect, feature2_for_intersect]);
                            // turf.intersect에 FeatureCollection을 전달합니다.
                            // 2. 해당 GeoJSON feature의 geometry와 현재 지도 화면의 경계(mapBoundsPolygon)가 교차하는 영역을 계산합니다.
                            const intersection = turf.intersect(featuresToIntersect);

                            if (intersection) { // 교차 영역이 유효하게 반환된 경우
                                // 3. 교차 영역의 중심점을 계산합니다.
                                const visibleCentroid = turf.centroid(intersection);
                                markerPosition = new kakao.maps.LatLng(
                                visibleCentroid.geometry.coordinates[1], // 위도
                                visibleCentroid.geometry.coordinates[0] // 경도
                                );
                            } else {
                                // 교차 영역은 없지만, 해당 feature의 원래 중심점을 사용
                                //console.warn("No intersection found between feature and map bounds.");
                                const featureCentroid = turf.centroid(correspondingGeoJsonFeature.geometry);
                                markerPosition = new kakao.maps.LatLng(
                                featureCentroid.geometry.coordinates[1],
                                featureCentroid.geometry.coordinates[0]
                                );
                                //console.warn(`[sigunguData.code: ${sigunguData.code}] No actual intersection between feature and map bounds, using feature's centroid.`);

                            }
                        } catch (turfError) {
                            // turf.intersect 내부에서 발생한 다른 예외 처리
                            console.warn(`[turf.intersect Error] for code ${sigunguData.code}:`, turfError.message);
                            //console.warn(`[geometry dump] type=${correspondingGeoJsonFeature?.geometry?.type}, rings=${JSON.stringify(correspondingGeoJsonFeature?.geometry?.coordinates?.map(r => r.length))}`);
                            // 에러 발생 시 fallback: feature의 중심점 사용
                            if (isFeatureGeometryValid) {
                                const featureCentroid = turf.centroid(correspondingGeoJsonFeature.geometry);
                                markerPosition = new kakao.maps.LatLng(
                                featureCentroid.geometry.coordinates[1],
                                featureCentroid.geometry.coordinates[0]
                                );
                            } else {
                                markerPosition = new kakao.maps.LatLng(sigunguData.center_latitude, sigunguData.center_longitude);
                            }
                        }
                    } else {
                        // 유효성 검사를 통과하지 못한 경우 (Feature Geometry가 없거나 Map Bounds Polygon이 유효하지 않음)
                        if (isFeatureGeometryValid) {
                            const featureCentroid = turf.centroid(correspondingGeoJsonFeature.geometry);
                            markerPosition = new kakao.maps.LatLng(
                            featureCentroid.geometry.coordinates[1],
                            featureCentroid.geometry.coordinates[0]
                            );
                            console.warn(`[sigunguData.code: ${sigunguData.code}] Invalid mapBoundsPolygon or geometry for intersection, using feature's centroid.`);
                        } else {
                            // GeoJSON feature 자체도 문제가 있는 경우
                            markerPosition = new kakao.maps.LatLng(sigunguData.center_latitude, sigunguData.center_longitude);
                            console.warn(`[sigunguData.code: ${sigunguData.code}] No valid GeoJSON feature geometry found for intersection, using DB centroid.`);
                        }
                    }
                    // --- 유효성 검사 및 마커 위치 결정 로직 끝 ---
                }

                // ✅ 올바른 코드 - 괄호로 묶기
                if (!(markerPosition instanceof kakao.maps.LatLng) || isNaN(markerPosition.getLat()) || isNaN(markerPosition.getLng())) {
                    console.error(`[ERROR] Invalid markerPosition for code ${sigunguData.code}`);
                    return;
                }
                
                // 초기 단위 상태 및 텍스트 결정 (Gist 수정)
                const initialIsPyeongDisplay = sigunguData._unitDisplayStates['apt']; 
                const initialUnitText = initialIsPyeongDisplay ? '평' : '㎡';

                // CustomOverlay HTML 내용 구성 (Gist 수정)
                const customOverlayContent = `
                    <div class="custom-overlay-content">
                        <div class="name-line">
                            <span class="name-text">${sigunguData.code_name}</span> 
                            <span class="unit-toggle-btn">(${initialUnitText})</span> 
                            <span class="toggle-icon">▼</span>
                        </div>
                        <div class="main-price">
                            ${createPriceItem('apt', sigunguData, initialIsPyeongDisplay)}
                        </div>
                        <div class="detail-prices" style="display:none;">
                            ${createPriceItem('multi', sigunguData, initialIsPyeongDisplay)}
                            ${createPriceItem('officetel', sigunguData, initialIsPyeongDisplay)}
                            ${createPriceItem('land', sigunguData, initialIsPyeongDisplay)}
                            ${createPriceItem('single', sigunguData, initialIsPyeongDisplay)}
                            ${createPriceItem('commercial', sigunguData, initialIsPyeongDisplay)}
                            ${createPriceItem('factory', sigunguData, initialIsPyeongDisplay)}
                        </div>
                    </div>
                `;
                
                // 2. customOverlayContent와 map 객체 값 확인 (추가)
                const customOverlay = new kakao.maps.CustomOverlay({
                    map: map,
                    position: markerPosition,
                    content: customOverlayContent,
                    yAnchor: 1,
                    zIndex: 1
                });
                realPriceOverlays.push(customOverlay);

                // 이벤트 리스너 추가 // 3. customOverlayElement 접근 성공 여부 확인 (추가)
                const customOverlayElement = customOverlay.a; // DOM 요소를 가져오는 방법
                if (!customOverlayElement) {
                    //console.error(`[DEBUG ERROR] Failed to get DOM element for CustomOverlay of code ${sigunguData.code}. Overlay might not be properly rendered.`);
                    // 이 경우에도 계속 진행은 가능하지만, 이벤트 리스너는 붙지 않을 것입니다.
                } else {
                }
                const nameLineDiv = customOverlayElement.querySelector('.name-line');
                const detailPricesDiv = customOverlayElement.querySelector('.detail-prices');
                const toggleIconSpan = customOverlayElement.querySelector('.toggle-icon');
                const unitToggleButton = customOverlayElement.querySelector('.unit-toggle-btn'); // 새로 추가된 단위 토글 버튼

                if (nameLineDiv) {
                    // 전체 name-line 클릭 이벤트 (단위 토글 또는 펼치기/접기)
                    nameLineDiv.addEventListener('click', (event) => {
                        // event.target이 단위 토글 버튼인지 확인하여 분기 처리
                        if (unitToggleButton && unitToggleButton.contains(event.target)) { // 클릭된 요소가 단위 토글 버튼이거나 그 자식일 경우
                            event.stopPropagation(); // 오버레이 클릭 이벤트를 막아 지도가 이동하는 것을 방지
                            
                            const currentPyeongDisplay = sigunguData._unitDisplayStates['apt'];
                            const newPyeongDisplay = !currentPyeongDisplay;

                            // 해당 오버레이의 모든 estateType 단위 표시 상태를 업데이트
                            for (const type in sigunguData._unitDisplayStates) {
                                if (sigunguData._unitDisplayStates.hasOwnProperty(type)) {
                                    sigunguData._unitDisplayStates[type] = newPyeongDisplay;
                                }
                            }

                            unitToggleButton.textContent = newPyeongDisplay ? '(평)' : '(㎡)';

                            // 가격 항목들만 다시 렌더링
                            const mainPriceDiv = customOverlayElement.querySelector('.main-price');
                            const newDetailPricesDiv = customOverlayElement.querySelector('.detail-prices');

                            mainPriceDiv.innerHTML = createPriceItem('apt', sigunguData, newPyeongDisplay);
                            newDetailPricesDiv.innerHTML = `
                                ${createPriceItem('multi', sigunguData, newPyeongDisplay)}
                                ${createPriceItem('officetel', sigunguData, newPyeongDisplay)}
                                ${createPriceItem('land', sigunguData, newPyeongDisplay)}
                                ${createPriceItem('single', sigunguData, newPyeongDisplay)}
                                ${createPriceItem('commercial', sigunguData, newPyeongDisplay)}
                                ${createPriceItem('factory', sigunguData, newPyeongDisplay)}
                            `;

                        } else { // 펼치기/접기 아이콘 또는 나머지 영역 클릭 시 (기존 로직)
                            event.stopPropagation(); // 지도 클릭 이벤트 방지
                            if (detailPricesDiv.style.display === 'none') {
                                detailPricesDiv.style.display = 'block';
                                toggleIconSpan.textContent = '▲';
                            } else {
                                detailPricesDiv.style.display = 'none';
                                toggleIconSpan.textContent = '▼';
                            }
                        }
                    });
                    nameLineDiv.addEventListener('mouseover', function() {
                        nameLineDiv.style.background = '#eee';
                    });
                    nameLineDiv.addEventListener('mouseout', function() {
                        nameLineDiv.style.background = '#fff';
                    });
                } else {
                    //console.warn(`[DEBUG WARNING] Could not find .name-line div for code ${sigunguData.code}. Event listeners not attached.`);
                }
            }); // groupedData.forEach((sigunguData) => { ... }) 끝

            hideLoadingSpinner(); // 로딩 스피너 숨김

        } catch (error) {
            
            let userFriendlyMessage = "데이터를 불러오는 중 알 수 없는 오류가 발생했습니다.";
            if (error.message) {
                userFriendlyMessage = "(5)데이터를 불러오는 중 오류가 발생했습니다: " + error.message;
            } else if (error instanceof TypeError) {
                // 예를 들어 response.json()이 실패했거나, 네트워크 문제일 때 TypeError가 발생하기도 합니다.
                userFriendlyMessage = "네트워크 문제 또는 서버 응답 처리 오류가 발생했습니다.";
            } else if (error instanceof SyntaxError) {
                userFriendlyMessage = "서버로부터 유효하지 않은 데이터가 수신되었습니다. (JSON 파싱 오류)";
            }
            alert(userFriendlyMessage); // 사용자에게 더 친화적인 메시지 표시

        } finally {
            hideLoadingSpinner(); // 로딩 스피너 숨김
        }
    } 
    // 시도 단위 처리 로직 (추후 구현)
    else if(sggCdsToFetch[0].length === 2){   
        
        // 시도 단위에서는 estateTypes를 고정 값으로 변경합니다.
        requestBody.estateTypes = "apt,multi,officetel,land,single,commercial,factory"; 

        try {
            // 시도 API 엔드포인트 호출
            const response = await fetch("/front/back/realPrice/realPrice_apt_sido_db.php", { // 'sido_db.php'로 변경
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(requestBody), 
            });

            if (!response.ok) {
            const errorText = await response.text();
            hideLoadingSpinner();
            return;
        }
            const result = await response.json();
            if (!result.success) {
                alert("시도 데이터를 가져오는 중 오류가 발생했습니다: " + result.message);
                return;
            }
            const responseData = result.data; 

            // 6. 데이터 반복 및 지도 객체 생성 (기존 로직과 거의 동일)
            //console.log('[실거래가:시도] 표시할 실거래가 개수:', responseData.length);

            if (!responseData || responseData.length === 0) {
                hideLoadingSpinner();
                return;
            }

            // 데이터 그룹화: 같은 시도 코드를 가진 데이터를 모아서 처리
            const groupedData = responseData.reduce((acc, current) => {
                if (!acc[current.code]) {
                    acc[current.code] = {
                        code: current.code,
                        code_name: current.code_name, // 시도 이름
                        center_latitude: current.center_latitude,
                        center_longitude: current.center_longitude,
                        estateTypes: {},
                        // 각 estate_type별 단위 표시 상태를 여기서 초기화 (기본: 평)
                        _unitDisplayStates: { 
                            'apt': true,'multi': true,'officetel': true,'land': true,'single': true,'commercial': true,'factory': true,
                        }
                    };
                }
                acc[current.code].estateTypes[current.estate_type] = {
                    all_average: current.all_average,
                    last5Year_average: current.last5Year_average,
                    last1Year_average: current.last1Year_average,
                    last3Month_average: current.last3Month_average,
                    last1Month_average: current.last1Month_average,
                };
                return acc;
            }, {});

            // 그룹화된 데이터를 순회하며 지도에 표시
            Object.values(groupedData).forEach((sidoData) => { // sidoData 변수 사용
                // 개별 타입이 아니라 마커 전체의 단일 상태로 관리
                if (!sidoData._isPyeongDisplay) {
                    sidoData._isPyeongDisplay = true; 
                }

                // 마커의 최종 위치
                let markerPosition = new kakao.maps.LatLng(sidoData.center_latitude, sidoData.center_longitude);
                // 1. 해당 시도 코드(sidoData.code)에 맞는 GeoJSON feature를 찾습니다.
                //    이 feature는 현재 화면에 보이는 GeoJSON 파일(예: CTPRVN_3pro.geojson)에서 와야 합니다.
                //    'currentVisibleGeoJsonFeatures'는 이미 화면 경계와 교차하는 필터링된 feature 배열이라고 가정합니다.
                 // 해당 시군구의 GeoJSON feature 찾기 (Gist와 동일)
                const correspondingGeoJsonFeature = currentVisibleGeoJsonFeatures.find(
                    (feature) => {
                        const featureCode = String(feature.properties.BJCD || feature.properties.SGC).substring(0, sidoData.code.length);
                        return featureCode === sidoData.code;
                    }
                );

                // ✅ correspondingGeoJsonFeature 존재 여부 먼저 체크
                if (!correspondingGeoJsonFeature) {
                    console.warn(`[${sigunguData.code}] GeoJSON feature 없음 → DB centroid 사용`);
                    // markerPosition은 이미 DB centroid로 초기화되어 있으므로 그대로 사용
                } else {

                    // --- turf.intersect 호출 전에 유효성 검사 강화 ---
                    const sanitizedFeatureGeom = sanitizeGeometry(correspondingGeoJsonFeature.geometry);
                    const sanitizedMapBoundsGeom = sanitizeGeometry(mapBoundsPolygon.geometry);
                    const isFeatureGeometryValid = sanitizedFeatureGeom && isValidPolygon(sanitizedFeatureGeom);
                    const isMapBoundsValid = sanitizedMapBoundsGeom && isValidPolygon(sanitizedMapBoundsGeom);

                    if (isFeatureGeometryValid && isMapBoundsValid) {
                        try {

                            // 정리된 geometry로 Feature 객체 생성
                            const feature1_for_intersect = turf.feature(sanitizedFeatureGeom, correspondingGeoJsonFeature.properties);
                            const feature2_for_intersect = turf.feature(sanitizedMapBoundsGeom);
                            // 두 Feature를 FeatureCollection으로 만듭니다.
                            const featuresToIntersect = turf.featureCollection([feature1_for_intersect, feature2_for_intersect]);
                            // turf.intersect에 FeatureCollection을 전달합니다.
                            // 2. 해당 GeoJSON feature의 geometry와 현재 지도 화면의 경계(mapBoundsPolygon)가 교차하는 영역을 계산합니다.
                            const intersection = turf.intersect(featuresToIntersect);

                            if (intersection) { // 교차 영역이 유효하게 반환된 경우
                                // 3. 교차 영역의 중심점을 계산합니다.
                                const visibleCentroid = turf.centroid(intersection);
                                markerPosition = new kakao.maps.LatLng(
                                visibleCentroid.geometry.coordinates[1], // 위도
                                visibleCentroid.geometry.coordinates[0] // 경도
                                );
                            } else {
                                // 교차 영역은 없지만, 해당 feature의 원래 중심점을 사용
                                const featureCentroid = turf.centroid(correspondingGeoJsonFeature.geometry);
                                markerPosition = new kakao.maps.LatLng(
                                featureCentroid.geometry.coordinates[1],
                                featureCentroid.geometry.coordinates[0]
                                );
                                //console.warn(`[sidoData.code: ${sidoData.code}] No actual intersection between feature and map bounds, using feature's centroid.`);
                            }
                        } catch (turfError) {
                            // turf.intersect 내부에서 발생한 다른 예외 처리
                            //console.error(`[turf.intersect Error] for sido code ${sidoData.code}:`, turfError);
                            // 에러 발생 시 fallback: feature의 중심점 사용
                            if (isFeatureGeometryValid) {
                                const featureCentroid = turf.centroid(correspondingGeoJsonFeature.geometry);
                                markerPosition = new kakao.maps.LatLng(
                                featureCentroid.geometry.coordinates[1],
                                featureCentroid.geometry.coordinates[0]
                                );
                            } else {
                                markerPosition = new kakao.maps.LatLng(sidoData.center_latitude, sidoData.center_longitude);
                            }
                        }
                    } else {
                        // 유효성 검사를 통과하지 못한 경우 (Feature Geometry가 없거나 Map Bounds Polygon이 유효하지 않음)
                        if (isFeatureGeometryValid) {
                            const featureCentroid = turf.centroid(correspondingGeoJsonFeature.geometry);
                            markerPosition = new kakao.maps.LatLng(
                            featureCentroid.geometry.coordinates[1],
                            featureCentroid.geometry.coordinates[0]
                            );
                            //console.warn(`[sidoData.code: ${sidoData.code}] Invalid mapBoundsPolygon or geometry for intersection, using feature's centroid.`);
                        } else {
                            // GeoJSON feature 자체도 문제가 있는 경우
                            markerPosition = new kakao.maps.LatLng(sidoData.center_latitude, sidoData.center_longitude);
                            console.warn(`[sidoData.code: ${sidoData.code}] No valid GeoJSON feature geometry found for intersection, using DB centroid.`);
                        }
                    }
                    // --- 유효성 검사 및 마커 위치 결정 로직 끝 ---
                }
                // 1. markerPosition의 유효성 검사 (추가)
                if (!(markerPosition instanceof kakao.maps.LatLng) || isNaN(markerPosition.getLat()) || isNaN(markerPosition.getLng())) {
                    //console.error(`[DEBUG ERROR] Invalid markerPosition for code ${sidoData.code}:`, markerPosition);
                    return; // 이 시도에 대한 오버레이는 생성하지 않고 건너뜁니다.
                }

                // 초기 단위 상태 및 텍스트 결정 (Gist 수정)
                const initialIsPyeongDisplay = sidoData._unitDisplayStates['apt']; 
                const initialUnitText = initialIsPyeongDisplay ? '평' : '㎡';

                // CustomOverlay HTML 내용 구성 (Gist 수정)
                const customOverlayContent = `
                    <div class="custom-overlay-content">
                        <div class="name-line">
                            <span class="name-text">${sidoData.code_name}</span> 
                            <span class="unit-toggle-btn">(${initialUnitText})</span> 
                            <span class="toggle-icon">▼</span>
                        </div>
                        <div class="main-price">
                            ${createPriceItem('apt', sidoData, initialIsPyeongDisplay)}
                        </div>
                        <div class="detail-prices" style="display:none;">
                            ${createPriceItem('multi', sidoData, initialIsPyeongDisplay)}
                            ${createPriceItem('officetel', sidoData, initialIsPyeongDisplay)}
                            ${createPriceItem('land', sidoData, initialIsPyeongDisplay)}
                            ${createPriceItem('single', sidoData, initialIsPyeongDisplay)}
                            ${createPriceItem('commercial', sidoData, initialIsPyeongDisplay)}
                            ${createPriceItem('factory', sidoData, initialIsPyeongDisplay)}
                        </div>
                    </div>
                `;
                
                // 2. customOverlayContent와 map 객체 값 확인 (추가)
                const customOverlay = new kakao.maps.CustomOverlay({
                    map: map,
                    position: markerPosition,
                    content: customOverlayContent,
                    yAnchor: 1,
                    zIndex: 1
                });
                realPriceOverlays.push(customOverlay);

                // 이벤트 리스너 추가 (Gist 수정)
                const customOverlayElement = customOverlay.a; // DOM 요소를 가져오는 방법
                if (!customOverlayElement) {
                    //console.error(`[DEBUG ERROR] Failed to get DOM element for CustomOverlay of code ${sidoData.code}. Overlay might not be properly rendered.`);
                    // 이 경우에도 계속 진행은 가능하지만, 이벤트 리스너는 붙지 않을 것입니다.
                } else {
                
                }
                const nameLineDiv = customOverlayElement.querySelector('.name-line');
                const detailPricesDiv = customOverlayElement.querySelector('.detail-prices');
                const toggleIconSpan = customOverlayElement.querySelector('.toggle-icon');
                const unitToggleButton = customOverlayElement.querySelector('.unit-toggle-btn'); // 새로 추가된 단위 토글 버튼

                if (nameLineDiv) {
                    // 전체 name-line 클릭 이벤트 (단위 토글 또는 펼치기/접기)
                    nameLineDiv.addEventListener('click', (event) => {
                        // event.target이 단위 토글 버튼인지 확인하여 분기 처리
                        if (unitToggleButton && unitToggleButton.contains(event.target)) { // 클릭된 요소가 단위 토글 버튼이거나 그 자식일 경우
                            event.stopPropagation(); // 오버레이 클릭 이벤트를 막아 지도가 이동하는 것을 방지
                            
                            const currentPyeongDisplay = sidoData._unitDisplayStates['apt'];
                            const newPyeongDisplay = !currentPyeongDisplay;

                            // 해당 오버레이의 모든 estateType 단위 표시 상태를 업데이트
                            for (const type in sidoData._unitDisplayStates) {
                                if (sidoData._unitDisplayStates.hasOwnProperty(type)) {
                                    sidoData._unitDisplayStates[type] = newPyeongDisplay;
                                }
                            }

                            unitToggleButton.textContent = newPyeongDisplay ? '(평)' : '(㎡)';

                            // 가격 항목들만 다시 렌더링
                            const mainPriceDiv = customOverlayElement.querySelector('.main-price');
                            const newDetailPricesDiv = customOverlayElement.querySelector('.detail-prices');

                            mainPriceDiv.innerHTML = createPriceItem('apt', sidoData, newPyeongDisplay);
                            newDetailPricesDiv.innerHTML = `
                                ${createPriceItem('multi', sidoData, newPyeongDisplay)}
                                ${createPriceItem('officetel', sidoData, newPyeongDisplay)}
                                ${createPriceItem('land', sidoData, newPyeongDisplay)}
                                ${createPriceItem('single', sidoData, newPyeongDisplay)}
                                ${createPriceItem('commercial', sidoData, newPyeongDisplay)}
                                ${createPriceItem('factory', sidoData, newPyeongDisplay)}
                            `;

                        } else { // 펼치기/접기 아이콘 또는 나머지 영역 클릭 시 (기존 로직)
                            event.stopPropagation(); // 지도 클릭 이벤트 방지
                            if (detailPricesDiv.style.display === 'none') {
                                detailPricesDiv.style.display = 'block';
                                toggleIconSpan.textContent = '▲';
                            } else {
                                detailPricesDiv.style.display = 'none';
                                toggleIconSpan.textContent = '▼';
                            }
                        }
                    });
                    nameLineDiv.addEventListener('mouseover', function() {
                        nameLineDiv.style.background = '#eee';
                    });
                    nameLineDiv.addEventListener('mouseout', function() {
                        nameLineDiv.style.background = '#fff';
                    });
                } else {
                    //console.warn(`[DEBUG WARNING] Could not find .name-line div for code ${sidoData.code}. Event listeners not attached.`);
                }
            }); // groupedData.forEach((sidoData) => { ... }) 끝

            hideLoadingSpinner(); // 로딩 스피너 숨김

        } catch (error) {
            let userFriendlyMessage = "데이터를 불러오는 중 알 수 없는 오류가 발생했습니다.";
            if (error.message) {
                userFriendlyMessage = "(2)데이터를 불러오는 중 오류가 발생했습니다: " + error.message;
            } else if (error instanceof TypeError) {
                // 예를 들어 response.json()이 실패했거나, 네트워크 문제일 때 TypeError가 발생하기도 합니다.
                userFriendlyMessage = "네트워크 문제 또는 서버 응답 처리 오류가 발생했습니다.";
            } else if (error instanceof SyntaxError) {
                userFriendlyMessage = "서버로부터 유효하지 않은 데이터가 수신되었습니다. (JSON 파싱 오류)";
            }
            alert(userFriendlyMessage); // 사용자에게 더 친화적인 메시지 표시
        } finally {
            hideLoadingSpinner(); 
        }
    }
    // 알 수 없는 sggCdsToFetch 길이
    else {
        hideLoadingSpinner(); // 로딩 스피너 숨김
    }


} // realPriceAptArrayWithCache 함수 끝

function makeEstateTypeName(estateTypes, jimok, usage_type="") {
    let jimokString = "";
    let rtnstring = "";
    switch(estateTypes) {
        case "apt":
            rtnstring = "아파트"; 
            break;
        case "land":
            if (jimok != null && typeof jimok === 'string') { jimokString = jimok.replace(/용지/g, ""); } else { jimokString =""; }
            rtnstring = jimokString ? `토지: ${jimokString}` : "토지"; 
            break;
        case "multi":
            if(jimok != null && typeof jimok === 'string') { 
                if(jimok.toString().includes("연립")) {
                    rtnstring = "연립"; 
                } else if(jimok.toString().includes("다세대")) {
                    rtnstring = "다세대";
                } else {
                    rtnstring = "연립/다세대";
                }
            } else { 
                rtnstring = "연립/다세대";
            }
            break;
        case "officetel":
            rtnstring = "오피스텔"; 
            break;
        case "single":
            if(jimok != null && typeof jimok === 'string') { 
                if(jimok.toString().includes("단독")) {
                    rtnstring = "단독"; 
                } else if(jimok.toString().includes("다가구")) {
                    rtnstring = "다가구";
                } else {
                    rtnstring = "단독/다가구";
                }
            } else {
                rtnstring = "단독/다가구";
            }
            break;
        case "commercial":
            if((jimok != null && typeof jimok === 'string') && (usage_type != null && typeof usage_type === 'string')) { 
                if(jimok.toString().includes("집합")) {
                    rtnstring = "상가/사무실"; 
                } else if(jimok.toString().includes("일반")) {
                    if(usage_type.toString().includes("근린")) {
                        rtnstring = "빌딩(근린)";
                    } else if(usage_type.toString().includes("업무")) {
                        rtnstring = "빌딩(업무)";
                    } else if(usage_type.toString().includes("판매")) {
                        rtnstring = "빌딩(판매)";
                    } else if(usage_type.toString().includes("숙박")) {
                        rtnstring = "빌딩(숙박)";
                    } else if(usage_type.toString().includes("연구")) {
                        rtnstring = "빌딩(연구)";
                    } else {
                        rtnstring = "빌딩(기타)";
                    }
                } else {
                    rtnstring = "건물/상가"; 
                }
            }
            else {
                rtnstring = "건물/상가";
            }
            
            break; //(상업용)
        case "factory":
            if((usage_type != null && typeof usage_type === 'string')) { 
                if(usage_type.toString().includes("공장")) {
                    rtnstring = "공장";
                } else if(usage_type.toString().includes("창고")) {
                    rtnstring = "창고";
                }
                else if(usage_type.toString().includes("자동차")) {
                    rtnstring = "창고(자동차)";
                }
                else if(usage_type.toString().includes("위험물")) {
                    rtnstring = "창고(위험물)";
                }
                 else {
                    rtnstring = "공장/창고";
                }
            }
            else {
                rtnstring = "공장/창고";
            }
            break;
        default:    
            rtnstring = "-"; 
            break;
    }
    return rtnstring;
}

/**
 * 10x10 multi point를 기준으로 realPriceApt 데이터를 백엔드에서 가져오는 함수.
 * 지도 화면 내 여러 시군구 코드(sggCdArray)를 기준으로
 * 부동산 실거래가 정보를 가져와 지도에 시각화하는 비동기 함수.
 * @param {string[]} sggCdArray - 조회할 시군구 코드들의 배열 (예: ['11680', '11650'])
 * 사용하지 않음
 */

/*
async function realPriceAptArray(sggCdArray) { 
    return new Promise((resolve, reject) => { // Promise를 반환하도록 함수 수정
        // 1. 현재 지도 화면의 바운딩 박스(Bounding Box) 추출
        var bounds = map.getBounds();
        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        var bbox = `${sw.getLat()},${sw.getLng()},${ne.getLat()},${ne.getLng()},EPSG:4326`;

        // 2. 클라이언트 필터 파라미터 수집
        var filterObj = collectMultiFilterParams();

        // 3. 백엔드 API 호출 데이터 객체 구성 (sggCds 배열을 포함하도록 변경)
        //    >>> 백엔드에서 sggCds 배열을 처리할 수 있도록 구현되어야 합니다.
        const dataObj = { 
            ...filterObj, 
            bbox: encodeURIComponent(bbox), 
            sggCds: sggCdArray // <<--- 여기를 sggCds 배열로 변경!
        };

        // 4. 백엔드 API 호출 (API 엔드포인트 및 callTag 변경)
        //    >>> "/front/back/realPrice/realPrice_apt_multi_sgg.php" 는 여러 sggCds를 처리하도록 백엔드에서 새로 구현되어야 함.
        callApiAbort("/front/back/realPrice/realPrice_apt_multi_sgg.php", "POST", dataObj, "realPriceAptArray")
            .then((response) => {
                // 5. API 응답 처리 시작
                if (!response) {
                    resolve(); // 응답이 없어도 작업은 끝난 것으로 간주 (혹은 reject 처리)
                    return;
                }

                const { responseData, message, statusCode } = response;
                if (statusCode !== 200) {
                    //console.error("API Error:", message);
                    reject(new Error(message)); // API 오류 시 Promise reject
                    return;
                }

                const zoomLevel = map.getLevel();

                // 기존 오버레이 제거 (전체 시군구 데이터를 처리하므로 기존 오버레이는 모두 제거)
                realPriceOverlays.forEach((overlay) => overlay.setMap(null));
                realPriceOverlays = []; // 배열 초기화

                // 모든 클러스터러 초기화
                Object.values(clusterersByType).forEach((clusterer) => clusterer.clear());
                
                // 6. 데이터 반복 및 지도 객체 생성
                Object.values(responseData).forEach((data) => {
                    let markerString = ""; // 각 data에 대한 markerString을 다시 초기화

                    if (zoomLevel > 4) { // 줌 레벨이 5 이상일 경우 (상세 뷰)
                        // 기존 클러스터러 생성 및 마커 추가 로직 (동일)
                        let clusterer = createClustererAll("all"); // 클러스터러 생성
                        const marker = createClusteredMarker(data); // 마커 생성
                        clusterer.addMarker(marker); // 클러스터러에 마커 추가
                    } else if (zoomLevel == 4) { // 줌 레벨이 4일 경우 (중간 상세도 뷰)
                        const smallMarker = document.createElement("div");
                        // 부동산 유형에 따른 스타일 클래스 설정 (동일)
                        switch(data.estate_type) {
                            case "apt": markerString = "small-marker bg-orange2 border-orange2"; break;
                            case "land": markerString = "small-marker bg-yellow1 border-yellow1"; break;
                            case "multi": markerString = "small-marker bg-red2 border-red2"; break;
                            case "officetel": markerString = "small-marker bg-indigo2 border-indigo2"; break;
                            case "single": markerString = "small-marker bg-violet1 border-violet1"; break;
                            case "commercial": markerString = "small-marker bg-blue1 border-blue1"; break;
                            case "factory": markerString = "small-marker bg-green1 border-green1"; break;
                            default: markerString = "small-marker bg-gray border-gray"; break;
                        }
                        
                        smallMarker.className = markerString;
                        smallMarker.style.cssText = `
                            width: 7px;
                            height: 7px;
                            border-radius: 50%;
                            cursor: pointer;
                        `;

                        // 커스텀 오버레이로 원형 점을 지도에 추가 (동일)
                        let smallMarkerPosition = new kakao.maps.LatLng(data.center_latitude, data.center_longitude);
                        const smallMarkerOverlay = new kakao.maps.CustomOverlay({
                            content: smallMarker,
                            position: smallMarkerPosition,
                            map: map,
                            xAnchor: 0.5,
                            yAnchor: 0.5,
                            zIndex: 1,
                        });

                        // 작은 원형 점에 클릭 이벤트 추가 (동일)
                        smallMarker.addEventListener("click", function () {
                            if (window.mapContentClosingLock) return; // 패널 닫기 직후 무시
                            if ($(".mo-tool-option button").hasClass("active")) return;
                            if ($("#draw_toolbox a").hasClass("active")) return;

                            const type = data.estate_type;
                            const pnu = data.pnu;
                            const lat = data.center_latitude;
                            const lng = data.center_longitude;
                            const coords = { lat: lat, lng: lng };
                            const kakaoCoords = new kakao.maps.LatLng(lat, lng);
                            searchDetailAddrFromCoords(kakaoCoords, function (result, status) {
                                if (status === kakao.maps.services.Status.OK) {
                                    handleMapClick(coords);
                                    searchArroundPlaces(coords);
                                    realPriceDetail(type, pnu);
                                }
                                displayAddressInfo(result, status);
                            });
                        });
                        realPriceOverlays.push(smallMarkerOverlay); // 오버레이 배열에 작은 원형 점 추가

                    } else { // 줌 레벨이 3 이하일 경우 (가장 낮은 상세도 뷰) // 인포윈도우 스타일 마커 생성 로직
                        const iwContent = document.createElement("div"); 
                        iwContent.className = "real-price-marker cursor-pointer";
                        let liString = "";
                        let imgString = "";
                        let estateString = "";
                        let borderString = "";
                        let infoString = "";
                        let jimokString = "";
                        let badgeColor = "#999";
                        let lightColor = "#BBBBBB";

                        // 부동산 유형에 따른 스타일 및 텍스트 설정 (동일)
                        switch(data.estate_type) {
                            case "apt":
                                markerString = "border-orange2"; borderString = "border-bottom-orange2"; liString = "bg-orange2";
                                imgString = "icn_arr_mark.svg"; badgeColor = "#FE6900"; lightColor = "#FFA55A";
                                estateString = makeEstateTypeName(data.estate_type,data.jimok, ""); break;
                            case "land":
                                markerString = "border-yellow1"; borderString = "border-bottom-yellow1"; liString = "bg-yellow1";
                                imgString = "icn_arr_mark_yellow1.svg"; badgeColor = "#FEB912"; lightColor = "#FDD055";
                                if (data.jimok != null && typeof data.jimok === 'string') { jimokString = data.jimok.replace(/용지/g, ""); } else { jimokString =""; }
                                estateString = makeEstateTypeName(data.estate_type,data.jimok, ""); break;
                            case "multi":
                                markerString = "border-red2"; borderString = "border-bottom-red2"; liString = "bg-red2";
                                imgString = "icn_arr_mark_red2.svg"; badgeColor = "#FE7D87"; lightColor = "#FFB0B7";
                                estateString = makeEstateTypeName(data.estate_type,data.jimok, ""); break;
                                break;
                            case "officetel":
                                markerString = "border-indigo2"; borderString = "border-bottom-indigo2"; liString = "bg-indigo2";
                                imgString = "icn_arr_mark_indigo2.svg"; badgeColor = "#F4AFCA"; lightColor = "#F8D0E3";
                                estateString = makeEstateTypeName(data.estate_type,data.jimok, ""); break;
                            case "single":
                                markerString = "border-violet1"; borderString = "border-bottom-violet1"; liString = "bg-violet1";
                                imgString = "icn_arr_mark_violet1.svg"; badgeColor = "#702BFE"; lightColor = "#9B6DFE";
                                estateString = makeEstateTypeName(data.estate_type,data.jimok, ""); break;
                            case "commercial":
                                markerString = "border-blue1"; borderString = "border-bottom-blue1"; liString = "bg-blue1";
                                imgString = "icn_arr_mark_blue1.svg"; badgeColor = "#2973D6"; lightColor = "#6BA4E8";
                                estateString = makeEstateTypeName(data.estate_type,data.jimok, data.usage_type); break; //(상업용)
                            case "factory":
                                markerString = "border-green1"; borderString = "border-bottom-green1"; liString = "bg-green1";
                                imgString = "icn_arr_mark_green1.svg"; badgeColor = "#039C55"; lightColor = "#40BD80";
                                estateString = makeEstateTypeName(data.estate_type, data.jimok, data.usage_type); break;
                            default:
                                markerString = "border-gray"; borderString = "border-bottom-gray"; liString = "bg-gray";
                                imgString = "icn_arr_mark_gray_black.svg"; badgeColor = "#999"; lightColor = "#BBBBBB"; estateString = "-"; break;
                        }
                        
                        // 필터에 따른 정보 문자열 구성 (동일)
                        switch(filterObj.estateinfo) {
                            case "거래면적":
                                infoString = `<span class="font12 number toggle-unit" data-raw-sqm="${data.excluUseAr}">${(data.excluUseAr / 3.3058).toFixed(2)}평</span>`;
                                break;
                            case "거래년도":
                                infoString = `<span class="font12">${data.dealYear}년</span>`;
                                break;
                            case "거래단가":
                                const originalAmount = parseFloat(data.dealAmount.replace(/,/g, ""));
                                const originalArea = data.excluUseAr / 3.3058;
                                const unitPrice = originalAmount / originalArea;
                                infoString = `<span class="font12 number toggle-unit" data-raw-sqm="${data.excluUseAr}" data-raw-amount="${originalAmount}">${formatPrice(unitPrice, "all", false, true)}/평</span>`;
                                break;
                            default:
                                infoString = `<span class="font12 ">-</span>`;
                                break;
                        }

                        if (singlecolor_mode) {
                            lightColor = real_singlecolor;
                            badgeColor = real_singlecolor;
                        }

                        // HTML 콘텐츠 구성 (동일)
                        iwContent.innerHTML = `
                        <ul class="text-center bg-white overflow-hidden" style="min-width:60px; border-radius:10px; border: 1px solid ${lightColor};" data-lat="${data.center_latitude}" data-lng="${data.center_longitude}" data-type="${data.estate_type
                        }" ondragstart="return false;" onselectstart="return false;">
                            <li class="up bg-white p-1" style="line-height:11px; display:flex; align-items:center; justify-content:center; gap:3px; border-bottom: 1px solid ${lightColor};">
                                <span style="display:inline-flex; align-items:center; justify-content:center; width:14px; height:14px; border-radius:50%; background:${badgeColor}; font-size:8px; font-weight:800; color:#fff; flex-shrink:0; line-height:1;">실</span>
                                <span class="font10">${estateString}</span>
                            </li>
                            <li class="up bg-white p-1">
                                <p class="font12" style="line-height: 12px;">${formatPrice(data.dealAmount.replace(/,/g, ""), "all", false, true)}</p>
                            </li>
                            <li class="text-white" style="background: ${lightColor};">
                                ${infoString}
                            </li>
                        </ul>
                        <div style="text-align:center; line-height:0; margin:0; padding:0;"><span style="display:inline-block; width:0; height:0; border-left:9px solid transparent; border-right:9px solid transparent; border-top:10px solid ${lightColor};"></span></div>
                        `;

                        // CustomOverlay 생성 및 지도에 추가 (동일)
                        let iwPosition = new kakao.maps.LatLng(data.center_latitude, data.center_longitude); 
                        var realPriceOverlay = new kakao.maps.CustomOverlay({
                            clickable: true,
                            content: iwContent,
                            map: map,
                            position: iwPosition,
                            xAnchor: 0.45,
                            yAnchor: 1.2,
                            zIndex: 1,
                        });
                        
                        // HTML 내부의 toggle-unit 요소에 직접 클릭 이벤트 추가 (동일)
                        iwContent.addEventListener("click", function (e) {
                            if ($(".mo-tool-option button").hasClass("active")) return;
                            if ($("#draw_toolbox a").hasClass("active")) return;
                            e.preventDefault();

                            // Z-index 조절 로직 (동일)
                            if (realPriceOverlay) { 
                                const currentZIndex = parseInt(realPriceOverlay.getZIndex() || 0, 10); 
                                if (currentZIndex >= globalEstateZIndex) { 
                                    globalEstateZIndex = currentZIndex + 1; 
                                } else {
                                    globalEstateZIndex++; 
                                }
                                realPriceOverlay.setZIndex(globalEstateZIndex); 
                            }
                            
                            // 단위 토글 로직 (동일)
                            if(filterObj.estateinfo === "거래면적" || filterObj.estateinfo === "거래단가"){
                                const unitElement = iwContent.querySelector(".toggle-unit");
                                const isPyeong = unitElement.textContent.includes("평");
                                if(filterObj.estateinfo === "거래면적") {
                                    unitElement.textContent = isPyeong ? `${parseFloat(data.excluUseAr).toFixed(2)}㎡` : `${(data.excluUseAr / 3.3058).toFixed(2)}평`;
                                } else if(filterObj.estateinfo === "거래단가") {
                                    const originalAmount = parseFloat(data.dealAmount.replace(/,/g, ""));
                                    const originalM2Area = data.excluUseAr;
                                    const originalPyArea = data.excluUseAr / 3.3058;
                                    const unitPyPrice = originalAmount / originalPyArea;
                                    const unitM2rice = originalAmount / originalM2Area;
                                    unitElement.textContent = isPyeong ? `${formatPrice(unitM2rice, "all", false, true)}/㎡` : `${formatPrice(unitPyPrice, "all", false, true)}/평`;
                                }
                            }

                            // 클릭 시 상세 정보 조회 로직 (동일)
                            const type = data.estate_type;
                            const pnu = data.pnu;
                            const lat = data.center_latitude;
                            const lng = data.center_longitude;
                            const coords = { lat: lat, lng: lng };
                            const kakaoCoords = new kakao.maps.LatLng(lat, lng);
                            searchDetailAddrFromCoords(kakaoCoords, function (result, status) {
                                if (status === kakao.maps.services.Status.OK) {
                                    handleMapClick(coords);
                                    searchArroundPlaces(coords);
                                    realPriceDetail(type, pnu);
                                }
                                displayAddressInfo(result, status);
                            });
                        });
                        realPriceOverlays.push(realPriceOverlay); // 오버레이 배열에 추가
                    }
                });
                // --- 지도 객체 생성 로직 끝 ---
                // 모든 지도 오버레이 지시가 완료되면 Promise를 resolve합니다.
                resolve(); 
            })
            .catch((error) => {
                //console.error("API Call Error:", error); // 콘솔 오류 메시지 개선
                // 추가적인 에러 처리 로직 (사용자에게 알림 등)
                reject(error); // API 호출 자체에서 오류 발생 시 Promise reject
            });
    });
}
*/

/**
 * //원래 함수 original function name: realPriceApt(sggCd)
 * 지도 화면 내 여러 시군구 코드를 기준으로 realPriceApt 데이터를 백엔드에서 가져오는 함수.
 * 부동산 실거래가 정보를 가져와 지도에 시각화하는 비동기 함수.
 * @param {string[]} sggCdArray - 조회할 시군구 코드들의 배열 (예: ['11680', '11650'])
 * 사용하지 않음
 */
/*
async function realPriceApt(sggCd) {
    var bounds = map.getBounds();   //현재 지도 화면의 가시적인 사각 영역(Bounding Box) 객체를 반환합니다. 이 객체는 지도의 가장 남서쪽 지점과 가장 북동쪽 지점의 좌표 정보를 포함하고 있어요.
    var sw = bounds.getSouthWest(); // 남서쪽 좌표 남서쪽(South-West) 끝 지점의 좌표 객체를 가져옵니다. 남서쪽은 위도(latitude)가 가장 낮고, 경도(longitude)가 가장 낮은 지점
    var ne = bounds.getNorthEast(); // 북동쪽 좌표  북동쪽(North-East) 끝 지점의 좌표 객체를 가져옵니다. 북동쪽은 위도(latitude)가 가장 높고, 경도(longitude)가 가장 높은 지점
    var boxString = `BOX(${sw.getLng()},${sw.getLat()},${ne.getLng()},${ne.getLat()})`; //BOX sw (남서쪽)와 ne (북동쪽) 좌표를 이용해서 SQL/GIS(Geographic Information System) 등에서 사용되는 BOX 형식의 문자열을 만듭
    var bbox = `${sw.getLat()},${sw.getLng()},${ne.getLat()},${ne.getLng()},EPSG:4326`; // BBOX (Bounding Box) 형식의 문자열을 만듭

    var filterObj = collectMultiFilterParams(); // 필터

    const dataObj = { 
        ...filterObj, 
        bbox: encodeURIComponent(bbox), 
        sggCd 
    };
    callApiAbort("/front/back/realPrice/realPrice_apt.php", "POST", dataObj, "realPriceApt")
        .then((response) => {
            if (!response) return;

            const { responseData, message, statusCode } = response;
            if (statusCode !== 200) return;

            const zoomLevel = map.getLevel();

//debug용            // 1. estate_type별 개수 집계 함수 호출
//            countEstateTypes(response); // 'response' 객체 전체를 전달

            // 기존 오버레이 제거
            realPriceOverlays.forEach((overlay) => overlay.setMap(null));
            realPriceOverlays = []; // 배열 초기화

            // 모든 클러스터러 초기화
            Object.values(clusterersByType).forEach((clusterer) => clusterer.clear());
            let markerString = ""; // 초기화
            
            // 클러스터러 생성 또는 인포윈도우 생성
            Object.values(responseData).forEach((data) => {
                if (zoomLevel > 4) {    //zoomLevel 5->4
                    // 기존 클러스터러 생성 및 마커 추가 로직
                    let clusterer = createClustererAll("all"); // 클러스터러 생성
                    const marker = createClusteredMarker(data); // 마커 생성
                    clusterer.addMarker(marker); // 클러스터러에 마커 추가
                } else if (zoomLevel == 4) {    ////zoomLevel 5->4
                    // 줌 레벨이 5 이하일 경우, 작은 원형 점으로 표시
                    const smallMarker = document.createElement("div");
                    //smallMarker.className = data.estate_type !== "land" ? "small-marker bg-main border-danger" : "small-marker bg-yellow1 border-yellow1";
                    
                    switch(data.estate_type) {
                        case "apt": markerString = "small-marker bg-orange2 border-orange2"; break;  //ok
                        case "land": markerString = "small-marker bg-yellow1 border-yellow1"; break;  //ok
                        case "multi": markerString = "small-marker bg-red2 border-red2"; break;
                        case "officetel": markerString = "small-marker bg-indigo2 border-indigo2"; break;
                        case "single": markerString = "small-marker bg-violet1 border-violet1"; break;
                        case "commercial": markerString = "small-marker bg-blue1 border-blue1"; break;
                        case "factory": markerString = "small-marker bg-green1 border-green1"; break;
                        default: markerString = "small-marker bg-gray border-gray"; break;
                    }
                    
                    smallMarker.className = markerString;
                    smallMarker.style.cssText = `
                        width: 7px;
                        height: 7px;
                        border-radius: 50%;
                        cursor: pointer;
                    `;
                    // border: 1px solid ${data.estate_type !== "토지" ? "#ff0000" : "#ffff00"};

                    // 커스텀 오버레이로 원형 점을 지도에 추가
                    let smallMarkerPosition = new kakao.maps.LatLng(data.center_latitude, data.center_longitude);
                    const smallMarkerOverlay = new kakao.maps.CustomOverlay({
                        content: smallMarker,
                        position: smallMarkerPosition,
                        map: map,
                        xAnchor: 0.5,
                        yAnchor: 0.5,
                        zIndex: 1,
                    });

                    // 작은 원형 점에 클릭 이벤트 추가
                    smallMarker.addEventListener("click", function () {
                        if (window.mapContentClosingLock) return; // 패널 닫기 직후 무시
                        // 그리기 모드일 때 중지
                        if ($(".mo-tool-option button").hasClass("active")) return;
                        if ($("#draw_toolbox a").hasClass("active")) return;

                        const type = data.estate_type;
                        const pnu = data.pnu;

                        // 좌표
                        const lat = data.center_latitude;
                        const lng = data.center_longitude;
                        const coords = { lat: lat, lng: lng };
                        const kakaoCoords = new kakao.maps.LatLng(lat, lng);
                        // 주소 요청
                        searchDetailAddrFromCoords(kakaoCoords, function (result, status) {
                            if (status === kakao.maps.services.Status.OK) {
                                handleMapClick(coords); // 건물 및 토지 정보를 동시에 가져오기
                                searchArroundPlaces(coords); // 주변 시설 정보 가져오기
                                realPriceDetail(type, pnu); // 실거래가 정보 가져오기
                            }
                            displayAddressInfo(result, status); // 지도 주소 정보 바인딩
                        });
                    });

                    // 오버레이 배열에 작은 원형 점 추가
                    realPriceOverlays.push(smallMarkerOverlay);
                } else {
                    // const marker = createClusteredMarker(data);
                    // marker.setMap(map); // 지도에 올린다.

                    const iwContent = document.createElement("div"); // HTML 콘텐츠를 담을 div 요소 생성
                    iwContent.className = "real-price-marker cursor-pointer";
                    let liString = ""; // 초기화
                    let imgString = ""; // 초기화
                    let estateString = ""; // 초기화
                    let borderString = ""; // 초기화
                    let infoString = ""; // 초기화
                    let jimokString = ""; // 초기화
                    let badgeColor = "#999"; // 초기화
                    let lightColor = "#BBBBBB"; // 초기화

                    switch(data.estate_type) {
                        case "apt":
                            markerString = "border-orange2"; borderString = "border-bottom-orange2"; liString = "bg-orange2";
                            imgString = "icn_arr_mark.svg"; badgeColor = "#FE6900"; lightColor = "#FFA55A";
                            estateString = makeEstateTypeName(data.estate_type,data.jimok, "");
                            break;
                        case "land":
                            markerString = "border-yellow1"; borderString = "border-bottom-yellow1"; liString = "bg-yellow1";
                            imgString = "icn_arr_mark_yellow1.svg"; badgeColor = "#FEB912"; lightColor = "#FDD055";
                            if (data.jimok != null && typeof data.jimok === 'string') { jimokString = data.jimok.replace(/용지/g, ""); } else { jimokString =""; }
                            estateString = makeEstateTypeName(data.estate_type,data.jimok, "");
                            break;
                        case "multi":
                            markerString = "border-red2"; borderString = "border-bottom-red2"; liString = "bg-red2";
                            imgString = "icn_arr_mark_red2.svg"; badgeColor = "#FE7D87"; lightColor = "#FFB0B7";
                            estateString = makeEstateTypeName(data.estate_type,data.jimok, "");
                            break;
                        case "officetel":
                            markerString = "border-indigo2"; borderString = "border-bottom-indigo2"; liString = "bg-indigo2";
                            imgString = "icn_arr_mark_indigo2.svg"; badgeColor = "#F4AFCA"; lightColor = "#F8D0E3";
                            estateString = makeEstateTypeName(data.estate_type,data.jimok, "");
                            break;
                        case "single":
                            markerString = "border-violet1"; borderString = "border-bottom-violet1"; liString = "bg-violet1";
                            imgString = "icn_arr_mark_violet1.svg"; badgeColor = "#702BFE"; lightColor = "#9B6DFE";
                            estateString = makeEstateTypeName(data.estate_type,data.jimok, "");
                            break;
                        case "commercial":
                            markerString = "border-blue1"; borderString = "border-bottom-blue1"; liString = "bg-blue1";
                            imgString = "icn_arr_mark_blue1.svg"; badgeColor = "#2973D6"; lightColor = "#6BA4E8";
                            estateString = makeEstateTypeName(data.estate_type,data.jimok, data.usage_type);
                            break; //(상업용)
                        case "factory":
                            markerString = "border-green1"; borderString = "border-bottom-green1"; liString = "bg-green1";
                            imgString = "icn_arr_mark_green1.svg"; badgeColor = "#039C55"; lightColor = "#40BD80";
                            estateString = makeEstateTypeName(data.estate_type, data.jimok, data.usage_type);
                            break;
                        default:
                            markerString = "border-gray"; borderString = "border-bottom-gray"; liString = "bg-gray";
                            imgString = "icn_arr_mark_gray_black.svg"; badgeColor = "#999"; lightColor = "#BBBBBB"; estateString = "-";
                            break;
                    }
                    switch(filterObj.estateinfo) {
                        case "거래면적":
                        // 여기를 백틱(``)으로 변경합니다.
                        infoString = `<span class="font12 number toggle-unit" data-raw-sqm="${data.excluUseAr}">${(data.excluUseAr / 3.3058).toFixed(2)}평</span>`;
                        break;
                    case "거래년도":
                        // 이 부분도 백틱(``)으로 변경하고, 이전 답변에서 말씀드린 오타도 수정합니다.
                        infoString = `<span class="font12">${data.dealYear}년</span>`;
                        break;
                    case "거래단가":
                        const originalAmount = parseFloat(data.dealAmount.replace(/,/g, ""));
                        const originalArea = data.excluUseAr / 3.3058;
                        const unitPrice = originalAmount / originalArea;
                        // 이 부분도 백틱(``)으로 변경합니다.
                        infoString = `<span class="font12 number toggle-unit" data-raw-sqm="${data.excluUseAr}" data-raw-amount="${originalAmount}">${formatPrice(unitPrice, "all", false, true)}/평</span>`;
                        break;
                    default:
                        infoString = `<span class="font12 ">-</span>`;
                        break;
                    }

                    if (singlecolor_mode) {
                        lightColor = real_singlecolor;
                        badgeColor = real_singlecolor;
                    }

                    //<ul class="text-center bg-white border ${data.estate_type !== "land" ? "border-danger" : "border-yellow1"} overflow-hidden" style="min-width:60px; border-radius:10px;" data-lat="${data.center_latitude}" data-lng="${data.center_longitude}" data-type="${data.estate_type
                    //<li class="${data.estate_type !== "land" ? "bg-main" : "bg-yellow1"} text-white">
                    //<p class="position-absolute" style="margin:-5px 0 0 20px; "><img src="/front/assets/image/${data.estate_type !== "land" ? "icn_arr_mark.svg" : "icn_arr_mark_yellow.svg"}" width="15" alt="" title=""></p>
                    iwContent.innerHTML = `
                    <ul class="text-center bg-white overflow-hidden" style="min-width:60px; border-radius:10px; border: 1px solid ${lightColor};" data-lat="${data.center_latitude}" data-lng="${data.center_longitude}" data-type="${data.estate_type
                    }" ondragstart="return false;" onselectstart="return false;">
                        <li class="up bg-white p-1" style="line-height:11px; display:flex; align-items:center; justify-content:center; gap:3px; border-bottom: 1px solid ${lightColor};">
                            <span style="display:inline-flex; align-items:center; justify-content:center; width:14px; height:14px; border-radius:50%; background:${badgeColor}; font-size:8px; font-weight:800; color:#fff; flex-shrink:0; line-height:1;">실</span>
                            <span class="font10">${estateString}</span>
                        </li>
                        <li class="up bg-white p-1">
                            <!-- <p class="font11">${data.estate_type}</p> --!>
                            <!-- <p class="font11">${data.bonbun}</p> --!>
                            <p class="font12" style="line-height: 12px;">${formatPrice(data.dealAmount.replace(/,/g, ""), "all", false, true)}</p>
                        </li>
                        <li class="text-white" style="background: ${lightColor};">
                            ${infoString}
                        </li>
                    </ul>
                    <div style="text-align:center; line-height:0; margin:0; padding:0;"><span style="display:inline-block; width:0; height:0; border-left:9px solid transparent; border-right:9px solid transparent; border-top:10px solid ${lightColor};"></span></div>
                    `;

                    let iwPosition = new kakao.maps.LatLng(data.center_latitude, data.center_longitude); //인포윈도우 표시 위치입니다
                    var realPriceOverlay = new kakao.maps.CustomOverlay({
                        clickable: true,
                        content: iwContent,
                        map: map,
                        position: iwPosition,
                        xAnchor: 0.45,
                        yAnchor: 1.2,
                        zIndex: 1,
                    });
                                
                    
                   // HTML 내부의 toggle-unit 요소에 직접 클릭 이벤트 추가 (이것이 realPriceOverlay 클릭 시 이벤트)
                    iwContent.addEventListener("click", function (e) {
                        // 그리기 모드일 때 중지
                        if ($(".mo-tool-option button").hasClass("active")) return;
                        if ($("#draw_toolbox a").hasClass("active")) return;

                        // 커스텀 오버레이를 드래그 할 때, 내부 텍스트가 영역 선택되는 현상을 막아줍니다.
                        e.preventDefault();

                        // --- Z-index 조절 로직 시작 ---
                        // 클릭된 realPriceOverlay (CustomOverlay 객체)의 z-index를 조정합니다.
                        if (realPriceOverlay) { // realPriceOverlay가 유효한지 확인
                            // 현재 CustomOverlay의 z-index 값을 가져옵니다.
                            const currentZIndex = parseInt(realPriceOverlay.getZIndex() || 0, 10); 
                            
                            // 매물 클러스터에서 사용하셨던 동일한 최상위 로직 적용
                            if (currentZIndex >= globalEstateZIndex) { 
                                globalEstateZIndex = currentZIndex + 1; // 현재 ZIndex보다 1 크게 설정
                            } else {
                                globalEstateZIndex++; // 전역 ZIndex를 1 증가
                            }
                            // realPriceOverlay의 z-index를 새로운 값으로 설정하여 최상위에 보이게 합니다.
                            realPriceOverlay.setZIndex(globalEstateZIndex); 
                        }
                        // --- Z-index 조절 로직 끝 ---
                        
                        // ... (기존의 단위 토글, 좌표 및 API 호출 로직, 모바일 UI 제어 로직) ...
                        if(filterObj.estateinfo === "거래면적" || filterObj.estateinfo === "거래단가"){
                            const unitElement = iwContent.querySelector(".toggle-unit");
                            const isPyeong = unitElement.textContent.includes("평");
                            if(filterObj.estateinfo === "거래면적") {
                                unitElement.textContent = isPyeong ? `${parseFloat(data.excluUseAr).toFixed(2)}㎡` : `${(data.excluUseAr / 3.3058).toFixed(2)}평`;
                            } else if(filterObj.estateinfo === "거래단가") {
                                const originalAmount = parseFloat(data.dealAmount.replace(/,/g, ""));
                                const originalM2Area = data.excluUseAr;
                                const originalPyArea = data.excluUseAr / 3.3058;
                                const unitPyPrice = originalAmount / originalPyArea;
                                const unitM2rice = originalAmount / originalM2Area;
                                unitElement.textContent = isPyeong ? `${formatPrice(unitM2rice, "all", false, true)}/㎡` : `${formatPrice(unitPyPrice, "all", false, true)}/평`;
                            }
                        }
                        const type = data.estate_type;
                        const pnu = data.pnu;

                        // 좌표
                        const lat = data.center_latitude;
                        const lng = data.center_longitude;
                        const coords = { lat: lat, lng: lng };
                        const kakaoCoords = new kakao.maps.LatLng(lat, lng);
                        // 주소 요청
                        searchDetailAddrFromCoords(kakaoCoords, function (result, status) {
                            if (status === kakao.maps.services.Status.OK) {
                                handleMapClick(coords); // 건물 및 토지 정보를 동시에 가져오기
                                searchArroundPlaces(coords); // 주변 시설 정보 가져오기
                                realPriceDetail(type, pnu); // 실거래가 정보 가져오기
                            }
                            displayAddressInfo(result, status); // 지도 주소 정보 바인딩
                        });
                        
                    });
                    // 오버레이 배열에 추가
                    realPriceOverlays.push(realPriceOverlay);
                    // 커스텀 오버레이를 지도에 표시합니다
                    // realPriceOverlay.setMap(map);
                }
            });
        })
        .catch((error) => {
            console.log(error);
        });
}
*/
/**
 * 멀티 필터 파라미터를 수집하는 함수( 추가)
 * @returns {Object} 필터 파라미터 객체
 */
function collectMultiFilterParams() {
    
    return {
        estateType: getEstateListFilterParams(),
        estateinfo: getEstateInfoParams()
    };
}

function getEstateInfoParams() {
    let selectedValue = ""; 
    const selectElement = document.getElementById('infoType');

    if (selectElement) {
        selectedValue = selectElement.value; // 이제 블록 밖에서 선언된 변수에 값을 할당합니다.
        finalValue = selectedValue !== "all" ? selectedValue : "";
    } else {
        //console.error("ID가 'infoType'인 요소를 찾을 수 없습니다. 기본값 사용.");
        selectedValue = "거래면적"; // 기본값을 명확히 설정 (UI가 없으면)
    }

    return selectedValue ;
}

function getAveragetypeParams() {
    let selectedValue = ""; 
    const selectElement = document.getElementById('averageType');

    if (selectElement) {
        selectedValue = selectElement.value; // 이제 블록 밖에서 선언된 변수에 값을 할당합니다.
        finalValue = selectedValue !== "all" ? selectedValue : "";
    } else {
        selectedValue = "최근5년"; // 기본값을 명확히 설정 (UI가 없으면)
    }

    return selectedValue ;
}

function getEstateListFilterParams() {
    let estate_value = [];
    
    const allToggleButton = $('.realmap-estate-group button').eq(0); // 첫 번째 버튼을 '전체' 버튼으로 간주
    const isAllActive = allToggleButton.hasClass("active"); // '전체' 버튼이 활성화된 상태인지 확인

    if (isAllActive) {
        // '전체' 버튼이 활성화된 경우, 모든 부동산 유형을 명시적으로 추가
        // // 여기서 '전체' 버튼을 눌렀을 때만 실행되므로 중복될 일이 없습니다.
        estate_value.push("apt", "multi", "officetel", "land", "single", "commercial", "factory"); // 일괄 푸시
    } else {
        // '전체' 버튼이 비활성화된 경우, 활성화된 개별 유형 버튼들만 확인
        // 주의: 첫 번째 버튼(전체 버튼)은 여기 루프에서 제외해야 합니다.
        $('.realmap-estate-group button.active').not(allToggleButton).each(function () {
            const btn_text = $(this).text().trim();
            // 개별 유형 버튼의 텍스트를 이용해 값을 추가
            estate_value.push(estateTypeToValueEng(btn_text));
        });
    }

    // 만약 아무것도 선택되지 않았을 경우 (estate_value가 빈 배열일 때)
    // 모든 유형을 포함하거나, 특정 기본값을 설정할지 결정할 수 있습니다.
    // 현재 PHP 로직은 빈 배열을 받으면 빈 응답을 반환하도록 되어 있으므로
    // 여기서 추가적인 처리가 필요 없을 수 있습니다.
    if (estate_value.length === 0) {
        // 예시: 아무것도 선택되지 않았을 때 모든 유형을 기본으로 선택
        // estate_value.push("apt", "multi", "officetel", "land", "single", "commercial", "factory"); // 일괄 푸시
    }
    return estate_value;
    
}
/**
 * estate 타입을 값으로변경하는 함수
 * @param {string} estateType - estate 타입 타입 
 */
function estateTypeToValue(estateType) {
    let estateValue;
    switch (estateType) {
        case "전체":
            estateValue = "";
            break;
        case "아파트":
        case "apt":
            estateValue = "아파트";
            break;
        case "연립/다세대":
        case "multi":
            estateValue = "연립";
            break;
        case "오피스텔":
        case "officetel":
            estateValue = "오피스텔";
            break;
        case "토지":
        case "land":
            estateValue = "토지";
            break;
        case "단독/다가구":
        case "single":
            estateValue = "단독";
            break;
        case "상업/업무용":
        case "commercial":
            estateValue = "상업";
            break;
        case "공장/창고":
        case "factory":
            estateValue = "공장";
            break;
        case "분양/입주권":
        case "preconstruction":
            estateValue = "분양권";
            break;
        default:
            estateValue = "";
            console.error("유효하지 않은 매물유형입니다.(type: " + estateType + ")");
            break;
    }
    return estateValue;
}

function estateTypeToValueEng(estateType) {
    let estateValue;
    switch (estateType) {
        case "전체":
            estateValue = "";
            break;
        case "아파트":
        case "apt":
            estateValue = "apt";
            break;
        case "연립/다세대":
        case "multi":
            estateValue = "multi";
            break;
        case "오피스텔":
        case "officetel":
            estateValue = "officetel";
            break;
        case "토지":
        case "land":
            estateValue = "land";
            break;
        case "단독/다가구":
        case "single":
            estateValue = "single";
            break;
        case "상업/업무용":
        case "commercial":
            estateValue = "commercial";
            break;
        case "공장/창고":
        case "factory":
            estateValue = "factory";
            break;
        case "분양/입주권":
        case "preconstruction":
            estateValue = "lots";
            break;
        default:
            estateValue = "";
            console.error("유효하지 않은 매물유형입니다.(type: " + estateType + ")");
            break;
    }
    return estateValue;
}
/**
 * 매물 데이터를 기반으로 클러스터링 마커 생성 함수
 * estate_type과 sale_type을 기준으로 클러스터링하도록 설정
 * @param {*} data = 매물 데이터
 * @returns
 */
function createClusteredMarker(data) {
    // 기존 좌표에서 약간의 오프셋을 적용하여 마커의 위치를 다르게 설정
    // const offset = 0.00005 * (index % 5); // 인덱스별로 조금씩 좌표 차이를 둠
    // const latlng = new kakao.maps.LatLng(data.lat + offset, data.lng + offset);

    // 랜덤 오프셋 범위 설정 (-0.00005 ~ 0.00005 사이의 값)
    const randomOffset = () => (Math.random() - 0.5) * 0.0001; // 랜덤 값을 생성하여 약간의 좌표 차이를 줌
    // const latlng = new kakao.maps.LatLng(data.center_latitude + randomOffset(), data.center_longitude + randomOffset());
    const latlng = new kakao.maps.LatLng(data.center_latitude, data.center_longitude);

    // 클러스터러에 추가할 마커 생성
    var marker = new kakao.maps.Marker({
        position: latlng,
        zIndex: 2,
    });

    // 마커에 estate_type과 sale_type 정보를 저장하여 구분 가능하게 설정
    marker.estate_type = data.estate_type;
    marker.lat = data.center_latitude;
    marker.lng = data.center_longitude;
    marker.dealAmount = data.dealAmount;
    marker.dealYear = data.dealYear;
    marker.dealMonth = data.dealMonth;
    marker.dealDay = data.dealDay;
    marker.excluUseAr = data.excluUseAr;

    return marker; // 마커를 반환하여 클러스터러에 추가

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

    // // Create the custom overlay content (cluster design)
    // var clusterContent = `
    //     <ul class="text-center bg-white border border-danger overflow-hidden" style="min-width:55px; border-radius:10px;">
    //         <li class="up bg-white p-1">
    //             <span class="number">${data.estate_type}</span>
    //         </li>
    //         <li class="text-white p-1" style="background-color:var(--var-color-main-1)">
    //             <span class="number">${priceHtml}</span>
    //         </li>
    //     </ul>
    //     <p class="position-absolute" style="margin:-5px 0 0 20px;">
    //         <img src="/front/assets/image/icn_arr_mark.svg" width="15" alt="" title="">
    //     </p>
    // `;

    // // Create a custom overlay (clustered marker) for the map
    // var customOverlay = new kakao.maps.CustomOverlay({
    //     clickable: true,
    //     content: clusterContent,
    //     position: latlng,
    //     xAnchor: 0.5,
    //     yAnchor: 0.5,
    //     zIndex: 1,
    // });-

    // return customOverlay;
}

function createClustererAll(type) {
    const key = type;

    // 해당 타입의 클러스터러가 이미 있으면 반환
    if (clusterersByType[key]) {
        return clusterersByType[key];
    }

    // 새 클러스터러 생성
    const clusterer = new kakao.maps.MarkerClusterer({
        map: map,
        gridSize: 90,
        averageCenter: true,
        minLevel: 0,
        calculator: [1, 10, 50], // 클러스터의 크기 구분 값, 각 사이값마다 설정된 text나 style이 적용된다
        minClusterSize: 1,
        disableClickZoom: true,
        styles: [
            {
                width: "65px",
                height: "65px",
                background: "#702bfe",
                opacity: "0.75",
                border: "none",
                borderRadius: "50%",
                color: "#fff",
                textAlign: "center",
                fontWeight: "600",
                lineHeight: "18px",
                fontSize: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "scale(0.8)",
            },
            {
                width: "65px",
                height: "65px",
                background: "#702bfe",
                opacity: "0.75",
                border: "none",
                borderRadius: "50%",
                color: "#fff",
                textAlign: "center",
                fontWeight: "600",
                lineHeight: "18px",
                fontSize: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "scale(0.8)",
            },
            {
                width: "75px",
                height: "75px",
                background: "#702bfe",
                opacity: "0.75",
                border: "none",
                borderRadius: "50%",
                color: "#fff",
                textAlign: "center",
                fontWeight: "600",
                lineHeight: "18px",
                fontSize: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "scale(0.8)",
            },
            {
                width: "85px",
                height: "85px",
                background: "#702bfe",
                opacity: "0.75",
                border: "none",
                borderRadius: "50%",
                color: "#fff",
                textAlign: "center",
                fontWeight: "600",
                lineHeight: "18px",
                fontSize: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "scale(0.8)",
            },
        ],
    });
    // 클러스터러를 매물 및 매매 타입에 따라 저장
    clusterersByType[key] = clusterer;
    initClusterEvent(clusterer);

    return clusterer;
}

/**
 * 특정 estate_type과 sale_type에 대한 클러스터러 생성 함수
 */
function createClusterer(estateType) {
    // const key = `${estateType}_${saleType}`;
    const key = `${estateType}`;

    // 해당 타입의 클러스터러가 이미 있으면 반환
    if (clusterersByType[key]) {
        return clusterersByType[key];
    }

    // 새 클러스터러 생성
    const clusterer = new kakao.maps.MarkerClusterer({
        map: map,
        gridSize: 90,
        averageCenter: true,
        minLevel: 0,
        minClusterSize: 1,
        disableClickZoom: true,
        styles: [
            {
                width: "1px",
                height: "1px",
                background: "transparent",
                border: "none",
                borderRadius: "50%",
                color: "#fff",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "1.5rem",
                lineHeight: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            },
        ],
    });

    // 클러스터러를 매물 및 매매 타입에 따라 저장
    clusterersByType[key] = clusterer;

    kakao.maps.event.addListener(clusterer, "clustered", function (clusters) {
        clusters.forEach(function (cluster) {
            const markers = cluster.getMarkers();

            // 클러스터 내의 매물 수와 타입을 기반으로 그룹화
            const estateType = markers[0].estate_type; // 첫 번째 매물의 estate_type 사용
            const clusterCount = markers.length; // 클러스터에 포함된 매물의 개수

            // 커스텀 클러스터 디자인 적용
            const customClusterContent = `
                <ul class="custom-cluster-content position-absolute text-center font14 bg-white border border-danger overflow-hidden" style="min-width:55px; border-radius:10px;">
                    <li class="color-gray bg-white p-1">
                        <span class="">${estateType}</span>
                    </li>
                    <li class="bg-main text-white p-1">
                        <span class="">${clusterCount}</span>
                    </li>
                </ul>
                <!--
                <p class="position-absolute" style="margin:-5px 0 0 20px;">
                    <img src="/front/assets/image/icn_arr_mark.svg" width="15" alt="" title="">
                </p>
                -->
            `;

            // 클러스터 마커에 커스텀 콘텐츠 설정
            const clusterMarker = cluster.getClusterMarker();
            const overlay = clusterMarker.getContent();
            overlay.innerHTML = customClusterContent;
            // clusterMarker.setContent(customClusterContent);

            // 초기 scale 설정 및 transition 적용
            // overlay.style.scale = "0.8";
            overlay.style.transform = "scale(0.8)";

            overlay.addEventListener("mouseover", function () {
                // overlay.parentElement.style.zIndex = "1";
            });
            overlay.addEventListener("mouseout", function () {
                // overlay.parentElement.style.zIndex = "0";
            });
        });
    });

    // 클러스터 이벤트 초기화
    initClusterEvent(clusterer);

    return clusterer;
}

/**
 * 클러스터 이벤트 초기화 함수
 * @param {*} clusterer
 */
// globalEstateZIndex 제거 — realmap_v2.js의 globalEstateZIndex 공유 사용 (클릭된 마커 최상위 통합)
function initClusterEvent(clusterer) {
    let clickTimeout = null; // 단일 클릭 타임아웃을 저장할 변수

    // 클러스터 - 클릭
    kakao.maps.event.addListener(clusterer, "clusterclick", function (cluster) {
        // 이전 타임아웃이 있으면 제거
        if (clickTimeout) clearTimeout(clickTimeout);

        // 단일 클릭 처리 지연
        clickTimeout = setTimeout(function () {
            // 패널 닫기 직후 카카오 맵이 동일 클릭을 수신한 경우 무시
            // (버튼이 지도 캔버스 위에 겹쳐 clusterclick 이 함께 발생하는 현상 방지)
            if (window.mapContentClosingLock) { clickTimeout = null; return; }

            // 더블클릭이 발생하지 않았을 경우 타임아웃 초기화
            clickTimeout = null;

            const clusterMarker = cluster.getClusterMarker();
            if (clusterMarker) {
                const currentZIndex = parseInt(clusterMarker.getZIndex() || 0, 10); // 현재 z-index 값 읽기
                if(currentZIndex >= globalEstateZIndex) {
                    globalEstateZIndex = currentZIndex + 1; // 전역 z-index 값을 현재 값보다 크게 설정
                }
                else {
                    globalEstateZIndex++; // 클릭할 때마다 전역 z-index 값 증가
                }
                clusterMarker.setZIndex(globalEstateZIndex); // z-index 값을 1 증가
            }
            // --- 클러스터 z-index 조절 로직 끝 ---

            // 모든 매물 리스트를 부드럽게 숨기기
            $(".mcs-list").children("dl").fadeOut(100);
            
            const markers = cluster.getMarkers();
            const estateNos = markers.map((marker) => marker.estate_no);

            // 한 번에 표시할 매물 선택 후 나타내기
            estateNos.forEach(function (estateNo) {
                $(".mcs-list").children(`dl[data-estate-no="${estateNo}"]`).delay(100).fadeIn(400); // 한 번에 부드럽게 나타나도록 처리
            });

            $(".map-content").addClass("active");
        }, 250); // 더블클릭을 기다리는 시간 (250ms)
    });

    // 클러스터 - 더블클릭
    kakao.maps.event.addListener(clusterer, "clusterdblclick", function (cluster) {
        // 더블클릭 시 단일 클릭 타임아웃 취소
        if (clickTimeout) clearTimeout(clickTimeout);

        // 클러스터의 중심 좌표를 얻어옵니다.
        const center = cluster.getCenter();

        // 지도의 중심을 클러스터의 중심으로 이동합니다.
        map.setCenter(center);
        map.setLevel(map.getLevel() - 1);
    });

    // 클러스터 - 마우스 오버
    kakao.maps.event.addListener(clusterer, "clusterover", function (cluster) {
        // 클러스터 마커에 커스텀 콘텐츠 설정
        const clusterMarker = cluster.getClusterMarker();
        const overlay = clusterMarker.getContent();
        overlay.parentElement.style.zIndex = "1";
        // overlay.style.scale = "1";
        overlay.style.transform = "scale(1)"; // 마우스 오버 시 크게
        overlay.style.transition = "transform 0.3s ease"; // 0.3초 동안 부드럽게 변화
        overlay.style.transformOrigin = "center"; // 중심에서 스케일이 변화하도록 설정
    });

    // 클러스터 - 마우스 아웃
    kakao.maps.event.addListener(clusterer, "clusterout", function (cluster) {
        // 클러스터 마커에 커스텀 콘텐츠 설정
        const clusterMarker = cluster.getClusterMarker();
        const overlay = clusterMarker.getContent();
        overlay.parentElement.style.zIndex = "0";
        // overlay.style.scale = "0.8";
        overlay.style.transform = "scale(0.8)"; // 마우스 아웃 시 다시 작게
        overlay.style.transition = "transform 0.3s ease"; // 0.3초 동안 부드럽게 변화
        overlay.style.transformOrigin = "center"; // 중심에서 스케일이 변화하도록 설정
    });
}

/************************
 * 실거래가 조회 함수
 ************************/
async function realPriceDetail(type, pnu) {
    try {
        const user = userInfo();
        const dataObj = {
            ...user,
            type,
            pnu,
        };
        const result = await callApi("POST", "/front/back/realPrice/realPrice_detail.php", dataObj);

        if (!result || result.statusCode !== 200) {
            return;
        }

        // 전역 변수에 결과 데이터를 저장
        realPriceData = result.responseData;

        // 데이터를 화면에 표시
        updateRealPriceTable();

        const firstData = realPriceData[0];
        estimatedPrice(firstData);
    } catch (error) {
        console.error("Error in realPriceDetail:", error);
    }
}

/************************
 * 실거래가 조회 함수
 ************************/
async function realPriceDetailLand(type, data) {
    try {
        const user = userInfo();
        const dataObj = {
            ...user,
            type,
            data,
        };
        const result = await callApi("POST", "/front/back/realPrice/realPrice_detail_land.php", dataObj);

        if (!result || result.statusCode !== 200) {
            return;
        }

        // 전역 변수에 결과 데이터를 저장
        realPriceData = result.responseData;

        // 데이터를 화면에 표시
        updateRealPriceTable();

        // 가장 최근 실거래 데이터
        const firstData = realPriceData[0];

        // 추정가 표시
        estimatedPrice(firstData);
    } catch (error) {
        console.error("Error in realPriceDetail:", error);
    }
}

/************************
 * 실거래가 테이블 업데이트 함수
 ************************/
function updateRealPriceTable() {
    // 조회된 실거래가 데이터가 없을 경우
    if (!realPriceData || realPriceData.length === 0) {
        const nonHtml = `<tr>
                            <td colspan="5" class="text-center">
                                <div class="no_data_area_inner d-flex flex-column justify-content-center gap-3 text-center fs-14">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="3em" viewBox="0 0 512 512">
                                        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" style="fill: var(--var-color-main-1)"></path>
                                    </svg>
                                    <p class="color-gray fw-normal">최근 5년 내에 거래된 이력이 없습니다.</p>
                                </div>
                            </td>
                        </tr>`;
        $(".mcrl-sale-type").html(`<p>토지</p>`);
        $(".mcr-list table tbody").html(nonHtml);
        $("#more_realPrice_btn").hide();
        return;
    }

    // 조회된 실거래가 데이터가 있을 경우
    const realPriceHtml = realPriceData
        .map(function (data, index) {
            const type = data.estateType || "";
            let typeKor = estateTypeToValue(type);
            
            const buttonHtml = `<p>${typeKor}</p>`;
            $(".mcrl-sale-type").html(buttonHtml);

            const dealDate = data.dealDate || "";
            const dealAmount = formatPrice(data.dealAmount.replace(/,/g, ""), "all", false);

            // 면적 단위 전환
            //let area = data.excluUseAr ? parseFloat(data.excluUseAr) : data.dealArea ? parseFloat(data.dealArea) : "";
            let area = data.excluUseAr ? parseFloat(data.excluUseAr) : data.dealArea ? parseFloat(data.dealArea) : data.totalFloorAr ? parseFloat(data.totalFloorAr) : data.buildingAr ? parseFloat(data.buildingAr) : "";
            if (area) {
                area = currentUnit === "pyeong" ? (area / 3.3058).toFixed(2) : area.toFixed(2);
            }

            const areaUnit = currentUnit === "pyeong" ? "평" : "㎡";
            const saleType = data.saleType || "";
            const hiddenAttribute = index >= 6 ? "more-realPrice d-none" : "more-realPrice";

            let tr = "";
            if (type === "apt") {
                tr = `<tr class="${hiddenAttribute}">
                    <td>${dealDate}</td>
                    <td>${dealAmount}원</td>
                    <td>${comma(area)} ${areaUnit}</td>
                    <td>${data.aptDong ? (data.aptDong.endsWith("동") ? data.aptDong + " " : data.aptDong + "동 ") : ""}${data.floor ? data.floor + "층" : ""}</td>
                    <td>${saleType}</td>
                </tr>`;
            } else if (type === "land") {
                tr = `<tr class="${hiddenAttribute}">
                    <td>${dealDate}</td>
                    <td>${dealAmount}원</td>
                    <td>${comma(area)} ${areaUnit}</td>
                    <td>${saleType}</td>
                </tr>`;
            } else {
                tr = `<tr class="${hiddenAttribute}">
                    <td>${dealDate}</td>
                    <td>${dealAmount}원</td>
                    <td>${comma(area)} ${areaUnit}</td>
                    <td>${data.floor ? data.floor + "층" : ""}</td>
                    <td>${saleType}</td>
                </tr>`;
            }

            return tr;
        })
        .join("");

    let thead = "";
    if (realPriceData[0].estateType == "apt") {
        thead = `<tr>
                    <td>거래일</td>
                    <td>가격</td>
                    <td>면적</td>
                    <td>동/층</td>
                    <td>거래</td>
                </tr>`;
    } else if (realPriceData[0].estateType == "land") {
        thead = `<tr>
                    <td>거래일</td>
                    <td>가격</td>
                    <td>면적</td>
                    <td>거래</td>
                </tr>`;
    } else {
        thead = `<tr>
                    <td>거래일</td>
                    <td>가격</td>
                    <td>면적</td>
                    <td>층</td>
                    <td>거래</td>
                </tr>`;
    }
    $(".mcr-list table thead").html(thead);
    $(".mcr-list table tbody").html(realPriceHtml);

    // more_realPrice_btn 버튼 표시/숨김
    if (realPriceData.length <= 6) {
        $("#more_realPrice_btn").hide();
    } else {
        $("#more_realPrice_btn").show();
    }
}

/************************
 * 추정가 계산 함수
 * @param {*} firstData = 가장 최근 실거래 데이터
 * @returns
 ************************/
async function estimatedPrice(firstData) {
    // 데이터를 표시하지 않는 HTML
    const displayNoDataMessage = () => {
        const nonHtml = `<div class="no_data_area_inner d-flex flex-column justify-content-center gap-3 text-center fs-14">
                            <p class="color-gray fw-normal">AI 추정가를 제공하지 않는 장소입니다.</p>
                         </div>`;
        $("#ai_estimated_price").html(nonHtml);
    };

    // firstData가 없을 경우 메시지 출력 후 종료
    if (!firstData) {
        displayNoDataMessage();
        return;
    }

    try {
        const { estateType = "", pnu = "", floor = "", excluUseAr = "", dealArea = "", dongNm = "", dealAmount = "", dealYear = "" } = firstData;

        // officetel일 경우 메시지 출력 후 종료
        if (estateType === "officetel") {
            displayNoDataMessage();
            return;
        }

        const dataObj = {
            type: encodeURIComponent(estateType) || "",
            pnu: encodeURIComponent(pnu || ""),
            floor: encodeURIComponent(floor) || "",
            excluUseAr: encodeURIComponent(excluUseAr) || "",
            dealArea: encodeURIComponent(dealArea) || "", // 토지일 때, 거래면적
            dongNm: encodeURIComponent(dongNm) || "",
            dealAmount: encodeURIComponent(dealAmount || ""),
            dealYear: encodeURIComponent(dealYear || ""),
        };

        // API 호출
        const result = await callApi("POST", "/front/back/realPrice/realPrice_estimated_price.php", dataObj);

        // 결과 검증 및 화면 출력
        if (result && result.statusCode === 200 && result.responseData) {
            const { estimated_price } = result.responseData;
            realEstimatedPrice = estimated_price; // 추정가 저장
            updateRealEstimatedPrice(); // 추정가 바인딩
        } else {
            displayNoDataMessage();
        }
    } catch (error) {
        console.error("Error in estimated_price:", error);
        displayNoDataMessage();
    }
}

/**
 * 추정가 바인딩 함수
 */
/*
function updateRealEstimatedPrice() {
    
    const firstDate = realPriceData[0];
    if (!firstDate || firstDate.length == 0) {
        return;
    }
    if (!realEstimatedPrice || realEstimatedPrice == 0) {
        const nonHtml = `<div class="no_data_area_inner d-flex flex-column justify-content-center gap-3 text-center fs-14">
                            <p class="color-gray fw-normal">AI 추정가를 제공하지 않는 장소입니다.</p>
                         </div>`;
        $("#ai_estimated_price").html(nonHtml);
        return;
    }

    let priceHtml = "";
    if (firstDate.estateType !== "land") {
        const estateType = firstDate.estateType;

        //const excluUseAr = firstDate.excluUseAr ? firstDate.excluUseAr : firstDate.dealArea ? firstDate.dealArea : firstDate.totalFloorAr ? firstDate.totalFloorAr : firstDate.buildingAr ? firstDate.buildingAr : "";
        let excluUseAr = "";
        if(firstDate.estateType == "single")
            excluUseAr = firstDate.totalFloorAr;
        else if((firstDate.estateType == "commercial") || (firstDate.estateType == "factory"))
            excluUseAr = firstDate.buildingAr;
        else  
            excluUseAr = firstDate.excluUseAr;
        const floor = firstDate.floor;

        // 면적 단위 전환
        let area = excluUseAr ? parseFloat(excluUseAr) : "";
        if (area) {
            area = currentUnit === "pyeong" ? area / 3.3058 : area;
        }
        const pricePerM2 = realEstimatedPrice / area;
        const areaUnit = currentUnit === "pyeong" ? "평" : "㎡";

        priceHtml = `<span>${formatPrice(pricePerM2, "all", false)}원/${areaUnit}</span>
                    <span class="d-block text-center color-main fs-14 fw-normal">${floor}층 ${area.toFixed(2)}${areaUnit} 기준</span>`;
    } else {
        priceHtml = `<span>${formatPrice(realEstimatedPrice, "all", false)}원</span>`;
    }
    $("#ai_estimated_price").html(priceHtml);
}
    */
function updateRealEstimatedPrice() {

    if (!realPriceData || realPriceData.length === 0) {
        return;
    }

    const firstDate = realPriceData[0];

    if (!realEstimatedPrice || realEstimatedPrice == 0) {
        const nonHtml = `
            <div class="no_data_area_inner d-flex flex-column justify-content-center gap-3 text-center fs-14">
                <p class="color-gray fw-normal">AI 추정가를 제공하지 않는 장소입니다.</p>
            </div>`;
        $("#ai_estimated_price").html(nonHtml);
        return;
    }

    let priceHtml = "";

    if (firstDate.estateType !== "land") {

        let excluUseAr = "";

        if (firstDate.estateType == "single")
            excluUseAr = firstDate.totalFloorAr;
        else if (firstDate.estateType == "commercial" || firstDate.estateType == "factory")
            excluUseAr = firstDate.buildingAr;
        else
            excluUseAr = firstDate.excluUseAr;

        const floor = firstDate.floor || "-";

        let area = Number(excluUseAr);

        // 숫자 검증
        if (!area || isNaN(area)) {
            $("#ai_estimated_price").html(
                `<span>면적 정보 없음</span>`
            );
            return;
        }

        // 단위 변환
        if (currentUnit === "pyeong") {
            area = area / 3.3058;
        }

        const areaUnit = currentUnit === "pyeong" ? "평" : "㎡";
        const pricePerM2 = realEstimatedPrice / area;

        priceHtml = `
            <span>${formatPrice(pricePerM2, "all", false)}원/${areaUnit}</span>
            <span class="d-block text-center color-main fs-14 fw-normal">
                ${floor}층 ${area.toFixed(2)}${areaUnit} 기준
            </span>`;

    } else {
        priceHtml = `<span>${formatPrice(realEstimatedPrice, "all", false)}원</span>`;
    }

    $("#ai_estimated_price").html(priceHtml);
}

/* =====================================================================
 * v2: 실거래가 마커 show/hide (layerState.realPrice 연동)
 * ===================================================================== */
function showRealPriceClusterers() {
    Object.values(clusterersByType).forEach(c => { if (c) c.setMap(map); });
    realPriceOverlays.forEach(o => o.setVisible(true));
}

function hideRealPriceClusterers() {
    Object.values(clusterersByType).forEach(c => { if (c) { c.setMap(null); c.clear(); } });
    realPriceOverlays.forEach(o => o.setVisible(false));
}
