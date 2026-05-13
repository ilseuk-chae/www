// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(document).ready(async function () {
    // 구해요 상세 정보 불러오기
    re_wanted_detail_info();

    // [Event] 삭제 버튼 클릭
    $("#delete_btn").on("click", function () {
        const no = $("#wanted_no").text();
        wanted_delete(no);
    });

    // [Event] 공개 상태 변경
    $(".change-public-btn").on("click", function () {
        const val = $(this).attr("data-public_fg");
        public_fg_change(val);
    });
});

// =============================================================================
// 구해요 관련 함수
// =============================================================================
/**
 * 구해요 상세정보 가져오는 함수
 * @returns
 */
async function re_wanted_detail_info() {
    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보

    const itemNo = getParameter("no");
    console.log(itemNo);

    const dataObj = {
        ...adminInfo,
        langCode,
        no: encodeURIComponent(itemNo),
    };

    const result = await callApi("POST", "/admin/back/04-estate/wanted_info_v2.php", dataObj);

    if (!result) return;

    const { status, message, responseData } = result;

    // 정보 바인딩
    bindJsonData(responseData);

    const { public_fg } = responseData;

    // 공개상태
    const public_selector = $("#public_fg");
    switch (public_fg) {
        case "Y":
            public_selector.text("공개");
            break;
        case "N":
            public_selector.text("비공개");
            break;
        case "C":
            public_selector.text("거래완료");
            break;
        default:
            public_selector.text("공개");
    }
    public_selector.attr("data-public_fg", public_fg);
}

/**
 * 삭제처리 함수
 * @param {*} rcvNo
 * @returns
 */
async function wanted_delete(rcvNo) {
    const confirm = await sweetConfirm("삭제 하시겠습니까?", "", "w");
    if (!confirm) return;

    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보

    const dataObj = {
        ...adminInfo,
        langCode,
        rcvNo: rcvNo,
    };

    const result = await callApi("POST", "/admin/back/04-estate/wanted_delete.php", dataObj);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("처리 되었습니다.", "", "s");
        if (!confirm) return;
        location.href = "/admin/views/re_manage/re_wanted_v2.html";
    } else {
        const confirm = await sweetAlertForReturn("삭제를 실패했습니다.", "", "e");
        if (!confirm) return;
    }
}

/**
 * 공개 상태 변경하는 함수
 * @param {*} val = 변경할 상태값
 * @returns
 */
async function public_fg_change(val) {
    const confirm = await sweetConfirm("상태를 변경 하시겠습니까?", "", "q");
    if (!confirm) return;

    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보
    const wanted_no = getUrlParameter("no");

    const dataObj = {
        ...adminInfo,
        langCode,
        public_fg: encodeURIComponent(val),
        wanted_no,
    };

    const result = await callApi("POST", "/admin/back/04-estate/wanted_public_fg_change.php", dataObj);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("처리 되었습니다.", "", "s");
        if (!confirm) return;
        location.reload();
    } else {
        const confirm = await sweetAlertForReturn("변경에 실패했습니다.", "", "e");
        if (!confirm) return;
    }
}
