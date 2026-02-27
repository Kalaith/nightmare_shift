<?php
declare(strict_types=1);

/**
 * Nightmare Shift API Routes
 *
 * @param \App\Core\Router $router
 */
return function (\App\Core\Router $router): void {
    // Auth routes
    $router->post('/api/v1/auth/session', $GLOBALS['controllers']['auth'], 'session');

    // Content routes
    $router->get('/api/v1/content/skills', $GLOBALS['controllers']['content'], 'getSkills');

    // Game lifecycle routes
    $router->post('/api/v1/game/start-shift', $GLOBALS['controllers']['game'], 'startShift');
    $router->post('/api/v1/game/request-passenger', $GLOBALS['controllers']['game'], 'requestPassenger');
    $router->post('/api/v1/game/driving-choice', $GLOBALS['controllers']['game'], 'drivingChoice');
    $router->post('/api/v1/game/interaction', $GLOBALS['controllers']['game'], 'interaction');
    $router->post('/api/v1/game/complete-ride', $GLOBALS['controllers']['game'], 'completeRide');
    $router->post('/api/v1/game/end-shift', $GLOBALS['controllers']['game'], 'endShift');
    $router->post('/api/v1/game/save', $GLOBALS['controllers']['game'], 'save');
    $router->get('/api/v1/game/load', $GLOBALS['controllers']['game'], 'load');
    $router->get('/api/v1/game/route-options', $GLOBALS['controllers']['game'], 'getRouteOptions');

    // Player data routes
    $router->get('/api/v1/player/stats', $GLOBALS['controllers']['player'], 'getStats');
    $router->get('/api/v1/player/leaderboard', $GLOBALS['controllers']['player'], 'getLeaderboard');
    $router->get('/api/v1/player/almanac', $GLOBALS['controllers']['player'], 'getAlmanac');
};
