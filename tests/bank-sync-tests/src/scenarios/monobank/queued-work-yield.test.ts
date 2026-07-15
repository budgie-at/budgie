import { microPause } from '@app/@generic/utils/micro-pause.util';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import { MONOBANK_RATE_LIMIT_MS } from '@budgie/bank-sync';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { monobankServer } from '../../harness/monobank/monobank-server';
import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const staleForwardSyncFromAt = new Date(2026, 0, 1);
const nextTaskDelayMs = 0;

describe('monobank/queued-work-yield', () => {
    afterEach(() => {
        vi.mocked(microPause).mockImplementation(async (): Promise<void> => undefined);
    });

    it('yields after the current forward sync when user work is queued', async () => {
        const externalIds = ['mono-acc-1', 'mono-acc-2', 'mono-acc-3'];
        const events: string[] = [];
        let queuedImport: Promise<void> | null = null;

        seedMonobankForwardSyncAccounts(externalIds, staleForwardSyncFromAt);

        monobankServer.use(
            http.get(statementEndpoint, ({ params }) => {
                events.push(`request:${String(params['account'])}`);

                if (queuedImport === null) {
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
        let resolveRateLimitReached: () => void = emptyFn;
        let resolveRateLimitPause: () => void = emptyFn;
        let resolveImportRan: () => void = emptyFn;
        let queuedImport: Promise<void> = Promise.resolve();
        const rateLimitReached = new Promise<void>(resolve => {
            resolveRateLimitReached = resolve;
        });
        const importRan = new Promise<void>(resolve => {
            resolveImportRan = resolve;
        });

        seedMonobankForwardSyncAccounts(externalIds, staleForwardSyncFromAt);

        vi.mocked(microPause).mockImplementation(async delay => {
            if (delay !== MONOBANK_RATE_LIMIT_MS) {
                return;
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

        monobankServer.use(
            http.get(statementEndpoint, ({ params }) => {
                events.push(`request:${String(params['account'])}`);

                return HttpResponse.json([]);
            })
        );

        const startupSync = syncWorkloadService.run('startup', () => monobankSyncService.sync());
        await rateLimitReached;
        const importRanBeforePauseReleased = await Promise.race([
            importRan.then(() => true),
            new Promise<false>(resolve => {
                setTimeout(() => {
                    resolve(false);
                }, nextTaskDelayMs);
            })
        ]);
        resolveRateLimitPause();
        await startupSync;
        await queuedImport;

        expect(importRanBeforePauseReleased).toBe(true);
        expect(events).toEqual(['request:mono-acc-1', 'file-import']);
    });
});
