var mainSearchBoxChk = 0;

$(document).ready(function () {
    initScroll();
    initSwiper();
    getFaq();
    getNews();
    // initModal();
    initEvents();
});

/**
 * 스크롤 처리
 */
function initScroll() {
    SmoothScroll({
        animationTime: 1200,
        stepSize: 100,
        accelerationDelta: 50,
        accelerationMax: 3,
        touchpadSupport: false,
    });
}

/**
 * Swiper js 초기화
 */
async function initSwiper() {
    try {
        await getRelatedSite();
    } catch (error) {
    } finally {
        var swiper = new Swiper(".site-swiper", {
            loop: true,
            slidesPerView: 7, // 한 번에 7 슬라이드씩
            spaceBetween: 0, // 슬라이드 간의 간격
            loop: true, // 무한 루프 설정
            direction: "horizontal", // 수평 모드로 전환
            navigation: true,
            navigation: {
                nextEl: '.swiper-button-next', // 다음 버튼 선택자
                prevEl: '.swiper-button-prev', // 이전 버튼 선택자
            },
            autoplay: {
                delay: 1500, // 1.5초 간격으로 슬라이드 변경
                disableOnInteraction: false, // 사용자가 상호작용해도 자동 재생 계속
            },
            slidesPerGroup: 1, // 한 번에 이동할 슬라이드 수
            effect: 'slide', // 슬라이드 효과 설정
            speed: 500, // 슬라이드 속도 설정
            cssMode: false, // CSS 모드 비활성화 (linear 타이밍을 위해)
            // linear 전환 효과 설정
            on: {
                init: function() {
                    // Swiper 컨테이너에 CSS 적용
                    document.querySelector('.site-swiper').style.transitionTimingFunction = 'linear';
                    
                    // 모든 슬라이드에 CSS 적용
                    document.querySelectorAll('.site-swiper .swiper-slide').forEach(slide => {
                        slide.style.transitionTimingFunction = 'linear';
                    });
                }
            },
            // autoplay: {
            //     delay: 2500,
            //     disableOnInteraction: !1,
            // },
            breakpoints: {
                1400: {
                    slidesPerView: 7, // 2개의 슬라이드 보여줌
                    spaceBetween: 10, // 슬라이드 간 간격 50px
                },
                1200: {
                    slidesPerView: 7, // 2개의 슬라이드 보여줌
                    spaceBetween: 10, // 슬라이드 간 간격 50px
                },
                992: {
                    slidesPerView: 7, // 2개의 슬라이드 보여줌
                    spaceBetween: 10, // 슬라이드 간 간격 50px
                },
                768: {
                    slidesPerView: 4, // 2개의 슬라이드 보여줌
                    spaceBetween: 10, // 슬라이드 간 간격 50px
                },
                480: {
                    slidesPerView: 3, // 2개의 슬라이드 보여줌
                    spaceBetween: 10, // 슬라이드 간 간격 50px
                },
                323: {
                    slidesPerView: 2, // 2개의 슬라이드 보여줌
                    spaceBetween: 10, // 슬라이드 간 간격 50px
                },
            },
        });
    }

    // Swiper 초기화 후 스타일 적용
    var nextBtn = document.querySelector('.swiper-button-next');
    var prevBtn = document.querySelector('.swiper-button-prev');
    nextBtn.style.color = '#9dc5ee';
    prevBtn.style.color = '#9dc5ee';
    nextBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.0)';
    prevBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.0)';

    try {
        await getNotice();
    } catch (error) {
    } finally {
        var swiper = new Swiper(".default-swiper", {
            loop: true,
            direction: "vertical", // 수직 모드로 전환
            slidesPerView: 2, // 한 번에 한 슬라이드씩
            // spaceBetween: 10, // 슬라이드 간의 간격
            autoplay: {
                delay: 2500,
                disableOnInteraction: !1,
            },
            breakpoints: {
                992: {
                    slidesPerView: 2, // 2개의 슬라이드 보여줌
                    spaceBetween: 50, // 슬라이드 간 간격 50px
                    direction: "horizontal", // 슬라이드 방향을 수평으로 설정합니다.
                },
            },
        });
    }
}

/**
 * 이벤트 모음 함수
 */
function initEvents() {
    // 랜딩 - 검색 //
    $("#mainSearchBox").click(function () {
        if ($("#mainSearchKeyword ul li").length > 0) {
            $("#mainSearchKeyword").slideDown(200, "easeOutQuad");
            mainSearchBoxChk = 1;
        }
        // if (mainSearchBoxChk == 0) {
        //     $("#mainSearchKeyword").slideDown(200, "easeOutQuad");
        //     mainSearchBoxChk = 1;
        // } else {
        //     $("#mainSearchKeyword").slideUp(200, "easeOutQuad");
        //     mainSearchBoxChk = 0;
        // }
    });

    $("body").click(function (e) {
        if ($("#mainSearchKeyword").css("display") == "block") {
            if (!$("#mainSearchBox").has(e.target).length) {
                $("#mainSearchKeyword").slideUp(200, "easeOutQuad");
                mainSearchBoxChk = 0;
            }
        }
    });

    $("#search_input").on(
        "keyup",
        debounce(async function (e) {
            // Enter 키를 눌렀을 때
            if (e.key == "Enter") return;
            e.preventDefault(); // Enter 키로 인해 폼이 제출되는 것을 방지

            const keyword = $(this).val();
            if (!keyword) {
                $("#mainSearchKeyword ul").empty();

                $("#mainSearchKeyword").slideUp(200, "easeOutQuad");
                mainSearchBoxChk = 0;
                return;
            }

            $("#mainSearchKeyword ul").html("<li>검색 중...</li>");
            if (mainSearchBoxChk == 0) {
                $("#mainSearchKeyword").slideDown(200, "easeOutQuad");
                mainSearchBoxChk = 1;
            }

            // 검색 결과 목록에 추가된 항목들을 제거합니다
            var listEl = document.getElementById("placesList");
            removeAllChildNods(listEl);

            await Promise.all([keywordSearch(keyword), addressSearch(keyword)]);

            setTimeout(() => {
                if ($("#placesList").find("li.item").length === 0) {
                    // 검색 결과가 없을 때
                    if ($("#placesList").find(".empty-li").length === 0) {
                        $("#placesList").append("<li class='empty-li'>검색 결과가 없습니다.</li>");
                    }
                }
            }, 500);
        }, 300)
    ); // 300ms 딜레이

    $("#search_input").on("keyup", function (e) {
        // Enter 키를 눌렀을 때
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (!$("#search_input").val()) {
            alert("건물명, 지번, 도로명을 입력해주세요.");
            // location.href = "/front/views/realPrice/realPrice.html";
            return;
        }
        $("#placesList li:first").click();
    });

    $("#search_btn").on("click", function () {
        if (!$("#search_input").val()) {
            alert("건물명, 지번, 도로명을 입력해주세요.");
            // location.href = "/front/views/realPrice/realPrice.html";
            return;
        }
        if ($("#placesList li").length == 0) return;
        $("#placesList li:first").click();
    });
}

/**
 * 키워드로 검색 함수
 * @param {*} keyword
 */
async function keywordSearch(keyword) {
    $.ajax({
        url: "https://dapi.kakao.com/v2/local/search/keyword.json",
        type: "GET",
        data: {
            page: 1,
            size: 5,
            sort: "accuracy",
            query: keyword,
        },
        headers: {
            Authorization: "KakaoAK 358571ae546aaa68be0d290878b351c1",
        },
        success: async function (response) {
            const {
                documents, // 응답 결과
                meta, // 응답 관련 정보
            } = response;

            // 결과값 없으면 종료
            if (documents.length == 0) {
                // $("#mainSearchKeyword ul").html("<li>검색 결과가 없습니다.</li>");
                // if (mainSearchBoxChk == 0) {
                //     $("#mainSearchKeyword").slideDown(200, "easeOutQuad");
                //     mainSearchBoxChk = 1;
                // }
                return;
            }

            await displayPlaces(documents);

            if (mainSearchBoxChk == 0) {
                $("#mainSearchKeyword").slideDown(200, "easeOutQuad");
                mainSearchBoxChk = 1;
            }
        },
        error: function (xhr, status, error) {
            console.error("Error: " + error);
            // $("#mainSearchKeyword ul").html("<li>검색 결과가 없습니다.</li>");
            // if (mainSearchBoxChk == 1) {
            //     $("#mainSearchKeyword").slideUp(200, "easeOutQuad");
            //     mainSearchBoxChk = 0;
            // }
        },
    });
}

/**
 * 주소 검색 함수
 * @param {*} keyword
 */
async function addressSearch(keyword) {
    $.ajax({
        url: "https://dapi.kakao.com/v2/local/search/address.json",
        type: "GET",
        data: {
            page: 1,
            size: 5,
            sort: "accuracy",
            query: keyword,
            analyze_type: "similar",
        },
        headers: {
            Authorization: "KakaoAK 358571ae546aaa68be0d290878b351c1",
        },
        success: async function (response) {
            const {
                documents, // 응답 결과
                meta, // 응답 관련 정보
            } = response;

            // 결과값 없으면 종료
            if (documents.length == 0) {
                //     $("#mainSearchKeyword ul").html("<li>검색 결과가 없습니다.</li>");
                //     if (mainSearchBoxChk == 0) {
                //         $("#mainSearchKeyword").slideDown(200, "easeOutQuad");
                //         mainSearchBoxChk = 1;
                //     }
                //     return;
            }

            await displayPlaces(documents);

            if (mainSearchBoxChk == 0) {
                $("#mainSearchKeyword").slideDown(200, "easeOutQuad");
                mainSearchBoxChk = 1;
            }
        },
        error: function (xhr, status, error) {
            console.error("Error: " + error);
            // $("#mainSearchKeyword ul").html("<li>검색 결과가 없습니다.</li>");
            // if (mainSearchBoxChk == 1) {
            //     $("#mainSearchKeyword").slideUp(200, "easeOutQuad");
            //     mainSearchBoxChk = 0;
            // }
        },
    });
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
        // 정상적으로 검색이 완료됐으면 검색 목록과 마커를 표출합니다
        displayPlaces(data);

        // 페이지 번호를 표출합니다
        // displayPagination(pagination);

        if (mainSearchBoxChk == 0) {
            $("#mainSearchKeyword").slideDown(200, "easeOutQuad");
            mainSearchBoxChk = 1;
        }
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
async function displayPlaces(places) {
    var listEl = document.getElementById("placesList"),
        // menuEl = document.getElementById("menu_wrap"),
        fragment = document.createDocumentFragment(),
        listStr = "";

    // // 검색 결과 목록에 추가된 항목들을 제거합니다
    // removeAllChildNods(listEl);

    for (var i = 0; i < places.length; i++) {
        // 마커를 생성하고 지도에 표시합니다
        let itemEl = getListItem(i, places[i]); // 검색 결과 항목 Element를 생성

        // 마커와 검색결과 항목에 mouseover 했을때 해당 장소에 인포윈도우에 장소명을 표시합니다
        // mouseout 했을 때는 인포윈도우를 닫습니다
        (function (places) {
            // 리스트 click
            itemEl.onclick = function () {
                // 세션에 검색장소 저장
                sessionStorage.setItem("lastSearchedPlace", JSON.stringify(places));

                // 실거래가 페이지로 이동한다
                location.href = `/front/views/realPrice/realPrice.html?curLat=${places.y}&curLng=${places.x}`;
            };
        })(places[i]);

        fragment.appendChild(itemEl);
    }

    $("#placesList").find(".empty-li").remove();
    // 검색결과 항목들을 검색결과 목록 Element에 추가합니다
    listEl.appendChild(fragment);
    listEl.scrollTop = 0;
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
    const keywords = document.getElementById("search_input").value.trim().split(/\s+/);
    const keyword = document.getElementById("search_input").value.trim();

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

    let icon = "";

    // 카테고리 그룹 코드가 있을 경우 아이콘을 할당
    if (places.category_group_code) {
        icon = categoryIcons[places.category_group_code] || "";
    } else {
        // 카테고리 그룹 코드가 없을 경우 기본 아이콘 할당
        icon = '<i class="las la-lg la-building"></i>';
    }

    // 장소 이름이 있을 경우
    if (places.place_name) {
        itemStr += `${icon} ${highlightKeyword(places.address_name)} <strong> ${highlightKeyword(places.place_name)} </strong>`;
    } else {
        itemStr += `<i class="las la-lg la-map-marker"></i> ${highlightKeyword(places.address_name)}`;
    }

    el.innerHTML = itemStr;
    el.className = "item";

    return el;
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

async function getRelatedSite() {
    const result = await callApi("POST", "/front/back/main/related_site.php", {});
    if (!result) return;
    const { statusCode, message, responseData } = result;
    if (!responseData) return;

    const relatedSiteListHtml = responseData.map((item) => `<a target="_blank" href="${item.site_url}" class="swiper-slide"><img src="${item.site_image}" alt="" title=""/></a>`).join("");

    $(".main-partner .swiper-wrapper").html(relatedSiteListHtml);
}

async function getNotice() {
    const result = await callApi("POST", "/front/back/main/notice.php", {});
    if (!result) return;
    const { statusCode, message, responseData } = result;
    if (!responseData) return;

    const newImg = '<img src="/front/assets/image/icn_new02.png" height="20" alt="" title="">';
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const noticeListHtml = responseData
        .map(function (item, index) {
            const regDate = new Date(item.reg_date);
            const isNew = regDate >= oneWeekAgo;
            const titleWithNewImg = isNew ? `${item.title} ${newImg}` : item.title;
            return `
                <li class="swiper-slide">
                    <h2><a href="/front/views/support/notice_view.html?viewNo=${item.notice_no}">${titleWithNewImg}</a></h2>
                    <h3>${item.reg_date}</h3>
                </li>`;
        })
        .join("");

    $(".main-notice .swiper-wrapper").html(noticeListHtml);
}

async function getFaq() {
    const result = await callApi("POST", "/front/back/main/faq.php", {});
    if (!result) return;
    const { statusCode, message, responseData } = result;
    if (!responseData) return;
    const listHtml = responseData
        .map(
            (item) =>
                `<li data-aos="fade-up">
                    <dl>
                        <!-- <dt><i class="fa-regular fa-user"></i></dt> -->
                        <dd class="w-100">
                            <p class="faq-title-box">
                                <span>${item.title}</span>
                                <a href="/front/views/support/faq_view.html?viewNo=${item.faq_no}"><i class="fa-light fa-chevron-right"></i></a>
                            </p>
                            <div class="comtent-clamp content-clamp-3">${item.content}</div>
                        </dd>
                    </dl>
                </li>`
        )
        .join("\n");

    $(".main-faq ul").html(listHtml);
}

/**
 * 부동산 뉴스 가져오는 함수
 */
async function getNews() {
    try {
        const items_per_page = 3;
        const dataObj = {
            items_per_page,
        };
        const url = "/front/back/support/news_list.php";
        const result = await callApi("POST", url, dataObj);
        const { statusCode, message, responseData } = result;

        if (statusCode != 200 && message != "SUCCESS") {
            return;
        }

        const { displasy, items, lastBuildDate, start, total } = responseData;

        let listHtml = "";
        if (items.length > 0) {
            const newImg = '<img src="/front/assets/image/icn_new02.png" height="20" alt="" title="">';
            const today = new Date();
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 7);

            listHtml = items
                .map(function (item, index) {
                    const regDate = new Date(item.pubDate);
                    const isNew = regDate >= oneWeekAgo;
                    const titleWithNewImg = isNew ? `${item.title} ${newImg}` : item.title;
                    const dateSplit = item.pubDate.split(" ");
                    let dateMonth = dateSplit[2];
                    switch (dateMonth) {
                        case "Jan":
                            dateMonth = "01";
                            break;
                        case "Feb":
                            dateMonth = "02";
                            break;
                        case "Mar":
                            dateMonth = "03";
                            break;
                        case "Apr":
                            dateMonth = "04";
                            break;
                        case "May":
                            dateMonth = "05";
                            break;
                        case "Jun":
                            dateMonth = "06";
                            break;
                        case "Jul":
                            dateMonth = "07";
                            break;
                        case "Aug":
                            dateMonth = "08";
                            break;
                        case "Sep":
                            dateMonth = "09";
                            break;
                        case "Oct":
                            dateMonth = "10";
                            break;
                        case "Nov":
                            dateMonth = "11";
                            break;
                        case "Dec":
                            dateMonth = "12";
                            break;
                    }
                    const reg_date = dateSplit[3] + "-" + dateMonth + "-" + dateSplit[1];

                    return `<dl>
                                <dt>
                                    <h2><a target="_blank" href="${item.link}">${titleWithNewImg}</a></h2>
                                    <h3>${reg_date}</h3>
                                </dt>
                                <dd>
                                    <a target="_blank" href="${item.link}"><i class="fa-light fa-chevron-right"></i></a>
                                </dd>
                            </dl>`;
                })
                .join("");
        } else {
            listHtml = `<dl>
                            <dt>
                                <h2><a href="#">부동산 뉴스</a></h2>
                                <h3>2024-05-05</h3>
                            </dt>
                            <dd>
                                <a href="#"><i class="fa-light fa-chevron-right"></i></a>
                            </dd>
                        </dl>`;
        }

        $(".main-news #news_list").html(listHtml);
    } catch (error) {
    } finally {
    }
}

// Debounce 함수 추가
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * 검색 결과를 HTML에 직접 삽입할 때, place_name이나 address_name과 같은 값을 HTML escape 처리하여 XSS 공격을 방지
 * @param {*} unsafe
 * @returns
 */
function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/**
 * 모달 초기화 함수
 */
function initModal() {
    // 모달 - 등록완료
    initializeModal("#modalCompletion", "/front/assets/lottie/completion.json", "#lottieCompletion");
    // // 모달 - 확인완료
    // initializeModal("#modalConfirm", "/front/assets/lottie/completion.json", "#lottieConfirm");
    // 모달 - 실패
    initializeModal("#modalFail", "/front/assets/lottie/failed.json", "#lottieFail");

    // 모달 설정 함수
    function initializeModal(modalId, lottiePath, lottieContainerId) {
        $(modalId).iziModal({ width: "470px" });
        $(modalId).iziModal("setTop", 70);
        $(modalId).iziModal("setBottom", 70);

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
