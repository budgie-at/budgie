import { instrumentMarketDataJobRepository, instrumentRepository } from '@app/@generic/drizzle/db/db';
import { historicalMarketDataLoaderService } from '@app/market-data/service/historical-market-data-loader.service';
import { InstrumentMarketDataJobStatusEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDefined } from '@rnw-community/shared';

import { run } from '../../harness';
import { flushScheduledDrain } from '../../harness/scheduler/flush-scheduled-drain';
import { PausedUserWork } from '../../harness/sync-workload/paused-user-work';

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

const spyOnClaimNextJob = () => vi.spyOn(instrumentMarketDataJobRepository, 'claimNext');

const spyOnMarkFailed = () => vi.spyOn(instrumentMarketDataJobRepository, 'markFailed');

const missingMarketDataJobs: Array<Effect.Success<ReturnType<typeof instrumentMarketDataJobRepository.claimNext>>> = [];
const missingInstruments: Array<Effect.Success<ReturnType<typeof instrumentRepository.findByIdAsync>>> = [];

const claimNextExecutions = vi.fn();
const markFailedExecutions = vi.fn();

const recordClaimNext = (
    job: Effect.Success<ReturnType<typeof instrumentMarketDataJobRepository.claimNext>>
): ReturnType<typeof instrumentMarketDataJobRepository.claimNext> =>
    Effect.suspend(() => {
        claimNextExecutions();

        return Effect.succeed(job);
    });

const resolveMissingMarketDataJob = (): ReturnType<typeof instrumentMarketDataJobRepository.claimNext> =>
    recordClaimNext(missingMarketDataJobs[0]);

const resolveMissingInstrument = (): Effect.Effect<Effect.Success<ReturnType<typeof instrumentRepository.findByIdAsync>>> =>
    Effect.succeed(missingInstruments[0]);

const setupMissingInstrumentJob = (job: InstrumentMarketDataJobEntityInterface, importWorks: PausedUserWork[]): void => {
    spyOnClaimNextJob().mockReturnValueOnce(recordClaimNext(job)).mockImplementation(resolveMissingMarketDataJob);
    vi.spyOn(instrumentRepository, 'findByIdAsync').mockImplementation(() => {
        const importWork = new PausedUserWork();
        importWorks.push(importWork);

        return Effect.andThen(
            Effect.promise(() => importWork.started),
            resolveMissingInstrument()
        );
    });
    spyOnMarkFailed().mockReturnValue(
        Effect.suspend(() => {
            markFailedExecutions();

            return Effect.void;
        })
    );
};

describe('market-data/historical-market-data-loader', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
        claimNextExecutions.mockClear();
        markFailedExecutions.mockClear();
        vi.stubGlobal('requestIdleCallback', null);
        vi.stubGlobal('cancelIdleCallback', null);
        spyOnClaimNextJob().mockImplementation(resolveMissingMarketDataJob);
    });

    afterEach(async () => {
        await run(historicalMarketDataLoaderService.cancelScheduledDrain());
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('waits for active user import work before claiming the next market data job', async () => {
        const importWork = new PausedUserWork();

        await importWork.started;
        await run(historicalMarketDataLoaderService.scheduleDrain());
        await flushScheduledDrain(drainDelayMs);
        expect(claimNextExecutions).not.toHaveBeenCalled();

        importWork.release();
        await importWork.work;

        await vi.waitFor(() => {
            expect(claimNextExecutions).toHaveBeenCalledTimes(1);
        });
    });

    it('waits for active user import work before marking a market data job failed', async () => {
        const job = buildMarketDataJob();
        const importWorks: PausedUserWork[] = [];

        setupMissingInstrumentJob(job, importWorks);

        await run(historicalMarketDataLoaderService.scheduleDrain());
        await flushScheduledDrain(drainDelayMs);
        expect(markFailedExecutions).not.toHaveBeenCalled();

        const startedImportWork = getDefined(importWorks[0], () => {
            throw new Error('file import did not start');
        });

        startedImportWork.release();
        await startedImportWork.work;

        await vi.waitFor(() => {
            expect(markFailedExecutions).toHaveBeenCalledTimes(1);
        });
    });
});
