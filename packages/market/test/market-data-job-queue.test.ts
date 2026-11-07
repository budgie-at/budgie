import {
    CurrencyEnum,
    InstrumentMarketDataJobEntityTable,
    InstrumentMarketDataJobStatusEnum,
    InstrumentRepository
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as TestClock from 'effect/testing/TestClock';

import { InstrumentMarketDataJobRepository } from '../src/market-data/repository/instrument-market-data-job.repository';

import { TestLayer, testDb } from './test-context';

const maxAttempts = 3;
const staleLockMs = 5 * 60 * 1000;
const startTime = Date.parse('2026-06-03T12:00:00.000Z');

const JobQueueLayer = Layer.mergeAll(TestLayer, InstrumentMarketDataJobRepository.layer);

const enqueueDollarJob = Effect.fnUntraced(function* () {
    const instrumentRepository = yield* InstrumentRepository;
    const jobRepository = yield* InstrumentMarketDataJobRepository;
    const dollar = yield* Effect.flatMap(instrumentRepository.findByCode(CurrencyEnum.USD), Effect.fromNullishOr);
    const euro = yield* Effect.flatMap(instrumentRepository.findByCode(CurrencyEnum.EUR), Effect.fromNullishOr);

    yield* TestClock.setTime(startTime);
    yield* jobRepository.enqueueMany([
        { instrumentId: dollar.id, quoteInstrumentId: euro.id, fromDate: '2026-06-01', toDate: '2026-06-03' }
    ]);

    return { dollar, euro };
});

const claim = Effect.fnUntraced(function* (nowMs: number) {
    const jobRepository = yield* InstrumentMarketDataJobRepository;

    yield* TestClock.setTime(nowMs);

    return yield* Effect.flatMap(jobRepository.claimNext(maxAttempts, new Date(nowMs - staleLockMs)), Effect.fromNullishOr);
});

const findJob = (jobId: number) =>
    testDb.select().from(InstrumentMarketDataJobEntityTable).where(eq(InstrumentMarketDataJobEntityTable.id, jobId)).get();

describe('market data job queue', () => {
    it.effect('ignores a terminal write from a worker whose stale claim was reclaimed', () =>
        Effect.gen(function* () {
            const jobRepository = yield* InstrumentMarketDataJobRepository;

            yield* enqueueDollarJob();

            const staleClaim = yield* claim(startTime);
            const currentClaim = yield* claim(startTime + staleLockMs + 1000);

            yield* jobRepository.markCompleted(staleClaim);
            yield* jobRepository.markFailed(staleClaim, 'slow worker failure');

            const reclaimed = yield* findJob(currentClaim.id);

            expect(reclaimed).toMatchObject({ status: InstrumentMarketDataJobStatusEnum.RUNNING, attempts: 2, lastError: null });

            yield* jobRepository.markCompleted(currentClaim);

            expect(yield* findJob(currentClaim.id)).toMatchObject({ status: InstrumentMarketDataJobStatusEnum.COMPLETED, lockedAt: null });
        }).pipe(Effect.provide(JobQueueLayer))
    );

    it.effect('stops counting a job as open once its attempts are exhausted', () =>
        Effect.gen(function* () {
            const jobRepository = yield* InstrumentMarketDataJobRepository;
            const { dollar, euro } = yield* enqueueDollarJob();
            const hasOpenAt = (nowMs: number) => jobRepository.hasOpen(dollar.id, euro.id, maxAttempts, new Date(nowMs - staleLockMs));

            expect(yield* hasOpenAt(startTime)).toBe(true);

            for (const attempt of [1, 2, 3]) {
                const job = yield* claim(startTime + attempt * 1000);

                expect(yield* hasOpenAt(startTime + attempt * 1000)).toBe(true);

                yield* jobRepository.markFailed(job, 'rate source unavailable');
            }

            expect(yield* hasOpenAt(startTime + 4000)).toBe(false);
        }).pipe(Effect.provide(JobQueueLayer))
    );

    it.effect('stops counting a job as open once its last attempt lock goes stale', () =>
        Effect.gen(function* () {
            const jobRepository = yield* InstrumentMarketDataJobRepository;
            const { dollar, euro } = yield* enqueueDollarJob();
            const lastAttemptStartedAt = startTime + 3 * staleLockMs + 3000;

            yield* claim(startTime);
            yield* claim(startTime + staleLockMs + 1000);
            yield* claim(lastAttemptStartedAt);

            expect(yield* jobRepository.hasOpen(dollar.id, euro.id, maxAttempts, new Date(lastAttemptStartedAt - staleLockMs))).toBe(true);
            expect(yield* jobRepository.hasOpen(dollar.id, euro.id, maxAttempts, new Date(lastAttemptStartedAt + 1000))).toBe(false);
        }).pipe(Effect.provide(JobQueueLayer))
    );
});
