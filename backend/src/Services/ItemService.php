<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Item service — port of frontend itemService.ts
 * Handles item creation, effects, cursed/protective properties, and trading.
 */
final class ItemService
{
    /**
     * Create an inventory item from a passenger item name.
     *
     * @return array<string, mixed>
     */
    public function createInventoryItem(string $itemName, string $passengerSource, bool $isBackstory = false): array
    {
        $itemData = $this->getItemData($itemName);

        return array_merge([
            'id' => uniqid('item_'),
            'name' => $itemName,
            'source' => $passengerSource,
            'backstoryItem' => $isBackstory,
            'type' => 'story',
            'rarity' => 'common',
            'description' => 'An item from ' . $passengerSource,
            'effects' => [],
            'durability' => null,
            'maxDurability' => null,
            'acquiredAt' => time(),
            'canUse' => true,
            'canTrade' => true,
        ], $itemData);
    }

    /**
     * Apply item effects to a game state.
     *
     * @return array<string, mixed> Modified game state
     */
    public function applyItemEffects(array $gameState, array $item): array
    {
        $effects = $item['effects'] ?? [];

        foreach ($effects as $effect) {
            $type = $effect['type'] ?? '';
            $value = (float) ($effect['value'] ?? 0);

            switch ($type) {
                case 'fuel_bonus':
                    $gameState['fuel'] = min(100, ($gameState['fuel'] ?? 0) + $value);
                    break;
                case 'time_bonus':
                    $gameState['timeRemaining'] = ($gameState['timeRemaining'] ?? 0) + $value;
                    break;
                case 'fuel_drain':
                    $gameState['fuel'] = max(0, ($gameState['fuel'] ?? 0) - $value);
                    break;
                case 'time_penalty':
                    $gameState['timeRemaining'] = max(0, ($gameState['timeRemaining'] ?? 0) - $value);
                    break;
            }
        }

        return $gameState;
    }

    /**
     * Check and apply cursed item effects.
     *
     * @return array<string, mixed> Modified game state
     */
    public function applyCursedEffects(array $gameState): array
    {
        $inventory = $gameState['inventory'] ?? [];
        $currentTime = time();

        foreach ($inventory as $item) {
            if (($item['type'] ?? '') !== 'cursed') {
                continue;
            }

            $cursed = $item['cursedProperties'] ?? null;
            if ($cursed === null) {
                continue;
            }

            $acquiredAt = (int) ($item['acquiredAt'] ?? 0);
            $triggersAfter = (int) ($cursed['triggersAfter'] ?? 5) * 60; // minutes to seconds
            if (($currentTime - $acquiredAt) < $triggersAfter) {
                continue;
            }

            $penaltyType = $cursed['penaltyType'] ?? '';
            $penaltyValue = (float) ($cursed['penaltyValue'] ?? 0);

            switch ($penaltyType) {
                case 'fuel_drain':
                    $gameState['fuel'] = max(0, ($gameState['fuel'] ?? 0) - $penaltyValue);
                    break;
                case 'time_acceleration':
                    $gameState['timeRemaining'] = max(0, ($gameState['timeRemaining'] ?? 0) - $penaltyValue);
                    break;
            }
        }

        return $gameState;
    }

    /**
     * Check if item can protect against specific threat.
     */
    public function canProtectAgainst(array $item, string $threat): bool
    {
        if (($item['type'] ?? '') !== 'protective') {
            return false;
        }

        $protective = $item['protectiveProperties'] ?? null;
        if ($protective === null) {
            return false;
        }

        $protectsAgainst = $protective['protectsAgainst'] ?? [];
        $usesRemaining = $protective['usesRemaining'] ?? 1;

        return $usesRemaining > 0 && (empty($protectsAgainst) || in_array($threat, $protectsAgainst, true));
    }

    /**
     * Process item deterioration — reduce durability on items with durability.
     *
     * @return array<int, array<string, mixed>>
     */
    public function processItemDeterioration(array $inventory): array
    {
        return array_values(array_filter(
            array_map(function ($item) {
                if (isset($item['durability']) && $item['durability'] !== null) {
                    $item['durability'] = max(0, $item['durability'] - 1);
                    if ($item['durability'] <= 0) {
                        return null; // Item destroyed
                    }
                }
                return $item;
            }, $inventory),
            fn($item) => $item !== null
        ));
    }

    // ─── Private Helpers ──────────────────────────────────────────────

    private function getItemData(string $itemName): array
    {
        // Known item definitions — subset of the frontend's item database
        $items = [
            'Obsidian Mirror' => ['type' => 'protective', 'rarity' => 'rare', 'description' => 'Reflects supernatural gazes', 'protectiveProperties' => ['protectionType' => 'supernatural_immunity', 'protectionStrength' => 0.8, 'usesRemaining' => 3]],
            'Passenger Manifest' => ['type' => 'story', 'rarity' => 'uncommon', 'description' => 'A list of names that should never be spoken'],
            'Cold Coffee' => ['type' => 'consumable', 'rarity' => 'common', 'description' => 'Lukewarm at best', 'effects' => [['type' => 'fuel_bonus', 'value' => 5]]],
            'Cursed Coin' => ['type' => 'cursed', 'rarity' => 'uncommon', 'description' => 'It keeps finding its way back', 'cursedProperties' => ['penaltyType' => 'fuel_drain', 'penaltyValue' => 2, 'triggersAfter' => 3, 'canBeRemoved' => true]],
            'Lucky Dice' => ['type' => 'protective', 'rarity' => 'rare', 'description' => 'Always rolls in your favor', 'protectiveProperties' => ['protectionType' => 'lucky_encounters', 'protectionStrength' => 0.6, 'usesRemaining' => 5]],
        ];

        return $items[$itemName] ?? [];
    }
}
