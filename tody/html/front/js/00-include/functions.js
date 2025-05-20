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

/**
 * URL 쿼리 문자열이나 해시 부분을 파싱하여 특정 파라미터 값을 가져옵니다.
 * @param {string} queryString - 파싱할 쿼리 문자열이나 해시 문자열.
 * @param {string} paramName - 가져올 파라미터 이름.
 * @returns {string|null} - 파라미터 값 또는 null.
 */
function getQueryParam(queryString, paramName) {
    var params = {};
    var regex = /([^&=]+)=([^&]*)/g;
    var match;

    while ((match = regex.exec(queryString)) !== null) {
        params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
    }

    return params[paramName] || null;
}

/**
 * URL의 해시 부분에서 특정 파라미터 값을 가져옵니다.
 * @param {string} paramName - 가져올 파라미터 이름.
 * @returns {string|null} - 파라미터 값 또는 null.
 */
function getHashParam(paramName) {
    var queryString = window.location.hash.substring(1);
    return getQueryParam(queryString, paramName);
}

/**
 * URL 쿼리 문자열이나 해시 부분을 파싱하여 파라미터 객체를 반환합니다.
 * @param {string} queryString - 파싱할 쿼리 문자열이나 해시 문자열.
 * @returns {Object} - 파라미터 객체.
 */
function parseQueryString(queryString) {
    var params = {};
    var regex = /([^&=]+)=([^&]*)/g;
    var match;

    while ((match = regex.exec(queryString)) !== null) {
        params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
    }

    return params;
}

/**
 * URL의 해시 부분에서 파라미터 객체를 반환합니다.
 * @returns {Object} - 파라미터 객체.
 */
function getHashParams() {
    var queryString = window.location.hash.substring(1);
    return parseQueryString(queryString);
}
/**
 * URL의 쿼리 문자열에서 파라미터 객체를 반환합니다.
 * @returns {Object} - 파라미터 객체.
 */
function getQueryParams() {
    var queryString = window.location.search.substring(1);
    return parseQueryString(queryString);
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
        // GET 요청일 경우 dataObj를 쿼리 스트링으로 변환
        if (type.toUpperCase() === "GET" && Object.keys(dataObj).length > 0) {
            const queryParams = new URLSearchParams(dataObj).toString();
            url += `?${queryParams}`;
        }

        $.ajax({
            type,
            url,
            data: type.toUpperCase() === "GET" ? undefined : dataObj,
            dataType: "json",
            beforeSend: function (xhr) {
                // 로딩
                if (loading == "loading") {
                    $("html").attr("data-preloader", "enable");
                    // sessionStorage.setItem("data-preloader", "enable");
                } else {
                    // sessionStorage.setItem("data-preloader", "disable");
                }
            },
            success: (result) => {
                resolve(result);
            },
            error: async (xhr, status, error) => {
                const { responseJSON } = xhr;
                resolve(responseJSON);

                // const { message, statusCode } = responseJSON;

                // switch (status) {
                //     case 404:
                //         sweetAlertMessage("문제가 발생했습니다. ", "", "e");
                //         break;
                //     case 500:
                //         sweetAlertMessage("문제가 발생했습니다. ", "", "e");
                //         break;
                //     default:
                //         resolve(responseJSON);
                //         break;
                // }
            },
            complete: function (xhr, status) {
                $("html").attr("data-preloader", "disable");
                // sessionStorage.setItem("data-preloader", "disable");
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
                // const { message, statusCode } = responseJSON;

                // handleError(message, statusCode);

                // Status Code가 200, 300번 대가 아닐 경우 메시지를 띄운다.
                // const isStatusOk = String(statusCode).startsWith("2") || String(statusCode).startsWith("3");

                // if (!isStatusOk) {
                // resolve(false);
                // }

                resolve(responseJSON);
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
                    console.error("API 호출 에러 발생", textStatus, errorThrown);
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
 * 특정 이벤트 키의 요청을 강제로 중단
 * @param {*} eventKey
 */
function abortRequest(eventKey) {
    if (eventRequests[eventKey] && eventRequests[eventKey].xhr) {
        eventRequests[eventKey].xhr.abort();
        console.log(`Request for event '${eventKey}' was aborted.`);
        delete eventRequests[eventKey].xhr; // 요청을 중단하고 삭제
    } else {
        console.log(`No active request found for event '${eventKey}'.`);
    }
}

/**
 * 특정 요청의 상태를 확인하는 함수
 * @param {string} eventKey - 요청을 식별하기 위한 키
 * @returns {string|null} - 'pending', 'completed', 'aborted' 등의 상태를 반환
 */
function getRequestStatus(eventKey) {
    if (eventRequests[eventKey]) {
        return eventRequests[eventKey].status;
    }
    return null; // 해당 요청이 없을 때
}

/**
 * 상태가 "completed" 될 때까지 상태를 반복 확인하는 함수, 최대 지정된 횟수만큼 확인
 * 상태가 "completed"로 확인되면 전달된 콜백 함수를 실행합니다.
 *
 * @param {string} eventKey - 요청을 식별하기 위한 키 (API 요청마다 고유하게 구분)
 * @param {function} callback - 상태가 "completed"가 되었을 때 실행할 콜백 함수
 * @param {number} [interval=500] - 상태 확인 주기 (밀리초), 기본값은 500ms
 * @param {number} [maxAttempts=10] - 최대 상태 확인 시도 횟수, 기본값은 10번
 *
 * @example
 * // 1초 간격으로 'landDetail' 이벤트 상태를 확인하고, 최대 5번까지 시도 후 완료되면 콜백 실행
 * checkRequestStatus("landDetail", () => { console.log('요청 완료!'); }, 1000, 5);
 *
 * @returns {void} - 상태를 확인하는 함수이며, 반환 값은 없음
 */
function checkRequestStatus(eventKey, callback, interval = 500, maxAttempts = 10) {
    let attempts = 0; // 확인 횟수 추적

    const checkInterval = setInterval(() => {
        const status = getRequestStatus(eventKey);
        attempts++; // 시도 횟수 증가

        // 상태가 null일 경우, 요청이 아직 없거나 오류가 발생한 상태로 처리
        if (status === "completed") {
            // console.log(`Request for event '${eventKey}' is completed.`);
            clearInterval(checkInterval); // 상태가 "completed"면 확인 중단
            callback(); // 콜백 함수 실행
        } else if (attempts >= maxAttempts) {
            // console.log(`Reached maximum attempts (${maxAttempts}) for event '${eventKey}'.`);
            clearInterval(checkInterval); // 최대 시도 횟수 도달 시 확인 중단
        } else {
            // console.log(`Attempt ${attempts}: Request for event '${eventKey}' is still in progress. Status: ${status}`);
        }
    }, interval); // 지정한 시간 간격으로 상태 확인
}

// 현재 진행 중인 요청을 추적할 변수
let currentRequest = null;
/**
 * API 요청 함수 (Ajax)
 * 동일한 API 호출이 완료되기 전에 재요청이 발생하면 이전 요청을 취소하고 새 요청을 실행.
 *
 * @param {string} method - 요청 방법 (GET, POST 등)
 * @param {string} url - 요청을 보낼 URL
 * @param {object} data - 요청에 사용할 데이터 (POST 시 전송할 파라미터)
 * @return {Promise} - 요청이 완료되면 Blob 데이터를 반환하는 Promise
 */
function callApiBlob(method, url, data) {
    // 현재 진행 중인 요청이 있으면 해당 요청을 취소
    // if (currentRequest) {
    //     currentRequest.abort(); // 이전 요청을 취소
    //     currentRequest = null; // 변수 초기화
    // }

    // 새로운 요청을 Promise로 반환
    return new Promise((resolve, reject) => {
        // jQuery Ajax 요청을 실행하고 현재 요청을 currentRequest에 저장
        currentRequest = $.ajax({
            type: method, // HTTP 요청 방법 (GET, POST 등)
            url: url, // 요청을 보낼 URL
            data: data, // 요청에 사용될 데이터 (POST일 경우 전송할 데이터)
            xhrFields: {
                responseType: "blob", // 응답 데이터를 Blob 형식으로 받도록 설정
            },
            success: function (response) {
                resolve(response); // 요청이 성공하면 Blob 데이터를 반환
            },
            error: function (xhr, status, error) {
                // 요청이 "abort" 상태로 종료된 경우는 무시
                if (status !== "abort") {
                    console.error("API 호출 중 오류 발생:", error); // 오류 로그 출력
                    reject(error); // 오류 발생 시 Promise를 reject로 처리
                }
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
    let cookieString = key + "=" + value + ";path=/";

    if (typeof exp !== "undefined") {
        const date = new Date();
        date.setTime(date.getTime() + exp * 24 * 60 * 60 * 1000);
        cookieString += ";expires=" + date.toUTCString();
    }

    document.cookie = cookieString;
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
 * sweetalert alert창 함수 (return 없음)
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
        else if (icon == "i") icon = "info";

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
        else if (icon == "i") icon = "info";

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
        else if (icon == "i") icon = "info";

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
        } else {
            // Choices.js가 사용된 select 요소일 경우, Choices 인스턴스를 사용해 값 설정
            if (element.classList.contains("choices__input") && element.choices) {
                element.choices.setChoiceByValue(dataJson[key]);
            } else {
                element.value = dataJson[key];
            }
        }
    }
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
            console.log(data);
            $("input[name='postal_code']").val(data.zonecode);
            $("input[name='address_road']").val(data.roadAddress);
            $("input[name='address_jibun']").val(data.jibunAddress || data.autoJibunAddress);
            $("input[name='address_primary']").val(data.address);
            $("input[name='sido']").val(data.sido);
            $("input[name='sigungu']").val(data.sigungu);
            $("input[name='sigungu_code']").val(data.sigunguCode);
            $("input[name='bcode']").val(data.bcode);
            $("input[name='dong_code']").val(data.bcode);
            $("input[name='dong']").val(data.bname);
            $("input[name='buildingCode']").val(data.buildingCode);
            $("input[name='address_detail']").focus();
        },
    }).open();
}

/**
 * 주소기반산업지원서비스 주소팝업 콜백 함수
 * @param {*} addressData
 */
function jusoCallBack(addressData) {
    console.log(addressData);

    $("input[name='postal_code']").val(addressData.zipNo);
    $("input[name='address_road']").val(addressData.roadAddrPart1);
    $("input[name='address_jibun']").val(addressData.jibunAddr);
    $("input[name='address_primary']").val(addressData.roadAddrPart1);
    $("input[name='address_detail']").val(addressData.addrDetail);
    $("input[name='sido']").val(addressData.siNm);
    $("input[name='sigungu']").val(addressData.sggNm);
    $("input[name='sigungu_code']").val(addressData.admCd.substring(0, 5));
    $("input[name='bcode']").val(addressData.admCd);
    $("input[name='dong_code']").val(addressData.admCd);
    $("input[name='dong']").val(addressData.emdNm);
    $("input[name='buildingCode']").val(addressData.bdMgtSn);
    $("input[name='address_detail']").focus();
}

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
    if (!str || str === "null") return "";

    // 입력된 값을 소수점 기준으로 나눔
    const parts = str.split(".");

    // 소수점 앞의 숫자에 콤마 찍기
    const wholeNumber = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // 소수점 뒤의 값이 없을 때도 소수점 자체는 유지
    const decimal = parts[1] !== undefined ? parts[1] : "";

    // 소수점 뒤에 값이 없으면 '.'을 유지한 채 반환
    return decimal.length > 0 || str.includes(".") ? wholeNumber + "." + decimal : wholeNumber;
}
/*

// 소수점이하를 2자리로 고정
function comma(str) {
    // 입력값이 null, undefined이거나 문자열 "null"인 경우 처리
    if (str === null || str === undefined) {
        // null 또는 undefined인 경우, 숫자 형식으로 0.00을 반환하는 것이 일반적입니다.
        return "0.00";
    }
    if (String(str).toLowerCase() === "null") {
         // 원본 코드의 "null" 문자열 처리 로직 유지 (빈 문자열 반환)
         return "";
    }

    // 숫자로 변환하기 전에 입력된 문자열에서 콤마를 제거합니다.
    // 이는 "2,935.00"과 같은 입력도 올바르게 파싱하기 위함입니다.
    const cleanedStr = String(str).replace(/,/g, '');

    // 문자열을 부동소수점 숫자로 변환합니다.
    const num = parseFloat(cleanedStr);

    // 숫자로 변환할 수 없는 경우 (NaN) 처리
    if (isNaN(num)) {
        console.warn("comma 함수에 유효하지 않은 숫자 입력:", str);
        // 유효하지 않은 입력에 대해 0.00을 반환하는 것이 좋습니다.
        return "0.00";
    }

    // toFixed(2)를 사용하여 소수점 이하 두 자리로 만들고 문자열로 변환합니다.
    // 이 과정에서 반올림이 수행되고, 필요시 0으로 채워집니다 (예: 100 -> "100.00", 123.4 -> "123.40", 123.456 -> "123.46").
    const fixedStr = num.toFixed(2);

    // fixedStr은 이제 항상 "정수부.소수부(2자리)" 형태의 문자열입니다.
    // 이 문자열을 소수점을 기준으로 다시 나눕니다.
    const parts = fixedStr.split('.'); // parts[0] = 정수부, parts[1] = 소수부 (항상 2자리)

    // 정수부에 콤마를 찍습니다.
    const wholeNumberFormatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // 정수부와 (toFixed(2)로 인해 항상 존재하는) 소수부 두 자리를 합쳐 반환합니다.
    const decimalPart = parts[1]; // 예: "00", "60", "68"

    return wholeNumberFormatted + "." + decimalPart;
}
*/
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

/**
 * 숫자를 '억', '만' 단위로 변환하는 함수
 *
 * @param {number|string} price - 변환할 숫자(가격)입니다. 숫자 또는 숫자형 문자열을 입력받습니다.
 * @param {string} [showUnit="all"] - 변환된 가격을 출력할 때, 표시할 단위를 지정합니다.
 *    - "all": 억, 만 단위를 모두 표시합니다.
 *    - "only-uk": 억 단위만 표시하고, 만 단위는 생략합니다.
 * @param {boolean} isWon - price가 원 단위인지 여부를 나타냅니다. true일 경우 만원 단위로 자동 변환합니다.
 * @param {boolean} [displayDecimal=false] - 억 단위에 소수점을 표시할지 여부를 나타냅니다.
 * @returns {string} - 입력된 숫자를 '억', '만' 단위로 변환한 문자열을 반환합니다. 유효하지 않은 값이 들어오면 빈 문자열을 반환합니다.
 *    - ex) 12345678 -> "1234억 5678만"
 *    - ex) 12340000 -> "1234억"
 *    - ex) 560000 -> "560만"
 *    - ex) 0 -> "0만"
 */
// function formatPrice(price, showUnit = "all", isWon = false, displayDecimal = false) {
//     price = parseInt(price, 10);
//     if (isNaN(price)) return "";

//     // 만원 단위가 아닌 경우(원 단위) 만원 단위로 변환
//     if (isWon) {
//         price = Math.floor(price / 10000); // 원 단위를 만원 단위로 변환
//     }

//     // 가격(억, 만 구분)
//     // const price_rest = priceToString(price % 10000); // 만 단위의 돈에서 나머지 (만 원)
//     const price_rest = price % 10000; // 만 단위의 돈에서 나머지 (만 원)
//     const price_share_raw = price / 10000; // 소수 포함한 억 단위 계산
//     let price_share = Math.floor(price_share_raw); // 정수로 변환한 억 단위

//     // 만 단위와 억 단위가 모두 0이면 빈 문자열 반환
//     if (price_share === "0" && price_rest === "0") {
//         return "0만";
//     }

//     // 만약 금액이 1억 미만일 경우, 만 단위만 반환
//     if (price < 10000) {
//         return `${price_rest.toLocaleString()}만`;
//     }

//     // 소수점 표시가 활성화된 경우, 억 단위에 소수점 표시
//     if (displayDecimal && price_share > 0) {
//         price_share = price_share_raw.toFixed(1); // 소수점 포함
//         return `${price_share}억`; // 만 단위 생략
//     }

//     switch (showUnit) {
//         case "all":
//             return price_rest !== 0 ? `${price_share}억 ${price_rest.toLocaleString()}만` : `${price_share}억`;
//         case "only-uk":
//             return price_share !== "0" ? `${price_share}억` : "";
//         default:
//             return "0만";
//     }
// }

/**
 * 숫자를 '조', '억', '만' 단위로 변환하는 함수
 *
 * @param {number|string} price - 변환할 숫자(가격)입니다. 숫자 또는 숫자형 문자열을 입력받습니다.
 * @param {string} [showUnit="all"] - 변환된 가격을 출력할 때, 표시할 단위를 지정합니다.
 *    - "all": 조, 억, 만 단위를 모두 표시합니다.
 *    - "only-uk": 억 단위만 표시하고, 만 단위는 생략합니다.
 *    - "only-j": 조 단위만 표시하고, 억과 만 단위는 생략합니다.
 * @param {boolean} isWon - price가 원 단위인지 여부를 나타냅니다. true일 경우 만원 단위로 자동 변환합니다.
 * @param {boolean} [displayDecimal=false] - 조, 억 단위에 소수점을 표시할지 여부를 나타냅니다.
 * @returns {string} - 입력된 숫자를 '조', '억', '만' 단위로 변환한 문자열을 반환합니다. 유효하지 않은 값이 들어오면 빈 문자열을 반환합니다.
 *    - ex) 123456789012 -> "12조 3456억 7890만"
 *    - ex) 123456780000 -> "12조 3456억"
 *    - ex) 560000 -> "560만"
 *    - ex) 0 -> "0만"
 */
function formatPrice(price, showUnit = "all", isWon = false, displayDecimal = false) {
    price = parseInt(price, 10);
    if (isNaN(price)) return "";

    // 원 단위일 경우, 만원 단위로 변환
    if (isWon) {
        price = Math.floor(price / 10000);
    }

    const price_million = price % 10000; // 만 단위 나머지
    const price_billion_raw = price / 10000; // 억 단위 원본 값
    const price_billion = Math.floor(price_billion_raw); // 억 단위 정수

    const price_trillion_raw = price / 100000000; // 조 단위 원본 값
    const price_trillion = Math.floor(price_trillion_raw); // 조 단위 정수

    // 모든 값이 0일 경우 "0만" 반환
    if (price_trillion === 0 && price_billion === 0 && price_million === 0) {
        return "0만";
    }

    // 만약 금액이 1억 미만일 경우, 만 단위만 반환
    if (price < 10000) {
        return `${price_million.toLocaleString()}만`;
    }

    // 소수점 표시가 활성화된 경우
    let trillionStr = price_trillion > 0 ? `${price_trillion.toLocaleString()}조` : "";
    let billionStr = price_billion > 0 ? `${price_billion % 10000}억` : "";
    let millionStr = price_million > 0 ? `${price_million.toLocaleString()}만` : "";

    if (displayDecimal) {
        if (price_trillion > 0) {
            trillionStr = `${price_trillion_raw.toFixed(1)}조`;
            billionStr = ""; // 조 단위에 소수점이 있으면 억 이하 생략
            millionStr = "";
        } else if (price_billion > 0) {
            billionStr = `${price_billion_raw.toFixed(1)}억`;
            millionStr = ""; // 억 단위에 소수점이 있으면 만 단위 생략
        }
    }

    // 표시할 단위 조정
    switch (showUnit) {
        case "all":
            return [trillionStr, billionStr, millionStr].filter(Boolean).join(" ");
        case "only-uk":
            return trillionStr || billionStr || "0억";
        case "only-j":
            return trillionStr || "0조";
        default:
            return "0만";
    }
}

/**
 * 면적 m2 -> 평 변환 후 바인딩 함수
 * @param {*} rcvValue
 */
function convertToPyeong(rcvValue) {
    const pyeongValue = (rcvValue / 3.305).toFixed(1);
    return pyeongValue;
}

/**
 * 면적 평 -> m2 변환 후 바인딩 함수
 * @param {*} rcvValue
 */
function convertToM2(rcvValue) {
    const squareMeterValue = (rcvValue * 3.305).toFixed(1);
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
        // return imgElement.src;
    };
    if (file) reader.readAsDataURL(file);
}

/**
 * 파일 입력 변경 처리
 * @param {File} file - 선택된 파일
 */
async function handleFileInputChangeMultiple(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            resolve(event.target.result);
        };
        reader.onerror = function (error) {
            reject(error);
        };
        if (file) reader.readAsDataURL(file);
    });
}

/**
 * 현재 URL의 쿼리 스트링 값을 추가하거나 수정하는 함수
 * @param {string} param - 추가하거나 수정할 쿼리 파라미터 이름
 * @param {string} value - 추가하거나 수정할 쿼리 파라미터 값
 */
function updateQueryString(param, value) {
    // 현재 URL 가져오기
    const currentUrl = window.location.href;
    const urlObj = new URL(currentUrl);
    const params = new URLSearchParams(urlObj.search);

    // 쿼리 파라미터 추가 또는 수정
    params.set(param, value);

    // 수정된 쿼리 스트링을 URL에 반영
    urlObj.search = params.toString();

    // URL을 변경
    window.history.pushState({}, "", urlObj.toString());

    // 수동으로 popstate 이벤트를 트리거
    const popStateEvent = new PopStateEvent("popstate", { state: {} });
    window.dispatchEvent(popStateEvent);
}

/**
 * 현재 URL의 쿼리 스트링 값을 추가하거나 수정하는 함수
 * @param {Object} paramsObj - 추가하거나 수정할 쿼리 파라미터 객체
 */
function updateQueryStringObject(paramsObj) {
    // 현재 URL 가져오기
    const currentUrl = window.location.href;
    const urlObj = new URL(currentUrl);
    const params = new URLSearchParams(urlObj.search);

    // 쿼리 파라미터 추가 또는 수정
    for (const key in paramsObj) {
        if (paramsObj.hasOwnProperty(key)) {
            params.set(key, paramsObj[key]);
        }
    }

    // 수정된 쿼리 스트링을 URL에 반영
    urlObj.search = params.toString();

    // URL을 변경
    window.history.pushState({}, "", urlObj.toString());

    // 수동으로 popstate 이벤트를 트리거
    const popStateEvent = new PopStateEvent("popstate", { state: {} });
    window.dispatchEvent(popStateEvent);
}

/**
 * 숫자만 입력되게 하는 함수(oninput용)
 * ex) oninput="allowOnlyNumbers(this)"
 * @param {*} inputElement
 * @param {*} maxLength 최대자릿수
 */
function allowOnlyNumbers(inputElement, maxLength, commaBool = false) {
    // 입력된 값을 숫자만 남기고 다른 문자는 제거
    let value = inputElement.value.replace(/[^0-9]/g, "");

    // 입력 필드에 설정된 maxlength 속성 값 가져오기
    const maxValue = inputElement.getAttribute("maxlength");
    const minValue = inputElement.getAttribute("minlength");

    // 최대자릿수 조건 있을 때
    if (maxLength) {
        // 최대 자릿수를 확인하고 조정
        if (value.length > maxLength) {
            value = value.slice(0, maxLength);
        }
    }

    // 최대값 조건이 있는 경우 값이 초과하면 최대값으로 조정
    if (maxValue && parseInt(value) > parseInt(maxValue)) {
        value = maxValue;
    }

    // 최종 값을 입력 필드에 설정
    if (commaBool === true) {
        inputElement.value = comma(value);
    } else {
        inputElement.value = value;
    }
}

/**
 * 숫자 및 소수점 입력 허용 (oninput용)
 * ex) oninput="allowOnlyNumericAndDecimal(this, 10, true)"
 * @param {HTMLElement} inputElement - 입력 필드
 * @param {number} maxLength - 최대 자릿수 (소수점 포함)
 * @param {boolean} commaBool - 천단위 콤마 여부
 */
function allowOnlyNumericAndDecimal(inputElement, maxLength, commaBool = false) {
    // 입력된 값을 숫자와 소수점만 남기고 다른 문자는 제거
    let value = inputElement.value.replace(/[^0-9.]/g, "");

    // 소수점이 여러 번 입력되는 경우 첫 번째 소수점만 유지
    const parts = value.split(".");
    if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("");
    }

    // 최대 자릿수 조건이 있는 경우
    if (maxLength) {
        // 최대 자릿수를 초과하면 잘라냄
        if (value.length > maxLength) {
            value = value.slice(0, maxLength);
        }
    }

    // 최대값(max) 속성 검사 및 제한
    const maxValue = inputElement.getAttribute("maxlength");
    if (maxValue && parseFloat(value) > parseFloat(maxValue)) {
        value = maxValue;
    }

    // 콤마 처리 (천 단위 구분)
    if (commaBool) {
        inputElement.value = comma(value);
    } else {
        inputElement.value = value;
    }
}

/**
 * textarea 높이 자동조절 해주는 함수
 * @param {*} textarea
 */
function autoResize(textarea) {
    $(textarea).css("height", "auto");
    $(textarea).css("height", textarea.scrollHeight + "px");
    // textarea.style.height = "auto";
    // textarea.style.height = textarea.scrollHeight + "px";
}

// 확장자별 이미지 매핑
var extensionToImageMap = {
    asp: "asp.gif",
    bat: "bat.gif",
    bmp: "bmp.gif",
    com: "com.gif",
    compressed: "compressed.gif",
    default: "default.gif",
    doc: "doc.gif",
    docx: "doc.gif",
    exe: "exe.gif",
    gif: "gif.gif",
    html: "html.gif",
    hwp: "hwp.gif",
    jpg: "jpg.gif",
    jpeg: "jpg.gif", // jpg와 동일한 이미지 사용
    mp3: "mp3.gif",
    pdf: "pdf.gif",
    png: "png.gif",
    ppt: "ppt.gif",
    ra: "ra.gif",
    sound: "sound.gif",
    txt: "txt.gif",
    unknown: "unknown.gif",
    url: "url.gif",
    wav: "wav.gif",
    xls: "xls.gif",
    zip: "zip.gif",
};

// alertify 라이브러리를 이용한 알림창 함수
function showAlert(title = "알림", message, callback = function () {}) {
    alertify.defaults.transition = "zoom";
    alertify.defaults.theme.ok = "btn btn-dark";
    alertify.alert(title, message, callback);
}

// alertify 라이브러리를 이용한 확인창 함수
function showConfirm(title = "알림", message) {
    alertify.defaults.transition = "zoom";
    return new Promise((resolve, reject) => {
        alertify.confirm(
            title,
            message,
            function () {
                resolve(true);
            },
            function () {
                resolve(false);
            }
        );
    });
}

// alertify 라이브러리를 이용한 프롬프트창 함수
function showPrompt(title = "알림", message) {
    alertify.defaults.transition = "zoom";
    alertify.defaults.theme.ok = "btn btn-dark";
    alertify.defaults.theme.cancel = "btn btn-light";
    alertify.defaults.theme.input = "form-control";
    return new Promise((resolve, reject) => {
        alertify.prompt(
            title,
            message,
            "",
            function (evt, value) {
                resolve(value);
            },
            function () {
                resolve(null);
            }
        );
    });
}

// alertify 라이브러리를 이용한 토스트 메시지 함수
function showToastMessage(message, type = "success", delay = 3, callback = function () {}) {
    alertify.defaults.notifier.delay = delay;
    alertify.defaults.notifier.position = "top-right";

    switch (type) {
        case "success":
            alertify.success(message);
            break;
        case "error":
            alertify.error(message);
            break;
        case "warning":
            alertify.warning(message);
            break;
        default:
            alertify.message(message);
            break;
    }

    setTimeout(() => {
        callback();
    }, delay * 1000);
}

/**
 * 이스케이프 처리 함수
 * @param {*} unsafe
 * @returns
 */
function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * Debounce 함수
 *
 * 지정된 시간(`wait`) 동안 여러 번 호출된 함수(`func`) 중 마지막 호출만 실행되도록 하는 함수입니다.
 * 주로 사용자가 입력 필드에 텍스트를 빠르게 입력할 때, 실시간으로 API 호출 등의 작업을 방지하고,
 * 마지막 입력 후 일정 시간 대기한 후에만 작업을 수행하고자 할 때 유용합니다.
 *
 * 예시 사용 시나리오:
 * - 검색어 자동 완성: 사용자가 입력을 멈춘 후 일정 시간 대기한 뒤에만 검색을 수행
 * - 윈도우 크기 변경 이벤트에서 마지막 크기 변경 후 작업을 수행
 *
 * @param {Function} func - 디바운스 적용을 원하는 함수. 마지막으로 호출된 후 일정 시간(`wait`)이 지나야 실행됩니다.
 * @param {number} wait - 함수가 실행되기 전에 대기해야 하는 시간 (밀리초 단위).
 * @returns {Function} - 디바운스 처리가 적용된 새로운 함수. 연속적으로 호출될 경우, 마지막 호출만 대기 시간 후에 실행됩니다.
 */
function debounce(func, wait) {
    let timeout; // 이전 호출 시 설정된 타이머를 추적하기 위한 변수
    return function (...args) {
        // 반환되는 함수는 원래 함수에 전달될 인자를 모두 받습니다
        const context = this; // 현재 호출된 함수의 실행 컨텍스트를 유지하기 위한 참조
        clearTimeout(timeout); // 이전에 설정된 타이머가 있으면 이를 제거하여 실행을 방지
        // 새로운 타이머를 설정하여 일정 시간 대기 후 원래 함수 실행
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}
