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

/*
function setActiveMenu() {
    //const links = document.querySelectorAll(".header > dl > dd > ul > li > a");
    const links = document.querySelectorAll(".menu-item");

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
*/

// JavaScript  : 이 JavaScript 코드는 메뉴 항목을 클릭할 때 해당 li 요소에 active 클래스를 추가하고, 다른 항목의 active 클래스는 제거합니다. 이를 통해 현재 선택된 메뉴 항목을 시각적으로 강조할 수 있습니다.
/*
const menuItems = document.querySelectorAll('li');

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    // 모든 li 요소에서 active 클래스 제거
    menuItems.forEach(i => i.classList.remove('active'));
    
    // 클릭된 li 요소에 active 클래스 추가
    item.classList.add('active');
  });
});
*/

/*
document.addEventListener('DOMContentLoaded', () => {
    // 모든 메뉴 아이템 선택
    const menuItems = document.querySelectorAll('.menu-item'); 

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); // 기본 링크 동작 방지

            // 모든 메뉴 아이템에서 'active' 클래스 제거
            menuItems.forEach(i => i.classList.remove('active'));

            // 클릭된 메뉴 아이템에 'active' 클래스 추가
            item.classList.add('active');
        });
    });
});
*/

   /*
  function initMenuActive() {
   
    const header = document.querySelector('header.header');
    const menuItems = header.querySelectorAll('a.menu-item');
    console.log('initMenuActive 함수 메뉴 아이템 개수:', menuItems.length);
  
    menuItems.forEach(item => {
      item.addEventListener('click', function(event) {
        //event.preventDefault();
        menuItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
      });
      
    });
    
  }
   
  function initMenuActive() {
    const menuItems = document.querySelectorAll('a.menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', function() {
        // 기본 이동 유지
        // active 클래스는 페이지 이동 후 다시 세팅됨
      });
    });
  }
 */

  function initMenuActive() {
    const menuItems = document.querySelectorAll('a.menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', function(event) {
        event.preventDefault();  // 기본 이동 막기
  
        menuItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
  
        // 화면 내용 변경 등 SPA 로직 추가 필요
      });
    });
  }
/*
  function setActiveMenuByUrl() {
    console.log('setActiveMenuByUrl 실행됨');
    const menuItems = document.querySelectorAll('a.menu-item');
    const currentPath = window.location.pathname;
    console.log('현재 경로:', currentPath);
    console.log('메뉴 아이템 개수:', menuItems.length);
  
    menuItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && currentPath.endsWith(href)) {
        item.classList.add('active');
        console.log('활성화 메뉴:', href);
      } else {
        item.classList.remove('active');
      }
    });
  }
    8?
/*
  function setActiveMenuByUrl() {
    console.log('setActiveMenuByUrl 실행됨');
    const menuItems = document.querySelectorAll('a.menu-item');
    const currentPath = window.location.pathname;
    console.log('현재 경로:', currentPath);
    console.log('메뉴 아이템 개수:', menuItems.length);

    menuItems.forEach(item => {
      const href = item.getAttribute('href');
      console.log('메뉴 href:', item.getAttribute('href'));

      // href가 포함된 경로가 현재 경로에 포함되는지 확인 (부분 일치 허용)
      if (href && currentPath.includes(href)) {
        item.classList.add('active');
        console.log('활성화 메뉴:', href);
      } else {
        item.classList.remove('active');
      }
    });
  }
*/
  function getFileName(path) {
    return path.substring(path.lastIndexOf('/') + 1);
  }
  /*
  function setActiveMenuByUrl() {
    console.log('setActiveMenuByUrl 실행됨');
    const currentPath = window.location.pathname;  // 현재 경로 가져오기
    const menuItems = document.querySelectorAll('a.menu-item');
    const currentFile = getFileName(window.location.pathname);
    console.log('현재 경로:', currentPath);
    console.log('메뉴 아이템 개수:', menuItems.length);

    menuItems.forEach(item => {
      const href = item.getAttribute('href');
      const hrefFile = getFileName(href);
  
      if (currentFile === hrefFile) {
        item.classList.add('active');
        console.log('활성화 메뉴:', href);
      } else {
        item.classList.remove('active');
      }
    });
  }
  */

  function setActiveMenuByUrl() {
    const currentPath = window.location.pathname;
    const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  
    // 이후 currentPath 사용
    //console.log('현재 경로:', currentPath);
    //console.log('현재 파일:', currentFile);
  
    const menuItems = document.querySelectorAll('a.menu-item');
    //console.log('메뉴 아이템 개수:', menuItems.length);

    menuItems.forEach(item => {
      const href = item.getAttribute('href');
      if (!href) return;
  
      // 예: 파일명 비교
      const hrefFile = href.substring(href.lastIndexOf('/') + 1);
      const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);
      //console.log('메뉴 href 파일명:', hrefFile);
      
      if (hrefFile === currentFile) {
        item.classList.add('active');
        //console.log('활성화 메뉴:', href);
      } else {
        item.classList.remove('active');
        
      }
    });

    /*
    // index.html 방문 시 기본 메뉴 활성화 예시
    if (currentFile === '' || currentFile === 'index.html') {
      if (menuItems.length > 0) {
        menuItems[0].classList.add('active');
        console.log('기본 메뉴 활성화:', menuItems[0].getAttribute('href'));
      }
    }
      */
  }
  /*
  document.addEventListener('DOMContentLoaded', () => {
    fetch('/front/views/00-include/header.html')  // header.html 실제 경로로 변경하세요
      .then(response => response.text())
      .then(html => {
        const header = document.querySelector('header.header');
        header.innerHTML = html;
        
        const menuItems = document.querySelectorAll('a.menu-item');
        console.log('====메뉴 아이템 개수:', menuItems.length);

        // 메뉴가 삽입된 후 이벤트 리스너 등록
        initMenuActive();
      })
      .catch(error => {
        console.error('header.html 로드 실패:', error);
      });
  });
  */
  document.addEventListener('DOMContentLoaded', () => {
    fetch('/front/views/00-include/header.html')  // 경로 확인 필요
      .then(response => response.text())
      .then(html => {
        const header = document.querySelector('header.header');
        header.innerHTML = html;
  
        // 메뉴 삽입 완료 후에 활성 메뉴 설정 함수 호출
        setActiveMenuByUrl();
      })
      .catch(error => {
        console.error('header.html 로드 실패:', error);
      });
  });