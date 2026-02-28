<?php
declare(strict_types=1);

namespace App\External;

use PDO;

/**
 * Repository for reading game content from the database.
 * This makes Nightmare Shift fully data-driven — add new content via SQL.
 */
final class GameContentRepository
{
    public function __construct(private readonly PDO $pdo) {}

    // ─── Locations ──────────────────────────────────────────────────

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAllLocations(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM locations WHERE is_active = 1 ORDER BY name');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map(function (array $row): array {
            return [
                'name'        => $row['name'],
                'description' => $row['description'],
                'atmosphere'  => $row['atmosphere'],
                'riskLevel'   => (int) $row['risk_level'],
            ];
        }, $rows);
    }

    public function getLocationByName(string $name): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM locations WHERE name = ? AND is_active = 1');
        $stmt->execute([$name]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    // ─── Passengers ─────────────────────────────────────────────────

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAllPassengers(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM passengers WHERE is_active = 1 ORDER BY sort_order, id');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([$this, 'hydratePassenger'], $rows);
    }

    /**
     * Get passengers filtered by rarity.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getPassengersByRarity(string $rarity): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM passengers WHERE rarity = ? AND is_active = 1 ORDER BY sort_order, id');
        $stmt->execute([$rarity]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([$this, 'hydratePassenger'], $rows);
    }

    public function getPassengerById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM passengers WHERE id = ? AND is_active = 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->hydratePassenger($row) : null;
    }

    /**
     * Get passengers not in the exclude list (for selecting new passengers).
     *
     * @param int[] $excludeIds
     * @return array<int, array<string, mixed>>
     */
    public function getAvailablePassengers(array $excludeIds = []): array
    {
        if (empty($excludeIds)) {
            return $this->getAllPassengers();
        }

        $placeholders = implode(',', array_fill(0, count($excludeIds), '?'));
        $stmt = $this->pdo->prepare("SELECT * FROM passengers WHERE is_active = 1 AND id NOT IN ($placeholders) ORDER BY sort_order, id");
        $stmt->execute($excludeIds);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([$this, 'hydratePassenger'], $rows);
    }

    // ─── Shift Rules ────────────────────────────────────────────────

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAllRules(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM shift_rules WHERE is_active = 1 ORDER BY sort_order, id');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([$this, 'hydrateRule'], $rows);
    }

    /**
     * Get rules by type.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getRulesByType(string $type): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM shift_rules WHERE type = ? AND is_active = 1 ORDER BY sort_order, id');
        $stmt->execute([$type]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([$this, 'hydrateRule'], $rows);
    }

    /**
     * Get rules by difficulty.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getRulesByDifficulty(string $difficulty): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM shift_rules WHERE difficulty = ? AND is_active = 1 ORDER BY sort_order, id');
        $stmt->execute([$difficulty]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([$this, 'hydrateRule'], $rows);
    }

    /**
     * Get visible rules (for player display).
     *
     * @return array<int, array<string, mixed>>
     */
    public function getVisibleRules(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM shift_rules WHERE visible = 1 AND is_active = 1 ORDER BY sort_order, id');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([$this, 'hydrateRule'], $rows);
    }

    /**
     * Get hidden rules.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getHiddenRules(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM shift_rules WHERE visible = 0 AND is_active = 1 ORDER BY sort_order, id');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([$this, 'hydrateRule'], $rows);
    }

    // ─── Game Items ─────────────────────────────────────────────────

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAllItems(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM game_items WHERE is_active = 1 ORDER BY name');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([$this, 'hydrateItem'], $rows);
    }

    public function getItemByName(string $name): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM game_items WHERE name = ? AND is_active = 1');
        $stmt->execute([$name]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->hydrateItem($row) : null;
    }

    // ─── Skills ─────────────────────────────────────────────────────

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAllSkills(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM skills WHERE is_active = 1 ORDER BY sort_order, id');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([$this, 'hydrateSkill'], $rows);
    }

    // ─── Almanac Levels ──────────────────────────────────────────────

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAllAlmanacLevels(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM almanac_levels WHERE is_active = 1 ORDER BY sort_order, level');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([$this, 'hydrateAlmanacLevel'], $rows);
    }

    // ─── Hydration helpers (decode JSON columns) ────────────────────

    private function hydratePassenger(array $row): array
    {
        $jsonFields = ['items', 'dialogue', 'relationships', 'tells', 'guideline_exceptions', 'route_preferences', 'state_profile', 'rule_modification'];
        foreach ($jsonFields as $field) {
            if (isset($row[$field]) && is_string($row[$field])) {
                $row[$field] = json_decode($row[$field], true);
            }
        }
        // Map DB column names to frontend-compatible camelCase
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'emoji' => $row['emoji'],
            'description' => $row['description'],
            'pickup' => $row['pickup'],
            'destination' => $row['destination'],
            'personalRule' => $row['personal_rule'],
            'supernatural' => $row['supernatural'],
            'fare' => (float) $row['fare'],
            'rarity' => $row['rarity'],
            'items' => $row['items'] ?? [],
            'dialogue' => $row['dialogue'] ?? [],
            'relationships' => $row['relationships'] ?? [],
            'backstoryUnlocked' => false,
            'backstoryDetails' => $row['backstory_details'],
            'tells' => $row['tells'],
            'guidelineExceptions' => $row['guideline_exceptions'],
            'deceptionLevel' => isset($row['deception_level']) ? (float) $row['deception_level'] : null,
            'stressLevel' => isset($row['stress_level']) ? (float) $row['stress_level'] : null,
            'trustRequired' => isset($row['trust_required']) ? (float) $row['trust_required'] : null,
            'routePreferences' => $row['route_preferences'],
            'stateProfile' => $row['state_profile'],
            'ruleModification' => $row['rule_modification'],
        ];
    }

    private function hydrateRule(array $row): array
    {
        $jsonFields = ['exceptions', 'follow_consequences', 'break_consequences', 'exception_rewards', 'conflicts_with'];
        foreach ($jsonFields as $field) {
            if (isset($row[$field]) && is_string($row[$field])) {
                $row[$field] = json_decode($row[$field], true);
            }
        }

        return [
            'id' => (int) $row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'difficulty' => $row['difficulty'],
            'type' => $row['type'],
            'visible' => (bool) $row['visible'],
            'actionKey' => $row['action_key'],
            'actionType' => $row['action_type'],
            'relatedGuidelineId' => isset($row['related_guideline_id']) ? (int) $row['related_guideline_id'] : null,
            'defaultSafety' => $row['default_safety'],
            'defaultOutcome' => $row['default_outcome'],
            'exceptions' => $row['exceptions'],
            'followConsequences' => $row['follow_consequences'],
            'breakConsequences' => $row['break_consequences'],
            'exceptionRewards' => $row['exception_rewards'],
            'exceptionNeedAdjustment' => isset($row['exception_need_adjustment']) ? (float) $row['exception_need_adjustment'] : null,
            'followNeedAdjustment' => isset($row['follow_need_adjustment']) ? (float) $row['follow_need_adjustment'] : null,
            'breakNeedAdjustment' => isset($row['break_need_adjustment']) ? (float) $row['break_need_adjustment'] : null,
            'conflictsWith' => $row['conflicts_with'],
            'trigger' => $row['trigger'],
            'violationMessage' => $row['violation_message'],
            'conditionHint' => $row['condition_hint'],
            'temporary' => (bool) $row['is_temporary'],
            'duration' => isset($row['duration']) ? (int) $row['duration'] : null,
        ];
    }

    private function hydrateItem(array $row): array
    {
        $jsonFields = ['effects', 'protective_properties', 'cursed_properties'];
        foreach ($jsonFields as $field) {
            if (isset($row[$field]) && is_string($row[$field])) {
                $row[$field] = json_decode($row[$field], true);
            }
        }

        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'type' => $row['type'],
            'rarity' => $row['rarity'],
            'description' => $row['description'],
            'effects' => $row['effects'],
            'protectiveProperties' => $row['protective_properties'],
            'cursedProperties' => $row['cursed_properties'],
            'maxDurability' => isset($row['max_durability']) ? (int) $row['max_durability'] : null,
            'canUse' => (bool) $row['can_use'],
            'canTrade' => (bool) $row['can_trade'],
        ];
    }

    private function hydrateSkill(array $row): array
    {
        $prerequisites = [];
        if (isset($row['prerequisites']) && is_string($row['prerequisites'])) {
            $prerequisites = json_decode($row['prerequisites'], true) ?? [];
        }

        return [
            'id' => $row['skill_id'],
            'name' => $row['name'],
            'description' => $row['description'],
            'cost' => (int) $row['cost'],
            'icon' => $row['icon'],
            'category' => $row['category'],
            'prerequisites' => $prerequisites,
            'effect' => [
                'type' => $row['effect_type'],
                'target' => $row['effect_target'],
                'value' => (float) $row['effect_value'],
            ],
        ];
    }

    private function hydrateAlmanacLevel(array $row): array
    {
        $rewards = [];
        if (isset($row['rewards']) && is_string($row['rewards'])) {
            $rewards = json_decode($row['rewards'], true) ?? [];
        }

        return [
            'level'       => (int) $row['level'],
            'name'        => $row['name'],
            'description' => $row['description'],
            'rewards'     => $rewards,
            'loreCost'    => (int) $row['lore_cost'],
        ];
    }
}
