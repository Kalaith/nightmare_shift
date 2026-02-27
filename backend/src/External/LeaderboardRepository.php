<?php
declare(strict_types=1);

namespace App\External;

use App\Models\LeaderboardEntry;
use PDO;

final class LeaderboardRepository
{
    public function __construct(
        private readonly PDO $db
    ) {}

    /**
     * Get top scores across all users.
     *
     * @return LeaderboardEntry[]
     */
    public function getTopScores(int $limit = 10): array
    {
        $stmt = $this->db->prepare(
            'SELECT l.*, u.username
             FROM leaderboard l
             JOIN users u ON l.user_id = u.id
             ORDER BY l.score DESC
             LIMIT :lim'
        );
        $stmt->bindValue('lim', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([$this, 'mapToModel'], $stmt->fetchAll());
    }

    /**
     * Get a specific user's top scores.
     *
     * @return LeaderboardEntry[]
     */
    public function getUserScores(int $userId, int $limit = 10): array
    {
        $stmt = $this->db->prepare(
            'SELECT l.*, u.username
             FROM leaderboard l
             JOIN users u ON l.user_id = u.id
             WHERE l.user_id = :user_id
             ORDER BY l.score DESC
             LIMIT :lim'
        );
        $stmt->bindValue('user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue('lim', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([$this, 'mapToModel'], $stmt->fetchAll());
    }

    public function addScore(LeaderboardEntry $entry): LeaderboardEntry
    {
        $stmt = $this->db->prepare(
            'INSERT INTO leaderboard (user_id, score, time_remaining, passengers_transported, difficulty_level, rules_violated, survived, played_at)
             VALUES (:user_id, :score, :time_remaining, :passengers_transported, :difficulty_level, :rules_violated, :survived, NOW())'
        );
        $stmt->execute([
            'user_id' => $entry->user_id,
            'score' => $entry->score,
            'time_remaining' => $entry->time_remaining,
            'passengers_transported' => $entry->passengers_transported,
            'difficulty_level' => $entry->difficulty_level,
            'rules_violated' => $entry->rules_violated,
            'survived' => $entry->survived ? 1 : 0,
        ]);

        $entry->id = (int) $this->db->lastInsertId();
        return $entry;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function mapToModel(array $data): LeaderboardEntry
    {
        $entry = new LeaderboardEntry();
        $entry->id = (int) $data['id'];
        $entry->user_id = (int) $data['user_id'];
        $entry->score = (int) ($data['score'] ?? 0);
        $entry->time_remaining = (int) ($data['time_remaining'] ?? 0);
        $entry->passengers_transported = (int) ($data['passengers_transported'] ?? 0);
        $entry->difficulty_level = (int) ($data['difficulty_level'] ?? 0);
        $entry->rules_violated = (int) ($data['rules_violated'] ?? 0);
        $entry->survived = (bool) ($data['survived'] ?? false);
        $entry->played_at = $data['played_at'] ?? '';
        $entry->username = $data['username'] ?? null;

        return $entry;
    }
}
