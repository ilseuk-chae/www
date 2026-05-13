(function () {
    const TILESET_NAME = 'NATIONAL_ENV_TILE';
    const TILE_SIZE = 256;
    const LOCAL_TILE_ENDPOINTS = {
        nem_ecvam: '/front/back/analysis/national_env_tile.php',
        slope: '/front/back/analysis/slope_tile.php',
        elevation: '/front/back/analysis/elevation_tile.php',
    };
    const LOCAL_TILE_DATA_URL = '/front/back/analysis/national_env_tile_api.php';
    const TILE_BOUNDARY_EPSILON = 2; // 기본 겹침 폭(m)
    const NATIONAL_ENV_TILE_EVENT = 'nationalEnvTileData';
    const DEFAULT_LAYER_ID = 'nem_ecvam';
    const NATIONAL_ENV_LAYER_CATALOG = Object.freeze([
        { id: 'nem_ecvam', label: '국토환경성평가지도', category: '국토환경성평가지도' },
        { id: 'slope', label: '경사도', category: '경사도' },
        { id: 'elevation', label: '표고도', category: '표고도' },
    ]);
    const NATIONAL_ENV_LAYER_LOOKUP = NATIONAL_ENV_LAYER_CATALOG.reduce((acc, layer) => {
        acc[layer.id] = layer;
        return acc;
    }, {});
    const WTM_EPSG = 'EPSG:5179';
    const WGS84_EPSG = 'EPSG:4326';
    const WEB_MERCATOR_EPSG = 'EPSG:3857';
    const NATIONAL_ENV_EPSG = 'EPSG:5186';
    const WTM_OFFSET_X = 30000;
    const WTM_OFFSET_Y = 60000;
    if (typeof proj4 === 'function' && !proj4.defs(WTM_EPSG)) {
        proj4.defs(
            WTM_EPSG,
            '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs'
        );
    }

    const state = {
        isActive: false,
        layerId: DEFAULT_LAYER_ID,
        layerRequestToken: 0,
        debounceTimer: null,
        listenersInitialized: false,
        tilesetMapTypeId: null,
        tilesetRegistered: false,
        lastZoomLevel: null,
        tileDataCache: new Map(),
        tileDataRequests: new Map(),
        tileRequestControllers: new Map(),
        tileObjectUrls: new Map(),
    };
    const debugState = {
        enabled: false,
        overlay: null,
        labelOverlay: null,
    };

    function addNationalEnvWMSTileLayer() {
        if (!canUseNationalEnvLayer()) {
            console.warn('국토환경성평가지도 레이어를 초기화할 수 없습니다.');
            return;
        }

        initializeInteractionListeners();
        if (typeof map !== 'undefined' && map && typeof map.getLevel === 'function') {
            state.lastZoomLevel = map.getLevel();
        } else {
            state.lastZoomLevel = null;
        }
        registerNationalEnvTileset();
        attachNationalEnvTileset();
        state.isActive = true;
    }

    function removeNationalEnvWMSTileLayer() {
        if (!state.isActive || !canUseNationalEnvLayer()) {
            return;
        }

        state.layerRequestToken += 1;
        if (state.tilesetMapTypeId) {
            map.removeOverlayMapTypeId(state.tilesetMapTypeId);
            state.tilesetMapTypeId = null;
        }
        state.isActive = false;
        if (state.debounceTimer) {
            clearTimeout(state.debounceTimer);
            state.debounceTimer = null;
        }
        state.lastZoomLevel = null;
        cancelAllTileRequests();
        clearNationalEnvTileData();
    }

    function isNationalEnvLayerActive() {
        return state.isActive;
    }

    function canUseNationalEnvLayer() {
        return typeof kakao !== 'undefined' && kakao.maps && typeof map !== 'undefined';
    }

    function initializeInteractionListeners() {
        if (state.listenersInitialized || !canUseNationalEnvLayer()) {
            return;
        }

        const scheduleReload = () => {
            if (!state.isActive) {
                return;
            }

            if (state.debounceTimer) {
                clearTimeout(state.debounceTimer);
            }

            state.debounceTimer = setTimeout(() => {
                const currentLevel = typeof map.getLevel === 'function' ? map.getLevel() : null;
                if (typeof currentLevel === 'number') {
                    if (state.lastZoomLevel !== null && state.lastZoomLevel === currentLevel) {
                        state.debounceTimer = null;
                        return;
                    }
                    state.lastZoomLevel = currentLevel;
                }

                refreshNationalEnvLayer();
                state.debounceTimer = null;
            }, 400);
        };

        ['zoom_changed', 'center_changed'].forEach((eventName) => {
            kakao.maps.event.addListener(map, eventName, scheduleReload);
        });
        kakao.maps.event.addListener(map, 'dragstart', scheduleReload);
        state.listenersInitialized = true;
    }

    function registerNationalEnvTileset() {
        if (state.tilesetRegistered || !canUseNationalEnvLayer()) {
            return;
        }

        kakao.maps.Tileset.add(
            TILESET_NAME,
            new kakao.maps.Tileset({
                width: TILE_SIZE,
                height: TILE_SIZE,
                getTile: function (x, y, z) {
                    const container = document.createElement('div');
                    container.style.position = 'relative';
                    container.style.width = `${TILE_SIZE}px`;
                    container.style.height = `${TILE_SIZE}px`;

                    const image = document.createElement('img');
                    image.width = TILE_SIZE;
                    image.height = TILE_SIZE;
                    image.alt = '국토환경성평가지도';
                    image.loading = 'lazy';
                    image.decoding = 'async';
                    image.style.opacity = '0.75';
                    container.appendChild(image);

                    if (shouldDebugTiles()) {
                        const label = document.createElement('div');
                        label.style.position = 'absolute';
                        label.style.top = '0';
                        label.style.left = '0';
                        label.style.width = '100%';
                        label.style.height = '100%';
                        label.style.fontSize = '14px';
                        label.style.fontWeight = 'bold';
                        label.style.lineHeight = `${TILE_SIZE}px`;
                        label.style.textAlign = 'center';
                        label.style.color = '#4D4D4D';
                        label.style.border = '1px dashed #ff5050';
                        label.style.pointerEvents = 'none';
                        label.textContent = `z:${z} x:${x} y:${y}`;
                        container.appendChild(label);
                    }

                    if (!map) {
                        return container;
                    }

                    loadTileImage({ tile: image, x, y, z });
                    return container;
                },
            })
        );

        state.tilesetRegistered = true;
    }

    function attachNationalEnvTileset() {
        const mapTypeId = canUseNationalEnvLayer() ? kakao.maps.MapTypeId[TILESET_NAME] : null;
        if (mapTypeId) {
            map.addOverlayMapTypeId(mapTypeId);
            state.tilesetMapTypeId = mapTypeId;
        }
    }

    function loadTileImage({ tile, x, y, z }) {
        const activeLayerId = resolveLayerId();
        const bbox = computeTileBbox(x, y, z);
        const overlapMeters = resolveTileBoundaryEpsilon(z);
        const wtmBounds = expandBounds(computeTileBoundsWTM(x, y, z), overlapMeters);

        const localUrl = buildLocalTileImageUrl({ x, y, z, layerId: activeLayerId, bounds: wtmBounds });
        emitDebugTileInfo({ x, y, z, bbox, url: localUrl });
        const requestToken = state.layerRequestToken;
        loadTileImageFromUrl(tile, localUrl, requestToken);
        // 통계값은 현재 미사용이므로 호출을 보류합니다.
        // fetchLocalTileGradeData({ x, y, z, layerId: activeLayerId });
    }

    function buildLocalTileImageUrl({ x, y, z, layerId, bounds }) {
        const endpoint = LOCAL_TILE_ENDPOINTS[layerId] || LOCAL_TILE_ENDPOINTS[DEFAULT_LAYER_ID];
        const params = new URLSearchParams({
            x: String(typeof x === 'number' ? x : 0),
            y: String(typeof y === 'number' ? y : 0),
            z: String(typeof z === 'number' ? z : 0),
            layer: layerId || DEFAULT_LAYER_ID,
        });
        const conversion = convertBoundsForLayer(layerId, bounds);
        const bboxParam = formatBoundsParam(conversion ? conversion.bounds : null);
        if (bboxParam) {
            params.set('bbox', bboxParam);
            if (conversion && conversion.srid) {
                params.set('bbox_srid', String(conversion.srid));
            }
        }
        return `${endpoint}?${params.toString()}`;
    }

    function buildLocalTileDataUrl({ x, y, z, layerId, bounds }) {
        const params = new URLSearchParams({
            x: String(typeof x === 'number' ? x : 0),
            y: String(typeof y === 'number' ? y : 0),
            z: String(typeof z === 'number' ? z : 0),
            layer: layerId || DEFAULT_LAYER_ID,
        });
        const conversion = convertBoundsForLayer(layerId, bounds);
        const bboxParam = formatBoundsParam(conversion ? conversion.bounds : null);
        if (bboxParam) {
            params.set('bbox', bboxParam);
            if (conversion && conversion.srid) {
                params.set('bbox_srid', String(conversion.srid));
            }
        }
        return `${LOCAL_TILE_DATA_URL}?${params.toString()}`;
    }

    function loadTileImageFromUrl(tile, url, requestToken) {
        if (!tile || !url) {
            return;
        }
        const effectiveToken = typeof requestToken === 'number' ? requestToken : state.layerRequestToken;

        if (typeof fetch !== 'function' || typeof AbortController === 'undefined') {
            if (effectiveToken === state.layerRequestToken) {
                tile.src = url;
            }
            return;
        }

        cancelTileRequest(tile);

        const controller = new AbortController();
        state.tileRequestControllers.set(tile, controller);

        fetch(url, { signal: controller.signal, cache: 'no-store' })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`NATIONAL_ENV_TILE_HTTP_${response.status}`);
                }
                return response.blob();
            })
            .then((blob) => {
                state.tileRequestControllers.delete(tile);
                if (effectiveToken !== state.layerRequestToken) {
                    return;
                }
                const objectUrl = URL.createObjectURL(blob);
                assignTileImage(tile, objectUrl, effectiveToken);
            })
            .catch((error) => {
                state.tileRequestControllers.delete(tile);
                if (error && error.name === 'AbortError') {
                    return;
                }
                console.warn('[국토환경] 타일 이미지를 불러오지 못했습니다.', error);
                if (effectiveToken === state.layerRequestToken) {
                    tile.src = url;
                }
            });
    }

    function assignTileImage(tile, objectUrl, requestToken) {
        if (!tile || !objectUrl || requestToken !== state.layerRequestToken) {
            return;
        }

        const previousUrl = state.tileObjectUrls.get(tile);
        if (previousUrl) {
            try {
                URL.revokeObjectURL(previousUrl);
            } catch (error) {
                console.warn('[국토환경] 이전 타일 URL 해제 실패', error);
            }
        }

        tile.src = objectUrl;
        state.tileObjectUrls.set(tile, objectUrl);
    }

    function cancelTileRequest(tile) {
        if (!tile) {
            return;
        }

        const controller = state.tileRequestControllers.get(tile);
        if (controller && typeof controller.abort === 'function') {
            try {
                controller.abort();
            } catch (error) {
                console.warn('[국토환경] 타일 요청 중단 실패', error);
            }
        }
        state.tileRequestControllers.delete(tile);

        const previousUrl = state.tileObjectUrls.get(tile);
        if (previousUrl) {
            try {
                URL.revokeObjectURL(previousUrl);
            } catch (error) {
                console.warn('[국토환경] 타일 URL 해제 실패', error);
            }
            state.tileObjectUrls.delete(tile);
        }
    }

    function cancelAllTileRequests() {
        if (!state.tileRequestControllers || state.tileRequestControllers.size === 0) {
            return;
        }

        Array.from(state.tileRequestControllers.keys()).forEach((tile) => {
            cancelTileRequest(tile);
        });
    }

    function fetchLocalTileGradeData({ x, y, z, layerId }) {
        if (typeof fetch !== 'function') {
            return null;
        }

        const cacheKey = buildTileDataCacheKey(layerId, x, y, z);
        if (state.tileDataCache.has(cacheKey)) {
            emitTileGradeData(state.tileDataCache.get(cacheKey));
            return state.tileDataCache.get(cacheKey);
        }

        if (state.tileDataRequests.has(cacheKey)) {
            return state.tileDataRequests.get(cacheKey);
        }

        const overlapMeters = resolveTileBoundaryEpsilon(z);
        const url = buildLocalTileDataUrl({
            x,
            y,
            z,
            layerId,
            bounds: expandBounds(computeTileBoundsWTM(x, y, z), overlapMeters),
        });
        const request = fetch(url, {
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                Accept: 'application/json',
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`NATIONAL_ENV_TILE_DATA_HTTP_${response.status}`);
                }
                return response.json();
            })
            .then((payload) => {
                const detail = {
                    ...payload,
                    x,
                    y,
                    z,
                    layer: layerId || DEFAULT_LAYER_ID,
                };

                if (payload && payload.success) {
                    state.tileDataCache.set(cacheKey, detail);
                    emitTileGradeData(detail);
                    return detail;
                }

                throw new Error(payload && payload.message ? payload.message : 'NATIONAL_ENV_TILE_DATA_FAILED');
            })
            .catch((error) => {
                console.warn('[국토환경] 타일 통계 정보를 불러오지 못했습니다.', error);
                return null;
            })
            .finally(() => {
                state.tileDataRequests.delete(cacheKey);
            });

        state.tileDataRequests.set(cacheKey, request);
        return request;
    }

    function emitTileGradeData(detail) {
        if (!detail) {
            return;
        }

        if (shouldDebugTiles()) {
            console.log('[국토환경] 타일 통계', detail);
        }

        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            try {
                window.dispatchEvent(new CustomEvent(NATIONAL_ENV_TILE_EVENT, { detail }));
            } catch (error) {
                console.warn('[국토환경] 타일 통계 이벤트 전송에 실패했습니다.', error);
            }
        }
    }

    function buildTileDataCacheKey(layerId, x, y, z) {
        return `${layerId || DEFAULT_LAYER_ID}:${z}:${x}:${y}`;
    }

    function computeTileBbox(x, y, z) {
        if (typeof proj4 !== 'function') {
            return null;
        }

        const topLeft = tileCoordsToWTM(x, y, z);
        const bottomLeft = tileCoordsToWTM(x, y + 1, z);
        const topRight = tileCoordsToWTM(x + 1, y, z);

        const minX = Math.min(topLeft.x, topRight.x);
        const maxX = Math.max(topLeft.x, topRight.x);
        const minY = Math.min(bottomLeft.y, topLeft.y);
        const maxY = Math.max(bottomLeft.y, topLeft.y);

        const wgsSouthWest = proj4(WTM_EPSG, WGS84_EPSG, [minX, minY]);
        const wgsNorthEast = proj4(WTM_EPSG, WGS84_EPSG, [maxX, maxY]);
        const mercSouthWest = proj4(WGS84_EPSG, WEB_MERCATOR_EPSG, wgsSouthWest);
        const mercNorthEast = proj4(WGS84_EPSG, WEB_MERCATOR_EPSG, wgsNorthEast);

        return {
            minX: Math.min(mercSouthWest[0], mercNorthEast[0]),
            minY: Math.min(mercSouthWest[1], mercNorthEast[1]),
            maxX: Math.max(mercSouthWest[0], mercNorthEast[0]),
            maxY: Math.max(mercSouthWest[1], mercNorthEast[1]),
            wgs84: {
                southWest: { lat: wgsSouthWest[1], lng: wgsSouthWest[0] },
                northEast: { lat: wgsNorthEast[1], lng: wgsNorthEast[0] },
            },
        };
    }

    function tileCoordsToWTM(tileX, tileY, level) {
        const scale = Math.pow(2, level - 3);
        return {
            x: tileX * scale * TILE_SIZE - WTM_OFFSET_X,
            y: tileY * scale * TILE_SIZE - WTM_OFFSET_Y,
        };
    }

    function computeTileBoundsWTM(x, y, z) {
        const topLeft = tileCoordsToWTM(x, y, z);
        const bottomRight = tileCoordsToWTM(x + 1, y + 1, z);
        return {
            minX: Math.min(topLeft.x, bottomRight.x),
            minY: Math.min(bottomRight.y, topLeft.y),
            maxX: Math.max(topLeft.x, bottomRight.x),
            maxY: Math.max(bottomRight.y, topLeft.y),
        };
    }

    function expandBounds(bounds, epsilon = TILE_BOUNDARY_EPSILON) {
        if (!bounds || typeof epsilon !== 'number' || !Number.isFinite(epsilon) || epsilon <= 0) {
            return bounds;
        }
        return {
            minX: bounds.minX - epsilon,
            minY: bounds.minY - epsilon,
            maxX: bounds.maxX + epsilon,
            maxY: bounds.maxY + epsilon,
        };
    }

    function resolveTileBoundaryEpsilon(zoomLevel) {
        if (typeof zoomLevel !== 'number' || !Number.isFinite(zoomLevel)) {
            return TILE_BOUNDARY_EPSILON;
        }
        if (zoomLevel <= 4) {
            return 12; // 저배율에서는 더욱 넓은 겹침
        }
        if (zoomLevel <= 7) {
            return 4;
        }
        return TILE_BOUNDARY_EPSILON;
    }

    function convertBoundsForLayer(layerId, bounds) {
        if (!bounds) {
            return null;
        }

        if (layerId === 'elevation') {
            return {
                srid: 4326,
                bounds: convertBoundsToEPSG4326(bounds),
            };
        }

        return {
            srid: 5186,
            bounds: convertBoundsToEPSG5186(bounds),
        };
    }

    function convertBoundsToEPSG5186(bounds) {
        if (!bounds || typeof proj4 !== 'function') {
            return null;
        }

        const corners = [
            [bounds.minX, bounds.minY],
            [bounds.minX, bounds.maxY],
            [bounds.maxX, bounds.minY],
            [bounds.maxX, bounds.maxY],
        ].map((coord) => proj4(WTM_EPSG, NATIONAL_ENV_EPSG, coord));

        const xs = corners.map((item) => item[0]);
        const ys = corners.map((item) => item[1]);

        return {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys),
        };
    }

    function convertBoundsToEPSG4326(bounds) {
        if (!bounds || typeof proj4 !== 'function') {
            return null;
        }

        const corners = [
            [bounds.minX, bounds.minY],
            [bounds.minX, bounds.maxY],
            [bounds.maxX, bounds.minY],
            [bounds.maxX, bounds.maxY],
        ].map((coord) => proj4(WTM_EPSG, WGS84_EPSG, coord));

        const xs = corners.map((item) => item[0]);
        const ys = corners.map((item) => item[1]);

        return {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys),
        };
    }

    function formatBoundsParam(bounds) {
        if (!bounds) {
            return '';
        }
        const values = [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].map((value) => {
            if (typeof value === 'number' && Number.isFinite(value)) {
                return value.toFixed(9);
            }
            return '0';
        });
        return values.join(',');
    }

    function resolveLayerId() {
        if (state.layerId && NATIONAL_ENV_LAYER_LOOKUP[state.layerId]) {
            return state.layerId;
        }

        state.layerId = DEFAULT_LAYER_ID;
        return DEFAULT_LAYER_ID;
    }

    function clearNationalEnvTileData() {
        if (state.tileDataRequests && typeof state.tileDataRequests.clear === 'function') {
            state.tileDataRequests.clear();
        }
        if (state.tileDataCache && typeof state.tileDataCache.clear === 'function') {
            state.tileDataCache.clear();
        }
    }

    function refreshNationalEnvLayer() {
        if (!state.isActive) {
            return;
        }

        cancelAllTileRequests();
        if (state.tilesetMapTypeId) {
            map.removeOverlayMapTypeId(state.tilesetMapTypeId);
        }
        attachNationalEnvTileset();
    }

    function setNationalEnvLayer(layerId) {
        if (typeof layerId !== 'string') {
            console.warn('국토환경성평가지도 레이어 ID는 문자열이어야 합니다.');
            return state.layerId;
        }

        const normalized = layerId.trim();
        if (!normalized) {
            console.warn('국토환경성평가지도 레이어 ID가 비어 있습니다.');
            return state.layerId;
        }

        if (!NATIONAL_ENV_LAYER_LOOKUP[normalized]) {
            console.warn(
                `문서에 정의되지 않은 국토환경성평가지도 레이어(${normalized}) 입니다. 제공된 레이어 목록을 확인해주세요.`
            );
            return state.layerId;
        }

        if (state.layerId === normalized) {
            return state.layerId;
        }

        state.layerId = normalized;
        state.layerRequestToken += 1;
        clearNationalEnvTileData();
        refreshNationalEnvLayer();
        return state.layerId;
    }

    function getNationalEnvLayerCatalog() {
        return NATIONAL_ENV_LAYER_CATALOG.map((layer) => ({ ...layer }));
    }

    window.addNationalEnvWMSTileLayer = addNationalEnvWMSTileLayer;
    window.removeNationalEnvWMSTileLayer = removeNationalEnvWMSTileLayer;
    window.isNationalEnvLayerActive = isNationalEnvLayerActive;
    window.setNationalEnvLayer = setNationalEnvLayer;
    window.getNationalEnvLayerCatalog = getNationalEnvLayerCatalog;
    window.NATIONAL_ENV_TILE_EVENT = NATIONAL_ENV_TILE_EVENT;
    window.debugTileCoordsToWTM = tileCoordsToWTM;
    window.enableNationalEnvDebug = () => {
        window.nationalEnvDebug = true;
        debugState.enabled = true;
        console.info('[국토환경] 좌표계 디버그 모드가 활성화되었습니다.');
    };
    window.disableNationalEnvDebug = () => {
        window.nationalEnvDebug = false;
        debugState.enabled = false;
        if (debugState.overlay) {
            debugState.overlay.setMap(null);
            debugState.overlay = null;
        }
        if (debugState.labelOverlay) {
            debugState.labelOverlay.setMap(null);
            debugState.labelOverlay = null;
        }
        console.info('[국토환경] 좌표계 디버그 모드가 비활성화되었습니다.');
    };

    function emitDebugTileInfo({ x, y, z, bbox, url }) {
        if (!shouldDebugTiles()) {
            return;
        }

        console.groupCollapsed(`%c[국토환경 타일] z:${z} x:${x} y:${y}`, 'color:#0d6efd;font-weight:bold;');
        console.log('WGS84 범위', bbox && bbox.wgs84 ? bbox.wgs84 : 'N/A');
        if (bbox) {
            console.log('3857 범위', {
                minX: bbox.minX,
                minY: bbox.minY,
                maxX: bbox.maxX,
                maxY: bbox.maxY,
            });
        } else {
            console.log('3857 범위', 'N/A');
        }
        console.log('타일 번호', { z, x, y });
        console.log('요청 URL', url);
        drawDebugBounds(bbox ? bbox.wgs84 : null, { z, x, y });
        console.groupEnd();
    }

    function shouldDebugTiles() {
        if (typeof window !== 'undefined' && typeof window.nationalEnvDebug !== 'undefined') {
            debugState.enabled = !!window.nationalEnvDebug;
        }
        return debugState.enabled;
    }

    function drawDebugBounds(wgsBounds, tileInfo) {
        if (!canUseNationalEnvLayer() || !wgsBounds) {
            return;
        }

        const southWest = new kakao.maps.LatLng(wgsBounds.southWest.lat, wgsBounds.southWest.lng);
        const northEast = new kakao.maps.LatLng(wgsBounds.northEast.lat, wgsBounds.northEast.lng);
        const bounds = new kakao.maps.LatLngBounds(southWest, northEast);

        if (debugState.overlay) {
            debugState.overlay.setBounds(bounds);
        } else {
            debugState.overlay = new kakao.maps.Rectangle({
                bounds,
                strokeWeight: 2,
                strokeColor: '#ff0000',
                strokeOpacity: 0.8,
                fillOpacity: 0,
            });
        }

        debugState.overlay.setMap(map);
        drawDebugTileLabel({
            lat: (wgsBounds.southWest.lat + wgsBounds.northEast.lat) / 2,
            lng: (wgsBounds.southWest.lng + wgsBounds.northEast.lng) / 2,
            tileInfo,
        });
    }

    function drawDebugTileLabel({ lat, lng, tileInfo }) {
        if (!canUseNationalEnvLayer() || typeof kakao === 'undefined' || !tileInfo) {
            return;
        }

        const position = new kakao.maps.LatLng(lat, lng);
        const content = `<div style="padding:2px 4px;border:1px solid #ff0000;background:rgba(255,255,255,0.8);font-size:11px;">
            z:${tileInfo.z} x:${tileInfo.x} y:${tileInfo.y}
        </div>`;

        if (debugState.labelOverlay) {
            debugState.labelOverlay.setPosition(position);
            debugState.labelOverlay.setContent(content);
        } else {
            debugState.labelOverlay = new kakao.maps.CustomOverlay({
                position,
                content,
                yAnchor: 1,
            });
        }

        debugState.labelOverlay.setMap(map);
    }
})();
