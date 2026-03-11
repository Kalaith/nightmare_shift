<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\GameSaveRepository;
use App\Services\GameEngineService;
use App\Services\GuidelineService;
use App\Services\ItemService;
use App\Services\GameSessionLogger;

final class HandleInteractionAction
{
    public function __construct(
        private readonly GameEngineService $gameEngine,
        private readonly GuidelineService $guidelineService,
        private readonly ItemService $itemService,
        private readonly GameSaveRepository $saveRepo,
        private readonly GameSessionLogger $logger
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

        $violatedRule = $this->gameEngine->checkRuleViolation($gameState, $action);

        if ($violatedRule !== null) {
            $result['violation'] = true;
            $result['violatedRule'] = $violatedRule;
            $result['message'] = $violatedRule['violationMessage'] ?? 'Rule violated!';
            $gameState['rulesViolated'] = ($gameState['rulesViolated'] ?? 0) + 1;

            $applied = $this->gameEngine->applyConsequences(
                $gameState,
                $violatedRule['breakConsequences'] ?? []
            );
            $gameState = $applied['gameState'];
            $result['consequences'] = $applied['applied'];

            foreach ($result['consequences'] as $consequence) {
                if (($consequence['type'] ?? '') === 'death') {
                    $gameState['gameOverReason'] = $result['message'];
                    break;
                }
            }
        }

        $gameState['cabState'] = $gameState['cabState'] ?? [
            'windowsOpen' => false,
            'radioOn' => false,
        ];

        if ($action === 'open_window') {
            $gameState['cabState']['windowsOpen'] = true;
        } elseif ($action === 'close_window') {
            $gameState['cabState']['windowsOpen'] = false;
        } elseif ($action === 'play_music') {
            $gameState['cabState']['radioOn'] = true;
        } elseif ($action === 'silence_radio') {
            $gameState['cabState']['radioOn'] = false;
        } elseif ($action === 'accept_tip') {
            $tipOffer = $gameState['pendingTipOffer'] ?? null;
            if ($tipOffer !== null && !$result['violation']) {
                $amount = (float) ($tipOffer['amount'] ?? 0);
                $gameState['earnings'] = (float) ($gameState['earnings'] ?? 0) + $amount;
                $result['consequences'][] = [
                    'type' => 'money',
                    'value' => $amount,
                    'description' => 'You pocket the offered tip.',
                ];
                $result['message'] = sprintf('You take the extra $%d and the passenger settles back.', (int) $amount);
            }
            $gameState['pendingTipOffer'] = null;
        } elseif ($action === 'refuse_tip') {
            if (($gameState['pendingTipOffer'] ?? null) !== null) {
                $result['message'] = 'You refuse the tip and keep the exchange strictly professional.';
            }
            $gameState['pendingTipOffer'] = null;
        }

        $gameState = $this->itemService->applyCursedEffects($gameState);

        if ($result['violation']) {
            $gameState['ruleConfidence'] = max(0, ($gameState['ruleConfidence'] ?? 1.0) - 0.15);
        } else {
            $gameState['ruleConfidence'] = min(1.0, ($gameState['ruleConfidence'] ?? 1.0) + 0.05);
        }

        if (($gameState['gamePhase'] ?? null) !== 'gameOver') {
            $actionOutcome = $this->resolveActionOutcome($action, $passenger, $gameState, $result['violation']);
            $gameState = $actionOutcome['gameState'];
            if (!empty($actionOutcome['effects'])) {
                $result['consequences'] = array_merge($result['consequences'], $actionOutcome['effects']);
            }

            $gameState['rideProgress'] = $gameState['rideProgress'] ?? [
                'stepIndex' => 1,
                'sequence' => ['route', 'action', 'route', 'action', 'arrive'],
                'routeChoicesMade' => 1,
                'actionChoicesMade' => 0,
            ];
            $gameState['rideProgress']['actionChoicesMade'] = (int) ($gameState['rideProgress']['actionChoicesMade'] ?? 0) + 1;
            $gameState['rideProgress']['stepIndex'] = min(4, (int) ($gameState['rideProgress']['stepIndex'] ?? 0) + 1);

            $hasArrived = (int) ($gameState['rideProgress']['stepIndex'] ?? 0) >= 4;
            $gameState['gamePhase'] = $hasArrived ? 'dropOff' : 'driving';
            $gameState['currentDialogue'] = [
                'text' => $result['message']
                    ?? $actionOutcome['message']
                    ?? $this->buildActionMessage($action, $gameState['cabState']),
                'speaker' => $result['violation'] ? 'system' : 'driver',
                'timestamp' => time(),
                'type' => $result['violation'] ? 'rule_related' : 'normal',
            ];
        }

        $this->saveRepo->save($userId, $gameState);
        $this->logger->log($userId, $gameState, 'interaction', [
            'action' => $action,
            'violation' => $result['violation'],
            'message' => $result['message'],
        ]);

        return array_merge($gameState, ['interactionResult' => $result]);
    }

    private function buildActionMessage(string $action, array $cabState): string
    {
        return match ($action) {
            'play_music' => 'The radio crackles to life as the cab rolls deeper into the night.',
            'silence_radio' => 'You cut the radio. The cabin settles into tense silence.',
            'open_window' => 'Cold air slips through the crack in the window.',
            'close_window' => 'You seal the window shut and keep the cabin contained.',
            'eye_contact' => 'You meet the passenger in the mirror for a dangerous second.',
            'keep_eyes_forward' => 'You keep your eyes on the road and your nerves steady.',
            'focus_on_driving' => 'You keep both hands on the wheel and give the road your full attention.',
            'speak_first' => 'You break the silence before the passenger can.',
            'stay_silent' => 'You let the engine and the rain do the talking.',
            default => $cabState['radioOn'] ? 'The radio hums while the ride continues.' : 'The ride continues in uneasy quiet.',
        };
    }

    /**
     * @return array{gameState: array<string, mixed>, effects: array<int, array<string, mixed>>, message: ?string}
     */
    private function resolveActionOutcome(string $action, array $passenger, array $gameState, bool $wasViolation): array
    {
        if ($wasViolation) {
            return [
                'gameState' => $gameState,
                'effects' => [],
                'message' => null,
            ];
        }

        $effects = [];
        $message = null;
        $rarePassenger = in_array(($passenger['rarity'] ?? 'common'), ['rare', 'legendary'], true)
            || (float) ($passenger['fare'] ?? 0) >= 18;

        switch ($action) {
            case 'focus_on_driving':
                if ($rarePassenger) {
                    $gameState['earnings'] = max(0, (float) ($gameState['earnings'] ?? 0) - 2);
                    $effects[] = [
                        'type' => 'money',
                        'value' => -2,
                        'description' => 'The passenger resented being ignored.',
                    ];
                    $message = 'You stay focused on the road, but the passenger clearly hates being shut out.';
                } else {
                    $gameState['timeRemaining'] = (float) ($gameState['timeRemaining'] ?? 0) + 3;
                    $gameState['ruleConfidence'] = min(1.0, (float) ($gameState['ruleConfidence'] ?? 1.0) + 0.03);
                    $effects[] = [
                        'type' => 'time',
                        'value' => 3,
                        'description' => 'A clean stretch of driving helps you make up time.',
                    ];
                    $message = 'You focus on driving and the trip settles into a steady rhythm.';
                }
                break;

            case 'stay_silent':
            case 'keep_eyes_forward':
            case 'silence_radio':
            case 'close_window':
                $gameState['ruleConfidence'] = min(1.0, (float) ($gameState['ruleConfidence'] ?? 1.0) + 0.02);
                if (!$rarePassenger && random_int(0, 100) < 35) {
                    $gameState['timeRemaining'] = (float) ($gameState['timeRemaining'] ?? 0) + 2;
                    $effects[] = [
                        'type' => 'time',
                        'value' => 2,
                        'description' => 'Keeping the cabin controlled makes the trip smoother.',
                    ];
                }
                break;

            case 'speak_first':
                if ($rarePassenger || random_int(0, 100) < 45) {
                    $gameState['earnings'] = (float) ($gameState['earnings'] ?? 0) + 4;
                    $effects[] = [
                        'type' => 'money',
                        'value' => 4,
                        'description' => 'The passenger appreciates the conversation and promises a better fare.',
                    ];
                    $message = 'The passenger answers you with unexpected warmth. The fare just got better.';
                }
                break;

            case 'play_music':
            case 'open_window':
            case 'eye_contact':
                if ($rarePassenger && random_int(0, 100) < 40) {
                    $gameState['earnings'] = (float) ($gameState['earnings'] ?? 0) + 3;
                    $effects[] = [
                        'type' => 'money',
                        'value' => 3,
                        'description' => 'The passenger seems relieved you read the mood correctly.',
                    ];
                    $message = 'It was risky, but the passenger seems relieved you picked up on what they wanted.';
                }
                break;

            case 'refuse_tip':
                $gameState['ruleConfidence'] = min(1.0, (float) ($gameState['ruleConfidence'] ?? 1.0) + 0.04);
                break;
        }

        return [
            'gameState' => $gameState,
            'effects' => $effects,
            'message' => $message,
        ];
    }
}
