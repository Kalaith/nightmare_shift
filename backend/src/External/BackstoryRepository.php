<?php
declare(strict_types=1);

namespace App\External;

use PDO;

final class BackstoryRepository
{
    public function __construct(
        private readonly PDO $db
    ) {}

    /**
     * Get all unlocked passenger backstory IDs for a user.
     *
     * @return int[]
     */
    public function getUnlocked(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT passenger_id FROM backstory_progress WHERE user_id = :user_id'
        );
        $stmt->execute(['user_id' => $userId]);

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    /**
     * Unlock a backstory for a user.
     */
    public function unlock(int $userId, int $passengerId): void
    {
        $stmt = $this->db->prepare(
            'INSERT IGNORE INTO backstory_progress (user_id, passenger_id, unlocked_at)
             VALUES (:user_id, :passenger_id, NOW())'
        );
        $stmt->execute([
            'user_id' => $userId,
            'passenger_id' => $passengerId,
        ]);
    }

    /**
     * Check if a backstory is unlocked.
     */
    public function isUnlocked(int $userId, int $passengerId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM backstory_progress
             WHERE user_id = :user_id AND passenger_id = :passenger_id'
        );
        $stmt->execute([
            'user_id' => $userId,
            'passenger_id' => $passengerId,
        ]);

        return (int) $stmt->fetchColumn() > 0;
    }
}
