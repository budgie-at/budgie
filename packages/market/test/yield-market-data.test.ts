import { InstrumentMarketDataJobEntityTable, InstrumentMarketDataJobStatusEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as TestClock from 'effect/testing/TestClock';

import {
    MARKET_DATA_JOB_MAX_ATTEMPTS as MAX_ATTEMPTS,
    MARKET_DATA_JOB_STALE_LOCK_MS as STALE_LOCK_MS
} from '../src/market-data/constant/market-data-job-retry.constant';
import { InstrumentDailyMarketPriceRepository } from '../src/market-data/repository/instrument-daily-market-price.repository';
import { InstrumentMarketDataJobRepository } from '../src/market-data/repository/instrument-market-data-job.repository';

import { TestLayer, testDb, testSeedService } from './test-context';

const RepositoryLayer = Layer.mergeAll(InstrumentDailyMarketPriceRepository.layer, InstrumentMarketDataJobRepository.layer).pipe(
    Layer.provideMerge(TestLayer)
);

const NOW = new Date('2026-06-03T12:00:00.000Z');

const seedCoin = (code: string) => testSeedService.instrument({ code, name: code, symbol: code, type: InstrumentTypeEnum.CRYPTO });

describe('yield market data reads', () => {
    it.effect('returns daily prices inside an inclusive range in date order', () =>
        Effect.gen(function* () {
            const repository = yield* InstrumentDailyMarketPriceRepository;
            const coin = yield* seedCoin('YMD1');
            const quote = yield* seedCoin('YMD2');
            const otherQuote = yield* seedCoin('YMD5');

            yield* repository.bulkUpsert([
                {
                    instrumentId: coin.id,
                    quoteInstrumentId: otherQuote.id,
                    priceDate: '2026-03-02',
                    price: 2,
                    marketCap: null,
                    volume: null,
                    source: 'test'
                }
            ]);
            yield* repository.bulkUpsert(
                ['2026-03-01', '2026-03-03', '2026-03-02', '2026-03-05'].map(priceDate => ({
                    instrumentId: coin.id,
                    quoteInstrumentId: quote.id,
                    priceDate,
                    price: 1,
                    marketCap: null,
                    volume: null,
                    source: 'test'
                }))
            );

            const rows = yield* repository.findInDateRange(coin.id, quote.id, '2026-03-02', '2026-03-03');

            expect(rows.map(row => row.priceDate)).toEqual(['2026-03-02', '2026-03-03']);
            expect(rows.map(row => row.quoteInstrumentId)).toEqual([quote.id, quote.id]);
        }).pipe(Effect.provide(RepositoryLayer))
    );

    it.effect('counts only open jobs: pending, fresh running and retryable failed', () =>
        Effect.gen(function* () {
            const repository = yield* InstrumentMarketDataJobRepository;
            const coin = yield* seedCoin('YMD3');
            const other = yield* seedCoin('YMD4');
            const isActive = (instrumentIds: readonly number[]) => repository.hasActiveForInstruments(instrumentIds);

            yield* TestClock.setTime(NOW.getTime());
            const setJob = (values: Partial<typeof InstrumentMarketDataJobEntityTable.$inferInsert>) =>
                testDb.update(InstrumentMarketDataJobEntityTable).set(values);

            expect(yield* isActive([coin.id])).toBe(false);

            yield* repository.enqueueMany([
                { instrumentId: coin.id, quoteInstrumentId: other.id, fromDate: '2026-01-01', toDate: '2026-01-31' }
            ]);

            expect(yield* isActive([other.id, coin.id])).toBe(true);
            expect(yield* isActive([other.id])).toBe(false);
            expect(yield* isActive([])).toBe(false);

            yield* setJob({ status: InstrumentMarketDataJobStatusEnum.RUNNING, attempts: 1, lockedAt: NOW });
            expect(yield* isActive([coin.id])).toBe(true);

            yield* setJob({ lockedAt: new Date(NOW.getTime() - 2 * STALE_LOCK_MS), attempts: MAX_ATTEMPTS });
            expect(yield* isActive([coin.id])).toBe(false);

            yield* setJob({ status: InstrumentMarketDataJobStatusEnum.FAILED, attempts: 1, lockedAt: null });
            expect(yield* isActive([coin.id])).toBe(true);

            yield* setJob({ attempts: MAX_ATTEMPTS });
            expect(yield* isActive([coin.id])).toBe(false);

            yield* setJob({ status: InstrumentMarketDataJobStatusEnum.COMPLETED, attempts: 1 });
            expect(yield* isActive([coin.id])).toBe(false);

            yield* setJob({ status: InstrumentMarketDataJobStatusEnum.UNSUPPORTED });
            expect(yield* isActive([coin.id])).toBe(false);

            yield* setJob({ status: InstrumentMarketDataJobStatusEnum.PENDING, deletedAt: NOW });
            expect(yield* isActive([coin.id])).toBe(false);

            yield* setJob({ deletedAt: null });
            expect(yield* isActive([coin.id])).toBe(true);
        }).pipe(Effect.provide(RepositoryLayer))
    );
});
