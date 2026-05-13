/**
 * 입력 값의 유효성을 검사하는 함수
 * @param {jQuery} input - 입력 요소
 * @param {string} type - 입력 값의 유형 (예: "username", "email", "password", "select", "text", "number", "phone", "mobile", "file")
 * @param {string} errorMessage - 값이 비어있을 때 표시할 오류 메시지
 * @param {string} [fileType] - 파일 유형 (예: "image", "video", "doc"). 파일 유형이 "file"인 경우에만 사용
 * @returns {boolean} - 입력 값이 유효하면 true, 그렇지 않으면 false
 */
function validateInput(input, type, errorMessage, fileType, isRequired = true)  {

    // ⭐⭐⭐ 추가된 부분: input이 유효한 jQuery 객체인지, 그리고 그 안에 DOM 요소가 있는지 확인 ⭐⭐⭐
    if (!(input instanceof jQuery) || input.length === 0) {
        console.error("validateInput: 'input' 인자가 유효한 jQuery 객체가 아니거나 요소를 찾을 수 없습니다.", input);
        // 이 상황에서는 에러 메시지를 표시할 DOM도 없으므로, 즉시 false 반환하거나 다른 오류 처리를 할 수 있습니다.
        // 예를 들어, 개발 모드에서만 경고창을 띄우는 등.
        return false;
    }
    const value = input.val();
    const minLength = input.attr("minLength");
    const maxLength = input.attr("maxLength");
    //const errorElement = input.closest(".input-box").find(".error"); // 오류 메시지를 표시할 요소
    var isValid = true;
    //console.log(errorElement);

    // === 수정 부분 시작 ===
    // input 요소의 바로 상위 부모인 ".date-input-group" 또는 라디오 버튼의 경우 부모 ".input-group"을 찾은 다음,
    // 해당 그룹 내부의 ".error"를 찾도록 합니다.
    let errorContainer;
    if (type === "radio") { // 라디오 버튼 그룹의 에러를 찾을 때
        errorContainer = input.closest('.date-input-group');
    } else { // 일반 input (text, date, file)의 에러를 찾을 때
        errorContainer = input.closest('.date-input-group');
        if (errorContainer.length === 0) { // 만약 date-input-group이 없다면 가장 가까운 input-box를 찾도록 폴백
             errorContainer = input.closest('.input-box');
        }
    }
    const errorElement = errorContainer.find(".error").first();
    // === 수정 부분 끝 ===


    // 1. 파일 입력 필드 처리 (다른 타입과 다르게 files 속성으로 파일 유무 판단)
    if (type === "file") {
        const files = input[0].files; // 실제 FileList 객체

        if (isRequired && files.length === 0) {
            // 필수로 지정되었는데 파일이 선택되지 않은 경우
            errorElement.text(errorMessage); // "이미지 파일을 선택해하세요."
            return false;
        }
        // 필수가 아니고 파일이 선택되지 않았다면 유효하다고 간주하고 더 이상 검사할 필요 없음
        if (!isRequired && files.length === 0) {
            return true;
        }

        // 파일이 선택되었고 이미지 타입 검사가 필요한 경우
        const file = files[0];
        if (fileType === "image" && !file.type.startsWith('image/')) {
            errorElement.text("이미지 파일만 선택 가능합니다.");
            return false;
        }
        // 파일 유효성 검사를 통과했다면 여기서 함수 종료
        return true;
    }

    // 2. 파일 타입이 아닌 다른 모든 입력 필드 (텍스트, 날짜 등)
    // 필수로 지정되었는데 값이 비어있거나 공백인 경우
    if (isRequired && (!value || value.trim().length === 0)) {
        errorElement.text(errorMessage); // "메인 광고명을 입력하세요." 또는 "시작일을 선택하세요."
        return false;
    }

    // 필수가 아니고, 값이 비어있거나 공백이라면 이 필드는 유효하다고 간주하고 더 이상 검사할 필요 없음
    if (!isRequired && (!value || value.trim().length === 0)) {
        return true;
    }

    // 유효성 검사
    switch (type) {
        case "id":
            // 최소 길이와 최대 길이가 있는지 확인하고 검사
            if (minLength && value.length < minLength) {
                errorElement.text("사용자 이름은 최소 " + minLength + "자 이상이어야 합니다.");
                isValid = false;
            }
            if (maxLength && value.length > maxLength) {
                errorElement.text("사용자 이름은 최대 " + maxLength + "자 이하여야 합니다.");
                isValid = false;
            }

            break;
        case "username":
            // 최소 길이와 최대 길이가 있는지 확인하고 검사
            if (minLength && value.length < minLength) {
                errorElement.text("사용자 이름은 최소 " + minLength + "자 이상이어야 합니다.");
                isValid = false;
            }
            if (maxLength && value.length > maxLength) {
                errorElement.text("사용자 이름은 최대 " + maxLength + "자 이하여야 합니다.");
                isValid = false;
            }
            break;
        case "email":
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
            if (!emailRegex.test(value)) {
                errorElement.text("올바른 이메일 주소를 입력하세요.");
                isValid = false;
            }
            break;
        case "password":
            if (minLength && value.length < minLength) {
                errorElement.text("비밀번호는 최소 " + minLength + "자 이상이어야 합니다.");
                isValid = false;
            }
            if (maxLength && value.length > maxLength) {
                errorElement.text("비밀번호는 최대 " + maxLength + "자 이하여야 합니다.");
                isValid = false;
            }
            break;
        case "select":
            if (!value) {
                errorElement.text("옵션을 선택하세요.");
                isValid = false;
            }
            break;
        case "text":
            if ((minLength && value.length < minLength) || (maxLength && value.length > maxLength)) {
                errorElement.text("최소 " + minLength + "이상, 최대 " + maxLength + "자 이하여야 합니다.");
                isValid = false;
            }
            break;
        case "number":
            if (isNaN(value) || value < minLength || value > maxLength) {
                errorElement.text("최소 " + minLength + "이상, 최대 " + maxLength + "이하여야 합니다.");
                isValid = false;
            }
            break;
        case "phone":
            // const phoneRegex = /^\d{2,3}-\d{3,4}-\d{4}$/;
            const phoneRegex = /^\d{9,11}$/; // 전화번호 길이가 9자리에서 11자리 이내인지 확인
            if (!phoneRegex.test(value)) {
                errorElement.text("전화번호를 확인해주세요. (예: 0212345678)");
                isValid = false;
            }
            break;
        case "mobile":
            // const mobileRegex = /^\d{3}-\d{3,4}-\d{4}$/;
            const mobileRegex = /^\d{9,11}$/; // 휴대전화번호 길이가 9자리에서 11자리 이내인지 확인
            if (!mobileRegex.test(value)) {
                errorElement.text("휴대폰번호를 확인해주세요. (예: 01012345678)");
                isValid = false;
            }
            break;
        case "file":
            const files = input[0].files; // 선택된 파일 목록

            let validExtensions = [];
            let validMimeTypes = [];
            if (fileType === "image") {
                validExtensions = ["jpg", "jpeg", "png", "gif"];
                validMimeTypes = ["image/jpeg", "image/png", "image/gif"];
            } else if (fileType === "video") {
                validExtensions = ["mp4", "avi", "mov", "wmv"];
                validMimeTypes = ["video/mp4", "video/x-msvideo", "video/quicktime", "video/x-ms-wmv"];
            } else if (fileType === "doc") {
                validExtensions = ["pdf", "doc", "docx", "txt"];
                validMimeTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
            }

            $.each(files, function (i, file) {
                if (!isValidFile(file, validExtensions, validMimeTypes)) {
                    errorElement.text(`파일의 확장자를 확인해주세요. ex) ${validExtensions}`);
                    // input.val("");
                    isValid = false;
                    return false; // $.each 루프를 종료
                }
            });
            break;
        case "date":
                // YYYY-MM-DD 형식 검사 정규식
                // \d{4}: 연도 (4자리 숫자)
                // -\d{2}: 월 (하이픈 뒤 2자리 숫자)
                // -\d{2}: 일 (하이픈 뒤 2자리 숫자)
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(value)) {
                    errorElement.text("날짜 형식이 올바르지 않습니다 (YYYY-MM-DD).");
                    isValid = false;
                }
                break;
    
        default:
            if (type != "email") {
                // 기본적으로 특수문자를 제외한 값인지 확인
                const regex = /^[a-zA-Z0-9]+$/;
                if (!regex.test(value)) {
                    errorElement.text("특수문자는 사용할 수 없습니다.");
                    isValid = false;
                }
            }
    }

    // 유효성 검사 통과
    if (isValid) {
        errorElement.text("");
    }

    return isValid;
}

// 일반 유효성 검사
function validateField(input, errorMessage, minLength, maxLength) {
    const value = input.val();
    var errorElement = input.siblings(".error");

    // 값이 비어있는지 확인
    if (!value.trim()) {
        errorElement.text(errorMessage);
        return false;
    }

    // 특수문자를 제외한 값인지 확인
    const regex = /^[a-zA-Z0-9]+$/;
    if (!regex.test(value)) {
        errorElement.text("특수문자는 사용할 수 없습니다.");
        return false;
    }

    // 최소 길이와 최대 길이가 있는지 확인하고 검사
    if (minLength !== undefined && value.length < minLength) {
        errorElement.text(errorMessage);
        return false;
    }

    if (maxLength !== undefined && value.length > maxLength) {
        errorElement.text(errorMessage);
        return false;
    }

    // 유효성 검사 통과
    errorElement.text("");
    return true;
}

// 선택 여부 유효성 검사
function validateSelect(input, errorMessage) {
    const value = input.val();
    var errorElement = input.siblings(".error");
    if (!value) {
        errorElement.text(errorMessage);
        return false;
    } else {
        errorElement.text("");
        return true;
    }
}

// 사용자 이름 유효성 검사
function validateUsername(input, minLength) {
    const value = input.val();
    const errorElement = input.siblings(".error");
    if (value.length < minLength) {
        errorElement.text("사용자 이름은 최소 2자 이상이어야 합니다.");
        return false;
    } else {
        errorElement.text("");
        return true;
    }
}

// 이메일 유효성 검사
function validateEmail(input) {
    const value = input.val();
    const errorElement = input.siblings(".error");
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(value)) {
        errorElement.text("올바른 이메일 주소를 입력하세요.");
        return false;
    } else {
        errorElement.text("");
        return true;
    }
}

// 비밀번호 유효성 검사
function validatePassword(input) {
    const password = input.val();
    const errorElement = input.siblings(".error");
    if (password.length < 5) {
        errorElement.text("비밀번호는 최소 6자 이상이어야 합니다.");
        return false;
    } else {
        errorElement.text("");
        return true;
    }
}

/**
 * 파일명에서 확장자를 추출하는 함수
 * 버전 : 0.1
 * 작성일 : 2023-09-11
 * 작성자 : IT7
 * @param {string} fileName 파일명
 * @returns {string} 파일명에서 추출한 확장자
 */
function getExtOfFileName(fileName) {
    // 마지막 .의 위치를 찾는다.
    const fileLastDot = fileName.lastIndexOf(".");

    // 마지막 .의 위치부터 끝까지 자른다.
    const fileExt = fileName.substring(fileLastDot + 1).toLowerCase();

    return fileExt;
}

/**
 * File 선택 시, 확장자 및 MIME 타입 체크 함수
 * @param {*} e
 * @param {string} rcvType - 파일 유형 (예: "image", "video", "doc")
 */
function handleFileChange(e, rcvType) {
    const inputElement = e.target;
    const files = inputElement.files; // 선택된 파일 목록

    let validExtensions = []; // 유효한 확장자 목록
    let validMimeTypes = []; // 유효한 MIME 타입 목록

    if (rcvType === "image") {
        validExtensions = ["jpg", "jpeg", "png", "gif", "pdf"];
        validMimeTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    } else if (rcvType === "video") {
        validExtensions = ["mp4", "avi", "mov", "wmv"];
        validMimeTypes = ["video/mp4", "video/x-msvideo", "video/quicktime", "video/x-ms-wmv"];
    } else if (rcvType === "doc") {
        validExtensions = ["pdf", "doc", "docx", "txt"];
        validMimeTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    }

    $.each(files, function (i, file) {
        // 각 파일을 순회하여 확장자 및 MIME 타입 체크
        if (!isValidFile(file, validExtensions, validMimeTypes)) {
            // 파일이 유효한 확장자 및 MIME 타입이 아닐 경우
            sweetAlertMessage("파일의 확장자를 확인해주세요.", "", "e");
            inputElement.value = "";
            return false; // $.each 루프를 종료
        } else {
            // 파일이 유효한 확장자 및 MIME 타입일 경우
            console.log("일치");
        }
    });
}

/**
 * 파일 확장자 및 MIME 타입 체크 함수
 * @param {*} file ex) e.target.files[0]
 * @param {*} validExtensions ex) ['jpg', 'jpeg', 'png', 'gif', 'pdf']
 * @param {*} validMimeTypes ex) ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
 * @returns
 */
function isValidFile(file, validExtensions, validMimeTypes) {
    const fileName = file.name;
    const fileExtension = fileName.split(".").pop().toLowerCase();
    const fileType = file.type;

    const isExtensionValid = validExtensions.includes(fileExtension);
    const isMimeTypeValid = validMimeTypes.includes(fileType);

    return isExtensionValid && isMimeTypeValid;
}

/**
 * 파일의 확장자를 체크하여, 파일업로드가 가능한 확장자인지 체크하는 함수이다.
 * 버전 : 0.1
 * 작성일 : 2023-09-13
 * 작성자 : IT7
 * @param {string} fileName 파일명
 * @param {array} fileTypeArr 허용할 확장자 타입 배열
 * @returns {boolean} 파일업로드가 가능한 확장자인지 여부
 */
async function checkFileExt(fileName, fileTypeArr) {
    const ext = getExtOfFileName(fileName);

    // constant/extension.json 파일을 불러온다.
    const extJson = await fetch("/constant/extension.json").then((res) => res.json());
    const allowedExtList = fileTypeArr.map((fileType) => extJson[fileType]).reduce((acc, cur) => acc.concat(cur), []);

    const flag = allowedExtList.includes(ext) ? true : false;
    return flag;
}
