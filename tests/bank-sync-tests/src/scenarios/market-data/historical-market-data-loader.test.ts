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
        vi.spyOn(instrumentMarketDataJobRepository, 'claimNext').mockResolvedValue(undefined);
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
        expect(instrumentMarketDataJobRepository.claimNext).not.toHaveBeenCalled();

        importWork.release();
        await importWork.work;
        await Promise.resolve();

        expect(instrumentMarketDataJobRepository.claimNext).toHaveBeenCalledTimes(1);
    });

    it('waits for active user import work before marking a market data job failed', async () => {
        const job = buildMarketDataJob();
        const importWorks: PausedUserWork[] = [];

        vi.mocked(instrumentMarketDataJobRepository.claimNext).mockResolvedValueOnce(job).mockResolvedValue(undefined);
        vi.spyOn(instrumentRepository, 'findByIdAsync').mockImplementation(async () => {
            const importWork = new PausedUserWork('file-import');
            importWorks.push(importWork);
            await importWork.started;

            return undefined;
        });
        vi.spyOn(instrumentMarketDataJobRepository, 'markFailed').mockResolvedValue(undefined);

        historicalMarketDataLoaderService.scheduleDrain();
        await flushScheduledDrain(drainDelayMs);
        expect(instrumentMarketDataJobRepository.markFailed).not.toHaveBeenCalled();

        const startedImportWork = getDefined(importWorks[0], () => {
            throw new Error('file import did not start');
        });

        startedImportWork.release();
        await startedImportWork.work;
        await Promise.resolve();

        expect(instrumentMarketDataJobRepository.markFailed).toHaveBeenCalledTimes(1);
    });
});
