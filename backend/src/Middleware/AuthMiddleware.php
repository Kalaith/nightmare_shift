<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class AuthMiddleware
{
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

            $authUser = [
                'id' => (int) $userId,
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
