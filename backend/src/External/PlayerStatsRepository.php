<?php
declare(strict_types=1);

namespace App\External;

use App\Models\PlayerStats;
use PDO;

final class PlayerStatsRepository
{
    public function __construct(
        private readonly PDO $db
    ) {}

    public function findByUserId(int $userId): ?PlayerStats
    {
        $stmt = $this->db->prepare('SELECT * FROM player_stats WHERE user_id = :user_id LIMIT 1');
        $stmt->execute(['user_id' => $userId]);
        $data = $stmt->fetch();

        return $data ? $this->mapToModel($data) : null;
    }

    /**
     * Create default stats for a new player.
     */
    public function createDefault(int $userId): PlayerStats
    {
        $now = date('Y-m-d H:i:s');
        $stmt = $this->db->prepare(
            'INSERT INTO player_stats (user_id, first_play_date, last_play_date, created_at, updated_at)
             VALUES (:user_id, NOW(), NOW(), NOW(), NOW())'
        );
        $stmt->execute(['user_id' => $userId]);

        $stats = new PlayerStats();
        $stats->id = (int) $this->db->lastInsertId();
        $stats->user_id = $userId;
        $stats->first_play_date = $now;
        $stats->last_play_date = $now;

        return $stats;
    }

    /**
     * Update player stats with partial data.
     *
     * @param array<string, mixed> $updates
     */
    public function updateStats(int $userId, array $updates): void
    {
        // JSON fields that need encoding
        $jsonFields = [
            'unlocked_skills', 'passengers_encountered', 'backstories_unlocked',
            'legendary_passengers', 'achievements_unlocked', 'rules_violated_history',
            'almanac_progress'
        ];

        $sets = [];
        $params = ['user_id' => $userId];

        foreach ($updates as $key => $value) {
            if (in_array($key, $jsonFields, true)) {
                $sets[] = "{$key} = :val_{$key}";
                $params["val_{$key}"] = json_encode($value);
            } else {
                $sets[] = "{$key} = :val_{$key}";
                $params["val_{$key}"] = $value;
            }
        }

        $sets[] = 'last_play_date = NOW()';
        $sets[] = 'updated_at = NOW()';

        $sql = 'UPDATE player_stats SET ' . implode(', ', $sets) . ' WHERE user_id = :user_id';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function mapToModel(array $data): PlayerStats
    {
        $stats = new PlayerStats();
        $stats->id = (int) $data['id'];
        $stats->user_id = (int) $data['user_id'];
        $stats->total_shifts_completed = (int) ($data['total_shifts_completed'] ?? 0);
        $stats->total_shifts_started = (int) ($data['total_shifts_started'] ?? 0);
        $stats->total_rides_completed = (int) ($data['total_rides_completed'] ?? 0);
        $stats->total_earnings = (float) ($data['total_earnings'] ?? 0);
        $stats->total_fuel_used = (float) ($data['total_fuel_used'] ?? 0);
        $stats->total_time_played_minutes = (int) ($data['total_time_played_minutes'] ?? 0);
        $stats->best_shift_earnings = (float) ($data['best_shift_earnings'] ?? 0);
        $stats->best_shift_rides = (int) ($data['best_shift_rides'] ?? 0);
        $stats->longest_shift_minutes = (int) ($data['longest_shift_minutes'] ?? 0);
        $stats->bank_balance = (float) ($data['bank_balance'] ?? 0);
        $stats->lore_fragments = (int) ($data['lore_fragments'] ?? 0);
        $stats->unlocked_skills = json_decode($data['unlocked_skills'] ?? '[]', true) ?: [];
        $stats->passengers_encountered = json_decode($data['passengers_encountered'] ?? '[]', true) ?: [];
        $stats->backstories_unlocked = json_decode($data['backstories_unlocked'] ?? '[]', true) ?: [];
        $stats->legendary_passengers = json_decode($data['legendary_passengers'] ?? '[]', true) ?: [];
        $stats->achievements_unlocked = json_decode($data['achievements_unlocked'] ?? '[]', true) ?: [];
        $stats->rules_violated_history = json_decode($data['rules_violated_history'] ?? '[]', true) ?: [];
        $stats->almanac_progress = json_decode($data['almanac_progress'] ?? '{}', true) ?: [];
        $stats->first_play_date = $data['first_play_date'] ?? null;
        $stats->last_play_date = $data['last_play_date'] ?? null;
        $stats->created_at = $data['created_at'] ?? '';
        $stats->updated_at = $data['updated_at'] ?? '';

        return $stats;
    }
}
