// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(document).ready(async function () {
    // 필터(매물종류)
    estate_type_get();

    // 필터(거래종류)
    sale_type_get();

    // 필터(시/도)
    sido_get();

    // 필터(가격대)
    var priceSlider = document.getElementById("price_slider");
    var areaSlider = document.getElementById("area_slider");
    set_pice_slider(priceSlider);
    set_area_slider(areaSlider);

    // DataTables 초기화
    initializeDataTable("");

    // [Event] 검색 버튼 클릭
    $("#search_btn").on("click", function () {
        // 테이블 데이터만 다시 불러오기
        loadTableData(null, (data) => {
            const table = $("#ajax-datatables").DataTable();
            table.clear().rows.add(data.data).draw();
        });
    });

    // [Event] 초기화 버튼 클릭
    $("#reset_btn").on("click", function () {
        // animatedSlider.noUiSlider.set(0);
        priceSlider.noUiSlider.set([0, 10000]);
        areaSlider.noUiSlider.set([0, 10000]);
        $("#sido").val("");
        $("#sgg").val("");
        $("#sgg").find("option:not(:first)").remove();
        $("#estate_type").val("");
        $("#sale_type").val("");

        // 테이블 데이터만 다시 불러오기
        loadTableData(null, (data) => {
            const table = $("#ajax-datatables").DataTable();
            table.clear().rows.add(data.data).draw();
        });
    });

    // [Event] 삭제 버튼 클릭
    $(document).on("click", ".delete-btn", function () {
        const no = $(this).attr("data-no");
        wanted_delete(no);
    });

    // [Event] 공개 상태 변경
    $(document).on("click", ".change-public-btn", function () {
        const val = $(this).attr("data-public_fg");
        const no = $(this).attr("data-estate_no");
        public_fg_change(val, no);
    });

    $("#sido").on("change", function () {
        const sido_cd = $(this).val();
        sgg_get(sido_cd);
    });
});

// =============================================================================
// table 관련 함수
// =============================================================================
/**
 * DataTables 초기화
 */
function initializeDataTable() {
    let table = new DataTable("#ajax-datatables", {
        language: {
            url: "/assets/libs/datatables/lang/ko.json",
        },
        initComplete: function () {
            let api = this.api();

            // ====================================================================================================
            // 검색박스 및 선택박스 생성 시작 =====================================================================
            $(".dt-search").addClass("input-group");
            let searchBox = $(".dt-search input").addClass("form-control form-control-sm");
            let columnSelect = $('<select class="form-select form-select-sm"><option value="">전체</option></select>')
                .prependTo(".dt-search")
                .on("change", function () {
                    let selectedColumn = $(this).val();
                    searchBox.trigger("keyup");
                });

            // 각 컬럼 이름으로 옵션 추가
            api.columns().every(function () {
                // 특정 컬럼 제외
                if (this.index() !== 1 && this.index() !== 6 && this.index() !== 7 && this.index() !== 9 && this.index() !== 10) {
                    columnSelect.append('<option value="' + this.index() + '">' + $(this.header()).text() + "</option>");
                }
            });

            // 검색박스 이벤트 핸들러 설정
            searchBox.on("keyup", function () {
                let searchTerm = this.value;
                let selectedColumn = columnSelect.val();

                if (selectedColumn) {
                    api.column(selectedColumn).search(searchTerm).draw();
                } else {
                    api.search(searchTerm).draw();
                }
            });
            // 검색박스 및 선택박스 생성 끝 =====================================================================
            // ====================================================================================================

            // ====================================================================================================
            // 특정 컬럼의 헤더에 선택박스 추가 시작 =================================================================
            api.columns().every(function () {
                var column = this;
                // 10번째 컬럼(인덱스 10)이 선택박스가 되도록 설정
                if (column.index() === 9) {
                    // 선택박스를 생성하고, 클래스와 기본 옵션을 설정합니다.
                    var select = $('<select class="change-public-select form-select form-select-sm" style=""><option value="">공개(전체)</option></select>')
                        .appendTo($(column.header()).empty()) // 생성한 선택박스를 해당 컬럼의 헤더에 추가하고 기존 내용을 비웁니다.
                        .on("change", function () {
                            loadTableData(table); // 선택된 값으로 데이터를 다시 로드
                        });

                    // // 중복된 값 없이 고유한 값만 저장하기 위한 Set
                    // var uniqueValues = new Set();

                    // 해당 컬럼의 데이터에서 고유한 값들을 가져와 선택박스에 옵션으로 추가합니다.
                    column
                        .data()
                        .unique()
                        .sort()
                        .each(function (d, j) {
                            const button = $(d).find("button.public-change-btn"); // 공개 컬럼의 첫 번째 버튼을 가져옵니다.
                            if (button.length && !button.closest("ul").length) {
                                // 버튼이 존재하고, ul의 자식이 아닌지 확인합니다.
                                const text = button.text().trim();
                                const flag = button.attr("data-public_fg");

                                if (text) {
                                    // if (text && !uniqueValues.has(flag)) {
                                    // uniqueValues.add(flag);
                                    // select.append('<option value="' + flag + '">' + text + "</option>"); // 각 고유 값을 선택박스의 옵션으로 추가합니다.
                                    const selectOptions = `
                                    <option value="">공개(전체)</option>
                                    <option value="Y">공개</option>
                                    <option value="N">비공개</option>
                                    <option value="C">거래완료</option>`;
                                    select.html(selectOptions);
                                }
                            }
                        });
                }
            });
            // 특정 컬럼의 헤더에 선택박스 추가 끝 =================================================================
        },
        scrollX: true, // 가로 스크롤 활성화
        processing: true, // 처리 중 메시지 활성화
        // serverSide: true, // 서버 사이드 처리를 활성화
        // colReorder: true,    // 컬럼 이동 활성화
        destroy: true, // 테이블 파괴 가능
        // lengthChange: false,
        ajax: function (data, callback, settings) {
            loadTableData(table, callback);
        },
        columns: [
            // { data: "no", title: "no" }, // 첫 번째 열로 순서를 추가
            { data: "wanted_no", title: "번호" }, // 첫 번째 열로 순서를 추가
            { data: "image", title: "사진", orderable: false, searchable: false },
            { data: "sido", title: "시/도" },
            { data: "sgg", title: "시/군/구" },
            { data: "estate_type", title: "매물종류" },
            { data: "sale_type", title: "거래종류" },
            { data: "sale_price", title: "가격", orderable: false, searchable: false },
            { data: "area", title: "면적", searchable: false },
            { data: "reg_date", title: "등록일자" },
            // { data: "noti_count", title: "알림발송수", searchable: false },
            // { data: "view_count", title: "조회수", searchable: false },
            { data: "public_fg", title: "공개", orderable: false, searchable: false },
            { data: "management", title: "관리", orderable: false, searchable: false },
        ],
        // rowReorder: {
        //     selector: "td:nth-child(1)", // 첫 번째 열을 기준으로 row 재정렬
        // },
        order: [], // 기본 정렬 비활성화
        columnDefs: [
            // { className: "text-start", targets: [0] }, // 첫 번째 열에 좌측 정렬 클래스 추가
            { className: "text-start align-content-center", targets: [0, 1, 2, 3, 4, 5, 6, 7, 8] }, // 모든 열에 좌측 정렬 클래스 추가
            { width: 100, targets: [9] },
            { className: "text-center align-content-center", targets: [9, 10] }, // 10 번째 열에 우측 정렬 클래스 추가
            // { className: "text-end align-content-center", targets: [9] }, // 10 번째 열에 우측 정렬 클래스 추가
        ],
    });
}

/**
 * 테이블 데이터 불러오는 함수
 * @param {*} table
 * @param {*} callback
 */
function loadTableData(table, callback) {
    let filterValue = $(".change-public-select").val() || "";
    const dataObj = {
        ...adminUserInfo(),
        public_fg: filterValue,
        sido: encodeURIComponent($("#sido").val()),
        sgg: encodeURIComponent($("#sgg").val()),
        estate_type: encodeURIComponent($("#estate_type").val()),
        sale_type: encodeURIComponent($("#sale_type").val()),
        min_price: encodeURIComponent($("#input_price_start").val()),
        max_price: encodeURIComponent($("#input_price_end").val()),
        min_area: encodeURIComponent($("#input_area_start").val()),
        max_area: encodeURIComponent($("#input_area_end").val()),
    };
    callApi("POST", "/admin/back/04-estate/put_list.php", dataObj, "loading")
        .then((result) => {
            if (!result) {
                console.log("통신 실패!!!");
                if (callback) callback({ data: [] });
                return;
            }

            const { status, message, responseData } = result;

            if (!responseData) {
                console.log(message);
                if (callback) callback({ data: [] });
                return;
            }

            // 데이터를 올바르게 변환하여 DataTables에 전달합니다.
            const formattedData = responseData.map((item, index) => {
                // 순서(DESC)
                const reversedOrder = responseData.length - index;

                // 공개 상태
                let public_name;
                switch (item.public_fg) {
                    case "Y":
                        public_name = "공개";
                        break;
                    case "N":
                        public_name = "비공개";
                        break;
                    case "C":
                        public_name = "거래완료";
                        break;
                    default:
                        public_name = "공개";
                        break;
                }

                // 이미지 처리
                let image = "";
                if (item.imageArray.length > 0) {
                    image = `<img src="/admin/back/04-estate/estate_images.php?token=${encodeURIComponent(item.imageArray[0].imageToken)}" alt="" width="100">`;
                }

                // 기타메모 5자 이내만 보여지도록
                // const shortNote = item.additional_note.length > 5 ? item.additional_note.substring(0, 5) + "..." : item.additional_note;

                // m2 -> 평
                // const convertedM2 = convertToPyeong(item.platArea);

                return {
                    // no: reversedOrder,
                    wanted_no: item.wanted_no,
                    image: image,
                    sido: item.sido,
                    sgg: item.sgg,
                    estate_type: item.estate_type,
                    sale_type: item.sale_type,
                    // sale_price: comma(item.sale_price) + "만" + (item.rent_price ? " / 월" + comma(item.rent_price) + "만" : ""),
                    // sale_price: formatPrice(item.sale_price) + (item.rent_price ? " / 월" + formatPrice(item.rent_price) : ""),
                    sale_price: `${formatPrice(item.sale_price)}${item.rent_price ? " / 월 " + (item.rent_price == 0 ? 0 : formatPrice(item.rent_price)) : ""}`,
                    area: comma(item.area) + "㎡",
                    phone: item.phone,
                    // noti_count: comma(item.noti_count),
                    // view_count: comma(item.view_count),
                    reg_date: item.reg_date,
                    public_fg: `
                    <div class="dropdown d-inline-block">
                        <button class="public-change-btn btn btn-soft-danger btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-public_fg="${item.public_fg}">
                            ${public_name}
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item change-public-btn" data-public_fg="Y" data-estate_no="${item.wanted_no}">
                                    공개
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item change-public-btn" data-public_fg="N" data-estate_no="${item.wanted_no}">
                                    비공개
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item change-public-btn" data-public_fg="C" data-estate_no="${item.wanted_no}">
                                    거래완료
                                </button>
                            </li>
                        </ul>
                    </div>`,
                    management: `
                    <div class="dropdown d-inline-block">
                        <button class="btn btn-soft-danger btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="ri-more-fill align-middle"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <a href="/admin/views/re_manage/re_put_detail.html?no=${item.wanted_no}" class="dropdown-item">
                                    <i class="ri-eye-fill align-bottom me-2 text-muted"></i>
                                    상세
                                </a>
                            </li>
                            <li>
                                <button data-no="${item.wanted_no}" class="delete-btn dropdown-item">
                                    <i class="ri-delete-bin-fill align-bottom me-2 text-muted"></i>
                                    삭제
                                </button>
                            </li>
                        </ul>
                    </div>`,
                };
            });

            if (callback) {
                callback({ data: formattedData });
            } else {
                table.clear().rows.add(formattedData).draw();
            }

            // 툴팁 초기화
            $('[data-bs-toggle="tooltip"]').tooltip();
        })
        .catch((error) => {
            console.error("AJAX 요청 중 오류 발생:", error);
            if (callback) callback({ data: [] });
        });
}

/**
 * 삭제처리 함수
 * @param {*} rcvNo
 * @returns
 */
async function wanted_delete(rcvNo) {
    const confirm = await sweetConfirm("삭제 하시겠습니까?", "", "w");
    if (!confirm) return;

    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보

    const dataObj = {
        ...adminInfo,
        langCode,
        rcvNo: rcvNo,
    };

    const result = await callApi("POST", "/admin/back/04-estate/put_delete.php", dataObj);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("처리 되었습니다.", "", "s");
        if (!confirm) return;

        // 테이블 데이터만 다시 불러오기
        loadTableData(null, (data) => {
            const table = $("#ajax-datatables").DataTable();
            table.clear().rows.add(data.data).draw();
        });
    } else {
        const confirm = await sweetAlertForReturn("삭제를 실패했습니다.", "", "e");
        if (!confirm) return;
    }
}

/**
 * 공개 상태 변경하는 함수
 * @param {*} val = 변경할 상태값
 * @returns
 */
async function public_fg_change(val, no) {
    const confirm = await sweetConfirm("상태를 변경 하시겠습니까?", "", "q");
    if (!confirm) return;

    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보

    const dataObj = {
        ...adminInfo,
        langCode,
        public_fg: encodeURIComponent(val),
        rcvNo: no,
    };

    const result = await callApi("POST", "/admin/back/04-estate/put_public_fg_change.php", dataObj);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("처리 되었습니다.", "", "s");
        if (!confirm) return;

        // 테이블 데이터만 다시 불러오기
        loadTableData(null, (data) => {
            const table = $("#ajax-datatables").DataTable();
            table.clear().rows.add(data.data).draw();
        });
    } else {
        const confirm = await sweetAlertForReturn("변경에 실패했습니다.", "", "e");
        if (!confirm) return;
    }
}

// =============================================================================
// 검색 필터 관련 함수
// =============================================================================
/**
 * 매물종류 가져오는 함수
 * @returns
 */
async function estate_type_get() {
    const adminInfo = adminUserInfo(); // 관리자 정보

    const dataObj = {
        ...adminInfo,
    };

    const result = await callApi("POST", "/admin/back/04-estate/estate_type_get.php", dataObj);

    if (!result) return;

    const { status, messagem, responseData } = result;

    if (responseData.length > 0) {
        // type_name 기준으로 오름차순 정렬
        /*
        responseData.sort((a, b) => {
            if (a.type_name < b.type_name) return -1;
            if (a.type_name > b.type_name) return 1;
            return 0;
        });

        const optionHtml = responseData
            .map(function (e) {
                return `
                <option value="${e.type_code}" name="${e.group_code}">${e.type_name}</option>`;
            })
            .join("");

        $("#estate_type").append(optionHtml);
        */
        populateOptions2(
            "#estate_type", // selector: 옵션을 추가할 select 태그의 ID
            responseData,   // data: API 응답으로 받은 데이터 배열
            "type_code",    // valueKey: option 태그의 value 속성으로 사용할 데이터의 키
            "type_name",    // textKey: option 태그의 텍스트로 표시할 데이터의 키
            "type_code"     // sortKey: type_name 기준으로 오름차순 정렬
        );
    }
}

/**
 * 거래종류 가져오는 함수
 * @returns
 */
async function sale_type_get() {
    const adminInfo = adminUserInfo(); // 관리자 정보

    const dataObj = {
        ...adminInfo,
    };

    const result = await callApi("POST", "/admin/back/04-estate/sale_type_get.php", dataObj);

    if (!result) return;

    const { status, messagem, responseData } = result;

    if (responseData.length > 0) {
        // // type_name 기준으로 오름차순 정렬
        // responseData.sort((a, b) => {
        //     if (a.type_name < b.type_name) return -1;
        //     if (a.type_name > b.type_name) return 1;
        //     return 0;
        // });

        const optionHtml = responseData
            .map(function (e) {
                return `
                <option value="${e.type_code}">${e.type_name}</option>`;
            })
            .join("");

        $("#sale_type").append(optionHtml);
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
 * 시/도 가져오는 함수
 * @returns
 */
async function sido_get() {
    const adminInfo = adminUserInfo(); // 관리자 정보

    const dataObj = {
        ...adminInfo,
    };

    const result = await callApi("POST", "/admin/back/04-estate/sido_get.php", dataObj);

    if (!result) return;

    const { status, messagem, responseData } = result;

    if (responseData.length > 0) {
        // // type_name 기준으로 오름차순 정렬
        // responseData.sort((a, b) => {
        //     if (a.type_name < b.type_name) return -1;
        //     if (a.type_name > b.type_name) return 1;
        //     return 0;
        // });

        const optionHtml = responseData
            .map(function (e) {
                return `
                <option value="${e.sido_cd}">${e.locallow_nm}</option>`;
            })
            .join("");

        $("#sido").append(optionHtml);
    }
}

/**
 * 시/군/구 가져오는 함수
 * @returns
 */
async function sgg_get(sido_cd) {
    const adminInfo = adminUserInfo(); // 관리자 정보

    const dataObj = {
        ...adminInfo,
        sido_cd: encodeURIComponent(sido_cd),
    };

    const result = await callApi("POST", "/admin/back/04-estate/sgg_get.php", dataObj);

    if (!result) return;

    const { status, messagem, responseData } = result;

    if (responseData.length > 0) {
        // #sgg 요소의 기존 옵션을 제거합니다.
        $("#sgg").empty();

        // 기본 옵션을 다시 추가합니다.
        $("#sgg").append('<option value="" selected>시/도를 선택하세요</option>');

        const optionHtml = responseData
            .map(function (e) {
                return `
                <option value="${e.sgg_cd}">${e.locatadd_nm}</option>`;
            })
            .join("");

        $("#sgg").append(optionHtml);
    }
}

/**
 * 가격대 필터 셋팅 함수
 * @param {*} slider
 */
function set_pice_slider(slider) {
    // range - 가격대 //
    noUiSlider.create(slider, {
        start: [0, 100000000], //  초기 시작값 설정
        connect: true, // 슬라이더 핸들 사이를 채움
        range: {
            min: 0, // 슬라이더 최소값
            max: 100000000, // 슬라이더 최대값
        },
        format: wNumb({
            decimals: 0, // 소수점 자릿수 설정
            suffix: "", // 접미사 설정 (여기서는 빈 문자열)
        }),
        step: 1000, // 슬라이더 스텝 크기 설정
        keyboardSupport: true, // 키보드 지원 활성화
        keyboardDefaultStep: 100, // 키보드 화살표 키 기본 스탭 크기
        keyboardPageMultiplier: 1000, // Page Up/Down 키에 대한 배수(기본 스텝 크기 기준)
        // keyboardMultiplier: 10, // Shift 키와 함께 사용할 때 배수(기본 스텝 크기 기준)
        // 툴팁 단위설정
        // tooltips: [
        //     {
        //         to: function (value) {
        //             return value + " 만";
        //         },
        //     },
        //     {
        //         to: function (value) {
        //             return value + " 만";
        //         },
        //     },
        // ],
    });

    // 인풋박스와 연동
    const inputNumber = document.getElementById("input_price_start");
    const inputNumber2 = document.getElementById("input_price_end");

    if (inputNumber && inputNumber2 && slider) {
        slider.noUiSlider.on("update", function (values, handle) {
            const value = values[handle];
            if (handle) {
                inputNumber2.value = value;
            } else {
                inputNumber.value = value;
            }
        });

        inputNumber.addEventListener("change", function () {
            slider.noUiSlider.set([this.value, null]);
        });

        inputNumber2.addEventListener("change", function () {
            slider.noUiSlider.set([null, this.value]);
        });
    }
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
        // tooltips: [
        //     {
        //         to: function (value) {
        //             return value + " 만";
        //         },
        //     },
        //     {
        //         to: function (value) {
        //             return value + " 만";
        //         },
        //     },
        // ],
        step: 100, // 슬라이더 스텝 크기 설정
        keyboardSupport: true, // 키보드 지원 활성화
        keyboardDefaultStep: 500, // 키보드 화살표 키 기본 스탭 크기
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
    // mergeTooltips(slider, 100000, " - ");
}
