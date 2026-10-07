import { SyncStatusEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';

import { fetchSyncById, MonobankSyncService, setupBackwardSweepFixture, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const STATEMENT_ENDPOINT = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const RATE_LIMITED_RESPONSES = 5;
const SHORT_DEADLINE_MS = 10_000;

const syncWithStatements = Effect.fnUntraced(function* (respond: (requestCount: number) => Response, deadlineAtMs?: number) {
    const monobankSyncService = yield* MonobankSyncService;
    const sync = yield* setupBackwardSweepFixture(new Date());

    let requestCount = 0;
    mockServer.use(
        http.get(STATEMENT_ENDPOINT, () => {
            requestCount += 1;

            return respond(requestCount);
        })
    );

    yield* monobankSyncService.sync(deadlineAtMs);

    return { requestCount, finalSync: yield* fetchSyncById(sync.id) };
});

describe('monobank/rate-limit-recovery', () => {
    it.effect('retries a 429 window without counting it as a sync error', () =>
        Effect.gen(function* () {
            const { requestCount, finalSync } = yield* syncWithStatements(count =>
                count <= RATE_LIMITED_RESPONSES ? new HttpResponse(null, { status: 429 }) : HttpResponse.json([])
            );

            expect(requestCount).toBeGreaterThan(RATE_LIMITED_RESPONSES);
            expect(finalSync.enabled).toBe(true);
            expect(finalSync.errorCount).toBe(0);
            expect(finalSync.status).not.toBe(SyncStatusEnum.FAILED);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { name: 'an empty window', status: 200 },
        { name: 'a 429', status: 429 }
    ])('ends the run at the deadline after $name instead of waiting for the rate limit', ({ status }) =>
        Effect.gen(function* () {
            const { requestCount, finalSync } = yield* syncWithStatements(
                () => (status === 429 ? new HttpResponse(null, { status }) : HttpResponse.json([])),
                Date.now() + SHORT_DEADLINE_MS
            );

            expect(requestCount).toBe(1);
            expect(finalSync.enabled).toBe(true);
            expect(finalSync.errorCount).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
