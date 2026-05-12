const mapContainer = document.getElementById("map_bg"); // 지도를 표시할 div
let geocoder = new kakao.maps.services.Geocoder(); // 주소-좌표 변환 객체를 생성합니다
let ps = new kakao.maps.services.Places(); // 장소 검색 객체를 생성합니다

// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(document).ready(async function () {
    "use strict"; // Use strict mode for the whole function

    initSelect(); // 선택박스 초기화
    initEvents(); // 이벤트 초기화
    initTable(); // 테이블 초기화
});

/**
 * 이벤트 모음 함수
 */
function initEvents() {
    // [EVENT] 변경 이벤트 - 시/도 필터
    $("#sido").on("change", function () {
        const sido_cd = $(this).val();
        const selectedSido = $("#sido").val() ? $("#sido option:selected").text() : ""; // 선택된 옵션의 텍스트값
        const selectedSgg = $("#sgg").val() ? $("#sgg option:selected").text() : ""; // 선택된 옵션의 텍스트값
        const keyword = (selectedSido + " " + selectedSgg).trim();

        sgg_get(sido_cd); // 필터(시/군/구)
        // searchAddress(keyword);
    });

    // [EVENT] 변경 이벤트 - 시/군/구 필터
    $("#sgg").on("change", function () {
        const sgg_cd = $(this).val();
        const selectedSido = $("#sido option:selected").text(); // 선택된 옵션의 텍스트값
        const selectedSgg = $("#sgg option:selected").text(); // 선택된 옵션의 텍스트값
        const keyword = (selectedSido + " " + selectedSgg).trim();

        // umd_get(sgg_cd); // 필터(읍/면/동)
        // searchAddress(keyword);
    });

    // [EVENT] 변경 이벤트 - 읍/면/동 필터
    $("#umd").on("change", function () {
        const selectedSido = $("#sido option:selected").text(); // 선택된 옵션의 텍스트값
        const selectedSgg = $("#sgg option:selected").text(); // 선택된 옵션의 텍스트값
        const selectedUmd = $("#umd option:selected").text(); // 선택된 옵션의 텍스트값
    });

    // 검색
    $("#search_btn").on("click", async function () {
        const table = $("#history_nav .nav-link.active").attr("data-table");
        const type = $("#history_nav .nav-link.active").attr("data-type");

        initTable(10, 0);
        // if (table === "view") {
        // } else if (table === "view") {
        // }
    });

    // 실거래가 - 더보기
    $("#realPrice_more_btn").on("click", async function () {
        const table = $("#history_view_realPrice");
        const trLength = table.find("tbody tr").length;
        const result = await initHistoryViewRealPrice(10, trLength);
        if (!result.tbodyHtml) {
            // $("#realPrice_more_btn").hide();
        } else {
            table.find("tbody").append(result.tbodyHtml);
        }
    });

    // 매물정보 - 더보기
    $("#sale_more_btn").on("click", async function () {
        const table = $("#history_view_sale");
        const trLength = table.find("tbody tr").length;
        const result = await initHistoryViewSale(10, trLength);
        if (!result.tbodyHtml) {
            // $("#realPrice_more_btn").hide();
        } else {
            table.find("tbody").append(result.tbodyHtml);
        }
    });

    // 구합니다 - 더보기
    $("#find_more_btn").on("click", async function () {
        const table = $("#history_view_find");
        const trLength = table.find("tbody tr").length;
        const result = await initHistoryViewFind(10, trLength);
        if (!result.tbodyHtml) {
            // $("#realPrice_more_btn").hide();
        } else {
            table.find("tbody").append(result.tbodyHtml);
        }
    });

    // 내놓습니다 - 더보기
    $("#put_more_btn").on("click", async function () {
        const table = $("#history_view_put");
        const trLength = table.find("tbody tr").length;
        const result = await initHistoryViewPut(10, trLength);
        if (!result.tbodyHtml) {
            // $("#realPrice_more_btn").hide();
        } else {
            table.find("tbody").append(result.tbodyHtml);
        }
    });
}

/* =================================================================
 * 테이블 관련 함수
 * ================================================================= */

/**
 * 전체 테이블 초기화 함수
 */
async function initTable() {
    // 세 개의 비동기 함수를 병렬로 실행
    const [historyViewRealPrice, historyViewSale, historyViewFind, historyViewPut] = await Promise.all([initHistoryViewRealPrice(10, 0), initHistoryViewSale(10, 0), initHistoryViewFind(10, 0), initHistoryViewPut(10, 0)]);

    $("#history_view_realPrice").find("thead").empty().append(historyViewRealPrice.theadHtml);
    $("#history_view_realPrice").find("tbody").empty().append(historyViewRealPrice.tbodyHtml);

    $("#history_view_sale").find("thead").empty().append(historyViewSale.theadHtml);
    $("#history_view_sale").find("tbody").empty().append(historyViewSale.tbodyHtml);

    $("#history_view_find").find("thead").empty().append(historyViewFind.theadHtml);
    $("#history_view_find").find("tbody").empty().append(historyViewFind.tbodyHtml);

    $("#history_view_put").find("thead").empty().append(historyViewPut.theadHtml);
    $("#history_view_put").find("tbody").empty().append(historyViewPut.tbodyHtml);
}

/**
 * 실거래가 주소 조회수 가져오는 함수
 * @param {*} limitCount
 * @param {*} offsetCount
 * @returns
 */
async function initHistoryViewRealPrice(limitCount, offsetCount) {
    const user = adminUserInfo();
    const period = $("#period").val();
    const sido = $("#sido").val();
    const sgg = $("#sgg").val();
    const pnu = sido + sgg;

    const dataObj = {
        ...user,
        period: encodeURIComponent(period),
        pnu: encodeURIComponent(pnu),
        limit: limitCount,
        offset: offsetCount,
        v2_mode: (typeof v2_mode !== "undefined" && v2_mode) ? 1 : 0,
    };

    try {
        const result = await callApi("POST", "/admin/back/11-history/history_view_realPrice.php", dataObj);

        const tbodyHtml = result.responseData
            .map(function (item, index) {
                // v2_mode: 실거래가v2 페이지로 이동
                const pageUrl = (typeof v2_mode !== "undefined" && v2_mode)
                    ? `/front/views/realPrice/realPrice_v2.html?curLat=${item.latitude}&curLng=${item.longitude}`
                    : `/front/views/realPrice/realPrice.html?curLat=${item.latitude}&curLng=${item.longitude}`;
                return `
                    <tr>
                        <td>${item.address_jibun}</td>
                        <td class="text-start"></font> ${item.count}</td>
                        <td class="text-start">
                            <a target="history_realPrice_window" href="${pageUrl}" class="link-info">보러가기 <i class="ri-arrow-right-line align-middle"></i></a>
                        </td>
                    </tr>`;
            })
            .join("");

        const theadHtml = `
            <tr class="table-light">
                <th scope="col">주소</th>
                <th scope="col" class="text-start">조회수</th>
                <th scope="col" class="text-start">액션</th>
            </tr>`;
        if (result.responseData.length < 10) {
            $("#realPrice_more_btn").hide();
        } else {
            $("#realPrice_more_btn").show();
        }
        return { theadHtml, tbodyHtml };
    } catch (error) {}
}

/**
 * 매물정보 주소 조회수 가져오는 함수
 * @param {*} limitCount
 * @param {*} offsetCount
 * @returns
 */
async function initHistoryViewSale(limitCount, offsetCount) {
    const user = adminUserInfo();
    const period = $("#period").val();
    const sido = $("#sido").val();
    const sgg = $("#sgg").val();
    const pnu = sido + sgg;

    const dataObj = {
        ...user,
        period: encodeURIComponent(period),
        pnu: encodeURIComponent(pnu),
        limit: limitCount,
        offset: offsetCount,
        v2_mode: (typeof v2_mode !== "undefined" && v2_mode) ? 1 : 0,
    };

    try {
        const result = await callApi("POST", "/admin/back/11-history/history_view_sale.php", dataObj);

        const tbodyHtml = result.responseData
            .map(function (item, index) {
                // v2_mode: 매물정보는 V2에서 실거래가v2(통합) 페이지로 이동
                // estateNo → 매물 상세 패널 자동 오픈 + 지도 이동
                // curLat/curLng는 유효할 때만 추가 (0 또는 null이면 제외)
                const _hasValidCoords = item.latitude && item.longitude && parseFloat(item.latitude) !== 0 && parseFloat(item.longitude) !== 0;
                const pageUrl = (typeof v2_mode !== "undefined" && v2_mode)
                    ? `/front/views/realPrice/realPrice_v2.html?${_hasValidCoords ? `curLat=${item.latitude}&curLng=${item.longitude}&` : ''}estateNo=${item.estate_no}`
                    : `/front/views/sell/sell.html?curLat=${item.latitude}&curLng=${item.longitude}`;
                return `
                    <tr>
                        <th class="fw-semibold">${item.estate_no}</th>
                        <td>${item.address_jibun}</td>
                        <td class="text-start"></font> ${item.count}</td>
                        <td class="text-start">
                            <a target="history_sale_window" href="${pageUrl}${(typeof v2_mode === "undefined" || !v2_mode) ? `$estateNo=${item.estate_no}` : ''}" class="link-info">보러가기 <i class="ri-arrow-right-line align-middle"></i></a>
                        </td>
                    </tr>`;
            })
            .join("");

        const theadHtml = `
            <tr class="table-light">
                <th scope="col">매물 번호</th>
                <th scope="col">주소</th>
                <th scope="col" class="text-start">조회수</th>
                <th scope="col" class="text-start">액션</th>
            </tr>`;
        if (result.responseData.length < 10) {
            $("#sale_more_btn").hide();
        } else {
            $("#sale_more_btn").show();
        }
        return { theadHtml, tbodyHtml };
    } catch (error) {}
}

/**
 * 구합니다 주소 조회수 가져오는 함수
 * @param {*} limitCount
 * @param {*} offsetCount
 * @returns
 */
async function initHistoryViewFind(limitCount, offsetCount) {
    const user = adminUserInfo();
    const period = $("#period").val();
    const sido = $("#sido").val();
    const sgg = $("#sgg").val();
    const pnu = sido + sgg;

    const dataObj = {
        ...user,
        period: encodeURIComponent(period),
        pnu: encodeURIComponent(pnu),
        limit: limitCount,
        offset: offsetCount,
        v2_mode: (typeof v2_mode !== "undefined" && v2_mode) ? 1 : 0,
    };

    try {
        const result = await callApi("POST", "/admin/back/11-history/history_view_find.php", dataObj);

        const tbodyHtml = result.responseData
            .map(function (item, index) {
                // v2_mode: 삽니다 V2 상세 페이지로 이동
                const pageUrl = (typeof v2_mode !== "undefined" && v2_mode)
                    ? `/front/views/find/find_view_v2.html?viewNo=${item.board_no}`
                    : `/front/views/find/find_view.html?viewNo=${item.board_no}`;
                return `
                    <tr>
                        <th class="fw-semibold">${item.board_no}</th>
                        <td>${item.address_jibun}</td>
                        <td class="text-start"></font> ${item.count}</td>
                        <td class="text-start">
                            <a target="history_find_window" href="${pageUrl}" class="link-info">보러가기 <i class="ri-arrow-right-line align-middle"></i></a>
                        </td>
                    </tr>`;
            })
            .join("");

        const theadHtml = `
            <tr class="table-light">
                <th scope="col">게시글 번호</th>
                <th scope="col">주소</th>
                <th scope="col" class="text-start">조회수</th>
                <th scope="col" class="text-start">액션</th>
            </tr>`;
        if (result.responseData.length < 10) {
            $("#find_more_btn").hide();
        } else {
            $("#find_more_btn").show();
        }
        return { theadHtml, tbodyHtml };
    } catch (error) {}
}

/**
 * 내놓습니다 주소 조회수 가져오는 함수
 * @param {*} limitCount
 * @param {*} offsetCount
 * @returns
 */
async function initHistoryViewPut(limitCount, offsetCount) {
    const user = adminUserInfo();
    const period = $("#period").val();
    const sido = $("#sido").val();
    const sgg = $("#sgg").val();
    const pnu = sido + sgg;

    const dataObj = {
        ...user,
        period: encodeURIComponent(period),
        pnu: encodeURIComponent(pnu),
        limit: limitCount,
        offset: offsetCount,
        v2_mode: (typeof v2_mode !== "undefined" && v2_mode) ? 1 : 0,
    };

    try {
        const result = await callApi("POST", "/admin/back/11-history/history_view_put.php", dataObj);

        const tbodyHtml = result.responseData
            .map(function (item, index) {
                // v2_mode: 팝니다 V2 상세 페이지로 이동
                const pageUrl = (typeof v2_mode !== "undefined" && v2_mode)
                    ? `/front/views/put/put_view_v2.html?viewNo=${item.board_no}`
                    : `/front/views/put/put_view.html?viewNo=${item.board_no}`;
                return `
                    <tr>
                        <th class="fw-semibold">${item.board_no}</th>
                        <td>${item.address_jibun}</td>
                        <td class="text-start"></font> ${item.count}</td>
                        <td class="text-start">
                            <a target="history_put_window" href="${pageUrl}" class="link-info">보러가기 <i class="ri-arrow-right-line align-middle"></i></a>
                        </td>
                    </tr>`;
            })
            .join("");

        const theadHtml = `
            <tr class="table-light">
                <th scope="col">게시글 번호</th>
                <th scope="col">주소</th>
                <th scope="col" class="text-start">조회수</th>
                <th scope="col" class="text-start">액션</th>
            </tr>`;
        if (result.responseData.length < 10) {
            $("#put_more_btn").hide();
        } else {
            $("#put_more_btn").show();
        }
        return { theadHtml, tbodyHtml };
    } catch (error) {}
}

async function initSearchHistory(address, type, limitCount, offsetCount) {
    return;
    const user = adminUserInfo();
    const period = $("#period").val();
    const sido = $("#sido").val();
    const sgg = $("#sgg").val();
    const dataObj = {
        ...user,
        address: encodeURIComponent(address),
        type: encodeURIComponent(type),
        limit: limitCount,
        offset: offsetCount,
    };

    try {
        const result = await callApi("POST", "/admin/back/11-history/history_search_real.php", dataObj);
    } catch (error) {}
}

/* =================================================================
 * 선택박스 관련 함수
 * ================================================================= */

/**
 * 선택박스 초기화
 */
function initSelect() {
    sido_get(); // 시/도
}

/**
 * 시/도 가져오는 함수
 * @returns
 */
async function sido_get() {
    const user = adminUserInfo();
    const dataObj = { ...user };

    callApi("POST", "/admin/back/04-estate/sido_get.php", dataObj)
        .then((response) => {
            populateOptions("#sido", response.responseData, "sido_cd", "locallow_nm");
        })
        .catch((error) => {
            console.error("API 호출 실패", error);
        })
        .finally(async () => {
            // sgg_get(sido);
        });
}

/**
 * 시/군/구 가져오는 함수
 * @returns
 */
async function sgg_get() {
    const user = adminUserInfo();
    const dataObj = {
        ...user,
        sido_cd: encodeURIComponent($("#sido").val()),
    };

    callApi("POST", "/admin/back/04-estate/sgg_get.php", dataObj)
        .then((response) => {
            $("#sgg").empty().append('<option value="">시/군/구</option>');
            populateOptions("#sgg", response.responseData, "sgg_cd", "locatadd_nm");
        })
        .catch((error) => {
            console.error("API 호출 실패", error);
        })
        .finally(() => {});
}

/**
 * 읍/면/동 가져오는 함수
 * @returns
 */
async function umd_get() {
    const user = adminUserInfo();
    const dataObj = {
        ...user,
        sido_cd: encodeURIComponent($("#sido").val()),
        sgg_cd: encodeURIComponent($("#sgg").val()),
    };

    callApi("POST", "/admin/back/04-estate/umd_get.php", dataObj)
        .then((response) => {
            $("#umd").empty().append('<option value="">선택하세요.</option>');
            populateOptions("#umd", response.responseData, "umd_cd", "locallow_nm");
        })
        .catch((error) => {
            console.error("API 호출 실패", error);
        })
        .finally(() => {});
}

/**
 * 주소로 좌표 검색 및 지도 중심 이동
 * @param {*} keyword - 검색 주소
 */
async function searchAddress(keyword) {
    // 주소 검색
    geocoder.addressSearch(keyword, async function (data, status, pagination) {
        if (status === kakao.maps.services.Status.OK) {
            const result = data[0];
            const address_name = result.address_name;
            $("#search_btn").attr("data-address", address_name);
        }
    });
}

/* =================================================================
 * helper 관련 함수
 * ================================================================= */

/**
 * 좌표가 대한민국 내의 유효한 좌표인지 확인하는 함수
 * @param {string|number} lat - 위도
 * @param {string|number} lng - 경도
 * @returns {boolean}
 */
function areValidCoordinatesInKorea(lat, lng) {
    const isLatValid = isValidCoordinate(lat) && lat >= 33.0 && lat <= 43.0;
    const isLngValid = isValidCoordinate(lng) && lng >= 124.0 && lng <= 132.0;
    return isLatValid && isLngValid;
}

/**
 * 좌표가 유효한지 확인하는 함수
 * @param {*} value
 * @returns
 */
function isValidCoordinate(value) {
    return value !== null && value !== undefined && value !== "" && !isNaN(value);
}

/**
 * 선택자를 이용해 옵션을 채우는 함수
 * @param {string} selector jQuery 선택자
 * @param {Array} data 데이터 배열
 * @param {string} valueKey 값 키
 * @param {string} textKey 텍스트 키
 */
function populateOptions(selector, data, valueKey, textKey) {
    if (data.length > 0) {
        // 텍스트 기준 오름차순
        data.sort((a, b) => a[textKey].localeCompare(b[textKey]));

        const optionHtml = data.map((e) => `<option value="${e[valueKey]}">${e[textKey]}</option>`).join("");
        $(selector).append(optionHtml);
    }
}
