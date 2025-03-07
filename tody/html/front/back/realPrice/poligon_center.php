<?php
// 중심점 계산 함수 대체
function getPolygonCentroid($multiPolygon) {
    $totalX = 0;
    $totalY = 0;
    $totalPoints = 0;

    foreach ($multiPolygon as $polygon) {
        $centroid = calculateCentroidWithCheck($polygon[0]);
        $totalX += $centroid[0];
        $totalY += $centroid[1];
        $totalPoints++;
    }

    return [$totalX / $totalPoints, $totalY / $totalPoints];
}

// 내부 확인 및 보정을 포함한 중심점 계산 함수
function calculateCentroidWithCheck($coords) {
    $countCoords = count($coords);
    $xcos = 0.0;
    $ycos = 0.0;
    $zsin = 0.0;

    foreach ($coords as $coord) {
        $lat = deg2rad($coord[1]); // 위도
        $lon = deg2rad($coord[0]); // 경도

        $acos = cos($lat) * cos($lon);
        $bcos = cos($lat) * sin($lon);
        $csin = sin($lat);

        $xcos += $acos;
        $ycos += $bcos;
        $zsin += $csin;
    }

    $xcos /= $countCoords;
    $ycos /= $countCoords;
    $zsin /= $countCoords;

    $lon = atan2($ycos, $xcos);
    $sqrt = sqrt($xcos * $xcos + $ycos * $ycos);
    $lat = atan2($zsin, $sqrt);

    $centroid = [
        'lat' => rad2deg($lat),
        'lng' => rad2deg($lon),
    ];

    // 폴리곤 내부에 있는지 확인
    if (isPointInPolygon([$centroid['lng'], $centroid['lat']], $coords)) {
        return [$centroid['lng'], $centroid['lat']]; // 폴리곤 내부에 있다면 그대로 반환
    } else {
        // 폴리곤 외부에 있다면 가장 가까운 점을 찾음
        $closestPoint = findClosestPointOnPolygon([$centroid['lng'], $centroid['lat']], $coords);
        return $closestPoint;
    }
}

// 주어진 점이 폴리곤 내부에 있는지 확인하는 함수
function isPointInPolygon($point, $polygon) {
    list($x, $y) = $point;
    $inside = false;
    $n = count($polygon);
    
    for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
        $xi = $polygon[$i][0];
        $yi = $polygon[$i][1];
        $xj = $polygon[$j][0];
        $yj = $polygon[$j][1];
        
        $intersect = (($yi > $y) != ($yj > $y)) && ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi);
        if ($intersect) {
            $inside = !$inside;
        }
    }

    return $inside;
}

// 폴리곤 경계에서 주어진 점과 가장 가까운 점을 찾는 함수
function findClosestPointOnPolygon($point, $polygon) {
    $closestPoint = null;
    $closestDist = INF;

    $n = count($polygon);
    for ($i = 0; $i < $n; $i++) {
        $p1 = $polygon[$i];
        $p2 = $polygon[($i + 1) % $n];
        $candidate = getClosestPointOnSegment($point, $p1, $p2);
        $dist = distanceBetweenPoints($point, $candidate);

        if ($dist < $closestDist) {
            $closestDist = $dist;
            $closestPoint = $candidate;
        }
    }

    return $closestPoint;
}

// 선분(p1, p2) 위에서 주어진 점과 가장 가까운 점을 찾는 함수
function getClosestPointOnSegment($p, $p1, $p2) {
    list($x, $y) = $p;
    list($x1, $y1) = $p1;
    list($x2, $y2) = $p2;

    $dx = $x2 - $x1;
    $dy = $y2 - $y1;

    if ($dx == 0 && $dy == 0) {
        // p1과 p2가 동일한 점이라면
        return $p1;
    }

    $t = (($x - $x1) * $dx + ($y - $y1) * $dy) / ($dx * $dx + $dy * $dy);

    if ($t < 0) {
        return $p1;
    } elseif ($t > 1) {
        return $p2;
    } else {
        return [$x1 + $t * $dx, $y1 + $t * $dy];
    }
}

// 두 점 사이의 유클리드 거리를 계산하는 함수
function distanceBetweenPoints($p1, $p2) {
    $dx = $p1[0] - $p2[0];
    $dy = $p1[1] - $p2[1];
    return sqrt($dx * $dx + $dy * $dy);
}
?>