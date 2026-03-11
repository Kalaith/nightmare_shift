<?php
declare(strict_types=1);

namespace App\Actions;

use App\Services\ReputationService;
use App\Services\ItemService;
use App\Services\PassengerService;
use App\External\PlayerStatsRepository;
use App\External\BackstoryRepository;
use App\External\AlmanacRepository;
use App\External\GameSaveRepository;
use App\Services\GameSessionLogger;

final class CompleteRideAction
{
    public function __construct(
        private readonly ReputationService $reputationService,
        private readonly ItemService $itemService,
        private readonly PassengerService $passengerService,
        private readonly PlayerStatsRepository $statsRepo,
        private readonly BackstoryRepository $backstoryRepo,
        private readonly AlmanacRepository $almanacRepo,
        private readonly GameSaveRepository $saveRepo,
        private readonly GameSessionLogger $logger
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
        $stats = $this->statsRepo->findByUserId($userId);
        if ($stats !== null) {
            $encountered = $stats->passengers_encountered;
            if (!in_array($passengerId, $encountered, true)) {
                $encountered[] = $passengerId;
            }

            $almanacProgress = $stats->almanac_progress;
            $existingEntry = is_array($almanacProgress[$passengerId] ?? null) ? $almanacProgress[$passengerId] : [];
            $almanacProgress[$passengerId] = [
                'passengerId' => $passengerId,
                'encountered' => true,
                'knowledgeLevel' => max(1, (int) ($existingEntry['knowledgeLevel'] ?? 0)),
                'unlockedSecrets' => is_array($existingEntry['unlockedSecrets'] ?? null) ? $existingEntry['unlockedSecrets'] : [],
            ];

            $updates = [
                'passengers_encountered' => array_values(array_unique($encountered)),
                'almanac_progress' => $almanacProgress,
            ];

            if ($backstoryUnlocked !== null) {
                $backstoriesUnlocked = $stats->backstories_unlocked;
                if (!in_array($passengerId, $backstoriesUnlocked, true)) {
                    $backstoriesUnlocked[] = $passengerId;
                }
                $updates['backstories_unlocked'] = array_values(array_unique($backstoriesUnlocked));
            }

            $this->statsRepo->updateStats($userId, $updates);
        }

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
        $this->logger->log($userId, $gameState, 'ride_completed', [
            'passengerId' => $passengerId,
            'fareEarned' => $fare,
            'itemsReceived' => count($itemsReceived),
        ]);
        return $gameState;
    }
}
