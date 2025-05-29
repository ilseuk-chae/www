// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(document).ready(async function () {
    // DataTables 초기화
    initializeDataTable("");
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
                if (this.index() !== 4) {
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
            { data: "no", title: "no" }, // 첫 번째 열로 순서를 추가
            { data: "proposal_type", title: "제안종류" },
            { data: "title", title: "제목" },
            { data: "reg_date", title: "등록일자" },
            { data: "management", title: "관리", orderable: false, searchable: false },
        ],
        // rowReorder: {
        //     selector: "td:nth-child(1)", // 첫 번째 열을 기준으로 row 재정렬
        // },
        order: [], // 기본 정렬 비활성화
        columnDefs: [
            { className: "text-start align-content-center", targets: [0, 1, 2, 3] }, // 모든 열에 좌측 정렬 클래스 추가
            { className: "text-center align-content-center", targets: [4] }, // 10 번째 열에 우측 정렬 클래스 추가
            { width: "60%", targets: [2] },
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
    };
    callApi("POST", "/admin/back/06-collaboration/proposal_list.php", dataObj, "loading")
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

                // 기타메모 5자 이내만 보여지도록
                // const shortNote = item.additional_note.length > 5 ? item.additional_note.substring(0, 5) + "..." : item.additional_note;

                return {
                    // no: reversedOrder,
                    no: item.no,
                    proposal_type: item.proposal_type,
                    title: `<a href="/admin/views/col_manage/popup_proposal.html?no=${item.no}" class="modal-open-btn link-dark link-body-emphasis link-offset-2 text-decoration-underline link-underline-opacity-25 link-underline-opacity-75-hover">${item.title}</a>`,
                    reg_date: item.reg_date,
                    management: `
                    <div class="dropdown d-inline-block">
                        <a href="/admin/views/col_manage/popup_proposal.html?no=${item.no}" type="button" class="modal-open-btn btn btn-soft-danger btn-icon waves-effect waves-light" data-bs-toggle="tooltip" data-bs-placement="top" title="상세">
                            <i class="ri-eye-fill"></i>
                        </a>
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
 * 상세정보 가져오는 함수
 * @param {*} val = 변경할 상태값
 * @returns
 */
async function proposal_detail(no) {
    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보

    const dataObj = {
        ...adminInfo,
        langCode,
        no,
    };

    const result = await callApi("POST", "/admin/back/06-collaboration/proposal_detail.php", dataObj);

    if (!result) return;

    const { status, message, responseData } = result;

    if (message === "SUCCESS") {
        bindJsonData(responseData);
        countUp(no)
    } else {
        const confirm = await sweetAlertForReturn("상세 정보를 불러오는데 실패했습니다..", "", "e");
        if (!confirm) return;
    }
}


/**
 * 조회수 증가 함수
 * @returns
 */
function countUp(viewNo) {
    if (!viewNo) return;

    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보

    const dataObj = {
        ...adminInfo,
        langCode,
        viewNo,
    };

    // callApiAbort 함수가 Promise를 반환한다고 가정
    callApiAbort("/admin/back/06-collaboration/proposal_count_up.php", "POST", dataObj, "countUp")
        .then((response) => {
            // ----------------------------------------------------
            // *** response가 유효한 객체인지 확인 후 처리 ***
            // ----------------------------------------------------
            if (response && typeof response === 'object') {
                // response가 객체일 때만 안전하게 비구조화 할당 및 속성 접근
                const { responseData, message, statusCode } = response;

                // 서버 응답의 statusCode를 확인하여 성공/실패 로직 분기
                if (statusCode === 200) {
                    console.log("countUp API 호출 성공:", message, responseData);
                    // 성공적으로 처리되었을 때 필요한 로직 수행
                    // 예: 메뉴의 전체 제안 개수 뱃지를 새로고침
                    updateMenuCounts(adminInfo); // 필요하다면 이 함수를 호출하여 메뉴 개수 업데이트

                } else {
                    // 서버에서 200이 아닌 상태 코드로 응답했지만 callApiAbort의 error 핸들러에서 resolve(responseJSON) 한 경우
                    console.warn("countUp API 호출, 서버 비정상 응답:", { statusCode, message, responseData });
                    // 사용자에게 오류 메시지 표시 (response.message 활용)
                    // sweetAlertMessage(message || "조회수 증가 처리 중 오류가 발생했습니다.", "", "e");
                }

            } else {
                // response가 false (callApiAbort 오류 처리 결과) 이거나 undefined/null 인 경우
                console.warn("countUp API 호출 실패 또는 비정상 응답 형태:", response);
                // 사용자에게 오류 메시지 표시 (일반적인 오류 메시지 사용)
                // sweetAlertMessage("조회수 증가 처리 중 오류가 발생했습니다.", "", "e");
            }
        })
        .catch((error) => {
            // callApiAbort가 reject를 호출했을 때 실행됨
            console.error("countUp API 호출 중 Promise rejected:", error);
             // 사용자에게 오류 메시지 표시
            // sweetAlertMessage("조회수 증가 처리 중 치명적인 오류가 발생했습니다.", "", "e");
        });
}

