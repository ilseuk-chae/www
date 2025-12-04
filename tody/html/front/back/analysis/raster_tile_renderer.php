<?php
declare(strict_types=1);

require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/common.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/front/back/00-include/dbconnect_postgre.php';

const RASTER_TILE_SIZE = 256;
const RASTER_WTM_OFFSET_X = 30000;
const RASTER_WTM_OFFSET_Y = 60000;
const DEFAULT_TARGET_SRID = 5186;
const SLOPE_COLOR_BUCKETS = [
    ['max' => 5, 'color' => '#006d2c'],
    ['max' => 15, 'color' => '#31a354'],
    ['max' => 30, 'color' => '#74c476'],
    ['max' => 45, 'color' => '#bae4b3'],
    ['max' => INF, 'color' => '#edf8e9'],
];
const ELEVATION_COLOR_BUCKETS = [
    ['max' => 0, 'color' => '#081d58'],
    ['max' => 50, 'color' => '#253494'],
    ['max' => 100, 'color' => '#225ea8'],
    ['max' => 200, 'color' => '#1d91c0'],
    ['max' => 400, 'color' => '#41b6c4'],
    ['max' => 600, 'color' => '#7fcdbb'],
    ['max' => 800, 'color' => '#fd8d3c'],
    ['max' => INF, 'color' => '#bd0026'],
];

function renderRasterTile(array $layerConfig): void
{
    global $pdo;

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    try {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            throw new Exception('METHOD_NOT_ALLOWED', 405);
        }

        $z = isset($_GET['z']) ? (int) $_GET['z'] : null;
        $x = isset($_GET['x']) ? (int) $_GET['x'] : null;
        $y = isset($_GET['y']) ? (int) $_GET['y'] : null;
        if ($z === null || $x === null || $y === null || $z < 0 || $x < 0 || $y < 0 || $z > 20) {
            throw new Exception('INVALID_TILE_COORD', 400);
        }

        $bboxParam = isset($_GET['bbox']) ? trim((string) $_GET['bbox']) : '';
        $bboxSridParam = isset($_GET['bbox_srid']) ? (int) $_GET['bbox_srid'] : null;
        if ($bboxSridParam !== null && $bboxSridParam <= 0) {
            $bboxSridParam = null;
        }
        $bounds = parseBboxParam($bboxParam, $bboxSridParam);
        if (!$bounds) {
            $bounds = resolveTileBounds($x, $y, $z);
        }

        $targetSrid = isset($layerConfig['target_srid']) ? (int) $layerConfig['target_srid'] : DEFAULT_TARGET_SRID;
        if ($targetSrid <= 0) {
            $targetSrid = DEFAULT_TARGET_SRID;
        }

        $sql = sprintf(getTileQueryTemplate(), $layerConfig['table']);
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':min_x' => $bounds['minX'],
            ':min_y' => $bounds['minY'],
            ':max_x' => $bounds['maxX'],
            ':max_y' => $bounds['maxY'],
            ':srid' => $bounds['srid'] ?? 5179,
            ':tile_size' => RASTER_TILE_SIZE,
            ':target_srid' => $targetSrid,
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        $stmt->closeCursor();

        $tileWidth = isset($result['tile_width']) ? (int) $result['tile_width'] : RASTER_TILE_SIZE;
        $tileHeight = isset($result['tile_height']) ? (int) $result['tile_height'] : RASTER_TILE_SIZE;
        $pixelGrid = [];
        if (!empty($result['pixel_grid'])) {
            $pixelGrid = json_decode($result['pixel_grid'], true);
            if (!is_array($pixelGrid)) {
                throw new RuntimeException('픽셀 데이터를 해석할 수 없습니다.');
            }
            $pixelGrid = normalizePixelGrid($pixelGrid, $tileWidth, $tileHeight);
            $pixelGrid = maskNodataPixels($pixelGrid, $layerConfig);
        }

        renderTileFromGrid($pixelGrid, $tileWidth, $tileHeight, $layerConfig);
    } catch (Throwable $e) {
        http_response_code(200);
        header('Cache-Control: no-store');
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => true,
            'status' => $e->getCode() ?: 500,
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'request' => [
                'x' => $_GET['x'] ?? null,
                'y' => $_GET['y'] ?? null,
                'z' => $_GET['z'] ?? null,
                'layer' => $_GET['layer'] ?? null,
                'bbox' => $_GET['bbox'] ?? null,
            ],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}

function getTileQueryTemplate(): string
{
    return <<<'SQL'
        WITH params AS (
            SELECT
                :min_x::double precision AS min_x,
                :min_y::double precision AS min_y,
                :max_x::double precision AS max_x,
                :max_y::double precision AS max_y,
                :srid::integer AS input_srid,
                :tile_size::double precision AS tile_size
        ),
        bounds AS (
            SELECT ST_SetSRID(ST_MakeEnvelope(min_x, min_y, max_x, max_y, input_srid), input_srid) AS geom_input,
                   tile_size
            FROM params
        ),
        geom_target AS (
            SELECT ST_Transform(geom_input, :target_srid::integer) AS geom,
                   tile_size
            FROM bounds
        ),
        geom_metrics AS (
            SELECT
                geom,
                tile_size,
                ST_XMin(geom) AS min_x_target,
                ST_YMin(geom) AS min_y_target,
                ST_XMax(geom) AS max_x_target,
                ST_YMax(geom) AS max_y_target,
                GREATEST(1e-9, COALESCE((ST_XMax(geom) - ST_XMin(geom)) / NULLIF(tile_size, 0), 0)) AS pixel_size_x,
                GREATEST(1e-9, COALESCE((ST_YMax(geom) - ST_YMin(geom)) / NULLIF(tile_size, 0), 0)) AS pixel_size_y
            FROM geom_target
        ),
        clipped AS (
            SELECT ST_Clip(r.rast, geom_metrics.geom, true) AS clipped_rast
            FROM %s AS r
            CROSS JOIN geom_metrics
            WHERE ST_Intersects(r.rast, geom_metrics.geom)
        ),
        template AS (
            SELECT ST_AddBand(
                       ST_MakeEmptyRaster(
                           :tile_size::integer,
                           :tile_size::integer,
                           min_x_target,
                           max_y_target,
                           pixel_size_x,
                           -pixel_size_y,
                           0::double precision,
                           0::double precision,
                           :target_srid::integer
                       ),
                       '8BUI'::text,
                       255::double precision,
                       255::double precision
                   ) AS rast
            FROM geom_metrics
        ),
        resampled AS (
            SELECT ST_Resample(clipped_rast, template.rast) AS rast
            FROM clipped
            CROSS JOIN template
        ),
        unioned AS (
            SELECT ST_Union(rast) AS rast
            FROM resampled
        ),
        prepared AS (
            SELECT COALESCE(u.rast, e.rast) AS rast
            FROM unioned u
            CROSS JOIN template e
        )
        SELECT
            ST_Width(rast) AS tile_width,
            ST_Height(rast) AS tile_height,
            to_json(ST_DumpValues(rast, 1, true)) AS pixel_grid
        FROM prepared;
        SQL;
}

function resolveTileBounds(int $x, int $y, int $z): array
{
    $scale = pow(2, $z - 3);
    $rawMinX = $x * $scale * RASTER_TILE_SIZE - RASTER_WTM_OFFSET_X;
    $rawMaxX = ($x + 1) * $scale * RASTER_TILE_SIZE - RASTER_WTM_OFFSET_X;
    $rawMinY = ($y + 1) * $scale * RASTER_TILE_SIZE - RASTER_WTM_OFFSET_Y;
    $rawMaxY = $y * $scale * RASTER_TILE_SIZE - RASTER_WTM_OFFSET_Y;

    return [
        'minX' => min($rawMinX, $rawMaxX),
        'minY' => min($rawMinY, $rawMaxY),
        'maxX' => max($rawMinX, $rawMaxX),
        'maxY' => max($rawMinY, $rawMaxY),
        'srid' => 5179,
    ];
}

function parseBboxParam(string $param, ?int $srid = null): ?array
{
    if ($param === '') {
        return null;
    }
    $parts = array_map('trim', explode(',', $param));
    if (count($parts) !== 4) {
        return null;
    }
    if (!is_numeric($parts[0]) || !is_numeric($parts[1]) || !is_numeric($parts[2]) || !is_numeric($parts[3])) {
        return null;
    }
    $values = array_map('floatval', $parts);
    return [
        'minX' => min($values[0], $values[2]),
        'minY' => min($values[1], $values[3]),
        'maxX' => max($values[0], $values[2]),
        'maxY' => max($values[1], $values[3]),
        'srid' => $srid && $srid > 0 ? $srid : 5186,
    ];
}

function normalizePixelGrid(array $grid, int $width, int $height): array
{
    if (empty($grid)) {
        return [];
    }
    if (isset($grid[0]) && is_array($grid[0]) && array_key_exists('row', $grid[0])) {
        return reshapeRasterDumpRows($grid, $width, $height);
    }
    if (isset($grid[0]) && is_array($grid[0])) {
        return $grid;
    }
    return [];
}

function maskNodataPixels(array $pixelGrid, array $layerConfig): array
{
    if (empty($pixelGrid) || empty($layerConfig['nodata']) || !is_array($pixelGrid)) {
        return $pixelGrid;
    }

    $nodataValues = [];
    foreach ($layerConfig['nodata'] as $value) {
        if ($value === null) {
            continue;
        }
        $numeric = (float) $value;
        $nodataValues[$numeric] = true;
    }
    if (empty($nodataValues)) {
        return $pixelGrid;
    }

    foreach ($pixelGrid as $rowIndex => $row) {
        if (!is_array($row)) {
            continue;
        }
        foreach ($row as $colIndex => $value) {
            if ($value === null || !is_numeric($value)) {
                continue;
            }
            $numericValue = (float) $value;
            foreach ($nodataValues as $nodata => $_) {
                if (abs($numericValue - (float) $nodata) < 0.0001) {
                    $pixelGrid[$rowIndex][$colIndex] = null;
                    break;
                }
            }
        }
    }

    return $pixelGrid;
}

function reshapeRasterDumpRows(array $dumpedValues, int $width, int $height): array
{
    $matrix = [];
    for ($row = 0; $row < $height; $row++) {
        $matrix[$row] = array_fill(0, $width, null);
    }
    foreach ($dumpedValues as $item) {
        $startRow = isset($item['row']) ? (int) $item['row'] - 1 : null;
        $startCol = isset($item['column']) ? (int) $item['column'] - 1 : null;
        if ($startRow === null || $startCol === null) {
            continue;
        }
        if ($startRow < 0 || $startRow >= $height) {
            continue;
        }
        $values = [];
        if (isset($item['value']) && is_array($item['value'])) {
            $values = $item['value'];
        } elseif (isset($item['value'])) {
            $values = [$item['value']];
        }
        foreach ($values as $offset => $value) {
            $colIndex = $startCol + $offset;
            if ($colIndex < 0 || $colIndex >= $width) {
                continue;
            }
            $matrix[$startRow][$colIndex] = is_numeric($value) ? (float) $value : null;
        }
    }
    return $matrix;
}

function renderTileFromGrid(array $pixelGrid, int $width, int $height, array $layerConfig): void
{
    $srcWidth = max(1, $width);
    $srcHeight = max(1, $height);
    $srcImage = imagecreatetruecolor($srcWidth, $srcHeight);
    if (!$srcImage) {
        throw new RuntimeException('소스 이미지를 초기화할 수 없습니다.');
    }
    imagesavealpha($srcImage, true);
    $transparent = imagecolorallocatealpha($srcImage, 0, 0, 0, 127);
    imagefill($srcImage, 0, 0, $transparent);

    $colorCache = [];
    for ($row = 0; $row < $srcHeight; $row++) {
        $rowData = $pixelGrid[$row] ?? [];
        for ($col = 0; $col < $srcWidth; $col++) {
            $value = $rowData[$col] ?? null;
            $style = resolvePixelStyle($value, $layerConfig);
            $styleKey = ($style['color'] ?? '#000000') . ':' . ($style['alpha'] ?? 0);
            if (!isset($colorCache[$styleKey])) {
                [$r, $g, $b] = hexToRgb($style['color'] ?? '#000000');
                $alpha255 = isset($style['alpha']) ? max(0, min(255, (int) $style['alpha'])) : 0;
                $gdAlpha = (int) round((255 - $alpha255) / 255 * 127);
                $colorCache[$styleKey] = imagecolorallocatealpha($srcImage, $r, $g, $b, $gdAlpha);
            }
            imagesetpixel($srcImage, $col, $row, $colorCache[$styleKey]);
        }
    }

    $tileImage = imagecreatetruecolor(RASTER_TILE_SIZE, RASTER_TILE_SIZE);
    if (!$tileImage) {
        imagedestroy($srcImage);
        throw new RuntimeException('타일 이미지를 초기화할 수 없습니다.');
    }
    imagesavealpha($tileImage, true);
    $transparentTarget = imagecolorallocatealpha($tileImage, 0, 0, 0, 127);
    imagefill($tileImage, 0, 0, $transparentTarget);

    imagecopyresampled(
        $tileImage,
        $srcImage,
        0,
        0,
        0,
        0,
        RASTER_TILE_SIZE,
        RASTER_TILE_SIZE,
        $srcWidth,
        $srcHeight
    );

    imagedestroy($srcImage);
    header('Content-Type: image/png');
    imagepng($tileImage);
    imagedestroy($tileImage);
}

function resolvePixelStyle($value, array $layerConfig): array
{
    if ($value === null) {
        return ['color' => '#000000', 'alpha' => 0];
    }
    if (isset($layerConfig['nodata'])) {
        foreach ($layerConfig['nodata'] as $nodata) {
            if ($nodata !== null && abs($value - (float) $nodata) < 0.0001) {
                return ['color' => '#000000', 'alpha' => 0];
            }
        }
    }
    $mode = $layerConfig['mode'] ?? 'category';
    switch ($mode) {
        case 'slope':
            return ['color' => getSlopeColor($value), 'alpha' => 200];
        case 'elevation':
            return ['color' => getElevationColor($value), 'alpha' => 200];
        case 'category':
        default:
            $intValue = (int) round($value);
            if (isset($layerConfig['categories'][$intValue])) {
                return $layerConfig['categories'][$intValue];
            }
            return ['color' => '#000000', 'alpha' => 0];
    }
}

function hexToRgb(string $hex): array
{
    $hex = ltrim($hex, '#');
    if (strlen($hex) === 3) {
        $hex = preg_replace('/(.)/', '$1$1', $hex);
    }
    return [hexdec(substr($hex, 0, 2)), hexdec(substr($hex, 2, 2)), hexdec(substr($hex, 4, 2))];
}

function getSlopeColor($value): string
{
    if (!is_numeric($value)) {
        return '#000000';
    }
    $numeric = max(0, min(90, (float) $value));
    foreach (SLOPE_COLOR_BUCKETS as $bucket) {
        if ($numeric < $bucket['max']) {
            return $bucket['color'];
        }
    }
    return SLOPE_COLOR_BUCKETS[count(SLOPE_COLOR_BUCKETS) - 1]['color'];
}

function getElevationColor($value): string
{
    if (!is_numeric($value)) {
        return '#000000';
    }
    $numeric = (float) $value;
    foreach (ELEVATION_COLOR_BUCKETS as $bucket) {
        if ($numeric < $bucket['max']) {
            return $bucket['color'];
        }
    }
    return ELEVATION_COLOR_BUCKETS[count(ELEVATION_COLOR_BUCKETS) - 1]['color'];
}
