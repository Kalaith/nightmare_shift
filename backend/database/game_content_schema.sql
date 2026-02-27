-- Nightmare Shift: Game Content Tables
-- These tables store game content data, making the game data-driven.
-- Add/modify/remove game content by editing these tables.
-- Run AFTER schema.sql

-- ─── Locations ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `locations` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `atmosphere` VARCHAR(100) NOT NULL DEFAULT '',
    `risk_level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1-5 risk rating',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Passengers ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `passengers` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `emoji` VARCHAR(10) NOT NULL DEFAULT '👤',
    `description` TEXT NOT NULL,
    `pickup` VARCHAR(100) NOT NULL COMMENT 'Location name',
    `destination` VARCHAR(100) NOT NULL COMMENT 'Location name',
    `personal_rule` VARCHAR(500) NOT NULL DEFAULT '',
    `supernatural` VARCHAR(500) NOT NULL DEFAULT '',
    `fare` DECIMAL(8,2) NOT NULL DEFAULT 10.00,
    `rarity` ENUM('common','uncommon','rare','legendary') NOT NULL DEFAULT 'common',
    `items` JSON NOT NULL DEFAULT ('[]') COMMENT 'Array of item name strings',
    `dialogue` JSON NOT NULL DEFAULT ('[]') COMMENT 'Array of dialogue strings',
    `relationships` JSON NOT NULL DEFAULT ('[]') COMMENT 'Array of related passenger IDs',
    `backstory_details` VARCHAR(1000) NOT NULL DEFAULT '',
    `tells` JSON DEFAULT NULL COMMENT 'Array of PassengerTell objects',
    `guideline_exceptions` JSON DEFAULT NULL COMMENT 'Array of exception ID strings',
    `deception_level` DECIMAL(3,2) DEFAULT NULL COMMENT '0.0-1.0',
    `stress_level` DECIMAL(3,2) DEFAULT NULL COMMENT '0.0-1.0',
    `trust_required` DECIMAL(3,2) DEFAULT NULL COMMENT '0.0-1.0',
    `route_preferences` JSON DEFAULT NULL COMMENT 'Array of RoutePreference objects',
    `state_profile` JSON DEFAULT NULL COMMENT 'PassengerStateProfile object',
    `rule_modification` JSON DEFAULT NULL COMMENT 'Rule modification capability',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_name` (`name`),
    KEY `idx_rarity` (`rarity`),
    KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Shift Rules ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `shift_rules` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `difficulty` ENUM('easy','medium','hard','expert','nightmare') NOT NULL DEFAULT 'medium',
    `type` ENUM('basic','conditional','conflicting','hidden','weather') NOT NULL DEFAULT 'basic',
    `visible` TINYINT(1) NOT NULL DEFAULT 1,
    `action_key` VARCHAR(50) DEFAULT NULL COMMENT 'Action that triggers this rule',
    `action_type` ENUM('forbidden','required') DEFAULT NULL,
    `related_guideline_id` INT UNSIGNED DEFAULT NULL,
    `default_safety` ENUM('safe','risky','dangerous') DEFAULT NULL,
    `default_outcome` TEXT DEFAULT NULL,
    `exceptions` JSON DEFAULT NULL COMMENT 'Array of GuidelineException objects',
    `follow_consequences` JSON DEFAULT NULL COMMENT 'Array of consequence objects',
    `break_consequences` JSON DEFAULT NULL COMMENT 'Array of consequence objects',
    `exception_rewards` JSON DEFAULT NULL COMMENT 'Array of consequence objects',
    `exception_need_adjustment` DECIMAL(5,2) DEFAULT NULL,
    `follow_need_adjustment` DECIMAL(5,2) DEFAULT NULL,
    `break_need_adjustment` DECIMAL(5,2) DEFAULT NULL,
    `conflicts_with` JSON DEFAULT NULL COMMENT 'Array of rule IDs',
    `trigger` VARCHAR(50) DEFAULT NULL COMMENT 'Weather/condition trigger',
    `violation_message` TEXT DEFAULT NULL,
    `condition_hint` TEXT DEFAULT NULL,
    `is_temporary` TINYINT(1) NOT NULL DEFAULT 0,
    `duration` INT UNSIGNED DEFAULT NULL COMMENT 'Duration in seconds if temporary',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_type` (`type`),
    KEY `idx_difficulty` (`difficulty`),
    KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Guidelines (extends shift_rules with extra fields) ─────────────
CREATE TABLE IF NOT EXISTS `guidelines` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `rule_id` INT UNSIGNED NOT NULL COMMENT 'Links to shift_rules.id',
    `exceptions` JSON NOT NULL DEFAULT ('[]') COMMENT 'Array of GuidelineException objects',
    `default_safety` ENUM('safe','risky','dangerous') NOT NULL DEFAULT 'safe',
    `break_consequences` JSON NOT NULL DEFAULT ('[]'),
    `follow_consequences` JSON NOT NULL DEFAULT ('[]'),
    `exception_rewards` JSON DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_rule_id` (`rule_id`),
    CONSTRAINT `fk_guideline_rule` FOREIGN KEY (`rule_id`) REFERENCES `shift_rules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Items (catalog of droppable items) ─────────────────────────────
CREATE TABLE IF NOT EXISTS `game_items` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('story','consumable','protective','cursed','trade') NOT NULL DEFAULT 'story',
    `rarity` ENUM('common','uncommon','rare','legendary') NOT NULL DEFAULT 'common',
    `description` VARCHAR(500) NOT NULL DEFAULT '',
    `effects` JSON DEFAULT NULL COMMENT 'Array of effect objects',
    `protective_properties` JSON DEFAULT NULL,
    `cursed_properties` JSON DEFAULT NULL,
    `max_durability` INT UNSIGNED DEFAULT NULL,
    `can_use` TINYINT(1) NOT NULL DEFAULT 1,
    `can_trade` TINYINT(1) NOT NULL DEFAULT 1,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Skills (permanent upgrades / skill tree) ──────────────────────
CREATE TABLE IF NOT EXISTS `skills` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `skill_id` VARCHAR(50) NOT NULL COMMENT 'Unique string identifier e.g. fuel_efficiency_1',
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `cost` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Bank balance cost',
    `icon` VARCHAR(10) NOT NULL DEFAULT '⭐',
    `category` ENUM('survival','occult','efficiency') NOT NULL DEFAULT 'survival',
    `prerequisites` JSON NOT NULL DEFAULT ('[]') COMMENT 'Array of prerequisite skill_id strings',
    `effect_type` ENUM('stat_boost','mechanic_unlock','passive_bonus') NOT NULL DEFAULT 'stat_boost',
    `effect_target` VARCHAR(50) NOT NULL COMMENT 'Stat or mechanic this affects',
    `effect_value` DECIMAL(8,4) NOT NULL DEFAULT 0 COMMENT 'Numeric effect value',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_skill_id` (`skill_id`),
    KEY `idx_category` (`category`),
    KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
