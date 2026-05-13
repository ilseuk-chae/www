<?php
// /admin/policy/ScorePolicyInterface.php

interface ScorePolicyInterface
{
    public function score(array $candidate, array $ctx): float;
    public function tolerance(array $ctx): float;
    public function isValid(array $candidate, array $ctx): bool;
}