$(document).ready(async function () {
    // 합필분석 - 좌측레이어 - 리스트 제거 버튼
    $(document).on("click", ".remove-analysis-btn", function () {
        const element = $(this).closest(".land-analyhsis-li");
        removeLandAnalysis(element);
        // element 변수에 .land-analyhsis-li 클래스를 가진 요소가 담겨 있다면 1, 없다면 0이 됩니다.
        const countOfLandAnalysisLiInElement = element.length; 
        if( countOfLandAnalysisLiInElement > 0) {
            const selectedValue = $("#land_analysis_select").val();
            if( selectedValue === 'ecology') {
                $("#land_analysis_btn").trigger('click'); // 분석 버튼 클릭 이벤트 트리거
            }
        }
        else if (countOfLandAnalysisLiInElement === 0) {
            initialLandAnalysis();
        }
    });

    // 합필분석 - 좌측레이어 - 초기화
    $("#land_analysis_reset").on("click", function () {
        $.each($(".land-analyhsis-li"), function (index, element) {
            removeLandAnalysis(element);
            $("#land_analysis_select").val("initial").trigger('change'); // 분석주제도 초기화
        });
    });

    // 합필분석 - 좌측레이어 - 단위 전환
    $("#anaysis_toggle_unit_btn").on("click", function () {
        const toggleUnit = !$("#anaysis_unit_pyeong").hasClass("active");
        $("#anaysis_unit_pyeong").toggleClass("active", toggleUnit);
        $("#anaysis_unit_m2").toggleClass("active", !toggleUnit);

        currentUnit = currentUnit === "m2" ? "pyeong" : "m2";

        // 토지 정보가 있다면
        if (!globalAnalysisArrays || globalAnalysisArrays.length == 0) {
            return;
        }

        // 합필분석 리스트 제거
        $(".land-analyhsis-li").each(function () {
            // element 제거
            $(this).remove();
        });

        globalAnalysisArrays.forEach((data) => {
            createLansAnalysisList(data.landInfo, data.landPrice, data.color);
        });

        // 합계 계산
        landAnalysisTotal();
    });

    // #land_analysis_select 요소에 change 이벤트 리스너를 추가합니다.
    $('#land_analysis_select').on('change', function() {
        // 선택된 option의 value 값을 가져옵니다.
        const selectedValue = $(this).val(); 
        const selectedText = $(this).find('option:selected').text(); // 선택된 option의 텍스트를 가져올 수도 있습니다.

        // 선택된 값에 따라 다른 동작을 수행할 수 있습니다.
        switch (selectedValue) {
            case 'initial':
                //분석 초기화
                initialLandAnalysis();
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
    // 합필분석 - 좌측레이어 - 분석
    $("#land_analysis_btn").on("click", function () {
        const analysisVal = $("#land_analysis_select").val();

        // 분석주제도 - 생태환경도
        if (analysisVal == "ecology") {
            initialLandAnalysis();
            if (Array.isArray(landWFSArrays) && landWFSArrays.length > 0) {
                // landWFSArrays.forEach((element, index) => {
                //     ecologyMap(element.pnu, element.bbox, element.landGeoJson);
                // });

                // 초기값으로 첫 번째 bbox를 사용
                let combinedBbox = [...landWFSArrays[0].bbox];

                let landGeoJsonArrays = [];
                // 각 bbox들의 minX, minY, maxX, maxY 값 비교
                landWFSArrays.forEach((element) => {
                    const [minX, minY, maxX, maxY] = element.bbox;

                    // minX와 minY의 최소값을 찾음
                    combinedBbox[0] = Math.min(combinedBbox[0], minX);
                    combinedBbox[1] = Math.min(combinedBbox[1], minY);

                    // maxX와 maxY의 최대값을 찾음
                    combinedBbox[2] = Math.max(combinedBbox[2], maxX);
                    combinedBbox[3] = Math.max(combinedBbox[3], maxY);

                    landGeoJsonArrays.push(element.landGeoJson);
                });

                // 모든 bbox를 합친 결과를 사용하여 ecologyMap 호출
                ecologyMap(landWFSArrays[0].pnu, combinedBbox, landGeoJsonArrays);
            }
        } else if (analysisVal === 'slope' || analysisVal === 'elevation') {
            if (Array.isArray(landWFSArrays) && landWFSArrays.length > 0) {
                let combinedBbox = [...landWFSArrays[0].bbox];
                const landGeoJsonArrays = [];
                const pnuList = [];

                landWFSArrays.forEach((element) => {
                    const [minX, minY, maxX, maxY] = element.bbox;

                    combinedBbox[0] = Math.min(combinedBbox[0], minX);
                    combinedBbox[1] = Math.min(combinedBbox[1], minY);
                    combinedBbox[2] = Math.max(combinedBbox[2], maxX);
                    combinedBbox[3] = Math.max(combinedBbox[3], maxY);

                    landGeoJsonArrays.push(element.landGeoJson);
                    pnuList.push(element.pnu);
                });

                if (analysisVal === 'slope') {
                    slopeMap(pnuList, combinedBbox, landGeoJsonArrays, { forceReset: true });
                } else {
                    elevationMap(pnuList, combinedBbox, landGeoJsonArrays, { forceReset: true });
                }
            }
        }
        // 분석주제도 - 국토환경성평가
        else if (analysisVal == "nationalEnv") {
            if (Array.isArray(landWFSArrays) && landWFSArrays.length > 0) {
                let combinedBbox = [...landWFSArrays[0].bbox];
                const landGeoJsonArrays = [];
                const pnuList = [];

                landWFSArrays.forEach((element) => {
                    const [minX, minY, maxX, maxY] = element.bbox;

                    combinedBbox[0] = Math.min(combinedBbox[0], minX);
                    combinedBbox[1] = Math.min(combinedBbox[1], minY);
                    combinedBbox[2] = Math.max(combinedBbox[2], maxX);
                    combinedBbox[3] = Math.max(combinedBbox[3], maxY);

                    landGeoJsonArrays.push(element.landGeoJson);
                    pnuList.push(element.pnu);
                });

                nationalEnvMap(pnuList, combinedBbox, landGeoJsonArrays, { forceReset: true });
            }
        }
        // 분석주제도 - 합필분석
        else if (analysisVal == "initial") {
            sweetAlertMessage("분석주제도를 선택해주세요", "", "e");
        }
    });
});

function initialLandAnalysis() {
    
    if (isMultiSelectMode) {
        $("#land_analysis_info_table tbody").empty(); // 합필분석 - 테이블 초기화
        $("#land_analysis_total_area").empty(); // 합필분석 - 면적 초기화
        //realPriceOverlays.forEach((overlay) => overlay.setVisible(false));
        analysisPolygonArray.forEach((polygon) => polygon.setMap(null)); //폴리곤을 지도에서 제거
        analysisPolygonArray = []; // 폴리곤 배열 초기화
    }
};

let globalAnalysisArrays = []; // 배열 선언
/**
 * 합필분석 레이어에 리스트 생성하는 함수
 */
/* ====> 이전함수
function landAnalysis() {
    const landInfo = globalLandCharacter[0];
    const landPrice = globalLandPrices[globalLandPrices.length - 1];
    //cis add 중복확인 부분 20250805
    // 현재 처리하려는 토지의 PNU (만약 landInfo에 pnu가 없다면, landDetail에서 받은 pnu를 전역 변수나 다른 방법으로 넘겨줘야 합니다.
    // 하지만 보통 landInfo.pnu 형태로 접근 가능할 것입니다.)
    // 가정: landInfo 객체 안에 pnu 속성이 있다고 가정합니다.
    const currentPnu = landInfo.pnu; // landInfo 객체 내부에 PNU 속성이 있다고 가정

    // globalAnalysisArrays에서 현재 PNU와 동일한 토지 정보의 '인덱스'를 찾습니다.
    // .findIndex()는 조건을 만족하는 첫 번째 요소의 인덱스를 반환하고, 없으면 -1을 반환합니다.
    const existingIndex = globalAnalysisArrays.findIndex(item => item.landInfo.pnu === currentPnu);

    if (isDuplicate) {
        console.log(`이미 분석 목록에 추가된 토지입니다. PNU: ${currentPnu}`);
        // 사용자에게 알림을 표시하거나, 특정 UI 효과를 줄 수 있습니다.
        // 예를 들어: alert("이미 추가된 토지입니다.");
        return; // 함수 실행을 여기서 중단
    }

    // 체크된 색상 가져오기
    const checkedColor = $('input[name="color-opt"]:checked').val();

    // 새로운 인덱스에 객체 추가
    globalAnalysisArrays.push({
        landInfo: landInfo,
        landPrice: landPrice,
        color: checkedColor,
    });

    // 합필분석 리스트 생성
    createLansAnalysisList(landInfo, landPrice, checkedColor);

    // 합계 계산
    landAnalysisTotal();
}
*/
function landAnalysis() {
    const landInfo = globalLandCharacter[0];
    const landPrice = globalLandPrices[globalLandPrices.length - 1];
    //cis add 중복확인 부분 20250805
    // 현재 처리하려는 토지의 PNU (만약 landInfo에 pnu가 없다면, landDetail에서 받은 pnu를 전역 변수나 다른 방법으로 넘겨줘야 합니다.
    // 하지만 보통 landInfo.pnu 형태로 접근 가능할 것입니다.)
    // 가정: landInfo 객체 안에 pnu 속성이 있다고 가정합니다.
    const currentPnu = landInfo.pnu; // landInfo 객체 내부에 PNU 속성이 있다고 가정

    // globalAnalysisArrays에서 현재 PNU와 동일한 토지 정보의 '인덱스'를 찾습니다.
    // .findIndex()는 조건을 만족하는 첫 번째 요소의 인덱스를 반환하고, 없으면 -1을 반환합니다.
    const existingIndex = globalAnalysisArrays.findIndex(item => item.landInfo.pnu === currentPnu);

    if (existingIndex !== -1) {
        // 이미 분석 목록에 존재하는 경우: 해당 항목을 삭제하고, 관련 UI도 업데이트합니다.
        
        // 1. globalAnalysisArrays에서 해당 항목 삭제
        //globalAnalysisArrays.splice(existingIndex, 1);

        // 2. landPolygons 및 landPolygonsMiniMap 배열에서도 해당 폴리곤을 삭제 (지도에서 해당 폴리곤을 없애야 함)
        // 주의: 이 배열들도 globalAnalysisArrays와 인덱스가 동기화되어 있어야 합니다.
        // 또는 landPolygons/MiniMap은 PNU별로 관리되는 객체여야 합니다.
        // (현재 코드에서는 단순히 splice하면 문제가 될 수 있습니다. PNU 기반의 삭제 로직이 필요합니다.)
        // 예시: 삭제될 폴리곤을 찾아서 지도에서 제거
        // 1. 지도에서 제거할 폴리곤을 먼저 찾아 setMap(null) 호출
        const polygonToRemove = landPolygons.find(p => p.pnu === currentPnu);
        if (polygonToRemove) {
            polygonToRemove.setMap(null); // 지도에서 제거 시도
        } else {
            console.warn("landAnalysis: Could not find polygon to remove with PNU", currentPnu);
        }
        
        const miniMapPolygonToRemove = landPolygonsMiniMap.find(p => p.pnu === currentPnu);
        if (miniMapPolygonToRemove) {
            miniMapPolygonToRemove.setMap(null);
        }

        // 2. filter를 사용하여 배열에서 해당 항목 제거
        globalAnalysisArrays = globalAnalysisArrays.filter(item => item.landInfo.pnu !== currentPnu);
        landPolygons = landPolygons.filter(p => p.pnu !== currentPnu);
        landPolygonsMiniMap = landPolygonsMiniMap.filter(p => p.pnu !== currentPnu);
        landWFSArrays = landWFSArrays.filter(wfs => wfs.pnu !== currentPnu);

        refreshLandAnalysisListUI(); // 전체 목록을 비우고 globalAnalysisArrays를 기반으로 다시 그리는 함수

    } else {
        // 분석 목록에 존재하지 않는 경우: 새로운 항목으로 추가합니다.
        const checkedColor = $('input[name="color-opt"]:checked').val();

        // 새로운 인덱스에 객체 추가
        globalAnalysisArrays.push({
            landInfo: landInfo,
            landPrice: landPrice,
            color: checkedColor,
        });

        // 합필분석 리스트 생성 (단일 항목 추가)
        createLansAnalysisList(landInfo, landPrice, checkedColor);

        // *** 새로 추가되는 토지의 폴리곤을 지도에 그리는 부분 ***
        // getLandInfo에서 landPolygons에 추가된 해당 PNU의 폴리곤을 찾아서 지도에 올립니다.
        const polygonToShow = landPolygons.find(p => p.pnu === currentPnu); // getLandInfo에서 이미 landPolygons에 추가되었으므로 여기서 찾음
        if (polygonToShow) {
            polygonToShow.setMap(map); // 메인 지도에 그립니다.
            // 필요하다면, 여기서 색상도 checkedColor로 변경해줄 수 있습니다.
            polygonToShow.setOptions({
                strokeColor: checkedColor,
                fillColor: checkedColor
            });
        }
        const miniMapPolygonToShow = landPolygonsMiniMap.find(p => p.pnu === currentPnu);
        if (miniMapPolygonToShow) {
            miniMapPolygonToShow.setMap(miniMap); // 미니맵에 그립니다.
             miniMapPolygonToShow.setOptions({
                strokeColor: checkedColor,
                fillColor: checkedColor
            });
        }
    }

    // 변경사항 반영을 위한 합계 재계산
    landAnalysisTotal();

    // 현재 선택된 토지 폴리곤의 색상을 토글 상태에 따라 변경
    // 이 부분은 handleMapClick에서 addPolygonsToMap 호출 시점에 처리하는 것이 더 적절할 수 있습니다.
    // 예를 들어, 해당 폴리곤에 현재 active/selected 상태를 나타내는 클래스를 추가하거나 색상을 변경하는 로직
}
// UI 리스트를 갱신하는 헬퍼 함수 (필요에 따라 구현)
function refreshLandAnalysisListUI() {
    // #mnnmSlno_btn_group 또는 분석 리스트를 담고 있는 컨테이너를 비우고
    // globalAnalysisArrays의 모든 항목을 다시 순회하며 createLansAnalysisList와 유사하게 UI 요소를 생성합니다.
    // 이 함수가 createLansAnalysisList와 겹치거나 대체될 수 있습니다.
    const $analysisListContainer = $(".ml-info"); // 실제 컨테이너 ID로 변경
    $analysisListContainer.empty();
    globalAnalysisArrays.forEach(item => {
        // createLansAnalysisList와 비슷한 로직으로 다시 UI 아이템을 그립니다.
        // 이 부분은 createLansAnalysisList 함수를 전역 배열 전체에 대해 호출하도록 변경하는 것이 더 효율적일 수 있습니다.
        createLansAnalysisList(item.landInfo, item.landPrice, item.color);
        // 또는 리스트 아이템에 PNU를 data 속성으로 추가하여 remove/add를 효율적으로 관리.
        //const $listItem = $('<li>').text(`PNU: ${item.landInfo.pnu}, Color: ${item.color}`);
        //$analysisListContainer.append($listItem);
    });
}
/**
 * 합필분석 리스트 생성 함수
 * @param {*} landInfo - 토지특성정보
 * @param {*} landPrice - 공시지가
 */
function createLansAnalysisList(landInfo, landPrice, checkedColor) {
    let officialPrice = 0;
    officialPrice = parseInt(landPrice.pblntfPclnd) * parseInt(landInfo.lndpclAr || landInfo.lndpcl_ar); // 총 공시지가 = 공시지가 * 토지면적
    officialPrice = Math.floor(officialPrice / 10000); // 총 공시지가(만 단위 까지) = (공시지가 * 토지면적) / 10000

    let officialPriceFormat = formatPrice(officialPrice); // 총 공시지가(억 단위 까지)
    // officialPrice = formatPrice(officialPrice, "only-uk"); // 총 공시지가(억 단위 까지)
    const jibunAddressText = $(".jibun-address").eq(0).text(); // .jibun-address 첫 번째 요소의 텍스트 가져오기

    const landHtml = `
    <div class="land-analyhsis-li">
        <dl>
            <dt><span style="color:${checkedColor};">◼︎</span>${landInfo.ldCodeNm || jibunAddressText} ${landInfo.mnnmSlno || ""} <span class="land-analysis-area" data-area="${landInfo.lndpclAr || landInfo.lndpcl_ar || 0}">(${formatArea(landInfo.lndpclAr || landInfo.lndpcl_ar) || "-"})</span></dt>
            <dd>
                <button class="remove-analysis-btn"><i class="fa-light fa-xmark"></i></button>
            </dd>
        </dl>
        <ul>
            <li>
                <h2>공시지가</h2>
                <div class="land-analysis-price" data-price="${officialPrice || 0}">${officialPriceFormat || "-"}</div>
            </li>
            <li>
                <h2>지목</h2>
                <div>${landInfo.lndcgrCodeNm || landInfo.lndcgr_code_nm || "-"}</div>
            </li>
            <li>
                <h2>용도지역</h2>
                <div>${landInfo.prposArea1Nm || landInfo.prpos_area_1_nm || "-"}</div>
            </li>
            <li>
                <h2>이용상황</h2>
                <div>${landInfo.ladUseSittnNm || landInfo.lad_use_sittn_nm || "-"}</div>
            </li>
            <li>
                <h2>지형높이</h2>
                <div>${landInfo.tpgrphHgCodeNm || landInfo.tpgrph_hg_code_nm || "-"}</div>
            </li>
            <li>
                <h2>지형형상</h2>
                <div>${landInfo.tpgrphFrmCodeNm || landInfo.tpgrph_frm_code_nm || "-"}</div>
            </li>
        </ul>
    </div>`;

    $(".ml-info").append(landHtml);
}

/**
 * 분석 리스트 제거 함수
 * @param {*} element
 */
function removeLandAnalysis(element) {
    // element가 몇 번째인지 확인
    const index = $(element).index();

    // element 제거
    element.remove();

    // index 위치의 폴리곤을 지도에서 제거
    const polygon = landPolygons[index];
    polygon.setMap(null);

    // index 위치의 요소를 landPolygons 배열에서 제거
    if (index > -1 && index < landPolygons.length) {
        landPolygons.splice(index, 1);
    }

    landWFSArrays.splice(index, 1);
    globalAnalysisArrays.splice(index, 1);

    // 합계 계산
    landAnalysisTotal();
}

/**
 * 합계 계산 함수
 */
/*
function landAnalysisTotal() {
    let totalArea = 0;
    let totalPrice = 0;

    // .land-analysis-area 클래스가 있는 모든 요소의 value 값을 순회하며 합산
    $(".land-analysis-area").each(function () {
        // 각 요소의 value 값을 가져오고 숫자로 변환한 뒤 합산
        let area = parseFloat($(this).attr("data-area")) || 0; // 값이 없거나 숫자가 아니면 0으로 처리
        totalArea += area;
    });

    $("#land_total_area").text(formatArea(totalArea.toFixed(2)));

    // .land-analysis-area 클래스가 있는 모든 요소의 value 값을 순회하며 합산
    $(".land-analysis-price").each(function () {
        // 각 요소의 value 값을 가져오고 숫자로 변환한 뒤 합산
        let price = parseFloat($(this).attr("data-price")) || 0; // 값이 없거나 숫자가 아니면 0으로 처리
        totalPrice += price;
    });

    let totalPriceFormat = formatPrice(totalPrice); // 총 공시지가(억 단위 까지)
    $("#land_total_price").text(totalPriceFormat);

    $("#land_analysis_total_cnt").text($(".land-analyhsis-li").length);
}

*/
function landAnalysisTotal() {
    let totalAreaSqm = 0; // 전체 면적 (㎡ 기준)
    let totalOfficialPriceMan = 0; // 전체 공시지가 (만 단위 기준)

    // 색상별 면적/공시지가 집계를 위한 객체 초기화
    const areaSqmByColor = {}; // { color: 면적_sqm_값 }
    const officialPriceManByColor = {}; // { color: 공시지가_만_단위_값 }

    // globalAnalysisArrays를 순회하며 전체 합계와 색상별 합계 동시 집계
    globalAnalysisArrays.forEach(item => {
        // 면적 가져오기: landInfo.lndpclAr 또는 landInfo.lndpcl_ar 사용
        const currentAreaSqm = parseFloat(item.landInfo.lndpclAr || item.landInfo.lndpcl_ar) || 0;

        // 공시지가 계산 (제공해주신 로직 그대로 사용)
        const pblntfPclnd = parseInt(item.landPrice.pblntfPclnd) || 0; // 단가 가져오기
        let calculatedPrice = pblntfPclnd * currentAreaSqm; // 총 공시지가 = 단가 * 면적 (원 단위)
        const currentOfficialPriceMan = Math.floor(calculatedPrice / 10000); // 총 공시지가 (만 단위까지)

        // 전체 합계 누적
        totalAreaSqm += currentAreaSqm;
        totalOfficialPriceMan += currentOfficialPriceMan;

        // 색상별 면적 누적
        if (!areaSqmByColor[item.color]) {
            areaSqmByColor[item.color] = 0;
        }
        areaSqmByColor[item.color] += currentAreaSqm;

        // 색상별 공시지가 누적
        if (!officialPriceManByColor[item.color]) {
            officialPriceManByColor[item.color] = 0;
        }
        officialPriceManByColor[item.color] += currentOfficialPriceMan;
    });

    // --- 전체 합계 업데이트 ---
    // 전체 필지 개수 업데이트
    $("#land_analysis_total_cnt").text(globalAnalysisArrays.length);

    // 전체 면적 업데이트 (㎡ 기준)
    // formatArea 함수가 ㎡를 적절히 표시할 것으로 가정합니다.
    $("#land_total_area").text(formatArea(totalAreaSqm.toFixed(2))); 

    // 전체 공시지가 업데이트 (만 단위 기준)
    // formatPrice 함수가 만 단위를 '억' '만' 등으로 변환할 것으로 가정합니다.
    $("#land_total_price").text(formatPrice(totalOfficialPriceMan)); 

    // --- 색상별 면적 합계 표시 ---
    const $areaSummaryContainer = $("#land_area_by_color_summary");
    $areaSummaryContainer.empty(); // 이전 내용 비우기
    for (const color in areaSqmByColor) {
        if (areaSqmByColor.hasOwnProperty(color)) {
            // 현재 표시 단위 ('평' vs '㎡')에 따라 다른 값 사용
            // #anaysis_toggle_unit_btn의 span.active 텍스트가 '평'인지 '㎡'인지 확인합니다.
            const isPyeongActive = $("#anaysis_toggle_unit_btn span.active").text() === '평';
            let displayAreaValue = areaSqmByColor[color];
            let displayUnitText = '㎡';
    
            // 여기부터 수정된 부분입니다.
            const $item = $('<div>')
                .addClass('color-summary-item')
                .css('background-color', color)
                .css('display', 'flex') // 플렉스박스 컨테이너로 설정
                .css('align-items', 'center'); // 요소들을 수직 중앙으로 정렬합니다 (선택 사항).
    
            // "소계" 텍스트를 담을 span 요소 생성
            const $subtotalLabel = $('<span>')
                                    .text('소계')
                                    .css('flex', '0 0 20%') // 너비를 20%로 고정하고, flex-grow/shrink는 0
                                    .css('text-align', 'left'); // 텍스트 정렬
            // 면적 값을 담을 span 요소 생성 (기존 formatArea 함수 그대로 사용)
            const $areaValue = $('<span>')
                                .text(`${formatArea(displayAreaValue.toFixed(2), displayUnitText)}`)
                                .css('flex', '1') // 남은 공간을 모두 차지하도록 설정
                                .css('text-align', 'right'); // 텍스트 정렬
    
            // $item에 생성한 두 span 요소를 추가
            $item.append($subtotalLabel).append($areaValue);
            // 여기까지 수정된 부분입니다.
            
            $areaSummaryContainer.append($item);
        }
    }

    // --- 색상별 공시지가 합계 표시 ---
    const $priceSummaryContainer = $("#land_price_by_color_summary");
    $priceSummaryContainer.empty(); // 이전 내용 비우기
    for (const color in officialPriceManByColor) {
        if (officialPriceManByColor.hasOwnProperty(color)) {
            // 여기부터 수정된 부분입니다.
            const $item = $('<div>')
                .addClass('color-summary-item')
                .css('background-color', color)
                .css('display', 'flex') // 플렉스박스 컨테이너로 설정
                .css('align-items', 'center'); // 요소들을 수직 중앙으로 정렬 (선택 사항)
    
            // "소계" 텍스트를 담을 span 요소 생성
            const $subtotalLabel = $('<span>')
                                    .text('소계')
                                    .css('flex', '0 0 20%') // 너비를 20%로 고정하고, flex-grow/shrink는 0
                                    .css('text-align', 'left'); // 텍스트 정렬
    
            // 가격 값을 담을 span 요소 생성 (기존 formatPrice 함수 그대로 사용)
            const $priceValue = $('<span>')
                                .text(`${formatPrice(officialPriceManByColor[color])}`)
                                .css('flex', '1') // 남은 공간을 모두 차지하도록 설정
                                .css('text-align', 'right'); // 텍스트 정렬
    
            // $item에 생성한 두 span 요소를 추가
            $item.append($subtotalLabel).append($priceValue);
            // 여기까지 수정된 부분입니다.
    
            $priceSummaryContainer.append($item);
        }
    }
}


// formatArea 함수 수정 제안 (단위를 인자로 받을 수 있도록)
function formatArea2(value, unit = '㎡') { // 기본 단위를 ㎡로 설정
    // 여기에 onedol님의 기존 formatArea 로직
    // 예시: 숫자에 콤마 추가
    let formattedValue = parseFloat(value).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
    return `${formattedValue}${unit}`;
}