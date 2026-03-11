<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\External\GameSessionLogRepository;

final class AdminController
{
    public function __construct(private readonly GameSessionLogRepository $logRepo) {}

    public function getSessions(Request $request, Response $response): void
    {
        if (!$this->isAdmin($request)) {
            $response->unauthorized('Admin access required');
            return;
        }

        $limit = (int) ($request->get('limit', 50));
        $response->success($this->logRepo->getSessionSummaries($limit), 'Admin sessions');
    }

    public function getSession(Request $request, Response $response): void
    {
        if (!$this->isAdmin($request)) {
            $response->unauthorized('Admin access required');
            return;
        }

        $sessionId = (string) $request->get('session_id', '');
        if ($sessionId === '') {
            $response->error('session_id is required', 422);
            return;
        }

        $response->success($this->logRepo->getSessionEvents($sessionId), 'Admin session events');
    }

    private function isAdmin(Request $request): bool
    {
        $authUser = $request->getAttribute('auth_user');
        $roles = $authUser['roles'] ?? [];
        if (!is_array($roles)) {
            $roles = [$roles];
        }

        return in_array('admin', $roles, true);
    }
}
