$(function () {
    // 로그인 상태이면 중복 접속 감시 시작
    const sessionToken = getCookie("user_session_token");
    if (sessionToken) {
        startFrontSessionPolling(sessionToken);
    }
});

// ──────────────────────────────────────────────────────────────────
// 중복 접속 감시: 30초마다 세션 상태 확인
// ──────────────────────────────────────────────────────────────────
let _frontSessionPollTimer = null;

function startFrontSessionPolling(sessionToken) {
    if (_frontSessionPollTimer) return;

    _frontSessionPollTimer = setInterval(async function () {
        try {
            const result = await callApi("POST", "/front/back/00-include/session_check.php", {
                session_token: sessionToken,
            });
            if (result && result.message === 'FORCED_LOGOUT') {
                clearInterval(_frontSessionPollTimer);
                await Swal.fire({
                    title:             '접속이 종료되었습니다',
                    html:              '다른 곳에서 로그인하여 현재 세션이 종료됩니다.',
                    icon:              'warning',
                    confirmButtonText: '확인',
                    allowOutsideClick: false,
                });
                logout();
            }
        } catch (e) {
            // 네트워크 오류는 무시
        }
    }, 30000); // 30초
}

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
    const sessionToken = getCookie("user_session_token");

    // DB 세션 삭제 (비동기이지만 navigator.sendBeacon으로 페이지 이동 후에도 전송 보장)
    if (sessionToken) {
        const data = new FormData();
        data.append("session_token", sessionToken);
        navigator.sendBeacon("/front/back/00-include/logout.php", data);
    }

    try {
        deleteCookie("user_name");
        deleteCookie("user_no");
        deleteCookie("user_role");
        deleteCookie("user_token");
        deleteCookie("naver_token");
        deleteCookie("user_id");
        deleteCookie("user_session_token");

        if (typeof currentUserId !== 'undefined') currentUserId = null;
        if (typeof startVisitTracking === 'function') startVisitTracking();

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
