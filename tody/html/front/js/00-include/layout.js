// layout 관련 js
$(function () {
    var currentPage = window.location.pathname;
    console.log(currentPage);

    // header
    loadHeader(`/front/views/00-include/header.html`).done(function () {
        relatedWebsite();
    });

    loadMobile("/front/views/00-include/mobile.html", ".mobile").done(function () {
        if (currentPage === "/front/views/realPrice/realPrice.html" || currentPage === "/front/views/sell/sell.html") {
            // $(".mobile-footer").remove();
            $("#mobileSearchOpen").addClass("show");
        }
        relatedWebsite();
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
});

/**
 * header loader 함수
 * @param {*} file
 * @returns
 */
function loadHeader(file) {
    var deferred = $.Deferred();

    $("header").load(file, function () {
        // 로그인 확인 //
        const userInfoBool = userInfo();

        // 상단 내브바 처리 //
        if (userInfoBool) {
            $("#login_header").prepend(
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
            $("#login_header").prepend(
                `<a href="/front/views/00-include/login.html" class="modal-open-btn login-before">로그인</a>
            <em class="login-before">|</em>
            <a href="/front/views/member/join_step01.html" class="login-before">회원가입</a>`
            );
        }

        // 내정보 - 드롭다운 //
        var myinfoChk = 0;
        var relatedChk = 0;
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

        const isRealtor = getCookie("user_role") == "001" ? true : false;

        if (getCookie("user_role") == "001") {
            $(".mypage-url").attr("href", "/front/views/mypage/mypage.html");
        } else if (getCookie("user_role") == "002") {
            $(".mypage-url").attr("href", "/front/views/mypage/mypage_realtor.html");
        }

        deferred.resolve(); // 로드 완료 시 Deferred 객체를 해결
    });

    return deferred.promise();
}

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
        console.log(111);
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
