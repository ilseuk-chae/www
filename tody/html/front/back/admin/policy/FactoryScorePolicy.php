<?php
//FactoryScorePolicy.php

require_once __DIR__ . '/ScorePolicyInterface.php';

//$policy = new FactoryScorePolicy();
//$pnu = $resolver->resolve($context, $policy);

class FactoryScorePolicy implements ScorePolicyInterface
{
    public function score(array $c, array $ctx): float
    {
        $score = 0;

        $type  = $this->resolveType($ctx);

        //$candidateArea = $this->getBestTotArea($c);
        $candidateTotArea = (float)($c['plottageAr'] ?? 0); 
        $candidateBldArea = (float)($c['buildingAr'] ?? 0); 
        $targetTotArea    = (float)($ctx['plottageAr'] ?? 0);
        $targetBldArea    = (float)($ctx['buildingAr'] ?? 0);

        // 🔥 타입별 가중치 분기
        if ($type === 'complex') {

            // 집합: 건물면적 + 층 중심
            $score += $this->scorePlottageArea($candidateTotArea,$targetTotArea) * 1.5;
            $score += $this->scoreFloor($c, $ctx) * 0.5;
            $score += $this->scoreUse($c['mainPurpsCdNm'] ?? '', $ctx['buildingUse'] ?? '');

        } elseif ($type === 'general') {

            // 일반: 대지 중심
            $score += $this->scorePlottageArea($candidateTotArea,$targetTotArea) * 1.5;

            $score += $this->scoreBuildingArea($candidateBldArea, $targetBldArea);
            $score += $this->scoreUse($c['mainPurpsCdNm'] ?? '', $ctx['buildingUse'] ?? '');

        } 

        $score += $this->scoreType($c['regstrKindCdNm'] ?? '', $ctx['buildingType'] ?? '');

        return $score;
    }

    public function tolerance(array $ctx): float
    {
        $type = $this->resolveType($ctx);
        $area = (float)($ctx['buildingAr'] ?? 0);

        if ($type === 'complex') {
            return max(40, $area * 0.12); // 집합 더 엄격
        }
    
        if ($type === 'general') {
            return max(50, $area * 0.15);
        }
    
        return 9999; // 토지는 거의 제한 없음
    }

    public function isValid(array $c, array $ctx): bool
    {
        // 건물면적이 0이면 제외
        if ($this->getBestTotArea($c) <= 0) {
            return false;
        }

        return true;
    }

    /* ---------------------- */

    private function scoreBuildingArea($candidateAr, $targetAr)
    {
        if ($targetAr <= 0 || $candidateAr <= 0) return 0;

        $diffRatio = abs($candidateAr - $targetAr) / $targetAr;

        if ($diffRatio >= 0.4) return 0;

        // 5% 이내는 거의 동일건물
        if ($diffRatio <= 0.1) return 60;

        return 60 * (1 - ($diffRatio-0.1) / 0.3);
    }

    /* 대지면적 점수 (최대 15점) */
    private function scorePlottageArea($candidateAr, $targetAr)
    {
        if ($targetAr <= 0 || $candidateAr <= 0) return 0;

        $diffRatio = abs($candidateAr - $targetAr) / $targetAr;

        // 50% 이상 차이
        if ($diffRatio >= 0.5) return 0;

        // 🔥 0~10% : 15 → 12
        if ($diffRatio <= 0.10) {
            return 15 - ($diffRatio / 0.10) * 3;
        }

        // 🔥 10~30% : 12 → 5
        if ($diffRatio <= 0.30) {
            return 12 - (($diffRatio - 0.10) / 0.20) * 7;
        }

        // 🔥 30~50% : 5 → 0
        return 5 * (1 - ($diffRatio - 0.30) / 0.20);
    }

    private function scoreUse($candidateUse, $targetUse)
    {
        if (!$targetUse) return 0;

        if ($candidateUse === $targetUse) return 15;

        if (
            mb_strpos($candidateUse, $targetUse) !== false ||
            mb_strpos($targetUse, $candidateUse) !== false
        ) {
            return 8;
        }

        return 0;
    }

    private function scoreType($candidateType, $targetType)
    {
        if (!$targetType) return 0;
        return ($candidateType === $targetType) ? 5 : 0;
    }

    private function scoreFloor(array $c, array $ctx): float
    {
        if (empty($ctx['floor'])) return 0;

        $candidateMaxFloor = (int)($c['grndFlrCnt'] ?? 0);

        //if ($candidateMaxFloor <= 0) return 0;

        if ($ctx['floor'] > $candidateMaxFloor) {
            return 0; // // 패널티 제거
        }

        $diff = abs($candidateMaxFloor - $ctx['floor']);

        if ($diff === 0) return 10;
        if ($diff <= 2)  return 7;
        if ($diff <= 5)  return 3;

        return 0;
    }

    public function getBestTotArea(array $c): float
    {
        if (!empty($c['title_totArea']) && $c['title_totArea'] > 0) {
            return (float)$c['title_totArea'];
        }

        return (float)($c['total_totArea'] ?? 0);
    }

   private function resolveType(array $ctx): string
    {
        $type = $ctx['buildingType'] ?? '';

        if ($type === '집합') return 'complex';
        if ($type === '일반') return 'general';
        if ($type === '토지') return 'land';

        return 'general'; // 기본값
    }
}
?>