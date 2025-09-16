$(document).ready(function () {
    const viewNo = getParameter("viewNo");

    if (userInfo()) {
        viewHistoryAdd(viewNo);
    }
    countUp(viewNo);
    initDetail(viewNo);
    initEvents(viewNo);
    favoriteCheck(viewNo);
});

/**
 * 최근 방문 이력 저장 함수
 * @param {*} viewNo
 */
function viewHistoryAdd(viewNo) {
    const type = "find";
    const dataObj = {
        ...userInfo(),
        viewNo: encodeURIComponent(viewNo),
        type: encodeURIComponent(type),
    };

    callApiAbort("/front/back/history/view_history_add.php", "POST", dataObj, "viewHistoryAdd")
        .then((response) => {
            let { responseData, message, statusCode } = response;
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * 조회수 증가 함수
 * @returns
 */
function countUp(viewNo) {
    if (!viewNo) return;

    const dataObj = { viewNo: encodeURIComponent(viewNo) };

    callApiAbort("/front/back/find/count_up.php", "POST", dataObj, "countUp")
        .then((response) => {
            let { responseData, message, statusCode } = response;
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * 상세정보 초기화 함수
 * @returns
 */
function initDetail(viewNo) {
    if (!viewNo) {
        alert("정상적인 접근이 아닙니다.");
        location.href = "/index";
        return;
    }

    const dataObj = { viewNo: encodeURIComponent(viewNo) };

    callApiAbort("/front/back/find/find_view.php", "POST", dataObj, "initDetail")
        .then(async (response) => {
            let { responseData, message, statusCode } = response;

            if (!handleError(message, statusCode)) {
                return;
            }

            if (responseData.length == 0) {
                if (await sweetAlertForReturn("정상적인 접근이 아닙니다.", "", "e")) {
                    location.href = "/front/views/find/find_list";
                }
                return;
            }

            const data = responseData[0];
            $("#address").text(data.sido + " " + (data.sido !== data.sgg ? data.sgg : ""));
            $("#estate_type").text(data.estate_type);
            $("#sale_type").text(`${data.sale_type}`);
            $("#exchange").text(`${data.exchange_fg == "Y" ? "가능" : "불가능"}`);
            $("#price").text(formatPrice(data.min_price) + " ~ " + formatPrice(data.max_price));
            $("#area").text(comma(data.min_area) + "㎡ ~ " + comma(data.max_area) + "㎡");
            $("#phone").text(phoneOnDash(data.phone));
            $("#description").html(data.description.replace(/\n/g, "<br>"));

            // 공유하기 함수
            initShareEvents();
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * 이벤트 초기화 함수
 */
function initEvents(viewNo) {
    // url 복사 버튼 클릭 이벤트
    $("#copy_url_btn").on("click", copyUrl);

    // 찜 버튼 클릭 이벤트
    $("#favorite_btn").on("click", function () {
        const button = $(this);
        toggleFavorite(button, viewNo);
    });

    // 공유 관련 이벤트
    var mapShareChk = 0;
    $("#mapShareOpen").click(function () {
        if (mapShareChk == 0) {
            $("#mapShare").slideDown(200, "easeOutQuad");
            $("#mapShareOpen").addClass("active");
            mapShareChk = 1;
        } else {
            $("#mapShare").slideUp(200, "easeOutQuad");
            $("#mapShareOpen").removeClass("active");
            mapShareChk = 0;
        }
    });

    $("#mapShareClose").click(function () {
        $("#mapShare").slideUp(200, "easeOutQuad");
        $("#mapShareOpen").removeClass("active");
        mapShareChk = 0;
    });
}

/**
 * 즐겨찾기 토글 함수
 */
function toggleFavorite(button, viewNo) {
    if (button.hasClass("active")) {
        favoriteCancel(viewNo);
    } else {
        favoriteRegister(viewNo);
    }
}

/**
 * 즐겨찾기 확인 함수
 * @returns
 */
async function favoriteCheck(viewNo) {
    if (!userInfo()) return;
    if (!viewNo) return;

    const dataObj = {
        ...userInfo(),
        viewNo: encodeURIComponent(viewNo),
        type: encodeURIComponent("find"),
    };

    callApiAbort("/front/back/favorite/favorite_check.php", "POST", dataObj, "favoriteCheck")
        .then((response) => {
            if (!response) return;

            let { responseData, message, statusCode } = response;
            if (statusCode !== 200) return;
            if (responseData && responseData.cnt > 0) {
                $("#favorite_btn").addClass("active");
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * 즐겨찾기 등록 함수
 * @returns
 */
async function favoriteRegister(viewNo) {
    if (!userInfo()) {
        const alertResult = await sweetAlertForReturn("로그인 후 시도해주세요.");
        if (alertResult) {
            // 로그인 모달 열기
            const url = "/front/views/00-include/login.html";
            ajaxLoad(url);
        }
        return;
    }

    if (!viewNo) return;

    const dataObj = {
        ...userInfo(),
        viewNo: encodeURIComponent(viewNo),
        type: encodeURIComponent("find"),
    };

    callApiAbort("/front/back/favorite/favorite_register.php", "POST", dataObj, "favoriteRegister")
        .then((response) => {
            if (!response) {
                sweetAlertMessage("다시 시도해주세요.");
                return;
            }

            const { responseData, message, statusCode } = response;
            if (statusCode !== 200) return;

            sweetAlertMessage("찜 등록되었습니다.", "", "s");
            $("#favorite_btn").addClass("active");
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * 즐겨찾기 취소 함수
 * @returns
 */
async function favoriteCancel(viewNo) {
    if (!viewNo) return;

    const dataObj = {
        ...userInfo(),
        viewNo: encodeURIComponent(viewNo),
        type: encodeURIComponent("find"),
    };

    callApiAbort("/front/back/favorite/favorite_cancel.php", "POST", dataObj, "favoriteCancel")
        .then((response) => {
            if (!response) {
                sweetAlertMessage("다시 시도해주세요.");
                return;
            }

            const { responseData, message, statusCode } = response;
            if (statusCode !== 200) return;

            sweetAlertMessage("해제되었습니다.", "", "s");
            $("#favorite_btn").removeClass("active");
        })
        .catch((error) => {
            console.log(error);
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
            sweetAlertMessage("URL이 클립보드에 복사되었습니다.", "", "s");
        })
        .catch(function (error) {
            console.log("복사 실패: " + error);
        });
}

/**
 * 공유 관련 이벤트 초기화 함수
 */
function initShareEvents() {
    Kakao.init("847d6b0bbbc2dbfe6b7c0c1f82d8cd71");
    const logoSrc = `${window.location.origin + (location.port ? ":" + location.port : "")}/front/assets/image/favicon.png`;
    const title = `[구합니다] #토디 #구합니다 #부동산\n${$("#address").text()} ${$("#estate_type").text()} ${$("#sale_type").text()}\n${$("#price").text()}\n${$("#area").text()}`;
    const currentUrl = location.href;
    console.log(currentUrl);

    Kakao.Share.createDefaultButton({
        container: "#kakaotalk_sharing_btn",
        objectType: "text",
        text: title,
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
 * 에러 처리 함수
 */
function handleError(message, statusCode) {
    switch (statusCode) {
        case 400:
            sweetAlertMessage(message, "", "e");
            return false;
            break;
        case 404:
            sweetAlertMessage("문제가 발생했습니다. ", "", "e");
            return false;
            break;
        case 500:
            sweetAlertMessage("문제가 발생했습니다. ", "", "e");
            return false;
            break;
        default:
            // resolve(responseJSON);
            return true;
            break;
    }
}
