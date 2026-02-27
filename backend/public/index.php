<?php
declare(strict_types=1);

/**
 * Nightmare Shift Backend — Entry Point
 *
 * This file is intentionally thin. All business logic, dependency wiring,
 * and database access live in the classes under App\.
 */

// ─── Autoloading ───────────────────────────────────────────────────
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
    $prefix  = 'App\\';
    $baseDir = __DIR__ . '/../src/';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $relative = substr($class, strlen($prefix));
    $file     = $baseDir . str_replace('\\', '/', $relative) . '.php';
    if (file_exists($file)) {
        require $file;
    }
}, true, true);

use Dotenv\Dotenv;
use App\Core\Router;
use App\Core\Database;
use App\Core\Container;
use App\Core\CorsHandler;
use App\Middleware\AuthMiddleware;

// ─── Load Environment ──────────────────────────────────────────────
$dotenvPath = __DIR__ . '/..';
if (!file_exists($dotenvPath . '/.env')) {
    throw new \RuntimeException('Missing .env at ' . $dotenvPath . '/.env');
}
$dotenv = Dotenv::createImmutable($dotenvPath);
$dotenv->load();

$requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
foreach ($requiredEnvVars as $var) {
    if (!isset($_ENV[$var])) {
        throw new \RuntimeException("Missing required environment variable: {$var}");
    }
}

// ─── CORS Preflight ────────────────────────────────────────────────
CorsHandler::handle();

// ─── Bootstrap Application ─────────────────────────────────────────
$pdo       = Database::connect();
$container = new Container($pdo);

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

$router->addMiddleware(new AuthMiddleware());

// Load routes
(require __DIR__ . '/../src/routes/router.php')($router, $container);

// Run
$router->handle();
