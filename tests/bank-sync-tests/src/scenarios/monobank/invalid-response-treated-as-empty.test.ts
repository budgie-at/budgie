import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { BankSyncModeEnum } from '@budgie/contracts';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';


import { fetchBankSyncById, fetchPersistedMonobankTransactions, setupBackwardSweepFixture } from '../../harness';
import { monobankServer } from '../../harness/monobank/monobank-server';


const HTTP_BAD_REQUEST = 400;
const EXPECTED_DORMANCY_BOUNDARY_REQUESTS = 6;

describe('monobank/invalid-response-treated-as-empty', () => {
    it('treats HTTP 400 (INVALID_RESPONSE) like an empty window and terminates at the dormancy boundary', async () => {
        const bankSync = setupBackwardSweepFixture(new Date());

        let monobankRequestCount = 0;
        monobankServer.use(
            http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => {
                monobankRequestCount += 1;
                
return new HttpResponse(null, { status: HTTP_BAD_REQUEST });
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
