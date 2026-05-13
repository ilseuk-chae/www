// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행
$(document).ready(async function () {
    // 매물 상세 정보 불러오기
    re_detail_info();

    // [Event] 삭제 버튼 클릭
    $("#delete_btn").on("click", function () {
        const no = $("#estate_no").text();
        estate_delete(no);
    });

    // [Event] 공개 상태 변경
    $(".change-public-btn").on("click", function () {
        const val = $(this).attr("data-public_fg");
        public_fg_change(val);
    });
});

// =============================================================================
// 매물 관련 함수
// =============================================================================
/**
 * 매물정보 가져오는 함수
 * @returns
 */
async function re_detail_info() {
    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보

    const itemNo = getParameter("no");
    console.log(itemNo);

    const dataObj = {
        ...adminInfo,
        langCode,
        no: encodeURIComponent(itemNo),
    };

    const result = await callApi("POST", "/admin/back/04-estate/estate_info_v2.php", dataObj);

    if (!result) return;

    const { status, message, responseData } = result;

    // 매물정보 바인딩
    bindJsonData(responseData);

    const { agency_name, latitude, longitude, public_fg, imageArray } = responseData;

    // 상호명
    $("#agency_name").text(agency_name);

    // 이미지
    swiper_image(imageArray);

    // 지도 초기화
    mapInit(latitude, longitude);

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
 * 카카오맵 초기화 및 위치 설정
 * @param {*} latitude = 위도
 * @param {*} longitude = 경도
 * @returns
 */
function mapInit(latitude, longitude) {
    if (!latitude || !longitude) return;

    var container = document.getElementById("kakaoMap"); //지도를 담을 영역의 DOM 레퍼런스
    var options = {
        //지도를 생성할 때 필요한 기본 옵션
        center: new kakao.maps.LatLng(latitude, longitude), //지도의 중심좌표.
        level: 3, //지도의 레벨(확대, 축소 정도)
    };

    var map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴

    // 지도를 클릭한 위치에 표출할 마커입니다
    var marker = new kakao.maps.Marker({
        // 지도 중심좌표에 마커를 생성합니다
        position: map.getCenter(),
    });
    // 지도에 마커를 표시합니다
    marker.setMap(map);
}

/**
 * 매물 이미지 swiper 요소로 추가하는 함수
 * @param {*} imageArray = 이미지 배열
 */
function swiper_image(imageArray) {
    const thumbSelector = $(".sale-thumbnail-slider .swiper-wrapper");
    const thumbNavSelector = $(".sale-nav-slider .swiper-wrapper");

    const imageHtml = imageArray
        .map((item, index) => {
            let image = "";
            const imageUrl = `/admin/back/04-estate/estate_images.php?token=${encodeURIComponent(item.imageToken)}`;
            if (item.fileType === "image") {
                image = `<img src="${imageUrl}" alt="" class="img-fluid d-block" onerror="this.onerror=null;this.src='/front/assets/image/building_empty.png';" >`;
            } else if (item.fileType === "video") {
                image = `<video controls width="100%" class="img-fluid mx-auto rounded">
                            <source src="${imageUrl}" type="video/mp4" class="h-100">
                            Your browser does not support the video tag.
                        </video>`;
            } else {
                image = '<img src="/front/assets/image/building_empty.png" alt="" class="img-fluid d-block" />';
            }

            const itemHtml = `
            <div class="swiper-slide">
                ${image}
            </div>
        `;
            return itemHtml;
        })
        .join("");
    const imageNavHtml = imageArray
        .map((item, index) => {
            let image = "";
            const imageUrl = `/admin/back/04-estate/estate_images.php?token=${encodeURIComponent(item.imageToken)}`;
            if (item.fileType === "image") {
                image = `<img src="${imageUrl}" alt="" class="img-fluid d-block" onerror="this.onerror=null;this.src='/front/assets/image/building_empty.png';" >`;
            } else if (item.fileType === "video") {
                image = `<video muted width="100%" class="img-fluid mx-auto rounded">
                            <source src="${imageUrl}" type="video/mp4" class="h-100">
                            Your browser does not support the video tag.
                        </video>`;
            } else {
                image = '<img src="/front/assets/image/building_empty.png" alt="" class="img-fluid d-block" />';
            }

            const itemHtml = `
                <div class="swiper-slide">
                    <div class="nav-slide-item">
                        ${image}
                    </div>
                </div>
            `;
            return itemHtml;
        })
        .join("");

    thumbSelector.html(imageHtml);
    thumbNavSelector.html(imageNavHtml);

    var productNavSlider = new Swiper(".sale-nav-slider", { loop: !1, spaceBetween: 10, slidesPerView: 4, freeMode: !0, watchSlidesProgress: !0 }),
        productThubnailSlider = new Swiper(".sale-thumbnail-slider", {
            loop: !1,
            spaceBetween: 24,
            navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
            thumbs: { swiper: productNavSlider },
        });
}

/**
 * 삭제처리 함수
 * @param {*} rcvNo
 * @returns
 */
async function estate_delete(rcvNo) {
    const confirm = await sweetConfirm("삭제 하시겠습니까?", "", "w");
    if (!confirm) return;

    const langCode = localStorage.getItem("langCode") ?? "kr"; // 언어
    const adminInfo = adminUserInfo(); // 관리자 정보

    const dataObj = {
        ...adminInfo,
        langCode,
        rcvNo: rcvNo,
    };

    const result = await callApi("POST", "/admin/back/04-estate/estate_delete.php", dataObj);

    if (!result) return;

    const { status, message } = result;

    if (message === "SUCCESS") {
        const confirm = await sweetAlertForReturn("처리 되었습니다.", "", "s");
        if (!confirm) return;
        location.href = "/admin/views/re_manage/re_listings_v2.html";
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
    const estate_no = getUrlParameter("no");

    const dataObj = {
        ...adminInfo,
        langCode,
        public_fg: encodeURIComponent(val),
        estate_no,
    };

    const result = await callApi("POST", "/admin/back/04-estate/estate_public_fg_change.php", dataObj);

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
