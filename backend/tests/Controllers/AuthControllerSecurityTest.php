<?php

declare(strict_types=1);

namespace Tests\Controllers;

use App\Controllers\AuthController;
use App\Core\Request;
use App\Core\Response;
use App\External\GameSaveRepository;
use App\External\PlayerStatsRepository;
use App\External\UserRepository;
use PDO;
use PHPUnit\Framework\TestCase;

final class AuthControllerSecurityTest extends TestCase
{
    protected function tearDown(): void
    {
        $_POST = [];
        $_SERVER = [];
    }

    public function testLinkGuestRejectsCallerSuppliedGuestIdWithoutGuestToken(): void
    {
        $_POST = ['guest_user_id' => '123'];
        $_SERVER['REQUEST_METHOD'] = 'POST';

        $pdo = $this->pdoWithoutConnection();
        $controller = new AuthController(
            $pdo,
            new UserRepository($pdo),
            new PlayerStatsRepository($pdo),
            new GameSaveRepository($pdo)
        );

        $request = new Request();
        $request->setAttribute('auth_user', [
            'id' => 1,
            'is_guest' => false,
        ]);

        ob_start();
        $controller->linkGuest($request, new Response());
        $payload = json_decode((string) ob_get_clean(), true);

        self::assertSame(false, $payload['success']);
        self::assertSame('guest_token is required', $payload['error']);
    }

    private function pdoWithoutConnection(): PDO
    {
        return (new \ReflectionClass(PDO::class))->newInstanceWithoutConstructor();
    }
}
