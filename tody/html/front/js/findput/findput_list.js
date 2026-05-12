$(document).ready(function () {
   
    initFilters(); // 검색 조건 초기화
    
    initEvents();
    // 탭 버튼 클릭 이벤트 처리
    $(".tab-button").on("click", function () {
        const targetType = $(this).data("tab-type"); // 'put' 또는 'find'

        $(".tab-button").removeClass("active");
        $(this).addClass("active");

        // 하나의 탭 콘텐츠만 사용하므로 #dynamic-list-tab에만 active 클래스 유지
        $("#dynamic-list-tab").addClass("active");
        
        loadListData(targetType); // 통합된 로직 호출
    });

    // URL 파라미터로 초기 탭 결정 (없으면 HTML의 active 탭 사용)
    const tabParam = getParameter("tab"); // 'find' 또는 'put'
    const initialType = tabParam || $(".tab-button.active").data("tab-type") || "find";
    $(".tab-button").removeClass("active");
    $(".tab-button[data-tab-type='" + initialType + "']").addClass("active");
    loadListData(initialType);

    // #results_table_container 내부의 tr에 이벤트 위임
    $("#results_table_container").on("click", "tr", function () {
        const itemType = $(this).data("item-type"); // 'put' 또는 'find' (DataTable createdRow에서 추가)
        
        let itemId;
        if(itemType === 'put') {
            itemId = $(this).data("put-no");     // put_no
        } else if(itemType === 'find') {
            itemId = $(this).data("wanted-no");    // find_no
        }
       
        //const itemId = $(this).data("item-id");     // put_no 또는 find_no
        
        if (itemId && itemType) {
            if (itemType === 'put') {
                location.href = `../put/put_view.html?viewNo=${itemId}`;
            } else if (itemType === 'find') {
                location.href = `../find/find_view.html?viewNo=${itemId}`;
            } else {
                console.warn("알 수 없는 itemType:", itemType);
            }
        } else {
            // 테이블 헤더 클릭 시에도 tr이 되므로, itemId가 없으면 무시
        }
    });
});

function populateOptions2(selector, data, valueKey, textKey, sortKey = textKey) { // sortKey 추가, 기본값은 textKey
    if (data.length > 0) {
        // 정렬 키를 기준으로 정렬
        // 숫자 정렬이 필요하다면 Number()로 변환 후 비교
        data.sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];

            // 만약 sortKey가 숫자 형태라면 숫자로 변환하여 비교
            if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
                return Number(valA) - Number(valB); // 숫자 오름차순
            } else {
                return String(valA).localeCompare(String(valB)); // 문자열 사전식 오름차순
            }
        });

        const optionHtml = data.map((e) => `<option value="${e[valueKey]}">${e[textKey]}</option>`).join("");
        $(selector).append(optionHtml);
    }
}
/**
 * 매물종류 가져오는 함수
 * @returns
 */
async function estate_type_get() {
    const dataObj = {};

    callApiAbort("/front/back/find/estate_type_get.php", "POST", dataObj, "estate_type_get")
        .then((response) => {
            //populateOptions("#estate_type", response.responseData, "type_code", "type_name");
            populateOptions2("#estate_type", response.responseData, "type_code", "type_name", "type_code");
        })
        .catch((error) => {
            console.error("API 호출 실패", error);
        })
        .finally(() => {
            const estate_type = $("#estate_type");
            estate_type.multiSelect();

            const estateTypeArray = getParameter("estateType");
            if (estateTypeArray) {
                const decodedArray = decodeURIComponent(estateTypeArray).split(",");
                estate_type.val(decodedArray).trigger("change");
            }
        });
}
/**
 * 거래종류 가져오는 함수
 * @returns
 */
async function sale_type_get() {
    const dataObj = {};

    callApiAbort("/front/back/find/sale_type_get.php", "POST", dataObj, "sale_type_get")
        .then((response) => {
            //populateOptions("#sale_type", response.responseData, "type_code", "type_name");
            populateOptions2("#sale_type", response.responseData, "type_code", "type_name", "type_code");
        })
        .catch((error) => {
            console.error("API 호출 실패", error);
        })
        .finally(() => {
            const sale_type = $("#sale_type");
            sale_type.multiSelect();
            const saleTypeArray = getParameter("saleType");

            if (saleTypeArray) {
                const decodedArray = decodeURIComponent(saleTypeArray).split(",");
                sale_type.val(decodedArray).trigger("change");
            }
        });
}

let currentDataTable = null; // 현재 DataTable 인스턴스를 저장할 변수
// --- 2. 탭에 따른 데이터 로드 및 테이블 렌더링 함수
async function loadListData(type) {
    // 1. 등록하기 버튼 업데이트
    const registerBtn = $("#register-button");
    const registerBtnText = registerBtn.find("span");
    if (type === "put") {
        registerBtn.attr("href", "../put/put_write.html");
        registerBtnText.text("팝니다 등록");
    } else { // type === "find"
        registerBtn.attr("href", "../find/find_write.html");
        registerBtnText.text("삽니다 등록");
    }

    // 2. <h2> 태그 내용 업데이트
    const mainTitle = $("#main-title"); // <h2> 태그에 추가한 ID 사용
    if (type === "put") {
        mainTitle.text("팝니다");
    } else { // type === "find"
        mainTitle.text("삽니다");
    }

    // 3. DataTable 초기화 및 데이터 로드
    const apiEndpoint = (type === "put") ? "/front/back/put/put_list.php" : "/front/back/find/find_list.php";
    const tableId = "#results_table"; // 이제 하나의 테이블 ID만 사용

    // 기존 DataTable이 있다면 파괴합니다.
    if (currentDataTable !== null) {
        currentDataTable.destroy();
        $(tableId + ' thead').empty(); // 헤더도 비워줘야 합니다.
        $(tableId + ' tbody').empty(); // tbody 비우기
    }

    // DataTable 컬럼 정의 (type에 따라 다를 수 있으므로 분기)
    let columns = [];
    if (type === "put") {
        columns = [
            { data: "put_no", title: "등록번호" },
            { data: "sido", title: "시/도" }, // 시/도 컬럼
            { data: "sgg", title: "시/군/구" }, // 시/군/구 컬럼
            { data: "estate_type", title: "매물종류" },
            { data: "sale_type", title: "거래종류", render: (data) => `<span class="label-default ${getBadgeClass(data)}">${data}</span>` },
            { data: "exchange_fg", title: "교환", render: (data) => (data === "Y" ? "가능" : "불가능") },
            { data: "area", title: "면적 (평)", render: (data, type, row) => `${data}㎡(${convertToPyeong(data)}평)` },
            { data: "sale_price", title: "희망가격", 
                //render: (data, type, row) => `${formatPrice(data)}${sale_type == "월세" ? "/" + formatPrice(data.rent_price) : ""}` 
                render: (data, type, row) => { // *** 화살표 함수 본문을 중괄호 {}로 시작합니다. ***
                    const formattedSalePrice = formatPrice(data);
                    let priceText = formattedSalePrice;

                    if (row.sale_type === "월세") { // row.sale_type 사용
                        if (row.rent_price !== undefined && row.rent_price !== null) { // row.rent_price 사용
                            priceText += "/" + formatPrice(row.rent_price);
                        } else {
                            priceText += "/-";
                        }
                    }
                    return priceText; // *** 중괄호 블록 안에서 return 키워드 사용 ***
                } // *** 중괄호로 함수 본문을 닫습니다. ***
            },
            { data: "reg_date", title: "등록일" },
            { data: "noti_count", title: "조회수(명)" },
            { data: null, title: "비고", orderable: false, render: () => "" },
        ];
    } else { // type === "find"
        columns = [
            { data: "wanted_no", title: "등록번호" },
            { data: "sido", title: "시/도" }, // 시/도 컬럼
            { data: "sgg", title: "시/군/구" }, // 시/군/구 컬럼
            { data: "estate_type", title: "매물종류" },
            { data: "sale_type", title: "거래종류", render: (data) => `<span class="label-default ${getBadgeClass(data)}">${data}</span>` },
            { data: "exchange_fg", title: "교환", render: (data) => (data === "Y" ? "가능" : "불가능") },
            { data: "min_area", title: "면적 (평)", render: (data, type, row) => `${convertToPyeong(row.min_area)}~${convertToPyeong(row.max_area)}평` },
            { data: "min_price", title: "희망가격", render: (data, type, row) => `${formatPrice(row.min_price)}~${formatPrice(row.max_price)}` },
            { data: "reg_date", title: "등록일" },
            { data: "noti_count", title: "조회수(명)" },
            { data: null, title: "비고", orderable: false, render: () => "" },
        ];
    }
    

   // DataTable 초기화
   currentDataTable = $(tableId).DataTable({
        language: {
            url: "/assets/libs/datatables/lang/ko.json",
        },

        initComplete: function(settings, json) {

            var api = this.api();
        
            // 한 행 높이 구하기
            var rowHeight = $('#results_table tbody tr:first').outerHeight();
        
            // 보여줄 행 개수 (5개)
            var visibleRows = 5;
        
            // scroll-body 높이 강제 설정
            $('.dt-scroll-body').css({
                'max-height': (rowHeight * visibleRows) + 'px',
                'height': (rowHeight * visibleRows) + 'px'
            });
        },

        scrollX: false,
        scrollY: false,
        scrollCollapse: false,
        processing: true,
        responsive: true,
        lengthChange: false,
        paging: false,
        searching: false,

        createdRow: function (row, data, dataIndex) {
            // 행 클릭 시 상세 페이지로 이동하도록 data- 속성 추가
            $(row).attr('data-item-type', type); // 'put' 또는 'find'
            if (type === 'put') {
                $(row).attr('data-put-no', data.put_no); 
                // $(row).attr('data-item-id', data.put_no); // 이대로 유지해도 무방
                
            } else {
                $(row).attr('data-wanted-no', data.wanted_no); 
                //$(row).attr('data-item-id', data.wanted_no);
            }
            $(row).css('cursor', 'pointer');
        },
        order: [],
         // *** 이 부분이 일괄 정렬 설정입니다. ***
        columnDefs: [
            //{ className: "dt-center", targets: "_all" } // 모든 컬럼을 가운데 정렬
            //{ className: "dt-left",   targets: "_all" } // 모든 컬럼을 왼쪽 정렬
                { className: "dt-right",  targets: "_all" } // 모든 컬럼을 오른쪽 정렬
        ],
        //serverSide: true,
        ordering: true, // 정렬 가능
        order: [], // 초기 정렬 없음 또는 특정 컬럼으로 지정
        
        ajax: function (data, callback, settings) {
            const filterParams = collectFilterParams();
            const requestParams = $.extend({}, data, filterParams); // DataTables 기본 파라미터와 필터 파라미터 병합
            // Option 1: fetchAndRenderPropertyList 내부 로직을 이곳으로 옮기는 경우
            callApi("POST", apiEndpoint, requestParams) // 병합된 파라미터 전달
                .then((response) => {
                    if (response && response.responseData) {
                        // 서버 응답 데이터를 DataTables가 기대하는 형식으로 가공
                        const dtResponse = {
                            data: response.responseData, // 테이블에 표시할 실제 데이터 배열
                            recordsTotal: response.total_records || 0, // 필터링 전 총 레코드 수 (필요하다면 API에서 제공)
                            recordsFiltered: response.total_records || 0 // 필터링 후 총 레코드 수 (검색 결과의 총 개수)
                        };
                        // DataTables 콜백 함수 호출하여 데이터 전달
                        callback(dtResponse);
                        // 총 건수만 여기서 업데이트 (테이블 렌더링은 DataTables가 스스로 합니다)
                        $("#total_count").text(typeof comma === 'function' ? comma(dtResponse.recordsFiltered) : dtResponse.recordsFiltered);
                    } else {
                        // 데이터가 없을 경우 빈 배열 전달
                        callback({ data: [], recordsTotal: 0, recordsFiltered: 0 });
                         $("#total_count").text(0);
                    }
                })
                .catch((error) => {
                    callback({ data: [], recordsTotal: 0, recordsFiltered: 0 });
                     $("#total_count").text(0);
                });
        },
        
        columns: columns, // 위에서 정의한 컬럼 사용
        
        // *** DataTables 초기화 완료 후 실행될 코드 추가 ***
        initComplete: function(settings, json) {
        // 테이블 헤더에 구분선 추가
            $("#results_table_wrapper .dt-scroll-head thead th").css("border-bottom", "2px solid #999");
        }
    });

    // 4. 필터 이벤트 리스너 재부착
    // 중요한 점: 이벤트 핸들러가 중복으로 등록되지 않도록 off() 후에 on()을 사용합니다.
    $("#search_btn").off("click").on("click", function () {
        currentDataTable.ajax.reload();
    });
    $("#estate_type, #sale_type").off("change").on("change", function() {
        currentDataTable.ajax.reload();
    });
    
}
/**
 * 이벤트 초기화
 */
function initEvents() {
    // [EVENT] 변경 이벤트 - 시/도 필터
    $("#sido").on("change", function () {
        const sido_cd = $(this).val();
        sgg_get(sido_cd); // 필터(시/군/구)
    });

    // 검색 버튼 클릭 이벤트
    $("#search_btn").off("click").on("click", function () {
        // DataTables 인스턴스가 해당 요소에 존재하는지 먼저 확인
        if ($.fn.DataTable.isDataTable("#results_table")) {
            // 인스턴스가 존재한다면, API 인스턴스를 가져옵니다.
            const table = $("#results_table").DataTable();
    
            // console.log("Type of retrieved object:", typeof table); // 객체 타입 확인
    
            // 인스턴스가 유효한지, 그리고 settings를 통해 ajax 설정을 가져올 수 있는지 확인
            try {
                // settings() 메서드 호출 결과 확인
                const settingsArray = table.settings();
                //console.log("Result of table.settings():", settingsArray);
                if (settingsArray && settingsArray.length > 0 && settingsArray[0]) {
                    const ajaxSetting = settingsArray[0].ajax;
                    if (typeof ajaxSetting === 'function') {
                        table.ajax.reload(null, false); // 테이블 데이터 다시 로드
                    } else {
                        //console.warn("DataTable instance found, but its ajax setting is not a function as expected.");
                    }
                } else {
                    //console.warn("DataTable instance found, but settings() returned an empty or invalid array.");
                }

            } catch (e) {
                //console.error("The object retrieved by .DataTable() seems like a DataTables instance, but its settings are inaccessible.");
            }
    
    
        } else {
            //console.error("Please ensure initializeDataTable() function is called and completes without errors before the search button is clicked.");
        }
    });

    // 초기화 버튼 클릭 이벤트
    $("#reset_btn").on("click", function () {
        resetFilters();
        const table = $("#results_table").DataTable();
        table.ajax.reload(null, false); // 테이블 데이터 다시 로드
    });
}

/**
 * 검색 조건 초기화
 */
function initFilters() {
    estate_type_get(); // 매물종류 필터
    sale_type_get(); // 거래종류 필터
    sido_get(); // 시/도 필터

    // 가격대 슬라이더 초기화
    const priceSlider = document.getElementById("price_slider");
    const areaSlider = document.getElementById("area_slider");
    set_price_slider(priceSlider);
    set_area_slider(areaSlider);

    setInitialSliderValues(priceSlider, "minPrice", "maxPrice");
    setInitialSliderValues(areaSlider, "minArea", "maxArea");
}
/**
 * 필터 파라미터 수집
 */
function collectFilterParams() {
    const params =  {
        sido: $("#sido").val(),
        sgg: $("#sgg").val(),
        estateType: $("#estate_type").val(),
        saleType: $("#sale_type").val(),
        minPrice: $("#input_price_start").val(),
        maxPrice: $("#input_price_end").val(),
        minArea: $("#input_area_start").val(),
        maxArea: $("#input_area_end").val(),
    };
    return params;
}
/**
 * 필터 초기화
 */
function resetFilters() {
    $("#sido").val("");
    $("#sgg").val("");
    $("#sgg").find("option:not(:first)").remove();
    $("#estate_type").val([]).trigger("change");
    $("#sale_type").val([]).trigger("change");

    const priceSlider = document.getElementById("price_slider");
    const areaSlider = document.getElementById("area_slider");
    //priceSlider.noUiSlider.set([0, 200000]);
    priceSlider.noUiSlider.set([0, 100000000]);
    areaSlider.noUiSlider.set([0, 1000000]);

    var newUrl = window.location.href.split("?")[0];
    window.history.replaceState(null, "", newUrl);

}

/**
 * 거래종류에 따른 배지 클래스 반환
 */
function getBadgeClass(saleType) {
    return saleType === "매매" ? "bg-green1" : saleType === "전세" ? "bg-violet1" : saleType === "월세" ? "bg-indigo1" : "";
}
/**
 * 시/도 가져오는 함수
 * @returns
 */
async function sido_get() {
    const dataObj = {};

    callApiAbort("/front/back/find/sido_get.php", "POST", dataObj, "sido_get")
        .then((response) => {
            populateOptions("#sido", response.responseData, "sido_cd", "locallow_nm");
        })
        .catch((error) => {
            console.error("API 호출 실패", error);
        })
        .finally(async () => {
            // sido 쿼리 스트링 있으면 필터에 적용
            const sido = getParameter("sido");
            if (sido) {
                $("#sido").val(sido);
                sgg_get(sido);
            }
        });
}

/**
 * 시/군/구 가져오는 함수
 * @returns
 */
async function sgg_get(sido_cd) {
    const dataObj = {
        sido_cd: encodeURIComponent(sido_cd || getParameter("sido")),
    };

    callApiAbort("/front/back/find/sgg_get.php", "POST", dataObj, "sgg_get")
        .then((response) => {
            $("#sgg").empty().append('<option value="">선택하세요.</option>');
            populateOptions("#sgg", response.responseData, "sgg_cd", "locatadd_nm");
        })
        .catch((error) => {
            console.error("API 호출 실패", error);
        })
        .finally(() => {
            // sgg 쿼리 스트링 있으면 필터에 적용
            const sgg = getParameter("sgg");
            if (sgg) {
                $("#sgg").val(sgg);
            }
        });
}
/**
 * 필터 값을 설정하는 함수
 * @param {string} selector jQuery 선택자
 * @param {string} param URL 파라미터 이름
 * @param {boolean} isArray 배열 여부
 */
function setFilterValue(selector, param, isArray = false) {
    const value = getParameter(param);
    if (value) {
        const decodedValue = isArray ? decodeURIComponent(value).split(",") : value;
        $(selector).val(decodedValue).trigger("change");
    }
}

/**
 * 초기 슬라이더 값을 설정하는 함수
 * @param {Object} slider noUiSlider 객체
 * @param {string} minParam 최소값 파라미터 이름
 * @param {string} maxParam 최대값 파라미터 이름
 */
function setInitialSliderValues(slider, minParam, maxParam) {
    const currentMin = getParameter(minParam);
    const currentMax = getParameter(maxParam);
    if (currentMin && currentMax) {
        slider.noUiSlider.set([currentMin, currentMax]);
    }
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
/**
 * 슬라이더를 생성하는 함수
 * @param {Object} slider noUiSlider 객체
 * @param {Array} range 슬라이더 범위
 * @param {number} step 슬라이더 스텝
 * @param {string} type 타입 (price 또는 area)
 */
function createSlider(slider, range, step, type) {
    noUiSlider.create(slider, {
        start: range,
        connect: true,
        tooltips: true,
        step: step,
        range: {
            min: range[0],
            max: range[1],
        },
        format: wNumb({ decimals: 0 }),
    });

    const inputStart = document.getElementById(`input_${type}_start`);
    const inputEnd = document.getElementById(`input_${type}_end`);

    slider.noUiSlider.on("update", function (values, handle) {
        (handle ? inputEnd : inputStart).value = values[handle];
    });

    inputStart.addEventListener("change", function () {
        slider.noUiSlider.set([this.value, null]);
    });

    inputEnd.addEventListener("change", function () {
        slider.noUiSlider.set([null, this.value]);
    });
}

/**
 * 가격대 필터 셋팅 함수
 * @param {*} slider
 */
function set_price_slider(slider) {
    const min = 0;
    const max = 100000000;

    // range - 가격대 //
    noUiSlider.create(slider, {
        start: [min, max], //  초기 시작값 설정
        connect: true, // 슬라이더 핸들 사이를 채움
        // 툴팁 단위설정
        tooltips: [
            {
                to: function (value) {
                    return value; // 소수점 이하 2자리로 반올림
                    // return formatPrice(Math.round(value * 100) / 100); // 소수점 이하 2자리로 반올림
                },
            },
            {
                to: function (value) {
                    return value; // 소수점 이하 2자리로 반올림
                    // return formatPrice(Math.round(value * 100) / 100); // 소수점 이하 2자리로 반올림
                },
            },
        ],
        step: 1000, // 슬라이더 스텝 크기 설정
        keyboardSupport: true, // 키보드 지원 활성화
        keyboardDefaultStep: 1000, // 키보드 화살표 키 기본 스탭 크기
        keyboardPageMultiplier: 1000, // Page Up/Down 키에 대한 배수(기본 스텝 크기 기준)
        // keyboardMultiplier: 10, // Shift 키와 함께 사용할 때 배수(기본 스텝 크기 기준)
        range: {
            min: min, // 슬라이더 최소값
            max: max, // 슬라이더 최대값
        },
        format: wNumb({
            decimals: 0, // 소수점 자릿수 설정
            suffix: "", // 접미사 설정 (여기서는 빈 문자열)
        }),
    });

    // 인풋박스와 연동
    const inputNumber = document.getElementById("input_price_start");
    const inputNumber2 = document.getElementById("input_price_end");
    inputNumber &&
        inputNumber2 &&
        slider &&
        (slider.noUiSlider.on("update", function (e, i) {
            e = e[i];
            i ? (inputNumber2.value = e) : (inputNumber.value = e);
        }),
        inputNumber.addEventListener("change", function () {
            slider.noUiSlider.set([this.value, null]);
        }),
        inputNumber2.addEventListener("change", function () {
            slider.noUiSlider.set([null, this.value]);
        }));

    // 툴팁 병합 처리 함수 호출
    mergeTooltips(slider, 50, " ~ ");
    // 툴팁 항상 생성하기
    // mergeTooltips(slider, 100000, " - ");
}

/**
 * 면적 필터 셋팅 함수
 * @param {*} slider
 */
function set_area_slider(slider) {
    // range - 면적 //
    noUiSlider.create(slider, {
        start: [0, 1000000], //  초기 시작값 설정
        connect: true, // 슬라이더 핸들 사이를 채움
        // 툴팁 단위설정
        tooltips: [
            {
                to: function (value) {
                    return value + "㎡";
                },
            },
            {
                to: function (value) {
                    return value + "㎡";
                },
            },
        ],
        step: 10, // 슬라이더 스텝 크기 설정
        keyboardSupport: true, // 키보드 지원 활성화
        keyboardDefaultStep: 50, // 키보드 화살표 키 기본 스탭 크기
        keyboardPageMultiplier: 20, // Page Up/Down 키에 대한 배수(기본 스텝 크기 기준)
        keyboardMultiplier: 10, // Shift 키와 함께 사용할 때 배수(기본 스텝 크기 기준)
        range: {
            min: 0, // 슬라이더 최소값
            max: 1000000, // 슬라이더 최대값
        },
        format: wNumb({
            decimals: 0, // 소수점 자릿수 설정
            suffix: "", // 접미사 설정 (여기서는 빈 문자열)
        }),
    });

    // 인풋박스와 연동inputNumber
    const inputNumber = document.getElementById("input_area_start");
    const inputNumber2 = document.getElementById("input_area_end");
    inputNumber &&
        inputNumber2 &&
        slider &&
        (slider.noUiSlider.on("update", function (e, i) {
            e = e[i];
            i ? (inputNumber2.value = e) : (inputNumber.value = e);
        }),
        inputNumber.addEventListener("change", function () {
            slider.noUiSlider.set([this.value, null]);
        }),
        inputNumber2.addEventListener("change", function () {
            slider.noUiSlider.set([null, this.value]);
        }));

    // 툴팁 항상 생성하기
    mergeTooltips(slider, 50, " ~ ");
}

/**
 * 툴팁 병합 처리 함수
 * @param slider 초기화된 슬라이더의 HTML 요소
 * @param threshold 툴팁 병합을 위한 최소 거리 (퍼센트 단위)
 * @param separator 병합된 툴팁을 구분하는 문자열
 */
function mergeTooltips(slider, threshold, separator) {
    var tooltips = slider.noUiSlider.getTooltips();
    var origins = slider.noUiSlider.getOrigins();
    var isVertical = slider.noUiSlider.options.orientation === "vertical";

    // 슬라이더 종류에 따른 형식 함수 설정
    const formatValue = slider.id === "price_slider" ? (value) => formatPrice(value) : (value) => value + "㎡"; // 면적 슬라이더의 경우

    // 툴팁을 원래 위치에 추가
    tooltips.forEach(function (tooltip, index) {
        if (tooltip) {
            origins[index].appendChild(tooltip);
        }
    });

    slider.noUiSlider.on("update", function (values, handle, unencoded, tap, positions) {
        var pools = [[]]; // 병합 그룹들
        var poolValues = [[]]; // 병합된 값
        var atPool = 0;

        // 첫 번째 툴팁을 첫 번째 병합 그룹에 추가하고 형식을 유지
        if (tooltips[0]) {
            pools[0].push(0);
            poolValues[0].push(formatValue(values[0])); // 첫 툴팁의 형식 유지
        }

        for (var i = 1; i < positions.length; i++) {
            // 병합 기준 초과 시 새로운 병합 그룹을 시작
            if (!tooltips[i] || positions[i] - positions[i - 1] > threshold) {
                atPool++;
                pools[atPool] = []; // 새로운 병합 그룹으로 초기화
                poolValues[atPool] = []; // 병합 값도 초기화
            }

            // 현재 툴팁을 병합 그룹에 추가
            if (tooltips[i]) {
                pools[atPool].push(i);
                poolValues[atPool].push(formatValue(values[i])); // formatPrice로 값 형식 유지
            }
        }

        // 병합 그룹을 순회하며, 각 그룹의 마지막 툴팁에만 병합된 내용을 표시
        pools.forEach(function (pool, poolIndex) {
            var handlesInPool = pool.length;

            pool.forEach(function (handleIndex, j) {
                var tooltip = tooltips[handleIndex];

                // 병합 그룹의 마지막 툴팁에만 병합된 내용을 표시
                if (j === handlesInPool - 1) {
                    var offset = 0;

                    pool.forEach(function (index) {
                        offset += 1000 - positions[index];
                    });

                    var direction = isVertical ? "bottom" : "right";
                    var lastOffset = 1000 - positions[pool[pool.length - 1]];
                    offset = offset / handlesInPool - lastOffset;

                    // 병합된 툴팁 내용 설정 (formatPrice로 형식 유지)
                    tooltip.innerHTML = poolValues[poolIndex].join(separator);
                    tooltip.style.display = "block";
                    tooltip.style[direction] = offset + "%";
                } else {
                    // 나머지 툴팁 숨김
                    tooltip.style.display = "none";
                }
            });
        });
    });
}
