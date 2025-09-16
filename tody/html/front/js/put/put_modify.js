let swiper;
let fileManager; // 전역 변수 대신 클로저에서 접근할 수 있는 객체
$(document).ready(async function () {
    if (!userInfo()) {
        alert("정상적인 접근이 아닙니다.");
        location.href = "/index";
        return;
    }
    initModal();
    try {
        initializeMap(); // 지도 초기화
        const initResult = await initSelect();
        if (initResult) {
            initDetail();
        }
    } catch (error) {}
    fileManager = initEvents(); // 클로저에서 반환된 객체를 저장
    initValidation();

    // 구합니다 - 상세 - 이미지
    swiper = new Swiper(".fw-file", {
        slidesPerView: "auto",
        spaceBetween: 15,
    });
});

/**
 * 선택박스 초기화
 */
async function initSelect() {
    await estate_type_get(); // 매물종류
    await sale_type_get(); // 거래종류
    return true;
}

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

    // 거래종류 월세일 시, 월세 input 보여주는 이벤트
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

    // 모달 닫힘 이벤트 설정 - 등록 완료
    // $("#modalCompletion").on("closed", function () {
    //     console.log("Modal closed");
    //     location.reload(); // 페이지 리로드
    // });

    // Textarea 높이 자동증가 이벤트 - 설명
    $("#description").on("input", function () {
        autoResize(this);
    });

    // 수정하기 폼 변경 이벤트
    $("#modify_btn").on("click", function () {
        $("form.needs-validation").find("input, select, checkbox, textarea").prop("disabled", false);
        $("#modify_btn").hide();
        $("#save_btn").show();
        $(".swiper-wrapper").find("i").show();
        $(".swiper-slide:first").show();
        swiper.update();
    });

    // 저장버튼 클릭 이벤트
    $("#save_btn").on("click", async function () {
        $("#modalConfirm").iziModal("open");

        // const sweetReturn = await sweetConfirm("저장하시겠습니까?", "", "q");
        // if (sweetReturn) {
        //     putModify();
        // }
    });

    // [Event] 삭제 버튼 클릭
    $("#delete_btn").on("click", async function () {
        findDelete();
    });

    // =================================================================
    // 이벤트 관련 이벤트 및 함수
    // =================================================================
    let fileList = {};
    let fileIndex = 0; // 파일 순서를 나타내는 인덱스

    // 이미지 파일 선택 이벤트 설정
    $("#file_input").on("change", async function (e) {
        await handleFileInputChange(e);
    });

    // 이미지 삭제 이벤트 리스너 설정
    $(document).on("click", ".fa-circle-xmark.new-close-btn", function () {
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
                    <span><i class="fa-sharp fa-solid fa-circle-xmark new-close-btn"></i></span>
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
 * 유효성 검사 함수
 */
function initValidation() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll(".needs-validation");

    Array.prototype.slice.call(forms).forEach(function (form) {
        const saveConfirmBtn = document.getElementById("save_confirm_btn");

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

                    putModify(fileManager.getFileList());
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
    //console.log(`현재 좌표: 위도(${lat}), 경도(${lng})`);

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
            //console.log(result);
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

    callApiAbort("/front/back/put/put_detail.php", "POST", dataObj, "initDetail")
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
            $("#save_btn").attr("data-no", data.put_no);
            $("#sigungu_code").val(data.sido_cd + data.sgg_cd);
            $("#dong_code").val(data.sido_cd + data.sgg_cd + data.umd_cd);
            // $("#latitude").val(data.latitude);
            // $("#longitude").val(data.longitude);
            $("#address_primary").val(data.address_jibun);
            $("#address_road").val(data.address_road);
            $("#address_jibun").val(data.address_jibun);
            $("#address_detail").val(data.address_detail);
            $("#estate_type").val(data.estate_type_cd);
            $("#sale_type").val(data.sale_type_cd);
            data.exchange_fg == "Y" ? $("#exchange_fg").prop("checked", true) : $("#exchange_fg").prop("checked", false);
            $("#sale_price").val(data.sale_price);
            $("#rent_price").val(data.rent_price);
            $("#area").val(data.area);
            $("#phone").val(data.phone);
            $("#description").val(data.description);

            if (data.sale_type_cd == "003") {
                $("#rent_price_div").show();
            }

            // 이미지 처리
            const container = $(".swiper-wrapper");
            container.not(":first").empty();

            let fileIndex = 0; // 파일 순서를 나타내는 인덱스

            if (data.imageArray.length > 0) {
                for (let i = 0; i < data.imageArray.length; i++) {
                    const image = `<img src="${data.imageArray[i].imgSrc}" alt="" width="100%">`;
                    const slide = `
                        <div class="swiper-slide" data-file-no="${data.imageArray[i].fileNo}" >
                            <a href="${data.imageArray[i].imgSrc}" target="_blank">
                                ${image}
                            </a>
                            <span class="close-btn-box"><i class="fa-sharp fa-solid fa-circle-xmark ori-close-btn pointer"></i></span>
                        </div>
                    `;

                    container.append(slide);
                }
                container.find("i").hide();
            }

            $(".fa-circle-xmark.ori-close-btn").on("click", async function () {
                const alertResult = await sweetConfirm("삭제하시겠습니까?", "저장과 상관없이 삭제됩니다.", "w");
                if (!alertResult) {
                    return;
                }
                const slide = $(this).closest(".swiper-slide");
                const fileNo = slide.data("file-no");
                removeFile(fileNo);
                slide.remove();
                swiper.update();
            });
        })
        .catch((error) => {
            console.log(error);
        });
}

function removeFile(fileNo) {
    const dataObj = {
        ...userInfo(),
        fileNo,
    };
    callApiAbort("/front/back/put/put_file_remove.php", "POST", dataObj, "removeFile")
        .then((response) => {
            // API 호출 성공
            if (!response) {
                $("#modalFail").iziModal("open");
                return;
            }

            const { statusCode, message, responseData } = response;
            if (statusCode == 200 && message == "SUCCESS") {
                sweetAlertMessage("삭제되었습니다.", "", "s");
            } else {
                sweetAlertMessage("삭제에 실패했습니다.", "", "e");
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * 저장 함수
 */
function putModify(fileList) {
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
        no: $("#save_btn").attr("data-no") || "",
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
    $("#modalLoading").iziModal("open");

    callApiFormData("POST", "/front/back/put/put_modify.php", formData)
        .then((response) => {
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
                sweetAlertMessage(message, "", "w");
                // $("#modalFail").iziModal("open");
            }
        })
        .catch((error) => {
            // API 호출 실패
            console.error("API 호출 실패", error);
        })
        .finally(() => {
            $("#modalLoading").iziModal("close");

            // API 호출 완료
        });
}

/**
 * 삭제처리 함수
 * @returns
 */
async function findDelete() {
    const confirm = await sweetConfirm("삭제 하시겠습니까?", "", "w");
    if (!confirm) return;

    const dataObj = {
        ...userInfo(),
        rcvNo: $("#save_btn").attr("data-no") || "",
    };

    const result = await callApi("POST", "/front/back/mypage/put_delete.php", dataObj);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("처리 되었습니다.", "", "s");
        if (confirm) location.href = "/front/views/mypage/mypage_put";
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
    // 모달 - 로딩
    initializeModal("#modalLoading", "/front/assets/lottie/loading.json", "#lottieLoading");

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
