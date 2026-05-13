<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=86400');

require_once __DIR__ . '/raster_tile_renderer.php';

$layerConfig = [
    'table' => 'tody.elevation_korea',
    'mode' => 'elevation',
    'nodata' => [255, -9999],
    'target_srid' => 4326,
];

renderRasterTile($layerConfig);
