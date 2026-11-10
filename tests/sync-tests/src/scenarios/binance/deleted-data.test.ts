import { AccountEntityTable, ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    fetchBinanceTransactions,
    resyncBinance,
    seedCryptoInstrument,
    setupUsdtSpotFixtureWithBalances,
    testDb,
    TestLayer
} from '../../harness';

const TRADE_ID = 15;
const FOLLOW_UP_TRADE_ID = 16;
const ADA_ACCOUNT_EXTERNAL_ID = 'SPOT:ADA';

const stubAdaTrades = (...tradeIds: number[]): void => {
    binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '100' }), buildBinance.balance({ asset: 'ADA', free: '200' })]);
    binanceStub.myTrades({
        ADAUSDT: tradeIds.map(id =>
            buildBinance.trade({ symbol: 'ADAUSDT', id, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })
        )
    });
};

const syncAdaTradeOnce = () =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;

        yield* seedCryptoInstrument('ADA');
        const fixture = yield* setupUsdtSpotFixtureWithBalances('ADA', '200');
        stubAdaTrades(TRADE_ID);
        yield* binanceSyncService.sync();

        return fixture;
    });

const fetchActiveBinanceTransactions = () =>
    testDb
        .select()
        .from(TransactionEntityTable)
        .where(and(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE), isNull(TransactionEntityTable.deletedAt)));

const expectTradeStaysDeletedAfterResync = (syncId: number) =>
    Effect.gen(function* () {
        stubAdaTrades(TRADE_ID);
        yield* resyncBinance(syncId);

        expect(yield* fetchBinanceTransactions).toHaveLength(1);
        expect(yield* fetchActiveBinanceTransactions()).toHaveLength(0);
    });

const fetchAdaAccounts = () => testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, ADA_ACCOUNT_EXTERNAL_ID));

describe('binance/deleted-data', () => {
    it.effect('does not recreate a deleted trade transaction inside the overlap window', () =>
        Effect.gen(function* () {
            const { sync } = yield* syncAdaTradeOnce();
            yield* testDb.update(TransactionEntityTable).set({ deletedAt: new Date() });

            yield* expectTradeStaysDeletedAfterResync(sync.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not recreate a trade the user deleted', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const { sync } = yield* syncAdaTradeOnce();
            const [transaction] = yield* fetchActiveBinanceTransactions();
            yield* transactionService.deleteById(transaction.id);

            yield* expectTradeStaysDeletedAfterResync(sync.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('still imports new trades after another trade was deleted', () =>
        Effect.gen(function* () {
            const { sync } = yield* syncAdaTradeOnce();
            yield* testDb.update(TransactionEntityTable).set({ deletedAt: new Date() });

            stubAdaTrades(TRADE_ID, FOLLOW_UP_TRADE_ID);
            yield* resyncBinance(sync.id);

            expect((yield* fetchActiveBinanceTransactions()).map(transaction => transaction.externalId)).toStrictEqual([
                `binance:trade:ADAUSDT:${FOLLOW_UP_TRADE_ID}`
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not recreate an archived asset account or book trades to it', () =>
        Effect.gen(function* () {
            const { sync } = yield* syncAdaTradeOnce();
            const deletedAt = new Date();
            yield* testDb.update(TransactionEntityTable).set({ deletedAt });
            yield* testDb.update(AccountEntityTable).set({ deletedAt }).where(eq(AccountEntityTable.externalId, ADA_ACCOUNT_EXTERNAL_ID));

            stubAdaTrades(TRADE_ID, FOLLOW_UP_TRADE_ID);
            yield* resyncBinance(sync.id);

            expect(yield* fetchAdaAccounts()).toHaveLength(1);
            expect(yield* fetchActiveBinanceTransactions()).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
