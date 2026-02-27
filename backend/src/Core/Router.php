<?php
declare(strict_types=1);

namespace App\Core;

final class Router
{
    /** @var array<string, array<string, array{controller: object, method: string}>> */
    private array $routes = [];
    private string $basePath = '';
    /** @var callable[] */
    private array $middleware = [];

    public function setBasePath(string $basePath): void
    {
        $this->basePath = rtrim($basePath, '/');
    }

    public function addMiddleware(callable $middleware): void
    {
        $this->middleware[] = $middleware;
    }

    public function get(string $path, object $controller, string $method): void
    {
        $this->addRoute('GET', $path, $controller, $method);
    }

    public function post(string $path, object $controller, string $method): void
    {
        $this->addRoute('POST', $path, $controller, $method);
    }

    public function put(string $path, object $controller, string $method): void
    {
        $this->addRoute('PUT', $path, $controller, $method);
    }

    public function delete(string $path, object $controller, string $method): void
    {
        $this->addRoute('DELETE', $path, $controller, $method);
    }

    private function addRoute(string $httpMethod, string $path, object $controller, string $method): void
    {
        $this->routes[$httpMethod][$path] = [
            'controller' => $controller,
            'method' => $method,
        ];
    }

    public function handle(): void
    {
        $httpMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($requestUri, PHP_URL_PATH) ?? '/';

        // Strip base path
        if ($this->basePath !== '' && str_starts_with($path, $this->basePath)) {
            $path = substr($path, strlen($this->basePath));
        }

        if ($path === '' || $path === false) {
            $path = '/';
        }

        $request = new Request();
        $response = new Response();

        // Run middleware
        foreach ($this->middleware as $mw) {
            $result = $mw($request, $response);
            if ($result === false) {
                return; // Middleware halted the request
            }
        }

        // Match route
        $matched = $this->matchRoute($httpMethod, $path);

        if ($matched === null) {
            $response->error('Route not found: ' . $httpMethod . ' ' . $path, 404);
            return;
        }

        ['route' => $route, 'params' => $params] = $matched;

        // Set route params on request
        foreach ($params as $key => $value) {
            $request->setAttribute($key, $value);
        }

        $controller = $route['controller'];
        $method = $route['method'];

        try {
            $controller->$method($request, $response);
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 500);
        }
    }

    /**
     * @return array{route: array{controller: object, method: string}, params: array<string, string>}|null
     */
    private function matchRoute(string $httpMethod, string $path): ?array
    {
        $routes = $this->routes[$httpMethod] ?? [];

        foreach ($routes as $routePath => $route) {
            $params = $this->matchPath($routePath, $path);
            if ($params !== null) {
                return ['route' => $route, 'params' => $params];
            }
        }

        return null;
    }

    /**
     * @return array<string, string>|null
     */
    private function matchPath(string $routePath, string $requestPath): ?array
    {
        $routeParts = explode('/', trim($routePath, '/'));
        $requestParts = explode('/', trim($requestPath, '/'));

        if (count($routeParts) !== count($requestParts)) {
            return null;
        }

        $params = [];

        for ($i = 0; $i < count($routeParts); $i++) {
            if (str_starts_with($routeParts[$i], ':')) {
                $paramName = substr($routeParts[$i], 1);
                $params[$paramName] = $requestParts[$i];
            } elseif ($routeParts[$i] !== $requestParts[$i]) {
                return null;
            }
        }

        return $params;
    }
}
