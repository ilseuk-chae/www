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