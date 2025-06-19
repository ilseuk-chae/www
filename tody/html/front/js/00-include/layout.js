// layout 관련 js
$(function () {
    var currentPage = window.location.pathname;
    
    // 이 호출은 DOMContentLoaded 리스너의 fetch 완료를 대기한 후 실행됩니다.
    loadHeader(`/front/views/00-include/header.html`).done(function () {
        
        relatedWebsite(); // 헤더 로드 및 초기화 완료 후 relatedWebsite 실행 (기존 위치 유지)
        toolsWebsite(); // 헤더 로드 및 초기화 완료 후 toolsWebsite 실행 (기존 위치 유지)
        
    }).fail(function(error) {
        console.error("loadHeader().fail() 실행됨:", error);
        
    });

    // loadMobile 및 footer 로드는 기존대로 유지
    loadMobile("/front/views/00-include/mobile.html", ".mobile").done(function () {
        
        if (currentPage === "/front/views/realPrice/realPrice.html" || currentPage === "/front/views/sell/sell.html") {
             // $(".mobile-footer").remove();
             // #mobileSearchOpen은 모바일 HTML에 있을 것이므로 해당 스코프에서 찾는 것이 안전
             const mobileElement = document.querySelector('.mobile');
             if (mobileElement) {
                $(mobileElement).find("#mobileSearchOpen").addClass("show");
             } else {
                 $("#mobileSearchOpen").addClass("show"); // Fallback
             }
        }
        
    }).fail(function(error) {
         console.error("loadMobile().fail() 실행됨:", error);
    });

    // footer
    loadMobile("/front/views/00-include/footer.html", ".footer").done(function () {
        
        policyTotal();

        // 모달 - 이용절차안내 //
        $("#terms").iziModal({
            width: "750px",
            onOpening: function (modal) {
                // 해시값 추가
                // const activeTab = $(".nav-link.active").attr("href");
                // if (activeTab && activeTab.startsWith("#term_")) {
                //     history.replaceState(null, null, activeTab); // URL에 해시 추가
                // }
            },
            onOpened: function (modal) {},
            onClosing: function (modal) {
                // 해시값 초기화
                if (window.location.hash.startsWith("#term_")) {
                    history.replaceState(null, null, " "); // 해시 제거
                }
            },
        });
        $("#terms").iziModal("setTop", 70);
        $("#terms").iziModal("setBottom", 70);
        
    }).fail(function(error) {
        console.error("loadFooter().fail() 실행됨:", error);
   });
    

});


    // 탭 변경 시 해시 업데이트
    // $(document).on("click", "#terms .nav-link", function () {
    //     const newHash = $(this).attr("href");
    //     console.log(newHash);

    //     if (newHash && newHash.startsWith("#term_")) {
    //         history.replaceState(null, null, newHash); // URL 해시 변경
    //     }
    // });
    // $("footer").load("/front/views/00-include/footer.html");

const headerBaseHtmlLoadedDeferred = $.Deferred();
/**
 * header loader 함수
 * @param {*} file
 * @returns
 */
function loadHeader(file) {
    //var deferred = $.Deferred();
    var dynamicContentAndEventsDeferred = $.Deferred();
    
    // DOMContentLoaded 리스너가 헤더 기본 HTML 로드 및 삽입을 완료할 때까지 대기합니다.
    headerBaseHtmlLoadedDeferred.promise().done(function() {
        // header.innerHTML로 인해 DOM이 업데이트되었으므로, 요소를 다시 찾습니다.
        const headerElement = document.querySelector('header.header'); // 헤더 요소 다시 선택
        if (!headerElement) {
                dynamicContentAndEventsDeferred.reject(new Error('Header element not found after base load'));
                return; // 요소 없으면 여기서 중단
        }
        const $header = $(headerElement); // jQuery 객체로 래핑하여 사용
        // 로그인 확인 //
        const userInfoBool = userInfo();
        
        // 상단 내브바 처리 //
        const $loginAreaOrHeader = $("#login_area", $header); // #login_area를 사용한다고 가정
        
        if ($loginAreaOrHeader.length) { // 요소가 존재하는 경우에만 처리
            if (userInfoBool) {
                $loginAreaOrHeader.html( // .html() 사용: 기존 내용 모두 지우고 새 내용 삽입
                    `<div class="h-myInfo">
                        <a href="javascript:void(0);"><span class="user-name-type">${decodeURIComponent(getCookie("user_name"))}(${getCookie("user_role") == "001" ? "일반회원" : getCookie("user_role") == "002" ? "중개사회원" : "금융회원"})</span> 님 <i class="fa-light fa-chevron-down"></i> </a>
                        <div class="h-my-menu">
                            <a class="mypage-url" href="/front/views/mypage/mypage.html">
                                <span>나의정보</span>
                                <i class="fa-light fa-angle-right"></i>
                            </a>
                            <a id="logout_btn" href="/index.html" onclick="logout()">
                                <span onClick="logout">로그아웃</span>
                                <i class="fa-light fa-angle-right"></i>
                            </a>
                        </div>
                    </div>`
                );
                
            } else {
                $loginAreaOrHeader.html( // .html() 사용: 기존 내용 모두 지우고 새 내용 삽입
                    `<a href="/front/views/00-include/login.html" class="modal-open-btn login-before">로그인</a>
                    <em class="login-before">|</em>
                    <a href="/front/views/member/join_step01.html" class="login-before">회원가입</a>`
                );
            }
            
       } else {
            console.error("loadHeader: 대상 요소 (#login_area 또는 #login_header) element not found within header after base HTML load. Cannot insert dynamic content.");
            // 동적 내용 삽입 대상 요소가 없더라도 나머지 작업은 진행될 수 있으므로 reject 대신 resolve 고려
       }

        // 내정보 - 드롭다운 //
        var myinfoChk = 0;
        var relatedChk = 0;
        var toolsChk = 0;
        $(".h-myInfo").click(function () {
            if (myinfoChk == 0) {
                $(".h-myInfo > div").slideDown(200, "easeOutQuad");
                $(".h-myInfo > a i").addClass("fa-rotate-180");
                myinfoChk = 1;
            } else {
               $(".h-myInfo > div").slideUp(200, "easeOutQuad");
                $(".h-myInfo > a i").removeClass("fa-rotate-180");
                myinfoChk = 0;
            }
        });

        // 관련사이트 - 드롭다운 //
        $(document).on("click", ".h-relatedSite", function () {
            if (relatedChk == 0) {
                $(".h-relatedSite > div").slideDown(200, "easeOutQuad");
                $(".h-relatedSite > a i").addClass("fa-rotate-180");
                relatedChk = 1;
            } else {
                $(".h-relatedSite > div").slideUp(200, "easeOutQuad");
                $(".h-relatedSite > a i").removeClass("fa-rotate-180");
                relatedChk = 0;
            }
        });

        // 계산기 - 드롭다운 //
        $(document).on("click", ".h-tools", function () {
            if (toolsChk == 0) {
                $(".h-tools > div").slideDown(200, "easeOutQuad");
                $(".h-tools > a i").addClass("fa-rotate-180");
                toolsChk = 1;
            } else {
                $(".h-tools > div").slideUp(200, "easeOutQuad");
                $(".h-tools > a i").removeClass("fa-rotate-180");
                toolsChk = 0;
            }
        });

        
        $("body").click(function (e) {
            if ($(".h-myInfo").css("display") == "block") {
                if (!$(".h-myInfo").has(e.target).length) {
                    $(".h-myInfo > div").slideUp(200, "easeOutQuad");
                    $(".h-myInfo > a i").removeClass("fa-rotate-180");
                    myinfoChk = 0;
                }
            }
            if ($(".h-relatedSite").css("display") == "block") {
                if (!$(".h-relatedSite").has(e.target).length) {
                    $(".h-relatedSite > div").slideUp(200, "easeOutQuad");
                    $(".h-relatedSite > a i").removeClass("fa-rotate-180");
                    relatedChk = 0;
                }
            }
            if ($(".h-tools").css("display") == "block") {
                if (!$(".h-tools").has(e.target).length) {
                    $(".h-tools > div").slideUp(200, "easeOutQuad");
                    $(".h-tools > a i").removeClass("fa-rotate-180");
                    toolsChk = 0;
                }
            }
        });
        
        // PC - 검색영역 //
        $("#headerSearchOpen").click(function () {
            $(".h-search").css({ display: "flex" });
            $(".h-search").animate({ width: "100%" }, 200, "easeOutQuad");
        });
        $("#headerSearchClose").click(function () {
            $(".h-search").animate({ width: "0%" }, 150, "easeOutQuad");
            setTimeout(() => {
                $(".h-search").css({ display: "none" });
            }, 150);
        });



        // 마이페이지 URL 설정 (.mypage-url는 header.html에 있을 것이므로 headerElement 스코프 사용)
        const isRealtor = getCookie("user_role") == "001" ? true : false;
        if (getCookie("user_role") == "001") {
            $(".mypage-url").attr("href", "/front/views/mypage/mypage.html");
        } else if (getCookie("user_role") == "002") {
            $(".mypage-url").attr("href", "/front/views/mypage/mypage_realtor.html");
        }
        
        setActiveMenuByUrl(); // 헤더 DOM이 완전히 준비된 후 호출

        // 동적 내용 삽입 및 이벤트 바인딩 작업 완료 신호
        dynamicContentAndEventsDeferred.resolve();
    }).fail(function(error){
        console.error("loadHeader: 기본 HTML 로드 대기 중 오류 발생:", error);
        // 기본 HTML 로드 실패 시 loadHeader 함수도 실패 처리
        dynamicContentAndEventsDeferred.reject(error);
    });
    
    return dynamicContentAndEventsDeferred.promise(); 
   
};

 

/**
 * mobile loader 함수
 * @param {*} file
 * @param {*} selector
 * @returns
 */
function loadMobile(file, selector) {
    var deferred = $.Deferred();

    $(selector).load(file, function () {
        // 로그인 확인 //
        const userInfoBool = userInfo();
        const mobileBtnGroup = $(".mmi-tab-btn");

        // 상단 내브바 처리 //
        if (userInfoBool) {
            $(".mobile-menu-info .user-name-type").text(`${decodeURIComponent(getCookie("user_name"))}(${getCookie("user_role") == "001" ? "일반회원" : "중개사회원"})님`);

            mobileBtnGroup.find("a:first").attr("href", "/front/views/mypage/mypage.html").text("마이페이지");
            mobileBtnGroup.find("a:last").attr("href", "/index.html").removeClass("modal-open-btn").text("로그아웃");
            mobileBtnGroup.find("a:last").on("click", logout);
        } else {
            $(".mobile-menu-info .user-name-type").text("반갑습니다.");

            mobileBtnGroup.find("a:first").attr("href", "/front/views/member/join_step01.html").text("회원가입");
            mobileBtnGroup.find("a:last").attr("href", "/front/views/00-include/login.html").addClass("modal-open-btn").text("로그인");
        }

        // MOBILE - 검색영역 //
        $("#mobileSearchOpen").click(function () {
            $(".mh-search").css({ display: "flex" });
            $(".mh-search").animate({ width: "100%" }, 200, "easeOutQuad");
        });

        $("#mobileSearchClose").click(function () {
            $(".mh-search").animate({ width: "0%" }, 150, "easeOutQuad");
            setTimeout(() => {
                $(".mh-search").css({ display: "none" });
            }, 150);
        });

        // MOBILE - 메뉴 및 정보 //
        $("#mobileMenuInfo").click(function () {
            $(".mobile-menu-info-bg").css({ display: "block" });
            $(".mobile-menu-info").css({ display: "block" });
            $(".mobile-menu-info").animate({ marginRight: "0" }, 300, "easeOutQuad");
        });

        $(".mmi-info dl dd a, .mobile-menu-info-bg").click(function () {
            $(".mobile-menu-info-bg").css({ display: "none" });
            setTimeout(() => {
                $(".mobile-menu-info").css({ display: "none" });
            }, 500);
            $(".mobile-menu-info").animate({ marginRight: "-320px" }, 300, "easeOutQuad");
        });

        $("#selectSiteMobile").on("change", function () {
            const url = $(this).val();
            if (url) {
                window.open(url, "_blank");
            }
        });
        $("#selectToolsMobile").on("change", function () {
            const url = $(this).val();
            if (url) {
                window.open(url, "_blank");
            }
        });
        deferred.resolve(); // 로드 완료 시 Deferred 객체를 해결
    });

    return deferred.promise();
}

async function relatedWebsite() {
    // 멀티 - 셀렉션 //
    // $("#selectSite").multiSelect({ noneText: "관련사이트" });
    // $("#selectSiteMobile").multiSelect({ noneText: "관련사이트" });
    const related_website = sessionStorage.getItem("related_website");
    const mobile_related_website = sessionStorage.getItem("mobile_related_website");

    // 캐시된 데이터가 없는 경우 API 호출
    if (!related_website || !mobile_related_website) {
        const result = await callApi("POST", "/front/back/00-include/related_website.php", {});

        const resultHtml = result.responseData
            .map(function (data) {
                const { site_name, site_url, site_image } = data;
                return `
                    <a target="_blank" class="related-site-url" href="${site_url}">
                        <img src="${site_image}" alt="${site_name}" class="h-100">
                        <!-- <span>${site_name}</span> -->
                    </a>`;
            })
            .join("");

        let mobileResultHtml = '<option value="" selected hidden>관련사이트</option>';
        mobileResultHtml += result.responseData
            .map(function (data) {
                const { site_name, site_url } = data;
                return `<option value="${site_url}">${site_name}</option>`;
            })
            .join("\n");

        // 데이터 캐싱
        sessionStorage.setItem("related_website", resultHtml);
        sessionStorage.setItem("mobile_related_website", mobileResultHtml);

        // DOM 업데이트
        $(".h-relatedSite .h-realted-menu").empty().append(resultHtml);
        $("#selectSiteMobile").empty().append(mobileResultHtml);
    } else {
        // 캐시된 데이터를 사용해 DOM 업데이트
        $(".h-relatedSite .h-realted-menu").empty().append(related_website);
        $("#selectSiteMobile").empty().append(mobile_related_website);
    }
}

async function toolsWebsite() {
    // 멀티 - 셀렉션 //
    // $("#selectTools").multiSelect({ noneText: "관련사이트" });
    // $("#selectToolsMobile").multiSelect({ noneText: "관련사이트" });
    const tools_website = sessionStorage.getItem("tools_website");
    const mobile_tools_website = sessionStorage.getItem("mobile_tools_website");

    // 캐시된 데이터가 없는 경우 API 호출
    if (!tools_website || !mobile_tools_website) {
        const result = await callApi("POST", "/front/back/00-include/tools_website.php", {});

        // --- resultHtml 생성 부분 수정 (iziModal 선언적 방식 적용) ---
        const resultHtml = result.responseData
            .map(function (data) {
                const { tools_name, tools_site_url } = data;
                // iziModal 선언적 속성 추가 및 href, target 수정
                return `
                    <a target="_blank" class="tools-site-url" href="${tools_site_url}">
                        <span>${tools_name}</span>
                        <i class="fa-light fa-angle-right"></i>
                    </a>`;
            })
            .join("");
        // ----------------------------------------------------------

        // --- mobileResultHtml 생성 부분 (iziModal 선언적 방식은 option 태그에 직접 적용 불가) ---
        // 모바일 셀렉트 박스는 별도의 JavaScript change 이벤트 핸들러가 필요합니다.
        let mobileResultHtml = '<option value="" selected hidden>계산기</option>';
        mobileResultHtml += result.responseData
            .map(function (data) {
                const { tools_name, tools_site_url } = data;
                // option 태그의 value에 URL 저장
                return `<option value="${tools_site_url}">${tools_name}</option>`;
            })
            .join("\n");
        // ----------------------------------------------------------------------------------


        // 데이터 캐싱
        sessionStorage.setItem("tools_website", resultHtml);
        sessionStorage.setItem("mobile_tools_website", mobileResultHtml);

        // DOM 업데이트
        $(".h-tools .h-tool-menu").empty().append(resultHtml);
        $("#selectToolsMobile").empty().append(mobileResultHtml);
    } else {
        // 캐시된 데이터를 사용해 DOM 업데이트
        $(".h-tools .h-tool-menu").empty().append(tools_website);
        $("#selectToolsMobile").empty().append(mobile_tools_website);
    }
}

/**
 * 이용약관 가져오는 함수
 * @returns
 */
async function policyTotal() {
    try {
        const dataObj = {};
        const result = await callApi("POST", "/front/back/00-include/policy_total.php", dataObj);

        if (!result || result.statusCode !== 200 || result.message !== "SUCCESS") {
            console.error("policy error");
            return;
        }

        const { responseData } = result;

        let navHtml = "";
        let contentsHtml = "";
        responseData.forEach((item, index) => {
            // 탭 타이틀
            if (index !== 0) {
                navHtml += `<dt>|</dt>`;
            }
            navHtml += `<dt class="nav-item" role="presentation">
                            <a class="nav-link  ${index == 0 ? "active" : ""}" id="" data-bs-toggle="tab" href="#term_${item.pol_no}" role="tab" aria-selected="${index == 0 ? "true" : "false"}">${item.title}</a>
                        </dt>`;

            // 탭 컨텐츠
            contentsHtml += `<div class="terms-area ta-modal tab-pane ${index == 0 ? "active show" : ""}" id="term_${item.pol_no}" role="tabpanel">
                                <p>${item.content}</p>
                            </div>`;
        });

        $("#terms .nav-tabs").html(navHtml);
        $("#terms .tab-content").html(contentsHtml);

        // URL 해시 값 처리
        const hash = window.location.hash; // URL에서 # 뒤의 값 가져오기
        if (hash && hash.startsWith("#term_")) {
            // 해당 모달 열기
            $('[data-izimodal-open="#terms"]').trigger("click");

            // 해당 탭 활성화
            setTimeout(() => {
                // 모든 탭 비활성화
                $(".nav-link").removeClass("active").attr("aria-selected", "false").attr("tabindex", "-1");
                $(".tab-pane").removeClass("active show");

                // 해시에 해당하는 탭 활성화
                $(`.nav-link[href="${hash}"]`).addClass("active").attr("aria-selected", "true").removeAttr("tabindex");
                $(hash).addClass("active show");
            }, 200); // 모달이 열리는 애니메이션 시간을 고려하여 약간의 지연 추가
        }
    } catch (error) {}
}

async function policyInfo(no, id) {
    try {
        const term = $(id);

        const dataObj = { no };
        const result = await callApi("POST", "/front/back/00-include/policy_info.php", dataObj);

        if (!result || result.statusCode !== 200 || result.message !== "SUCCESS") {
            console.error("policy error");
            return;
        }

        const { title, content } = responseData;
    } catch (error) {}
}
