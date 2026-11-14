import {
    AccountRepository,
    AccountTypeEnum,
    CurrencyEnum,
    InstrumentEntityTable,
    InstrumentMarketDataJobStatusEnum,
    InstrumentRepository,
    PRECISION,
    SettingsEntityTable,
    SettingsRepository,
    SyncApplyStateRepository,
    TransactionEntryBaseValuationRepository,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { MoneyDataUpgradeService } from '@budgie/ledger';
import {
    EntryBaseValuationService,
    ExchangeRatesService,
    HistoricalExchangeRateRepository,
    HistoricalMarketDataService,
    InstrumentDailyMarketPriceRepository,
    InstrumentMarketDataJobRepository,
    InzhurPriceService,
    KlinesHistoryService,
    MarketPricedRevaluationService
} from '@budgie/market';
import { afterEach, beforeEach, describe, expect, it, vi } from '@effect/vitest';
import { and, eq } from 'drizzle-orm';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';

import { isDefined } from '@rnw-community/shared';

import {
    fetchEntryValuation,
    requireInstrument,
    seed,
    seedCryptoSyncAccount,
    seedDailyPrice,
    seedHistoricalRate,
    seedReward,
    testDb,
    TestLayer
} from '../../harness';

const readJobs = testDb.$client.unsafe<{ readonly instrumentId: number; readonly quoteInstrumentId: number; readonly status: string }>(
    'SELECT instrument_id AS instrumentId, quote_instrument_id AS quoteInstrumentId, status FROM instrument_market_data_jobs ORDER BY id'
);

describe('market-data/crypto-strict-valuation', () => {
    it.effect('enqueues history for a Binance account and prices its rewards when the job lands', () =>
        Effect.gen(function* () {
            const historicalMarketDataService = yield* HistoricalMarketDataService;
            const { euro, coin, account } = yield* seedCryptoSyncAccount('BTC');
            const { entry } = yield* seedReward(account.id, '2026-08-10T09:00:00.000Z', null, null, null);

            yield* historicalMarketDataService.enqueueAccounts([account]);

            expect((yield* readJobs).map(row => ({ ...row }))).toContainEqual({
                instrumentId: coin.id,
                quoteInstrumentId: euro.id,
                status: InstrumentMarketDataJobStatusEnum.PENDING
            });

            const job = yield* historicalMarketDataService.claimNextJob;

            expect(job?.instrumentId).toBe(coin.id);

            if (isDefined(job)) {
                yield* historicalMarketDataService.storeJobData(job, {
                    prices: [
                        {
                            instrumentId: coin.id,
                            quoteInstrumentId: euro.id,
                            priceDate: '2026-08-10',
                            price: 50_000,
                            marketCap: null,
                            volume: null,
                            source: 'test'
                        }
                    ],
                    rates: [
                        { sourceInstrumentId: coin.id, targetInstrumentId: euro.id, rateDate: '2026-08-10', rate: 50_000 },
                        { sourceInstrumentId: euro.id, targetInstrumentId: coin.id, rateDate: '2026-08-10', rate: 1 / 50_000 }
                    ],
                    unsupportedInstruments: []
                });
            }

            expect(yield* fetchEntryValuation(testDb, entry.id)).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: 50_000,
                baseAmount: 50_000 * PRECISION
            });
        }).pipe(Effect.provide(HistoricalMarketDataService.layer.pipe(Layer.provideMerge(TestLayer))))
    );

    it.effect('leaves the job retriable when the repair fails and still runs the first-batch correction on retry', () =>
        Effect.gen(function* () {
            const repairCalls = yield* Ref.make<readonly boolean[]>([]);
            const failingRepairLayer = Layer.effect(
                MarketPricedRevaluationService,
                Effect.map(MarketPricedRevaluationService.make, revaluationService => ({
                    ...revaluationService,
                    repairAfterPriceJob: (...args: Parameters<typeof revaluationService.repairAfterPriceJob>) =>
                        Ref.updateAndGet(repairCalls, calls => [...calls, args[2]]).pipe(
                            Effect.flatMap(calls => (calls.length === 1 ? Effect.die(new Error('repair failed')) : Effect.void))
                        )
                }))
            ).pipe(
                Layer.provide([
                    TransactionEntryBaseValuationRepository.layer,
                    EntryBaseValuationService.layer,
                    SyncApplyStateRepository.layer,
                    ExchangeRatesService.layer,
                    InstrumentDailyMarketPriceRepository.layer,
                    SettingsRepository.layer,
                    InstrumentRepository.layer,
                    InstrumentMarketDataJobRepository.layer
                ])
            );
            const historicalMarketDataLayer = Layer.effect(HistoricalMarketDataService, HistoricalMarketDataService.make).pipe(
                Layer.provide([
                    HistoricalExchangeRateRepository.layer,
                    failingRepairLayer,
                    KlinesHistoryService.layer,
                    TransactionEntryBaseValuationRepository.layer,
                    InstrumentRepository.layer,
                    InzhurPriceService.layer,
                    InstrumentMarketDataJobRepository.layer,
                    AccountRepository.layer,
                    ExchangeRatesService.layer,
                    EntryBaseValuationService.layer,
                    InstrumentDailyMarketPriceRepository.layer
                ])
            );

            return yield* Effect.gen(function* () {
                const historicalMarketDataService = yield* HistoricalMarketDataService;
                const { euro, coin, account } = yield* seedCryptoSyncAccount('DOGE');
                const result = {
                    prices: [
                        {
                            instrumentId: coin.id,
                            quoteInstrumentId: euro.id,
                            priceDate: '2026-08-10',
                            price: 50_000,
                            marketCap: null,
                            volume: null,
                            source: 'test'
                        }
                    ],
                    rates: [],
                    unsupportedInstruments: []
                };

                yield* historicalMarketDataService.enqueueAccounts([account]);

                const job = yield* historicalMarketDataService.claimNextJob;

                if (!isDefined(job)) {
                    return yield* Effect.die(new Error('Expected a claimable job'));
                }

                const failure = yield* Effect.exit(historicalMarketDataService.storeJobData(job, result));

                expect(failure._tag).toBe('Failure');
                expect((yield* readJobs).find(row => row.instrumentId === coin.id)?.status).toBe(InstrumentMarketDataJobStatusEnum.RUNNING);

                yield* historicalMarketDataService.failJob(job, Cause.fail('repair failed'));

                expect((yield* readJobs).find(row => row.instrumentId === coin.id)?.status).toBe(InstrumentMarketDataJobStatusEnum.FAILED);

                const retried = yield* historicalMarketDataService.claimNextJob;

                if (!isDefined(retried)) {
                    return yield* Effect.die(new Error('Expected the failed job to be claimable again'));
                }

                yield* historicalMarketDataService.storeJobData(retried, result);

                expect(yield* Ref.get(repairCalls)).toStrictEqual([true, true]);
                expect((yield* readJobs).find(row => row.instrumentId === coin.id)?.status).toBe(
                    InstrumentMarketDataJobStatusEnum.COMPLETED
                );
            }).pipe(Effect.provide(historicalMarketDataLayer));
        }).pipe(Effect.provide(TestLayer))
    );
});

const revalue = (instrumentId: number, fromDate: string, toDate: string) =>
    Effect.flatMap(MarketPricedRevaluationService, service => service.revalueInstrumentRange(instrumentId, fromDate, toDate));

const entryOf = (transactionId: number, accountId: number) =>
    testDb
        .select()
        .from(TransactionEntryEntityTable)
        .where(and(eq(TransactionEntryEntityTable.transactionId, transactionId), eq(TransactionEntryEntityTable.accountId, accountId)))
        .pipe(Effect.map(([entry]) => entry));

describe('market-data/crypto-strict-valuation scenarios', () => {
    it.effect('aligns the kline open of day D-1 and the CoinGecko point of day D at the seam', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedCryptoSyncAccount('DOGE');
            const tether = yield* requireInstrument('USDT');
            const klinesDay = yield* seedReward(account.id, '2025-11-13T23:30:00.000Z', null, null, null);
            const coinGeckoDay = yield* seedReward(account.id, '2025-11-14T00:30:00.000Z', null, null, null);

            yield* seedDailyPrice(coin.id, euro.id, '2025-11-14', 56_000);
            yield* seedDailyPrice(coin.id, tether.id, '2025-11-13', 60_000);
            yield* seedHistoricalRate(tether.id, euro.id, '2025-11-13', 0.92);
            yield* revalue(coin.id, '2025-11-13', '2025-11-14');

            expect((yield* fetchEntryValuation(testDb, klinesDay.entry.id)).baseExchangeRate).toBeCloseTo(55_200, 6);
            expect((yield* fetchEntryValuation(testDb, coinGeckoDay.entry.id)).baseExchangeRate).toBe(56_000);
        }).pipe(Effect.provide(MarketPricedRevaluationService.layer.pipe(Layer.provideMerge(TestLayer))))
    );

    it.effect('re-values trade legs in the one-time step', () =>
        Effect.gen(function* () {
            const { euro, coin, account: coinAccount } = yield* seedCryptoSyncAccount('BTC');
            const tether = yield* requireInstrument('USDT');
            const tetherAccount = yield* seed.account({ title: 'USDT', instrumentId: tether.id, type: AccountTypeEnum.CRYPTO_SYNC });
            const trade = yield* seed.directTransfer({
                exchangeRate: 1,
                operatedAt: new Date('2026-05-10T09:00:00.000Z'),
                sourceAccountId: tetherAccount.id,
                sourceAmount: 50_000 * PRECISION,
                sourceEntryExchangeRate: 1,
                targetAccountId: coinAccount.id,
                targetAmount: PRECISION,
                toIban: null
            });

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ baseInstrumentId: euro.id, baseExchangeRate: 1, baseAmount: PRECISION })
                .where(eq(TransactionEntryEntityTable.transactionId, trade.id));
            yield* seedDailyPrice(coin.id, euro.id, '2026-05-10', 50_000);
            yield* seedDailyPrice(tether.id, euro.id, '2026-05-10', 0.92);
            yield* Effect.flatMap(MarketPricedRevaluationService, service => service.runCryptoStrictValuationStep());

            expect(yield* entryOf(trade.id, coinAccount.id)).toMatchObject({ baseExchangeRate: 50_000, baseAmount: 50_000 * PRECISION });
            expect(yield* entryOf(trade.id, tetherAccount.id)).toMatchObject({ baseExchangeRate: 0.92, baseAmount: 46_000 * PRECISION });
        }).pipe(Effect.provide(MarketPricedRevaluationService.layer.pipe(Layer.provideMerge(TestLayer))))
    );

    it.effect('marks provider-unsupported rewards Estimated while preserving their stored amounts', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedCryptoSyncAccount('DOGE');
            const { entry } = yield* seedReward(account.id, '2026-08-10T09:00:00.000Z', euro.id, 42, 42 * PRECISION);

            yield* testDb
                .update(InstrumentEntityTable)
                .set({ priceProvider: null, providerInstrumentId: null })
                .where(eq(InstrumentEntityTable.id, coin.id));
            yield* Effect.flatMap(MarketPricedRevaluationService, service => service.runCryptoStrictValuationStep());

            expect(yield* fetchEntryValuation(testDb, entry.id)).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: null,
                baseAmount: 42 * PRECISION
            });
        }).pipe(Effect.provide(MarketPricedRevaluationService.layer.pipe(Layer.provideMerge(TestLayer))))
    );

    it.effect.each([InstrumentMarketDataJobStatusEnum.UNSUPPORTED, InstrumentMarketDataJobStatusEnum.FAILED])(
        'uses the latest base-quote job status %s to correct an unpriced reward',
        status =>
            Effect.gen(function* () {
                const { euro, coin, account } = yield* seedCryptoSyncAccount('DOGE');
                const repository = yield* InstrumentMarketDataJobRepository;
                const { entry } = yield* seedReward(account.id, '2026-08-10T09:00:00.000Z', euro.id, 42, 42 * PRECISION);

                yield* repository.enqueueMany([
                    { instrumentId: coin.id, quoteInstrumentId: euro.id, fromDate: '2026-08-10', toDate: '2026-08-10' }
                ]);

                const job = yield* repository.claimNext(3, new Date(0));

                expect(job).toBeDefined();
                if (!isDefined(job)) {
                    return;
                }

                yield* repository.markUnsupported(job);
                yield* testDb.$client.unsafe('UPDATE instrument_market_data_jobs SET updated_at = 1 WHERE id = ?', [job.id]);
                if (status === InstrumentMarketDataJobStatusEnum.FAILED) {
                    yield* repository.enqueueMany([
                        { instrumentId: coin.id, quoteInstrumentId: euro.id, fromDate: '2026-08-11', toDate: '2026-08-11' }
                    ]);
                    const retryJob = yield* repository.claimNext(3, new Date(0));

                    expect(retryJob).toBeDefined();
                    if (isDefined(retryJob)) {
                        yield* repository.markFailed(retryJob, 'temporary provider failure');
                    }
                }
                yield* Effect.flatMap(MarketPricedRevaluationService, service => service.runCryptoStrictValuationStep());

                expect(yield* fetchEntryValuation(testDb, entry.id)).toStrictEqual({
                    baseInstrumentId: euro.id,
                    baseExchangeRate: status === InstrumentMarketDataJobStatusEnum.UNSUPPORTED ? null : 42,
                    baseAmount: 42 * PRECISION
                });
            }).pipe(
                Effect.provide(
                    Layer.mergeAll(MarketPricedRevaluationService.layer, InstrumentMarketDataJobRepository.layer).pipe(
                        Layer.provideMerge(TestLayer)
                    )
                )
            )
    );

    it.effect('keeps synced values intact on a device with no local prices', () =>
        Effect.gen(function* () {
            const { euro, account } = yield* seedCryptoSyncAccount('DOGE');
            const { entry } = yield* seedReward(account.id, '2026-08-10T09:00:00.000Z', euro.id, 50_000, 50_000 * PRECISION);

            yield* Effect.flatMap(MarketPricedRevaluationService, service => service.runCryptoStrictValuationStep());

            expect(yield* fetchEntryValuation(testDb, entry.id)).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: 50_000,
                baseAmount: 50_000 * PRECISION
            });
        }).pipe(Effect.provide(MarketPricedRevaluationService.layer.pipe(Layer.provideMerge(TestLayer))))
    );

    describe('on a UTC+3 device', () => {
        beforeEach(() => {
            vi.stubEnv('TZ', 'Europe/Moscow');
        });

        afterEach(() => {
            vi.unstubAllEnvs();
        });

        it.effect('values a 01:30 entry with its UTC day on the per-row and the bucket path alike', () =>
            Effect.gen(function* () {
                const euro = yield* requireInstrument(CurrencyEnum.EUR);
                const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);
                const account = yield* seed.account({ type: AccountTypeEnum.BANK, instrumentId: hryvnia.id });
                const operatedAt = new Date('2026-03-10T22:30:00.000Z');

                yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });
                yield* seedHistoricalRate(hryvnia.id, euro.id, '2026-03-10', 0.025);
                yield* seedHistoricalRate(hryvnia.id, euro.id, '2026-03-11', 0.03);

                const perRow = yield* Effect.flatMap(EntryBaseValuationService, service =>
                    service.valueMicroUnitEntry({ accountId: account.id, amount: PRECISION, operatedAt })
                );
                const pending = yield* seed.valuedIncome({
                    accountId: account.id,
                    amount: PRECISION,
                    operatedAt,
                    title: 'Late salary',
                    baseInstrumentId: null,
                    baseExchangeRate: null,
                    baseAmount: null
                });

                yield* Effect.flatMap(MoneyDataUpgradeService, service => service.run('Base instrument missing'));

                expect(perRow.baseExchangeRate).toBe(0.025);
                expect((yield* fetchEntryValuation(testDb, pending.entry.id)).baseExchangeRate).toBe(0.025);
            }).pipe(Effect.provide(TestLayer))
        );
    });
});
