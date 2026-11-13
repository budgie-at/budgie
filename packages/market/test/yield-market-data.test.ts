import { InstrumentMarketDataJobEntityTable, InstrumentMarketDataJobStatusEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { InstrumentDailyMarketPriceRepository } from '../src/market-data/repository/instrument-daily-market-price.repository';
import { InstrumentMarketDataJobRepository } from '../src/market-data/repository/instrument-market-data-job.repository';

import { TestLayer, testDb, testSeedService } from './test-context';

const RepositoryLayer = Layer.mergeAll(InstrumentDailyMarketPriceRepository.layer, InstrumentMarketDataJobRepository.layer).pipe(
    Layer.provideMerge(TestLayer)
);

const seedCoin = (code: string) => testSeedService.instrument({ code, name: code, symbol: code, type: InstrumentTypeEnum.CRYPTO });

describe('yield market data reads', () => {
    it.effect('returns daily prices inside an inclusive range in date order', () =>
        Effect.gen(function* () {
            const repository = yield* InstrumentDailyMarketPriceRepository;
            const coin = yield* seedCoin('YMD1');
            const quote = yield* seedCoin('YMD2');

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

            expect((yield* repository.findInDateRange(coin.id, quote.id, '2026-03-02', '2026-03-03')).map(row => row.priceDate)).toEqual([
                '2026-03-02',
                '2026-03-03'
            ]);
        }).pipe(Effect.provide(RepositoryLayer))
    );

    it.effect('reports pending or running jobs for any of the instruments', () =>
        Effect.gen(function* () {
            const repository = yield* InstrumentMarketDataJobRepository;
            const coin = yield* seedCoin('YMD3');
            const other = yield* seedCoin('YMD4');

            expect(yield* repository.hasActiveForInstruments([coin.id])).toBe(false);

            yield* repository.enqueueMany([
                { instrumentId: coin.id, quoteInstrumentId: other.id, fromDate: '2026-01-01', toDate: '2026-01-31' }
            ]);

            expect(yield* repository.hasActiveForInstruments([other.id, coin.id])).toBe(true);
            expect(yield* repository.hasActiveForInstruments([other.id])).toBe(false);
            expect(yield* repository.hasActiveForInstruments([])).toBe(false);

            yield* testDb.update(InstrumentMarketDataJobEntityTable).set({ status: InstrumentMarketDataJobStatusEnum.UNSUPPORTED });

            expect(yield* repository.hasActiveForInstruments([coin.id])).toBe(false);

            yield* testDb.update(InstrumentMarketDataJobEntityTable).set({ status: InstrumentMarketDataJobStatusEnum.RUNNING });

            expect(yield* repository.hasActiveForInstruments([coin.id])).toBe(true);
        }).pipe(Effect.provide(RepositoryLayer))
    );
});
