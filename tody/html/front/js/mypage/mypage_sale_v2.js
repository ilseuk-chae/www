// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(function () {
    const user = userInfo();
    if (!user) {
        alert("중개사 회원 전용 페이지입니다.");
        location.href = "/index";
        return;
    } else if (user.user_role != "002") {
        alert("중개사 회원 전용 페이지입니다.");
        location.href = "/index";
        return;
    }
    initMenu(user);
    initializeDataTable();
    initEvents();
    initMemoEvents();
});

// 이벤트 초기화 함수
function initEvents() {
    // [Event] 삭제 버튼 클릭
    $(document).on("click", ".delete-btn", function () {
        const no = $(this).attr("data-no");
        sale_delete(no);
    });

    // [Event] 공개 상태 변경
    $(document).on("click", ".change-public-btn", function () {
        const val = $(this).attr("data-public_fg");
        const no = $(this).attr("data-no");
        public_fg_change(val, no);
    });
}

// =============================================================================
// table 관련 함수
// =============================================================================
/**
 * DataTables 초기화
 */
function initializeDataTable() {
    // 사용자 정의 검색 함수 추가
    // $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
    //     var searchValue = $("#dt-search-0").val();
    //     var priceColumn = data[6] || ""; // 가격 열의 값 (0부터 시작, 6번째 열이 가격 열)

    //     // 가격 열에서 숫자만 추출
    //     var priceMatches = priceColumn.match(/\d+/g);
    //     var priceValue = priceMatches ? priceMatches.join("") : "";

    //     // 검색 값이 숫자인 경우, 가격 열의 숫자 부분과 비교
    //     if (searchValue && !isNaN(searchValue)) {
    //         return priceValue.includes(searchValue);
    //     }

    //     return true;
    // });

    let table = new DataTable("#ajax-datatables", {
        language: {
            url: "/assets/libs/datatables/lang/ko.json",
        },
        drawCallback: function () {
            addPaginationClasses();
        },
        initComplete: function () {
            let api = this.api();

            // 검색박스 및 선택박스 생성
            $(".dt-search").addClass("flex-nowrap input-group");
            let searchBox = $(".dt-search input").addClass("input-box w350").removeClass("form-control-sm").attr("type", "text");
            let columnSelect = $('<select class="form-select select-box w150"><option value="">전체</option></select>')
                .prependTo(".dt-search")
                .on("change", function () {
                    let selectedColumn = $(this).val();
                    searchBox.trigger("keyup");
                });

            // 각 컬럼 이름으로 옵션 추가
            api.columns().every(function () {
                if (this.index() !== 1 && this.index() !== 5 && this.index() !== 6 && this.index() !== 9 && this.index() !== 10 && this.index() !== 11 && this.index() !== 12) {
                    // 특정 컬럼 제외 (예: 사진, 공개, 관리)
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

            // 특정 컬럼의 헤더에 선택박스 추가
            api.columns().every(function () {
                var column = this;
                // 10번째 컬럼(인덱스 9)이 선택박스가 되도록 설정
                if (column.index() === 11) {
                    // 선택박스를 생성하고, 클래스와 기본 옵션을 설정합니다.
                    var select = $('<select class="change-public-select form-select" style=""><option value="">공개(전체)</option></select>')
                        .appendTo($(column.header()).empty()) // 생성한 선택박스를 해당 컬럼의 헤더에 추가하고 기존 내용을 비웁니다.
                        .on("change", function () {
                            loadTableData(table); // 선택된 값으로 데이터를 다시 로드

                            // 선택박스가 변경되었을 때, 선택된 값으로 컬럼을 검색하도록 설정
                            // var val = $.fn.dataTable.util.escapeRegex($(this).val()); // 선택된 값에서 특수 문자를 이스케이프 처리합니다.
                            // console.log(val);
                            // column.search(val ? "^" + val + "$" : "", true, false).draw(); // 선택된 값으로 컬럼을 검색하고 테이블을 다시 그립니다.
                            // let val = $(this).val();
                            // $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
                            //     console.log($.fn.dataTable);
                            //     var publicName = $(data[12]).find(".public-change-btn").text().trim();
                            //     return val === "" || publicName === val;
                            // });
                            // table.draw(); // 선택된 값으로 컬럼을 검색하고 테이블을 다시 그립니다.
                            // $.fn.dataTable.ext.search.pop();
                        });

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
                                    // select.append('<option value="' + flag + '">' + text + "</option>"); // 각 고유 값을 선택박스의 옵션으로 추가합니다.
                                    const selectOptions = `
                                                <option value="">전체</option>
                                                <option value="Y">공개</option>
                                                <option value="N">비공개</option>
                                                <option value="C">거래완료</option>`;
                                    select.html(selectOptions);
                                }
                            }
                        });
                }
            });

            addPaginationClasses(); // 초기화 시점에 페이지네이션 클래스 추가
        },
        scrollX: true, // 가로 스크롤 활성화
        processing: true, // 처리 중 메시지 활성화
        responsive: true, // 반응형 테이블 설정
        // serverSide: true, // 서버 사이드 처리를 활성화
        // colReorder: true,    // 컬럼 이동 활성화
        destroy: true, // 테이블 파괴 가능
        // lengthChange: false,
        ajax: function (data, callback, settings) {
            loadTableData(table, callback);
        },
        columns: [
            { data: "estate_no", title: "매물<br>번호" }, // 첫 번째 열로 순서를 추가
            { data: "image", title: "사진/동영상", orderable: false, searchable: false },
            { data: "address_total", title: "주소" },
            { data: "estate_type", title: "매물<br>종류" },
            { data: "sale_type", title: "거래<br>종류" },
            {
                data: "totArea",
                title: "연면적<br>(㎡)",
                searchable: false,
                // orderable: false,
                // render: function (data, type, row) {
                //     // 표시할 데이터는 그대로
                //     if (type === "display") {
                //         return data;
                //     }

                //     // 정렬용 데이터 처리: 제곱미터 값만 추출
                //     if (type === "sort") {
                //         // "㎡" 앞의 숫자 추출 후 공백 제거 및 숫자 변환
                //         let match = data.match(/(\d+(\.\d+)?)(?=㎡)/);

                //         // 정렬을 위해 숫자만 반환 (추출된 값이 없을 경우 0 반환)
                //         return match ? parseFloat(match[0]) : 0;
                //     }

                //     return data; // 그 외에는 원본 데이터 반환
                // },
            },
            // { data: "price", title: "금액(만 원)", searchable: false },
            { data: "sale_price", title: "가격<br>(만 원)", searchable: false },
            { data: "rent_price", title: "월세<br>(만 원)", searchable: false },
            { data: "reg_date", title: "등록일" },
            { data: "additional_note", title: "메모", orderable: false, searchable: false },
            { data: "view_count", title: "조회수", searchable: false },
            { data: "public_fg", title: "공개", orderable: false, searchable: false },
            { data: "management", title: "관리", orderable: false, searchable: false },
        ],
        // rowReorder: {
        //     selector: "td:nth-child(1)", // 첫 번째 열을 기준으로 row 재정렬
        // },
        order: [], // 기본 정렬 비활성화
        columnDefs: [
            // { className: "text-start", targets: [0] }, // 첫 번째 열에 좌측 정렬 클래스 추가
            { className: "text-start align-content-center", targets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }, // 모든 열에 좌측 정렬 클래스 추가
            { width: 100, targets: [11, 12] },
            { className: "text-center align-content-center", targets: [11, 12] }, // 10 번째 열에 우측 정렬 클래스 추가
            // { className: "text-end align-content-center", targets: [14] }, // 10 번째 열에 우측 정렬 클래스 추가
            { responsivePriority: 1, targets: 2 }, // 첫 번째 열 우선순위 설정
            { responsivePriority: 2, targets: -1 }, // 마지막 열 우선순위 설정
            {
                targets: [1, 4, 5, 6, 7, 8, 10, 11, 12],
                visible: true, // 기본적으로 모든 열을 보이게 설정
                responsivePriority: 10001, // 특정 열의 우선순위를 가장 낮게 설정하여 작은 화면에서 숨김 처리
            },
        ],
    });
}

/**
 * 페이지네이션에 클래스 추가 함수
 */
function addPaginationClasses() {
    // setTimeout(function () {
    const pagination = $(".pagination");
    if (pagination.length) {
        pagination.addClass("paging-list pt-0 gap-1");
    }
    // }, 0);
}

/**
 * 테이블 데이터 불러오는 함수
 * @param {*} table
 * @param {*} callback
 */
function loadTableData(table, callback) {
    const filterValue = $(".change-public-select").val() || "";
    const dataObj = {
        ...userInfo(),
        public_fg: filterValue,
    };
    callApi("POST", "/front/back/mypage/sale_list_v2.php", dataObj, "loading")
        .then((result) => {
            if (!result) {
                console.log("통신 실패!!!");
                if (callback) callback({ data: [] });
                return;
            }

            const responseData = result.responseData;

            if (!responseData) {
                if (callback) callback({ data: [] });
                return;
            }

            // 데이터를 올바르게 변환하여 DataTables에 전달합니다.
            const formattedData = responseData.map((item, index) => {
                // 순서(DESC)
                const reversedOrder = responseData.length - index;
                const addressTotal = `${item.address_jibun} ${item.address_detail || ""}`;
                const descBtn = `<a class="link-dark link-body-emphasis link-offset-2 text-decoration-underline link-underline-opacity-25 link-underline-opacity-75-hover" href="mypage_sale_detail_v2.html?no=${item.estate_no}">${addressTotal}</a>`;

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
                    const fileType = item.imageArray[0].fileType;
                    const imageToken = item.imageArray[0].imageToken;
                    const imageSrc = `/front/back/00-include/image.php?token=${encodeURIComponent(imageToken)}`;

                    if (fileType === "image") {
                        image = `<img src="${imageSrc}" class="rounded-1" alt="" width="100" onerror="this.onerror=null;this.src='/front/assets/image/building_empty.png';">`;
                    } else if (fileType === "video") {
                        image = `<video mute width="100%" class="img-fluid mx-auto rounded" controlslist="nodownload">
                                    <source src="${imageSrc}" type="video/mp4" class="h-100">
                                    Your browser does not support the video tag.
                                </video>`;
                    } else {
                        image = `<img src="/front/assets/image/building_empty.png" class="rounded-1" width="100%" alt="" title="" />`;
                    }
                } else {
                    image = `<img src="/front/assets/image/building_empty.png" class="rounded-1" width="100" alt="" title="">`;
                }

                // 기타메모 5자 이내만 보여지도록
                const shortNote = item.additional_note && item.additional_note.length > 5 ? item.additional_note.substring(0, 5) + "..." : item.additional_note || "";

                // m2 -> 평
                const convertedM2 = convertToPyeong(item.totArea);
                let rentPrice = (item.sale_type === "매매") ||(item.sale_type === "전세") ?  0 : item.rent_price ? item.rent_price / 10000 : 0;
                return {
                    estate_no: item.estate_no,
                    image: image,
                    address_total: descBtn,
                    estate_type: item.estate_type,
                    sale_type: item.sale_type,
                    // totArea: item.totArea ? item.totArea + "㎡(" + convertedM2 + "평)" : 0 + "㎡(0평)",
                    totArea: item.totArea || 0,
                    // price: `${formatPrice(item.sale_price, "all", true)}${item.rent_price ? " / " + formatPrice(item.rent_price, "all", true) : ""}`,
                    sale_price: item.sale_price / 10000,
                    //rent_price: item.rent_price ? item.rent_price / 10000 : 0,
                    rent_price: rentPrice,
                    reg_date: item.reg_date,
                    additional_note: `<span data-bs-toggle="tooltip" title="${item.additional_note || ""}">${shortNote}</span>`,
                    view_count: item.view_count,
                    public_fg: `
                        <div class="dropdown d-inline-block">
                            <button class="public-change-btn btn btn-soft-primary btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-public_fg="${item.public_fg}">
                                ${public_name}
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li>
                                    <button class="dropdown-item change-public-btn" data-public_fg="Y" data-no="${item.estate_no}">
                                        공개
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item change-public-btn" data-public_fg="N" data-no="${item.estate_no}">
                                        비공개
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item change-public-btn" data-public_fg="C" data-no="${item.estate_no}">
                                        거래완료
                                    </button>
                                </li>
                            </ul>
                        </div>`,
                    management: `
                        <div class="dropdown d-inline-block">
                            <button class="btn btn-soft-primary btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="ri-more-fill align-middle"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li>
                                    <a href="/front/views/mypage/mypage_sale_detail_v2.html?no=${item.estate_no}" class="dropdown-item">
                                        <i class="ri-eye-fill align-bottom me-2 text-muted"></i>
                                        상세
                                    </a>
                                </li>
                                <li>
                                    <button data-no="${item.estate_no}" class="delete-btn dropdown-item">
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
async function sale_delete(rcvNo) {
    const confirm = await sweetConfirm("삭제 하시겠습니까?", "", "w");
    if (!confirm) return;

    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어

    const dataObj = {
        ...userInfo(),
        langCode,
        rcvNo: rcvNo,
    };

    const result = await callApi("POST", "/front/back/mypage/sale_delete.php", dataObj);

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

    const dataObj = {
        ...userInfo(),
        langCode,
        public_fg: encodeURIComponent(val),
        rcv_no: no,
    };

    const result = await callApi("POST", "/front/back/mypage/sale_public_change.php", dataObj);

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
