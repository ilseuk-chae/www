<?php
//SingleScorePolicy.php

require_once __DIR__ . '/ScorePolicyInterface.php';

//$pnu = $resolver->resolve($context, $policy);

class SingleScorePolicy implements ScorePolicyInterface
{
    public function score(array $c, array $ctx): float
    {
        $score = 0;

        //$type  = $this->resolveType($ctx);

        $candPlat = (float)($c['plottageAr'] ?? 0);
        $candTot  = (float)($c['totalFloorAr'] ?? 0);

        $targetPlat = (float)($ctx['plottageAr'] ?? 0);
        $targetTot  = (float)($ctx['totalFloorAr'] ?? 0);

        // 1️⃣ 대지면적 (가중치 50)
        if ($targetPlat > 0 && $candPlat > 0) {
            $diffRatio = abs($candPlat - $targetPlat) / $targetPlat;

            if ($diffRatio <= 0.05) {
                $score += 50;
            } elseif ($diffRatio <= 0.15) {
                $score += 40;
            } elseif ($diffRatio <= 0.25) {
                $score += 25;
            }
        }

        // 2️⃣ 연면적 (가중치 40)
        if ($targetTot > 0 && $candTot > 0) {
            $diffRatio = abs($candTot - $targetTot) / $targetTot;

            if ($diffRatio <= 0.05) {
                $score += 40;
            } elseif ($diffRatio <= 0.15) {
                $score += 30;
            } elseif ($diffRatio <= 0.30) {
                $score += 15;
            }
        }

        return $score;
    }
    
    public function tolerance(array $ctx): float
    {
        return 9999; // 단독은 tolerance 별도 사용 안함
    }

    public function isValid(array $c, array $ctx): bool
    {
        // 최소 대지면적 있는 것만
        return (float)($c['plottageAr'] ?? 0) > 0;
    }
}
?>