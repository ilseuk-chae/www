<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=86400');

require_once __DIR__ . '/raster_tile_renderer.php';

$layerConfig = [
    'table' => 'tody.env_eval',
    'mode' => 'category',
    'nodata' => [255],
    'categories' => [
        0 => ['color' => '#737373', 'alpha' => 180],
        1 => ['color' => '#267300', 'alpha' => 200],
        2 => ['color' => '#98e600', 'alpha' => 200],
        3 => ['color' => '#e6e600', 'alpha' => 200],
        4 => ['color' => '#e69800', 'alpha' => 200],
        5 => ['color' => '#e60000', 'alpha' => 200],
        99 => ['color' => '#BDBDBD', 'alpha' => 150],
    ],
];

renderRasterTile($layerConfig);
