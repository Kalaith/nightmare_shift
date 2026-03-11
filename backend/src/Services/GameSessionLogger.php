<?php
declare(strict_types=1);

namespace App\Services;

use App\External\GameSessionLogRepository;

final class GameSessionLogger
{
    public function __construct(private readonly GameSessionLogRepository $logRepo) {}

    /**
     * @param array<string, mixed> $gameState
     * @param array<string, mixed> $eventData
     */
    public function log(int $userId, array $gameState, string $eventType, array $eventData = []): void
    {
        $sessionId = (string) ($gameState['sessionId'] ?? '');
        if ($sessionId === '') {
            return;
        }

        $this->logRepo->logEvent(
            $userId,
            $sessionId,
            $eventType,
            (string) ($gameState['gamePhase'] ?? ''),
            $eventData,
            $gameState
        );
    }
}
