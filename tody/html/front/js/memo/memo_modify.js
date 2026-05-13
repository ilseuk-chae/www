// ⭐ 전역 변수 'fileList', 'fileIndex', 'swiperInstance' 등은 삭제합니다.
async function initMemoModifyModalLogic(memoCurrentData, $modalContainer) {
    
    // memoCurrentData가 없으면 이 블록이 실행됩니다. (방어 로직)
    if (!memoCurrentData) { 
        const memoModifyModalInstance = bootstrap.Modal.getInstance($modalContainer[0]);
        if (memoModifyModalInstance) memoModifyModalInstance.hide();
        return; 
    }

    // ⭐⭐ 필요한 DOM 요소들을 $modalContainer 내에서 찾습니다. ⭐⭐
    const $modalDialog = $modalContainer.find(".modal-dialog");
    const $memoDisplayNo = $modalContainer.find(".memo-display-no");
    const $memoLocationInfo = $modalContainer.find("#memo_location_info"); 
    const $memoName = $modalContainer.find("#memo_name");
    const $memoPhone = $modalContainer.find("#memo_phone");
    const $memoEstateNo = $modalContainer.find("#memo_estateNo");
    const $memoContent = $modalContainer.find("#memo_content");
    const $memoComplet = $modalContainer.find("#memo_complet");
    const $memoContentCharCount = $modalContainer.find("#memoContentCharCount");
    const $memoModifyIdxHiddenInput = $modalContainer.find("#memo_modify_idx_hidden_input");
    const $memoBox = $modalContainer.find("#memo_box"); // 댓글 섹션
    
    // --- 0. 모달 스타일 및 Draggable 설정 ---
    $modalDialog.css({
        'margin': '0 !important',
        'width': '500px !important',
        'max-width': '90vw !important',
        'min-height': '400px !important',
        'max-height': '650px !important',
        'display': 'flex !important',
        'flex-direction': 'column !important',
        'overflow': 'hidden !important'
    });

    $modalDialog.draggable({
        handle: ".modal-header",
        start: function(event, ui) { },
        drag: function(event, ui) {
            const viewportWidth = $(window).width();
            const viewportHeight = $(window).height();
            const dialogWidth = $(this).outerWidth();
            const dialogHeight = $(this).outerHeight();
            let newLeft = ui.position.left;
            let newTop = ui.position.top;
            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0;
            if (newLeft + dialogWidth > viewportWidth) newLeft = viewportWidth - dialogWidth;
            if (newTop + dialogHeight > viewportHeight) newTop = viewportHeight - dialogHeight;
            ui.position.left = newLeft;
            ui.position.top = newTop;
        },
        containment: "window",
    });

    $modalContainer.off('shown.bs.modal.position').on('shown.bs.modal.position', function() {
        const initialClickX = memoCurrentData ? memoCurrentData.clientX : null;
        const initialClickY = memoCurrentData ? memoCurrentData.clientY : null;
        const isRegisterMode = $modalContainer.data("modalMode") === "register"; // 수정 모드는 'modify'
        const popupOffset = isRegisterMode ? 20 : (20 + 30);
        const dialogWidth = $modalDialog.outerWidth();
        const dialogHeight = $modalDialog.outerHeight();
        
        if (initialClickX !== null && initialClickY !== null) {
            let targetX = initialClickX - (dialogWidth / 2);
            //let targetY = isRegisterMode ? (initialClickY + popupOffset) : (initialClickY - dialogHeight - popupOffset);
            let targetY = (initialClickY - dialogHeight - popupOffset);
            const viewportWidth = $(window).width();
            const viewportHeight = $(window).height();
            if (targetX < 0) targetX = 0;
            if (targetY < 0) targetY = 0; 
            if (targetX + dialogWidth > viewportWidth) targetX = viewportWidth - dialogWidth;
            if (targetY + dialogHeight > viewportHeight) targetY = viewportHeight - dialogHeight;
            $modalDialog.css({
                'position': 'fixed',
                'top': targetY + 'px',
                'left': targetX + 'px',
                'margin': '0',
                'transform': 'none'
            });
        } else {
            $modalDialog.css({
                'position': 'fixed',
                'top': '50%',
                'left': '50%',
                'margin': '0',
                'transform': 'translate(-50%, -50%)'
            });
        }
    });

    // --- 1. 기본 메모 정보 설정 ---
    $memoName.val(memoCurrentData.name);
    $memoPhone.val(memoCurrentData.phone);
    $memoEstateNo.val(memoCurrentData.estate_no);
    $memoContent.val(memoCurrentData.content);
    $memoComplet.prop('checked', memoCurrentData.complete === 'Y');

    // 숨겨진 필드에 메모의 고유 ID(idx)를 저장하여 수정 API 호출 시 사용
    $memoModifyIdxHiddenInput.val(memoCurrentData.memo_no);

    // 메모 번호를 span에 삽입
    if (memoCurrentData.my_idx) { // memo_no 대신 my_idx를 사용하시는 것으로 보임
        $memoDisplayNo.text(`내 메모번호: ${memoCurrentData.my_idx}`);
    } else {
        $memoDisplayNo.text(''); // memo_no가 없으면 표시 안 함
    }
    
    // --- 2. 위치 정보 표시 HTML 구성 (비동기 주소 조회 포함) ---
    let locationHtml = ''; 
    if (memoCurrentData.address_jibun) {
        locationHtml += `<p class="color-blue1 mb-1">▶ 매물 지번주소 : <span>${decodeURIComponent(memoCurrentData.address_jibun)}</span></p>`;
    } 
    if (memoCurrentData.address_road) {
        locationHtml += `<p class="color-blue1 mb-1">▶ 매물 도로주소 : <span>${decodeURIComponent(memoCurrentData.address_road)}</span></p>`;
    }
    
    if (memoCurrentData.latitude && memoCurrentData.longitude) {
        try {
            const coords = { lat: memoCurrentData.latitude, lng: memoCurrentData.longitude };
            const addressResult = await searchDetailAddrFromCoordsMy(coords);

            if (addressResult && addressResult.status === kakao.maps.services.Status.OK && addressResult.result && addressResult.result[0]) {
                const result = addressResult.result[0];
                let jibunAddr = result.address ? result.address.address_name : '';
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
        locationHtml += `<p class="text-blue1 mb-1">▶ 클릭 위치 위경도 정보 없음</p>`;
    }
    $memoLocationInfo.html(locationHtml);
    
    // --- 3. 글자 수 카운트 설정 ---
    $memoContent.off('input').on('input', function() {
        const currentLength = $(this).val().length;
        $memoContentCharCount.text(currentLength);
    });
    $memoContentCharCount.text($memoContent.val().length);

    // --- 4. 댓글 섹션 표시 ---
    const commentsHtml = createMemoCommentsSectionHtml(memoCurrentData);
    $memoBox.html(commentsHtml); // $modalContainer 내에서 찾은 #memo_box 사용

    // --- 5. 숫자만 입력 필드 이벤트 바인딩 ---
    $modalContainer.off("input", "#memo_phone").on("input", "#memo_phone", function() {
        allowOnlyNumbers(this, 11);
    });
    $modalContainer.off("input", "#memo_estateNo").on("input", "#memo_estateNo", function() {
        allowOnlyNumbers(this, 7);
    });

    // --- 6. 이미지 파일 표시 로직 (Swiper 초기화/업데이트 포함) ---
    // FileManager 인스턴스 생성 및 저장
    const currentFileManager = new FileManager();
    currentFileManager.clearFiles(); // FileManager를 깨끗하게 초기화
    $modalContainer.data('memoFileManager', currentFileManager); // FileManager를 모달 데이터에 저장
    
    const $swiperContainer = $modalContainer.find(".file-upload-swiper");
    // const $swiperWrapper = $modalContainer.find(".file-upload-swiper .swiper-wrapper"); // ⭐ 이 줄은 이제 필요 없습니다.

    let fileSwiper = $modalContainer.data('fileUploadSwiperInstance'); 
    
    if (fileSwiper && !fileSwiper.destroyed) {
        fileSwiper.destroy(true, true); // 기존 Swiper 파괴 (DOM 제거 포함)
    }
    // ⭐ 새로운 Swiper 인스턴스 생성 ⭐
    fileSwiper = new Swiper($swiperContainer[0], {
        slidesPerView: 2,           
        spaceBetween: 10,           
        loop: false,                
        centeredSlides: false,      
        observer: true,             
        observeParents: true,     
    });
    $modalContainer.data('fileUploadSwiperInstance', fileSwiper); 
    
    // ⭐⭐⭐ 기존 파일 로드 및 렌더링 로직 (핵심 수정!) ⭐⭐⭐
    const existingFiles = memoCurrentData.files || []; // memoCurrentData에서 파일 정보 배열을 가져옵니다.
    
    fileSwiper.removeAllSlides(); // 기존 모든 슬라이드 제거
    
    if (existingFiles.length > 0) {
        for (const fileInfo of existingFiles) {
            const fileId = currentFileManager.addExistingFile(fileInfo); 
            const imageUrl = fileInfo.imgSrc; 

            const slideHtml = `
                <div type="button" class="swiper-slide existing-image" data-id="${fileId}" data-origin="Y" data-file-no="${fileInfo.file_id}">
                    <img src="${imageUrl}" class="image-thumbnail" alt="" title=""/>
                    <span class="close-btn-box"><i class="fa-sharp fa-solid fa-circle-xmark"></i></span>
                </div>
            `;

            // ⭐ $swiperWrapper.append() 대신 Swiper 메서드를 사용 ⭐
            fileSwiper.appendSlide(slideHtml);
        }
        $swiperContainer.show(); // 기존 파일이 있으니 Swiper 표시
    } else {
        // 기존 파일이 없을 경우 "첨부된 파일이 없습니다." 플레이스홀더 추가
        const noFilePlaceholderHtml = `
            <div class="swiper-slide no-file-placeholder text-center text-muted" style="height: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.9em; flex-direction: column;">
                <p class="mb-1"><i class="fa-solid fa-image-slash fa-2x"></i></p>
                <p class="mb-0">첨부된 파일이 없습니다.</p>
            </div>
        `;
        fileSwiper.appendSlide(noFilePlaceholderHtml); // ⭐ Swiper 메서드를 사용 ⭐
        $swiperContainer.hide(); // 초기에는 파일이 없으니 Swiper 숨김
    }
    
    // ⭐⭐⭐ Swiper가 초기화되거나 내용이 변경된 후 반드시 업데이트 ⭐⭐⭐
    fileSwiper.update(); 
    
    // --- 7. 파일 입력 및 삭제 이벤트 바인딩 ---
    const $modifyFileInput = $modalContainer.find("#modify_file_input"); 
    
    if ($modifyFileInput.length > 0) {
        $modifyFileInput.off("change").on("change", async function (e) {
            await handleFileInputChangeForModifyModal(e, currentFileManager, fileSwiper, $modalContainer);
        });
    
    } else {
    
    }

    // ⭐⭐ 이미지 삭제 버튼 이벤트 바인딩 (이벤트 위임) ⭐⭐
    $swiperContainer.off("click", ".swiper-slide .close-btn-box").on("click", ".swiper-slide .close-btn-box", function() {
        handleImageDeleteForModifyModal(this, currentFileManager, fileSwiper, $modalContainer);
    });

    $swiperContainer.on('click', '.swiper-slide.existing-image img.image-thumbnail', function(event) {
        // 1. 현재 클릭이 발생한 `$swiperContainer` 내 모든 이미지의 URL 수집
        // '$('#memoModal ...')' 대신, 이벤트가 발생한 `$swiperContainer`를 기준으로 탐색합니다.
        const allImagesInCurrentSwiper = $swiperContainer.find('.swiper-slide.existing-image img.image-thumbnail');
        
        const imageUrls = [];
        let clickedImageIndex = -1;

        allImagesInCurrentSwiper.each(function(index) { // 수정된 allImagesInCurrentSwiper 사용
            const src = $(this).attr('src');
            imageUrls.push(src);
            if (this === event.target) { // 클릭된 이미지와 현재 이미지 엘리먼트 비교
                clickedImageIndex = index;
            }
        });

        // 2. 이미지 URL이 존재하고 클릭된 이미지 인덱스가 유효한 경우에만 갤러리 팝업 호출
        if (imageUrls.length > 0 && clickedImageIndex !== -1) {
            // 갤러리 팝업 함수 호출 (모든 이미지와 클릭된 이미지의 인덱스 전달)
            showImageFullscreenGalleryPopup(imageUrls, clickedImageIndex);
            
        } else {
            //console.warn("WARN: 이미지 URL을 찾거나 클릭된 이미지 인덱스를 식별할 수 없습니다. (현재 길이: " + imageUrls.length + ", 인덱스: " + clickedImageIndex + ")");
        }

    });

    // --- 8. 댓글 관련 버튼 이벤트 바인딩 ---
    bindMemoCommentSectionEvents(memoCurrentData.memo_no); 
     
    // 댓글 섹션 내부에서 발생하는 이벤트를 $memoBox에 위임
    $memoBox.off('click', '.comment-delete-btn').on('click', '.comment-delete-btn', async function() {
        const comment_no = $(this).data('comment-no');
        const user = userInfo(); 
        const $commentItemToRemove = $(this).closest('.d-flex.justify-content-between.align-items-center.w-100.mb-1');
        const $commentBox = $(this).closest('.comment-box'); 
        
        if (!user) {
            sweetAlertMessage("댓글 삭제 권한이 없습니다. 다시 로그인 해주세요.","","e");
            return;
        }
        const confirm = await sweetConfirm("정말로 이 댓글을 삭제하시겠습니까?","","w" );
        if (!confirm) {
            return;
        }
        
        const dataObj = {
            ...user, 
            comment_no: comment_no,
        };

        try {
            const result = await callApi("POST", "/front/back/memo/memo2_comment_delete.php", dataObj);
            if (result && result.statusCode === 200 && result.message === "SUCCESS") {
                sweetAlertMessage("댓글이 삭제되었습니다.","","s");
                $commentItemToRemove.remove();

                if ($commentBox.children('.d-flex.justify-content-between').length === 0) {
                    $commentBox.html("<p class='text-muted text-center p-2' style='font-size:0.8em;'>등록된 댓글이 없습니다.</p>");
                }
                displayMemoOnMap();
            } else {
                sweetAlertMessage("댓글 삭제 실패: " + (result ? result.message : "알 수 없는 오류"),"","e");
            }
        } catch (e) {
            sweetAlertMessage("댓글 삭제 중 오류가 발생했습니다.","","e");
        }
    });

    // --- 9. 메모 수정하기 버튼 이벤트 ---
    $modalContainer.off("click", "#memo_modify_btn").on("click", "#memo_modify_btn", async function () { // 이 버튼 ID가 수정/저장 버튼이라고 가정
        const fileManagerForSubmit = $modalContainer.data('memoFileManager');
        if (!fileManagerForSubmit) {
            sweetAlertMessage("파일 관리자 오류가 발생했습니다. 관리자에게 문의하세요.", "", "e");
            return;
        }

        // 1. 입력 필드에서 값 가져오기
        const name_val = $memoName.val();
        const phone_val = $memoPhone.val();
        const estateNo_val = $memoEstateNo.val();
        const content_val = $memoContent.val();
        const complete_val = $memoComplet.is(':checked'); 

        // 2. 유효성 검사
        let validationPassed = true;
        const name_validation_msg = validateInput(name_val, "string", "이름을 확인해주세요.", { maxLength: 50, required: true });
        if (name_validation_msg !== true) { sweetAlertMessage(name_validation_msg,"","e"); validationPassed = false; }
        if (validationPassed) {
            const phone_validation_msg = validateInput(phone_val, "phone", "연락처를 확인해주세요.", { required: true });
            if (phone_validation_msg !== true) { sweetAlertMessage(phone_validation_msg,"","e"); validationPassed = false; }
        }
        if (validationPassed && content_val.length > 0) {
            const content_validation_msg = validateInput(content_val, "string", "메모는 250자 이하로 작성해주세요.", { maxLength: 250 });
            if (content_validation_msg !== true) { sweetAlertMessage(content_validation_msg,"","e"); validationPassed = false; }
        }
        if (!validationPassed) { return; }

        // 3. FormData 구성 (memoCurrentData 사용)
        let formData = new FormData(); 

        // 1. 새로 추가된 실제 파일 (File 객체) 추가 - ⭐ getNewFilesForUpload() 메서드 사용 ⭐
        const newFilesToUpload = fileManagerForSubmit.getNewFilesForUpload(); 
        newFilesToUpload.forEach(fileObject => {
            formData.append("new_files[]", fileObject); // File 객체 직접 추가
        });
        
        // 2. 삭제할 기존 파일 번호 목록 추가 - ⭐ getDeletedFileNos() 메서드 사용 ⭐
        const deletedFileNos = fileManagerForSubmit.getDeletedFileNos(); 
        if (deletedFileNos && deletedFileNos.length > 0) {
            // ⭐⭐⭐ 키 이름도 "deleted_file_nos"로 변경 ⭐⭐⭐
            formData.append("deleted_file_nos", JSON.stringify(deletedFileNos)); 
        }
        // 3. user 정보 추가
        const currentUserInfo = userInfo();
        if (currentUserInfo) {
            for (const key in currentUserInfo) 
                { if (currentUserInfo.hasOwnProperty(key)) { 
                    formData.append(key, currentUserInfo[key]); 
                } 
            }
        }

        // 4. 나머지 데이터들 추가
        formData.append("memo_no", memoCurrentData.memo_no); // 수정할 메모의 ID
        formData.append("latitude", memoCurrentData.latitude);
        formData.append("longitude", memoCurrentData.longitude);
        formData.append("my_idx", memoCurrentData.my_idx);
        formData.append("pnu", memoCurrentData.pnu);
        formData.append("type", memoCurrentData.type);
        formData.append("complete", complete_val ? 'Y' : 'N');
        formData.append("name", name_val.trim());
        formData.append("phone", phone_val.trim());
        formData.append("estateNo", estateNo_val.trim());
        formData.append("content", content_val.trim());

        const url = "/front/back/memo/memo2_modify.php"; 
        
        try {
            const result = await callApi2("POST", url, formData);
            if (result && result.statusCode === 200 && result.message === "SUCCESS") {
                sweetAlertMessage("메모가 수정되었습니다.","","s");
                
                if (result.responseData) { // 서버에서 업데이트된 메모 데이터를 보냈다면
                    $modalContainer.data("memoData", result.responseData); // 모달에 최신 데이터 저장
                    await initMemoModifyModalLogic(result.responseData, $modalContainer); // 최신 데이터로 모달 UI 갱신
                    updateSingleMemoOnMap(result.responseData); // 지도 업데이트
                } else {
                    displayMemoOnMap();
                }
            } else {
                sweetAlertMessage("메모 수정에 실패했습니다: " + (result ? result.message : "알 수 없는 오류"),"","e");
            }
        } catch (error) { sweetAlertMessage(error.message,"","e"); }
    });
    // ⭐ 현재 메모 삭제 버튼 클릭 이벤트 ⭐
    $modalContainer.off('click', "#memo-delete-btn").on('click', "#memo-delete-btn", async function() { 
        const memoIdx = $modalContainer.find("#memo_modify_idx_hidden_input").val(); 

        const confirm = await sweetConfirm("정말로 이 메모를 삭제하시겠습니까? 관련된 모든 댓글도 삭제됩니다.","","w" );
        if (!confirm) {
            return;
        }

        const currentUserInfo = userInfo();
        const dataObj = {
            ...(currentUserInfo ? currentUserInfo : {}),
            memo_idx: memoIdx, 
        };
        const url = "/front/back/memo/memo2_delete.php";
        try {
            const result = await callApi("POST", url, dataObj);
            
            if (result && result.statusCode === 200 && result.message === "SUCCESS") {
                sweetAlertMessage("메모가 삭제되었습니다.","","s");
                const memoModifyModalInstance = bootstrap.Modal.getInstance($modalContainer[0]);
                if (memoModifyModalInstance) memoModifyModalInstance.hide();
                displayMemoOnMap(); 
            } else {
                sweetAlertMessage("메모 삭제 실패: " + (result ? result.message : "알 수 없는 오류"),"","e");
            }
        } catch (e) {
            sweetAlertMessage("메모 삭제 중 오류가 발생했습니다.","","e");
        }
    });
    
    // --- 10. '닫기' 버튼 이벤트 ---
    $modalContainer.off("click", "#NotificationModalbtn-close").on("click", "#NotificationModalbtn-close", function() {
        const memoModalInstance = bootstrap.Modal.getInstance($modalContainer[0]);
        if (memoModalInstance) { memoModalInstance.hide(); }
    });

    $modalContainer.off("input", "#memo_phone").on("input", "#memo_phone", function() {
        allowOnlyNumbers(this, 11);
    });
    $modalContainer.off("input", "#memo_estateNo").on("input", "#memo_estateNo", function() {
        allowOnlyNumbers(this, 7);
    });
    
}

// ⭐⭐⭐ handleFileInputChangeForModifyModal 함수 (⭐핵심⭐) ⭐⭐⭐
async function handleFileInputChangeForModifyModal(e, fileManagerInstance, swiperInstance, $modalContainer) {
    
    const files = e.target.files;

    if (!files || files.length === 0) {
        
        $modalContainer.find("#register_file_input").val("");
        swiperInstance.update(); // 파일 입력 비웠을 때 Swiper 업데이트
        const $swiperContainer = $modalContainer.find(".file-upload-swiper");
        if (fileManagerInstance.getAllCurrentFiles().length === 0) {
            $swiperContainer.hide();
        }
        return;
    }

    if (!fileManagerInstance || !swiperInstance || swiperInstance.destroyed) {
        
        sweetAlertMessage("파일 관리자 또는 Swiper 오류가 발생했습니다. 관리자에게 문의하세요.", "", "e");
        $modalContainer.find("#modify_file_input").val("");
        return;
    }

    const $swiperContainer = $modalContainer.find(".file-upload-swiper"); // Swiper 컨테이너 참조

    const currentDisplayedFileCount = swiperInstance.slides.filter(slide => !$(slide).hasClass('no-file-placeholder')).length;
    
    const currentFilesCount = fileManagerInstance.getAllCurrentFiles().length;
    const newFilesCount = files.length;
    if ((currentFilesCount + newFilesCount) > 4) {
        sweetAlertMessage(`이미지는 최대 4장까지 추가할 수 있습니다. (현재 ${currentFilesCount}장)`, "", "i");
        $modalContainer.find("#register_file_input").val("");
        
        return;
    }

    for (let i = 0; i < files.length; i++) {
        if (fileManagerInstance.getAllCurrentFiles().length >= 4) {
            sweetAlertMessage("이미지는 최대 4장까지 추가할 수 있습니다.", "", "i");
            break;
        }
        const file = files[i];

        if (file.type.startsWith("image/")) {
            // 새 파일이므로 FileManager의 addFile을 사용하여 추가
            const fileId = fileManagerInstance.addFile(file); 
            if (fileId === null) {
                 continue;
            }

            const filePreview = await handleFileInputChangeMultiple(file); // 전역 또는 공통 유틸리티 함수

            const slideHtml = `
                <div type="button" class="swiper-slide new-image" data-id="${fileId}" data-origin="N">
                    <img src="${filePreview}" class="image-thumbnail" alt="" title="" />
                    <span class="close-btn-box"><i class="fa-sharp fa-solid fa-circle-xmark"></i></span>
                </div>
            `;
            
            //"첨부된 파일이 없습니다." 플레이스홀더가 있다면 제거
            const $noFilePlaceholder = $modalContainer.find('.no-file-placeholder');
            
            if ($noFilePlaceholder.length > 0) {
                $noFilePlaceholder.remove(); // jQuery를 사용하여 DOM에서 직접 제거합니다.
                swiperInstance.update(); // 중요: DOM 변경 후 반드시 호출
           }
            swiperInstance.appendSlide(slideHtml); 
            
        } else {
            
        }
    }
    
    $modalContainer.find("#modify_file_input").val(""); // 파일 선택 인풋 초기화
    swiperInstance.update(); // Swiper 업데이트
    
    // ⭐⭐ 모든 파일 처리 후, FileManager에 파일이 남아있다면 Swiper를 표시 ⭐⭐
    if (fileManagerInstance.getAllCurrentFiles().length > 0) {
        $swiperContainer.show();
    } else {
        $swiperContainer.hide();
    }
}

// ⭐⭐⭐ handleImageDeleteForModifyModal 함수 ⭐⭐⭐

async function handleImageDeleteForModifyModal(element, fileManagerInstance, swiperInstance, $modalContainer) {
    
    const $slide = $(element).closest(".swiper-slide");
    const internalFileId = $slide.data("id");
    
    if (fileManagerInstance.removeFile(internalFileId)) {
        swiperInstance.removeSlide($slide.index()); // Swiper에서 슬라이드 제거
        swiperInstance.update(); // Swiper 업데이트

        // ⭐⭐⭐핵심 디버깅 포인트⭐⭐⭐
        const updatedAllCurrentFiles = fileManagerInstance.getAllCurrentFiles();
        const updatedNewFilesForUpload = fileManagerInstance.getNewFilesForUpload();

        const remainingNewFilesCount = updatedNewFilesForUpload.length;
        const totalExistingFilesLoaded = updatedAllCurrentFiles.filter(f => f.isExisting).length; // 현재 UI에 표시될 예정인 기존 파일 수

        // 모든 파일이 삭제된 경우 placeholder 다시 표시 (조건이 정확해야 합니다!)
        if (remainingNewFilesCount === 0 && totalExistingFilesLoaded === 0 && $modalContainer.find('.no-file-placeholder').length === 0) {
            $modalContainer.find(".file-upload-swiper .swiper-wrapper")
                           .append("<div class='swiper-slide no-file-placeholder' style='display: flex; justify-content: center; align-items: center; height: 100%;'><p class='text-muted'>첨부된 파일이 없습니다.</p></div>");
            swiperInstance.update();
            
        } else {
            
        }
        
        // 모든 파일이 제거되었는지 확인하고 Swiper 컨테이너 숨김
        const $swiperContainer = $modalContainer.find(".file-upload-swiper");
        if (updatedAllCurrentFiles.length === 0) { // ⭐ 여기서 0이라고 잘못 판단되면 문제 발생 ⭐
            $swiperContainer.hide();
            
        } else {
            $swiperContainer.show(); // 파일이 남아있다면 다시 보여줘야 함
            
        }
    } else {
        sweetAlertMessage("파일 삭제 중 오류가 발생했습니다.", "", "e");
    }
    
}
/**
 * 단일 메모의 댓글 섹션 HTML 생성 함수 (수정 모달용)
 * @param {object} data - 단일 메모 데이터 (memo_no, comments, reg_date 등 댓글 관련 정보)
 * @returns {string} 댓글 섹션 HTML
 */
function createMemoCommentsSectionHtml(data) {
    const { memo_no, reg_date,lst_date, comments } = data; // 필요한 데이터만 추출

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
 * 이미지 전체화면 갤러리 팝업을 띄우는 함수
 * @param {string[]} imageUrls - 팝업으로 보여줄 모든 이미지 URL 배열
 * @param {number} startIndex - 초기화면으로 보여줄 이미지의 인덱스
 */
function showImageFullscreenGalleryPopup(imageUrls, startIndex) {
    let currentImageIndex = startIndex;
    const totalImages = imageUrls.length;

    // 이미 팝업이 있다면 제거 (이중 팝업 방지)
    $('#imageFullscreenPopup').remove();

    const popupHtml = `
        <div id="imageFullscreenPopup" class="image-fullscreen-popup">
            <div class="popup-content">
                <button class="gallery-nav-btn prev-btn ${totalImages <= 1 ? 'hidden' : ''}">&lt;</button>
                <img src="${imageUrls[currentImageIndex]}" alt="원본 이미지" class="popup-image">
                <button class="gallery-nav-btn next-btn ${totalImages <= 1 ? 'hidden' : ''}">&gt;</button>
                <span class="close-popup-btn">&times;</span>
                <div class="image-count">${currentImageIndex + 1} / ${totalImages}</div>
            </div>
        </div>
    `;
    
    $('body').append(popupHtml); // body 태그 안에 팝업 추가

    // 이미지 내비게이션 상태 업데이트 함수
    const updateGalleryImage = () => {
        const $popupImage = $('#imageFullscreenPopup .popup-image');
        const $prevBtn = $('#imageFullscreenPopup .prev-btn');
        const $nextBtn = $('#imageFullscreenPopup .next-btn');
        const $imageCount = $('#imageFullscreenPopup .image-count');

        $popupImage.attr('src', imageUrls[currentImageIndex]);
        $imageCount.text(`${currentImageIndex + 1} / ${totalImages}`);

        if (totalImages > 1) { // 이미지가 1개 초과일 때만 내비게이션 버튼 활성화/비활성화
            $prevBtn.toggleClass('hidden', currentImageIndex === 0);
            $nextBtn.toggleClass('hidden', currentImageIndex === totalImages - 1);
        } else { // 이미지가 1개 이하일 경우 모든 버튼 숨김
            $prevBtn.addClass('hidden');
            $nextBtn.addClass('hidden');
        }
    };

    // 초기 상태 업데이트 (팝업 로드 시)
    updateGalleryImage();

    // 팝업 닫기 이벤트 리스너
    $('#imageFullscreenPopup').on('click', function(event) {
        if ($(event.target).is('#imageFullscreenPopup') || $(event.target).hasClass('close-popup-btn')) {
            $(this).remove(); // 팝업 DOM 제거
        }
    });

    // 이전/다음 버튼 클릭 이벤트 리스너
    $('#imageFullscreenPopup').on('click', '.gallery-nav-btn', function() {
        if ($(this).hasClass('prev-btn')) {
            if (currentImageIndex > 0) {
                currentImageIndex--;
                updateGalleryImage();
            }
        } else if ($(this).hasClass('next-btn')) {
            if (currentImageIndex < totalImages - 1) {
                currentImageIndex++;
                updateGalleryImage();
            }
        }
    });

    // 키보드 방향키 이벤트 리스너 (선택 사항)
    $(document).on('keydown.imageGallery', function(event) {
        if ($('#imageFullscreenPopup').length) { // 팝업이 열려 있을 때만 동작
            if (event.key === "ArrowLeft") {
                $('#imageFullscreenPopup .prev-btn').trigger('click');
            } else if (event.key === "ArrowRight") {
                $('#imageFullscreenPopup .next-btn').trigger('click');
            } else if (event.key === "Escape") { // Esc 키로 닫기
                 $('#imageFullscreenPopup').remove();
            }
        }
    });
    // 팝업이 닫힐 때 키보드 이벤트 해제
    $('#imageFullscreenPopup').on('remove', function() {
        $(document).off('keydown.imageGallery');
    });
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
                // 스크롤 이동은 DOM 업데이트가 완료된 후 실행되어야 합니다.
                $commentBox.scrollTop($commentBox[0].scrollHeight); 
                
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
