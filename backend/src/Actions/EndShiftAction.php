<?php
declare(strict_types=1);

namespace App\Actions;

use App\Services\GameEngineService;
use App\External\PlayerStatsRepository;
use App\External\LeaderboardRepository;
use App\External\GameSaveRepository;
use App\Models\LeaderboardEntry;

final class EndShiftAction
{
    public function __construct(
        private readonly PlayerStatsRepository $statsRepo,
        private readonly LeaderboardRepository $leaderboardRepo,
        private readonly GameSaveRepository $saveRepo
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
        $gameEngine = new GameEngineService();

        $earnings = (float) ($gameState['earnings'] ?? 0);
        $ridesCompleted = (int) ($gameState['ridesCompleted'] ?? 0);
        $timeRemaining = (float) ($gameState['timeRemaining'] ?? 0);
        $rulesViolated = (int) ($gameState['rulesViolated'] ?? 0);
        $difficultyLevel = (int) ($gameState['difficultyLevel'] ?? 0);
        $survived = ($gameState['gamePhase'] ?? '') === 'success';

        $shiftStartTime = (int) ($gameState['shiftStartTime'] ?? time());
        $timeSpent = (time() - $shiftStartTime) / 60; // minutes

        // Calculate score
        $score = $gameEngine->calculateScore($earnings, $ridesCompleted, $timeSpent);
        if ($survived) {
            $score += 50; // Survival bonus
        }

        // Update player stats
        $stats = $this->statsRepo->findByUserId($userId);
        if ($stats) {
            $updates = [
                'total_shifts_completed' => $stats->total_shifts_completed + 1,
                'total_rides_completed' => $stats->total_rides_completed + $ridesCompleted,
                'total_earnings' => $stats->total_earnings + $earnings,
                'total_time_played_minutes' => $stats->total_time_played_minutes + (int) $timeSpent,
                'best_shift_earnings' => max($stats->best_shift_earnings, $earnings),
                'best_shift_rides' => max($stats->best_shift_rides, $ridesCompleted),
                'longest_shift_minutes' => max($stats->longest_shift_minutes, (int) $timeSpent),
                'bank_balance' => $stats->bank_balance + $earnings,
            ];
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
