import { Workload } from '@app/@generic/service/workload.service';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as FiberSet from 'effect/FiberSet';
import { HttpResponse, http } from 'msw';

import { buildMonobank, fetchPersistedMonobankTransactions, inWorkload, MonobankSyncService, TestLayer } from '../../harness';
import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { mockServer } from '../../harness/scenario/mock-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const statementAccountParam = 'account';
const staleForwardSyncFromAt = new Date(Date.now() - 10 * 60 * 1000);
const nextTaskDelayMs = 0;

describe('monobank/suspended-run-lock', () => {
    it.effect('keeps a sync request made during the active account run', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const runFork = yield* FiberSet.makeRuntime<Workload>();
            const externalIds = ['mono-acc-1', 'mono-acc-2'];
            const requestedAccountIds: string[] = [];
            const blockerStarted = yield* Deferred.make<void>();
            const blockerGate = yield* Deferred.make<void>();

            yield* seedMonobankForwardSyncAccounts(externalIds, staleForwardSyncFromAt);
            const blockerWork = yield* Effect.forkChild(
                inWorkload(Effect.andThen(Deferred.succeed(blockerStarted, undefined), Deferred.await(blockerGate)))
            );
            yield* Deferred.await(blockerStarted);
            const queuedWork = yield* Effect.forkChild(inWorkload(Effect.void));

            mockServer.use(
                http.get(statementEndpoint, ({ params }) => {
                    requestedAccountIds.push(String(params[statementAccountParam]));
                    if (requestedAccountIds.length === 1) {
                        runFork(inWorkload(monobankSyncService.sync()).pipe(Effect.ignore));
                    }

                    return HttpResponse.json([]);
                })
            );

            yield* monobankSyncService.sync();
            yield* Deferred.succeed(blockerGate, undefined);
            yield* Fiber.join(blockerWork);
            yield* Fiber.join(queuedWork);
            yield* inWorkload(Effect.void);

            expect(requestedAccountIds).toEqual(externalIds);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('lets the suspended foreground request finish before queued background work starts', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const workload = yield* Workload;
            const statementRequestGate = Promise.withResolvers<void>();
            const statementRequestStarted = Promise.withResolvers<void>();
            let requestedStatementCount = 0;

            yield* seedMonobankForwardSyncAccounts(['mono-acc-1'], staleForwardSyncFromAt);
            mockServer.use(
                http.get(statementEndpoint, () => {
                    requestedStatementCount += 1;
                    if (requestedStatementCount === 1) {
                        statementRequestStarted.resolve();

                        return statementRequestGate.promise.then(() =>
                            HttpResponse.json([buildMonobank.transaction({ id: 'stale-run-transaction', amount: -100, hold: false })])
                        );
                    }

                    return HttpResponse.json([]);
                })
            );

            const foregroundSync = yield* Effect.forkChild(inWorkload(monobankSyncService.sync()).pipe(Effect.ignore));
            yield* Effect.promise(() => statementRequestStarted.promise);
            yield* workload.interruptBackground;
            const backgroundSync = yield* Effect.forkChild(inWorkload(monobankSyncService.sync()));
            yield* Effect.sleep(nextTaskDelayMs);
            const didReplacementRequestStartWhileForegroundWasSuspended = requestedStatementCount === 2;

            statementRequestGate.resolve();
            yield* Fiber.join(foregroundSync);
            yield* Fiber.join(backgroundSync);

            expect(didReplacementRequestStartWhileForegroundWasSuspended).toBe(false);
            expect(yield* fetchPersistedMonobankTransactions()).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
