import { SyncModeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    fetchBinanceTransactions,
    jumpPastDeadline,
    resetBinanceSyncForResync,
    restoreRealTimers,
    RUN_DEADLINE_MS,
    setupBinanceFixture,
    stubEmptyBinanceBalances,
    TestLayer
} from '../../harness';

const DAY_MS = 24 * 60 * 60 * 1000;
const PENDING_DEPOSIT_STATUS = 0;
const SUCCESSFUL_DEPOSIT_STATUS = 1;

describe('binance/capital-pending-deferred', () => {
    it.effect('imports a deposit that was pending when a deferred run walked past it', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const depositTimeMs = Date.now() - 3 * DAY_MS;
            const stubDeposit = (status: number): void => {
                binanceStub.deposits([buildBinance.deposit({ id: 'dep-1', coin: 'BTC', amount: '2', insertTime: depositTimeMs, status })]);
            };

            yield* setupBinanceFixture({ mode: SyncModeEnum.FORWARD, forwardSyncFromAt: new Date(Date.now() - DAY_MS) });
            stubEmptyBinanceBalances();
            stubDeposit(PENDING_DEPOSIT_STATUS);
            binanceStub.withdrawals([], [], { onServed: jumpPastDeadline });

            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS).pipe(Effect.ensuring(restoreRealTimers));

            expect(yield* fetchBinanceTransactions).toHaveLength(0);

            resetBinanceSyncForResync();
            stubDeposit(SUCCESSFUL_DEPOSIT_STATUS);
            yield* binanceSyncService.sync();

            expect(yield* fetchBinanceTransactions).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
