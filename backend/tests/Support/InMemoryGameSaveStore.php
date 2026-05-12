<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Contracts\GameSaveStore;
use App\Models\GameSave;

final class InMemoryGameSaveStore implements GameSaveStore
{
    /** @param array<string, mixed>|null $savedState */
    public function __construct(public ?array $savedState)
    {
    }

    public ?int $touchedUserId = null;

    public function findByUserId(int $userId): ?GameSave
    {
        if ($this->savedState === null) {
            return null;
        }

        $save = new GameSave();
        $save->user_id = $userId;
        $save->game_state = $this->savedState;

        return $save;
    }

    public function touch(int $userId): void
    {
        $this->touchedUserId = $userId;
    }
}
