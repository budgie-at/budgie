import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { BankAccountTypeEnum } from '@budgie/bank-sync';
import { describe, expect, it } from 'vitest';

import { buildMonobank, monobankStub } from '../../harness';

import type { ClientInfo } from '@liaugust/monobank-sdk';

describe('monobank/jars-listed-in-preview', () => {
    it('surfaces jars from client-info as selectable jar previews alongside cards', async () => {
        const clientInfo: ClientInfo = {
            ...buildMonobank.clientInfoWith(['mono-card']),
            jars: [buildMonobank.jar({ id: 'jar-1', title: 'Студія' })]
        };
        monobankStub.clientInfo(clientInfo);

        const previews = await monobankSyncService.fetchAccountsPreview('test-token');

        const jarPreview = previews.find(preview => preview.type === BankAccountTypeEnum.JAR);
        const cardPreview = previews.find(preview => preview.type !== BankAccountTypeEnum.JAR);

        expect(jarPreview?.externalId).toBe('jar-1');
        expect(jarPreview?.title).toContain('Студія');
        expect(cardPreview?.externalId).toBe('mono-card');
    });
});
