$(document).ready(function () {
    // GSAP 선언 //
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.refresh();

    // 스크롤 처리 //
    // SmoothScroll({
    // 	animationTime : 1200,
    // 	stepSize : 100,
    // 	accelerationDelta : 50,
    // 	accelerationMax : 3,
    // 	touchpadSupport : false,
    // });

    // 화면전환 - 모션 //
    gsap.to(".panel", {
        scaleY: 0,
        duration: 0.6,
        ease: "power4.inOut",
    });

    // 상단영역 //
    $(window).scroll(function () {
        if ($(".header").offset().top > 50) {
            //$('.header').css({ borderBottom : '#e9e9e9 1px solid', background : '#fff' });
        } else {
            //$('.header').css({ borderBottom : 'none', background : 'none' });
        }
    });

    // AOS 모션 //
    AOS.init({
        duration: 1200,
    });

    // // 삽니다 - 등록 - 이미지
    // var swiper = new Swiper(".fw-file", {
    //     slidesPerView: "auto",
    //     spaceBetween: 15,
    // });

    // 파일첨부 - 이미지 미리보기 //
    var fileTarget = $(".file-box .upload-hidden");
    fileTarget.on("change", function () {
        if (window.FileReader) {
            var filename = $(this)[0].files[0].name;
        } else {
            var filename = $(this).val().split("/").pop().split("\\").pop();
        }
        $(this).siblings(".upload-name").val(filename);
    });
    var imgTarget = $(".preview-image .upload-hidden");
    imgTarget.on("change", function () {
        var parent = $(this).parent();
        parent.children(".upload-display").remove();
        if (window.FileReader) {
            if (!$(this)[0].files[0].type.match(/image\//)) return;
            var reader = new FileReader();
            reader.onload = function (e) {
                var src = e.target.result;
                parent.prepend('<div class="upload-display"><div class="upload-thumb-wrap"><img src="' + src + '" class="upload-thumb"></div></div>');
            };
            reader.readAsDataURL($(this)[0].files[0]);
        } else {
            $(this)[0].select();
            $(this)[0].blur();
            var imgSrc = document.selection.createRange().text;
            parent.prepend('<div class="upload-display"><div class="upload-thumb-wrap"><img class="upload-thumb"></div></div>');
            var img = $(this).siblings(".upload-display").find("img");
            img[0].style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enable='true',sizingMethod='scale',src=\"" + imgSrc + '")';
        }
    });

    // 달력 - 한글처리 //
    $.datepicker.regional["ko"] = {
        closeText: "닫기",
        prevText: "이전달",
        nextText: "다음달",
        currentText: "오늘",
        monthNames: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
        monthNamesShort: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
        dayNames: ["일", "월", "화", "수", "목", "금", "토"],
        dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
        dayNamesMin: ["일", "월", "화", "수", "목", "금", "토"],
        weekHeader: "Wk",
        dateFormat: "yy-mm-dd",
        firstDay: 0,
        isRTL: false,
        duration: 200,
        //showAnim:'show',
        showMonthAfterYear: true,
        yearSuffix: "년",
    };
    $.datepicker.setDefaults($.datepicker.regional["ko"]);
});
