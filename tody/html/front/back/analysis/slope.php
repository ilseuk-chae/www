<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

ob_start();

error_reporting(E_ALL);
ini_set('display_errors', 1);

include $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

include $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect.php';
include $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect_postgre.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('METHOD_NOT_ALLOWED', 405);
    }

    $pnu = isset($_POST['pnu']) ? trim($_POST['pnu']) : '';
    $bbox = isset($_POST['bbox']) ? $_POST['bbox'] : null;

    $validations = [
        ['value' => $pnu, 'type' => 'string', 'message' => '필지 정보를 확인해주세요.'],
    ];

    foreach ($validations as $validation) {
        $errorMessage = validateInput($validation['value'], $validation['type'], $validation['message']);
        if ($errorMessage === $validation['message']) {
            responseApi(400, $errorMessage, null);
            exit;
        }
    }

    $sidoCode = substr($pnu, 0, 2);
    if (!preg_match('/^\d{2}$/', $sidoCode)) {
        throw new Exception('INVALID_PNU', 400);
    }

    $parcelTable = sprintf('AL_D002_%02d', intval($sidoCode));

    $parcelSql = "SELECT ST_AsText(WKT) AS wkt FROM {$parcelTable} WHERE pnu_cd = ? LIMIT 1";
    $parcelStmt = executeQuery($conn, $parcelSql, 's', [$pnu]);
    $parcelResult = mysqli_stmt_get_result($parcelStmt);
    $parcel = mysqli_fetch_assoc($parcelResult);

    if (!$parcel || empty($parcel['wkt'])) {
        throw new Exception('PARCEL_NOT_FOUND', 404);
    }

    $parcelWkt = $parcel['wkt'];

    $slopeStatsSql = <<<'SQL'
        WITH parcel AS (
            SELECT ST_Transform(ST_SetSRID(ST_GeomFromText(:wkt), 4326), 5186) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.slope_from_elev AS r
            CROSS JOIN parcel
            WHERE ST_Intersects(r.rast, parcel.geom)
        )
        SELECT
            (stats).count AS pixel_count,
            (stats).sum AS value_sum,
            (stats).mean AS value_mean,
            (stats).stddev AS value_stddev,
            (stats).min AS value_min,
            (stats).max AS value_max
        FROM (
            SELECT ST_SummaryStatsAgg(rast, 1, true) AS stats
            FROM clipped
        ) aggregated;
        SQL;

    $slopeStatsStmt = $pdo->prepare($slopeStatsSql);
    $slopeStatsStmt->execute([':wkt' => $parcelWkt]);
    $slopeStats = $slopeStatsStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    if ($slopeStats) {
        $slopeStats = [
            'pixel_count' => isset($slopeStats['pixel_count']) ? (int) $slopeStats['pixel_count'] : 0,
            'value_sum' => isset($slopeStats['value_sum']) ? (float) $slopeStats['value_sum'] : null,
            'value_mean' => isset($slopeStats['value_mean']) ? (float) $slopeStats['value_mean'] : null,
            'value_stddev' => isset($slopeStats['value_stddev']) ? (float) $slopeStats['value_stddev'] : null,
            'value_min' => isset($slopeStats['value_min']) ? (float) $slopeStats['value_min'] : null,
            'value_max' => isset($slopeStats['value_max']) ? (float) $slopeStats['value_max'] : null,
        ];
    }

    $classificationSql = <<<'SQL'
        WITH parcel AS (
            SELECT ST_Transform(ST_SetSRID(ST_GeomFromText(:wkt), 4326), 5186) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.slope_from_elev AS r
            CROSS JOIN parcel
            WHERE ST_Intersects(r.rast, parcel.geom)
        ),
        pixels AS (
            SELECT
                (pix).val::numeric AS slope_value,
                ST_Area((pix).geom) AS area_m2
            FROM clipped,
                 LATERAL ST_PixelAsPolygons(rast, 1, true) AS pix
            WHERE (pix).val IS NOT NULL
        )
        SELECT bucket, COALESCE(SUM(area_m2), 0) AS area_m2
        FROM (
            SELECT
                CASE
                    WHEN slope_value < 5 THEN '0_5'
                    WHEN slope_value < 15 THEN '5_15'
                    WHEN slope_value < 30 THEN '15_30'
                    WHEN slope_value < 45 THEN '30_45'
                    ELSE '45_plus'
                END AS bucket,
                area_m2
            FROM pixels
        ) categorized
        GROUP BY bucket
        ORDER BY CASE bucket
            WHEN '0_5' THEN 1
            WHEN '5_15' THEN 2
            WHEN '15_30' THEN 3
            WHEN '30_45' THEN 4
            ELSE 5
        END;
        SQL;

    $classificationStmt = $pdo->prepare($classificationSql);
    $classificationStmt->execute([':wkt' => $parcelWkt]);
    $classificationRows = $classificationStmt->fetchAll(PDO::FETCH_ASSOC);

    $bucketMeta = [
        '0_5' => ['label' => '0°~5°', 'min' => 0, 'max' => 5, 'color' => '#006d2c'],
        '5_15' => ['label' => '5°~15°', 'min' => 5, 'max' => 15, 'color' => '#31a354'],
        '15_30' => ['label' => '15°~30°', 'min' => 15, 'max' => 30, 'color' => '#74c476'],
        '30_45' => ['label' => '30°~45°', 'min' => 30, 'max' => 45, 'color' => '#bae4b3'],
        '45_plus' => ['label' => '45° 이상', 'min' => 45, 'max' => null, 'color' => '#edf8e9'],
    ];

    $bucketAreas = array_fill_keys(array_keys($bucketMeta), 0);
    foreach ($classificationRows as $row) {
        $bucketAreas[$row['bucket']] = (float) $row['area_m2'];
    }

    $totalSlopeArea = array_sum($bucketAreas);

    $bucketSummaries = [];
    foreach ($bucketMeta as $key => $meta) {
        $areaM2 = $bucketAreas[$key];
        $bucketSummaries[] = [
            'bucket' => $key,
            'label' => $meta['label'],
            'min' => $meta['min'],
            'max' => $meta['max'],
            'color' => $meta['color'],
            'areaM2' => round($areaM2, 3),
            'areaPyeong' => round($areaM2 / 3.3058, 3),
            'ratio' => $totalSlopeArea > 0 ? round(($areaM2 / $totalSlopeArea) * 100, 3) : 0,
        ];
    }

    $pixelSql = <<<'SQL'
        WITH parcel AS (
            SELECT ST_Transform(ST_SetSRID(ST_GeomFromText(:wkt), 4326), 5186) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.slope_from_elev AS r
            CROSS JOIN parcel
            WHERE ST_Intersects(r.rast, parcel.geom)
        ),
        pixels AS (
            SELECT
                ST_Transform((pix).geom, 4326) AS geom_4326,
                (pix).val::numeric AS slope_value
            FROM clipped,
                 LATERAL ST_PixelAsPolygons(rast, 1, true) AS pix
            WHERE (pix).val IS NOT NULL
        )
        SELECT
            ST_AsGeoJSON(geom_4326) AS geom,
            slope_value,
            CASE
                WHEN slope_value < 5 THEN '0_5'
                WHEN slope_value < 15 THEN '5_15'
                WHEN slope_value < 30 THEN '15_30'
                WHEN slope_value < 45 THEN '30_45'
                ELSE '45_plus'
            END AS bucket
        FROM pixels;
        SQL;

    $pixelStmt = $pdo->prepare($pixelSql);
    $pixelStmt->execute([':wkt' => $parcelWkt]);
    $slopePixels = [];

    while ($row = $pixelStmt->fetch(PDO::FETCH_ASSOC)) {
        $geometry = isset($row['geom']) ? json_decode($row['geom'], true) : null;
        if (!$geometry) {
            continue;
        }

        $slopePixels[] = [
            'bucket' => $row['bucket'],
            'slopeValue' => isset($row['slope_value']) ? (float) $row['slope_value'] : null,
            'geometry' => $geometry,
        ];
    }

    $distributionSql = <<<'SQL'
        WITH parcel AS (
            SELECT ST_Transform(ST_SetSRID(ST_GeomFromText(:wkt), 4326), 5186) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.slope_from_elev AS r
            CROSS JOIN parcel
            WHERE ST_Intersects(r.rast, parcel.geom)
        ),
        pixels AS (
            SELECT
                (pix).val::numeric AS slope_value,
                ST_Area((pix).geom) AS area_m2
            FROM clipped,
                 LATERAL ST_PixelAsPolygons(rast, 1, true) AS pix
            WHERE (pix).val IS NOT NULL
        )
        SELECT slope_value, COUNT(*) AS pixel_count, SUM(area_m2) AS area_m2
        FROM pixels
        GROUP BY slope_value
        ORDER BY slope_value;
        SQL;

    $distributionStmt = $pdo->prepare($distributionSql);
    $distributionStmt->execute([':wkt' => $parcelWkt]);
    $slopeDistribution = [];
    while ($row = $distributionStmt->fetch(PDO::FETCH_ASSOC)) {
        $area = isset($row['area_m2']) ? (float) $row['area_m2'] : 0;
        $slopeDistribution[] = [
            'slopeValue' => isset($row['slope_value']) ? (float) $row['slope_value'] : null,
            'pixelCount' => (int) ($row['pixel_count'] ?? 0),
            'areaM2' => round($area, 3),
            'ratio' => $totalSlopeArea > 0 ? round(($area / $totalSlopeArea) * 100, 5) : 0,
        ];
    }

    $responseData = [
        'pnu' => $pnu,
        'parcelTable' => $parcelTable,
        'parcelWkt' => $parcelWkt,
        'slopeStats' => $slopeStats,
        'slopeBuckets' => $bucketSummaries,
        'slopePixels' => $slopePixels,
        'slopeDistribution' => $slopeDistribution,
        'totalSlopeAreaM2' => round($totalSlopeArea, 3),
        'bbox' => $bbox,
    ];

    responseApi(200, 'SUCCESS', $responseData);
} catch (Throwable $e) {
    $code = $e->getCode() >= 400 ? $e->getCode() : 500;
    responseApi($code, $e->getMessage(), null);
} finally {
    if (isset($parcelStmt) && $parcelStmt instanceof mysqli_stmt) {
        mysqli_stmt_close($parcelStmt);
    }
    if (isset($conn) && $conn instanceof mysqli) {
        mysqli_close($conn);
    }
}
