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
    // ===== 현재 위치 찾기 =====
    let _myLocationMarker = null;
    let _myLocationOverlay = null;

    // 애니메이션 keyframes 동적 주입 (CSS 파일 로드 실패/우선순위 이슈 대비)
    function _ensureMyLocationKeyframes() {
        if (document.getElementById('my-location-keyframes')) return;
        const style = document.createElement('style');
        style.id = 'my-location-keyframes';
        style.textContent =
            '@-webkit-keyframes myLocPulse{0%{-webkit-transform:scale(0.4);transform:scale(0.4);opacity:1}100%{-webkit-transform:scale(2);transform:scale(2);opacity:0}}' +
            '@keyframes myLocPulse{0%{-webkit-transform:scale(0.4);transform:scale(0.4);opacity:1}100%{-webkit-transform:scale(2);transform:scale(2);opacity:0}}' +
            '@-webkit-keyframes myLocBlink{0%,100%{opacity:1}50%{opacity:0.45}}' +
            '@keyframes myLocBlink{0%,100%{opacity:1}50%{opacity:0.45}}';
        document.head.appendChild(style);
    }

    // 버튼 시각 상태를 인라인 스타일로 직접 제어 (CSS 캐시/특이성 이슈 완전 우회)
    function _setMyLocationBtnActive(active) {
        const btn = document.getElementById('mapMyLocation');
        if (!btn) return;
        const icon = btn.querySelector('i');
        const span = btn.querySelector('span');
        if (active) {
            btn.classList.add('active');
            btn.style.setProperty('background', '#1e90ff', 'important');
            btn.style.setProperty('background-color', '#1e90ff', 'important');
            btn.style.setProperty('border-color', '#1e90ff', 'important');
            if (icon) icon.style.setProperty('color', '#ffffff', 'important');
            if (span) span.style.setProperty('color', '#ffffff', 'important');
        } else {
            btn.classList.remove('active');
            btn.style.setProperty('background', '#ffffff', 'important');
            btn.style.setProperty('background-color', '#ffffff', 'important');
            btn.style.setProperty('border-color', '#e9e9e9', 'important');
            if (icon) icon.style.setProperty('color', '#111111', 'important');
            if (span) span.style.setProperty('color', '#111111', 'important');
        }
        if (btn.blur) btn.blur();
    }

    // 현재 위치 마커 제거 + 버튼 active 해제
    function _clearMyLocation() {
        if (_myLocationOverlay) {
            _myLocationOverlay.setMap(null);
            _myLocationOverlay = null;
        }
        if (_myLocationMarker) {
            _myLocationMarker.setMap(null);
            _myLocationMarker = null;
        }
        _setMyLocationBtnActive(false);
    }

    /**
     * 브라우저 Geolocation API로 현재 위치를 찾아 지도 이동 + 마커 표시
     * @param {kakao.maps.Map} map - 카카오맵 객체
     * @param {object} opts
     * @param {number} opts.level - 이동 후 줌 레벨 (기본 3)
     */
    function moveToMyLocation(map, { level = 3 } = {}) {
        if (!map) {
            console.error('카카오맵 객체가 초기화되지 않았습니다.');
            return;
        }

        // 토글: 이미 표시되어 있으면 제거하고 종료
        if (_myLocationOverlay) {
            _clearMyLocation();
            return;
        }

        if (!navigator.geolocation) {
            alert('이 브라우저에서는 위치 정보를 사용할 수 없습니다.');
            return;
        }

        // HTTPS가 아니면 대부분의 브라우저가 Geolocation을 차단
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            alert('보안 연결(HTTPS)에서만 위치 정보를 사용할 수 있습니다.');
            return;
        }

        // 애니메이션 keyframes 보장
        _ensureMyLocationKeyframes();

        function onSuccess(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const locPosition = new kakao.maps.LatLng(lat, lng);

            // 지도 이동
            map.setCenter(locPosition);
            map.setLevel(level);

            // 기존 마커/오버레이 제거
            if (_myLocationMarker) _myLocationMarker.setMap(null);
            if (_myLocationOverlay) _myLocationOverlay.setMap(null);

            // 현재 위치 마커 (파란 점 + 펄스 애니메이션)
            // 모바일 호환성을 위해 핵심 스타일은 인라인으로 작성
            const markerContent = document.createElement('div');
            markerContent.className = 'my-location-marker';
            markerContent.style.cssText =
                'position:relative;width:44px;height:44px;pointer-events:none;';
            markerContent.innerHTML =
                '<div class="my-loc-pulse" style="' +
                    'position:absolute;top:50%;left:50%;width:44px;height:44px;' +
                    'margin:-22px 0 0 -22px;' +
                    'background:rgba(30,144,255,0.35);' +
                    'border:2px solid rgba(30,144,255,0.6);' +
                    'border-radius:50%;' +
                    'box-sizing:border-box;' +
                    '-webkit-animation:myLocPulse 1.6s ease-out infinite;' +
                    'animation:myLocPulse 1.6s ease-out infinite;' +
                '"></div>' +
                '<div class="my-loc-dot" style="' +
                    'position:absolute;top:50%;left:50%;width:16px;height:16px;' +
                    'margin:-8px 0 0 -8px;' +
                    'background:#1e90ff;' +
                    'border:3px solid #fff;' +
                    'border-radius:50%;' +
                    'box-sizing:border-box;' +
                    'box-shadow:0 0 6px rgba(30,144,255,0.9),0 1px 4px rgba(0,0,0,0.35);' +
                    '-webkit-animation:myLocBlink 1s ease-in-out infinite;' +
                    'animation:myLocBlink 1s ease-in-out infinite;' +
                '"></div>';

            _myLocationOverlay = new kakao.maps.CustomOverlay({
                position: locPosition,
                content: markerContent,
                yAnchor: 0.5,
                xAnchor: 0.5,
                zIndex: 100000
            });
            _myLocationOverlay.setMap(map);

            // 버튼 active 표시 (인라인 스타일로 직접 적용)
            _setMyLocationBtnActive(true);

            //console.log('[moveToMyLocation] 마커 표시 완료', { lat, lng });
        }

        function onError(err) {
            let msg;
            switch (err && err.code) {
                case 1: // PERMISSION_DENIED
                    msg = '위치 권한이 차단되어 있습니다.\n브라우저 주소창 좌측의 자물쇠 아이콘에서 “위치 허용”으로 변경해주세요.';
                    break;
                case 2: // POSITION_UNAVAILABLE
                    msg = '현재 위치를 확인할 수 없습니다.\n네트워크(Wi-Fi) 연결 상태를 확인해주세요.';
                    break;
                case 3: // TIMEOUT
                    msg = '위치 확인 시간이 초과되었습니다.\n잠시 후 다시 시도해주세요.';
                    break;
                default:
                    msg = '위치 정보를 가져오는 데 실패했습니다.\n브라우저의 위치 권한을 확인해주세요.';
            }
            console.warn('[moveToMyLocation] geolocation error:', err);
            alert(msg);
        }

        // 모바일 감지
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

        let settled = false;
        const finish = (cb) => { if (!settled) { settled = true; cb(); } };

        // 캐시된 위치 우선 시도 (있으면 즉시 반환, 없으면 1~2초 내 에러)
        // 모바일 첫 호출 시 10초 대기 없이 빠르게 실패 → 고정밀로 전환
        navigator.geolocation.getCurrentPosition(
            function (pos) { finish(() => onSuccess(pos)); },
            function (err1) {
                console.warn('[moveToMyLocation] 1차(캐시/저정밀) 실패:', err1);
                // 권한 거부는 재시도해도 동일
                if (err1 && err1.code === 1) {
                    finish(() => onError(err1));
                    return;
                }
                // 2차: 고정밀(GPS) — 모바일 첫 측위는 시간 소요
                navigator.geolocation.getCurrentPosition(
                    function (pos) { finish(() => onSuccess(pos)); },
                    function (err2) {
                        console.warn('[moveToMyLocation] 2차(고정밀) 실패:', err2);
                        finish(() => onError(err2));
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 25000,
                        // 5분 이내 캐시가 있으면 재사용 → 재호출 시 즉시 반환
                        maximumAge: 300000
                    }
                );
            },
            {
                // 모바일: 저정밀을 3초만 대기 후 바로 고정밀로 — 체감속도 개선
                // PC: 10초 대기 (WiFi/IP 측위가 주력)
                enableHighAccuracy: false,
                timeout: isMobile ? 3000 : 10000,
                // 5분 이내 캐시 재사용 → 페이지 이동 후 재호출 시 즉시 반환
                maximumAge: 300000
            }
        );
    }

    // ===== 지도 옵션 버튼 active 시 파란색 인라인 스타일 주입 =====
    // (모바일 브라우저에서 CSS .active 규칙이 적용 안 되는 이슈 우회)
    const _MAP_OPT_ACTIVE_IDS = [
        'mapOptionTooltip',
        'mapOptionAreaOpen',
        'mapOptionBoundary',
        'mapOptionMemoOpen',
        'mapOptionMemoOpen2'
    ];
    function _applyMapOptBtnStyle(btn) {
        if (!btn) return;
        const isActive = btn.classList.contains('active');
        if (isActive) {
            btn.style.setProperty('background', '#1e90ff', 'important');
            btn.style.setProperty('background-color', '#1e90ff', 'important');
            btn.style.setProperty('border-color', '#1e90ff', 'important');
            btn.querySelectorAll('i, span').forEach(function (el) {
                el.style.setProperty('color', '#ffffff', 'important');
            });
        } else {
            // 명시적으로 원래 색 지정 (모바일에서 removeProperty가 즉시 반영 안 되는 이슈)
            btn.style.setProperty('background', '#ffffff', 'important');
            btn.style.setProperty('background-color', '#ffffff', 'important');
            btn.style.setProperty('border-color', '#e9e9e9', 'important');
            btn.querySelectorAll('i, span').forEach(function (el) {
                el.style.setProperty('color', '#111111', 'important');
            });
        }
        // 강제 리플로우(repaint) — 모바일 Safari/Chrome 일부 케이스에서 필요
        void btn.offsetHeight;
    }
    function _initMapOptBtnActiveObserver() {
        _MAP_OPT_ACTIVE_IDS.forEach(function (id) {
            const btn = document.getElementById(id);
            if (!btn) return;
            _applyMapOptBtnStyle(btn); // 초기 상태 반영
            const mo = new MutationObserver(function (mutations) {
                for (let i = 0; i < mutations.length; i++) {
                    if (mutations[i].attributeName === 'class') {
                        _applyMapOptBtnStyle(btn);
                        break;
                    }
                }
            });
            mo.observe(btn, { attributes: true, attributeFilter: ['class'] });
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _initMapOptBtnActiveObserver);
    } else {
        _initMapOptBtnActiveObserver();
    }

    // ===== 지역현황 버튼 active 자동 토글 =====
    // .mo-area 내부 체크박스 중 하나라도 체크되면 #mapOptionAreaOpen 에 .active 부여
    function _syncAreaOpenActive() {
        const btn = document.getElementById('mapOptionAreaOpen');
        if (!btn) return;
        const area = document.querySelector('.mo-area');
        if (!area) return;
        const anyChecked = !!area.querySelector('input[type="checkbox"]:checked');
        btn.classList.toggle('active', anyChecked);
    }
    function _initAreaOpenActiveSync() {
        const area = document.querySelector('.mo-area');
        if (!area) return;
        area.addEventListener('change', function (e) {
            if (e.target && e.target.matches('input[type="checkbox"]')) {
                _syncAreaOpenActive();
            }
        });
        _syncAreaOpenActive(); // 초기 상태 반영
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _initAreaOpenActiveSync);
    } else {
        _initAreaOpenActiveSync();
    }

    // 전역에 “필요한 것만” 노출
    global.applyGlobalViewOnInit = applyGlobalViewOnInit;
    global.attachGlobalViewSaver = attachGlobalViewSaver;
    global.moveToMyLocation = moveToMyLocation;

    // 사용 안 하는 함수/상수는 제거(가독성/충돌 예방)
    // - DATA_FETCH_DEBOUNCE_MS, attachDataFetcher는 삭제 또는 주석 처리
})(window);
  