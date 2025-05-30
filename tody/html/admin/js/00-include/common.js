$(function () {
    // waves.js 초기화
    Waves.init();
    Waves.attach(".waves-effect");
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
                const topLevelCountSpan = (firstTitle === '제휴/제안 관리') ?
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
    
                     // 하위 메뉴 링크가 유효한 경우에만 HTML 생성
                    if (subLink) { // 링크가 있어야 유효한 메뉴 항목
                       // 하위 메뉴에 개수 표시 span 추가 (ID 부여)
                       const subMenuCountSpan = ((subTitle === '제휴 관리' && subLink === 'col_partnership') || (subTitle === '제안 관리' && subLink === 'col_proposal')) ?
                            `<span class="menu-count-badge" id="count-for-${subLink}"></span>` : ''; // 링크를 ID의 일부로 사용

                       html += `
                        <li class="nav-item">
                            <a href="/admin/views/${firstLink}/${subLink}.html" class="nav-link" data-key="t-${subLink}">
                                ${subTitle}
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

                // 단일 메뉴 링크가 유효한 경우에만 HTML 생성
                // 만약 단일 메뉴 항목이 '제휴 관리' 또는 '제안 관리'일 경우 (참고용) 
                if (singleLink) { // 링크가 있어야 유효한 메뉴 항목
                     // 단일 메뉴에 개수 표시 span 추가 (ID 부여)
                    const singleMenuCountSpan = ((singleTitle === '제휴 관리' && singleLink === 'col_partnership') || (singleTitle === '제안 관리' && singleLink === 'col_proposal')) ?
                        `<span class="menu-count-badge" id="count-for-${singleLink}"></span>` : ''; // 링크를 ID의 일부로 사용
                    html += `
                        <li class="nav-item">
                            <a class="nav-link menu-link" href="/admin/views/${singleLink}/${singleLink}.html">
                                ${menu_icon || ''}
                                <span data-key="t-${singleLink}">${singleTitle}</span>
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
        'col_proposal': 0 // '제안 관리' 개수
    };
    // 1. 각 메뉴 항목에 해당하는 개수를 서버 등에서 비동기적으로 가져옵니다.
    //console.log("updateMenuCounts 시작: 메뉴별 개수 가져오기");
    // *** 중요: 서버에 이 경로로 요청을 받아 view_count가 0인 proposal_master 행 수를 세어 JSON 형태로 반환하는 스크립트가 필요합니다. ***
    const apiEndpointForProposalCount = "/admin/back/06-collaboration/proposal_count.php"; 
    
    // 서버에 전달할 데이터 (예: 사용자 인증 정보 등, 필요 없다면 빈 객체 {})
    let requestData = {}; // 서버 스크립트에서 특정 조건이 필요하다면 추가
    try {
        // callApi 함수를 사용하여 서버 API 호출
        const result = await callApi("POST", apiEndpointForProposalCount, userInfo);

        // API 응답 확인 및 데이터 추출
        //if (result && result.message === 'success' && result.responseData !== undefined) {
        if (result && typeof result === 'object' && result.statusCode === 200 && result.responseData !== undefined) {
            // 서버 응답 형식에 따라 개수 정보를 추출하는 방식을 수정해야 합니다.
            const unseenProposalCount = result.responseData.unseenCount;

            if (unseenProposalCount !== undefined && unseenProposalCount !== null) {
                //console.log(`서버 API로부터 가져온 '제안 관리' (col_proposal) 개수: ${unseenProposalCount}`);
                counts['col_proposal']= unseenProposalCount;
            } else {
                 //console.error("API 응답 형식 오류: responseData에 예상된 개수 정보가 없습니다.", result.responseData);
            }

        } else {
            //console.error("API 호출 실패 또는 응답 상태 오류:", result);
            //console.error("서버 메시지:", result ? result.message : "응답 메시지 없음");
        }

    } catch (error) {
        //console.error("'제안 관리' 개수 API 호출 중 예외 발생:", error);
    }
    //console.log("updateMenuCounts 시작: 메뉴별 개수 가져오기");
    // *** 중요: 서버에 이 경로로 요청을 받아 view_count가 0인 proposal_master 행 수를 세어 JSON 형태로 반환하는 스크립트가 필요합니다. ***
    const apiEndpointForPartnershipCount = "/admin/back/06-collaboration/partnership_count.php"; 
    
    // 서버에 전달할 데이터 (예: 사용자 인증 정보 등, 필요 없다면 빈 객체 {})
    requestData = {}; // 서버 스크립트에서 특정 조건이 필요하다면 추가
    try {
        // callApi 함수를 사용하여 서버 API 호출
        const result = await callApi("POST", apiEndpointForPartnershipCount, userInfo);

        // API 응답 확인 및 데이터 추출
        //if (result && result.message === 'success' && result.responseData !== undefined) {
        if (result && typeof result === 'object' && result.statusCode === 200 && result.responseData !== undefined) {
            // 서버 응답 형식에 따라 개수 정보를 추출하는 방식을 수정해야 합니다.
            const unseenPartnershipCount = result.responseData.unseenCount;

            if (unseenPartnershipCount !== undefined && unseenPartnershipCount !== null) {
                //console.log(`서버 API로부터 가져온 '제휴 관리' (col_partnership) 개수: ${unseenPartnershipCount}`);
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
    counts['col_manage'] = counts['col_proposal'] + counts['col_partnership']

    // 2. 가져온 개수를 바탕으로 해당하는 span 요소를 찾아 내용을 업데이트합니다.

    // '제휴/제안 관리' 상위 메뉴 개수 업데이트
    const $topLevelSpan = $('#count-for-col_manage'); // 고유 ID로 선택
    if ($topLevelSpan.length && counts['col_manage'] !== undefined) {
         if (counts['col_manage'] > 0) {
            $topLevelSpan.text(counts['col_manage']);
            $topLevelSpan.show(); // 개수가 0보다 크면 보이게 함
            $topLevelSpan[0].offsetHeight; 
            
            $topLevelSpan.css({
                'display': 'inline-block',
                'min-width': '1.5em',
                'height': '1.5em',
                'line-height': '1.5em',
                'border-radius': '50%',
                'background-color': '#dc3545', // 실제 CSS 값 사용
                'color': 'white',
                'text-align': 'center',
                'font-size': '0.8em',
                'margin-left': '0.5em',
                'padding': '0 0.2em',
                'box-sizing': 'border-box',
                'vertical-align': 'middle'
            });
            $topLevelSpan.css('display');
         } else {
            $topLevelSpan.hide(); // 개수가 0이면 숨김
         }
    }

     // '제휴 관리' 서브 메뉴 개수 업데이트
    const $partnershipSpan = $('#count-for-col_partnership'); // 고유 ID로 선택
     if ($partnershipSpan.length && counts['col_partnership'] !== undefined) {
         if (counts['col_partnership'] > 0) {
            $partnershipSpan.text(counts['col_partnership']);
            $partnershipSpan.show();
            $partnershipSpan[0].offsetHeight; 
            
            $partnershipSpan.css({
                'display': 'inline-block',
                'min-width': '1.5em',
                'height': '1.5em',
                'line-height': '1.5em',
                'border-radius': '50%',
                'background-color': '#dc3545', // 실제 CSS 값 사용
                'color': 'white',
                'text-align': 'center',
                'font-size': '0.8em',
                'margin-left': '0.5em',
                'padding': '0 0.2em',
                'box-sizing': 'border-box',
                'vertical-align': 'middle'
            });
            $partnershipSpan.css('display');
         } else {
            $partnershipSpan.hide();
         }
    }

    // '제안 관리' 서브 메뉴 개수 업데이트
    const $proposalSpan = $('#count-for-col_proposal'); // 고유 ID로 선택
    if ($proposalSpan.length && counts['col_proposal'] !== undefined) {
         if (counts['col_proposal'] > 0) {
            $proposalSpan.text(counts['col_proposal']);
            $proposalSpan.show();
            $proposalSpan[0].offsetHeight; 
            
            $proposalSpan.css({
                'display': 'inline-block',
                'min-width': '1.5em',
                'height': '1.5em',
                'line-height': '1.5em',
                'border-radius': '50%',
                'background-color': '#dc3545', // 실제 CSS 값 사용
                'color': 'white',
                'text-align': 'center',
                'font-size': '0.8em',
                'margin-left': '0.5em',
                'padding': '0 0.2em',
                'box-sizing': 'border-box',
                'vertical-align': 'middle'
            });
            $proposalSpan.css('display');
         } else {
            $proposalSpan.hide();
         }
    }

    const activeLink = $("#navbar-nav").find("a.nav-link.active")[0];
    openParentMenus(activeLink)
}

function logout() {
    try {
        deleteCookie("sa_cont_no");
        deleteCookie("sa_cont_token");
        deleteCookie("sa_name");
        deleteCookie("sa_no");
        deleteCookie("sa_per_no");
        deleteCookie("sa_token");
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