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

    $baseStatsSql = <<<'SQL'
        WITH parcel AS (
            SELECT ST_SetSRID(ST_GeomFromText(:wkt), 4326)::geometry(MultiPolygon, 4326) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.elevation_korea AS r
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

    $statsStmt = $pdo->prepare($baseStatsSql);
    $statsStmt->execute([':wkt' => $parcelWkt]);
    $elevationStats = $statsStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    if ($elevationStats) {
        $elevationStats = [
            'pixel_count' => isset($elevationStats['pixel_count']) ? (int) $elevationStats['pixel_count'] : 0,
            'value_sum' => isset($elevationStats['value_sum']) ? (float) $elevationStats['value_sum'] : null,
            'value_mean' => isset($elevationStats['value_mean']) ? (float) $elevationStats['value_mean'] : null,
            'value_stddev' => isset($elevationStats['value_stddev']) ? (float) $elevationStats['value_stddev'] : null,
            'value_min' => isset($elevationStats['value_min']) ? (float) $elevationStats['value_min'] : null,
            'value_max' => isset($elevationStats['value_max']) ? (float) $elevationStats['value_max'] : null,
        ];
    }

    $bucketSql = <<<'SQL'
        WITH parcel AS (
            SELECT ST_SetSRID(ST_GeomFromText(:wkt), 4326)::geometry(MultiPolygon, 4326) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.elevation_korea AS r
            CROSS JOIN parcel
            WHERE ST_Intersects(r.rast, parcel.geom)
        ),
        pixels AS (
            SELECT
                pix.val::numeric AS elevation_value,
                ST_Area(ST_Transform(pix.geom, 5186)) AS area_m2
            FROM clipped,
                 LATERAL ST_PixelAsPolygons(rast, 1, true) AS pix
            WHERE pix.val IS NOT NULL
        )
        SELECT bucket, COALESCE(SUM(area_m2), 0) AS area_m2
        FROM (
            SELECT
                CASE
                    WHEN elevation_value < 0 THEN 'below_0'
                    WHEN elevation_value < 50 THEN '0_50'
                    WHEN elevation_value < 100 THEN '50_100'
                    WHEN elevation_value < 200 THEN '100_200'
                    WHEN elevation_value < 400 THEN '200_400'
                    ELSE '400_plus'
                END AS bucket,
                area_m2
            FROM pixels
        ) categorized
        GROUP BY bucket
        ORDER BY CASE bucket
            WHEN 'below_0' THEN 1
            WHEN '0_50' THEN 2
            WHEN '50_100' THEN 3
            WHEN '100_200' THEN 4
            WHEN '200_400' THEN 5
            ELSE 6
        END;
        SQL;

    $bucketStmt = $pdo->prepare($bucketSql);
    $bucketStmt->execute([':wkt' => $parcelWkt]);
    $bucketRows = $bucketStmt->fetchAll(PDO::FETCH_ASSOC);

    $bucketMeta = [
        'below_0' => ['label' => '0m 미만', 'min' => null, 'max' => 0, 'color' => '#023858'],
        '0_50' => ['label' => '0~50m', 'min' => 0, 'max' => 50, 'color' => '#1d91c0'],
        '50_100' => ['label' => '50~100m', 'min' => 50, 'max' => 100, 'color' => '#7fcdbb'],
        '100_200' => ['label' => '100~200m', 'min' => 100, 'max' => 200, 'color' => '#c7e9b4'],
        '200_400' => ['label' => '200~400m', 'min' => 200, 'max' => 400, 'color' => '#fdd49e'],
        '400_plus' => ['label' => '400m 이상', 'min' => 400, 'max' => null, 'color' => '#f03b20'],
    ];

    $bucketAreas = array_fill_keys(array_keys($bucketMeta), 0);
    foreach ($bucketRows as $row) {
        $bucketAreas[$row['bucket']] = (float) $row['area_m2'];
    }

    $totalArea = array_sum($bucketAreas);

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
            'ratio' => $totalArea > 0 ? round(($areaM2 / $totalArea) * 100, 3) : 0,
        ];
    }

    $distributionSql = <<<'SQL'
        WITH parcel AS (
            SELECT ST_SetSRID(ST_GeomFromText(:wkt), 4326)::geometry(MultiPolygon, 4326) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.elevation_korea AS r
            CROSS JOIN parcel
            WHERE ST_Intersects(r.rast, parcel.geom)
        ),
        pixels AS (
            SELECT
                pix.val::numeric AS elevation_value,
                ST_Area(ST_Transform(pix.geom, 5186)) AS area_m2
            FROM clipped,
                 LATERAL ST_PixelAsPolygons(rast, 1, true) AS pix
            WHERE pix.val IS NOT NULL
        )
        SELECT elevation_value, COUNT(*) AS pixel_count, SUM(area_m2) AS area_m2
        FROM pixels
        GROUP BY elevation_value
        ORDER BY elevation_value;
        SQL;

    $distributionStmt = $pdo->prepare($distributionSql);
    $distributionStmt->execute([':wkt' => $parcelWkt]);
    $elevationDistribution = [];
    while ($row = $distributionStmt->fetch(PDO::FETCH_ASSOC)) {
        $area = isset($row['area_m2']) ? (float) $row['area_m2'] : 0;
        $elevationDistribution[] = [
            'elevationValue' => isset($row['elevation_value']) ? (float) $row['elevation_value'] : null,
            'pixelCount' => (int) ($row['pixel_count'] ?? 0),
            'areaM2' => round($area, 3),
            'ratio' => $totalArea > 0 ? round(($area / $totalArea) * 100, 5) : 0,
        ];
    }

    $pixelSql = <<<'SQL'
        WITH parcel AS (
            SELECT ST_SetSRID(ST_GeomFromText(:wkt), 4326)::geometry(MultiPolygon, 4326) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.elevation_korea AS r
            CROSS JOIN parcel
            WHERE ST_Intersects(r.rast, parcel.geom)
        ),
        pixels AS (
            SELECT
                pix.geom,
                pix.val::numeric AS elevation_value
            FROM clipped,
                 LATERAL ST_PixelAsPolygons(rast, 1, true) AS pix
            WHERE pix.val IS NOT NULL
        )
        SELECT
            ST_AsGeoJSON(geom) AS geom,
            elevation_value,
            CASE
                WHEN elevation_value < 0 THEN 'below_0'
                WHEN elevation_value < 50 THEN '0_50'
                WHEN elevation_value < 100 THEN '50_100'
                WHEN elevation_value < 200 THEN '100_200'
                WHEN elevation_value < 400 THEN '200_400'
                ELSE '400_plus'
            END AS bucket
        FROM pixels;
        SQL;

    $pixelStmt = $pdo->prepare($pixelSql);
    $pixelStmt->execute([':wkt' => $parcelWkt]);
    $elevationPixels = [];
    while ($row = $pixelStmt->fetch(PDO::FETCH_ASSOC)) {
        $geometry = isset($row['geom']) ? json_decode($row['geom'], true) : null;
        if (!$geometry) {
            continue;
        }

        $elevationPixels[] = [
            'bucket' => $row['bucket'],
            'elevationValue' => isset($row['elevation_value']) ? (float) $row['elevation_value'] : null,
            'geometry' => $geometry,
        ];
    }

    $responseData = [
        'pnu' => $pnu,
        'parcelTable' => $parcelTable,
        'parcelWkt' => $parcelWkt,
        'elevationStats' => $elevationStats,
        'elevationBuckets' => $bucketSummaries,
        'elevationDistribution' => $elevationDistribution,
        'elevationPixels' => $elevationPixels,
        'totalElevationAreaM2' => round($totalArea, 3),
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
