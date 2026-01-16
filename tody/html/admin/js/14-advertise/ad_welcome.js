const MAX_SHOW_IMAGE_COUNT = 3; // 최대 업로드 가능한 이미지 수
// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(document).ready(async function () {
    // adWelcome show List 가져오기
    adWelcome_list();
    
    let mySwiper = null; // mySwiper 인스턴스를 $(document).ready() 스코프에 선언

    // [Event] File 선택 시, 확장자 체크, label 텍스트 변경, 그리고 이미지 표시까지 한 번에 처리
    $(document).on("change", "#file_input", function (e) {
        const fileInput = $(e.target);
        const file = fileInput[0].files[0]; // 선택된 파일 (1개만 가져옴)
        const fileNameLabel = $('label.input-label[for="file_input"]'); // 파일 이름 표시할 라벨
        const swiperWrapper = $('.file-upload-swiper .swiper-wrapper');

        // 기존 Swiper 내용 및 인스턴스 초기화
        swiperWrapper.empty();
        if (mySwiper) {
            mySwiper.destroy(); // Swiper 인스턴스 파괴
            mySwiper = null; // mySwiper 초기화
        }

        // 1. 유효성 검사 및 파일이 없을 경우 처리
        if (!file) {
            fileNameLabel.text("파일을 선택하세요.");
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 선택 가능합니다.');
            fileInput.val(''); // 잘못된 파일 선택 시 input 초기화
            fileNameLabel.text("파일을 선택하세요.");
            return;
        }

        // ⭐⭐⭐ 핵심 수정: 새 파일을 선택했으므로 기존 이미지 삭제 플래그 초기화 ⭐⭐⭐
        // 새 파일을 선택했으니, 이제 "새 이미지로 대체"하겠다는 의미
        $('#delete_existing_image_flag').val('0'); // 기존 이미지 삭제 요청 취소
        $('#current_ad_image_name').val(file.name); // 새 파일의 이름을 '현재 이미지'로 간주 (프론트엔드 유효성 검사용)

        // 2. 파일 이름 label 업데이트
        fileNameLabel.text(file.name);

        // 3. 이미지 표시 및 삭제 버튼 로직
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgSrc = event.target.result;

            const slide = $('<div class="swiper-slide"></div>');
            const img = $('<img>').attr('src', imgSrc).css({
                width: '100%',
                height: 'auto',
                display: 'block'
            });
            
            // --- 삭제 버튼 생성 및 스타일 적용 ---
            const deleteButton = $('<button type="button" class="ad-btn-delete-image">X</button>');
            
            slide.append(img);
            slide.append(deleteButton); // 슬라이드에 이미지와 버튼 추가
            swiperWrapper.append(slide);

            // --- Swiper 초기화 또는 업데이트 ---
            mySwiper = new Swiper('.file-upload-swiper', {
                slidesPerView: 1,
                spaceBetween: 10,
                loop: false, // 1개 이미지이므로 loop는 필요 없음
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                on: {
                    init: function() {
                        // Swiper 초기화 시 모든 슬라이드에 position: relative; 적용 (버튼 absolute 포지셔닝 위함)
                        $('.file-upload-swiper .swiper-slide').css('position', 'relative');
                    }
                }
            });
            // Swiper 생성 후 혹시 빠진 경우를 위해 한 번 더 적용
            $('.file-upload-swiper .swiper-slide').css('position', 'relative');


            // --- 삭제 버튼 클릭 이벤트 ---
            deleteButton.on('click', function() {
                // 1. file_input 초기화
                fileInput.val('');
                // 2. fileNameLabel 초기화
                fileNameLabel.text("파일을 선택하세요.");
                // 3. swiperWrapper 비우기 (이미지 제거)
                swiperWrapper.empty();
                // 4. Swiper 인스턴스 파괴 및 초기화
                if (typeof mySwiper !== 'undefined' && mySwiper !== null) {
                    mySwiper.destroy();
                    mySwiper = null;
                }
                
                // ⭐⭐⭐ 추가: 기존 이미지 삭제 플래그를 1로 설정 ⭐⭐⭐
                $('#delete_existing_image_flag').val('1'); 
                $('#current_ad_image_name').val(''); // 현재 이미지도 없어진 것으로 처리
                //alert('이미지가 삭제되었습니다.'); // 사용자에게 피드백
            });
        };

        reader.readAsDataURL(file); // 파일을 Data URL로 읽기
    });

    // [Event] 광고 보이기 삭제 버튼 클릭
    $(document).on('click', '.ad-welcone-delete-btn', function() {
        const s_no = $(this).data('s_no');  // 버튼에 바인딩된 광고 고유 번호
    
        adWlecome_showdelete_button(s_no);
    });

    // [Event] 저장(등록/수정하기) 버튼 클릭 
    $(".modal-save-button").on("click", function () {

        const buttonText = $(this).text().trim();

        // 현재 열려 있는 수정 모달에서 adNo 값을 가져옵니다.
        const adNo = $('#welcomeModal').data('current-ad-no'); 
        if ((!adNo) && (buttonText == '등록하기')) {
            adWlecome_add_button();
        }
        else if ((adNo) && (buttonText == '수정하기')) {
            adWlecome_modify_button(adNo);
        }
        else {
            console.error('알 수 없는 저장 버튼 동작:', buttonText, adNo);
        }
        adWelcome_list();
        initializeDataTable();
    });

    // [Event] '등록' 또는 '수정' 모달 열기 버튼 클릭 시
    $(document).on('click', '.modal-register-btn, .modal-modify-btn', function (e) {
        e.preventDefault();

        let modalType = '';
        const currentClickedButton = $(this); // 클릭된 버튼 요소
        const targetHref = currentClickedButton.attr('href'); // <a> 태그의 href 속성에서 URL을 가져옵니다.
        const buttonText = currentClickedButton.text().trim(); // <a> 태그의 텍스트를 가져옵니다.
        if((buttonText ==='수정') || (buttonText.includes("광고 명칭:"))){
            modalType = 'modify';
        } else if(buttonText ==='메인 광고 등록'){
            modalType = 'register';
        }

        let modalId = '#welcomeModal';  // 공통 모달 ID
        let modalBodyId = '#modalBody';  // HTML 조각이 로드될 모달 바디의 ID
        let adNo = null;          // 수정 모달의 광고 번호 (없으면 null)
        let loadContentPath;      // 모달 바디에 로드할 HTML 조각 파일의 경로
        let modalTitle;           // 모달의 제목 텍스트
        let saveButtonText;      // 저장 버튼의 텍스트

        // targetHref를 분석하여 '등록' 모드인지 '수정' 모드인지 판단하고 적절한 모달을 선택합니다.
        if (modalType == 'register') {
            // '메인 광고 등록' 버튼을 누른 경우
            loadContentPath = targetHref; // href 자체가 로드할 경로 (예: /admin/.../ad_welcome_regist.html)
            modalTitle = '메인 광고 등록';
            saveButtonText = '등록하기';
        } else if (modalType == 'modify') {
            // '수정' 버튼을 누른 경우
            const urlParams = new URLSearchParams(targetHref.split('?')[1]); // 쿼리스트링 파싱
            adNo = urlParams.get('no');
            loadContentPath = targetHref.split('?')[0]; // 쿼리스트링 제외한 순수 HTML 경로만 로드 (예: /admin/.../ad_welcome_modify.html)
            modalTitle = `메인 광고 수정 (광고번호: ${adNo})`;
            saveButtonText = '수정하기';
        } else {
            console.error('알 수 없는 모달 호출 유형:', targetHref);
            return; // 알 수 없는 href 패턴이면 처리 중단
        }

        // 1. 모달의 제목 업데이트
        $(modalId).find('.modal-title').text(modalTitle);

        // 2. 모달 바디에 해당 HTML 조각 파일을 로드합니다.
        $(modalBodyId).load(loadContentPath, function(response, status, xhr) {
            if (status === "error") {
                $(modalBodyId).html('<p class="text-danger">모달 내용을 불러오는데 실패했습니다.</p>');
                console.error("Error loading modal content: " + xhr.status + " " + xhr.statusText);
            } else {
                // HTML 조각 로드 후, 필요한 JavaScript 초기화 작업을 수행합니다.
                if (adNo && typeof init_date_get === 'function') { // 수정 모달이고 adNo가 유효할 경우
                    init_date_get(adNo); // ad_no 값을 넘겨 상세 정보를 가져와 폼을 채움
                    $(modalId).data('current-ad-no', adNo);
                } else if (typeof init_date === 'function') { // 등록 모달일 경우
                    init_date(); // 등록 폼의 날짜 등을 초기화
                    $(modalId).data('current-ad-no', null);
                }
            }
        });
        // 3. 저장 버튼 텍스트 업데이트
        $(modalId).find('.modal-save-button').text(saveButtonText);

        // 4. 부트스트랩 모달을 화면에 띄웁니다.
        const myModal = new bootstrap.Modal(document.querySelector(modalId));
        myModal.show();
    });

    $('#welcomeModal').on('hidden.bs.modal', function () {
        $(this).find('.modal-body').empty();
    });
  
    initializeDataTable();

});
// branch_info(branch);

function init_date(){
    // ====== 날짜 초기값 설정 시작 ======
    const startDateInput = $('#start_date');
    const endDateInput = $('#end_date');
    
    // 날짜를 'YYYY-MM-DD' 형식으로 포맷하는 함수
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 오늘 날짜 설정
    const today = new Date();
    startDateInput.val(formatDate(today));

    // 종료일을 오늘로부터 1년 뒤로 설정
    const oneYearLater = new Date();
    oneYearLater.setFullYear(today.getFullYear() + 1); // 현재 년도에 1년 추가
    endDateInput.val(formatDate(oneYearLater));

}

/**=============================================================================
* 메인 광고 show 목록 가져오는 함수
*============================================================================= */
async function adWelcome_list() {
    const dataObj = {};
    const result = await callApi("POST", "/admin/back/14-advertise/ad_welcome_show_list.php", dataObj);

    if (!result) return;

    const { status, message, responseData } = result;

    if (!responseData) {
        //console.log(message);
        return;
    }

    const itemHtml = responseData
        .slice(0, MAX_SHOW_IMAGE_COUNT) // <-- 여기에 추가! 배열의 처음 3개 요소만 선택합니다.
        .map((item) => {
            const { ad_no, ad_image, ad_name, ad_url } = item; //ad_no: idx
            let accordionHtml = `
            <div class="col-xxl-3 col-md-6 mb-4 d-flex justify-content-center">
                <div class="card" style="width: 300px; height: 370px;">
                    <div class="card-body d-flex flex-column h-100" style="position: relative; overflow: visible;">
                        <button type="button"
                                class="ad-welcone-delete-btn"
                                data-s_no="${ad_no}"
                                aria-label="Close"
                                 style="
                                    position: absolute;
                                    top: 5px;
                                    right: 5px;
                                    background: rgba(0,0,0,0.7);
                                    color: white;
                                    border: none;
                                    border-radius: 50%;
                                    width: 24px;
                                    height: 24px;
                                    cursor: pointer;
                                    text-align: center;
                                    line-height: 24px; /* 'X'를 수직 중앙 정렬 */
                                    font-size: 14px;
                                    font-weight: bold;
                                    z-index: 10;
                                    display: flex; /* 'X'를 수평 중앙 정렬 */
                                    justify-content: center;
                                    align-items: center;
                                ">X</button> <!-- 버튼 텍스트는 'X' -->
                        <div class="avatar-title bg-light rounded">
                            <img src="/uploads/${ad_image}" alt="" class="rounded"
                                style="width:270px; height:300px; object-fit: cover;">
                        </div>
                        <div class="text-center flex-grow-1">
                            <a href="/admin/views/advertise_manage/ad_welcome_popup.html?no=${ad_no}" class="modal-modify-btn">
                                <h5 class="mt-3 company-name">광고 명칭: ${ad_name}</h5>
                            </a>
                        </div>
                        <div class="mt-auto">
                            <a href="${ad_url}" target="_blank" class="btn btn-soft-danger w-100">
                                ${ad_url}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            `;

            return accordionHtml;
        })
        .join("");

    $("#ad_welcome_show_list").html(itemHtml);
}

function initializeDataTable() {
    // 기존 DataTables 인스턴스가 있다면 파괴
    if ($.fn.DataTable.isDataTable("#ajax-datatables")) {
        $("#ajax-datatables").DataTable().destroy();
    }
    let table = new DataTable("#ajax-datatables", {
        language: {
            url: "/assets/libs/datatables/lang/ko.json",
        },
        initComplete: function () {
            let api = this.api();

            // 검색박스 및 선택박스 생성 시작 =====================================================================
            
            $(".dt-search").addClass("input-group");
            let searchBox = $(".dt-search input").addClass("form-control form-control-sm");
            let columnSelect = $('<select class="form-select form-select-sm"><option value="">전체</option></select>')
                .prependTo(".dt-search")
                .on("change", function () {
                    let selectedColumn = $(this).val();
                    searchBox.trigger("keyup");
                });
            
            // 각 컬럼 이름으로 옵션 추가
            api.columns().every(function () {
                // 특정 컬럼 제외
                if (this.index() !== 3) {
                    columnSelect.append('<option value="' + this.index() + '">' + $(this.header()).text() + "</option>");
                }
            });

            // 검색박스 이벤트 핸들러 설정
            searchBox.on("keyup", function () {
                let searchTerm = this.value;
                let selectedColumn = columnSelect.val();

                if (selectedColumn) {
                    api.column(selectedColumn).search(searchTerm).draw();
                } else {
                    api.search(searchTerm).draw();
                }
            });
            // 검색박스 및 선택박스 생성 끝 
            // DataTables 렌더링 완료 후 툴팁 초기화
            $('[data-bs-toggle="tooltip"]').tooltip();
            
        },
        // 각 행이 생성될 때 호출
        createdRow: function (row, data, dataIndex) {
            // TR 요소에 data-no 속성 추가 (loadTableData에서 넘겨받은 data.no 사용)
            if (data && data.no !== undefined) {
                $(row).attr('data-no', data.no);
            }
             // (선택 사항) 마우스 커서 변경 등 다른 row 스타일링
            // $(row).css('cursor', 'pointer');
        },
        scrollX: true, // 가로 스크롤 활성화
        scrollY: true, // 세로 스크롤 활성화
        processing: true, // 처리 중 메시지 활성화
        // serverSide: true, // 서버 사이드 처리를 활성화
        // colReorder: true,    // 컬럼 이동 활성화
        destroy: true, // 테이블 파괴 가능
        // lengthChange: false,
        ajax: function (data, callback, settings) {
            loadTableData(table, callback);
        },
        columns: [
            { data: "ad_no", title: "광고 번호" }, // 첫 번째 열로 순서를 추가
            { data: "ad_name", title: "광고 명칭" },
            { data: "ad_url", title: "광고 URL" },
            { data: "ad_image_name", title: "이미지 파일명" },
            { data: "active_fg", title: "활성화" },
            { data: "show_fg", title: "보이기" },
            { data: "start_date", title: "광고 시작일" },
            { data: "end_date", title: "광고 종료일" },
            { data: "reg_date", title: "등록일자" },
            { data: "management", title: "관리", orderable: false, searchable: false },
        ],
        // rowReorder: {
        //     selector: "td:nth-child(1)", // 첫 번째 열을 기준으로 row 재정렬
        // },
        order: [], // 기본 정렬 비활성화
        columnDefs: [
            { className: "text-start align-content-center", targets: [0, 1, 2, 4, 5, 6, 7, 8] }, // 모든 열에 좌측 정렬 클래스 추가
            //{ className: "text-center align-content-center", targets: [3] }, // 10 번째 열에 우측 정렬 클래스 추가
            //{ width: "60%", targets: [1] },
        ],
        
    });
}

/**
 * 테이블 데이터 불러오는 함수
 * @param {*} table
 * @param {*} callback
 */
function loadTableData(table, callback) {
    const dataObj = {
        ...adminUserInfo(),
        langCode: localStorage.getItem("langCode") ?? "kr",
    };
    callApi("POST", "/admin/back/14-advertise/ad_welcome_list.php", dataObj, "loading")
        .then((result) => {
            if (!result) {
                console.log("통신 실패!!!");
                if (callback) callback({ data: [] });
                return;
            }

            const { status, message, responseData } = result;

            if (!responseData) {
                console.log(message);
                if (callback) callback({ data: [] });
                return;
            }

            // 데이터를 올바르게 변환하여 DataTables에 전달합니다.
            const formattedData = responseData.map((item, index) => {
                // 순서(DESC)
                const reversedOrder = responseData.length - index;

                const managementHtml = `
                <a href="/admin/views/advertise_manage/ad_welcome_popup.html?no=${item.ad_no}"  
                    type="button"
                    class="modal-modify-btn btn btn-soft-danger btn-icon waves-effect waves-light"
                    data-url="/admin/views/advertise_manage/ad_welcome_popup.html?no=${item.ad_no}"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top">
                    수정
                    </a>
                `; 

                return {
                    ad_no: item.ad_no,
                    ad_name: item.ad_name,
                    ad_url: item.ad_url,
                    ad_image_name: item.ad_image_name,
                    active_fg: item.active_fg === "Y" ? "활성화" : "비활성화",
                    show_fg: item.show_fg === "Y" ? "보이기" : "안보이기",
                    start_date: item.start_date,
                    end_date: item.end_date,
                    reg_date: item.reg_date,
                    management: managementHtml,
                };
            });

            if (callback) {
                callback({ data: formattedData });
            } else {
                // table 객체가 DataTables 인스턴스라고 가정하고 데이터 로드
                // DataTables 초기화 시 ajax 옵션을 사용하고 있다면 이 else 블록은 사용되지 않을 수 있습니다.
                // DataTables 초기화 코드에서 ajax 옵션을 통해 loadTableData의 콜백을 사용하는 방식이 더 일반적입니다.
                if (table && typeof table.clear === 'function' && typeof table.rows === 'function' && typeof table.draw === 'function') {
                    table.clear().rows.add(formattedData).draw();
                } else {
                    console.error("DataTables table object is not valid or not initialized.");
                }
            }
        })
        .catch((error) => {
            console.error("AJAX 요청 중 오류 발생:", error);
            if (callback) callback({ data: [] });
        });
}
/**
 * adNo를 사용하여 서버에서 광고 상세 정보를 가져와 폼 필드를 채웁니다.
 * @param {string} adNo 수정할 광고의 고유 ID (idx)
 */
async function init_date_get(adNo){

    try {
        const dataObj = {
            ad_no: adNo,
        };
        const result = await callApi("POST", "/admin/back/14-advertise/ad_welcome_detail.php", dataObj);

        if (!result) {
            console.error("API 호출 실패: result 객체가 반환되지 않았습니다.");
            //alert("조회에 실패했습니다. 다시 시도해주세요.");
            window.history.back(); // 실패 시 이전 페이지로 돌아갈 수 있음
            return;
        }

        const { statusCode, message, responseData } = result;

        if (statusCode === 200) { // ⭐ statusCode를 status로 변경 ⭐
            if (message === "SUCCESS" && responseData) { // message 필드가 일관적이라면 유지, 아니면 삭제 가능
                $('#ad_name').val(responseData.ad_name);
                $('#ad_url').val(responseData.ad_url);

                // 2. 날짜 입력 필드 채우기 (YYYY-MM-DD 형식 그대로)
                $('#start_date').val(responseData.start_date);
                $('#end_date').val(responseData.end_date);

                // 3. 라디오 버튼 채우기 (active_fg)
                $(`input[name="active_fg"][value="${responseData.active_fg}"]`).prop('checked', true);

                // 4. 라디오 버튼 채우기 (show_fg)
                $(`input[name="show_fg"][value="${responseData.show_fg}"]`).prop('checked', true);

                if (responseData.ad_image) {
                    // 1. '파일 선택' 라벨의 텍스트를 실제 파일 이름으로 변경
                    $('#file_name').text(responseData.ad_image_name || "업로드된 이미지 있음"); // ad_image_name이 없을 경우 대비
                
                    // 2. Swiper Wrapper의 기존 내용을 비우고 새 이미지를 삽입
                    const $swiperWrapper = $('.file-upload-swiper .swiper-wrapper');
                    $swiperWrapper.empty(); // 이전 내용이 있다면 비웁니다.
                
                    const imageUrl = '/uploads/' + responseData.ad_image;
                
                    // 슬라이드 컨테이너 생성 (position:relative를 위해)
                    const slide = $('<div class="swiper-slide"></div>');
                    const img = $('<img>').attr({
                        'src': imageUrl,
                        'alt': responseData.ad_name + ' 광고 이미지',
                        'style': 'max-width: 100%; height: auto; display: block;' // 이미지는 슬라이드 내에서 100% 폭을 사용
                    });
                
                    // ⭐⭐ 삭제 버튼 생성 ⭐⭐
                    const deleteButton = $('<button type="button" class="ad-btn-delete-image">X</button>');
                
                    slide.append(img); // 슬라이드에 이미지 추가
                    slide.append(deleteButton); // 슬라이드에 삭제 버튼 추가
                    $swiperWrapper.append(slide); // 완성된 슬라이드를 Swiper Wrapper에 추가
                
                
                    // --- Swiper 초기화 (혹은 업데이트) ---
                    // mySwiper가 이미 초기화되어 있다면 destroy 후 새로 초기화
                    if (typeof mySwiper !== 'undefined' && mySwiper !== null) {
                        mySwiper.destroy();
                        mySwiper = null;
                    }
                    
                    // 새 Swiper 인스턴스 초기화
                    mySwiper = new Swiper('.file-upload-swiper', {
                        slidesPerView: 1,
                        spaceBetween: 10,
                        loop: false, // 하나의 이미지만 보이므로 loop는 false가 적합
                        navigation: {
                            nextEl: '.swiper-button-next', // 만약 네비게이션 버튼이 있다면
                            prevEl: '.swiper-button-prev', // 만약 네비게이션 버튼이 있다면
                        },
                        pagination: {
                            el: '.swiper-pagination', // 만약 페이지네이션이 있다면
                            clickable: true,
                        },
                        on: {
                            init: function() {
                                // Swiper 초기화 시 모든 슬라이드에 position: relative; 적용 (버튼 absolute 포지셔닝 위함)
                                $('.file-upload-swiper .swiper-slide').css('position', 'relative');
                            }
                        }
                    });
                    // 혹시 초기화 시점에 빠진 경우를 대비하여 한 번 더 적용
                    $('.file-upload-swiper .swiper-slide').css('position', 'relative');
                
                
                    // ⭐⭐ 삭제 버튼 클릭 이벤트 ⭐⭐
                    deleteButton.on('click', function() {
                        // 1. file_input (새 파일 선택용) 초기화
                        $('#file_input').val('');
                        // 2. 파일 이름 표시 라벨 초기화
                        $('#file_name').text("파일을 선택하세요.");
                        // 3. swiperWrapper 비우기 (현재 표시된 이미지 및 버튼 제거)
                        $swiperWrapper.empty();
                        // 4. Swiper 인스턴스 파괴 및 초기화
                        if (typeof mySwiper !== 'undefined' && mySwiper !== null) {
                            mySwiper.destroy();
                            mySwiper = null;
                        }
                        // ⭐⭐⭐ 추가: 기존 이미지 삭제 플래그를 1로 설정 ⭐⭐⭐
                        $('#delete_existing_image_flag').val('1'); 
                        $('#current_ad_image_name').val(''); // 현재 이미지도 없어진 것으로 처리
                        // ⭐ 5. 중요한 부분: 기존 이미지를 삭제했음을 서버에 알릴 로직 추가 ⭐
                        // 예를 들어, <input type="hidden" name="delete_existing_image" value="1"> 같은 필드를 추가/업데이트하거나
                        // 전역 변수에 삭제 플래그를 설정하여 폼 제출 시 활용할 수 있습니다.
                        // 현재는 화면에서 이미지를 제거하는 것까지만 처리합니다.
                    });

                    // ⭐⭐⭐ 추가: 숨겨진 필드에 현재 이미지 파일명 저장 ⭐⭐⭐
                    $('#current_ad_image_name').val(responseData.ad_image); // 실제 DB 저장 파일명 (ad_image)
                    $('#span_original_image_name').text(responseData.ad_image_name); // 원본 파일명 표시

                    // 삭제 플래그 초기화
                    $('#delete_existing_image_flag').val('0');
                
                } else {
                    // 이미지가 없는 경우
                    $('#file_name').text('파일을 선택하세요.'); // '파일을 선택하세요.' 기본 텍스트로 되돌립니다.
                    $('.file-upload-swiper .swiper-wrapper').empty(); // Swiper Wrapper를 비웁니다.
                    // 기존 Swiper 인스턴스 파괴 (만약 존재한다면)
                    if (typeof mySwiper !== 'undefined' && mySwiper !== null) {
                        mySwiper.destroy();
                        mySwiper = null;
                    }
                    $('#current_ad_image_name').val(''); // 이미지가 없으므로 빈 값
                    $('#span_original_image_name').text('업로드된 이미지 없음');
                    $('#delete_existing_image_flag').val('0');
                }
                
            } else {
                // status는 200인데 message가 SUCCESS가 아니거나 responseData가 없는 경우
                console.warn("API 응답이 성공적이지 않거나 데이터가 없습니다.", result);
                window.history.back();
            }
        } else {
            // status 코드가 200이 아닌 경우 (예: 404, 500 등)
            console.error("API 호출 오류 (status:", status, ")", message, result);
            alert(`광고 상세 정보 로드 중 오류가 발생했습니다: ${message || '알 수 없는 오류'}`);
            window.history.back();
        }
    } catch (error) {
        // 네트워크 오류, 파싱 오류 등 예외 발생 시
        console.error("init_date_get 함수 실행 중 예외 발생:", error);
        alert("데이터를 가져오는 중 예상치 못한 오류가 발생했습니다. 다시 시도해주세요.");
        window.history.back();
    }
}
/**
 * 등록 함수
 * @returns
 */
async function adWlecome_add_button() {
    // formData 초기화
    const formData = new FormData();

    // ####################################################################
    // 유효성 검사 시작
    // ####################################################################
    let isValid = true;
    const inputIdArray = ["ad_name", "ad_url", "file_input","start_date","end_date","active_fg_y","show_fg_y"];

    const selectElements = selectElementsById(inputIdArray); // id 배열 받아서 selector 객체 생성
    const elementValues = getElementValues(inputIdArray); // 배열의 요소를 ID로 가진 input의 value를 {id : value} 형식의 객체로 저장

    isValid = validateInput(selectElements.ad_name, "text", "메인 광고명을 입력하세요.", null, true) && isValid;
    isValid = validateInput(selectElements.ad_url, "text", "메인 광고 사이트 주소를 입력하세요.",null,true) && isValid;
    
    isValid = validateInput(selectElements.file_input, "file", "이미지 파일을 선택해하세요.", "image", true) && isValid;
    // 이미지 확인
    // 이미지 파일이 실제로 선택되었고, 위 유효성 검사를 통과했을 때만 FormData에 추가
    if (selectElements.file_input[0].files.length > 0) {
        formData.append("file", selectElements.file_input[0].files[0]);
        //console.log(selectElements.file_input[0].files[0]);
    }
    
    isValid = validateInput(selectElements.start_date, "date", "날짜를 선택하세요.",null, true) && isValid;
    isValid = validateInput(selectElements.end_date, "date", "날짜를 선택하세요.",null, true) && isValid;

    // 6. 활성화 설정 (Radio Button)
    const activeFgChecked = $('input[name="active_fg"]:checked').length > 0;
    const activeFgErrorContainer = $('input[name="active_fg"]').closest('.date-input-group');
    const activeFgErrorElement = activeFgErrorContainer.find(".error").first();

    if (!activeFgChecked) {
        activeFgErrorElement.text("활성화 설정을 선택하세요.");
        isFormValid = false;
    } else {
        activeFgErrorElement.text(""); // 에러 메시지 초기화
    }

    // 7. 보이기 설정 (Radio Button)
    const showFgChecked = $('input[name="show_fg"]:checked').length > 0;
    const showFgErrorContainer = $('input[name="show_fg"]').closest('.date-input-group');
    const showFgErrorElement = showFgErrorContainer.find(".error").first();

    if (!showFgChecked) {
        showFgErrorElement.text("보이기 설정을 선택하세요.");
        isFormValid = false;
    } else {
        showFgErrorElement.text(""); // 에러 메시지 초기화
    }


    // 유효성 검토 실패 시
    if (!isValid) {
        const $errorElements = $(".error");

        // 스크롤 이동
        $errorElements.each(function () {
            const $errorElement = $(this);
            if ($.trim($errorElement.text()) !== "") {
                // 에러 메시지가 비어있지 않은지 확인
                $errorElement[0].parentNode.scrollIntoView({ behavior: "smooth" });
                alert('모든 필수 입력값을 올바르게 입력해주세요!');
                return false; // 첫 번째 에러 메시지를 찾으면 반복문 종료
            }
        });

        return; // 유효성 검토 실패 시 중단
    }

    // ####################################################################
    // 유효성 검사 종료
    // ####################################################################

    const confirm = await sweetConfirm("메인 광고를 등록 하시겠습니까?", "", "w");
    if (!confirm) return;

    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보

    // adminInfo는 객체 형태일 것이므로, 아래처럼 key-value를 직접 append
    for (const key in adminInfo) {
        if (Object.hasOwnProperty.call(adminInfo, key)) {
            formData.append(key, adminInfo[key]);
        }
    }

    formData.append("langCode", langCode);
    formData.append("ad_name", elementValues.ad_name); // elementValues는 일반 텍스트 값을 가정
    formData.append("ad_url", elementValues.ad_url);
    formData.append("start_date", elementValues.start_date);
    formData.append("end_date", elementValues.end_date);

    // --- 라디오 버튼 값 가져오는 방식 수정 ---
    // active_fg와 show_fg는 name 속성을 사용해 현재 선택된 값 가져오기
    formData.append("active_fg", $('input[name="active_fg"]:checked').val());
    formData.append("show_fg", $('input[name="show_fg"]:checked').val());

    // --- ad_image_name 필드 처리 (선택 사항) ---
    // 서버에서 파일명을 별도로 요구하지 않는다면 이 부분은 제거해도 됩니다.
    if (elementValues.file_input) { // elementValues.file_input은 C:\fakepath\... 형태
        const imageFileName = elementValues.file_input.split('\\').pop().split('/').pop(); // 실제 파일명 추출
        formData.append("ad_image_name", imageFileName);
    }
    // --- 파일 처리 방식 수정 (가장 중요!) ---
    // 이 부분은 이전 유효성 검사 로직에서 이미 selectElements.file_input을 통해 File 객체를 얻었을 것이므로,
    // 그 File 객체를 직접 append 합니다.
    const imageFile = selectElements.file_input[0].files[0];
    if (imageFile) { // 파일이 존재하는 경우에만 append
        formData.append("ad_image", imageFile); // 서버에서 받을 때 사용할 필드명 (예: 'ad_image')
    } else {
        // 파일이 필수가 아니라면 이대로 진행, 필수인데 여기까지 왔으면 이미 유효성 검사에서 걸렸을 것
        // 파일이 필수인데, 서버에 보낼 파일이 없는 경우를 처리할 로직이 필요할 수 있습니다.
    }
    // --- 파일 처리 방식 수정 끝 ---

    const result = await callApiFormData("POST", "/admin/back/14-advertise/ad_welcome_register.php", formData);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("처리 되었습니다.", "", "s");
        if (!confirm) return;
        adWelcome_list();
        initializeDataTable();
        const modalEl = document.getElementById('welcomeModal');
        const modal = bootstrap.Modal.getInstance(modalEl) 
                || new bootstrap.Modal(modalEl);

        modal.hide();
    } else {
        const confirm = await sweetAlertForReturn("등록 중 문제가 발생하였습니다.", "", "e");
        if (!confirm) return;
    }
    
}
/**
 * 수정 함수
 * @returns
 */
async function adWlecome_modify_button(adNo) {

    // ⭐⭐⭐ 디버깅용: #file_input 요소의 상태 확인 ⭐⭐⭐
    const debugFileInputElement = $('#file_input');
    
    if (debugFileInputElement.length === 0) {
        console.error("!!!! Error: '#file_input' 요소를 찾을 수 없습니다. HTML 로딩 타이밍 문제일 수 있습니다. !!!!");
        // 이 시점에서 더 진행해도 유효성 검사에서 에러가 나므로 early return
        //alert("폼 요소가 제대로 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.");
        return; 
    }
    // ⭐⭐⭐ 디버깅용 끝 ⭐⭐⭐
    // formData 초기화
    const formData = new FormData();
    
    // ####################################################################
    // 유효성 검사 시작
    // ####################################################################
    let isValid = true;
    const inputIdArray = ["ad_name", "ad_url", "file_input","start_date","end_date","active_fg_y","show_fg_y"];

    const selectElements = selectElementsById(inputIdArray); // id 배열 받아서 selector 객체 생성
    const elementValues = getElementValues(inputIdArray); // 배열의 요소를 ID로 가진 input의 value를 {id : value} 형식의 객체로 저장

    isValid = validateInput(selectElements.ad_name, "text", "메인 광고명을 입력하세요.", null, true) && isValid;
    isValid = validateInput(selectElements.ad_url, "text", "메인 광고 사이트 주소를 입력하세요.",null,true) && isValid;
    
    // ⭐⭐⭐ 이미지 유효성 검사 로직 수정 시작 ⭐⭐⭐
    const fileInput = selectElements.file_input; //// jQuery 객체
    const hasNewFile = fileInput.length > 0 && fileInput.get(0).files && fileInput.get(0).files.length > 0; 

    // 이미지 삭제 버튼을 눌렀는지 여부를 확인하는 플래그 (UI에서 설정되어야 함)
    // 이 값은 <input type="hidden" id="delete_existing_image_flag" value="0"> 와 같은 형태로
    // 모달 폼 안에 있거나, 전역 변수로 관리되어야 합니다.
    const deleteExistingImageFlagElement = $('#delete_existing_image_flag'); // 숨겨진 인풋 필드 ID 가정
    const isExistingImageDeleted = deleteExistingImageFlagElement.val() === '1'; // '1'이면 기존 이미지 삭제 요청

    // 기존 이미지가 있었고, 새 파일은 선택되지 않았으며, 명시적인 삭제 요청도 없는 경우 -> 기존 이미지 유지
    // 현재 이미지 미리보기(`$imageElement`)가 활성화된 상태는 `init_date_get`에서 처리되므로,
    // 이 시점에서 기존 이미지가 있는지 여부를 판단하는 정보가 필요합니다.
    // -> 이 정보는 모달 폼 안에 숨겨진 필드로 전달받는 것이 가장 좋습니다. (예: current_image_path)
    const currentImageNameInput = $('#current_ad_image_name'); // 숨겨진 기존 파일명 인풋
    const hasCurrentImage = currentImageNameInput.length > 0 && currentImageNameInput.val() !== '';

    if (hasNewFile) {
        // 새 파일을 선택했다면, 새 파일에 대한 유효성 검사
        isValid = validateInput(fileInput, "file", "이미지 파일을 선택하세요.", "image", true) && isValid;
        if (isValid) {
            formData.append("ad_image", fileInput.get(0).files[0]); // ⭐
            formData.append("ad_image_name", fileInput.get(0).files[0].name); // ⭐
        }
        formData.append("delete_existing_image_flag", "0"); // 새 파일이 있으니 기존 삭제 플래그는 0으로
    } else {
        // 새 파일이 없다면 (files.length === 0)
        // 1. 기존 이미지를 명시적으로 삭제하기로 했는지 (체크박스 등으로 '1' 값을 보냈는지)
        // 2. 기존 이미지가 애초에 없었는지 (빈값이 로드되었는지)
        // -> 이 두 경우 모두 이미지가 없으므로, 이미지를 업로드하라고 강제합니다.
        if (isExistingImageDeleted || !hasCurrentImage) {
            isValid = validateInput(fileInput, "file", "이미지 파일을 선택해야 합니다.", "image", true) && isValid;
            // isValid가 true라면 이미 fileInput.files[0]가 있을텐데 이 블록은 files.length === 0 일때 진입하므로
            // 사실상 isValid는 false가 되고 에러 메시지만 표시
            formData.append("delete_existing_image_flag", "1"); // 기존 이미지 삭제 요청 (새 파일이 없으므로 null로 업데이트)
        } else {
            // 새 파일 없고, 기존 이미지는 있으며, 삭제 요청도 없음 -> 기존 이미지 유지
            // 따라서 file_input 유효성 검사는 건너뜁니다.
            formData.append("delete_existing_image_flag", "0"); // 기존 이미지 유지 플래그
            // 기존 이미지의 원본 파일명 (현재 미리보기 되고 있는)을 보내야 함
            formData.append("ad_image_name", currentImageNameInput.val());
        }
    }
    // ⭐⭐⭐ 이미지 유효성 검사 로직 수정 끝 ⭐⭐⭐
    
    isValid = validateInput(selectElements.start_date, "date", "날짜를 선택하세요.",null, true) && isValid;
    isValid = validateInput(selectElements.end_date, "date", "날짜를 선택하세요.",null, true) && isValid;

    // 6. 활성화 설정 (Radio Button)
    const activeFgChecked = $('input[name="active_fg"]:checked').length > 0;
    const activeFgErrorContainer = $('input[name="active_fg"]').closest('.date-input-group');
    const activeFgErrorElement = activeFgErrorContainer.find(".error").first();

    if (!activeFgChecked) {
        activeFgErrorElement.text("활성화 설정을 선택하세요.");
        isFormValid = false;
    } else {
        activeFgErrorElement.text(""); // 에러 메시지 초기화
    }

    // 7. 보이기 설정 (Radio Button)
    const showFgChecked = $('input[name="show_fg"]:checked').length > 0;
    const showFgErrorContainer = $('input[name="show_fg"]').closest('.date-input-group');
    const showFgErrorElement = showFgErrorContainer.find(".error").first();

    if (!showFgChecked) {
        showFgErrorElement.text("보이기 설정을 선택하세요.");
        isFormValid = false;
    } else {
        showFgErrorElement.text(""); // 에러 메시지 초기화
    }


    // 유효성 검토 실패 시
    if (!isValid) {
        const $errorElements = $(".error");

        // 스크롤 이동
        $errorElements.each(function () {
            const $errorElement = $(this);
            if ($.trim($errorElement.text()) !== "") {
                // 에러 메시지가 비어있지 않은지 확인
                $errorElement[0].parentNode.scrollIntoView({ behavior: "smooth" });
                alert('모든 필수 입력값을 올바르게 입력해주세요!');
                return false; // 첫 번째 에러 메시지를 찾으면 반복문 종료
            }
        });

        return; // 유효성 검토 실패 시 중단
    }

    // ####################################################################
    // 유효성 검사 종료
    // ####################################################################

    const confirm = await sweetConfirm("메인 광고를 수정 하시겠습니까?", "", "w");
    if (!confirm) return;

    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보

    // adminInfo는 객체 형태일 것이므로, 아래처럼 key-value를 직접 append
    for (const key in adminInfo) {
        if (Object.hasOwnProperty.call(adminInfo, key)) {
            formData.append(key, adminInfo[key]);
        }
    }
    formData.append("ad_no", adNo); // adNo를 formData에 추가 (필수)
    formData.append("langCode", langCode);
    formData.append("ad_name", elementValues.ad_name); // elementValues는 일반 텍스트 값을 가정
    formData.append("ad_url", elementValues.ad_url);
    formData.append("start_date", elementValues.start_date);
    formData.append("end_date", elementValues.end_date);
    formData.append("active_fg", $('input[name="active_fg"]:checked').val());
    formData.append("show_fg", $('input[name="show_fg"]:checked').val());

    
    const result = await callApiFormData("POST", "/admin/back/14-advertise/ad_welcome_modify.php", formData);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("광고가 수정 되었습니다.", "", "s");
        if (!confirm) return;
        adWelcome_list();
        initializeDataTable();
        const modalEl = document.getElementById('welcomeModal');
        const modal = bootstrap.Modal.getInstance(modalEl) 
                || new bootstrap.Modal(modalEl);

        modal.hide();
    } else {
        const confirm = await sweetAlertForReturn("광고를 수정 중 문제가 발생하였습니다.", "", "e");
        if (!confirm) return;
    }

}

/**
 * show 숨김처리 함수
 * @returns
 */
async function adWlecome_showdelete_button(adNo) {

    const confirm = await sweetConfirm("해당 광고를 보이는 목록에서 삭제하시겠습니까??", "", "w");
    if (!confirm) return;

    const formData = new FormData();
    formData.append("ad_no", adNo);

    const result = await callApiFormData("POST", "/admin/back/14-advertise/ad_welcome_showdelete.php", formData);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("광고가 성공적으로 숨김 처리되었습니다.", "", "s");
        if (!confirm) return;
        $(".modal-pop-wrapper").modal("hide");
        adWelcome_list();
        initializeDataTable()
    } else {
        const confirm = await sweetAlertForReturn("광고 숨김 처리 중 문제가 발생하였습니다.", "", "e");
        if (!confirm) return;
    }

}