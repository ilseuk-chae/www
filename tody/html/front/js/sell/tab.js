const REST_API_KEY = "358571ae546aaa68be0d290878b351c1";

var placeOverlay = new kakao.maps.CustomOverlay({ zIndex: 1 }); // 마커를 클릭했을 때 해당 장소의 상세정보를 보여줄 커스텀오버레이입니다
let placeOverlayNode = document.createElement("div"); // 커스텀 오버레이의 컨텐츠 엘리먼트 입니다

let currentPropertyData = null; // 초기에는 null 또는 빈 객체로 설정

$(document).ready(function () {
    initializeTab();
    
    initTabEvents();
    //updateTabOnScroll();

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
/* OK 함수는 사용자가 어떤 브라우저를 사용하든 상관없이 원하는 요소에 특정 이벤트 발생 시 
   특정 함수가 실행되도록 보장하는 유틸리티 함수입니다. */
function addEventHandle(target, type, callback) {
    if (target.addEventListener) {
        target.addEventListener(type, callback);
    } else {
        target.attachEvent("on" + type, callback);
    }
}
/* OK  함수는 페이지가 로드되거나 특정 탭이 초기화될 때 호출되어 이전에 검색했던 장소 정보를 
       불러와 검색 입력창에 자동으로 채워주는 역할을 하는 것으로 보입니다.*/
function initializeTab() {
    let places = JSON.parse(sessionStorage.getItem("lastSearchedPlace"));
    if (places) {
        const address_name = places.address_name;
        $("#search_input").val(address_name);
    }
}


/**
 * 탭 이벤트 및 버튼 클릭 이벤트를 초기화하는 함수
 */
function initTabEvents() {
        
    // 단위 전환 버튼 클릭 액션 이벤트
    //$("#toggle_unit_btn").on("click", function () {
    //    const toggleUnit = !$("#unit_pyeong").hasClass("active");
    //    $("#unit_pyeong").toggleClass("active", toggleUnit);
    //   $("#unit_m2").toggleClass("active", !toggleUnit);
    //});

    // 단위 전환 버튼 클릭 이벤트 핸들러
    $("#toggle_unit_btn").on("click", function () {
        // 현재 단위를 토글합니다. m2 -> pyeong, pyeong -> m2
        // 이 부분은 formatArea 내부에서 #area_unit을 업데이트하므로 필요 없을 수도 있지만,
        // 버튼 자체의 시각적 상태를 위해 유지하거나 조정합니다.
        currentUnit = currentUnit === "m2" ? "pyeong" : "m2";

        // 버튼 자체의 텍스트 또는 활성화 상태를 업데이트합니다.
        // HTML 구조에 따라 #unit_pyeong과 #unit_m2 스팬의 active 클래스를 토글합니다.
        if (currentUnit === "pyeong") {
            $("#unit_pyeong").addClass("active");
            $("#unit_m2").removeClass("active");
        } else { // currentUnit === "m2"
            $("#unit_pyeong").removeClass("active");
            $("#unit_m2").addClass("active");
        }
        
        // "mcs-list" 클래스를 가진 모든 요소 내의 <li> 태그들을 찾습니다.
        $('.mcs-list dt ul li:nth-child(2)').each(function() {
            const $li = $(this);
            const text = $li.text().trim(); // LI 태그의 텍스트 내용을 가져와 앞뒤 공백을 제거합니다.

            // 텍스트가 숫자로 시작하고 'm' 또는 '평'으로 끝나는 면적 정보 패턴인지 확인합니다.
            // 이 정규식은 "1,000m" 또는 "30.5평" 형태를 찾습니다.
            const areaMatch = text.match(/^([\d,.]+)\s*(㎡|평)$/);
            if (areaMatch) {
                // 패턴과 일치하면 숫자 부분과 단위 부분을 분리합니다.
                const valueStr = areaMatch[1].replace(/,/g, ''); // 숫자 부분에서 쉼표를 제거합니다.
                const unit = areaMatch[2]; // 단위 ('m' 또는 '평')
                let value = parseFloat(valueStr); // 숫자로 변환합니다.

                // 숫자로 변환할 수 없거나 값이 유효하지 않으면 이 항목은 건너뜁니다.
                if (isNaN(value)) {
                    console.warn("면적 값 변환 실패:", text);
                    return; // 다음 LI로 넘어갑니다.
                }

                let areaInM2;
                const PY_TO_M2 = 3.305785; // 1평 = 약 3.305785 제곱미터

                // 현재 LI 항목의 단위가 '평'이면 m2로 변환합니다.
                if (unit === "평") {
                    areaInM2 = value * PY_TO_M2;
                } else { // 단위가 'm' (m2)이면 그대로 사용합니다.
                    areaInM2 = value;
                }

                // formatArea 함수를 사용하여 면적 값을 새로운 단위로 포맷팅하고 LI 태그를 업데이트합니다.
                // formatArea 함수는 인자로 m2 값을 받는다고 가정합니다.
                $li.text(formatArea(areaInM2));
            }
            // else: 면적 정보 패턴과 일치하지 않는 LI 항목은 건너l니다.
        });

        if ($("#msv_content").is(':visible') ) {
            console.log(`msv_content가 보입니다. 단위를 ${currentUnit}으로 변경하여 표시합니다.`);
            
            // 3. 각 면적 값을 찾아서 업데이트합니다.
            // msv_content 내에서 각 면적 값이 표시되는 요소를 식별해야 합니다.
            // 예시로, 토지면적은 ID가 'platAreaValue', 건축면적은 'archAreaValue', 총면적은 'totAreaValue'인 요소에 표시된다고 가정합니다.
            // 실제 HTML 구조에 맞게 셀렉터를 수정해야 합니다.
    
            // 토지면적 업데이트
            // #msv_content 내부에서 platArea 클래스를 가진 dd 요소를 선택
            const platAreaElement = $("#msv_content dd.platArea");
            // 선택된 요소의 텍스트 내용 가져오기
            const platAreaContent = platAreaElement.text();
            let areaMatch = platAreaContent.match(/^([\d,.]+)\s*(㎡|평)$/);
            if (areaMatch) {
                // 패턴과 일치하면 숫자 부분과 단위 부분을 분리합니다.
                const valueStr = areaMatch[1].replace(/,/g, ''); // 숫자 부분에서 쉼표를 제거합니다.
                const unit = areaMatch[2]; // 단위 ('m' 또는 '평')
                let value = parseFloat(valueStr); // 숫자로 변환합니다.

                // 숫자로 변환할 수 없거나 값이 유효하지 않으면 이 항목은 건너뜁니다.
                if (isNaN(value)) {
                    console.warn("면적 값 변환 실패:", platAreaContent);
                    //return; // 다음 LI로 넘어갑니다.
                }

                let areaInM2;
                const PY_TO_M2 = 3.305785; // 1평 = 약 3.305785 제곱미터

                // 현재 LI 항목의 단위가 '평'이면 m2로 변환합니다.
                if (unit === "평") {
                    areaInM2 = value * PY_TO_M2;
                } else { // 단위가 'm' (m2)이면 그대로 사용합니다.
                    areaInM2 = value;
                }

                // formatArea 함수를 사용하여 면적 값을 새로운 단위로 포맷팅하고 LI 태그를 업데이트합니다.
                // formatArea 함수는 인자로 m2 값을 받는다고 가정합니다.
                platAreaElement.text(formatArea(areaInM2));
            }
    
            // 건축면적 업데이트
            const archAreaElement = $("#msv_content dd.archArea");
            // 선택된 요소의 텍스트 내용 가져오기
            const archAreaContent = archAreaElement.text();
            areaMatch = archAreaContent.match(/^([\d,.]+)\s*(㎡|평)$/);
            if (areaMatch) {
                // 패턴과 일치하면 숫자 부분과 단위 부분을 분리합니다.
                const valueStr = areaMatch[1].replace(/,/g, ''); // 숫자 부분에서 쉼표를 제거합니다.
                const unit = areaMatch[2]; // 단위 ('m' 또는 '평')
                let value = parseFloat(valueStr); // 숫자로 변환합니다.

                // 숫자로 변환할 수 없거나 값이 유효하지 않으면 이 항목은 건너뜁니다.
                if (isNaN(value)) {
                    console.warn("면적 값 변환 실패:", archAreaContent);
                    //return; // 다음 LI로 넘어갑니다.
                }

                let areaInM2;
                const PY_TO_M2 = 3.305785; // 1평 = 약 3.305785 제곱미터

                // 현재 LI 항목의 단위가 '평'이면 m2로 변환합니다.
                if (unit === "평") {
                    areaInM2 = value * PY_TO_M2;
                } else { // 단위가 'm' (m2)이면 그대로 사용합니다.
                    areaInM2 = value;
                }

                // formatArea 함수를 사용하여 면적 값을 새로운 단위로 포맷팅하고 LI 태그를 업데이트합니다.
                // formatArea 함수는 인자로 m2 값을 받는다고 가정합니다.
                archAreaElement.text(formatArea(areaInM2));
            }
            
            // 총면적 업데이트
            const totAreaElement = $("#msv_content dd.totArea");
            // 선택된 요소의 텍스트 내용 가져오기
            const totAreaContent = totAreaElement.text();
            areaMatch = totAreaContent.match(/^([\d,.]+)\s*(㎡|평)$/);
            if (areaMatch) {
                // 패턴과 일치하면 숫자 부분과 단위 부분을 분리합니다.
                const valueStr = areaMatch[1].replace(/,/g, ''); // 숫자 부분에서 쉼표를 제거합니다.
                const unit = areaMatch[2]; // 단위 ('m' 또는 '평')
                let value = parseFloat(valueStr); // 숫자로 변환합니다.

                // 숫자로 변환할 수 없거나 값이 유효하지 않으면 이 항목은 건너뜁니다.
                if (isNaN(value)) {
                    console.warn("면적 값 변환 실패:", totAreaContent);
                    //return; // 다음 LI로 넘어갑니다.
                }

                let areaInM2;
                const PY_TO_M2 = 3.305785; // 1평 = 약 3.305785 제곱미터

                // 현재 LI 항목의 단위가 '평'이면 m2로 변환합니다.
                if (unit === "평") {
                    areaInM2 = value * PY_TO_M2;
                } else { // 단위가 'm' (m2)이면 그대로 사용합니다.
                    areaInM2 = value;
                }

                // formatArea 함수를 사용하여 면적 값을 새로운 단위로 포맷팅하고 LI 태그를 업데이트합니다.
                // formatArea 함수는 인자로 m2 값을 받는다고 가정합니다.
                totAreaElement.text(formatArea(areaInM2));
            }

    
            // 만약 단위 텍스트도 변경해야 한다면 해당 요소도 업데이트합니다.
            // 예: $("#msv_content .unit-label").text(currentUnit === "m2" ? "m²" : "평");
    
        } else if (currentPropertyData) {
             console.log("msv_content가 보이지 않아 면적 값을 업데이트하지 않습니다.");
        } else {
            console.log("msv_content가 보이지 않거나 원본 데이터(currentPropertyData)가 없습니다.");
        }

       
    });

    
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
        return comma(toFixed_2_SquareMeters(area)) + "㎡";
    } else {
        $("#area_unit").text("평");
        return comma(convertSquareMetersToPyeong(area)) + "평";
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
 * 제곱미터(m²) 소수 이하 2자리로 변환하는 함수
 * @param {number} 변환된 squareMeters - 제곱미터 값
 * @returns {number} 
 */
function toFixed_2_SquareMeters(squareMeters) {
   
    
    const numericSquareMeters = parseFloat(squareMeters);

    // 변환된 값이 유효한 숫자인지 확인
    if (isNaN(numericSquareMeters)) {
        console.error("Error: Input is not a valid number.");
        return ""; // 또는 다른 에러 처리 방식
    }

    // 숫자로 변환된 값에 toFixed(2) 적용
    return numericSquareMeters.toFixed(2);
    //return (squareMeters ).toFixed(2);
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




