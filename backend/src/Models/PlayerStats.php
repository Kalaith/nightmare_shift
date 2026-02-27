<?php
declare(strict_types=1);

namespace App\Models;

final class PlayerStats
{
    public int $id = 0;
    public int $user_id = 0;
    public int $total_shifts_completed = 0;
    public int $total_shifts_started = 0;
    public int $total_rides_completed = 0;
    public float $total_earnings = 0.0;
    public float $total_fuel_used = 0.0;
    public int $total_time_played_minutes = 0;
    public float $best_shift_earnings = 0.0;
    public int $best_shift_rides = 0;
    public int $longest_shift_minutes = 0;
    public float $bank_balance = 0.0;
    public int $lore_fragments = 0;
    /** @var string[] */
    public array $unlocked_skills = [];
    /** @var int[] */
    public array $passengers_encountered = [];
    /** @var int[] */
    public array $backstories_unlocked = [];
    /** @var int[] */
    public array $legendary_passengers = [];
    /** @var string[] */
    public array $achievements_unlocked = [];
    /** @var array<int, mixed> */
    public array $rules_violated_history = [];
    /** @var array<int, array<string, mixed>> */
    public array $almanac_progress = [];
    public ?string $first_play_date = null;
    public ?string $last_play_date = null;
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
            'total_shifts_completed' => $this->total_shifts_completed,
            'total_shifts_started' => $this->total_shifts_started,
            'total_rides_completed' => $this->total_rides_completed,
            'total_earnings' => $this->total_earnings,
            'total_fuel_used' => $this->total_fuel_used,
            'total_time_played_minutes' => $this->total_time_played_minutes,
            'best_shift_earnings' => $this->best_shift_earnings,
            'best_shift_rides' => $this->best_shift_rides,
            'longest_shift_minutes' => $this->longest_shift_minutes,
            'bank_balance' => $this->bank_balance,
            'lore_fragments' => $this->lore_fragments,
            'unlocked_skills' => $this->unlocked_skills,
            'passengers_encountered' => $this->passengers_encountered,
            'backstories_unlocked' => $this->backstories_unlocked,
            'legendary_passengers' => $this->legendary_passengers,
            'achievements_unlocked' => $this->achievements_unlocked,
            'rules_violated_history' => $this->rules_violated_history,
            'almanac_progress' => $this->almanac_progress,
            'first_play_date' => $this->first_play_date,
            'last_play_date' => $this->last_play_date,
        ];
    }
}
