<?php

declare(strict_types=1);

namespace App\Actions;

use App\Contracts\GameSaveStore;

final class SaveGameAction
{
    public function __construct(private readonly GameSaveStore $saveRepo)
    {
    }
    /**
     * Touch the existing server-owned save without accepting caller-supplied state.
     *
     * @return array<string, mixed>|null
     */
    public function execute(int $userId): ?array
    {

        $save = $this->saveRepo->findByUserId($userId);
        if ($save === null) {
            return null;
        }

        $this->saveRepo->touch($userId);
        return $save->game_state;
    }
}
