<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\GameContentRepository;
use App\External\PlayerStatsRepository;
use App\Services\GameSessionLogger;

final class PurchaseSkillAction
{
    public function __construct(
        private readonly PlayerStatsRepository $statsRepo,
        private readonly GameContentRepository $contentRepo,
        private readonly GameSessionLogger $logger
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(int $userId, string $skillId): array
    {
        $stats = $this->statsRepo->findByUserId($userId);
        if ($stats === null) {
            throw new \RuntimeException('Player stats not found');
        }

        $skills = $this->contentRepo->getAllSkills();
        $skill = null;
        foreach ($skills as $candidate) {
            if (($candidate['id'] ?? null) === $skillId) {
                $skill = $candidate;
                break;
            }
        }

        if ($skill === null) {
            throw new \RuntimeException('Skill not found');
        }

        if (in_array($skillId, $stats->unlocked_skills, true)) {
            throw new \RuntimeException('Skill already unlocked');
        }

        $prerequisites = $skill['prerequisites'] ?? [];
        foreach ($prerequisites as $prerequisite) {
            if (!in_array((string) $prerequisite, $stats->unlocked_skills, true)) {
                throw new \RuntimeException('Missing skill prerequisites');
            }
        }

        $cost = (float) ($skill['cost'] ?? 0);
        if ($stats->bank_balance < $cost) {
            throw new \RuntimeException('Insufficient bank balance');
        }

        $updatedSkills = $stats->unlocked_skills;
        $updatedSkills[] = $skillId;

        $this->statsRepo->updateStats($userId, [
            'bank_balance' => $stats->bank_balance - $cost,
            'unlocked_skills' => array_values(array_unique($updatedSkills)),
        ]);

        $freshStats = $this->statsRepo->findByUserId($userId);
        $statsArray = $freshStats?->toArray() ?? [];
        $this->logger->log($userId, [
            'sessionId' => 'meta_progression_user_' . $userId,
            'gamePhase' => 'meta',
            'fuel' => 0,
            'earnings' => 0,
            'timeRemaining' => 0,
            'ridesCompleted' => 0,
        ], 'skill_purchased', [
            'skillId' => $skillId,
            'cost' => $cost,
        ]);

        return $statsArray;
    }
}
