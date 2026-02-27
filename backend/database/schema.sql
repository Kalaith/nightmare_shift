-- Nightmare Shift Database Schema
-- Run against MySQL/MariaDB

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `wh_user_id` INT UNSIGNED NOT NULL COMMENT 'Web Hatchery user ID',
    `email` VARCHAR(255) NOT NULL DEFAULT '',
    `username` VARCHAR(100) NOT NULL DEFAULT 'driver',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_seen_at` DATETIME DEFAULT NULL,
    UNIQUE KEY `uk_wh_user_id` (`wh_user_id`),
    KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `player_stats` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `total_shifts_completed` INT UNSIGNED NOT NULL DEFAULT 0,
    `total_shifts_started` INT UNSIGNED NOT NULL DEFAULT 0,
    `total_rides_completed` INT UNSIGNED NOT NULL DEFAULT 0,
    `total_earnings` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `total_fuel_used` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `total_time_played_minutes` INT UNSIGNED NOT NULL DEFAULT 0,
    `best_shift_earnings` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `best_shift_rides` INT UNSIGNED NOT NULL DEFAULT 0,
    `longest_shift_minutes` INT UNSIGNED NOT NULL DEFAULT 0,
    `bank_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `lore_fragments` INT UNSIGNED NOT NULL DEFAULT 0,
    `unlocked_skills` JSON NOT NULL DEFAULT ('[]'),
    `passengers_encountered` JSON NOT NULL DEFAULT ('[]'),
    `backstories_unlocked` JSON NOT NULL DEFAULT ('[]'),
    `legendary_passengers` JSON NOT NULL DEFAULT ('[]'),
    `achievements_unlocked` JSON NOT NULL DEFAULT ('[]'),
    `rules_violated_history` JSON NOT NULL DEFAULT ('[]'),
    `almanac_progress` JSON NOT NULL DEFAULT ('{}'),
    `first_play_date` DATETIME DEFAULT NULL,
    `last_play_date` DATETIME DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_id` (`user_id`),
    CONSTRAINT `fk_stats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `game_saves` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `game_state` JSON NOT NULL COMMENT 'Full game state snapshot',
    `version` VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_save` (`user_id`),
    CONSTRAINT `fk_save_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leaderboard` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `score` INT NOT NULL DEFAULT 0,
    `time_remaining` INT NOT NULL DEFAULT 0,
    `passengers_transported` INT UNSIGNED NOT NULL DEFAULT 0,
    `difficulty_level` INT UNSIGNED NOT NULL DEFAULT 0,
    `rules_violated` INT UNSIGNED NOT NULL DEFAULT 0,
    `survived` TINYINT(1) NOT NULL DEFAULT 0,
    `played_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_score` (`score` DESC),
    KEY `idx_user` (`user_id`),
    CONSTRAINT `fk_leaderboard_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `backstory_progress` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `passenger_id` INT UNSIGNED NOT NULL,
    `unlocked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_passenger` (`user_id`, `passenger_id`),
    CONSTRAINT `fk_backstory_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `almanac_entries` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `passenger_id` INT UNSIGNED NOT NULL,
    `knowledge_level` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=None, 1=Basic, 2=Advanced, 3=Complete',
    `unlocked_secrets` JSON NOT NULL DEFAULT ('[]'),
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_passenger` (`user_id`, `passenger_id`),
    CONSTRAINT `fk_almanac_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
