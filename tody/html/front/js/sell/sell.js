let searchPlacesExecuted = false; // searchPlaces() 함수가 실행되었는지 추적
let searchEstateNo = false; // 매물번호로 검색했는지 플래그
let isKeyDown = false; // 이벤트 중복 방지 플래그
// 전역 변수로 compareList 객체를 선언합니다.
// 이 객체는 페이지의 어느 스크립트에서든 접근하고 수정할 수 있습니다.
let compareList = {
    data: [] // 비교 대상 매물의 상세 정보를 저장할 배열 (data 구조체 역할)
};

$(document).ready(async function () {
    initAction(); // 액션 이벤트 초기화
    initSearchEvents(); // 검색 이벤트 초기화
    initHandleEvents(); // 이벤트 초기화
    initListEvents(); // 리스트 이벤트 초기화
    initFilters(); // 필터 관련 함수 초기화
    initMemoEvents(); // 메모 관련 이벤트 초기화

    handleUrlChangeForEstateNo();

    // popstate 이벤트를 사용하여 URL 변경 감지
    window.addEventListener("popstate", function (e) {
        handleUrlChangeForEstateNo();
    });
    //getEstateListToMakeOption(); // 매물 리스트 가져와서 SelectOption list 생성
    updateCompareApplyButtonState(); // <-- 비교버튼 초기화
});

// 초기화 함수 호출
document.addEventListener("DOMContentLoaded", function () {
    initmodalDetailRow(); // 매물 상세 행 초기화
    initModalDrag();
});

function initmodalDetailRow(){
    const modalBodyScrollContent = document.querySelector('.modal-body-scroll-content');

    // 가상의 'aaa DB table'에서 가져온 property-label 목록
    // 실제로는 fetch() 등을 통해 서버에서 이 목록만 받아올 것입니다.
    const propertyLabels = [
        '매물 사진', '소재지(지번)','소재지(도로명)', '관련지번','참고사항',
        '매물구분', '거래종류', '가격', '토지면적', '건축면적',
        '총면적', '지목', "용도지역", '용적률', '건폐율',
        '층수', '구조', '사용승인일', '주차 가능 대수', '주용도',
        '실제 사용용도', '월 관리비', '융자금', '도로여건', '전기',
        '용수', '건물층고', '특장점', '상세 설명'
    ]; // 총 29개 항목

    /**
     * 하나의 빈 매물 상세 정보 행을 생성하는 함수
     * property-label만 채우고, value와 compare 영역은 비워둡니다.
     * @param {string} labelText - property-label에 들어갈 텍스트
     * @returns {HTMLElement} - 생성된 div.property-detail-row 요소
     */
    function createEmptyPropertyDetailRow(labelText) {
        // 1. 최상위 div.property-detail-row 생성
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('property-detail-row');

        // 2. div.property-label.column-left 생성 및 텍스트 설정
        const labelDiv = document.createElement('div');
        labelDiv.classList.add('property-label', 'column-left');
        labelDiv.textContent = labelText; // DB에서 가져온 라벨 텍스트 설정

        // 3. div.property-values.column-center 생성
        const valuesDiv = document.createElement('div');
        valuesDiv.classList.add('property-values', 'column-center');

        // 4. div.property-value-item 두 개 생성 (내용은 비워둡니다)
        const valueItem1 = document.createElement('div');
        valueItem1.classList.add('property-value-item');
        // valueItem1.textContent = ''; // 기존 로직에서 채워질 예정이므로 비워둠

        const valueItem2 = document.createElement('div');
        valueItem2.classList.add('property-value-item');
        // valueItem2.textContent = ''; // 기존 로직에서 채워질 예정이므로 비워둠

        // property-values에 value-items 추가
        valuesDiv.appendChild(valueItem1);
        valuesDiv.appendChild(valueItem2);

        // 5. div.property-compare.column-right 생성 (내용은 비워둡니다)
        const compareDiv = document.createElement('div');
        compareDiv.classList.add('property-compare', 'column-right');
        // compareDiv.textContent = ''; // 기존 로직에서 채워질 예정이므로 비워둠

        // 6. 모든 요소를 rowDiv에 추가
        rowDiv.appendChild(labelDiv);
        rowDiv.appendChild(valuesDiv);
        rowDiv.appendChild(compareDiv);

        return rowDiv; // 완성된 빈 행 요소 반환
    }

    // property-label 목록을 순회하며 빈 행들을 동적으로 생성하여 추가
    propertyLabels.forEach(label => {
        const rowElement = createEmptyPropertyDetailRow(label);
        modalBodyScrollContent.appendChild(rowElement);
    });
}; // 매물 상세 행 초기화
/**
 * 페이지 로드 시 ModalDrag 초기화 실행
 */
function initModalDrag() {
    const modal = document.querySelector("#compareModal .compare-modal-content");
    const header = document.querySelector("#compareModal .compare-modal-header");

    let isDragging = false;
    let initialMouseX, initialMouseY; // 마우스 클릭 시점의 좌표
    let initialModalX, initialModalY; // 모달의 현재 transform X, Y 값
    let currentTranslateX = 0; // 모달의 현재 transform X 값
    let currentTranslateY = 0; // 모달의 현재 transform Y 값

    // 모달의 초기 transform 값을 파싱하는 함수 (CSS에서 설정된 -50%, -50%를 가져옴)
    function getTranslateValues(element) {
        const style = window.getComputedStyle(element);
        const matrix = new DOMMatrixReadOnly(style.transform);
        return {
            x: matrix.m41,
            y: matrix.m42
        };
    }

    // 모달의 초기 위치를 설정 (CSS의 translate(-50%, -50%)를 기준으로)
    // 이 부분은 모달이 처음 열릴 때 한 번만 호출되거나,
    // 모달이 닫혔다가 다시 열릴 때 초기화되어야 합니다.
    const initialTransform = getTranslateValues(modal);
    currentTranslateX = initialTransform.x;
    currentTranslateY = initialTransform.y;


    header.addEventListener("mousedown", function (e) {
        isDragging = true;
        initialMouseX = e.clientX;
        initialMouseY = e.clientY;

        // 드래그 시작 시점의 모달의 현재 transform 값을 가져옴
        const currentTransform = getTranslateValues(modal);
        initialModalX = currentTransform.x;
        initialModalY = currentTransform.y;

        modal.style.transition = "none"; // 드래그 중에는 애니메이션 제거
        modal.style.cursor = "grabbing"; // 드래그 중 커서 변경
    });

    document.addEventListener("mousemove", function (e) {
        if (isDragging) {
            // 마우스 이동량 계산
            const dx = e.clientX - initialMouseX;
            const dy = e.clientY - initialMouseY;

            // 새로운 translate 값 계산
            let newTranslateX = initialModalX + dx;
            let newTranslateY = initialModalY + dy;

            // 화면 크기 및 모달 크기 계산
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const modalWidth = modal.offsetWidth;
            const modalHeight = modal.offsetHeight;

            // 모달의 왼쪽 상단 좌표 (top: 50%, left: 50% 기준)
            const modalLeft = windowWidth / 2;
            const modalTop = windowHeight / 2;

            // 모달의 실제 왼쪽 상단 모서리 좌표
            const currentModalAbsoluteX = modalLeft + newTranslateX;
            const currentModalAbsoluteY = modalTop + newTranslateY;

            // 모달의 경계 제한 (화면 밖으로 나가지 않도록)
            // left boundary
            if (currentModalAbsoluteX < 0) {
                newTranslateX -= currentModalAbsoluteX;
            }
            // top boundary
            if (currentModalAbsoluteY < 0) {
                newTranslateY -= currentModalAbsoluteY;
            }
            // right boundary
            if (currentModalAbsoluteX + modalWidth > windowWidth) {
                newTranslateX -= (currentModalAbsoluteX + modalWidth - windowWidth);
            }
            // bottom boundary
            if (currentModalAbsoluteY + modalHeight > windowHeight) {
                newTranslateY -= (currentModalAbsoluteY + modalHeight - windowHeight);
            }

            // 새로운 translate 값 적용
            modal.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px)`;

            // 현재 translate 값 업데이트 (다음 드래그 시작 시 사용)
            currentTranslateX = newTranslateX;
            currentTranslateY = newTranslateY;
        }
    });

    document.addEventListener("mouseup", function () {
        isDragging = false;
        modal.style.transition = ""; // 드래그가 끝나면 애니메이션 복원
        modal.style.cursor = "grab"; // 커서 원래대로
    });

    // .form-select2 클래스를 가진 모든 select 요소에 change 이벤트 리스너를 추가합니다.
    $(".form-select2").on("change", function() {
        // 선택된 select 요소의 ID를 가져옵니다 (예: estate_type_filter_1)
        const selectId = $(this).attr("id");
        // 선택된 option의 value 값을 가져옵니다.
        const selectedValue = $(this).val();

        // 선택된 값으로 매물 리스트를 가져오는 함수 호출
        fetchPropertyList(selectId, selectedValue);
    });

    /**
     * 매물 리스트를 서버에서 가져오는 함수 (예시)
     * @param {string} selectId - 변경된 select 요소의 ID (예: 'estate_type_filter_1')
     * @param {string} estateType - 선택된 매물 종류 값 (예: '아파트', '오피스텔' 등)
     */
    function fetchPropertyList(selectId, estateType) {
        // 여기에 실제 서버와 통신하여 매물 리스트를 가져오는 AJAX 코드를 작성합니다.
        // 예시: jQuery.ajax 또는 jQuery.get
        $.ajax({
            url: "/api/get_property_list", // 매물 리스트를 가져올 서버 API 엔드포인트
            method: "GET", // 또는 "POST"
            data: {
                select_id: selectId, // 어떤 select 박스에서 변경이 일어났는지 구분할 수 있도록 ID 전달
                estate_type: estateType // 선택된 매물 종류 값 전달
            },
            dataType: "json", // 서버 응답 데이터 형식 (JSON으로 예상)
            success: function(response) {
                //console.log(`[${selectId}] 매물 리스트 가져오기 성공:`, response);
                // 여기에 가져온 매물 리스트 데이터를 화면에 표시하는 로직을 작성합니다.
                // 예를 들어, 특정 div에 데이터를 채워 넣거나, iframe의 src를 변경할 수 있습니다.
                // if (selectId === "estate_type_filter_1") {
                //     $("#property_list_for_1").html(response.html_content);
                // } else if (selectId === "estate_type_filter_2") {
                //     $("#property_list_for_2").html(response.html_content);
                // }
            },
            error: function(xhr, status, error) {
                console.error(`[${selectId}] 매물 리스트 가져오기 실패:`, status, error);
                // 오류 처리 로직
            }
        });
    }
}

/**
 * 페이지 로드 시에도 URL 파라미터를 감지하고 estateDetail을 실행
 */
function handleUrlChangeForEstateNo() {
    const urlParams = new URLSearchParams(window.location.search);
    const estateNo = parseFloat(urlParams.get("estateNo")); // 숫자로 변환
    if (estateNo) {
        estateDetail(estateNo);
    }
}

/**************************************************
 * ************* 이벤트 초기화 관련 함수 ************* *
 **************************************************/

/**
 * 모션 이벤트 초기화 함수
 */
function initAction() {
    if ($(window).width() <= 991) {
        $(".map-content").toggleClass("active");
        $("#comparison_Button_Group").hide();
    }

    // 지도 - 옵션 - 도구사용 //
    $("#mapOptionToolOpen").click(function () {
        $(".mo-tool").fadeIn(400, "easeOutQuad");
    });
    $(".mo-tool > dl > dd > button").click(function () {
        $(".mo-tool").fadeOut(400, "easeOutQuad");
        $(".mo-tool-option").fadeOut(400, "easeOutQuad");
        // $(".mo-tool-draw-option").fadeOut(400, "easeOutQuad");
    });

    // 지도 - 옵션 - 도구사용 - 도구 //
    $("#mapOptionToolOptionOpen").click(function () {
        if ($(".mo-tool-option").css("display") == "none") {
            // 옵션 보이기
            $(".mo-tool-option").fadeIn(400, "easeOutQuad");
        } else {
            // 옵션 숨기기
            $(".mo-tool-option").fadeOut(400, "easeOutQuad");
        }
        $(this).toggleClass("active");
    });
    $("#mapOptionToolOptionClose").click(function () {
        $(".mo-tool-option").fadeOut(400, "easeOutQuad");
        $("#mapOptionToolOptionOpen").removeClass("active");
    });

    // 지도 - 옵션 - 도구사용 - 사용자그리기 //
    $("#draw_tool_btn").click(function () {
        // $(".mo-tool-draw-option").fadeIn(400, "easeOutQuad");
        $(this).toggleClass("active");
    });

    // 지도 - 컨텐츠 열고 닫기 //
    var mapContentChk = 0;
    $("#mapContentOpenClose").click(function () {
        if ($(".map-content").hasClass("active")) {
            $(".map-content").removeClass("active");
            $(".map-history").removeClass("active");
            $(".map-sale-group").removeClass("active");
            $(".map-estate-group").removeClass("active");
            $(".map-price-group").removeClass("active");
            $(".map-bg").addClass("full");
            $("#rvWrapper").addClass("full");
            $(".map-sell-view").removeClass("active");
        } else {
            $(".map-content").addClass("active");
            $(".map-history").addClass("active");
            $(".map-sale-group").addClass("active");
            $(".map-estate-group").addClass("active");
            $(".map-price-group").addClass("active");
            $(".map-bg").removeClass("full");
            $("#rvWrapper").removeClass("full");
            // $(".map-sell-view").addClass("active");
        }

        // map-bg 요소에 transitionend 이벤트 리스너 추가
        $(".map-bg").one("transitionend", function () {
            map.relayout(); // CSS 애니메이션이 완료되었을 때 트리거
        });

        // $("#mapContentOpenClose i").toggleClass("fa-rotate-180");

        // if (mapContentChk == 0) {
        //     $(".map-content").animate({ marginLeft: "-450px" }, 400, "easeOutQuad");
        //     $("#mapContentOpenClose i").addClass("fa-rotate-180");

        //     $(".map-history").animate({ marginLeft: "10px" }, 400, "easeOutQuad");
        //     mapContentChk = 1;
        // } else {
        //     $(".map-content").animate({ marginLeft: "0" }, 400, "easeOutQuad");
        //     $("#mapContentOpenClose i").removeClass("fa-rotate-180");

        //     $(".map-history").animate({ marginLeft: "460px" }, 400, "easeOutQuad");
        //     mapContentChk = 0;
        // }
    });

    // 지도 - 모바일 - 컨텐츠 열고 닫기 //
    $(".mc-mo-open-close").click(function () {
        if ($(this).hasClass("active full")) {
            $(".map-content").removeClass("active full");
            $(this).removeClass("active full");
        } else if ($(this).hasClass("active")) {
            $(".map-content").addClass("full");
            $(this).addClass("full");
        } else {
            $(".map-content").addClass("active full");
            $(this).addClass("active full");
        }
    });

    // var mapContentMoChk = 0;
    // $("#mapContentMoOpenClose").click(function () {
    //     if (mapContentMoChk == 0) {
    //         $(".map-content").animate({ top: "0", marginTop: "-1px" }, 400, "easeOutQuad");
    //         $("#mapContentMoOpenClose").css({ paddingTop: "3px", background: "#fff" });
    //         $("#mapContentMoOpenClose i").addClass("fa-rotate-180");
    //         mapContentMoChk = 1;
    //     } else {
    //         $(".map-content").animate({ top: "100%", marginTop: "-25px" }, 400, "easeOutQuad");
    //         $("#mapContentMoOpenClose").css({ paddingTop: "5px", background: "#fff" });
    //         $("#mapContentMoOpenClose i").removeClass("fa-rotate-180");
    //         mapContentMoChk = 0;
    //     }
    // });

    // 지도 - 이력관리 //
    $("#mapHistoryOpen").click(function () {
        $(".mh-list").toggleClass("active");
    });
    $(".mh-list > dl > dd > button").click(function () {
        $(".mh-list").toggleClass("active");
    });

    // 지도 - 공유 //
    $("#mapShareOpen").click(function () {
        $("#mapShare").slideToggle(200, "easeOutQuad").toggleClass("active");
    });

    // 지도 - 공유 - 닫기 //
    $("#mapShareClose").click(function () {
        $("#mapShare").slideUp(200, "easeOutQuad").removeClass("active");
    });

    // 지도 - 인쇄 //
    $("#print_btn").click(function () {
        $(".print-opt").slideToggle(200, "easeOutQuad").toggleClass("active");
    });
    $(".print-opt").on("click", ".close-btn", function () {
        $(".print-opt").slideUp(200, "easeOutQuad").removeClass("active");
    });

    // 지도 - 지도선택
    $(".map-select-group").on("click", "button", function () {
        // 네 번째 버튼인지 확인
        if ($(this).is(":nth-child(4)")) {
            $(this).toggleClass("active");
            return; // 네 번째 버튼이면 아무 작업도 하지 않음
        } else if ($(this).is(":nth-child(5)")) {
            return;
        } else {
            $(".map-select-group button").not(":nth-child(4)").removeClass("active");
            $(this).addClass("active");
        }
    });

    // 지도 - estate 선택 20250627
    $(".map-estate-group").on("click", "button", function () {
        const clickedButton = $(this);
        const allButtons = $(".map-estate-group button");
        const allToggleButton = allButtons.eq(0); // 첫 번째 버튼을 '전체' 버튼으로 간주
        const nonAllButtons = allButtons.not(allToggleButton); // '전체' 버튼을 제외한 나머지 버튼들

        // 0. 전체 버튼 (첫 번째 버튼) 클릭 시 로직
        if (clickedButton.is(allToggleButton)) {
            // 1. 첫 번째 버튼('전체')이 클릭되었을 때
            if (allToggleButton.hasClass("active")) {
                // '전체' 버튼이 이미 활성화 상태였다면, 토글하여 비활성화
                allToggleButton.removeClass("active");
                nonAllButtons.removeClass("active"); // 나머지 모든 버튼 비활성화
                //allButtons.eq(1).addClass("active"); // 두 번째 버튼만 활성화 (요구사항 1.2)
            } else {
                // '전체' 버튼이 비활성화 상태였다면, 토글하여 활성화
                allToggleButton.addClass("active");
                nonAllButtons.addClass("active"); // 나머지 모든 버튼 활성화 (요구사항 1.1)
            }
        } else {
            // '전체' 버튼이 아닌 다른 버튼이 클릭되었을 때
            clickedButton.toggleClass("active"); // 클릭된 버튼의 active 상태 토글

            // 나머지 버튼들의 상태를 확인하여 '전체' 버튼의 상태를 결정
            let allOthersAreActive = true;
            nonAllButtons.each(function() {
                if (!$(this).hasClass("active")) {
                    allOthersAreActive = false;
                    return false; // 하나라도 비활성화된 버튼이 있으면 루프 중단
                }
            });

            if (allOthersAreActive) {
                // 3. '전체' 버튼이 아닌 나머지 버튼들이 모두 활성화되면 '전체' 버튼도 활성화
                allToggleButton.addClass("active");
            } else {
                // 2. '전체' 버튼 이외에 하나라도 비활성화된 버튼이 있으면 '전체' 버튼 비활성화
                allToggleButton.removeClass("active");
            }
        }
        estateNewList();
    });
    // 지도 - sale 선택 20250627
    $(".map-sale-group button").on("click", function() {
        // 클릭된 버튼의 active 클래스를 토글합니다.
        // active 클래스가 없으면 추가하고, 있으면 제거합니다.
        $(this).toggleClass("active");
        estateNewList();
    });

    // 지도 - 매물상세 - 열기 //
    $(".mcs-list").on("click", "dl", function (e) {
        // 클릭한 대상이 agency-name이면 중단
        if ($(e.target).closest(".agency-name").length) {
            e.stopPropagation();
            return;
        }
        
        $(".map-sell-view").addClass("active");

        // $(".map-sell-view").animate({ marginLeft: "450px" }, 400, "easeOutQuad");
        // setTimeout(() => {
        //     $(".map-sell-view").css({ zIndex: "100" });
        // }, 400);
    });

    // 지도 - 매물상세 - 닫기 //
    $(".msv-close button").click(function () {
        $(".map-sell-view").removeClass("active");
        // $(".map-sell-view").animate({ marginLeft: "-520px" }, 400, "easeOutQuad");
        // $(".map-sell-view").css({ zIndex: "98" });
    });

    // if ($(window).width() > 991) {
    // } else {
    //     $(".mc-sell > dl").click(function () {
    //         $(".map-sell-view").addClass("active");
    //         // $(".map-sell-view").animate({ top: "0" }, 400, "easeOutQuad");
    //     });

    //     $(".msv-close").click(function () {
    //         $(".map-sell-view").removeClass("active");
    //         // $(".map-sell-view").animate({ top: "100%" }, 400, "easeOutQuad");
    //     });
    // }

    // Top 플로팅 버튼 숨기기
    $("#list_top_btn").fadeOut(); // 스크롤이 내려가면 버튼을 보여줌
    $("#detail_top_btn").fadeOut(); // 스크롤이 내려가면 버튼을 보여줌

    // 스크롤이 최상위가 아닐 때 버튼을 보여주고, 최상위일 때 버튼을 감춤
    $(".mc-sell").on("scroll", function () {
        if ($(this).scrollTop() > 0) {
            $("#list_top_btn").fadeIn(); // 스크롤이 내려가면 버튼을 보여줌
        } else {
            $("#list_top_btn").fadeOut(); // 스크롤이 최상단일 때 버튼을 숨김
        }
    });
    $("#msv_content").on("scroll", function () {
        if ($(this).scrollTop() > 0) {
            $("#detail_top_btn").fadeIn(); // 스크롤이 내려가면 버튼을 보여줌
        } else {
            $("#detail_top_btn").fadeOut(); // 스크롤이 최상단일 때 버튼을 숨김
        }
    });

    // 매물 리스트 - Top 플로팅 버튼
    $("#list_top_btn").on("click", function () {
        $(".mc-sell").animate({ scrollTop: 0 }, "slow"); // 부드러운 스크롤
    });

    // 매물 상세 - Top 플로팅 버튼
    $("#detail_top_btn").on("click", function () {
        $("#msv_content").animate({ scrollTop: 0 }, "slow"); // 부드러운 스크롤
    });
    
    // 모달이 열릴 때 스크롤바 너비를 계산하여 적용하는 함수
    function adjustScrollbarWidth() {
        const scrollContent = document.querySelector(".modal-body-scroll-content");
        const header = document.querySelector(".modal-body-header");
        const footer = document.querySelector(".modal-body-footer");

        if (scrollContent && header && footer) {
            // 스크롤바 너비 계산
            // 요소의 실제 너비 (패딩, 스크롤바 포함) - 요소의 클라이언트 너비 (패딩 포함, 스크롤바 제외)
            const scrollbarWidth = scrollContent.offsetWidth - scrollContent.clientWidth;

            // 계산된 스크롤바 너비만큼 margin-right 적용
            header.style.marginRight = `${scrollbarWidth}px`;
            footer.style.marginRight = `${scrollbarWidth}px`;
        }
    }
    //==================매물비교
    // '매물비교' 버튼 클릭 시 모달 표시
    $("#compare_open_btn").on("click", function () {
        $("#compareModal").fadeIn(function() { // fadeIn 애니메이션 완료 후 실행
            // ... 기존 모달 위치 조정 코드 ...
            // 스크롤바 너비 조정 함수 호출
            adjustScrollbarWidth();
            // (선택 사항) 윈도우 크기 변경 시에도 스크롤바 너비 조정
            // 모달이 열려 있는 동안만 이벤트 리스너를 추가하고, 닫힐 때 제거하는 것이 효율적입니다.
            $(window).on('resize.modalScrollbar', adjustScrollbarWidth);

            // 2. 모달의 HTML 구조가 완전히 로드되고 표시된 후에 make_compareList 호출
            make_compareList(compareList); // 비교 목록 가져와 작성하기
        });
        
    });

    // '비교매물 삭제' 버튼 클릭 시 
    $("#compare_clear_btn").on("click", function () {
        // 1. 현재 compareList에 있는 모든 매물에 대해 하이라이트 및 체크박스 해제
        compareList.data.forEach(item => {
            const estateNo = item.estateNo;
            // 해당 DL 요소를 찾아서 하이라이트 클래스 제거
            $(`.mcs-list dl[data-estate-no="${estateNo}"]`).removeClass('dl-highlight-border');
            // 해당 매물의 체크박스도 'checked' 상태 해제
            $(`.mcs-list dl[data-estate-no="${estateNo}"] .check-box-orange-s input[type="checkbox"]`).prop('checked', false);
        });

        // 2. compareList 데이터 초기화
        compareList.data = [];

        // 3. 비교 목록 UI 업데이트 (비어있는 상태로)
        displayCompareList();

    });
    
    // '닫기' 버튼 클릭 시 모달 숨기기
    $(".compare-close-button").on("click", function () {
        //$("#compareModal").fadeOut(); // 모달을 서서히 사라지게 함
        $("#compareModal").fadeOut(function() {
            // 모달이 닫힐 때 resize 이벤트 리스너 제거
            $(window).off('resize.modalScrollbar');
            // 적용했던 margin-right 초기화 (선택 사항, 다음 열릴 때 다시 계산되므로)
            $(".modal-body-header, .modal-body-footer").css('margin-right', '');
        });
    });

    // '비교하기' 버튼 클릭 시 추가 로직 실행
    $("#compare_apply_btn").on("click", function () {
        console.log("비교하기 버튼 클릭됨");
        // 여기에 비교 로직을 추가하세요
        //$("#compareModal").fadeOut(); // 모달 닫기
    });

    // 모달 오버레이 클릭 시 모달 숨기기
    $(".compare-modal-overlay").on("click", function () {
        //$("#compareModal").fadeOut(); // 모달을 서서히 사라지게 함
        $("#compareModal").fadeOut(function() {
            // 모달이 닫힐 때 resize 이벤트 리스너 제거
            $(window).off('resize.modalScrollbar');
            // 적용했던 margin-right 초기화 (선택 사항, 다음 열릴 때 다시 계산되므로)
            $(".modal-body-header, .modal-body-footer").css('margin-right', '');
        });
    });

    
}


/**
 * 검색 관련 이벤트 초기화 함수
 */
function initSearchEvents() {
    // 검색바 - 입력
    $(document).on(
        "keyup",
        "#search_input, #search_input_mobile",
        debounce(function (e) {
            const { resultListItems, searchBox, searchInput } = getSearchElements();
            const searchTerm = $(this).val().trim(); // 검색어 입력값
            const selectedIndex = resultListItems.index($(".selected")); // 현재 `selected` 클래스가 적용된 항목 찾기

            // 좌우 방향키는 무시
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                return;
            }

            // 위아래 방향키 처리
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault(); // 화살표 키가 눌렸을 때 기본 동작을 차단 (커서 이동 방지)
                e.stopPropagation(); // 이벤트 버블링 방지

                // 커서 위치를 유지 (화살표 키에 의한 커서 이동 차단)
                const cursorPositionStart = searchInput[0].selectionStart;
                const cursorPositionEnd = searchInput[0].selectionEnd;

                upDownEvent(e, searchTerm, resultListItems, selectedIndex);

                // 화살표 키 이벤트 후에도 커서 위치를 원래대로 유지
                searchInput[0].setSelectionRange(cursorPositionStart, cursorPositionEnd);
                return; // 위아래 방향키 처리 후 종료
            }

            // Enter 키가 눌렸을 때
            if (e.key === "Enter") {
                e.preventDefault(); // Enter 키로 인해 폼이 제출되는 것을 방지
                // enterEvent(e, searchTerm, resultListItems, selectedIndex);   cis del 200701
                resultListItems.eq(selectedIndex).click(); // selected된 리스트 항목 클릭 cis add 200701
                return;
            }

            // Enter 키가 아닌 경우, 키워드 검색 실행  // realprice.js 와 차이있음(20250701)
            if (/^\d+$/.test(searchTerm)) {
                searchBox.slideUp(100, "easeOutQuad");
                searchPlacesExecuted = false; // searchPlaces()가 실행되지 않음
            } else {
                searchPlaces();
                searchPlacesExecuted = true; // searchPlaces()가 실행되었음
            }
        }, 100)
    );

    // 검색바 - 클릭
    $(document).on("click", "#search_input, #search_input_mobile", function () {
        const { searchBox } = getSearchElements();
        if (searchBox.find("ul li").length > 0) {
            searchBox.slideDown(100, "easeOutQuad");
        }
    });

    // 모바일 - 검색바 - 돋보기   // realprice.js 와 차이있음(20250701)
    $(document).on("click", "#search_btn_mobile", function (e) {
        const { resultListItems, searchInput } = getSearchElements();
        const searchTerm = searchInput.val().trim(); // 검색어 입력값
        const selectedIndex = resultListItems.index($(".selected")); // 현재 `selected` 클래스가 적용된 항목 찾기
        //enterEvent(e, searchTerm, resultListItems, selectedIndex);    cis del 200701
        resultListItems.eq(selectedIndex).click(); // selected된 리스트 항목 클릭   cis add 200701
    });

    // 바디(검색바 제외) - 클릭
    $("body").click(function (e) {
        const { searchBox, searchInput } = getSearchElements();

        // 클릭한 대상이 #search_input 또는 그 자식 요소인 경우
        if (searchInput.is(e.target) || searchInput.has(e.target).length) {
            return;
        }

        // 검색결과 숨김
        if (searchBox.css("display") == "block") {
            searchBox.slideUp(100, "easeOutQuad");
        }
    });

    // '검색위치로' 버튼 클릭 이벤트    cis add 200701(아래함수 전체추가)
    $("#search_return_btn").on("click", function () {
        let places = JSON.parse(sessionStorage.getItem("lastSearchedPlace"));

        if (Object.keys(places).length > 0) {
            // 필요한 파라미터 및 쿠키를 한 번에 업데이트합니다
            updateURL({
                curLat: places.y,
                curLng: places.x,
            });

            // URL 변경 후 즉시 파라미터를 체크하고 로그 출력
            handleUrlChange();

            // 이동할 위도 경도 위치를 생성합니다
            var moveLatLon = new kakao.maps.LatLng(places.y, places.x);

            // 지도 중심을 이동 시킵니다
            map.panTo(moveLatLon);

            // 법정동 상세 주소 정보를 요청
            searchDetailAddrFromCoords(moveLatLon, displayAddressInfo);
            searchArroundPlaces({ lat: places.y, lng: places.x }); // 주변 시설 정보 가져오기
        } else {
            $("#modalAlert").iziModal("open");
            $("#alert_message").html("<h2>이동할 <span>검색 위치</span>가 없습니다.</h2>");
        }
    });
}

/**
 * 기타 이벤트 초기화 함수
 */
function initHandleEvents() {
    // 필터 - 적용
    $("#filter_apply_btn").on("click", function () {
        //stateList();
        estateNewList();
    });

    // 필터 - 초기화
    $("#filter_reset_btn").on("click", function () {
        resetFilters();
    });

    // 합필분석 버튼 클릭 시
    $("#mapOptionLandOpen").on("click", function () {
        // "landDetail" 이벤트의 요청을 강제로 중단
        abortRequest("landDetail");

        if ($(".mo-land").hasClass("active")) {
            clearAllPolygons();
            isMultiSelectMode = true;
        } else {
            isMultiSelectMode = false;
            clearAllPolygons();
        }
        landWFSArrays = [];
        $(".ml-info").empty();
        landAnalysisTotal();
    });

    // 도구사용 - 지도출력
    $("#print_map_btn").on("click", function () {
        printDiv("map_bg");
    });

    // 도구사용 - 이미지저장
    $("#save_img_btn").on("click", function () {
        saveMap("map_bg");
    });

    // 좌측 상세 레이어 - 공유 - 카카오톡
    $("#kakaotalk_sharing_btn").on("click", function () {
        initShareEvents();
    });

    // 좌측 상세 레이어 - 공유 - 복사
    $("#copy_url_btn").on("click", function () {
        copyUrl();
    });

    // 좌측 상세 레이어 - 찜
    $("#favorite_btn").on("click", function () {
        const button = $(this);
        toggleFavorite(button);
    });

    // 좌측 상세 레이어 - 인쇄
    $("#print_confirm_btn").on("click", function () {
        printSelectedSections(); // 선택된 섹션들만 인쇄 처리
    });

    // 이력관리
    $("#mapHistoryOpen").on("click", function () {
        getRescentHistory();
    });

    // 이력관리 - 삭제
    $(document).on("click", ".remove-history-btn", function () {
        const btn = $(this);
        removeHistory(btn);
    });

    // 이력관리 - 더보기
    $(".mhl-more-btn").on("click", function () {
        $(this).closest("div").find("dl.d-none").removeClass("d-none");
    });

    // 이력관리 - 주소
    $(document).on("click", ".history-address", function () {
        const lat = $(this).attr("data-lat");
        const lng = $(this).attr("data-lng");
        const coords = new kakao.maps.LatLng(lat, lng);

        map.setCenter(coords);
        map.setLevel(4);
        updateURL({ curLat: lat, curLng: lng }); // url 파라미터 및 쿠키 변경

        // 주소 요청
        // geocoder.coord2Address(coords.getLng(), coords.getLat(), function (result, status) {
        //     if (status === kakao.maps.services.Status.OK) {
        //         displayAddressInfo(result, status); // 지도 주소 정보 바인딩
        //     }
        // });

        // searchDetailAddrFromCoords(new kakao.maps.LatLng(lat, lng), function (result, status) {
        //     if (status === kakao.maps.services.Status.OK) {
        //         displayAddressInfo(result, status); // 지도 주소 정보 바인딩
        //     }
        // });
    });

    // 이력관리 - 마커
    $(".history-marker").on("click", function () {
        const btn = $(this);
        onHistoryMarkers(btn); // 이력 관리 마커 지도에 올리기
    });

    // 이력관리 - 마커 제거
    $("#remove_history_marker").on("click", function () {
        historyMarkers.forEach((marker) => marker.setMap(null)); // 기존 마커를 모두 제거한다.
    });
}

/**************************************************
 * *************** 매물 관련 함수 *************** *
 **************************************************/

/**
 * 매물 리스트 관련 이벤트 초기화
 */
function initListEvents() {
    // 매물 리스트 - 더보기
    $("#more_btn").on("click", function () {
        //estateList();
        estateNewList();
    });

    // 매물 리스트 - 매물
    $(".mcs-list").on("click", "dl", function (e) {
        // 클릭한 대상이 agency-name이면 중단
        if ($(e.target).closest(".agency-name").length) {
            e.stopPropagation();
            return;
        }

        const estateNo = $(this).attr("data-estate-no");
        updateURL({ estateNo: estateNo });
        // estateDetail(estateNo);
    });

    $(".mcs-list").on("click", ".agency_name", function () {
        const estateNo = $(this).attr("data-estate-no");
        //estateList("", estateNo);
        estateNewList("", estateNo);        
    });

    $('.mcs-list').on('click', '.check-box-orange-s', function(e) {
        e.stopPropagation(); // 클릭 이벤트가 <dl>로 버블링되는 것을 막습니다.
        // 이 핸들러에서는 이것만 하면 됩니다.
        // 체크박스 상태 변경 로직은 아래의 'change' 핸들러에서 처리됩니다.
    });

    $('.mcs-list').on('change', '.check-box-orange-s input[type="checkbox"]', function(e) {
        if($(window).width() <= 991) {
            return; // 모바일에서는 체크박스 클릭 이벤트를 무시합니다.
        }
        // 가장 먼저 이벤트 전파를 중단합니다.
        e.stopPropagation(); 
        // 'this'는 실제로 변경된 체크박스 요소를 가리킵니다.
        const parentDl = $(this).closest('dl'); // jQuery의 closest()를 사용하여 가장 가까운 상위 <dl> 요소를 찾습니다.
    
        if (parentDl.length) {
            // --- 여기에 상세정보 표시 닫기 로직 추가 ---
            // 1. 만약 상세정보를 담는 div가 id="map_sell_view" 라면:
            // 상세정보 표시 닫기 로직
            $(".map-sell-view").removeClass("active");

            const estateNo = Number(parentDl.data('estate-no')); // <-- 여기를 Number()로 감쌉니다.
            // 매물 유형과 주소 정보 추출
            const saleType = parentDl.find('h2 .label-default').text().trim(); // 매물 유형 (예: 매매, 임대, 전세)
            // estateType (예: 상가, 건물, 토지)을 추출하는 새로운 로직
            // h2 내부의 첫 번째 div (d-flex align-items-center gap-1)를 찾고
            // 그 div의 contents 중에서 span.label-default 다음의 텍스트 노드를 찾습니다.
            const estateCategoryDiv = parentDl.find('h2 > div.d-flex.align-items-center.gap-1');
            let estateType = '';
            if (estateCategoryDiv.length) {
                // div 내부의 모든 자식 노드를 순회하며 텍스트 노드를 찾습니다.
                // label-default 다음의 텍스트 노드가 우리가 찾는 estate_type 입니다.
                estateCategoryDiv.contents().each(function() {
                    if (this.nodeType === 3) { // 텍스트 노드인 경우
                        const textContent = $(this).text().trim();
                        if (textContent.length > 0) {
                            // 첫 번째 유효한 텍스트 노드를 estateType으로 간주
                            // 이 로직은 sateTypeHtml 다음에 바로 data.estate_type 텍스트가 올 때 유효합니다.
                            estateType = textContent;
                            return false; // each 루프 종료
                        }
                    } else if ($(this).hasClass('label-default')) {
                        // label-default를 만나면 다음 텍스트 노드를 찾기 위해 계속 진행
                    }
                });
            }

            // 주소는 기존처럼 ms-md-auto 클래스에서 추출
            const address = parentDl.find('h2 .ms-md-auto').text().trim(); // 주소

            if (this.checked) {
                if(compareList.data.length >= 2) {
                    // 이미 비교 매물이 2개 이상인 경우, 체크박스 상태를 원래대로 되돌립니다.
                    $(this).prop('checked', false);
                    alert("비교 매물은 최대 2개까지 선택할 수 있습니다.");
                    parentDl.removeClass('dl-highlight-border');
                    return;
                }
                else if (compareList.data.length === 1) {
                    // 이미 1개의 매물이 선택되어 있다면, 매물 유형(estateType)이 동일한지 확인
                    const existingEstateType = compareList.data[0].estateType;
                    if (existingEstateType !== estateType) {
                        $(this).prop('checked', false); // 체크박스 체크 해제
                        alert("매물 비교는 동일한 매물구분(유형)만 비교할 수 있습니다.");
                        // 하이라이트도 제거
                        parentDl.removeClass('dl-highlight-border');
                        return; // 함수 종료
                    }
                }
                if (!compareList.data.some(item => item.estateNo === estateNo)) { // 중복 추가 방지
                    compareList.data.push({
                        estateNo: estateNo,
                        estateType: estateType, // '매매 type(예: 상가, 건물,토지...)
                        saleType: saleType,     // 매물 유형 (예: 매매, 임대, 전세)
                        address: address
                    });
                }
                parentDl.addClass('dl-highlight-border');
    
            } else {
                parentDl.removeClass('dl-highlight-border');
                // 목록에서 제거
                compareList.data = compareList.data.filter(item => item.estateNo !== estateNo);
            }
            displayCompareList();           
        }
    });

    // 지도 - 매물상세 - 닫기 //
    $(".msv-close").click(function () {
        updateURL({ estateNo: "" });
        // handleUrlChangeForEstateNo();
    });

    $("#msv_content").on("click", ".agency_name", function () {
        const estateNo = $("#map_sell_view .msv-info .estate-no").text();
        //estateList("", estateNo);
        estateNewList("", estateNo);
    });
}

// displayCompareList 함수 정의
function displayCompareList() {
    
    const $comparedItemsDisplay = $('#comparedItemsDisplay'); // 비교매물 목록을 표시할 컨테이너
    $comparedItemsDisplay.empty(); // 기존 내용 모두 지우기

    if (compareList.data.length === 0) {
        // 비교매물이 없으면 아무것도 표시하지 않거나, "비교매물 없음" 같은 메시지 표시
        $("#compare_clear_btn").hide(); // 비교매물삭제 버튼 삭제
        
    } else {
        compareList.data.forEach(item => {
            const itemText = `비교 매물번호: ${item.estateNo},  ${item.estateType}`;
            const $span = $('<span>').text(itemText);
            $comparedItemsDisplay.append($span);
        });
        $("#compare_clear_btn").show(); // 비교매물삭제 버튼 추가
        
    }
    updateCompareApplyButtonState();
}

/**
 * compare_apply_btn 버튼의 활성화/비활성화 상태를 업데이트합니다.
 * compareList.data.length가 2일 때만 버튼을 활성화합니다.
 */
function updateCompareApplyButtonState() {
    const $compareApplyBtn = $('#compare_open_btn'); // 버튼의 ID가 compare_apply_btn이라고 가정합니다.

    if ($compareApplyBtn.length === 0) {
        // 버튼이 존재하지 않으면 아무것도 하지 않습니다. (초기 HTML에 버튼이 없는 경우 대비)
        return;
    }
    
    if (compareList.data.length === 2) {
        $compareApplyBtn.prop('disabled', false); // 버튼 활성화
        // $compareApplyBtn.removeClass('disabled-style'); // 필요시 비활성화 스타일 제거
        $compareApplyBtn.removeClass('disabled-style'); // 필요시 비활성화 스타일 제거
    } else {
        $compareApplyBtn.prop('disabled', true); // 버튼 비활성화
        // $compareApplyBtn.addClass('disabled-style'); // 필요시 비활성화 스타일 추가
        $compareApplyBtn.addClass('disabled-style'); // 필요시 비활성화 스타일 추가
    }
}
/**
 * 매물 리스트 가져오는 함수
 * @param {*} searchNo = 매물번호 검색
 */
async function estateList(searchNo = "", propertyNo = "") {
    const filterObj = collectFilterParams(); // 필터

    const li = $(".mcs-list");

    const start = li.children("dl").length;
    const bounds = map.getBounds(); // 지도의 현재 영역을 얻어옵니다

    const swLatLng = bounds.getSouthWest(); // 영역의 남서쪽 좌표를 얻어옵니다
    const neLatLng = bounds.getNorthEast(); // 영역의 북동쪽 좌표를 얻어옵니다
    const dataObj = {
        ...filterObj,
        searchNo: searchNo,
        propertyNo: propertyNo,
        swLat: swLatLng.getLat(),
        swLng: swLatLng.getLng(),
        neLat: neLatLng.getLat(),
        neLng: neLatLng.getLng(),
        // start: start,
    };

    callApiAbort("/front/back/sell/estate_list.php", "POST", dataObj, "estateList")
        .then((response) => {
            if (!response) return;

            const { statusCode, message, responseData } = response;
            if (statusCode !== 200) return;

            // 모든 클러스터러 초기화
            Object.values(clusterersByType).forEach((clusterer) => clusterer.clear());

            let liHtml = "";
            if (!Array.isArray(responseData) || responseData.length === 0) {
                liHtml = `
                    <div class="no_data_area_inner d-flex flex-column justify-content-center gap-3 text-center position-absolute" style="top:50%; left:50%; transform: translate(-50%, -50%);">
                        <svg xmlns="http://www.w3.org/2000/svg" height="3em" viewBox="0 0 512 512">
                            <!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" style="fill: var(--var-color-main-1)"></path>
                        </svg>
                        <p>매물이 없습니다.</p>
                    </div>`;
                    $("#compare_open_btn").hide(); // 매물이 없을 때 비교하기 버튼 숨김
            } else {
                // 리스트 생성 및 렌더링
                $("#compare_open_btn").show(); // 매물이 있을 때 비교하기 버튼 보임
                liHtml = responseData.map(function (data, index) {
                    if (searchNo && index === 0) {
                        map.panTo(new kakao.maps.LatLng(data.lat, data.lng));
                    }

                    const zoomLevel = map.getLevel();

                    // 1-1. 클러스터러 생성 또는 가져오기
                    let clusterer = null;
                    if (zoomLevel > 5) {
                        clusterer = createClustererAll("all");
                    } else {
                        clusterer = createClusterer(data.estate_type, data.sale_type);
                    }
                    // 1-2. 마커 생성
                    const marker = createClusteredMarker(data);
                    // 1-3. 클러스터러에 마커 추가
                    clusterer.addMarker(marker);

                    // 전속 매물 여부에 따른 시각적 구분
                    const isExclusive = data.exclusive_building === "Y";
                    let estateTypeClass = isExclusive ? "exclusive" : "non-exclusive";

                    // 2. 리스트 생성
                    let sateTypeHtml = "";
                    let priceHtml = "";
                    switch (data.sale_type) {
                        case "임대":
                            sateTypeHtml = `<span class="label-default bg-violet1">임대</span>`;
                            priceHtml = `<span class="text-nowrap">${formatPrice(data.sale_price, "all", true)}</span> / <span class="text-nowrap">${formatPrice(data.rent_price, "all", true)}</span>`;
                            break;
                        case "매매":
                            sateTypeHtml = `<span class="label-default bg-green1">매매</span>`;
                            priceHtml = `${formatPrice(data.sale_price, "all", true)}`;
                            break;
                        case "교환":
                            sateTypeHtml = `<span class="label-default bg-indigo1">교환</span>`;
                            priceHtml = `${formatPrice(data.sale_price, "all", true)}`;
                            break;
                    }

                    let estateHtml = data.estate_type;
                    
                    let addressHtml = "";  //지번 주소
                    if (data.address_jibun) {
                        let address_temp = data.address_jibun;
                        address_temp = cutAfterSuffix(data.address_jibun);  //'리', '동', '길', '로' 이하 삭제 
                        addressHtml = `<span class="ms-md-auto">${address_temp}</span>`; 
                    } else {
                        addressHtml = `<span class="text-end">주소 정보 없음</span>`;
                    }
                    
                    let areaHtml = "";
                    switch (data.estate_type) {
                        case "토지":
                            areaHtml = formatArea(data.platArea);
                            break;
                        default:
                            areaHtml = formatArea(data.totArea);
                    }

                    let image = "";
                    if (data.imageArray.length > 0) {
                        const imageUrl = `/front/back/00-include/image.php?token=${encodeURIComponent(data.imageArray[0].imageToken)}`;
                        if (data.imageArray[0].fileType === "image") {
                            image = `<img src="${imageUrl}" alt="" width="100" onerror="this.onerror=null;this.src='/front/assets/image/building_empty.png';">`;
                        } else if (data.imageArray[0].fileType === "video") {
                            image = `<video muted width="100%" class="img-fluid mx-auto rounded">
                                        <source src="${imageUrl}" type="video/mp4" class="h-100">
                                        Your browser does not support the video tag.
                                    </video>`;
                        } else {
                            image = '<img src="/front/assets/image/building_empty.png" width="100%" alt="" title="" />';
                        }
                    } else {
                        image = '<img src="/front/assets/image/building_empty.png" width="100%" alt="" title="" />';
                    }

                    return `
                        <dl class="${estateTypeClass}" data-estate-no="${data.estate_no}">
                            <dt>
                                <h2 class="d-flex align-items-center gap-1">${sateTypeHtml} ${data.estate_type} ${addressHtml}</h2>
                                <ul>
                                    <li>${priceHtml}</li>
                                    <li class="text-nowrap">${areaHtml}</li>
                                </ul>
                                <div>
                                    <p class="text-clamp">${data.description ? data.description : "매물설명 없음"}</p>
                                </div>
                                <dl>
                                    <dt class="agency-name" data-estate-no="${data.estate_no}"><button type="button">${data.agency_name}</button></dt>
                                    <dd>등록일. ${data.reg_date}</dd>
                                </dl>
                            </dt>
                            <dd>${image}</dd>
                        </dl>`;
                });

                // if (responseData.length < 100) {
                //     $("#more_btn").hide();
                // }
            }

            // 기존 리스트를 부드럽게 사라지게 처리
            li.children("dl")
                .fadeOut(100)
                .promise()
                .done(function () {
                    // 리스트가 완전히 사라진 후 새로운 리스트를 추가
                    li.empty().append(liHtml);

                    // 새롭게 추가된 리스트를 부드럽게 나타나게 함
                    li.children("dl")
                        .hide() // 먼저 숨긴 상태에서
                        .delay(150) // 항목마다 100ms씩 지연
                        .fadeIn(400); // 순차적으로 부드럽게 나타나게 설정
                });
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * 매물 리스트 가져오는 함수(멀티필터)
 * @param {*} searchNo = 매물번호 검색
 */
async function estateNewList(searchNo = "", propertyNo = "") {
    const filterObj = collectMultiFilterParams(); // 필터

    const li = $(".mcs-list");

    const start = li.children("dl").length;
    const bounds = map.getBounds(); // 지도의 현재 영역을 얻어옵니다

    const swLatLng = bounds.getSouthWest(); // 영역의 남서쪽 좌표를 얻어옵니다
    const neLatLng = bounds.getNorthEast(); // 영역의 북동쪽 좌표를 얻어옵니다
    const dataObj = {
        ...filterObj,
        searchNo: searchNo,
        propertyNo: propertyNo,
        swLat: swLatLng.getLat(),
        swLng: swLatLng.getLng(),
        neLat: neLatLng.getLat(),
        neLng: neLatLng.getLng(),
    };

    let liHtml = "";

    callApiAbort("/front/back/sell/estate_multfilter_list.php", "POST", dataObj, "estateNewList")
        .then((response) => {
            if (!response) return;

            const { statusCode, message, responseData } = response;
            if (statusCode !== 200) return;

            // 모든 클러스터러 초기화
            Object.values(clusterersByType).forEach((clusterer) => clusterer.clear());

            
            if (!Array.isArray(responseData) || responseData.length === 0) {
                liHtml = `
                    <div class="no_data_area_inner d-flex flex-column justify-content-center gap-3 text-center position-absolute" style="top:50%; left:50%; transform: translate(-50%, -50%);">
                        <svg xmlns="http://www.w3.org/2000/svg" height="3em" viewBox="0 0 512 512">
                            <!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" style="fill: var(--var-color-main-1)"></path>
                        </svg>
                        <p>매물이 없습니다.</p>
                    </div>`;
                    //$("#compare_open_btn").hide();
                    $("#comparison_Button_Group").hide();
            } else {
                // 리스트 생성 및 렌더링
                //$("#compare_open_btn").show();
                if($(window).width() <= 991) {
                    $("#comparison_Button_Group").hide();
                } else {
                    $("#comparison_Button_Group").show();
                };
                liHtml = responseData.map(function (data, index) {
                    if (searchNo && index === 0) {
                        map.panTo(new kakao.maps.LatLng(data.lat, data.lng));
                    }

                    const zoomLevel = map.getLevel();

                    // 1-1. 클러스터러 생성 또는 가져오기
                    let clusterer = null;
                    if (zoomLevel > 5) {
                        clusterer = createClustererAll("all");
                    } else {
                        clusterer = createClusterer(data.estate_type, data.sale_type);
                    }
                    // 1-2. 마커 생성
                    const marker = createClusteredMarker(data);
                    // 1-3. 클러스터러에 마커 추가
                    clusterer.addMarker(marker);

                    // 전속 매물 여부에 따른 시각적 구분
                    const isExclusive = data.exclusive_building === "Y";
                    let estateTypeClass = isExclusive ? "exclusive" : "non-exclusive";

                    // 2. 리스트 생성
                    let compareCheckbox = "";
                    let sateTypeHtml = "";
                    let priceHtml = "";
                    switch (data.sale_type) {
                        case "임대":
                            sateTypeHtml = `<span class="label-default bg-violet1">임대</span>`;
                            priceHtml = `<span class="text-nowrap">${formatPrice(data.sale_price, "all", true)}</span> / <span class="text-nowrap">${formatPrice(data.rent_price, "all", true)}</span>`;
                            break;
                        case "매매":
                            sateTypeHtml = `<span class="label-default bg-green1">매매</span>`;
                            priceHtml = `${formatPrice(data.sale_price, "all", true)}`;
                            break;
                        case "교환":
                            sateTypeHtml = `<span class="label-default bg-indigo1">교환</span>`;
                            priceHtml = `${formatPrice(data.sale_price, "all", true)}`;
                            break;
                    }

                    let estateHtml = data.estate_type;
                    
                    let addressHtml = "";  //지번 주소
                    if (data.address_jibun) {
                        let address_temp = data.address_jibun;
                        address_temp = cutAfterSuffix(data.address_jibun);  //'리', '동', '길', '로' 이하 삭제 
                        addressHtml = `<span class="ms-md-auto">${address_temp}</span>`; 
                    } else {
                        addressHtml = `<span class="text-end">주소 정보 없음</span>`;
                    }
                    
                    let areaHtml = "";
                    switch (data.estate_type) {
                        case "토지":
                            areaHtml = formatArea(data.platArea);
                            break;
                        default:
                            areaHtml = formatArea(data.totArea);
                    }

                    let image = "";
                    if (data.imageArray.length > 0) {
                        const imageUrl = `/front/back/00-include/image.php?token=${encodeURIComponent(data.imageArray[0].imageToken)}`;
                        if (data.imageArray[0].fileType === "image") {
                            image = `<img src="${imageUrl}" alt="" width="100" onerror="this.onerror=null;this.src='/front/assets/image/building_empty.png';">`;
                        } else if (data.imageArray[0].fileType === "video") {
                            image = `<video muted width="100%" class="img-fluid mx-auto rounded">
                                        <source src="${imageUrl}" type="video/mp4" class="h-100">
                                        Your browser does not support the video tag.
                                    </video>`;
                        } else {
                            image = '<img src="/front/assets/image/building_empty.png" width="100%" alt="" title="" />';
                        }
                    } else {
                        image = '<img src="/front/assets/image/building_empty.png" width="100%" alt="" title="" />';
                    }
                    compareCheckbox = `<div class="check-box-orange-s"><input type="checkbox" id="compareCheckbox_${data.estate_no}"><label for="compareCheckbox_${data.estate_no}">비교</label></div>`;
                    let estateNoHtml=  `<label>매물번호:${data.estate_no}</label>`;
                    //<h2 class="d-flex align-items-center gap-1">${compareCheckbox} ${sateTypeHtml} ${data.estate_type} ${addressHtml}</h2>
                    return `
                        <dl class="${estateTypeClass}" data-estate-no="${data.estate_no}">
                            <dt>
                                
                                <h2 class="d-flex align-items-center justify-content-between">
                                    <div class="d-flex align-items-center gap-1">
                                        ${compareCheckbox}
                                        ${sateTypeHtml}
                                        ${data.estate_type}
                                    </div>
                                    ${estateNoHtml}
                                </h2>
                                <h2 class="d-flex align-items-center gap-1">${addressHtml}</h2>
                                <ul>
                                    <li>${priceHtml}</li>
                                    <li class="text-nowrap">${areaHtml}</li>
                                </ul>
                                <div>
                                    <p class="text-clamp">${data.description ? data.description : "매물설명 없음"}</p>
                                </div>
                                <dl>
                                    <dt class="agency-name" data-estate-no="${data.estate_no}"><button type="button">${data.agency_name}</button></dt>
                                    <dd>등록일. ${data.reg_date}</dd>
                                </dl>
                            </dt>
                            <dd>${image}</dd>
                        </dl>`;
                });

                // if (responseData.length < 100) {
                //     $("#more_btn").hide();
                // }
            }

            // 기존 리스트를 부드럽게 사라지게 처리
            li.children("dl")
                .fadeOut(100)
                .promise()
                .done(function () {
                    // 리스트가 완전히 사라진 후 새로운 리스트를 추가
                    li.empty().append(liHtml);

                    // 새롭게 추가된 리스트를 부드럽게 나타나게 함
                    li.children("dl")
                        .hide() // 먼저 숨긴 상태에서
                        .delay(150) // 항목마다 100ms씩 지연
                        .fadeIn(400); // 순차적으로 부드럽게 나타나게 설정
                    // --- 여기가 updateCompareList()를 호출할 정확한 위치입니다. ---
                    // DOM 업데이트가 완료되고 새로운 dl 요소들이 화면에 추가된 직후입니다.
                    updateCompareList();
                    // -----------------------------------------------------------
                });
        })
        .catch((error) => {
            console.log(error);
        });
    // 매물 리스트가 업데이트된 후 비교 목록을 갱신합니다.
    //updateCompareList();
}

function updateCompareList(){
    // 1. 현재 화면에 표시된 매물들의 estateNo를 수집합니다.
    const currentDisplayedEstateNos = new Set();
    $('.mcs-list dl').each(function() {
        const estateNo = Number($(this).data('estate-no'));
        if (!isNaN(estateNo)) { // 유효한 숫자인 경우에만 추가
            currentDisplayedEstateNos.add(estateNo);
        }
    });
    // 2. compareList.data를 재구성합니다.
    //    - 화면에 없는 매물은 제거하고
    //    - 화면에 있는 매물은 하이라이트를 다시 적용합니다.
    const updatedCompareListData = [];
    compareList.data.forEach(compareItem => {
        const estateNo = compareItem.estateNo;
        if (currentDisplayedEstateNos.has(estateNo)) {
            // 현재 화면에 매물이 있다면, updatedCompareListData에 포함하고 하이라이트 적용
            updatedCompareListData.push(compareItem);
            // 해당 DL 요소를 찾아서 하이라이트 클래스 다시 추가
            $(`.mcs-list dl[data-estate-no="${estateNo}"]`).addClass('dl-highlight-border');

            // 또한, 해당 매물의 체크박스도 'checked' 상태로 설정해야 합니다.
            // (이전 상태가 유지되지 않을 수 있으므로)
            $(`.mcs-list dl[data-estate-no="${estateNo}"] .check-box-orange-s input[type="checkbox"]`).prop('checked', true);

        } else {
            // 화면에 없는 매물은 compareList에서 제거됨 (updatedCompareListData에 추가되지 않음)
            // 이 경우 해당 매물의 체크박스가 혹시라도 체크되어 있다면 해제해야 하지만,
            // 어차피 화면에 없으므로 DOM 조작은 필요 없습니다.
        }
    });

    // 3. compareList.data를 업데이트된 데이터로 교체합니다.
    compareList.data = updatedCompareListData;

    // 4. compareList.data.length를 사용하여 비교 목록 UI를 갱신합니다.
    displayCompareList();
}

/**
 * 매물 상세정보 가져오는 함수
 * @param {*} estateNo
 * @returns
 */
async function estateDetail(estateNo) {
    $(".map-sell-view").removeClass("active"); // 상세 레이어 접기

    if (isNaN(estateNo)) {
        return;
    }

    const url = "/front/back/sell/estate_detail.php";
    const dataObj = {
        estate_no: estateNo,
    };
    callApiAbort(url, "POST", dataObj, "estateDetail")
        .then(async (response) => {
            if (!response) return;

            const { statusCode, message, responseData } = response;
            if (statusCode !== 200 || message !== "SUCCESS") return;

            favoriteCheck(estateNo); // 즐겨찾기 확인
            await renderEstateDetail(responseData); // 상세레이어 랜더링
            $(".map-sell-view").addClass("active"); // 상세 레이어 펼치기

            recentVisit(responseData);
        })
        .catch((error) => {
            console.log(error);
        })
        .finally(function () {});
}

/**
 * 매물 상세정보 랜더링 함수
 * @param {*} data
 */
async function renderEstateDetail(data) {
    // 1. 이미지 업데이트 (스와이퍼 처리)
    swiper_image(data.imageArray);

    // 2. 매물번호, 매물타입, 거래타입 정보 업데이트
    let sateTypeHtml = "";
    let priceHtml = "";
    switch (data.sale_type) {
        case "임대":
            sateTypeHtml = `<span class="label-default bg-violet1">임대</span>`;
            priceHtml = `임대 ${formatPrice(data.rent_price, "all", true)}원 / 보증금 ${formatPrice(data.deposit_price, "all", true)}원`;
            break;
        case "매매":
            sateTypeHtml = `<span class="label-default bg-green1">매매</span>`;
            priceHtml = `매매 ${formatPrice(data.sale_price, "all", true)}원`;
            break;
        case "교환":
            sateTypeHtml = `<span class="label-default bg-indigo1">교환</span>`;
            priceHtml = `교환 ${formatPrice(data.sale_price, "all", true)}원`;
            break;
    }
    $("#map_sell_view .msv-info dt").html(`${sateTypeHtml} ${data.estate_type}`);
    $("#map_sell_view .msv-info dd .estate-no").text(data.estate_no);
    $("#map_sell_view .msv-info dd .estate-no").attr("data-lat", data.lat);
    $("#map_sell_view .msv-info dd .estate-no").attr("data-lng", data.lng);

    // 3. 가격 정보 업데이트
    const $priceOption = $("#map_sell_view .msv-price-option dt");
    $priceOption.text(priceHtml);

    // 4. 상세 정보 업데이트
    const $detailsContainer = $("#msv_content");
    $detailsContainer.empty(); // 기존 내용을 비움

    const phoneIcon = `
    <svg width="20" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.84 9.85601C7.63075 13.7544 10.8125 16.8438 14.762 18.519L14.774 18.524L15.538 18.864C16.0099 19.0744 16.5399 19.1161 17.0388 18.9818C17.5378 18.8476 17.9753 18.5458 18.278 18.127L19.552 16.364C19.5895 16.3121 19.6056 16.2478 19.597 16.1843C19.5884 16.1209 19.5559 16.0631 19.506 16.023L17.282 14.228C17.2558 14.2068 17.2255 14.1912 17.193 14.182C17.1606 14.1729 17.1266 14.1703 17.0932 14.1746C17.0597 14.1789 17.0275 14.19 16.9984 14.207C16.9694 14.2241 16.944 14.2469 16.924 14.274L16.058 15.442C15.956 15.5798 15.8098 15.6785 15.6439 15.7216C15.4779 15.7647 15.3022 15.7497 15.146 15.679C12.1871 14.3386 9.81644 11.968 8.476 9.00901C8.40531 8.8528 8.39027 8.67709 8.43339 8.51114C8.47652 8.34519 8.5752 8.19903 8.713 8.09701L9.88 7.23001C9.90712 7.20996 9.9299 7.18464 9.94698 7.15557C9.96405 7.12649 9.97507 7.09426 9.97937 7.06082C9.98367 7.02737 9.98115 6.99341 9.97198 6.96096C9.96281 6.92851 9.94717 6.89825 9.926 6.87201L8.132 4.64801C8.09186 4.59814 8.03412 4.56557 7.97067 4.55701C7.90723 4.54845 7.84292 4.56456 7.791 4.60201L6.018 5.88201C5.5964 6.18611 5.2931 6.62682 5.15966 7.12924C5.02622 7.63166 5.07086 8.16478 5.286 8.63801L5.84 9.85601ZM14.17 19.897C9.8791 18.075 6.4226 14.7173 4.477 10.481L4.475 10.479L3.921 9.25901C3.56242 8.47044 3.48791 7.58205 3.71013 6.74477C3.93234 5.9075 4.43758 5.17298 5.14 4.66601L6.913 3.38601C7.27613 3.12393 7.72591 3.01103 8.16976 3.07056C8.61362 3.13009 9.01776 3.35751 9.299 3.70601L11.094 5.93101C11.2421 6.11458 11.3516 6.3262 11.4159 6.55316C11.4802 6.78013 11.4979 7.01774 11.468 7.25172C11.4381 7.4857 11.3612 7.71123 11.242 7.91475C11.1227 8.11826 10.9635 8.29557 10.774 8.43601L10.104 8.93201C11.2368 11.1283 13.0257 12.9172 15.222 14.05L15.719 13.38C15.8594 13.1906 16.0367 13.0316 16.2401 12.9124C16.4436 12.7933 16.669 12.7164 16.9028 12.6865C17.1367 12.6566 17.3742 12.6743 17.601 12.7385C17.8279 12.8027 18.0395 12.912 18.223 13.06L20.448 14.855C20.7968 15.1363 21.0244 15.5406 21.0839 15.9847C21.1434 16.4288 21.0304 16.8788 20.768 17.242L19.494 19.006C18.9897 19.7039 18.2606 20.2071 17.4291 20.4309C16.5977 20.6547 15.7145 20.5855 14.928 20.235L14.17 19.897Z" fill="#525252"></path>
    </svg>`;

   
    const detailItems = [
        { name: "address_jibun", title: "소재지(지번)", value: cutAfterSuffix(data.address_jibun) || "" },
        { name: "address_road", title: "소재지(도로명)", value: cutAfterSuffix(data.address_road) || "" },
        { name: "related_jibun", title: "관련지번", value: data.related_jibun == "Y" ? "관련지번 있음" : "관련지번 없음" },
        { name: "notes", title: "참고사항", value: data.notes || "" },
        { name: "estate_type", title: "매물구분", value: data.estate_type || "" },
        { name: "sale_type", title: "거래종류", value: data.sale_type || "" },
        { name: "price", title: "가격", value: data.sale_type == "매매" || data.sale_type == "교환" ? `${formatPrice(data.sale_price, "all", true)}` : `${formatPrice(data.sale_price, "all", true)} / ${formatPrice(data.rent_price, "all", true)}` },
        //{ name: "platArea", title: "토지면적", value: `${data.platArea ? parseFloat(data.platArea).toFixed(2) + "㎡" : ""}` },
        //{ name: "archArea", title: "건축면적", value: `${data.archArea ? parseFloat(data.archArea).toFixed(2) + "㎡" : ""}` },
        //{ name: "totArea", title: "총면적", value: `${data.totArea ? parseFloat(data.totArea).toFixed(2) + "㎡" : ""}` },
        { name: "platArea", title: "토지면적", value: `${data.platArea ? formatArea(data.platArea) : ""}` },
        { name: "archArea", title: "건축면적", value: `${data.archArea ? formatArea(data.archArea) : ""}` },
        { name: "totArea", title: "총면적", value: `${data.totArea ? formatArea(data.totArea) : ""}` },
        { name: "lndcgrCodeNm", title: "지목", value: data.lndcgrCodeNm || "" },
        { name: "prposAreaNm", title: "용도지역", value: data.prposAreaNm || "" },
        { name: "vlRat", title: "용적률", value: `${data.vlRat ? parseFloat(data.vlRat).toFixed(2) + "%" : ""}` },
        { name: "bcRat", title: "건폐율", value: `${data.bcRat ? parseFloat(data.bcRat).toFixed(2) + "%" : ""}` },
        { name: "floor", title: "층수", value: `지상 ${data.grndFlrCnt || 1} / 지하 ${data.ugrndFlrCnt || 0}` },
        { name: "strctCdNm", title: "구조", value: `${data.strctCdNm || ""}` },
        { name: "useAprDay", title: "사용승인일", value: data.useAprDay || "" },
        { name: "car_parking", title: "주차 가능 대수", value: `${data.car_parking ? data.car_parking + "대" : ""}` },
        { name: "mainPurpsCdNm", title: "주용도", value: data.mainPurpsCdNm || "" },
        { name: "realPurpsNm", title: "실제 사용용도", value: data.realPurpsNm || "" },
        { name: "maintenance_price", title: "월 관리비", value: `${formatPrice(data.maintenance_price, "all", true)}` },
        { name: "loan_price", title: "융자금", value: `${formatPrice(data.loan_price, "all", true)}` },
        { name: "road_conditions", title: "도로여건", value: `${data.road_conditions ? data.road_conditions + "m 도로 접속" : ""}` },
        { name: "power", title: "전기", value: `${data.power ? data.power + "Kw 이하" : ""}` },
        {
            name: "water",
            title: "용수",
            value: data.water ? (data.water === "waterworks" ? "상수도" : data.water === "underground" ? "지하수" : "") : "",
        },
        { name: "floor_height", title: "건물층고", value: `${data.floor_height ? data.floor_height + "m" : ""}` },
        { name: "feature", title: "특장점", value: data.feature || "" },
        { name: "description", title: "상세 설명", value: data.description || "정보 없음" },
        // {
        //     name: "agency_name",
        //     title: "중개사 상호",
        //     value: `${data.agency_name ? data.agency_name + "<br>" : ""}${data.registered_broker_name ? data.registered_broker_name + "<br>" : ""}${data.broker_address ? data.broker_address + "<br>" : ""}${data.homepage_url ? data.homepage_url + "<br>" : ""}${
        //         data.broker_phone ? data.broker_phone + "<br>" : ""
        //     }`,
        // },
        // {
        //     name: "agency_name",
        //     title: "중개사 상호",
        //     value: `${data.agency_name ? `<button type="button" class="p-0">${data.agency_name}</button>` : ""}`,
        // },
        // { name: "registered_broker_name", title: "중개사 대표", value: data.registered_broker_name || "" },
        // { name: "broker_address", title: "중개사 주소", value: data.broker_address || "" },
        // {
        //     name: "homepage_url",
        //     title: "중개사 홈페이지",
        //     value: `${data.homepage_url ? `<a target="_blank" href="${data.homepage_url}" class="btn-default-s bg-main align-content-center">홈페이지 바로가기</a>` : ""}`,
        // },
        // {
        //     name: "broker_phone",
        //     title: "중개사 전화번호",
        //     value: `${data.broker_phone ? `${phoneIcon}<a href="tel:${phoneOnDash(data.broker_phone)}">${phoneOnDash(data.broker_phone)}</a>` : ""}`,
        // },
    ];

    const agencyItems = [
        {
            name: "agency_name",
            title: "중개사 상호",
            value: `${data.agency_name ? `<button type="button" class="p-0">${data.agency_name}</button>` : ""}`,
        },
        { name: "registered_broker_name", title: "중개사 대표", value: data.registered_broker_name || "" },
        { name: "broker_address", title: "중개사 주소", value: data.broker_address || "" },
        {
            name: "homepage_url",
            title: "중개사 홈페이지",
            value: `${data.homepage_url ? `<a target="_blank" href="${data.homepage_url}" class="btn-default-s bg-main align-content-center">홈페이지 바로가기</a>` : ""}`,
        },
        {
            name: "broker_phone",
            title: "중개사 전화번호",
            value: `${data.broker_phone ? `${phoneIcon}<a href="tel:${phoneOnDash(data.broker_phone)}">${phoneOnDash(data.broker_phone)}</a>` : ""}`,
        },
    ];

    $.each(detailItems, function (index, item) {
        $detailsContainer.append(`<dl><dt>${item.title}</dt><dd class="${item.name}">${item.value}</dd></dl>`);
    });
    $detailsContainer.append("<hr>");
    $.each(agencyItems, function (index, item) {
        $detailsContainer.append(`<dl><dt>${item.title}</dt><dd class="${item.name}">${item.value}</dd></dl>`);
    });

    // 5. 지도 중심 이동
    // var moveLatLon = new kakao.maps.LatLng(data.lat, data.lng);
    // map.setLevel(3);
    // map.panTo(moveLatLon);
}

// make_compareList 함수 정의
async function make_compareList(compareList) {
    if (compareList.data.length !== 2) {
        alert("비교할 매물은 정확히 2개여야 합니다.");
        $('#compareModal').hide();
        return;
    }

    // make_compareList가 fadeIn 콜백 내부에서 호출되므로,
    // 여기서 다시 $('#compareModal').show(); 를 호출할 필요가 없습니다.
    // $('#compareModal').show(); // 이 줄은 제거하거나 주석 처리해도 됩니다.

    // 비교 테이블의 `property-value-item`과 `property-compare` 초기화
    $('#compareModal .property-value-item').empty();
    $('#compareModal .property-compare').empty();
    //$('#compareModal .modal-body-footer .column-center div').empty(); // 푸터의 값 초기화
    $('#compareModal .modal-body-footer .column-right').empty(); // 푸터의 비교 결과 초기화


    const estateDetailApiUrl = "/front/back/sell/estate_detail.php";

    
     // Promise.all을 사용하여 두 매물의 상세 정보를 동시에 가져옵니다.
    
    try {
        const [response1, response2] = await Promise.all([
            callApiAbort(estateDetailApiUrl, "POST", { estate_no: compareList.data[0].estateNo }, "estateDetail_${compareList.data[0].estateNo}"),
            callApiAbort(estateDetailApiUrl, "POST", { estate_no: compareList.data[1].estateNo }, "estateDetail_${compareList.data[1].estateNo}")
        ]);

        let data1 = null;
        let data2 = null;

        if (response1 && response1.statusCode === 200 && response1.message === "SUCCESS") {
            data1 = response1.responseData;
        } else {
            console.error("첫 번째 매물 상세 정보 로드 실패:", response1);
            alert("첫 번째 매물 정보를 불러오지 못했습니다. 비교를 중단합니다.");
            $('#compareModal').hide();
            return;
        }

        if (response2 && response2.statusCode === 200 && response2.message === "SUCCESS") {
            data2 = response2.responseData;
        } else {
            console.error("두 번째 매물 상세 정보 로드 실패:", response2);
            alert("두 번째 매물 정보를 불러오지 못했습니다. 비교를 중단합니다.");
            $('#compareModal').hide();
            return;
        }

        // 두 매물의 상세 데이터를 가져왔으므로, 이제 비교 테이블을 채웁니다.
        
        renderComparisonTable(data1, data2);
        adjustComparisonModalHeight(); 

    } catch (error) {
        console.error("매물 상세 정보 로드 중 오류 발생:", error);
        alert("매물 상세 정보를 불러오는 중 오류가 발생했습니다.");
        $('#compareModal').hide();
    }
}

/**
 * 두 매물의 상세 데이터를 비교 테이블에 렌더링합니다.
 * @param {Object} data1 - 첫 번째 매물의 상세 데이터.
 * @param {Object} data2 - 두 번째 매물의 상세 데이터.
 */
function renderComparisonTable(data1, data2) {
    // 매물별 값과 비교 결과를 표시할 항목들을 정의합니다.
    // label: HTML에 표시된 라벨 텍스트
    // prop: responseData 내의 해당 속성명
    // formatter: 값을 포맷팅할 함수 (선택 사항)
    // compareType: 'text', 'number', 'image' 등 비교 방식
    const comparisonFields = [
        { label: "매물 사진", prop: "imageArray", type: "image", compare: "N", formatter: (imageArray, data) => imageArray && imageArray.length > 0 ? `/front/back/00-include/image.php?token=${encodeURIComponent(imageArray[0].imageToken)}` : '/front/assets/image/building_empty.png'},
        { label: "소재지(지번)", prop: "address_jibun", type: "text", compare: "N", formatter: (val) => cutAfterSuffix(val) || ""},
        { label: "소재지(도로명)", prop: "address_road", type: "text", compare: "N", formatter: (val) => cutAfterSuffix(val) || ""},
        { label: "관련지번", prop: "related_jibun", type: "text", compare: "N", formatter: (val) => val == "Y" ? "관련지번 있음" : "관련지번 없음"},
        { label: "참고사항", prop: "notes", type: "text", compare: "N", formatter: (val) => val || ""},
        { label: "매물구분", prop: "estate_type", type: "text", compare: "N", formatter: (val) => val || "" },
        { label: "거래종류", prop: "sale_type", type: "text", compare: "N", formatter: (val) => val || "" },
        { label: "가격", prop: "sale_price", type: "number", compare: "Y", formatter: (salePrice, data) => data.sale_type == "매매" || data.sale_type == "교환" ? `${formatPrice(salePrice, "all", true)}` : `${formatPrice(salePrice, "all", true)} / ${formatPrice(data.rent_price, "all", true)}`},
        { label: "토지면적", prop: "platArea", type: "number", compare: "Y", formatter: (val) => val ? formatArea(val) : "" },
        { label: "건축면적", prop: "archArea", type: "number", compare: "Y", formatter: (val) => val ? formatArea(val) : "" },
        { label: "총면적", prop: "totArea", type: "number", compare: "Y", formatter: (val) => val ? formatArea(val) : "" },
        { label: "지목", prop: "lndcgrCodeNm", type: "text", compare: "N", formatter: (val) => val || "" },
        { label: "용도지역", prop: "prposAreaNm", type: "text", compare: "N", formatter: (val) => val || "" },
        { label: "용적률", prop: "vlRat", type: "number", compare: "Y", formatter: (val) => val ? parseFloat(val).toFixed(2) + "%" : "" },
        { label: "건폐율", prop: "bcRat", type: "number", compare: "Y", formatter: (val) => val ? parseFloat(val).toFixed(2) + "%" : "" },
        { label: "층수", prop: "grndFlrCnt", type: "text", compare: "N", formatter: (grndFlrCnt, data) => `지상 ${grndFlrCnt || 1} / 지하 ${data.ugrndFlrCnt || 0}`},
        { label: "구조", prop: "strctCdNm", type: "text", compare: "N", formatter: (val) => val || "" },
        { label: "사용승인일", prop: "useAprDay", type: "text", compare: "N", formatter: (val) => val || "" },
        { label: "주차 가능 대수", prop: "car_parking", type: "number", compare: "Y", formatter: (val) => val ? val + "대" : "" },
        { label: "주용도", prop: "mainPurpsCdNm", type: "text", compare: "N", formatter: (val) => val || "" },
        { label: "실제 사용용도", prop: "realPurpsNm", type: "text", compare: "N", formatter: (val) => val || "" },
        { label: "월 관리비", prop: "maintenance_price", type: "number", compare: "Y", formatter: (val) => formatPrice(val, "all", true) || "" },
        { label: "융자금", prop: "loan_price", type: "number", compare: "Y", formatter: (val) => formatPrice(val, "all", true) || "" },
        { label: "도로여건", prop: "road_conditions", type: "number", compare: "N", formatter: (val) => val ? val + "m 도로 접속" : "" },
        { label: "전기", prop: "power", type: "number", compare: "N", formatter: (val) => val ? val + "Kw 이하" : "" },
        { label: "용수", prop: "water", type: "text", compare: "N",formatter: (val) => val ? (val === "waterworks" ? "상수도" : val === "underground" ? "지하수" : "") : ""},
        { label: "건물층고", prop: "floor_height", type: "number", compare: "N", formatter: (val) => val ? val + "m" : "" },
        { label: "특장점", prop: "feature", type: "text", compare: "N", formatter: (val) => val || "" },
        { label: "상세 설명", prop: "description", type: "text", compare: "N", formatter: (val) => val || "정보 없음" },
      ];

    // comparisonFields 배열은 이 함수 외부 또는 함수 내부에 정의되어 있어야 합니다.
    // (위에서 제시된 comparisonFields 배열을 여기에 붙여넣거나, 전역 변수로 선언)

    let sateTypeHtml1 = "";
    let sateTypeHtml2 = "";
    switch (data1.sale_type) {
        case "임대":
            sateTypeHtml1 = `<span class="label-default bg-violet1">임대</span>`;
            break;
        case "매매":
            sateTypeHtml1 = `<span class="label-default bg-green1">매매</span>`;
            break;
        case "교환":
            sateTypeHtml1 = `<span class="label-default bg-indigo1">교환</span>`;
            break;
    }
    switch (data2.sale_type) {
        case "임대":
            sateTypeHtml2 = `<span class="label-default bg-violet1">임대</span>`;
            break;
        case "매매":
            sateTypeHtml2 = `<span class="label-default bg-green1">매매</span>`;
            break;
        case "교환":
            sateTypeHtml2 = `<span class="label-default bg-indigo1">교환</span>`;
            break;
    }
    $("#compare_item1").html(`${sateTypeHtml1} ${data1.estate_type} (매물번호 : ${data1.estate_no})`);
    $("#compare_item2").html(`${sateTypeHtml2} ${data2.estate_type} (매물번호 : ${data2.estate_no})`);

    $('#compareModal .modal-body-scroll-content .property-detail-row').each(function() {
        const $row = $(this);
        const labelText = $row.find('.property-label').text().trim(); // HTML의 라벨 텍스트
    
        // comparisonFields에서 현재 라벨에 해당하는 필드 정의를 찾습니다.
        const field = comparisonFields.find(f => f.label === labelText);
    
        if (field) {
            // --- 1. property-value-item에 표시될 값은 'compare' 속성과 상관없이 항상 계산하고 표시합니다. ---
            let rawValue1 = data1[field.prop];
            let rawValue2 = data2[field.prop];
    
            // 포맷터를 사용하여 화면에 표시될 값을 생성합니다.
            const displayValue1 = field.formatter ? field.formatter(rawValue1, data1) : (rawValue1 || '-');
            const displayValue2 = field.formatter ? field.formatter(rawValue2, data2) : (rawValue2 || '-');
    
            // property-value-item에 값 표시 (항상 표시)
            const $item1 = $row.find('.property-value-item:eq(0)'); // 첫 번째 아이템 (xx)
            const $item2 = $row.find('.property-value-item:eq(1)'); // 두 번째 아이템 (yy)
            
            let bgColor1= `#f7e8c4`;
            let bgColor2= `#f7efdb`;
            $item1.css('background-color', bgColor1);
            $item2.css('background-color', bgColor2);
            
            if (field.type === "image") {
                $item1.html(`<img src="${displayValue1}" alt="${labelText}" style="max-width:100px; height:auto;">`);
                $item2.html(`<img src="${displayValue2}" alt="${labelText}" style="max-width:100px; height:auto;">`);
            } else {
                $item1.text(displayValue1);
                $item2.text(displayValue2);
            }
    
            // --- 2. property-compare (비교 결과)는 'compare' 속성에 따라 조건부 처리합니다. ---
            const $compareResultColumn = $row.find('.property-compare');
            let resultText = ''; // 기본값은 빈 문자열
            let isDifferent = false;
    
            // 이전에 적용된 색상 클래스들을 먼저 제거합니다.
            $compareResultColumn.removeClass('compare-up compare-down');
    
            // 'compare' 속성을 확인하여 해당 필드가 비교 대상인지 결정합니다.
            // 'compare' 속성이 없거나 "Y"인 경우 비교 대상으로 간주합니다.
            const isComparable = field.compare !== "N";
    
            if (isComparable) { // 비교 대상인 필드일 경우에만 비교 로직 수행
                // 비교 로직은 원본 값을 사용해야 합니다.
                let currentRawValue1 = data1[field.prop]; // 최신 값으로 다시 가져옴
                let currentRawValue2 = data2[field.prop]; // 최신 값으로 다시 가져옴
    
                if (field.type === "number") {
                    const num1 = Number(currentRawValue1);
                    const num2 = Number(currentRawValue2);
    
                    if (isNaN(num1) || isNaN(num2) || currentRawValue1 === null || currentRawValue2 === null) {
                        resultText = '-';
                    } else if (num1 === num2) {
                        resultText = '동일';
                        isDifferent = false;
                    } else {
                        isDifferent = true;
                        const difference = Math.abs(num1 - num2);
                        let formattedDifference;
    
                        // 필드 prop에 따라 차이 값 포맷팅을 다르게 적용
                        if (field.prop.includes('price')) { // 가격 관련 필드
                            formattedDifference = formatPrice(difference, "all", true);
                        } else if (field.prop.includes('Area')) { // 면적 관련 필드
                            formattedDifference = formatArea(difference);
                        } else if (field.prop === "vlRat" || field.prop === "bcRat") { // 용적률, 건폐율
                            formattedDifference = difference.toFixed(2) + "%";
                        } else if (field.prop === "car_parking") { // 주차 대수
                            formattedDifference = difference + "대";
                        } else if (field.prop === "power") { // 전기
                            formattedDifference = difference + "Kw"; // 차이값이므로 "이하"는 제거
                        } else if (field.prop === "floor_height") { // 건물 층고
                            formattedDifference = difference + "m";
                        } else { // 그 외 숫자 필드
                            formattedDifference = difference;
                        }
    
                        if (num1 < num2) {
                            resultText = `▲ (${formattedDifference})`;
                            $compareResultColumn.addClass('compare-up');
                        } else { // num1 > num2
                            resultText = `▼ (${formattedDifference})`;
                            $compareResultColumn.addClass('compare-down');
                        }
                    }
                } else if (field.type === "image") {
                    // 이미지의 경우, 포맷팅된 URL을 비교하는 것이 더 정확할 수 있습니다.
                    if (displayValue1 === displayValue2) {
                        resultText = '동일';
                    } else {
                        resultText = '다름';
                        isDifferent = true;
                    }
                } else { // text 타입 비교
                    if (currentRawValue1 === currentRawValue2) {
                        resultText = '동일';
                    } else {
                        resultText = '다름';
                        isDifferent = true;
                    }
                }
            }
            // isComparable이 false인 경우, resultText는 초기값인 '' (빈 문자열)로 유지됩니다.
            
            $compareResultColumn.text(resultText);
            // isDifferent는 isComparable이 true일 때만 true가 될 수 있으므로, 별도의 isComparable 조건이 필요 없습니다.
            if (isDifferent) {
                $compareResultColumn.addClass('highlight-difference');
            } else {
                $compareResultColumn.removeClass('highlight-difference');
            }
        }
    });
    
    // 푸터의 '평 단가' 처리
    const $footer = $('#compareModal .modal-body-footer');
    const $footerCompareResult = $footer.find('.column-right');

    // 푸터 비교 결과도 화살표/색상 로직을 적용하려면 아래와 같이 수정합니다.
    // 푸터도 비교 결과 표시 전에 이전 색상 클래스들을 제거
    $footerCompareResult.removeClass('compare-up compare-down');

    // --- '평 단가' 계산 로직 변경 시작 ---
    let pricePerArea1 = 0;
    let pricePerArea2 = 0;
    const PY_CONVERSION_FACTOR = 0.3025; // ㎡를 평으로 변환하는 계수 (1㎡ = 0.3025평)

    // 첫 번째 매물 평 단가 계산
    let denominator1 = 0;
    if (data1.estate_type === "토지") {
        // 매물 구분이 '토지'인 경우 토지면적(platArea) 사용
        denominator1 = data1.platArea * PY_CONVERSION_FACTOR;
    } else {
        // 그 외의 경우 총면적(totArea) 사용
        denominator1 = data1.totArea * PY_CONVERSION_FACTOR;
    }
    pricePerArea1 = denominator1 > 0 ? data1.sale_price / denominator1 : 0;

    // 두 번째 매물 평 단가 계산
    let denominator2 = 0;
    if (data2.estate_type === "토지") {
        // 매물 구분이 '토지'인 경우 토지면적(platArea) 사용
        denominator2 = data2.platArea * PY_CONVERSION_FACTOR;
    } else {
        // 그 외의 경우 총면적(totArea) 사용
        denominator2 = data2.totArea * PY_CONVERSION_FACTOR;
    }
    pricePerArea2 = denominator2 > 0 ? data2.sale_price / denominator2 : 0;
    // --- '평 단가' 계산 로직 변경 끝 ---

    let unitpriceText1 = formatPrice(pricePerArea1, "all", true) + '/평' ; // 단위 변경
    let unitpriceText2 = formatPrice(pricePerArea2, "all", true) + '/평' ; // 단위 변경

    let unitpriceTextHtml1 = `<span class="label-default bg-green1">${unitpriceText1}</span>`;
    let unitpriceTextHtml2 = `<span class="label-default bg-green1">${unitpriceText2}</span>`;

    $("#compare_unit1").html(`${unitpriceTextHtml1}`);
    $("#compare_unit2").html(`${unitpriceTextHtml2}`);

    let footerResultText = '';
    let footerIsDifferent = false;

    if (pricePerArea1 === pricePerArea2) {
        footerResultText = '동일';
        footerIsDifferent = false;
    } else {
        footerIsDifferent = true;
        const difference = Math.abs(pricePerArea1 - pricePerArea2);
        const formattedDifference = formatPrice(difference, "all", true); // 평 단가도 가격 포맷 사용

        if (pricePerArea1 < pricePerArea2) {
            footerResultText = `▲ (${formattedDifference})`;
            $footerCompareResult.addClass('compare-up');
        } else { // pricePerArea1 > pricePerArea2
            footerResultText = `▼ (${formattedDifference})`;
            $footerCompareResult.addClass('compare-down');
        }
    }
    $footerCompareResult.text(footerResultText);
    if (footerIsDifferent) {
        $footerCompareResult.addClass('highlight-difference');
    } else {
        $footerCompareResult.removeClass('highlight-difference');
    }
    
}

// ResizeObserver 인스턴스 (한 번만 생성)
let modalHeightObserver = null;

/**
 * 매물 비교 모달의 높이를 내용에 맞춰 동적으로 조절합니다.
 * .modal-body-scroll-content의 내용이 모두 표시된 후 호출되어야 합니다.
 * 이 함수는 .compare-modal-content의 max-height와 min-height 제약을 존중합니다.
 */
function adjustComparisonModalHeight() {
    const modalContent = document.querySelector('.compare-modal-content');
    const header = document.querySelector('.compare-modal-header');
    const modalBody = document.querySelector('.compare-modal-body');
    const bodyHeader = document.querySelector('.modal-body-header');
    const scrollContent = document.querySelector('.modal-body-scroll-content');
    const bodyFooter = document.querySelector('.modal-body-footer');

    if (!modalContent || !header || !modalBody || !bodyHeader || !scrollContent) {
        console.warn("매물 비교 모달의 높이 조절에 필요한 요소 중 일부가 없습니다.");
        return;
    }

    // --- 모든 관련 요소의 인라인 스타일을 완벽하게 초기화 ---
    // 모달을 닫았다 열 때 잔여 스타일로 인한 오차를 방지합니다.
    modalContent.style.cssText = '';
    scrollContent.style.cssText = '';
    modalBody.style.cssText = '';
    // ----------------------------------------------------

    // 1. .modal-body-scroll-content의 flex 속성들을 정확한 scrollHeight 측정 준비 상태로 설정
    scrollContent.style.flexGrow = '0';
    scrollContent.style.height = 'auto';
    scrollContent.style.minHeight = 'auto';
    scrollContent.style.flexShrink = '0';

    // .compare-modal-body의 flex 속성도 정확한 계산 준비 상태로 설정
    modalBody.style.flexGrow = '0';
    modalBody.style.height = 'auto';

    // requestAnimationFrame은 DOM 업데이트가 처리된 후 측정을 보장합니다.
    requestAnimationFrame(() => {
        // 2. .modal-body-scroll-content의 실제 내용 높이를 측정하고, 그 높이로 강제 설정합니다.
        // Math.ceil을 사용하여 소수점 픽셀로 인한 공간 부족을 방지합니다.
        const scrollContentActualHeight = Math.ceil(scrollContent.scrollHeight);
        const scrollContentHeightWithBuffer = scrollContentActualHeight + 1; // 1px의 미세한 여유 공간

        scrollContent.style.height = `${scrollContentHeightWithBuffer}px`; // 핵심: 높이를 scrollHeight + 여유 공간으로 명시적 설정

        // 3. 각 고정된 요소들의 높이를 측정합니다.
        const headerHeight = Math.ceil(header.offsetHeight);
        const bodyHeaderHeight = Math.ceil(bodyHeader.offsetHeight);
        const bodyFooterHeight = bodyFooter ? Math.ceil(bodyFooter.offsetHeight) : 0;

        // 4. .compare-modal-body의 자체 패딩/보더를 계산합니다.
        const modalBodyComputedStyle = getComputedStyle(modalBody);
        const modalBodyPaddingTop = parseFloat(modalBodyComputedStyle.paddingTop);
        const modalBodyPaddingBottom = parseFloat(modalBodyComputedStyle.paddingBottom);
        const modalBodyBorderTop = parseFloat(modalBodyComputedStyle.borderTopWidth);
        const modalBodyBorderBottom = parseFloat(modalBodyComputedStyle.borderBottomWidth);
        const modalBodyVerticalSpace = Math.ceil(modalBodyPaddingTop + modalBodyPaddingBottom + modalBodyBorderTop + modalBodyBorderBottom);

        // 5. .compare-modal-body의 '이상적인' 높이를 직접 계산합니다.
        const modalBodyGap = parseFloat(modalBodyComputedStyle.gap || 0);

        let idealModalBodyHeightCalculated = Math.ceil(
            bodyHeaderHeight +
            scrollContentHeightWithBuffer + // scrollContent.offsetHeight 대신 scrollContentHeightWithBuffer 사용
            bodyFooterHeight +
            modalBodyVerticalSpace +
            modalBodyGap
        );

        // .compare-modal-body의 min-height도 고려합니다.
        const modalBodyMinHeight = parseFloat(modalBodyComputedStyle.minHeight);
        if (idealModalBodyHeightCalculated < modalBodyMinHeight) {
            idealModalBodyHeightCalculated = Math.ceil(modalBodyMinHeight);
        }
        
        // 6. .compare-modal-body의 높이를 계산된 값으로 명시적으로 설정합니다.
        modalBody.style.height = `${idealModalBodyHeightCalculated}px`;

        // 7. .compare-modal-content의 '이상적인' 총 높이를 계산합니다.
        let idealModalContentHeight = Math.ceil(headerHeight + modalBody.offsetHeight);

        // 8. .compare-modal-content에 설정된 max-height와 min-height 제약을 가져옵니다.
        const computedModalContentStyle = getComputedStyle(modalContent);
        const maxModalHeight = parseFloat(computedModalContentStyle.maxHeight);
        const minModalHeight = parseFloat(computedModalContentStyle.minHeight);

        // 9. 최종 모달 높이를 결정하고, .modal-body-scroll-content 및 .compare-modal-body의 flex 속성을 조정합니다.
        let finalModalHeight = idealModalContentHeight;
        let setScrollContentFlexGrow = '0';
        let setScrollContentMinHeight = `${scrollContentHeightWithBuffer}px`;
        let setScrollContentFlexShrink = '0';
        let setModalBodyFlexGrow = '0';
        let setModalBodyHeightValue = `${idealModalBodyHeightCalculated}px`;

        if (idealModalContentHeight > maxModalHeight) {
            finalModalHeight = Math.ceil(maxModalHeight);
            setScrollContentFlexGrow = '1';
            setScrollContentMinHeight = 'auto';
            setScrollContentFlexShrink = '1';
            setModalBodyFlexGrow = '1';
            setModalBodyHeightValue = 'auto';
        } else if (idealModalContentHeight < minModalHeight) {
            finalModalHeight = Math.ceil(minModalHeight);
            setScrollContentFlexGrow = '1';
            setScrollContentMinHeight = 'auto';
            setScrollContentFlexShrink = '1';
            setModalBodyFlexGrow = '1';
            setModalBodyHeightValue = 'auto';
        }

        // 10. .compare-modal-content의 높이를 조정합니다.
        modalContent.style.height = `${finalModalHeight}px`;

        // 11. .modal-body-scroll-content의 flex-grow, min-height, flex-shrink 속성을 최종 결정된 값으로 설정합니다.
        scrollContent.style.flexGrow = setScrollContentFlexGrow;
        scrollContent.style.minHeight = setScrollContentMinHeight;
        if (setScrollContentFlexGrow === '1') {
            scrollContent.style.height = 'auto';
        } else {
            // flex-grow가 0일 때는 명시적 높이 유지 (이미 위에서 scrollContentHeightWithBuffer로 설정됨)
        }
        scrollContent.style.flexShrink = setScrollContentFlexShrink;

        // 12. .compare-modal-body의 flex-grow 및 height 속성을 최종 결정된 값으로 설정합니다.
        modalBody.style.flexGrow = setModalBodyFlexGrow;
        modalBody.style.height = setModalBodyHeightValue;

        
    });
}

// ResizeObserver를 사용하여 .modal-body-scroll-content의 크기 변화를 감지하고 높이 재조정
// 이 옵저버는 페이지 로드 시 한 번만 설정하면 됩니다.
document.addEventListener('DOMContentLoaded', () => {
    const scrollContent = document.querySelector('.modal-body-scroll-content');
    if (scrollContent && typeof ResizeObserver !== 'undefined') {
        if (modalHeightObserver) {
            modalHeightObserver.disconnect();
        }
        modalHeightObserver = new ResizeObserver(entries => {
            // 모든 크기 변화에 대해 adjustComparisonModalHeight를 호출
            adjustComparisonModalHeight();
        });
        modalHeightObserver.observe(scrollContent);
    }
});

// 모달이 닫힐 때 옵저버 연결 해제 (메모리 누수 방지)
function disconnectModalHeightObserver() {
    if (modalHeightObserver) {
        modalHeightObserver.disconnect();
        // modalHeightObserver = null; // 필요에 따라 null로 설정
    }
}

/**
 * 매물 이미지 swiper 요소로 추가하는 함수
 * @param {*} imageArray = 이미지 배열
 */
function swiper_image(imageArray) {
    const thumbSelector = $(".sale-thumbnail-slider .swiper-wrapper");

    // 이미지 배열이 비었거나 없을 경우 기본 이미지를 설정
    if (!imageArray || imageArray.length === 0) {
        const defaultImageHtml = `
            <div class="swiper-slide">
                <img src="/front/assets/image/building_empty.png" alt="No Image Available" class="img-fluid d-block rounded">
            </div>
        `;
        thumbSelector.html(defaultImageHtml).append(defaultImageHtml);
    } else {
        const imageHtml = imageArray
            .map((item) => {
                const imgSrc = item.imageToken ? `/front/back/00-include/image.php?token=${encodeURIComponent(item.imageToken)}` : "/front/assets/image/building_empty.png";
                let itemHtml = "";

                if (item.fileType === "image") {
                    itemHtml = `
                        <div class="swiper-slide">
                            <a target="_blank" href="${imgSrc}" class="image-popup">
                                <img src="${imgSrc}" alt="Estate Image" class="gallery-img img-fluid mx-auto rounded" onerror="this.onerror=null;this.src='/front/assets/image/building_empty.png';">
                            </a>
                        </div>
                    `;
                } else if (item.fileType === "video") {
                    itemHtml = `
                        <div class="swiper-slide">
                            <video controls width="100%" height="100%" class="img-fluid mx-auto rounded h-100" controlslist="nodownload">
                                <source src="${imgSrc}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    `;
                } else {
                    itemHtml = `
                        <div class="swiper-slide">
                            <img src="/front/assets/image/building_empty.png" alt="Estate Image" class="gallery-img img-fluid mx-auto rounded">
                        </div>
                    `;
                }
                return itemHtml;
            })
            .join("");

        // 이미지가 1개일 경우에도 슬라이더를 생성하도록 처리
        if (imageArray.length === 1) {
            thumbSelector.html(imageHtml).append(imageHtml); // 동일한 이미지를 2번 추가하여 슬라이더에 표시
        } else {
            thumbSelector.html(imageHtml); // 여러 이미지일 경우 그대로 표시
        }
    }

    // Swiper 슬라이더 초기화
    var productThubnailSlider = new Swiper(".sale-thumbnail-slider", {
        loop: false, // 이미지가 2개 이상일 때만 반복 활성화
        spaceBetween: 24, // 슬라이드 간격
        slidesPerView: 2, // 화면에 보이는 슬라이드 개수
        freeMode: true, // 자유 모드 활성화
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        }, // 다음/이전 버튼 설정
        watchSlidesProgress: true, // 슬라이드 진행 상황 감시
    });
}

/**************************************************
 * *************** 필터 관련 함수 *************** *
 **************************************************/

/**
 * 필터 관련 함수 초기화
 */
function initFilters() {
    // 필터(매물종류, 거래방식)
    getFilterTypes();

    // 필터(가격대)
    var priceSlider = document.getElementById("price_slider");
    setPriceSlider(priceSlider);
    setIniSliderValues(priceSlider);
}

/**
 * 필터 파라미터를 수집하는 함수
 * @returns {Object} 필터 파라미터 객체
 */
function collectFilterParams() {
    return {
        estateType: $("#estate_type_filter").val(),
        saleType: $("#sale_type_filter").val(),
        minPrice: $("#input_price_start").val(),
        maxPrice: $("#input_price_end").val(),
    };
}

/**
 * 멀티 필터 파라미터를 수집하는 함수( 추가)
 * @returns {Object} 필터 파라미터 객체
 */
function collectMultiFilterParams() {
    return {
        estateType: getEstateListFilterParams(), 
        saleType: getSaleListFilterParams(),     
        minPrice: $("#input_price_start").val(),
        maxPrice: $("#input_price_end").val(),
    };
}

function getSaleListFilterParams() {
    let sale_value = [];
    $('.map-sale-group button.active').each(function () {
        const btn_text = $(this).text().trim();
        sale_value.push(saleTypeToValue(btn_text)); // 버튼의 텍스트 값을 가져와 배열에 추가
    });
    return sale_value;
}

function getEstateListFilterParams() {
    let estate_value = [];
    let = btn_text = "";
    $('.map-estate-group button.active').each(function () {
        const btn_text = $(this).text().trim();
        if( btn_text === "전체") {
            estate_value.push("001"); // 버튼의 텍스트 값을 가져와 배열에 추가
            estate_value.push("002");
            estate_value.push("003");
            estate_value.push("004");
            estate_value.push("005");
            estate_value.push("006");
            estate_value.push("007");
            estate_value.push("008");
            estate_value.push("009");
            estate_value.push("999");
        }
        else {
            estate_value.push(estateTypeToValue(btn_text)); // 버튼의 텍스트 값을 가져와 배열에 추가
        }
        
    });
    return estate_value;
    
}

/**
 *  sale 타입을 값으로변경하는 함수
 * @param {string} saleType - sale 타입 
 */
function saleTypeToValue(saleType) {
    let saleValue;
    switch (saleType) {
        case "매매":
            saleValue = "001";
            break;
        case "임대":
            saleValue = "002";
            break;
        case "교환":
            saleValue = "003";
            break;
        default:
            console.error("유효하지 않은 거래종류입니다.");
            break;
    }
    return saleValue;
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
        case "상가":
            estateValue = "001";
            break;
        case "사무실":
            estateValue = "002";
            break;
        case "공장/창고":
            estateValue = "003";
            break;
        case "지식산업센터":
            estateValue = "004";
            break;
        case "건물":
            estateValue = "005";
            break;
        case "토지":
            estateValue = "006";
            break;
        case "아파트":
            estateValue = "007";
            break;
        case "오피스텔":
            estateValue = "008";
            break;
        case "빌라/주택":
            estateValue = "009";
            break;
        case "기타":
            estateValue = "999";
            break;
        default:
            console.error("유효하지 않은 매물유형입니다.");
            break;
    }
    return estateValue;
}
/**
 * 필터값 초기화 함수
 */
function resetFilters() {
    $("#estate_type_filter").val("").trigger("change");
    $("#sale_type_filter").val("").trigger("change");

    var priceSlider = document.getElementById("price_slider");
    priceSlider.noUiSlider.set([0, 2000000]);

    //estateList();
    estateNewList();  
}

/**
 * 필터 - 매물종류, 거래방식 가져오는 함수
 * @returns
 */
async function getFilterTypes() {
    const url = "/front/back/sell/filter_type_get.php";
    try {
        const result = await callApi("POST", url, {});
        if (!result) return;

        const { message, responseData, statusCode } = result;
        if (statusCode !== 200 || responseData.length == 0) return;

        const { ESTATE_TYPE, SALE_TYPE } = responseData;

        const estateOptionHtml = ESTATE_TYPE.map(function (item, index) {
            const { type_code, type_name } = item;

            return `<option value="${type_code}">${type_name}</option>`;
        });

        const saleOptionHtml = SALE_TYPE.map(function (item, index) {
            const { type_code, type_name } = item;

            return `<option value="${type_code}">${type_name}</option>`;
        });

        $("#estate_type_filter").append(estateOptionHtml);
        $("#sale_type_filter").append(saleOptionHtml);
    } catch (error) {
        console.error("getFilterTypes error:", error);
    }
}

/**
 * 가격대 필터 셋팅 함수
 * @param {*} slider
 */
function setPriceSlider(slider) {
    const min = 0;
    const max = 100000000;

    // range - 가격대 //
    noUiSlider.create(slider, {
        start: [min, max], //  초기 시작값 설정
        connect: true, // 슬라이더 핸들 사이를 채움
        // 툴팁 단위설정
        tooltips: [
            {
                to: function (value) {
                    return formatPrice(Math.round(value * 100) / 100); // 소수점 이하 2자리로 반올림
                },
            },
            {
                to: function (value) {
                    return formatPrice(Math.round(value * 100) / 100); // 소수점 이하 2자리로 반올림
                },
            },
        ],
        step: 1000, // 슬라이더 스텝 크기 설정
        keyboardSupport: true, // 키보드 지원 활성화
        keyboardDefaultStep: 1000, // 키보드 화살표 키 기본 스탭 크기
        keyboardPageMultiplier: 10, // Page Up/Down 키에 대한 배수(기본 스텝 크기 기준)
        // keyboardMultiplier: 10, // Shift 키와 함께 사용할 때 배수(기본 스텝 크기 기준)
        range: {
            min: min, // 슬라이더 최소값
            max: max, // 슬라이더 최대값
        },
        format: wNumb({
            decimals: 0, // 소수점 자릿수 설정
            suffix: "", // 접미사 설정 (여기서는 빈 문자열)
        }),
    });

    // 인풋박스와 연동
    const inputNumber = document.getElementById("input_price_start");
    const inputNumber2 = document.getElementById("input_price_end");
    inputNumber &&
        inputNumber2 &&
        slider &&
        (slider.noUiSlider.on("update", function (e, i) {
            e = e[i];
            i ? (inputNumber2.value = e) : (inputNumber.value = e);
        }),
        inputNumber.addEventListener("change", function () {
            slider.noUiSlider.set([this.value, null]);
        }),
        inputNumber2.addEventListener("change", function () {
            slider.noUiSlider.set([null, this.value]);
        }));

    // 툴팁 항상 생성하기
    // mergeTooltips(slider, 100000, " - ");
}

/**
 * 초기 슬라이더 값을 설정하는 함수
 * @param {Object} slider noUiSlider 객체
 * @param {string} minParam 최소값 파라미터 이름
 * @param {string} maxParam 최대값 파라미터 이름
 */
function setIniSliderValues(slider) {
    slider.noUiSlider.set(["0", "100000000"]);
}

/**************************************************
 * *************** 검색 관련 함수 *************** *
 **************************************************/

/**
 * 검색바에서 방향키 위/아래 이벤트 결과 함수
 * @param {*} e
 * @param {*} searchTerm
 * @param {*} resultListItems
 * @param {*} selectedIndex
 */
function upDownEvent(e, searchTerm, resultListItems, selectedIndex) {
    currentIndex = -1; // 리스트 내에서 현재 선택된 항목을 추적하는 인덱스
    const { searchBox } = getSearchElements();

    if (searchBox.is(":visible") && resultListItems.length > 0) {
        // 현재 선택된 항목이 없을 때만 currentIndex를 0으로 초기화
        if (currentIndex === -1) {
            // currentIndex = 0; // 첫 번째 항목부터 시작
            currentIndex = selectedIndex !== -1 ? selectedIndex : 0; // selected가 없으면 0번째부터 시작
        }

        if (e.key === "ArrowDown") {
            currentIndex = (currentIndex + 1) % resultListItems.length; // 인덱스 증가
        } else if (e.key === "ArrowUp") {
            currentIndex = (currentIndex - 1 + resultListItems.length) % resultListItems.length; // 인덱스 감소
        }

        // 리스트 항목을 선택하고 시각적으로 강조
        resultListItems.removeClass("selected"); // 기존 선택된 항목의 스타일 제거
        resultListItems.eq(currentIndex).addClass("selected"); // 새로운 항목에 스타일 적용

        // 선택된 항목이 리스트에서 보이도록 스크롤
        resultListItems.eq(currentIndex)[0].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
}

/**
 * 검색바에서 엔터 이벤트 결과 함수
 * @param {*} searchTerm
 * @param {*} resultListItems
 * @param {*} selectedIndex
 */
function enterEvent(e, searchTerm, resultListItems, selectedIndex) {
    const { searchBox } = getSearchElements();

    // if (!searchBox.val()) return;

    // 빈 값이거나 숫자로만 이루어진 상태에서 Enter 키가 눌리면 estateList 실행
    if (searchTerm === "" || /^\d+$/.test(searchTerm)) {
        searchEstateNo = true; // 매물번호 검색 플래그 변경
        //estateList(searchTerm); // estateList(searchTerm) 실행
        estateNewList(searchTerm); // estateList(searchTerm) 실행
        searchBox.slideUp(100, "easeOutQuad");
        searchPlacesExecuted = false; // searchPlaces()가 실행되지 않았음
    }
    // searchPlaces()가 실행된 후, 리스트 첫 항목 클릭
    else if (searchPlacesExecuted) {
        searchEstateNo = false; // 매물번호 검색 플래그 변경
        // searchPlaces()가 실행된 후, selected된 항목이 있을 경우 해당 항목 클릭
        resultListItems.eq(selectedIndex).click(); // selected된 리스트 항목 클릭
        //estateList(); // estateList(searchTerm) 실행
        estateNewList(); // estateList(searchTerm) 실행
    }
}

/**
 * 키워드 검색을 요청하는 함수입니다
 * @returns
 */
function searchPlaces() {
    const { listEl, searchBox, palcesList, searchInput } = getSearchElements();
    const keyword = searchInput.val().trim();

    removeAllChildNods(listEl); // 리스트 비우기

    // if (!keyword.replace(/^\s+|\s+$/g, "")) {
    if (!keyword) {
        palcesList.empty();
        searchBox.slideUp(200, "easeOutQuad");
        return false;
    }

    // 두 검색의 상태를 추적할 카운터 변수
    let searchesCompleted = 0;
    let hasResults = false; // 하나라도 결과가 있으면 true로 설정

    // 키워드 검색
    ps.keywordSearch(keyword, function (data, status, pagination) {
        searchesCompleted++;
        if (status === kakao.maps.services.Status.OK) {
            displayPlaces(data); // 검색 결과가 있으면 표시
            hasResults = true; // 결과가 있으므로 true로 설정
            searchBox.slideDown(100, "easeOutQuad");
        }
        checkSearchCompletion(searchesCompleted, hasResults); // 검색이 완료될 때마다 호출
    });

    // 주소 검색
    geocoder.addressSearch(keyword, function (data, status, pagination) {
        searchesCompleted++;
        if (status === kakao.maps.services.Status.OK) {
            displayPlaces(data); // 검색 결과가 있으면 표시
            hasResults = true; // 결과가 있으므로 true로 설정
            searchBox.slideDown(100, "easeOutQuad");
        }
        checkSearchCompletion(searchesCompleted, hasResults); // 검색이 완료될 때마다 호출
    });

    // ps.keywordSearch(keyword, placesSearchCB, { size: "5" }); // 키워드 검색
    // geocoder.addressSearch(keyword, placesSearchCB, { size: "5", analyze_type: "similar" }); // 장소 검색
}

/**
 * 두 검색이 모두 완료되었을 때 결과를 확인하는 함수
 * @param {number} searchesCompleted 검색이 완료된 횟수
 * @param {boolean} hasResults 하나 이상의 검색에서 결과가 있었는지 여부
 */
function checkSearchCompletion(searchesCompleted, hasResults) {
    const { palcesList } = getSearchElements();

    // 두 검색이 모두 완료된 경우에만 실행
    if (searchesCompleted === 2) {
        if (hasResults) {
            // 검색 결과가 있는 경우 첫 번째 항목에 selected 클래스를 추가
            palcesList.children("li").eq(0).addClass("selected");
        } else {
            // 두 검색 모두 결과가 없으면 "검색 결과가 없습니다." 표시
            const html = `
            <li class="item">
                <div class="info">
                    <h5>
                        검색 결과가 없습니다.
                    </h5>
                </div>
            </li>`;

            palcesList.html(html);
            // $("#search_result_box").slideUp(100, "easeOutQuad");
        }
    }
}

/**
 * 장소검색이 완료됐을 때 호출되는 콜백함수 입니다
 * @param {*} data
 * @param {*} status
 * @param {*} pagination
 * @returns
 */
function placesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
        displayPlaces(data); // 정상적으로 검색이 완료됐으면 검색 목록과 마커를 표출합니다
        // displayPagination(pagination); // 페이지 번호를 표출합니다
        $("#search_result_box").slideDown(100, "easeOutQuad");
    } else {
    }
}

/**
 * 검색 결과 목록과 마커를 표출하는 함수입니다
 * @param {*} places
 */
function displayPlaces(places) {
    const { listEl } = getSearchElements();
    let fragment = document.createDocumentFragment();
    // menuEl = document.getElementById("menu_wrap"),
    // bounds = new kakao.maps.LatLngBounds(),
    // listStr = "";

    // 검색 결과 목록에 추가된 항목들을 제거합니다
    // removeAllChildNods(listEl);

    // 지도에 표시되고 있는 마커를 제거합니다
    removeMarker(markers);

    for (var i = 0; i < places.length; i++) {
        // 마커를 생성하고 지도에 표시합니다
        var placePosition = new kakao.maps.LatLng(places[i].y, places[i].x);
        let itemEl = getListItem(i, places[i]); // 검색 결과 항목 Element를 생성

        // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해 LatLngBounds 객체에 좌표를 추가합니다
        // bounds.extend(placePosition);

        // let marker = addMarker(placePosition, i); // 마커를 생성하고 지도 위에 마커를 표시

        // 마커와 검색결과 항목에 mouseover 했을때 해당 장소에 인포윈도우에 장소명을 표시합니다
        // mouseout 했을 때는 인포윈도우를 닫습니다
        (function (marker, places) {
            // 리스트 click
            itemEl.onclick = async function () {
                // 세션에 검색장소 저장
                sessionStorage.setItem("lastSearchedPlace", JSON.stringify(places));

                // 필요한 파라미터 및 쿠키를 한 번에 업데이트합니다
                updateURL({
                    curLat: places.y,
                    curLng: places.x,
                });

                // URL 변경 후 즉시 파라미터를 체크하고 로그 출력
                // handleUrlChange();

                // 이동할 위도 경도 위치를 생성합니다
                var moveLatLon = new kakao.maps.LatLng(places.y, places.x);

                // 지도 중심을 이동 및 줌 레벨 변경
                map.setCenter(moveLatLon);
                map.setLevel(4);

                // 이동된 중심에 마커를 생성하고 지도에 표시한다.
                // const marker = new kakao.maps.Marker({
                //     map: map,
                //     position: moveLatLon,
                // });
                // markers.forEach((marker) => marker.setMap(null)); // 기존 마커를 모두 제거한다.
                // markers.push(marker); // 새로운 마커를 마커 배열에 추가한다.

                // searchDetailAddrFromCoords(moveLatLon, displayAddressInfo); // 법정동 상세 주소 정보를 요청
                // handleMapClick({ lat: places.y, lng: places.x }); // 폴리곤 생성
                // searchArroundPlaces({ lat: places.y, lng: places.x });

                saveSearchHistory({ address: places.address_name, lat: places.y, lng: places.x }); // 최근 검색 이력 저장
            };

            // 마커 mouseover
            // kakao.maps.event.addListener(marker, "mouseover", function () {
            //     displayInfowindow(marker, title);
            // });

            // 마커 mouseout
            // kakao.maps.event.addListener(marker, "mouseout", function () {
            //     infowindow.close();
            // });

            // 리스트 mouseover
            // itemEl.onmouseover = function () {
            //     displayInfowindow(marker, title);
            // };

            // 리스트 mouseout
            // itemEl.onmouseout = function () {
            //     infowindow.close();
            // };
        })(marker, places[i]);

        fragment.appendChild(itemEl);
    }

    listEl.appendChild(fragment); // 검색결과 항목들을 검색결과 목록 Element에 추가
    listEl.scrollTop = 0; // 검색결과 최상위로 스크롤

    // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
    // map.setBounds(bounds);
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
 * 검색결과 항목을 Element로 반환하는 함수입니다
 * @param {*} index
 * @param {*} places
 * @returns
 */
function getListItem(index, places) {
    const { searchInput } = getSearchElements();
    const keyword = searchInput.val().trim();
    const keywords = searchInput.val().trim().split(/\s+/);

    let itemStr = "";
    var el = document.createElement("li");

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

    // 카테고리 그룹 코드가 있을 경우 아이콘을 할당
    let icon = "";
    if (places.category_group_code) {
        icon = categoryIcons[places.category_group_code] || "";
    } else {
        // 카테고리 그룹 코드가 없을 경우 기본 아이콘 할당
        icon = '<i class="las la-lg la-building"></i>';
    }

    // 장소 이름이 있을 경우
    if (places.place_name) {
        itemStr += `
        <div class="info" data-lat="${places.y}" data-lng="${places.x}">
            <h5>
                ${icon} ${highlightKeyword(places.place_name)}
            </h5>`;
    } else {
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
        itemStr += `<p class="jibun gray">${highlightKeyword(places.address_name)}</p>`; // 지번주소
    }

    // itemStr += '  <span class="tel">' + places.phone + "</span>"; // 전화번호
    itemStr += `</div>`;

    el.innerHTML = itemStr;
    el.className = "item";

    return el;
}

/**************************************************
 * *************** 클러스터링 관련 함수 *************** *
 **************************************************/
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
    const latlng = new kakao.maps.LatLng(data.lat + randomOffset(), data.lng + randomOffset());

    // 클러스터러에 추가할 마커 생성
    var marker = new kakao.maps.Marker({
        position: latlng,
    });

    // 마커에 estate_type과 sale_type 정보를 저장하여 구분 가능하게 설정
    marker.estate_no = data.estate_no;
    marker.estate_type = data.estate_type;
    marker.sale_type = data.sale_type;
    marker.lat = data.lat;
    marker.lng = data.lng;
    marker.sale_price = data.sale_price;
    marker.rent_price = data.rent_price;

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
    // });

    // return customOverlay;
}

// 클러스터러 객체들을 저장할 변수
let clusterersByType = {};

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
            const saleType = markers[0].sale_type; // 첫 번째 매물의 sale_type 사용
            const clusterCount = markers.length; // 클러스터에 포함된 매물의 개수

            // 커스텀 클러스터 디자인 적용
            const customClusterContent = `
                <ul class="custom-cluster-content position-absolute text-center font14 bg-white border border-danger overflow-hidden" style="min-width:55px; border-radius:10px;">
                    <li class="color-gray bg-white p-1">
                        <span class="">${estateType}</span>
                    </li>
                    <li class="text-white p-1" style="background-color:var(--var-color-main-1)">
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

            // 모든 매물 리스트를 부드럽게 숨기기
            $(".mcs-list").children("dl").fadeOut(100);

            const markers = cluster.getMarkers();
            const estateNos = markers.map((marker) => marker.estate_no);

            // 한 번에 표시할 매물 선택 후 나타내기
            estateNos.forEach(function (estateNo) {
                $(".mcs-list").children(`dl[data-estate-no="${estateNo}"]`).delay(100).fadeIn(400); // 한 번에 부드럽게 나타나도록 처리
            });

            $(".map-content").addClass("active");
            $(".map-history").addClass("active");
            $(".map-sale-group").addClass("active");
            $(".map-estate-group").addClass("active");
            $(".map-price-group").addClass("active");
            $(".map-bg").removeClass("full");
            $("#rvWrapper").removeClass("full");
            // $(".map-sell-view").addClass("active");
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

/**************************************************
 * *************** 도구 사용 관련 함수 *************** *
 **************************************************/

/**
 * 특정 div의 내용을 새로운 창에서 인쇄할 수 있도록 설정하는 함수
 * @param {string} divId - 인쇄할 div 요소의 ID
 */
function printDiv(divId) {
    // 사용자에게 PDF 저장 안내 메시지 표시
    alert('PDF로 저장하려면 "PDF로 저장" 옵션을 선택해주세요.');

    // 선택한 div 요소의 HTML 내용을 가져옴
    var content = document.getElementById(divId).outerHTML;

    // 스크롤 가능한 요소인지 확인 (만약 스크롤 가능한 요소가 아니라면 부모 요소에서 가져옴)
    var scrollableElement = content;
    while (scrollableElement && scrollableElement.scrollTop === undefined) {
        scrollableElement = scrollableElement.parentElement;
    }

    // 선택한 div의 높이와 너비를 가져옴
    var mapBgElement = document.getElementById(divId);
    var mapHeight = mapBgElement.offsetHeight + 50; // 요소의 높이
    var mapWidth = mapBgElement.offsetWidth; // 요소의 높이

    // 화면 크기에 맞게 팝업 창 크기를 설정
    // var screenWidth = window.innerWidth;
    // var screenHeight = window.innerHeight;

    // 새 창을 열고 창 크기를 설정
    // var printWindow = window.open("", "", `width=${screenWidth},height=${screenHeight}`);

    // 새 창을 열고, 창 크기를 전체 화면으로 설정
    var printWindow = window.open("", "", "fullscreen=yes");

    // 스크롤된 위치와 클라이언트 높이를 계산 (스크롤 가능한 요소가 있을 경우)
    var scrollTop = scrollableElement ? scrollableElement.scrollTop : 0;
    var clientHeight = scrollableElement ? scrollableElement.clientHeight : window.innerHeight;

    // 모든 스타일시트를 가져와서 추가 (link 태그와 style 태그 포함)
    var stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((style) => style.outerHTML)
        .join("");

    // 새로운 창에 HTML 및 스타일 구조 작성
    printWindow.document.write(`
        <html>
        <head>
            <title>원스톱 부동산 종합 플랫폼 서비스 토디</title>
            <style>
                /* 인쇄될 페이지의 기본 스타일 */
                body { 
                    margin: 20px; 
                    font-family: Arial, sans-serif; 
                    line-height: 1.5; 
                    background: #fff !important;
                    // overflow: hidden !important;
                    height: ${clientHeight}px;
                    // max-height: ${clientHeight}px;
                    margin: 0;
                    padding: 0;
                    zoom: 1; /* 기본값 */
                }

                /* 인쇄할 콘텐츠의 스타일 */
                #print-content {
                    position: relative;
                    // top: -${scrollTop}px; /* 스크롤된 위치에서 인쇄 시작 */
                    height: ${mapHeight}px;
                    // overflow: hidden;
                    width: 100%; /* 콘텐츠 너비 조정 */
                    max-width: 100%; /* 최대 너비를 제한 */
                    transform: scale(1); /* 기본 값 */
                    transform-origin: top left;
                }

                /* 지도 영역의 스타일 */
                #map_bg {
                    // width: 100% !important;
                    width: ${mapWidth};
                    height: ${mapHeight};
                    right: auto !important;
                    left: 50%;
                    transform: translateX(-50%);
                }

                /* 인쇄에 표시되지 않도록 설정된 요소들 */
                #draw_toolbox {
                    display: none !important;
                }

                /* 설명 텍스트 스타일 */
                #des {
                    text-align: center;
                    padding-bottom: 60px;
                }

                /* 바닥글 스타일 (고정 위치) */
                .print-footer {
                    display: block;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    text-align: center;
                    font-size: 12px;
                    padding: 10px;
                    border-top: 1px solid #000;
                }

                /* 인쇄할 때 적용될 미디어 쿼리 */
                @media print {
                    // @page {
                    //     size: A4; /* A4 용지로 인쇄 설정 */
                    //     margin: 10mm;
                    // }
                }
            </style>
            ${stylesheets} <!-- 스타일시트 추가 -->
        </head>
        <body id="body">            
            <div id="print-content">
                ${content} <!-- 인쇄할 div의 콘텐츠 -->
            </div>
                
            <!-- 설명 텍스트 -->
            <div id="des">
                <p>- 출처 : 카카오맵 (https://map.kakao.com)</p>
                <p>[본 서비스에서 제공하는 지도는 사용자의 편의를 위해 단순 열람조회용으로 제공되는 것으로 데이터 오류 등의 이유로 실제 내용과 일치하지 않을 수 있습니다.]</p>
            </div>

            <!-- 인쇄할 때 하단에 표시되는 바닥글 -->
            <div class="print-footer">
                © 2024 투에스종합개발
            </div>
        </body>
        </html>
    `);

    // 새 창의 문서를 닫고 포커스를 설정
    printWindow.document.close();
    printWindow.focus();

    // 창이 로드되면 인쇄 명령을 실행하고 창을 닫음
    printWindow.onload = function () {
        printWindow.print();
        // 약간의 지연을 두고 창을 닫음
        setTimeout(function () {
            printWindow.close();
        }, 1000); // 1초(1000ms) 후 창을 닫음
    };
}

/**
 * 비동기 함수로 특정 div의 HTML 내용을 이미지로 변환하고, 다운로드하는 함수
 * @param {string} divId - HTML 콘텐츠를 가져올 div 요소의 ID
 */
async function saveMap(divId) {
    // UTF-8 문자열을 Base64로 인코딩하는 함수
    function encodeToBase64(str) {
        const utf8Encoder = new TextEncoder(); // UTF-8 인코더
        const encodedBytes = utf8Encoder.encode(str); // 문자열을 UTF-8 바이트 배열로 변환
        return btoa(String.fromCharCode(...encodedBytes)); // 바이트 배열을 Base64로 인코딩
    }

    // 전달된 div ID로 요소를 선택하고, 해당 요소의 HTML을 가져옴
    const mapBgElement = document.getElementById(divId);
    const mapHtml = mapBgElement.innerHTML; // 선택한 요소의 HTML 가져오기

    // 선택한 요소의 높이와 너비를 계산 (높이는 50픽셀을 추가)
    const mapHeight = mapBgElement.offsetHeight; // 요소의 높이
    const mapWidth = mapBgElement.offsetWidth; // 요소의 너비

    // HTML 콘텐츠를 다시 래핑하여 새로운 구조를 만듦
    const htmlContent = `
        <div style="position:relative; height:${mapHeight}px; width:${mapWidth}px;">
            ${mapHtml}
        </div>
    `;

    // Base64로 인코딩된 HTML 콘텐츠
    const encodedHtml = encodeToBase64(htmlContent);

    // // 가져온 HTML 콘텐츠를 이스케이프 처리하여 보안상 안전하게 만듦
    // const escapeHtmlContent = escapeHtml(htmlContent); // HTML 이스케이프 처리

    // 서버에 요청을 보낼 URL 설정
    const url = "/front/back/realPrice/download_map_image.php";

    // 서버에 전달할 데이터 객체 (HTML 콘텐츠, 너비, 높이 포함)
    const dataObj = {
        // html: (encodeURIComponent(escapeHtmlContent)), // 인코딩된 HTML 데이터
        html: encodedHtml, // Base64로 인코딩된 HTML 데이터
        width: mapWidth, // 요소의 너비
        height: mapHeight, // 요소의 높이
    };

    try {
        // callApi 함수를 사용하여 서버에 POST 요청 (API 호출)
        const res = await callApi("POST", url, dataObj);

        // 서버로부터 성공 응답을 받았을 때
        if (res.success) {
            // 이미지 파일 다운로드를 위한 링크를 동적으로 생성
            var link = document.createElement("a");
            link.href = res.image_url; // 서버에서 반환된 이미지 URL
            link.download = "map_image.png"; // 저장할 파일 이름 지정

            // 링크를 DOM에 추가하고, 클릭 이벤트로 다운로드 실행
            document.body.appendChild(link);
            link.click();

            // 다운로드가 끝나면 링크를 DOM에서 제거
            document.body.removeChild(link);
        } else {
            // 서버로부터 실패 메시지를 받은 경우 경고 메시지 표시
            alert("Error: " + res.message);
        }
    } catch (error) {
        // 오류가 발생한 경우 콘솔에 에러 메시지 출력
        console.log("Error: " + error);
    }
}

/**************************************************
 * **************** 공유/찜/인쇄 함수 **************** *
 **************************************************/

/**
 * 공유 관련 이벤트 초기화 함수
 */
function initShareEvents() {
    // Kakao가 초기화되었는지 확인
    if (!Kakao.isInitialized()) {
        Kakao.init("847d6b0bbbc2dbfe6b7c0c1f82d8cd71");
    }

    const currentUrl = location.href;
    console.log(currentUrl);

    Kakao.Share.sendDefault({
        // container: "#kakaotalk_sharing_btn",
        objectType: "text",
        text: `[매물 공유] #토디 #매물정보 #부동산`,
        link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl,
        },
        // content: {
        //     title: title,
        //     description: "#토디 #삽니다 #부동산",
        //     // imageUrl: logoSrc,
        //     link: {
        //         // [내 애플리케이션] > [플랫폼] 에서 등록한 사이트 도메인과 일치해야 함
        //         mobileWebUrl: "http://tody.it7.kr/front/views/find/find_view.html?viewNo=35",
        //         webUrl: "http://tody.it7.kr/front/views/find/find_view.html?viewNo=35",
        //     },
        // },
        // social: {
        // likeCount: 286,
        // commentCount: 45,
        // sharedCount: 845,
        // },
        // buttons: [
        //     {
        //         title: "게시글 보기",
        //         link: {
        //             webUrl: "http://tody.it7.kr/front/views/find/find_view.html?viewNo=35",
        //         },
        //     },
        // ],
    });
}

/**
 * url 복사 함수
 */
function copyUrl() {
    // 클립보드에 텍스트 복사 시도
    navigator.clipboard
        .writeText(location.href)
        .then(function () {
            // sweetAlertMessage("URL이 클립보드에 복사되었습니다.", "", "s");
            $("#modalAlert").iziModal("open");
            $("#alert_message").html("<h2><span>URL</span>이 클립보드에 복사되었습니다.</h2>");
        })
        .catch(function (error) {
            console.log("복사 실패: " + error);
        });
}

/**
 * 즐겨찾기 토글 함수
 */
function toggleFavorite(button) {
    if (button.hasClass("active")) {
        favoriteCancel();
    } else {
        favoriteRegister();
    }
}

/**
 * 즐겨찾기 등록 함수
 * @returns
 */
async function favoriteRegister() {
    const user = userInfo();
    if (!user) {
        $("#modalAlert").iziModal("open");
        $("#alert_message").html("<h2><span>회원 전용</span> 기능입니다.</h2>");
        return;
    }
    const estateEle = $("#map_sell_view .estate-no");
    const estateNo = estateEle.text();
    const address = $("#msv_content").find(".address_jibun").text();
    // geocoder.addressSearch(
    // address,
    // function (data, status, pagination) {
    // if (status === daum.maps.services.Status.OK) {
    // const result = data[0];
    // const lat = result.y;
    // const lng = result.x;

    const lat = estateEle.attr("data-lat");
    const lng = estateEle.attr("data-lng");
    const dataObj = {
        ...user,
        address: encodeURIComponent(address),
        lat: encodeURIComponent(lat),
        lng: encodeURIComponent(lng),
        type: encodeURIComponent("estate"),
        estateNo: encodeURIComponent(estateNo),
    };

    callApiAbort("/front/back/favorite/favorite_register_realPrice.php", "POST", dataObj, "favoriteRegister")
        .then((response) => {
            if (!response) {
                $("#modalAlert").iziModal("open");
                $("#alert_message").html("<h2>다시 시도해주세요.</h2>");
                return;
            }

            const { responseData, message, statusCode } = response;
            if (statusCode !== 200) return;

            $("#modalAlert").iziModal("open");
            $("#alert_message").html("<h2><span>찜</span>으로 등록되었습니다.</h2>");

            $("#favorite_btn").addClass("active");
            getRescentHistory();
        })
        .catch((error) => {
            console.log(error);
        });
    // }
    // },
    // { size: "5", analyze_type: "similar" }
    // ); // 장소 검색
}

/**
 * 즐겨찾기 취소 함수
 * @returns
 */
async function favoriteCancel() {
    const user = userInfo();
    if (!user) {
        $("#modalAlert").iziModal("open");
        $("#alert_message").html("<h2><span>회원 전용</span> 기능입니다.</h2>");
        return;
    }

    const estateEle = $("#map_sell_view .estate-no");
    const estateNo = estateEle.text();
    console.log(estateNo);

    // const address = $("#msv_content").find(".address_jibun").text();
    const dataObj = {
        ...user,
        estateNo: encodeURIComponent(estateNo),
        type: encodeURIComponent("estate"),
    };

    callApiAbort("/front/back/favorite/favorite_cancel_estate.php", "POST", dataObj, "favoriteCancel")
        .then((response) => {
            if (!response) {
                $("#modalAlert").iziModal("open");
                $("#alert_message").html("<h2>다시 시도해주세요.</h2>");
                return;
            }

            const { responseData, message, statusCode } = response;
            if (statusCode !== 200) return;

            $("#modalAlert").iziModal("open");
            $("#alert_message").html("<h2><span>해제</span>되었습니다.</h2>");

            $("#favorite_btn").removeClass("active");
            getRescentHistory();
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * 즐겨찾기 확인 함수
 * @returns
 */
async function favoriteCheck(estateNo) {
    const user = userInfo();
    if (!user) {
        return;
    }

    const dataObj = {
        ...user,
        estateNo: encodeURIComponent(estateNo),
    };

    callApiAbort("/front/back/favorite/favorite_check_estate.php", "POST", dataObj, "favoriteCheck")
        .then((response) => {
            if (!response) return;

            let { responseData, message, statusCode } = response;
            if (statusCode !== 200) return;
            if (responseData && responseData.cnt > 0) {
                $("#favorite_btn").addClass("active");
            } else {
                $("#favorite_btn").removeClass("active");
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * 상세 정보 인쇄하는 함수
 * @returns
 */
function printSelectedSections() {
    // 모든 .map-content 하위의 요소들을 숨김
    var mapContent = $("#map_sell_view").clone();

    // 모바일에서 팝업 차단이 일어날 수 있으므로 새 창이 열리는지 확인
    var printWindow = window.open("", "_blank", "fullscreen=yes");
    if (!printWindow) {
        $("#modalAlert").iziModal("open");
        $("#alert_message").html("<h2>새 창이 <span>차단</span>되었습니다. 팝업 차단을 해제해주세요.</h2>");
        return;
    }

    // 새 창을 열어 인쇄 미리보기를 설정
    // var printWindow = window.open("", "", "fullscreen=yes");

    // 외부 스타일시트를 link 태그로 복사
    var externalStylesheets = Array.from(document.styleSheets)
        .filter(function (styleSheet) {
            return styleSheet.href; // 외부 스타일시트만 선택
        })
        .map(function (styleSheet) {
            return `<link rel="stylesheet" href="${styleSheet.href}" />`;
        })
        .join("\n");

    // 내부 스타일시트를 cssRules로 복사
    var internalStyles = Array.from(document.styleSheets)
        .filter(function (styleSheet) {
            return !styleSheet.href; // 내부 스타일시트만 선택
        })
        .map(function (styleSheet) {
            try {
                return Array.from(styleSheet.cssRules)
                    .map(function (rule) {
                        return rule.cssText;
                    })
                    .join("\n");
            } catch (e) {
                // 크로스 오리진 문제로 접근할 수 없는 경우 빈 문자열 반환
                console.warn("크로스 오리진 문제로 인해 스타일시트를 가져올 수 없습니다:", styleSheet.href);
                return "";
            }
        })
        .join("\n");

    // 새 창에 인쇄 미리보기용 HTML을 작성
    var printDocument = printWindow.document;
    var printContent = `
        <html>
        <head>
            <title>인쇄 미리보기</title>
            ${externalStylesheets} <!-- 외부 스타일시트를 link 태그로 추가 -->
            <style>
                body {
                    background-color: #fff;
                }
                .map-content {
                    margin-left: 0;
                    height: auto;
                    top: 0 !important;
                }
                .map-sell-view {
                    overflow: unset;
                    max-width: 500px;
                }
                .map-sell-view .msv-content {
                    overflow: unset;
                }
                ${internalStyles} <!-- 내부 스타일시트를 스타일로 추가 -->
            </style>
        </head>
        <body>
            <div id="print-content" class="map-sell-view active">
            ${mapContent.html()} <!-- 선택한 콘텐츠가 여기에 포함됨 -->
            </div>

            <div class="print-footer">
                © 2024 투에스종합개발
            </div>
            </body>
            </html>
            `;
    // <script src="/front/assets/js/jquery-3.3.1.js"></script>
    // <script src="/assets/libs/swiper/swiper-bundle.min.js"></script>
    // <script src="/front/js/sell/sell.js"></script>

    printDocument.open();
    printDocument.write(printContent);
    printDocument.close();

    // 창이 로드되면 인쇄 명령을 실행하고 창을 닫음
    printWindow.onload = function () {
        printWindow.print();
        // 인쇄 이력 저장 함수 호출
        savePrintHistory();
        // 약간의 지연을 두고 창을 닫음
        setTimeout(function () {
            printWindow.close();
        }, 1000); // 1초(1000ms) 후 창을 닫음
    };
}

/**
 * 인쇄 이력 저장하는 함수
 * @param {*} data
 * @returns
 */
function savePrintHistory() {
    const user = userInfo();
    if (!user) return;

    const estateEle = $("#map_sell_view .estate-no");
    const estateNo = estateEle.text();
    const address = $("#msv_content").find(".address_jibun").text();
    // geocoder.addressSearch(
    // address,
    // function (data, status, pagination) {
    // if (status === daum.maps.services.Status.OK) {
    // const result = data[0];
    // const lat = result.y;
    // const lng = result.x;

    const lat = estateEle.attr("data-lat");
    const lng = estateEle.attr("data-lng");

    const dataObj = {
        ...user,
        address: encodeURIComponent(address),
        lat: encodeURIComponent(lat),
        lng: encodeURIComponent(lng),
        estateNo: encodeURIComponent(estateNo),
        type: encodeURIComponent("estate"),
    };

    callApiAbort("/front/back/history/save_print_history.php", "POST", dataObj, "savePrintHistory")
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
 * 최근 이력 가져오는 함수
 * @returns
 */
function getRescentHistory() {
    const user = userInfo();
    if (!user) return;

    const dataObj = {
        ...user,
        type: encodeURIComponent("estate"),
    };

    callApiAbort("/front/back/history/get_recent_history.php", "POST", dataObj, "getRescentHistory")
        .then((response) => {
            if (!response) {
                return;
            }

            const { responseData, message, statusCode } = response;
            if (statusCode !== 200) return;

            const searchResult = responseData.search_history;
            const favoriteResult = responseData.favorites_history;
            const printResult = responseData.print_history;
            const historyList = $(".mh-list");

            if (searchResult) {
                const historyHtml = searchResult
                    .map(function (item, index) {
                        return `
                            <dl class="${index >= 3 ? "d-none" : ""}">
                                <dt class="history-address cursor-pointer" data-lat="${item.latitude}" data-lng="${item.longitude}">${item.jibun_address}</dt>
                                <dd><button class="remove-history-btn btn-line-red-s" data-no="${item.idx}" data-type="search">삭제</button></dd>
                            </dl>`;
                    })
                    .join("");
                historyList.find(".mhl-search").html(historyHtml);
            }

            if (favoriteResult) {
                const historyHtml = favoriteResult
                    .map(function (item, index) {
                        return `
                            <dl class="${index >= 3 ? "d-none" : ""}">
                                <dt class="history-address cursor-pointer" data-lat="${item.latitude}" data-lng="${item.longitude}">${item.jibun_address}</dt>
                                <dd><button class="remove-history-btn btn-line-red-s" data-no="${item.idx}" data-type="favorite">삭제</button></dd>
                            </dl>`;
                    })
                    .join("");
                historyList.find(".mhl-favorite").html(historyHtml);
            }

            if (printResult) {
                const historyHtml = printResult
                    .map(function (item, index) {
                        return `
                            <dl class="${index >= 3 ? "d-none" : ""}">
                                <dt class="history-address cursor-pointer" data-lat="${item.latitude}" data-lng="${item.longitude}">${item.jibun_address}</dt>
                                <dd><button class="remove-history-btn btn-line-red-s" data-no="${item.idx}" data-type="print">삭제</button></dd>
                            </dl>`;
                    })
                    .join("");
                historyList.find(".mhl-print").html(historyHtml);
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * 최근 이력 삭제 함수
 * @param {*} btn
 */
async function removeHistory(btn) {
    const user = userInfo();
    if (!user) return;

    const no = btn.attr("data-no");
    const type = btn.attr("data-type");

    const dataObj = {
        ...user,
        no: encodeURIComponent(no),
        type: encodeURIComponent(type),
    };

    const result = await callApi("POST", "/front/back/history/history_delete_map.php", dataObj);
    if (result.statusCode == 200 && result.message == "SUCCESS") {
        getRescentHistory();
        favoriteCheck();
    }
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
        type: encodeURIComponent("estate"),
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
 * 매물 조회 기록 함수
 * @param {*} responseData
 */
async function recentVisit(responseData) {
    const user = userInfo() || {};
    const pnu = responseData.pnu;
    const lat = responseData.latitude;
    const lng = responseData.longitude;
    const address = responseData.address_jibun;
    const estate_no = responseData.estate_no;

    const dataObj = {
        ...user,
        address: encodeURIComponent(address),
        lat: encodeURIComponent(lat),
        lng: encodeURIComponent(lng),
        pnu: encodeURIComponent(pnu),
        estate_no: encodeURIComponent(estate_no),
    };

    callApiAbort("/front/back/history/recent_visit_register_sale.php", "POST", dataObj, "recentVisit")
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

function onHistoryMarkers(btn) {
    historyMarkers.forEach((marker) => marker.setMap(null)); // 기존 마커를 모두 제거한다.
    var positions = [];
    const dts = btn.closest("div").find("dt");
    $.each(dts, function (index, dt) {
        const lat = $(dt).attr("data-lat");
        const lng = $(dt).attr("data-lng");

        positions.push({
            title: $(dt).text(),
            latlng: new kakao.maps.LatLng(lat, lng),
        });
    });

    // 마커 이미지의 이미지 주소입니다
    var imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";

    for (var i = 0; i < positions.length; i++) {
        // 마커 이미지의 이미지 크기 입니다
        var imageSize = new kakao.maps.Size(24, 35);

        // 마커 이미지를 생성합니다
        var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

        // 마커를 생성합니다
        var marker = new kakao.maps.Marker({
            map: map, // 마커를 표시할 지도
            position: positions[i].latlng, // 마커를 표시할 위치
            title: positions[i].title, // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
            image: markerImage, // 마커 이미지
        });
        historyMarkers.push(marker); // 새로운 마커를 마커 배열에 추가한다.
    }
}

/**************************************************
 * ******************* 헬퍼 함수 ******************* *
 **************************************************/

/**
 * 공통 함수로 분리하여 중복 코드 최소화
 * @returns
 */
function getSearchElements() {
    if ($(window).width() <= 991) {
        return {
            resultListItems: $("#placesListMobile li"),
            searchBox: $("#search_result_box_mobile"),
            searchInput: $("#search_input_mobile"),
            palcesList: $("#placesListMobile"),
            searchInput: $("#search_input_mobile"),
            listEl: document.getElementById("placesListMobile"),
        };
    } else {
        return {
            resultListItems: $("#placesList li"),
            searchBox: $("#search_result_box"),
            searchInput: $("#search_input"),
            palcesList: $("#placesList"),
            searchInput: $("#search_input"),
            listEl: document.getElementById("placesList"),
        };
    }
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

    // 변경된 URL을 감지하고 estateDetail 함수를 호출
    handleUrlChangeForEstateNo();
}

function cutAfterSuffix(text) {
    const suffixes = ['리', '동', '길', '로']; // 기준이 될 접미사 목록
    if(text === undefined || text === null || text === '') {
        return ''; // 빈 문자열이나 null, undefined인 경우 빈 문자열 반환
    }

    // 가장 뒤에 나타나는 접미사를 찾기 위해, 접미사 목록을 순회합니다.
    for (const suffix of suffixes) {
        const lastIndex = text.lastIndexOf(suffix); // 문자열 내에서 접미사가 마지막으로 나타나는 인덱스

        // 해당 접미사가 문자열 내에 존재한다면 (lastIndex가 -1이 아님)
        if (lastIndex !== -1) {
            // 접미사가 시작하는 인덱스에 접미사의 길이를 더하면,
            // 접미사 바로 다음 문자의 인덱스가 됩니다.
            // slice(0, endIndex)는 0부터 endIndex-1까지의 문자열을 반환하므로,
            // lastIndex + suffix.length를 endIndex로 사용하면 접미사까지 포함됩니다.
            return text.slice(0, lastIndex + suffix.length);
        }
    }
    // 어떤 접미사도 발견되지 않으면 원본 문자열을 그대로 반환합니다.
    return text;
}