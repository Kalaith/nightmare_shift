<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\GameSaveRepository;
use App\Services\GameSessionLogger;

final class DeclineRideAction
{
    public function __construct(
        private readonly GameSaveRepository $saveRepo,
        private readonly GameSessionLogger $logger
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(int $userId): array
    {
        $save = $this->saveRepo->findByUserId($userId);
        if ($save === null) {
            throw new \RuntimeException('No active game session');
        }

        $gameState = $save->game_state;
        $declinedPassenger = $gameState['currentPassenger'] ?? null;

        $gameState['gamePhase'] = 'waiting';
        $gameState['currentPassenger'] = null;
        $gameState['currentRide'] = null;
        $gameState['currentDialogue'] = null;
        $gameState['rideProgress'] = null;
        $gameState['pendingTipOffer'] = null;
        $gameState['cabState'] = [
            'windowsOpen' => false,
            'radioOn' => false,
        ];

        $this->saveRepo->save($userId, $gameState);
        $this->logger->log($userId, $gameState, 'ride_declined', [
            'passengerId' => $declinedPassenger['id'] ?? null,
            'passengerName' => $declinedPassenger['name'] ?? null,
        ]);

        return $gameState;
    }
}
