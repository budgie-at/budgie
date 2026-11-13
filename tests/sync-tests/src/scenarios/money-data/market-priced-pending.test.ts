import {
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    PRECISION,
    SettingsEntityTable,
    StatisticsRepository,
    TransactionEntryBaseValuationRepository
} from '@budgie/contracts';
import { MoneyDataUpgradeService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchEntryValuation, requireInstrument, seed, seedCryptoSyncAccount, seedDailyPrice, testDb, TestLayer } from '../../harness';

const reward = (
    accountId: number,
    operatedAt: string,
    baseInstrumentId: number | null,
    baseExchangeRate: number | null,
    baseAmount: number | null
) =>
    seed.valuedIncome({
        accountId,
        amount: PRECISION,
        operatedAt: new Date(operatedAt),
        title: 'Reward',
        baseInstrumentId,
        baseExchangeRate,
        baseAmount
    });

const runUpgrade = Effect.flatMap(MoneyDataUpgradeService, service => service.run('Base instrument missing'));

describe('market-priced pending entries', () => {
    it.effect('keeps an Estimated row Estimated when a pending row shares its bucket', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedCryptoSyncAccount('BTC');
            const estimatedRow = yield* reward(account.id, '2026-08-10T09:00:00.000Z', euro.id, null, 40_000 * PRECISION);
            const pendingRow = yield* reward(account.id, '2026-08-10T15:00:00.000Z', null, null, null);

            yield* seedDailyPrice(coin.id, euro.id, '2026-08-01', 50_000);
            yield* runUpgrade;

            expect(yield* fetchEntryValuation(testDb, estimatedRow.entry.id)).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: null,
                baseAmount: 40_000 * PRECISION
            });
            expect(yield* fetchEntryValuation(testDb, pendingRow.entry.id)).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: null,
                baseAmount: 50_000 * PRECISION
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('re-values crypto rows through the strict branch after a base-currency change', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedCryptoSyncAccount('BTC');
            const dollar = yield* requireInstrument(CurrencyEnum.USD);
            const pricedDay = yield* reward(account.id, '2026-08-10T09:00:00.000Z', euro.id, 50_000, 50_000 * PRECISION);
            const gapDay = yield* reward(account.id, '2026-08-20T09:00:00.000Z', euro.id, 50_000, 50_000 * PRECISION);

            yield* seedDailyPrice(coin.id, dollar.id, '2026-08-10', 60_000);
            yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: dollar.id });
            yield* runUpgrade;

            expect(yield* fetchEntryValuation(testDb, pricedDay.entry.id)).toStrictEqual({
                baseInstrumentId: dollar.id,
                baseExchangeRate: 60_000,
                baseAmount: 60_000 * PRECISION
            });
            expect(yield* fetchEntryValuation(testDb, gapDay.entry.id)).toStrictEqual({
                baseInstrumentId: dollar.id,
                baseExchangeRate: null,
                baseAmount: 60_000 * PRECISION
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves no Estimated row pending and keeps it in the income total', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedCryptoSyncAccount('BTC');
            const repository = yield* TransactionEntryBaseValuationRepository;
            const statisticsRepository = yield* StatisticsRepository;

            yield* reward(account.id, '2026-08-20T09:00:00.000Z', null, null, null);
            yield* seedDailyPrice(coin.id, euro.id, '2026-08-01', 50_000);
            yield* runUpgrade;

            const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, euro.id);

            expect(yield* repository.countPendingBaseValuationEntries(euro.id)).toBe(0);
            expect(totals.income).toBe(50_000 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );
});
