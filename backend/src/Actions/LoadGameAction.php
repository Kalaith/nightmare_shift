<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\GameSaveRepository;

final class LoadGameAction
{
    public function __construct(
        private readonly GameSaveRepository $saveRepo
    ) {}

    /**
     * @return array<string, mixed>|null
     */
    public function execute(int $userId): ?array
    {
        $save = $this->saveRepo->findByUserId($userId);
        return $save?->game_state;
    }
}
