<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class AuthMiddleware
{
    public function __construct(
        private readonly \PDO $pdo
    ) {}

    public function __invoke(Request $request, Response $response): bool
    {
        try {
            $path = parse_url($request->getServerParams()['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
            $token = $request->getBearerToken();

            if ($token === null) {
                if ($this->isPublicPath($path)) {
                    return true;
                }

                $authHeader = $request->getAuthorizationHeader();
                $debugMsg = 'Authorization header missing or invalid';
                if ($authHeader !== null) {
                    $debugMsg .= ' (header present but no Bearer token found: ' . substr($authHeader, 0, 30) . '...)';
                } else {
                    $debugMsg .= ' (no Authorization header in request)';
                }
                $response->unauthorized($debugMsg);
                return false;
            }

            $jwtSecret = $_ENV['JWT_SECRET'] ?? '';
            if ($jwtSecret === '') {
                $response->error('JWT secret not configured', 500);
                return false;
            }

            $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
            $userId = $decoded->sub ?? $decoded->user_id ?? $decoded->id ?? null;
            if (!$userId) {
                $response->unauthorized('Token missing user identifier (no sub/user_id/id claim)');
                return false;
            }

            $isGuest = (bool) ($decoded->is_guest ?? false);
            $guestUserId = $isGuest ? (int) ($decoded->guest_user_id ?? 0) : null;
            $whUserId = (int) $userId;
            $internalId = $whUserId;

            if ($guestUserId !== null && $guestUserId > 0) {
                $stmt = $this->pdo->prepare('SELECT id, wh_user_id FROM users WHERE id = :id LIMIT 1');
                $stmt->execute(['id' => $guestUserId]);
                $row = $stmt->fetch(\PDO::FETCH_ASSOC);
                if (!$row) {
                    $response->unauthorized('Guest session is no longer valid');
                    return false;
                }

                $internalId = (int) $row['id'];
                $whUserId = (int) $row['wh_user_id'];
            } else {
                $stmt = $this->pdo->prepare('SELECT id FROM users WHERE wh_user_id = :wh_id LIMIT 1');
                $stmt->execute(['wh_id' => $whUserId]);
                $row = $stmt->fetch(\PDO::FETCH_ASSOC);
                if ($row) {
                    $internalId = (int) $row['id'];
                }
            }

            $roles = $decoded->roles ?? [];
            if (!is_array($roles)) {
                $roles = [$roles];
            }
            $isAdmin = (bool) ($decoded->is_admin ?? false);
            if ($isAdmin && !in_array('admin', $roles, true)) {
                $roles[] = 'admin';
            }

            $authUser = [
                'id' => $internalId,
                'wh_user_id' => $whUserId,
                'email' => $decoded->email ?? null,
                'username' => $decoded->username ?? null,
                'display_name' => $decoded->display_name ?? $decoded->username ?? null,
                'roles' => $roles,
                'role' => $isAdmin ? 'admin' : ($decoded->role ?? ($roles[0] ?? 'user')),
                'is_admin' => $isAdmin,
                'auth_type' => $decoded->auth_type ?? ($isGuest ? 'guest' : 'frontpage'),
                'is_guest' => $isGuest,
                'guest_user_id' => $guestUserId,
            ];

            $request->setAttribute('auth_user', $authUser);
            return true;
        } catch (\Firebase\JWT\ExpiredException) {
            $response->unauthorized('Token expired');
            return false;
        } catch (\Exception $e) {
            $response->unauthorized('Invalid token: ' . $e->getMessage());
            return false;
        }
    }

    private function isPublicPath(string $path): bool
    {
        $publicExact = [
            '/api/v1/auth/guest-session',
            '/api/v1/player/leaderboard',
        ];

        if (in_array($path, $publicExact, true)) {
            return true;
        }

        return str_starts_with($path, '/api/v1/content/');
    }
}
