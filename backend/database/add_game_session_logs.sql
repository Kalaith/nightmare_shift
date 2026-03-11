CREATE TABLE IF NOT EXISTS `game_session_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `session_id` VARCHAR(64) NOT NULL,
    `event_type` VARCHAR(64) NOT NULL,
    `game_phase` VARCHAR(32) NOT NULL DEFAULT '',
    `event_data` JSON DEFAULT NULL,
    `state_snapshot` JSON NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_session_created` (`session_id`, `created_at`),
    KEY `idx_user_created` (`user_id`, `created_at`),
    CONSTRAINT `fk_game_session_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
