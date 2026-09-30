import { Workload } from '@app/@generic/service/workload.service';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import * as Clock from 'effect/Clock';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { run, runInWorkload } from '../../harness';
import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { mockServer } from '../../harness/scenario/mock-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const statementAccountParam = 'account';
const staleForwardSyncFromAt = new Date('2026-01-01T00:00:00.000Z');
const nextTaskDelayMs = 0;

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

const didImportRunBeforeNextTask = (importRan: Deferred.Deferred<void>): Promise<boolean> =>
    Promise.race([
        run(Deferred.await(importRan)).then(() => true),
        new Promise<false>(resolve => {
            setTimeout(() => {
                resolve(false);
            }, nextTaskDelayMs);
        })
    ]);

describe('monobank/queued-work-yield', () => {
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
                    queuedImport = runInWorkload(
                        Effect.sync(() => {
                            events.push('file-import');
                        })
                    );
                }

                return HttpResponse.json([]);
            })
        );

        await runInWorkload(monobankSyncService.sync());
        await queuedImport;

        expect(events).toEqual(['request:mono-acc-1', 'file-import']);
    });

    it('wakes the rate-limit wait when user work is queued', async () => {
        const externalIds = ['mono-acc-1', 'mono-acc-2'];
        const events: string[] = [];
        const rateLimitReached = Deferred.makeUnsafe<void>();
        const importRan = Deferred.makeUnsafe<void>();

        setupForwardSyncScenario(externalIds, events);

        const startupSync = run(
            Effect.clockWith(clock =>
                Workload.use(workload =>
                    workload.run(
                        monobankSyncService.sync().pipe(
                            Effect.provideService(
                                Clock.Clock,
                                Object.assign(Object.create(clock), {
                                    sleep: () => Effect.andThen(Deferred.succeed(rateLimitReached, undefined), Effect.never)
                                })
                            )
                        )
                    )
                )
            )
        ).then(emptyFn, emptyFn);
        await run(Deferred.await(rateLimitReached));
        const queuedImport = run(
            Workload.use(workload =>
                workload.runUser(
                    Effect.gen(function* () {
                        events.push('file-import');
                        yield* Deferred.succeed(importRan, undefined);
                    })
                )
            )
        );
        const importRanBeforePauseReleased = await didImportRunBeforeNextTask(importRan);
        await startupSync;
        await queuedImport;

        expect(importRanBeforePauseReleased).toBe(true);
        expect(events).toEqual(['request:mono-acc-1', 'file-import']);
    });
});
