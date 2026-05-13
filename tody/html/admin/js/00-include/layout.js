// ============================================================
// v2_mode: sessionStorage 사용 — 탭/브라우저 닫으면 자동 초기화
// 최초 접속(sessionStorage 없음) 시 아래 기본값 적용
// ============================================================
const _v2ModeDefault = true; // ← true 로 바꾸면 전체 V2 모드로 전환
const _storedAdminV2Mode = sessionStorage.getItem('admin_v2_mode');
let v2_mode;
if (_storedAdminV2Mode !== null) {
    v2_mode = _storedAdminV2Mode === 'true';
} else {
    v2_mode = _v2ModeDefault;
    sessionStorage.setItem('admin_v2_mode', String(v2_mode));
}
// ============================================================

// layout 관련 js
$(function () {
    // header
    $("header").load("/admin/views/00-include/header", function () {
        const sa_name = decodeURIComponent(getCookie("sa_name"));
        const per_no = decodeURIComponent(getCookie("sa_per_no"));
        $("#profile_user_name").text(sa_name);
        $("#profile_user_name_2").text(sa_name);
        $("#profile_user_role").text("권한" + per_no);

        // [v2 설정 체크박스] 현재 v2_mode 상태 반영
        $("#chkSetv2").prop("checked", v2_mode);

        // [v2 설정 체크박스] 변경 시 sessionStorage 갱신 후 새로고침
        $("#chkSetv2").on("change", function () {
            const checked = $(this).is(":checked");
            sessionStorage.setItem("admin_v2_mode", String(checked));
            location.reload();
        });
    });

    // menu
    $(".app-menu.navbar-menu").load("/admin/views/00-include/menu", function () {
        getMenuInfo(adminUserInfo());
    });

    // footer
    $("footer").load("/admin/views/00-include/footer", function () {
        const year = new Date().getFullYear();
        $("#footer_year").text(year);
    });

    // setting
    $("#theme-settings-offcanvas").load("/admin/views/00-include/setting");
});