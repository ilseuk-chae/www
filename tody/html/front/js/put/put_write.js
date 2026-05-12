let swiper;
let fileManager; // 전역 변수 대신 클로저에서 접근할 수 있는 객체
$(document).ready(async function () {
    if (!userInfo()) {
        alert("로그인 후 이용 가능합니다.");
        location.href = "../findput/findput_list.html?tab=put";
        return;
    }
    initModal();
    initSelect();
    fileManager = initEvents(); // 클로저에서 반환된 객체를 저장
    initValidation();
    initializeMap(); // 지도 초기화

    // 삽니다 - 상세 - 이미지
    swiper = new Swiper(".fw-file", {
        slidesPerView: "auto",
        spaceBetween: 15,
    });
});

/**
 * 이벤트 모음 함수
 */
function initEvents() {
    // jQuery val 메서드 오버라이드
    (function ($) {
        // 원래의 jQuery val 메서드를 저장
        var originalVal = $.fn.val;

        // jQuery val 메서드를 새롭게 정의
        $.fn.val = function () {
            // 원래의 val 메서드를 호출하여 값을 설정하거나 가져옴
            var result = originalVal.apply(this, arguments);

            // 만약 arguments가 존재하면, 즉 값을 설정할 때
            if (arguments.length > 0) {
                // input 이벤트를 트리거
                this.trigger("input");
            }

            // 원래의 val 메서드 결과를 반환
            return result;
        };
    })(jQuery);

    // 기본 주소 값 들어갈 때, 지도에 마커 표시
    $("input[name='address_primary']").on("input change valueSet", function () {
        searchAddress($(this).val());
    });

    $("#sale_type").on("change", function () {
        if ($(this).val() == "003") {
            $("#rent_price_div").show();
            $("#rent_type").prop("required", true);
        } else {
            $("#rent_price_div").hide();
            $("#rent_type").val(0);
            $("#rent_type").prop("required", false);
        }
    });

    // // 모달 닫힘 이벤트 설정 - 등록 완료
    // $("#modalCompletion").on("closed", function () {
    //     console.log("Modal closed");
    //     // location.reload(); // 페이지 리로드
    // });

    // Textarea 높이 자동증가 이벤트 - 설명
    $("#description").on("input", function () {
        autoResize(this);
    });

    let fileList = {};
    let fileIndex = 0; // 파일 순서를 나타내는 인덱스

    // 이미지 파일 선택 이벤트 설정
    $("#file_input").on("change", async function (e) {
        await handleFileInputChange(e);
    });

    // 이미지 삭제 이벤트 리스너 설정
    $(document).on("click", ".fa-circle-xmark", function () {
        handleImageDelete(fileList, $(this));
    });

    function getFileList() {
        return fileList;
    }

    async function handleFileInputChange(e) {
        const files = e.target.files;
        const container = $(".swiper-wrapper");
        container.not(":first").empty();

        for (let i = 0; i < files.length; i++) {
            const imgSrc = await handleFileInputChangeMultiple(files[i]);
            const fileId = fileIndex++;

            const slide = `
                <div class="swiper-slide" data-id="${fileId}">
                    <img src="${imgSrc}" width="100%" alt="" title="" />
                    <span><i class="fa-sharp fa-solid fa-circle-xmark"></i></span>
                </div>
            `;

            container.append(slide);
            fileList[fileId] = files[i];
        }

        swiper.update();

        $("#file_input").val("");
    }

    function handleImageDelete(fileList, element) {
        const slide = element.closest(".swiper-slide");
        const fileId = slide.data("id");
        delete fileList[fileId];
        slide.remove();
        swiper.update();
    }

    return {
        getFileList,
    };
}

/**
 * 선택박스 초기화
 */
function initSelect() {
    estate_type_get(); // 매물종류
    sale_type_get(); // 거래종류
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

                    putWrite(fileManager.getFileList()); // 여기서 getFileList로 fileList를 가져옴
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
// 지도 관련 함수
// =============================================================================
let map; // 맵
let geocoder; // 맵
/**
 * 카카오맵 적용 함수
 */
async function initializeMap() {
    let lat = "";
    let lng = "";

    // 양평군청
    lat = "37.4917882876857";
    lng = "127.487578470072";

    // lat와 lng를 사용하는 코드 추가
    console.log(`현재 좌표: 위도(${lat}), 경도(${lng})`);

    // 지도를 표시할 div
    var mapContainer = document.getElementById("kakao_map");
    var mapOption = {
        draggable: false,
        center: new kakao.maps.LatLng(lat, lng), // 지도의 중심좌표
        level: 3, // 지도의 확대 레벨,
    };

    // 지도를 생성합니다
    map = new kakao.maps.Map(mapContainer, mapOption);

    // 주소-좌표 변환 객체를 생성합니다
    geocoder = new kakao.maps.services.Geocoder();
}

function searchAddress(param) {
    // 주소로 좌표를 검색합니다
    geocoder.addressSearch(param, function (result, status) {
        // 정상적으로 검색이 완료됐으면
        if (status === kakao.maps.services.Status.OK) {
            console.log(result);
            var coords = new kakao.maps.LatLng(result[0].y, result[0].x);

            $("#latitude").val(result[0].y);
            $("#longitude").val(result[0].x);

            // 결과값으로 받은 위치를 마커로 표시합니다
            var marker = new kakao.maps.Marker({
                map: map,
                position: coords,
                clickable: true,
            });

            // 지도의 중심을 결과값으로 받은 위치로 이동시킵니다
            map.setCenter(coords);
        }
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
function putWrite(fileList) {
    // formData 초기화
    let formData = new FormData();

    // fileList에 있는 파일 추가
    for (const fileId in fileList) {
        if (fileList.hasOwnProperty(fileId)) {
            formData.append("files[]", fileList[fileId]);
        }
    }

    let sido;
    let sgg;
    let umd;
    if ($("#sigungu_code").val()) {
        sido = $("#sigungu_code").val().substring(0, 2);
        sgg = $("#sigungu_code").val().substring(2);
    }
    if ($("#dong_code").val()) {
        umd = $("#dong_code").val().split($("#sigungu_code").val())[1];
    }

    const dataObj = {
        ...userInfo(),
        sido: encodeURIComponent(sido || ""),
        sgg: encodeURIComponent(sgg || ""),
        umd: encodeURIComponent(umd || ""),
        address_primary: encodeURIComponent($("#address_primary").val() || ""),
        address_road: encodeURIComponent($("#address_road").val() || ""),
        address_jibun: encodeURIComponent($("#address_jibun").val() || ""),
        address_detail: encodeURIComponent($("#address_detail").val() || ""),
        latitude: $("#latitude").val() || "",
        longitude: $("#longitude").val() || "",

        estate_type: encodeURIComponent($("#estate_type").val() || ""),
        sale_type: encodeURIComponent($("#sale_type").val() || ""),
        exchange_fg: encodeURIComponent($("#exchange_fg").is(":checked") ? "Y" : "N"),
        sale_price: $("#sale_price").val() || 0,
        rent_price: $("#rent_price").val() || 0,
        area: $("#area").val() || 0,
        phone: encodeURIComponent($("#phone").val().replace(/-/g, "") || ""),
        description: encodeURIComponent($("#description").val() || ""),
    };

    for (const key in dataObj) {
        if (Object.hasOwnProperty.call(dataObj, key)) {
            const value = dataObj[key];
            formData.append(key, value);
        }
    }

    callApiFormData("POST", "/front/back/put/put_write.php", formData)
        .then((response) => {
            if (!response) {
                $("#modalFail").iziModal("open");
                return;
            }

            // API 호출 성공
            const { statusCode, message, responseData } = response;
            if (statusCode == 200 && message == "SUCCESS") {
                $("#noti_count").text(responseData);
                $("#modalCompletion").iziModal("open");

                // 모달 닫힘 이벤트 설정
                $("#modalCompletion").on("closed", function () {
                    console.log("Modal closed");
                    location.href = "/front/views/mypage/mypage_put";
                });
            } else {
                sweetAlertMessage(message, "", "w");
                // $("#modalFail").iziModal("open");
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
