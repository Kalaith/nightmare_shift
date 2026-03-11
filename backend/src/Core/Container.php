<?php
declare(strict_types=1);

namespace App\Core;

use PDO;
use App\External\UserRepository;
use App\External\PlayerStatsRepository;
use App\External\GameSaveRepository;
use App\External\LeaderboardRepository;
use App\External\BackstoryRepository;
use App\External\AlmanacRepository;
use App\External\GameContentRepository;
use App\External\GameSessionLogRepository;
use App\Repositories\RuleRepository;
use App\Services\GameEngineService;
use App\Services\GameSessionLogger;
use App\Services\WeatherService;
use App\Services\PassengerService;
use App\Services\RouteService;
use App\Services\ReputationService;
use App\Services\ItemService;
use App\Services\GuidelineService;
use App\Actions\StartShiftAction;
use App\Actions\RequestPassengerAction;
use App\Actions\DeclineRideAction;
use App\Actions\HandleDrivingChoiceAction;
use App\Actions\HandleInteractionAction;
use App\Actions\CompleteRideAction;
use App\Actions\EndShiftAction;
use App\Actions\SaveGameAction;
use App\Actions\LoadGameAction;
use App\Actions\RefuelAction;
use App\Actions\GetPlayerStatsAction;
use App\Actions\GetLeaderboardAction;
use App\Actions\GetAlmanacAction;
use App\Actions\PurchaseSkillAction;
use App\Actions\UpgradeAlmanacAction;
use App\Controllers\AuthController;
use App\Controllers\ContentController;
use App\Controllers\GameController;
use App\Controllers\AdminController;
use App\Controllers\PlayerController;

/**
 * Dependency container — wires the full object graph.
 *
 * Repositories → Services → Actions → Controllers.
 */
final class Container
{
    /** @var array<string, object> */
    private array $controllers = [];

    public function __construct(PDO $pdo)
    {
        // ── Repositories ────────────────────────────────────────────
        $userRepo        = new UserRepository($pdo);
        $statsRepo       = new PlayerStatsRepository($pdo);
        $saveRepo        = new GameSaveRepository($pdo);
        $leaderboardRepo = new LeaderboardRepository($pdo);
        $backstoryRepo   = new BackstoryRepository($pdo);
        $almanacRepo     = new AlmanacRepository($pdo);
        $contentRepo     = new GameContentRepository($pdo);
        $sessionLogRepo  = new GameSessionLogRepository($pdo);
        $ruleRepo        = new RuleRepository($pdo);

        // ── Services ────────────────────────────────────────────────
        $gameEngineService  = new GameEngineService($contentRepo);
        $weatherService     = new WeatherService();
        $passengerService   = new PassengerService($contentRepo);
        $routeService       = new RouteService();
        $reputationService  = new ReputationService();
        $itemService        = new ItemService();
        $guidelineService   = new GuidelineService();
        $sessionLogger      = new GameSessionLogger($sessionLogRepo);

        // ── Actions ─────────────────────────────────────────────────
        $startShiftAction         = new StartShiftAction($gameEngineService, $weatherService, $saveRepo, $statsRepo, $sessionLogger);
        $requestPassengerAction   = new RequestPassengerAction($passengerService, $weatherService, $saveRepo, $sessionLogger);
        $declineRideAction        = new DeclineRideAction($saveRepo, $sessionLogger);
        $handleDrivingChoiceAction = new HandleDrivingChoiceAction($routeService, $reputationService, $weatherService, $gameEngineService, $saveRepo, $sessionLogger);
        $handleInteractionAction  = new HandleInteractionAction($gameEngineService, $guidelineService, $itemService, $saveRepo, $sessionLogger);
        $completeRideAction       = new CompleteRideAction($reputationService, $itemService, $passengerService, $statsRepo, $backstoryRepo, $almanacRepo, $saveRepo, $sessionLogger);
        $endShiftAction           = new EndShiftAction($statsRepo, $leaderboardRepo, $saveRepo, $sessionLogger);
        $saveGameAction           = new SaveGameAction($saveRepo);
        $loadGameAction           = new LoadGameAction($saveRepo);
        $refuelAction             = new RefuelAction($saveRepo, $sessionLogger);
        $getStatsAction           = new GetPlayerStatsAction($statsRepo);
        $getLeaderboardAction     = new GetLeaderboardAction($leaderboardRepo);
        $getAlmanacAction         = new GetAlmanacAction($almanacRepo);
        $purchaseSkillAction      = new PurchaseSkillAction($statsRepo, $contentRepo, $sessionLogger);
        $upgradeAlmanacAction     = new UpgradeAlmanacAction($statsRepo, $contentRepo, $almanacRepo, $sessionLogger);

        // ── Controllers ─────────────────────────────────────────────
        $this->controllers = [
            'auth'    => new AuthController($pdo, $userRepo, $statsRepo, $saveRepo),
            'content' => new ContentController($contentRepo),
            'game'    => new GameController(
                $startShiftAction,
                $requestPassengerAction,
                $declineRideAction,
                $handleDrivingChoiceAction,
                $handleInteractionAction,
                $completeRideAction,
                $endShiftAction,
                $saveGameAction,
                $loadGameAction,
                $refuelAction,
                $routeService,
                $ruleRepo
            ),
            'player'  => new PlayerController($getStatsAction, $getLeaderboardAction, $getAlmanacAction, $purchaseSkillAction, $upgradeAlmanacAction),
            'admin'   => new AdminController($sessionLogRepo),
        ];
    }

    /**
     * Retrieve a controller by name.
     *
     * @throws \RuntimeException if the controller is not registered.
     */
    public function get(string $name): object
    {
        if (!isset($this->controllers[$name])) {
            throw new \RuntimeException("Unknown controller: {$name}");
        }

        return $this->controllers[$name];
    }
}
