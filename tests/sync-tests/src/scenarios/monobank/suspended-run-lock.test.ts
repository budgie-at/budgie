import { Workload } from '@app/@generic/service/workload.service';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { buildMonobank, fetchPersistedMonobankTransactions, flushWorkload, run, runInWorkload } from '../../harness';
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
        const blockerStarted = Deferred.makeUnsafe<void>();
        const blockerGate = Deferred.makeUnsafe<void>();

        seedMonobankForwardSyncAccounts(externalIds, staleForwardSyncFromAt);
        const blockerWork = runInWorkload(Effect.andThen(Deferred.succeed(blockerStarted, undefined), Deferred.await(blockerGate)));
        await run(Deferred.await(blockerStarted));
        const queuedWork = runInWorkload(Effect.void);

        mockServer.use(
            http.get(statementEndpoint, ({ params }) => {
                requestedAccountIds.push(String(params[statementAccountParam]));
                if (requestedAccountIds.length === 1) {
                    void runInWorkload(monobankSyncService.sync()).catch(emptyFn);
                }

                return HttpResponse.json([]);
            })
        );

        await run(monobankSyncService.sync());
        Deferred.doneUnsafe(blockerGate, Effect.void);
        await blockerWork;
        await queuedWork;
        await flushWorkload();

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

                    return HttpResponse.json([buildMonobank.transaction({ id: 'stale-run-transaction', amount: -100, hold: false })]);
                }

                return HttpResponse.json([]);
            })
        );

        const foregroundSync = runInWorkload(monobankSyncService.sync()).then(emptyFn, emptyFn);
        await statementRequestStarted;
        await run(Workload.use(workload => workload.interruptBackground));
        const backgroundSync = runInWorkload(monobankSyncService.sync());
        await new Promise<void>(resolve => {
            setTimeout(resolve, nextTaskDelayMs);
        });
        const didReplacementRequestStartWhileForegroundWasSuspended = requestedStatementCount === 2;

        releaseStatementRequest();
        await foregroundSync;
        await backgroundSync;

        expect(didReplacementRequestStartWhileForegroundWasSuspended).toBe(true);
        expect(fetchPersistedMonobankTransactions()).toHaveLength(0);
    });
});
