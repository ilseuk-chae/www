// ⭐⭐⭐ initMemoRegisterModalLogic 함수 ⭐⭐⭐
async function initMemoRegisterModalLogic($modalContainer) {
    
    const memoContextData = $modalContainer.data("memoData");
    const $modalDialog = $modalContainer.find(".modal-dialog");
    const $memoLocationInfo = $modalContainer.find("#memo_location_info");
    const $memoName = $modalContainer.find("#memo_name"); // 새로 추가된 입력 필드 참조
    const $memoPhone = $modalContainer.find("#memo_phone");
    const $memoEstateNo = $modalContainer.find("#memo_estateNo");
    const $memoContent = $modalContainer.find("#memo_content");
    const $memoContentCharCount = $modalContainer.find("#memoContentCharCount");
    const $memoComplet = $modalContainer.find("#memo_complet");
    const $memoBox = $modalContainer.find("#memo_box");
    const $memoRegisterLat = $modalContainer.find("#memo_register_lat");
    const $memoRegisterLng = $modalContainer.find("#memo_register_lng");
    const $memoRegisterPnu = $modalContainer.find("#memo_register_pnu");
    const $memoRegisterType = $modalContainer.find("#memo_register_type");
    const $memoDeleteBtn = $modalContainer.find("#memo-delete-btn"); // 삭제 버튼도 가져와 숨깁니다.

    // Draggable 설정 (이전과 동일)
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
        const initialClickX = memoContextData ? memoContextData.clientX : null;
        const initialClickY = memoContextData ? memoContextData.clientY : null;
        const isRegisterMode = $modalContainer.data("modalMode") === "register";
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

    // ⭐⭐ 위치 정보 표시 HTML 구성 ⭐⭐ (이전과 동일)
    let locationHtml = '';
    if (memoContextData && memoContextData.latitude && memoContextData.longitude) {
        try {
            const coords = { lat: memoContextData.latitude, lng: memoContextData.longitude };
            const addressResult = await searchDetailAddrFromCoordsMy(coords);
            if (addressResult && addressResult.status === kakao.maps.services.Status.OK && addressResult.result && addressResult.result[0]) {
                const result = addressResult.result[0];
                let jibunAddr = result.address ? result.address.address_name : '';
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
        locationHtml += `<p class="text-blue1 mb-1">▶ 클릭 위치 위경도 정보 없음</p>`;
    }
    $memoLocationInfo.html(locationHtml);


    // ⭐⭐FileManager 인스턴스 생성⭐
    const currentFileManager = new FileManager(); // 항상 새로운 인스턴스 생성!
    $modalContainer.data('memoFileManager', currentFileManager); // 이 새 인스턴스를 모달의 데이터에 저장

    // ⭐⭐⭐ 입력 필드 초기화 ⭐⭐⭐
    $memoName.val('');
    $memoPhone.val('');
    $memoEstateNo.val('');
    $memoContent.val('');
    $memoComplet.prop('checked', false); // 체크박스 초기화
    $memoContentCharCount.text('0/250');
    
    // memoContextData에서 받은 LatLng, PNU, Type 설정
    $memoRegisterLat.val(memoContextData ? memoContextData.latitude : '');
    $memoRegisterLng.val(memoContextData ? memoContextData.longitude : '');
    $memoRegisterPnu.val(memoContextData ? memoContextData.pnu : '');
    $memoRegisterType.val(memoContextData ? memoContextData.type : '');

    // 수정 모드에서만 사용되는 버튼 (예: 삭제 버튼) 숨김
    $modalContainer.find("#memo-modify-btn").hide();
    $modalContainer.find("#memo_add_btn").show(); // 등록 버튼은 보이게
    $memoDeleteBtn.hide(); // 삭제 버튼 숨김

    // ⭐⭐⭐ Swiper 초기화 ⭐⭐⭐
    const $swiperContainer = $modalContainer.find(".file-upload-swiper");
    const $fileInput = $modalContainer.find("#register_file_input"); // 파일 입력 필드 참조
    let fileSwiper = $modalContainer.data('fileUploadSwiperInstance');

    // 기존 Swiper 인스턴스가 있다면 파괴하고 새로 만듭니다. (등록 모달은 항상 클린 상태)
    if (fileSwiper && !fileSwiper.destroyed) {
        fileSwiper.destroy(true, true); // Swiper 파괴 (DOM 제거 포함)
    }

    $swiperContainer.find(".swiper-wrapper").empty(); // Swiper 내부 슬라이드 비우기

    fileSwiper = new Swiper($swiperContainer[0], {
        slidesPerView: 2,           
        spaceBetween: 10,           
        loop: false,                
        centeredSlides: false,      
        observer: true,             
        observeParents: true,       
    });
    $modalContainer.data('fileUploadSwiperInstance', fileSwiper);
    
    if (currentFileManager.getAllCurrentFiles().length === 0) { 
        $swiperContainer.hide(); // 파일이 없으면 Swiper를 숨깁니다.
        $swiperContainer.find(".swiper-wrapper").empty(); // Swiper Wrapper를 비웁니다.
    } else {
        $swiperContainer.show(); // 파일이 있다면 Swiper를 보여줍니다.
    }

    // ⭐⭐⭐ 파일 입력 변경 이벤트 바인딩 ⭐⭐⭐
    $fileInput.off("change").on("change", async function(e) {
        await handleFileInputChangeForRegisterModal(e, currentFileManager, fileSwiper, $modalContainer);
    });

    // ⭐⭐⭐ 이미지 삭제 버튼 이벤트 바인딩 추가 ⭐⭐⭐
    // 스와이퍼 컨테이너가 숨겨진 상태일 수 있으므로 $swiperContainer를 통해 이벤트 위임
    $swiperContainer.off("click", ".swiper-slide .close-btn-box").on("click", ".swiper-slide .close-btn-box", function() {
        handleImageDeleteForRegisterModal(this, currentFileManager, fileSwiper, $modalContainer);
    });

    // ⭐⭐ '메모 등록하기' 버튼 클릭 이벤트 ⭐⭐
    $modalContainer.off("click", "#memo_add_btn").on("click", "#memo_add_btn", async function () {
        const fileManagerForSubmit = $modalContainer.data('memoFileManager');
        if (!fileManagerForSubmit) {
            sweetAlertMessage("파일 관리자 오류가 발생했습니다. 관리자에게 문의하세요.", "", "e");
            return;
        }

        const name_val = $modalContainer.find("#memo_name").val();
        const phone_val = $modalContainer.find("#memo_phone").val();
        const estateNo_val = $modalContainer.find("#memo_estateNo").val();
        const content_val = $modalContainer.find("#memo_content").val();
        const complete_val = $modalContainer.find("#memo_complet").is(':checked');

        let validationPassed = true;

        const name_validation_msg = validateInput(name_val, "string", "이름을 확인해주세요.", { maxLength: 50, required: true });
        if (name_validation_msg !== true) {
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
        if (validationPassed && content_val.length > 0) {
            const content_validation_msg = validateInput(content_val, "string", "메모는 250자 이하로 작성해주세요.", { maxLength: 250 });
            if (content_validation_msg !== true) {
                sweetAlertMessage(content_validation_msg,"","e");
                validationPassed = false;
            }
        }
        
        if (!validationPassed) {
            return;
        }

        const latLng = memoContextData ? memoContextData.latLng : null;
        const pnu = memoContextData ? memoContextData.pnu : null;
        const type = memoContextData ? memoContextData.type : null;

        if (!latLng || !pnu || !type) {
            sweetAlertMessage("메모 위치 정보가 부족합니다. 지도를 다시 클릭하여 등록해 주세요.","","e");
            return;
        }

        const formData = new FormData();
        // 새롭게 업로드할 파일들만 가져옵니다.
        const filesToUpload = fileManagerForSubmit.getNewFilesForUpload(); // fileManagerForSubmit 사용
        
        // ⭐⭐⭐ 이 부분을 이전 방식인 "files[]" 형태로 수정합니다! ⭐⭐⭐
        filesToUpload.forEach((file) => { // index는 더 이상 필요 없으니 제거합니다.
            formData.append("files[]", file); // 백엔드 PHP에서 $_FILES['files'] 배열로 받게 됩니다.
        });

        // ⭐⭐⭐ [누락된 부분] user 정보 가져와 FormData에 추가 ⭐⭐⭐
        const currentUserInfo = userInfo(); // userInfo() 함수는 functions.js나 다른 곳에 정의되어 있을 것입니다.
        if (currentUserInfo) {
            for (const key in currentUserInfo) {
                if (currentUserInfo.hasOwnProperty(key)) {
                    formData.append(key, currentUserInfo[key]);
                }
            }
        }

        formData.append("name", name_val);
        formData.append("phone", phone_val);
        formData.append("estateNo", estateNo_val);
        formData.append("content", content_val);
        formData.append("complete", complete_val ? 'Y' : 'N');
        formData.append("latitude", latLng.getLat());
        formData.append("longitude", latLng.getLng());
        formData.append("pnu", pnu);
        formData.append("type", type);
        formData.append("currentTimestamp", moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss"));

        const url = "/front/back/memo/memo2_register.php";
        try {
            const result = await callApi2("POST", url, formData, {
                contentType: false, // FormData 사용 시 필수
                processData: false  // FormData 사용 시 필수
            });

            if (result && result.statusCode === 200 && result.message === "SUCCESS") {
                sweetAlertMessage("메모가 성공적으로 등록되었습니다.","","s");
                const memoRegisterModalInstance = bootstrap.Modal.getInstance($modalContainer[0]);
                if (memoRegisterModalInstance) memoRegisterModalInstance.hide();
                displayMemoOnMap(); // 지도상의 메모 아이콘을 갱신합니다.
            } else {
                sweetAlertMessage("메모 등록 실패: " + (result ? result.message : "알 수 없는 오류"),"","e");
            }
        } catch (e) {
            sweetAlertMessage("메모 등록 중 오류가 발생했습니다.","","e");
        }
    });
}

// ⭐⭐⭐ handleFileInputChangeForRegisterModal 함수 ⭐⭐⭐
async function handleFileInputChangeForRegisterModal(e, fileManagerInstance, swiperInstance, $modalContainer) {
    
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
        $modalContainer.find("#register_file_input").val("");
        return;
    }

    const $swiperContainer = $modalContainer.find(".file-upload-swiper"); // Swiper 컨테이너 참조

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
            const fileId = fileManagerInstance.addFile(file);
            if (fileId === null) {
                 continue;
            }
            
            const filePreview = await handleFileInputChangeMultiple(file);
            const slideHtml = `
                <div type="button" class="swiper-slide new-image" data-id="${fileId}" data-origin="N">
                    <img src="${filePreview}" class="image-thumbnail" alt="" title="" />
                    <span class="close-btn-box"><i class="fa-sharp fa-solid fa-circle-xmark"></i></span>
                </div>
            `;
            
            swiperInstance.appendSlide(slideHtml); 
        } else {
        
        }
    }
    
    $modalContainer.find("#register_file_input").val("");
    swiperInstance.update();
    
    // ⭐⭐ 모든 파일 처리 후, FileManager에 파일이 남아있다면 Swiper를 표시 ⭐⭐
    if (fileManagerInstance.getAllCurrentFiles().length > 0) {
        $swiperContainer.show();
    } else {
        $swiperContainer.hide();
    }
}


// ⭐⭐⭐ handleImageDeleteForRegisterModal 함수 ⭐⭐⭐
async function handleImageDeleteForRegisterModal(element, fileManagerInstance, swiperInstance, $modalContainer) {
    
    const $slide = $(element).closest('.swiper-slide');
    const internalFileId = $slide.data('id');
    const isExistingFile = $slide.data("origin") === 'Y'; // 기존 서버 파일인지 확인

    if (fileManagerInstance.removeFile(internalFileId)) {
        swiperInstance.removeSlide($slide.index()); // Swiper에서 슬라이드 제거
        swiperInstance.update(); // Swiper 업데이트

        // 모든 파일이 제거되었는지 확인하고 Swiper 컨테이너 숨김
        const $swiperContainer = $modalContainer.find(".file-upload-swiper");
        if (fileManagerInstance.getAllCurrentFiles().length === 0) {
            $swiperContainer.hide();
        }
    } else {
        
        sweetAlertMessage("파일 삭제 중 오류가 발생했습니다.", "", "e");
    }
   
}

// ⭐⭐⭐ FileManager 클래스 정의 (⭐️중요⭐️: 별도 파일이 아닌 경우 여기에 정의되어야 함) ⭐⭐⭐
class FileManager {
    constructor() {
        this.files = {};
        this.nextFileId = 0;
        this.deletedFileNos = new Set();
        this.instanceId = Math.random().toString(36).substring(2, 9); // 각 인스턴스에 고유 ID 부여
    }

    addFile(file) {
        const fileId = this.nextFileId++;
        this.files[fileId] = file;
        return fileId;
    }

    addExistingFile(fileInfo) {
        const fileId = this.nextFileId++;
        this.files[fileId] = {
            name: fileInfo.file_name,
            url: fileInfo.imgSrc,
            isExisting: true,
            file_no: fileInfo.file_id
        };
        return fileId;
    }

    getFile(fileId) {
        return this.files[fileId];
    }

    removeFile(internalFileId) {
        if (this.files.hasOwnProperty(internalFileId)) {
            const fileData = this.files[internalFileId];
            if (fileData.isExisting) {
                this.deletedFileNos.add(fileData.file_no);
            } else {
            }
            delete this.files[internalFileId];
            return true;
        }
        return false;
    }

    getDeletedFileNos() {
        return Array.from(this.deletedFileNos);
    }

    getNewFilesForUpload() { // ⭐ 이 메서드도 이전에 추가 제안 드렸었습니다. ⭐
        return Object.values(this.files).filter(fileData => !fileData.isExisting);
    }

    getAllCurrentFiles() {
        const currentFiles = Object.values(this.files).filter(fileData => {
            return !fileData.isExisting || !this.deletedFileNos.has(fileData.file_no);
        });
        return currentFiles;
    }
    
    getAllCurrentFiles() {
        // files 객체에 현재 남아있는 모든 파일 (새 파일 및 삭제 예정이 아닌 기존 파일)을 반환합니다.
        const currentFiles = Object.values(this.files).filter(fileData => {
            return !fileData.isExisting || (fileData.isExisting && !this.deletedFileNos.has(fileData.file_no));
        });
        
        return currentFiles;
    }

    clearFiles() {
        this.files = {};
        this.nextFileId = 0;
        this.deletedFileNos.clear();
    }
}
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
