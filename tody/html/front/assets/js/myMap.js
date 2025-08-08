//==== 맵에서 전역 뷰 저장/불러오기 관련 코드 ====
;(function (global) {
    // 중복 로드 방지
    if (global.applyGlobalViewOnInit && global.attachGlobalViewSaver) return;
    
    //     공용 상태(Global) 동기화 
    // 전역 맵 뷰 저장 키
    const MAP_VIEW_GLOBAL_KEY = 'app:globalMapView:v1';
    const MAP_DEBOUNCE_MS = 200;
  
    // 유틸
    const isValidLatLng = (lat, lng) =>
        Number.isFinite(lat) && Number.isFinite(lng) &&
        lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    // 지도 이동/줌이 끝날 때마다
    // 디바운스(내부 전용: 전역에 노출하지 않음)
    const debounce = (fn, wait = MAP_DEBOUNCE_MS) => {
        let t;
        return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
        };
    };

    // 저장: 기본은 sessionStorage(같은 탭 이동 보장), 필요 시 로컬도 병행 가능 
    //session/local/both 지원
    function saveGlobalMapView({ lat, lng, level }, { persist = 'session' } = {}) {
        if (!isValidLatLng(lat, lng) || level == null) return;
        const payload = JSON.stringify({ lat, lng, level, ts: Date.now() });
        try {
          if (persist === 'local') {
            localStorage.setItem(MAP_VIEW_GLOBAL_KEY, payload);
          } else if (persist === 'both') {
            sessionStorage.setItem(MAP_VIEW_GLOBAL_KEY, payload);
            localStorage.setItem(MAP_VIEW_GLOBAL_KEY, payload);
          } else {
            // 기본: 세션
            sessionStorage.setItem(MAP_VIEW_GLOBAL_KEY, payload);
          }
        } catch {}
    }
    // 로드(같은 탭 우선: session → 없으면 local)
    function loadGlobalMapView() {
        try {
        // 같은 탭 이동이면 sessionStorage가 우선
        const s = sessionStorage.getItem(MAP_VIEW_GLOBAL_KEY) || localStorage.getItem(MAP_VIEW_GLOBAL_KEY);
        if (!s) return null;
        const obj = JSON.parse(s);
        if (isValidLatLng(obj.lat, obj.lng)) return obj;
        } catch (e) {}
        return null;
    }

    
    //페이지에서 초기화 시 즉시 복원
    function applyGlobalViewOnInit(map, {
        fallbackCenter = new kakao.maps.LatLng(37.199537203472, 126.831477350333),// 기본 좌표 (화성시청)
        fallbackLevel = 5,
        persist = 'both' // URL로 들어온 경우에도 dual-write로 동기화
        } = {}) {
            const sp = new URLSearchParams(location.search);
            const urlLat = parseFloat(sp.get('curLat'));
            const urlLng = parseFloat(sp.get('curLng'));
            const urlZoom = parseInt(sp.get('curZoom'), 10);
            // 한국 범위 대략 체크(원하시는 함수로 대체 가능)
            const isValidKorea = (lat, lng) =>
                Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
            // 1) URL 우선: 이미 map 생성 시 URL로 center를 넣으셨다면, 지도는 건드리지 않고 저장만 동기화
            if (isValidKorea(urlLat, urlLng)) {
                const level = Number.isFinite(urlZoom) ? urlZoom : map.getLevel();
                saveGlobalMapView({ lat: urlLat, lng: urlLng, level }, { persist });
                return; // 더 이상 덮어쓰지 않음
            }

            // 2) 스토리지(session → local) 복원
            const s = loadGlobalMapView(); // 이미 session → local 순으로 읽도록 구현되어 있음
            if (s) {
                map.setLevel(s.level ?? fallbackLevel);
                map.setCenter(new kakao.maps.LatLng(s.lat, s.lng));
                return;
            }

            // 3) 쿠키 복원(있다면)
            try {
                const cLat = parseFloat(getCookie('curLat')); // 이미 구현돼 있는 getCookie 재사용
                const cLng = parseFloat(getCookie('curLng'));
                if (isValidKorea(cLat, cLng)) {
                map.setLevel(fallbackLevel);
                map.setCenter(new kakao.maps.LatLng(cLat, cLng));
                // 스토리지 동기화
                saveGlobalMapView({ lat: cLat, lng: cLng, level: map.getLevel() }, { persist });
                return;
                }
            } catch {}

            // 4) 기본값
            map.setLevel(fallbackLevel);
            map.setCenter(fallbackCenter);
        }
    //페이지(또는 모든 페이지)에서 지도 상태 저장(‘idle’+페이지 떠날 때 저장)
    function attachGlobalViewSaver(map, { persist = 'both' } = {}) {
        function flush() {
        const c = map.getCenter();
        const level = map.getLevel();
        saveGlobalMapView({ lat: c.getLat(), lng: c.getLng(), level }, { persist });
        }
        
        kakao.maps.event.addListener(map, 'idle', debounce(flush, MAP_DEBOUNCE_MS));
    
        // 페이지를 떠나기 직전에 마지막 상태 보장
        window.addEventListener('pagehide', flush);
        window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush();
        });
    }
    // 전역에 “필요한 것만” 노출
    global.applyGlobalViewOnInit = applyGlobalViewOnInit;
    global.attachGlobalViewSaver = attachGlobalViewSaver;

    // 사용 안 하는 함수/상수는 제거(가독성/충돌 예방)
    // - DATA_FETCH_DEBOUNCE_MS, attachDataFetcher는 삭제 또는 주석 처리
})(window);
  