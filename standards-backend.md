# WebHatchery Backend Standards

This document covers backend development standards for PHP projects.

## 🔧 Backend Standards (PHP)

### Minimal Project Configuration (composer.json)
Each project should have a minimal `composer.json`. All library dependencies must be managed in the central root `composer.json`.

**✅ CORRECT: Minimal Project composer.json**
```json
{
    "name": "your-project/backend",
    "description": "Short description of your project",
    "type": "project",
    "config": {
        "process-timeout": 0
    },
    "scripts": {
        "start": "php -S localhost:8000 public/index.php",
        "test": "phpunit",
        "cs-check": "phpcs --standard=PSR12 src/ tests/",
        "cs-fix": "phpcbf --standard=PSR12 src/ tests/"
    }
}
```

### Centralized Dependency Management
Libraries (e.g., `vlucas/phpdotenv`, `guzzlehttp/guzzle`) must be defined in the root `h:\WebHatchery\composer.json`. This ensures all projects share the same versions and reduces `vendor` folder redundancy.

### Robust Autoloader Strategy
Since projects reside in subfolders (e.g., `apps/project/backend/public/`), the `index.php` must search parent directories for the shared `vendor/autoload.php`.

**✅ CORRECT: public/index.php autoloader search**
```php
<?php
// Search for shared vendor folder in multiple locations
$autoloader = null;
$searchPaths = [
    __DIR__ . '/../vendor/autoload.php',           // Local vendor
    __DIR__ . '/../../vendor/autoload.php',        // 2 levels up
    __DIR__ . '/../../../vendor/autoload.php',     // 3 levels up (Preview typically)
    __DIR__ . '/../../../../vendor/autoload.php',  // 4 levels up
    __DIR__ . '/../../../../../vendor/autoload.php' // 5 levels up
];

foreach ($searchPaths as $path) {
    if (file_exists($path)) {
        $autoloader = $path;
        break;
    }
}

if (!$autoloader) {
    header("HTTP/1.1 500 Internal Server Error");
    echo "Autoloader not found. Please run 'composer install' or check your deployment.";
    exit(1);
}

require_once $autoloader;
```

### Web Hatchery Login Authentication (MANDATORY)
All projects must use the shared Web Hatchery Login. Projects must not implement their own login or custom redirect flows.

#### Server-Side Auth Requirements
- **No local login endpoints**: Do not create `/login`, `/auth`, or credential-handling endpoints in the app.
- **No redirect-based login**: The app must not redirect to a login page. It should return a `401` with a clear message and a login URL when unauthenticated.
- **Token validation only**: If a token is provided (e.g., `Authorization: Bearer <token>`), validate it using the shared Web Hatchery rules/services.

#### 401 Response Shape (Required)
Return a consistent JSON payload so the frontend can show a login prompt.
```json
{
  "success": false,
  "error": "Authentication required",
  "login_url": "https://<web-hatchery-login-url>"
}
```

#### Environment Variables (Required)
```env
# Web Hatchery Login Configuration
WEB_HATCHERY_LOGIN_URL=https://<web-hatchery-login-url>
```

#### Lessons Learned (Dragons Den)
- **Forward Authorization header in Apache**: Ensure `.htaccess` includes a rule to pass `Authorization` into PHP (`HTTP_AUTHORIZATION`). Missing this causes false `Authorization header missing or invalid` errors even when the client sends a bearer token.
- **Use the exact JWT env key**: In `dragons_den`, the middleware must read only `JWT_SECRET`. Extra fallback names caused the app to miss the configured secret and return `JWT secret not configured`.
- **Do not mutate shared auth storage**: The frontend should treat `auth-storage` as read-only. Avoid local login/logout flows or token refresh logic to prevent cross-app logout side effects.

### Actions Pattern (MANDATORY)
```php
<?php
// ✅ CORRECT: Actions contain business logic
declare(strict_types=1);

namespace App\Actions;

use App\External\UserRepository;
use App\Models\User;

final class CreateUserAction
{
    public function __construct(
        private readonly UserRepository $userRepository
    ) {}

    public function execute(string $name, string $email): User
    {
        // Validation
        if (empty($name) || empty($email)) {
            throw new \InvalidArgumentException('Name and email are required');
        }

        // Business logic
        $user = new User();
        $user->name = $name;
        $user->email = $email;
        $user->created_at = new \DateTime();

        // Persistence
        return $this->userRepository->create($user);
    }
}
```

### Controller Standards (Thin Layer)
```php
<?php
// ✅ CORRECT: Controllers are thin HTTP handlers
declare(strict_types=1);

namespace App\Controllers;

use App\Actions\CreateUserAction;
use App\Core\Request;
use App\Core\Response;

final class UserController
{
    public function __construct(
        private readonly CreateUserAction $createUserAction
    ) {}

    public function create(Request $request, Response $response): void
    {
        try {
            $data = $request->all();
            
            $user = $this->createUserAction->execute($data['name'], $data['email']);
            
            $response->success($user->toArray(), 'User created', 201);
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }
}
```

### Model Standards (Data Objects)
```php
<?php
// ✅ CORRECT: Simple Data Transfer Objects (DTOs)
declare(strict_types=1);

namespace App\Models;

final class User
{
    public int $id;
    public string $email;
    public string $username;
    public ?string $first_name;
    public ?string $last_name;
    public bool $is_active;
    public \DateTime $created_at;
    public \DateTime $updated_at;

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'username' => $this->username,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s')
        ];
    }
}
```

### Repository Pattern (MANDATORY - Raw PDO)
```php
<?php
// ✅ CORRECT: Repository using Raw PDO for data access
declare(strict_types=1);

namespace App\External;

use App\Models\User;
use PDO;

final class UserRepository
{
    public function __construct(
        private readonly PDO $db
    ) {}

    public function findById(int $id): ?User
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $data = $stmt->fetch();
        
        return $data ? $this->mapToModel($data) : null;
    }

    public function create(User $user): User
    {
        $stmt = $this->db->prepare(
            'INSERT INTO users (email, username, first_name, last_name, is_active, created_at, updated_at) 
             VALUES (:email, :username, :first_name, :last_name, :is_active, :created_at, :updated_at)'
        );
        
        $stmt->execute([
            'email' => $user->email,
            'username' => $user->username,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'is_active' => $user->is_active ? 1 : 0,
            'created_at' => $user->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $user->updated_at->format('Y-m-d H:i:s')
        ]);

        $user->id = (int)$this->db->lastInsertId();
        return $user;
    }

    private function mapToModel(array $data): User
    {
        $user = new User();
        $user->id = (int)$data['id'];
        $user->email = $data['email'];
        $user->username = $data['username'];
        $user->first_name = $data['first_name'] ?? null;
        $user->last_name = $data['last_name'] ?? null;
        $user->is_active = (bool)$data['is_active'];
        $user->created_at = new \DateTime($data['created_at']);
        $user->updated_at = new \DateTime($data['updated_at']);
        return $user;
    }
}
```

### Service Standards
```php
<?php
// ✅ CORRECT: Services for complex business logic
declare(strict_types=1);

namespace App\Services;

use App\External\UserRepository;
use App\Models\User;

final class UserService
{
    public function __construct(
        private readonly UserRepository $userRepository
    ) {}

    public function calculateUserLevel(User $user): int
    {
        // Complex business logic
        return min(floor($user->experience / 1000) + 1, 100);
    }

    public function promoteUser(User $user): User
    {
        $newLevel = $this->calculateUserLevel($user);
        $user->level = $newLevel;
        
        return $this->userRepository->update($user);
    }
}
```

## 📁 File Organization Standards

### Backend File Naming  
- **Classes**: PascalCase (`UserController.php`, `CreateUserAction.php`)
- **Interfaces**: PascalCase with Interface suffix (`UserRepositoryInterface.php`)
- **Traits**: PascalCase with Trait suffix (`ApiResponseTrait.php`)

## ? Backend Prohibitions
- ? Business logic in Controllers
- ? Direct database queries in Controllers
- ? Missing type declarations (`declare(strict_types=1)`)
- ? SQL injection vulnerabilities (ALWAYS use prepared statements)
- ? Missing error handling
- ? Local login endpoints or credential handling in the app
- ? Redirect-based login flows
- ? Custom authentication schemes that bypass Web Hatchery Login
- ? Missing required dependencies (monolog, respect/validation, guzzlehttp/guzzle)
- ? Incorrect PHP version format (use "^8.1", not ">=8.1")
- ? Missing composer scripts (test, cs-check, cs-fix)
- ? Environment variable fallbacks (fail fast on missing config)
