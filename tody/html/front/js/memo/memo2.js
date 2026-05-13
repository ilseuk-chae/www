/**************************************************
 * ***************** 메모 관련 함수 ***************** *
 **************************************************/

/**
 * 메모 관련 이벤트 초기화 함수
 */
function initMemoEvents() {
    const $document = $(document);
    
    // 메모 관리 - 메모 등록하기
    $document.on("click", "#memo_add_btn", function (e) {
        // .modal-pop-wrapper 내부에서 발생한 클릭만 처리
        if ($(e.target).closest(".modal-pop-wrapper").length) {
            //memoRegist();
            alert("메모가 등록되었습니다. 시험용.");
        }
    });

    // 메모 관리 - 삭제
    $document.on("click", ".memo-delete-btn", function (e) {
        // .modal-pop-wrapper 내부에서 발생한 클릭만 처리
        if ($(e.target).closest(".modal-pop-wrapper").length) {
            const memoNo = $(e.target).attr("data-memo-no");
            memoDelete(memoNo);
        }
    });

    // 메모 관리 - 편집
    $document.on("click", ".memo-modify-btn", function (e) {
        // .modal-pop-wrapper 내부에서 발생한 클릭만 처리
        if ($(e.target).closest(".modal-pop-wrapper").length) {
            memoModifySet(e);
        }
    });

    // 메모 관리 - 편집 - 수정 취소하기
    $document.on("click", "#memo_modify_cancel_btn", function (e) {
        // .modal-pop-wrapper 내부에서 발생한 클릭만 처리
        if ($(e.target).closest(".modal-pop-wrapper").length) {
            const memoNo = $(e.target).attr("data-memo-no");
        }
    });

    // 메모 관리 - 편집 - 메모 수정하기
    $document.on("click", "#memo_modify_btn", function (e) {
        // .modal-pop-wrapper 내부에서 발생한 클릭만 처리
        if ($(e.target).closest(".modal-pop-wrapper").length) {
            const memoNo = $(e.target).attr("data-memo-no");
            memoModify(memoNo);
        }
    });
    
    // 메모 관리 - 전체/내 매물 메모보기
    $document.on("change", "input[name='radio_memo']", function (e) {
        // .modal-pop-wrapper 내부에서 발생한 클릭만 처리
        if ($(e.target).closest(".modal-pop-wrapper").length) {
            //memoList(1);
            displayMemoOnMap();
        }
    });

    // 메모 관리 - 댓글 등록
    $document.on("click", ".comment-btn", function (e) {
        // .modal-pop-wrapper 내부에서 발생한 클릭만 처리
        if ($(e.target).closest(".modal-pop-wrapper").length) {
            commentRegist(e);
        }
    });

    // 메모 관리 - 댓글 삭제
    $document.on("click", ".comment-delete-btn", function (e) {
        // .modal-pop-wrapper 내부에서 발생한 클릭만 처리
        if ($(e.target).closest(".modal-pop-wrapper").length) {
            const commentNo = $(e.target).attr("data-comment-no");
            commentDelete(commentNo);
        }
    });
}

/**
 * 메모 등록 함수
 * @returns
 */
async function memoRegist() {
    const user = userInfo();
    if (!user) {
        alert("회원 전용 기능입니다.");
        return;
    }

    const name = $("#memo_name");
    const phone = $("#memo_phone");
    const estateNo = $("#memo_estateNo");
    const content = $("#memo_content");

    if (!validateInput(name, "text", "이름을 확인해주세요.")) {
        alert("이름을 확인해주세요.");
        return;
    }
    if (!validateInput(phone, "phone", "연락처를 확인해주세요.")) {
        alert("연락처를 확인해주세요.");
        return;
    }
    /*
    if (!validateInput(estateNo, "number", "매물번호를 확인해주세요.")) {
        alert("매물번호를 확인해주세요.");
        return;
    }
    */
    if (content.val()) {
        if (!validateInput(content, "text", "메모는 255자 이하로 작성해주세요.")) {
            alert("메모는 255자 이하로 작성해주세요.");
            return;
        }
    }

    const dataObj = {
        ...user,
        name: encodeURIComponent(name.val().trim()),
        phone: encodeURIComponent(phone.val().trim()),
        estateNo: encodeURIComponent(estateNo.val().trim()),
        content: encodeURIComponent(content.val().trim()),
    };
    const url = "/front/back/memo/memo2_register.php";

    try {
        const result = await callApi("POST", url, dataObj);
        if (!result) alert("메모 등록에 실패했습니다. 다시 시도해주세요.");

        const { message, responseData, statusCode } = result;
        if (statusCode === 200 && message === "SUCCESS") {
            alert("메모가 등록되었습니다.");
            memoList(1);

        } else {
            alert(message);
        }
    } catch (error) {
        console.error(error);
    }
}

/**
 * 메모 리스트 불러오는 함수
 * (상단고정 X)
 * @param {number} page - 현재 페이지 번호
 * @param {string} [type] - 검색 타입
 * @param {string} [keyword] - 검색 키워드
 * @returns
 */
async function memoList(page = 1, type = "", keyword = "") {
    const user = userInfo();
    if (!user) {
        ajaxUnLoad();
        alert("회원 전용 기능입니다.");
        return;
    }

    const owner = $('input[name="radio_memo"]:checked').val(); // 매물 소유주 값
    const dataObj = {
        ...user,
        owner: encodeURIComponent(owner),
        page: encodeURIComponent(page),
        items_per_page: encodeURIComponent(10),
        type: encodeURIComponent(type), // 검색 타입 추가
        keyword: encodeURIComponent(keyword), // 검색 키워드 추가
    };

    const memoBox = $("#memo_box");
    const url = "/front/back/memo/memo_list.php";
    try {
        const result = await callApi("POST", url, dataObj); // 매물(상단X) 리스트 가져오기
        if (!result) {
            memoBox.empty();
            return;
        }

        const { message, responseData, statusCode, current_page, total_pages, total_records } = result;
        if (statusCode !== 200 || message !== "SUCCESS") {
            memoBox.empty();
            return;
        }

        if (!responseData || responseData.length === 0) {
            if ($("#memo_box_top .card").length === 0) {
                // memoBox.empty();
                memoBox.html("<p>등록된 메모가 없습니다.</p>");
                return;
            }
            memoBox.empty();
            return;
        }

        const memoHtml = responseData.map(createMemoHtml).join("");
        memoBox.html(memoHtml);

        // $(".modal-body").scrollTop($(".modal-body")[0].scrollHeight);
        $(".modal-body").animate({ scrollTop: 0 }, 200); // 부드러운 스크롤

    } catch (error) {
        console.error(error);
    }
}


/**
 * 메모 HTML 생성 함수
 * @param {*} data 메모 데이터
 * @returns {string} 메모 HTML
 */
function createMemoHtml(data) {
    const { memo_no, name, phone, estate_no, content, address_jibun, address_road, top_fg, reg_date, comments } = data;
    const flag = top_fg === "Y" ? "checked" : "";

    let commentHtml = "";
    if (comments.length > 0) {
        commentHtml = comments
            .map(function (commentData) {
                const { comment_no, comment, comment_date } = commentData;
                return `
                    <div class="w-100">
                        <p class="memo-comment">${comment}</p>
                        <div class="d-flex justify-content-start gap-1">
                            <p class="text-muted">등록일: <span>${comment_date}</span></p>
                            <button class="comment-delete-btn btn btn-sm btn-line-gray-s shadow-none" data-comment-no="${comment_no}">X</button>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    return `
        <div class="card bg-light bg-opacity-25 mb-auto shadow-none">
            <div class="card-body pb-1">
                <div class="d-flex mb-2 align-items-center justify-content-between text-primary flex-wrap">
                    <p class="memo-name">${name}</p>
                    <span> | </span>
                    <p class="memo-phone">${phoneOnDash(phone)}</p>
                    <span> | </span>
                    <p type="button">매물번호 : <span class="memo-estateNo">${estate_no}</span></p>
                </div>

                <p class="color-blue1 mb-1">▶ 매물주소 : <span>${address_jibun}</span></p>
                <div class="memo-content card-text color-black">
                    ${content}
                </div>
            </div>

            <div class="card-footer pt-1 pb-2 bg-transparent">
                <div class="d-flex flex-column gap-2">
                    <div class="comment-box w-100">
                        ${commentHtml}
                    </div>

                    <div class="d-flex gap-2">
                        <input type="text" class="comment-input form-control form-control-sm w-100" minlength="1" maxlength="49" />
                        <button class="comment-btn btn rounded-pill btn-sm text-nowrap border-red2 color-red2 bg-white shadow-none" data-memo-no="${memo_no}">댓글등록</button>
                    </div>

                    <div class="d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-2">
                            <div class="form-check form-check-primary">
                                <input class="memo-top-check form-check-input" type="checkbox" id="memo_check_${memo_no}" data-memo-no="${memo_no}" ${flag} />
                                <label class="form-check-label" for="memo_check_${memo_no}"> 상단고정 </label>
                            </div>
                            <button class="memo-modify-btn btn btn-sm btn-line-gray-s shadow-none" data-memo-no="${memo_no}">편집</button>
                            <button class="memo-delete-btn btn btn-sm btn-line-gray-s shadow-none" data-memo-no="${memo_no}">삭제</button>
                        </div>
                        <p class="text-muted">등록일: <span>${reg_date}</span></p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 메모 삭제 함수
 * @param {*} memoNo 매물 번호
 * @returns
 */
async function memoDelete(memoNo) {
    const user = userInfo();
    if (!user) {
        alert("회원 전용 기능입니다.");
        return;
    }

    if (!confirm("삭제하시겠습니까?")) return;

    const dataObj = {
        ...user,
        memoNo: encodeURIComponent(memoNo),
    };

    const url = "/front/back/memo/memo_delete.php";
    try {
        const result = await callApi("POST", url, dataObj);
        if (!result) return;

        const { message, responseData, statusCode } = result;
        if (statusCode !== 200 || message !== "SUCCESS") {
            alert("삭제 중 문제가 발생했습니다. 다시 시도해주세요.");
            return;
        } else {
            alert("삭제되었습니다.");
            memoList(1);
        }
    } catch (e) {
        console.error(e);
    }
}


/**
 * 메모 수정하기 셋팅 함수
 * @param {*} e
 */
function memoModifySet(e) {
    const memoNo = $(e.target).attr("data-memo-no");
    const closestCard = $(e.target).closest(".card");
    const name = closestCard.find(".memo-name").text().trim();
    const phone = closestCard.find(".memo-phone").text().trim().replace(/-/g, "");
    const estateNo = closestCard.find(".memo-estateNo").text().trim();
    const content = closestCard.find(".memo-content").text().trim();

    $("#memo_name").val(name);
    $("#memo_phone").val(phone);
    $("#memo_estateNo").val(estateNo);
    $("#memo_content").val(content);

    $("#memo_add_btn").hide();
    $("#memo_modify_btn_group").show();
    $("#memo_modify_btn").attr("data-memo-no", memoNo);
    $(".modal-body").animate({ scrollTop: 0 }, 200); // 부드러운 스크롤
}

/**
 * 메모 수정하기 함수
 * @param {*} memoNo
 */
async function memoModify(memoNo) {
    const user = userInfo();
    if (!user) {
        alert("회원 전용 기능입니다.");
        return;
    }

    const name = $("#memo_name");
    const phone = $("#memo_phone");
    const estateNo = $("#memo_estateNo");
    const content = $("#memo_content");

    if (!validateInput(name, "text", "이름을 확인해주세요.")) {
        alert("이름을 확인해주세요.");
        return;
    }
    if (!validateInput(phone, "phone", "연락처를 확인해주세요.")) {
        alert("연락처를 확인해주세요.");
        return;
    }
    if (!validateInput(estateNo, "number", "매물번호를 확인해주세요.")) {
        alert("매물번호를 확인해주세요.");
        return;
    }
    if (content.val()) {
        if (!validateInput(content, "text", "메모는 255자 이하로 작성해주세요.")) {
            alert("메모는 255자 이하로 작성해주세요.");
            return;
        }
    }

    const dataObj = {
        ...user,
        memoNo: encodeURIComponent(memoNo),
        name: encodeURIComponent(name.val().trim()),
        phone: encodeURIComponent(phone.val().trim()),
        estateNo: encodeURIComponent(estateNo.val().trim()),
        content: encodeURIComponent(content.val().trim()),
    };
    const url = "/front/back/memo/memo_modify.php";

    try {
        const result = await callApi("POST", url, dataObj);
        if (!result) alert("메모 수정에 실패했습니다. 다시 시도해주세요.");

        const { message, responseData, statusCode } = result;
        if (statusCode === 200 && message === "SUCCESS") {
            alert("수정되었습니다.");
            memoList(1);
            
        } else {
            alert(message);
        }
    } catch (error) {
        console.error(error);
    }
}

/**************************************************
 * ***************** 댓글 관련 함수 ***************** *
 **************************************************/

/**
 * 댓글 등록하는 함수
 * @returns
 */
async function commentRegist(e) {
    const user = userInfo();
    if (!user) {
        alert("회원 전용 기능입니다.");
        return;
    }
    const memoNo = $(e.target).attr("data-memo-no");
    const closestCard = $(e.target).closest(".card");
    const commentInput = closestCard.find(".comment-input");
    const comment = commentInput.val().trim();

    if (!validateInput(commentInput, "text", "댓글 내용을 확인하세요.")) {
        alert("댓글 내용을 확인하세요.");
        return;
    }

    const dataObj = {
        ...user,
        memoNo: encodeURIComponent(memoNo),
        comment: encodeURIComponent(comment),
    };

    const url = "/front/back/memo/memo_comment_register.php";
    try {
        const result = await callApi("POST", url, dataObj);
        if (!result) return;

        const { message, responseData, statusCode, timestamp } = result;
        if (statusCode !== 200 || message !== "SUCCESS") {
            alert(message);
        } else {
            alert("등록되었습니다.");

            const commentDiv = `
                <div class="w-100">
                    <p>${comment}</p>
                    <div class="d-flex justify-content-start gap-1">
                        <p class="text-muted">등록일: <span>${timestamp.substring(0, 10)}</span></p>
                        <button class="comment-delete-btn btn btn-sm btn-line-gray-s shadow-none" data-comment-no="${responseData.comment_no}">X</button>
                    </div>
                </div>`;
            closestCard.find(".comment-box").prepend(commentDiv);
            commentInput.val("");
        }
    } catch (e) {
        console.error(e);
    }
}

/**
 * 댓글 삭제 함수
 * @param {*} commentNo
 * @returns
 */
async function commentDelete(commentNo) {
    const user = userInfo();
    if (!user) {
        alert("회원 전용 기능입니다.");
        return;
    }

    const dataObj = {
        ...user,
        commentNo: encodeURIComponent(commentNo),
    };

    const url = "/front/back/memo/memo_comment_delete.php";
    try {
        const result = await callApi("POST", url, dataObj);
        if (!result) return;

        const { message, responseData, statusCode } = result;
        if (statusCode === 200 && message === "SUCCESS") {
            alert("삭제되었습니다.");
            const currentPage = $(".memo-paging-list").find("a.active").attr("data-page");
            memoList(currentPage); // 현재 ��이지에만 ��신
        } else {
            alert(message);
        }
    } catch (e) {
        console.error(e);
    }
}
