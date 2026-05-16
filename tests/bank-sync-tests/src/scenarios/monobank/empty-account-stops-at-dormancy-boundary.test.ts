import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { BankSyncModeEnum } from '@budgie/contracts';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';


import { fetchBankSyncById, fetchPersistedMonobankTransactions, setupBackwardSweepFixture } from '../../harness';
import { monobankServer } from '../../harness/monobank/monobank-server';


const EXPECTED_DORMANCY_BOUNDARY_REQUESTS = 6;

describe('monobank/empty-account-stops-at-dormancy-boundary', () => {
    it('terminates backward sweep after ~6 empty 31-day windows (now - 6 months) when the account has no transactions', async () => {
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
