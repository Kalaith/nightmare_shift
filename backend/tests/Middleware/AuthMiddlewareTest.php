<?php

declare(strict_types=1);

namespace Tests\Middleware;

use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;
use PHPUnit\Framework\TestCase;

final class AuthMiddlewareTest extends TestCase
{
    protected function tearDown(): void
    {
        $_SERVER = [];
    }

    public function testGuestSessionPublicPathWorksUnderPublishedBasePath(): void
    {
        $_SERVER['REQUEST_URI'] = '/nightmare_shift/api/v1/auth/guest-session';

        $middleware = new AuthMiddleware($this->pdoWithoutConnection());

        self::assertTrue($middleware(new Request(), new Response()));
    }

    private function pdoWithoutConnection(): PDO
    {
        return (new \ReflectionClass(PDO::class))->newInstanceWithoutConstructor();
    }
}
