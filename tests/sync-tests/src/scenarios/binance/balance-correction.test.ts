import { AccountBalanceRepository, PRECISION, TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    recentDayInMonthsAgo,
    resyncBinance,
    setupBinanceFixture,
    stubBinanceAccountEndpoints,
    testDb,
    TestLayer
} from '../../harness';

const HOUR_MS = 60 * 60 * 1000;
const LIVE_BALANCE = '100';

const stubDeposits = (amounts: readonly string[]): void => {
    stubBinanceAccountEndpoints([buildBinance.balance({ asset: 'USDT', free: LIVE_BALANCE })]);
    binanceStub.deposits(
        amounts.map((amount, index) =>
            buildBinance.deposit({
                id: `dep-${amount}`,
                coin: 'USDT',
                amount,
                insertTime: index === 0 ? recentDayInMonthsAgo(1) : Date.now() - index * HOUR_MS
            })
        )
    );
};

const readLedgerAndAdjustments = (accountId: number) =>
    Effect.gen(function* () {
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const adjustments = yield* testDb
            .select()
            .from(TransactionEntityTable)
            .where(and(eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT), isNull(TransactionEntityTable.deletedAt)));

        return { ledger: (yield* accountBalanceRepository.getLedgerBalances([accountId])).get(accountId) ?? 0, adjustments };
    });

describe('binance/balance-correction', () => {
    it.effect('books one adjustment so the ledger matches the live balance and adjusts it in place on later syncs', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const fixture = yield* setupBinanceFixture({ asset: 'USDT' });
            stubDeposits(['40']);

            yield* binanceSyncService.sync();
            const first = yield* readLedgerAndAdjustments(fixture.account.id);
            expect(first.ledger).toBe(100 * PRECISION);
            expect(first.adjustments).toHaveLength(1);

            stubDeposits(['40', '10']);
            yield* resyncBinance(fixture.sync.id);
            const second = yield* readLedgerAndAdjustments(fixture.account.id);
            expect(second.ledger).toBe(100 * PRECISION);
            expect(second.adjustments).toHaveLength(1);

            stubDeposits(['40', '10', '50']);
            yield* resyncBinance(fixture.sync.id);
            const complete = yield* readLedgerAndAdjustments(fixture.account.id);
            expect(complete.ledger).toBe(100 * PRECISION);
            expect(complete.adjustments).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
