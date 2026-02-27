<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\GameSaveRepository;

final class SaveGameAction
{
    public function __construct(
        private readonly GameSaveRepository $saveRepo
    ) {}

    /**
     * @param array<string, mixed> $gameState
     */
    public function execute(int $userId, array $gameState): void
    {
        $this->saveRepo->save($userId, $gameState);
    }
}
