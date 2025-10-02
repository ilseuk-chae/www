let activeBootstrapTooltips = new Map(); // Map<HTMLElement, bootstrap.Tooltip>
let globalTooltipContents = {};   
$(document).ready(async function () {
    initModal(); // 이지모달 초기화
    initAction(); // 액션 이벤트 초기화
    initSearchEvents(); // 검색 이벤트 초기화
    initHandleEvents(); // 이벤트 초기화
    observeAddress(); // 지번주소 변경 감지
    initMemoEvents(); // 메모 관련 이벤트 초기화

    // popstate 이벤트를 사용하여 URL 변경 감지
    window.addEventListener("popstate", function (e) {});
    initTooltip(); // 툴팁 초기화
    updateMapContentIcons();
    handleMapContentClass();
});

/**************************************************
 * ************* 이벤트 초기화 관련 함수 ************* *
 **************************************************/

/**
 * 페이지 로드 시 tooltip 초기화 실행
 */
async function initTooltip(){
    let isHelpActive = false;
    let tooltipData = {}; // DB에서 가져온 툴팁 데이터를 저장할 객체
    //const activeBootstrapTooltips = new Map(); // Map<HTMLElement, bootstrap.Tooltip>
    // 현재 화면 종류를 가져오는 함수 (body 태그의 data-screen-type 속성 사용)
    function getCurrentScreenType() {
        return $('body').data('screen-type');
    }

    // 서버에서 툴팁 데이터를 가져오는 함수
    function fetchTooltipContent(screenType, callback) {
        // 실제 환경에서는 AJAX 요청을 사용합니다.
        return new Promise((resolve, reject) => {
            $.getJSON("/front/back/00-include/get_tooltips.php", { screen: screenType })
                .done(function(data) {
                    globalTooltipContents = data.responseData || {}; // 전역 변수에 데이터 할당
                    //console.log("fetchTooltipContent: globalTooltipContents에 데이터 할당 완료.", globalTooltipContents);
                    resolve();
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    console.error("툴팁 데이터 로드 실패:", textStatus, errorThrown);
                    globalTooltipContents = {}; // 실패 시 비어있는 객체로 초기화
                    reject(errorThrown);
                });
        });
    }

    // 툴팁 활성화/비활성화 및 내용 업데이트 함수
    async function updateTooltips() {
        //console.log("updateTooltips 함수 실행. isHelpActive:", isHelpActive);
        //console.log("updateTooltips 시작 시 .tooltip-target 요소 개수:", $('.tooltip-target').length);

        // [중요 수정] 모든 툴팁 인스턴스를 dispose하고 맵에서 제거, 속성/이벤트 제거를 일괄적으로 수행.
        // 이는 함수가 호출될 때마다 깨끗한 상태에서 다시 시작하도록 합니다.
        $('.tooltip-target').each(function() {
            let existingTooltipInstance = activeBootstrapTooltips.get(this);
            if (existingTooltipInstance) {
                existingTooltipInstance.dispose();
                activeBootstrapTooltips.delete(this); // [활성화] 맵에서 인스턴스 제거
            }
            $(this).removeAttr('data-bs-title data-bs-toggle'); // data 속성 제거
            $(this).off('click.tooltipHide'); // 이전에 붙였던 click 이벤트 제거
        });
        //console.log("기존 툴팁 정리 루프 완료.");

        if (isHelpActive) {
            // 도움말 모드 활성화 시

            // fetchTooltipContent가 Promise를 반환하므로 직접 await합니다.
            try {
                await fetchTooltipContent(getCurrentScreenType());
            } catch (error) {
                console.error("fetchTooltipContent 호출 중 오류 발생:", error);
                // 에러 발생 시 더 이상 진행하지 않음
                return Promise.reject(error);
            }

            // fetchTooltipContent에서 globalTooltipContents가 채워졌음을 확인
            //console.log("fetchTooltipContent 완료. globalTooltipContents 설정됨.");
            //console.log("툴팁 생성 시작. .tooltip-target 개수:", $('.tooltip-target').length);

            if ($('.tooltip-target').length > 0) {
                $('.tooltip-target').each(function() {
                    const elementId = $(this).attr('id');
                    const tooltipContent = globalTooltipContents[elementId]; // 전역 변수에서 내용 가져옴

                    // 툴팁 내용을 찾은 경우
                    if (tooltipContent) {
                        // [중요 수정] 기존 인스턴스 있다면 dispose하고 맵에서 제거 (갱신 전 명확한 정리)
                        let existingTooltipInstance = activeBootstrapTooltips.get(this);
                        if (existingTooltipInstance) {
                            existingTooltipInstance.dispose();
                            activeBootstrapTooltips.delete(this); // [활성화] 맵에서 인스턴스 제거
                        }

                        // 2. 툴팁 콘텐츠를 data-bs-title 속성에 할당
                        $(this).attr('data-bs-title', tooltipContent);
                        // 3. 툴팁 토글 속성 추가 (Bootstrap 툴팁이 활성화될 수 있도록)
                        $(this).attr('data-bs-toggle', 'tooltip');

                        // 4. Bootstrap Tooltip 인스턴스 생성
                        const newTooltipInstance = new bootstrap.Tooltip(this, {
                            placement: 'auto', // 원하는 위치 (top, bottom, left, right)
                            html: true,       // 툴팁 내용에 HTML 태그가 포함될 수 있다면 true로 설정
                            animation: false, // 툴팁의 나타나고 사라지는 애니메이션 자체를 끕니다.
                            delay: { show: 0, hide: 0 }, // 나타나고 사라지는 딜레이를 0으로 설정.
                            trigger: 'hover', // [추가] 툴팁 트리거를 명시적으로 'hover'로 설정
                        });
                        // 맵에 인스턴스 저장 (나중에 비활성화할 때 사용하기 위함)
                        activeBootstrapTooltips.set(this, newTooltipInstance);

                        // ===== [클릭 이벤트 로직 추가 - 여기에 위치] =====
                        // 요소 클릭 시 툴팁 숨김 및 비활성화 로직
                        $(this).on('click.tooltipHide', function() {
                            const clickedElementId = $(this).attr('id');
                            const clickedTooltipInstance = activeBootstrapTooltips.get(this);

                            if (clickedTooltipInstance) {
                                clickedTooltipInstance.hide(); // 툴팁 숨기기
                                //clickedTooltipInstance.disable(); // 툴팁 자동 재활성화 방지 (매우 중요!)
                                $(this).blur(); // 요소의 포커스를 제거 (클릭 후 포커스가 남을 때 유용)
                                //console.log(`요소 ID '${clickedElementId}' 클릭: 툴팁 숨김 및 비활성화 처리.`);
                            } else {
                                //console.warn(`클릭된 요소 '${clickedElementId}'에 대한 툴팁 인스턴스를 찾을 수 없습니다.`);
                            }
                        });
                        // ===== [클릭 이벤트 로직 추가 끝] =====
                        //console.log(`요소 ID '${elementId}'에 Bootstrap 툴팁 설정 완료.`);
                    } else {
                        // 툴팁 내용이 없는 경우 (DB에 없는 경우)
                        // 기존 정리 로직은 함수 시작 부분에서 이미 처리되었으므로 여기서는 추가 작업 불필요.
                        //console.log(`요소 ID '${elementId}'에 대한 툴팁 내용이 없어 Bootstrap 툴팁을 설정하지 않습니다.`);
                    }
                }); // .each() 끝
                // updateTooltips 함수가 Promise를 반환하도록 최종적으로 Resolve
                return Promise.resolve();
            } else {
                console.warn("툴팁을 생성할 .tooltip-target 요소가 없습니다.");
                return Promise.resolve(); // Promise는 해결
            }
        } else {
            // 도움말 모드 비활성화 시 (초기 공통 처리 부분에서 이미 모든 툴팁 제거됨)
            //console.log("도움말 모드 비활성화 완료.");
            return Promise.resolve();
        }
    }

    // 도움말 버튼 클릭 이벤트
    $('#mapOptionTooltip').on('click', function() {
        isHelpActive = !isHelpActive; // 상태 토글
        $(this).toggleClass('active', isHelpActive); // 버튼 CSS 클래스 토글

        updateTooltips(); // 툴팁 상태 업데이트
    });

    
    $('.tooltip-target').each(function() {
        if (bootstrap.Tooltip.getInstance(this)) { // 이미 툴팁 인스턴스가 있다면
            bootstrap.Tooltip.getInstance(this).dispose();
        }
        $(this).removeAttr('data-bs-title data-bs-toggle');
    });

}
/**
 * 모션 이벤트 초기화 함수
 */
function initAction() {
    if ($(window).width() <= 991) {
        $(".map-content").toggleClass("active");
    }

    let resizeTimer;
    $(window).on("resize", function() {
        clearTimeout(resizeTimer); // 이전 타이머가 있다면 취소
        resizeTimer = setTimeout(function() {
            handleMapContentClass();
        }, 150); // 250ms(0.25초) 동안 추가적인 resize 이벤트가 없으면 함수 실행
    });

    // 지도 - 옵션 - 지역현황 //
    $("#mapOptionAreaOpen").click(function () {
        $(".mo-area").toggleClass("active");
        // $(".mo-area").fadeIn(400, "easeOutQuad");
    });

    $(".mo-area > dl > dd > button").click(function () {
        $(".mo-area").removeClass("active");
        // $(".mo-area").fadeOut(400, "easeOutQuad");
    });

    // 지도 - 옵션 - 도구사용 //
    $("#mapOptionToolOpen").click(function () {
        if ($(".mo-tool").css("display") == "none") {
            $(".mo-tool").fadeIn(400, "easeOutQuad");
            realPriceOverlays.forEach((overlay) => overlay.setVisible(false));
        } else {
            $(".mo-tool").fadeOut(400, "easeOutQuad");
            realPriceOverlays.forEach((overlay) => overlay.setVisible(true));
        }
    });
    $(".mo-tool > dl > dd > button").click(function () {
        $(".mo-tool").fadeOut(400, "easeOutQuad");
        $(".mo-tool-option").fadeOut(400, "easeOutQuad");
        $(".mo-tool button").removeClass("active");
        // $(".mo-tool-draw-option").fadeOut(400, "easeOutQuad");
        realPriceOverlays.forEach((overlay) => overlay.setVisible(true));
    });

    // 지도 - 옵션 - 도구사용 - 도구 //
    $("#mapOptionToolOptionOpen").click(function () {
        if ($(".mo-tool-option").css("display") == "none") {
            // 옵션 보이기
            $(".mo-tool-option").fadeIn(400, "easeOutQuad");
            $(this).addClass("active");
        } else {
            // 옵션 숨기기
            $(".mo-tool-option").fadeOut(400, "easeOutQuad");
            $(this).removeClass("active");
        }
        // $(this).toggleClass("active");
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
    // $("#mapOptionToolDrawOptionClose").click(function () {
    // $(".mo-tool-draw-option").fadeOut(400, "easeOutQuad");
    // $(this).removeClass("active");
    // });

    // 지도 - 컨텐츠 열고 닫기 //
    var mapContentChk = 0;
    $("#mapContentOpenClose").click(function () {
        $(".map-content").toggleClass("active");
        $(".map-history").toggleClass("active");
        $(".map-bg").toggleClass("full");
        $("#rvWrapper").toggleClass("full");
        $(".realmap-estate-group").toggleClass("active");
        $(".realmap-estate-info").toggleClass("active");
        // $("#mapContentOpenClose i").toggleClass("fa-rotate-180");
        if ($(".map-content").hasClass("active")) {
            $(".realmap-estate-group").addClass("active");
            $(".realmap-estate-info").addClass("active");
        }
        else {
            $(".realmap-estate-group").removeClass("active");
            $(".realmap-estate-info").removeClass("active");
        }
        // 합필분석 단기
        $(".mo-land").removeClass("active");
        $(".map-land").removeClass("active");
        // $("#mapLandMoOpenClose i").removeClass("fa-rotate-180");

        // map-bg 요소에 transitionend 이벤트 리스너 추가
        $(".map-bg").one("transitionend", function () {
            map.relayout(); // CSS 애니메이션이 완료되었을 때 트리거
        });

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
            //$(".map-content").removeClass("active full");
            //$(this).removeClass("active full");
            $(".map-bg").addClass("full");
            $(".map-history").removeClass("active");
            $(".realmap-estate-group").removeClass("active");
            $(".realmap-estate-info").removeClass("active");
        } else if ($(this).hasClass("active")) {
            //$(".map-content").addClass("full");
            //$(this).addClass("full");
            $(".map-bg").removeClass("full");
            $(".map-history").addClass("active");
            $(".realmap-estate-group").addClass("active");
            $(".realmap-estate-info").addClass("active");
        } else {
            //$(".map-content").addClass("active full");
            //$(this).addClass("active full");
            $(".map-bg").removeClass("full");
            $(".map-history").addClass("active");
            $(".realmap-estate-group").addClass("active");
            $(".realmap-estate-info").addClass("active");
        }
    });

    $("#mapContentMoUp").click(function () {
        const $mapContent = $(".map-content");
        const $mcMoOpenClose = $("#mapContentMoOpenClose"); // 클래스를 추가/제거할 대상 부모 div

        if ($mapContent.hasClass("active")) {
            // 현재 'active' 상태 (not full) 이면 -> 'active full'로
            $mapContent.addClass("full");
            $mcMoOpenClose.addClass("full"); // 부모 div에도 클래스 동기화
        } else {
            // 현재 'None' (클래스 없음) 이면 -> 'active'로
            $mapContent.addClass("active");
            $mcMoOpenClose.addClass("active"); // 부모 div에도 클래스 동기화
        }
        
        // 상태 변경 후 아이콘 가시성 업데이트
        updateMapContentIcons();
    });

    // ⬇️ mapContentMoDown 클릭 이벤트 (축소)
    $("#mapContentMoDown").click(function () {
        const $mapContent = $(".map-content");
        const $mcMoOpenClose = $("#mapContentMoOpenClose"); // 클래스를 추가/제거할 대상 부모 div

        if ($mapContent.hasClass("full")) {
            // 현재 'active full' 상태이면 -> 'active'로 (full 클래스만 제거)
            $mapContent.removeClass("full");
            $mcMoOpenClose.removeClass("full"); // 부모 div에도 클래스 동기화
        } else if ($mapContent.hasClass("active")) {
            // 현재 'active' 상태 (not full) 이면 -> 'None'으로 (active 클래스 제거)
            $mapContent.removeClass("active");
            $mcMoOpenClose.removeClass("active"); // 부모 div에도 클래스 동기화
        }
        
        // 상태 변경 후 아이콘 가시성 업데이트
        updateMapContentIcons();
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

    // 지도 - real estate 선택 20250722
    $(".realmap-estate-group").on("click", "button", function () {
        const clickedButton = $(this);
        const allButtons = $(".realmap-estate-group button");
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
        //estateNewList();
        fetchRealPriceAptBasedOnMapCenter(); //실거래가를 가져오기
    });

    //지도 - real estate info 선택 - 정보 타입
    $('#infoType').on('change', function() {
        fetchRealPriceAptBasedOnMapCenter(); //실거래가를 가져오기
    });

    // 지도 - 이력관리 //
    $("#mapHistoryOpen").click(function () {
        $(".mh-list").toggleClass("active");
        // $(".mh-list").fadeIn(400, "easeOutQuad");
    });
    $(".mh-list > dl > dd > button").click(function () {
        $(".mh-list").toggleClass("active");
        // $(".mh-list").fadeOut(400, "easeOutQuad");
    });

    // 지도 - 옵션 - 합필분석 //
    if ($(window).width() > 991) {
        $("#mapOptionLandOpen").click(function () {
            if (!$(".mo-land").hasClass("active")) {
                $(".mo-land").addClass("active");
                $(".map-land").addClass("active");
                realPriceOverlays.forEach((overlay) => overlay.setVisible(false));
            } else {
                $(".mo-land").removeClass("active");
                $(".map-land").removeClass("active");
                realPriceOverlays.forEach((overlay) => overlay.setVisible(true));
            }

            // $(".mo-land").css({ display: "block" });
            // $(".mo-land").animate({ opacity: "1" }, 400, "easeOutQuad");
            // $(".map-land").animate({ marginLeft: "0" }, 400, "easeOutQuad");
        });
        $("#mapOptionLandClose").click(function () {
            $(".mo-land").toggleClass("active");
            $(".map-land").toggleClass("active");
            realPriceOverlays.forEach((overlay) => overlay.setVisible(true));

            // $(".mo-land").animate({ opacity: "0" }, 400, "easeOutQuad");
            // setTimeout(() => {
            //     $(".mo-land").css({ display: "none" });
            // }, 150);
            // $(".map-land").animate({ marginLeft: "-470px" }, 400, "easeOutQuad");
        });
        // 지도 - 합필분석 - 닫기 //
        $("#mapLandClose").click(function () {
            $(".mo-land").toggleClass("active");
            $(".map-land").toggleClass("active");
            realPriceOverlays.forEach((overlay) => overlay.setVisible(true));
            // $(".map-land").animate({ marginLeft: "-470px" }, 400, "easeOutQuad");
        });
    } else {
        // 지도 - 모바일 - 합필분석 열고 닫기 //
        // var mapLandMoChk = 0;
        $("#mapLandMoOpenClose").click(function () {
            $("#mapLandMoOpenClose i").toggleClass("fa-rotate-180");
            if (!$(".map-land").hasClass("active full")) {
                $(".map-land").addClass("active full");
                $(".mo-land").addClass("active");
                // $(".map-land").animate({ top: "0", marginTop: "-1px" }, 400, "easeOutQuad");
                // $("#mapLandMoOpenClose").css({ paddingTop: "3px", background: "#fff" });
                // $("#mapLandMoOpenClose i").addClass("fa-rotate-180");
                // mapLandMoChk = 1;
            } else {
                $(".map-land").removeClass("full");
                // $(".mo-land").removeClass("active");
                // $(".map-land").animate({ top: "100%", marginTop: "-25px" }, 400, "easeOutQuad");
                // $("#mapLandMoOpenClose").css({ paddingTop: "5px", background: "#fff" });
                // $("#mapLandMoOpenClose i").removeClass("fa-rotate-180");
                // mapLandMoChk = 0;
            }
        });

        // 지도 - 모바일 - 합필분석 버튼 - 열기
        $("#mapOptionLandOpen").click(function () {
            if (!$(".mo-land").hasClass("active")) {
                $(".mo-land").addClass("active");
                $(".map-land").addClass("active");
                realPriceOverlays.forEach((overlay) => overlay.setVisible(false));
            } else {
                $(".mo-land").removeClass("active");
                $(".map-land").removeClass("active");
                realPriceOverlays.forEach((overlay) => overlay.setVisible(true));
            }
            // $(".mo-land").css({ display: "block" });
            // $(".mo-land").animate({ opacity: "1" }, 400, "easeOutQuad");
            // $(".map-land").animate({ top: "65%" }, 400, "easeOutQuad");
            // mapLandMoChk = 0;
        });

        // 지도 - 모바일 - 합필분석 버튼 - 닫기
        $("#mapOptionLandClose").click(function () {
            $(".mo-land").removeClass("active");
            $(".map-land").removeClass("active full");
            $("#mapLandMoOpenClose i").removeClass("fa-rotate-180");
            realPriceOverlays.forEach((overlay) => overlay.setVisible(true));
            // $(".mo-land").animate({ opacity: "0" }, 400, "easeOutQuad");
            // setTimeout(() => {
            //     $(".mo-land").css({ display: "none" });
            // }, 150);
            // $(".map-land").animate({ top: "100%" }, 400, "easeOutQuad");
            // $("#mapLandMoOpenClose").css({ paddingTop: "5px", background: "#fff" });
            // mapLandMoChk = 1;
        });

        // 지도 - 합필분석 레이어 - 닫기 //
        $("#mapLandClose").click(function () {
            $(".mo-land").removeClass("active");
            $(".map-land").removeClass("active full");
            $("#mapLandMoOpenClose i").removeClass("fa-rotate-180");
            realPriceOverlays.forEach((overlay) => overlay.setVisible(true));
            // $(".map-land").animate({ top: "100%" }, 400, "easeOutQuad");
            // $("#mapLandMoOpenClose").css({ paddingTop: "5px", background: "#fff" });
            // mapLandMoChk = 1;
        });
    }

    // 지도 - 공유 //
    var mapShareChk = 0;
    $("#mapShareOpen").click(function () {
        $("#mapShare").slideToggle(200, "easeOutQuad").toggleClass("active");

        // if (mapShareChk == 0) {
        //     $("#mapShare").slideDown(200, "easeOutQuad");
        //     $("#mapShareOpen").addClass("active");
        //     mapShareChk = 1;
        // } else {
        //     $("#mapShare").slideUp(200, "easeOutQuad");
        //     $("#mapShareOpen").removeClass("active");
        //     mapShareChk = 0;
        // }
    });

    // 지도 - 공유 - 닫기 //
    $("#mapShareClose").click(function () {
        $("#mapShare").slideUp(200, "easeOutQuad").removeClass("active");

        // $("#mapShare").slideUp(200, "easeOutQuad");
        // $("#mapShareOpen").removeClass("active");
        // mapShareChk = 0;
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

    // 좌측탭 - 미니맵 선택
    $(".mcr-btn-group").on("click", "button", function () {
        $(".mcr-btn-group button").removeClass("active");
        $(this).addClass("active");
    });
}

function updateMapContentIcons() {
    const $mapContent = $(".map-content");
    const $mapContentMoUp = $("#mapContentMoUp");
    const $mapContentMoDown = $("#mapContentMoDown");

    //if ($mapContent.hasClass("active") && $mapContent.hasClass("full")) {
    if ($mapContent.hasClass("active full")) {
        // 현재 'active full' 상태
        $mapContentMoUp.hide();
        $mapContentMoDown.show();
    } else if ($mapContent.hasClass("active")) {
        // 현재 'active' 상태 (full 아님)
        $mapContentMoUp.show();
        $mapContentMoDown.show();
    } else {
        // 현재 'None' (클래스 없음) 상태
        $mapContentMoUp.show();
        $mapContentMoDown.hide();
    }
}
// 모든 옵션 비활성화
function resetOptions() {
    $(".mo-area, .mo-tool, .mo-tool-option, .mo-land").removeClass("active").fadeOut(400, "easeOutQuad");
    $("#mapOptionToolOptionOpen, #draw_tool_btn").removeClass("active");
    $(".mo-land").removeClass("active");
    $(".map-land").removeClass("active full");
    realPriceOverlays.forEach((overlay) => overlay.setVisible(true));
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
            const { resultListItems, searchInput } = getSearchElements();
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

                // 검색 리스트에서 위/아래 이동 처리
                upDownEvent(e, searchTerm, resultListItems, selectedIndex);

                // 화살표 키 이벤트 후에도 커서 위치를 원래대로 유지
                searchInput[0].setSelectionRange(cursorPositionStart, cursorPositionEnd);
                return; // 위아래 방향키 처리 후 종료
            }

            // Enter 키가 눌렸을 때
            if (e.key === "Enter") {
                e.preventDefault(); // Enter 키로 인해 폼이 제출되는 것을 방지
                resultListItems.eq(selectedIndex).click(); // selected된 리스트 항목 클릭
                return;
            }

            // Enter 키가 아닌 경우, 키워드 검색 실행
            if (!/^\d+$/.test(searchTerm)) {
                searchPlaces();
            }

            // // 0.5초 후에 결과값 없으면 빈 결과 표시
            // if ($("#placesList").find("li.item").length === 0) {
            //     // 검색 결과가 없을 때
            //     if ($("#placesList").find(".empty-li").length === 0) {
            //         $("#placesList").append("<li class='empty-li'>검색 결과가 없습니다.</li>");
            //     }
            // }
            // setTimeout(() => {}, 500);
        }, 100)
    );

    // 검색바 - 클릭
    $(document).on("click", "#search_input, #search_input_mobile", function () {
        const { searchBox } = getSearchElements();

        if (searchBox.find("ul li").length > 0) {
            searchBox.slideDown(100, "easeOutQuad");
        }
    });

    // 모바일 - 검색바 - 돋보기
    $(document).on("click", "#search_btn_mobile", function (e) {
        const { resultListItems } = getSearchElements();
        const selectedIndex = resultListItems.index($(".selected")); // 현재 `selected` 클래스가 적용된 항목 찾기
        resultListItems.eq(selectedIndex).click(); // selected된 리스트 항목 클릭
    });

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

    // '검색위치로' 버튼 클릭 이벤트
    $("#search_return_btn").on("click", function () {
        let placesString = sessionStorage.getItem("lastSearchedPlace"); // 1. 먼저 문자열 자체를 가져옵니다.
        let places = null; // places를 초기화합니다.
    
        // 2. placesString이 유효한 값인 경우에만 JSON.parse를 시도합니다.
        // 또한, JSON.parse 과정에서 오류가 발생할 수 있으므로 try-catch 문으로 감싸줍니다.
        if (placesString) {
            try {
                places = JSON.parse(placesString);
            } catch (e) {
                console.error("세션 스토리지 데이터 파싱 오류:", e);
                // 파싱 오류 발생 시 places를 null로 유지하여 다음 조건문에서 처리되도록 합니다.
                places = null;
            }
        }
    
        // 3. places가 객체(object)이며, null이 아니고, 유효한 속성을 가지고 있는지 확인합니다.
        // `places && typeof places === 'object'` 조건으로 null과 undefined, 그리고 배열/객체가 아닌 경우를 걸러냅니다.
        // `Object.keys(places).length > 0`은 객체 안에 어떤 속성이라도 있는지 확인합니다.
        if (places && typeof places === 'object' && Object.keys(places).length > 0) {
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
            // places가 null이거나 비어있는 객체인 경우 (세션 스토리지에 데이터가 없거나 유효하지 않은 경우)
            $("#modalAlert").iziModal("open");
            $("#alert_message").html("<h2>이동할 <span>검색 위치</span>가 없습니다.</h2>");
        }
    });
}

function initHandleEvents() {
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
        globalAnalysisArrays = []; //cis change 20250805 기존 합필분석을 닫으면 초기화 안되는 문제점 수정을 위해 추가

        $(".ml-info").empty();
        landAnalysisTotal();
    });

    // 합필분석 종료 시
    $("#mapOptionLandClose, #mapLandClose, #mapContentOpenClose").on("click", function () {
        isMultiSelectMode = false;
        clearAllPolygons();
        $(".ml-info").empty();
        landAnalysisTotal();
    });

    // 지역현황 - 생태자연도
    $("#chk2").change(function () {
        if ($(this).is(":checked")) {
            if (map.getLevel() > 9) {
                map.setLevel(9);
            }
            map.setMaxLevel(9);
            getEcologyWMSTileLayer(); // 체크된 경우 타일 레이어 추가
        } else {
            map.setMaxLevel(13);
            removeEcologyWMSTileLayer(); // 체크 해제된 경우 타일 레이어 제거
        }
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
    $("#copy_url_btn").on("click", copyUrl);

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
        const coords = { lat: lat, lng: lng };

        map.setCenter(new kakao.maps.LatLng(lat, lng));
        map.setLevel(4);
        updateURL({ curLat: lat, curLng: lng }); // url 파라미터 및 쿠키 변경

        // 주소 요청
        searchDetailAddrFromCoords(new kakao.maps.LatLng(lat, lng), function (result, status) {
            if (status === kakao.maps.services.Status.OK) {
                displayAddressInfo(result, status); // 지도 주소 정보 바인딩
            }
        });
        handleMapClick(coords); // 건물 및 토지 정보를 동시에 가져오기
        searchArroundPlaces(coords); // 주변 시설 정보 가져오기
    });

    // 이력관리 - 마커
    $(".history-marker").on("click", function () {
        const btn = $(this);
        onHistoryMarders(btn); // 이력 관리 마커 지도에 올리기
    });

    $("#remove_history_marker").on("click", function () {
        historyMarkers.forEach((marker) => marker.setMap(null)); // 기존 마커를 모두 제거한다.
    });
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
    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        // 검색 결과 목록에 추가된 항목들을 제거합니다
        // alert("검색 결과가 존재하지 않습니다.");
        return;
    } else if (status === kakao.maps.services.Status.ERROR) {
        // 검색 결과 목록에 추가된 항목들을 제거합니다
        // alert("검색 결과 중 오류가 발생했습니다.");
        return;
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

        let marker = addMarker(placePosition, i); // 마커를 생성하고 지도 위에 마커를 표시

        // 마커와 검색결과 항목에 mouseover 했을때 해당 장소에 인포윈도우에 장소명을 표시합니다
        // mouseout 했을 때는 인포윈도우를 닫습니다
        (function (marker, places) {
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
                handleUrlChange();

                // 이동할 위도 경도 위치를 생성합니다
                var moveLatLon = new kakao.maps.LatLng(places.y, places.x);

                // 지도 중심을 이동 및 줌 레벨 변경
                map.setCenter(moveLatLon);
                map.setLevel(4);

                // 이동된 중심에 마커를 생성하고 지도에 표시한다.
                const marker = new kakao.maps.Marker({
                    map: map,
                    position: moveLatLon,
                });
                markers.forEach((marker) => marker.setMap(null)); // 기존 마커를 모두 제거한다.
                markers.push(marker); // 새로운 마커를 마커 배열에 추가한다.

                searchDetailAddrFromCoords(moveLatLon, displayAddressInfo); // 법정동 상세 주소 정보를 요청
                handleMapClick({ lat: places.y, lng: places.x }); // 폴리곤 생성
                searchArroundPlaces({ lat: places.y, lng: places.x });

                saveSearchHistory({ address: places.address_name, lat: places.y, lng: places.x }); // 최근 검색 이력 저장
            };
        })(marker, places[i]);

        fragment.appendChild(itemEl);
    }

    // 검색결과 항목들을 검색결과 목록 Element에 추가합니다
    listEl.appendChild(fragment);
    listEl.scrollTop = 0;

    // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
    // map.setBounds(bounds);
}

/**
 * 검색결과 항목을 Element로 반환하는 함수입니다
 * @param {*} index
 * @param {*} places
 * @returns
 */
function getListItem(index, places) {
    let itemStr = "";
    var el = document.createElement("li");

    // 검색어를 가져옵니다
    const keyword = document.getElementById("search_input").value.trim();
    const keywords = document.getElementById("search_input").value.trim().split(/\s+/);

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
        // 약간의 지연을 두고 창을 닫음
        setTimeout(function () {
            printWindow.close();
        }, 1500); // 1초(1000ms) 후 창을 닫음
        printWindow.print();
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
    const mapHeight = mapBgElement.offsetHeight + 50; // 요소의 높이
    const mapWidth = mapBgElement.offsetWidth; // 요소의 너비

    // HTML 콘텐츠를 다시 래핑하여 새로운 구조를 만듦
    const htmlContent = `
        <div style="position:relative; height:${mapHeight}px; width:${mapWidth}px;">
            ${mapHtml}
        </div>`;

    // Base64로 인코딩된 HTML 콘텐츠
    const encodedHtml = encodeToBase64(htmlContent);

    // 가져온 HTML 콘텐츠를 이스케이프 처리하여 보안상 안전하게 만듦
    // const escapeHtmlContent = escapeHtml(htmlContent); // HTML 이스케이프 처리

    // 서버에 요청을 보낼 URL 설정
    const url = "/front/back/realPrice/download_map_image.php";

    // 서버에 전달할 데이터 객체 (HTML 콘텐츠, 너비, 높이 포함)
    const dataObj = {
        // html: encodeURIComponent(escapeHtmlContent), // 인코딩된 HTML 데이터
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

function supportsPng() {
    // 브라우저가 PNG 이미지를 지원하는지 확인하는 함수
    var a = document.createElement("a");
    a.innerHTML = "\x3c!--[if lte IE 6]>1<![endif]--\x3e";
    return !a.innerText;
}

function printKakaoMap() {
    // 도구바 비활성화
    // toolbar.cancel();

    // 지도 타입이 HYBRID가 아니거나 PNG를 지원하는 브라우저에서는 바로 인쇄
    if (map.getMapTypeId() !== daum.maps.MapTypeId.HYBRID || supportsPng()) {
        window.print();
        return;
    }

    // HYBRID 맵을 사용하는 경우 스카이뷰 이미지 생성
    var center = map.getCenter();
    var level = map.getLevel();
    var scale = (1 << level) * 0.3125;

    // 카카오맵 서버에서 스카이뷰 이미지 생성 URL 생성
    var imageUrl = "http://map2.daum.net/map/skyviewmapservice?MX=" + Math.round(center.getLng()) + "&MY=" + Math.round(center.getLat()) + "&SCALE=" + scale + "&IW=610&IH=480&FORMAT=PNG&COORDSTM=WCONGNAMUL&RDR=HybridRender";

    // 이미지 요소 생성
    var imageElement = new Image();
    imageElement.style.position = "absolute";
    imageElement.style.zIndex = 3;

    // 맵에 이미지 삽입
    document.getElementById("map").appendChild(imageElement);

    // 인쇄가 끝나면 이미지 제거
    window.onafterprint = function () {
        if (imageElement && imageElement.parentNode) {
            imageElement.parentNode.removeChild(imageElement);
        }
        imageElement = null;
    };

    // 이미지 로드 후 인쇄
    imageElement.onload = function () {
        window.print();
    };

    // 스카이뷰 이미지 URL 할당
    imageElement.src = imageUrl;
}

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
    const jibunAddressElement = $(".jibun-address").eq(0);

    Kakao.Share.sendDefault({
        // container: "#kakaotalk_sharing_btn",
        objectType: "text",
        text: `[주소 공유] #토디 #실거래가 #부동산\n${jibunAddressElement.text()}`,
        link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl,
        },
        // content: {
        //     title: title,
        //     description: "#토디 #구합니다 #부동산",
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
        $("#alert_message").html("<h2><span>회원</span> 전용 기능입니다.</h2>");
        return;
    }

    const address = $(".jibun-address").eq(0).text();
    geocoder.addressSearch(
        address,
        function (data, status, pagination) {
            if (status === daum.maps.services.Status.OK) {
                const result = data[0];
                const lat = result.y;
                const lng = result.x;

                const dataObj = {
                    ...user,
                    address: encodeURIComponent(address),
                    lat: encodeURIComponent(lat),
                    lng: encodeURIComponent(lng),
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
            }
        },
        { size: "5", analyze_type: "similar" }
    ); // 장소 검색
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

    const address = $(".jibun-address").eq(0).text();
    const dataObj = {
        ...user,
        address: encodeURIComponent(address),
    };

    callApiAbort("/front/back/favorite/favorite_cancel_realPrice.php", "POST", dataObj, "favoriteCancel")
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
async function favoriteCheck() {
    const user = userInfo();
    if (!user) {
        return;
    }
    const address = $(".jibun-address").eq(0).text();
    const dataObj = {
        ...user,
        address: encodeURIComponent(address),
    };

    callApiAbort("/front/back/favorite/favorite_check_realPrice.php", "POST", dataObj, "favoriteCheck")
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
 * jibun-address 클래스 변경 감지 및 찜 체크 함수
 */
function observeAddress() {
    // 첫 번째 .jibun-address 요소만 선택
    const targetNode = document.querySelector(".jibun-address");

    if (targetNode) {
        const observer = new MutationObserver(function (mutationsList, observer) {
            for (let mutation of mutationsList) {
                if (mutation.type === "childList" || mutation.type === "characterData") {
                    // 값이 변경되면 즐겨찾기 다시 초기화
                    favoriteCheck();
                }
            }
        });

        // 첫 번째 요소의 자식 및 텍스트 변경을 감시
        observer.observe(targetNode, { childList: true, subtree: true, characterData: true });
    } else {
        console.error("첫 번째 .jibun-address 요소를 찾을 수 없습니다.");
    }
}

/**
 * 상세 정보 인쇄하는 함수
 * @returns
 */
function printSelectedSections() {
    // 선택된 항목을 저장할 배열
    var selectedSections = [];

    // 체크박스가 선택된 항목을 배열에 추가
    if ($("#print_realPrice").is(":checked")) {
        selectedSections.push(".mc-real"); // 실거래가
    }
    if ($("#print_land").is(":checked")) {
        selectedSections.push(".mc-ground"); // 토지
    }
    if ($("#print_building").is(":checked")) {
        selectedSections.push(".mc-building"); // 건물
    }
    if ($("#print_surround").is(":checked")) {
        selectedSections.push(".mc-surrounding"); // 주변
    }
    if ($("#print_analysis").is(":checked")) {
        selectedSections.push(".mc-analysis"); // 분석
    }
    if ($("#print_finance").is(":checked")) {
        selectedSections.push(".mc-finance"); // 금융
    }

    // 선택된 섹션이 없는 경우 경고창 출력
    if (selectedSections.length === 0) {
        $("#modalAlert").iziModal("open");
        $("#alert_message").html("<h2><span>인쇄</span>할 항목을 선택하세요.</h2>");
        return;
    }

    // 선택된 섹션의 내용을 담을 변수
    var content = "";

    // 모든 .map-content 하위의 요소들을 숨김
    var mapContent = $(".map-content").clone();
    mapContent.find(".mc-open-close").hide();
    mapContent.find(".mc-search").hide();
    mapContent.find(".print-opt").hide();
    mapContent.find(".mc-info dl dd").hide();
    mapContent.find(".mc-real, .mc-ground, .mc-building, .mc-surrounding, .mc-analysis, .mc-finance").hide();

    // 체크된 섹션들만 다시 보여줌
    selectedSections.forEach(function (section) {
        mapContent.find(section).show();
    });

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
                ${internalStyles} <!-- 내부 스타일시트를 스타일로 추가 -->
            </style>
        </head>
        <body>
            <div id="print-content" class="map-content">
                ${mapContent.html()} <!-- 선택한 콘텐츠가 여기에 포함됨 -->
            </div>

            <div class="print-footer">
                © 2024 투에스종합개발
            </div>
            <script src="/front/js/realPrice/realPrice.js"></script>
        </body>
        </html>
    `;

    printDocument.open();
    printDocument.write(printContent);
    printDocument.close();

    // printWindow.document.write(`
    //         <html>
    //         <head>
    //             <title>인쇄 미리보기</title>
    //             ${externalStylesheets} <!-- 외부 스타일시트를 link 태그로 추가 -->
    //             <style>
    //                 body {
    //                     background-color: #fff;
    //                 }
    //                 .map-content {
    //                     margin-left: 0;
    //                     height: auto;
    //                     top: 0 !important;
    //                 }
    //                 ${internalStyles} <!-- 내부 스타일시트를 스타일로 추가 -->
    //             </style>
    //         </head>
    //         <body>
    //             <div id="print-content" class="map-content">
    //                 ${mapContent.html()} <!-- 선택한 콘텐츠가 여기에 포함됨 -->
    //             </div>

    //             <div class="print-footer">
    //                 © 2024 투에스종합개발
    //             </div>
    //             <script src="/front/js/realPrice/realPrice.js"></script>
    //         </body>
    //         </html>
    //     `);

    // printWindow.document.close();
    // printWindow.focus();

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

    const address = $(".jibun-address").eq(0).text();
    geocoder.addressSearch(
        address,
        function (data, status, pagination) {
            if (status === daum.maps.services.Status.OK) {
                const result = data[0];
                const lat = result.y;
                const lng = result.x;

                const dataObj = {
                    ...user,
                    address: encodeURIComponent(address),
                    lat: encodeURIComponent(lat),
                    lng: encodeURIComponent(lng),
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
        },
        { size: "5", analyze_type: "similar" }
    ); // 장소 검색
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
        type: encodeURIComponent("real"),
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
    console.log(btn);

    const no = btn.attr("data-no");
    const type = btn.attr("data-type");
    console.log(type);

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

function onHistoryMarders(btn) {
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
 * 모달 초기화 함수
 */
function initModal() {
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
// 함수: 창 크기에 따라 .map-content 클래스 조절
let isMobileView = $(window).width() <= 991;

function handleMapContentClass() {
    const currentWidth = $(window).width();

    if (currentWidth > 991) {
        // 창 너비가 991px 초과일 때 (PC 뷰)
        if (isMobileView) { // 이전에 모바일 뷰였다면
            // .map-content에 active 클래스 추가
            $(".map-content").addClass("active");
            //console.log("창 너비 > 991px: .map-content에 active 클래스 추가");
            isMobileView = false; // PC 뷰로 전환
        }
    } else {
        // 창 너비가 991px 이하일 때 (모바일 뷰)
        if (!isMobileView) { // 이전에 PC 뷰였다면
            // .map-content에서 active 클래스 제거 (필요하다면)
            // onedol님의 요청에 따라 이 부분에서는 active를 제거하지 않았습니다.
            // $(".map-content").removeClass("active");
            //console.log("창 너비 <= 991px: .map-content 클래스 유지 (또는 제거 로직 필요시 추가)");
            isMobileView = true; // 모바일 뷰로 전환
        }
    }
    updateMapContentIcons();
}