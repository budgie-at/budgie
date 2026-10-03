import { Workload } from '@app/@generic/service/workload.service';
import { HistoricalMarketDataDrainerService } from '@app/market-data/service/historical-market-data-drainer.service';
import { InstrumentMarketDataJobStatusEnum, InstrumentRepository } from '@budgie/contracts';
import { InstrumentMarketDataJobRepository } from '@budgie/market';
import { afterEach, beforeEach, describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { getDefined } from '@rnw-community/shared';

import { advanceScheduledDrain, pauseUserWork, TestClockLayer } from '../../harness';

import type { InstrumentMarketDataJobEntityInterface } from '@budgie/contracts';

const drainDelayMs = 500;

const buildMarketDataJob = (): InstrumentMarketDataJobEntityInterface => ({
    attempts: 1,
    completedAt: null,
    createdAt: new Date('2026-06-22T05:17:02.000Z'),
    deletedAt: null,
    fromDate: '2026-06-07',
    id: 42,
    instrumentId: 36,
    lastError: null,
    lockedAt: new Date('2026-06-22T05:17:02.000Z'),
    priority: 10,
    quoteInstrumentId: 2,
    status: InstrumentMarketDataJobStatusEnum.RUNNING,
    toDate: '2026-06-22',
    updatedAt: new Date('2026-06-22T05:17:02.000Z')
});

const claimNextExecutions = vi.fn();
const markFailedExecutions = vi.fn();

const recordClaimNext = <Job>(job: Job) =>
    Effect.suspend(() => {
        claimNextExecutions();

        return Effect.succeed(job);
    });

describe('market-data/historical-market-data-loader', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        claimNextExecutions.mockClear();
        markFailedExecutions.mockClear();
        vi.stubGlobal('requestIdleCallback', null);
        vi.stubGlobal('cancelIdleCallback', null);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it.effect('waits for active user import work before claiming the next market data job', () =>
        Effect.gen(function* () {
            const historicalMarketDataDrainerService = yield* HistoricalMarketDataDrainerService;
            const instrumentMarketDataJobRepository = yield* InstrumentMarketDataJobRepository;
            vi.spyOn(instrumentMarketDataJobRepository, 'claimNext').mockImplementation(() => recordClaimNext(undefined));
            const releaseImportWork = yield* pauseUserWork(Effect.void);

            yield* historicalMarketDataDrainerService.scheduleDrain();
            yield* advanceScheduledDrain(drainDelayMs);
            expect(claimNextExecutions).not.toHaveBeenCalled();

            yield* releaseImportWork();
            yield* advanceScheduledDrain(drainDelayMs);

            expect(claimNextExecutions).toHaveBeenCalledTimes(1);
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('waits for active user import work before marking a market data job failed', () =>
        Effect.gen(function* () {
            const historicalMarketDataDrainerService = yield* HistoricalMarketDataDrainerService;
            const instrumentMarketDataJobRepository = yield* InstrumentMarketDataJobRepository;
            const instrumentRepository = yield* InstrumentRepository;
            const workload = yield* Workload;
            const importWorkReleases: Array<() => Effect.Effect<void>> = [];

            vi.spyOn(instrumentMarketDataJobRepository, 'claimNext')
                .mockReturnValueOnce(recordClaimNext(buildMarketDataJob()))
                .mockImplementation(() => recordClaimNext(undefined));
            vi.spyOn(instrumentRepository, 'findById').mockImplementation(() =>
                pauseUserWork(Effect.void).pipe(
                    Effect.provideService(Workload, workload),
                    Effect.tap(release => Effect.sync(() => importWorkReleases.push(release))),
                    Effect.as(undefined)
                )
            );
            vi.spyOn(instrumentMarketDataJobRepository, 'markFailed').mockReturnValue(
                Effect.suspend(() => {
                    markFailedExecutions();

                    return Effect.void;
                })
            );

            yield* historicalMarketDataDrainerService.scheduleDrain();
            yield* advanceScheduledDrain(drainDelayMs);
            expect(markFailedExecutions).not.toHaveBeenCalled();

            const releaseImportWork = getDefined(importWorkReleases[0], () => {
                throw new Error('file import did not start');
            });

            yield* releaseImportWork();
            yield* advanceScheduledDrain(drainDelayMs);

            expect(markFailedExecutions).toHaveBeenCalledTimes(1);
        }).pipe(Effect.provide(TestClockLayer))
    );
});
