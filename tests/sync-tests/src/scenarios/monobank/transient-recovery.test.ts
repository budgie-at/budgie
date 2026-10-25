import { SyncStatusEnum } from '@budgie/contracts';
import { MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as TestClock from 'effect/testing/TestClock';
import { HttpResponse, http } from 'msw';

import { fetchSyncById, MonobankSyncService, TestClockLayer } from '../../harness';
import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { mockServer } from '../../harness/scenario/mock-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';

const runWithCooldowns = Effect.fnUntraced(function* <Value, Error, Requirements>(effect: Effect.Effect<Value, Error, Requirements>) {
    const result = yield* Deferred.make<Value, Error>();
    yield* Effect.forkChild(effect.pipe(Deferred.into(result)));
    for (let attempt = 0; attempt < 1_000 && !(yield* Deferred.isDone(result)); attempt += 1) {
        yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
        yield* TestClock.withLive(Effect.sleep(10));
    }

    return yield* TestClock.withLive(Deferred.await(result).pipe(Effect.timeout(1_000)));
});

describe('monobank/transient-recovery', () => {
    it.effect(
        'ends the exhausted attempt without disabling or advancing the failed row and recovers on the next run',
        () =>
            Effect.gen(function* () {
                const service = yield* MonobankSyncService;
                const cursor = new Date(Math.floor(Date.now() / 1000) * 1000 - 86_400_000);
                const [selectedId, siblingId] = yield* seedMonobankForwardSyncAccounts(['mono-failed', 'mono-unrelated'], cursor);
                const siblingBefore = yield* fetchSyncById(siblingId);
                let attempts = 0;
                mockServer.use(
                    http.get(statementEndpoint, ({ params }) => {
                        if (params['account'] === 'mono-failed') {
                            attempts += 1;

                            return new HttpResponse(null, { status: 503 });
                        }

                        return HttpResponse.json([]);
                    })
                );

                expect(yield* runWithCooldowns(service.sync())).toBe(false);

                const failed = yield* fetchSyncById(selectedId);
                expect(attempts).toBe(16);
                expect(failed).toMatchObject({ enabled: true, status: SyncStatusEnum.FAILED, errorCount: 3 });
                expect(failed.lastError).not.toBeNull();
                expect(failed.forwardSyncFromAt).toEqual(cursor);
                expect(yield* fetchSyncById(siblingId)).toMatchObject({ enabled: true, status: SyncStatusEnum.IDLE, errorCount: 0 });
                expect((yield* fetchSyncById(siblingId)).forwardSyncFromAt?.getTime()).toBeGreaterThan(
                    siblingBefore.forwardSyncFromAt?.getTime() ?? 0
                );

                yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
                mockServer.use(http.get(statementEndpoint, () => HttpResponse.json([])));
                expect(yield* runWithCooldowns(service.sync())).toBe(true);
                expect(yield* fetchSyncById(selectedId)).toMatchObject({
                    enabled: true,
                    status: SyncStatusEnum.IDLE,
                    lastError: null,
                    errorCount: 0
                });
                expect((yield* fetchSyncById(selectedId)).forwardSyncFromAt?.getTime()).toBeGreaterThan(cursor.getTime());
            }).pipe(Effect.provide(TestClockLayer)),
        20_000
    );
});
