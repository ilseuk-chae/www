$(function () {
    // // waves.js 초기화
    // Waves.init();
    // Waves.attach(".waves-effect");
});

/**
 * 쿠키에서 사용자 정보 가져오는 함수
 * @returns
 */
function userInfo() {
    const userInfo = {
        user_no: getCookie("user_no"),
        user_token: getCookie("user_token"),
        user_name: getCookie("user_name"),
        user_role: getCookie("user_role"),
        user_id: getCookie("user_id"),
    };

    // 모든 속성이 유효한지 확인
    for (let key in userInfo) {
        if (!userInfo[key]) {
            // console.log("회원정보 없음");
            return false;
        }
    }

    return userInfo;
}

function logout() {
    try {
        deleteCookie("user_name");
        deleteCookie("user_no");
        deleteCookie("user_role");
        deleteCookie("user_token");
        deleteCookie("naver_token");
        deleteCookie("user_id");
        
        console.log('client.js: User logged out.');
        currentUserId = null; // userId 초기화
        
        // 로그아웃 후에도 비회원(guest)으로 추적은 계속
        // 주기 업데이트가 자동으로 userId: null로 업데이트할 것
        startVisitTracking(); // (필요시 호출, currentUserId 변경사항 반영)

    } catch (error) {
    } finally {
        location.href = "/index.html";
    }
}

/**
 * 서브 메뉴 불러오는 함수
 * @returns
 */
async function initMenu(user = userInfo()) {
    let result = null
    try {

        if(v2_mode) {
            result = await callApi("POST", "/front/back/mypage/menu_list_v2.php", user);
        }
        else {
            result = await callApi("POST", "/front/back/mypage/menu_list.php", user);
        }
    } catch (e) {
        console.error(e);
        return;
    }
    if (!result) return;
    const { statusCode, message, responseData } = result;
    if (!responseData) return;

    if (!result || !result.responseData) return;

    const menuListHtml = result.responseData.menu;
    $(".sub-menu").html(menuListHtml);
    // 현재 페이지 URL 추출 (확장자가 있으면 제거)
    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .replace(/\.[^/.]+$/, "");

    // 현재 페이지와 일치하는 링크에 'active' 클래스 추가
    $(".sub-menu a").each(function () {
        const hrefAttr = $(this).attr("href");
        if (!hrefAttr) return;

        const href = hrefAttr
            .split("/")
            .pop()
            .replace(/\.[^/.]+$/, "");

        if (href === currentPage) {
            $(this).addClass("active");
        }
    });
}
