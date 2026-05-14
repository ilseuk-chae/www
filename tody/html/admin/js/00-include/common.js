$(document).ready(function () {
    // waves.js 초기화
    Waves.init();
    Waves.attach(".waves-effect");

    // app.js 동적 로드
    var script = document.createElement("script");
    script.src = "/assets/js/app.js?v=" + new Date().getTime();
    document.body.appendChild(script);

    // 메뉴 카운트 스타일 재적용
    applyMenuStyles();

    // 로그인 상태이면 중복 접속 감시 시작
    const sessionToken = getCookie("sa_session_token");
    if (sessionToken) {
        startAdminSessionPolling(sessionToken);
    }
});

// ──────────────────────────────────────────────────────────────────
// 중복 접속 감시: 30초마다 세션 상태 확인
// ──────────────────────────────────────────────────────────────────
let _adminSessionPollTimer = null;

function startAdminSessionPolling(sessionToken) {
    if (_adminSessionPollTimer) return; // 이미 실행 중

    _adminSessionPollTimer = setInterval(async function () {
        try {
            const result = await callApi("POST", "/admin/back/00-include/session_check.php", {
                session_token: sessionToken,
            });
            if (result && result.message === 'FORCED_LOGOUT') {
                clearInterval(_adminSessionPollTimer);
                await Swal.fire({
                    title:             '접속이 종료되었습니다',
                    html:              '다른 곳에서 로그인하여 현재 세션이 종료됩니다.',
                    icon:              'warning',
                    confirmButtonText: '확인',
                    allowOutsideClick: false,
                });
                adminLogout();
            }
        } catch (e) {
            // 네트워크 오류는 무시
        }
    }, 30000); // 30초
}

function adminLogout() {
    const sessionToken = getCookie("sa_session_token");

    // DB 세션 삭제
    if (sessionToken) {
        const data = new FormData();
        data.append("session_token", sessionToken);
        navigator.sendBeacon("/admin/back/00-include/logout.php", data);
    }

    deleteCookie("sa_no");
    deleteCookie("sa_token");
    deleteCookie("sa_cont_no");
    deleteCookie("sa_cont_token");
    deleteCookie("sa_name");
    deleteCookie("sa_per_no");
    deleteCookie("sa_session_token");
    location.href = "/admin/index";
}

$(document).on('click', '.nav-link', function () {
    applyMenuStyles(); // 메뉴 클릭 후 스타일 재적용
});

/**
 * 메뉴 스타일 재적용 함수
 */
function applyMenuStyles() {
    const $menuCountBadges = $('.menu-count-badge');
    $menuCountBadges.each(function () {
        const $badge = $(this);
        const textContent = $badge.text().trim(); // 요소의 텍스트 내용 확인
        if (textContent !== '') {
            forceStyleUpdate($badge); // 텍스트가 있는 경우에만 스타일 강제 적용
        } else {
            $badge.css({
                display: 'none', // 텍스트가 없으면 숨김 처리
            });
        }
    });
}

$(document).on('click', '.nav-link', function () {
    applyMenuStyles(); // 메뉴 클릭 후 스타일 재적용
});

/**
 * 쿠키에서 관리자 정보 가져오는 함수
 * @returns
 */
function adminUserInfo() {
    const userInfo = {
        sa_no: getCookie("sa_no"),
        sa_name: getCookie("sa_name"),
        sa_cont_no: getCookie("sa_cont_no"),
        sa_cont_token: getCookie("sa_cont_token"),
        sa_token: getCookie("sa_token"),
    };

    // 모든 속성이 유효한지 확인
    for (let key in userInfo) {
        if (!userInfo[key]) {
            alert("로그인 정보가 확인되지 않습니다. 다시 로그인 해주세요.");
            location.href = "/admin/index";

            return false;
        }
    }

    return userInfo;
}

/**
 * 메뉴 리스트 가져오는 함수
 * @param {*} rcvUserInfo = 유저 정보
 */
async function getMenuInfo(rcvUserInfo) {
    const userInfo = rcvUserInfo;

    const result = await callApi("POST", "/admin/back/00-include/menu_info_get.php", userInfo);

    if (!result) return;

    const menu = $("#navbar-nav");

    const { status, message, responseData } = result;

    let menuHtml = `<li class="menu-title"><span data-key="t-menu">메뉴</span></li>`;

    //let combinedHtml = "";
    //responseData
    //    .map(function (item) {
    // v2_mode 활성화 시 _v2 버전으로 자동 전환할 페이지 목록
    const _v2SupportedPages = [
        're_listings',
        're_listings_deleted',
        're_put',
        're_wanted',
    ];
    // v2_mode 활성화 시 해당 링크를 _v2 버전으로 반환
    const resolveMenuLink = (link) => {
        if (typeof v2_mode !== 'undefined' && v2_mode && _v2SupportedPages.includes(link)) {
            return link + '_v2';
        }
        return link;
    };
    // v2_mode 활성화 시 해당 메뉴 타이틀에 '2' 접미사 추가
    const resolveMenuTitle = (link, title) => {
        if (typeof v2_mode !== 'undefined' && v2_mode && _v2SupportedPages.includes(link)) {
            //return title + '2';
            return title;
        }
        return title;
    };

    const combinedHtmlArray = responseData.map(function (item) {
            const { menu_class, menu_sub_cd, menu_title_link, menu_title, menu_icon } = item;

            // 메뉴 타이틀 배열로 변환
            //const subCodes = menu_sub_cd.split(",");
            //const titles = menu_title.split(",");
            //const links = menu_title_link.split(",");

            // 메뉴 타이틀, 링크, 서브코드 배열로 변환 (null/undefined 처리 및 공백 제거, 빈 문자열 제거)
            const subCodes = menu_sub_cd ? menu_sub_cd.split(",").map(s => s.trim()).filter(s => s) : [];
            const titles = menu_title ? menu_title.split(",").map(s => s.trim()).filter(s => s) : [];
            const links = menu_title_link ? menu_title_link.split(",").map(s => s.trim()).filter(s => s) : [];

            let html = "";
            // 하위 항목이 있는 메뉴는 하위 메뉴 생성
            // titles 배열의 길이가 1보다 크면 하위 메뉴가 있는 것으로 간주
            //if (subCodes.length != 1) {
            if (titles.length > 1) {
                // 첫 번째 링크 값을 사용
                //const firstLink = links[0];
                //const firstTitle = titles[0];
                // 첫 번째 항목은 상위 메뉴 (예: "제휴/제안 관리")
                const firstLink = links.length > 0 ? links[0] : '';
                const firstTitle = titles.length > 0 ? titles[0] : '';

                if (!firstLink) { // 링크가 없으면 해당 메뉴 항목 생성 건너뛰기
                    //console.warn("상위 메뉴 링크가 없어 해당 메뉴 항목을 건너뜁니다:", item);
                    return "";
                }

                //html += `
                //<li class="nav-item">
                //    <a class="nav-link menu-link" href="#sidebar_${firstLink}" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebar_${firstLink}">
                //        ${menu_icon}
                //        <span data-key="t-${firstLink}">${firstTitle}</span>
                //    </a>
                //    <div class="collapse menu-dropdown" id="sidebar_${firstLink}">
                //        <ul class="nav nav-sm flex-column">
                //`;
                //  '제휴/제안 관리' 상위 메뉴 뒤에 span 추가 
                 // 상위 메뉴에 개수 표시 span 추가 (ID 부여)
                 // 상위 메뉴 뒤에 ID가 부여된 span 추가 
                const topLevelCountSpan = ((firstTitle === '제휴/제안 관리') || (firstTitle === '회원 관리')) ?
                    `<span class="menu-count-badge" id="count-for-${firstLink}"></span>` : '';
                html += `
                <li class="nav-item">
                    <a class="nav-link menu-link" href="#sidebar_${firstLink}" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebar_${firstLink}">
                        ${menu_icon || ''}
                        <span data-key="t-${firstLink}">${firstTitle}</span>
                        ${topLevelCountSpan} 
                    </a>
                    <div class="collapse menu-dropdown" id="sidebar_${firstLink}">
                        <ul class="nav nav-sm flex-column">
                 `;

                // 서브 메뉴 항목 추가
                // 나머지 항목은 하위 메뉴 (인덱스 1부터 시작)
                // 예: titles[1] = "제휴 관리", titles[2] = "제안 관리"
                //for (let i = 1; i < subCodes.length; i++) {
                //    // 첫 항목은 이미 사용되었으므로 1부터 시작
                //    html += `
                //    <li class="nav-item">
                //        <a href="/admin/views/${firstLink}/${links[i]}.html" class="nav-link" data-key="t-${links[i]}"> ${titles[i]} </a>
                //    </li>
                //    `;
                //}

                for (let i = 1; i < titles.length; i++) {
                    const subLink = links.length > i ? links[i] : '';
                    const subTitle = titles.length > i ? titles[i] : '';
                    // v2_mode에 따라 링크 자동 전환
                    const resolvedSubLink = resolveMenuLink(subLink);
                    const resolvedSubTitle = resolveMenuTitle(subLink, subTitle);

                     // 하위 메뉴 링크가 유효한 경우에만 HTML 생성
                    if (subLink) { // 링크가 있어야 유효한 메뉴 항목
                       // 하위 메뉴에 개수 표시 span 추가 (ID 부여)
                       const subMenuCountSpan = ((subTitle === '제휴 관리' && subLink === 'col_partnership') || (subTitle === '제안 관리' && subLink === 'col_proposal') || (subTitle === '중개사 회원' && subLink === 'realtor')) ?
                            `<span class="menu-count-badge" id="count-for-${subLink}"></span>` : ''; // 링크를 ID의 일부로 사용

                       html += `
                        <li class="nav-item">
                            <a href="/admin/views/${firstLink}/${resolvedSubLink}.html" class="nav-link" data-key="t-${subLink}">
                                ${resolvedSubTitle}
                                ${subMenuCountSpan}
                            </a>
                        </li>
                        `;
                    } else {
                         console.warn(`상위 메뉴 "${firstTitle}"의 ${i}번째 하위 메뉴 링크가 없어 건너뜁니다:`, item);
                    }
                }

                // HTML 구조 마무리
                html += `
                        </ul>
                    </div>
                </li>
                `;
            // } else {
            //     // 하위 항목이 없는 메뉴는 하위 메뉴 생성X
            //     html += `
            //    <li class="nav-item">
            //        <a class="nav-link menu-link" href="/admin/views/${menu_title_link}/${menu_title_link}.html">
            //            ${menu_icon}
            //            <span data-key="t-${menu_title_link}">${menu_title}</span> 
            //        </a>
            //    </li>
            //    `;
            //}
            } else if (titles.length === 1) { // 하위 메뉴가 없는 단일 메뉴 항목 처리 (기존 로직 유지)
                const singleLink = links.length > 0 ? links[0] : '';
                const singleTitle = titles.length > 0 ? titles[0] : '';
                // v2_mode에 따라 링크 자동 전환
                const resolvedSingleLink = resolveMenuLink(singleLink);
                const resolvedSingleTitle = resolveMenuTitle(singleLink, singleTitle);

                // 단일 메뉴 링크가 유효한 경우에만 HTML 생성
                // 만약 단일 메뉴 항목이 '제휴 관리' 또는 '제안 관리'일 경우 (참고용)
                if (singleLink) { // 링크가 있어야 유효한 메뉴 항목
                     // 단일 메뉴에 개수 표시 span 추가 (ID 부여)
                    const singleMenuCountSpan = ((singleTitle === '제휴 관리' && singleLink === 'col_partnership') || (singleTitle === '제안 관리' && singleLink === 'col_proposal') || (singleTitle === '중개사 회원' && singleLink === 'realtor')) ?
                        `<span class="menu-count-badge" id="count-for-${singleLink}"></span>` : ''; // 링크를 ID의 일부로 사용
                    html += `
                        <li class="nav-item">
                            <a class="nav-link menu-link" href="/admin/views/${resolvedSingleLink}/${resolvedSingleLink}.html">
                                ${menu_icon || ''}
                                <span data-key="t-${singleLink}">${resolvedSingleTitle}</span>
                                ${singleMenuCountSpan}
                            </a>
                        </li>
                    `;
                } else {
                    console.warn("단일 메뉴 링크가 없어 해당 메뉴 항목을 건너뜁니다:", item);
                }
            }
            // titles.length가 0인 경우는 HTML을 생성하지 않음
            return html;

            // 생성된 HTML을 합침
            //combinedHtml += html;
        })
    //    .join(""); // join을 사용하여 배열을 하나의 문자열로 합침

    // 생성된 모든 HTML을 하나의 문자열로 합침
    menuHtml += combinedHtmlArray.join("");
    //menuHtml += combinedHtml;

    // 최종적으로 합쳐진 HTML을 원하는 요소에 삽입
    menu.html(menuHtml);
    
    updateMenuCounts(userInfo) 
    
}

// --- 개수를 가져와서 업데이트하는 별도의 JavaScript 함수 예시 ---
async function updateMenuCounts(rcvUserInfo) {
    const userInfo = rcvUserInfo;
    
    const counts = {
        'col_manage': 0, // '제휴/제안 관리' 전체 개수 (필요하다면)
        'col_partnership': 0, // '제휴 관리' 개수
        'col_proposal': 0, // '제안 관리' 개수
        'user_manage': 0, // '회원관리' 전체 개수
        'realtor': 0, // '중개사 회원' 개수
    };
    // 1. 각 메뉴 항목에 해당하는 개수를 서버 등에서 비동기적으로 가져옵니다.
    // *** 중요: 서버에 이 경로로 요청을 받아 view_count가 0인 proposal_master 행 수를 세어 JSON 형태로 반환하는 스크립트가 필요합니다. ***
    const apiEndpointForProposalCount = "/admin/back/06-collaboration/proposal_count.php"; 
    
    // 서버에 전달할 데이터 (예: 사용자 인증 정보 등, 필요 없다면 빈 객체 {})
    let requestData = {}; // 서버 스크립트에서 특정 조건이 필요하다면 추가
    try {
        // callApi 함수를 사용하여 서버 API 호출
        const result = await callApi("POST", apiEndpointForProposalCount, userInfo);

        // API 응답 확인 및 데이터 추출
        if (result && typeof result === 'object' && result.statusCode === 200 && result.responseData !== undefined) {
            // 서버 응답 형식에 따라 개수 정보를 추출하는 방식을 수정해야 합니다.
            const unseenProposalCount = result.responseData.unseenCount;

            if (unseenProposalCount !== undefined && unseenProposalCount !== null) {
                counts['col_proposal']= unseenProposalCount;
            } else {
            }

        } else {
            //console.error("API 호출 실패 또는 응답 상태 오류:", result);
            //console.error("서버 메시지:", result ? result.message : "응답 메시지 없음");
        }

    } catch (error) {
        //console.error("'제안 관리' 개수 API 호출 중 예외 발생:", error);
    }
    // *** 중요: 서버에 이 경로로 요청을 받아 view_count가 0인 partnershipl_master 행 수를 세어 JSON 형태로 반환하는 스크립트가 필요합니다. ***
    const apiEndpointForPartnershipCount = "/admin/back/06-collaboration/partnership_count.php"; 
    
    // 서버에 전달할 데이터 (예: 사용자 인증 정보 등, 필요 없다면 빈 객체 {})
    requestData = {}; // 서버 스크립트에서 특정 조건이 필요하다면 추가
    try {
        // callApi 함수를 사용하여 서버 API 호출
        const result = await callApi("POST", apiEndpointForPartnershipCount, userInfo);

        // API 응답 확인 및 데이터 추출
        if (result && typeof result === 'object' && result.statusCode === 200 && result.responseData !== undefined) {
            // 서버 응답 형식에 따라 개수 정보를 추출하는 방식을 수정해야 합니다.
            const unseenPartnershipCount = result.responseData.unseenCount;

            if (unseenPartnershipCount !== undefined && unseenPartnershipCount !== null) {
                counts['col_partnership']= unseenPartnershipCount;
            } else {
                 //console.error("API 응답 형식 오류: responseData에 예상된 개수 정보가 없습니다.", result.responseData);
            }
        } else {
            //console.error("API 호출 실패 또는 응답 상태 오류:", result);
            //console.error("서버 메시지:", result ? result.message : "응답 메시지 없음");
        }

    } catch (error) {
        //console.error("'제휴 관리' 개수 API 호출 중 예외 발생:", error);
    }
    // '제휴/제안 관리' 전체 개수 계산 
    counts['col_manage'] = counts['col_proposal'] + counts['col_partnership']
     
    const apiEndpointForRealtorCount = "/admin/back/02-member/member_list_realtor_count.php"; 
   
    // 서버에 전달할 데이터 (예: 사용자 인증 정보 등, 필요 없다면 빈 객체 {})
    requestData = {}; // 서버 스크립트에서 특정 조건이 필요하다면 추가
    try {
        // callApi 함수를 사용하여 서버 API 호출
        const result = await callApi("POST", apiEndpointForRealtorCount, userInfo);

        // API 응답 확인 및 데이터 추출
        if (result && typeof result === 'object' && result.statusCode === 200 && result.responseData !== undefined) {
            const waitingReatorCount = result.responseData.waitingCount;

            if (waitingReatorCount !== undefined && waitingReatorCount !== null) {
                counts['realtor']= waitingReatorCount;
            } else {
                 //console.error("API 응답 형식 오류: responseData에 예상된 개수 정보가 없습니다.", result.responseData);
            }

        } else {
            //console.error("API 호출 실패 또는 응답 상태 오류:", result);
            //console.error("서버 메시지:", result ? result.message : "응답 메시지 없음");
        }

    } catch (error) {
        //console.error("'중개사 승인대기' 개수 API 호출 중 예외 발생:", error);
    }
    
    // '회원 관리-중개사승인대기' 전체 개수 계산 (일반,금융회원은 승인 불필요)
    counts['user_manage'] = counts['realtor'] 

    // 2. 가져온 개수를 바탕으로 해당하는 span 요소를 찾아 내용을 업데이트합니다.
    // '제휴/제안 관리' 상위 메뉴 개수 업데이트
    const $topLevelCollSpan = $('#count-for-col_manage'); // 고유 ID로 선택
    if ($topLevelCollSpan.length && counts['col_manage'] !== undefined) {
         if (counts['col_manage'] > 0) {
            $topLevelCollSpan.text(counts['col_manage']);
            $topLevelCollSpan.show(); // 개수가 0보다 크면 보이게 함
            //$topLevelCollSpan[0].offsetHeight; 
            //$topLevelCollSpan.css('display');
            forceStyleUpdate($topLevelCollSpan); // 강제 스타일 업데이트
         } else {
            $topLevelCollSpan.text(''); // 텍스트 제거
            $topLevelCollSpan.hide(); // 개수가 0이면 숨김
            $topLevelCollSpan.css('display', 'none'); // 명시적으로 display: none 설정
         }
    }

     // '제휴 관리' 서브 메뉴 개수 업데이트
    const $partnershipSpan = $('#count-for-col_partnership'); // 고유 ID로 선택
     if ($partnershipSpan.length && counts['col_partnership'] !== undefined) {
         if (counts['col_partnership'] > 0) {
            $partnershipSpan.text(counts['col_partnership']);
            $partnershipSpan.show();
            //$partnershipSpan[0].offsetHeight; 
            //$partnershipSpan.css('display');
            forceStyleUpdate($partnershipSpan); // 강제 스타일 업데이트
         } else {
            $partnershipSpan.text(''); // 텍스트 제거
            $partnershipSpan.hide();
            $partnershipSpan.css('display', 'none'); // 명시적으로 display: none 설정
         }
    }

    // '제안 관리' 서브 메뉴 개수 업데이트
    const $proposalSpan = $('#count-for-col_proposal'); // 고유 ID로 선택
    if ($proposalSpan.length && counts['col_proposal'] !== undefined) {
         if (counts['col_proposal'] > 0) {
            $proposalSpan.text(counts['col_proposal']);
            $proposalSpan.show();
            //$proposalSpan[0].offsetHeight; 
            //$proposalSpan.css('display');
            forceStyleUpdate($proposalSpan); // 강제 스타일 업데이트
         } else {
            $proposalSpan.text(''); // 텍스트 제거
            $proposalSpan.hide();
            $proposalSpan.css('display', 'none'); // 명시적으로 display: none 설정
         }
    }

    // '회원 관리' 상위 메뉴 개수 업데이트
    const $topLevelUserSpan = $('#count-for-user_manage'); // 고유 ID로 선택
    if ($topLevelUserSpan.length && counts['user_manage'] !== undefined) {
         if (counts['user_manage'] > 0) {
            $topLevelUserSpan.text(counts['user_manage']);
            $topLevelUserSpan.show(); // 개수가 0보다 크면 보이게 함
            //$topLevelUserSpan[0].offsetHeight; 
            //$topLevelUserSpan.css('display');
            forceStyleUpdate($topLevelUserSpan); // 강제 스타일 업데이트
         } else {
            $topLevelUserSpan.text(''); // 텍스트 제거
            $topLevelUserSpan.hide(); // 개수가 0이면 숨김
            $topLevelUserSpan.css('display', 'none'); // 명시적으로 display: none 설정
         }
    }

     // '중개사회원' 서브 메뉴 개수 업데이트
    const $realtorSpan = $('#count-for-realtor'); // 고유 ID로 선택
     if ($realtorSpan.length && counts['realtor'] !== undefined) {
         if (counts['realtor'] > 0) {
            $realtorSpan.text(counts['realtor']);
            $realtorSpan.show();
            //$realtorSpan[0].offsetHeight; 
            //$realtorSpan.css('display');
            forceStyleUpdate($realtorSpan); // 강제 스타일 업데이트
         } else {
            $realtorSpan.text(''); // 텍스트 제거
            $realtorSpan.hide();
            $realtorSpan.css('display', 'none'); // 명시적으로 display: none 설정
         }
    }

    // 스타일 강제 적용 로직 추가
//    const $menuCountBadges = $('.menu-count-badge');
//    $menuCountBadges.each(function () {
//        forceStyleUpdate($(this)); // 모든 메뉴 카운트 배지에 스타일 강제 적용
//    });

    const activeLink = $("#navbar-nav").find("a.nav-link.active")[0];
    openParentMenus(activeLink)
}

/**
 * 강제 스타일 업데이트 함수
 * @param {jQuery} $element - 스타일을 업데이트할 jQuery 요소
 */
function forceStyleUpdate($element) {
    const textContent = $element.text().trim(); // 요소의 텍스트 내용 확인
    if ($element.length && textContent !== '') { // 텍스트가 비어있지 않은 경우에만 스타일 적용
        $element.css({
            display: 'inline-block',
            minWidth: '1.5em',
            height: '1.5em',
            lineHeight: '1.5em',
            borderRadius: '50%', // 원형으로 설정
            backgroundColor: '#dc3545',
            color: 'white',
            textAlign: 'center',
            fontSize: '0.8em',
            padding: '0', // 원형 형태를 유지하기 위해 패딩 제거
            boxSizing: 'border-box',
            verticalAlign: 'middle',
        });
    } else {
        $element.css({
            display: 'none', // 텍스트가 없으면 숨김 처리
        });
    }
}
function logout() {
    const sessionToken = getCookie("sa_session_token");

    if (sessionToken) {
        const data = new FormData();
        data.append("session_token", sessionToken);
        navigator.sendBeacon("/admin/back/00-include/logout.php", data);
    }

    try {
        deleteCookie("sa_cont_no");
        deleteCookie("sa_cont_token");
        deleteCookie("sa_name");
        deleteCookie("sa_no");
        deleteCookie("sa_per_no");
        deleteCookie("sa_token");
        deleteCookie("sa_session_token");
    } catch (error) {
    } finally {
        location.href = "/admin/index.html";
    }
}

/**
 * 주어진 메뉴 링크 요소의 부모 .collapse.menu-dropdown 메뉴를 모두 펼칩니다.
 * @param {Element} activeLinkElement - 현재 활성화된 a.nav-link DOM 요소
 */
function openParentMenus(activeLinkElement) {
    if (!activeLinkElement) {
        //console.warn("openParentMenus: 활성화된 링크 요소가 없습니다.");
        return;
    }
     console.log("openParentMenus 시작: 부모 메뉴 펼치기", activeLinkElement);

    // 현재 활성화된 링크의 가장 가까운 부모 .collapse.menu-dropdown 요소를 찾습니다.
    let parentCollapse = activeLinkElement.closest('.collapse.menu-dropdown');

    // 부모 collapse 요소가 있는 동안 반복합니다.
    while (parentCollapse) {
        console.log("openParentMenus: 다음 부모 collapse 찾음", parentCollapse);
        // Bootstrap의 'show' 클래스를 추가하여 메뉴를 펼칩니다.
        parentCollapse.classList.add('show');

        // 이 collapse를 제어하는 토글러 (보통 이전 형제 요소인 a.nav-link)를 찾습니다.
        const toggler = parentCollapse.previousElementSibling;
        if (toggler && toggler.classList.contains('menu-link')) {
             console.log("openParentMenus: 해당 collapse의 토글러 찾음", toggler);
            // 토글러에도 'active' 클래스를 추가하고 aria-expanded를 true로 설정합니다.
            toggler.classList.add('active');
            toggler.setAttribute('aria-expanded', 'true');
        } else {
             console.warn("openParentMenus: 해당 collapse의 토글러(menu-link)를 찾을 수 없습니다.", parentCollapse);
        }

        // 현재 collapse 요소의 부모 li 요소를 찾습니다.
        const parentLi = parentCollapse.parentElement;
        if (parentLi) {
            // 이 부모 li의 상위 조상 중에서 다음 .collapse.menu-dropdown 요소를 찾습니다.
            parentCollapse = parentLi.closest('.collapse.menu-dropdown');
        } else {
            // 더 이상 부모 li가 없으면 반복을 종료합니다.
            parentCollapse = null;
             console.log("openParentMenus: 더 이상 부모 li가 없습니다.");
        }
    }
     console.log("openParentMenus 종료");
}