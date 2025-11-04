document.addEventListener('DOMContentLoaded', function() {
    // ⭐️ 이 부분이 가장 중요합니다 ⭐️
    // 이제 이곳에서 localforage를 안전하게 사용할 수 있습니다.
    localforage.config({
         name: 'administrativeDistrictCache',
         storeName: 'geojson_store'
    });
});

// 전역 변수 (또는 모듈 스코프)
let administrativeDistrictGeoJSON = null; // 로드된 GeoJSON 데이터를 저장할 변수
let currentAdministrativePolygons = []; // 지도에 그려진 폴리곤 객체를 관리할 배열 (kakao.maps.Polygon 인스턴스)
let currentAdministrativeLabels = []; // 지도에 그려진 레이블 (CustomOverlay) 객체를 관리할 배열

const GEOJSON_DATA_KEY_PREFIX = 'geojson_'; // onedol님 코드에 맞춰 상수를 정의했습니다.
// GeoJSON 버전 정보는 서버에서 관리하는 것으로 가정합니다.

async function CoordtoPNU(lat, lng) {
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        console.error("CoordtoPNU: 전달된 위도 또는 경도 값이 유효하지 않습니다! (lat:", lat, "lng:", lng, ")");
        return null; // 유효하지 않으면 바로 종료
    }

    const kakaoLatLng = new kakao.maps.LatLng(lat, lng);
    let kakaoAddressResults;

    // searchDetailAddrFromCoords 함수로 kakao.maps.LatLng 객체를 전달합니다.
    try {
        kakaoAddressResults = await new Promise((resolve) => {
        searchDetailAddrFromCoords(kakaoLatLng, (result, status) => {
            // ZERO_RESULT, ERROR 등 모든 status를 포함하여 resolve
            // 이렇게 해야 Promise가 Uncaught Error로 깨지지 않습니다.
            resolve({ result, status });
            });
        });
    } catch (error) {
        // searchDetailAddrFromCoords 내부에서 예상치 못한 오류가 발생하거나,
        // 콜백 외부의 오류가 여기에 잡힐 수 있습니다.
        console.error(`CoordtoPNU: searchDetailAddrFromCoords 호출 중 예상치 못한 오류 발생:`, error);
        return null;
    }

    // Geocoder 결과의 status를 여기서 판단하여 처리합니다.
    if (kakaoAddressResults.status !== kakao.maps.services.Status.OK) {
        // ZERO_RESULT를 포함하여 OK가 아닌 모든 상태를 처리
        console.warn(`[PNU 생성 실패] 좌표 [${lat}, ${lng}]에 대한 주소 검색 결과가 없습니다. 상태: ${kakaoAddressResults.status}`);
        return null;
    }

    // onedol님의 searchDetailAddrFromCoords 함수 구현 방식에 따라 이 부분은 달라질 수 있습니다.
    // 주소 정보가 유효할 경우 PNU 생성 로직 진행
    const primaryAddressInfo = kakaoAddressResults.result && kakaoAddressResults.result.length > 0 ? kakaoAddressResults.result[0] : null;

    if (!primaryAddressInfo) {
        console.warn(`좌표 [${lat}, ${lng}]에 대한 주소 정보를 찾을 수 없습니다.`);
        return null;
    }

    // 2. 카카오 Geocoder API의 `addressSearch`를 한 번 더 호출하여 PNU에 필요한 정보(법정동 코드, 지번 등) 확보
    //    `primaryAddressInfo.address.address_name`은 지번 주소 또는 도로명 주소일 수 있습니다.
    //    PNU는 '지번' 기반이므로 `address_name`이 지번 주소와 일치하도록 보장하는 것이 좋습니다.
    //    만약 `primaryAddressInfo.road_address`가 존재하면 `primaryAddressInfo.road_address.address_name`을 사용할 수도 있습니다.
    const searchResultForPnu = await searchAddress(primaryAddressInfo.address.address_name);

    if (!searchResultForPnu || searchResultForPnu.status !== "OK" || !searchResultForPnu.documents || searchResultForPnu.documents.length === 0) {
        console.warn(`주소 "${primaryAddressInfo.address.address_name}"에 대한 PNU 관련 상세 정보를 찾을 수 없습니다.`);
        return null;
    }
    const firstDoc = searchResultForPnu.documents[0]; // searchAddress가 반환하는 documents 배열의 첫 번째 요소
    const addressDetail = firstDoc.address; // 이 `addressDetail` 객체에 `b_code`, `h_code` 등이 포함됩니다.

    // 3. PNU 구성 요소 추출 및 포맷팅
    // '필지 구분'은 Kakao API에서 직접 제공하지 않으므로, 'mountain_yn'만으로는 1(일반), 2(산) 외의 경우(3, 5)를 구분하기 어렵습니다.
    // 이는 '필지 구분'을 완벽하게 재현하기 어렵다는 것을 의미합니다. 여기서는 1과 2만 처리합니다.
    const mountain_yn_code = (addressDetail.mountain_yn === "Y") ? "2" : "1"; // 'Y'면 '2' (산), 아니면 '1' (일반)

    const main_address_no_padded = String(addressDetail.main_address_no || "0000").padStart(4, "0");
    const sub_address_no_padded = String(addressDetail.sub_address_no || "0000").padStart(4, "0");

    // 4. 행정동 코드(h_code)와 법정동 코드(b_code) 선택
    //    PNU의 앞 10자리는 법정동 코드를 사용합니다.
    //    카카오맵 API의 `b_code`는 법정동 코드를, `h_code`는 행정동 코드를 반환합니다.
    //    따라서 `b_code`를 사용하는 것이 올바릅니다.
    const bCode = addressDetail.b_code;

    if (!bCode) {
        console.warn(`주소 "${addressDetail.address_name}"에 대한 법정동 코드를 찾을 수 없습니다.`);
        return null;
    }

    // PNU 조합 (19자리)
    // 법정동 코드(10자리) + 필지구분(1자리) + 본번(4자리) + 부번(4자리)
    const pnu = bCode + mountain_yn_code + main_address_no_padded + sub_address_no_padded;

    return pnu;
}

// ⭐️ 새로운 getLatestGeoJsonVersionFromServer 함수 (파일 이름별 버전 가져오기) ⭐️
// 이 함수는 실제 서버에서 해당 GeoJSON 파일의 최신 버전을 가져와야 합니다.
// 서버에서 파일 이름(fileName)에 따라 버전을 알려주는 API를 만드시는 것을 추천합니다.
async function getLatestGeoJsonVersionFromServer(fileName) {
    try {
        return "1.0.0"; // <-- 이 부분을 직접 원하는 버전으로 변경
    } catch (error) {
        console.error(`서버에서 ${fileName} GeoJSON 버전 정보를 가져오는 중 오류 발생:`, error);
        // 오류 발생 시, 캐시 사용을 막거나 기본 버전(예: '0')을 반환하여 강제 업데이트를 유도할 수 있습니다.
        return null;
    }
}

// ⭐️ 통합된 fetchAndCacheGeoJson 함수 ⭐️
// 이제 외부에서 version을 받지 않고, 내부적으로 getLatestGeoJsonVersionFromServer를 호출합니다.
async function fetchAndCacheGeoJson(fileName) {
    const dataKey = GEOJSON_DATA_KEY_PREFIX + fileName;
    const versionKey = dataKey + '_version'; // 이 키에 캐시된 데이터의 버전을 저장할 것입니다.

    try {
        // 1. 서버로부터 최신 GeoJSON 버전 정보를 가져옵니다.
        const latestServerVersion = await getLatestGeoJsonVersionFromServer(fileName);

        if (!latestServerVersion) {
            // 서버에서 버전을 가져오지 못하면 캐시를 사용하지 않고 바로 데이터를 가져오도록 합니다.
            // 또는 여기서 에러를 throw하여 함수를 중단시킬 수도 있습니다.
            return await fetchGeoJsonFromServer(fileName, dataKey, versionKey); // 별도 함수로 분리하여 코드 중복 방지
        }

        // 2. IndexedDB에서 캐시된 GeoJSON 데이터 및 버전을 확인합니다.
        const cachedGeoJson = await localforage.getItem(dataKey);
        const cachedVersion = await localforage.getItem(versionKey);

        // 3. 캐시된 데이터가 있고, 캐시된 버전이 서버의 최신 버전과 같으면 캐시를 사용합니다.
        if (cachedGeoJson && cachedVersion === latestServerVersion) {
            return cachedGeoJson;
        }

        // 4. 캐시 데이터가 없거나, 캐시된 버전이 서버의 최신 버전과 다르면 네트워크에서 새로 가져와 캐시합니다.
        return await fetchGeoJsonFromServer(fileName, dataKey, versionKey, latestServerVersion);

    } catch (error) {
        console.error(`GeoJSON 데이터 로드 중 치명적인 오류 발생 (${fileName}):`, error);
        // 최후의 경우: 캐시도 안 되고 서버에서도 가져오기 실패했을 때 처리
        return null;
    }
}

// 서버에서 GeoJSON을 가져와 캐싱하는 로직을 분리한 헬퍼 함수
async function fetchGeoJsonFromServer(fileName, dataKey, versionKey, versionToCache = null) {
    try {
        const response = await fetch(`/front/assets/data/${fileName}`); // GeoJSON 파일의 실제 경로
        if (!response.ok) {
            throw new Error(`GeoJSON 데이터를 가져오는 데 실패했습니다: ${response.statusText}`);
        }
        const geojson = await response.json();

        // 성공적으로 가져왔으면 IndexedDB에 저장 (새 버전으로)
        await localforage.setItem(dataKey, geojson);
        if (versionToCache) {
            await localforage.setItem(versionKey, versionToCache); // 최신 버전을 함께 저장
        } else {
            // 만약 버전을 가져오지 못했지만 데이터는 가져왔다면, 버전 없이 저장하거나,
            // 별도로 처리해야 합니다. 여기서는 버전을 알 수 없으므로 저장하지 않거나 'unknown' 등으로 표시 가능.
            // onedol님의 캐싱 전략에 따라 결정해 주세요.
        }
        return geojson;
    } catch (error) {
        console.error(`서버에서 ${fileName} GeoJSON 데이터를 가져오는 중 오류 발생:`, error);
        return null;
    }
}

/**
 * 지도상에 그려진 모든 행정구역 폴리곤을 지웁니다.
 * currentAdministrativePolygons 배열을 활용합니다.
 */
function clearAdministrativePolygons() {
    currentAdministrativePolygons.forEach(polygon => polygon.setMap(null));
    currentAdministrativePolygons = [];
    currentAdministrativeLabels.forEach(label => label.setMap(null)); // ⭐ 레이블도 지도에서 제거
    currentAdministrativeLabels = []; // ⭐ 레이블 배열 초기화
}

/**
 * PNU와 줌 레벨에 따라 GeoJSON 파일명을 결정합니다.
 * @param {string} pnu - 행정구역 코드 (10자리)
 * @param {number} zoomLevel - 현재 줌 레벨
 * @returns {string} - GeoJSON 파일명 (예: BJCD_1141000000.geojson)
 */
function getGeoJsonFileName(pnu, zoomLevel) {
    let fileNamePrefix;
    let pnuPart;
    
    if(flag){
        // 줌 레벨에 따른 데이터 파일 명 결정 (onedol님 제안 기준)
        if (zoomLevel <= 5) { // 줌 5이하: 읍면동 (BJCD_xxxxxxxx00.geojson)
            fileNamePrefix = "BJCD_";
            pnuPart = pnu.substring(0, 8) + '00';
            
        } else if (zoomLevel >= 6 && zoomLevel <= 9) { // 줌 6~9: 시군구 (BJCD_xxxxx00000.geojson)
            fileNamePrefix = "BJCD_";
            pnuPart = pnu.substring(0, 5) + '00000';
            
        } else { // 줌 8이상: 시도 (BJCD_xx00000000.geojson)
            fileNamePrefix = "BJCD_";
            pnuPart = pnu.substring(0, 2) + '00000000';
            
        }
    } else {
        if (zoomLevel <= 5) { // 줌 5이하: 읍면동 (BJCD_xxxxxxxx00.geojson)
            fileNamePrefix = "EMD_CD_";
            //pnuPart = pnu.substring(0, 8) + '00';
            pnuPart = pnu.substring(0, 8);
        } else if (zoomLevel >= 6 && zoomLevel <= 9) { // 줌 6~9: 시군구 (BJCD_xxxxx00000.geojson)
            fileNamePrefix = "SIG_CD_";
            //pnuPart = pnu.substring(0, 5) + '00000';
            pnuPart = pnu.substring(0, 5);
        } else { // 줌 8이상: 시도 (BJCD_xx00000000.geojson)
            fileNamePrefix = "CTPRVN_CD_";
            //pnuPart = pnu.substring(0, 2) + '00000000';
            pnuPart = pnu.substring(0, 2);
        }
    }
    return `${fileNamePrefix}${pnuPart}.geojson`;
}

/**
 * GeoJSON 데이터를 이용하여 지도에 폴리곤을 그립니다.
 * @param {object} geojson - GeoJSON 데이터 객체
 * @param {kakao.maps.Map} mapInstance - 폴리곤을 그릴 카카오맵 인스턴스
 */
function drawPolygonsFromGeoJson(geojson, mapInstance) {
    if (!geojson || !geojson.features) {
        console.warn("유효한 GeoJSON 데이터가 없습니다.");
        return;
    }
    
    // ⭐ 1. kakao.maps.LatLngBounds 객체를 여기에 선언합니다.
    const bounds = new kakao.maps.LatLngBounds();
    
    geojson.features.forEach(feature => {
        if (feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")) {
            const coordinates = feature.geometry.coordinates;
            const style = feature.properties.style || { // 기본 스타일
                strokeWeight: 1,
                strokeColor: '#FF0000',
                strokeOpacity: 0.5,
                fillColor: '#B0EBB4',
                fillOpacity: 0.3
            };

            // Polygon 또는 MultiPolygon 처리
            const paths = [];
            if (feature.geometry.type === "Polygon") {
                // Polygon은 [[[lng, lat], [lng, lat], ...]] 형태
                const ring = coordinates[0].map(coord => new kakao.maps.LatLng(coord[1], coord[0]));
                paths.push(ring);

            } else if (feature.geometry.type === "MultiPolygon") {
                // MultiPolygon은 [[[[lng, lat], ...]], [[[lng, lat], ...]]] 형태
                // ⭐ 2. 폴리곤의 모든 LatLng 객체를 bounds에 추가하여 확장합니다.
                coordinates.forEach(polygonCoords => {
                    if(flag){
                        const ring = polygonCoords[0].map(coord => transformCoords(coord[0], coord[1])); // ⭐ 여기에 transformCoords 적용
                        paths.push(ring);
                        // ⭐ 3. MultiPolygon의 각 링의 LatLng 객체들을 bounds에 추가하여 확장합니다.
                        ring.forEach(latlng => bounds.extend(latlng));
                    }else{
                        const ring = polygonCoords[0].map(coord => new kakao.maps.LatLng(coord[1], coord[0]));
                        paths.push(ring);
                        // ⭐ 3. MultiPolygon의 각 링의 LatLng 객체들을 bounds에 추가하여 확장합니다.
                        ring.forEach(latlng => bounds.extend(latlng));
                    }
                    
                });
            }

            // 폴리곤 생성 및 지도에 추가
            
            const polygon = new kakao.maps.Polygon({
                map: mapInstance,
                path: paths,
                strokeWeight: style.strokeWeight,
                strokeColor: style.strokeColor,
                strokeOpacity: style.strokeOpacity,
                strokeStyle: 'solid',
                fillColor: style.fillColor,
                fillOpacity: style.fillOpacity,
                zIndex: 9999,//9999, // zIndex를 낮게 설정하여 건물 폴리곤 아래에 표시
            });
            /*
            var polygon = new kakao.maps.Polygon({
                map: map, // ⭐️ 지도가 정확히 할당되어 있는지 다시 확인 (window.map = map 이나 let map = null; 후에 map = new kakao.maps.Map(...)으로 할당한 곳)
                path: paths, // GeoJSON에서 파싱한 좌표 배열
                strokeWeight: 3,       // 선 두께 ⭐️
                strokeColor: '#FF0000', // 빨간색 선 ⭐️
                strokeOpacity: 0.8,    // 선 투명도 ⭐️
                strokeStyle: 'solid',  // 선 스타일
                fillColor: '#FF0000',  // 면 색상 (빨간색으로 통일) ⭐️
                fillOpacity: 0.5       // 면 투명도 ⭐️
            });
            */
            currentAdministrativePolygons.push(polygon); // 관리 배열에 추가
            //polygon.setMap(mapInstance) 
            // ⭐ 이름 표시 로직 추가 시작
            let polygonName;
            const properties = feature.properties;
            if(flag){
                polygonName = properties.NAME;
            }else{
                if (properties && properties.EMD_CD) {
                    // EMD_CD (읍면동 코드)가 있으면 EMD_KOR_NM 사용
                    polygonName = properties.EMD_KOR_NM;
                } else if (properties && properties.SIG_CD) {
                    // SIG_CD (시군구 코드)가 있으면 SIG_KOR_NM 사용
                    polygonName = properties.SIG_KOR_NM;
                } else if (properties && properties.CTPRVN_CD) {
                    // CTPRVN_CD (시도 코드)가 있으면 CTP_KOR_NM 사용
                    polygonName = properties.CTP_KOR_NM;
                } else if (properties && properties.NAME) {
                    // 위에 해당하는 코드가 없지만 NAME 속성이 있다면 NAME 사용 (기본값 또는 fallback)
                    polygonName = properties.NAME;
                } else {
                    // 그 외의 경우 (properties가 없거나, 위의 속성들이 모두 없는 경우)
                    polygonName = '알 수 없는 지역'; // 기본값을 설정하거나 필요에 따라 빈 문자열로 두세요.
                }
            }
            if (polygonName) {
                const centerLatLng = calculatePolygonCentroid(paths); // 중심 좌표 계산
                if (centerLatLng) {
                    // HTML content (CSS로 스타일링 가능)
                    const content = `<div class="polygon-name-label">${polygonName}</div>`;

                    const customOverlay = new kakao.maps.CustomOverlay({
                        position: centerLatLng, // 중심 좌표
                        content: content,
                        yAnchor: 0.5, // 라벨의 Y축 앵커를 중앙으로 설정
                        zIndex: 10000 // 폴리곤 위에 표시되도록 높은 zIndex 설정
                    });
                    customOverlay.setMap(mapInstance); // 지도에 오버레이 추가
                    currentAdministrativeLabels.push(customOverlay); // 레이블 배열에 추가
                }
            }
            // ⭐ 이름 표시 로직 추가 끝
        }
    });

    // ⭐ 4. 모든 폴리곤이 그려진 후, 마지막에 setBounds를 호출합니다.
    if (!bounds.isEmpty()) { // bounds가 비어있지 않을 때만 호출
        //mapInstance.setBounds(bounds);
    }
}

/**
 * 지도를 클릭했을 때 행정구역 폴리곤을 그리는 주 로직입니다.
 * @param {kakao.maps.Map} mapInstance - 카카오맵 인스턴스
 * @param {kakao.maps.LatLng} clickLatLng - 클릭된 지점의 위도/경도 객체
 */
async function handleMapClickForPolygon(mapInstance, clickLatLng) {

    var clickLat = clickLatLng.getLat();
    var clickLng = clickLatLng.getLng();
    
    if (typeof clickLat !== 'number' || typeof clickLng !== 'number') {
        console.error("클릭한 위도 또는 경도 값이 유효한 숫자가 아닙니다! (lat:", clickLat, "lng:", clickLng, ")");
        return; // 유효하지 않으면 PNU 처리 중단
    }

    // 1. PNU 정보 생성
    var pnu = await CoordtoPNU(clickLat, clickLng);

    if (!pnu) {
        console.warn("PNU 정보를 얻을 수 없습니다.");
        return;
    }

    // 2. 현재 줌 레벨 확인
    const currentZoomLevel = mapInstance.getLevel();
    
    // 3. PNU, 줌 레벨에 따라 GeoJSON 파일명 결정
    const geoJsonFileName = getGeoJsonFileName(pnu, currentZoomLevel);
    
    // 4. GeoJSON 데이터 가져오기 (캐싱 로직 포함)
    const geojson = await fetchAndCacheGeoJson(geoJsonFileName); // 버전 정보는 fetchAndCacheGeoJson 내부에서 관리하도록 처리

    if (geojson) {
        // 5. 기존 폴리곤 지우기
        clearAdministrativePolygons();

        // 6. 가져온 GeoJSON 데이터를 이용하여 폴리곤 그리기
        drawPolygonsFromGeoJson(geojson, mapInstance);

        // 추가: 해당 지역으로 지도 이동 (선택 사항)
        // const bounds = new kakao.maps.LatLngBounds();
        // geojson.features.forEach(feature => {
        //     if (feature.geometry && feature.geometry.coordinates) {
        //         feature.geometry.coordinates.forEach(polygon => {
        //             polygon[0].forEach(coord => {
        //                 bounds.extend(new kakao.maps.LatLng(coord[1], coord[0]));
        //             });
        //         });
        //     }
        // });
        // mapInstance.setBounds(bounds); // 해당 폴리곤을 포함하도록 지도 이동
    } else {
        console.error("GeoJSON 데이터를 로드하는 데 실패했습니다.");
    }
}

/**
 * 주소 검색
 * @param {*} param
 */
async function searchAddress(addressName) {
    
    return new Promise((resolve) => {
        geocoder.addressSearch(addressName, function(result, status) {
            if (status === kakao.maps.services.Status.OK) {
                // Kakao API는 성공했지만 documents가 비어있는 경우가 있을 수 있습니다.
                if (result && result.length > 0) {
                    resolve({ status: "OK", documents: result });
                } else {
                    // 결과는 OK인데 documents가 비어있다면, PNU 생성은 불가능합니다.
                    resolve({ status: "OK", documents: [] });
                }
            } else {
                // 실패 상태인 경우, documents는 비어있는 것으로 처리합니다.
                resolve({ status: status, documents: [] });
            }
        });
    });
}
// GeoJSON의 X,Y (UTM-K) 좌표를 카카오맵 (WGS84 LatLng) 객체로 변환하는 함수
function transformCoords(x, y) {
    // UTM-K(EPSG:5179) -> WGS84(EPSG:4326) 변환
    const [lon, lat] = proj4("EPSG:5179", "EPSG:4326", [x, y]); // proj4js는 기본적으로 [경도, 위도] 순으로 반환
    return new kakao.maps.LatLng(lat, lon); // 카카오맵 LatLng는 (위도, 경도) 순서
}

/**
 * 폴리곤 경로(LatLng 배열)의 중심 좌표를 계산합니다.
 * @param {Array<Array<kakao.maps.LatLng>>} paths - 폴리곤의 경로 배열 (MultiPolygon의 경우 여러 링 포함)
 * @returns {kakao.maps.LatLng | null} - 계산된 중심 좌표 또는 null
 */
function calculatePolygonCentroid(paths) {
    let totalLat = 0;
    let totalLng = 0;
    let count = 0;

    paths.forEach(ring => { // 각 링(외곽선, 내부 홀)에 대해 반복
        if (Array.isArray(ring)) { // ring이 유효한 LatLng 배열인지 확인
            ring.forEach(latlng => { // 각 점에 대해 반복
                if (latlng instanceof kakao.maps.LatLng) { // LatLng 객체인지 확인
                    totalLat += latlng.getLat();
                    totalLng += latlng.getLng();
                    count++;
                }
            });
        }
    });

    if (count === 0) {
        return null; // 유효한 좌표가 없는 경우
    }

    return new kakao.maps.LatLng(totalLat / count, totalLng / count);
}

function clearLocalForageData() {
    localforage.clear().then(function() {
        // 모든 스토리지가 지워졌습니다.
        console.log('All data in localforage has been cleared.');
    }).catch(function(err) {
        // 오류가 발생했을 때
        console.error('Error clearing localforage:', err);
    });
}