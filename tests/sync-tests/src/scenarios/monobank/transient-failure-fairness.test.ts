import { SyncModeEnum, SyncRepository, SyncStatusEnum } from '@budgie/contracts';
import { MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import { http, HttpResponse } from 'msw';

import { fetchSyncById, MonobankSyncService, setupTransientFailureFixture, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';

for (const mode of [SyncModeEnum.FORWARD, SyncModeEnum.BACKWARD]) {
    for (const budgetMs of [Number.POSITIVE_INFINITY, 25_000]) {
        describe(`monobank/transient-failure-fairness/${mode}/${budgetMs}`, () => {
            it.effect(
                'serves independent due rows across failed normal runs and later recovers without enabling paused rows',
                () =>
                    Effect.gen(function* () {
                        const service = yield* MonobankSyncService;
                        const repository = yield* SyncRepository;
                        const { cursor, failed, good, pausedSync } = yield* setupTransientFailureFixture(mode);
                        const requestedAccounts: string[] = [];
                        let failurePersists = true;
                        mockServer.use(
                            http.get(statementEndpoint, ({ params }) => {
                                requestedAccounts.push(String(params['account']));
                                if (params['account'] === 'mono-broken' && failurePersists) {
                                    return new HttpResponse(null, { status: 503 });
                                }

                                return HttpResponse.json([]);
                            })
                        );

                        for (const run of [1, 2]) {
                            const healthyRequestsBefore = requestedAccounts.filter(account => account === 'mono-healthy').length;
                            const deadlineAtMs = (yield* Clock.currentTimeMillis) + budgetMs;
                            expect(yield* service.sync(deadlineAtMs)).toBe(false);
                            expect(yield* Clock.currentTimeMillis).toBeLessThanOrEqual(deadlineAtMs);
                            expect(requestedAccounts.filter(account => account === 'mono-broken')).toHaveLength(run * 4);
                            expect(requestedAccounts.filter(account => account === 'mono-healthy').length).toBeGreaterThan(
                                healthyRequestsBefore
                            );
                            const failedAfter = yield* fetchSyncById(failed.id);
                            expect({ ...failedAfter, lastError: failed.lastError, lastErrorCode: failed.lastErrorCode }).toEqual(failed);
                            expect(failedAfter.lastError).not.toBeNull();
                            expect(yield* fetchSyncById(pausedSync.id)).toEqual(pausedSync);
                            yield* repository.update(good.id, { forwardSyncedAt: cursor });
                            yield* Effect.sleep(MONOBANK_RATE_LIMIT_MS);
                        }

                        failurePersists = false;
                        expect(yield* service.sync()).toBe(true);
                        expect(yield* fetchSyncById(failed.id)).toMatchObject({
                            enabled: true,
                            status: SyncStatusEnum.IDLE,
                            lastError: null,
                            errorCount: 0,
                            mode: SyncModeEnum.FORWARD
                        });
                        expect((yield* fetchSyncById(failed.id)).forwardSyncFromAt?.getTime()).toBeGreaterThan(cursor.getTime());
                        expect(yield* fetchSyncById(pausedSync.id)).toEqual(pausedSync);
                        expect(requestedAccounts).not.toContain('mono-paused');
                    }).pipe(Effect.provide(TestLayer)),
                20_000
            );
        });
    }
}
