<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\PlayerStatsRepository;
use App\External\LeaderboardRepository;
use App\External\GameSaveRepository;
use App\Models\LeaderboardEntry;
use App\Services\GameSessionLogger;

final class EndShiftAction
{
    public function __construct(
        private readonly PlayerStatsRepository $statsRepo,
        private readonly LeaderboardRepository $leaderboardRepo,
        private readonly GameSaveRepository $saveRepo,
        private readonly GameSessionLogger $logger
    ) {}

    /**
     * End a shift — calculate final score, update stats, add to leaderboard.
     *
     * @return array<string, mixed>
     */
    public function execute(int $userId): array
    {
        $save = $this->saveRepo->findByUserId($userId);
        if ($save === null) {
            throw new \RuntimeException('No active game session');
        }

        $gameState = $save->game_state;

        $earnings = (float) ($gameState['earnings'] ?? 0);
        $ridesCompleted = (int) ($gameState['ridesCompleted'] ?? 0);
        $timeRemaining = (float) ($gameState['timeRemaining'] ?? 0);
        $rulesViolated = (int) ($gameState['rulesViolated'] ?? 0);
        $difficultyLevel = (int) ($gameState['difficultyLevel'] ?? 0);
        $survived = ($gameState['gamePhase'] ?? '') === 'success';

        $shiftStartTime = (int) ($gameState['shiftStartTime'] ?? time());
        $timeSpent = (time() - $shiftStartTime) / 60; // minutes

        // Calculate score
        $score = (int) round($earnings * 0.4 + $ridesCompleted * 20 + $timeSpent * 0.1);
        if ($survived) {
            $score += 50; // Survival bonus
        }

        // Update player stats
        $bankTransfer = 0;
        $loreReward = 0;
        $stats = $this->statsRepo->findByUserId($userId);
        if ($stats) {
            $backstoriesThisShift = is_array($gameState['passengerBackstories'] ?? null)
                ? count($gameState['passengerBackstories'])
                : 0;
            $loreRewardBase = $backstoriesThisShift + max($difficultyLevel, 1);
            $loreReward = $survived
                ? $loreRewardBase
                : (int) floor($loreRewardBase / 2);
            $bankTransfer = $survived
                ? (int) floor($earnings * 0.2)
                : (int) floor($earnings * 0.1);

            $usedPassengers = is_array($gameState['usedPassengers'] ?? null)
                ? array_map('intval', $gameState['usedPassengers'])
                : [];
            $allEncountered = array_values(array_unique(array_merge($stats->passengers_encountered, $usedPassengers)));

            $unlockedBackstories = array_keys(is_array($gameState['passengerBackstories'] ?? null) ? $gameState['passengerBackstories'] : []);
            $allBackstories = array_values(array_unique(array_merge($stats->backstories_unlocked, array_map('intval', $unlockedBackstories))));

            $updates = [
                'total_rides_completed' => $stats->total_rides_completed + $ridesCompleted,
                'total_earnings' => $stats->total_earnings + $earnings,
                'total_time_played_minutes' => $stats->total_time_played_minutes + (int) $timeSpent,
                'bank_balance' => $stats->bank_balance + $bankTransfer,
                'lore_fragments' => $stats->lore_fragments + $loreReward,
                'passengers_encountered' => $allEncountered,
                'backstories_unlocked' => $allBackstories,
            ];
            if ($survived) {
                $updates['total_shifts_completed'] = $stats->total_shifts_completed + 1;
                $updates['best_shift_earnings'] = max($stats->best_shift_earnings, $earnings);
                $updates['best_shift_rides'] = max($stats->best_shift_rides, $ridesCompleted);
                $updates['longest_shift_minutes'] = max($stats->longest_shift_minutes, (int) $timeSpent);
            }
            $this->statsRepo->updateStats($userId, $updates);
        }

        // Add to leaderboard
        $entry = new LeaderboardEntry();
        $entry->user_id = $userId;
        $entry->score = $score;
        $entry->time_remaining = (int) $timeRemaining;
        $entry->passengers_transported = $ridesCompleted;
        $entry->difficulty_level = $difficultyLevel;
        $entry->rules_violated = $rulesViolated;
        $entry->survived = $survived;
        $this->leaderboardRepo->addScore($entry);

        $finalState = $gameState;
        $finalState['gamePhase'] = $survived ? 'success' : ($gameState['gamePhase'] ?? 'gameOver');
        $this->logger->log($userId, $finalState, 'shift_ended', [
            'score' => $score,
            'survived' => $survived,
            'bankTransfer' => $bankTransfer,
            'loreReward' => $loreReward,
        ]);

        // Clear save
        $this->saveRepo->deleteByUserId($userId);

        return [
            'score' => $score,
            'earnings' => $earnings,
            'ridesCompleted' => $ridesCompleted,
            'timeSpent' => round($timeSpent, 1),
            'rulesViolated' => $rulesViolated,
            'survived' => $survived,
            'difficultyLevel' => $difficultyLevel,
        ];
    }
}
