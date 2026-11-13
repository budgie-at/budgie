import {
    AccountRepository,
    InstrumentMarketDataJobStatusEnum,
    InstrumentRepository,
    PRECISION,
    SettingsRepository,
    SyncApplyStateRepository,
    TransactionEntryBaseValuationRepository
} from '@budgie/contracts';
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
import { describe, expect, it } from '@effect/vitest';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';

import { isDefined } from '@rnw-community/shared';

import { fetchEntryValuation, seed, seedCryptoSyncAccount, testDb, TestLayer } from '../../harness';

const readJobs = testDb.$client.unsafe<{ readonly instrumentId: number; readonly quoteInstrumentId: number; readonly status: string }>(
    'SELECT instrument_id AS instrumentId, quote_instrument_id AS quoteInstrumentId, status FROM instrument_market_data_jobs ORDER BY id'
);

describe('market-data/crypto-strict-valuation', () => {
    it.effect('enqueues history for a Binance account and prices its rewards when the job lands', () =>
        Effect.gen(function* () {
            const historicalMarketDataService = yield* HistoricalMarketDataService;
            const { euro, coin, account } = yield* seedCryptoSyncAccount('BTC');
            const { entry } = yield* seed.valuedIncome({
                accountId: account.id,
                amount: PRECISION,
                operatedAt: new Date('2026-08-10T09:00:00.000Z'),
                title: 'Reward',
                baseInstrumentId: null,
                baseExchangeRate: null,
                baseAmount: null
            });

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
                    SettingsRepository.layer
                ])
            );
            const historicalMarketDataLayer = Layer.effect(HistoricalMarketDataService, HistoricalMarketDataService.make).pipe(
                Layer.provide([
                    HistoricalExchangeRateRepository.layer,
                    InstrumentDailyMarketPriceRepository.layer,
                    InstrumentMarketDataJobRepository.layer,
                    InstrumentRepository.layer,
                    ExchangeRatesService.layer,
                    AccountRepository.layer,
                    TransactionEntryBaseValuationRepository.layer,
                    EntryBaseValuationService.layer,
                    InzhurPriceService.layer,
                    KlinesHistoryService.layer,
                    failingRepairLayer
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
