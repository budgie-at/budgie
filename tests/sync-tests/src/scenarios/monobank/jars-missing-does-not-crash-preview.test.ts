import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { SyncAccountTypeEnum } from '@budgie/sync';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildMonobank } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

import type { ClientInfo } from '@liaugust/monobank-sdk';

describe('monobank/jars-missing-does-not-crash-preview', () => {
    it('lists accounts without throwing when the client-info response omits jars entirely', async () => {
        const clientInfoWithoutJars: Omit<ClientInfo, 'jars'> = {
            clientId: 'c1',
            name: 'Test',
            webHookUrl: '',
            permissions: 'sp',
            accounts: [buildMonobank.account({ id: 'mono-card' })]
        };
        mockServer.use(http.get('https://api.monobank.ua/personal/client-info', () => HttpResponse.json(clientInfoWithoutJars)));

        const previews = await monobankSyncService.fetchAccountsPreview('test-token');

        expect(previews).toHaveLength(1);
        expect(previews[0]?.externalId).toBe('mono-card');
        expect(previews.some(preview => preview.type === SyncAccountTypeEnum.JAR)).toBe(false);
    });
});
