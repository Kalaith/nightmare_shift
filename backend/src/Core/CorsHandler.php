<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Handles CORS preflight (OPTIONS) requests.
 *
 * Call early in the request lifecycle — exits immediately on OPTIONS.
 */
final class CorsHandler
{
    /**
     * If the incoming request is an OPTIONS preflight, send headers and exit.
     */
    public static function handle(): void
    {
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'OPTIONS') {
            return;
        }

        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Accept, Origin, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        http_response_code(200);
        exit;
    }
}
