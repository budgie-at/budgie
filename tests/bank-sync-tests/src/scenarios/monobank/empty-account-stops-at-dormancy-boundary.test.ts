import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { BankSyncModeEnum } from '@budgie/contracts';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { fetchBankSyncById, fetchPersistedMonobankTransactions, setupBackwardSweepFixture } from '../../harness';
import { monobankServer } from '../../harness/monobank/monobank-server';

const EXPECTED_DORMANCY_BOUNDARY_REQUESTS = 7;

describe('monobank/empty-account-stops-at-dormancy-boundary', () => {
    it('records the first empty `from` then walks 6 more months past it before terminating', async () => {
        const bankSync = setupBackwardSweepFixture(new Date());

        let monobankRequestCount = 0;
        monobankServer.use(
            http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => {
                monobankRequestCount += 1;

                return HttpResponse.json([]);
            })
        );

        await monobankSyncService.sync();

        expect(monobankRequestCount).toBe(EXPECTED_DORMANCY_BOUNDARY_REQUESTS);
        expect(fetchPersistedMonobankTransactions()).toHaveLength(0);

        const finalSync = fetchBankSyncById(bankSync.id);
        expect(finalSync.mode).toBe(BankSyncModeEnum.FORWARD);
        expect(finalSync.transactionCount).toBe(0);
    });
});
