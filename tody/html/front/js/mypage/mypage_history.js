// V2 페이지 여부 감지 (mypage_history_v2.html 등 _v2 포함 URL)
const is_history_v2 = window.location.pathname.includes('_v2');

// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(function () {
    if (!userInfo()) {
        alert("로그인 후 이용 가능합니다.");
        location.href = "/index";
        return;
    }
    initMenu();
    // initModal();
    initEvents();
    initTables();
});

/**
 * 이벤트 초기화 함수
 */
function initEvents() {
    // 최근 검색 주소 탭 클릭
    $("#recent_search_table").on("click", ".nav-link", function () {
        if ($("#recent_search_real").hasClass("active")) {
            $("#recent_search_more_btn").attr("href", "mypage_history_popup.html?title=" + encodeURIComponent("최근 검색 실거래가") + "&table=search&type=real");
        } else {
            $("#recent_search_more_btn").attr("href", "mypage_history_popup.html?title=" + encodeURIComponent("최근 검색 매물정보") + "&table=search&type=estate");
        }
    });

    // 찜2 탭 클릭
    $("#favorite_table_1").on("click", ".nav-link", function () {
        if ($("#recent_favorite_real").hasClass("active")) {
            $("#favorite_btn_1").attr("href", "mypage_history_popup.html?title=" + encodeURIComponent("찜(실거래가)") + "&table=favorite&type=real");
        } else {
            $("#favorite_btn_1").attr("href", "mypage_history_popup.html?title=" + encodeURIComponent("찜(매물정보)") + "&table=favorite&type=estate");
        }
    });

    // 찜2 탭 클릭
    $("#favorite_table_2").on("click", ".nav-link", function () {
        if ($("#recent_favorite_find").hasClass("active")) {
            $("#favorite_btn_2").attr("href", "mypage_history_popup.html?title=" + encodeURIComponent("찜(삽니다)") + "&table=favorite&type=find");
        } else {
            $("#favorite_btn_2").attr("href", "mypage_history_popup.html?title=" + encodeURIComponent("찜(팝니다)") + "&table=favorite&type=put");
        }
    });

    // 최근 본 구합니다/내놓습니다 탭 클릭
    $("#recent_view_table_2").on("click", ".nav-link", function () {
        if ($("#recent_view_find").hasClass("active")) {
            $("#recent_view_btn_2").attr("href", "mypage_history_popup.html?title=" + encodeURIComponent("최근 본 삽니다") + "&table=view&type=find");
        } else {
            $("#recent_view_btn_2").attr("href", "mypage_history_popup.html?title=" + encodeURIComponent("최근 본 팝니다") + "&table=view&type=put");
        }
    });

    // 최근 인쇄 이력 탭 클릭
    $("#recent_print_table").on("click", ".nav-link", function () {
        if ($("#recent_print_real").hasClass("active")) {
            $("#recent_print_btn").attr("href", "mypage_history_popup.html?title=" + encodeURIComponent("최근 인쇄 실거래가") + "&table=print&type=real");
        } else {
            $("#recent_print_btn").attr("href", "mypage_history_popup.html?title=" + encodeURIComponent("최근 인쇄 매물정보") + "&table=print&type=estate");
        }
    });

    // 최근 검색 주소 삭제 버튼 클릭
    $("#recent_search_table").on("click", ".delete-btn", function (e) {
        const type = $(this).attr("data-type");
        const history_no = $(this).attr("data-history_no");
        deleteHistory("search", type, history_no);
    });

    // 찜(2) 삭제 버튼 클릭
    $("#favorite_table_1").on("click", ".delete-btn", function (e) {
        const type = $(this).attr("data-type");
        const history_no = $(this).attr("data-history_no");
        deleteHistory("favorite", type, history_no);
    });

    // 찜(2) 삭제 버튼 클릭
    $("#favorite_table_2").on("click", ".delete-btn", function (e) {
        const type = $(this).attr("data-type");
        const history_no = $(this).attr("data-history_no");
        deleteHistory("favorite", type, history_no);
    });

    // 최근 본 구합니다/내놓습니다 삭제 버튼 클릭
    $("#recent_view_table_2").on("click", ".delete-btn", function (e) {
        const type = $(this).attr("data-type");
        const history_no = $(this).attr("data-history_no");
        deleteHistory("view", type, history_no);
    });

    // 최근 본 구합니다/내놓습니다 삭제 버튼 클릭
    $("#recent_print_table").on("click", ".delete-btn", function (e) {
        const type = $(this).attr("data-type");
        const history_no = $(this).attr("data-history_no");
        deleteHistory("print", type, history_no);
    });
}

/**
 * 전체 테이블 초기화 함수
 */
async function initTables() {
    /**
     * 테이블 결과를 DOM에 적용하는 헬퍼
     * - result가 null(API 에러)이면 기존 정적 HTML을 그대로 유지
     * - result가 있으면 thead/tbody 갱신 (tbodyHtml이 빈 문자열이면 데이터 없음 표시)
     */
    function applyResult(selectorId, result) {
        if (result === null || result === undefined) {
            // API 실패 → 기존 정적 HTML 유지 (덮어쓰지 않음)
            return;
        }
        if (result.theadHtml) {
            $("#" + selectorId).find("thead").empty().append(result.theadHtml);
        }
        $("#" + selectorId).find("tbody").empty().append(result.tbodyHtml || '');
    }

    // 병렬 실행 - 개별 실패 시 null 반환 (Promise.all 전체 reject 방지)
    const [recentSearchRealList, recentSearchSaleList, favoriteRealPriceList, favoriteSaleList, favoriteFindList, favoritePutList, recentFindList, recentPutList, recentPrintReal, recentPrintSale] = await Promise.all([
        initRecentSearch("real", 5, 0).catch(() => null),
        initRecentSearch("estate", 5, 0).catch(() => null),
        initFavorite1("real", 5, 0).catch(() => null),
        initFavorite1("estate", 5, 0).catch(() => null),
        initFavorite2("find", 5, 0).catch(() => null),
        initFavorite2("put", 5, 0).catch(() => null),
        initRecentView("find", 5, 0).catch(() => null),
        initRecentView("put", 5, 0).catch(() => null),
        initRecentPrint("real", 5, 0).catch(() => null),
        initRecentPrint("estate", 5, 0).catch(() => null),
    ]);

    applyResult("recent_search_real",    recentSearchRealList);
    applyResult("recent_search_sale",    recentSearchSaleList);

    applyResult("recent_favorite_real",  favoriteRealPriceList);
    applyResult("recent_favorite_sale",  favoriteSaleList);

    applyResult("recent_favorite_find",  favoriteFindList);
    applyResult("recent_favorite_put",   favoritePutList);

    applyResult("recent_view_find",      recentFindList);
    applyResult("recent_view_put",       recentPutList);

    applyResult("recent_print_real",     recentPrintReal);
    applyResult("recent_print_sale",     recentPrintSale);
}

/**
 * 최근 검색 주소 실거래가 테이블 초기화
 * @param {*} type
 * @param {*} limitCount
 * @param {*} offsetCount
 * @returns
 */
async function initRecentSearch(type, limitCount, offsetCount) {
    const dataObj = {
        ...userInfo(),
        type: type,
        limit: limitCount,
        offset: offsetCount,
    };
    const result = await callApi("POST", "/front/back/history/history_recent_search.php", dataObj);
    if (!result || result.statusCode !== 200) return;

    const tbodyHtml = result.responseData
        .map(function (item) {
            let pageUrl = "";
            if (type === "real") {
                pageUrl = is_history_v2
                    ? `/front/views/realPrice/realPrice_v2.html?curLat=${item.latitude}&curLng=${item.longitude}`
                    : `/front/views/realPrice/realPrice.html?curLat=${item.latitude}&curLng=${item.longitude}`;
            } else if (type === "estate") {
                pageUrl = is_history_v2
                    ? `/front/views/realPrice/realPrice_v2.html?curLat=${item.latitude}&curLng=${item.longitude}`
                    : `/front/views/sell/sell.html?curLat=${item.latitude}&curLng=${item.longitude}`;
            }
            return `
                <tr>
                    <td><font>조회 날짜 : </font> ${item.reg_date}</td>
                    <td><font>주소 : </font> <a href="${pageUrl}">${item.jibun_address}</a></td>
                    <td class="text-end"><font>삭제 : </font> <button type="button" class="delete-btn btn btn-danger" data-type="${item.type}" data-history_no="${item.history_no}">삭제</button></td>
                </tr>`;
        })
        .join("");

    const theadHtml = `
        <tr>
            <th scope="col" class="col-3">검색일</th>
            <th scope="col">소재지</th>
            <th scope="col"></th>
        </tr>`;

    return { theadHtml, tbodyHtml };
}

/**
 * 찜(1) 테이블 초기화
 * @param {*} type
 * @param {*} limitCount
 * @param {*} offsetCount
 * @returns
 */
async function initFavorite1(type, limitCount, offsetCount) {
    const dataObj = {
        ...userInfo(),
        type: type,
        limit: limitCount,
        offset: offsetCount,
    };
    const result = await callApi("POST", "/front/back/history/history_favorite_map.php", dataObj);
    if (!result || result.statusCode !== 200) return;

    const tbodyHtml = result.responseData
        .map(function (item) {
            let pageUrl = "";
            let trHtml = "";
            if (type === "real") {
                pageUrl = is_history_v2
                    ? `/front/views/realPrice/realPrice_v2.html?curLat=${item.latitude}&curLng=${item.longitude}`
                    : `/front/views/realPrice/realPrice.html?curLat=${item.latitude}&curLng=${item.longitude}`;
                trHtml = `<tr>
                            <td><font>조회 날짜 : </font> ${item.reg_date}</td>
                            <td><font>주소 : </font> <a href="${pageUrl}">${item.jibun_address}</a></td>
                            <td class="text-end"><font>삭제 : </font> <button type="button" class="delete-btn btn btn-danger" data-type="${item.type}" data-history_no="${item.history_no}">삭제</button></td>
                        </tr>`;
            } else if (type === "estate") {
                pageUrl = is_history_v2
                    ? `/front/views/realPrice/realPrice_v2.html?curLat=${item.latitude}&curLng=${item.longitude}&estateNo=${item.estate_no}`
                    : `/front/views/sell/sell.html?curLat=${item.latitude}&curLng=${item.longitude}`;
                trHtml = `<tr>
                            <td><font>조회 날짜 : </font> ${item.reg_date}</td>
                            <td><font>주소 : </font> <a href="${pageUrl}">${item.jibun_address}</a></td>
                            <td><font>매물번호 : </font> <a href="${is_history_v2 ? pageUrl : pageUrl + '&estateNo=' + item.estate_no}">${item.estate_no}</a></td>
                            <td class="text-end"><font>삭제 : </font> <button type="button" class="delete-btn btn btn-danger" data-type="${item.type}" data-history_no="${item.history_no}">삭제</button></td>
                        </tr>`;
            }

            return trHtml;
        })
        .join("");

    let theadHtml = "";
    if (type === "real") {
        theadHtml = `<tr>
                        <th scope="col" class="col-3">찜 날짜</th>
                        <th scope="col">소재지</th>
                        <th scope="col"></th>
                    </tr>`;
    } else if (type === "estate") {
        theadHtml = `<tr>
                        <th scope="col" class="col-3">찜 날짜</th>
                        <th scope="col">소재지</th>
                        <th scope="col">매물번호</th>
                        <th scope="col"></th>
                    </tr>`;
    }

    return { theadHtml, tbodyHtml };
}

/**
 * 찜(2) 테이블 초기화
 * @param {*} type = 타입: find, put
 * @param {*} limitCount = 보여줄 갯수
 * @param {*} offsetCount = 시작 번호
 * @returns
 */
async function initFavorite2(type, limitCount, offsetCount) {
    const dataObj = {
        ...userInfo(),
        type: type,
        limit: limitCount,
        offset: offsetCount,
        v2_mode: is_history_v2 ? 1 : 0,
    };
    const result = await callApi("POST", "/front/back/history/history_favorite.php", dataObj);
    if (!result || result.statusCode !== 200) return;

    const tbodyHtml = result.responseData
        .map(function (item) {
            const viewUrl = is_history_v2
                ? `/front/views/${item.favorite_type}/${item.favorite_type}_view_v2.html?viewNo=${item.board_no}`
                : `/front/views/${item.favorite_type}/${item.favorite_type}_view.html?viewNo=${item.board_no}`;
            return `
                <tr>
                    <td><font>검색날짜 : </font> ${item.reg_date}</td>
                    <td><font>주소 : </font> <a href="${viewUrl}">${item.locatadd_nm}</a></td>
                    <td class="text-end"><font>삭제 : </font> <button type="button" class="delete-btn btn btn-danger" data-type="${item.favorite_type}" data-history_no="${item.history_no}">삭제</button></td>
                </tr>`;
        })
        .join("");

    const theadHtml = `
        <tr>
            <th scope="col" class="col-3">찜 날짜</th>
            <th scope="col">소재지</th>
            <th scope="col"></th>
        </tr>`;

    return { tbodyHtml, theadHtml };
}

/**
 * 최근 본 구합니다/내놓습니다 테이블 초기화
 * @param {*} type
 * @param {*} limitCount
 * @param {*} offsetCount
 * @returns
 */
async function initRecentView(type, limitCount, offsetCount) {
    const dataObj = {
        ...userInfo(),
        type: type,
        limit: limitCount,
        offset: offsetCount,
        v2_mode: is_history_v2 ? 1 : 0,
    };

    // 구합니다
    if (type === "find") {
        const result = await callApi("POST", "/front/back/history/history_recent_view_find.php", dataObj);
        if (!result || result.statusCode !== 200) return;

        const tbodyHtml = result.responseData
            .map(function (item) {
                const viewUrl = is_history_v2
                    ? `/front/views/${item.view_type}/${item.view_type}_view_v2.html?viewNo=${item.board_no}`
                    : `/front/views/${item.view_type}/${item.view_type}_view.html?viewNo=${item.board_no}`;
                return `
                    <tr>
                        <td><font>조회 날짜 : </font> ${item.reg_date}</td>
                        <td><font>주소 : </font> <a href="${viewUrl}">${item.locatadd_nm}</a></td>
                        <td><font>가격대 : </font> ${formatPrice(item.min_price)} ~ ${formatPrice(item.max_price)}</td>
                        <td class="text-end"><font>삭제 : </font> <button type="button" class="delete-btn btn btn-danger" data-type="${item.view_type}" data-history_no="${item.history_no}" data-board_no="${item.board_no}">삭제</button></td>
                    </tr>`;
            })
            .join("");

        const theadHtml = `
            <tr>
                <th scope="col" class="col-2">조회일</th>
                <th scope="col">주소</th>
                <th scope="col">가격대</th>
                <th scope="col"></th>
            </tr>`;

        return { tbodyHtml, theadHtml };
    }
    // 내놓습니다
    else if (type === "put") {
        const result = await callApi("POST", "/front/back/history/history_recent_view_put.php", dataObj);
        if (!result || result.statusCode !== 200) return;

        const tbodyHtml = result.responseData
            .map(function (item) {
                const viewUrl = is_history_v2
                    ? `/front/views/${item.view_type}/${item.view_type}_view_v2.html?viewNo=${item.board_no}`
                    : `/front/views/${item.view_type}/${item.view_type}_view.html?viewNo=${item.board_no}`;
                return `
                    <tr>
                        <td><font>조회 날짜 : </font> ${item.reg_date}</td>
                        <td><font>주소 : </font> <a href="${viewUrl}">${item.locatadd_nm}</a></td>
                        <td><font>가격대 : </font> ${formatPrice(item.sale_price)}</td>
                        <td class="text-end"><font>삭제 : </font> <button type="button" class="delete-btn btn btn-danger" data-type="${item.view_type}" data-history_no="${item.history_no}" data-board_no="${item.board_no}">삭제</button></td>
                    </tr>`;
            })
            .join("");

        const theadHtml = `
            <tr>
                <th scope="col" class="col-2">조회일</th>
                <th scope="col">주소</th>
                <th scope="col">가격대</th>
                <th scope="col"></th>
            </tr>`;

        return { theadHtml, tbodyHtml };
    }
}

/**
 * 최근 인쇄 이력 테이블 초기화
 * @param {*} type
 * @param {*} limitCount
 * @param {*} offsetCount
 * @returns
 */
async function initRecentPrint(type, limitCount, offsetCount) {
    const dataObj = {
        ...userInfo(),
        type: type,
        limit: limitCount,
        offset: offsetCount,
    };
    const result = await callApi("POST", "/front/back/history/history_print_map.php", dataObj);
    if (!result || result.statusCode !== 200) return;

    const tbodyHtml = result.responseData
        .map(function (item) {
            let pageUrl = "";
            let trHtml = "";
            if (type === "real") {
                pageUrl = is_history_v2
                    ? `/front/views/realPrice/realPrice_v2.html?curLat=${item.latitude}&curLng=${item.longitude}`
                    : `/front/views/realPrice/realPrice.html?curLat=${item.latitude}&curLng=${item.longitude}`;
                trHtml = `<tr>
                            <td><font>인쇄일 : </font> ${item.reg_date}</td>
                            <td><font>주소 : </font> <a href="${pageUrl}">${item.jibun_address}</a></td>
                            <td class="text-end"><font>삭제 : </font> <button type="button" class="delete-btn btn btn-danger" data-type="${item.type}" data-history_no="${item.history_no}">삭제</button></td>
                        </tr>`;
            } else if (type === "estate") {
                pageUrl = is_history_v2
                    ? `/front/views/realPrice/realPrice_v2.html?curLat=${item.latitude}&curLng=${item.longitude}&estateNo=${item.estate_no}`
                    : `/front/views/sell/sell.html?curLat=${item.latitude}&curLng=${item.longitude}&estateNo=${item.estate_no}`;
                trHtml = `<tr>
                            <td><font>인쇄일 : </font> ${item.reg_date}</td>
                            <td><font>주소 : </font> <a href="${pageUrl}">${item.jibun_address}</a></td>
                            <td><font>매물번호 : </font> <a href="${pageUrl}">${item.estate_no}</a></td>
                            <td class="text-end"><font>삭제 : </font> <button type="button" class="delete-btn btn btn-danger" data-type="${item.type}" data-history_no="${item.history_no}">삭제</button></td>
                        </tr>`;
            }

            return trHtml;
        })
        .join("");
    let theadHtml = "";
    if (type === "real") {
        theadHtml = `<tr>
                        <th scope="col" class="col-3">인쇄일</th>
                        <th scope="col">소재지</th>
                        <th scope="col"></th>
                    </tr>`;
    } else if (type === "estate") {
        theadHtml = `<tr>
                        <th scope="col" class="col-3">인쇄일</th>
                        <th scope="col">소재지</th>
                        <th scope="col">매물번호</th>
                        <th scope="col"></th>
                    </tr>`;
    }

    return { theadHtml, tbodyHtml };
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
    // initializeModal("#modalFail", "/front/assets/lottie/failed.json", "#lottieFail");

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

/**
 * 이력 삭제 함수
 * @param {*} type
 * @param {*} history_no
 * @returns
 */
async function deleteHistory(history_type, type, history_no) {
    let url = "";
    if (history_type == "favorite") {
        if (type === "real" || type === "estate") {
            url = "/front/back/history/history_delete_favorite_map.php";
        } else if (type === "put" || type === "find") {
            url = "/front/back/history/history_delete.php";
        }
    } else if (history_type == "view") {
        url = "/front/back/history/history_delete_view.php";
    } else if (history_type == "search") {
        url = "/front/back/history/history_delete_search.php";
    } else if (history_type == "print") {
        url = "/front/back/history/history_delete_print.php";
    }
    const dataObj = {
        ...userInfo(),
        type,
        history_no,
    };

    const result = await callApi("POST", url, dataObj);
    if (!result) return;

    if (result.message == "SUCCESS") {
        sweetAlertForReturn("삭제되었습니다.", "", "s");
        initTables();
    }

    return true;
}
