<?php
declare(strict_types=1);

namespace App\Models;

final class GameSave
{
    public int $id = 0;
    public int $user_id = 0;
    /** @var array<string, mixed> */
    public array $game_state = [];
    public string $version = '1.0.0';
    public string $created_at = '';
    public string $updated_at = '';

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'game_state' => $this->game_state,
            'version' => $this->version,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
