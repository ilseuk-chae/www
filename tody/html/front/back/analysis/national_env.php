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

const NATIONAL_ENV_PIXEL_LIMIT = 7500; // guard memory by skipping heavy pixel geometry fetches

$gradeMeta = [
    'grade_0' => ['label' => '0등급', 'color' => '#737373', 'order' => 1],
    'grade_1' => ['label' => '1등급', 'color' => '#267300', 'order' => 2],
    'grade_2' => ['label' => '2등급', 'color' => '#98e600', 'order' => 3],
    'grade_3' => ['label' => '3등급', 'color' => '#e6e600', 'order' => 4],
    'grade_4' => ['label' => '4등급', 'color' => '#e69800', 'order' => 5],
    'grade_5' => ['label' => '5등급', 'color' => '#e60000', 'order' => 6],
    'grade_other' => ['label' => '기타', 'color' => '#bdbdbd', 'order' => 7],
];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('METHOD_NOT_ALLOWED', 405);
    }

    $pnu = isset($_POST['pnu']) ? trim($_POST['pnu']) : '';
    $bbox = isset($_POST['bbox']) ? $_POST['bbox'] : null;
    $forcePixelDetails = false;
    if (isset($_POST['forcePixelDetails'])) {
        $forcePixelDetails = filter_var($_POST['forcePixelDetails'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $forcePixelDetails = $forcePixelDetails === null ? false : $forcePixelDetails;
    }

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

    $statsSql = <<<'SQL'
        WITH parcel AS (
            SELECT ST_Transform(ST_SetSRID(ST_GeomFromText(:wkt), 4326), 5186) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.env_eval AS r
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

    $statsStmt = $pdo->prepare($statsSql);
    $statsStmt->execute([':wkt' => $parcelWkt]);
    $envStats = $statsStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    if ($envStats) {
        $envStats = [
            'pixel_count' => isset($envStats['pixel_count']) ? (int) $envStats['pixel_count'] : 0,
            'value_sum' => isset($envStats['value_sum']) ? (float) $envStats['value_sum'] : null,
            'value_mean' => isset($envStats['value_mean']) ? (float) $envStats['value_mean'] : null,
            'value_stddev' => isset($envStats['value_stddev']) ? (float) $envStats['value_stddev'] : null,
            'value_min' => isset($envStats['value_min']) ? (float) $envStats['value_min'] : null,
            'value_max' => isset($envStats['value_max']) ? (float) $envStats['value_max'] : null,
        ];
    }
    $pixelCount = isset($envStats['pixel_count']) ? (int) $envStats['pixel_count'] : 0;
    $limitExceeded = $pixelCount > NATIONAL_ENV_PIXEL_LIMIT;
    $useAggregatedPolygons = !$forcePixelDetails && $limitExceeded;

    $bucketSql = <<<'SQL'
        WITH parcel AS (
            SELECT ST_Transform(ST_SetSRID(ST_GeomFromText(:wkt), 4326), 5186) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.env_eval AS r
            CROSS JOIN parcel
            WHERE ST_Intersects(r.rast, parcel.geom)
        ),
        pixels AS (
            SELECT
                (pix).val::integer AS env_value,
                CASE
                    WHEN (pix).val BETWEEN 1 AND 5 THEN 'grade_' || (pix).val::text
                    WHEN (pix).val = 0 THEN 'grade_0'
                    WHEN (pix).val = 99 THEN 'grade_other'
                    ELSE 'grade_other'
                END AS bucket_key,
                ST_Area((pix).geom) AS area_m2
            FROM clipped,
                 LATERAL ST_PixelAsPolygons(rast, 1, true) AS pix
            WHERE (pix).val IS NOT NULL
        )
        SELECT bucket_key, COALESCE(SUM(area_m2), 0) AS area_m2
        FROM pixels
        GROUP BY bucket_key;
        SQL;

    $bucketStmt = $pdo->prepare($bucketSql);
    $bucketStmt->execute([':wkt' => $parcelWkt]);
    $bucketRows = $bucketStmt->fetchAll(PDO::FETCH_ASSOC);

    $bucketAreas = [];
    foreach ($bucketRows as $row) {
        if (!isset($row['bucket_key'])) {
            continue;
        }
        $bucketAreas[$row['bucket_key']] = (float) ($row['area_m2'] ?? 0);
    }

    $totalArea = array_sum($bucketAreas);

    $bucketSummaries = [];
    foreach ($gradeMeta as $key => $meta) {
        $area = isset($bucketAreas[$key]) ? $bucketAreas[$key] : 0;
        $bucketSummaries[] = [
            'bucket' => $key,
            'label' => $meta['label'],
            'color' => $meta['color'],
            'areaM2' => round($area, 3),
            'areaPyeong' => round($area / 3.3058, 3),
            'ratio' => $totalArea > 0 ? round(($area / $totalArea) * 100, 3) : 0,
        ];
    }

    $pixelSqlDetailed = <<<'SQL'
        WITH parcel AS (
            SELECT ST_Transform(ST_SetSRID(ST_GeomFromText(:wkt), 4326), 5186) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.env_eval AS r
            CROSS JOIN parcel
            WHERE ST_Intersects(r.rast, parcel.geom)
        )
        SELECT
            ST_AsGeoJSON(ST_Transform((pix).geom, 4326)) AS geom,
            (pix).val::integer AS env_value,
            CASE
                WHEN (pix).val BETWEEN 1 AND 5 THEN 'grade_' || (pix).val::text
                WHEN (pix).val = 0 THEN 'grade_0'
                WHEN (pix).val = 99 THEN 'grade_other'
                ELSE 'grade_other'
            END AS bucket
        FROM clipped,
             LATERAL ST_PixelAsPolygons(rast, 1, true) AS pix
        WHERE (pix).val IS NOT NULL;
        SQL;

    $pixelSqlAggregated = <<<'SQL'
        WITH parcel AS (
            SELECT ST_Transform(ST_SetSRID(ST_GeomFromText(:wkt), 4326), 5186) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.env_eval AS r
            CROSS JOIN parcel
            WHERE ST_Intersects(r.rast, parcel.geom)
        )
        SELECT
            ST_AsGeoJSON(ST_Transform((dump).geom, 4326)) AS geom,
            (dump).val::integer AS env_value,
            CASE
                WHEN (dump).val BETWEEN 1 AND 5 THEN 'grade_' || (dump).val::text
                WHEN (dump).val = 0 THEN 'grade_0'
                WHEN (dump).val = 99 THEN 'grade_other'
                ELSE 'grade_other'
            END AS bucket
        FROM clipped,
             LATERAL ST_DumpAsPolygons(rast, 1, true) AS dump
        WHERE (dump).val IS NOT NULL;
        SQL;

    $pixelSql = $useAggregatedPolygons ? $pixelSqlAggregated : $pixelSqlDetailed;

    $envPixels = [];
    $pixelStmt = $pdo->prepare($pixelSql);
    $pixelStmt->execute([':wkt' => $parcelWkt]);
    while ($row = $pixelStmt->fetch(PDO::FETCH_ASSOC)) {
        $geometry = isset($row['geom']) ? json_decode($row['geom'], true) : null;
        if (!$geometry) {
            continue;
        }

        $envPixels[] = [
            'bucket' => $row['bucket'],
            'envValue' => isset($row['env_value']) ? (int) $row['env_value'] : null,
            'geometry' => $geometry,
        ];
    }

    $distributionSql = <<<'SQL'
        WITH parcel AS (
            SELECT ST_Transform(ST_SetSRID(ST_GeomFromText(:wkt), 4326), 5186) AS geom
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, parcel.geom, true) AS rast
            FROM tody.env_eval AS r
            CROSS JOIN parcel
            WHERE ST_Intersects(r.rast, parcel.geom)
        ),
        pixels AS (
            SELECT
                (pix).val::integer AS env_value,
                ST_Area((pix).geom) AS area_m2
            FROM clipped,
                 LATERAL ST_PixelAsPolygons(rast, 1, true) AS pix
            WHERE (pix).val IS NOT NULL
        )
        SELECT env_value, COUNT(*) AS pixel_count, SUM(area_m2) AS area_m2
        FROM pixels
        GROUP BY env_value
        ORDER BY env_value;
        SQL;

    $distributionStmt = $pdo->prepare($distributionSql);
    $distributionStmt->execute([':wkt' => $parcelWkt]);
    $envDistribution = [];
    while ($row = $distributionStmt->fetch(PDO::FETCH_ASSOC)) {
        $area = isset($row['area_m2']) ? (float) $row['area_m2'] : 0;
        $envDistribution[] = [
            'envValue' => isset($row['env_value']) ? (int) $row['env_value'] : null,
            'pixelCount' => (int) ($row['pixel_count'] ?? 0),
            'areaM2' => round($area, 3),
            'ratio' => $totalArea > 0 ? round(($area / $totalArea) * 100, 5) : 0,
        ];
    }

    $responseData = [
        'pnu' => $pnu,
        'parcelTable' => $parcelTable,
        'parcelWkt' => $parcelWkt,
        'envStats' => $envStats,
        'envBuckets' => $bucketSummaries,
        'envPixels' => $envPixels,
        'envDistribution' => $envDistribution,
        'totalEnvAreaM2' => round($totalArea, 3),
        'bbox' => $bbox,
        'envPixelLimitExceeded' => $limitExceeded,
        'envPixelsAggregated' => $useAggregatedPolygons,
        'envPixelLimit' => NATIONAL_ENV_PIXEL_LIMIT,
        'forcePixelDetails' => $forcePixelDetails,
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
