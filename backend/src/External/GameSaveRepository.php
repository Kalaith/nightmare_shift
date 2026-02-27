<?php
declare(strict_types=1);

namespace App\External;

use App\Models\GameSave;
use PDO;

final class GameSaveRepository
{
    public function __construct(
        private readonly PDO $db
    ) {}

    public function findByUserId(int $userId): ?GameSave
    {
        $stmt = $this->db->prepare('SELECT * FROM game_saves WHERE user_id = :user_id LIMIT 1');
        $stmt->execute(['user_id' => $userId]);
        $data = $stmt->fetch();

        return $data ? $this->mapToModel($data) : null;
    }

    /**
     * Save or update game state (upsert — one save per user).
     *
     * @param array<string, mixed> $gameState
     */
    public function save(int $userId, array $gameState, string $version = '1.0.0'): GameSave
    {
        $existing = $this->findByUserId($userId);
        $stateJson = json_encode($gameState);

        if ($existing !== null) {
            $stmt = $this->db->prepare(
                'UPDATE game_saves SET game_state = :game_state, version = :version, updated_at = NOW()
                 WHERE user_id = :user_id'
            );
            $stmt->execute([
                'game_state' => $stateJson,
                'version' => $version,
                'user_id' => $userId,
            ]);

            $existing->game_state = $gameState;
            $existing->version = $version;
            return $existing;
        }

        $stmt = $this->db->prepare(
            'INSERT INTO game_saves (user_id, game_state, version, created_at, updated_at)
             VALUES (:user_id, :game_state, :version, NOW(), NOW())'
        );
        $stmt->execute([
            'user_id' => $userId,
            'game_state' => $stateJson,
            'version' => $version,
        ]);

        $save = new GameSave();
        $save->id = (int) $this->db->lastInsertId();
        $save->user_id = $userId;
        $save->game_state = $gameState;
        $save->version = $version;

        return $save;
    }

    public function deleteByUserId(int $userId): void
    {
        $stmt = $this->db->prepare('DELETE FROM game_saves WHERE user_id = :user_id');
        $stmt->execute(['user_id' => $userId]);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function mapToModel(array $data): GameSave
    {
        $save = new GameSave();
        $save->id = (int) $data['id'];
        $save->user_id = (int) $data['user_id'];
        $save->game_state = json_decode($data['game_state'] ?? '{}', true) ?: [];
        $save->version = $data['version'] ?? '1.0.0';
        $save->created_at = $data['created_at'] ?? '';
        $save->updated_at = $data['updated_at'] ?? '';

        return $save;
    }
}
