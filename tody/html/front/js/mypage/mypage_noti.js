// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(function () {
    const user = userInfo();
    if (!user) {
        alert("로그인 후 이용 가능합니다.");
        location.href = "/index";
        return;
    }
    if (user.user_role !== "003") {
        $(".finance-group").remove();
    }
    if (user.user_role !== "002") {
        $(".find-group, .put-group").remove();
    }
    initMenu();
    initModal();
    initSelect();
    initEvents(user);
    notification_get();
});

// 이벤트 초기화 함수
function initEvents(user) {
    // [Event] 구합니다 알림 체크 이벤트
    $("#find_rcv_fg").on("change", function () {
        if (!$(this).prop("checked")) {
            // 체크박스의 부모 div 내의 모든 ul 요소를 숨기기
            $(this).closest("div").find("ul").removeClass("show");
        } else {
            // 체크박스가 체크 해제된 경우 ul 요소를 다시 표시
            $(this).closest("div").find("ul").addClass("show");
        }
    });

    // [Event] 내놓습니다 알림 체크 이벤트
    $("#put_rcv_fg").on("change", function () {
        if (!$(this).prop("checked")) {
            // 체크박스의 부모 div 내의 모든 ul 요소를 숨기기
            $(this).closest("div").find("ul").removeClass("show");
        } else {
            // 체크박스가 체크 해제된 경우 ul 요소를 다시 표시
            $(this).closest("div").find("ul").addClass("show");
        }
    });

    // [EVENT] 변경 이벤트 - 시/도 필터
    $(document).on("change", "select.sido", async function () {
        const sidoCd = $(this).val();
        const sidoOptions = await sgg_get(sidoCd); // 필터(시/군/구)

        const sggSelector = $(this).parents("li").find(".sgg");
        sggSelector.empty().append(sidoOptions);
    });

    // [EVENT] 구합니다 추가 버튼 클릭
    $("#find_add_btn").on("click", function () {
        find_group_add();
    });

    // [EVENT] 구합니다 제거 버튼 클릭
    $("#find_group_ul").on("click", "button.delete-btn", function () {
        const li = $(this).parents("li");
        li_delete(li);
    });

    // [EVENT] 구합니다 추가 버튼 클릭
    $("#put_add_btn").on("click", function () {
        put_group_add();
    });

    // [EVENT] 구합니다 제거 버튼 클릭
    $("#put_group_ul").on("click", "button.delete-btn", function () {
        const li = $(this).parents("li");
        li_delete(li);
    });

    // [Event] 저장하기 버튼 클릭
    $("#save_btn").on("click", function () {
        noti_save(user);
    });

    // [Event] 공개 상태 변경
    $(document).on("click", ".change-public-btn", function () {
        const val = $(this).attr("data-public_fg");
        const no = $(this).attr("data-wanted_no");
        public_fg_change(val, no);
    });
}

/**
 * 알림 설정 가져오는 함수
 * @returns
 */
async function notification_get() {
    const dataObj = { ...userInfo() };
    const result = await callApi("POST", "/front/back/mypage/notification_get.php", dataObj);
    if (!result) return;

    const { existing_preferences, noti_lists } = result.responseData;
    // 각 type_name에 해당하는 체크박스를 체크합니다.
    existing_preferences.forEach(function (preference) {
        if (preference.active_fg === "Y") {
            $("input[type='checkbox'][id='" + preference.type_name + "_rcv_fg']")
                .prop("checked", true)
                .trigger("change");
        }
    });

    if (!noti_lists || noti_lists.length === 0) {
        return;
    }

    const findUl = $("#find_group_ul");
    const putUl = $("#put_group_ul");

    const { find, put } = noti_lists;

    if (find && find.length > 0) {
        const findLiHtml = find
            .map(function ($data) {
                return `
                <li>
                    <input type="text" class="sido input-box w30p" value="${$data.sido_nm}" data-code="${$data.sido_cd}" readonly disabled>
                    <input type="text" class="sgg input-box w30p" value="${$data.sgg_nm || "시/군/구 전체"}" data-code="${$data.sgg_cd || ""}" readonly disabled>
                    <input type="text" class="estate-type input-box w30p" value="${$data.type_name || "매물종류 전체"}" data-code="${$data.estate_type || ""}" readonly disabled>
                    <button class="delete-btn"><i class="fa-solid fa-circle-minus"></i></button>
                </li>`;
            })
            .join("");
        findUl.prepend(findLiHtml);
    }

    if (put && put.length > 0) {
        const putLiHtml = put
            .map(function ($data) {
                return `
            <li>
                <input type="text" class="sido input-box w30p" value="${$data.sido_nm}" data-code="${$data.sido_cd}" readonly disabled>
                <input type="text" class="sgg input-box w30p" value="${$data.sgg_nm || "시/군/구 전체"}" data-code="${$data.sgg_cd || ""}" readonly disabled>
                <input type="text" class="estate-type input-box w30p" value="${$data.type_name || "매물종류 전체"}" data-code="${$data.estate_type || ""}" readonly disabled>
                <button class="delete-btn"><i class="fa-solid fa-circle-minus"></i></button>
            </li>`;
            })
            .join("");
        putUl.prepend(putLiHtml);
    }
}

// =============================================================================
// 선택박스 관련 함수
// =============================================================================
/**
 * 선택박스 초기화
 */
async function initSelect() {
    const typeOptions = await estate_type_get(); // 매물종류
    $("#find_add_li").find(".estate-type").append(typeOptions);
    $("#put_add_li").find(".estate-type").append(typeOptions);

    const sidoOptions = await sido_get(); // 시/도
    $("#find_add_li").find(".sido").append(sidoOptions);
    $("#put_add_li").find(".sido").append(sidoOptions);
}

/**
 * 매물종류 가져오는 함수
 * @returns
 */
async function estate_type_get() {
    const dataObj = {};
    const result = await callApi("POST", "/front/back/find/estate_type_get.php", dataObj);
    if (!result) return;

    //const seletHtml = populateOptions(result.responseData, "type_code", "type_name");
    const seletHtml = populateOptions2(result.responseData, "type_code", "type_name", "type_code");
    return seletHtml;

    callApiAbort("/front/back/find/estate_type_get.php", "POST", dataObj, "estate_type_get")
        .then((response) => {
            populateOptions($(".estate-type"), response.responseData, "type_code", "type_name");
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
    const result = await callApi("POST", "/front/back/find/sido_get.php", dataObj);
    if (!result) return;

    const seletHtml = populateOptions(result.responseData, "sido_cd", "locallow_nm");
    return seletHtml;

    callApiAbort("/front/back/find/sido_get.php", "POST", dataObj, "sido_get")
        .then((response) => {
            const seletHtml = populateOptions(response.responseData, "sido_cd", "locallow_nm");
            console.log(seletHtml);
            return seletHtml;
        })
        .catch((error) => {
            console.error("API 호출 실패", error);
        })
        .finally(async () => {
            // sgg_get(sido);
        });
}

/**
 * 시/군/구 가져오는 함수
 * @returns
 */
async function sgg_get(sidoCd) {
    const dataObj = {
        sido_cd: encodeURIComponent(sidoCd || getParameter("sido")),
    };
    const result = await callApi("POST", "/front/back/find/sgg_get.php", dataObj);
    if (!result) return;

    const seletHtml = '<option value="">시/군/구 전체</option>' + populateOptions(result.responseData, "sgg_cd", "locatadd_nm");
    return seletHtml;

    // const dataObj = {
    //     sido_cd: encodeURIComponent(sidoCd || getParameter("sido")),
    // };

    // callApiAbort("/front/back/find/sgg_get.php", "POST", dataObj, "sgg_get")
    //     .then((response) => {
    //         sggSelector.empty().append('<option value="">선택하세요.</option>');
    //         populateOptions(sggSelector, response.responseData, "sgg_cd", "locatadd_nm");
    //     })
    //     .catch((error) => {
    //         console.error("API 호출 실패", error);
    //     })
    //     .finally(() => {});
}

/**
 * 구합니다 알림 구역 추가 함수
 * @returns
 */
async function find_group_add() {
    const $findAddLi = $("#find_add_li");
    const $sido = $findAddLi.find(".sido");
    const $sgg = $findAddLi.find(".sgg");
    const $type = $findAddLi.find(".estate-type");
    const ul = $("#find_group_ul");

    if (!$sido.val()) {
        $sido[0].setCustomValidity(`시/도를 선택해주세요.`);
        $sido[0].reportValidity(); // 직접 유효성 검사 메시지 표시
        // sweetAlertMessage("시/도를 선택해주세요.");
        return;
    }

    // 비동기 호출로 옵션 가져오기
    // const [sidoOptions, typeOptions] = await Promise.all([sido_get(), estate_type_get()]);

    const $sidoOption = $sido.find("option:selected");
    const $sggOption = $sgg.find("option:selected");
    const $typeOption = $type.find("option:selected");

    // li 요소 HTML 생성
    const liHtml = `
        <li>
            <input type="text" class="sido input-box w30p" value="${$sidoOption.text()}" data-code="${$sidoOption.val()}" readonly disabled>
            <input type="text" class="sgg input-box w30p" value="${$sggOption.text()}" data-code="${$sggOption.val()}" readonly disabled>
            <input type="text" class="estate-type input-box w30p" value="${$typeOption.text()}" data-code="${$typeOption.val()}" readonly disabled>
            <button class="delete-btn"><i class="fa-solid fa-circle-minus"></i></button>
        </li>`;

    // li 요소 HTML 생성
    // const liHtml = `
    //     <li>
    //         <button class="delete-btn"><i class="fa-solid fa-circle-minus"></i></button>
    //         <select name="" class="sido select-box w30p">
    //             ${$sido.html()}
    //         </select>
    //         <select name="" class="sgg select-box w30p">
    //             ${$sgg.html()}
    //         </select>
    //         <select name="" class="estate-type select-box w30p">
    //             ${$type.html()}
    //         </select>
    //     </li>`;

    
    ul.append(liHtml);
    // 새 li 요소를 ul에 추가
    //$sido.value = "시/도 선택";
    //$sgg.value ="시/군/구 전체";
    //$type.value ="매물종류 전체";
    $sido.val("");
    $sgg.val("");
    $type.val("");

    // // 새로 추가된 li를 jQuery 객체로 가져오기
    // const $newLi = ul.find("li").last();

    // // 새로 추가된 li 내의 select 요소에 접근
    // const $selectSido = $newLi.find("select.sido");
    // const $selectSgg = $newLi.find("select.sgg");
    // const $selectType = $newLi.find("select.estate-type");

    // // 새로 추가된 select 요소의 첫 번째 옵션을 선택
    // if ($selectSido.find(`option[value="${$sido.val()}"]`).length) {
    //     $selectSido.val($sido.val());
    // }
    // if ($selectSgg.find(`option[value="${$sgg.val()}"]`).length) {
    //     $selectSgg.val($sgg.val());
    // }
    // if ($selectType.find(`option[value="${$type.val()}"]`).length) {
    //     $selectType.val($type.val());
    // }

    // $sido.val("");
    // $sgg.val("");
    // $type.val("");
}

/**
 * 내놓습니다 알림 구역 추가 함수
 * @returns
 */
async function put_group_add() {
    const $findAddLi = $("#put_add_li");
    const $sido = $findAddLi.find(".sido");
    const $sgg = $findAddLi.find(".sgg");
    const $type = $findAddLi.find(".estate-type");
    const ul = $("#put_group_ul");

    if (!$sido.val()) {
        $sido[0].setCustomValidity(`시/도를 선택해주세요.`);
        $sido[0].reportValidity(); // 직접 유효성 검사 메시지 표시
        // sweetAlertMessage("시/도를 선택해주세요.");
        return;
    }

    // 비동기 호출로 옵션 가져오기
    // const [sidoOptions, typeOptions] = await Promise.all([sido_get(), estate_type_get()]);

    const $sidoOption = $sido.find("option:selected");
    const $sggOption = $sgg.find("option:selected");
    const $typeOption = $type.find("option:selected");

    // li 요소 HTML 생성
    const liHtml = `
        <li>
            <input type="text" class="sido input-box w30p" value="${$sidoOption.text()}" data-code="${$sidoOption.val()}" readonly disabled>
            <input type="text" class="sgg input-box w30p" value="${$sggOption.text()}" data-code="${$sggOption.val()}" readonly disabled>
            <input type="text" class="estate-type input-box w30p" value="${$typeOption.text()}" data-code="${$typeOption.val()}" readonly disabled>
            <button class="delete-btn"><i class="fa-solid fa-circle-minus"></i></button>
        </li>`;

    // 새 li 요소를 ul에 추가
    ul.append(liHtml);

    $sido.val("");
    $sgg.val("");
    $type.val("");
}

/**
 * 구역 삭제 함수
 * @param {*} li
 */
function li_delete(li) {
    li.remove();
}

/**
 * 알림 등록 함수
 * @param {*} user
 * @returns
 */
async function noti_save(user) {
    try {
        // 로딩 모달
        $("#modalLoading").iziModal("open");

        const event_rcv_fg = $("#event_rcv_fg").is(":checked") ? "Y" : "N";
        const find_rcv_fg = $("#find_rcv_fg").is(":checked") ? "Y" : "N";
        const put_rcv_fg = $("#put_rcv_fg").is(":checked") ? "Y" : "N";
        const finance_rcv_fg = $("#finance_rcv_fg").is(":checked") ? "Y" : "N";

        let find_array = {};
        let put_array = {};
        if (find_rcv_fg === "Y") {
            $.each($("#find_group_ul").find("li"), function (index, li) {
                // li를 jQuery 객체로 변환
                let $li = $(li);

                find_array[index] = {
                    sido: $li.find(".sido").attr("data-code"),
                    sgg: $li.find(".sgg").attr("data-code"),
                    type: $li.find(".estate-type").attr("data-code"),
                };
            });
        }

        if (put_rcv_fg === "Y") {
            $.each($("#put_group_ul").find("li"), function (index, li) {
                // li를 jQuery 객체로 변환
                let $li = $(li);

                put_array[index] = {
                    sido: $li.find(".sido").attr("data-code"),
                    sgg: $li.find(".sgg").attr("data-code"),
                    type: $li.find(".estate-type").attr("data-code"),
                };
            });
        }

        let dataObj = {};
        if (user.user_role === "001") {
            dataObj = {
                ...user,
                event_rcv_fg,
            };
        } else if (user.user_role === "002") {
            dataObj = {
                ...user,
                event_rcv_fg,
                find_rcv_fg,
                put_rcv_fg,
                find_array,
                put_array,
            };
        } else if (user.user_role === "003") {
            dataObj = {
                ...user,
                event_rcv_fg,
                finance_rcv_fg,
            };
        }

        const result = await callApi("POST", "/front/back/mypage/notification_save.php", dataObj);

        if (!result) return;

        const { status, message } = result;

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
 * 공개 상태 변경하는 함수
 * @param {*} val = 변경할 상태값
 * @returns
 */
async function public_fg_change(val, no) {
    const confirm = await sweetConfirm("상태를 변경 하시겠습니까?", "", "q");
    if (!confirm) return;

    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어

    const dataObj = {
        ...userInfo(),
        langCode,
        public_fg: encodeURIComponent(val),
        wanted_no: no,
    };

    const result = await callApi("POST", "/front/back/mypage/find_public_change.php", dataObj);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("처리 되었습니다.", "", "s");
        if (!confirm) return;

        // 테이블 데이터만 다시 불러오기
        loadTableData(null, (data) => {
            const table = $("#ajax-datatables").DataTable();
            table.clear().rows.add(data.data).draw();
        });
    } else {
        const confirm = await sweetAlertForReturn("변경에 실패했습니다.", "", "e");
        if (!confirm) return;
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
function populateOptions(data, valueKey, textKey) {
    if (data.length > 0) {
        // 텍스트 기준 오름차순
        data.sort((a, b) => a[textKey].localeCompare(b[textKey]));

        const optionHtml = data.map((e) => `<option value="${e[valueKey]}">${e[textKey]}</option>`).join("");
        // selector.append(optionHtml);

        return optionHtml;
    }
}

function populateOptions2(data, valueKey, textKey, sortKey = textKey) { // sortKey 추가, 기본값은 textKey
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
        return optionHtml;
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
