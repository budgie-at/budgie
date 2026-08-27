import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { SyncModeEnum } from '@budgie/contracts';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { fetchPersistedMonobankTransactions, fetchSyncById, setupBackwardSweepFixture } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const EXPECTED_DORMANCY_BOUNDARY_REQUESTS = 4;

describe('monobank/empty-account-stops-at-dormancy-boundary', () => {
    it('records the first empty `from` then walks 3 more months past it before terminating', async () => {
        const sync = setupBackwardSweepFixture(new Date());

        let monobankRequestCount = 0;
        mockServer.use(
            http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => {
                monobankRequestCount += 1;

                return HttpResponse.json([]);
            })
        );

        await monobankSyncService.sync();

        expect(monobankRequestCount).toBe(EXPECTED_DORMANCY_BOUNDARY_REQUESTS);
        expect(fetchPersistedMonobankTransactions()).toHaveLength(0);

        const finalSync = fetchSyncById(sync.id);
        expect(finalSync.mode).toBe(SyncModeEnum.FORWARD);
        expect(finalSync.transactionCount).toBe(0);
    });
});
