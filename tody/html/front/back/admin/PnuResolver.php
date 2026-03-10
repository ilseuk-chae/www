<?php
// PnuResolver.php

require_once __DIR__ . '/policy/CommercialScorePolicy.php';
//require_once __DIR__ . '/policy/FactoryScorePolicy.php';
//require_once __DIR__ . '/policy/SingleScorePolicy.php';

class PnuResolver {

    private $conn;
    private $redis;

    public function __construct(mysqli $conn, Redis $redis) {
        $this->conn = $conn;
        $this->redis = $redis;
    }

    public function resolve(
        array $item,
        ScorePolicyInterface $policy,
        $historyId
    ): ?string {
    
        return findPnuInBuildingRedis(
            $this->conn,
            $item,
            $this->redis,
            $policy,
            $this,
            $historyId
        );
    }
}
?>