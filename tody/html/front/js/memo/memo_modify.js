async function initMemoModifyModalLogic() {
    const $modalContainer = $("#memoModifyModal"); // 수정 전용 모달 컨테이너 ID

    const memoCurrentData = $modalContainer.data("memoData") || $modalContainer.data("currentMemoDataForEdit");
    const $modalDialog = $modalContainer.find(".modal-dialog");
    const $memoLocationInfo = $modalContainer.find("#memo_location_info"); // ⭐ 위치 정보 요소 ⭐

    // Draggable 설정 (여전히 중요!)
    $modalDialog.css({
        'margin': '0 !important', // 기존 마진 제거
        'width': '500px !important', // 너비 고정
        'max-width': '90vw !important', // 최대 너비
        'min-height': '400px !important', // 최소 높이
        'max-height': '650px !important', // 최대 높이
        'display': 'flex !important', // Flexbox 레이아웃
        'flex-direction': 'column !important', // 세로 정렬
        'overflow': 'hidden !important' // 모달 다이얼로그 자체 스크롤 방지
    });

    $modalDialog.draggable({
        handle: ".modal-header", // ⭐ 모달 헤더로만 드래그 ⭐
        // ⭐⭐⭐ 핵심: start 및 drag 콜백 단순화 ⭐⭐⭐
        // 이 콜백들은 jQuery UI Draggable의 기본 동작을 거의 그대로 따르면서
        // 필요시 뷰포트 경계 내에 유지하는 역할만 합니다.
        start: function(event, ui) {
            // 드래그 시작 시, 이미 position:fixed이고 top/left로 제어되고 있으므로
            
        },
        drag: function(event, ui) {
            // Draggable의 containment 옵션을 'window'로 사용하면 이 로직을 생략할 수 있습니다.
            // 하지만 정확한 제어를 위해 직접 처리.
            const viewportWidth = $(window).width();
            const viewportHeight = $(window).height();
            const dialogWidth = $(this).outerWidth();
            const dialogHeight = $(this).outerHeight();

            let newLeft = ui.position.left;
            let newTop = ui.position.top;

            // 왼쪽 경계
            if (newLeft < 0) newLeft = 0;
            // 위쪽 경계
            if (newTop < 0) newTop = 0;
            // 오른쪽 경계
            if (newLeft + dialogWidth > viewportWidth) newLeft = viewportWidth - dialogWidth;
            // 아래쪽 경계
            if (newTop + dialogHeight > viewportHeight) newTop = viewportHeight - dialogHeight;

            ui.position.left = newLeft;
            ui.position.top = newTop;
        },
        // ⭐⭐⭐ containment 옵션을 다시 추가하여 Draggable의 내장 기능을 활용 ⭐⭐⭐
        // 'window'는 모달이 브라우저 창 밖으로 나가지 않도록 합니다.
        containment: "window",
        
        // ⭐⭐⭐ 다른 고려 사항 ⭐⭐⭐
        // 혹시 `.modal-header`에 `pointer-events: none` 같은 CSS가 적용되어 있지는 않은지 확인합니다.
        // 또는 다른 요소가 `.modal-header` 위에 놓여 이벤트를 가로채는지 확인합니다.
    });
    $modalContainer.off('shown.bs.modal.position').on('shown.bs.modal.position', function() {
        
        const initialClickX = memoCurrentData ? memoCurrentData.clientX : null;
        const initialClickY = memoCurrentData ? memoCurrentData.clientY : null;
        
        const isRegisterMode = $modalContainer.data("modalMode") === "register";
        const popupOffset = isRegisterMode ? 20 : (20 + 30); // 20: 간격, 30: 마커 이미지 높이
        
        // 모달의 정확한 크기를 측정 (shown.bs.modal에서는 정확함)
        const dialogWidth = $modalDialog.outerWidth();
        const dialogHeight = $modalDialog.outerHeight();
        
        if (initialClickX !== null && initialClickY !== null) {
            let targetX = initialClickX - (dialogWidth / 2);
            let targetY = isRegisterMode ? (initialClickY + popupOffset) : (initialClickY - dialogHeight - popupOffset); // Y 좌표 계산
            
            // 화면 경계 확인 및 조정
            const viewportWidth = $(window).width();
            const viewportHeight = $(window).height();
    
            if (targetX < 0) targetX = 0;
            if (targetY < 0) targetY = 0; 
            if (targetX + dialogWidth > viewportWidth) targetX = viewportWidth - dialogWidth;
            if (targetY + dialogHeight > viewportHeight) targetY = viewportHeight - dialogHeight;
            
            // ⭐⭐⭐ 최종 CSS 적용 (position, top, left, margin, transform) ⭐⭐⭐
            // opacity 관련 코드는 삭제
            $modalDialog.css({
                'position': 'fixed', // 드래그 시 fixed를 유지
                'top': targetY + 'px',
                'left': targetX + 'px',
                'margin': '0',        // 마진이 초기화되도록 한번 더 강조
                'transform': 'none'   // transform을 초기화하여 offsetTop/Left이 정확하도록
            });
            
        } else {
            // 기본값: 중앙
            $modalDialog.css({
                'position': 'fixed',
                'top': '50%',
                'left': '50%',
                'margin': '0',
                'transform': 'translate(-50%, -50%)'
            });
        }
    });

    
    //$("#myModalLabel").text("메모수정"); // 타이틀 변경
    const $memoDisplayNo = $modalContainer.find(".memo-display-no");

    if (memoCurrentData) {
        $("#memo_name").val(memoCurrentData.name);
        $("#memo_phone").val(memoCurrentData.phone);
        $("#memo_estateNo").val(memoCurrentData.estate_no);
        $("#memo_content").val(memoCurrentData.content);
        // complete 체크박스도 채워야 한다면
        $("#memo_complet").prop('checked', memoCurrentData.complete === 'Y');

        // 숨겨진 필드에 메모의 고유 ID(idx)를 저장하여 수정 API 호출 시 사용
        $modalContainer.find("#memo_modify_idx_hidden_input").val(memoCurrentData.memo_no);

        // ⭐ 메모 번호를 span에 삽입 ⭐
        if (memoCurrentData.memo_no) {
            $memoDisplayNo.text(`내 메모번호: ${memoCurrentData.my_idx}`);
        } else {
            $memoDisplayNo.text(''); // memo_no가 없으면 표시 안 함
        }

        // ⭐⭐⭐ 위치 정보 표시 HTML 구성 ⭐⭐⭐
        let locationHtml = ''; // HTML 내용을 담을 변수
        // ⭐⭐⭐ 위치 정보 표시 HTML 구성 ⭐⭐⭐
    
        // 지번 주소 또는 도로명 주소
        if (memoCurrentData.address_jibun) {
            locationHtml += `<p class="color-blue1 mb-1">▶ 매물 지번주소 : <span>${decodeURIComponent(memoCurrentData.address_jibun)}</span></p>`;
        } 
        if (memoCurrentData.address_road) { // 도로명은 항상 추가
            locationHtml += `<p class="color-blue1 mb-1">▶ 매물 도로주소 : <span>${decodeURIComponent(memoCurrentData.address_road)}</span></p>`;
        }

        //locationHtml += `<hr style="border-top: 1px dashed #ccc; margin: 10px 0;">`; // 구분선

        
        // ⭐ 2. 클릭 위치 주소 및 PNU (위경도 기반 조회) ⭐
        // PNU가 있는 메모는 항상 위경도도 있을 것이라 가정
        if (memoCurrentData.latitude && memoCurrentData.longitude) {
            //$memoData.html(`${locationHtml}<p class="text-muted mb-1">클릭 위치 주소 조회 중...</p>`); // 로딩 메시지
            
            try {
                const coords = { lat: memoCurrentData.latitude, lng: memoCurrentData.longitude };
                const addressResult = await searchDetailAddrFromCoordsMy(coords);

                if (addressResult && addressResult.status === kakao.maps.services.Status.OK && addressResult.result && addressResult.result[0]) {
                    const result = addressResult.result[0];
                    let jibunAddr = result.address ? result.address.address_name : '';
                    let roadAddr = result.road_address ? result.road_address.address_name : '';
                    
                    // PNU는 이미 memoCurrentData.pnu에 있습니다.
                    const originalPnu = memoCurrentData.pnu || '-'; 
                    
                    locationHtml += `<p class="color-green1 mb-1">▶ 메모 등록주소 : <span>${jibunAddr || '-'}</span></p>`;
                    
                } else {
                    console.warn("위경도로 주소 정보 조회 실패:", addressResult.status);
                    locationHtml += `<p class="text-blue1 mb-1">▶ 클릭 위치 주소 조회 실패</p>`;
                    
                }
            } catch (error) {
                console.error("위경도 주소 조회 중 오류 발생:", error);
                locationHtml += `<p class="color-blue1 mb-1">▶ 클릭 위치 주소 조회 오류 발생</p>`;
                
            }
        } else {
            // 위경도 정보가 없을 경우 (혹시나 해서)
            locationHtml += `<p class="text-blue1 mb-1">▶ 클릭 위치 위경도 정보 없음</p>`;
            
        }
        // ⭐ HTML을 요소에 삽입 ⭐
        $memoLocationInfo.html(locationHtml);
    
        const $memoContent = $('#memo_content');
        const $memoContentCharCount = $('#memoContentCharCount');
        // const maxLength = $memoContent.attr('maxlength'); // maxLength는 이미 "/250"에 고정되어 있으므로 필요 없을 수 있습니다.

        // 이벤트 리스너 중복 방지를 위해 기존 'input' 이벤트 해제 후 다시 바인딩 (모달 재활용 시)
        $memoContent.off('input').on('input', function() {
            const currentLength = $(this).val().length;
            $memoContentCharCount.text(currentLength);
        });

        // 모달이 열리거나 초기화될 때 textarea의 현재 글자 수로 span 업데이트
        $memoContentCharCount.text($memoContent.val().length);

        // ⭐ 메모의 comments 섹션만 표시 ⭐
        // 현재 메모가 가진 comments 정보를 직접 사용합니다.
        const commentsHtml = createMemoCommentsSectionHtml(memoCurrentData);
        $("#memo_box").html(commentsHtml); // 여기에 댓글 섹션을 삽입

        // ⭐⭐⭐ 핵심: 초기 로드 후 comment-box를 최하단으로 스크롤 ⭐⭐⭐
        // comment-box는 #memo_box 안에 생성되므로, #memo_box 찾습니다.
        const $commentBoxForScroll = $("#memo_box").find(".comment-box"); 
        if ($commentBoxForScroll.length > 0) {
            const element = $commentBoxForScroll[0];

            // Promise를 사용하여 scrollHeight가 0이 아닐 때까지 기다림
            await new Promise(resolve => {
                const checkRenderedAndScroll = () => {
                    // console.log(`Checking: scrollHeight=${element.scrollHeight}, offsetHeight=${element.offsetHeight}, clientHeight=${element.clientHeight}`);

                    // ⭐⭐⭐ Promise 해결 조건 변경 ⭐⭐⭐
                    // 요소가 렌더링되어 높이를 가졌을 때 (offsetHeight > 0)는 무조건 resolve
                    if (element.offsetHeight > 0) { 
                        resolve(); // 요소가 렌더링되었으니 Promise를 해결합니다.
                    } else {
                        // 아직 렌더링되지 않았다면 다음 애니메이션 프레임에서 다시 확인
                        requestAnimationFrame(checkRenderedAndScroll);
                    }
                };
                requestAnimationFrame(checkRenderedAndScroll); // 첫 체크 시작
            });

            // ⭐⭐ Promise가 해결된 후, 실제로 스크롤이 필요한 경우에만 스크롤 수행 ⭐⭐
            // 이 시점에는 element.scrollHeight와 clientHeight가 올바르게 계산되어 있습니다.
            if (element.scrollHeight > element.clientHeight) {
                element.scrollTop = element.scrollHeight;
                //console.log("Comment box scrolled to bottom successfully.");
            } else {
                // 스크롤이 필요 없는 경우 (댓글이 적어서 모두 보일 때)
                //console.log("Comment box does not require scrolling. No scroll performed.");
            }

        } else {
            //console.log("Comment box element not found.");
        }

        // ⭐ 동적으로 생성된 댓글/메모 관련 버튼 이벤트 바인딩 ⭐
        bindMemoCommentSectionEvents(memoCurrentData.memo_no); // 이 함수는 아래에 새로 정의

    } else {
        //alert("수정할 메모 데이터를 찾을 수 없습니다.");
        $memoLocationInfo.html("<p class='text-muted mb-1'>위치 정보 없음</p>"); // 에러 시 초기화
        $memoDisplayNo.text(''); // 에러 시 메모 번호도 초기화
        const memoModifyModalInstance = bootstrap.Modal.getInstance($modalContainer[0]);
        if (memoModifyModalInstance) 
            memoModifyModalInstance.hide();
        return;
    }
    
    // ⭐ "메모 수정하기" 버튼 클릭 이벤트 ⭐
    $("#memo_modify_btn").off('click').on("click", async function () { // off('click')으로 기존 이벤트 핸들러 제거
        const $modalContainer = $(this).closest(".modal"); // 클릭된 버튼의 가장 가까운 부모 모달 컨테이너를 찾음
        // ... (메모 등록과 유사하게 필드 값 가져오기) ...
        const name_val = $modalContainer.find("#memo_name").val();
        const phone_val = $modalContainer.find("#memo_phone").val();
        const estateNo_val = $modalContainer.find("#memo_estateNo").val();
        const content_val = $modalContainer.find("#memo_content").val();
        const complete_val = $modalContainer.find("#memo_complet").is(':checked'); // 체크박스 값 가져오기
        const memoIdx = $modalContainer.find("#memo_modify_idx_hidden_input").val(); // 메모 IDX

        let validationPassed = true; // 유효성 검사 통과 여부

        const name_validation_msg = validateInput(name_val, "string", "이름을 확인해주세요.", { maxLength: 50, required: true });
        if (name_validation_msg !== true) { // true가 아니면 에러 메시지이거나 false
            alert(name_validation_msg);
            validationPassed = false;
        }

        if (validationPassed) {
            const phone_validation_msg = validateInput(phone_val, "phone", "연락처를 확인해주세요.", { required: true });
            if (phone_validation_msg !== true) {
                alert(phone_validation_msg);
                validationPassed = false;
            }
        }
        // 내용이 있을 때만 검증 (maxlength 250이 이미 HTML에 있으나, 한 번 더 검증)
        if (validationPassed && content_val.length > 0) {
            const content_validation_msg = validateInput(content_val, "string", "메모는 250자 이하로 작성해주세요.", { maxLength: 250 });
            if (content_validation_msg !== true) {
                alert(content_validation_msg);
                validationPassed = false;
            }
        }
        
        if (!validationPassed) {
            return; // 유효성 검사 실패 시 함수 종료
        }
        
        // 5. user 정보 가져오기 (userInfo() 함수 호출)
        const currentUserInfo = userInfo();
        const dataObj = {
            ...(currentUserInfo ? currentUserInfo : {}), // user 정보가 없으면 빈 객체 병합
            memo_idx: memoIdx, // 수정할 메모의 ID (매우 중요!)
            name: encodeURIComponent(name_val.trim()),
            phone: encodeURIComponent(phone_val.trim()),
            estateNo: encodeURIComponent(estateNo_val.trim()),
            content: encodeURIComponent(content_val.trim()),
            complete: complete_val ? 'Y' : 'N', // 'Y' 또는 'N'으로 서버에 전달 (PHP에서 'Y'/'N' 또는 1/0으로 처리해야 합니다.)
            // type, latitude, longitude, pnu 등 필요하면 추가 (수정에서는 보통 변경 안함)
        };

        const url = "/front/back/memo/memo2_modify.php"; // ⭐ 메모 수정 API ⭐
        
        try {
            const result = await callApi("POST", url, dataObj);
            if (result && result.statusCode === 200 && result.message === "SUCCESS") {
                sweetAlertMessage("메모가 수정되었습니다.","","s");
                //const modalInstance = bootstrap.Modal.getInstance($modalContainer[0]);
                //if (modalInstance) modalInstance.hide();
                // ⭐⭐ 지도상의 특정 메모만 업데이트 ⭐⭐
                if (result.responseData) { // 서버에서 업데이트된 메모 데이터를 보냈다면

                    // 1. 현재 모달 컨테이너에 저장된 데이터를 최신 `result.responseData`로 업데이트
                    const $modalContainer = $(this).closest(".modal");
                    $modalContainer.data("currentMemoDataForEdit", result.responseData);
                    
                    // 2. `initMemoModifyModalLogic` 함수를 다시 호출하여 모달 UI를 업데이트
                    //    이 함수는 $modalContainer.data()에서 데이터를 가져오므로 인자 전달 필요 없음
                    await initMemoModifyModalLogic(); // ⭐ async 함수이므로 await 붙임 ⭐
            
                    updateSingleMemoOnMap(result.responseData);
                } else {
                    // 서버에서 데이터를 반환하지 않는 경우, 전체 지도를 새로고침하는 이전 로직 유지
                    displayMemoOnMap(); // 지도상의 메모를 새로고침
                }
            } else {
                sweetAlertMessage("메모 수정에 실패했습니다: " + (result ? result.message : "알 수 없는 오류"),"","e");
            }
        } catch (error) {
            //console.error("메모 수정 API 호출 중 오류:", error);
            sweetAlertMessage(error.message,"","e");
        }
    });
    
    // ⭐ 현재 메모 삭제 버튼 클릭 이벤트 ⭐
    $("#memo-delete-btn").off('click').on('click',  async function() { // off('click')으로 기존 이벤트 핸들러 제거
        const memoIdx = $modalContainer.find("#memo_modify_idx_hidden_input").val(); // 메모 IDX

        //const memo_no = $(this).data('memo-no');
        const confirm = await sweetConfirm("정말로 이 메모를 삭제하시겠습니까? 관련된 모든 댓글도 삭제됩니다.","","w" );
        if (!confirm) {
            return;
        }

        // 5. user 정보 가져오기 (userInfo() 함수 호출)
        const currentUserInfo = userInfo();
        const dataObj = {
            ...(currentUserInfo ? currentUserInfo : {}), // user 정보가 없으면 빈 객체 병합
            memo_idx: memoIdx, // 수정할 메모의 ID (매우 중요!)
        };
        const url = "/front/back/memo/memo2_delete.php"; // ⭐ 메모 수정 API ⭐
        try {
            const result = await callApi("POST", url, dataObj);
            if (result && result.statusCode === 200 && result.message === "SUCCESS") {
                sweetAlertMessage("메모가 삭제되었습니다.","","s");
                const $modal = $("#memoModifyModal");
                const memoModifyModalInstance = bootstrap.Modal.getInstance($modal[0]);
                if (memoModifyModalInstance) memoModifyModalInstance.hide();
                displayMemoOnMap(); 
            } else {
                sweetAlertMessage("메모 삭제 실패: " + (result ? result.message : "알 수 없는 오류"),"","e");
            }
        } catch (e) {
            console.error("메모 삭제 오류:", e);
            sweetAlertMessage("메모 삭제 중 오류가 발생했습니다.","","e");
        }
    });
    // 3. "닫기" 버튼 이벤트 (x 버튼) - 이벤트 위임
    $("#memoModifyModal").on("click", "#NotificationModalbtn-close", function() {
        const $modalContainer = $(this).closest(".modal");
        const memoModalInstance = bootstrap.Modal.getInstance($modalContainer[0]);
        if (memoModalInstance) {
            memoModalInstance.hide();
        }
    });
    
    // 4. input field oninput function binding (이벤트 위임)
    $("#memoModifyModal").on("input", "#memo_phone", function() {
        allowOnlyNumbers(this, 11);
    });
    $("#memoModifyModal").on("input", "#memo_estateNo", function() {
        allowOnlyNumbers(this, 7);
    });
}


/**
 * 단일 메모의 댓글 섹션 HTML 생성 함수 (수정 모달용)
 * @param {object} data - 단일 메모 데이터 (memo_no, comments, reg_date 등 댓글 관련 정보)
 * @returns {string} 댓글 섹션 HTML
 */
function createMemoCommentsSectionHtml(data) {
    const { memo_no, reg_date,lst_date, comments } = data; // 필요한 데이터만 추출

    //if( lst_date === null || lst_date === undefined || lst_date === "" ) {

    // 전화번호 형식 변경 (없다면 이 함수를 정의해주세요)
    const phoneOnDash = (phoneNumber) => {
        if (!phoneNumber) return '';
        // 000-0000-0000 형식으로 변환 (예시)
        return phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    };

    let commentHtml = "";
    if (comments && comments.length > 0) {
        const reversedComments = [...comments].reverse(); 
        
        commentHtml = reversedComments // ⭐⭐ reversedComments 사용 ⭐⭐
            .map(function (commentData) {
                const { comment_no, comment, comment_date } = commentData;
                return `
                    <div class="d-flex justify-content-between align-items-center w-100 mb-1" style="
                        border: 1px solid #e0e0e0;
                        padding: 2px;
                        border-radius: 5px;
                    ">
                        <p class="memo-comment mb-0" style="flex-grow: 1;">${comment}</p>
                        <div class="d-flex align-items-center gap-1 flex-shrink-0">
                            <p class="text-muted mb-0" style="font-size:10px;">${comment_date}</p>
                            <button class="comment-delete-btn btn btn-sm btn-line-gray-s shadow-none" data-comment-no="${comment_no}">X</button>
                        </div>
                    </div>
                `;
            })

            .join("");
    } else {
        commentHtml = "<p class='text-muted text-center p-2' style='font-size:0.8em;'>등록된 댓글이 없습니다.</p>";
    }

    return `
        <div class="d-flex flex-column gap-1 mt-3"> <!-- 댓글 섹션 전체를 감싸는 컨테이너 -->
            <div class="comment-box w-100" style="
                max-height: 100px; /* ⭐ 댓글 상자의 최대 높이 (요청하신 102px) ⭐ */
                overflow-y: auto;   /* ⭐ 세로 스크롤 허용 ⭐ */
                /*border: 1px solid #ccc;  구분 위한 테두리 추가 (선택 사항) */
                padding: 2px; /* 내부 패딩 */
                border-radius: 5px;
            ">
                ${commentHtml}
            </div>

            <div class="d-flex gap-1 mb-2"> <!-- 댓글 입력 및 등록 버튼 -->
                <input type="text" class="comment-input form-control form-control-sm w-100" minlength="1" maxlength="49" placeholder="댓글을 입력해주세요."/>
                <button class="comment-add-btn btn rounded-pill btn-sm text-nowrap border-red2 color-red2 bg-white shadow-none" data-memo-no="${memo_no}">댓글등록</button>
            </div>

            <!-- ⭐⭐ 이 부분 수정: 날짜 정보 컨테이너를 Flexbox로 양 끝 정렬 ⭐⭐ -->
                <div class="d-flex justify-content-between align-items-center gap-1" style="flex-grow:1;">
                    <!-- 최종 수정일 (수정)을 먼저 배치하여 왼쪽 끝에 오도록 합니다. -->
                    <p class="text-muted mb-0 text-nowrap" style="font-size:11px;">메모 등록일: <span>${reg_date}</span></p>
                    <p class="text-muted mb-0 text-nowrap" style="font-size:11px;">최종 수정일: <span>${lst_date ? lst_date : '-'}</span></p>
                </div>
        </div>
    `;
}

/**
 * 수정 모달 내의 동적으로 생성된 댓글 및 메모 삭제 버튼에 이벤트 리스너를 바인딩합니다.
 * @param {number} currentMemoNo - 현재 수정 중인 메모의 memo_no
 */
function bindMemoCommentSectionEvents(currentMemoNo) {
    // 댓글 등록 버튼
    $("#memo_box").off('click', '.comment-add-btn').on('click', '.comment-add-btn', async function() {
        const memo_no = $(this).data('memo-no');
        const $commentInput = $(this).closest('.d-flex').find('.comment-input');
        const comment = $commentInput.val().trim(); // 입력받은 댓글 내용

        if (!comment) {
            alert("댓글 내용을 입력해주세요.");
            return;
        }
        if (comment.length > 49) {
            alert("댓글은 50자 미만으로 작성해주세요.");
            return;
        }

        try {
            const user = userInfo(); // ⭐ user 정보를 가져오는 함수 호출 ⭐
            if (!user) { // 유저 정보 없으면 alert
                $("#modalAlert").iziModal("open");
                $("#alert_message").html("<h2><span>회원 전용</span> 기능입니다.</h2>");
                return;
            }

            // ⭐ API 호출 데이터에 user 정보 추가 ⭐
            const dataObj = {
                ...user, // user_no, user_token 등 (userInfo()가 반환하는 객체)
                memo_no: memo_no,
                comment: encodeURIComponent(comment), // 댓글 내용 encodeURIComponent
            };

            const result = await callApi("POST", "/front/back/memo/memo2_comment_register.php", dataObj); // dataObj 전달

            if (result && result.statusCode === 200 && result.message === "SUCCESS") {
                sweetAlertMessage("댓글이 등록되었습니다.","","s");
                $commentInput.val(''); // 입력 필드 초기화

                // ⭐⭐ 이전 commentRegist 함수의 즉시 댓글 추가 로직 통합 ⭐⭐
                const responseData = result.responseData; // 서버에서 comment_no, timestamp 등 반환한다고 가정
                const newCommentHtml = `
                    <div class="d-flex justify-content-between align-items-center w-100 mb-1" style="
                        border: 1px solid #e0e0e0; /* ⭐ 보더 추가 ⭐ */
                        padding: 2px; /* 내부 여백 추가 */
                        border-radius: 5px; /* 모서리 둥글게 */
                    ">
                        <p class="memo-comment mb-0" style="flex-grow: 1;">${comment}</p>
                        <div class="d-flex align-items-center gap-1 flex-shrink-0">
                            <p class="text-muted mb-0" style="font-size:10px;">${responseData.comment_date || new Date().toISOString().slice(0, 10)}</p>
                            <button class="comment-delete-btn btn btn-sm btn-line-gray-s shadow-none" data-comment-no="${responseData.comment_no}">X</button>
                        </div>
                    </div>
                `;
                
                // 댓글 목록이 비어있었다면 "등록된 댓글이 없습니다." 문구를 제거하고 추가
                const $commentBox = $(this).closest('.d-flex').prev('.comment-box'); // .comment-input의 상위 d-flex의 이전 형제 comment-box
                const $noCommentText = $commentBox.find("p.text-muted.text-center");
                if ($noCommentText.length > 0 && $noCommentText.text().includes("등록된 댓글이 없습니다.")) {
                    $noCommentText.remove(); // 문구 제거
                }

                $commentBox.append(newCommentHtml); // 댓글 리스트 맨 아래에 추가 (prepend도 가능)
                // ⭐⭐⭐ 핵심: 스크롤을 가장 아래로 이동 ⭐⭐⭐
                // 스크롤 이동은 DOM 업데이트가 완료된 후 실행되어야 합니다.
                // append는 동기적이므로 바로 실행 가능하지만, 혹시 모를 리플로우를 위해 setTimeout(0)도 가능
                $commentBox.scrollTop($commentBox[0].scrollHeight); 
                
                // 모달 닫기 및 지도 새로고침 로직은 필요에 따라 제거하거나 유지
                // const $modal = $("#memoModifyModal");
                // const memoModifyModalInstance = bootstrap.Modal.getInstance($modal[0]);
                // if (memoModifyModalInstance) memoModifyModalInstance.hide();
                displayMemoOnMap(); // 지도상의 메모를 새로고침 (필요시)

            } else {
                sweetAlertMessage("댓글 등록 실패: " + (result ? result.message : "알 수 없는 오류"),"","e");
            }
        } catch (e) {
            console.error("댓글 등록 오류:", e);
            sweetAlertMessage("댓글 등록 중 오류가 발생했습니다.","","e");
        }
    });

    // 댓글 삭제 버튼
    $("#memo_box").off('click', '.comment-delete-btn').on('click', '.comment-delete-btn', async function() {
        const comment_no = $(this).data('comment-no');
        const user = userInfo(); // user_no_hash, user_token 등을 포함한다고 가정
        const $commentItemToRemove = $(this).closest('.d-flex.justify-content-between.align-items-center.w-100.mb-1');
        const $commentBox = $(this).closest('.comment-box'); // 댓글들을 감싸는 컨테이너
        //const $memoAddBtn = $commentBox.nextAll('.d-flex.gap-1').find('.comment-add-btn'); // 댓글 입력창과 등록 버튼을 감싸는 div에서 찾음
        //const memo_no_for_refresh = $memoAddBtn.data('memo-no'); // 해당 메모의 memo_no

        // 삭제할 댓글 항목의 DOM 요소를 미리 저장 (이제 사용하지 않지만, 참고용)
        // const $commentItemToRemove = $(this).closest('.d-flex.justify-content-between.align-items-center.w-100.mb-2');

        if (!user) {
            sweetAlertMessage("댓글 삭제 권한이 없습니다. 다시 로그인 해주세요.","","e");
            return;
        }
        const confirm = await sweetConfirm("정말로 이 댓글을 삭제하시겠습니까?","","w" );
        if (!confirm) {
            return;
        }
        
        // ⭐ 실제 댓글 삭제 API 호출 로직 (현재는 파일명 변경 없음, 필요시 추가) ⭐

        const dataObj = {
            ...user, // user_no, user_token 등 (userInfo()가 반환하는 객체)
            comment_no: comment_no,
        };


        try {
            const result = await callApi("POST", "/front/back/memo/memo2_comment_delete.php", dataObj);
            if (result && result.statusCode === 200 && result.message === "SUCCESS") {
                sweetAlertMessage("댓글이 삭제되었습니다.","","s");
                // ⭐⭐ 핵심: 삭제된 댓글 항목을 DOM에서 즉시 제거 ⭐⭐
                $commentItemToRemove.remove();

                // ⭐ 모든 댓글이 삭제되면 "등록된 댓글이 없습니다." 문구 다시 표시 ⭐
                if ($commentBox.children('.d-flex.justify-content-between').length === 0) { // ⭐⭐ 조건 수정 ⭐⭐
                    // .d-flex.justify-content-between 클래스를 가진 자식 요소가 없다면
                    $commentBox.html("<p class='text-muted text-center p-2' style='font-size:0.8em;'>등록된 댓글이 없습니다.</p>");
                }

                //const $modal = $("#memoModifyModal");
                //const memoModifyModalInstance = bootstrap.Modal.getInstance($modal[0]);
                //if (memoModifyModalInstance) memoModifyModalInstance.hide();
                
                displayMemoOnMap();

                

            } else {
                sweetAlertMessage("댓글 삭제 실패: " + (result ? result.message : "알 수 없는 오류","","e"));
            }
        } catch (e) {
            console.error("댓글 삭제 오류:", e);
            sweetAlertMessage("댓글 삭제 중 오류가 발생했습니다.","","e");
        }
    });

    
}
/**
 * 주소 검색
 * @param {*} coords
 */
async function searchDetailAddrFromCoordsMy(coords) {
    return new Promise((resolve, reject) => {
        geocoder.coord2Address(coords.lng, coords.lat, function (result, status) {
            if (status === kakao.maps.services.Status.OK) {
                resolve({ result, status }); // 검색 결과를 Promise의 resolve로 반환
            } else {
                resolve({ result, status });
            }
        });
    });
}
