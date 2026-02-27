<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\PlayerStatsRepository;

final class GetPlayerStatsAction
{
    public function __construct(
        private readonly PlayerStatsRepository $statsRepo
    ) {}

    /**
     * @return array<string, mixed>|null
     */
    public function execute(int $userId): ?array
    {
        $stats = $this->statsRepo->findByUserId($userId);
        return $stats?->toArray();
    }
}
