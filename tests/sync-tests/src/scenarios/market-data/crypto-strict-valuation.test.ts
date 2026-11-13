import { InstrumentMarketDataJobStatusEnum, PRECISION } from '@budgie/contracts';
import { HistoricalMarketDataService } from '@budgie/market';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

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
        }).pipe(Effect.provide(Layer.merge(HistoricalMarketDataService.layer, TestLayer)))
    );
});
