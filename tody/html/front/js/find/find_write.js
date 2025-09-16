$(document).ready(function () {
    if (!userInfo()) {
        alert("로그인 후 이용 가능합니다.");
        location.href = "find_list.html";
        return;
    }
    initModal();
    initSelect();
    initEvents();
    initValidation();
});

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
}

/**
 * 선택박스 초기화
 */
function initSelect() {
    estate_type_get(); // 매물종류
    sale_type_get(); // 거래종류
    sido_get(); // 시/도
}

/**
 * 유효성 검사 함수
 */
function initValidation() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll(".needs-validation");

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms).forEach(function (form) {
        form.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();

                // required 속성이 있는 필드만 선택
                const requiredFields = $(form).find("[required]");
                let isFormValid = true;
                let firstInvalidField = null;

                // 유효성 검사 수행
                requiredFields.each((index, field) => {
                    const $field = $(field);
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

                    // 등록
                    findWrite();
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
                        $field[0].setCustomValidity(`${valName}을(를) 입력해주세요.`);
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

    callApiAbort("/front/back/find/sale_type_get.php", "POST", dataObj, "sale_type_get")
        .then((response) => {
            //populateOptions("#sale_type", response.responseData, "type_code", "type_name");
            populateOptions2("#sale_type", response.responseData, "type_code", "type_name", "type_code");
        })
        .catch((error) => {
            console.error("API 호출 실패", error);
        })
        .finally(() => {});
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
            sgg_get(sido);
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
        .finally(() => {});
}

// =============================================================================
// 작성 관련 함수
// =============================================================================
/**
 * 저장 함수
 */
function findWrite() {
    // const dataObj = collectFilterParams();

    const dataObj = {
        ...userInfo(),
        sido: $("#sido").val() || "",
        sgg: $("#sgg").val() || "",
        estate_type: $("#estate_type").val() || "",
        sale_type: $("#sale_type").val() || "",
        exchange_fg: $("#exchange_fg").is(":checked") ? "Y" : "N",
        min_price: $("#min_price").val() || "",
        max_price: $("#max_price").val() || "",
        min_area: $("#min_area").val() || "",
        max_area: $("#max_area").val() || "",
        phone: encodeURIComponent($("#phone").val().replace(/-/g, "") || ""),
        description: encodeURIComponent($("#description").val() || ""),
    };

    callApiAbort("/front/back/find/find_write.php", "POST", dataObj, "findWrite")
        .then((response) => {
            // API 호출 성공
            const { statusCode, message, responseData } = response;
            if (statusCode == 200 && message == "SUCCESS") {
                $("#noti_count").text(responseData);
                $("#modalCompletion").iziModal("open");

                // 모달 닫힘 이벤트 설정
                $("#modalCompletion").on("closed", function () {
                    console.log("Modal closed");
                    location.href = "/front/views/mypage/mypage_find"; // 페이지 리로드
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
    // 모달 - 등록완료
    initializeModal("#modalCompletion", "/front/assets/lottie/completion.json", "#lottieCompletion");
    // // 모달 - 확인완료
    // initializeModal("#modalConfirm", "/front/assets/lottie/completion.json", "#lottieConfirm");
    // 모달 - 실패
    initializeModal("#modalFail", "/front/assets/lottie/failed.json", "#lottieFail");

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
