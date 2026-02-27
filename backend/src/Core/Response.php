<?php
declare(strict_types=1);

namespace App\Core;

final class Response
{
    /**
     * Send a success JSON response.
     *
     * @param mixed $data Response data
     * @param string $message Success message
     * @param int $code HTTP status code
     */
    public function success(mixed $data = null, string $message = 'OK', int $code = 200): void
    {
        $this->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Send an error JSON response.
     *
     * @param string $message Error message
     * @param int $code HTTP status code
     * @param mixed $details Additional error details
     */
    public function error(string $message, int $code = 400, mixed $details = null): void
    {
        $payload = [
            'success' => false,
            'error' => $message,
        ];

        if ($details !== null) {
            $payload['details'] = $details;
        }

        $this->json($payload, $code);
    }

    /**
     * Send a 401 Unauthorized response with login URL (per standards).
     */
    public function unauthorized(string $message = 'Authentication required'): void
    {
        $loginUrl = $_ENV['WEB_HATCHERY_LOGIN_URL'] ?? '';

        $this->json([
            'success' => false,
            'error' => $message,
            'login_url' => $loginUrl,
        ], 401);
    }

    /**
     * Send a raw JSON response.
     *
     * @param mixed $data Data to encode
     * @param int $code HTTP status code
     */
    public function json(mixed $data, int $code = 200): void
    {
        http_response_code($code);

        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Accept, Origin, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
