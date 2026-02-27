<?php
declare(strict_types=1);

namespace App\Models;

final class LeaderboardEntry
{
    public int $id = 0;
    public int $user_id = 0;
    public int $score = 0;
    public int $time_remaining = 0;
    public int $passengers_transported = 0;
    public int $difficulty_level = 0;
    public int $rules_violated = 0;
    public bool $survived = false;
    public string $played_at = '';
    public ?string $username = null; // Joined from users table

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'score' => $this->score,
            'time_remaining' => $this->time_remaining,
            'passengers_transported' => $this->passengers_transported,
            'difficulty_level' => $this->difficulty_level,
            'rules_violated' => $this->rules_violated,
            'survived' => $this->survived,
            'played_at' => $this->played_at,
            'username' => $this->username,
        ];
    }
}
