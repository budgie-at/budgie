import { MONOBANK_RATE_LIMIT_MS, MonobankSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as FiberSet from 'effect/FiberSet';
import { HttpResponse, delay, http } from 'msw';

import {
    advanceScheduledDrain,
    fetchPersistedMonobankTransactions,
    fetchSyncById,
    inWorkload,
    TestClockLayer,
    TestLayer,
    Workload
} from '../../harness';
import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { mockServer } from '../../harness/scenario/mock-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const MS_PER_SECOND = 1_000;
const RESPONSE_DELAY_MS = 1_100;
const FORWARD_GAP_MS = 24 * 60 * 60 * MS_PER_SECOND;
const forwardSyncFromAt = new Date(Date.now() - FORWARD_GAP_MS);
const accountExternalIds = ['mono-acc-1', 'mono-acc-2', 'mono-acc-3'];

describe('monobank/forward-sync-progress', () => {
    it.effect('moves the forward cursor to the fetched upper bound, not to the time the batch finished', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const [syncId] = yield* seedMonobankForwardSyncAccounts(['mono-acc-cursor'], forwardSyncFromAt);
            const requestedUpperBounds: number[] = [];
            mockServer.use(
                http.get(statementEndpoint, async ({ params }) => {
                    requestedUpperBounds.push(Number(params['to']));
                    await delay(RESPONSE_DELAY_MS);

                    return HttpResponse.json([]);
                })
            );

            yield* monobankSyncService.sync();

            expect(requestedUpperBounds).toHaveLength(1);
            expect((yield* fetchSyncById(syncId)).forwardSyncFromAt?.getTime()).toBe(requestedUpperBounds[0] * MS_PER_SECOND);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the forward cursor when the statement response is invalid', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const [syncId] = yield* seedMonobankForwardSyncAccounts(['mono-acc-invalid'], forwardSyncFromAt);
            const syncBefore = yield* fetchSyncById(syncId);
            mockServer.use(http.get(statementEndpoint, () => HttpResponse.json([{ unexpected: true }])));

            yield* monobankSyncService.sync();

            const syncAfter = yield* fetchSyncById(syncId);
            expect(syncAfter.forwardSyncFromAt).toEqual(syncBefore.forwardSyncFromAt);
            expect(syncAfter.lastError).not.toBeNull();
            expect(yield* fetchPersistedMonobankTransactions()).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('continues every stale forward account after queued user work stops the first run', () =>
        Effect.gen(function* () {
            const workload = yield* Workload;
            const userWorkDone = yield* Deferred.make<void>();
            const queueUserWork = yield* FiberSet.makeRuntime<Workload>();
            const requestedAccounts = new Set<string>();
            yield* seedMonobankForwardSyncAccounts(accountExternalIds, forwardSyncFromAt);
            mockServer.use(
                http.get(statementEndpoint, ({ params }) => {
                    requestedAccounts.add(String(params['account']));
                    if (requestedAccounts.size === 1) {
                        queueUserWork(workload.runUser(Deferred.succeed(userWorkDone, undefined)));
                    }

                    return HttpResponse.json([]);
                })
            );

            const monobankSyncService = yield* MonobankSyncService;

            yield* inWorkload(monobankSyncService.sync());
            yield* Deferred.await(userWorkDone);
            yield* Effect.forEach(accountExternalIds, () => advanceScheduledDrain(MONOBANK_RATE_LIMIT_MS), { discard: true });

            expect([...requestedAccounts].sort()).toEqual(accountExternalIds);
        }).pipe(Effect.provide(TestClockLayer))
    );
});
