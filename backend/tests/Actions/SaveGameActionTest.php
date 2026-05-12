<?php

declare(strict_types=1);

namespace Tests\Actions;

use App\Actions\SaveGameAction;
use PHPUnit\Framework\TestCase;
use Tests\Support\InMemoryGameSaveStore;

final class SaveGameActionTest extends TestCase
{
    public function testExecuteReturnsExistingServerStateWithoutAcceptingCallerState(): void
    {
        $store = new InMemoryGameSaveStore([
            'earnings' => 12,
            'gamePhase' => 'waiting',
        ]);

        $action = new SaveGameAction($store);
        $state = $action->execute(7);

        self::assertSame(12, $state['earnings']);
        self::assertSame('waiting', $state['gamePhase']);
        self::assertSame(7, $store->touchedUserId);
        self::assertSame(['earnings' => 12, 'gamePhase' => 'waiting'], $store->savedState);
    }

    public function testExecuteReturnsNullWhenNoServerSaveExists(): void
    {
        $store = new InMemoryGameSaveStore(null);

        $action = new SaveGameAction($store);

        self::assertNull($action->execute(7));
        self::assertNull($store->touchedUserId);
    }
}
