<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\GameSaveRepository;
use App\Services\GameSessionLogger;

final class RefuelAction
{
    public function __construct(
        private readonly GameSaveRepository $saveRepo,
        private readonly GameSessionLogger $logger
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(int $userId, string $mode): array
    {
        $save = $this->saveRepo->findByUserId($userId);
        if ($save === null) {
            throw new \RuntimeException('No active game session');
        }

        $gameState = $save->game_state;
        $fuel = (float) ($gameState['fuel'] ?? 0);
        $earnings = (float) ($gameState['earnings'] ?? 0);

        if (($gameState['gamePhase'] ?? '') !== 'waiting') {
            throw new \RuntimeException('You can only refuel between rides');
        }

        $fuelToAdd = $mode === 'full'
            ? max(0, 100 - $fuel)
            : max(0, min(25, 100 - $fuel));

        if ($fuelToAdd <= 0) {
            return $gameState;
        }

        $cost = (float) ceil($fuelToAdd * 0.5);
        if ($earnings < $cost) {
            throw new \RuntimeException('Not enough earnings to refuel');
        }

        $gameState['fuel'] = min(100, $fuel + $fuelToAdd);
        $gameState['earnings'] = max(0, $earnings - $cost);

        $this->saveRepo->save($userId, $gameState);
        $this->logger->log($userId, $gameState, 'refuel', [
            'mode' => $mode,
            'fuelAdded' => $fuelToAdd,
            'cost' => $cost,
        ]);

        return $gameState;
    }
}
