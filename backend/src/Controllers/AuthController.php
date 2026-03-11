<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\External\GameSaveRepository;
use App\External\PlayerStatsRepository;
use App\External\UserRepository;
use Firebase\JWT\JWT;

final class AuthController
{
    public function __construct(
        private readonly \PDO $pdo,
        private readonly UserRepository $userRepo,
        private readonly PlayerStatsRepository $statsRepo,
        private readonly GameSaveRepository $saveRepo
    ) {}

    public function session(Request $request, Response $response): void
    {
        $authUser = $request->getAttribute('auth_user');

        if (!$authUser || empty($authUser['id'])) {
            $response->unauthorized();
            return;
        }

        $whUserId = (int) ($authUser['wh_user_id'] ?? $authUser['id'] ?? 0);
        $email = (string) ($authUser['email'] ?? '');
        $username = (string) ($authUser['username'] ?? '');

        if ($username === '' && $email !== '') {
            $username = explode('@', $email)[0];
        }
        if ($username === '') {
            $username = 'driver';
        }

        try {
            $user = !empty($authUser['is_guest'])
                ? ($this->userRepo->findById((int) $authUser['id']) ?? $this->userRepo->upsertWebHatcheryUser($whUserId, $email, $username))
                : $this->userRepo->upsertWebHatcheryUser($whUserId, $email, $username);

            $stats = $this->statsRepo->findByUserId($user->id);
            if ($stats === null) {
                $stats = $this->statsRepo->createDefault($user->id);
            }

            $response->success([
                'user' => array_merge($user->toArray(), [
                    'display_name' => $user->username,
                    'role' => $authUser['role'] ?? 'user',
                    'roles' => $authUser['roles'] ?? ['user'],
                    'is_admin' => (bool) ($authUser['is_admin'] ?? false),
                    'is_guest' => (bool) ($authUser['is_guest'] ?? false),
                    'auth_type' => $authUser['auth_type'] ?? 'frontpage',
                    'guest_user_id' => $authUser['guest_user_id'] ?? null,
                ]),
                'stats' => $stats->toArray(),
            ], 'Session active');
        } catch (\Exception $e) {
            $response->error('Session error: ' . $e->getMessage(), 500);
        }
    }

    public function guestSession(Request $request, Response $response): void
    {
        $jwtSecret = $_ENV['JWT_SECRET'] ?? '';
        if ($jwtSecret === '') {
            $response->error('JWT secret not configured', 500);
            return;
        }

        try {
            $guestName = 'guest_' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
            $guestUser = $this->userRepo->createGuestUser($guestName);
            $stats = $this->statsRepo->createDefault($guestUser->id);

            $issuedAt = time();
            $token = JWT::encode([
                'sub' => $guestUser->wh_user_id,
                'user_id' => $guestUser->wh_user_id,
                'guest_user_id' => $guestUser->id,
                'username' => $guestUser->username,
                'display_name' => $guestUser->username,
                'role' => 'guest',
                'roles' => ['guest'],
                'auth_type' => 'guest',
                'is_guest' => true,
                'iat' => $issuedAt,
                'exp' => $issuedAt + (60 * 60 * 24 * 30),
            ], $jwtSecret, 'HS256');

            $response->success([
                'token' => $token,
                'user' => array_merge($guestUser->toArray(), [
                    'display_name' => $guestUser->username,
                    'role' => 'guest',
                    'roles' => ['guest'],
                    'is_admin' => false,
                    'is_guest' => true,
                    'auth_type' => 'guest',
                    'guest_user_id' => $guestUser->id,
                ]),
                'stats' => $stats->toArray(),
            ], 'Guest session created');
        } catch (\Exception $e) {
            $response->error('Guest session error: ' . $e->getMessage(), 500);
        }
    }

    public function linkGuest(Request $request, Response $response): void
    {
        $authUser = $request->getAttribute('auth_user');
        if (!$authUser || empty($authUser['id'])) {
            $response->unauthorized();
            return;
        }

        if (!empty($authUser['is_guest'])) {
            $response->error('Guest sessions cannot link to another guest session', 422);
            return;
        }

        $guestUserId = (int) $request->get('guest_user_id', 0);
        if ($guestUserId <= 0) {
            $response->error('Invalid guest user identifier', 422);
            return;
        }

        $currentUserId = (int) $authUser['id'];
        if ($guestUserId === $currentUserId) {
            $response->error('Guest account already linked', 422);
            return;
        }

        $guestUser = $this->userRepo->findById($guestUserId);
        if ($guestUser === null || !$this->userRepo->isGuestWhUserId($guestUser->wh_user_id)) {
            $response->error('Guest account not found', 404);
            return;
        }

        $targetUser = $this->userRepo->findById($currentUserId);
        if ($targetUser === null) {
            $response->error('Authenticated account not found', 404);
            return;
        }

        try {
            $this->pdo->beginTransaction();

            $this->mergePlayerStats($guestUser->id, $targetUser->id);
            $this->mergeGameSave($guestUser->id, $targetUser->id);
            $this->mergeBackstoryProgress($guestUser->id, $targetUser->id);
            $this->mergeAlmanacEntries($guestUser->id, $targetUser->id);

            $stmt = $this->pdo->prepare('UPDATE leaderboard SET user_id = :target_user_id WHERE user_id = :guest_user_id');
            $stmt->execute([
                'target_user_id' => $targetUser->id,
                'guest_user_id' => $guestUser->id,
            ]);

            $this->userRepo->deleteById($guestUser->id);
            $this->pdo->commit();

            $stats = $this->statsRepo->findByUserId($targetUser->id) ?? $this->statsRepo->createDefault($targetUser->id);

            $response->success([
                'linked' => true,
                'guest_user_id' => $guestUserId,
                'user' => array_merge($targetUser->toArray(), [
                    'display_name' => $targetUser->username,
                    'role' => $authUser['role'] ?? 'user',
                    'roles' => $authUser['roles'] ?? ['user'],
                    'is_admin' => (bool) ($authUser['is_admin'] ?? false),
                    'is_guest' => false,
                    'auth_type' => 'frontpage',
                    'guest_user_id' => null,
                ]),
                'stats' => $stats->toArray(),
            ], 'Guest account linked');
        } catch (\Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            $response->error('Guest link error: ' . $e->getMessage(), 500);
        }
    }

    private function mergePlayerStats(int $guestUserId, int $targetUserId): void
    {
        $guestStats = $this->statsRepo->findByUserId($guestUserId);
        if ($guestStats === null) {
            return;
        }

        $targetStats = $this->statsRepo->findByUserId($targetUserId);
        if ($targetStats === null) {
            $stmt = $this->pdo->prepare('UPDATE player_stats SET user_id = :target_user_id WHERE user_id = :guest_user_id');
            $stmt->execute([
                'target_user_id' => $targetUserId,
                'guest_user_id' => $guestUserId,
            ]);
            return;
        }

        $mergedAlmanac = $targetStats->almanac_progress;
        foreach ($guestStats->almanac_progress as $passengerId => $entry) {
            $current = $mergedAlmanac[$passengerId] ?? null;
            if (!is_array($current)) {
                $mergedAlmanac[$passengerId] = $entry;
                continue;
            }

            $mergedAlmanac[$passengerId] = [
                'passengerId' => $entry['passengerId'] ?? $current['passengerId'] ?? (int) $passengerId,
                'encountered' => (bool) (($current['encountered'] ?? false) || ($entry['encountered'] ?? false)),
                'knowledgeLevel' => max((int) ($current['knowledgeLevel'] ?? 0), (int) ($entry['knowledgeLevel'] ?? 0)),
                'unlockedSecrets' => array_values(array_unique(array_merge(
                    is_array($current['unlockedSecrets'] ?? null) ? $current['unlockedSecrets'] : [],
                    is_array($entry['unlockedSecrets'] ?? null) ? $entry['unlockedSecrets'] : []
                ))),
            ];
        }

        $this->statsRepo->updateStats($targetUserId, [
            'total_shifts_completed' => $targetStats->total_shifts_completed + $guestStats->total_shifts_completed,
            'total_shifts_started' => $targetStats->total_shifts_started + $guestStats->total_shifts_started,
            'total_rides_completed' => $targetStats->total_rides_completed + $guestStats->total_rides_completed,
            'total_earnings' => $targetStats->total_earnings + $guestStats->total_earnings,
            'total_fuel_used' => $targetStats->total_fuel_used + $guestStats->total_fuel_used,
            'total_time_played_minutes' => $targetStats->total_time_played_minutes + $guestStats->total_time_played_minutes,
            'best_shift_earnings' => max($targetStats->best_shift_earnings, $guestStats->best_shift_earnings),
            'best_shift_rides' => max($targetStats->best_shift_rides, $guestStats->best_shift_rides),
            'longest_shift_minutes' => max($targetStats->longest_shift_minutes, $guestStats->longest_shift_minutes),
            'bank_balance' => $targetStats->bank_balance + $guestStats->bank_balance,
            'lore_fragments' => $targetStats->lore_fragments + $guestStats->lore_fragments,
            'unlocked_skills' => array_values(array_unique(array_merge($targetStats->unlocked_skills, $guestStats->unlocked_skills))),
            'passengers_encountered' => array_values(array_unique(array_merge($targetStats->passengers_encountered, $guestStats->passengers_encountered))),
            'backstories_unlocked' => array_values(array_unique(array_merge($targetStats->backstories_unlocked, $guestStats->backstories_unlocked))),
            'legendary_passengers' => array_values(array_unique(array_merge($targetStats->legendary_passengers, $guestStats->legendary_passengers))),
            'achievements_unlocked' => array_values(array_unique(array_merge($targetStats->achievements_unlocked, $guestStats->achievements_unlocked))),
            'rules_violated_history' => array_values(array_merge($targetStats->rules_violated_history, $guestStats->rules_violated_history)),
            'almanac_progress' => $mergedAlmanac,
        ]);

        $stmt = $this->pdo->prepare('DELETE FROM player_stats WHERE user_id = :guest_user_id');
        $stmt->execute(['guest_user_id' => $guestUserId]);
    }

    private function mergeGameSave(int $guestUserId, int $targetUserId): void
    {
        $guestSave = $this->saveRepo->findByUserId($guestUserId);
        if ($guestSave === null) {
            return;
        }

        $targetSave = $this->saveRepo->findByUserId($targetUserId);
        if ($targetSave === null) {
            $stmt = $this->pdo->prepare('UPDATE game_saves SET user_id = :target_user_id WHERE user_id = :guest_user_id');
            $stmt->execute([
                'target_user_id' => $targetUserId,
                'guest_user_id' => $guestUserId,
            ]);
            return;
        }

        $guestUpdatedAt = $this->fetchSaveUpdatedAt($guestUserId);
        $targetUpdatedAt = $this->fetchSaveUpdatedAt($targetUserId);

        if ($guestUpdatedAt > $targetUpdatedAt) {
            $stmt = $this->pdo->prepare(
                'UPDATE game_saves SET game_state = :game_state, version = :version, updated_at = NOW()
                 WHERE user_id = :target_user_id'
            );
            $stmt->execute([
                'game_state' => json_encode($guestSave->game_state),
                'version' => $guestSave->version,
                'target_user_id' => $targetUserId,
            ]);
        }

        $stmt = $this->pdo->prepare('DELETE FROM game_saves WHERE user_id = :guest_user_id');
        $stmt->execute(['guest_user_id' => $guestUserId]);
    }

    private function mergeBackstoryProgress(int $guestUserId, int $targetUserId): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT IGNORE INTO backstory_progress (user_id, passenger_id, unlocked_at)
             SELECT :target_user_id, passenger_id, unlocked_at
             FROM backstory_progress
             WHERE user_id = :guest_user_id'
        );
        $stmt->execute([
            'target_user_id' => $targetUserId,
            'guest_user_id' => $guestUserId,
        ]);

        $delete = $this->pdo->prepare('DELETE FROM backstory_progress WHERE user_id = :guest_user_id');
        $delete->execute(['guest_user_id' => $guestUserId]);
    }

    private function mergeAlmanacEntries(int $guestUserId, int $targetUserId): void
    {
        $select = $this->pdo->prepare('SELECT passenger_id, knowledge_level, unlocked_secrets FROM almanac_entries WHERE user_id = :user_id');
        $select->execute(['user_id' => $guestUserId]);
        $guestEntries = $select->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $targetSelect = $this->pdo->prepare('SELECT id, knowledge_level, unlocked_secrets FROM almanac_entries WHERE user_id = :user_id AND passenger_id = :passenger_id LIMIT 1');
        $insert = $this->pdo->prepare(
            'INSERT INTO almanac_entries (user_id, passenger_id, knowledge_level, unlocked_secrets, created_at, updated_at)
             VALUES (:user_id, :passenger_id, :knowledge_level, :unlocked_secrets, NOW(), NOW())'
        );
        $update = $this->pdo->prepare(
            'UPDATE almanac_entries SET knowledge_level = :knowledge_level, unlocked_secrets = :unlocked_secrets, updated_at = NOW()
             WHERE id = :id'
        );

        foreach ($guestEntries as $entry) {
            $passengerId = (int) $entry['passenger_id'];
            $guestSecrets = json_decode((string) ($entry['unlocked_secrets'] ?? '[]'), true) ?: [];

            $targetSelect->execute([
                'user_id' => $targetUserId,
                'passenger_id' => $passengerId,
            ]);
            $targetEntry = $targetSelect->fetch(\PDO::FETCH_ASSOC);

            if (!$targetEntry) {
                $insert->execute([
                    'user_id' => $targetUserId,
                    'passenger_id' => $passengerId,
                    'knowledge_level' => (int) $entry['knowledge_level'],
                    'unlocked_secrets' => json_encode($guestSecrets),
                ]);
                continue;
            }

            $targetSecrets = json_decode((string) ($targetEntry['unlocked_secrets'] ?? '[]'), true) ?: [];
            $update->execute([
                'knowledge_level' => max((int) $targetEntry['knowledge_level'], (int) $entry['knowledge_level']),
                'unlocked_secrets' => json_encode(array_values(array_unique(array_merge($targetSecrets, $guestSecrets)))),
                'id' => (int) $targetEntry['id'],
            ]);
        }

        $delete = $this->pdo->prepare('DELETE FROM almanac_entries WHERE user_id = :guest_user_id');
        $delete->execute(['guest_user_id' => $guestUserId]);
    }

    private function fetchSaveUpdatedAt(int $userId): string
    {
        $stmt = $this->pdo->prepare('SELECT updated_at FROM game_saves WHERE user_id = :user_id LIMIT 1');
        $stmt->execute(['user_id' => $userId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return (string) ($row['updated_at'] ?? '');
    }
}
