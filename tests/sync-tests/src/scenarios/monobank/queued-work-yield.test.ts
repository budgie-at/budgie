import { Workload } from '@app/@generic/service/workload.service';
import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { describe, expect, it } from '@effect/vitest';
import * as Clock from 'effect/Clock';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as FiberSet from 'effect/FiberSet';
import * as Option from 'effect/Option';
import { HttpResponse, http } from 'msw';

import { inWorkload, TestLayer } from '../../harness';
import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { mockServer } from '../../harness/scenario/mock-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const statementAccountParam = 'account';
const staleForwardSyncFromAt = new Date('2026-01-01T00:00:00.000Z');
const nextTaskDelayMs = 200;

describe('monobank/queued-work-yield', () => {
    it.effect('yields after the current forward sync when user work is queued', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const externalIds = ['mono-acc-1', 'mono-acc-2', 'mono-acc-3'];
            const events: string[] = [];
            const runFork = yield* FiberSet.makeRuntime<Workload>();
            const queuedImport = yield* Deferred.make<void>();
            let hasQueuedImport = false;

            yield* seedMonobankForwardSyncAccounts(externalIds, staleForwardSyncFromAt);

            mockServer.use(
                http.get(statementEndpoint, ({ params }) => {
                    events.push(`request:${String(params[statementAccountParam])}`);

                    if (!hasQueuedImport) {
                        hasQueuedImport = true;
                        runFork(
                            inWorkload(
                                Effect.sync(() => {
                                    events.push('file-import');
                                })
                            ).pipe(Deferred.into(queuedImport))
                        );
                    }

                    return HttpResponse.json([]);
                })
            );

            yield* inWorkload(monobankSyncService.sync());
            yield* Deferred.await(queuedImport);

            expect(events).toEqual(['request:mono-acc-1', 'file-import']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('wakes the rate-limit wait when user work is queued', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const workload = yield* Workload;
            const events: string[] = [];
            const rateLimitReached = yield* Deferred.make<void>();
            const importRan = yield* Deferred.make<void>();
            const clock = yield* Effect.clockWith(Effect.succeed);

            yield* seedMonobankForwardSyncAccounts(['mono-acc-1', 'mono-acc-2'], staleForwardSyncFromAt);
            mockServer.use(
                http.get(statementEndpoint, ({ params }) => {
                    events.push(`request:${String(params[statementAccountParam])}`);

                    return HttpResponse.json([]);
                })
            );

            const startupSync = yield* Effect.forkChild(
                inWorkload(
                    monobankSyncService.sync().pipe(
                        Effect.provideService(
                            Clock.Clock,
                            Object.assign(Object.create(clock), {
                                sleep: () => Effect.andThen(Deferred.succeed(rateLimitReached, undefined), Effect.never)
                            })
                        )
                    )
                )
            );
            yield* Deferred.await(rateLimitReached);
            const queuedImport = yield* Effect.forkChild(
                workload.runUser(
                    Effect.gen(function* () {
                        events.push('file-import');
                        yield* Deferred.succeed(importRan, undefined);
                    })
                )
            );
            const importRanBeforePauseReleased = yield* Deferred.await(importRan).pipe(
                Effect.timeoutOption(nextTaskDelayMs),
                Effect.map(Option.isSome)
            );
            yield* Fiber.await(startupSync);
            yield* Fiber.join(queuedImport);

            expect(importRanBeforePauseReleased).toBe(true);
            expect(events).toEqual(['request:mono-acc-1', 'file-import']);
        }).pipe(Effect.provide(TestLayer))
    );
});
