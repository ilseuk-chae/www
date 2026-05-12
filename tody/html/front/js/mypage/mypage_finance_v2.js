// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(function () {
    const user = userInfo();
    if (!user) {
        alert("로그인 후 이용 가능합니다.");
        location.href = "/index";
        return;
    }
    initMenu(user);
    user_info();
    initModal();
    initEvents();
    initRelationshipFlag();
    initValidation();
});

/**
 * 회원 상세 정보 가져오는 함수
 **/
async function user_info(rcvUser) {
    const langCode = localStorage.getItem("langCode") ?? "kr";
    const dataObj = {
        ...userInfo(),
        langCode,
        rcvUser,
    };

    const result = await callApi("POST", "/front/back/mypage/user_info_finance.php", dataObj);

    if (!result) return;

    const { status, message, responseData } = result;

    if (!responseData) {
        console.log(message);
        return;
    }

    const { id, name, email, mobile, term_fg, role, finance_info } = responseData;

    if (role == "001") {
        location.href = "mypage_v2.html";
    } else if (role == "002") {
        location.href = "mypage_realtor_v2.html";
    }

    const [emailPart, domainPart] = email.split("@");

    $("#id").val(id);
    $("#name").val(name);
    $("#email").val(emailPart);
    $("#domain").val(domainPart);
    $("#mobile").val(phoneOnDash(mobile) || "");

    // 약관 동의 여부
    if (term_fg == "Y") {
        $("#term_fg").prop("checked", true);
    } else {
        $("#term_fg").prop("checked", false);
    }

    if (finance_info) {
        let financeHtml = "";
        financeHtml = finance_info
            .map(function (finance, index) {
                const { branch_no, branch_name, branch_phone, company_no, company_name } = finance;

                return `
                <div class="col-sm-6 pt-0 pb-3">
                    <div class="label-wrap">
                        <h2 class="label-text">은행 ${index > 0 ? index + 1 : ""}</h2>
                    </div>
                    <p class="pt-3">
                        <input type="text" class="form-control input-box w100p" placeholder="" value="${company_name || ""}" maxlength="15" disabled />
                    </p>
                </div>
                <div class="col-sm-6 pt-0 pb-3">
                    <div class="label-wrap">
                        <h2 class="label-text">영업점 ${index > 0 ? index + 1 : ""}</h2>
                    </div>
                    <p class="pt-3">
                        <input type="text" class="form-control input-box w100p" placeholder="" value="${branch_name || ""}" maxlength="15" disabled />
                    </p>
                </div>
                <div class="col-12 pt-0 pb-3">
                    <div class="label-wrap">
                        <h2 class="label-text">내선 번호 ${index > 0 ? index + 1 : ""}</h2>
                    </div>
                    <p class="pt-3">
                        <input type="tel" class="branch-phone form-control input-box w100p modify-input" placeholder="" value="${phoneOnDash(branch_phone) || ""}" data-company_no="${company_no}" data-branch_no="${branch_no}" maxlength="13" disabled />
                    </p>
                </div>`;
            })
            .join("");

        $("#finance_list").html(financeHtml);
    }
}

// 모달 초기화 함수
function initModal() {
    // 모달 - 수정완료 //
    initializeModal("#modalCompletion", "/front/assets/lottie/completion.json", "#lottieCompletion");
    // 모달 - 회원탈퇴 //
    initializeModal("#modalWithdrawal", "/front/assets/lottie/completion.json", "#lottieWithdrawal");

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

// 이벤트 초기화 함수
function initEvents() {
    // 연락처 - 변환
    $(document).on("input", "#mobile, .branch-phone", function () {
        const inputVal = $(this)
            .val()
            .trim()
            .replace(/[^0-9]/g, "");
        const formattedNum = phoneOnDash(inputVal);
        $(this).val(formattedNum);

        // 내선 번호 - 필수 상태 변경
        if ($(this).hasClass("branch-phone")) {
            if (inputVal) {
                $(this).prop("required", true);
            } else {
                $(this).prop("required", false);
            }
        }
    });

    // 연락처 - 유효성검사
    $(document).on("focusout", "#mobile, .branch-phone", function () {
        const inputVal = $(this)
            .val()
            .trim()
            .replace(/[^0-9]/g, "");

        const validPhonePattern = /^(0\d{1,2})(\d{3,4})(\d{4})$/; // 국내 전화번호 형식 (휴대폰과 유선전화번호)

        if (inputVal && !validPhonePattern.test(inputVal)) {
            sweetAlertMessage("", "잘못된 전화번호입니다. 올바른 형식으로 입력해주세요.", "w");
            // $(this).val(""); // 유효하지 않으면 입력 필드를 비움
        }
    });

    // 도메인 변경
    $("#select_domain").on("change", function (event) {
        const selectVal = $(this).val();
        $("#domain").val(selectVal);
    });

    // 관계 설정 토글
    $("#relationship_fg").on("click", function (event) {
        if ($(this).is(":checked")) {
            $("#job_list_collapse").collapse("show");
        } else {
            $("#job_list_collapse").collapse("hide");
        }
    });

    // 수정 준비 버튼 클릭
    $("#modify_ready_btn").on("click", function () {
        $("#submit_btn").removeClass("d-none");
        $("#modify_ready_btn").addClass("d-none");
        $("input:disabled.modify-input").prop("disabled", false);
        $("#select_domain").prop("disabled", false);
    });

    // 저장 버튼 클릭
    $("#save_btn").on("click", function () {
        // $("#submit_btn").addClass("d-none");
        // $("#modify_ready_btn").removeClass("d-none");
        // $("input").not("#id").prop("disabled", true);
        // $("#select_domain").prop("disabled", true);
    });

    // 회원탈퇴 버튼 클릭
    $("#withdrawal_btn").on("click", function () {
        getPlatform();
    });
}

// 관계 설정 플래그 초기화 함수
function initRelationshipFlag() {
    // 초기 상태를 설정합니다.
    if ($("#relationship_fg").is(":checked")) {
        $("#job_list_collapse").collapse("show");
    } else {
        $("#job_list_collapse").collapse("hide");
    }
}

/**
 * 플랫폼 타입 가져오는 함수
 * @returns
 */
async function getPlatform() {
    try {
        const url = "/front/back/oauth/get_platform.php";
        const result = await callApi("POST", url, { ...userInfo() });

        if (!result) {
            alert("no result");
            return;
        }

        const { statusCode, message, responseData } = result;
        if (!responseData[0]) {
            return;
        }

        const platform = responseData[0].platform;

        if (platform == "naver") {
            naverUnlinkAndWithdrawal();
        } else if (platform == "kakao") {
            kakaoUnlinkAndWithdrawal();
        } else {
            withdrawal();
        }
    } catch (error) {
        console.error("API 호출 실패", error);
    }
}

/**
 * 카카오 연동 해제 함수
 */
function kakaoUnlinkAndWithdrawal() {
    const REST_API_KEY = "358571ae546aaa68be0d290878b351c1";
    const REDIRECT_PATH = "/front/views/callback/kakao_unlinked.html";
    const REDIRECT_URI = window.location.origin + (location.port ? ":" + location.port : "") + REDIRECT_PATH;
    const state = generateState();

    // 상태 토큰을 세션 또는 로컬 스토리지에 저장
    sessionStorage.setItem("kakao_state", state);

    // 인증 URL 생성
    const authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&prompt="none"&state=${encodeURIComponent(state)}`;

    // 팝업 창 열기
    const popup = window.open(authUrl, "kakao_login", "width=500,height=600");

    // 팝업 창에서 인증 완료 후 부모 창으로 결과 전달
    window.addEventListener(
        "message",
        function (event) {
            if (event.origin !== window.location.origin) return;

            const userData = event.data;
            // 사용자 정보를 활용한 추가 작업 수행
            if (userData == "unlinked") {
                // 삭제
                withdrawal();
            }
        },
        false
    );
}

/**
 * 네이버 로그인 api 함수
 */
function naverUnlinkAndWithdrawal() {
    const clientId = "51uqj3T1dAORiqMsBTFv";
    const callbackPath = "/front/back/oauth/naver_login.php";
    const callbackUrl = `${window.location.origin}${location.port ? ":" + location.port : ""}${callbackPath}`;
    const state = generateState();

    const url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${callbackUrl}&state=${state}`;

    // // 상태 토큰을 세션 또는 쿠키에 저장
    // document.cookie = `naver_state=${state}; path=/`;

    // 네이버 로그인 페이지를 팝업으로 열기
    window.open(url, "NaverLogin", "width=500,height=600");
}

/**
 * 네이버 연동 해제 함수
 * @returns
 */
async function naver_delete_account() {
    try {
        const url = "/front/back/oauth/naver_delete_account.php";
        const result = await callApi("POST", url, {});

        if (!result) {
            alert("no result");
            return;
        }
        console.log(result);

        const { statusCode, message } = result;

        switch (statusCode) {
            case 200:
                await withdrawal();
                break;
            case 400:
                sweetAlertMessage(message, "", "w");
                break;
            default:
                sweetAlertMessage("문제가 발생했습니다.", "", "w");
                break;
        }
    } catch (error) {
        console.error("API 호출 실패", error);
    }
}

/**
 * 회원탈퇴 함수
 */
async function withdrawal() {
    try {
        const dataObj = { ...userInfo() };
        const response = await callApi("POST", "/front/back/oauth/withdrawal.php", dataObj);

        const { statusCode, message } = response;

        switch (statusCode) {
            case 200:
                const alert = await sweetAlertForReturn("탈퇴 처리되었습니다.", "", "s");
                if (alert) {
                    console.log("탈퇴완료");
                    logout();
                    location.href = "/index.html";
                }
                break;
            default:
                sweetAlertMessage("문제가 발생했습니다.", "", "w");
                break;
        }
    } catch (error) {
        console.error("API 호출 실패", error);
    }
}

/**
 * CSRF 방지를 위한 상태 토큰 생성 코드
 * 상태 토큰은 추후 검증을 위해 세션에 저장되어야 한다.
 * @returns {string} 상태 토큰
 */
function generateState() {
    return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

/**
 * 유효성 검사 함수
 */
function initValidation() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll(".needs-validation");

    Array.prototype.slice.call(forms).forEach(function (form) {
        const saveConfirmBtn = document.getElementById("save_btn");

        if (!saveConfirmBtn) {
            console.error("#save_btn not found"); // 디버그 메시지
            return;
        } else {
            console.log("#save_btn found"); // 디버그 메시지
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
                            valName = "번호";
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
                    console.log("validation finished");
                    user_info_modify();
                    // $("#modalConfirm").iziModal("open");
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
                        valName = "번호";
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

/**
 * 회원 정보 수정 함수
 */
async function user_info_modify() {
    try {
        const form = $("form.needs-validation");
        const name = form.find("#name").val().trim();
        const email = form.find("#email").val().trim() + "@" + form.find("#domain").val().trim();
        const mobile = form.find("#mobile").val().replace(/-/g, "").trim();
        const term_fg = $("#term_fg").is(":checked") ? "Y" : "N";

        const branchArray = $(".branch-phone")
            .map(function () {
                const element = $(this);
                const phoneValue = element.val().replace(/-/g, "").trim();
                if (phoneValue) {
                    return {
                        company_no: element.attr("data-company_no"),
                        branch_no: element.attr("data-branch_no"),
                        phone: phoneValue,
                    };
                }
            })
            .get();

        const dataObj = {
            ...userInfo(),
            name: name ? encodeURIComponent(name) : "",
            email: email ? encodeURIComponent(email) : "",
            mobile: mobile ? encodeURIComponent(mobile) : "",
            term_fg: term_fg ? encodeURIComponent(term_fg) : "",
            branchArray,
        };

        // 로딩 모달
        $("#modalLoading").iziModal("open");

        const result = await callApi("POST", "/front/back/mypage/modify_finance.php", dataObj);

        if (result && result.statusCode === 200 && result.message === "SUCCESS") {
            $("#modalCompletion").iziModal("open");
            $("#modalCompletion").on("closing", async function (event) {
                location.reload();
            });
        } else {
            const errorMessage = result?.statusCode === 400 ? result.message : "저장 중 <span>문제가</span> 발생했습니다.";

            $("#fail_message").html(`<h2>${errorMessage}</h2>`);
            $("#modalFail").iziModal("open");
            $("#modalFail").on("closing", async function (event) {
                location.reload();
            });
        }
    } catch (error) {
        console.log(error);
        $("#fail_message").html("<h2>저장 중 <span>문제가</span> 발생했습니다.</h2>");
        $("#modalFail").iziModal("open");
    } finally {
        $("#modalLoading").iziModal("close");
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
    // 모달 - 로딩
    initializeModal("#modalLoading", "/front/assets/lottie/loading.json", "#lottieLoading");
    // 모달 - 탈퇴
    initializeModal("#modalWithdrawal", "", "#lottieWithdrawal");

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
