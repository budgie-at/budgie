import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { SyncAccountTypeEnum } from '@budgie/sync';
import { AccountType } from '@liaugust/monobank-sdk';
import { describe, expect, it } from 'vitest';

import { buildMonobank, monobankStub } from '../../harness';

import type { Account, ClientInfo } from '@liaugust/monobank-sdk';

// The live API returns madeInUkraine cards, omits cashbackType on FOP
// accounts, and returns goal: null for jars without a target. None of these
// appear in Monobank's published docs, so this scenario pins the real payload.
const fopAccountWithoutCashback: Account = {
    id: 'mono-fop',
    sendId: 'send-fop',
    currencyCode: 980,
    balance: 0,
    creditLimit: 0,
    maskedPan: [],
    type: AccountType.Fop,
    iban: 'UA000000000000000000000000000'
};

describe('monobank/live-payload-account-variants', () => {
    it('previews madeInUkraine cards, cashback-less FOP accounts, and goal-less jars', async () => {
        const clientInfo: ClientInfo = {
            ...buildMonobank.clientInfoWith([]),
            accounts: [buildMonobank.account({ id: 'mono-miu', type: AccountType.MadeInUkraine }), fopAccountWithoutCashback],
            jars: [buildMonobank.jar({ id: 'jar-goalless', goal: null })]
        };
        monobankStub.clientInfo(clientInfo);

        const previews = await monobankSyncService.fetchAccountsPreview('test-token');

        const madeInUkrainePreview = previews.find(preview => preview.externalId === 'mono-miu');
        const fopPreview = previews.find(preview => preview.externalId === 'mono-fop');
        const jarPreview = previews.find(preview => preview.externalId === 'jar-goalless');

        expect(madeInUkrainePreview?.type).toBe(SyncAccountTypeEnum.MADE_IN_UKRAINE);
        expect(fopPreview?.type).toBe(SyncAccountTypeEnum.FOP);
        expect(jarPreview?.type).toBe(SyncAccountTypeEnum.JAR);
    });
});
