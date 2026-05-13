// 분석 주제도

/**
 * 경사도 폴리곤 값 가져오는 함수
 * @param {*} pnu
 * @param {*} bbox
 * @returns
 */
async function slopeMap(pnu, bbox, geojsonPolygon, options = {}) {
    const shouldReset = options.forceReset || !isMultiSelectMode;
    // 합필분석 모드가 아니거나 강제 초기화가 필요한 경우 분석도 폴리곤 초기화
    if (shouldReset) {
        analysisPolygonArray.forEach((polygon) => polygon.setMap(null)); //폴리곤을 지도에서 제거
        analysisPolygonArray = []; // 폴리곤 배열 초기화
    }

    $('#analysis_info_table tbody').empty(); // 분석 - 테이블 초기화
    $('#analysis_total_area').empty(); // 분석 - 면적 초기화
    $('#land_analysis_info_table tbody').empty(); // 합필분석 - 테이블 초기화
    $('#land_analysis_total_area').empty(); // 합필분석 - 면적 초기화

    // const urlWMS = "/front/back/realPrice/echologyWMS.php";
    // const dataObjWMS = {
    //     pnu: pnu,
    //     bbox: bbox,
    // };
    // const resultWMS = await callApi("POST", urlWMS, dataObjWMS);
    // console.log(resultWMS);

    const url = '/front/back/analysis/slope.php';
    const pnuList = Array.isArray(pnu) ? pnu.filter(Boolean) : [pnu].filter(Boolean);
    if (!pnuList.length) {
        $('#modalAlert').iziModal('open');
        $('#alert_message').html('<h2>경사도 정보를 불러올 필지를 선택해주세요.</h2>');
        return;
    }

    const slopeResponses = [];
    for (let i = 0; i < pnuList.length; i += 1) {
        const dataObj = {
            pnu: pnuList[i],
            bbox: bbox,
        };

        const loadingFlag = i === 0 ? 'loading' : undefined;
        const result = await callApi('POST', url, dataObj, loadingFlag);
        if (result && result.statusCode === 200 && result.responseData) {
            slopeResponses.push(result.responseData);
        }
    }

    if (!slopeResponses.length) {
        $('#modalAlert').iziModal('open');
        $('#alert_message').html('<h2>경사도 정보를 불러오지 못했습니다. 다시 시도해주세요.</h2>');
        return;
    }

    const mergedSlopeData = mergeSlopeResponses(slopeResponses);
    const slopeBuckets = mergedSlopeData.slopeBuckets;
    const slopePixels = mergedSlopeData.slopePixels;
    const totalSlopeAreaM2 = mergedSlopeData.totalSlopeAreaM2;

    renderAnalysisTable({
        buckets: slopeBuckets,
        distribution: mergedSlopeData.slopeDistribution,
        totalAreaM2: totalSlopeAreaM2,
        unitLabel: '°',
        colorMode: 'slope',
    });

    const dominantColor = getDominantBucketColor(slopeBuckets);
    const bucketColorMap = slopeBuckets.reduce((acc, bucket) => {
        if (bucket && bucket.bucket) {
            acc[bucket.bucket] = bucket.color;
        }
        return acc;
    }, {});

    if (slopePixels.length > 0) {
        drawRasterPixelOverlays(slopePixels, bucketColorMap, geojsonPolygon, dominantColor);
        drawAnalysisPolygons(geojsonPolygon, '#333333', {
            strokeWeight: 2,
            strokeColor: '#333333',
            strokeOpacity: 0.9,
            fillOpacity: 0,
        });
    } else {
        drawAnalysisPolygons(geojsonPolygon, dominantColor);
    }
}

async function elevationMap(pnu, bbox, geojsonPolygon, options = {}) {
    const shouldReset = options.forceReset || !isMultiSelectMode;
    if (shouldReset) {
        analysisPolygonArray.forEach((polygon) => polygon.setMap(null));
        analysisPolygonArray = [];
    }

    $('#analysis_info_table tbody').empty();
    $('#analysis_total_area').empty();
    $('#land_analysis_info_table tbody').empty();
    $('#land_analysis_total_area').empty();

    const url = '/front/back/analysis/elevation.php';
    const pnuList = Array.isArray(pnu) ? pnu.filter(Boolean) : [pnu].filter(Boolean);
    if (!pnuList.length) {
        $('#modalAlert').iziModal('open');
        $('#alert_message').html('<h2>표고도 정보를 불러올 필지를 선택해주세요.</h2>');
        return;
    }

    const elevationResponses = [];
    for (let i = 0; i < pnuList.length; i += 1) {
        const dataObj = {
            pnu: pnuList[i],
            bbox: bbox,
        };
        const loadingFlag = i === 0 ? 'loading' : undefined;
        const result = await callApi('POST', url, dataObj, loadingFlag);
        if (result && result.statusCode === 200 && result.responseData) {
            elevationResponses.push(result.responseData);
        }
    }

    if (!elevationResponses.length) {
        $('#modalAlert').iziModal('open');
        $('#alert_message').html('<h2>표고도 정보를 불러오지 못했습니다. 다시 시도해주세요.</h2>');
        return;
    }

    const merged = mergeElevationResponses(elevationResponses);
    setElevationColorRange(merged.elevationColorRange);
    renderAnalysisTable({
        buckets: merged.elevationBuckets,
        distribution: merged.elevationDistribution,
        totalAreaM2: merged.totalElevationAreaM2,
        unitLabel: 'm',
        colorMode: 'elevation',
    });

    const pixels = merged.elevationPixels || [];
    const dominantColor = getDominantBucketColor(merged.elevationBuckets);
    const bucketColorMap = merged.elevationBuckets.reduce((acc, bucket) => {
        if (bucket && bucket.bucket) {
            acc[bucket.bucket] = bucket.color;
        }
        return acc;
    }, {});

    if (pixels.length > 0) {
        drawRasterPixelOverlays(pixels, bucketColorMap, geojsonPolygon, dominantColor, 'elevation');
        drawAnalysisPolygons(geojsonPolygon, '#333333', {
            strokeWeight: 2,
            strokeColor: '#333333',
            strokeOpacity: 0.9,
            fillOpacity: 0,
        });
    } else {
        drawAnalysisPolygons(geojsonPolygon, dominantColor, {
            strokeWeight: 2,
            strokeColor: dominantColor,
            strokeOpacity: 0.9,
            fillOpacity: 0.45,
        });
    }
}

async function nationalEnvMap(pnu, bbox, geojsonPolygon, options = {}) {
    const shouldReset = options.forceReset || !isMultiSelectMode;
    if (shouldReset) {
        analysisPolygonArray.forEach((polygon) => polygon.setMap(null));
        analysisPolygonArray = [];
    }

    $('#analysis_info_table tbody').empty();
    $('#analysis_total_area').empty();
    $('#land_analysis_info_table tbody').empty();
    $('#land_analysis_total_area').empty();

    const url = '/front/back/analysis/national_env.php';
    const pnuList = Array.isArray(pnu) ? pnu.filter(Boolean) : [pnu].filter(Boolean);
    if (!pnuList.length) {
        $('#modalAlert').iziModal('open');
        $('#alert_message').html('<h2>국토환경성평가지도를 불러올 필지를 선택해주세요.</h2>');
        return;
    }

    const envResponses = [];
    const shouldForcePixels = Boolean(options.forcePixelDetails);
    const allowAutoForce = options.autoForcePixelDetails !== false;
    for (let i = 0; i < pnuList.length; i += 1) {
        const dataObj = {
            pnu: pnuList[i],
            bbox,
            forcePixelDetails: shouldForcePixels,
        };
        const loadingFlag = i === 0 ? 'loading' : undefined;
        let result = await callApi('POST', url, dataObj, loadingFlag);
        let responseData = result && result.statusCode === 200 ? result.responseData : null;

        if (
            allowAutoForce &&
            !shouldForcePixels &&
            responseData &&
            responseData.envPixelLimitExceeded &&
            Array.isArray(responseData.envPixels) &&
            responseData.envPixels.length === 0
        ) {
            const forcedResult = await callApi('POST', url, { ...dataObj, forcePixelDetails: true }, loadingFlag);
            if (forcedResult && forcedResult.statusCode === 200 && forcedResult.responseData) {
                responseData = forcedResult.responseData;
            }
        }

        if (responseData) {
            envResponses.push(responseData);
        }
    }

    if (!envResponses.length) {
        $('#modalAlert').iziModal('open');
        $('#alert_message').html('<h2>국토환경성평가지도 정보를 불러오지 못했습니다. 다시 시도해주세요.</h2>');
        return;
    }

    const merged = mergeNationalEnvResponses(envResponses);
    renderAnalysisTable({
        buckets: merged.envBuckets,
        distribution: [],
        totalAreaM2: merged.totalEnvAreaM2,
        unitLabel: '',
        colorMode: 'nationalEnv',
    });

    const bucketColorMap = merged.envBuckets.reduce((acc, bucket) => {
        if (bucket && bucket.bucket) {
            acc[bucket.bucket] = bucket.color;
        }
        return acc;
    }, {});

    const dominantColor = getDominantBucketColor(merged.envBuckets);
    const geojsonForDrawing = resolveAnalysisGeojson(pnuList, geojsonPolygon);

    if (merged.envPixels.length > 0) {
        drawRasterPixelOverlays(merged.envPixels, bucketColorMap, geojsonForDrawing, dominantColor, 'nationalEnv');
        drawAnalysisPolygons(geojsonForDrawing, '#333333', {
            strokeWeight: 2,
            strokeColor: '#333333',
            strokeOpacity: 0.9,
            fillOpacity: 0,
        });
    } else if (geojsonForDrawing) {
        drawAnalysisPolygons(geojsonForDrawing, dominantColor, {
            strokeWeight: 2,
            strokeColor: dominantColor,
            strokeOpacity: 0.9,
            fillOpacity: 0.35,
        });
    }
}

function renderAnalysisTable({
    buckets = [],
    distribution = [],
    totalAreaM2 = 0,
    unitLabel = '',
    colorMode = 'bucket',
}) {
    const tableSelector = isMultiSelectMode ? '#land_analysis_info_table' : '#analysis_info_table';
    const totalAreaSelector = isMultiSelectMode ? '#land_analysis_total_area' : '#analysis_total_area';

    const $tableBody = $(`${tableSelector} tbody`);
    $tableBody.empty();

    const hasDistribution = Array.isArray(distribution) && distribution.length > 0;
    const rowsSource = hasDistribution ? distribution : buckets;
    let hasData = false;
    const includeZeroRows = colorMode === 'nationalEnv';

    rowsSource
        .filter((row) => row && (row.areaM2 || row.areaM2 === 0))
        .forEach((row) => {
            const areaM2 = row.areaM2 || 0;
            if (areaM2 <= 0 && !includeZeroRows) return;

            hasData = true;
            const ratio = Number(row.ratio || 0).toFixed(3);
            const valueForColor = hasDistribution ? getDistributionValue(row) : getBucketRepresentativeValue(row);
            const color = resolveRowColor({
                colorMode,
                value: valueForColor,
                bucketColor: row.color,
                buckets,
            });
            const label =
                hasDistribution && valueForColor !== null
                    ? `${Number(valueForColor).toFixed(2)}${unitLabel}`
                    : row.label;

            $tableBody.append(`
                <tr>
                    <td class="text-center" style="color:${color}">◼︎</td>
                    <td class="text-center">${label}</td>
                    <td class="text-center">${formatAnalysisArea(areaM2)}</td>
                    <td class="text-center">${ratio}</td>
                </tr>
            `);
        });

    if (!hasData) {
        $tableBody.append('<tr><td colspan="4" class="text-center">표시할 데이터가 없습니다.</td></tr>');
    }

    $(totalAreaSelector).text(formatAnalysisArea(totalAreaM2));
}

function resolveRowColor({ colorMode, value, bucketColor, buckets }) {
    if (colorMode === 'elevation' && typeof value === 'number') {
        return getElevationStepColor(value);
    }

    if (colorMode === 'slope' && typeof value === 'number') {
        const bucket = findBucketByValue(value, buckets);
        if (bucket && bucket.color) {
            return bucket.color;
        }
    }

    if (colorMode === 'nationalEnv') {
        if (bucketColor) {
            return bucketColor;
        }
        if (typeof value === 'number') {
            return getNationalEnvColor(value);
        }
    }

    if (bucketColor) {
        return bucketColor;
    }

    return colorMode === 'elevation' ? '#0c2c84' : '#4B7BEC';
}

function drawAnalysisPolygons(geojsonPolygon, fillColor, options = {}) {
    const polygons = Array.isArray(geojsonPolygon) ? geojsonPolygon : [geojsonPolygon];
    let mapCenter = null;

    polygons.forEach((polygonFeature) => {
        if (!polygonFeature || !polygonFeature.geometry || !polygonFeature.geometry.coordinates) {
            return;
        }

        const rings = polygonFeature.geometry.coordinates.map((ring) =>
            ring.map((coord) => new kakao.maps.LatLng(coord[1], coord[0]))
        );

        if (!rings.length) {
            return;
        }

        const polygon = new kakao.maps.Polygon({
            path: rings,
            strokeWeight: options.strokeWeight !== undefined ? options.strokeWeight : 2,
            strokeColor: options.strokeColor || fillColor,
            strokeOpacity: options.strokeOpacity !== undefined ? options.strokeOpacity : 0.9,
            strokeStyle: 'solid',
            fillColor: options.fillColor || fillColor,
            fillOpacity: options.fillOpacity !== undefined ? options.fillOpacity : 0.35,
            zIndex: options.zIndex || 6,
        });

        analysisPolygonArray.push(polygon);
        polygon.setMap(map);

        if (!mapCenter && rings[0] && rings[0][0]) {
            mapCenter = rings[0][0];
        }
    });

    if (!isMultiSelectMode && mapCenter) {
        map.setCenter(mapCenter);
    }
}

function resolveAnalysisGeojson(pnuInput, geojsonPolygon) {
    if (geojsonPolygon && (Array.isArray(geojsonPolygon) ? geojsonPolygon.length > 0 : true)) {
        return geojsonPolygon;
    }

    if (typeof landWFSArrays === 'undefined' || !Array.isArray(landWFSArrays)) {
        return geojsonPolygon;
    }

    const pnuList = (Array.isArray(pnuInput) ? pnuInput : [pnuInput]).filter(Boolean);
    if (!pnuList.length) {
        return geojsonPolygon;
    }

    const matches = landWFSArrays
        .filter((item) => item && pnuList.includes(item.pnu))
        .map((item) => item.landGeoJson)
        .filter(Boolean);

    if (!matches.length) {
        return geojsonPolygon;
    }

    return matches.length === 1 ? matches[0] : matches;
}

function drawRasterPixelOverlays(
    pixels,
    bucketColorMap,
    geojsonPolygon,
    fallbackColor,
    valueType = 'slope',
    options = {}
) {
    if (!Array.isArray(pixels) || pixels.length === 0) {
        drawAnalysisPolygons(geojsonPolygon, fallbackColor);
        return;
    }

    let mapCenter = null;

    pixels.forEach((pixel) => {
        if (!pixel || !pixel.geometry) {
            return;
        }

        const { geometry } = pixel;
        let polygonCoordinateSets = [];

        if (geometry.type === 'Polygon') {
            polygonCoordinateSets = [geometry.coordinates];
        } else if (geometry.type === 'MultiPolygon') {
            polygonCoordinateSets = geometry.coordinates;
        }

        polygonCoordinateSets.forEach((coordinateSet) => {
            const rings = coordinateSet.map((ring) => ring.map((coord) => new kakao.maps.LatLng(coord[1], coord[0])));
            if (!rings.length) {
                return;
            }

            const color = getPixelColor(pixel, bucketColorMap, fallbackColor, valueType);
            const polygon = new kakao.maps.Polygon({
                path: rings,
                strokeWeight: 1,
                strokeColor: color,
                strokeOpacity: 1,
                strokeStyle: 'solid',
                fillColor: color,
                fillOpacity: 0.9,
                zIndex: 7,
            });

            analysisPolygonArray.push(polygon);
            polygon.setMap(map);

            const labelValue = getPixelValue(pixel);
            let overlay = null;
            if (labelValue !== null) {
                const unit = valueType === 'elevation' ? 'm' : valueType === 'slope' ? '°' : '';
                const decimals = valueType === 'nationalEnv' ? 0 : 1;
                overlay = createPixelValueOverlay(rings[0][0], labelValue, unit, decimals);
                if (overlay) {
                    analysisPolygonArray.push(overlay);
                    kakao.maps.event.addListener(polygon, 'mouseover', () => overlay.setMap(map));
                    kakao.maps.event.addListener(polygon, 'mouseout', () => overlay.setMap(null));
                }
            }

            if (!mapCenter && rings[0] && rings[0][0]) {
                mapCenter = rings[0][0];
            }
        });
    });

    if (!isMultiSelectMode && mapCenter) {
        map.setCenter(mapCenter);
    }
}

function getPixelColor(pixel, bucketColorMap, fallbackColor, valueType) {
    const value = getPixelValue(pixel);
    if (valueType === 'elevation' && value !== null) {
        return getElevationStepColor(value);
    }

    if (bucketColorMap && pixel.bucket && bucketColorMap[pixel.bucket]) {
        return bucketColorMap[pixel.bucket];
    }

    if (valueType === 'nationalEnv' && value !== null && typeof value === 'number') {
        return getNationalEnvColor(value);
    }

    if (valueType === 'slope' && value !== null && typeof value === 'number') {
        return getSlopeColor(value);
    }

    return fallbackColor || '#4B7BEC';
}

function getPixelValue(pixel) {
    if (pixel && typeof pixel.elevationValue === 'number') {
        return pixel.elevationValue;
    }
    if (pixel && typeof pixel.slopeValue === 'number') {
        return pixel.slopeValue;
    }
    if (pixel && typeof pixel.envValue === 'number') {
        return pixel.envValue;
    }
    return null;
}

const NATIONAL_ENV_BUCKET_META = {
    grade_0: { label: '0등급', color: '#737373' },
    grade_1: { label: '1등급', color: '#267300' },
    grade_2: { label: '2등급', color: '#98e600' },
    grade_3: { label: '3등급', color: '#e6e600' },
    grade_4: { label: '4등급', color: '#e69800' },
    grade_5: { label: '5등급', color: '#e60000' },
    grade_other: { label: '기타', color: '#bdbdbd' },
};
const NATIONAL_ENV_BUCKET_ORDER = ['grade_0', 'grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_other'];

const DEFAULT_ELEVATION_COLOR_RANGE = { min: -100, max: 1500 };
const ELEVATION_GRADIENT_CONTRAST = 0.85;
const ELEVATION_GRADIENT_STOPS = [
    { ratio: 0, color: '#081d58' },
    { ratio: 0.15, color: '#253494' },
    { ratio: 0.3, color: '#225ea8' },
    { ratio: 0.45, color: '#1d91c0' },
    { ratio: 0.6, color: '#41b6c4' },
    { ratio: 0.75, color: '#7fcdbb' },
    { ratio: 0.9, color: '#fd8d3c' },
    { ratio: 1, color: '#bd0026' },
];
let currentElevationColorRange = { ...DEFAULT_ELEVATION_COLOR_RANGE };

function setElevationColorRange(range) {
    if (!range || typeof range.min !== 'number' || typeof range.max !== 'number') {
        currentElevationColorRange = { ...DEFAULT_ELEVATION_COLOR_RANGE };
        return currentElevationColorRange;
    }

    const min = Math.floor(range.min / 10) * 10;
    const max = Math.ceil(range.max / 10) * 10;
    currentElevationColorRange = {
        min,
        max: max === min ? min + 10 : max,
    };
    return currentElevationColorRange;
}

function getElevationStepColor(value, range = currentElevationColorRange) {
    if (typeof value !== 'number') {
        return ELEVATION_GRADIENT_STOPS[0].color;
    }

    const minElevation = typeof range?.min === 'number' ? range.min : DEFAULT_ELEVATION_COLOR_RANGE.min;
    const maxElevation = typeof range?.max === 'number' ? range.max : DEFAULT_ELEVATION_COLOR_RANGE.max;
    const safeRange = Math.max(maxElevation - minElevation, 10);
    const clamped = clamp(Math.floor(value / 10) * 10, minElevation, maxElevation);
    const ratio = (clamped - minElevation) / safeRange;
    const contrastedRatio = applyElevationContrast(ratio);
    return getColorFromStops(contrastedRatio, ELEVATION_GRADIENT_STOPS);
}

function applyElevationContrast(ratio) {
    const clamped = clamp(ratio, 0, 1);
    if (ELEVATION_GRADIENT_CONTRAST === 1) {
        return clamped;
    }
    return Math.pow(clamped, ELEVATION_GRADIENT_CONTRAST);
}

function getColorFromStops(ratio, stops = []) {
    if (!Array.isArray(stops) || stops.length === 0) {
        return '#0c2c84';
    }

    const clampedRatio = clamp(ratio, 0, 1);
    let previousStop = stops[0];

    for (let i = 1; i < stops.length; i += 1) {
        const currentStop = stops[i];
        if (clampedRatio <= currentStop.ratio) {
            const segmentSpan = currentStop.ratio - previousStop.ratio;
            const localRatio = segmentSpan === 0 ? 0 : (clampedRatio - previousStop.ratio) / segmentSpan;
            return interpolateColor(previousStop.color, currentStop.color, localRatio);
        }
        previousStop = currentStop;
    }

    return stops[stops.length - 1].color;
}

function buildDiscretePalette(stops, count) {
    if (!Array.isArray(stops) || stops.length === 0 || !count || count < 1) {
        return ['#0c2c84'];
    }

    const palette = [];
    for (let i = 0; i < count; i += 1) {
        const ratio = count === 1 ? 0 : i / (count - 1);
        palette.push(getColorFromStops(ratio, stops));
    }

    return palette;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

const SLOPE_STEP_DEGREES = 5;
const SLOPE_MAX_DEGREES = 90;
const SLOPE_GRADIENT_STOPS = [
    { ratio: 0, color: '#00441b' },
    { ratio: 0.2, color: '#1a9850' },
    { ratio: 0.4, color: '#66bd63' },
    { ratio: 0.6, color: '#fee08b' },
    { ratio: 0.8, color: '#f46d43' },
    { ratio: 1, color: '#a50026' },
];
const SLOPE_COLOR_PALETTE = buildDiscretePalette(
    SLOPE_GRADIENT_STOPS,
    Math.floor(SLOPE_MAX_DEGREES / SLOPE_STEP_DEGREES) + 1
);

function getSlopeColor(value) {
    if (typeof value !== 'number') {
        return SLOPE_COLOR_PALETTE[0];
    }

    const clampedValue = clamp(value, 0, SLOPE_MAX_DEGREES);
    const index = Math.min(Math.floor(clampedValue / SLOPE_STEP_DEGREES), SLOPE_COLOR_PALETTE.length - 1);
    return SLOPE_COLOR_PALETTE[index];
}

function getNationalEnvBucketKeyFromValue(value) {
    if (typeof value !== 'number') {
        return 'grade_other';
    }
    if (value >= 1 && value <= 5) {
        return `grade_${value}`;
    }
    if (value === 0) {
        return 'grade_0';
    }
    if (value === 99) {
        return 'grade_other';
    }
    return 'grade_other';
}

function getNationalEnvColor(valueOrBucket) {
    const key = typeof valueOrBucket === 'string' ? valueOrBucket : getNationalEnvBucketKeyFromValue(valueOrBucket);
    if (NATIONAL_ENV_BUCKET_META[key] && NATIONAL_ENV_BUCKET_META[key].color) {
        return NATIONAL_ENV_BUCKET_META[key].color;
    }
    return '#4B7BEC';
}

function buildSlopeBucketsFromDistribution(distribution, totalArea) {
    if (!Array.isArray(distribution) || distribution.length === 0) {
        return [];
    }

    const bucketCount = Math.ceil(SLOPE_MAX_DEGREES / SLOPE_STEP_DEGREES);
    const buckets = [];

    for (let i = 0; i < bucketCount; i += 1) {
        const min = i * SLOPE_STEP_DEGREES;
        const maxInclusive = Math.min((i + 1) * SLOPE_STEP_DEGREES, SLOPE_MAX_DEGREES);
        const isLastBucket = i === bucketCount - 1;

        const areaM2 = distribution.reduce((sum, item) => {
            if (!item || typeof item.slopeValue !== 'number') {
                return sum;
            }
            const slopeValue = clamp(item.slopeValue, 0, SLOPE_MAX_DEGREES);
            const inBucket = isLastBucket
                ? slopeValue >= min && slopeValue <= maxInclusive
                : slopeValue >= min && slopeValue < maxInclusive;
            return inBucket ? sum + (item.areaM2 || 0) : sum;
        }, 0);

        if (areaM2 <= 0) {
            continue;
        }

        const areaPyeong = areaM2 / 3.3058;
        const representativeValue = min + SLOPE_STEP_DEGREES / 2;
        const bucketColor = getSlopeColor(representativeValue);
        const bucketMax = isLastBucket ? null : maxInclusive;
        const labelMax = maxInclusive;

        buckets.push({
            bucket: `${min}-${labelMax}`,
            label: `${min}° ~ ${labelMax}°`,
            min,
            max: bucketMax,
            color: bucketColor,
            areaM2: Number(areaM2.toFixed(3)),
            areaPyeong: Number(areaPyeong.toFixed(3)),
            ratio: totalArea > 0 ? Number(((areaM2 / totalArea) * 100).toFixed(3)) : 0,
        });
    }

    return buckets;
}

function interpolateColor(startHex, endHex, ratio) {
    const start = hexToRgb(startHex);
    const end = hexToRgb(endHex);
    if (!start || !end) {
        return startHex;
    }

    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    const cleaned = hex.replace('#', '');
    if (cleaned.length !== 6) {
        return null;
    }
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    return { r, g, b };
}

function createPixelValueOverlay(position, value, unit, decimals = 1) {
    if (!position || value === null || value === undefined) {
        return null;
    }

    const numericValue = Number(value);
    const formattedValue = Number.isFinite(numericValue) ? numericValue.toFixed(decimals) : value;
    const suffix = unit ? unit : '';
    const content = `
        <div class="analysis-pixel-label" style="padding:2px 4px;background:rgba(0,0,0,0.65);color:#fff;border-radius:2px;font-size:11px;line-height:1.2;">
            ${formattedValue}${suffix}
        </div>
    `;

    return new kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 1,
        zIndex: 8,
    });
}

function getDominantBucketColor(buckets) {
    if (!Array.isArray(buckets) || buckets.length === 0) {
        return '#4B7BEC';
    }

    const sorted = [...buckets].sort((a, b) => (b.areaM2 || 0) - (a.areaM2 || 0));
    return sorted[0].color || '#4B7BEC';
}

function formatAnalysisArea(areaM2) {
    const value = currentUnit === 'm2' ? areaM2 : areaM2 / 3.3058;
    const unit = currentUnit === 'm2' ? '㎡' : '평';
    const safeValue = Number(value || 0).toFixed(2);
    return `${comma(safeValue)}${unit}`;
}

function mergeSlopeResponses(responses) {
    if (!Array.isArray(responses) || responses.length === 0) {
        return {
            slopeBuckets: [],
            slopePixels: [],
            slopeDistribution: [],
            totalSlopeAreaM2: 0,
        };
    }

    const aggregate = {
        totalSlopeAreaM2: 0,
        slopePixels: [],
        slopeDistributionMap: new Map(),
    };

    const bucketMap = {};
    const bucketOrder = [];

    responses.forEach((data) => {
        aggregate.totalSlopeAreaM2 += data.totalSlopeAreaM2 || 0;

        if (Array.isArray(data.slopePixels)) {
            aggregate.slopePixels = aggregate.slopePixels.concat(data.slopePixels);
        }

        (data.slopeDistribution || []).forEach((item) => {
            if (!item || typeof item.slopeValue !== 'number') return;
            const key = item.slopeValue;
            if (!aggregate.slopeDistributionMap.has(key)) {
                aggregate.slopeDistributionMap.set(key, {
                    slopeValue: key,
                    pixelCount: 0,
                    areaM2: 0,
                });
            }
            const target = aggregate.slopeDistributionMap.get(key);
            target.pixelCount += item.pixelCount || 0;
            target.areaM2 += item.areaM2 || 0;
        });

        (data.slopeBuckets || []).forEach((bucket) => {
            if (!bucket || !bucket.bucket) {
                return;
            }

            if (!bucketMap[bucket.bucket]) {
                bucketMap[bucket.bucket] = {
                    bucket: bucket.bucket,
                    label: bucket.label,
                    min: bucket.min,
                    max: bucket.max,
                    color: bucket.color,
                    areaM2: 0,
                    areaPyeong: 0,
                };
                bucketOrder.push(bucket.bucket);
            }

            bucketMap[bucket.bucket].areaM2 += bucket.areaM2 || 0;
            bucketMap[bucket.bucket].areaPyeong += bucket.areaPyeong || 0;
        });
    });

    const distributionEntries = Array.from(aggregate.slopeDistributionMap.values());

    const totalArea = aggregate.totalSlopeAreaM2 || 0;
    const rebinnedSlopeBuckets = buildSlopeBucketsFromDistribution(distributionEntries, totalArea);
    if (rebinnedSlopeBuckets.length > 0) {
        aggregate.slopeBuckets = rebinnedSlopeBuckets;
    } else {
        aggregate.slopeBuckets = bucketOrder.map((key) => {
            const bucket = bucketMap[key];
            const areaM2 = bucket.areaM2 || 0;
            const areaPyeong = bucket.areaPyeong || 0;
            const representativeValue = getBucketRepresentativeValue(bucket);
            const computedColor =
                typeof representativeValue === 'number'
                    ? getSlopeColor(representativeValue)
                    : bucket.color || SLOPE_COLOR_PALETTE[0];

            return {
                bucket: bucket.bucket,
                label: bucket.label,
                min: bucket.min,
                max: bucket.max,
                color: computedColor,
                areaM2: Number(areaM2.toFixed(3)),
                areaPyeong: Number(areaPyeong.toFixed(3)),
                ratio: totalArea > 0 ? Number(((areaM2 / totalArea) * 100).toFixed(3)) : 0,
            };
        });
    }

    const totalDistributionArea = totalArea;
    aggregate.slopeDistribution = distributionEntries
        .map((item) => ({
            slopeValue: item.slopeValue,
            pixelCount: item.pixelCount,
            areaM2: Number(item.areaM2.toFixed(3)),
            ratio: totalDistributionArea > 0 ? Number(((item.areaM2 / totalDistributionArea) * 100).toFixed(5)) : 0,
        }))
        .sort((a, b) => a.slopeValue - b.slopeValue);

    delete aggregate.slopeDistributionMap;
    return aggregate;
}

function mergeElevationResponses(responses) {
    if (!Array.isArray(responses) || responses.length === 0) {
        return {
            elevationBuckets: [],
            elevationPixels: [],
            elevationDistribution: [],
            totalElevationAreaM2: 0,
        };
    }

    const aggregate = {
        totalElevationAreaM2: 0,
        elevationPixels: [],
        elevationDistributionMap: new Map(),
    };

    const bucketMap = {};
    const bucketOrder = [];

    responses.forEach((data) => {
        aggregate.totalElevationAreaM2 += data.totalElevationAreaM2 || 0;

        if (Array.isArray(data.elevationPixels)) {
            aggregate.elevationPixels = aggregate.elevationPixels.concat(data.elevationPixels);
        }

        (data.elevationDistribution || []).forEach((item) => {
            if (!item || typeof item.elevationValue !== 'number') return;
            const key = item.elevationValue;
            if (!aggregate.elevationDistributionMap.has(key)) {
                aggregate.elevationDistributionMap.set(key, {
                    elevationValue: key,
                    pixelCount: 0,
                    areaM2: 0,
                });
            }
            const target = aggregate.elevationDistributionMap.get(key);
            target.pixelCount += item.pixelCount || 0;
            target.areaM2 += item.areaM2 || 0;
        });

        (data.elevationBuckets || []).forEach((bucket) => {
            if (!bucket || !bucket.bucket) {
                return;
            }

            if (!bucketMap[bucket.bucket]) {
                bucketMap[bucket.bucket] = {
                    bucket: bucket.bucket,
                    label: bucket.label,
                    min: bucket.min,
                    max: bucket.max,
                    color: bucket.color,
                    areaM2: 0,
                    areaPyeong: 0,
                };
                bucketOrder.push(bucket.bucket);
            }

            bucketMap[bucket.bucket].areaM2 += bucket.areaM2 || 0;
            bucketMap[bucket.bucket].areaPyeong += bucket.areaPyeong || 0;
        });
    });

    const distributionEntries = Array.from(aggregate.elevationDistributionMap.values());
    const colorRange = calculateElevationColorRange({
        buckets: Object.values(bucketMap),
        distribution: distributionEntries,
        pixels: aggregate.elevationPixels,
    });
    aggregate.elevationColorRange = colorRange;

    const totalAreaElevation = aggregate.totalElevationAreaM2 || 0;
    aggregate.elevationBuckets = bucketOrder.map((key) => {
        const bucket = bucketMap[key];
        const areaM2 = bucket.areaM2 || 0;
        const areaPyeong = bucket.areaPyeong || 0;
        const representativeValue = getBucketRepresentativeValue(bucket);
        const computedColor =
            typeof representativeValue === 'number'
                ? getElevationStepColor(representativeValue, colorRange)
                : bucket.color || '#0c2c84';

        return {
            bucket: bucket.bucket,
            label: bucket.label,
            min: bucket.min,
            max: bucket.max,
            color: computedColor,
            areaM2: Number(areaM2.toFixed(3)),
            areaPyeong: Number(areaPyeong.toFixed(3)),
            ratio: totalAreaElevation > 0 ? Number(((areaM2 / totalAreaElevation) * 100).toFixed(3)) : 0,
        };
    });

    const totalElevationDistributionArea = totalAreaElevation;
    aggregate.elevationDistribution = distributionEntries
        .map((item) => ({
            elevationValue: item.elevationValue,
            pixelCount: item.pixelCount,
            areaM2: Number(item.areaM2.toFixed(3)),
            ratio:
                totalElevationDistributionArea > 0
                    ? Number(((item.areaM2 / totalElevationDistributionArea) * 100).toFixed(5))
                    : 0,
        }))
        .sort((a, b) => a.elevationValue - b.elevationValue);

    delete aggregate.elevationDistributionMap;
    return aggregate;
}

function mergeNationalEnvResponses(responses) {
    if (!Array.isArray(responses) || responses.length === 0) {
        return {
            envBuckets: [],
            envPixels: [],
            envDistribution: [],
            totalEnvAreaM2: 0,
        };
    }

    const aggregate = {
        totalEnvAreaM2: 0,
        envPixels: [],
        distributionMap: new Map(),
    };
    const bucketMap = new Map();

    responses.forEach((data) => {
        aggregate.totalEnvAreaM2 += data.totalEnvAreaM2 || 0;

        if (Array.isArray(data.envPixels)) {
            aggregate.envPixels = aggregate.envPixels.concat(data.envPixels);
        }

        (data.envDistribution || []).forEach((item) => {
            if (!item || typeof item.envValue !== 'number') {
                return;
            }
            const key = item.envValue;
            if (!aggregate.distributionMap.has(key)) {
                aggregate.distributionMap.set(key, {
                    envValue: key,
                    pixelCount: 0,
                    areaM2: 0,
                });
            }
            const target = aggregate.distributionMap.get(key);
            target.pixelCount += item.pixelCount || 0;
            target.areaM2 += item.areaM2 || 0;
        });

        (data.envBuckets || []).forEach((bucket) => {
            if (!bucket || !bucket.bucket) {
                return;
            }

            if (!bucketMap.has(bucket.bucket)) {
                bucketMap.set(bucket.bucket, {
                    bucket: bucket.bucket,
                    label: bucket.label,
                    color: bucket.color,
                    areaM2: 0,
                    areaPyeong: 0,
                });
            }

            const targetBucket = bucketMap.get(bucket.bucket);
            targetBucket.areaM2 += bucket.areaM2 || 0;
            targetBucket.areaPyeong += bucket.areaPyeong || 0;
            if (!targetBucket.color && bucket.color) {
                targetBucket.color = bucket.color;
            }
            if (!targetBucket.label && bucket.label) {
                targetBucket.label = bucket.label;
            }
        });
    });

    const totalArea = aggregate.totalEnvAreaM2 || 0;
    const envBuckets = NATIONAL_ENV_BUCKET_ORDER.map((key) => {
        const bucketMeta = NATIONAL_ENV_BUCKET_META[key] || {};
        const bucket = bucketMap.get(key) || {
            bucket: key,
            label: bucketMeta.label || key,
            color: bucketMeta.color,
            areaM2: 0,
            areaPyeong: 0,
        };
        const areaM2 = bucket.areaM2 || 0;
        const areaPyeong = bucket.areaPyeong || 0;

        return {
            bucket: key,
            label: bucket.label || bucketMeta.label || key,
            color: bucket.color || bucketMeta.color || getNationalEnvColor(key),
            areaM2: Number(areaM2.toFixed(3)),
            areaPyeong: Number(areaPyeong.toFixed(3)),
            ratio: totalArea > 0 ? Number(((areaM2 / totalArea) * 100).toFixed(3)) : 0,
        };
    });

    const envDistribution = Array.from(aggregate.distributionMap.values())
        .map((item) => ({
            envValue: item.envValue,
            pixelCount: item.pixelCount,
            areaM2: Number(item.areaM2.toFixed(3)),
            ratio: totalArea > 0 ? Number(((item.areaM2 / totalArea) * 100).toFixed(5)) : 0,
        }))
        .sort((a, b) => a.envValue - b.envValue);

    delete aggregate.distributionMap;
    return {
        envBuckets,
        envPixels: aggregate.envPixels,
        envDistribution,
        totalEnvAreaM2: totalArea,
    };
}

function getDistributionValue(item) {
    if (item && typeof item.slopeValue === 'number') {
        return item.slopeValue;
    }
    if (item && typeof item.elevationValue === 'number') {
        return item.elevationValue;
    }
    return null;
}

function getBucketRepresentativeValue(bucket) {
    if (!bucket || typeof bucket !== 'object') {
        return null;
    }

    const hasMin = typeof bucket.min === 'number';
    const hasMax = typeof bucket.max === 'number';

    if (hasMin && hasMax) {
        return bucket.min === bucket.max ? bucket.min : (bucket.min + bucket.max) / 2;
    }

    if (hasMin) {
        return bucket.min;
    }

    if (hasMax) {
        return bucket.max;
    }

    return null;
}

function calculateElevationColorRange({ buckets = [], distribution = [], pixels = [] } = {}) {
    const values = [];

    if (Array.isArray(pixels) && pixels.length > 0) {
        pixels.forEach((pixel) => {
            const elevationValue = typeof pixel?.elevationValue === 'number' ? pixel.elevationValue : null;
            if (typeof elevationValue === 'number') {
                values.push(elevationValue);
            }
        });
    }

    if (!values.length) {
        distribution.forEach((item) => {
            const area = (item && item.areaM2) || 0;
            if (area <= 0 || typeof item.elevationValue !== 'number') {
                return;
            }
            values.push(item.elevationValue);
        });
    }

    if (!values.length) {
        buckets.forEach((bucket) => {
            if (!bucket || (bucket.areaM2 || bucket.areaPyeong || 0) <= 0) {
                return;
            }

            if (typeof bucket.min === 'number') {
                values.push(bucket.min);
            }

            if (typeof bucket.max === 'number') {
                values.push(bucket.max);
            }
        });
    }

    if (!values.length) {
        return { ...DEFAULT_ELEVATION_COLOR_RANGE };
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const min = Math.floor(minValue / 10) * 10;
    const max = Math.ceil(maxValue / 10) * 10;

    return {
        min,
        max: max === min ? min + 10 : max,
    };
}

function findBucketByValue(value, buckets) {
    if (!Array.isArray(buckets)) {
        return null;
    }

    const exactBucket = buckets.find((bucket) => {
        if (!bucket) return false;
        const min = typeof bucket.min === 'number' ? bucket.min : -Infinity;
        const max = typeof bucket.max === 'number' ? bucket.max : Infinity;
        return value >= min && value < max;
    });

    if (exactBucket) {
        return exactBucket;
    }

    return buckets.find((bucket) => bucket && bucket.max === null && value >= (bucket.min ?? -Infinity)) || null;
}

window.slopeMap = slopeMap;
window.elevationMap = elevationMap;
