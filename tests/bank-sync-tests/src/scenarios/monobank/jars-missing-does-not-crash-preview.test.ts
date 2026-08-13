import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { BankAccountTypeEnum } from '@budgie/bank-sync';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildMonobank } from '../../harness';
import { monobankServer } from '../../harness/monobank/monobank-server';

import type { MonobankClientInfoApiInterface } from '@budgie/bank-sync';

describe('monobank/jars-missing-does-not-crash-preview', () => {
    it('lists accounts without throwing when the client-info response omits jars entirely', async () => {
        const clientInfoWithoutJars: Omit<MonobankClientInfoApiInterface, 'jars'> = {
            clientId: 'c1',
            name: 'Test',
            webHookUrl: '',
            permissions: 'sp',
            accounts: [buildMonobank.account({ id: 'mono-card' })]
        };
        monobankServer.use(http.get('https://api.monobank.ua/personal/client-info', () => HttpResponse.json(clientInfoWithoutJars)));

        const previews = await monobankSyncService.fetchAccountsPreview('test-token');

        expect(previews).toHaveLength(1);
        expect(previews[0]?.externalId).toBe('mono-card');
        expect(previews.some(preview => preview.type === BankAccountTypeEnum.JAR)).toBe(false);
    });
});
