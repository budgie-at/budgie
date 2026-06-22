import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { InstrumentMarketDataJobStatusEnum } from '@budgie/contracts';

import { instrumentMarketDataJobRepository, instrumentRepository } from '@app/@generic/drizzle/db/db';
import { historicalMarketDataLoaderService } from '@app/market-data/service/historical-market-data-loader.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';

import type { InstrumentMarketDataJobEntityInterface } from '@budgie/contracts';

const drainDelayMs = 500;
const immediateTimerMs = 0;

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

const flushScheduledDrain = async (): Promise<void> => {
    await vi.advanceTimersByTimeAsync(drainDelayMs);
    await vi.advanceTimersByTimeAsync(immediateTimerMs);
    await vi.runOnlyPendingTimersAsync();
    await Promise.resolve();
};

describe('market-data/historical-market-data-loader', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('requestIdleCallback', null);
        vi.stubGlobal('cancelIdleCallback', null);
        Object.assign(syncWorkloadService, {
            backgroundQueue: [],
            isAcceptingWork: true,
            isRunning: false,
            queuedUserWorkListeners: new Set(),
            userQueue: []
        });
        Object.assign(historicalMarketDataLoaderService, {
            cancelIdleCallback: null,
            isRunning: false,
            timer: null
        });
        vi.spyOn(instrumentMarketDataJobRepository, 'claimNext').mockResolvedValue(undefined);
    });

    afterEach(() => {
        historicalMarketDataLoaderService.cancelScheduledDrain();
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('waits for active user import work before claiming the next market data job', async () => {
        let releaseImport = emptyFn;
        const importRelease = new Promise<void>(resolve => {
            releaseImport = resolve;
        });
        let markImportStarted = emptyFn;
        const importStarted = new Promise<void>(resolve => {
            markImportStarted = resolve;
        });
        const importWork = syncWorkloadService.runUser('file-import', async () => {
            markImportStarted();
            await importRelease;
        });

        await importStarted;
        historicalMarketDataLoaderService.scheduleDrain();
        await flushScheduledDrain();
        expect(instrumentMarketDataJobRepository.claimNext).not.toHaveBeenCalled();

        releaseImport();
        await importWork;
        await Promise.resolve();

        expect(instrumentMarketDataJobRepository.claimNext).toHaveBeenCalledTimes(1);
    });

    it('waits for active user import work before marking a market data job failed', async () => {
        const job = buildMarketDataJob();
        let releaseImport = emptyFn;
        const importRelease = new Promise<void>(resolve => {
            releaseImport = resolve;
        });
        let markImportStarted = emptyFn;
        const importStarted = new Promise<void>(resolve => {
            markImportStarted = resolve;
        });
        let importWork = Promise.resolve();

        vi.mocked(instrumentMarketDataJobRepository.claimNext).mockResolvedValueOnce(job).mockResolvedValue(undefined);
        vi.spyOn(instrumentRepository, 'findByIdAsync').mockImplementation(async () => {
            importWork = syncWorkloadService.runUser('file-import', async () => {
                markImportStarted();
                await importRelease;
            });
            await importStarted;

            return undefined;
        });
        vi.spyOn(instrumentMarketDataJobRepository, 'markFailed').mockResolvedValue(undefined);

        historicalMarketDataLoaderService.scheduleDrain();
        await flushScheduledDrain();
        await importStarted;
        expect(instrumentMarketDataJobRepository.markFailed).not.toHaveBeenCalled();

        releaseImport();
        await importWork;
        await Promise.resolve();

        expect(instrumentMarketDataJobRepository.markFailed).toHaveBeenCalledTimes(1);
    });
});
