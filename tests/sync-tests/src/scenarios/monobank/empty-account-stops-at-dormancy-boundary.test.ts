import { SyncModeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';

import {
    fetchPersistedMonobankTransactions,
    fetchSyncById,
    MonobankSyncService,
    setupBackwardSweepFixture,
    TestLayer
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const EXPECTED_DORMANCY_BOUNDARY_REQUESTS = 4;

describe('monobank/empty-account-stops-at-dormancy-boundary', () => {
    it.effect('records the first empty `from` then walks 3 more months past it before terminating', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const sweepStart = new Date();
            const sync = yield* setupBackwardSweepFixture(sweepStart);

            let monobankRequestCount = 0;
            mockServer.use(
                http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', ({ params }) => {
                    monobankRequestCount += Number(params['to']) * 1000 <= sweepStart.getTime() ? 1 : 0;

                    return HttpResponse.json([]);
                })
            );

            yield* monobankSyncService.sync();

            expect(monobankRequestCount).toBe(EXPECTED_DORMANCY_BOUNDARY_REQUESTS);
            expect(yield* fetchPersistedMonobankTransactions).toHaveLength(0);

            const finalSync = yield* fetchSyncById(sync.id);
            expect(finalSync.mode).toBe(SyncModeEnum.FORWARD);
            expect(finalSync.transactionCount).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
