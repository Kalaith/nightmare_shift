<?php
declare(strict_types=1);

/**
 * Nightmare Shift Backend Entry Point
 */

$centralAutoload = __DIR__ . '/../../../vendor/autoload.php';
if (!file_exists($centralAutoload)) {
    throw new \RuntimeException('Central vendor autoload not found at ' . $centralAutoload);
}
$loader = require $centralAutoload;
$loader->addPsr4('App\\', __DIR__ . '/../src/', true);

// Register local autoloader AFTER vendor with prepend=true so it runs FIRST.
// Composer's ClassLoader also registers with prepend=true, so without this
// the central classmap entries (from another project sharing the App\ namespace)
// would cause include warnings for classes like UserRepository, AuthController.
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../src/';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $relative = substr($class, strlen($prefix));
    $file = $baseDir . str_replace('\\', '/', $relative) . '.php';
    if (file_exists($file)) {
        require $file;
    }
}, true, true);

use Dotenv\Dotenv;
use App\Core\Router;
use App\Middleware\AuthMiddleware;
use App\External\UserRepository;
use App\External\PlayerStatsRepository;
use App\External\GameSaveRepository;
use App\External\LeaderboardRepository;
use App\External\BackstoryRepository;
use App\External\AlmanacRepository;
use App\External\GameContentRepository;
use App\Services\GameEngineService;
use App\Services\WeatherService;
use App\Services\PassengerService;
use App\Services\RouteService;
use App\Services\ReputationService;
use App\Services\ItemService;
use App\Services\GuidelineService;
use App\Actions\StartShiftAction;
use App\Actions\RequestPassengerAction;
use App\Actions\HandleDrivingChoiceAction;
use App\Actions\HandleInteractionAction;
use App\Actions\CompleteRideAction;
use App\Actions\EndShiftAction;
use App\Actions\SaveGameAction;
use App\Actions\LoadGameAction;
use App\Actions\GetPlayerStatsAction;
use App\Actions\GetLeaderboardAction;
use App\Actions\GetAlmanacAction;
use App\Controllers\AuthController;
use App\Controllers\GameController;
use App\Controllers\PlayerController;

// ─── Load Environment ──────────────────────────────────────────────
$dotenvPath = __DIR__ . '/..';
if (!file_exists($dotenvPath . '/.env')) {
    throw new \RuntimeException('Missing .env at ' . $dotenvPath . '/.env');
}
$dotenv = Dotenv::createImmutable($dotenvPath);
$dotenv->load();

// Validate required env vars
$requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
foreach ($requiredEnvVars as $var) {
    if (!isset($_ENV[$var])) {
        throw new \RuntimeException("Missing required environment variable: {$var}");
    }
}

// ─── Database Connection (raw PDO) ─────────────────────────────────
$dsn = sprintf(
    'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    $_ENV['DB_HOST'],
    $_ENV['DB_PORT'],
    $_ENV['DB_NAME']
);

$pdo = new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASSWORD'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

// ─── Build Dependency Graph ────────────────────────────────────────

// Repositories
$userRepo = new UserRepository($pdo);
$statsRepo = new PlayerStatsRepository($pdo);
$saveRepo = new GameSaveRepository($pdo);
$leaderboardRepo = new LeaderboardRepository($pdo);
$backstoryRepo = new BackstoryRepository($pdo);
$almanacRepo = new AlmanacRepository($pdo);
$contentRepo = new GameContentRepository($pdo);

// Services
$gameEngineService = new GameEngineService($contentRepo);
$weatherService = new WeatherService();
$passengerService = new PassengerService($contentRepo);
$routeService = new RouteService();
$reputationService = new ReputationService();
$itemService = new ItemService();
$guidelineService = new GuidelineService();

// Actions
$startShiftAction = new StartShiftAction($gameEngineService, $weatherService, $saveRepo, $statsRepo);
$requestPassengerAction = new RequestPassengerAction($passengerService, $weatherService, $saveRepo);
$handleDrivingChoiceAction = new HandleDrivingChoiceAction($routeService, $reputationService, $weatherService, $saveRepo);
$handleInteractionAction = new HandleInteractionAction($gameEngineService, $guidelineService, $itemService, $saveRepo);
$completeRideAction = new CompleteRideAction($reputationService, $itemService, $passengerService, $backstoryRepo, $almanacRepo, $saveRepo);
$endShiftAction = new EndShiftAction($statsRepo, $leaderboardRepo, $saveRepo);
$saveGameAction = new SaveGameAction($saveRepo);
$loadGameAction = new LoadGameAction($saveRepo);
$getStatsAction = new GetPlayerStatsAction($statsRepo);
$getLeaderboardAction = new GetLeaderboardAction($leaderboardRepo);
$getAlmanacAction = new GetAlmanacAction($almanacRepo);

// Controllers
$GLOBALS['controllers'] = [
    'auth' => new AuthController($userRepo, $statsRepo),
    'content' => new ContentController($contentRepo),
    'game' => new GameController(
        $startShiftAction,
        $requestPassengerAction,
        $handleDrivingChoiceAction,
        $handleInteractionAction,
        $completeRideAction,
        $endShiftAction,
        $saveGameAction,
        $loadGameAction,
        $routeService
    ),
    'player' => new PlayerController($getStatsAction, $getLeaderboardAction, $getAlmanacAction),
];

// ─── Router Setup ──────────────────────────────────────────────────
$router = new Router();

// Set base path for subdirectory deployment
if (isset($_ENV['APP_BASE_PATH']) && $_ENV['APP_BASE_PATH']) {
    $router->setBasePath(rtrim($_ENV['APP_BASE_PATH'], '/'));
} else {
    $requestPath = $_SERVER['REQUEST_URI'] ?? '';
    $requestPath = parse_url($requestPath, PHP_URL_PATH) ?? '';
    $apiPos = strpos($requestPath, '/api/v1');
    if ($apiPos !== false) {
        $basePath = substr($requestPath, 0, $apiPos);
        if ($basePath !== '') {
            $router->setBasePath($basePath);
        }
    } elseif (isset($_SERVER['SCRIPT_NAME'])) {
        $scriptName = $_SERVER['SCRIPT_NAME'];
        $basePath = str_replace('/public/index.php', '', $scriptName);
        if ($basePath !== $scriptName && $basePath !== '') {
            $router->setBasePath($basePath);
        }
    }
}

// Handle CORS preflight
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Accept, Origin, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    http_response_code(200);
    exit;
}

// Add auth middleware
$router->addMiddleware(new AuthMiddleware());

// Load routes
(require __DIR__ . '/../src/routes/router.php')($router);

// Run router
$router->handle();
