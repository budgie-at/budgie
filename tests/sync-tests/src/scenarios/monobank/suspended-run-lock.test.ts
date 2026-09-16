import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { mockServer } from '../../harness/scenario/mock-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const statementAccountParam = 'account';
const staleForwardSyncFromAt = new Date(Date.now() - 10 * 60 * 1000);
const nextTaskDelayMs = 0;

describe('monobank/suspended-run-lock', () => {
    it('keeps a sync request made during the active account run', async () => {
        const externalIds = ['mono-acc-1', 'mono-acc-2'];
        const requestedAccountIds: string[] = [];
        let releaseBlocker = emptyFn;
        let resolveBlockerStarted = emptyFn;
        const blockerGate = new Promise<void>(resolve => {
            releaseBlocker = resolve;
        });
        const blockerStarted = new Promise<void>(resolve => {
            resolveBlockerStarted = resolve;
        });

        seedMonobankForwardSyncAccounts(externalIds, staleForwardSyncFromAt);
        const blockerWork = syncWorkloadService.run('blocker', async () => {
            resolveBlockerStarted();
            await blockerGate;
        });
        await blockerStarted;
        const queuedWork = syncWorkloadService.run('queued-work', async () => Promise.resolve());

        mockServer.use(
            http.get(statementEndpoint, ({ params }) => {
                requestedAccountIds.push(String(params[statementAccountParam]));
                if (requestedAccountIds.length === 1) {
                    void monobankSyncService.sync().catch(emptyFn);
                }

                return HttpResponse.json([]);
            })
        );

        await monobankSyncService.sync();
        releaseBlocker();
        await blockerWork;
        await queuedWork;
        await syncWorkloadService.run('flush', async () => Promise.resolve());

        expect(requestedAccountIds).toEqual(externalIds);
    });

    it('starts replacement background work while the foreground request is suspended', async () => {
        let releaseStatementRequest = emptyFn;
        let resolveStatementRequestStarted = emptyFn;
        let requestedStatementCount = 0;
        const statementRequestGate = new Promise<void>(resolve => {
            releaseStatementRequest = resolve;
        });
        const statementRequestStarted = new Promise<void>(resolve => {
            resolveStatementRequestStarted = resolve;
        });

        seedMonobankForwardSyncAccounts(['mono-acc-1'], staleForwardSyncFromAt);
        mockServer.use(
            http.get(statementEndpoint, async () => {
                requestedStatementCount += 1;
                if (requestedStatementCount === 1) {
                    resolveStatementRequestStarted();
                    await statementRequestGate;
                }

                return HttpResponse.json([]);
            })
        );

        const foregroundSync = syncWorkloadService.run('foreground', () => monobankSyncService.sync());
        await statementRequestStarted;
        monobankSyncService.interruptActiveRun();
        syncWorkloadService.interruptActiveWork();
        const backgroundSync = syncWorkloadService.run('background-monobank', () => monobankSyncService.sync());
        await new Promise<void>(resolve => {
            setTimeout(resolve, nextTaskDelayMs);
        });
        const didReplacementRequestStartWhileForegroundWasSuspended = requestedStatementCount === 2;

        releaseStatementRequest();
        await foregroundSync;
        await backgroundSync;

        expect(didReplacementRequestStartWhileForegroundWasSuspended).toBe(true);
    });
});
