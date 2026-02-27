<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\LeaderboardRepository;

final class GetLeaderboardAction
{
    public function __construct(
        private readonly LeaderboardRepository $leaderboardRepo
    ) {}

    /**
     * @return array<int, array<string, mixed>>
     */
    public function execute(int $limit = 10): array
    {
        $entries = $this->leaderboardRepo->getTopScores($limit);
        return array_map(fn($entry) => $entry->toArray(), $entries);
    }
}
