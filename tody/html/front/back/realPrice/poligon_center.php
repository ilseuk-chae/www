<?php
// 중심점 계산 함수 대체
/*
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
*/
function getPolygonCentroid($multiPolygon) {
    $totalX = 0;
    $totalY = 0;
    $totalPoints = 0; // 초기값 0

    // 멀티폴리곤이 비어있는 경우, 루프가 실행되지 않으므로 $totalPoints는 0이 됩니다.
    // 이때 0으로 나누는 오류를 방지하기 위해 미리 체크합니다.
    if (empty($multiPolygon)) {
        // 유효한 중심 좌표를 계산할 수 없으므로, 기본값이나 null을 반환합니다.
        // 또는 에러 로그를 남길 수도 있습니다.
        //error_log("경고: getPolygonCentroid에 빈 multiPolygon이 전달되었습니다.");
        return [null, null]; // 또는 [0, 0] 등 상황에 맞는 기본값
    }

    
    foreach ($multiPolygon as $polygon) {
        // `calculateCentroidWithCheck`가 `[null, null]`을 반환할 경우를 대비
        $centroid = calculateCentroidWithCheck($polygon[0]); 
        
        // $centroid가 유효한 중심 좌표를 반환했는지 확인 (null이 아닌지)
        if ($centroid[0] !== null && $centroid[1] !== null) {
            $totalX += $centroid[0];
            $totalY += $centroid[1];
            $totalPoints++;
        } else {
            // 이 개별 폴리곤은 중심 계산에 실패했으므로 로그를 남길 수 있습니다.
            //error_log("경고: getPolygonCentroid에서 일부 폴리곤의 중심 계산이 실패했습니다. (유효하지 않은 centroid 반환)");
        }
    }

    // 만약 foreach를 다 돌았는데도 $totalPoints가 0인 경우가 발생할 수 있습니다.
    // 이는 $multiPolygon은 비어있지 않았지만, 모든 polygon의 중심 계산이 실패하여 continue 되었을 때입니다.
    if ($totalPoints === 0) {
        //error_log("경고: getPolygonCentroid에서 모든 polygon의 중심 계산이 실패했습니다.");
        return [null, null]; // 모든 내부 폴리곤이 유효하지 않은 경우
    }

    // 이제 $totalPoints는 최소 1 이상이므로 0으로 나누는 에러는 발생하지 않습니다.
    return [$totalX / $totalPoints, $totalY / $totalPoints];
}
// 내부 확인 및 보정을 포함한 중심점 계산 함수
/*
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
*/
function calculateCentroidWithCheck($coords) {
    // 1. 유효성 검사: $coords가 배열인지, 그리고 폴리곤으로 유효한 최소 개수(3개 이상)의 점을 가지는지 확인
    // (GeoJSON 명세상 폴리곤은 시작점과 끝점을 포함하여 최소 4개의 좌표가 필요하지만,
    // 일반적으로 내부적으로 unique한 점의 개수는 3개 이상이라고 간주합니다.)
    if (!is_array($coords) || count($coords) < 3) { // 최소 3점 (삼각형) 이상으로 판단
        // 유효하지 않은 입력에 대한 처리: 로그를 남기고 [null, null] 또는 기본값 반환
        //error_log("경고: calculateCentroidWithCheck에 유효하지 않은 좌표 배열이 전달되었습니다. 최소 3개 이상의 좌표가 필요합니다.");
        return [null, null]; // 상위 함수 (getPolygonCentroid)에서 이 값을 체크하여 처리하도록 함
    }

    // 이 시점에서는 $countCoords는 최소 3 이상이므로 0이 될 일은 없음
    $countCoords = count($coords); 
    $xcos = 0.0;
    $ycos = 0.0;
    $zsin = 0.0;

    foreach ($coords as $coord) {
        // $coord는 [경도, 위도] 형태라고 가정합니다. (coord[0] = 경도, coord[1] = 위도)
        $lat = deg2rad($coord[1]); // 위도
        $lon = deg2rad($coord[0]); // 경도

        $acos = cos($lat) * cos($lon);
        $bcos = cos($lat) * sin($lon);
        $csin = sin($lat);

        $xcos += $acos;
        $ycos += $bcos;
        $zsin += $csin;
    }

    // $countCoords는 이 시점에서 최소 3 이상이므로, 0으로 나누는 에러는 발생하지 않습니다.
    $xcos /= $countCoords;
    $ycos /= $countCoords;
    $zsin /= $countCoords;

    $lon = atan2($ycos, $xcos);
    $sqrt = sqrt($xcos * $xcos + $ycos * $ycos);
    
    // 참고: $sqrt가 0에 가까워질 경우 atan2(zsin, 0) 형태가 될 수 있지만,
    // 이는 atan2 함수에서 정의되어 있으므로 DivisionByZeroError는 발생하지 않습니다.
    // 하지만 매우 작은 값에 대한 연산 정밀도 문제는 있을 수 있습니다.
    $lat = atan2($zsin, $sqrt);

    $centroid = [
        'lat' => rad2deg($lat),
        'lng' => rad2deg($lon),
    ];

    // 폴리곤 내부에 있는지 확인
    if (isPointInPolygon([$centroid['lng'], $centroid['lat']], $coords)) {
        return [$centroid['lng'], $centroid['lat']]; // 폴리곤 내부에 있다면 그대로 반환
    } else {
        // 폴리곤 외부에 있다면 가장 가까운 점을 찾음 (이 함수는 제공되지 않음)
        // 여기에 `findClosestPointOnPolygon` 함수의 유효성 검사도 필요합니다.
        // 예를 들어, 유효하지 않은 polygon이 전달될 경우 처리.
        $closestPoint = findClosestPointOnPolygon([$centroid['lng'], $centroid['lat']], $coords);
        
        // $closestPoint가 유효한 결과인지 확인하는 로직 추가 필요 (예: [null, null]을 반환하는 경우)
        if ($closestPoint[0] === null || $closestPoint[1] === null) {
            //error_log("경고: findClosestPointOnPolygon이 유효하지 않은 결과를 반환했습니다.");
            return [null, null]; 
        }
        return $closestPoint;
    }
}

// 주어진 점이 폴리곤 내부에 있는지 확인하는 함수
function isPointInPolygon($point, $polygon) {

    // 2. isPointInPolygon 함수도 $polygon 배열의 유효성 검사 추가
    if (!is_array($polygon) || count($polygon) < 3) { // 최소 3점 (삼각형) 이상으로 판단
        //error_log("경고: isPointInPolygon에 유효하지 않은 폴리곤 좌표 배열이 전달되었습니다.");
        return false; // 유효하지 않은 폴리곤으로는 내부 여부 판단 불가
    }

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
/*
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
*/
function findClosestPointOnPolygon($point, $polygon) {
    // 1. 유효성 검사: $polygon이 배열인지, 그리고 폴리곤으로 유효한 최소 개수(2개 이상)의 점을 가지는지 확인
    // (segment를 만들려면 최소 2개의 점이 필요합니다.)
    if (!is_array($polygon) || count($polygon) < 2) { 
        // 로그를 남기고 유효하지 않음을 알리는 값을 반환
        //error_log("경고: findClosestPointOnPolygon에 유효하지 않은 폴리곤 데이터가 전달되었습니다. 최소 2개 이상의 좌표가 필요합니다.");
        return [null, null]; // 상위 함수에서 이 값을 체크하여 처리하도록 함
    }

    $closestPoint = null;
    $closestDist = INF; // 무한대

    $n = count($polygon); // 이 시점에서 $n은 최소 2 이상
    for ($i = 0; $i < $n; $i++) {
        $p1 = $polygon[$i];
        $p2 = $polygon[($i + 1) % $n]; // $n은 최소 2이므로 % 연산 시 문제 없음

        // 2. getClosestPointOnSegment 함수도 유효성 검사가 필요하며,
        //    null을 반환할 수 있도록 고려해야 합니다.
        //    (예: $p1, $p2가 동일하거나 유효하지 않은 경우)
        $candidate = getClosestPointOnSegment($point, $p1, $p2); 

        // $candidate가 유효한지 확인. 만약 [null, null] 등을 반환하면 건너뜁니다.
        if ($candidate[0] === null || $candidate[1] === null) {
            //error_log("경고: getClosestPointOnSegment가 유효하지 않은 결과를 반환했습니다. 세그먼트: [".$p1[0].",".$p1[1]."]-[".$p2[0].",".$p2[1]."]");
            continue; // 이 세그먼트는 건너뛰고 다음 세그먼트로 이동
        }

        // 3. distanceBetweenPoints 함수도 유효성 검사가 필요하며,
        //    null을 반환할 수 있도록 고려해야 합니다.
        $dist = distanceBetweenPoints($point, $candidate);

        // $dist가 유효한 숫자(INF가 아닌)인지 확인.
        if (!is_numeric($dist) || $dist === INF) {
             //error_log("경고: distanceBetweenPoints가 유효하지 않은 거리를 반환했습니다.");
             continue;
        }

        if ($dist < $closestDist) {
            $closestDist = $dist;
            $closestPoint = $candidate;
        }
    }
    
    // 만약 for 루프가 끝났는데도 closestPoint가 여전히 null이면
    // 이는 폴리곤에 유효한 세그먼트가 없었거나 모든 계산이 실패했음을 의미합니다.
    if ($closestPoint === null) {
        //error_log("경고: findClosestPointOnPolygon에서 유효한 가장 가까운 점을 찾지 못했습니다.");
        return [null, null];
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