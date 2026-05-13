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

  function getFileName(path) {
    return path.substring(path.lastIndexOf('/') + 1);
  }
  

  function setActiveMenuByUrl() {
    const currentPath = window.location.pathname;
    const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  
    const menuItems = document.querySelectorAll('a.menu-item');
   
    menuItems.forEach(item => {
      const href = item.getAttribute('href');
      if (!href) return;
  
      // 예: 파일명 비교
      const hrefFile = href.substring(href.lastIndexOf('/') + 1);
      const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);
            
      if (hrefFile === currentFile) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
        
      }
    });

  }
  
  document.addEventListener('DOMContentLoaded', () => {
    
    // Fetch API를 사용하여 헤더 HTML 파일을 비동기적으로 불러옵니다.
    fetch('/front/views/00-include/header.html') // 헤더 HTML 파일 경로
      // 응답을 받으면 상태를 확인하고 arrayBuffer로 변환하는 Promise를 반환
      .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.arrayBuffer(); // 응답 본문을 arrayBuffer로 받음
      })
      // arrayBuffer를 받으면 디코딩하여 HTML 문자열을 얻고 처리
      .then(buffer => {
        const decoder = new TextDecoder('utf-8'); // UTF-8 디코더 생성
        let html = decoder.decode(buffer); // UTF-8로 디코딩하여 문자열 얻음

        // (선택 사항) BOM 문자 제거 - 필요하다면 사용
        if (html.charCodeAt(0) === 0xFEFF) {
            console.warn(">>> BOM 문자 감지됨. 문자열에서 제거합니다.");
            html = html.substring(1);
        }

        
        // 헤더 내용을 받아온 후, 페이지의 header 요소에 삽입합니다.
        const headerElement = document.querySelector('header.header'); // <header class="header"> 요소를 선택합니다.
        if (headerElement) { // header 요소가 존재하는지 확인합니다.
            // **Fetch로 얻은 올바른 HTML 문자열로 header 내부의 기존 내용을 모두 교체합니다.**
            
            headerElement.innerHTML = html;
            // 기본 HTML 로드 및 삽입이 완료되었음을 신호합니다.
           
            setTimeout(() => {
                headerBaseHtmlLoadedDeferred.resolve(); // 기본 HTML 로드 및 삽입이 완료되었음을 신호합니다.
                
            }, 10);
        } else {
            console.error('DOMContentLoaded: Header element (header.header) not found.');
            // 헤더 요소가 없으면 실패 신호
            headerBaseHtmlLoadedDeferred.reject(new Error('Header element not found'));
        }
    })
    .catch(error => {
      console.error('DOMContentLoaded: header.html 로드 또는 처리 실패:', error);
      // Fetch 또는 처리 실패 시 실패 신호
      headerBaseHtmlLoadedDeferred.reject(error);
    });
    
});