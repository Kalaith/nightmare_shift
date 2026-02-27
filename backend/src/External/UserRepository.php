<?php
declare(strict_types=1);

namespace App\External;

use App\Models\User;
use PDO;

final class UserRepository
{
    public function __construct(
        private readonly PDO $db
    ) {}

    public function findById(int $id): ?User
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $data = $stmt->fetch();

        return $data ? $this->mapToModel($data) : null;
    }

    public function findByWhUserId(int $whUserId): ?User
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE wh_user_id = :wh_user_id LIMIT 1');
        $stmt->execute(['wh_user_id' => $whUserId]);
        $data = $stmt->fetch();

        return $data ? $this->mapToModel($data) : null;
    }

    /**
     * Create or update a user from Web Hatchery login data.
     */
    public function upsertWebHatcheryUser(int $whUserId, string $email, string $username): User
    {
        $existing = $this->findByWhUserId($whUserId);

        if ($existing !== null) {
            $stmt = $this->db->prepare(
                'UPDATE users SET email = :email, username = :username, last_seen_at = NOW(), updated_at = NOW()
                 WHERE wh_user_id = :wh_user_id'
            );
            $stmt->execute([
                'email' => $email,
                'username' => $username,
                'wh_user_id' => $whUserId,
            ]);

            return $this->findByWhUserId($whUserId) ?? $existing;
        }

        $stmt = $this->db->prepare(
            'INSERT INTO users (wh_user_id, email, username, is_active, created_at, updated_at, last_seen_at)
             VALUES (:wh_user_id, :email, :username, 1, NOW(), NOW(), NOW())'
        );
        $stmt->execute([
            'wh_user_id' => $whUserId,
            'email' => $email,
            'username' => $username,
        ]);

        $user = new User();
        $user->id = (int) $this->db->lastInsertId();
        $user->wh_user_id = $whUserId;
        $user->email = $email;
        $user->username = $username;
        $user->is_active = true;

        return $user;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function mapToModel(array $data): User
    {
        $user = new User();
        $user->id = (int) $data['id'];
        $user->wh_user_id = (int) $data['wh_user_id'];
        $user->email = $data['email'] ?? '';
        $user->username = $data['username'] ?? 'driver';
        $user->is_active = (bool) ($data['is_active'] ?? true);
        $user->created_at = $data['created_at'] ?? '';
        $user->updated_at = $data['updated_at'] ?? '';
        $user->last_seen_at = $data['last_seen_at'] ?? null;

        return $user;
    }
}
