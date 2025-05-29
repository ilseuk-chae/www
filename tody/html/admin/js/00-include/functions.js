/* *******************************************************
 * filename : functions.js
 * description : 전체적으로 사용되는 JS
 * date : 2022-03-14
 ******************************************************** */

/* ************************
 * 브라우저를 체크할때 사용하는 함수
 * return browser(브라우저name)
 ************************ */
function detectBrowser() {
    var agent = navigator.userAgent.toLowerCase();
    var browser;

    if (agent.indexOf("msie") > -1 || agent.indexOf("trident") > -1 || agent.indexOf("edge") > -1) {
        browser = "ie";
    } else if (agent.indexOf("firefox") > -1) {
        browser = "firefox";
    } else if (agent.indexOf("opr") > -1) {
        browser = "opera";
    } else if (agent.indexOf("chrome") > -1) {
        browser = "chrome";
    } else if (agent.indexOf("safari") > -1) {
        browser = "safari";
    }

    return browser;
}

/* ************************
 * IE 버전을 체크할때 사용하는 함수
 * return : IE 아닐때 false / IE 일때 9,10,11,"edge"
 ************************ */
function ieVersionCheck() {
    var word;
    var version = "N/A";
    var agent = navigator.userAgent.toLowerCase();
    var name = navigator.appName;

    // IE old version ( IE 10 or Lower )
    if (name == "Microsoft Internet Explorer") word = "msie ";
    else {
        // IE 11
        if (agent.search("trident") > -1) word = "trident/.*rv:";
        // Microsoft Edge
        else if (agent.search("edge/") > -1) word = "edge/";
    }
    var reg = new RegExp(word + "([0-9]{1,})(\\.{0,}[0-9]{0,1})");
    if (reg.exec(agent) != null) version = RegExp.$1 + RegExp.$2;

    if (version != "NaN" && version < 12) {
        return parseInt(version);
    } else if (word === "edge/") {
        return false;
    } else {
        return false;
    }
}

/* ************************
 * OS 체크 함수
 * android/ios 체크할때 사용
 ************************ */
function detectOS() {
    var agent = navigator.userAgent.toLowerCase();
    var osCheck;

    if (agent.indexOf("android") > -1) {
        return "android";
    } else if (agent.indexOf("iphone") > -1 || agent.indexOf("ipad") > -1 || agent.indexOf("ipod") > -1 || agent.indexOf("macintosh") > -1) {
        return "ios";
    } else {
        return "other";
    }

    return osCheck;
}

/* ************************
 * 모바일 체크 함수
 * return : 모바일 true / PC false
 * Ipad Safari userAgent 변경으로 인해 if문 추가 (2020-07-17)
 * Mac Os - Big Sur, Safari(14.0) Macintosh 로 체크되어 mobile로 분류되는 이슈로 가로사이즈 조건문 추가(2021-06-15)
 ************************ */
function isMobile() {
    var UserAgent = navigator.userAgent;
    if (UserAgent.match(/iPhone|iPad|iPad|Android|Windows CE|BlackBerry|Symbian|Windows Phone|webOS|Opera Mini|Opera Mobi|POLARIS|IEMobile|lgtelecom|nokia|SonyEricsson/i) != null || UserAgent.match(/LG|SAMSUNG|Samsung/) != null) {
        return true;
    } else {
        // Ipad Safari Browser
        if (detectIpad()) {
            return true;
        } else {
            return false;
        }
    }
}
function detectIpad() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    // Lying iOS13 iPad
    if (userAgent.match(/Macintosh/i) !== null && getWindowWidth() < 1025) {
        // need to distinguish between Macbook and iPad
        var canvas = document.createElement("canvas");
        if (canvas !== null) {
            var context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (context) {
                var info = context.getExtension("WEBGL_debug_renderer_info");
                if (info) {
                    var renderer = context.getParameter(info.UNMASKED_RENDERER_WEBGL);
                    if (renderer.indexOf("Apple") !== -1) return true;
                }
            }
        }
    }
    return false;
}

/* ************************
 * window 팝업 오픈 함수
 * @param src : "팝업 페이지 주소"
 * @param title : "팝업 페이지 타이틀"
 * @param option : "width=너비, height=높이, left=x축 위치, top=y축 위치, resizable=리사이즈 여부, scrollbars=스크롤바 여부, status=상태 표시줄 여부"
 ************************ */
function winPopupOpen(src, title, option) {
    window.open(src, title, option);
}

/* ************************
 * 브라우저의 가로값, 세로값 측정 함수
 * return 가로값/세로값
 ************************ */
/* 임의의 영역을 만들어 스크롤바 크기 측정 */
function getScrollBarWidth() {
    if ($(document).height() > $(window).height()) {
        $("body").append('<div id="fakescrollbar" style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"></div>');
        fakeScrollBar = $("#fakescrollbar");
        fakeScrollBar.append('<div style="height:100px;">&nbsp;</div>');
        var w1 = fakeScrollBar.find("div").innerWidth();
        fakeScrollBar.css("overflow-y", "scroll");
        var w2 = $("#fakescrollbar").find("div").html("html is required to init new width.").innerWidth();
        fakeScrollBar.remove();
        return w1 - w2;
    }
    return 0;
}
/* 브라우저 가로, 세로크기 측정 */
function getWindowWidth() {
    return $(window).outerWidth() + getScrollBarWidth();
}
function getWindowHeight() {
    return $(window).height();
}

/* ************************
 * 브라우저의 스크롤바의 수직 위치 측정 함수
 * return 스크롤바 위치 값
 ************************ */
function getScrollTop() {
    return $(window).scrollTop();
}

/* ************************
 * 브라우저의 스크롤을 이동시키는 함수
 * @param top : 이동지점
 * @param speed : 이동속도
 ************************ */
function moveScrollTop(top, speed) {
    $("html, body").animate({ scrollTop: top }, speed, "easeInOutExpo");
}

/* ************************
 * object toggleClass 함수
 * @param object : 적용되야할 선택자
 * @param className : toggleClass Name
 ************************ */
/* addClass Active */
function addClassName(object, className) {
    $(object).addClass(className);
}
function removeClassName(object, className) {
    $(object).removeClass(className);
}

/* ************************
 * 갯수체크 함수
 * @param selector : 선택자
 * 1개이상 있으면 return true
 ************************ */
$.exists = function (selector) {
    return $(selector).length > 0;
};

/* ************************
 * magnificPopup Plugin ( 모달팝업갤러리 )
 * jquery.magnific-popup.js 필요
 ************************ */
function magnificPopup(popupGallery) {
    $(popupGallery).magnificPopup({
        delegate: "a",
        type: "image",
        closeOnContentClick: true,
        closeBtnInside: true,
        fixedContentPos: true,
        mainClass: "mfp-with-zoom",
        removalDelay: 500, //delay removal by X to allow out-animation
        callbacks: {
            beforeOpen: function () {
                // just a hack that adds mfp-anim class to markup
                this.st.image.markup = this.st.image.markup.replace("mfp-figure", "mfp-figure mfp-with-anim");
                this.st.mainClass = "mfp-zoom-in"; // this.st.el.attr('data-effect');
            },
        },
        closeOnContentClick: true,
        midClick: true, // allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source.
    });
}

/* ************************
 * mCustomScrollbar Plugin ( 스크롤바 커스텀 )
 * jquery.mCustomScrollbar.concat.min.js 필요
 * @param selector : 선택자
 ************************ */
/* Custom Scrollbar Plugin (x,y) */
function customScrollX(scrollObject) {
    $(scrollObject).mCustomScrollbar({
        axis: "x",
        theme: "dark",
    });
}
function customScrollY(scrollObject) {
    $(scrollObject).mCustomScrollbar({
        axis: "y",
        theme: "dark",
    });
}

/* ************************
 * PHP 주소 Parameter
 * @param strParamName : 가져올 파라미터값
 ************************ */
/* PHP Get Parameter  */
function getParameter(strParamName) {
    var arrResult = null;
    if (strParamName) {
        arrResult = location.search.match(new RegExp("[&?]" + strParamName + "=(.*?)(&|$)"));
    }
    return arrResult && arrResult[1] ? arrResult[1] : null;
}
function toAnchorParameter(anchor) {
    if (getParameter(anchor)) {
        var anchorConTop = $("#" + getParameter(anchor) + "").offset().top;
        var headerHeight = $("#header").height();
        moveScrollTop(anchorConTop - headerHeight, 500);
    }
}

/* ************************
 * 순차적으로 active클래스가 붙는 함수
 * @param activeList : 선택자
 ************************ */
/* Active cycle */
function rollingActive(activeList) {
    $(activeList).each(function (index) {
        $itemList = $(this);
        $item = $itemList.find("li");
        itemLength = $item.length;
        startNum = 0;
        rollingSpeed = $itemList.data("rolling-time");

        function visualTime() {
            if (startNum < itemLength - 1) {
                startNum++;
            } else {
                startNum = 0;
            }
            visualPlay();
        }
        function visualPlay() {
            $item.each(function (id) {
                if (id == startNum) {
                    $(this).addClass("active"); // li에 클래스 붙이기
                } else {
                    $(this).removeClass("active");
                }
            });
        }
        visualPlay();
        visual_timer = setInterval(visualTime, rollingSpeed);
    });
}

/* ************************
 * 스크롤값에 따라 클래스가 붙는 함수
 * @param object : 선택자
 * @param fixedStartTop : 클래스가 붙는 시작되는지점
 * @param className : 붙여야하는 클래스이름
 * getScrollTop() 함수 필요
 ************************ */
/* Fixed Object */
function objectFixed(object, fixedStartTop, className) {
    if (getScrollTop() > fixedStartTop) {
        if (!$(object).hasClass(className)) {
            $(object).addClass(className);
        }
    } else {
        if ($(object).hasClass(className)) {
            $(object).removeClass(className);
        }
    }
}

/* ************************
 * splittingText : 텍스트 Split 함수
 *  @param object : 선택자
 * splittingTextDelay : Split 텍스트 delay
 * @param object : 선택자
 * @param speed : speed 간격
 * @param delay_speed : delay시간
 ************************ */
function splittingText(object) {
    var split_word;
    var splitWordEvent = {
        settings: {
            letters: $(object),
        },
        init: function () {
            split_word = this.settings;
            this.bindEvents();
        },
        bindEvents: function () {
            split_word.letters.html(function (i, el) {
                var word_item = $.trim(el).split("");
                // console.log(word_item);
                return '<em class="char">' + word_item.join('</em><em class="char">') + "</em>";
            });
        },
    };
    splitWordEvent.init();
}
function splittingTextDelay(object, speed, delay_speed) {
    var splitLength = $(object).find(".char").length;
    for (var i = 0; i < splitLength; i++) {
        if ($(object).data("css-property") == "animation") {
            $(object)
                .find(".char")
                .eq(i)
                .css("animation-delay", delay_speed + i * speed + "s");
        } else if ($(object).data("css-property") == "transition") {
            $(object)
                .find(".char")
                .eq(i)
                .css("transition-delay", delay_speed + i * speed + "s");
        }
    }
}

/* ************************
 * object의 offset 체크 함수
 *  @param object : 선택자
 * return : offset.top 값
 ************************ */
function checkOffset(object) {
    return $(object).offset().top;
}

/* ************************
 * 상단에 fixed를 되고있는 object의 높이값 체크 함수
 * return : top-fixed 되고있는 높이의 total값
 ************************ */
function checkFixedHeight() {
    var fixedTotalHeight = null;
    for (var i = 0; i < $(".top-fixed").length; i++) {
        var fixedTotalHeight = fixedTotalHeight + $(".top-fixed").eq(i).outerHeight();
    }
    return fixedTotalHeight;
}

/* ************************
 * event 최적화(requestAnimationFrame)
 ************************ */
function toFit(cb, _ref) {
    var _ref$dismissCondition = _ref.dismissCondition,
        dismissCondition =
            _ref$dismissCondition === void 0
                ? function () {
                      return false;
                  }
                : _ref$dismissCondition,
        _ref$triggerCondition = _ref.triggerCondition,
        triggerCondition =
            _ref$triggerCondition === void 0
                ? function () {
                      return true;
                  }
                : _ref$triggerCondition;

    if (!cb) {
        throw Error("Invalid required arguments");
    }

    var tick = false;
    return function () {
        //  console.log('scroll call')
        if (tick) {
            return;
        }

        tick = true;
        return requestAnimationFrame(function () {
            if (dismissCondition()) {
                tick = false;
                return;
            }

            if (triggerCondition()) {
                //console.log('real call')
                tick = false;
                return cb();
            }
        });
    };
}

/* ************************
 * html Scroll Controls
 * return true( 스크롤막을때 ) / false( 스크롤사용할때 )
 * $.exists 함수 필요
 ************************ */
function htmlScrollControl(toggle) {
    if (toggle) {
        // 스크롤 막을때
        if ($.exists("#fullpage") || $.exists(".fp-responsive")) {
            $.fn.fullpage.setAllowScrolling(false);
            $.fn.fullpage.setKeyboardScrolling(false);
        } else {
            $("html").css({
                "margin-right": getScrollBarWidth(),
                "overflow-y": "hidden",
            });
            if ($("html").is(".smooth-srolling")) {
                smoothScroll_destory();
            }
        }
    } else {
        // 스크롤 다시사용할때
        if ($.exists("#fullpage") || $.exists(".fp-responsive")) {
            $.fn.fullpage.setAllowScrolling(true);
            $.fn.fullpage.setKeyboardScrolling(true);
        } else {
            $("html").css({
                "margin-right": "0",
                "overflow-y": "scroll",
            });
            if ($("html").is(".smooth-srolling")) {
                smoothScroll();
            }
        }
    }
}

/* ************************
 * CSS Variable 100vh Setting
 ************************ */
function set100Vh() {
    document.documentElement.style.setProperty("--full-height", window.innerHeight + "px");
}
// window.addEventListener('resize', set100Vh);

/* ************************
 * 익스플로러 엣지 전환 소스
 * 익스플로러 브라우저 업데이트 안내 팝업
 ************************ */
function convertToEdge() {
    if (/MSIE \d|Trident.*rv:/.test(navigator.userAgent)) {
        window.location = "microsoft-edge:" + window.location;
        setTimeout(function () {
            top.window.open("about:blank", "_self").close();
            top.window.opener = self;
            top.self.close();
        }, 1);
    }
}
function popupUpdateBrowser() {
    var popupBrowser = "";
    popupBrowser += '<article id="browserUpgradePopup">';
    popupBrowser += '<div class="browser-upgrade-popup-dim"></div>';
    popupBrowser += '<div class="browser-upgrade-popup-inner">';
    popupBrowser += '<button class="browser-popup-close-btn" title="close"><i class="xi-close-thin"></i></button>';
    popupBrowser +=
        '<span class="browser-popup-caution-icon"><i class="xi-error-o"></i></span><h2 class="browser-popup-tit"><b>브라우저 업데이트</b> 안내</h2><p class="browser-popup-txt">현재 사용중인 브라우저는 곧 지원이 중단됩니다. <br>원활한 서비스를 제공받기 위해<br><b>보안과 속도가 강화된 브라우저로 업그레이드</b> 하시기 바랍니다.</p>';
    popupBrowser += "</div>";
    popupBrowser += "</article>";
    $("body").append(popupBrowser);
    $(document).on("click", ".browser-popup-close-btn", function () {
        $("#browserUpgradePopup").hide();
        return false;
    });
}

/* ************************
 * smooth Scroll
 * gsap.min.js, ScrollToPlugin.min.js
 ************************ */
// Check Passive Support
function smoothScroll_passive() {
    var supportsPassive = false;
    try {
        document.addEventListener("test", null, {
            get passive() {
                supportsPassive = true;
            },
        });
    } catch (e) {}
    return supportsPassive;
}

// Start smooth Scroll
function smoothScroll() {
    if (isMobile() || detectOS() === "ios") return;
    var $window = $(window);
    if (smoothScroll_passive()) {
        window.addEventListener("wheel", smoothScroll_scrolling, { passive: false });
    } else {
        $window.on("mousewheel DOMMouseScroll", smoothScroll_scrolling);
    }
    $("html").addClass("smooth-srolling");
}

// Scroll Event
function smoothScroll_scrolling(event) {
    event.preventDefault();
    var $window = $(window);
    var scrollTime = 1.5;
    // var scrollDistance = $window.height() / 2.5;
    var delta = 0;
    if (smoothScroll_passive()) {
        var scrollDistance = $window.height() / 2.5;
        delta = event.wheelDelta / 120 || -event.originalEvent.detail / 3;
    } else {
        var scrollDistance = $window.height() / 2.5;
        if (typeof event.originalEvent.deltaY != "undefined") {
            delta = -event.originalEvent.deltaY / 120;
        } else {
            delta = event.originalEvent.wheelDelta / 120 || -event.originalEvent.detail / 3;
        }
    }

    var scrollTop = $window.scrollTop();
    var finalScroll = scrollTop - parseInt(delta * scrollDistance);
    winScrolling = gsap.to($window, scrollTime, {
        scrollTo: { y: finalScroll, autoKill: true },
        ease: Power4.easeOut,
        overwrite: 5,
    });
}

// Destroy smooth Scroll
function smoothScroll_destory(event) {
    if (isMobile() || detectOS() === "ios") return;
    if (smoothScroll_passive()) {
        window.removeEventListener("wheel", smoothScroll_scrolling);
    } else {
        $(window).off("mousewheel DOMMouseScroll", smoothScroll_scrolling);
    }
    gsap.killTweensOf($(window), { scrollTo: true });
}

/**
 * 서버로부터 Ajax 요청을 통해 데이터를 받아오는 함수
 * 버전 : 0.1
 * 작성일 : 2023-09-08
 * 작성자 : IT7
 * @param {string} type - HTTP 요청 타입 (예: "GET", "POST", "PUT", "DELETE")
 * @param {string} url 요청할 URL
 * @param {Object} [dataObj={}] - 요청에 사용할 데이터 객체
 * @param {string} [loading] - 로딩 상태 표시 여부
 * @returns {json} 서버로부터 받은 응답
 */
function callApi(type, url, dataObj = {}, loading) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type,
            url,
            data: dataObj,
            dataType: "json",
            beforeSend: function (xhr) {
                if (loading !== "noLoading") {
                    // 로딩
                    sessionStorage.setItem("data-preloader", "disable");
                } else {
                    sessionStorage.setItem("data-preloader", "enable");
                }
                
            },
            success: (result) => {
                resolve(result);
            },
            error: async (xhr, status, error) => {
                // console.log(xhr);
                // console.log(status);
                // console.log(error);
                console.error("API 호출 에러 발생:", { xhr, status, error }); // 에러 상세 로그 출력

                // ----------------------------------------------------
                // *** 문제의 원인 해결: responseJSON이 있는지 먼저 확인 ***
                // ----------------------------------------------------
                const responseJSON = xhr.responseJSON; // responseJSON 값을 변수에 할당
                //const { responseJSON } = xhr;
                // responseJSON이 유효한 객체인지 확인
                if (responseJSON && typeof responseJSON === 'object') {
                    const { message, statusCode } = responseJSON; // 이제 안전하게 비구조화 할당
                    // Status Code가 200, 300번 대가 아닐 경우 메시지를 띄운다.
                    const isStatusOk = String(statusCode).startsWith("2") || String(statusCode).startsWith("3");

                    if (!isStatusOk) {
                        const langCode = localStorage.getItem("langCode") ?? "KR"; // langCode는 error 블록 전체에서 필요할 수 있으므로 이 위치에 두었습니다.
                        switch (statusCode) {
                            case 401:
                                // auth failed
                                // sweetAlertMessage("로그인 정보가 일치하지 않습니다1.", "", "e");
                                const alert = await sweetAlertForReturn("로그인 정보가 일치하지 않습니다.", "", "e");
                                if (alert) {
                                    location.href = "/admin/index.html";
                                }
                                break;   // case 401 처리 후 break 필요
                            case 409:
                                // 중복
                                sweetAlertMessage("중복된 항목입니다.", "", "e");
                                break;
                            default:
                                // 서버에서 받은 message를 사용
                                // alert(lngJson[langCode]["messages"][message]);
                                sweetAlertMessage(message || "알 수 없는 오류가 발생했습니다.", "", "e"); // message가 없을 경우 기본 메시지 사용
                                //sweetAlertMessage(message, "", "e");
                                break;
                        }
                        // 오류 발생 시 false를 반환하거나, responseJSON 전체를 반환할지 결정해야 합니다.
                        // 원래 코드에서는 isStatusOk가 아닐 때 resolve(false)를 호출하고,
                        // 이후에 resolve(responseJSON)을 호출하는 이중 resolve 문제가 있었습니다.
                        // 오류 상황에서는 reject를 사용하거나, resolve(false) 또는 특정 오류 객체를 반환하는 것이 일반적입니다.
                        // 여기서는 오류 발생 시 resolve(false)를 반환하도록 수정합니다.
                        resolve(false);
                    } else {
                        // 서버 응답의 statusCode가 2xx 또는 3xx 이지만 error 콜백으로 들어온 경우
                        // (예: 서버에서 Content-Type을 잘못 보내거나, jQuery 버전 문제 등)
                        // 이 경우 responseJSON이 있더라도 success로 처리되지 않았으므로
                        // responseJSON 자체를 반환하거나, 상황에 맞는 처리가 필요합니다.
                        console.warn("statusCode는 정상이지만 error 콜백으로 진입함:", { statusCode, responseJSON });
                        resolve(responseJSON); // responseJSON을 그대로 반환
                    }

                //resolve(responseJSON);
                } else {
                    // ----------------------------------------------------
                    // *** responseJSON이 없거나 유효하지 않은 경우 처리 ***
                    // (TypeError의 원인)
                    // ----------------------------------------------------
                    console.error("API 응답이 JSON 형식이 아니거나 파싱할 수 없습니다.", xhr.responseText); // 원본 응답 텍스트 로그 출력

                    // 기본 오류 메시지 설정
                    let errorMessage = "서버와 통신 중 알 수 없는 오류가 발생했습니다.";
                    const httpStatus = xhr.status; // HTTP 상태 코드 가져오기
                    const httpStatusText = xhr.statusText || error; // HTTP 상태 텍스트 가져오기

                    if (httpStatus === 0) {
                        // 네트워크 오류, 서버 응답 없음 등
                        errorMessage = "네트워크 연결 상태를 확인하거나 서버 응답을 기다려 주세요.";
                    } else if (httpStatus === 404) {
                        errorMessage = "요청한 페이지를 찾을 수 없습니다 (404 Not Found).";
                    } else if (httpStatus === 500) {
                        errorMessage = "서버 내부 오류가 발생했습니다 (500 Internal Server Error).";
                    } else if (httpStatusText) {
                        errorMessage = `오류 발생: ${httpStatus} ${httpStatusText}`;
                    }

                    // 사용자에게 오류 메시지 표시
                    // alert(lngJson[langCode]["messages"]["common_error"]); // lngJson 객체 필요
                    sweetAlertMessage(errorMessage, "", "e"); // 구체적인 오류 메시지 사용

                    // 이 경우도 호출한 곳에서 오류로 처리해야 하므로 false나 특정 오류 객체 반환
                    resolve(false); // 또는 reject(new Error(errorMessage)); 를 사용하여 Promise를 reject 시킬 수 있습니다.
                }
            },
            complete: function (xhr, status) {
                sessionStorage.setItem("data-preloader", "disable");
            },
        });
    });
}

// 이벤트별 요청을 관리하는 객체
let eventRequests = {};
/**
 * API 호출 하는 공통 함수(AbortRequest)
 * @param {string} url - API URL
 * @param {string} method - HTTP 메서드 (GET, POST, etc.)
 * @param {Object} data - 요청에 포함될 데이터
 * @param {string} eventKey - 요청을 식별하기 위한 키
 * @returns {Promise<Object|null>} - API 응답 데이터 또는 null
 */
function callApiAbort(url, method, data, eventKey) {
    // 동일한 이벤트의 이전 요청이 있으면 취소합니다
    if (eventRequests[eventKey] && eventRequests[eventKey].xhr) {
        // 기존 요청이 있으면 취소
        eventRequests[eventKey].xhr.abort();
        eventRequests[eventKey].status = "aborted"; // 상태를 'aborted'로 업데이트
        delete eventRequests[eventKey].xhr;
    }

    return new Promise((resolve, reject) => {
        // GET 요청의 경우, 데이터 쿼리 스트링으로 변환
        if (method === "GET" && data) {
            url += "?" + $.param(data);
            data = null;
        }

        // 요청의 상태를 기록 (대기 중)
        eventRequests[eventKey] = { status: "pending", xhr: null };

        // 새로운 요청을 생성합니다
        const ajaxRequest = $.ajax({
            url: url,
            type: method,
            data: method === "GET" ? null : data,
            dataType: "json",
            beforeSend: function (jqXHR) {
                // 요청을 객체에 저장
                eventRequests[eventKey].xhr = jqXHR;
                // console.log(`Starting new request for event: ${eventKey}`);
            },
            success: function (response) {
                resolve(response);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // console.log(jqXHR);
                // console.log(textStatus);
                // console.log(errorThrown);

                if (textStatus === "abort") {
                    console.log("Request was aborted");
                } else {
                    //console.error("API 호출 에러 발생", textStatus, errorThrown);
                    // reject(errorThrown);
                }

                // const { message, statusCode } = responseJSON;

                resolve(jqXHR.responseJSON);
            },
            complete: function () {
                // 어떤 요청이 중간에 취소되거나 새로운 요청이 같은 eventKey로 발행되었을 경우, 이전 요청이 complete 상태가 되더라도 그 요청이 이미 삭제되었는지 확인
                if (eventRequests[eventKey] && eventRequests[eventKey].xhr === ajaxRequest) {
                    // 요청이 완료되면 상태를 완료로 업데이트하고, xhr 객체는 삭제
                    eventRequests[eventKey].status = "completed";
                    delete eventRequests[eventKey].xhr;
                }
            },
        });
    });
}

/**
 * 서버로부터 Ajax 요청을 통해 데이터를 받아오는 함수
 * 버전 : 0.1
 * 작성자 : IT7
 * @param {string} type - HTTP 요청 타입 (예: "GET", "POST", "PUT", "DELETE")
 * @param {string} url 요청할 URL
 * @param {FormData|Object} [dataObj={}] - 요청에 사용할 데이터 객체
 * @param {string} [loading] - 로딩 상태 표시 여부
 * @returns {Promise} 서버로부터 받은 응답을 Promise로 반환
 */
function callApiFormData(type, url, dataObj = {}, loading) {
    return new Promise((resolve, reject) => {
        const isFormData = dataObj instanceof FormData;

        $.ajax({
            type,
            url,
            data: dataObj,
            contentType: isFormData ? false : "application/x-www-form-urlencoded; charset=UTF-8",
            processData: !isFormData,
            dataType: "json",
            beforeSend: function (xhr) {
                if (loading !== "noLoading") {
                    // 로딩
                    sessionStorage.setItem("data-preloader", "disable");
                } else {
                    sessionStorage.setItem("data-preloader", "enable");
                }
            },
            success: (result) => {
                resolve(result);
            },
            error: async (xhr, status, error) => {
                const { responseJSON } = xhr;
                const { message, statusCode } = responseJSON;
                const langCode = localStorage.getItem("langCode") ?? "KR";

                // Status Code가 200, 300번 대가 아닐 경우 메시지를 띄운다.
                const isStatusOk = String(statusCode).startsWith("2") || String(statusCode).startsWith("3");

                if (!isStatusOk) {
                    switch (statusCode) {
                        case 401:
                            const alert = await sweetAlertForReturn("로그인 정보가 일치하지 않습니다.", "", "e");
                            if (alert) {
                                location.href = "/admin/index.html";
                            }
                            break;
                        default:
                            if (statusCode.toString().startsWith("4")) {
                                // 4로 시작하는 경우, message를 표시
                                sweetAlertMessage(message, "", "e");
                            } else {
                                // 그 외의 경우에는 기본 메시지를 표시
                                sweetAlertMessage("문제가 발생했습니다.", "", "e");
                            }
                            break;
                    }

                    resolve(false);
                }

                resolve(responseJSON);
            },
            complete: function (xhr, status) {
                sessionStorage.setItem("data-preloader", "disable");
            },
        });
    });
}

/**
 * 쿠기를 저장하는 함수
 * 버전 : 0.2
 * 작성일 : 2023-12-05
 * 작성자 : IT7
 * @param {string} key
 * @param {string} value
 * @param {number} exp
 */
function setCookie(key, value, exp) {
    const date = new Date();
    // exp 값이 없거나 undefined인 경우 아주 미래의 날짜로 설정
    if (typeof exp === "undefined") {
        date.setTime(date.getTime() + 100 * 365 * 24 * 60 * 60 * 1000); // 100년 후
    } else {
        date.setTime(date.getTime() + exp * 24 * 60 * 60 * 1000);
    }
    document.cookie = key + "=" + value + ";expires=" + date.toUTCString() + ";path=/";
}

/**
 * 쿠기를 가져오는 함수
 * 버전 : 0.1
 * 작성일 : 2023-09-14
 * 작성자 : IT7
 * @param {string} key
 */
function getCookie(key) {
    const cookies = document.cookie.split(";");
    const cookie = cookies.find((cookie) => cookie.includes(key));
    if (cookie) {
        const cookieValue = cookie.split("=")[1];
        return cookieValue;
    } else {
        return null;
    }
}

/**
 * 특정 이름의 쿠키를 제거하는 함수
 * @param {string} name - 제거할 쿠키의 이름
 */
function deleteCookie(name) {
    // 현재 날짜와 시간을 가져옵니다.
    const date = new Date();
    // 쿠키의 유효기간을 과거로 설정합니다.
    date.setTime(date.getTime() - 1000 * 60 * 60 * 24);
    // 쿠키의 만료일자를 과거로 설정하여 쿠키를 제거합니다.
    const expires = "expires=" + date.toUTCString();
    // 쿠키를 설정합니다.
    document.cookie = name + "=; " + expires + "; path=/";
}

/**
 * 현재 페이지의 모든 쿠키를 삭제하는 함수
 */
function deleteAllCookies() {
    // 현재 페이지에서 설정된 모든 쿠키를 가져옵니다.
    const cookies = document.cookie.split(";");

    // 각 쿠키를 순회하면서 삭제합니다.
    cookies.forEach((cookie) => {
        // 쿠키의 이름을 추출합니다.
        const cookieName = cookie.split("=")[0].trim();
        // 쿠키를 삭제합니다.
        document.cookie = cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    });
}

/**
 * textarea 높이 자동조절 해주는 함수
 * @param {*} textarea
 */
function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}

/**
 * 특정 url에서 특정 parameter 값 가져오는 함수
 * @param {*} name = parameter 이름
 * @param {*} url = url
 * @returns
 */
function getUrlParameter(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * sweetalert alert창 함수 (retur 없음)
 * @param {*} title = 제목
 * @param {*} text = 내용
 * @param {*} icon = q: question, e: error, w: warning, s: success
 * @returns
 */
function sweetAlertMessage(title, text, icon) {
    return new Promise((resolve, reject) => {
        if (icon == "q") icon = "question";
        else if (icon == "e") icon = "error";
        else if (icon == "w") icon = "warning";
        else if (icon == "s") icon = "success";

        Swal.fire({
            title: title,
            html: text,
            icon: icon,
            confirmButtonText: "확   인",
        }).then((result) => {
            resolve(result);
        });
    });
}

/**
 * sweetalert alert창 함수 (return 있음)
 * @param {*} title = 제목
 * @param {*} text = 내용
 * @param {*} icon = q: question, e: error, w: warning, s: success
 * @returns
 */
async function sweetAlertForReturn(title, text, icon) {
    return new Promise((resolve, reject) => {
        if (icon == "q") icon = "question";
        else if (icon == "e") icon = "error";
        else if (icon == "w") icon = "warning";
        else if (icon == "s") icon = "success";

        Swal.fire({
            title: title,
            html: text,
            icon: icon,
            confirmButtonText: "확   인",
        }).then((result) => {
            if (result.isConfirmed) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

/**
 * sweetalert confirm창 함수
 * @param {*} title = 제목
 * @param {*} text = 내용
 * @param {*} icon = q: question, e: error, w: warning, s: success
 * @returns
 */
async function sweetConfirm(title, text, icon) {
    return new Promise((resolve, reject) => {
        if (icon == "q") icon = "question";
        else if (icon == "e") icon = "error";
        else if (icon == "w") icon = "warning";
        else if (icon == "s") icon = "success";

        Swal.fire({
            title: title,
            html: text,
            icon: icon,
            showCancelButton: true,
            confirmButtonText: "확인",
            cancelButtonText: "닫기",
        }).then((result) => {
            if (result.isConfirmed) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

/**
 * File 선택 시, label의 텍스트를 파일 이름으로 변경시키는 함수
 * @param {*} inputId = input file의 id
 * @param {*} labelSelector = label의 selector
 * 사용법 : uploadLabel("#file_id", "label[for="file_id"]");
 */
function uploadLabel(inputId, labelSelector) {
    $(document).on("change", inputId, function () {
        var fileName = $(this).val().split("\\").pop();
        if (fileName) {
            $(labelSelector).text(fileName);
        } else {
            $(labelSelector).text("선택된 파일"); // 파일이 선택되지 않았을 때 기본 텍스트로 설정
        }
    });
}

/**
 * 주어진 ID 배열을 사용하여 해당 ID를 가진 요소들을 선택하는 함수
 * @param {Array} idArray - ID 문자열 배열
 * @returns {Object} 선택된 요소들을 포함하는 객체
 */
function selectElementsById(idArray) {
    const elements = {};
    idArray.forEach((id) => {
        const element = $(`#${id}`);
        if (element.length) {
            elements[id] = element;
        }
    });
    return elements;
}

/**
 * 데이터 Key값을 배열로 받아서, 해당 배열의 Key값들로 된 id에서 데이터를 추출하여 객체로 반환하는 함수
 * 버전 : 0.1
 * 작성일 : 2023-09-11
 * 작성자 : IT7
 * @param {array} idArray 데이터를 추출할 id 배열
 * @returns {object} 추출한 데이터 객체
 */
function extractDataObject(idArray) {
    const extractedData = {};

    idArray.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            extractedData[id] = element.value;
        }
    });

    return extractedData;
}

/**
 * JSON의 key값을 id로 가지는 엘리먼트에 value를 바인딩하는 함수
 * 엘리먼트가 img 태그면, src 속성에 value를 바인딩한다.
 * 버전 : 0.1
 * 작성일 : 2023-09-11
 * 작성자 : IT7
 * @param {object} dataJson JSON 데이터 객체
 */
function bindJsonData(dataJson) {
    const keys = Object.keys(dataJson);
    for (const key of keys) {
        const element = document.getElementById(key);
        // 요소가 없으면 다음으로 넘어간다.
        if (!element) continue;

        // 이미지일 경우, src 속성에 value를 바인딩한다.
        // 바인딩할 src가 없을 경우, default 이미지(/assets/images/no-image.png)를 바인딩한다.
        if (element.tagName === "IMG") {
            element.src = dataJson[key] ?? "/assets/images/no-image.png";
        } else if (element.tagName === "SPAN" || element.tagName === "P") {
            element.textContent = dataJson[key];
        } else if (element.tagName === "SELECT" && element.classList.contains("choices__input")) {
            // Choices.js가 사용된 select 요소일 경우, Choices 인스턴스를 사용해 값 설정
            const choicesInstance = element.choices;
            if (choicesInstance) {
                choicesInstance.setChoiceByValue(dataJson[key]);
            }
        } else {
            element.value = dataJson[key];
        }
    }

    return true;
}

/**
 * Element의 ID들을 배열로 받아, ID를 Key 값으로, Element의 value를 Value 값으로 하는 JSON 객체를 반환하는 함수
 * Element가 img 태그면, src 속성의 값을 반환한다.
 * 버전 : 0.1
 * 작성일 : 2023-09-13
 * 작성자 : IT7
 * @param {array} idArray Element의 ID 배열
 * @returns {object} Element의 ID를 Key 값으로, Element의 value를 Value 값으로 하는 JSON 객체
 */
function getElementValues(idArray) {
    const dataObj = {};

    idArray.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === "IMG") {
                dataObj[id] = base64ToBlob(element.src);
            } else {
                dataObj[id] = element.value;
            }
        }
    });

    return dataObj;
}

/**
 * 파라미터로 받은 파일을 임시 경로로 파일 업로드 하는 함수
 * 버전 : 0.1
 * 작성일 : 2023-10-26
 * 작성자 : IT7
 * @param {file} file 파일
 */
function uploadTempFile(file) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("uploadFile", file);
        $.ajax({
            type: "post",
            enctype: "multipart/form-data",
            url: "/back-end/00-include/uploadTempImage.php",
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                resolve(data);
            },
            error: function (err) {
                console.error("Err :: " + err);
            },
        });
    });
}

/**
 * 파라미터로 받은 파일들을 임시 경로로 파일 업로드 하는 함수
 * 버전 : 0.1
 * 작성일 : 2023-10-26
 * 작성자 : IT7
 * @param {file} file 파일
 */
function uploadMultipleTempFile(files) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        for (const file of files) {
            formData.append("uploadFile[]", file);
        }
        $.ajax({
            type: "post",
            enctype: "multipart/form-data",
            url: "/back-end/00-include/uploadMultipleTempImage.php",
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                resolve(data);
            },
            error: function (err) {
                console.error("Err :: " + err);
            },
        });
    });
}

/**
 * 파라미터로 받은 파일들을 파일 업로드 하는 함수
 * 버전 : 0.1
 * 작성일 : 2023-11-14
 * 작성자 : IT7
 * @param {file} file 파일
 */
function uploadMultipleFile(files) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        for (const file of files) {
            formData.append("uploadFile[]", file);
        }
        $.ajax({
            type: "post",
            enctype: "multipart/form-data",
            url: "/back-end/00-include/uploadMultipleImage.php",
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                resolve(data);
            },
            error: function (err) {
                console.error("Err :: " + err);
            },
        });
    });
}

/**
 * 파일 박스의 파일을 파라미터로 받아, Base64로 변환하는 함수
 * 버전 : 0.1
 * 작성일 : 2023-09-13
 * 작성자 : IT7
 * @param {File} file 파일 박스의 파일
 * @returns {string} Base64로 변환된 파일
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function () {
            const base64 = reader.result;
            resolve(base64);
        };
    });
}

/**
 * daum 주소 api 실행 및 바인딩 함수
 */
function openDaumPostcode() {
    new daum.Postcode({
        oncomplete: function (data) {
            $("input[name='postal_code']").val(data.zonecode);
            $("input[name='address_primary']").val(data.address);
            $("input[name='sigungu']").val(data.sigungu);
            $("input[name='sido']").val(data.sido);
            $("input[name='sigungu_code']").val(data.sigunguCode);
            $("input[name='dong_code']").val(data.bcode);
            $("input[name='dong']").val(data.bname);
            $("input[name='address_detail']").focus();
        },
    }).open();
}

/**
 */
/**
 * choices.js init
 * @param {*} id
 */
function initializeChoices(id = null) {
    var elements = id ? [document.getElementById(id)] : document.querySelectorAll("[data-choices]");
    var choicesInstances = [];

    Array.from(elements).forEach(function (element) {
        if (!element) return;

        var config = {};
        var attributes = element.attributes;

        Array.from(attributes).forEach(function (attribute) {
            switch (attribute.name) {
                case "data-choices-groups":
                    config.placeholderValue = "This is a placeholder set in the config";
                    break;
                case "data-choices-search-false":
                    config.searchEnabled = false;
                    break;
                case "data-choices-search-true":
                    config.searchEnabled = true;
                    break;
                case "data-choices-removeItem":
                    config.removeItemButton = true;
                    break;
                case "data-choices-sorting-false":
                    config.shouldSort = false;
                    break;
                case "data-choices-sorting-true":
                    config.shouldSort = true;
                    break;
                case "data-choices-multiple-remove":
                    config.removeItemButton = true;
                    break;
                case "data-choices-limit":
                    config.maxItemCount = attribute.value;
                    break;
                case "data-choices-editItem-true":
                    config.editItems = true;
                    break;
                case "data-choices-editItem-false":
                    config.editItems = false;
                    break;
                case "data-choices-text-unique-true":
                    config.duplicateItemsAllowed = false;
                    break;
                case "data-choices-text-disabled-true":
                    config.addItems = false;
                    break;
            }
        });

        // 기존 Choices 인스턴스가 있는지 확인하고 파괴
        if (element.choices) {
            element.choices.destroy();
        }

        // 새로운 Choices 인스턴스 생성 및 저장
        element.choices = new Choices(element, config);

        if (attributes["data-choices-text-disabled-true"]) {
            element.choices.disable();
        }

        choicesInstances.push(element.choices);
    });

    // id가 있을 경우 해당 Choices 인스턴스 반환
    if (id) {
        return choicesInstances[0];
    } else {
        // return choicesInstances;
    }
}

/**
 * 숫자 또는 문자열을 받아서, 3자리마다 콤마를 찍어서 반환하는 함수
 * 버전 : 0.1
 * 작성일 : 2023-09-12
 * 작성자 : IT7
 * @param {string|number} str
 * @returns {string} 3자리마다 콤마가 찍힌 문자열
 */
function comma(str) {
    str = String(str);
    if (!str || str == "null") return "";

    const parts = str.split(".");
    const wholeNumber = parts[0];
    const decimal = parts[1] || "";

    const formattedWholeNumber = wholeNumber.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, "$1,");

    return decimal.length > 0 ? formattedWholeNumber + "." + decimal : formattedWholeNumber;
}

/**
 * 콤마 처리 되어 있는 문자열을 받아서, 콤마를 해제하여 반환하는 함수
 * 버전 : 0.1
 * 작성일 : 2023-09-12
 * 작성자 : IT7
 * @param {string|number} str
 * @returns {string} 콤마가 해제된 문자열
 */
function uncomma(str) {
    str = String(str);
    return str.replace(/[^\d]+/g, "");
}

/*
 * 숫자를 문자열로 변환하고 천 단위 구분자를 추가하는 함수
 */
function priceToString(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 전화번호에 - 붙이는 함수
const phoneOnDash = (str) => {
    if (typeof str !== "string") return "";
    str = str.replace(/[^0-9]/g, "");
    // 최대 길이를 11로 제한
    if (str.length > 11) {
        str = str.slice(0, 11);
    }

    if (str.indexOf("82") === 0) {
        return str.replace(/(^82)(2|\d{2})(\d+)?(\d{4})$/, "+$1-$2-$3-$4"); // +82
    } else if (str.indexOf("1") === 0) {
        return str.replace(/(^1\d{3})(\d{4})$/, "$1-$2"); // 1588, 1566, 1677, ...
    }
    return str.replace(/(^02|^0504|^0505|^0\d{2})(\d+)?(\d{4})$/, "$1-$2-$3"); // 02/0504/0505/010/011/031
};

/*
 * 가격을 억, 만 단위 구분하는 함수
 */
function formatPrice(price) {
    // 가격(억, 만 구분)
    const price_rest = priceToString(price % 10000); // 만 단위의 돈에서 나머지 (만 원)
    const price_share = priceToString(Math.floor(price / 10000)); // 만 단위의 돈에서 몫 (억 원)
    // 만 단위와 억 단위가 모두 0이면 빈 문자열 반환
    if (price_share === "0" && price_rest === "0") {
        return "";
    }

    // 억 단위만 출력
    if (price_share !== "0" && price_rest === "0") {
        return `${price_share}억`;
    }

    // 만 단위만 출력
    if (price_share === "0" && price_rest !== "0") {
        return `${price_rest}만`;
    }

    // 억 단위와 만 단위 모두 출력
    return `${price_share}억 ${price_rest}만`;
}

/**
 * 면적 m2 -> 평 변환 후 바인딩 함수
 * @param {*} rcvValue
 */
function convertToPyeong(rcvValue) {
    const pyeongValue = (rcvValue / 3.3058).toFixed(1);
    return pyeongValue;
}

/**
 * 면적 평 -> m2 변환 후 바인딩 함수
 * @param {*} rcvValue
 */
function convertToM2(rcvValue) {
    const squareMeterValue = (rcvValue * 3.3058).toFixed(1);
    return squareMeterValue;
}
/**
 * noUiSlider.js 에서 슬라이더 상단에 툴팁을 넣는 함수
 * @param {*} e - noUiSlider 슬라이더 요소
 * @param {*} c - 툴팁을 병합하는 거리 기준 (숫자)
 * @param {*} m - 툴팁 사이의 구분자 (문자열)
 */
function mergeTooltips(e, c, m) {
    // 슬라이더의 방향 및 옵션을 가져옴
    var u = "rtl" === getComputedStyle(e).direction, // 슬라이더의 텍스트 방향이 오른쪽에서 왼쪽인지 확인
        S = "rtl" === e.noUiSlider.options.direction, // 슬라이더의 방향 옵션이 오른쪽에서 왼쪽인지 확인
        g = "vertical" === e.noUiSlider.options.orientation, // 슬라이더의 방향 옵션이 수직인지 확인
        p = e.noUiSlider.getTooltips(), // 슬라이더의 툴팁 요소들을 가져옴
        t = e.noUiSlider.getOrigins(); // 슬라이더의 핸들 요소들을 가져옴

    // 모든 툴팁 요소를 해당 핸들 요소에 붙임
    Array.from(p).forEach(function (e, i) {
        e && t[i].appendChild(e);
    });

    // 슬라이더의 'update' 이벤트에 대한 리스너 추가
    e &&
        e.noUiSlider.on("update", function (e, i, t, n, l) {
            var r = [[]], // 툴팁 인덱스 그룹 배열
                a = [[]], // 툴팁 값 그룹 배열
                s = [[]], // 슬라이더 값 그룹 배열
                o = 0; // 그룹 인덱스

            // 첫 번째 툴팁 초기화
            p[0] && ((r[0][0] = 0), (a[0][0] = l[0]), (s[0][0] = e[0]));

            // 각 핸들에 대해 툴팁 병합 기준을 적용
            for (var d = 1; d < l.length; d++) {
                (!p[d] || l[d] - l[d - 1] > c) && ((r[++o] = []), (s[o] = []), (a[o] = []));
                p[d] && (r[o].push(d), s[o].push(e[d]), a[o].push(l[d]));
            }

            // 각 툴팁 그룹에 대해 병합 및 위치 조정
            Array.from(r).forEach(function (e, i) {
                for (var t = e.length, n = 0; n < t; n++) {
                    var l,
                        r,
                        o,
                        d = e[n];

                    if (n === t - 1) {
                        // 그룹의 마지막 툴팁 처리
                        // 그룹 툴팁 위치 및 내용 계산
                        o = 0;
                        Array.from(a[i]).forEach(function (e) {
                            o += 1e3 - e;
                        });
                        l = g ? "bottom" : "right";
                        r = 1e3 - a[i][S ? 0 : t - 1];
                        o = (u && !g ? 100 : 0) + o / t - r;

                        // 툴팁 내용 설정 및 표시
                        p[d].innerHTML = s[i].join(m);
                        p[d].style.display = "block";
                        p[d].style[l] = o + "%";
                    } else {
                        // 그룹의 중간 툴팁 숨기기
                        p[d].style.display = "none";
                    }
                }
            });
        });
}

/**
 * 파일 입력 변경 처리
 * @param {HTMLElement} imgElement - 이미지 요소
 * @param {File} file - 선택된 파일
 */
function handleFileInputChange(imgElement, file) {
    const reader = new FileReader();
    reader.onload = function () {
        imgElement.src = reader.result;
    };
    if (file) reader.readAsDataURL(file);
}
