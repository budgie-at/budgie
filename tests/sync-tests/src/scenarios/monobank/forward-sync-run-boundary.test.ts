import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { afterEach, describe, expect, it, vi } from '@effect/vitest';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { HttpResponse, http } from 'msw';

import { TestLayer } from '../../harness';
import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { mockServer } from '../../harness/scenario/mock-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const statementAccountParam = 'account';
const staleForwardSyncFromAt = new Date('2026-01-01T00:00:00.000Z');
const syncStartedAt = new Date('2026-01-01T12:00:00.000Z');
const oneMinuteMs = 60_000;

enum SyncRunResultEnum {
    COMPLETED = 'COMPLETED',
    STOPPED = 'STOPPED'
}

describe('monobank/forward-sync-run-boundary', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it.effect('does not select the same forward sync again during one sync run', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            vi.useFakeTimers({ toFake: ['Date'] });
            vi.setSystemTime(syncStartedAt);

            const externalIds = ['mono-acc-1', 'mono-acc-2', 'mono-acc-3'];
            const requestedAccountIds: string[] = [];
            let shouldStopSync = false;

            seedMonobankForwardSyncAccounts(externalIds, staleForwardSyncFromAt);

            const advanceClockOneMinute = Effect.suspend(() => {
                if (shouldStopSync) {
                    return Effect.die(new Error('duplicate forward sync selected'));
                }

                return Effect.sync(() => {
                    vi.setSystemTime(new Date(Date.now() + oneMinuteMs));
                });
            });

            mockServer.use(
                http.get(statementEndpoint, ({ params }) => {
                    requestedAccountIds.push(String(params[statementAccountParam]));
                    if (requestedAccountIds.length > externalIds.length) {
                        shouldStopSync = true;
                    }

                    return HttpResponse.json([]);
                })
            );

            const exit = yield* Effect.exit(
                Effect.clockWith(clock =>
                    monobankSyncService
                        .sync()
                        .pipe(
                            Effect.provideService(Clock.Clock, Object.assign(Object.create(clock), { sleep: () => advanceClockOneMinute }))
                        )
                )
            );
            const result = Exit.isSuccess(exit) ? SyncRunResultEnum.COMPLETED : SyncRunResultEnum.STOPPED;

            expect(result).toBe(SyncRunResultEnum.COMPLETED);
            expect(requestedAccountIds).toEqual(externalIds);
        }).pipe(Effect.provide(TestLayer))
    );
});
