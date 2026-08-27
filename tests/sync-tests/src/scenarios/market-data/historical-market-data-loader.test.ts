import { instrumentMarketDataJobRepository, instrumentRepository } from '@app/@generic/drizzle/db/db';
import { historicalMarketDataLoaderService } from '@app/market-data/service/historical-market-data-loader.service';
import { InstrumentMarketDataJobStatusEnum } from '@budgie/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDefined } from '@rnw-community/shared';

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

const missingMarketDataJobs: Array<Awaited<ReturnType<typeof instrumentMarketDataJobRepository.claimNext>>> = [];
const missingInstruments: Array<Awaited<ReturnType<typeof instrumentRepository.findByIdAsync>>> = [];

const resolveMissingMarketDataJob = (): ReturnType<typeof instrumentMarketDataJobRepository.claimNext> =>
    Promise.resolve(missingMarketDataJobs[0]);

const resolveMissingInstrument = (): ReturnType<typeof instrumentRepository.findByIdAsync> => Promise.resolve(missingInstruments[0]);

const setupMissingInstrumentJob = (job: InstrumentMarketDataJobEntityInterface, importWorks: PausedUserWork[]): void => {
    spyOnClaimNextJob().mockResolvedValueOnce(job).mockImplementation(resolveMissingMarketDataJob);
    vi.spyOn(instrumentRepository, 'findByIdAsync').mockImplementation(() => {
        const importWork = new PausedUserWork('file-import');
        importWorks.push(importWork);

        return importWork.started.then(resolveMissingInstrument);
    });
    spyOnMarkFailed().mockResolvedValue();
};

describe('market-data/historical-market-data-loader', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('requestIdleCallback', null);
        vi.stubGlobal('cancelIdleCallback', null);
        Object.assign(historicalMarketDataLoaderService, {
            cancelIdleCallback: null,
            isRunning: false,
            timer: null
        });
        spyOnClaimNextJob().mockImplementation(resolveMissingMarketDataJob);
    });

    afterEach(() => {
        historicalMarketDataLoaderService.cancelScheduledDrain();
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('waits for active user import work before claiming the next market data job', async () => {
        const importWork = new PausedUserWork('file-import');

        await importWork.started;
        historicalMarketDataLoaderService.scheduleDrain();
        await flushScheduledDrain(drainDelayMs);
        expect(spyOnClaimNextJob()).not.toHaveBeenCalled();

        importWork.release();
        await importWork.work;
        await Promise.resolve();

        expect(spyOnClaimNextJob()).toHaveBeenCalledTimes(1);
    });

    it('waits for active user import work before marking a market data job failed', async () => {
        const job = buildMarketDataJob();
        const importWorks: PausedUserWork[] = [];

        setupMissingInstrumentJob(job, importWorks);

        historicalMarketDataLoaderService.scheduleDrain();
        await flushScheduledDrain(drainDelayMs);
        expect(spyOnMarkFailed()).not.toHaveBeenCalled();

        const startedImportWork = getDefined(importWorks[0], () => {
            throw new Error('file import did not start');
        });

        startedImportWork.release();
        await startedImportWork.work;
        await Promise.resolve();

        expect(spyOnMarkFailed()).toHaveBeenCalledTimes(1);
    });
});
