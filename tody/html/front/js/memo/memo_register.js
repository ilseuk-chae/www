async function initMemoRegisterModalLogic() {
     
    const $modalContainer = $("#memoRegisterModal"); // 등록 모달
    
    const memoCurrentData = $modalContainer.data("memoData");
    const $modalDialog = $modalContainer.find(".modal-dialog");
    const $memoLocationInfo = $modalContainer.find("#memo_location_info"); // ⭐ 위치 정보 요소 ⭐

    // Draggable 설정 (여전히 중요!)
    $modalDialog.draggable({
        handle: ".modal-header", // ⭐ 모달 헤더로만 드래그 ⭐
        // ⭐⭐⭐ 핵심: start 및 drag 콜백 단순화 ⭐⭐⭐
        // 필요시 뷰포트 경계 내에 유지하는 역할만 합니다.
        start: function(event, ui) {
            // 드래그 시작 시, 이미 position:fixed이고 top/left로 제어되고 있으므로
            
        },
        drag: function(event, ui) {
            
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
    
    // ⭐⭐⭐ 위치 정보 표시 HTML 구성 ⭐⭐⭐
    let locationHtml = ''; // HTML 내용을 담을 변수
    // ⭐⭐⭐ 위치 정보 표시 HTML 구성 ⭐⭐⭐

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
                
                locationHtml += `<p class="color-green1 mb-1">▶ 메모를 등록할 주소 : <span>${jibunAddr || '-'}</span></p>`;
                
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

    // 2. "메모 등록하기" 버튼 클릭 이벤트 (이벤트 위임)
    $("#memoRegisterModal").off("click", "#memo_add_btn").on("click", "#memo_add_btn", async function () {
        const $modalContainer = $(this).closest(".modal"); // 클릭된 버튼의 가장 가까운 부모 모달 컨테이너를 찾음
        //const $memoLocationInfo = $modalContainer.find("#memo_location_info"); // ⭐ 위치 정보 요소 ⭐

        // 1. 입력 필드에서 값 가져오기 (val() 중복 호출 문제 해결)
        const name_val = $modalContainer.find("#memo_name").val();
        const phone_val = $modalContainer.find("#memo_phone").val();
        const estateNo_val = $modalContainer.find("#memo_estateNo").val();
        const content_val = $modalContainer.find("#memo_content").val();
        const complete_val = $modalContainer.find("#memo_complet").is(':checked'); // 체크박스 값 가져오기

        // 2. 유효성 검사 (validateInput 함수의 반환값 처리 방식에 따라 조정)
        // validateInput 함수가 true/false 또는 에러 메시지(string)를 반환한다고 가정합니다.
        // 옵션을 직접 넘겨주는 방식으로 변경했습니다.
        let validationPassed = true; // 유효성 검사 통과 여부

        const name_validation_msg = validateInput(name_val, "string", "이름을 확인해주세요.", { maxLength: 50, required: true });
        if (name_validation_msg !== true) { // true가 아니면 에러 메시지이거나 false
            sweetAlertMessage(name_validation_msg,"","e");
            validationPassed = false;
        }

        if (validationPassed) {
            const phone_validation_msg = validateInput(phone_val, "phone", "연락처를 확인해주세요.", { required: true });
            if (phone_validation_msg !== true) {
                sweetAlertMessage(phone_validation_msg,"","e");
                validationPassed = false;
            }
        }
        // 내용이 있을 때만 검증 (maxlength 250이 이미 HTML에 있으나, 한 번 더 검증)
        if (validationPassed && content_val.length > 0) {
            const content_validation_msg = validateInput(content_val, "string", "메모는 250자 이하로 작성해주세요.", { maxLength: 250 });
            if (content_validation_msg !== true) {
                sweetAlertMessage(content_validation_msg,"","e");
                validationPassed = false;
            }
        }
        
        if (!validationPassed) {
            return; // 유효성 검사 실패 시 함수 종료
        }


        // 3. 모달에 저장된 context data 가져오기
        const memoContextData = $modalContainer.data("memoData");
        const latLng = memoContextData ? memoContextData.latLng : null;
        const pnu = memoContextData ? memoContextData.pnu : null;
        const type = memoContextData ? memoContextData.type : null;

        // 4. 위도와 경도 값 분리
        let latitude = null;
        let longitude = null;

        if (latLng) {
            if (typeof latLng.getLat === 'function' && typeof latLng.getLng === 'function') {
                latitude = latLng.getLat();
                longitude = latLng.getLng();
            } else {
                // 백업으로 latLng.La, latLng.Ma 속성이 있을 경우 사용
                // (디버깅 결과에서 보였으므로 이 방법도 시도해볼 수 있습니다.)
                if (typeof latLng.La !== 'undefined' && typeof latLng.Ma !== 'undefined') {
                     latitude = latLng.La;
                     longitude = latLng.Ma;
                } else {
                     console.warn("latLng 객체에서 위도/경도 값을 가져올 수 없습니다. 확인 필요:", latLng);
                }
            }
        }
        
        // 5. user 정보 가져오기 (userInfo() 함수 호출)
        const currentUserInfo = userInfo();

        // 6. 전송할 데이터 객체 구성
        const dataObj = {
            ...(currentUserInfo ? currentUserInfo : {}), // user 정보가 없으면 빈 객체 병합
            latitude: latitude,
            longitude: longitude,
            pnu: pnu,
            type: type,
            complete: complete_val ? 'Y' : 'N', // 'Y' 또는 'N'으로 서버에 전달 (PHP에서 'Y'/'N' 또는 1/0으로 처리해야 합니다.)
            name: encodeURIComponent(name_val.trim()),
            phone: encodeURIComponent(phone_val.trim()),
            estateNo: encodeURIComponent(estateNo_val.trim()),
            content: encodeURIComponent(content_val.trim()),
        };

        const url = "/front/back/memo/memo2_register.php";
    
        try {
            const result = await callApi("POST", url, dataObj);
            if (!result) sweetAlertMessage("메모 등록에 실패했습니다. 다시 시도해주세요.","","e");
    
            const { message, responseData, statusCode } = result;
            if (statusCode === 200 && message === "SUCCESS") {
                sweetAlertMessage("메모가 등록되었습니다.","","s");
                // 모달 닫기
                const memoModalInstance = bootstrap.Modal.getInstance($modalContainer[0]);
                if (memoModalInstance) {
                    memoModalInstance.hide();
                }

                if($("#mapOptionMemoOpen2").hasClass("active")) {
                }
                else {
                    $("#mapOptionMemoOpen2").addClass("active");
                }

                //memoList(1);
                //memoReset();
                displayMemoOnMap();
            } else {
                sweetAlertMessage(message,"","e");
            }
        } catch (error) {
            //console.error("API 호출 중 오류 발생:", error);
            sweetAlertMessage(error.message,"","e");
        }
    });

    // 3. "닫기" 버튼 이벤트 (x 버튼) - 이벤트 위임
    $("#memoRegisterModal").on("click", "#NotificationModalbtn-close", function() {
        const $modalContainer = $(this).closest(".modal");
        const memoModalInstance = bootstrap.Modal.getInstance($modalContainer[0]);
        if (memoModalInstance) {
            memoModalInstance.hide();
        }
    });
    
    // 4. input field oninput function binding (이벤트 위임)
    $("#memoRegisterModal").on("input", "#memo_phone", function() {
        allowOnlyNumbers(this, 11);
    });
    $("#memoRegisterModal").on("input", "#memo_estateNo", function() {
        allowOnlyNumbers(this, 7);
    });
};

function validateInput(value, type, errorMessage, options = {}) {
    if (options.required && (value === null || value.trim() === '')) {
        return errorMessage; // 필수 값이 비어있을 때 에러 메시지 반환
    }

    if (type === "string") {
        if (options.maxLength && value.length > options.maxLength) {
            return errorMessage;
        }
    } else if (type === "phone") {
        // 전화번호 유효성 검사 로직 (예: 숫자만, 길이 등)
        if (!/^\d{2,3}-?\d{3,4}-?\d{4}$/.test(value) && !/^\d+$/.test(value)) { // 01012345678, 010-1234-5678 허용
             return errorMessage;
        }
        if (options.maxLength && value.length > options.maxLength) {
            return errorMessage;
        }
    } else if (type === "int") {
        // 정수 유효성 검사 로직 (예: isNaN, Number.isInteger 등)
        if (isNaN(value) || !Number.isInteger(Number(value))) {
            return errorMessage;
        }
    }
    // 모든 검증 통과 시
    return true;
}

