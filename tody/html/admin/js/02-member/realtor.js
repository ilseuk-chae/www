// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(document).ready(async function () {
    // 회원 DataTables 초기화
    initializeDataTable();

    // [Event] 회원 탈퇴 버튼 클릭
    $(document).on("click", ".delete-btn", function () {
        const user = $(this).attr("data-user");
        user_info_delete(user);
    });

    // [Event] 사업자등록번호 인증
    $(document).on("click", "#license_check_button", business);

    // [Event] 개설등록번호 인증
    $(document).on("click", "#regist_code_check", brokerage);

    // [Event] File 선택 시, 확장자 체크
    $(document).on("change", "#business_license, #brokerage_cert", function (e) {
        validateInput($(e.target), "file", "파일을 선택하세요.", "image");
    });

    // [Event] File 선택 시, label의 텍스트를 파일 이름으로 변경
    uploadLabel("#business_license", 'label.input-label[for="business_license"]');
    uploadLabel("#brokerage_cert", 'label.input-label[for="brokerage_cert"]');
});


// =============================================================================
// 회원 관련 함수
// =============================================================================
/**
 * 회원 리스트 DataTables 초기화
 */
function initializeDataTable() {
    new DataTable("#ajax-datatables", {
        language: {
            url: "/assets/libs/datatables/lang/ko.json",
        },
        initComplete: function () {
            let api = this.api();

            // 검색박스 및 선택박스 생성
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
                if (this.index() !== 10) {
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
            this.api()
                .columns()
                .every(function () {
                    var column = this;
                    // 10번째 컬럼(인덱스 9)이 선택박스가 되도록 설정
                    if (column.index() === 9) {
                        // 선택박스를 생성하고, 클래스와 기본 옵션을 설정합니다.
                        var select = $('<select class="form-select form-select-sm" style=""><option value="">상태(전체)</option></select>')
                            .appendTo($(column.header()).empty()) // 생성한 선택박스를 해당 컬럼의 헤더에 추가하고 기존 내용을 비웁니다.
                            .on("change", function () {
                                // 선택박스가 변경되었을 때, 선택된 값으로 컬럼을 검색하도록 설정
                                var val = $.fn.dataTable.util.escapeRegex($(this).val()); // 선택된 값에서 특수 문자를 이스케이프 처리합니다.
                                column.search(val ? "^" + val + "$" : "", true, false).draw(); // 선택된 값으로 컬럼을 검색하고 테이블을 다시 그립니다.
                            });

                        // 해당 컬럼의 데이터에서 고유한 값들을 가져와 선택박스에 옵션으로 추가합니다.
                        column
                            .data()
                            .unique()
                            .sort()
                            .each(function (d, j) {
                                select.append('<option value="' + d + '">' + d + "</option>"); // 각 고유 값을 선택박스의 옵션으로 추가합니다.
                            });
                    }
                });
        },
        scrollX: true, // 가로 스크롤 활성화
        processing: true, // 처리 중 메시지 활성화
        // serverSide: true, // 서버 사이드 처리를 활성화
        // colReorder: true,    // 컬럼 이동 활성화
        destroy: true, // 테이블 파괴 가능
        // lengthChange: false,
        ajax: function (data, callback, settings) {
            callApi("POST", "/admin/back/02-member/member_list_realtor.php", adminUserInfo(), "loading")
                .then((result) => {
                    if (!result) {
                        console.log("통신 실패!!!");
                        callback({ data: [] });
                        return;
                    }

                    const { status, message, responseData } = result;

                    if (!responseData) {
                        console.log(message);
                        callback({ data: [] });
                        return;
                    }

                    // 데이터를 올바르게 변환하여 DataTables에 전달합니다.
                    const formattedData = responseData.map((item, index) => {
                        const reversedOrder = responseData.length - index; // 순서(DESC)
                        const adressPrimary = item.address_primary?.trim() || ""; // 기본주소
                        const adressDetail = item.address_detail?.trim() || ""; // 상세주소
                        let addressTotal = `${adressPrimary} ${adressDetail}`.trim(); // 총 주소
                        if (!addressTotal) addressTotal = "";

                        return {
                            order: reversedOrder, // 순서
                            id: item.id,
                            agency_name: item.agency_name,
                            registered_broker_name: item.registered_broker_name,
                            email: item.email,
                            phone: item.phone,
                            mobile: item.mobile,
                            adress: addressTotal,
                            reg_date: item.reg_date,
                            status_description: item.status_description,
                            management: `
                            <div class="dropdown d-inline-block">
                                <button class="btn btn-soft-danger btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="ri-more-fill align-middle"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <a href="/admin/views/popup/user_detail_2.html?user=${item.user_no}" class="dropdown-item edit-item-btn modal-open-btn">
                                            <i class="ri-pencil-fill align-bottom me-2 text-muted"></i>
                                             수정
                                        </a>
                                    </li>
                                    <li>
                                        <button data-user="${item.user_no}" class="delete-btn dropdown-item">
                                            <i class="ri-delete-bin-fill align-bottom me-2 text-muted"></i>
                                            탈퇴
                                        </button>
                                    </li>
                                </ul>
                            </div>`,
                        };
                    });

                    callback({ data: formattedData });
                })
                .catch((error) => {
                    console.error("AJAX 요청 중 오류 발생:", error);
                    callback({ data: [] });
                });
        },
        columns: [
            { data: "order", title: "no" }, // 첫 번째 열로 순서를 추가
            { data: "id", title: "아이디" },
            { data: "agency_name", title: "상호명" },
            { data: "registered_broker_name", title: "대표 중개사명" },
            { data: "email", title: "이메일" },
            { data: "phone", title: "전화번호" },
            { data: "mobile", title: "휴대폰번호" },
            { data: "adress", title: "주소" },
            { data: "reg_date", title: "등록일자" },
            { data: "status_description", title: "상태", orderable: false },
            { data: "management", title: "관리", orderable: false },
        ],
        // rowReorder: {
        //     selector: "td:nth-child(1)", // 첫 번째 열을 기준으로 row 재정렬
        // },
        order: [], // 기본 정렬 비활성화
        columnDefs: [
            // { className: "text-start", targets: [0] }, // 첫 번째 열에 좌측 정렬 클래스 추가
            { className: "text-start align-content-center", targets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }, // 모든 열에 좌측 정렬 클래스 추가
            { width: 100, targets: [9] },
            { className: "text-end", targets: [10] }, // 10 번째 열에 좌측 정렬 클래스 추가
        ],
    });
}

/**
 * 회원 상태 리스트 가져오는 함수
 **/
async function status_list() {
    const langCode = localStorage.getItem("langCode") ?? "kr";
    const dataObj = { langCode };
    const result = await callApi("POST", "/admin/back/00-include/status_list.php", dataObj);

    if (!result) return;

    const { status, message, responseData } = result;

    if (!responseData) {
        console.log(message);
        return;
    }

    const optionHtml = responseData
        .map((item) => {
            const { status_code, description } = item;
            return `<option value="${status_code}">${description}</option>`;
        })
        .join("");
    $("#status_code").append(optionHtml);
}

/**
 * 회원 상세 정보 가져오는 함수
 * @param {*} rcvUser = 가져올 유저
 **/
async function user_info(rcvUser) {
    const langCode = localStorage.getItem("langCode") ?? "kr";
    const adminInfo = adminUserInfo();
    const dataObj = {
        ...adminInfo,
        langCode,
        rcvUser,
    };

    const result = await callApi("POST", "/admin/back/02-member/user_info_realtor.php", dataObj);

    if (!result) return;

    const { status, message, responseData } = result;

    if (!responseData) {
        return;
    }
    bindJsonData(responseData);

    // 사업자등록증
    const businessResult = await user_image(rcvUser, "business");
    if (businessResult) {
        $("#business_license_name").text(businessResult.file_name);
        $("#show_business").attr("href", `/admin/back/00-include/user_image.php?token=${encodeURIComponent(businessResult.token)}&type=${encodeURIComponent("business")}`);
    }

    // 중개업등록증
    const brokerageResult = await user_image(rcvUser, "brokerage");
    if (brokerageResult) {
        $("#brokerage_cert_name").text(brokerageResult.file_name);
        $("#show_brokerage").attr("href", `/admin/back/00-include/user_image.php?token=${encodeURIComponent(brokerageResult.token)}&type=${encodeURIComponent("brokerage")}`);
    }
}

async function user_image(rcvUser, rcvType) {
    const adminInfo = adminUserInfo();
    const dataObj = {
        ...adminInfo,
        user: rcvUser,
        type: rcvType,
    };

    const result = await callApi("POST", "/admin/back/00-include/user_image_token.php", dataObj);

    if (!result) return;

    const { status, message, responseData } = result;

    if (!responseData) {
        return;
    }

    return responseData;
}

/**
 * 회원 정보 수정 함수
 * @param {*} rcvUser = 수정할 유저
 * @returns
 */
async function user_info_update(rcvUser) {
    // formData 초기화
    const formData = new FormData();

    // ####################################################################
    // 유효성 검사 시작
    // ####################################################################
    let isValid = true;
    const inputIdArray = ["id", "agency_name", "registered_broker_name", "zipcode", "address_primary", "address_detail", "phone", "mobile", "email", "homepage_url", "business_license_code", "business_license", "business_regist_code", "brokerage_cert", "status_code"];

    const selectElements = selectElementsById(inputIdArray); // id 배열 받아서 selector 객체 생성
    const elementValues = getElementValues(inputIdArray); // 배열의 요소를 ID로 가진 input의 value를 {id : value} 형식의 객체로 저장

    isValid = validateInput(selectElements.agency_name, "text", "상호명을 입력하세요.") && isValid;
    isValid = validateInput(selectElements.registered_broker_name, "text", "대표 공인중개사명을 입력하세요.") && isValid;
    isValid = validateInput(selectElements.zipcode, "text", "주소를 선택하세요.") && isValid;
    isValid = validateInput(selectElements.address_primary, "text", "주소를 선택하세요.") && isValid;
    isValid = validateInput(selectElements.phone, "phone", "전화번호를 입력하세요.") && isValid;
    isValid = validateInput(selectElements.mobile, "mobile", "휴대폰번호를 입력하세요.") && isValid;
    isValid = validateInput(selectElements.email, "email", "이메일을 입력하세요.") && isValid;
    isValid = validateInput(selectElements.status_code, "select", "상태를 선택하세요.") && isValid;

    // 사업자등록증 확인
    if (elementValues.business_license) {
        isValid = validateInput(selectElements.business_license, "file", "파일을 확인해주세요.", "image") && isValid;
        formData.append("business_license", selectElements.business_license[0].files[0]);
    }
    // 중개업등록증 확인
    if (elementValues.brokerage_cert) {
        isValid = validateInput(selectElements.brokerage_cert, "file", "파일을 확인해주세요.", "image") && isValid;
        formData.append("brokerage_cert", selectElements.brokerage_cert[0].files[0]);
    }

    // 유효성 검토 실패 시
    if (!isValid) {
        const $errorElements = $(".error");

        // 스크롤 이동
        $errorElements.each(function () {
            const $errorElement = $(this);
            if ($.trim($errorElement.text()) !== "") {
                // 에러 메시지가 비어있지 않은지 확인
                $errorElement[0].parentNode.scrollIntoView({ behavior: "smooth" });

                return false; // 첫 번째 에러 메시지를 찾으면 반복문 종료
            }
        });

        return; // 유효성 검토 실패 시 중단
    }

    console.log("validation ok");
    // ####################################################################
    // 유효성 검사 종료
    // ####################################################################

    const confirm = await sweetConfirm("수정 하시겠습니까?", "", "w");
    if (!confirm) return;

    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보
    const dataObj = {
        ...adminInfo,
        langCode,
        rcvUser: rcvUser,
        id: encodeURIComponent(elementValues.id),
        agency_name: encodeURIComponent(elementValues.agency_name),
        registered_broker_name: encodeURIComponent(elementValues.registered_broker_name),
        zipcode: encodeURIComponent(elementValues.zipcode),
        address_primary: encodeURIComponent(elementValues.address_primary),
        address_detail: encodeURIComponent(elementValues.address_detail),
        phone: encodeURIComponent(elementValues.phone),
        mobile: encodeURIComponent(elementValues.mobile),
        email: encodeURIComponent(elementValues.email),
        homepage_url: encodeURIComponent(elementValues.homepage_url),
        business_license_code: encodeURIComponent(elementValues.business_license_code),
        business_regist_code: encodeURIComponent(elementValues.business_regist_code),
        status_code: encodeURIComponent(elementValues.status_code),
    };

    for (const key in dataObj) {
        if (Object.hasOwnProperty.call(dataObj, key)) {
            const value = dataObj[key];
            formData.append(key, value);
        }
    }

    // for (const pair of formData.entries()) {
    //     console.log(pair[0] + ", " + pair[1]);
    // }

    const result = await callApiFormData("POST", "/admin/back/02-member/user_info_update_realtor.php", formData);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("처리 되었습니다.", "", "s");
        if (!confirm) return;
        initializeDataTable();
        user_info(rcvUser);
        const userInfo = adminUserInfo(); // 로그인된 사용자 정보 가져오기
        updateMenuCounts(userInfo);
    } else {
        const confirm = await sweetAlertForReturn("수정을 실패했습니다.", "", "e");
        if (!confirm) return;
    }
}

/**
 * 회원 탈퇴처리 함수
 * @param {*} rcvUser
 * @returns
 */
async function user_info_delete(rcvUser) {
    const confirm = await sweetConfirm("탈퇴 처리 하시겠습니까?", "", "w");
    if (!confirm) return;

    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보

    const dataObj = {
        ...adminInfo,
        langCode,
        rcvUser: rcvUser,
    };

    const result = await callApi("POST", "/admin/back/02-member/user_info_delete.php", dataObj);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("처리 되었습니다.", "", "s");
        if (!confirm) return;
        // 회원 리스트 초기화
        initializeDataTable();
    } else {
        const confirm = await sweetAlertForReturn("삭제를 실패했습니다.", "", "e");
        if (!confirm) return;
    }
}

// =============================================================================
// 인증 관련 함수
// =============================================================================

/**
 *  사업자번호 인증 함수
 */
async function business() {
    const business_license_code = $("#business_license_code").val().replace(/-/g, "");

    const dataObj = { b_no: business_license_code };
    const result = await callApi("POST", "/admin/back/02-member/business_api.php", dataObj);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("사업자번호가 인증되었습니다.", "", "s");
        if (!confirm) return;
    } else {
        const confirm = await sweetAlertForReturn("사업자번호가 인증되지 않았습니다.", "", "e");
        if (!confirm) return;
    }
}

/**
 *  개설등록번호 인증 함수
 */
async function brokerage() {
    console.log("개설등록번호 확인 클릭");
    const jurirno = $("#business_regist_code").val();
    const dataObj = { jurirno: jurirno };

    const result = await callApi("POST", "/admin/back/02-member/brokerage_api.php", dataObj);
    if (!result) return;

    const { status, message, responseData } = result;

    if (message !== "SUCCESS") {
        const confirm = await sweetAlertMessage("조회된 중개업사무소가 없습니다." + "\n" + "입력된 등록번호를 다시한번 확인해주세요.", "", "e");
        if (!confirm) return;
        return;
    }

    const data = responseData;

    if (data) {
        // 키 이름 변경을 위한 매핑 객체
        const keyMappings = {
            ldCode: "시군구코드",
            ldCodeNm: "시군구명",
            jurirno: "등록번호",
            bsnmCmpnm: "사업자상호",
            brkrNm: "중개업자명",
            sttusSeCode: "상태구분코드",
            sttusSeCodeNm: "상태구분명",
            registDe: "등록일자",
            estbsBeginDe: "보증설정시작일",
            estbsEndDe: "보증설정종료일",
            lastUpdtDt: "데이터기준일자",
        };

        // key : value 형식으로 formattedData에 설정
        const formattedData = Object.entries(data[0])
            .map(([key, value]) => {
                // 만약 해당 키가 keyMappings 객체에 있으면 새 이름으로 사용하고, 아니면 기존 키 이름을 사용합니다.
                const newKey = keyMappings[key] || key;
                return `${newKey}: ${value}`;
            })
            .join("\n");
        const confirm = await sweetAlertForReturn(formattedData, "", "s");
        if (!confirm) return;
    } else {
        const confirm = await sweetAlertForReturn("조회된 중개업사무소가 없습니다." + "\n" + "입력된 등록번호를 다시한번 확인해주세요..", formattedData, "s");
        if (!confirm) return;
    }
}
