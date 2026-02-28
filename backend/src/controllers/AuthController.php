<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\External\UserRepository;
use App\External\PlayerStatsRepository;

/**
 * Auth controller — Web Hatchery login integration only.
 * No local login endpoints (per standards).
 */
final class AuthController
{
    public function __construct(
        private readonly UserRepository $userRepo,
        private readonly PlayerStatsRepository $statsRepo
    ) {}

    /**
     * Session endpoint — validates JWT, upserts user, returns user + stats.
     */
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
            // Upsert user from Web Hatchery data
            $user = $this->userRepo->upsertWebHatcheryUser($whUserId, $email, $username);

            // Get or create player stats
            $stats = $this->statsRepo->findByUserId($user->id);
            if ($stats === null) {
                $stats = $this->statsRepo->createDefault($user->id);
            }

            $response->success([
                'user' => $user->toArray(),
                'stats' => $stats->toArray(),
            ], 'Session active');
        } catch (\Exception $e) {
            $response->error('Session error: ' . $e->getMessage(), 500);
        }
    }
}
