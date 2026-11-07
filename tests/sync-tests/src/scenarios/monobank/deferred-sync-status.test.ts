import { SyncStatusEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';

import { fetchSyncById, MonobankSyncService, TestLayer } from '../../harness';
import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { mockServer } from '../../harness/scenario/mock-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const staleForwardSyncFromAt = new Date(Date.now() - 10 * 60 * 1000);
const shortDeadlineMs = 10_000;

describe('monobank/deferred-sync-status', () => {
    it.effect('leaves a sync deferred by the rate gate out of the syncing state', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const requestedAccountIds: string[] = [];
            const [firstSyncId, secondSyncId] = yield* seedMonobankForwardSyncAccounts(
                ['mono-acc-1', 'mono-acc-2'],
                staleForwardSyncFromAt
            );

            mockServer.use(
                http.get(statementEndpoint, ({ params }) => {
                    requestedAccountIds.push(String(params['account']));

                    return HttpResponse.json([]);
                })
            );

            yield* monobankSyncService.sync(Date.now() + shortDeadlineMs);
            yield* monobankSyncService.sync(Date.now() + shortDeadlineMs);

            expect(requestedAccountIds).toEqual(['mono-acc-1']);
            expect((yield* fetchSyncById(firstSyncId)).status).toBe(SyncStatusEnum.IDLE);
            expect((yield* fetchSyncById(secondSyncId)).status).toBe(SyncStatusEnum.IDLE);
        }).pipe(Effect.provide(TestLayer))
    );
});
