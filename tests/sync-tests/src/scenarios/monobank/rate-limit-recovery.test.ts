import { SyncStatusEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Schedule from 'effect/Schedule';
import { HttpResponse, delay, http } from 'msw';

import { fetchSyncById, MonobankSyncService, setupBackwardSweepFixture, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const STATEMENT_ENDPOINT = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const RATE_LIMITED_RESPONSES = 5;
const SHORT_DEADLINE_MS = 10_000;

const stubStatements = (resolver: Parameters<typeof http.get>[1]) => {
    mockServer.use(http.get(STATEMENT_ENDPOINT, resolver));
};

describe('monobank/rate-limit-recovery', () => {
    it.effect('retries a 429 window without counting it as a sync error', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const sync = yield* setupBackwardSweepFixture(new Date());

            let requestCount = 0;
            stubStatements(() => {
                requestCount += 1;

                return requestCount <= RATE_LIMITED_RESPONSES ? new HttpResponse(null, { status: 429 }) : HttpResponse.json([]);
            });

            yield* monobankSyncService.sync();

            const finalSync = yield* fetchSyncById(sync.id);
            expect(requestCount).toBeGreaterThan(RATE_LIMITED_RESPONSES);
            expect(finalSync.enabled).toBe(true);
            expect(finalSync.errorCount).toBe(0);
            expect(finalSync.status).not.toBe(SyncStatusEnum.FAILED);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ends the run instead of sleeping past the deadline and releases the claimed sync', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const sync = yield* setupBackwardSweepFixture(new Date());

            let requestCount = 0;
            stubStatements(() => {
                requestCount += 1;

                return HttpResponse.json([]);
            });

            yield* monobankSyncService.sync((yield* Clock.currentTimeMillis) + SHORT_DEADLINE_MS);

            const finalSync = yield* fetchSyncById(sync.id);
            expect(requestCount).toBe(1);
            expect(finalSync.enabled).toBe(true);
            expect(finalSync.status).toBe(SyncStatusEnum.IDLE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns an interrupted sync to idle', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const sync = yield* setupBackwardSweepFixture(new Date());

            let isRequestStarted = false;
            stubStatements(async () => {
                isRequestStarted = true;
                await delay('infinite');

                return HttpResponse.json([]);
            });

            const fiber = yield* Effect.forkChild(monobankSyncService.sync());
            yield* Effect.sync(() => isRequestStarted).pipe(
                Effect.repeat({ until: isStarted => isStarted, schedule: Schedule.spaced('5 millis') })
            );
            yield* Fiber.interrupt(fiber);

            const finalSync = yield* fetchSyncById(sync.id);
            expect(finalSync.status).toBe(SyncStatusEnum.IDLE);
        }).pipe(Effect.provide(TestLayer))
    );
});
