$(document).ready(function () {

    if ($("#put_results_table").length > 0) {
        //console.log("#put_results_table element exists in DOM");
    } else {
       // console.error("#put_results_table element does not exist in DOM");
    }

    initFilters();
    initializeDataTable(); // 테이블 초기화
    initEvents();
    
    //console.log("Document is ready"); // 문서 로드 확인


    // 이벤트 위임 방식으로 클릭 이벤트 바인딩
    $("#put_results_table_container").on("click", "tr", function () {
        const putNo = $(this).data("put-no"); // *** 여기 수정! ***
        //console.log("Row clicked, put No:", putNo); // 수정 후 로그 확인
        if (putNo) {
            location.href = `put_view.html?viewNo=${putNo}`;
        }
    });

    $("#put_results_table").on("click", "thead th", function() {
        //console.log("TH clicked:", $(this).text());
        const table = $("#put_results_table").DataTable();
        // 클릭된 th에 대한 DataTables 셀 객체 가져오기
        const cell = table.cell(this);
        if (cell) {
            const colIndex = cell.index().column;
            //console.log("Clicked column index:", colIndex);
            // 해당 컬럼이 orderable 한지 확인
            const column = table.column(colIndex);
            //console.log("Is column orderable?", column.orderable()); // true 가 나와야 정렬 가능 설정된 컬럼
        } else {
             //console.log("Could not get DataTables cell object for clicked TH.");
        }
        // 이 시점에서 브라우저 Network 탭에서 새로운 AJAX 요청이 나가는지 확인합니다.
    });

    //[].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function (e) {
    //    return new bootstrap.Tooltip(e);
    //});

});

/**
 * 필터 함수 초기화
 */
function initFilters() {
    estate_type_get(); // 필터(매물종류)
    sale_type_get(); // 필터(거래종류)
    sido_get(); // 필터(시/도)

    // 필터(가격대)
    var priceSlider = document.getElementById("price_slider");
    var areaSlider = document.getElementById("area_slider");
    set_pice_slider(priceSlider);
    set_area_slider(areaSlider);

    setInitialSliderValues(priceSlider, "minPrice", "maxPrice");
    setInitialSliderValues(areaSlider, "minArea", "maxArea");
}

/**
 * DataTables 초기화
 */
function initializeDataTable() {
    //console.log("initializeDataTable called"); // 함수 시작 로그
    
    if ($.fn.DataTable.isDataTable("put_results_table")) {
        //console.log("Destroying existing DataTable instance");
        $("#put_results_table").DataTable().destroy();
    }
    
    //console.log("Initializing DataTable with AJAX function..."); // 초기화 확인
    const table = new DataTable("#put_results_table", {
        language: {
            url: "/assets/libs/datatables/lang/ko.json",
        },
        scrollX: true,
        scrollY: "500px", // 세로 스크롤 활성화 및 높이 설정
        scrollCollapse: true, // 테이블 높이가 데이터보다 작을 경우 스크롤 영역 축소
        processing: true,
        responsive: true,
        //destroy: true, // 이 옵션은 필요 없을 수 있습니다. initializeDataTable 함수를 한 번만 부르는 로직으로 충분.
        lengthChange: false, // 페이지당 보이는 개수 드롭다운 숨기기
        paging: false, // 페이지네이션 숨기기
        searching: false, // 검색창 숨기기
        createdRow: function (row, data, dataIndex) {
            // 'row'는 현재 생성되고 있는 <tr> DOM 요소입니다.
            // 'data'는 이 행에 해당하는 서버 응답 데이터 객체입니다.
            // 'dataIndex'는 데이터 배열에서의 이 행의 인덱스입니다.

            // data 객체에는 서버로부터 받은 put_no 값이 포함되어 있을 것입니다.
            // 이 값을 가져와 <tr> 요소에 data-put-no 속성으로 설정합니다.
            if (data && data.put_no !== undefined) {
                $(row).attr('data-put-no', data.put_no); // <tr> 요소에 data-wanted-no 속성 추가
            }

            // (선택 사항) 마우스 커서 변경
            $(row).css('cursor', 'pointer');
        },
        // *** createdRow 옵션 끝 ***
        columns: [
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
        ],
        order: [],
         // *** 이 부분이 일괄 정렬 설정입니다. ***
        columnDefs: [
            //{ className: "dt-center", targets: "_all" } // 모든 컬럼을 가운데 정렬
            //{ className: "dt-left",   targets: "_all" } // 모든 컬럼을 왼쪽 정렬
             { className: "dt-right",  targets: "_all" } // 모든 컬럼을 오른쪽 정렬
        ],
        // *** 설정 끝 ***
        // *** AJAX 데이터 로드 설정 (함수 형태) ***
        // DataTables의 ajax 함수 설정
        //ajax: function (data, callback, settings) {
        //    console.log("DataTable ajax function triggered."); // ajax 함수 호출 확인 로그
        //    const params = collectFilterParams(); // 현재 필터 파라미터 수집
        //    console.log("Collected filter params for AJAX:", params); // 수집된 파라미터 확인

            // fetchAndRenderPropertyList 대신, 데이터를 가져오는 로직만 수행하고
            // DataTables 콜백 함수에 데이터를 전달합니다.
            // fetchAndRenderPropertyList 안의 데이터 가져오는 부분을 이곳으로 옮기거나,
            // fetchAndRenderPropertyList가 데이터를 가져온 후 DataTables의 callback 함수를 호출하도록 수정합니다.

            // 예시: fetchAndRenderPropertyList 함수를 수정하여 callback을 받도록 함
        //    fetchDataForDataTable(params, callback); // 이 함수가 데이터를 가져와 callback을 호출하도록 수정

        //},
        // ... 기타 설정
        ajax: function (data, callback, settings) {
            //console.log("DataTable ajax function triggered by DataTables.");

            // DataTables가 보내는 기본 파라미터(페이지 정보, 정렬 정보 등)와
            // collectFilterParams()에서 가져온 검색 필터 파라미터를 합칩니다.
            // DataTables의 'data' 파라미터 안에는 start, length, order, search 등의 정보가 있습니다.
            const filterParams = collectFilterParams();
            const requestParams = $.extend({}, data, filterParams); // DataTables 기본 파라미터와 필터 파라미터 병합

            //console.log("Sending AJAX request with merged params:", requestParams); // 서버로 보낼 최종 파라미터 확인

            // fetchAndRenderPropertyList의 내부 로직 (API 호출 부분)을 이곳으로 옮기거나,
            // fetchAndRenderPropertyList 함수를 DataTables 콜백을 받도록 수정합니다.

            // Option 1: fetchAndRenderPropertyList 내부 로직을 이곳으로 옮기는 경우
            callApi("POST", "/front/back/put/put_list.php", requestParams) // 병합된 파라미터 전달
                .then((response) => {
                    //console.log("API Response received for DataTables:", response);

                    if (response && response.responseData) {
                         // 서버 응답 데이터를 DataTables가 기대하는 형식으로 가공
                         // serverSide: true 이므로 { data: [...], recordsTotal: N, recordsFiltered: M } 형태 필수
                         const dtResponse = {
                             data: response.responseData, // 테이블에 표시할 실제 데이터 배열
                             recordsTotal: response.total_records || 0, // 필터링 전 총 레코드 수 (필요하다면 API에서 제공)
                             recordsFiltered: response.total_records || 0 // 필터링 후 총 레코드 수 (검색 결과의 총 개수)
                         };
                         // DataTables 콜백 함수 호출하여 데이터 전달
                         callback(dtResponse);
                         //console.log("DataTable callback function called with data.");

                         // 총 건수만 여기서 업데이트 (테이블 렌더링은 DataTables가 스스로 합니다)
                         $("#total_count").text(typeof comma === 'function' ? comma(dtResponse.recordsFiltered) : dtResponse.recordsFiltered);

                    } else {
                        // 데이터가 없을 경우 빈 배열 전달
                        callback({ data: [], recordsTotal: 0, recordsFiltered: 0 });
                        //console.warn("API response has no data or invalid format.");
                         $("#total_count").text(0);
                    }
                })
                .catch((error) => {
                    //console.error("데이터 로딩 중 오류 발생:", error);
                    // 에러 발생 시 빈 데이터 전달
                    callback({ data: [], recordsTotal: 0, recordsFiltered: 0 });
                    //console.error("DataTable callback function called with empty data due to error.");
                     $("#total_count").text(0);
                });

            // Option 2: fetchAndRenderPropertyList 함수를 수정하여 DataTables 콜백을 받도록 하는 경우
            // fetchDataForDataTable(requestParams, callback); // 수정된 함수를 호출하고 callback 전달

        },
        // DataTables의 서버 사이드 처리 활성화 (API가 페이징, 정렬, 검색 처리)
        //serverSide: true,
        
        // DataTables에게 어떤 파라미터를 서버에 보낼지 정의 (필요하다면)
        // 기본 DataTables 파라미터(start, length, order, search) 외에 추가 파라미터 정의
        // ajax.data 옵션을 사용하여 DataTables 기본 파라미터와 filterParams를 합치는 것이 더 유연합니다.
        /*
        ajax: {
            url: "/front/back/put/put_list.php",
            type: "POST", // 또는 GET
            data: function (d) {
                 // d는 DataTables 기본 파라미터 객체
                 const filterParams = collectFilterParams();
                 // DataTables 기본 파라미터에 필터 파라미터 추가
                 return $.extend({}, d, filterParams);
            },
            dataSrc: function (json) {
                 // 서버 응답 json에서 실제 데이터 배열을 반환
                 // 여기서는 { data: [...], recordsTotal: N, recordsFiltered: M } 형식이므로 json.data를 반환
                 // 만약 응답이 { responseData: [...], ... } 라면 json.responseData를 반환
                 // 그리고 total_records, total_pages 등의 정보는 json에 직접 있어야 합니다.
                 // DataTables는 dataSrc 함수가 아닌, ajax 함수 자체의 callback으로 { data: [...], ... } 객체를 전달받는 방식을 선호합니다.
                 // 따라서 Option 1의 방식이 더 일반적입니다.
                 console.log("DataTables dataSrc function received JSON:", json);
                 // 총 건수 업데이트 로직을 DataTables ajax 함수의 success 콜백 안으로 옮기는 것이 좋습니다.
                 const totalRecords = json.total_records || 0;
                 $("#total_count").text(typeof comma === 'function' ? comma(totalRecords) : totalRecords);

                 return json.responseData; // 실제 데이터 배열을 반환
            },
            error: function(xhr, status, error) {
                 console.error("DataTables AJAX error:", error);
                 $("#total_count").text(0);
                 // 에러 발생 시 DataTables에 에러를 알림 (빈 데이터 등)
                 // DataTables 콜백 함수를 직접 호출하는 Option 1 방식이 에러 처리에 더 용이합니다.
            }
        }
        */
        // *** DataTables 초기화 완료 후 실행될 코드 추가 ***
        initComplete: function(settings, json) {
            // 테이블 헤더에 구분선 추가
            // DataTables가 완전히 그려진 후에 실행되므로 th 요소가 존재합니다.
            $("#put_results_table_wrapper .dt-scroll-head thead th").css("border-bottom", "2px solid #999");
        
        }
        // *** initComplete 옵션 끝 ***
    });

    if (table) {
        //console.log("DataTable initialized successfully:", table); // 초기화 성공 확인
    } else {
        //console.error("DataTable initialization failed!");
    }
    //console.log("initializeDataTable function finished."); // 함수 종료 로그
}

/**
 * 이벤트 모음 함수
 */
function initEvents() {
    // [EVENT] 변경 이벤트 - 시/도 필터
    $("#sido").on("change", function () {
        const sido_cd = $(this).val();
        sgg_get(sido_cd); // 필터(시/군/구)
    });

    // [Event] 클릭 이벤트 - 검색 버튼
    $("#search_btn").off("click").on("click", function () {
        //console.log("Search button clicked"); // 디버깅용 로그
    
        // DataTables 인스턴스가 해당 요소에 존재하는지 먼저 확인
        if ($.fn.DataTable.isDataTable("#put_results_table")) {
             //console.log("DataTable instance IS recognized by $.fn.DataTable.isDataTable().");
    
             // 인스턴스가 존재한다면, API 인스턴스를 가져옵니다.
             const table = $("#put_results_table").DataTable();
    
             console.log("Retrieved DataTable API instance:", table);
             // console.log("Type of retrieved object:", typeof table); // 객체 타입 확인
    
             // 인스턴스가 유효한지, 그리고 settings를 통해 ajax 설정을 가져올 수 있는지 확인
             try {
                 // settings() 메서드 호출 결과 확인
                 const settingsArray = table.settings();
                 //console.log("Result of table.settings():", settingsArray);
                 // console.log("Type of settingsArray:", typeof settingsArray); // 배열 타입 확인
                 // console.log("Length of settingsArray:", settingsArray ? settingsArray.length : 'N/A'); // 배열 길이 확인
    
                 if (settingsArray && settingsArray.length > 0 && settingsArray[0]) {
                     //console.log("Accessing settingsArray[0]:", settingsArray[0]);
                     // settingsArray[0]가 유효하다면 ajax 속성에 접근
                     const ajaxSetting = settingsArray[0].ajax;
                     //console.log("DataTable ajax setting:", ajaxSetting);
                     //console.log("Type of ajax setting:", typeof ajaxSetting);
    
                     if (typeof ajaxSetting === 'function') {
                          //console.log("ajax setting is a function. Proceeding with reload.");
                          table.ajax.reload(null, false); // 테이블 데이터 다시 로드
                     } else {
                          //console.warn("DataTable instance found, but its ajax setting is not a function as expected.");
                          //console.warn("Current ajax setting:", ajaxSetting);
                     }
                 } else {
                      //console.warn("DataTable instance found, but settings() returned an empty or invalid array.");
                 }
    
             } catch (e) {
                 //console.error("Error attempting to access DataTable settings:", e);
                 //console.error("The object retrieved by .DataTable() seems like a DataTables instance, but its settings are inaccessible.");
             }
    
    
        } else {
            //console.error("DataTable instance NOT found using $.fn.DataTable.isDataTable().");
            //console.error("This means the table was likely not initialized successfully or was destroyed before button click.");
            //console.error("Please ensure initializeDataTable() function is called and completes without errors before the search button is clicked.");
        }
    });

    // [Event] 클릭 이벤트 - 초기화 버튼
    $("#reset_btn").on("click", function () {
        resetFilters();
        const table = $("#put_results_table").DataTable();
        //console.log("Reloading table with params:", collectFilterParams()); // 디버깅용 로그
        table.ajax.reload(null, false); // 테이블 데이터 다시 로드
    });

    $("#put_results_table tbody").on("click", "tr", function() {
        const wantedNo = $(this).data("put-no");
        //console.log("Row clicked, put-no:", wantedNo);
        // wantedNo를 사용하여 상세 페이지 이동 등의 로직 수행
        // 예: window.location.href = '/detail_page.html?no=' + wantedNo;
    });
    
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
    //console.log("Collected filter params:", params); // 필터 값 확인
    return params;
}

/**
 * 필터 초기화 함수
 */
function resetFilters() {
    $("#sido").val("");
    $("#sgg").val("");
    $("#sgg").find("option:not(:first)").remove();
    $("#estate_type").val([]).trigger("change");
    $("#sale_type").val([]).trigger("change");
    //$(".sort-btn button").removeClass("active");
    //$("#sort_latest").addClass("active");

    var priceSlider = document.getElementById("price_slider");
    var areaSlider = document.getElementById("area_slider");
    //priceSlider.noUiSlider.set([0, 200000]);
    priceSlider.noUiSlider.set([0, 100000000]);
    areaSlider.noUiSlider.set([0, 1000000]);


    var newUrl = window.location.href.split("?")[0];
    window.history.replaceState(null, "", newUrl);

    //initFindList();
}

/**
 * 거래종류에 따른 배지 클래스 반환
 */
function getBadgeClass(saleType) {
    return saleType === "매매" ? "bg-green1" : saleType === "전세" ? "bg-violet1" : saleType === "월세" ? "bg-indigo1" : "";
}


// =============================================================================
// 검색 필터 관련 함수
// =============================================================================
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
            const estateTypeArray = getParameter("saleType");

            if (estateTypeArray) {
                const decodedArray = decodeURIComponent(estateTypeArray).split(",");
                sale_type.val(decodedArray).trigger("change");
            }
        });
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
 * 가격대 필터 셋팅 함수
 * @param {*} slider
 */
function set_pice_slider(slider) {
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
                    return formatPrice(Math.round(value * 100) / 100); // 소수점 이하 2자리로 반올림
                },
            },
            {
                to: function (value) {
                    return formatPrice(Math.round(value * 100) / 100); // 소수점 이하 2자리로 반올림
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

    // 툴팁 항상 생성하기
    mergeTooltips(slider, 50, " ~ ");
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

// =============================================================================
// 리스트 관련 함수
// =============================================================================
/**
 * 데이터 불러오는 함수
 * @param {*} table
 * @param {*} callback
 */
function initFindList() {
    // return;
    // const dataObj = collectFilterParams();

    const dataObj = {
        sido: encodeURIComponent(getParameter("sido") || ""),
        sgg: encodeURIComponent(getParameter("sgg") || ""),
        estate_type: getParameter("estateType") || "",
        sale_type: getParameter("saleType") || "",
        min_price: encodeURIComponent(getParameter("minPrice") || ""),
        max_price: encodeURIComponent(getParameter("maxPrice") || ""),
        min_area: encodeURIComponent(getParameter("minArea") || ""),
        max_area: encodeURIComponent(getParameter("maxArea") || ""),
        sort: encodeURIComponent(getParameter("sort") || ""),
        page: encodeURIComponent(getParameter("page") || 1),
        items_per_page: encodeURIComponent(getParameter("itemsPerPage") || 12),
    };

    callApiAbort("/front/back/put/put_list.php", "POST", dataObj, "loadLists")
        .then((response) => {
            // API 호출 성공
            const { statusCode, message, responseData, current_page, total_pages, total_records } = response;

            // 결과 1개 이상
            if (responseData.length > 0) {
                const liHtml = responseData
                    .map(function (item) {
                        const badgeClass = item.sale_type == "매매" ? "bg-green1" : item.sale_type == "전세" ? "bg-violet1" : item.sale_type == "월세" ? "bg-indigo1" : "";

                        // 이미지 처리
                        let imageSrc = "";
                        let image = "";
                        if (item.imageArray.length > 0) {
                            imageSrc = `/front/back/put/put_images.php?token=${encodeURIComponent(item.imageArray[0].imageToken)}`;
                            image = `<img class="thumbnail" src="/front/back/put/put_images.php?token=${encodeURIComponent(item.imageArray[0].imageToken)}" alt="" width="100">`;
                        }

                        return `
                            <li onclick="location.href='put_view.html?viewNo=${item.put_no}';">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h2>${item.sido} ${item.sido !== item.sgg && item.sgg ? item.sgg : " "}</h2>
                                        <h3 class="d-flex align-items-center gap-1"><span class="label-default ${badgeClass}">${item.sale_type}</span> ${item.estate_type}</h3>
                                        <h4>${item.area}㎡(${convertToPyeong(item.area)}평)</h4>
                                    </div>
                                    ${image}
                                </div>
                                <h5>${formatPrice(item.sale_price)}${item.sale_type == "월세" ? "/" + formatPrice(item.rent_price) : ""}</h5>
                                <dl>
                                    <dt><i class="fa-light fa-clock"></i> ${item.reg_date}</dt>
                                    <dd><i class="fa-sharp fa-solid fa-bell"></i> ${item.noti_count}명</dd>
                                </dl>
                            </li>`;
                    })
                    .join("");

                $("#put_list_ul").html(liHtml);
                $("#total_count").text(comma(total_records));
            } else {
                const noDataHtml = "<p>결과값이 존재하지 않습니다.</p>";
                $("#put_list_ul").html(noDataHtml);
            }

            // 페이지 정보 업데이트
            updatePagination(total_records, current_page, dataObj.items_per_page);
        })
        .catch((error) => {
            // API 호출 실패
            console.error("API 호출 실패", error);
            $("#put_list_ul").html("<p>결과값이 존재하지 않습니다.</p>");
        })
        .finally(() => {
            // API 호출 완료
        });
}

/**
 * 페이지 정보 업데이트 함수
 * @param {number} totalRecords 총 레코드 수
 * @param {number} currentPage 현재 페이지
 * @param {number} itemsPerPage 페이지당 항목 수
 */
function updatePagination(totalRecords, currentPage, itemsPerPage) {
    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    const maxVisiblePages = 5; // 한 번에 보이는 최대 페이지 수

    const $paginationContainer = $(".paging-list");
    $paginationContainer.empty();

    // 맨 처음 페이지로 이동 버튼
    const $firstPage = $("<a href='javascript:void(0)' class='first_page' data-page='1'><i class='fas fa-angle-double-left'></i></a>");
    if (currentPage > 1) {
        $firstPage.on("click", handlePageClick);
    } else {
        $firstPage.addClass("disabled");
    }
    $paginationContainer.append($firstPage);

    // 이전 페이지 버튼
    const $prevPage = $(`<a href='javascript:void(0)' class='prev_page' data-page='${currentPage - 1}'><i class='fas fa-caret-left'></i></a>`);
    if (currentPage > 1) {
        $prevPage.on("click", handlePageClick);
    } else {
        $prevPage.addClass("disabled");
    }
    $paginationContainer.append($prevPage);

    // 현재 페이지를 기준으로 보이는 페이지 번호 범위 계산
    const halfMaxVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfMaxVisible);
    let endPage = Math.min(totalPages, currentPage + halfMaxVisible);

    if (currentPage - halfMaxVisible < 1) {
        endPage = Math.min(totalPages, endPage + (1 - (currentPage - halfMaxVisible)));
    }

    if (currentPage + halfMaxVisible > totalPages) {
        startPage = Math.max(1, startPage - (currentPage + halfMaxVisible - totalPages));
    }

    // 페이지 번호 버튼
    for (let i = startPage; i <= endPage; i++) {
        const $pageLink = $(`<a href='javascript:void(0)' class='move_page' data-page='${i}'>${i}</a>`);
        if (i === currentPage) {
            $pageLink.addClass("active");
        } else {
            $pageLink.on("click", handlePageClick);
        }
        $paginationContainer.append($pageLink);
    }

    // 다음 페이지 버튼
    const $nextPage = $(`<a href='javascript:void(0)' class='next_page' data-page='${currentPage + 1}'><i class='fas fa-caret-right'></i></a>`);
    if (currentPage < totalPages) {
        $nextPage.on("click", handlePageClick);
    } else {
        $nextPage.addClass("disabled");
    }
    $paginationContainer.append($nextPage);

    // 맨 끝 페이지로 이동 버튼
    const $lastPage = $(`<a href='javascript:void(0)' class='last_page' data-page='${totalPages}'><i class='fas fa-angle-double-right'></i></a>`);
    if (currentPage < totalPages) {
        $lastPage.on("click", handlePageClick);
    } else {
        $lastPage.addClass("disabled");
    }
    $paginationContainer.append($lastPage);
}

/**
 * 페이지 클릭 이벤트 핸들러
 * @param {Event} e 이벤트 객체
 */
function handlePageClick(e) {
    e.preventDefault();
    const page = $(this).data("page");
    updateQueryString("page", page);
}

// =============================================================================
// 헬퍼 함수
// =============================================================================

/**
 * 필터 파라미터를 수집하는 함수
 * @returns {Object} 필터 파라미터 객체
 */
function collectFilterParams() {
    return {
        sido: $("#sido").val(),
        sgg: $("#sgg").val(),
        estateType: $("#estate_type").val(),
        saleType: $("#sale_type").val(),
        minPrice: $("#input_price_start").val(),
        maxPrice: $("#input_price_end").val(),
        minArea: $("#input_area_start").val(),
        maxArea: $("#input_area_end").val(),
        page: getParameter("page") || 1,
        items_per_page: getParameter("itemsPerPage") || 12,
    };
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
 * 페이지네이션 버튼을 추가하는 함수
 * @param {Object} container jQuery 컨테이너
 * @param {string} className 클래스 이름
 * @param {number} page 페이지 번호
 * @param {boolean} isEnabled 활성화 여부
 * @param {string} iconClass 아이콘 클래스 이름
 */
function addPaginationButton(container, className, page, isEnabled, iconClass) {
    const $button = $(`<a href='javascript:void(0)' class='${className}' data-page='${page}'><i class='${iconClass}'></i></a>`);
    if (isEnabled) {
        $button.on("click", handlePageClick);
    } else {
        $button.addClass("disabled");
    }
    container.append($button);
}

/**
 * 페이지네이션 번호를 추가하는 함수
 * @param {Object} container jQuery 컨테이너
 * @param {number} page 페이지 번호
 * @param {number} currentPage 현재 페이지
 */
function addPaginationPageNumber(container, page, currentPage) {
    const $pageLink = $(`<a href='javascript:void(0)' class='move_page' data-page='${page}'>${page}</a>`);
    if (page === currentPage) {
        $pageLink.addClass("active");
    } else {
        $pageLink.on("click", handlePageClick);
    }
    container.append($pageLink);
}

/**
 * 현재 페이지와 총 페이지 수를 기준으로 보이는 페이지 범위를 계산하는 함수
 * @param {number} currentPage 현재 페이지
 * @param {number} totalPages 총 페이지 수
 * @param {number} maxVisiblePages 최대 보이는 페이지 수
 * @returns {Object} 시작 페이지와 끝 페이지
 */
function calculateVisiblePages(currentPage, totalPages, maxVisiblePages) {
    const halfMaxVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfMaxVisible);
    let endPage = Math.min(totalPages, currentPage + halfMaxVisible);

    if (currentPage - halfMaxVisible < 1) {
        endPage = Math.min(totalPages, endPage + (1 - (currentPage - halfMaxVisible)));
    }

    if (currentPage + halfMaxVisible > totalPages) {
        startPage = Math.max(1, startPage - (currentPage + halfMaxVisible - totalPages));
    }

    return { startPage, endPage };
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