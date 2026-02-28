<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class AuthMiddleware
{
    private \PDO $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Validate JWT and set auth_user on request.
     * Returns false to halt the request pipeline on auth failure.
     */
    public function __invoke(Request $request, Response $response): bool
    {
        try {
            $token = $request->getBearerToken();

            if ($token === null) {
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

            // Map JWT claims to expected auth_user format (matches Blacksmith Forge)
            $userId = $decoded->sub ?? $decoded->user_id ?? $decoded->id ?? null;
            if (!$userId) {
                $response->unauthorized('Token missing user identifier (no sub/user_id/id claim)');
                return false;
            }

            // Resolve WH user ID → internal users.id
            $whUserId = (int) $userId;
            $internalId = $whUserId; // fallback if user row doesn't exist yet
            $stmt = $this->pdo->prepare('SELECT id FROM users WHERE wh_user_id = :wh_id LIMIT 1');
            $stmt->execute(['wh_id' => $whUserId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            if ($row) {
                $internalId = (int) $row['id'];
            }

            $authUser = [
                'id' => $internalId,           // internal users.id — safe for FK usage
                'wh_user_id' => $whUserId,      // original WebHatchery ID
                'email' => $decoded->email ?? null,
                'username' => $decoded->username ?? null,
                'roles' => $decoded->roles ?? [],
            ];

            $request->setAttribute('auth_user', $authUser);

            return true;
        } catch (\Firebase\JWT\ExpiredException $e) {
            $response->unauthorized('Token expired');
            return false;
        } catch (\Exception $e) {
            $response->unauthorized('Invalid token: ' . $e->getMessage());
            return false;
        }
    }
}
