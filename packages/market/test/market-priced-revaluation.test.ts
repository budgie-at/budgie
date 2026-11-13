import {
    AccountTypeEnum,
    CurrencyEnum,
    InstrumentTypeEnum,
    PRECISION,
    SettingsRepository,
    TransactionEntryBaseValuationRepository
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { HistoricalExchangeRateRepository } from '../src/historical-exchange-rate/repository/historical-exchange-rate.repository';
import { InstrumentDailyMarketPriceRepository } from '../src/market-data/repository/instrument-daily-market-price.repository';
import { MarketPricedRevaluationService } from '../src/valuation/service/market-priced-revaluation.service';

import { requireInstrumentByCode, setDefaultInstrument, TestLayer, testDb, testSeedService } from './test-context';

const seedAccounts = Effect.fnUntraced(function* () {
    const euro = yield* requireInstrumentByCode(CurrencyEnum.EUR);
    const hryvnia = yield* requireInstrumentByCode(CurrencyEnum.UAH);
    const coin = yield* testSeedService.instrument({ code: 'TRV1', name: 'TRV1', symbol: 'TRV1', type: InstrumentTypeEnum.CRYPTO });
    const cryptoAccount = yield* testSeedService.account({ instrumentId: coin.id, type: AccountTypeEnum.CRYPTO_SYNC });
    const bankAccount = yield* testSeedService.account({ instrumentId: hryvnia.id, type: AccountTypeEnum.BANK });

    yield* setDefaultInstrument(euro.id);

    return { euro, coin, cryptoAccount, bankAccount };
});

const pendingIncome = (accountId: number, operatedAt: string) =>
    testSeedService.valuedIncome({
        accountId,
        amount: PRECISION,
        operatedAt: new Date(operatedAt),
        title: 'Reward',
        baseInstrumentId: null,
        baseExchangeRate: null,
        baseAmount: null
    });

describe('market-priced entry queries', () => {
    it.effect('leaves market-priced accounts out of the fiat buckets', () =>
        Effect.gen(function* () {
            const repository = yield* TransactionEntryBaseValuationRepository;
            const { euro, coin, cryptoAccount, bankAccount } = yield* seedAccounts();

            yield* pendingIncome(cryptoAccount.id, '2026-03-10T12:00:00.000Z');
            yield* pendingIncome(bankAccount.id, '2026-03-10T12:00:00.000Z');

            const buckets = yield* repository.findPendingBaseValuationBuckets(euro.id);

            expect(buckets.map(bucket => bucket.sourceInstrumentId)).not.toContain(coin.id);
            expect(buckets).toHaveLength(1);
            expect(yield* repository.countPendingBaseValuationEntries(euro.id)).toBe(2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('pages market-priced entries by UTC day and writes base values per row', () =>
        Effect.gen(function* () {
            const repository = yield* TransactionEntryBaseValuationRepository;
            const { euro, coin, cryptoAccount } = yield* seedAccounts();
            const inside = yield* pendingIncome(cryptoAccount.id, '2026-03-10T23:30:00.000Z');

            yield* pendingIncome(cryptoAccount.id, '2026-03-11T00:30:00.000Z');

            const page = yield* repository.findMarketPricedEntriesInRange({
                instrumentId: coin.id,
                fromDate: '2026-03-10',
                toDate: '2026-03-10',
                afterId: 0,
                limit: 10
            });

            expect(page.map(row => row.id)).toStrictEqual([inside.entry.id]);
            expect(page[0]?.operatedAt).toStrictEqual(new Date('2026-03-10T23:30:00.000Z'));

            yield* repository.updateEntryBaseValuations([
                { id: inside.entry.id, baseInstrumentId: euro.id, baseExchangeRate: null, baseAmount: 7 * PRECISION }
            ]);

            const [updated] = yield* repository.findMarketPricedEntriesInRange({
                instrumentId: coin.id,
                fromDate: '2026-03-10',
                toDate: '2026-03-10',
                afterId: 0,
                limit: 10
            });

            expect(updated).toMatchObject({ baseInstrumentId: euro.id, baseExchangeRate: null, baseAmount: 7 * PRECISION });
            expect(yield* repository.findOldestMarketPricedEntryDate(coin.id)).toBe('2026-03-10');
            expect(yield* repository.findMarketPricedInstrumentIds).toStrictEqual([coin.id]);
        }).pipe(Effect.provide(TestLayer))
    );
});

const RevaluationLayer = MarketPricedRevaluationService.layer.pipe(
    Layer.provideMerge(Layer.mergeAll(InstrumentDailyMarketPriceRepository.layer, SettingsRepository.layer)),
    Layer.provideMerge(TestLayer)
);

const writeDailyPrice = (instrumentId: number, quoteInstrumentId: number, priceDate: string, price: number) =>
    Effect.gen(function* () {
        yield* (yield* InstrumentDailyMarketPriceRepository).bulkUpsert([
            { instrumentId, quoteInstrumentId, priceDate, price, marketCap: null, volume: null, source: 'test' }
        ]);
        yield* (yield* HistoricalExchangeRateRepository).bulkUpsert([
            { sourceInstrumentId: instrumentId, targetInstrumentId: quoteInstrumentId, rateDate: priceDate, rate: price },
            { sourceInstrumentId: quoteInstrumentId, targetInstrumentId: instrumentId, rateDate: priceDate, rate: 1 / price }
        ]);
    });

const readEntry = (entryId: number) =>
    testDb.$client
        .unsafe<{ readonly baseInstrumentId: number | null; readonly baseExchangeRate: number | null; readonly baseAmount: number | null }>(
            'SELECT base_instrument_id AS baseInstrumentId, base_exchange_rate AS baseExchangeRate, base_amount AS baseAmount FROM transaction_entries WHERE id = ?',
            [entryId]
        )
        .pipe(Effect.map(([row]) => row));

const readOutboxCount = testDb.$client
    .unsafe<{ readonly total: number }>('SELECT COUNT(*) AS total FROM sync_outbox')
    .pipe(Effect.map(([row]) => row.total));

const readTransactionState = (transactionId: number) =>
    testDb.$client
        .unsafe<{ readonly updatedAt: number | null; readonly updatedBy: string | null }>(
            'SELECT updated_at AS updatedAt, updated_by AS updatedBy FROM transactions WHERE id = ?',
            [transactionId]
        )
        .pipe(Effect.map(([row]) => row));

const readIsApplying = testDb.$client
    .unsafe<{ readonly total: number }>('SELECT COUNT(*) AS total FROM sync_apply_state WHERE is_applying = 1')
    .pipe(Effect.map(([row]) => row.total));

describe('market-priced revaluation', () => {
    it.live('turns an Estimated value Priced once the day price arrives, without outbox rows', () =>
        Effect.gen(function* () {
            const service = yield* MarketPricedRevaluationService;
            const { euro, coin, cryptoAccount } = yield* seedAccounts();
            const { entry, transaction } = yield* testSeedService.valuedIncome({
                accountId: cryptoAccount.id,
                amount: 2 * PRECISION,
                operatedAt: new Date('2026-03-10T12:00:00.000Z'),
                title: 'Reward',
                baseInstrumentId: euro.id,
                baseExchangeRate: null,
                baseAmount: 150 * PRECISION
            });
            const stateBefore = yield* readTransactionState(transaction.id);

            yield* testDb.$client.unsafe('DELETE FROM sync_outbox');
            yield* writeDailyPrice(coin.id, euro.id, '2026-03-10', 100);
            yield* service.revalueInstrumentRange(coin.id, '2026-03-10', '2026-03-10');

            expect(yield* readEntry(entry.id)).toMatchObject({ baseInstrumentId: euro.id, baseExchangeRate: 100, baseAmount: 200 * PRECISION });
            expect(yield* readOutboxCount).toBe(0);
            expect(yield* readTransactionState(transaction.id)).toStrictEqual(stateBefore);
            expect(yield* readIsApplying).toBe(0);
        }).pipe(Effect.provide(RevaluationLayer))
    );

    it.live('never downgrades a value when the strict hop stays Estimated', () =>
        Effect.gen(function* () {
            const service = yield* MarketPricedRevaluationService;
            const { euro, coin, cryptoAccount } = yield* seedAccounts();
            const { entry } = yield* testSeedService.valuedIncome({
                accountId: cryptoAccount.id,
                amount: 2 * PRECISION,
                operatedAt: new Date('2026-03-10T12:00:00.000Z'),
                title: 'Reward',
                baseInstrumentId: euro.id,
                baseExchangeRate: 90,
                baseAmount: 180 * PRECISION
            });

            yield* writeDailyPrice(coin.id, euro.id, '2026-03-01', 100);
            yield* service.revalueInstrumentRange(coin.id, '2026-03-01', '2026-03-10');

            expect(yield* readEntry(entry.id)).toMatchObject({ baseInstrumentId: euro.id, baseExchangeRate: 90, baseAmount: 180 * PRECISION });
        }).pipe(Effect.provide(RevaluationLayer))
    );

    it.live('corrects an instrument from its earliest local price and leaves older entries alone', () =>
        Effect.gen(function* () {
            const service = yield* MarketPricedRevaluationService;
            const { euro, coin, cryptoAccount } = yield* seedAccounts();
            const older = yield* testSeedService.valuedIncome({
                accountId: cryptoAccount.id,
                amount: PRECISION,
                operatedAt: new Date('2025-01-10T12:00:00.000Z'),
                title: 'Old reward',
                baseInstrumentId: euro.id,
                baseExchangeRate: 70,
                baseAmount: 70 * PRECISION
            });
            const gap = yield* testSeedService.valuedIncome({
                accountId: cryptoAccount.id,
                amount: PRECISION,
                operatedAt: new Date('2026-03-20T12:00:00.000Z'),
                title: 'Gap reward',
                baseInstrumentId: euro.id,
                baseExchangeRate: 100,
                baseAmount: 100 * PRECISION
            });
            const stateBefore = yield* readTransactionState(gap.transaction.id);

            yield* testDb.$client.unsafe('DELETE FROM sync_outbox');
            yield* writeDailyPrice(coin.id, euro.id, '2026-03-10', 100);
            yield* service.correctInstrument(coin.id);

            expect(yield* readOutboxCount).toBe(0);
            expect(yield* readTransactionState(gap.transaction.id)).toStrictEqual(stateBefore);
            expect(yield* readIsApplying).toBe(0);

            expect(yield* readEntry(older.entry.id)).toMatchObject({ baseInstrumentId: euro.id, baseExchangeRate: 70, baseAmount: 70 * PRECISION });
            expect(yield* readEntry(gap.entry.id)).toMatchObject({ baseInstrumentId: euro.id, baseExchangeRate: null, baseAmount: 100 * PRECISION });
        }).pipe(Effect.provide(RevaluationLayer))
    );

    it.live('runs the one-time step once and records it in settings', () =>
        Effect.gen(function* () {
            const service = yield* MarketPricedRevaluationService;
            const settingsRepository = yield* SettingsRepository;
            const { euro, coin, cryptoAccount } = yield* seedAccounts();
            const { entry, transaction } = yield* testSeedService.valuedIncome({
                accountId: cryptoAccount.id,
                amount: PRECISION,
                operatedAt: new Date('2026-03-10T12:00:00.000Z'),
                title: 'Reward',
                baseInstrumentId: euro.id,
                baseExchangeRate: 1,
                baseAmount: PRECISION
            });
            const stateBefore = yield* readTransactionState(transaction.id);

            yield* testDb.$client.unsafe('DELETE FROM sync_outbox');
            yield* writeDailyPrice(coin.id, euro.id, '2026-03-10', 100);
            yield* service.runCryptoStrictValuationStep();
            yield* writeDailyPrice(coin.id, euro.id, '2026-03-10', 300);
            yield* service.runCryptoStrictValuationStep();

            expect(yield* readEntry(entry.id)).toMatchObject({ baseInstrumentId: euro.id, baseExchangeRate: 100, baseAmount: 100 * PRECISION });
            expect((yield* settingsRepository.getSettings()).cryptoStrictValuationVersion).toBe(1);
            expect(yield* readOutboxCount).toBe(0);
            expect(yield* readTransactionState(transaction.id)).toStrictEqual(stateBefore);
            expect(yield* readIsApplying).toBe(0);
        }).pipe(Effect.provide(RevaluationLayer))
    );
});
