<?php
declare(strict_types=1);

namespace App\Actions;

use App\Services\GameEngineService;
use App\Services\GuidelineService;
use App\Services\ItemService;
use App\External\GameSaveRepository;

final class HandleInteractionAction
{
    public function __construct(
        private readonly GameEngineService $gameEngine,
        private readonly GuidelineService $guidelineService,
        private readonly ItemService $itemService,
        private readonly GameSaveRepository $saveRepo
    ) {}

    /**
     * Process a passenger interaction/action.
     *
     * @return array<string, mixed> Updated game state with interaction result
     */
    public function execute(int $userId, string $action): array
    {
        $save = $this->saveRepo->findByUserId($userId);
        if ($save === null) {
            throw new \RuntimeException('No active game session');
        }

        $gameState = $save->game_state;
        $passenger = $gameState['currentPassenger'] ?? null;

        if ($passenger === null) {
            throw new \RuntimeException('No current passenger');
        }

        $result = [
            'action' => $action,
            'violation' => false,
            'violatedRule' => null,
            'consequences' => [],
            'message' => null,
        ];

        // Check rule violation
        $violatedRule = $this->gameEngine->checkRuleViolation($gameState, $action);

        if ($violatedRule !== null) {
            $result['violation'] = true;
            $result['violatedRule'] = $violatedRule;
            $result['message'] = $violatedRule['violationMessage'] ?? 'Rule violated!';

            $gameState['rulesViolated'] = ($gameState['rulesViolated'] ?? 0) + 1;

            // Check if violation is fatal
            $breakConsequences = $violatedRule['breakConsequences'] ?? [];
            $hasDeath = false;
            foreach ($breakConsequences as $c) {
                if (($c['type'] ?? '') === 'death') {
                    $hasDeath = true;
                    break;
                }
            }

            if ($hasDeath) {
                $gameState['gamePhase'] = 'gameOver';
                $gameState['gameOverReason'] = $result['message'];
            }

            $result['consequences'] = $breakConsequences;
        }

        // Apply cursed item effects
        $gameState = $this->itemService->applyCursedEffects($gameState);

        // Update rule confidence
        if ($result['violation']) {
            $gameState['ruleConfidence'] = max(0, ($gameState['ruleConfidence'] ?? 1.0) - 0.15);
        } else {
            $gameState['ruleConfidence'] = min(1.0, ($gameState['ruleConfidence'] ?? 1.0) + 0.05);
        }

        $this->saveRepo->save($userId, $gameState);

        return array_merge($gameState, ['interactionResult' => $result]);
    }
}
