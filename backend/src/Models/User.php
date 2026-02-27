<?php
declare(strict_types=1);

namespace App\Models;

final class User
{
    public int $id = 0;
    public int $wh_user_id = 0;
    public string $email = '';
    public string $username = 'driver';
    public bool $is_active = true;
    public string $created_at = '';
    public string $updated_at = '';
    public ?string $last_seen_at = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'wh_user_id' => $this->wh_user_id,
            'email' => $this->email,
            'username' => $this->username,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'last_seen_at' => $this->last_seen_at,
        ];
    }
}
