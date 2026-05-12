$(document).ready(async function () {
    if (!userInfo()) {
        alert("정상적인 접근이 아닙니다.");
        location.href = "/index";
        return;
    }
    try {
        const initResult = await initSelect();
        if (initResult) {
            initDetail();
        }
    } catch (error) {}

    initModal();
    initEvents();
    initValidation();
});

/**
 * 선택박스 초기화
 */
async function initSelect() {
    await estate_type_get(); // 매물종류
    await sale_type_get(); // 거래종류
    await sido_get(); // 시/도
    return true;
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

    // 모달 닫힘 이벤트 설정 - 등록 완료
    $("#modalCompletion").on("closed", function () {
        console.log("Modal closed");
        location.reload(); // 페이지 리로드
    });

    // Textarea 높이 자동증가 이벤트 - 설명
    $("#description").on("input", function () {
        autoResize(this);
    });

    // 수정하기 폼 변경 이벤트
    $("#modify_btn").on("click", function () {
        $("form.needs-validation").find("input, select, checkbox, textarea").prop("disabled", false);
        $("#modify_btn").hide();
        $("#save_btn").show();
    });

    // 저장버튼 클릭 이벤트
    $("#save_btn").on("click", async function () {
        $("#modalConfirm").iziModal("open");

        // const sweetReturn = await sweetConfirm("저장하시겠습니까?", "", "q");
        // if (sweetReturn) {
        //     findModify();
        // }
    });

    // [Event] 삭제 버튼 클릭
    $("#delete_btn").on("click", async function () {
        const sweetReturn = await sweetConfirm("삭제하시겠습니까?", "", "q");
        if (sweetReturn) {
            findDelete();
        }
    });
}

/**
 * 유효성 검사 함수
 */
function initValidation() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll(".needs-validation");

    Array.prototype.slice.call(forms).forEach(function (form) {
        const saveConfirmBtn = document.getElementById("save_confirm_btn");
        const saveBtn = document.getElementById("save_btn");
        const buttons = [saveConfirmBtn];
        if (!saveConfirmBtn) {
            console.error("#save_confirm_btn not found"); // 디버그 메시지
            return;
        } else {
            //console.log("#save_confirm_btn found"); // 디버그 메시지
        }

        saveConfirmBtn.addEventListener(
            "click",
            async function (event) {
                event.preventDefault();
                $("#modalConfirm").iziModal("close");

                // required 속성이 있는 필드만 선택
                const requiredFields = $(form).find("[required]");
                let isFormValid = true;
                let firstInvalidField = null;

                // 유효성 검사 수행
                requiredFields.each((index, field) => {
                    const $field = $(field);
                    //console.log($field);

                    const type = $field.attr("type") || $field.prop("tagName").toLowerCase();
                    let fieldType;
                    let valName;

                    switch (type) {
                        case "text":
                            fieldType = "text";
                            valName = "입력값";
                            break;
                        case "password":
                            fieldType = "password";
                            valName = "비밀번호";
                            break;
                        case "tel":
                            fieldType = "phone";
                            valName = "연락처";
                            break;
                        case "checkbox":
                            fieldType = "checkbox";
                            valName = "체크박스";
                            break;
                        case "select":
                            fieldType = "select";
                            valName = "옵션";
                            break;
                        default:
                            fieldType = type;
                            valName = "값";
                    }

                    const isValid = validateInput($field, fieldType, `${valName}을(를) 확인해주세요.`);
                    const errorElement = $field.parent().find(".invalid-feedback").length != 0 ? $field.parent().find(".invalid-feedback") : $field.parent().parent().find(".invalid-feedback");
                    if (!isValid) {
                        if (errorElement.length > 0) {
                            errorElement.show();
                            $field[0].setCustomValidity(errorElement.text());
                            // $field[0].reportValidity();
                        } else {
                            $field[0].setCustomValidity(`${valName}을(를) 확인해주세요.`);
                        }
                        $field[0].reportValidity(); // 직접 유효성 검사 메시지 표시
                        $field.addClass("is-invalid");
                        isFormValid = false;
                        if (!firstInvalidField) {
                            firstInvalidField = $field;
                        }
                    } else {
                        errorElement.hide();
                        $field[0].setCustomValidity("");
                        $field.removeClass("is-invalid");
                    }
                });

                if (!isFormValid) {
                    if (firstInvalidField) {
                        // 해당 필드를 화면에 보이게 스크롤
                        firstInvalidField[0].scrollIntoView({ behavior: "smooth", block: "center" });
                        // 유효성 검사 메시지 표시
                        firstInvalidField[0].reportValidity();
                        firstInvalidField.focus();
                    }
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    // 유효성 검사가 통과되었을 때 모달을 띄웁니다.
                    event.preventDefault(); // 이 라인을 제거하면 실제로 폼이 제출됩니다.
                    event.stopPropagation();

                    findModify();
                }

                return;
            },
            false
        );

        // 입력 필드에 이벤트 리스너 추가
        form.querySelectorAll("input[required], select[required], textarea[required]").forEach(function (field) {
            field.addEventListener("input", function () {
                const $field = $(field);
                const type = $field.attr("type") || $field.prop("tagName").toLowerCase();
                let fieldType;
                let valName;

                switch (type) {
                    case "text":
                        fieldType = "text";
                        valName = "값";
                        break;
                    case "password":
                        fieldType = "password";
                        valName = "비밀번호";
                        break;
                    case "tel":
                        fieldType = "phone";
                        valName = "연락처";
                        break;
                    case "checkbox":
                        fieldType = "checkbox";
                        valName = "체크박스";
                        break;
                    case "select":
                        fieldType = "select";
                        valName = "옵션";
                        break;
                    default:
                        fieldType = type;
                        valName = "값";
                }

                const isValid = validateInput($field, fieldType, `${valName}을(를) 확인해주세요.`);
                const errorElement = $field.parent().find(".invalid-feedback").length != 0 ? $field.parent().find(".invalid-feedback") : $field.parent().parent().find(".invalid-feedback");
                if (isValid) {
                    $field.removeClass("is-invalid").addClass("is-valid");
                    $field[0].setCustomValidity("");
                    errorElement.hide();
                } else {
                    $field.removeClass("is-valid").addClass("is-invalid");
                    if (errorElement.length > 0) {
                        $field[0].setCustomValidity(errorElement.text());
                        errorElement.show();
                    } else {
                        $field[0].setCustomValidity(`${valName}을(를) 확인해주세요.`);
                    }
                    $field[0].reportValidity(); // 직접 유효성 검사 메시지 표시
                }
            });
        });
    });
}

// =============================================================================
// 선택박스 관련 함수
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
        .finally(() => {});
}

/**
 * 거래종류 가져오는 함수
 * @returns
 */
async function sale_type_get() {
    const dataObj = {};
    try {
        const response = await callApiAbort("/front/back/find/sale_type_get.php", "POST", dataObj, "sale_type_get");
        //populateOptions("#sale_type", response.responseData, "type_code", "type_name");
        populateOptions2("#sale_type", response.responseData, "type_code", "type_name", "type_code");
    } catch (error) {
        console.error("API 호출 실패", error);
        throw error; // 오류 발생 시 throw
    }

    // callApiAbort("/front/back/find/sale_type_get.php", "POST", dataObj, "sale_type_get")
    //     .then((response) => {
    //         populateOptions("#sale_type", response.responseData, "type_code", "type_name");
    //     })
    //     .catch((error) => {
    //         console.error("API 호출 실패", error);
    //     })
    //     .finally(() => {});
}

/**
 * 시/도 가져오는 함수
 * @returns
 */
async function sido_get() {
    const dataObj = {};
    try {
        const response = await callApiAbort("/front/back/find/sido_get.php", "POST", dataObj, "sido_get");
        populateOptions("#sido", response.responseData, "sido_cd", "locallow_nm");
    } catch (error) {
        console.error("API 호출 실패", error);
        throw error; // 오류 발생 시 throw
    }
    // callApiAbort("/front/back/find/sido_get.php", "POST", dataObj, "sido_get")
    //     .then((response) => {
    //         populateOptions("#sido", response.responseData, "sido_cd", "locallow_nm");
    //     })
    //     .catch((error) => {
    //         console.error("API 호출 실패", error);
    //     })
    //     .finally(async () => {});
}

/**
 * 시/군/구 가져오는 함수
 * @returns
 */
async function sgg_get(sido_cd) {
    const dataObj = {
        sido_cd: encodeURIComponent(sido_cd || getParameter("sido")),
    };
    try {
        const response = await callApiAbort("/front/back/find/sgg_get.php", "POST", dataObj, "sgg_get");
        $("#sgg").empty().append('<option value="">선택하세요.</option>');
        populateOptions("#sgg", response.responseData, "sgg_cd", "locatadd_nm");
        return response.responseData; // 데이터 반환
    } catch (error) {
        console.error("API 호출 실패", error);
        throw error; // 오류 발생 시 throw
    }
}

// =============================================================================
// 작성 관련 함수
// =============================================================================

/**
 * 상세정보 가져오는 함수
 * @returns
 */
function initDetail() {
    const viewNo = getParameter("viewNo");

    if (!viewNo) {
        alert("정상적인 접근이 아닙니다.");
        location.href = "/index";
        return;
    }

    const dataObj = {
        ...userInfo(),
        viewNo: encodeURIComponent(viewNo),
    };

    callApiAbort("/front/back/find/find_detail.php", "POST", dataObj, "initDetail")
        .then(async (response) => {
            let { responseData, message, statusCode } = response;

            if (!handleError(message, statusCode)) {
                return;
            }

            if (responseData.length == 0) {
                sweetAlertMessage("정상적인 접근이 아닙니다.", "", "e");
                return;
            }

            data = responseData[0];
            $("#save_btn").attr("data-no", data.wanted_no);
            $("#sido").val(data.sido_cd);
            try {
                await sgg_get(data.sido_cd);
                $("#sgg").val(data.sgg_cd);
            } catch (error) {
                console.error("SGG 설정 실패", error);
            }
            $("#address").text(data.sido + " " + (data.sido !== data.sgg ? data.sgg : ""));
            $("#estate_type").val(data.estate_type_cd);
            $("#sale_type").val(data.sale_type_cd);
            data.exchange_fg == "Y" ? $("#exchange_fg").prop("checked", true) : $("#exchange_fg").prop("checked", false);
            $("#min_price").val(data.min_price);
            $("#max_price").val(data.max_price);
            $("#min_area").val(data.min_area);
            $("#max_area").val(data.max_area);
            $("#phone").val(data.phone);
            $("#description").val(data.description);
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * 저장 함수
 */
function findModify() {
    // const dataObj = collectFilterParams();

    const dataObj = {
        ...userInfo(),
        no: $("#save_btn").attr("data-no") || "",
        sido: $("#sido").val() || "",
        sgg: $("#sgg").val() || "",
        estate_type: encodeURIComponent($("#estate_type").val() || ""),
        sale_type: encodeURIComponent($("#sale_type").val() || ""),
        exchange_fg: encodeURIComponent($("#exchange_fg").is(":checked") ? "Y" : "N"),
        min_price: $("#min_price").val() || "",
        max_price: $("#max_price").val() || "",
        min_area: $("#min_area").val() || "",
        max_area: $("#max_area").val() || "",
        phone: encodeURIComponent($("#phone").val().replace(/-/g, "") || ""),
        description: encodeURIComponent($("#description").val() || ""),
    };

    callApiAbort("/front/back/find/find_modify.php", "POST", dataObj, "findModify")
        .then((response) => {
            // API 호출 성공
            if (!response) {
                $("#modalFail").iziModal("open");
                return;
            }

            const { statusCode, message, responseData } = response;
            if (statusCode == 200 && message == "SUCCESS") {
                $("#modalCompletion").iziModal("open");

                // 모달 닫힘 이벤트 설정
                $("#modalCompletion").on("closed", function () {
                    console.log("Modal closed");
                    location.reload();
                });
            } else {
                $("#modalFail").iziModal("open");
            }
        })
        .catch((error) => {
            // API 호출 실패
            console.error("API 호출 실패", error);
        })
        .finally(() => {
            // API 호출 완료
        });
}

/**
 * 삭제처리 함수
 * @returns
 */
async function findDelete() {
    // const confirm = await sweetConfirm("삭제 하시겠습니까?", "", "w");
    // if (!confirm) return;

    const dataObj = {
        ...userInfo(),
        rcvNo: $("#save_btn").attr("data-no") || "",
    };

    const result = await callApi("POST", "/front/back/mypage/find_delete.php", dataObj);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("처리 되었습니다.", "", "s");
        if (confirm) location.href = "/front/views/mypage/mypage_find.html";
    } else {
        const confirm = await sweetAlertForReturn("삭제를 실패했습니다.", "", "e");
        if (confirm) location.reload();
    }
}

// =============================================================================
// 헬퍼 함수
// =============================================================================
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
 * 모달 초기화 함수
 */
function initModal() {
    // 모달 - 저장확인
    initializeModal("#modalConfirm", "/front/assets/lottie/save.json", "#lottieConfirm");
    // 모달 - 완료
    initializeModal("#modalCompletion", "/front/assets/lottie/save.json", "#lottieCompletion");
    // 모달 - 실패
    initializeModal("#modalFail", "/front/assets/lottie/failed.json", "#lottieFail");

    // 모달 설정 함수
    function initializeModal(modalId, lottiePath, lottieContainerId) {
        $(modalId).iziModal({
            width: "470px",
            onOpened: function (modal) {},
        });

        // $(modalId).iziModal({ width: "470px" });
        // $(modalId).iziModal("setTop", 70);
        // $(modalId).iziModal("setBottom", 70);

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

function handleError(message, statusCode) {
    switch (statusCode) {
        case 400:
            sweetAlertMessage(message, "", "e");
            return false;
            break;
        case 404:
            sweetAlertMessage("문제가 발생했습니다. ", "", "e");
            return false;
            break;
        case 500:
            sweetAlertMessage("문제가 발생했습니다. ", "", "e");
            return false;
            break;
        default:
            // resolve(responseJSON);
            return true;
            break;
    }
}
