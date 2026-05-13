;(function (global) {
    'use strict';

    // ---- 설정 상수 ----
    var ACCURACY_GOOD     = 80;    // 80m 이하: 충분히 정확 → 감시 즉시 중단
    var CIRCLE_HIDE_MS    = 10000; // 10초 후 정확도 원 제거
    var MAX_WATCH_MS      = 20000; // 20초 후 감시 완전 종료
    var ZOOM_LEVEL        = 3;

    // ---- 상태 변수 ----
    var _overlay      = null;  // 위치 마커 CustomOverlay
    var _circle       = null;  // 정확도 반경 Circle
    var _watchId      = null;  // watchPosition ID
    var _circleTimer  = null;  // 10초: 정확도 원 제거 타이머
    var _watchTimer   = null;  // 20초: 감시 종료 타이머
    var _watching     = false; // 감시 중 여부
    var _lastLat      = null;  // 마지막 위도 (원 제거 후 마커 갱신용)
    var _lastLng      = null;  // 마지막 경도
    var _lastAccuracy = null;  // 마지막 정확도

    // ---- 버튼 active 상태 ----
    function _setBtnActive(active) {
        var btn = document.getElementById('mapMyLocation');
        if (!btn) return;
        var icon = btn.querySelector('i');
        var span = btn.querySelector('span');
        if (active) {
            btn.classList.add('active');
            btn.style.setProperty('background',       '#1e90ff', 'important');
            btn.style.setProperty('background-color', '#1e90ff', 'important');
            btn.style.setProperty('border-color',     '#1e90ff', 'important');
            if (icon) icon.style.setProperty('color', '#fff', 'important');
            if (span) span.style.setProperty('color', '#fff', 'important');
        } else {
            btn.classList.remove('active');
            btn.style.setProperty('background',       '#fff',    'important');
            btn.style.setProperty('background-color', '#fff',    'important');
            btn.style.setProperty('border-color',     '#e9e9e9', 'important');
            if (icon) icon.style.setProperty('color', '#111', 'important');
            if (span) span.style.setProperty('color', '#111', 'important');
        }
    }

    // ---- 전체 정리 ----
    function _clearAll() {
        if (_watchId !== null) {
            navigator.geolocation.clearWatch(_watchId);
            _watchId = null;
        }
        if (_circleTimer) { clearTimeout(_circleTimer); _circleTimer = null; }
        if (_watchTimer)  { clearTimeout(_watchTimer);  _watchTimer  = null; }
        if (_overlay) { _overlay.setMap(null); _overlay = null; }
        if (_circle)  { _circle.setMap(null);  _circle  = null; }
        _watching = false;
        _lastLat = _lastLng = _lastAccuracy = null;
        _setBtnActive(false);
    }

    // ---- 정확도 원만 제거 ----
    function _hideCircle() {
        if (_circle) { _circle.setMap(null); _circle = null; }
        // 원 제거 후 마커 라벨도 "측위 중..." → "±XXXm" 으로 갱신
        if (_overlay && _lastLat !== null) {
            var markerEl = _buildMarkerEl(_lastAccuracy, false);
            _overlay.setContent(markerEl);
        }
    }

    // ---- 정확도에 따른 색상 ----
    function _accuracyColor(accuracy) {
        if (accuracy <= 80)  return '#22c55e'; // 초록: 양호
        if (accuracy <= 300) return '#f59e0b'; // 주황: 보통
        return '#ef4444';                       // 빨강: 불량
    }

    // ---- 마커 HTML 빌드 ----
    function _buildMarkerEl(accuracy, isWatching) {
        var color = _accuracyColor(accuracy);
        var label = isWatching
            ? '측위 중... ±' + Math.round(accuracy) + 'm'
            : '±' + Math.round(accuracy) + 'm';
        var labelBg = isWatching ? 'rgba(0,0,0,0.7)' : 'rgba(30,144,255,0.85)';

        var el = document.createElement('div');
        el.style.cssText = 'position:relative;width:44px;height:44px;pointer-events:none;';
        el.innerHTML =
            '<div style="' +
                'position:absolute;top:-24px;left:50%;transform:translateX(-50%);' +
                'white-space:nowrap;background:' + labelBg + ';color:#fff;' +
                'font-size:10px;line-height:1.4;padding:2px 6px;border-radius:3px;' +
                'font-weight:600;letter-spacing:0.02em;">' + label + '</div>' +
            '<div style="' +
                'position:absolute;top:50%;left:50%;width:44px;height:44px;' +
                'margin:-22px 0 0 -22px;' +
                'background:rgba(30,144,255,0.35);' +
                'border:2px solid rgba(30,144,255,0.6);border-radius:50%;' +
                'box-sizing:border-box;' +
                '-webkit-animation:myLocPulse 1.6s ease-out infinite;' +
                'animation:myLocPulse 1.6s ease-out infinite;"></div>' +
            '<div style="' +
                'position:absolute;top:50%;left:50%;width:16px;height:16px;' +
                'margin:-8px 0 0 -8px;' +
                'background:' + color + ';' +
                'border:3px solid #fff;border-radius:50%;' +
                'box-sizing:border-box;' +
                'box-shadow:0 0 6px rgba(30,144,255,0.9),0 1px 4px rgba(0,0,0,0.35);' +
                '-webkit-animation:myLocBlink 1s ease-in-out infinite;' +
                'animation:myLocBlink 1s ease-in-out infinite;"></div>';
        return el;
    }

    // ---- 마커·원 업데이트 ----
    function _updatePosition(map, lat, lng, accuracy, isWatching) {
        var pos = new kakao.maps.LatLng(lat, lng);
        var markerEl = _buildMarkerEl(accuracy, isWatching);

        // 최근 위치 저장 (원 제거 후 라벨 갱신에 사용)
        _lastLat = lat; _lastLng = lng; _lastAccuracy = accuracy;

        if (_overlay) {
            _overlay.setContent(markerEl);
            _overlay.setPosition(pos);
        } else {
            _overlay = new kakao.maps.CustomOverlay({
                position:  pos,
                content:   markerEl,
                yAnchor:   0.5,
                xAnchor:   0.5,
                zIndex:    100000
            });
            _overlay.setMap(map);
            map.setCenter(pos);
            map.setLevel(ZOOM_LEVEL);
            _setBtnActive(true);
        }

        // 정확도 원: 아직 표시 중인 경우만 업데이트
        if (_circle) {
            _circle.setCenter(pos);
            _circle.setRadius(accuracy);
        } else if (isWatching) {
            // 원이 제거된 뒤에는 새로 그리지 않음
            _circle = new kakao.maps.Circle({
                center:         pos,
                radius:         accuracy,
                strokeWeight:   1,
                strokeColor:    '#1e90ff',
                strokeOpacity:  0.5,
                strokeStyle:    'solid',
                fillColor:      '#1e90ff',
                fillOpacity:    0.10
            });
            _circle.setMap(map);
        }
    }

    // ---- watchPosition 시작 ----
    function _startWatch(map) {
        _watching = true;

        // [1단계] 10초 후: 정확도 원 제거 + 라벨 확정 표시
        _circleTimer = setTimeout(function () {
            _circleTimer = null;
            _hideCircle();
            _watching = false; // 라벨도 "측위 중..." 제거
        }, CIRCLE_HIDE_MS);

        // [2단계] 20초 후: 감시 완전 종료
        _watchTimer = setTimeout(function () {
            _watchTimer = null;
            if (_watchId !== null) {
                navigator.geolocation.clearWatch(_watchId);
                _watchId = null;
            }
            _watching = false;
        }, MAX_WATCH_MS);

        _watchId = navigator.geolocation.watchPosition(
            function (pos) {
                var lat      = pos.coords.latitude;
                var lng      = pos.coords.longitude;
                var accuracy = pos.coords.accuracy;

                _updatePosition(map, lat, lng, accuracy, _watching);

                // 80m 이하 달성 시 즉시 종료 (타이머도 모두 취소)
                if (accuracy <= ACCURACY_GOOD) {
                    navigator.geolocation.clearWatch(_watchId);
                    _watchId = null;
                    if (_circleTimer) { clearTimeout(_circleTimer); _circleTimer = null; }
                    if (_watchTimer)  { clearTimeout(_watchTimer);  _watchTimer  = null; }
                    _watching = false;
                    _hideCircle();                          // 원 즉시 제거
                    _updatePosition(map, lat, lng, accuracy, false); // 최종 마커 확정
                }
            },
            function (err) {
                _clearAll();
                var msg;
                switch (err && err.code) {
                    case 1:
                        msg = '위치 권한이 차단되어 있습니다.\n\n' +
                              '해제 방법:\n' +
                              '1. 주소창 왼쪽 자물쇠(🔒) 아이콘 클릭\n' +
                              '2. "사이트 설정" → 위치 → "허용"\n' +
                              '3. 페이지 새로고침\n\n' +
                              '[Windows PC] 설정 → 개인정보 및 보안 → 위치 → 켜기';
                        break;
                    case 2:
                        msg = '현재 위치를 확인할 수 없습니다.\nWi-Fi 연결 상태를 확인해주세요.';
                        break;
                    case 3:
                        msg = '위치 확인 시간이 초과되었습니다.\n잠시 후 다시 시도해주세요.';
                        break;
                    default:
                        msg = '위치 정보를 가져오는 데 실패했습니다.';
                }
                alert(msg);
            },
            {
                enableHighAccuracy: true,
                timeout:            25000,
                maximumAge:         0
            }
        );
    }

    // ---- 메인 함수 (window.moveToMyLocation 교체) ----
    function moveToMyLocation(map) {
        if (!map) return;

        // 토글: 이미 표시 중이면 제거
        if (_overlay) {
            _clearAll();
            return;
        }

        if (!navigator.geolocation) {
            alert('이 브라우저에서는 위치 정보를 사용할 수 없습니다.');
            return;
        }
        if (location.protocol !== 'https:' &&
            location.hostname !== 'localhost' &&
            location.hostname !== '127.0.0.1') {
            alert('보안 연결(HTTPS)에서만 위치 정보를 사용할 수 있습니다.');
            return;
        }

        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
                if (result.state === 'denied') {
                    alert('위치 권한이 차단되어 있습니다.\n\n' +
                          '해제 방법:\n' +
                          '1. 주소창 왼쪽 자물쇠(🔒) 아이콘 클릭\n' +
                          '2. "사이트 설정" → 위치 → "허용"\n' +
                          '3. 페이지 새로고침');
                    return;
                }
                _startWatch(map);
            }).catch(function () {
                _startWatch(map);
            });
        } else {
            _startWatch(map);
        }
    }

    // myMap.js 이후 로드되어 전역 함수를 교체
    global.moveToMyLocation = moveToMyLocation;

})(window);
