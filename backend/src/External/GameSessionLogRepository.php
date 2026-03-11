<?php
declare(strict_types=1);

namespace App\External;

use PDO;

final class GameSessionLogRepository
{
    public function __construct(private readonly PDO $db) {}

    /**
     * @param array<string, mixed> $eventData
     * @param array<string, mixed> $stateSnapshot
     */
    public function logEvent(
        int $userId,
        string $sessionId,
        string $eventType,
        string $gamePhase,
        array $eventData,
        array $stateSnapshot
    ): void {
        $stmt = $this->db->prepare(
            'INSERT INTO game_session_logs (user_id, session_id, event_type, game_phase, event_data, state_snapshot, created_at)
             VALUES (:user_id, :session_id, :event_type, :game_phase, :event_data, :state_snapshot, NOW())'
        );
        $stmt->execute([
            'user_id' => $userId,
            'session_id' => $sessionId,
            'event_type' => $eventType,
            'game_phase' => $gamePhase,
            'event_data' => json_encode($eventData),
            'state_snapshot' => json_encode($stateSnapshot),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getSessionSummaries(int $limit = 50): array
    {
        $stmt = $this->db->prepare(
            'SELECT l.session_id, l.user_id, u.username, agg.event_count, agg.started_at, agg.last_event_at,
                    l.event_type AS latest_event_type, l.game_phase, l.state_snapshot
             FROM game_session_logs l
             INNER JOIN (
                 SELECT session_id, MAX(id) AS latest_id, COUNT(*) AS event_count,
                        MIN(created_at) AS started_at, MAX(created_at) AS last_event_at
                 FROM game_session_logs
                 GROUP BY session_id
                 ORDER BY last_event_at DESC
                 LIMIT :limit
             ) agg ON agg.latest_id = l.id
             INNER JOIN users u ON u.id = l.user_id
             ORDER BY agg.last_event_at DESC'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return array_map(function (array $row): array {
            $snapshot = json_decode((string) ($row['state_snapshot'] ?? '{}'), true) ?: [];
            return [
                'sessionId' => $row['session_id'],
                'userId' => (int) $row['user_id'],
                'username' => $row['username'],
                'eventCount' => (int) $row['event_count'],
                'startedAt' => $row['started_at'],
                'lastEventAt' => $row['last_event_at'],
                'latestEventType' => $row['latest_event_type'],
                'gamePhase' => $row['game_phase'],
                'fuel' => (float) ($snapshot['fuel'] ?? 0),
                'earnings' => (float) ($snapshot['earnings'] ?? 0),
                'timeRemaining' => (float) ($snapshot['timeRemaining'] ?? 0),
                'ridesCompleted' => (int) ($snapshot['ridesCompleted'] ?? 0),
            ];
        }, $rows);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getSessionEvents(string $sessionId): array
    {
        $stmt = $this->db->prepare(
            'SELECT l.*, u.username
             FROM game_session_logs l
             INNER JOIN users u ON u.id = l.user_id
             WHERE l.session_id = :session_id
             ORDER BY l.id ASC'
        );
        $stmt->execute(['session_id' => $sessionId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return array_map(function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'sessionId' => $row['session_id'],
                'userId' => (int) $row['user_id'],
                'username' => $row['username'],
                'eventType' => $row['event_type'],
                'gamePhase' => $row['game_phase'],
                'eventData' => json_decode((string) ($row['event_data'] ?? '{}'), true) ?: [],
                'stateSnapshot' => json_decode((string) ($row['state_snapshot'] ?? '{}'), true) ?: [],
                'createdAt' => $row['created_at'],
            ];
        }, $rows);
    }
}
