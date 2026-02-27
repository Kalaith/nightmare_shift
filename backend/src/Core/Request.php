<?php
declare(strict_types=1);

namespace App\Core;

final class Request
{
    /** @var array<string, mixed> */
    private array $attributes = [];

    /** @var array<string, mixed>|null */
    private ?array $parsedBody = null;

    /**
     * Get all input data (merged query + body).
     * @return array<string, mixed>
     */
    public function all(): array
    {
        return array_merge($this->query(), $this->getParsedBody());
    }

    /**
     * Get a single input value.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $all = $this->all();
        return $all[$key] ?? $default;
    }

    /**
     * Get query parameters ($_GET).
     * @return array<string, mixed>
     */
    public function query(): array
    {
        return $_GET;
    }

    /**
     * Get parsed request body (JSON or form data).
     * @return array<string, mixed>
     */
    public function getParsedBody(): array
    {
        if ($this->parsedBody !== null) {
            return $this->parsedBody;
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (str_contains($contentType, 'application/json')) {
            $rawBody = file_get_contents('php://input');
            $this->parsedBody = $rawBody ? (json_decode($rawBody, true) ?? []) : [];
        } else {
            $this->parsedBody = $_POST;
        }

        return $this->parsedBody;
    }

    /**
     * Get a request attribute (set by middleware or router).
     */
    public function getAttribute(string $key, mixed $default = null): mixed
    {
        return $this->attributes[$key] ?? $default;
    }

    /**
     * Set a request attribute.
     */
    public function setAttribute(string $key, mixed $value): void
    {
        $this->attributes[$key] = $value;
    }

    /**
     * Get the Authorization header value.
     */
    public function getAuthorizationHeader(): ?string
    {
        // Check Apache forwarded header first
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }

        // Check standard header
        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        // Try getallheaders() as fallback
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                return $headers['Authorization'];
            }
            // Case-insensitive check
            foreach ($headers as $name => $value) {
                if (strtolower($name) === 'authorization') {
                    return $value;
                }
            }
        }

        return null;
    }

    /**
     * Get the Bearer token from the Authorization header.
     */
    public function getBearerToken(): ?string
    {
        $header = $this->getAuthorizationHeader();
        if ($header === null) {
            return null;
        }

        if (preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    /**
     * Get server parameters.
     * @return array<string, mixed>
     */
    public function getServerParams(): array
    {
        return $_SERVER;
    }

    /**
     * Get query parameters.
     * @return array<string, mixed>
     */
    public function getQueryParams(): array
    {
        return $_GET;
    }

    /**
     * Get the HTTP method.
     */
    public function getMethod(): string
    {
        return $_SERVER['REQUEST_METHOD'] ?? 'GET';
    }
}
