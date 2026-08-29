import { microPause } from '@app/@generic/utils/micro-pause.util';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import { MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { mockServer } from '../../harness/scenario/mock-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const statementAccountParam = 'account';
const staleForwardSyncFromAt = new Date('2026-01-01T00:00:00.000Z');
const nextTaskDelayMs = 0;

const setupRateLimitHarness = (events: string[]) => {
    let resolveRateLimitReached: () => void = emptyFn;
    let resolveRateLimitPause: () => void = emptyFn;
    let resolveImportRan: () => void = emptyFn;
    let queuedImport = Promise.resolve();
    const rateLimitReached = new Promise<void>(resolve => {
        resolveRateLimitReached = resolve;
    });
    const importRan = new Promise<void>(resolve => {
        resolveImportRan = resolve;
    });

    vi.mocked(microPause).mockImplementation(delay => {
        if (delay !== MONOBANK_RATE_LIMIT_MS) {
            return Promise.resolve();
        }

        queuedImport = syncWorkloadService.runUser('file-import', async () => {
            events.push('file-import');
            resolveImportRan();
        });
        resolveRateLimitReached();

        return new Promise<void>(resolve => {
            resolveRateLimitPause = resolve;
        });
    });

    return {
        getQueuedImport: () => queuedImport,
        importRan,
        rateLimitReached,
        releaseRateLimitPause: () => {
            resolveRateLimitPause();
        }
    };
};

const mockStatementRequests = (events: string[]): void => {
    mockServer.use(
        http.get(statementEndpoint, ({ params }) => {
            events.push(`request:${String(params[statementAccountParam])}`);

            return HttpResponse.json([]);
        })
    );
};

const setupForwardSyncScenario = (externalIds: string[], events: string[]): void => {
    seedMonobankForwardSyncAccounts(externalIds, staleForwardSyncFromAt);
    mockStatementRequests(events);
};

const didImportRunBeforeNextTask = (importRan: Promise<void>): Promise<boolean> =>
    Promise.race([
        importRan.then(() => true),
        new Promise<false>(resolve => {
            setTimeout(() => {
                resolve(false);
            }, nextTaskDelayMs);
        })
    ]);

describe('monobank/queued-work-yield', () => {
    afterEach(() => {
        vi.mocked(microPause).mockImplementation((): Promise<void> => Promise.resolve());
    });

    it('yields after the current forward sync when user work is queued', async () => {
        const externalIds = ['mono-acc-1', 'mono-acc-2', 'mono-acc-3'];
        const events: string[] = [];
        let queuedImport = Promise.resolve();
        let hasQueuedImport = false;

        seedMonobankForwardSyncAccounts(externalIds, staleForwardSyncFromAt);

        mockServer.use(
            http.get(statementEndpoint, ({ params }) => {
                events.push(`request:${String(params[statementAccountParam])}`);

                if (!hasQueuedImport) {
                    hasQueuedImport = true;
                    queuedImport = syncWorkloadService.run('file-import', async () => {
                        events.push('file-import');
                    });
                }

                return HttpResponse.json([]);
            })
        );

        await syncWorkloadService.run('startup', () => monobankSyncService.sync());
        await queuedImport;

        expect(events).toEqual(['request:mono-acc-1', 'file-import']);
    });

    it('wakes the rate-limit wait when user work is queued', async () => {
        const externalIds = ['mono-acc-1', 'mono-acc-2'];
        const events: string[] = [];
        const rateLimitHarness = setupRateLimitHarness(events);

        setupForwardSyncScenario(externalIds, events);

        const startupSync = syncWorkloadService.run('startup', () => monobankSyncService.sync());
        await rateLimitHarness.rateLimitReached;
        const importRanBeforePauseReleased = await didImportRunBeforeNextTask(rateLimitHarness.importRan);
        rateLimitHarness.releaseRateLimitPause();
        await startupSync;
        await rateLimitHarness.getQueuedImport();

        expect(importRanBeforePauseReleased).toBe(true);
        expect(events).toEqual(['request:mono-acc-1', 'file-import']);
    });
});
