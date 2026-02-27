<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\AlmanacRepository;

final class GetAlmanacAction
{
    public function __construct(
        private readonly AlmanacRepository $almanacRepo
    ) {}

    /**
     * @return array<int, array<string, mixed>>
     */
    public function execute(int $userId): array
    {
        return $this->almanacRepo->getByUserId($userId);
    }
}
