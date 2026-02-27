<?php
declare(strict_types=1);

namespace App\External;

use PDO;

final class AlmanacRepository
{
    public function __construct(
        private readonly PDO $db
    ) {}

    /**
     * Get all almanac entries for a user.
     *
     * @return array<int, array<string, mixed>> Keyed by passenger_id
     */
    public function getByUserId(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM almanac_entries WHERE user_id = :user_id'
        );
        $stmt->execute(['user_id' => $userId]);

        $entries = [];
        foreach ($stmt->fetchAll() as $row) {
            $entries[(int) $row['passenger_id']] = [
                'passengerId' => (int) $row['passenger_id'],
                'encountered' => true,
                'knowledgeLevel' => (int) $row['knowledge_level'],
                'unlockedSecrets' => json_decode($row['unlocked_secrets'] ?? '[]', true) ?: [],
            ];
        }

        return $entries;
    }

    /**
     * Create or update an almanac entry.
     */
    public function updateEntry(int $userId, int $passengerId, int $knowledgeLevel, array $secrets = []): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO almanac_entries (user_id, passenger_id, knowledge_level, unlocked_secrets, created_at, updated_at)
             VALUES (:user_id, :passenger_id, :knowledge_level, :secrets, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                knowledge_level = GREATEST(knowledge_level, :knowledge_level_upd),
                unlocked_secrets = :secrets_upd,
                updated_at = NOW()'
        );
        $secretsJson = json_encode($secrets);
        $stmt->execute([
            'user_id' => $userId,
            'passenger_id' => $passengerId,
            'knowledge_level' => $knowledgeLevel,
            'secrets' => $secretsJson,
            'knowledge_level_upd' => $knowledgeLevel,
            'secrets_upd' => $secretsJson,
        ]);
    }
}
