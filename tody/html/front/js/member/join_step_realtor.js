// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(async function () {
    if (await userInfo()) location.href = "/index";
    initModal();
    initEvents();
    initValidation();
});

/**
 * 이벤트 초기화 함수
 */
function initEvents() {
    // 중복확인 클릭 이벤트
    $("#redundancy_btn").on("click", async function (event) {
        event.preventDefault();

        const redundancy = await checkRedundancy();
        if (redundancy) {
            $("#modalConfirm").iziModal("open");
        }
    });

    $("#select_domain").on("change", function (event) {
        const selectVal = $(this).val();
        $("#domain").val(selectVal);
    });
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

                // 중복 확인 상태를 확인
                const idField = $("#id");
                const redundancyChecked = idField.data("redundancy-checked");
                const redundancyValid = idField.data("redundancy-valid");

                if (!redundancyChecked || !redundancyValid) {
                    idField[0].setCustomValidity(`아이디 중복 확인을 해주세요.`);
                    // 약간의 지연을 추가하여 스크롤을 부드럽게 동작하게 함
                    setTimeout(() => {
                        $("html, body").animate({ scrollTop: idField.offset().top - $(window).height() / 2 }, "smooth");
                        idField[0].reportValidity(); // 유효성 메시지 표시
                    });
                    $("#fail_message").html("<h2>아이디 <span>중복 확인</span>을 해주세요.</h2>");
                    $("#modalFail").iziModal("open");
                    return;
                }

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
                            if ($field.is("#id")) {
                                fieldType = "id";
                                valName = "아이디";
                            } else if ($field.is("#mobile")) {
                                fieldType = "phone";
                                valName = "휴대폰번호";
                            } else {
                                fieldType = "text";
                                valName = "값";
                            }
                            break;
                        case "password":
                            fieldType = "password";
                            valName = "비밀번호";
                            break;
                        case "tel":
                            fieldType = "phone";
                            valName = "전화번호";
                            break;
                        case "checkbox":
                            fieldType = "checkbox";
                            valName = "체크박스";
                            break;
                        case "file":
                            fieldType = "file";
                            valName = "파일";
                            break;
                        default:
                            fieldType = type;
                    }

                    let isValid = false;
                    if (type === "file") {
                        isValid = validateInput($field, fieldType, `${valName}을(를) 입력해주세요.`, "imagePdf");
                    } else {
                        isValid = validateInput($field, fieldType, `${valName}을(를) 입력해주세요.`);
                    }

                    const errorElement = $field.parent().find(".invalid-feedback").length != 0 ? $field.parent().find(".invalid-feedback") : $field.parent().parent().find(".invalid-feedback");
                    if (!isValid) {
                        if (errorElement.length > 0) {
                            errorElement.show();
                            $field[0].setCustomValidity(errorElement.text());
                            // $field[0].reportValidity();
                        } else {
                            $field[0].setCustomValidity(`${valName}을(를) 입력해주세요.`);
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

                const passwordField = $("#password");
                const confirmPasswordField = $("#password_confirm");

                // 비밀번호 확인 일치 여부 검사
                if (passwordField.val() !== confirmPasswordField.val()) {
                    const errorElement = confirmPasswordField.closest(".input-box").find(".invalid-feedback");
                    // errorElement.text("비밀번호가 일치하지 않습니다.").show();
                    if (errorElement.length > 0) {
                        confirmPasswordField[0].setCustomValidity(errorElement.text());
                    } else {
                        confirmPasswordField[0].setCustomValidity("비밀번호가 일치하지 않습니다.");
                    }
                    confirmPasswordField[0].reportValidity();
                    confirmPasswordField.addClass("is-invalid");
                    isFormValid = false;
                    if (!firstInvalidField) {
                        firstInvalidField = confirmPasswordField;
                    }
                } else {
                    confirmPasswordField[0].setCustomValidity("");
                    // confirmPasswordField[0].reportValidity();
                    confirmPasswordField.removeClass("is-invalid");
                }

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
                    const redundancyCheck = await checkRedundancy();
                    if (redundancyCheck) {
                        signUp();
                    } else {
                        $("#fail_message").html("<h2>이미 <span>사용 중</span>인 아이디입니다.</h2>");
                        $("#modalFail").iziModal("open");
                    }
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
                        if ($field.is("#id")) {
                            fieldType = "id";
                            valName = "아이디";
                        } else if ($field.is("#phone")) {
                            fieldType = "phone";
                            valName = "전화번호";
                        } else if ($field.is("#mobile")) {
                            fieldType = "phone";
                            valName = "휴대폰번호";
                        } else {
                            fieldType = "text";
                            valName = "값";
                        }
                        break;
                    case "password":
                        fieldType = "password";
                        valName = "비밀번호";
                        break;
                    case "tel":
                        fieldType = "phone";
                        valName = "전화번호";
                        break;
                    case "checkbox":
                        fieldType = "checkbox";
                        valName = "체크박스";
                        break;
                    case "file":
                        fieldType = "file";
                        valName = "파일";
                        break;
                    default:
                        fieldType = type;
                }

                let isValid = false;
                if (type === "file") {
                    isValid = validateInput($field, fieldType, `${valName}을(를) 입력해주세요.`, "imagePdf");
                } else {
                    isValid = validateInput($field, fieldType, `${valName}을(를) 입력해주세요.`);
                }

                const errorElement = $field.parent().find(".invalid-feedback").length != 0 ? $field.parent().find(".invalid-feedback") : $field.parent().parent().find(".invalid-feedback");

                // 유효성 통과
                if (isValid) {
                    $field.removeClass("is-invalid").addClass("is-valid");
                    $field[0].setCustomValidity("");
                    errorElement.hide();
                }
                // 유효성 실패
                else {
                    $field.removeClass("is-valid").addClass("is-invalid");
                    if (errorElement.length > 0) {
                        // $field[0].setCustomValidity(errorElement.text());
                        errorElement.show();
                    } else {
                        // $field[0].setCustomValidity(`${valName}을(를) 입력해주세요.`);
                    }
                    // $field[0].reportValidity(); // 직접 유효성 검사 메시지 표시
                }

                // 비밀번호 확인 일치 여부 검사
                const passwordField = $("#password");
                const confirmPasswordField = $("#password_confirm");

                if (passwordField.val() !== confirmPasswordField.val()) {
                    const errorElement = confirmPasswordField.closest(".input-box").find(".invalid-feedback");
                    // errorElement.text("비밀번호가 일치하지 않습니다.").show();
                    if (errorElement.length > 0) {
                        confirmPasswordField[0].setCustomValidity(errorElement.text());
                    } else {
                        confirmPasswordField[0].setCustomValidity("비밀번호가 일치하지 않습니다.");
                    }
                    // confirmPasswordField[0].reportValidity();
                    confirmPasswordField.addClass("is-invalid");
                } else {
                    confirmPasswordField[0].setCustomValidity("");
                    // confirmPasswordField[0].reportValidity();
                    confirmPasswordField.removeClass("is-invalid");
                }
            });
        });
    });
}

/**
 * 중복검사 함수
 * @returns
 */
async function checkRedundancy() {
    const idField = $("#id");

    // 아이디 유효성 검사: 4글자 이상 15글자 이하
    if (validateInput(idField, "id", "아이디를 입력해주세요.")) {
        console.log("아이디 유효성 검사 통과");

        const url = "/front/back/member/check_redundancy.php";
        const dataObj = { id: encodeURIComponent(idField[0].value) };

        try {
            const result = await callApiAbort(url, "POST", dataObj, "checkRedundancy");
            if (result.responseData.length === 0) {
                // 중복되지 않는 경우
                idField.removeClass("is-invalid").addClass("is-valid");
                idField.data("redundancy-checked", true);
                idField.data("redundancy-valid", true);
                // $("#modalConfirm").iziModal("open");
                return true;
            } else {
                // 중복된 경우
                idField.removeClass("is-valid").addClass("is-invalid");
                idField[0].setCustomValidity("이미 사용 중인 아이디입니다.");
                idField[0].reportValidity();
                idField.data("edundancy-checked", true);
                idField.data("redundancy-valid", false);
                // $("#modalFail").iziModal("open");
            }
        } catch (error) {
            console.error("API 호출 중 오류 발생:", error);
            idField.data("redundancy-checked", true);
            idField.data("redundancy-valid", false);
            // $("#modalFail").iziModal("open");
        }
    } else {
        console.log("아이디 유효성 검사 실패");
        idField[0].setCustomValidity("아이디는 4글자 이상 15글자 이하로 입력해주세요.");
        idField[0].reportValidity();
    }
    return false;
}

/**
 * 회원 가입 함수
 * @returns
 */
async function signUp() {
    const id = $("#id").val();
    const password = $("#password").val();
    const agency_name = $("#agency_name").val();
    const broker_name = $("#broker_name").val();
    const zipcode = $("#zipcode").val();
    const address_primary = $("#address_primary").val();
    const address_detail = $("#address_detail").val();
    const phone = $("#phone").val();
    const mobile = $("#mobile").val();
    const email = $("#email").val() + "@" + $("#domain").val();
    const homepage_url = $("#homepage_url").val();
    const event_rcv_fg = $("#event_rcv_fg").is(":checked") ? "Y" : "N";
    const find_push_fg = $("#find_push_fg").is(":checked") ? "Y" : "N";
    const put_push_fg = $("#put_push_fg").is(":checked") ? "Y" : "N";
    const term_fg = $("#term_fg").is(":checked") ? "Y" : "N";

    const dataObj = {
        id: id ? encodeURIComponent(id) : "",
        password: password ? encodeURIComponent(password) : "",
        agency_name: agency_name ? encodeURIComponent(agency_name) : "",
        broker_name: broker_name ? encodeURIComponent(broker_name) : "",
        zipcode: zipcode ? encodeURIComponent(zipcode) : "",
        address_primary: address_primary ? encodeURIComponent(address_primary) : "",
        address_detail: address_detail ? encodeURIComponent(address_detail) : "",
        phone: phone ? encodeURIComponent(phone) : "",
        mobile: mobile ? encodeURIComponent(mobile) : "",
        email: email ? encodeURIComponent(email) : "",
        homepage_url: homepage_url ? encodeURIComponent(homepage_url) : "",

        event_rcv_fg: event_rcv_fg ? encodeURIComponent(event_rcv_fg) : "",
        find_push_fg: find_push_fg ? encodeURIComponent(find_push_fg) : "",
        put_push_fg: put_push_fg ? encodeURIComponent(put_push_fg) : "",
        term_fg: term_fg ? encodeURIComponent(term_fg) : "",
    };

    // formData 초기화
    const formData = new FormData();

    // business_license 파일 추가
    const businessLicenseFile = $("#business_license")[0].files[0];
    if (businessLicenseFile) {
        formData.append("business_license", businessLicenseFile);
    }
    // brokerage_cert 파일 추가
    const brokerageCertFile = $("#brokerage_cert")[0].files[0];
    if (brokerageCertFile) {
        formData.append("brokerage_cert", brokerageCertFile);
    }

    for (const key in dataObj) {
        if (Object.hasOwnProperty.call(dataObj, key)) {
            const value = dataObj[key];
            formData.append(key, value);
        }
    }

    try {
        const  signupResult = await callApiFormData("POST", "/front/back/member/signup_realtor.php", formData);
    
        if (!signupResult) { // signupResult가 빈 객체 {}로 resolve될 경우 (서버에서 빈 응답), 이 조건이 true가 될 수 있습니다.
            console.log("signupResult가 비어있습니다. 서버 응답 로직을 확인하세요.");
            // 사용자에게 메시지 표시 또는 추가 처리
            return; // 처리할 값이 없으므로 종료
        }
    
        // 성공적으로 데이터가 있다면 여기서 성공 로직을 처리합니다.
        
        const { statusCode, message } = signupResult;
        if (statusCode == 200 && message == "SUCCESS") {
            $("#modalCompletion").iziModal("open");

            // 모달 확인 버튼 클릭 시 로그인 처리
            $("#modalCompletion").on("closing", async function (event) {
                // 로그인 API 호출
                const loginResult = await callApi("POST", "/front/back/00-include/login.php", dataObj);

                const { statusCode, message, responseData } = loginResult;
                const alertResult = await loginHandleError(message, statusCode);
                if (!alertResult) return;

                const { userNo, userToken, agency_name, role,userId } = responseData;

                // 쿠키 설정
                setCookie("user_no", userNo);
                setCookie("user_token", userToken);
                setCookie("user_name", encodeURIComponent(agency_name));
                setCookie("user_role", encodeURIComponent(role));
                setCookie("user_id", userId);
                // 페이지 이동
                location.href = "/index.html";
            });
        } else if (statusCode === 400) {
            $("#fail_message").html(`<h2>${message}</h2>`);
            $("#modalFail").iziModal("open");
        } else {
            $("#fail_message").html(`<h2><span>문제</span>가 발생했습니다. 다시 시도해주세요.</h2>`);
            $("#modalFail").iziModal("open");
        }
    
    } catch (error) {
        console.error("회원가입 API 호출 중 에러 발생:", error);
        // 에러 객체에서 메시지와 상태 코드 추출
        const errorMessage = error.message || "회원가입 중 알 수 없는 에러가 발생했습니다.";
        const statusCode = error.statusCode || 500;
        
        // 사용자에게 에러 메시지 표시
        // handleError(errorMessage, statusCode);
        //alert(`오류: ${errorMessage} (코드: ${statusCode})`); // 간단한 alert 예시
        // 에러 발생 시 추가적인 UI 처리 또는 로깅
        return; // 에러 발생 시 처리 중단
    }
}

// 로그인 오류 처리 함수
async function loginHandleError(message, statusCode, data) {
    switch (statusCode) {
        case 200:
            return true;
        case 400:
            sweetAlertMessage("아이디와 비밀번호를 입력하세요.", "", "w");
            return false;
        case 401:
            sweetAlertMessage(message, "", "w");
            return false;
        case 403:
            sweetAlertMessage(message + " 유저입니다.", "", "w");
            return false;
        default:
            sweetAlertMessage(message, "", "e");
            return false;
    }
}

/**
 * 모달 초기화 함수
 */
function initModal() {
    // 모달 - 등록완료
    initializeModal("#modalCompletion", "/front/assets/lottie/completion.json", "#lottieCompletion");
    // 모달 - 중복확인완료
    initializeModal("#modalConfirm", "/front/assets/lottie/completion.json", "#lottieConfirm");
    // 모달 - 중복확인실패
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
