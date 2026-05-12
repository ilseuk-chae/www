// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(function () {
    const user = userInfo();
    if (!user) {
        alert("로그인 후 이용 가능합니다.");
        location.href = "/index";
        return;
    }
    initMenu(user);
    job_list();
    user_info();
    initModal();
    initEvents();
    initRelationshipFlag();
    initValidation();
});

/**
 * 직군 리스트 가져오는 함수
 * @returns
 */
async function job_list() {
    const langCode = localStorage.getItem("langCode") ?? "kr";
    const dataObj = {
        langCode,
    };

    const result = await callApi("POST", "/front/back/00-include/job_list.php", dataObj);
    if (!result) return;

    const { status, message, responseData } = result;
    if (!responseData) {
        console.log(message);
        return;
    }

    const jobListHtml = responseData
        .map(function (item) {
            let itemHtml = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="job_no_${item.job_no}" data-job_no="${item.job_no}" disabled/>
                    <label class="form-check-label" name="job-label" for="job_no_${item.job_no}"> ${item.job_name} </label>
                </div>
                `;

            return itemHtml;
        })
        .join("");

    $("#job_list").html(jobListHtml);
}

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

    const result = await callApi("POST", "/front/back/mypage/user_info_general.php", dataObj);

    if (!result) return;

    const { status, message, responseData } = result;

    if (!responseData) {
        console.log(message);
        return;
    }

    const { id, name, email, mobile, relationship_fg, term_fg, job_no_array, role } = responseData;
    if (role == "002") location.href = "mypage_realtor_v2.html";
    if (role == "003") location.href = "mypage_finance_v2.html";
    const [emailPart, domainPart] = email.split("@");

    $("#id").val(id);
    $("#name").val(name);
    $("#email").val(emailPart);
    $("#domain").val(domainPart);
    $("#mobile").val(phoneOnDash(mobile));

    // 부동산 관계여부
    if (relationship_fg == "Y") {
        $("#relationship_fg").prop("checked", true);
        $("#job_list_collapse").collapse("show");
    } else {
        $("#relationship_fg").prop("checked", false);
        $("#job_list_collapse").collapse("hide");
    }

    // 약관 동의 여부
    if (term_fg == "Y") {
        $("#term_fg").prop("checked", true);
    } else {
        $("#term_fg").prop("checked", false);
    }

    // 직군
    if (job_no_array) {
        const jobNumbers = job_no_array.split(",");

        // 직군 번호로 체크
        jobNumbers.forEach((item) => {
            $(`#job_no_${item}`).prop("checked", true);
            $(`#job_no_${item}`).prop("checked", true);
        });
    }

    // if (job_name_array) {
    //     // 직군 이름으로 체크
    //     jobName.forEach((item) => {
    //         $('label.form-check-label[name="job-label"]').each(function () {
    //             if ($(this).text() === jobName) {
    //                 console.log($(this).text());
    //                 $(this).prev(".form-check-input").prop("checked", true);
    //             }
    //         });
    //     });
    // }
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
        $("input:disabled").not("#id").prop("disabled", false);
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

async function user_info_modify() {
    try {
        const form = $("form.needs-validation");
        const name = form.find("#name").val();
        const email = form.find("#email").val() + "@" + form.find("#domain").val();
        const mobile = form.find("#mobile").val().replace(/-/g, "");
        const relationship_fg = $("#relationship_fg").is(":checked") ? "Y" : "N";
        const term_fg = $("#term_fg").is(":checked") ? "Y" : "N";

        let jobNoArray = [];
        if (relationship_fg === "Y") {
            $("#job_list .form-check-input:checked").each(function () {
                let jobNo = $(this).attr("data-job_no");
                jobNoArray.push(jobNo);
            });
        }

        const dataObj = {
            ...userInfo(),
            name: name ? encodeURIComponent(name) : "",
            email: email ? encodeURIComponent(email) : "",
            mobile: mobile ? encodeURIComponent(mobile) : "",
            relationship_fg: relationship_fg ? encodeURIComponent(relationship_fg) : "",
            jobNoArray: jobNoArray ? encodeURIComponent(jobNoArray) : [],
            term_fg: term_fg ? encodeURIComponent(term_fg) : "",
        };

        $("#modalLoading").iziModal("open");
        const result = await callApi("POST", "/front/back/mypage/modify_general.php", dataObj);

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
