<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Models\GameSave;

interface GameSaveStore
{
    public function findByUserId(int $userId): ?GameSave;

    public function touch(int $userId): void;
}
