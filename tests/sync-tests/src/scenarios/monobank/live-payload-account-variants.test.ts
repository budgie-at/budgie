import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { CashbackTypeEnum, MonobankSyncService, SyncAccountTypeEnum } from '@budgie/sync';
import { AccountType } from '@liaugust/monobank-sdk';
import { describe, expect, it } from 'vitest';

import { buildMonobank, monobankStub } from '../../harness';

import type { ClientInfo } from '@liaugust/monobank-sdk';

const { cashbackType, ...fopAccountWithoutCashback } = buildMonobank.account({ id: 'mono-fop', type: AccountType.Fop });

describe('monobank/live-payload-account-variants', () => {
    it('previews madeInUkraine cards, cashback-less FOP accounts, and goal-less jars', async () => {
        const clientInfo: ClientInfo = {
            ...buildMonobank.clientInfoWith([]),
            accounts: [buildMonobank.account({ id: 'mono-miu', type: AccountType.MadeInUkraine }), fopAccountWithoutCashback],
            jars: [buildMonobank.jar({ id: 'jar-goalless', goal: null })]
        };
        monobankStub.clientInfo(clientInfo);

        const previews = await monobankSyncService.fetchAccountsPreview('test-token');
        const accounts = await new MonobankSyncService('test-token').syncAccounts();

        expect(previews.find(preview => preview.externalId === 'mono-miu')?.type).toBe(SyncAccountTypeEnum.MADE_IN_UKRAINE);
        expect(previews.find(preview => preview.externalId === 'mono-fop')?.type).toBe(SyncAccountTypeEnum.FOP);
        expect(previews.find(preview => preview.externalId === 'jar-goalless')?.type).toBe(SyncAccountTypeEnum.JAR);
        expect(accounts.find(account => account.id === 'mono-fop')?.cashbackType).toBe(CashbackTypeEnum.NONE);
    });
});
