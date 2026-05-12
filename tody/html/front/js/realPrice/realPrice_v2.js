// 터치 기기 감지: 합성 mouse 이벤트로 인한 sticky hover 방지
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.documentElement.classList.add('is-touch-device');
}

let activeBootstrapTooltips = new Map(); // Map<HTMLElement, bootstrap.Tooltip>
let globalTooltipContents = {};

/* =====================================================
 * v2 레이어 상태 전역 변수
 * ===================================================== */
const layerState = {
    realPrice: true,   // 실거래가 마커 표시 여부 (초기값 ON)
    estate: true,      // 매물 마커 표시 여부 (초기값 ON)
};

// 매물 estate 관련 전역 변수
let searchPlacesExecuted = false;
let searchEstateNo       = false;
let searchAgencyNo       = false;
let list_fixed_chk       = false;
let fixed_list_obj       = "";
let fixedEstateData      = [];  // 목록고정 시점의 매물 데이터
let lastEstateResponseData = []; // estateNewList 마지막 응답 데이터
let isKeyDown            = false;
let compareList          = { data: [] };
let comparisonData       = [];
const estateClusterersByType = { "all": null };
let sellDotOverlays      = [];

$(document).ready(async function () {
    // ── 초기 로드 시 CSS transition 방지 ──────────────────────────────────
    // map-history / map-content-wrapper 모두 transition: margin-left 0.4s 를 가짐.
    // Chrome 등 일부 브라우저에서 :has() 또는 active class 초기 적용 시
    // transition 이 발생하면 positionToggleGroup() 이 중간값으로 계산되어
    // layerToggleGroup 이 realmap-estate-group 위에 잘못 배치됨.
    // → 첫 2프레임 동안 transition을 비활성화하여 즉시 최종 위치로 렌더링한 뒤 복원.
    var $noTransEls = $('.map-history, .map-content-wrapper');
    $noTransEls.addClass('no-initial-transition');
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            $noTransEls.removeClass('no-initial-transition');
            // transition 복원 후 정확한 위치로 재계산
            positionToggleGroup();
        });
    });
    // ─────────────────────────────────────────────────────────────────────

    initModal(); // 이지모달 초기화
    initAction(); // 액션 이벤트 초기화
    initSearchEvents(); // 검색 이벤트 초기화
    initHandleEvents(); // 이벤트 초기화
    observeAddress(); // 지번주소 변경 감지
    initMemoEvents(); // 메모 관련 이벤트 초기화
    initLayerToggle();   // v2: 레이어 토글 이벤트
    initEstateFilters(); // v2: 매물 필터 초기화
    initEstateListEvents(); // v2: 매물 리스트 이벤트
    initEstateSearchConditionEvents(); // v2: 검색 조건 표시설정 이벤트
    handleUrlChangeForEstateNo(); // v2: URL 매물번호 감지

    // v2: URL tab 파라미터로 초기 탭 결정 (realPrice | estate)
    (function() {
        const tabParam = getParameter('tab');
        if (tabParam === 'estate') {
            _switchLayerTab('layer-estate');
        } else if (tabParam === 'realPrice') {
            _switchLayerTab('layer-realprice');
        }
    })();

    displayCompareList(); // v2: 비교매물 삭제 버튼 초기 숨김
    _applyLayerState();  // v2: 초기 레이어 상태에 맞게 UI 동기화

    // popstate 이벤트를 사용하여 URL 변경 감지
    window.addEventListener("popstate", function (e) {
        handleUrlChangeForEstateNo();
    });
    initTooltip(); // 툴팁 초기화
    updateMapContentIcons();
    handleMapContentClass();

    // 모바일: 초기 마커 미표시 방지
    // 지도 컨테이너가 완전히 렌더링되기 전에 tilesloaded가 발생하면 마커 위치 계산이 잘못됨
    // → 500ms 후 relayout() 호출 → tilesloaded 재발생 → 실거래가·매물 마커 자동 재로드
    if ($(window).width() <= 991) {
        setTimeout(function() {
            if (typeof map !== 'undefined' && map) {
                map.relayout();
            }
        }, 500);
    }

    check_realtor(); // v2: 중개사 여부 확인

    // 모든 리소스(폰트·아이콘 등) 로드 완료 후 최종 위치 재계산
    // → 아이콘 폰트 로딩으로 버튼 크기가 바뀌는 경우까지 대비
    $(window).one('load.initTogglePos', function() {
        positionToggleGroup();
        // active 상태도 최종 동기화
        var _isOpen = $('.map-content').hasClass('active');
        $('.realmap-estate-group').toggleClass('active', _isOpen);
        $('.realmap-estate-info').toggleClass('active', _isOpen);
        $('.realmap-average-info').toggleClass('active', _isOpen);
    });
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
        positionToggleGroup();
    }

    let resizeTimer;
    $(window).on("resize", function() {
        clearTimeout(resizeTimer); // 이전 타이머가 있다면 취소
        resizeTimer = setTimeout(function() {
            handleMapContentClass();
            positionToggleGroup();
        }, 150); // 250ms(0.25초) 동안 추가적인 resize 이벤트가 없으면 함수 실행
    });

    // 지도 - 옵션 - v2설정 //
    $("#mapV2setOpen").click(function () {
        if ($(".mo-test").css("display") == "none") {
            $(".mo-test").fadeIn(300, "easeOutQuad");
        } else {
            $(".mo-test").fadeOut(300, "easeOutQuad");
        }
        $(".mo-test").toggleClass("active");
    });
    $(".mo-test > dl > dd > button").click(function () {
        $(".mo-test").removeClass("active");
        $(".mo-test").fadeOut(300, "easeOutQuad");
    });

    // V2설정 체크박스 초기 상태 (layout.js의 v2_mode, singlecolor_mode 값 반영)
    $("#chkSetv2").prop("checked", typeof v2_mode !== 'undefined' && v2_mode === true);
    $("#chkOneColor").prop("checked", typeof singlecolor_mode !== 'undefined' && singlecolor_mode === true);
    $("#chkMultiColorTop").prop("checked", typeof multicolor_top_mode !== 'undefined' && multicolor_top_mode === true);
    $("#chkMultiColorMid").prop("checked", typeof multicolor_mid_mode !== 'undefined' && multicolor_mid_mode === true);
    $("#chkMultiColorBot").prop("checked", typeof multicolor_bot_mode !== 'undefined' && multicolor_bot_mode === true);

    // chkSetv2 변경 → v2_mode 저장 + V1 페이지로 이동 (지도영역도 V1으로 전환)
    $("#chkSetv2").on("change", function () {
        v2_mode = this.checked;
        sessionStorage.setItem('v2_mode', v2_mode);
        if (!v2_mode) {
            // V1 페이지로 이동 (지도영역 포함 전체 전환)
            location.href = '/front/views/realPrice/realPrice.html';
        } else {
            // 이미 V2 페이지 — 메뉴만 갱신
            $(".menu-v1").hide();
            $(".menu-v2").show();
        }
    });

    // chkOneColor 변경 → singlecolor_mode 업데이트 + sessionStorage 저장 + 마커 재로드
    $("#chkOneColor").on("change", function () {
        singlecolor_mode = this.checked;
        sessionStorage.setItem('singlecolor_mode', singlecolor_mode);

        // 실거래가 마커 재로드 (기존 오버레이 제거 후 다시 그리기)
        if (typeof clearAllRealEstateOverlays === 'function') {
            clearAllRealEstateOverlays();
        }
        if (typeof fetchRealPriceAptArrayBasedOnMapCenterWidthCash_AutoPoint === 'function') {
            fetchRealPriceAptArrayBasedOnMapCenterWidthCash_AutoPoint();
        }

        // 매물 마커 재로드
        if (typeof layerState !== 'undefined' && layerState.estate && typeof estateNewList === 'function') {
            estateNewList();
        }
    });

    // chkMultiColorTop/Mid/Bot 변경 → multicolor_*_mode 업데이트 + sessionStorage 저장 + 매물 마커만 재로드
    function _reloadAllColorMarkers() {
        if (typeof layerState !== 'undefined' && layerState.estate && typeof estateNewList === 'function')
            estateNewList();
    }
    $("#chkMultiColorTop").on("change", function () {
        multicolor_top_mode = this.checked;
        sessionStorage.setItem('multicolor_top_mode', multicolor_top_mode);
        _reloadAllColorMarkers();
    });
    $("#chkMultiColorMid").on("change", function () {
        multicolor_mid_mode = this.checked;
        sessionStorage.setItem('multicolor_mid_mode', multicolor_mid_mode);
        _reloadAllColorMarkers();
    });
    $("#chkMultiColorBot").on("change", function () {
        multicolor_bot_mode = this.checked;
        sessionStorage.setItem('multicolor_bot_mode', multicolor_bot_mode);
        _reloadAllColorMarkers();
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
    // ※ toggleClass 방식 → hasClass 기반 명시적 add/remove 로 교체
    //   이유: toggleClass는 외부 코드가 active를 건드린 뒤 상태 불일치가 생기면
    //         full/active가 엇갈려 Issue 2(첫 클릭 이중토글), Issue 3(빈 화면) 유발.
    //         현재 DOM 상태를 읽어 항상 일관성 있게 처리.
    var mapContentChk = 0;
    $("#mapContentOpenClose").click(function (e) {
        e.stopPropagation(); // 버블링 방지

        const isActive = $(".map-content").hasClass("active"); // 현재 열림 여부

        if (isActive) {
            // ── 패널 닫기 (deactive) ──────────────────────────
            // 카카오 맵 SDK는 stopPropagation을 무시하고 동일 클릭을 수신할 수 있음.
            // (버튼이 지도 캔버스 위에 겹쳐 있어 clusterclick 이벤트가 발생)
            // → 전역 잠금 플래그로 600ms 동안 지도 이벤트의 패널 재활성화를 방지.
            window.mapContentClosingLock = true;
            clearTimeout(window.mapContentClosingLockTimer);

            // 방어적 가드: lock 기간 동안 .map-content에 active가 다시 추가되면 즉시 제거
            // (정적 분석으로 못 찾는 비동기 콜백/외부 코드 경로까지 차단)
            if (window.mapContentLockObserver) {
                window.mapContentLockObserver.disconnect();
            }
            const $mc = $(".map-content")[0];
            if ($mc && typeof MutationObserver !== "undefined") {
                window.mapContentLockObserver = new MutationObserver(function (mutations) {
                    if (!window.mapContentClosingLock) return;
                    if ($mc.classList.contains("active")) {
                        $(".map-content").removeClass("active");
                        $(".map-history").removeClass("active");
                        $(".realmap-estate-group").removeClass("active");
                        $(".realmap-estate-info").removeClass("active");
                        $(".realmap-average-info").removeClass("active");
                        $("#mapSaleGroup, #mapExchangeGroup, #mapUrgentSaleGroup, #mapPriceGroup").removeClass("active");
                    }
                });
                window.mapContentLockObserver.observe($mc, { attributes: true, attributeFilter: ["class"] });
            }

            window.mapContentClosingLockTimer = setTimeout(function () {
                window.mapContentClosingLock = false;
                if (window.mapContentLockObserver) {
                    window.mapContentLockObserver.disconnect();
                    window.mapContentLockObserver = null;
                }
            }, 600);

            $(".map-content").removeClass("active");
            $(".map-history").removeClass("active");
            $(".map-bg").addClass("full");          // 지도 전체 너비로 확장
            $("#rvWrapper").addClass("full");
            $(".realmap-estate-group").removeClass("active");
            $(".realmap-estate-info").removeClass("active");
            $(".realmap-average-info").removeClass("active");
            // v2: ⑥ 버튼 패널 닫힘 위치
            $("#mapSaleGroup, #mapExchangeGroup, #mapUrgentSaleGroup, #mapPriceGroup").removeClass("active");
            mapContentChk = 1;
        } else {
            // ── 패널 열기 (active) ────────────────────────────
            $(".map-content").addClass("active");
            $(".map-history").addClass("active");
            $(".map-bg").removeClass("full");       // 지도 원래 너비로 복귀
            $("#rvWrapper").removeClass("full");
            $(".realmap-estate-group").addClass("active");
            $(".realmap-estate-info").addClass("active");
            $(".realmap-average-info").addClass("active");
            // v2: ⑥ 버튼 패널 열림 위치
            $("#mapSaleGroup, #mapExchangeGroup, #mapUrgentSaleGroup, #mapPriceGroup").addClass("active");
            mapContentChk = 0;
        }

        // 합필분석 닫기
        $(".mo-land").removeClass("active");
        $(".map-land").removeClass("active");

        // 지도 레이아웃 재계산 (즉시 + 트랜지션 중간 + 완료 후)
        if (typeof map !== 'undefined' && map) kakao.maps.event.trigger(map, 'resize');
        setTimeout(function() {
            if (typeof map !== 'undefined' && map) kakao.maps.event.trigger(map, 'resize');
        }, 200);
        $(".map-bg").off("transitionend.mapContent").one("transitionend.mapContent", function () {
            if (typeof map !== 'undefined' && map) kakao.maps.event.trigger(map, 'resize');
            positionToggleGroup();
        });
    });

    // 지도 - 모바일 - 컨텐츠 열고 닫기 //
    $(".mc-mo-open-close").click(function () {
        if ($(this).hasClass("active")) { //full
            //$(".map-content").removeClass("active full");
            $(this).removeClass("active");
            $(".map-bg").addClass("full");
            $(".map-history").removeClass("active");
            $(".realmap-estate-group").removeClass("active");
            $(".realmap-estate-info").removeClass("active");
            $(".realmap-average-info").removeClass("active");
            // v2: 필터 버튼 닫힘 위치 동기화
            $("#mapSaleGroup, #mapExchangeGroup, #mapUrgentSaleGroup, #mapPriceGroup").removeClass("active");
        }
        /*
        else if ($(this).hasClass("active")) {
            //$(".map-content").addClass("full");
            //$(this).addClass("full");
            $(".map-bg").removeClass("full");
            $(".map-history").addClass("active");
            $(".realmap-estate-group").addClass("active");
            $(".realmap-estate-info").addClass("active");
        }
        */
        else {
            //$(".map-content").addClass("active full");
            $(this).addClass("active");
            $(".map-bg").removeClass("full");
            $(".map-history").addClass("active");
            $(".realmap-estate-group").addClass("active");
            $(".realmap-estate-info").addClass("active");
            $(".realmap-average-info").addClass("active");
            // v2: 필터 버튼 열림 위치 동기화
            $("#mapSaleGroup, #mapExchangeGroup, #mapUrgentSaleGroup, #mapPriceGroup").addClass("active");
        }
    });

    $("#mapContentMoUp").click(function (e) {
        e.stopPropagation(); // 부모 .mc-mo-open-close 핸들러로 버블링 방지
        const $mapContent = $(".map-content");
        const $mcMoOpenClose = $("#mapContentMoOpenClose"); // 클래스를 추가/제거할 대상 부모 div
        
        /*
        if ($mapContent.hasClass("active")) {
            // 현재 'active' 상태 (not full) 이면 -> 'active full'로
            $mapContent.addClass("full");
            $mcMoOpenClose.addClass("full"); // 부모 div에도 클래스 동기화
        } 
        else {
            // 현재 'None' (클래스 없음) 이면 -> 'active'로
            $mapContent.addClass("active");
            $mcMoOpenClose.addClass("active"); // 부모 div에도 클래스 동기화
        }
        */
       
        if ($mapContent.hasClass("active") ) {
            // 현재 'active' 상태 (not full) 이면 -> 'active full'로
        }
        else {
            // 패널이 전체화면으로 열리면 map-option의 mo-memo가 z-index로 가려지므로 미리 닫기
            $(".mo-memo").fadeOut(200, "easeOutQuad");
            $mapContent.addClass("active");
            $mcMoOpenClose.addClass("active"); // 부모 div에도 클래스 동기화
            $(".map-history").addClass("active");
            $(".realmap-estate-group").addClass("active");
            $(".realmap-estate-info").addClass("active");
            $(".realmap-average-info").addClass("active");
            // v2: 필터 버튼 열림 위치 동기화
            $("#mapSaleGroup, #mapExchangeGroup, #mapUrgentSaleGroup, #mapPriceGroup").addClass("active");
        }

        // 상태 변경 후 아이콘 가시성 업데이트
        updateMapContentIcons();
    });

    // ⬇️ mapContentMoDown 클릭 이벤트 (축소)
    $("#mapContentMoDown").click(function (e) {
        e.stopPropagation(); // 부모 .mc-mo-open-close 핸들러로 버블링 방지
        const $mapContent = $(".map-content");
        const $mcMoOpenClose = $("#mapContentMoOpenClose"); // 클래스를 추가/제거할 대상 부모 div

        /*
        if ($mapContent.hasClass("full")) {
            // 현재 'active full' 상태이면 -> 'active'로 (full 클래스만 제거)
            $mapContent.removeClass("full");
            $mcMoOpenClose.removeClass("full"); // 부모 div에도 클래스 동기화
        } else if ($mapContent.hasClass("active")) {
            // 현재 'active' 상태 (not full) 이면 -> 'None'으로 (active 클래스 제거)
            $mapContent.removeClass("active");
            $mcMoOpenClose.removeClass("active"); // 부모 div에도 클래스 동기화
        }
        */
       
        if ($mapContent.hasClass("active") ) {
            // 현재 'active' 상태 (not full) 이면 -> 'active full'로
            $mapContent.removeClass("active");
            $mcMoOpenClose.removeClass("active"); // 부모 div에도 클래스 동기화
            $(".map-history").removeClass("active");
            $(".realmap-estate-group").removeClass("active");
            $(".realmap-estate-info").removeClass("active");
            $(".realmap-average-info").removeClass("active");
            // v2: 필터 버튼 닫힘 위치 동기화
            $("#mapSaleGroup, #mapExchangeGroup, #mapUrgentSaleGroup, #mapPriceGroup").removeClass("active");
        }
        else {
        }

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
        
        const allButtons    = $(".realmap-estate-group button");
        const allToggleBtn  = allButtons.eq(0);
        const nonAllButtons = allButtons.not(allToggleBtn);
        
        // 전체 버튼 클릭
        if ($(this).is(allToggleBtn)) {
            const activate = !allToggleBtn.hasClass("active");
            allToggleBtn.toggleClass("active", activate);
            nonAllButtons.toggleClass("active", activate);

        // 개별 버튼 클릭
        } else {
            $(this).toggleClass("active");

            // 하나라도 off면 전체버튼 off, 모두 on이면 전체버튼 on
            const hasOff = nonAllButtons.filter(":not(.active)").length > 0;
            allToggleBtn.toggleClass("active", !hasOff);
        }
    
        const fetchMap = {
            1: fetchRealPriceAptBasedOnMapCenter,
            2: fetchRealPriceAptArrayBasedOnMapCenter,
            3: fetchRealPriceAptArrayBasedOnMapCenterWidthCash_AutoPoint,
        };
        fetchMap[REALPRICE_POLYGON_MODE]?.();

        // v2: 매물 마커도 동일 옵션으로 재조회 (실거래가와 공유되는 매물종류 버튼)
        estateNewList();
    });

    //지도 - real estate info 선택 - 정보 타입
    $('#infoType').on('change', function() {
        if(REALPRICE_POLYGON_MODE == 1){
            fetchRealPriceAptBasedOnMapCenter(); //실거래가를 가져오기(원본)
        }
        else if(REALPRICE_POLYGON_MODE == 2){
            fetchRealPriceAptArrayBasedOnMapCenter(); //실거래가를 가져오기 - array
        }
        //fetchRealPriceAptArrayBasedOnMapCenterWidthCash(); //실거래가를 가져오기 - cash
        else if(REALPRICE_POLYGON_MODE == 3){
            fetchRealPriceAptArrayBasedOnMapCenterWidthCash_AutoPoint() //실거래가를 가져오기 - cash auto
        }
    });

    //지도 - real averageType 선택 - 정보 타입
    $('#averageType').on('change', function() {
        if(REALPRICE_POLYGON_MODE == 1){
            fetchRealPriceAptBasedOnMapCenter(); //실거래가를 가져오기(원본)
        }
        else if(REALPRICE_POLYGON_MODE == 2){
            fetchRealPriceAptArrayBasedOnMapCenter(); //실거래가를 가져오기 - array
        }
        //fetchRealPriceAptArrayBasedOnMapCenterWidthCash(); //실거래가를 가져오기 - cash
        else if(REALPRICE_POLYGON_MODE == 3){
            fetchRealPriceAptArrayBasedOnMapCenterWidthCash_AutoPoint() //실거래가를 가져오기 - cash auto
        }
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
                // 지적편집도: OFF 상태일 때만 ON (이미 ON이면 유지)
                if (!$(".map-select-group button").eq(3).hasClass("active")) {
                    $(".map-select-group button").eq(3).click();
                }
            } else {
                $(".mo-land").removeClass("active");
                $(".map-land").removeClass("active");
                realPriceOverlays.forEach((overlay) => overlay.setVisible(true));
                // 지적편집도: ON 상태일 때만 OFF
                if ($(".map-select-group button").eq(3).hasClass("active")) {
                    $(".map-select-group button").eq(3).click();
                }
            }
            // $(".mo-land").css({ display: "block" });
            // $(".mo-land").animate({ opacity: "1" }, 400, "easeOutQuad");
            // $(".map-land").animate({ marginLeft: "0" }, 400, "easeOutQuad");
        });
        $("#mapOptionLandClose").click(function () {
            $(".mo-land").removeClass("active");
            $(".map-land").removeClass("active");
            realPriceOverlays.forEach((overlay) => overlay.setVisible(true));
            if ($(".map-select-group button").eq(3).hasClass("active")) {
                $(".map-select-group button").eq(3).click();
            }
            // $(".mo-land").animate({ opacity: "0" }, 400, "easeOutQuad");
            // setTimeout(() => {
            //     $(".mo-land").css({ display: "none" });
            // }, 150);
            // $(".map-land").animate({ marginLeft: "-470px" }, 400, "easeOutQuad");
        });
        // 지도 - 합필분석 - 닫기 //
        $("#mapLandClose").click(function () {
            $(".mo-land").removeClass("active");
            $(".map-land").removeClass("active");
            realPriceOverlays.forEach((overlay) => overlay.setVisible(true));
            if ($(".map-select-group button").eq(3).hasClass("active")) {
                $(".map-select-group button").eq(3).click();
            }
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

    // 지도 - 옵션 - 경계표시 //
    const storedBoundary = localStorage.getItem("boundaryKey");

    if (storedBoundary === "true") {
        boundaryFlag = true;
        $("#mapOptionBoundary").addClass("active");
        // 여기에 초기 로딩 시 경계선 로드/표시하는 함수 호출이 필요할 수도 있습니다.
        // 예를 들어: loadAdministrativeBoundaries();
    } else {
        boundaryFlag = false; // null 이나 "false"이면 false
        $("#mapOptionBoundary").removeClass("active");
        // boundaryFlag가 false일 때 clearAdministrativePolygons()를 즉시 호출하는 것이
        // 적절한지는 맥락에 따라 판단해야 합니다.
        // 만약 처음 로딩 시 지도가 비활성 상태이고, active 될 때 그려야 한다면 여기서 호출하지 않습니다.
    }

    
    $("#mapOptionBoundary").click(function () {
        $(this).toggleClass("active"); // active 클래스를 토글합니다.
    
        // 토글된 상태에 따라 boundaryFlag 업데이트
        if ($(this).hasClass("active")) {
            boundaryFlag = true;
        } else {
            boundaryFlag = false;
            clearAdministrativePolygons();
        }
        
        // boolean 값을 localStorage에 저장하면 "true" 또는 "false" 문자열로 자동 변환됩니다.
        localStorage.setItem("boundaryKey", String(boundaryFlag));
    });

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

    // map-option 버튼 hover 효과 (CSS 우선순위 우회)
    var mapHoverBtns = ["mapOptionBoundary", "mapOptionTooltip", "mapOptionAreaOpen", "mapOptionMemoOpen2"];
    mapHoverBtns.forEach(function(id) {
        var btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener("mouseenter", function() {
            if (this.classList.contains("active")) return;
            this.style.setProperty("border", "#ef8779 1px solid", "important");
            this.style.setProperty("background", "#fff", "important");
            var icon = this.querySelector("i");
            var span = this.querySelector("span");
            if (icon) icon.style.setProperty("color", "#ef8779", "important");
            if (span) span.style.setProperty("color", "#ef8779", "important");
        });
        btn.addEventListener("mouseleave", function() {
            this.style.removeProperty("border");
            this.style.removeProperty("background");
            var icon = this.querySelector("i");
            var span = this.querySelector("span");
            if (icon) icon.style.removeProperty("color");
            if (span) span.style.removeProperty("color");
        });
    });

    // 토글 버튼 위치 초기화 (DOM 렌더 후 계산)
    setTimeout(positionToggleGroup, 500);

    // map-history active 변경 시 토글 버튼 위치 재계산
    var _historyEl = document.querySelector('.map-history');
    if (_historyEl) {
        new MutationObserver(function() {
            positionToggleGroup();
        }).observe(_historyEl, { attributes: true, attributeFilter: ['class'] });
    }
}

/**
 * 토글 버튼 그룹을 map-history 오른쪽 끝 ~ map-select-group 왼쪽 끝의 중간에 배치
 * offsetLeft 체인 방식: getBoundingClientRect보다 스크롤/줌/레이아웃 차이에 강함
 */
function positionToggleGroup() {
    var historyBtnEl   = document.querySelector('.map-history .mh-button');
    var selectEl       = document.querySelector('.map-select-group');
    var toggleEl       = document.getElementById('layerToggleGroup');
    var saleRegisterEl = document.getElementById('mapSaleRegisterGroup');

    if (!historyBtnEl || !selectEl || !toggleEl) return;

    var parent = toggleEl.offsetParent;
    if (!parent) return;

    // 공통 부모(parent) 기준 left 값 계산 (offsetLeft 체인)
    function leftInParent(el) {
        var left = 0, cur = el;
        while (cur && cur !== parent) {
            left += cur.offsetLeft;
            cur = cur.offsetParent;
        }
        return left;
    }

    var historyRight = leftInParent(historyBtnEl) + historyBtnEl.offsetWidth;

    // 우측 기준 결정:
    // - 중개사(sale_register 표시) + 화면 너비 > 1150px → sale_register 왼쪽 기준
    //   (≤1150px에서는 sale_register가 좌측 estate-group 위로 이동하므로 기준 불가)
    // - 그 외 (일반 사용자 or ≤1150px) → "일반"(.map-select-group) 왼쪽 기준
    var isSaleRegisterVisible = saleRegisterEl
        && saleRegisterEl.offsetParent !== null
        && saleRegisterEl.style.display !== 'none';
    var isWideScreen = window.innerWidth > 1150;

    var selectLeft = (isSaleRegisterVisible && isWideScreen)
        ? leftInParent(saleRegisterEl)
        : leftInParent(selectEl);

    var toggleWidth = toggleEl.offsetWidth;

    if (selectLeft <= historyRight || toggleWidth === 0) return;

    var leftPos = Math.round((historyRight + selectLeft) / 2 - toggleWidth / 2);
    toggleEl.style.left      = leftPos + 'px';
    toggleEl.style.transform = 'none';
}

function updateMapContentIcons() {
    const $mapContent = $(".map-content");
    const $mapContentMoUp = $("#mapContentMoUp");
    const $mapContentMoDown = $("#mapContentMoDown");

    //if ($mapContent.hasClass("active") && $mapContent.hasClass("full")) {
    if ($mapContent.hasClass("active")) {  // full
        // 현재 'active full' 상태
        $mapContentMoUp.hide();
        $mapContentMoDown.show();
    } 
    /*
    else if ($mapContent.hasClass("active")) {
        // 현재 'active' 상태 (full 아님)
        $mapContentMoUp.show();
        $mapContentMoDown.show();
    */
    else {
        // 현재 'None' (클래스 없음) 상태
        $mapContentMoUp.show();
        $mapContentMoDown.hide();
    }
}
/**
 * 지도 마커 클릭 시 map-content 패널을 열고 모바일 아이콘 상태를 동기화
 * (PC: map-history active / 모바일: mc-mo-open-close active + 아이콘 동기화)
 */
function _openMapContent() {
    const isMobile = $(window).width() <= 991;
    if (isMobile) {
        // 모바일: mc-mo-open-close.active 기반으로 펼침 상태 판단
        if (!$('#mapContentMoOpenClose').hasClass('active')) {
            // 패널이 전체화면으로 열리면 map-option의 mo-memo가 z-index로 가려지므로 미리 닫기
            $(".mo-memo").fadeOut(200, "easeOutQuad");
            $('.map-content').addClass('active');
            $('.map-history').addClass('active');
            $('#mapContentMoOpenClose').addClass('active');
            updateMapContentIcons();
        }
    } else {
        // PC: .map-content.active 기반으로 패널 열림 판단
        if (!$('.map-content').hasClass('active')) {
            $('.map-content').addClass('active');
            $('.map-history').addClass('active');
            updateMapContentIcons();
        }
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
        //debounce(function (e) {
        function (e) {
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
    //    }, 100)
        }
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
                //console.error("세션 스토리지 데이터 파싱 오류:", e);
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

    bindNationalEnvRegionToggle('#chk1', 'nem_ecvam');
    bindNationalEnvRegionToggle('#chkSlope', 'slope');
    bindNationalEnvRegionToggle('#chkElevation', 'elevation');

    // 지역현황 - 생태자연도
    $("#chk2").change(function () {
        if (typeof map === 'undefined') {
            return;
        }

        const isChecked = $(this).is(':checked');

        if (isChecked) {
            if (isAnyNationalEnvCheckboxChecked()) {
                $('#chk1, #chkSlope, #chkElevation').prop('checked', false);
                if (typeof removeNationalEnvWMSTileLayer === 'function') {
                    removeNationalEnvWMSTileLayer();
                }
            }

            if (map.getLevel() > 9) {
                map.setLevel(9);
            }
            getEcologyWMSTileLayer(); // 체크된 경우 타일 레이어 추가
        } else {
            removeEcologyWMSTileLayer(); // 체크 해제된 경우 타일 레이어 제거
        }

        updateRegionStatusZoomLimit();
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

    // map_sell_view 매물 상세탭 - 공유 (카카오톡)
    $("#estate_share_btn").on("click", function () {
        initShareEvents();
    });

    // map_sell_view 매물 상세탭 - 찜 (매물정보 전용 등록/취소)
    $("#estate_favorite_btn").on("click", function () {
        const button = $(this);
        if (button.hasClass("active")) {
            favoriteCancel();
        } else {
            estateFavoriteRegister();
        }
    });

    // map_sell_view 매물 상세탭 - 인쇄
    $("#estate_print_btn").on("click", function () {
        printDiv("map_sell_view");
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

    // 지도 - 옵션 - 메모관리 //
    // 메모관리 ON/OFF 상태 저장 키
    const MEMO_STATE_KEY = "realprice_memo_active";

    /** 메모관리 ON/OFF 상태를 세션에 저장 */
    function saveMemoState(isActive) {
        try { sessionStorage.setItem(MEMO_STATE_KEY, isActive ? "1" : "0"); } catch(e) {}
    }

    /** 메모 ON 처리 (공통) */
    function turnMemoOn() {
        $("#mapOptionMemoOpen2").addClass("active");
        saveMemoState(true);
        if (typeof displayMemoOnMap === "function") displayMemoOnMap();
    }

    /** 메모 OFF 처리 (공통) */
    function turnMemoOff() {
        $("#mapOptionMemoOpen2").removeClass("active");
        $(".mo-memo").fadeOut(200, "easeOutQuad");
        saveMemoState(false);
        if (typeof removeExistingMemoOverlays === "function") removeExistingMemoOverlays();
    }

    // 메모관리 버튼 클릭
    $("#mapOptionMemoOpen2").on("click", function () {
        const user = userInfo();
        if (!user) {
            $("#modalAlert").iziModal("open");
            $("#alert_message").html("<h2><span>회원 전용</span> 기능입니다.</h2>");
            return;
        }
        if ($(this).hasClass("active")) {
            // ON → OFF : 패널 닫기 + 메모 제거
            turnMemoOff();
        } else {
            // OFF → ON : 모바일에서 position:fixed 위치 계산 후 패널 열기 + 메모 표시
            positionMoMemo();
            $(".mo-memo").fadeIn(100, "easeOutQuad");
            turnMemoOn();
        }
    });

    // 메모관리 닫기(X) 버튼 - 패널만 닫고 메모 ON 상태 유지
    $(".mo-memo > dl > dd > button").on("click", function () {
        $(".mo-memo").fadeOut(200, "easeOutQuad");
        // active 상태(메모 표시)는 그대로 유지
    });

    // 메모관리 - 거래완료 포함 체크박스
    $("#opt_complet").on("change", function () {
        if ($("#mapOptionMemoOpen2").hasClass("active")) {
            if (typeof displayMemoOnMap === "function") displayMemoOnMap();
        }
    });

    // 메모관리 - 전체/내 매물 메모보기 라디오 버튼
    $('input[name="radio_memo"]').on("change", function () {
        if ($("#mapOptionMemoOpen2").hasClass("active")) {
            if (typeof displayMemoOnMap === "function") displayMemoOnMap();
        }
    });

    // 페이지 로드 시 저장된 메모 상태 복원 (로그인 세션 동안 유지)
    setTimeout(function () {
        const user = userInfo();
        if (!user) return; // 비로그인이면 복원 안 함
        try {
            const saved = sessionStorage.getItem(MEMO_STATE_KEY);
            if (saved === "1") {
                // 패널은 자동으로 열지 않고, 지도 메모 표시만 복원
                turnMemoOn();
            }
        } catch(e) {}
    }, 2000); // 지도 및 스크립트 로드 완료 후 실행
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

                // 현재 활성 탭에 해당하는 타입만 검색 이력 저장
                if ($('#layerTab_realPrice').hasClass('active')) {
                    saveSearchHistory({ address: places.address_name, lat: places.y, lng: places.x, type: 'real' });
                }
                if ($('#layerTab_estate').hasClass('active')) {
                    saveSearchHistory({ address: places.address_name, lat: places.y, lng: places.x, type: 'estate' });
                }
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
    //console.log(currentUrl);
    const jibunAddressElement = $(".jibun-address").eq(0);

    Kakao.Share.sendDefault({
        // container: "#kakaotalk_sharing_btn",
        objectType: "text",
        text: `[주소 공유] #토디 #실거래가 #부동산\n${jibunAddressElement.text()}`,
        link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl,
        },
        
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
 * 매물정보 찜 등록 함수 (estate 전용)
 * - estate_favorite_btn 클릭 시 호출
 * - type='estate', estateNo, lat, lng 포함하여 저장
 */
async function estateFavoriteRegister() {
    const user = userInfo();
    if (!user) {
        $("#modalAlert").iziModal("open");
        $("#alert_message").html("<h2><span>회원</span> 전용 기능입니다.</h2>");
        return;
    }

    const estateEle = $("#map_sell_view .msv-info dd .estate-no");
    const estateNo  = estateEle.text().trim();
    const lat       = estateEle.attr("data-lat");
    const lng       = estateEle.attr("data-lng");
    // 주소: #click_location(선택 주소) 또는 msv_content의 address_jibun
    const address   = $("#msv_content").find(".address_jibun").text().trim()
                   || $("#click_location").val().trim();

    if (!estateNo) {
        console.warn("estateFavoriteRegister: estateNo 없음");
        return;
    }

    const dataObj = {
        ...user,
        address:  encodeURIComponent(address),
        lat:      encodeURIComponent(lat),
        lng:      encodeURIComponent(lng),
        type:     encodeURIComponent("estate"),
        estateNo: encodeURIComponent(estateNo),
    };

    callApiAbort("/front/back/favorite/favorite_register_realPrice.php", "POST", dataObj, "estateFavoriteRegister")
        .then((response) => {
            if (!response) {
                $("#modalAlert").iziModal("open");
                $("#alert_message").html("<h2>다시 시도해주세요.</h2>");
                return;
            }
            const { statusCode } = response;
            if (statusCode !== 200) return;

            $("#modalAlert").iziModal("open");
            $("#alert_message").html("<h2><span>찜</span>으로 등록되었습니다.</h2>");
            $("#estate_favorite_btn").addClass("active");
            getRescentHistory();
        })
        .catch((error) => {
            console.log(error);
        });
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
    //console.log(btn);

    const no = btn.attr("data-no");
    const type = btn.attr("data-type");
    //console.log(type);

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

    // 모달 - 가격대 필터 (매물정보 전용) — iziModal 초기화로 페이지 로드 시 숨김 처리
    if ($("#modalSellFilter").length) {
        $("#modalSellFilter").iziModal({
            width: "470px",
        });
    }

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
            // 모바일→PC 전환: realmap-estate-group 등 active 상태 재동기화
            _applyLayerState();
            positionToggleGroup();
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

function updateRegionStatusZoomLimit() {
    if (typeof map === 'undefined') {
        return;
    }

    const hasOverlay =
        $('#chk1').is(':checked') ||
        $('#chk2').is(':checked') ||
        $('#chkSlope').is(':checked') ||
        $('#chkElevation').is(':checked');
    map.setMaxLevel(hasOverlay ? 9 : 13);
}

function bindNationalEnvRegionToggle(selector, layerId) {
    $(selector).change(function () {
        if (typeof map === 'undefined') {
            return;
        }

        const isChecked = $(this).is(':checked');

        if (isChecked) {
            if ($('#chk2').is(':checked')) {
                $('#chk2').prop('checked', false);
                removeEcologyWMSTileLayer();
            }
            if (typeof setNationalEnvLayer === 'function') {
                setNationalEnvLayer(layerId);
            }
            if (map.getLevel() > 9) {
                map.setLevel(9);
            }
            if (typeof addNationalEnvWMSTileLayer === 'function' && typeof isNationalEnvLayerActive === 'function') {
                if (!isNationalEnvLayerActive()) {
                    addNationalEnvWMSTileLayer();
                }
            }
        } else if (!isAnyNationalEnvCheckboxChecked()) {
            if (typeof removeNationalEnvWMSTileLayer === 'function') {
                removeNationalEnvWMSTileLayer();
            }
        } else {
            const nextLayer = resolveCheckedNationalEnvLayerId();
            if (nextLayer) {
                if (typeof setNationalEnvLayer === 'function') {
                    setNationalEnvLayer(nextLayer);
                }
                if (typeof addNationalEnvWMSTileLayer === 'function' && typeof isNationalEnvLayerActive === 'function') {
                    if (!isNationalEnvLayerActive()) {
                        addNationalEnvWMSTileLayer();
                    }
                }
            }
        }

        updateRegionStatusZoomLimit();
    });
}

function isAnyNationalEnvCheckboxChecked() {
    return $('#chk1').is(':checked') || $('#chkSlope').is(':checked') || $('#chkElevation').is(':checked');
}

function resolveCheckedNationalEnvLayerId() {
    if ($('#chk1').is(':checked')) {
        return 'nem_ecvam';
    }
    if ($('#chkSlope').is(':checked')) {
        return 'slope';
    }
    if ($('#chkElevation').is(':checked')) {
        return 'elevation';
    }
    return null;
}

/* =====================================================================
 * ████████  v2 레이어 토글 + estate 통합 기능  ████████
 * ===================================================================== */

/**
 * ① 레이어 토글 이벤트 초기화
 * - 실거래가/매물정보 버튼 각각 독립 ON/OFF
 * - 둘 다 OFF → map-content 비활성화 + 공통 필터 숨김
 */
function initLayerToggle() {
    function doToggleRealPrice() {
        layerState.realPrice = !layerState.realPrice;
        $('#toggleRealPrice').toggleClass('active', layerState.realPrice);
        var _rpState = layerState.realPrice;
        setTimeout(function() {
            _applyLayerState();
            if (_rpState && typeof fetchRealPriceAptArrayBasedOnMapCenterWidthCash_AutoPoint === 'function') {
                fetchRealPriceAptArrayBasedOnMapCenterWidthCash_AutoPoint();
            }
        }, 0);
    }
    function doToggleEstate() {
        layerState.estate = !layerState.estate;
        $('#toggleEstate').toggleClass('active', layerState.estate);
        var _esState = layerState.estate;
        setTimeout(function() {
            _applyLayerState();
            if (_esState && !_estateListLoaded) {
                _estateListLoaded = true;
                estateNewList();
            }
        }, 0);
    }

    // touchstart + preventDefault: mouseover/hover 이벤트 원천 차단 (hover sticky 방지)
    // touchend + preventDefault: 합성 click 차단
    // click: 마우스 전용
    $('#toggleRealPrice')
        .on('touchstart', function(e) { e.preventDefault(); })
        .on('touchend', function(e) { e.preventDefault(); doToggleRealPrice(); })
        .on('click', function() { doToggleRealPrice(); });

    $('#toggleEstate')
        .on('touchstart', function(e) { e.preventDefault(); })
        .on('touchend', function(e) { e.preventDefault(); doToggleEstate(); })
        .on('click', function() { doToggleEstate(); });
}

function _applyLayerState() {
    const bothOff = !layerState.realPrice && !layerState.estate;

    // 실거래가 마커 show/hide (clusterRealPrice_v2.js의 오버레이 제어)
    if (layerState.realPrice) {
        showRealPriceOverlays();
    } else {
        hideRealPriceOverlays();
    }

    // 매물 마커 show/hide
    if (layerState.estate) {
        showEstateMarkers();
    } else {
        hideEstateMarkers();
    }

    // ⑤ 공통 검색 조건 (매물종류) show/hide
    if (bothOff) {
        $('#realmapEstateGroup').hide();
    } else if (layerState.estate) {
        // 매물 레이어 ON: opt_estate 체크박스 상태 유지 (줌 변경 시 덮어쓰기 방지)
        $('#realmapEstateGroup').toggle($('#opt_estate').prop('checked'));
    } else {
        // 실거래가만 ON: 원래대로 표시 (매물종류는 실거래가 필터로도 사용)
        $('#realmapEstateGroup').show();
    }

    // ⑦ 실거래가 검색 조건 show/hide
    if (layerState.realPrice) {
        _syncRealPriceSearchConditions();
    } else {
        $('#realmapEstateInfo').hide();
        $('#realmapAverageInfo').hide();
    }

    // ② map-content 탭 show/hide
    _updateLayerTabs();

    // [순서 변경] 패널 active/deactive를 먼저 결정 → 그 후 final 상태로 모든 그룹 sync
    // 기존: filter buttons 동기화 후 panel 변경 → 상태 불일치 (Issue 7~8 원인)
    const isMobile = $(window).width() < 992;
    if (bothOff) {
        // 둘 다 OFF: PC/모바일 모두 패널 닫기
        $('.map-content').removeClass('active');
        if (!isMobile) {
            // PC: 사이드바 닫히면 지도를 전체 너비로 확장
            $('.map-bg, #rvWrapper').addClass('full');
            // 카카오 지도 컨테이너 크기 변경 알림 (즉시 + 트랜지션 중간 + 종료 후)
            if (typeof map !== 'undefined' && map) kakao.maps.event.trigger(map, 'resize');
            setTimeout(function() {
                if (typeof map !== 'undefined' && map) kakao.maps.event.trigger(map, 'resize');
            }, 200);
            setTimeout(function() {
                if (typeof map !== 'undefined' && map) kakao.maps.event.trigger(map, 'resize');
                positionToggleGroup();
            }, 450);
        }
        if (isMobile) {
            // 모바일: mc-mo-open-close 상태도 동기화 (▽ 표시로 복귀)
            $('#mapContentMoOpenClose').removeClass('active');
            updateMapContentIcons();
        }
    } else {
        if (!isMobile) {
            // PC 전용: 레이어 ON 시 패널 자동 오픈 + 지도 너비 원상복귀
            $('.map-bg, #rvWrapper').removeClass('full');
            if (!$('.map-content').hasClass('active')) {
                if (!window.mapContentClosingLock) {
                    $('.map-content').addClass('active');
                }
            }
            // 카카오 지도 컨테이너 크기 변경 알림 (즉시 + 트랜지션 중간 + 종료 후)
            if (typeof map !== 'undefined' && map) kakao.maps.event.trigger(map, 'resize');
            setTimeout(function() {
                if (typeof map !== 'undefined' && map) kakao.maps.event.trigger(map, 'resize');
            }, 200);
            setTimeout(function() {
                if (typeof map !== 'undefined' && map) kakao.maps.event.trigger(map, 'resize');
                positionToggleGroup();
            }, 450);
        }
        // 모바일: 패널 상태를 변경하지 않음 — mc-mo-open-close 핸들러가 단독 제어
    }

    // [신규] FINAL 패널 상태를 읽어서 모든 그룹 active 동기화
    const isPanelOpen = $('.map-content').hasClass('active');
    const estateOnly  = layerState.estate;

    // ⑥ 매물 전용 검색 조건: show/hide + active 동기화 (mo-search 체크박스 상태 반영)
    if (estateOnly) {
        var _optSale     = $('#opt_sale').prop('checked');
        var _optExchange = $('#opt_exchange').prop('checked');
        var _optUrgent   = $('#opt_urgent').prop('checked');
        var _optPrice    = $('#opt_price').prop('checked');
        $('#mapSaleGroup').toggle(_optSale).toggleClass('active', _optSale && isPanelOpen);
        $('#mapExchangeGroup').toggle(_optExchange).toggleClass('active', _optExchange && isPanelOpen);
        $('#mapUrgentSaleGroup').toggle(_optUrgent).toggleClass('active', _optUrgent && isPanelOpen);
        $('#mapPriceGroup').toggle(_optPrice).toggleClass('active', _optPrice && isPanelOpen);
    } else {
        $('#mapSaleGroup, #mapExchangeGroup, #mapUrgentSaleGroup, #mapPriceGroup').hide().removeClass('active');
    }

    // [신규] realmap-estate-group / -info / -average-info 도 panel 상태와 동기화
    // (close/open 핸들러는 이들을 직접 토글하지만 _applyLayerState 경로에서 누락되어 있던 부분)
    // map-history도 panel 상태와 동기화 (모바일→PC 전환 시 active 누락 방지)
    $('.map-history').toggleClass('active', isPanelOpen);
    $('.realmap-estate-group').toggleClass('active', isPanelOpen);
    $('.realmap-estate-info').toggleClass('active', isPanelOpen);
    $('.realmap-average-info').toggleClass('active', isPanelOpen);

    // 중개사 매물 등록 버튼: 매물 레이어 ON + 중개사(user_role=002)일 때만 표시
    const showSaleRegister = estateOnly && getCookie("user_role") === "002";
    $('#mapSaleRegisterGroup').toggle(showSaleRegister);
    document.body.classList.toggle('realtor-sale-register-visible', showSaleRegister);
    // mo-search의 거래종류/교환/급매물/가격대 항목 show/hide
    $('[name="opt_sale"]').closest('div').toggle(estateOnly);
    $('[name="opt_exchange"]').closest('div').toggle(estateOnly);
    $('[name="opt_urgent"]').closest('div').toggle(estateOnly);
    $('[name="opt_price"]').closest('div').toggle(estateOnly);

    // mapContentOpenClose 잠금 (둘 다 OFF 시)
    $('#mapContentOpenClose').toggleClass('disabled-lock', bothOff);

}

function _updateLayerTabs() {
    const $rpTab = $('#layerTab_realPrice');
    const $esTab = $('#layerTab_estate');
    const $rpContent = $('#layerContent_realPrice');
    const $esContent = $('#layerContent_estate');

    $rpTab.toggle(layerState.realPrice);
    $esTab.toggle(layerState.estate);

    // 현재 활성 탭이 숨겨지면 다른 탭으로 전환
    if (!layerState.realPrice && $rpTab.hasClass('active')) {
        if (layerState.estate) {
            _switchLayerTab('layer-estate');
        }
    }
    if (!layerState.estate && $esTab.hasClass('active')) {
        if (layerState.realPrice) {
            _switchLayerTab('layer-realprice');
        }
    }
}

let _estateListLoaded = false; // 매물 리스트 최초 로드 여부

function _switchLayerTab(target) {
    $('.layer-tab-btn').removeClass('active');
    $('.layer-tab-content').hide();
    $(`.layer-tab-btn[data-target="${target}"]`).addClass('active');
    $(`.layer-tab-content.${target}`).show();

    // 실거래가 탭으로 전환 시 매물 상세정보 닫기
    if (target === 'layer-realprice') {
        $('#map_sell_view').removeClass('active');
    }

    // 매물정보 탭으로 전환 시 최초 1회 초기 로드
    if (target === 'layer-estate' && !_estateListLoaded) {
        _estateListLoaded = true;
        estateNewList();
    }
}

function _syncRealPriceSearchConditions() {
    // 표시내용 체크박스가 해제되어 있으면 둘 다 숨김
    if (!$('#opt_display_info').prop('checked')) {
        $('#realmapEstateInfo').hide();
        $('#realmapAverageInfo').hide();
        return;
    }
    const level = map ? map.getLevel() : 10;
    if (level <= 5) {
        // 줌 1~5: 거래면적 조건 표시
        $('#realmapEstateInfo').show();
        $('#realmapAverageInfo').hide();
    } else {
        // 줌 6~: 최근5년 조건 표시
        $('#realmapEstateInfo').hide();
        $('#realmapAverageInfo').show();
    }
}

/** 실거래가 오버레이 전체 show (clusterRealPrice_v2.js 함수 위임) */
function showRealPriceOverlays() {
    if (typeof showRealPriceClusterers === 'function') showRealPriceClusterers();
}

/** 실거래가 오버레이 전체 hide (clusterRealPrice_v2.js 함수 위임) */
function hideRealPriceOverlays() {
    if (typeof hideRealPriceClusterers === 'function') hideRealPriceClusterers();
}

/* =====================================================================
 * ② map-content 상위 탭 전환 이벤트
 * ===================================================================== */
$(document).on('click', '.layer-tab-btn', function () {
    const target = $(this).data('target');
    _switchLayerTab(target);
});

/* =====================================================================
 * mapContentOpenClose 잠금 처리 (둘 다 OFF 시 동작 안 함)
 * ===================================================================== */
$(document).on('click', '#mapContentOpenClose', function () {
    if ($(this).hasClass('disabled-lock')) return false;
});

/* =====================================================================
 * 메모관리 서브메뉴(mo-memo) 모바일 위치 동적 계산
 * map-content-wrapper(z-index:302)에 가려지지 않도록 position:fixed + z-index:9999
 * ===================================================================== */
function positionMoMemo() {
    if ($(window).width() > 991) return;
    var btn = document.getElementById('mapOptionMemoOpen2');
    if (!btn) return;
    var rect = btn.getBoundingClientRect();
    var winH = window.innerHeight;
    // 화면 하단 고정 요소들의 top 중 가장 위에 있는 것을 기준으로 삼음
    // (mobile-footer / mc-mo-open-close / map-content-wrapper)
    var bottomCandidates = [
        '.mobile-footer',
        '#mapContentMoOpenClose',
        '.map-content-wrapper'
    ].map(function(sel) {
        var el = document.querySelector(sel);
        return el ? el.getBoundingClientRect().top : winH;
    });
    var bottomEdge = Math.min.apply(null, bottomCandidates) - 8;
    var startY = rect.top;
    var availH = bottomEdge - startY;
    if (availH < 120) {
        // 아래 공간 부족 시 버튼 위쪽에 표시
        startY = Math.max(10, bottomEdge - 220);
        availH = bottomEdge - startY;
    }
    $('.mo-memo').css({
        top: startY + 'px',
        bottom: 'auto',
        maxHeight: Math.max(120, availH) + 'px'
    });
}

/* =====================================================================
 * ⑥ estate 검색 조건 표시설정 이벤트 (mo-search 패널)
 * ===================================================================== */
function positionMoSearch() {
    if ($(window).width() > 767) return;
    var btn = document.getElementById('mapOptionSearch');
    if (!btn) return;
    var rect = btn.getBoundingClientRect();
    var winH = window.innerHeight;
    // 화면 하단 고정 요소들의 top 중 가장 위에 있는 것을 기준으로 삼음
    // (mobile-footer / mc-mo-open-close / map-content-wrapper)
    var bottomCandidates = [
        '.mobile-footer',
        '#mapContentMoOpenClose',
        '.map-content-wrapper'
    ].map(function(sel) {
        var el = document.querySelector(sel);
        return el ? el.getBoundingClientRect().top : winH;
    });
    var bottomEdge = Math.min.apply(null, bottomCandidates) - 8;
    var startY = rect.top;
    var availH = bottomEdge - startY;
    if (availH < 150) {
        // 아래 공간 부족 시 버튼 위쪽에 표시
        startY = Math.max(10, bottomEdge - 320);
        availH = bottomEdge - startY;
    }
    $('.mo-search').css({
        top: startY + 'px',
        bottom: 'auto',
        maxHeight: Math.max(150, availH) + 'px'
    });
}

function initEstateSearchConditionEvents() {
    // 검색조건 버튼 클릭 - 패널 열기/닫기
    $('#mapOptionSearch').on('click', function () {
        $(this).toggleClass('active');
        if ($(this).hasClass('active')) {
            positionMoSearch();
            $('.mo-search').fadeIn(100, 'easeOutQuad');
        } else {
            $('#mapOptionSearch').removeClass('active');
            $('.mo-search').fadeOut(400, 'easeOutQuad');
        }
    });

    // 검색조건 닫기(X) 버튼
    $('.mo-search > dl > dd > button').on('click', function () {
        $('.mo-search').fadeOut(400, 'easeOutQuad');
        $('#mapOptionSearch').removeClass('active');
    });

    // ⭐ opt_all (전체조건) 체크박스 ⭐
    $('#opt_all').on('change', function () {
        if ($(this).prop('checked')) {
            $('.realmap-estate-group').fadeIn(100, 'easeOutQuad');
            if (layerState.estate) {
                $('.map-sale-group').fadeIn(100, 'easeOutQuad');
                $('.map-exchange-group').fadeIn(100, 'easeOutQuad');
                $('.map-urgentsale-group').fadeIn(100, 'easeOutQuad');
                $('.map-price-group').fadeIn(100, 'easeOutQuad');
            }
            $('#opt_estate, #opt_sale, #opt_exchange, #opt_urgent, #opt_price, #opt_display_info').prop('checked', true);
            if (layerState.realPrice) _syncRealPriceSearchConditions();
        } else {
            $('.realmap-estate-group').fadeOut(100, 'easeOutQuad');
            $('.map-sale-group').fadeOut(100, 'easeOutQuad');
            $('.map-exchange-group').fadeOut(100, 'easeOutQuad');
            $('.map-urgentsale-group').fadeOut(100, 'easeOutQuad');
            $('.map-price-group').fadeOut(100, 'easeOutQuad');
            $('#opt_estate, #opt_sale, #opt_exchange, #opt_urgent, #opt_price, #opt_display_info').prop('checked', false);
            $('#realmapEstateInfo, #realmapAverageInfo').hide();
        }
    });

    // opt_all 동기화 헬퍼: 개별 항목 모두 체크 시 opt_all 자동 체크
    function _syncOptAll() {
        const allChecked = $('#opt_estate').prop('checked') &&
            $('#opt_sale').prop('checked') &&
            $('#opt_exchange').prop('checked') &&
            $('#opt_urgent').prop('checked') &&
            $('#opt_price').prop('checked') &&
            $('#opt_display_info').prop('checked');
        $('#opt_all').prop('checked', allChecked);
    }

    // ⭐ opt_estate (매물종류) ⭐
    $('#opt_estate').on('change', function () {
        if ($(this).prop('checked')) {
            $('.realmap-estate-group').fadeIn(100, 'easeOutQuad');
        } else {
            $('.realmap-estate-group').fadeOut(100, 'easeOutQuad');
        }
        _syncOptAll();
    });

    // ⭐ opt_sale (거래종류) ⭐
    $('#opt_sale').on('change', function () {
        if ($(this).prop('checked')) {
            if (layerState.estate) $('.map-sale-group').fadeIn(100, 'easeOutQuad');
        } else {
            $('.map-sale-group').fadeOut(100, 'easeOutQuad');
        }
        _syncOptAll();
    });

    // ⭐ opt_exchange (교환여부) ⭐
    $('#opt_exchange').on('change', function () {
        if ($(this).prop('checked')) {
            if (layerState.estate) $('.map-exchange-group').fadeIn(100, 'easeOutQuad');
        } else {
            $('.map-exchange-group').fadeOut(100, 'easeOutQuad');
        }
        _syncOptAll();
    });

    // ⭐ opt_urgent (급매물) ⭐
    $('#opt_urgent').on('change', function () {
        if ($(this).prop('checked')) {
            if (layerState.estate) $('.map-urgentsale-group').fadeIn(100, 'easeOutQuad');
        } else {
            $('.map-urgentsale-group').fadeOut(100, 'easeOutQuad');
        }
        _syncOptAll();
    });

    // ⭐ opt_price (가격대) ⭐
    $('#opt_price').on('change', function () {
        if ($(this).prop('checked')) {
            if (layerState.estate) $('.map-price-group').fadeIn(100, 'easeOutQuad');
        } else {
            $('.map-price-group').fadeOut(100, 'easeOutQuad');
        }
        _syncOptAll();
    });

    // ⭐ opt_display_info (표시내용) — realmap-estate-info / realmap-average-info 제어 ⭐
    $('#opt_display_info').on('change', function () {
        if ($(this).prop('checked')) {
            // 줌레벨에 따라 배타적으로 표시 (실거래가 레이어 ON 시에만)
            if (layerState.realPrice) _syncRealPriceSearchConditions();
        } else {
            $('#realmapEstateInfo, #realmapAverageInfo').hide();
        }
        _syncOptAll();
    });
}

/* =====================================================================
 * estate 필터 공통 함수 (sell_v2.js에서 이관)
 * ===================================================================== */
async function getFilterTypes() {
    const url = "/front/back/sell/filter_type_get_v2.php";
    try {
        const result = await callApi("POST", url, {});
        if (!result) return;
        const { message, responseData, statusCode } = result;
        if (statusCode !== 200 || responseData.length == 0) return;
        const { ESTATE_TYPE, SALE_TYPE } = responseData;
        const estateOptionHtml = ESTATE_TYPE.map(function (item) {
            return `<option value="${item.type_code}">${item.type_name}</option>`;
        });
        const saleOptionHtml = SALE_TYPE.map(function (item) {
            return `<option value="${item.type_code}">${item.type_name}</option>`;
        });
        $("#estate_type_filter").append(estateOptionHtml);
        $("#sale_type_filter").append(saleOptionHtml);
    } catch (error) {
        console.error("getFilterTypes error:", error);
    }
}

function setPriceSlider(slider) {
    const min = 0;
    const max = 100000000;
    noUiSlider.create(slider, {
        start: [min, max],
        connect: true,
        tooltips: [
            { to: function (value) { return formatPrice(Math.round(value * 100) / 100); } },
            { to: function (value) { return formatPrice(Math.round(value * 100) / 100); } },
        ],
        step: 1000,
        keyboardSupport: true,
        keyboardDefaultStep: 1000,
        keyboardPageMultiplier: 10,
        range: { min: min, max: max },
        format: wNumb({ decimals: 0, suffix: "" }),
    });
    const inputNumber = document.getElementById("input_price_start");
    const inputNumber2 = document.getElementById("input_price_end");
    inputNumber && inputNumber2 && slider &&
        (slider.noUiSlider.on("update", function (e, i) {
            e = e[i];
            i ? (inputNumber2.value = e) : (inputNumber.value = e);
        }),
        inputNumber.addEventListener("change", function () { slider.noUiSlider.set([this.value, null]); }),
        inputNumber2.addEventListener("change", function () { slider.noUiSlider.set([null, this.value]); }));
}

function setIniSliderValues(slider) {
    slider.noUiSlider.set(["0", "100000000"]);
}

function resetFilters() {
    $("#estate_type_filter").val("").trigger("change");
    $("#sale_type_filter").val("").trigger("change");
    var priceSlider = document.getElementById("price_slider");
    if (priceSlider && priceSlider.noUiSlider) {
        priceSlider.noUiSlider.set([0, 100000000]);
    }
    estateNewList();
}

/* =====================================================================
 * estate 필터 이벤트 (매물종류·거래종류·교환·급매·가격대)
 * ===================================================================== */
function initEstateFilters() {
    getFilterTypes();   // 매물종류/거래종류 코드 로드 (sell_v2와 동일 API)
    const priceSlider = document.getElementById("price_slider");
    if (priceSlider) {
        setPriceSlider(priceSlider);
        setIniSliderValues(priceSlider);
    }

    // 거래종류 버튼
    $('.map-sale-group').on('click', 'button', function () {
        $(this).toggleClass('active');
        estateNewList();
    });
    // 교환
    $('.map-exchange-group').on('click', 'button', function () {
        $(this).toggleClass('active');
        estateNewList();
    });
    // 급매
    $('.map-urgentsale-group').on('click', 'button', function () {
        $(this).toggleClass('active');
        estateNewList();
    });
    // 가격대 적용/초기화
    $('#filter_apply_btn').on('click', function () { estateNewList(); });
    $('#filter_reset_btn').on('click', function () {
        const slider = document.getElementById("price_slider");
        if (slider && slider.noUiSlider) {
            slider.noUiSlider.set([0, 100000000]);
        }
        $('#input_price_start').val(0);
        $('#input_price_end').val(100000000);
        estateNewList();
    });
}

/* =====================================================================
 * 필터 파라미터 수집 함수 (두 API용으로 분리)
 *
 * collectMultiFilterParams()     - 실거래가 API (clusterRealPrice_v2.js) 호환
 *                                  estateType: 영문 ["apt","multi",...] + estateinfo
 * collectEstateFilterParams()    - 매물정보 API (estate_multfilter_list_v2.php)
 *                                  estateType: DB코드 ["1001","1002",...] + saleType 등
 * ===================================================================== */

/** 실거래가 API용: v1(clusterRealPrice.js) collectMultiFilterParams와 동일한 구조 */
function collectMultiFilterParams() {
    return {
        estateType: getEstateListFilterParamsEng(),  // 영문: "apt","multi",...
        estateinfo: getEstateInfoParams(),            // #infoType select 값
    };
}

/** 매물정보 API용: estate_multfilter_list_v2.php가 요구하는 DB코드 구조 */
function collectEstateFilterParams() {
    return {
        estateType: getEstateListFilterParams(),     // DB코드: "1001","1002",...
        saleType:   getSaleListFilterParams(),
        exchange:   getExchangeFilterParams(),
        urgentsale: getUrgentSaleFilterParams(),
        minPrice:   $('#input_price_start').val(),
        maxPrice:   $('#input_price_end').val(),
    };
}

/** #infoType select 값 읽기 (clusterRealPrice.js의 getEstateInfoParams와 동일) */
function getEstateInfoParams() {
    const el = document.getElementById('infoType');
    if (el) return el.value !== "all" ? el.value : "";
    return "거래면적"; // UI 없을 때 기본값
}

function getSaleListFilterParams() {
    const vals = [];
    $('.map-sale-group button.active').each(function () {
        vals.push(saleTypeToValue($(this).text().trim()));
    });
    return vals;
}

function getExchangeFilterParams() {
    return $('.map-exchange-group button.active').length > 0 ? "Y" : "";
}

function getUrgentSaleFilterParams() {
    return $('.map-urgentsale-group button.active').length > 0 ? "Y" : "";
}

/** 매물정보 API용: DB코드 "1001"~"1007" */
function getEstateListFilterParams() {
    const allBtn = $('.realmap-estate-group button').eq(0);
    if (allBtn.hasClass('active')) {
        return ["1001","1002","1003","1004","1005","1006","1007"];
    }
    const vals = [];
    $('.realmap-estate-group button.active').not(allBtn).each(function () {
        const v = estateTypeToValue($(this).text().trim());
        if (v) vals.push(v);
    });
    // 아무것도 선택 안 됐으면 빈 배열 반환 → API 호출 안 함 (clusterRealPrice_v2.js length===0 체크)
    return vals;
}

/** 실거래가 API용: 영문 코드 "apt","multi",... (v1 호환) */
function getEstateListFilterParamsEng() {
    const allBtn = $('.realmap-estate-group button').eq(0);
    if (allBtn.hasClass('active')) {
        return ["apt","multi","officetel","land","single","commercial","factory"];
    }
    const vals = [];
    $('.realmap-estate-group button.active').not(allBtn).each(function () {
        const v = estateTypeToValueEng($(this).text().trim());
        if (v) vals.push(v);
    });
    // 아무것도 선택 안 됐으면 빈 배열 반환 → API 호출 안 함 (clusterRealPrice_v2.js length===0 체크)
    return vals;
}

/** 영문 코드 변환 (실거래가 API용) */
function estateTypeToValueEng(estateType) {
    const map_ = {
        "아파트":            "apt",
        "연립/다세대":       "multi",
        "다세대/연립주택":   "multi",
        "단독/다가구":       "single",
        "단독주택/다가구":   "single",
        "오피스텔":          "officetel",
        "상업/업무용":       "commercial",
        "상가/업무용":       "commercial",
        "공장/창고":         "factory",
        "토지":              "land",
    };
    return map_[estateType] || "";
}

function saleTypeToValue(saleType) {
    switch (saleType) {
        case "매매":        return "001";
        case "전세":
        case "임대(전세)":  return "002";
        case "월세":
        case "임대(월세)":  return "003";
        default:            return "";
    }
}

function estateTypeToValue(estateType) {
    // DB type_master (NEW_ESTATE_TYPE) 실제 코드 매핑
    const map_ = {
        "아파트":            "1001",
        "토지":              "1002",
        "오피스텔":          "1003",
        "연립/다세대":       "1004",
        "다세대/연립주택":   "1004",
        "단독/다가구":       "1005",
        "단독주택/다가구":   "1005",
        "상업/업무용":       "1006",
        "상가/업무용":       "1006",
        "공장/창고":         "1007",
    };
    return map_[estateType] || "";
}

/* =====================================================================
 * 주소 접미사 이후 절단 (sell_v2 동일 패턴)
 * ===================================================================== */
function cutAfterSuffix(text) {
    const suffixes = ['리', '동', '길', '로'];
    if (!text) return '';
    for (const suffix of suffixes) {
        const lastIndex = text.lastIndexOf(suffix);
        if (lastIndex !== -1) {
            return text.substring(0, lastIndex + 1);
        }
    }
    return text;
}

/* =====================================================================
 * 등록일 기준 상태 텍스트 반환 (sell_v2 동일 패턴)
 * ===================================================================== */
function getRegistrationStatus(regDateString) {
    if (!regDateString) return '';
    const today = new Date();
    const regDate = new Date(regDateString);
    today.setHours(0, 0, 0, 0);
    regDate.setHours(0, 0, 0, 0);
    const diffTime = today - regDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return '<span style="color:red; font-weight:bold;">신규등록</span>';
    if (diffDays <= 7) return `<span style="color:red;">${diffDays}일 전 등록</span>`;
    return `<span style="color:#888;">${diffDays}일 전 등록</span>`;
}

/* =====================================================================
 * estateNewList: 매물 목록 API 호출 + 마커·리스트 렌더링
 * ===================================================================== */
async function estateNewList(searchNo = "", propertyNo = "", agencyName = "") {
    if (!layerState.estate) return; // estate OFF 시 호출 무시

    // 클러스터러 및 커스텀 오버레이 초기화
    Object.values(estateClusterersByType).forEach(c => { if (c) c.clear(); });
    if (typeof clearEstateMarkers === 'function') clearEstateMarkers();
    sellDotOverlays.forEach(o => o.setMap(null));
    sellDotOverlays = [];

    // 줌 8 초과: 마커 미표시 (API 호출 생략)
    const zoomLevel = map.getLevel();
    if (zoomLevel > 8) return;

    const filterObj = collectEstateFilterParams(); // 매물정보 API용 (DB코드)
    const bounds    = map.getBounds();
    const sw        = bounds.getSouthWest();
    const ne        = bounds.getNorthEast();
    const dataObj   = {
        ...filterObj,
        searchNo, propertyNo,
        swLat: sw.getLat(), swLng: sw.getLng(),
        neLat: ne.getLat(), neLng: ne.getLng(),
    };
    fixed_list_obj = dataObj;

    callApiAbort("/front/back/sell/estate_multfilter_list_v2.php", "POST", dataObj, "estateNewList")
        .then(response => {
            if (!response) return;
            const { statusCode, responseData } = response;
            if (statusCode !== 200) return;

            // 마지막 응답 저장 (목록고정 체크 시 fixedEstateData로 복사됨)
            lastEstateResponseData = Array.isArray(responseData) ? responseData : [];

            // 목록고정 ON: 고정 데이터 + 현재 데이터 병합 (estate_no 기준 중복 제거)
            let renderData = lastEstateResponseData;
            if (list_fixed_chk && fixedEstateData.length > 0) {
                const currentNos = new Set(lastEstateResponseData.map(d => String(d.estate_no)));
                const fixedOnly = fixedEstateData.filter(d => !currentNos.has(String(d.estate_no)));
                renderData = [...lastEstateResponseData, ...fixedOnly];
            }

            const totalCount = renderData.length;
            if (propertyNo === "") {
                $('#estate_list_title').text(`매물 목록 (${totalCount})`);
            } else {
                $('#estate_list_title').text(`<${agencyName}> 중개사 등록 목록 (${totalCount})`);
            }

            // 상세 탭이 열려 있고 목록고정이 아닌 경우, 해당 매물이 새 목록에 없으면 상세 탭 닫기
            if (!list_fixed_chk && $('#map_sell_view').hasClass('active')) {
                const openedEstateNo = String($('#map_sell_view .msv-info dd .estate-no').text()).trim();
                const stillExists = renderData.some(d => String(d.estate_no) === openedEstateNo);
                if (!stillExists) {
                    $('#map_sell_view').removeClass('active');
                }
            }

            // 응답 후 다시 초기화 (이전 결과 제거)
            Object.values(estateClusterersByType).forEach(c => { if (c) c.clear(); });
            if (typeof clearEstateMarkers === 'function') clearEstateMarkers();
            sellDotOverlays.forEach(o => o.setMap(null));
            sellDotOverlays = [];

            let liHtml = "";
            if (!Array.isArray(renderData) || renderData.length === 0) {
                liHtml = `<div class="no_data_area_inner d-flex flex-column justify-content-center gap-3 text-center position-absolute"
                    style="top:50%;left:50%;transform:translate(-50%,-50%);">
                    <p>매물이 없습니다.</p></div>`;
                $('#comparison_Button_Group').hide();
            } else {
                $('#comparison_Button_Group').show(); // 모바일/PC 무관 표시 (CSS 반응형으로 제어)

                liHtml = renderData.map(function (data) {
                    const currentZoom = map.getLevel();
                    const isExclusive = data.exclusive_building === "Y";
                    const estateTypeClass = isExclusive ? "exclusive" : "non-exclusive";

                    if (currentZoom <= 3) {
                        // 줌 ~3: 가격 마커 (커스텀 오버레이)
                        addEstateContentsMarker(data, estateTypeClass);
                    } else if (currentZoom === 4) {
                        // 줌 4: 점 오버레이
                        if (typeof addEstateDotOverlay === 'function') addEstateDotOverlay(data);
                    } else {
                        // 줌 5~8: 원형 클러스터
                        const c = createEstateClustererAll("all");
                        c.addMarker(createEstateClusteredMarker(data));
                    }

                    let saleTypeHtml = "";
                    let priceHtml = "";
                    switch (data.sale_type) {
                        case "매매":
                            saleTypeHtml = `<span class="label-default bg-green1 font11">매매</span>`;
                            priceHtml = `${formatPrice(data.sale_price, "all", true)}`;
                            break;
                        case "전세": case "임대(전세)":
                            saleTypeHtml = `<span class="label-default bg-violet1 font11">임대(전세)</span>`;
                            priceHtml = `${formatPrice(data.sale_price, "all", true)}`;
                            break;
                        case "월세": case "임대(월세)":
                            saleTypeHtml = `<span class="label-default bg-indigo1 font11">임대(월세)</span>`;
                            priceHtml = `${formatPrice(data.deposit_price, "all", true)} / ${formatPrice(data.rent_price, "all", true)}`;
                            break;
                        default:
                            saleTypeHtml = `<span class="label-default bg-gray font11">${data.sale_type || ""}</span>`;
                            priceHtml = `${formatPrice(data.sale_price, "all", true)}`;
                    }

                    // estate_type + sub_estate 조합 표시 (예: 공장/창고(공장), 상업/업무용(빌딩))
                    // 비교 시에는 data-estate-type 속성(estate_type만)으로 비교 — 별도 수정 불필요
                    const estateLabel = (() => {
                        if (!data.sub_estate) return data.estate_type;
                        const fullName = typeof getEstateDisplayName === 'function'
                            ? getEstateDisplayName(data.estate_type, data.sub_estate)
                            : data.estate_type;
                        if (!fullName || fullName === data.estate_type) return data.estate_type;
                        // fullName이 estate_type과 동일하게 시작하는 경우 (예: "아파트(분양권)")
                        if (fullName.startsWith(data.estate_type)) return fullName;
                        // 그 외: "공장/창고(공장)" 형식으로 조합
                        return `${data.estate_type}(${fullName})`;
                    })();
                    const estateTypeHtml = `<span class="font13">${estateLabel}</span>`;

                    // 면적 (formatArea 사용 — 현재 단위 평/㎡)
                    const areaHtml = data.estate_type === "토지"
                        ? formatArea(data.platArea)
                        : formatArea(data.totArea);

                    // 주소
                    let addressHtml = "";
                    if (data.address_jibun) {
                        addressHtml = `<span class="ms-md-auto">${cutAfterSuffix(data.address_jibun)}</span>`;
                    } else {
                        addressHtml = `<span class="text-end">주소 정보 없음</span>`;
                    }

                    // 교환/급매 배지
                    const exchange_Html = data.exchange_fg === "Y"
                        ? `<span class="label-default bg-blue1">교환가능</span>` : "";
                    const urgent_sale_Html = data.urgent_sale_fg === "Y"
                        ? `<span class="label-default bg-red1 blink">급매물</span>` : "";

                    // 이미지
                    let image = '<img src="/front/assets/image/building_empty.png" width="100%" alt="" />';
                    if (data.imageArray && data.imageArray.length > 0) {
                        const imgData = data.imageArray[0];
                        const imageUrl = `/front/back/00-include/image.php?token=${encodeURIComponent(imgData.imageToken)}`;
                        if (imgData.fileType === "image") {
                            image = `<img src="${imageUrl}" alt="" width="100" onerror="this.onerror=null;this.src='/front/assets/image/building_empty.png';">`;
                        } else if (imgData.fileType === "video") {
                            image = `<video muted width="100%" class="img-fluid mx-auto rounded"><source src="${imageUrl}" type="video/mp4" class="h-100">Your browser does not support the video tag.</video>`;
                        }
                    }

                    // 비교 체크박스 + 매물번호
                    const compareCheckbox = `<div class="check-box-orange-s"><input type="checkbox" id="compareCheckbox_${data.estate_no}"><label for="compareCheckbox_${data.estate_no}">비교</label></div>`;
                    const estateNoHtml = `<div class="ms-auto font13"><label>매물번호:${data.estate_no}</label></div>`;

                    return `
                        <dl class="${estateTypeClass} d-flex flex-wrap" data-estate-no="${data.estate_no}" data-estate-type="${data.estate_type}">
                            <h2 class="d-flex align-items-center justify-content-between w-100">
                                <div class="d-flex align-items-center gap-1">
                                    ${compareCheckbox}
                                    ${saleTypeHtml}
                                    ${estateTypeHtml}
                                    ${exchange_Html}
                                    ${urgent_sale_Html}
                                </div>
                                <div class="ms-auto font12">${estateNoHtml}</div>
                            </h2>
                            <dt>
                                <h2 class="d-flex align-items-center gap-1">${addressHtml}</h2>
                                <ul>
                                    <li>${priceHtml}</li>
                                    <li class="text-nowrap">${areaHtml}</li>
                                </ul>
                                <div><p class="text-clamp">${data.description ? data.description : "매물설명 없음"}</p></div>
                            </dt>
                            <dd class="col-md-4">${image}</dd>
                        </dl>
                        <dl class="d-flex flex-wrap" style="font-size:12px;height:25px;margin-bottom:3px;border-bottom:#e9e9e9 1px solid;" data-estate-no="${data.estate_no}">
                            <h2 class="d-flex align-items-center justify-content-between w-100">
                                <div class="d-flex align-items-center gap-1 font12 agency-name">
                                    <button type="button">
                                        <span class="agency-text-prefix">상호명: </span>
                                        <span class="agency-name-text">${data.agency_name || ""}</span>
                                    </button>
                                </div>
                                <div class="ms-auto font12">등록일: ${data.reg_date || ""}&nbsp;${getRegistrationStatus(data.reg_date)}</div>
                            </h2>
                            <dt></dt><dd></dd>
                        </dl>`;
                }).join("");
            }

            const $list = $('.mcs-list');
            $list.fadeOut(200, function () {
                $(this).html(liHtml).fadeIn(300, function () {
                    reapplyCompareState(); // 재렌더링 후 compareList 체크/테두리 복원
                });
            });
        });
}

/* =====================================================================
 * estateNewList_mapOnly: 목록고정 시 지도 마커만 갱신 (리스트 HTML 불변)
 * fixed_list_obj(고정 시점의 검색 파라미터)로 API 재호출 → 마커만 재표시
 * ===================================================================== */
async function estateNewList_mapOnly() {
    if (!layerState.estate) return;
    if (!fixed_list_obj) return;

    const zoomLevel = map.getLevel();
    if (zoomLevel > 8) return;

    // 기존 마커 초기화
    Object.values(estateClusterersByType).forEach(c => { if (c) c.clear(); });
    if (typeof clearEstateMarkers === 'function') clearEstateMarkers();
    sellDotOverlays.forEach(o => o.setMap(null));
    sellDotOverlays = [];

    callApiAbort("/front/back/sell/estate_multfilter_list_v2.php", "POST", fixed_list_obj, "estateNewList")
        .then(response => {
            if (!response) return;
            const { statusCode, responseData } = response;
            if (statusCode !== 200 || !Array.isArray(responseData)) return;

            const currentZoom = map.getLevel();
            responseData.forEach(function (data) {
                const isExclusive = data.exclusive_building === "Y";
                const estateTypeClass = isExclusive ? "exclusive" : "non-exclusive";

                if (currentZoom <= 3) {
                    if (typeof addEstateContentsMarker === 'function') addEstateContentsMarker(data, estateTypeClass);
                } else if (currentZoom === 4) {
                    if (typeof addEstateDotOverlay === 'function') addEstateDotOverlay(data);
                } else {
                    const c = createEstateClustererAll("all");
                    if (typeof createEstateClusteredMarker === 'function') c.addMarker(createEstateClusteredMarker(data));
                }
            });
        });
}

/* =====================================================================
 * estate 클러스터러 생성 함수
 * ===================================================================== */
function createEstateClustererAll(type) {
    if (!estateClusterersByType[type]) {
        // 매물 클러스터 스타일 (주황색, 실거래가 보라색과 구분)
        const clusterStyle = {
            width: "65px", height: "65px",
            background: "rgba(254,105,0,.9)",
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
            zIndex: "10000",
        };
        const clusterStyleLg = { ...clusterStyle, width: "75px", height: "75px" };
        estateClusterersByType[type] = new kakao.maps.MarkerClusterer({
            map: map,
            gridSize: 90,
            averageCenter: true,
            minLevel: 5,
            minClusterSize: 1,      // 1개도 클러스터 원으로 표시
            calculator: [1, 10, 50],
            disableClickZoom: true,
            styles: [clusterStyle, clusterStyle, clusterStyleLg, clusterStyleLg],
        });
        initEstateClusterEvent(estateClusterersByType[type]);
    }
    return estateClusterersByType[type];
}

function createEstateClusterer(estateType) {
    const key = estateType || "all";
    if (!estateClusterersByType[key]) {
        const colors = getEstateTypeColors(estateType);
        estateClusterersByType[key] = new kakao.maps.MarkerClusterer({
            map: map,
            averageCenter: true,
            minLevel: 5,
            disableClickZoom: true,
            styles: [{
                width: "50px", height: "50px",
                background: colors.base,
                borderRadius: "25px",
                color: "#fff",
                textAlign: "center",
                fontWeight: "bold",
                lineHeight: "50px",
            }],
        });
        initEstateClusterEvent(estateClusterersByType[key]);
    }
    return estateClusterersByType[key];
}

function createEstateClusteredMarker(data) {
    const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(data.lat, data.lng),
    });
    marker.estate_no   = data.estate_no;
    marker.estate_type = data.estate_type;
    marker.sale_type   = data.sale_type;
    marker.lat         = data.lat;
    marker.lng         = data.lng;
    return marker;
}

function initEstateClusterEvent(clusterer) {
    let singleClickTimer = null;
    kakao.maps.event.addListener(clusterer, "clusterclick", function (cluster) {
        clearTimeout(singleClickTimer);
        singleClickTimer = setTimeout(function () {
            // 패널 닫기 직후 카카오 맵이 동일 클릭을 수신한 경우 무시
            if (window.mapContentClosingLock) return;

            const markers = cluster.getMarkers();
            const estateNos = markers.map(m => m.estate_no);
            // 매물정보 탭이 아니면 전환
            if (!$('#layerTab_estate').hasClass('active')) {
                _switchLayerTab('layer-estate');
            }
            $('.mcs-list dl').hide();
            estateNos.forEach(no => {
                $(`.mcs-list dl[data-estate-no="${no}"]`).delay(100).fadeIn(400);
            });
            // 패널 전체화면 전환 시 mo-memo 닫기 (모바일에서 z-index로 가려지는 문제 방지)
            $(".mo-memo").fadeOut(200, "easeOutQuad");
            $('.map-content').addClass('active');
            $('.map-history').addClass('active');
        }, 250);
    });
    kakao.maps.event.addListener(clusterer, "clusterdblclick", function (cluster) {
        clearTimeout(singleClickTimer);
        const center = cluster.getCenter();
        map.setCenter(center);
        map.setLevel(map.getLevel() - 1);
    });
}

/* =====================================================================
 * 매물 리스트 이벤트
 * ===================================================================== */
function initEstateListEvents() {
    // 리스트 아이템 클릭 → 상세 (sell_v2 동일 패턴)
    $(document).on('click', '.mcs-list dl', function (e) {
        const estateNo = $(this).attr("data-estate-no") || $(this).find('[data-estate-no]').attr("data-estate-no");
        if (!estateNo) return;

        // 상호명 버튼 클릭 → 중개사 매물 필터
        if ($(e.target).closest(".agency-name").length) {
            e.stopPropagation();
            const clickedEl = $(e.target).closest(".agency-name");
            let agencyName = clickedEl.find('.agency-name-text').text().trim();
            if (!agencyName) agencyName = clickedEl.text().replace("상호명:", "").trim();
            estateNewList("", estateNo, agencyName);
            searchAgencyNo = true;
            $(".map-sell-view").removeClass("active");
            return;
        }
        // 비교 체크박스 클릭 → 이벤트 버블링 차단 (change 핸들러에서 처리)
        if ($(e.target).closest('.check-box-orange-s').length) return;

        // updateURL은 replaceState를 사용해 popstate가 발생하지 않으므로 직접 호출
        updateURL({ estateNo });
        estateDetail(estateNo);
    });

    // 비교 체크박스 클릭 버블링 차단
    $(document).on('click', '.mcs-list .check-box-orange-s', function(e) {
        e.stopPropagation();
    });

    // 비교 체크박스 change → compareList 관리
    $(document).on('change', '.mcs-list .check-box-orange-s input[type="checkbox"]', function(e) {

        //if($(window).width() <= 991) {
        //    return; // 모바일에서는 체크박스 클릭 이벤트를 무시합니다.
        //}

        e.stopPropagation();
        const parentDl = $(this).closest('dl');
        if (!parentDl.length) return;
        $(".map-sell-view").removeClass("active");
        const estateNo   = Number(parentDl.data('estate-no'));
        const estateType = parentDl.data('estate-type') || "";  // data-estate-type 원본값 사용
        const saleType   = parentDl.find('h2 .label-default').text().trim();
        const address    = parentDl.find('h2 .ms-md-auto').text().trim();

        if (this.checked) {
            // 최대 3개 제한
            if (compareList.data.length >= 3) {
                $(this).prop('checked', false);
                parentDl.removeClass('dl-highlight-border');
                sweetAlertMessage("비교 매물은 최대 3개까지 선택할 수 있습니다.", "", "w");
                return;
            }
            // 동일 매물 유형(estate type)만 비교 가능
            if (compareList.data.length >= 1) {
                const existingEstateType = compareList.data[0].estateType;
                if (existingEstateType !== estateType) {
                    $(this).prop('checked', false);
                    parentDl.removeClass('dl-highlight-border');
                    sweetAlertMessage("매물 비교는 동일한 매물구분(유형)만 비교할 수 있습니다.", "", "w");
                    return;
                }
            }
            // 중복 방지 (재렌더링 후 이미 목록에 있는 항목 재클릭 시)
            const alreadyExists = compareList.data.some(function (item) { return item.estateNo === estateNo; });
            if (!alreadyExists) {
                compareList.data.push({ estateNo, saleType, estateType, address });
            }
            parentDl.addClass('dl-highlight-border');
        } else {
            compareList.data = compareList.data.filter(item => item.estateNo !== estateNo);
            parentDl.removeClass('dl-highlight-border');
        }
        displayCompareList();
        updateCompareApplyButtonState();
    });

    // 매물상세 닫기
    $(document).on('click', '.msv-close button', function () {
        $('#map_sell_view').removeClass('active');
        updateURL({ estateNo: "" });
    });

    // 중개사 해제 버튼
    $('#agency_reset_btn').on('click', function () {
        searchAgencyNo = false;
        estateNewList();
    });

    // 목록 고정 체크박스: 체크 시 현재 목록 고정 (지도 이동 시 현재 목록 + 새 목록 병합)
    $('#fix_list').on('click', function () {
        list_fixed_chk = $(this).prop('checked');
        if (list_fixed_chk) {
            // 체크 시점의 매물 데이터를 고정
            fixedEstateData = [...lastEstateResponseData];
        } else {
            // 해제 시 고정 데이터 초기화 후 현재 지도 기준으로 리스트 재생성
            fixedEstateData = [];
            estateNewList();
        }
    });

    // ── 매물비교 이벤트 핸들러 ────────────────────────────────

    // 모달 스크롤바 너비 보정
    function adjustScrollbarWidth() {
        const scrollContent = document.querySelector(".modal-body-scroll-content");
        const header = document.querySelector(".modal-body-header");
        const footer = document.querySelector(".modal-body-footer");
        if (scrollContent && header && footer) {
            const scrollbarWidth = scrollContent.offsetWidth - scrollContent.clientWidth;
            header.style.marginRight = `${scrollbarWidth}px`;
            footer.style.marginRight  = `${scrollbarWidth}px`;
        }
    }

    // '매물비교' 버튼
    $("#compare_open_btn").on("click", function () {
        $("#compareModal").fadeIn(function () {
            adjustScrollbarWidth();
            $(window).on('resize.modalScrollbar', adjustScrollbarWidth);
            make_compareList(compareList);
        });
    });

    // '비교매물 삭제' 버튼
    $("#compare_clear_btn").on("click", function () {
        compareList.data.forEach(item => {
            $(`.mcs-list dl[data-estate-no="${item.estateNo}"]`).removeClass('dl-highlight-border');
            $(`.mcs-list dl[data-estate-no="${item.estateNo}"] .check-box-orange-s input[type="checkbox"]`).prop('checked', false);
        });
        compareList.data = [];
        displayCompareList();
    });

    // 모달 닫기 버튼 / 오버레이 클릭
    $(document).on('click', '.compare-close-button, .compare-modal-overlay', function () {
        $("#compareModal").fadeOut(function () {
            $(window).off('resize.modalScrollbar');
        });
    });

    // 매물정보 탭 단위변환 버튼 (ID 중복 방지를 위해 별도 ID 사용)
    $("#estate_toggle_unit_btn").on("click", function () {
        const toggleUnit = currentUnit === "m2"; // m2이면 → 평으로 전환
        // 매물정보탭 버튼 시각 상태 변경
        $("#estate_unit_pyeong").toggleClass("active", toggleUnit);
        $("#estate_unit_m2").toggleClass("active", !toggleUnit);
        // 상단 탭 버튼 시각 상태 동기화
        $("#unit_pyeong").toggleClass("active", toggleUnit);
        $("#unit_m2").toggleClass("active", !toggleUnit);

        currentUnit = toggleUnit ? "pyeong" : "m2";

        // 지도에 표시된 모든 마커 단위 일괄 변환 (실거래가/매물정보)
        if (typeof updateAllMarkerUnits === 'function') {
            updateAllMarkerUnits(currentUnit);
        }

        // 매물 목록 재렌더링 (면적 단위 반영)
        if (layerState.estate && typeof estateNewList === 'function') {
            estateNewList();
        }
    });
}

/* =====================================================================
 * URL 매물번호 감지 → 상세 표시
 * ===================================================================== */
function handleUrlChangeForEstateNo() {
    const urlParams = new URLSearchParams(window.location.search);
    const estateNo  = parseFloat(urlParams.get("estateNo"));
    if (estateNo) {
        estateDetail(estateNo).then((data) => {
            // 매물 상세 로드 후 → 해당 매물 위치로 지도 이동
            if (data && areValidCoordinatesInKorea(data.lat, data.lng)) {
                map.setCenter(new kakao.maps.LatLng(data.lat, data.lng));
                map.setLevel(3); // 줌레벨 3으로 설정
            }
            // 선택 주소 업데이트 (번지 제외)
            if (data && data.address_jibun) {
                $("#click_location").val(cutAfterSuffix(data.address_jibun));
            }
        });
    } else {
        $('#map_sell_view').removeClass('active');
    }
}

async function estateDetail(estateNo) {
    $('#map_sell_view').removeClass('active');
    return callApiAbort("/front/back/sell/estate_detail_v2.php", "POST", { estate_no: estateNo }, "estateDetail")
        .then(async response => {
            if (!response) return null;
            const { statusCode, responseData } = response;
            if (statusCode !== 200) return null;
            await renderEstateDetail(responseData);
            $('#map_sell_view').addClass('active');
            // 매물정보 탭 활성화
            if (layerState.estate && !$('#layerTab_estate').hasClass('active')) {
                _switchLayerTab('layer-estate');
            }
            return responseData; // 호출부에서 좌표 활용 가능하도록 반환
        });
}

/* =====================================================================
 * 매물 이미지 스와이퍼 (sell_v2.js에서 복사 — realPrice_v2 전용)
 * ===================================================================== */
function swiper_image(imageArray) {
    const thumbSelector = $(".sale-thumbnail-slider .swiper-wrapper");
    if (!imageArray || imageArray.length === 0) {
        const defaultHtml = `<div class="swiper-slide"><img src="/front/assets/image/building_empty.png" alt="No Image" class="img-fluid d-block rounded"></div>`;
        thumbSelector.html(defaultHtml).append(defaultHtml);
    } else {
        const imageHtml = imageArray.map((item) => {
            const imgSrc = item.imageToken
                ? `/front/back/00-include/image.php?token=${encodeURIComponent(item.imageToken)}`
                : "/front/assets/image/building_empty.png";
            if (item.fileType === "image") {
                return `<div class="swiper-slide"><a target="_blank" href="${imgSrc}" class="image-popup"><img src="${imgSrc}" alt="Estate Image" class="gallery-img img-fluid mx-auto rounded" onerror="this.onerror=null;this.src='/front/assets/image/building_empty.png';"></a></div>`;
            } else if (item.fileType === "video") {
                return `<div class="swiper-slide"><video controls width="100%" height="100%" class="img-fluid mx-auto rounded h-100" controlslist="nodownload"><source src="${imgSrc}" type="video/mp4">Your browser does not support the video tag.</video></div>`;
            } else {
                return `<div class="swiper-slide"><img src="/front/assets/image/building_empty.png" alt="Estate Image" class="gallery-img img-fluid mx-auto rounded"></div>`;
            }
        }).join("");
        if (imageArray.length === 1) {
            thumbSelector.html(imageHtml).append(imageHtml);
        } else {
            thumbSelector.html(imageHtml);
        }
    }
    new Swiper(".sale-thumbnail-slider", {
        loop: false,
        spaceBetween: 24,
        slidesPerView: 2,
        freeMode: true,
        navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
        watchSlidesProgress: true,
    });
}

async function renderEstateDetail(data) {
    if (!data) return;

    // 1. 이미지 업데이트 (스와이퍼 처리)
    swiper_image(data.imageArray);

    // 2. 매물번호, 매물타입, 거래타입 정보 업데이트
    let sateTypeHtml = "";
    let priceHtml = "";

    switch (data.sale_type) {
        case "매매":
            sateTypeHtml = `<span class="label-default bg-green1">매매</span>`;
            priceHtml = `매매 ${formatPrice(data.sale_price, "all", true)}원`;
            break;
        case "전세":
        case "임대(전세)":
            sateTypeHtml = `<span class="label-default bg-violet1">임대(전세)</span>`;
            priceHtml = `임대(전세) ${formatPrice(data.sale_price, "all", true)}원`;
            break;
        case "월세":
        case "임대(월세)":
            sateTypeHtml = `<span class="label-default bg-indigo1">임대(월세)</span>`;
            priceHtml = `임대(월세) ${formatPrice(data.sale_price, "all", true)}원 / 보증금 ${formatPrice(data.rent_price, "all", true)}원`;
            break;
    }

    let exchange_Html = "";
    if (data.exchange_fg === "Y") {
        exchange_Html = `<span class="label-default bg-blue1">교환가능</span>`;
    }

    let urgent_sale_Html = "";
    if (data.urgent_sale_fg === "Y") {
        urgent_sale_Html = `<span class="label-default bg-red1 blink">급매물</span>`;
    }

    $("#map_sell_view .msv-info dt").html(`${sateTypeHtml} ${data.estate_type} ${exchange_Html} ${urgent_sale_Html}`);
    $("#map_sell_view .msv-info dd .estate-no").text(data.estate_no);
    $("#map_sell_view .msv-info dd .estate-no").attr("data-lat", data.lat);
    $("#map_sell_view .msv-info dd .estate-no").attr("data-lng", data.lng);

    // 3. 가격 정보 업데이트
    $("#map_sell_view .msv-price-option dt").text(priceHtml);

    // 4. 상세 정보 업데이트
    const $detailsContainer = $("#msv_content");
    $detailsContainer.empty();

    const phoneIcon = `
    <svg width="20" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.84 9.85601C7.63075 13.7544 10.8125 16.8438 14.762 18.519L14.774 18.524L15.538 18.864C16.0099 19.0744 16.5399 19.1161 17.0388 18.9818C17.5378 18.8476 17.9753 18.5458 18.278 18.127L19.552 16.364C19.5895 16.3121 19.6056 16.2478 19.597 16.1843C19.5884 16.1209 19.5559 16.0631 19.506 16.023L17.282 14.228C17.2558 14.2068 17.2255 14.1912 17.193 14.182C17.1606 14.1729 17.1266 14.1703 17.0932 14.1746C17.0597 14.1789 17.0275 14.19 16.9984 14.207C16.9694 14.2241 16.944 14.2469 16.924 14.274L16.058 15.442C15.956 15.5798 15.8098 15.6785 15.6439 15.7216C15.4779 15.7647 15.3022 15.7497 15.146 15.679C12.1871 14.3386 9.81644 11.968 8.476 9.00901C8.40531 8.8528 8.39027 8.67709 8.43339 8.51114C8.47652 8.34519 8.5752 8.19903 8.713 8.09701L9.88 7.23001C9.90712 7.20996 9.9299 7.18464 9.94698 7.15557C9.96405 7.12649 9.97507 7.09426 9.97937 7.06082C9.98367 7.02737 9.98115 6.99341 9.97198 6.96096C9.96281 6.92851 9.94717 6.89825 9.926 6.87201L8.132 4.64801C8.09186 4.59814 8.03412 4.56557 7.97067 4.55701C7.90723 4.54845 7.84292 4.56456 7.791 4.60201L6.018 5.88201C5.5964 6.18611 5.2931 6.62682 5.15966 7.12924C5.02622 7.63166 5.07086 8.16478 5.286 8.63801L5.84 9.85601ZM14.17 19.897C9.8791 18.075 6.4226 14.7173 4.477 10.481L4.475 10.479L3.921 9.25901C3.56242 8.47044 3.48791 7.58205 3.71013 6.74477C3.93234 5.9075 4.43758 5.17298 5.14 4.66601L6.913 3.38601C7.27613 3.12393 7.72591 3.01103 8.16976 3.07056C8.61362 3.13009 9.01776 3.35751 9.299 3.70601L11.094 5.93101C11.2421 6.11458 11.3516 6.3262 11.4159 6.55316C11.4802 6.78013 11.4979 7.01774 11.468 7.25172C11.4381 7.4857 11.3612 7.71123 11.242 7.91475C11.1227 8.11826 10.9635 8.29557 10.774 8.43601L10.104 8.93201C11.2368 11.1283 13.0257 12.9172 15.222 14.05L15.719 13.38C15.8594 13.1906 16.0367 13.0316 16.2401 12.9124C16.4436 12.7933 16.669 12.7164 16.9028 12.6865C17.1367 12.6566 17.3742 12.6743 17.601 12.7385C17.8279 12.8027 18.0395 12.912 18.223 13.06L20.448 14.855C20.7968 15.1363 21.0244 15.5406 21.0839 15.9847C21.1434 16.4288 21.0304 16.8788 20.768 17.242L19.494 19.006C18.9897 19.7039 18.2606 20.2071 17.4291 20.4309C16.5977 20.6547 15.7145 20.5855 14.928 20.235L14.17 19.897Z" fill="#525252"></path>
    </svg>`;

    const detailItems = [
        { name: "address_jibun",    title: "소재지(지번)",     value: cutAfterSuffix(data.address_jibun) || "" },
        { name: "address_road",     title: "소재지(도로명)",   value: cutAfterSuffix(data.address_road) || "" },
        { name: "related_jibun",    title: "관련지번",         value: data.related_jibun == "Y" ? "관련지번 있음" : "관련지번 없음" },
        { name: "notes",            title: "참고사항",         value: data.notes || "" },
        { name: "estate_type",      title: "매물구분",         value: data.estate_type || "" },
        { name: "sale_type",        title: "거래종류",         value: data.sale_type || "" },
        { name: "price",            title: "가격",             value: data.sale_type == "매매" || data.sale_type == "전세" ? `${formatPrice(data.sale_price, "all", true)}` : `${formatPrice(data.sale_price, "all", true)} / ${formatPrice(data.rent_price, "all", true)}` },
        { name: "platArea",         title: "토지면적",         value: data.platArea ? formatArea(data.platArea) : "" },
        { name: "archArea",         title: "건축면적",         value: data.archArea ? formatArea(data.archArea) : "" },
        { name: "totArea",          title: "총면적",           value: data.totArea ? formatArea(data.totArea) : "" },
        { name: "lndcgrCodeNm",     title: "지목",             value: data.lndcgrCodeNm || "" },
        { name: "prposAreaNm",      title: "용도지역",         value: data.prposAreaNm || "" },
        { name: "vlRat",            title: "용적률",           value: data.vlRat ? parseFloat(data.vlRat).toFixed(2) + "%" : "" },
        { name: "bcRat",            title: "건폐율",           value: data.bcRat ? parseFloat(data.bcRat).toFixed(2) + "%" : "" },
        { name: "floor",            title: "층수",             value: `지상 ${data.grndFlrCnt || 1} / 지하 ${data.ugrndFlrCnt || 0}` },
        { name: "strctCdNm",        title: "구조",             value: data.strctCdNm || "" },
        { name: "useAprDay",        title: "사용승인일",       value: data.useAprDay || "" },
        { name: "car_parking",      title: "주차 가능 대수",   value: data.car_parking ? data.car_parking + "대" : "" },
        { name: "mainPurpsCdNm",    title: "주용도",           value: data.mainPurpsCdNm || "" },
        { name: "realPurpsNm",      title: "실제 사용용도",    value: data.realPurpsNm || "" },
        { name: "maintenance_price",title: "월 관리비",        value: formatPrice(data.maintenance_price, "all", true) },
        { name: "loan_price",       title: "융자금",           value: formatPrice(data.loan_price, "all", true) },
        { name: "road_conditions",  title: "도로여건",         value: data.road_conditions ? data.road_conditions + "m 도로 접속" : "" },
        { name: "power",            title: "전기",             value: data.power ? data.power + "Kw 이하" : "" },
        { name: "water",            title: "용수",             value: data.water ? (data.water === "waterworks" ? "상수도" : data.water === "underground" ? "지하수" : "") : "" },
        { name: "floor_height",     title: "건물층고",         value: data.floor_height ? data.floor_height + "m" : "" },
        { name: "feature",          title: "특장점",           value: data.feature || "" },
        { name: "description",      title: "상세 설명",        value: data.description || "정보 없음" },
        { name: "register_date",    title: "등록일",           value: `${data.reg_date || ""}&nbsp;${getRegistrationStatus(data.reg_date)}` },
    ];

    const agencyItems = [
        { name: "agency_name",           title: "중개사 상호",      value: data.agency_name ? `<button type="button" class="p-0"><span class="agency-name-text">${data.agency_name}</span></button>` : "" },
        { name: "registered_broker_name",title: "중개사 대표",      value: data.registered_broker_name || "" },
        { name: "broker_address",        title: "중개사 주소",      value: data.broker_address || "" },
        { name: "homepage_url",          title: "중개사 홈페이지",  value: data.homepage_url ? `<a target="_blank" href="${data.homepage_url}" class="btn-default-s bg-main align-content-center">홈페이지 바로가기</a>` : "" },
        { name: "broker_phone",          title: "중개사 전화번호",  value: data.broker_phone ? `${phoneIcon}<a href="tel:${phoneOnDash(data.broker_phone)}">${phoneOnDash(data.broker_phone)}</a>` : "" },
    ];

    $.each(detailItems, function (index, item) {
        $detailsContainer.append(`<dl><dt>${item.title}</dt><dd class="${item.name}">${item.value}</dd></dl>`);
    });
    $detailsContainer.append("<hr>");
    $.each(agencyItems, function (index, item) {
        $detailsContainer.append(`<dl><dt>${item.title}</dt><dd class="${item.name}">${item.value}</dd></dl>`);
    });
}

/* =====================================================================
 * 비교매물 목록 UI 업데이트
 * ===================================================================== */

/**
 * compareList.data 상태를 DOM에 재적용
 * estateNewList() 재렌더링 후 체크박스/테두리 복원용
 */
function reapplyCompareState() {
    if (!compareList || !compareList.data || compareList.data.length === 0) return;
    compareList.data.forEach(function (item) {
        const $dl = $(`.mcs-list dl[data-estate-no="${item.estateNo}"]`).first();
        if ($dl.length) {
            $dl.addClass('dl-highlight-border');
            $dl.find('.check-box-orange-s input[type="checkbox"]').prop('checked', true);
        }
    });
}

function displayCompareList() {
    const $comparedItemsDisplay = $('#comparedItemsDisplay');
    $comparedItemsDisplay.empty();

    if (compareList.data.length === 0) {
        $('#compare_clear_btn').hide();
    } else {
        compareList.data.forEach(function (item) {
            $comparedItemsDisplay.append($('<span>').text(`매물번호: ${item.estateNo},  ${item.estateType}`));
        });
        $('#compare_clear_btn').show();
    }
    updateCompareApplyButtonState();
}

function updateCompareApplyButtonState() {
    const $btn = $('#compare_open_btn');
    if ($btn.length === 0) return;
    if (compareList.data.length >= 2) {
        $btn.prop('disabled', false);
    } else {
        $btn.prop('disabled', true);
    }
}

/* =====================================================================
 * 매물비교 모달 렌더링
 * ===================================================================== */
function truncateEstateType(text) {
    if (!text) return "";
    const maxLength = 4;
    const displayLength = 3;
    if (text.length > maxLength) {
        return text.substring(0, displayLength) + "..";
    }
    return text;
}

let modalHeightObserver = null;

function adjustComparisonModalHeight() {
    const modalContent = document.querySelector('.compare-modal-content');
    const modalBody    = document.querySelector('.compare-modal-body');
    const scrollContent= document.querySelector('.modal-body-scroll-content');
    if (!modalContent || !modalBody || !scrollContent) return;
    modalContent.style.height = '';
    modalContent.style.maxHeight = '';
    modalContent.style.minHeight = '';
    modalBody.style.height = '';
    modalBody.style.flexGrow = '';
    modalBody.style.flexShrink = '';
    scrollContent.style.height = '';
    scrollContent.style.flexGrow = '';
    scrollContent.style.minHeight = '';
    scrollContent.style.flexShrink = '';
    scrollContent.style.overflowY = '';
    requestAnimationFrame(() => {
        const viewportHeight = window.innerHeight;
        modalContent.style.maxHeight = `${viewportHeight * 0.8}px`;
        modalContent.style.minHeight = `400px`;
    });
}

function adjustComparisonModalWidth(compare_length) {
    const modalContent = document.querySelector('.compare-modal-content');
    if (!modalContent) return;
    let newWidth = '600px';
    if (compare_length > 2) {
        newWidth = `${600 + (compare_length - 2) * 250}px`;
    }
    modalContent.style.width = newWidth;
}

async function make_compareList(compareList) {
    if (compareList.data.length < 2 || compareList.data.length > 3) {
        sweetAlertMessage("비교할 매물은 2개 또는 3개여야 합니다.", "", "e");
        $('#compareModal').hide();
        return;
    }
    $('#compareModal .property-value-item').empty();
    $('#compareModal .property-compare').empty();
    $('#compareModal .modal-body-footer .column-right').empty();

    const estateDetailApiUrl = "/front/back/sell/estate_detail_v2.php";
    try {
        const apiCalls = compareList.data.map(item =>
            callApiAbort(estateDetailApiUrl, "POST", { estate_no: item.estateNo }, `estateDetail_${item.estateNo}`)
        );
        const responses = await Promise.all(apiCalls);
        comparisonData = [];
        try {
            for (let i = 0; i < responses.length; i++) {
                const response = responses[i];
                if (response && response.statusCode === 200 && response.message === "SUCCESS") {
                    if (response.responseData) {
                        comparisonData.push(response.responseData);
                    } else {
                        throw new Error(`응답 데이터가 유효하지 않습니다 (매물 #${i + 1})`);
                    }
                } else {
                    sweetAlertMessage(`${i + 1}번째 매물 정보를 불러오지 못했습니다.`, "", "e");
                    $('#compareModal').hide();
                    return;
                }
            }
            renderComparisonTable(comparisonData);
            adjustComparisonModalHeight();
            adjustComparisonModalWidth(comparisonData.length);
        } catch (innerError) {
            console.error("비교 데이터 처리 중 오류:", innerError);
            sweetAlertMessage("매물 상세 정보를 처리하는 중 오류가 발생했습니다.", "", "e");
            $('#compareModal').hide();
        }
    } catch (outerError) {
        sweetAlertMessage("매물 상세 정보를 불러오는 중 오류가 발생했습니다.", "", "e");
        $('#compareModal').hide();
    }
}

function renderComparisonTable(comparisonData) {
    const comparisonFields = [
        { label: "매물 사진",      prop: "imageArray",          type: "image",  compare: "N", formatter: (v, d) => v && v.length > 0 ? `/front/back/00-include/image.php?token=${encodeURIComponent(v[0].imageToken)}` : '/front/assets/image/building_empty.png' },
        { label: "소재지(지번)",   prop: "address_jibun",       type: "text",   compare: "N", formatter: (v) => cutAfterSuffix(v) || "" },
        { label: "소재지(도로명)", prop: "address_road",        type: "text",   compare: "N", formatter: (v) => cutAfterSuffix(v) || "" },
        { label: "관련지번",       prop: "related_jibun",       type: "text",   compare: "N", formatter: (v) => v == "Y" ? "관련지번 있음" : "관련지번 없음" },
        { label: "참고사항",       prop: "notes",               type: "text",   compare: "N", formatter: (v) => v || "" },
        { label: "매물구분",       prop: "estate_type",         type: "text",   compare: "N", formatter: (v) => v || "" },
        { label: "거래종류",       prop: "sale_type",           type: "text",   compare: "N", formatter: (v) => v || "" },
        { label: "가격",           prop: "sale_price",          type: "number", compare: "Y", formatter: (v, d) => d.sale_type == "매매" || d.sale_type == "전세" ? formatPrice(v, "all", true) : `${formatPrice(v, "all", true)} / ${formatPrice(d.rent_price, "all", true)}` },
        { label: "토지면적",       prop: "platArea",            type: "number", compare: "Y", formatter: (v) => v ? formatArea(v) : "" },
        { label: "건축면적",       prop: "archArea",            type: "number", compare: "Y", formatter: (v) => v ? formatArea(v) : "" },
        { label: "총면적",         prop: "totArea",             type: "number", compare: "Y", formatter: (v) => v ? formatArea(v) : "" },
        { label: "지목",           prop: "lndcgrCodeNm",        type: "text",   compare: "N", formatter: (v) => v || "" },
        { label: "용도지역",       prop: "prposAreaNm",         type: "text",   compare: "N", formatter: (v) => v || "" },
        { label: "용적률",         prop: "vlRat",               type: "number", compare: "Y", formatter: (v) => v ? parseFloat(v).toFixed(2) + "%" : "" },
        { label: "건폐율",         prop: "bcRat",               type: "number", compare: "Y", formatter: (v) => v ? parseFloat(v).toFixed(2) + "%" : "" },
        { label: "층수",           prop: "grndFlrCnt",          type: "text",   compare: "N", formatter: (v, d) => `지상 ${v || 1} / 지하 ${d.ugrndFlrCnt || 0}` },
        { label: "구조",           prop: "strctCdNm",           type: "text",   compare: "N", formatter: (v) => v || "" },
        { label: "사용승인일",     prop: "useAprDay",           type: "text",   compare: "N", formatter: (v) => v || "" },
        { label: "주차 가능 대수", prop: "car_parking",         type: "number", compare: "Y", formatter: (v) => v ? v + "대" : "" },
        { label: "주용도",         prop: "mainPurpsCdNm",       type: "text",   compare: "N", formatter: (v) => v || "" },
        { label: "실제 사용용도",  prop: "realPurpsNm",         type: "text",   compare: "N", formatter: (v) => v || "" },
        { label: "월 관리비",      prop: "maintenance_price",   type: "number", compare: "Y", formatter: (v) => formatPrice(v, "all", true) || "" },
        { label: "융자금",         prop: "loan_price",          type: "number", compare: "Y", formatter: (v) => formatPrice(v, "all", true) || "" },
        { label: "도로여건",       prop: "road_conditions",     type: "number", compare: "N", formatter: (v) => v ? v + "m 도로 접속" : "" },
        { label: "전기",           prop: "power",               type: "number", compare: "N", formatter: (v) => v ? v + "Kw 이하" : "" },
        { label: "용수",           prop: "water",               type: "text",   compare: "N", formatter: (v) => v ? (v === "waterworks" ? "상수도" : v === "underground" ? "지하수" : "") : "" },
        { label: "건물층고",       prop: "floor_height",        type: "number", compare: "N", formatter: (v) => v ? v + "m" : "" },
        { label: "특장점",         prop: "feature",             type: "text",   compare: "N", formatter: (v) => v || "" },
        { label: "상세 설명",      prop: "description",         type: "text",   compare: "N", formatter: (v) => v || "정보 없음" },
        { label: "등록일",         prop: "reg_date",            type: "text",   compare: "N", formatter: (v) => v || "" },
    ];

    const saleTypeInfoMap = {
        "전세": { colorClass: "bg-violet1", text: "전세" },
        "매매": { colorClass: "bg-green1",  text: "매매" },
        "월세": { colorClass: "bg-indigo1", text: "월세" },
    };
    const getSaleTypeHtml = (saleType) => {
        const info = saleTypeInfoMap[saleType];
        return info ? `<span class="label-default ${info.colorClass}">${info.text}</span>` : `<span class="label-default">정보 없음</span>`;
    };
    const sateTypeHtmls = comparisonData.map(d => getSaleTypeHtml(d.sale_type));
    const bgColors = ['#e0e9f0', '#f7efdb', '#f7e8c4'];

    // ── Header ──
    const $header = $('#compareModal .modal-body-header');
    $header.empty();
    $header.append('<div class="property-label column-left">선택 매물</div>');
    const $headerValues = $('<div class="property-values column-center"></div>');
    $header.append($headerValues);
    comparisonData.forEach((d, i) => {
        let exchange_Html = d.exchange_fg === "Y" ? `<span class="label-default bg-blue1">교환</span>` : "";
        let urgent_Html   = d.urgent_sale_fg === "Y" ? `<span class="label-default bg-red1 blink">급매</span>` : "";
        const $item = $(`<div class="property-value-item" id="compare_item${i + 1}"></div>`);
        $item.css('background-color', bgColors[i] || '#fff');
        $item.html(`${sateTypeHtmls[i]} ${d.estate_type || ""} (번호:${d.estate_no}) ${exchange_Html} ${urgent_Html}`);
        $headerValues.append($item);
    });

    // ── Scroll Content ──
    const $scroll = $('#compareModal .modal-body-scroll-content');
    $scroll.empty();
    comparisonFields.forEach(function (field) {
        const $row = $('<div class="property-detail-row"></div>');
        $row.append(`<div class="property-label">${field.label}</div>`);
        const $rowValues = $('<div class="property-values column-center"></div>');
        $row.append($rowValues);

        const baseData = comparisonData[0];
        if (!baseData) return;
        const displayBase = field.formatter ? field.formatter(baseData[field.prop], baseData) : (baseData[field.prop] || '-');
        const $baseItem = $('<div class="property-value-item"></div>').css('background-color', bgColors[0]);
        if (field.type === "image") {
            $baseItem.html(`<img src="${displayBase}" alt="${field.label}" style="max-width:100px; height:auto;">`);
        } else {
            $baseItem.append(`<span class="display-value">${displayBase}</span>`);
        }
        $rowValues.append($baseItem);

        for (let i = 1; i < comparisonData.length; i++) {
            const curData = comparisonData[i];
            const displayCur = field.formatter ? field.formatter(curData[field.prop], curData) : (curData[field.prop] || '-');
            const $curItem = $('<div class="property-value-item"></div>').css('background-color', bgColors[i] || '#fff');
            if (field.type === "image") {
                $curItem.html(`<img src="${displayCur}" alt="${field.label}" style="max-width:100px; height:auto;">`);
            } else {
                $curItem.append(`<span class="display-value">${displayCur}</span>`);
            }

            if (field.compare !== "N") {
                let resultText = '', compareClass = '', isDiff = false;
                const v1 = baseData[field.prop], v2 = curData[field.prop];
                if (field.type === "number") {
                    const n1 = Number(v1), n2 = Number(v2);
                    if (!isNaN(n1) && !isNaN(n2) && v1 !== null && v2 !== null) {
                        if (n1 === n2) { resultText = '동일'; }
                        else {
                            isDiff = true;
                            const diff = Math.abs(n1 - n2);
                            let fd = diff;
                            if (field.prop.includes('price'))    fd = formatPrice(diff, "all", true);
                            else if (field.prop.includes('Area')) fd = formatArea(diff);
                            else if (field.prop === "vlRat" || field.prop === "bcRat") fd = diff.toFixed(2) + "%";
                            else if (field.prop === "car_parking") fd = diff + "대";
                            else if (field.prop === "power")       fd = diff + "Kw";
                            else if (field.prop === "floor_height") fd = diff + "m";
                            resultText  = n1 < n2 ? `▲ (${fd})` : `▼ (${fd})`;
                            compareClass = n1 < n2 ? 'compare-up' : 'compare-down';
                        }
                    }
                } else {
                    resultText = (v1 === v2) ? '동일' : '다름';
                    isDiff = (v1 !== v2);
                }
                if (resultText) $curItem.append(`<span class="compare-info ${compareClass}">[ ${resultText} ]</span>`);
                if (isDiff) $curItem.addClass('highlight-difference');
            }
            $rowValues.append($curItem);
        }
        $scroll.append($row);
    });

    // ── Footer (단가) ──
    const calculateUnitPrice = (data) => {
        if (!data) return { pricePerArea: 0, pricePerSqm: 0 };
        const PY = 0.3025;
        const area = data.estate_type === "토지" ? data.platArea : data.totArea;
        const salePrice = data.sale_price > 0 ? data.sale_price : 0;
        const denom = area * PY;
        return {
            pricePerArea: denom > 0 ? salePrice / denom : 0,
            pricePerSqm:  area  > 0 ? salePrice / area  : 0,
        };
    };
    const unitPrices = comparisonData.map(calculateUnitPrice);

    const $footer = $('#compareModal .modal-body-footer');
    $footer.empty();
    $footer.append('<div class="property-label column-left">단가</div>');
    const $footerValues = $('<div class="property-values column-center"></div>');
    $footer.append($footerValues);

    unitPrices.forEach((up, i) => {
        const $fi = $(`<div class="property-value-item price-wrapper" id="compare_unit${i + 1}"></div>`);
        $fi.css('background-color', bgColors[i] || '#fff');
        let html = `<span class="label-default bg-green1">${formatPrice(up.pricePerArea, "all", true)}/평</span> <span class="label-default bg-aqua1">${formatPrice(up.pricePerSqm, "all", true)}/㎡</span>`;
        if (i > 0) {
            const base = unitPrices[0];
            if (base.pricePerArea > 0 && up.pricePerArea > 0 && base.pricePerArea !== up.pricePerArea) {
                const diff = Math.abs(base.pricePerArea - up.pricePerArea);
                const diffSqm = Math.abs(base.pricePerSqm - up.pricePerSqm);
                const dir = base.pricePerArea < up.pricePerArea ? '▲' : '▼';
                const cls = base.pricePerArea < up.pricePerArea ? 'compare-up' : 'compare-down';
                html += `<span class="compare-info ${cls}"> [ ${dir} (${formatPrice(diff, "all", true)}, ${formatPrice(diffSqm, "all", true)}) ]</span>`;
                $fi.addClass('highlight-difference');
            }
        }
        $fi.html(html);
        $footerValues.append($fi);
    });
}

/* =====================================================================
 * 중개사 여부 확인 (매물 등록 버튼 표시)
 * ===================================================================== */
function check_realtor() {
    const mapRegisterGroup = document.querySelector('.map-register-group');
    if (!mapRegisterGroup) return;
    const isRealtor = getCookie("user_role") === "002";
    if (isRealtor) {
        mapRegisterGroup.style.display = '';
        document.body.classList.add('realtor-sale-register-visible');
    } else {
        mapRegisterGroup.style.display = 'none';
        document.body.classList.remove('realtor-sale-register-visible');
    }
    // 버튼 표시 여부가 바뀌면 토글 버튼 위치 재계산
    positionToggleGroup();
}

function gotoSaleRegister() {
    window.location.href = '/front/views/mypage/mypage_sale_registor_v2.html';
}

function detailUpBtn() {
    const target = document.getElementById('msv_content') || document.querySelector('.mcs-list');
    if (target) target.scrollTop = 0;
}
// ===================================================================
// ================== 메모 수정 모달 관련 함수 =======================
// ===================================================================

/** 메모 수정 모달 열기 */
async function openMemoModifyModal(memoData, clientX, clientY) {
    await openMemoFunction(memoData, clientX, clientY, false);
}

/** 메모 모달 공통 함수 */
async function openMemoFunction(memoData, clientX, clientY, isRegisterMode) {
    const modalId = isRegisterMode ? "memoRegisterModal" : "memoModifyModal";
    const htmlFile = isRegisterMode ? "/front/views/memo/memo_register.html" : "/front/views/memo/memo_modify.html";
    const initLogicFunction = isRegisterMode
        ? (typeof initMemoRegisterModalLogic === 'function' ? initMemoRegisterModalLogic : null)
        : (typeof initMemoModifyModalLogic === 'function' ? initMemoModifyModalLogic : null);

    const $modal = $(`#${modalId}`);
    const $modalContent = $modal.find(".modal-content");
    const $modalDialog = $modal.find(".modal-dialog");

    resetModalContainerForMemo(modalId);

    try {
        const htmlContent = await $.ajax({ url: htmlFile, method: "GET", dataType: "html" });
        $modalContent.html(htmlContent);

        const dataKey = isRegisterMode ? "memoData" : "currentMemoDataForEdit";
        $modal.data(dataKey, { ...memoData, clientX: clientX, clientY: clientY });
        $modal.data("modalMode", isRegisterMode ? "register" : "modify");

        $modal.css('transition', 'none');
        $modalDialog.css('transition', 'none');
        $modalContent.css('transition', 'none');

        const memoModalInstance = new bootstrap.Modal($modal[0]);
        memoModalInstance.show();

        if (typeof initLogicFunction === 'function') {
            if (isRegisterMode) {
                await initLogicFunction($modal);
            } else {
                const memoCurrentDataFromModal = $modal.data(dataKey);
                await initLogicFunction(memoCurrentDataFromModal, $modal);
            }
        }

        $modal.one('hidden.bs.modal', function () {
            $(this).addClass('modal-pre-hidden');
        });
    } catch (error) {
        console.error("메모 모달 로드 실패:", error);
        if (typeof sweetAlertMessage === 'function') {
            sweetAlertMessage("모달 화면을 불러오는 데 실패했습니다.", "", "e");
        }
    }
}

/** 메모 모달 컨테이너 초기화 */
function resetModalContainerForMemo(modalId) {
    const $modal = $(`#${modalId}`);
    const $dialog = $modal.find(".modal-dialog");

    if ($dialog.data('ui-draggable')) {
        $dialog.draggable('destroy');
    }

    $modal.removeAttr('style');
    $dialog.removeAttr('style');
    $modal.find(".modal-content").removeAttr('style').empty();
    $modal.find(".modal-header").removeAttr('style');
    $modal.find(".modal-body").removeAttr('style');
    $modal.find(".modal-footer").removeAttr('style');

    $modal.addClass('modal-pre-hidden');
    $modal.removeClass('show');
}

function decisionColor() {
    // 체크박스(#chkOneColor)로 대체됨 — 빈 함수 유지 (하위 호환)
}