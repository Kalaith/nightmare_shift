<?php
declare(strict_types=1);

namespace App\Actions;

use App\Services\ReputationService;
use App\Services\ItemService;
use App\Services\PassengerService;
use App\External\BackstoryRepository;
use App\External\AlmanacRepository;
use App\External\GameSaveRepository;

final class CompleteRideAction
{
    public function __construct(
        private readonly ReputationService $reputationService,
        private readonly ItemService $itemService,
        private readonly PassengerService $passengerService,
        private readonly BackstoryRepository $backstoryRepo,
        private readonly AlmanacRepository $almanacRepo,
        private readonly GameSaveRepository $saveRepo
    ) {}

    /**
     * Complete a ride — handle drop-off, items, backstory, reputation.
     *
     * @return array<string, mixed> Updated game state
     */
    public function execute(int $userId, bool $isPositiveOutcome = true): array
    {
        $save = $this->saveRepo->findByUserId($userId);
        if ($save === null) {
            throw new \RuntimeException('No active game session');
        }

        $gameState = $save->game_state;
        $passenger = $gameState['currentPassenger'] ?? null;
        $ride = $gameState['currentRide'] ?? null;

        if ($passenger === null || $ride === null) {
            throw new \RuntimeException('No active ride to complete');
        }

        $passengerId = (int) ($passenger['id'] ?? 0);
        $fare = (float) ($ride['actualFare'] ?? $passenger['fare'] ?? 10);

        // Apply reputation modifier to fare
        $reputationMap = $gameState['passengerReputation'] ?? [];
        $reputation = $this->reputationService->getPassengerReputation($reputationMap, $passengerId);
        $repMod = $this->reputationService->getReputationModifier($reputation);
        $fare *= $repMod['fareMultiplier'];

        // Add earnings
        $gameState['earnings'] = ($gameState['earnings'] ?? 0) + $fare;
        $gameState['ridesCompleted'] = ($gameState['ridesCompleted'] ?? 0) + 1;

        // Update reputation
        $gameState['passengerReputation'] = $this->reputationService->updateReputation(
            $reputationMap,
            $passengerId,
            $isPositiveOutcome
        );

        // Handle items
        $itemsReceived = [];
        $passengerItems = $passenger['items'] ?? [];
        if (!empty($passengerItems)) {
            // Random chance to receive an item
            if ((random_int(0, 100) / 100) < 0.3) {
                $itemName = $passengerItems[array_rand($passengerItems)];
                $newItem = $this->itemService->createInventoryItem($itemName, $passenger['name'] ?? 'Unknown');
                $gameState['inventory'][] = $newItem;
                $itemsReceived[] = $newItem;
            }
        }

        // Check backstory unlock
        $passengerBackstories = $gameState['passengerBackstories'] ?? [];
        $isFirstEncounter = !isset($passengerBackstories[$passengerId]);
        $backstoryUnlocked = null;

        if ($this->passengerService->checkBackstoryUnlock($passenger, $isFirstEncounter)) {
            $backstoryUnlocked = [
                'passenger' => $passenger['name'] ?? 'Unknown',
                'backstory' => $passenger['backstoryDetails'] ?? 'A mysterious past...',
            ];
            $passengerBackstories[$passengerId] = true;
            $gameState['passengerBackstories'] = $passengerBackstories;

            // Persist to database
            $this->backstoryRepo->unlock($userId, $passengerId);
        }

        // Update almanac
        $this->almanacRepo->updateEntry($userId, $passengerId, 1);

        // Record completed ride
        $gameState['completedRides'][] = [
            'passenger' => $passenger,
            'duration' => time() - (int) ($ride['startTime'] ?? time()),
            'timestamp' => time(),
        ];

        // Set last ride completion info
        $gameState['lastRideCompletion'] = [
            'passenger' => $passenger,
            'fareEarned' => $fare,
            'itemsReceived' => $itemsReceived,
            'backstoryUnlocked' => $backstoryUnlocked,
        ];

        // Reset ride state
        $gameState['currentPassenger'] = null;
        $gameState['currentRide'] = null;
        $gameState['currentDrivingPhase'] = null;
        $gameState['gamePhase'] = 'dropOff';

        // Process item deterioration
        $gameState['inventory'] = $this->itemService->processItemDeterioration($gameState['inventory'] ?? []);

        // Check success condition
        if (($gameState['timeRemaining'] ?? 0) <= 0) {
            if (($gameState['earnings'] ?? 0) >= ($gameState['minimumEarnings'] ?? 30)) {
                $gameState['gamePhase'] = 'success';
                $gameState['survivalBonus'] = 50;
            } else {
                $gameState['gamePhase'] = 'gameOver';
                $gameState['gameOverReason'] = 'Insufficient earnings';
            }
        }

        $this->saveRepo->save($userId, $gameState);
        return $gameState;
    }
}
