<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\AlmanacRepository;
use App\External\GameContentRepository;
use App\External\PlayerStatsRepository;
use App\Services\GameSessionLogger;

final class UpgradeAlmanacAction
{
    public function __construct(
        private readonly PlayerStatsRepository $statsRepo,
        private readonly GameContentRepository $contentRepo,
        private readonly AlmanacRepository $almanacRepo,
        private readonly GameSessionLogger $logger
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(int $userId, int $passengerId): array
    {
        $stats = $this->statsRepo->findByUserId($userId);
        if ($stats === null) {
            throw new \RuntimeException('Player stats not found');
        }

        $entry = $stats->almanac_progress[$passengerId] ?? null;
        if (!is_array($entry) || empty($entry['encountered'])) {
            throw new \RuntimeException('Passenger has not been encountered');
        }

        $currentLevel = (int) ($entry['knowledgeLevel'] ?? 0);
        if ($currentLevel >= 3) {
            throw new \RuntimeException('Almanac entry already maxed');
        }

        $levels = $this->contentRepo->getAllAlmanacLevels();
        $cost = null;
        foreach ($levels as $level) {
            if ((int) ($level['level'] ?? -1) === $currentLevel + 1) {
                $cost = (int) ($level['loreCost'] ?? 0);
                break;
            }
        }
        if ($cost === null) {
            throw new \RuntimeException('Next almanac level configuration missing');
        }

        if ($stats->lore_fragments < $cost) {
            throw new \RuntimeException('Not enough lore fragments');
        }

        $progress = $stats->almanac_progress;
        $newLevel = $currentLevel + 1;
        $progress[$passengerId] = [
            ...$entry,
            'knowledgeLevel' => $newLevel,
        ];

        $this->statsRepo->updateStats($userId, [
            'lore_fragments' => $stats->lore_fragments - $cost,
            'almanac_progress' => $progress,
        ]);
        $this->almanacRepo->updateEntry(
            $userId,
            $passengerId,
            $newLevel,
            is_array($entry['unlockedSecrets'] ?? null) ? $entry['unlockedSecrets'] : []
        );

        $freshStats = $this->statsRepo->findByUserId($userId);
        $statsArray = $freshStats?->toArray() ?? [];
        $this->logger->log($userId, [
            'sessionId' => 'meta_progression_user_' . $userId,
            'gamePhase' => 'meta',
            'fuel' => 0,
            'earnings' => 0,
            'timeRemaining' => 0,
            'ridesCompleted' => 0,
        ], 'almanac_upgraded', [
            'passengerId' => $passengerId,
            'newLevel' => $newLevel,
            'cost' => $cost,
        ]);

        return $statsArray;
    }
}
