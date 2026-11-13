import {
    AccountTypeEnum,
    DEFAULT_TRANSACTION_FILTER,
    InstrumentTypeEnum,
    PRECISION,
    StatisticsRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryPositionRepository,
    TransactionTypeEnum,
    YieldKindEnum,
    convertFromMicroUnits
} from '@budgie/contracts';
import { YieldRangeEnum, YieldService, calculateInstrumentPosition } from '@budgie/market';
import { InzhurGainService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { requireInstrument, seed, testDb, TestLayer } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { REIT_ISIN } from '../../harness/inzhur/inzhur-fund-isins.constant';
import { DIVIDEND_TYPE, FULL_HISTORY_ROWS, REIT } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurFundAccount } from '../../harness/inzhur/require-inzhur-fund-account';
import { seedInzhurReitPrices } from '../../harness/inzhur/seed-inzhur-reit-prices';

const BASE_ID = 1;
const OTHER_BASE_ID = 2;
const URI = 'yield-parity.xlsx';
const MS_PER_DAY = 86_400_000;
const DECIMAL_PLACES = 6;
const FUND_DECIMAL_PLACES = 2;
const FUND_DIVIDENDS = 160;

const daysAgo = (days: number) => new Date(Date.now() - days * MS_PER_DAY);

const seedYield = Effect.fnUntraced(function* (accountId: number, kind: YieldKindEnum, ago: number, amount: number) {
    const transaction = yield* seed.manualExpense({
        accountId,
        amount: amount * PRECISION,
        operatedAt: daysAgo(ago),
        type: TransactionTypeEnum.INCOME
    });

    yield* testDb.update(TransactionEntityTable).set({ yieldKind: kind }).where(eq(TransactionEntityTable.id, transaction.id));

    return transaction;
});

const summarize = (overrides: {
    readonly range: YieldRangeEnum;
    readonly positionAccountId?: number;
    readonly instrumentId?: number;
    readonly baseInstrumentId?: number;
}) =>
    Effect.flatMap(YieldService, service =>
        service.summarize({
            range: overrides.range,
            positionAccountId: overrides.positionAccountId ?? null,
            instrumentId: overrides.instrumentId ?? null,
            group: null,
            baseInstrumentId: overrides.baseInstrumentId ?? BASE_ID
        })
    );

const inzhurLayer = makeInzhurOperationsLayer({
    [URI]: buildInzhurOperationsWorkbook([
        ...FULL_HISTORY_ROWS,
        { at: '2026-04-01T12:00:00', type: DIVIDEND_TYPE, fund: REIT, debit: 100 },
        { at: '2026-05-01T12:00:00', type: DIVIDEND_TYPE, fund: REIT, debit: 60 }
    ])
});

describe('yield/parity', () => {
    it.effect('equals the statistics income for the range, including a non-base row and an estimated crypto row', () =>
        Effect.gen(function* () {
            const coin = yield* seed.instrument({
                code: 'YPEST',
                name: 'Estimated coin',
                symbol: 'YPEST',
                type: InstrumentTypeEnum.CRYPTO
            });
            const cash = yield* seed.account({ type: AccountTypeEnum.CASH });
            const deposit = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });
            const wallet = yield* seed.account({ type: AccountTypeEnum.CRYPTO_SYNC, instrumentId: coin.id });
            yield* seedYield(cash.id, YieldKindEnum.INTEREST, 40, 10);
            const revalued = yield* seedYield(deposit.id, YieldKindEnum.INTEREST, 10, 25);
            const estimated = yield* seedYield(wallet.id, YieldKindEnum.STAKING, 5, 2);

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ baseInstrumentId: OTHER_BASE_ID, baseExchangeRate: 0.9, baseAmount: 22_500_000 })
                .where(eq(TransactionEntryEntityTable.transactionId, revalued.id));
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ baseInstrumentId: BASE_ID, baseExchangeRate: null })
                .where(eq(TransactionEntryEntityTable.transactionId, estimated.id));

            const summary = yield* summarize({ range: YieldRangeEnum.YEAR });
            const [totals] = yield* (yield* StatisticsRepository).getTotalIncomeAndExpenseQuery(
                { ...DEFAULT_TRANSACTION_FILTER, date: { from: new Date(`${summary.windowStart}T00:00:00`), to: new Date() } },
                BASE_ID
            );

            expect(summary.earned.isEstimated).toBe(true);
            expect(summary.earned.value).toBeCloseTo(convertFromMicroUnits(totals.income), DECIMAL_PLACES);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('adds reward lots at arrival value, so cost basis and Earned never double count', () =>
        Effect.gen(function* () {
            const coin = yield* seed.instrument({ code: 'YPAR', name: 'Parity coin', symbol: 'YPAR', type: InstrumentTypeEnum.CRYPTO });
            const wallet = yield* seed.account({ type: AccountTypeEnum.CRYPTO, instrumentId: coin.id });

            yield* seed.manualExpense({
                accountId: wallet.id,
                amount: PRECISION,
                operatedAt: daysAgo(90),
                type: TransactionTypeEnum.INCOME
            });
            yield* seedYield(wallet.id, YieldKindEnum.STAKING, 30, 0.1);

            const entries = yield* (yield* TransactionEntryPositionRepository).findInstrumentPositionEntries(coin.id, BASE_ID);
            const summary = yield* summarize({ range: YieldRangeEnum.ALL, instrumentId: coin.id });

            expect(calculateInstrumentPosition(entries).costBasis).toBeCloseTo(1 + summary.earned.value, DECIMAL_PLACES);
            expect(summary.earned.value).toBeCloseTo(0.1, DECIMAL_PLACES);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('equals the Inzhur gain dividend component for a fund', () =>
        Effect.gen(function* () {
            yield* seedInzhurReitPrices;
            yield* importInzhurOperations(URI);

            const reit = yield* requireInzhurFundAccount(REIT_ISIN);
            const hryvnia = yield* requireInstrument('UAH');
            const costReturn = yield* (yield* InzhurGainService).getFundCostReturn(reit.id, new Date().toLocaleDateString('en-CA'));
            const summary = yield* summarize({ range: YieldRangeEnum.ALL, positionAccountId: reit.id, baseInstrumentId: hryvnia.id });

            expect(costReturn?.dividends).toBe(FUND_DIVIDENDS);
            expect(summary.earned.value).toBeCloseTo(costReturn?.dividends ?? Number.NaN, FUND_DECIMAL_PLACES);
        }).pipe(Effect.provide(inzhurLayer))
    );
});
