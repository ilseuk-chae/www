let clusterersByType = {}; // 클러스터러 객체들을 저장할 변수
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
    console.log("Estate 총수 : " + dataRecords.length);
    if (Object.keys(estateTypeCounts).length === 0) {
        console.log("데이터 내에 estate_type이 없거나, 레코드가 없습니다.");
    } else {
        for (const type in estateTypeCounts) {
            console.log(` - ${type}: ${estateTypeCounts[type]}개`);
        }
    }
}

async function realPriceApt(sggCd) {
    var bounds = map.getBounds();
    var sw = bounds.getSouthWest(); // 남서쪽 좌표
    var ne = bounds.getNorthEast(); // 북동쪽 좌표
    var boxString = `BOX(${sw.getLng()},${sw.getLat()},${ne.getLng()},${ne.getLat()})`; // BOX 형식으로 변환
    var bbox = `${sw.getLat()},${sw.getLng()},${ne.getLat()},${ne.getLng()},EPSG:4326`; // BOX 형식으로 변환

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
                if (zoomLevel > 5) {
                    // 기존 클러스터러 생성 및 마커 추가 로직
                    let clusterer = createClustererAll("all"); // 클러스터러 생성
                    const marker = createClusteredMarker(data); // 마커 생성
                    clusterer.addMarker(marker); // 클러스터러에 마커 추가
                } else if (zoomLevel == 5) {
                    // 줌 레벨이 5 이하일 경우, 작은 원형 점으로 표시
                    const smallMarker = document.createElement("div");
                    //smallMarker.className = data.estate_type !== "land" ? "small-marker bg-main border-danger" : "small-marker bg-yellow1 border-yellow1";
                    switch(data.estate_type) {
                        case "apt":
                            markerString = "small-marker bg-orange2 border-orange2";
                            break;
                        case "land":
                            markerString = "small-marker bg-yellow1 border-yellow1";
                            break;
                        case "multi":
                            markerString = "small-marker bg-red2 border-red2";
                            break;
                        case "officetel":
                            markerString = "small-marker bg-indigo2 border-indigo2";
                            break;
                        default:    
                            markerString = "small-marker bg-gray border-gray";
                            break;
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
                    switch(data.estate_type) {
                        case "apt":
                            markerString = "border-orange2";
                            borderString = "border-bottom-orange2";
                            liString = "bg-orange2";
                            imgString = "icn_arr_mark.svg";
                            estateString = "아파트";
                            break;
                        case "land":
                            markerString = "border-yellow1";
                            borderString = "border-bottom-yellow1";
                            liString = "bg-yellow1";
                            imgString = "icn_arr_mark_yellow1.svg";
                            // data.jimok이 undefined 또는 null이 아니고, string 타입일 경우에만 replace 실행
                            if (data.jimok != null && typeof data.jimok === 'string') {
                                jimokString = data.jimok.replace(/용지/g, "");
                            } else {
                                // data.jimok이 유효한 문자열이 아닐 경우
                                //console.warn("data.jimok :", data.jimok);
                                //console.warn("경고: data.jimok이 유효한 문자열이 아니거나 정의되지 않았습니다.", data.jimok);
                                // jimokString은 초기값인 ""을 유지합니다.
                                jimokString ="";
                            }
                            jimokString = jimokString ? jimokString : "";
                            if(jimokString.length > 0) {
                                estateString = `토지: ${jimokString}`;
                            } else {
                                estateString = "토지";
                            }                            
                            break;
                        case "multi":
                            markerString = "border-red2";
                            borderString = "border-bottom-red2";
                            liString = "bg-red2";
                            imgString = "icn_arr_mark_red2.svg";
                            estateString = "연립/다세대";
                            break;
                        case "officetel":
                            markerString = "border-indigo2";
                            borderString = "border-bottom-indigo2";
                            liString = "bg-indigo2";
                            imgString = "icn_arr_mark_indigo2.svg";
                            estateString = "오피스텔";
                            break;
                        default:    
                            markerString = "border-gray";
                            borderString = "border-bottom-gray";
                            liString = "bg-gray";
                            imgString = "icn_arr_mark_gray.svg";
                            estateString = "-";
                            break;
                    }
                    switch(filterObj.estateinfo) {
                        case "거래면적":
                        // 여기를 백틱(``)으로 변경합니다.
                        infoString = `<span class="font12 number toggle-unit">${(data.excluUseAr / 3.3058).toFixed(2)}평</span>`;
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
                        infoString = `<span class="font12 number toggle-unit">${formatPrice(unitPrice, "all", false, true)}/평</span>`;
                        break;
                    default:
                        infoString = `<span class="font12 ">-</span>`; // 백틱으로 변경
                        break;
                    }
                    //<ul class="text-center bg-white border ${data.estate_type !== "land" ? "border-danger" : "border-yellow1"} overflow-hidden" style="min-width:60px; border-radius:10px;" data-lat="${data.center_latitude}" data-lng="${data.center_longitude}" data-type="${data.estate_type
                    //<li class="${data.estate_type !== "land" ? "bg-main" : "bg-yellow1"} text-white">
                    //<p class="position-absolute" style="margin:-5px 0 0 20px; "><img src="/front/assets/image/${data.estate_type !== "land" ? "icn_arr_mark.svg" : "icn_arr_mark_yellow.svg"}" width="15" alt="" title=""></p>
                    iwContent.innerHTML = `
                    <ul class="text-center bg-white border ${markerString} overflow-hidden" style="min-width:60px; border-radius:10px;" data-lat="${data.center_latitude}" data-lng="${data.center_longitude}" data-type="${data.estate_type
                    }" ondragstart="return false;" onselectstart="return false;">
                        <li class="up bg-white ${borderString} p-1" style="line-height: 11px;">
                            <p class="font10">${estateString}</p>
                        </li>
                        <li class="up bg-white p-1">
                            <!-- <p class="font11">${data.estate_type}</p> --!>
                            <!-- <p class="font11">${data.bonbun}</p> --!>
                            <!-- class="font15" style="line-height: 20px;">${formatPrice(data.dealAmount.replace(/,/g, ""), "all", false, true)}</p> --!>
                            <p class="font12" style="line-height: 12px;">${formatPrice(data.dealAmount.replace(/,/g, ""), "all", false, true)}</p>
                        </li>
                        <li class="${liString} text-white">
                            ${infoString}
                        </li>
                    </ul>
                    <p class="position-absolute" style="margin:-5px 0 0 20px; "><img src="/front/assets/image/${imgString}" width="15" alt="" title=""></p>
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
                /*
                    let hoverTimeout; // 마우스 오버 지연을 위한 타이머 변수
                    iwContent.addEventListener("mouseover", function () {
                        // 이전 타이머가 있다면 지웁니다. (만약 다른 오버레이에서 빠르게 옮겨왔다면)
                        clearTimeout(hoverTimeout); 

                        // 0.5초 (500ms) 후에 실행될 함수를 예약합니다.
                        hoverTimeout = setTimeout(() => {
                            // 이 블록 안의 코드는 마우스가 0.3초 이상 머물렀을 때만 실행됩니다.
                            const currentZ = realPriceOverlay.getZIndex(); // 현재 오버레이의 z-index를 가져옵니다.
                            // 이 값을 realPriceOverlay 객체의 임시 속성으로 저장해두어 mouseout 시 복원할 수 있도록 합니다.
                            if(currentZ >= globalClusterZIndex) {
                                globalClusterZIndex = currentZ + 1; // 전역 z-index 값을 현재 값보다 크게 설정
                            }
                            else {
                                globalClusterZIndex++; // 클릭할 때마다 전역 z-index 값 증가
                            }
    
                            realPriceOverlay.setZIndex(globalClusterZIndex); // 일시적으로 매우 높게 설정
                        }, 500); // 0.3초 = 500밀리초
                    });

                   
                    iwContent.addEventListener("mouseout", function () {
                        // 마우스 아웃 시에는 원래 zIndex 또는 클릭으로 설정된 zIndex로 돌아와야 합니다.
                        // 이 부분은 복잡할 수 있으므로, "클릭"에 의한 zIndex 최상위 유지를 우선한다면
                        // 마우스 오버/아웃에 의한 zIndex 변화 로직을 제거하는 것을 고려해볼 수 있습니다.
                        // 여기서는 예시로 초기 ZIndex로 돌아가도록 했습니다.
                       // realPriceOverlay.setZIndex(initialOverlayZIndex); 
                    });
                */                
                    
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
                            //console.log("실거래가 상세 오버레이 읽은 z-index:" + currentZIndex);

                            // 매물 클러스터에서 사용하셨던 동일한 최상위 로직 적용
                            if (currentZIndex >= globalClusterZIndex) { 
                                globalClusterZIndex = currentZIndex + 1; // 현재 ZIndex보다 1 크게 설정
                            } else {
                                globalClusterZIndex++; // 전역 ZIndex를 1 증가
                            }
                            //console.log("실거래가 상세 오버레이 설정 z-index:" + globalClusterZIndex);

                            // realPriceOverlay의 z-index를 새로운 값으로 설정하여 최상위에 보이게 합니다.
                            realPriceOverlay.setZIndex(globalClusterZIndex); 
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
    }

    return selectedValue ;
}
function getEstateListFilterParams() {
    let estate_value = [];
    
    const allToggleButton = $('.realmap-estate-group button').eq(0); // 첫 번째 버튼을 '전체' 버튼으로 간주
    const isAllActive = allToggleButton.hasClass("active"); // '전체' 버튼이 활성화된 상태인지 확인

    if (isAllActive) {
        // '전체' 버튼이 활성화된 경우, 모든 부동산 유형을 명시적으로 추가
        // 여기서 '전체' 버튼을 눌렀을 때만 실행되므로 중복될 일이 없습니다.
        estate_value.push("apt");
        estate_value.push("multi"); // 오타 수정!
        estate_value.push("officetel");
        estate_value.push("land");
    } else {
        // '전체' 버튼이 비활성화된 경우, 활성화된 개별 유형 버튼들만 확인
        // 주의: 첫 번째 버튼(전체 버튼)은 여기 루프에서 제외해야 합니다.
        $('.realmap-estate-group button.active').not(allToggleButton).each(function () {
            const btn_text = $(this).text().trim();
            // 개별 유형 버튼의 텍스트를 이용해 값을 추가
            estate_value.push(estateTypeToValue(btn_text));
        });
    }

    // 만약 아무것도 선택되지 않았을 경우 (estate_value가 빈 배열일 때)
    // 모든 유형을 포함하거나, 특정 기본값을 설정할지 결정할 수 있습니다.
    // 현재 PHP 로직은 빈 배열을 받으면 빈 응답을 반환하도록 되어 있으므로
    // 여기서 추가적인 처리가 필요 없을 수 있습니다.
    if (estate_value.length === 0) {
        // 예시: 아무것도 선택되지 않았을 때 모든 유형을 기본으로 선택
        // estate_value.push("apt", "multi", "officetel", "land");
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
            estateValue = "apt";
            break;
        case "연립/다세대":
            estateValue = "multi";
            break;
        case "오피스텔":
            estateValue = "officetel";
            break;
        case "토지":
            estateValue = "land";
            break;
        case "단독/다가구":
            estateValue = "single";
            break;
        case "상업/업무용":
            estateValue = "commercial";
            break;
        case "공장/창고":
            estateValue = "factory";
            break;
        case "분양/입주권":
            estateValue = "lots";
            break;
        default:
            console.error("유효하지 않은 매물유형입니다.");
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
    //console.log(estateType);

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
let globalClusterZIndex = 1000; // 충분히 큰 값으로 시작 (기본 마커 z-index보다 높게)
function initClusterEvent(clusterer) {
    let clickTimeout = null; // 단일 클릭 타임아웃을 저장할 변수

    // 클러스터 - 클릭
    kakao.maps.event.addListener(clusterer, "clusterclick", function (cluster) {
        // 이전 타임아웃이 있으면 제거
        if (clickTimeout) clearTimeout(clickTimeout);

        // 단일 클릭 처리 지연
        clickTimeout = setTimeout(function () {
            // 더블클릭이 발생하지 않았을 경우 타임아웃 초기화
            clickTimeout = null;

            const clusterMarker = cluster.getClusterMarker();
            if (clusterMarker) {
                const currentZIndex = parseInt(clusterMarker.getZIndex() || 0, 10); // 현재 z-index 값 읽기
                //console.log("읽은 z-index:" + currentZIndex);
                if(currentZIndex >= globalClusterZIndex) {
                    globalClusterZIndex = currentZIndex + 1; // 전역 z-index 값을 현재 값보다 크게 설정
                }
                else {
                    globalClusterZIndex++; // 클릭할 때마다 전역 z-index 값 증가
                }
                //console.log("설정 z-index:" + globalClusterZIndex);
                clusterMarker.setZIndex(globalClusterZIndex); // z-index 값을 1 증가
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
            let typeKor = "";

            switch (type) {
                case "apt":
                    typeKor = "아파트";
                    break;
                case "land":
                    typeKor = "토지";
                    break;
                case "multi":
                    typeKor = "연립/다세대";
                    break;
                case "officetel":
                    typeKor = "오피스텔";
                    break;
                default:
                    typeKor = "";
                    break;
            }
            const buttonHtml = `<p>${typeKor}</p>`;
            $(".mcrl-sale-type").html(buttonHtml);

            const dealDate = data.dealDate || "";
            const dealAmount = formatPrice(data.dealAmount.replace(/,/g, ""), "all", false);

            // 면적 단위 전환
            let area = data.excluUseAr ? parseFloat(data.excluUseAr) : data.dealArea ? parseFloat(data.dealArea) : "";
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
function updateRealEstimatedPrice() {
    const firstDate = realPriceData[0];
    if (!firstDate || firstDate.lenth == 0) {
        return;
    }
    if (!realEstimatedPrice || realEstimatedPrice == 0) {
        const nonHtml = `<div class="no_data_area_inner d-flex flex-column justify-content-center gap-3 text-center fs-14">
                            <p class="color-gray fw-normal">AI 추정가를 제공하지 않는 장소입니다.</p>
                         </div>`;
        $("#ai_estimated_price").html(nonHtml);
    }

    let priceHtml = "";
    if (firstDate.estateType !== "land") {
        const estateType = firstDate.estateType;
        const excluUseAr = firstDate.excluUseAr;
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
