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
    // 기존 DataTables 인스턴스가 있다면 파괴
    if ($.fn.DataTable.isDataTable("#ajax-datatables")) {
        $("#ajax-datatables").DataTable().destroy();
    }
    let table = new DataTable("#ajax-datatables", {
        language: {
            url: "/assets/libs/datatables/lang/ko.json",
        },
        initComplete: function () {
            let api = this.api();

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
                if (this.index() !== 3) {
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
            // 검색박스 및 선택박스 생성 끝 
            // DataTables 렌더링 완료 후 툴팁 초기화
            $('[data-bs-toggle="tooltip"]').tooltip();
        },
        // 각 행이 생성될 때 호출
        createdRow: function (row, data, dataIndex) {
            // TR 요소에 data-no 속성 추가 (loadTableData에서 넘겨받은 data.no 사용)
            if (data && data.no !== undefined) {
                $(row).attr('data-no', data.no);
            }
             // (선택 사항) 마우스 커서 변경 등 다른 row 스타일링
            // $(row).css('cursor', 'pointer');
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
            { data: "title", title: "제목" },
            { data: "reg_date", title: "등록일자" },
            { data: "management", title: "확인여부", orderable: false, searchable: false },
        ],
        // rowReorder: {
        //     selector: "td:nth-child(1)", // 첫 번째 열을 기준으로 row 재정렬
        // },
        order: [], // 기본 정렬 비활성화
        columnDefs: [
            { className: "text-start align-content-center", targets: [0, 1, 2] }, // 모든 열에 좌측 정렬 클래스 추가
            { className: "text-center align-content-center", targets: [3] }, // 10 번째 열에 우측 정렬 클래스 추가
            { width: "60%", targets: [1] },
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
    callApi("POST", "/admin/back/06-collaboration/partnership_list.php", dataObj, "loading")
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

                // === management 컬럼의 버튼 안에 들어갈 내용을 결정합니다 ===
                let buttonContent = '';
                if (item.view_count > 0) {
                    // view_count가 0보다 크면 아이콘 사용
                    //buttonContent = '<i class="ri-eye-fill"></i>';
                    buttonContent = '<span style="color: black;">읽음</span>';
                } else {
                    // view_count가 0이면 하늘색 "New" 텍스트 사용
                    buttonContent = '<span style="color: blue;">신규</span>';
                }
                // =======================================================

                // === 결정된 내용을 사용하여 management 컬럼의 최종 HTML을 생성합니다 ===
                const managementHtml = `
                <div class="dropdown d-inline-block">
                    <a href="/admin/views/col_manage/popup_partnership.html?no=${item.no}" type="button" class="modal-open-btn btn btn-soft-danger btn-icon waves-effect waves-light" data-bs-toggle="tooltip" data-bs-placement="top" title="상세" data-no="${item.no}">
                        ${buttonContent}  <!-- 여기에 위에서 결정된 내용을 삽입 -->
                    </a>
                </div>`;
                // ==================================================================

                return {
                    // no: reversedOrder,
                    no: item.no,
                    title: `<a href="/admin/views/col_manage/popup_partnership.html?no=${item.no}" class="modal-open-btn link-dark link-body-emphasis link-offset-2 text-decoration-underline link-underline-opacity-25 link-underline-opacity-75-hover">${item.title}</a>`,
                    reg_date: item.reg_date,
                    management: managementHtml, // 결정된 HTML 문자열을 management 속성에 할당,
                };
            });

            if (callback) {
                callback({ data: formattedData });
            } else {
                // table 객체가 DataTables 인스턴스라고 가정하고 데이터 로드
                // DataTables 초기화 시 ajax 옵션을 사용하고 있다면 이 else 블록은 사용되지 않을 수 있습니다.
                // DataTables 초기화 코드에서 ajax 옵션을 통해 loadTableData의 콜백을 사용하는 방식이 더 일반적입니다.
                if (table && typeof table.clear === 'function' && typeof table.rows === 'function' && typeof table.draw === 'function') {
                    table.clear().rows.add(formattedData).draw();
                } else {
                    console.error("DataTables table object is not valid or not initialized.");
                }
            }
        })
        .catch((error) => {
            console.error("AJAX 요청 중 오류 발생:", error);
            if (callback) callback({ data: [] });
        });
}

// 상세 내용을 보여주는 모달의 실제 셀렉터 (클래스 사용)
const partnershipDetailModalSelector = '.modal-pop-wrapper'; // 필요시 사용

// DataTables 테이블 본문(#ajax-datatables tbody) 내의 모달 열기 버튼(.modal-open-btn) 클릭 이벤트 리스너
$('#ajax-datatables tbody').on('click', 'a.modal-open-btn', async function(e) {
    // e.preventDefault(); // Bootstrap data-bs-toggle="modal" 사용시 필요 없을 수 있습니다.

    const clickedLink = $(this);
    const partnershipNo = clickedLink.data('no');
    
    // partnership_detail 함수 호출 (데이터 로딩, 조회수 증가 및 모달 열기 포함)
    await partnership_detail(partnershipNo);
    
});

// *** 상세 모달 닫힘 이벤트를 문서 전체에 위임하여 감지하는 리스너 ***
// 이 리스너는 DataTables 초기화 코드나 loadTableData 함수 외부에, 문서 로딩이 완료된 후에 추가합니다.
$(document).on('hidden.bs.modal', function (event) {
    const $closedModal = $(event.target); // 닫힌 모달 요소
    
    // 닫힌 모달이 우리가 찾는 상세 모달(.modal-pop-wrapper)인지 확인
    if ($closedModal.hasClass('modal-pop-wrapper')) {
        
        // *** 닫힌 모달 요소의 data-url 속성에서 항목 ID를 가져와 파싱합니다 ***
        const dataUrl = $closedModal.data('url');
        
        let partnershipNo = null;
        if (dataUrl) {
            // data-url 문자열에서 'no' 파라미터 값을 파싱
            try {
                // data-url은 '/path?param=value...' 형태일 것으로 예상되므로, 기본 URL 추가
                const fullUrl = 'http://dummyurl.com' + dataUrl; // 기준 URL 추가 (파싱용)
                const url = new URL(fullUrl);
                partnershipNo = url.searchParams.get('no');
                // DataTables data-no는 문자열일 가능성이 높으므로 숫자로 변환은 선택 사항
                // partnershipNo = parseInt(partnershipNo, 10);
            } catch (e) {
                console.error("Error parsing partnershipNo from data-url:", dataUrl, e); // --- 오류 로그 추가 ---
            }
        }
        

        // 파싱한 partnershipNo 값이 유효한지 확인
        if (partnershipNo !== null && partnershipNo !== undefined) { // null 또는 undefined가 아닌 경우 유효
             
            // DataTables 테이블의 해당 row와 cell을 찾아 업데이트 로직 수행
            const table = $('#ajax-datatables').DataTable(); // DataTables 인스턴스 가져오기

            // data-no 속성을 사용하여 DataTables에서 해당 row(`<tr>` 요소) 찾기
            const rowNode = table.row(`[data-no="${partnershipNo}"]`).node();
            
            if (rowNode) {
                // 해당 rowNode (TR 요소)에서 "관리" 컬럼에 해당하는 셀(`<td>`) 찾기
                // initializeDataTable 코드 기준 'management' 컬럼은 인덱스 4
                const managementColumnIndex = 3; // <<< 실제 인덱스 확인!

                // rowNode 내에서 <td> 요소들을 찾고, 인덱스로 특정 셀 선택
                const managementCell = $(rowNode).find('td').eq(managementColumnIndex);
                
                if (managementCell.length > 0) {
                     // "관리" 컬럼에 들어갈 아이콘 버튼 HTML 문자열 생성
                     // href와 data-no에 partnershipNo 값을 다시 넣어주는 것이 중요
                     const eyeIconHtml = `
                        <div class="dropdown d-inline-block">
                            <a href="/admin/views/col_manage/popup_partnership.html?no=${partnershipNo}" type="button" class="modal-open-btn btn btn-soft-danger btn-icon waves-effect waves-light" data-bs-toggle="tooltip" data-bs-placement="top" title="상세" data-no="${partnershipNo}">
                                <span style="color: black;">읽음</span>
                            </a>
                        </div>`;

                    // 해당 셀의 HTML 내용을 생성한 아이콘 HTML로 변경
                    managementCell.html(eyeIconHtml);
                    
                    // 새로 추가/변경된 요소에 대해 툴팁 다시 초기화
                    managementCell.find('[data-bs-toggle="tooltip"]').tooltip();
                    
                    // (선택 사항) DataTables 내부 데이터 모델의 view_count 값 업데이트
                    const rowData = table.row(rowNode).data();
                    
                    if (rowData && rowData.view_count === 0) {
                         rowData.view_count = 1; // '확인했음'을 의미하는 값 (0이 아니게)으로 변경
                         // table.row(rowNode).data(rowData); // 내부 데이터 업데이트
                    }
                } else {                     
                 }
            } else {                 
            }
        } else { // partnershipNo 파싱에 실패한 경우
        }
    } else {
    }
});

/**
 * 상세정보 가져오는 함수
 * @param {*} val = 변경할 상태값
 * @returns
 */
async function partnership_detail(no) {
    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보

    const dataObj = {
        ...adminInfo,
        langCode,
        no,
    };

    const result = await callApi("POST", "/admin/back/06-collaboration/partnership_detail.php", dataObj);

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
    callApiAbort("/admin/back/06-collaboration/partnership_count_up.php", "POST", dataObj, "countUp")
        .then((response) => {
        // ----------------------------------------------------
            // *** response가 유효한 객체인지 확인 후 처리 ***
            // ----------------------------------------------------
            if (response && typeof response === 'object') {
                // response가 객체일 때만 안전하게 비구조화 할당 및 속성 접근
                const { responseData, message, statusCode } = response;

                // 서버 응답의 statusCode를 확인하여 성공/실패 로직 분기
                if (statusCode === 200) {
                    //console.log("countUp API 호출 성공:", message, responseData);
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
