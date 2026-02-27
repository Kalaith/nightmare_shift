<?php
declare(strict_types=1);

use App\Core\Container;

/**
 * Nightmare Shift API Routes
 *
 * @param \App\Core\Router    $router
 * @param \App\Core\Container $container
 */
return function (\App\Core\Router $router, Container $container): void {
    // Auth routes
    $router->post('/api/v1/auth/session', $container->get('auth'), 'session');

    // Content routes
    $router->get('/api/v1/content/skills', $container->get('content'), 'getSkills');
    $router->get('/api/v1/content/almanac-levels', $container->get('content'), 'getAlmanacLevels');

    // Game lifecycle routes
    $router->post('/api/v1/game/start-shift', $container->get('game'), 'startShift');
    $router->post('/api/v1/game/request-passenger', $container->get('game'), 'requestPassenger');
    $router->post('/api/v1/game/driving-choice', $container->get('game'), 'drivingChoice');
    $router->post('/api/v1/game/interaction', $container->get('game'), 'interaction');
    $router->post('/api/v1/game/complete-ride', $container->get('game'), 'completeRide');
    $router->post('/api/v1/game/end-shift', $container->get('game'), 'endShift');
    $router->post('/api/v1/game/save', $container->get('game'), 'save');
    $router->get('/api/v1/game/load', $container->get('game'), 'load');
    $router->get('/api/v1/game/route-options', $container->get('game'), 'getRouteOptions');

    // Player data routes
    $router->get('/api/v1/player/stats', $container->get('player'), 'getStats');
    $router->get('/api/v1/player/leaderboard', $container->get('player'), 'getLeaderboard');
    $router->get('/api/v1/player/almanac', $container->get('player'), 'getAlmanac');
};
