import {
    AccountBalanceRepository,
    AccountRepository,
    ExternalSourceEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    recentDayInMonthsAgo,
    seedCryptoInstrument,
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

    it.effect('corrects accounts that only exist in history to zero once and keeps a single correction on resync', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const accountRepository = yield* AccountRepository;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const fixture = yield* setupBinanceFixture({ asset: 'USDT' });
            yield* seedCryptoInstrument('XRP');
            stubBinanceAccountEndpoints([buildBinance.balance({ asset: 'USDT', free: LIVE_BALANCE })]);
            binanceStub.deposits([buildBinance.deposit({ id: 'dep-1', coin: 'USDT', amount: '100', insertTime: recentDayInMonthsAgo(2) })]);
            binanceStub.convertTradeFlow([
                buildBinance.convertFlow({ orderId: 9101, fromAsset: 'USDT', fromAmount: '10', toAsset: 'XRP', toAmount: '20' })
            ]);

            yield* binanceSyncService.sync();
            yield* resyncBinance(fixture.sync.id);

            const xrpAccount = (yield* accountRepository.findByExternalSource(ExternalSourceEnum.BINANCE)).find(
                account => account.externalId === 'SPOT:XRP'
            );
            expect(xrpAccount).toBeDefined();
            const xrpId = xrpAccount?.id ?? 0;
            const xrp = yield* readLedgerAndAdjustments(xrpId);
            expect(xrp.ledger).toBe(0);
            expect((yield* accountBalanceRepository.getByAccountIds([xrpId])).map(balance => balance.amount)).toEqual([0]);
            expect(
                xrp.adjustments.filter(adjustment => adjustment.toAccountId === xrpId || adjustment.fromAccountId === xrpId)
            ).toHaveLength(1);
            expect((yield* readLedgerAndAdjustments(fixture.account.id)).ledger).toBe(100 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );
});
