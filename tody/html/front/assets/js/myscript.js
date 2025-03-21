/*
function initializeNavLinks() {
    const links = document.getElementsByClassName("header > dl > dd > ul > li > a");

    Array.from(links).forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            Array.from(links).forEach((el) => el.classList.remove("active"));
            event.currentTarget.classList.add("active");
        });
    });
}

// 함수 직접 호출
// menu의 active를 변경하는 함수 
initializeNavLinks();
*/
function setActiveMenu() {
    const links = document.querySelectorAll(".header > dl > dd > ul > li > a");

    links.forEach((link) => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            debugger;
            links.forEach((el) =>  {
                console.log(`${el} 요소에서 active 클래스 제거 전:`, el.classList.contains('active'));
                // active 클래스가 있는 요소 수 확인
                console.log('제거 전 active 클래스 보유 요소 수:', document.querySelectorAll('.active').length);
                el.classList.remove("active");
                console.log(`${el} 요소에서 active 클래스 제거 후:`, el.classList.contains('active'));
                // 제거 후 active 클래스가 있는 요소 수 확인
                console.log('제거 후 active 클래스 보유 요소 수:', document.querySelectorAll('.active').length);
            }
            );
            this.classList.add("active");
        });
    });
}

// ✅ HTML이 로드된 후 `setActiveMenu()` 실행
document.addEventListener("DOMContentLoaded", setActiveMenu);