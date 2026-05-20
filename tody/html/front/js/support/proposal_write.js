let swiper;
$(document).ready(async function () {
    if (!userInfo()) {
        alert("로그인 후 이용 가능합니다.");
        window.history.back();
        return;
    }
    initModal();
    initSelect();
    initEvents();
});

/**
 * 이벤트 모음 함수
 */
function initEvents() {
    $("#register_btn").on("click", function () {
        boardWrite();
    });
}

/**
 * 선택박스 초기화
 */
function initSelect() {
    proposal_type_get(); // 제안종류
}

/**
 * 제안종류 가져오는 함수
 * @returns
 */
async function proposal_type_get() {
    const dataObj = {};

    callApiAbort("/front/back/support/proposal_type.php", "POST", dataObj, "proposal_type_get")
        .then((response) => {
            populateOptions("#proposal_type", response.responseData, "type_code", "type_name");
        })
        .catch((error) => {
            console.error("API 호출 실패", error);
        })
        .finally(() => {});
}

/**
 * 등록 함수
 * @returns
 */
function boardWrite() {
    const title = $("#title");
    const content = $("#content");
    const proposal_type = $("#proposal_type");
    // ##################################
    // 유효성 검사 시작
    // ##################################
    let isValid = true;
    const fieldsToValidate = [
        { input: title, type: "text", message: "제목을 입력하세요." },
        { input: content, type: "text", message: "내용을 입력하세요." },
        { input: proposal_type, type: "select", message: "제안 종류를 선택하세요." },
    ];

    fieldsToValidate.forEach((field) => {
        isValid = validateField(field.input, field.type, field.message) && isValid;
    });

    if (!isValid) {
        return false; // 폼 제출 방지
    }
    // ##################################
    // 유효성 검사 종료
    // ##################################

    const dataObj = {
        ...userInfo(),
        proposal_type: encodeURIComponent(proposal_type.val()),
        title: encodeURIComponent(title.val()),
        content: encodeURIComponent(content.val()),
    };

    callApiAbort("/front/back/support/proposal_write.php", "POST", dataObj, "boardWrite")
        .then(async (response) => {
            let { responseData, message, statusCode } = response;
            if (statusCode == 200 && message == "SUCCESS") {
                $("#modalCompletion").iziModal("open");

                // 모달 닫힘 이벤트 설정
                $("#modalCompletion").on("closed", function () {
                    console.log("Modal closed");
                    location.href = "/front/views/support/partnership_proposal_step01"; // 페이지 리로드
                });
            } else {
                $("#modalFail").iziModal("open");
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

function validateField(input, type, errorMessage) {
    let isValid = validateInput(input, type, errorMessage);
    if (!isValid) {
        sweetAlertMessage(errorMessage, "", "w");
    }
    return isValid;
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
        // valueKey(type_code) 기준 오름차순 — SQL ORDER BY 결과 유지
        data.sort((a, b) => {
            const aVal = isNaN(a[valueKey]) ? a[valueKey] : Number(a[valueKey]);
            const bVal = isNaN(b[valueKey]) ? b[valueKey] : Number(b[valueKey]);
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
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
