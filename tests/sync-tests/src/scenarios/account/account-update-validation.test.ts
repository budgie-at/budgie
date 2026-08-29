import { AbstractSyncService } from '@app/sync/service/abstract-sync.service';
import { AccountTypeEnum, ExternalSourceEnum, LiabilityAccountCreateInputSchema } from '@budgie/contracts';
import { SyncAccountBalanceStateEnum, SyncAccountTypeEnum, SyncProviderEnum } from '@budgie/sync';
import { describe, expect, it } from 'vitest';

import type { LiabilityAccountCreateInputInterface } from '@budgie/contracts';
import type { SyncAccountInterface } from '@budgie/sync';

class TestSyncService extends AbstractSyncService {
    protected readonly provider = ExternalSourceEnum.MONOBANK;
    protected readonly providerTitle = 'Monobank';
    protected readonly accountType = AccountTypeEnum.BANK_SYNC;

    mapAccount(account: SyncAccountInterface): LiabilityAccountCreateInputInterface {
        return this.mapAccountToCreateInput(account, 1);
    }
}

const testSyncService = new TestSyncService();

const buildSyncAccount = (iban: string | undefined): SyncAccountInterface => ({
    id: 'external-account-1',
    provider: SyncProviderEnum.MONOBANK,
    currencyCode: 'UAH',
    currencyCodeNumeric: 980,
    balance: 0,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CARD,
    iban,
    maskedPan: ['5168 **** **** 3126']
});

describe('account/account-update-validation', () => {
    it('nulls an empty IBAN instead of persisting it', () => {
        expect(testSyncService.mapAccount(buildSyncAccount('')).iban).toBeNull();
    });

    it('nulls a too-short IBAN instead of persisting it', () => {
        expect(testSyncService.mapAccount(buildSyncAccount('UA11111113126')).iban).toBeNull();
    });

    it('preserves and normalizes a valid IBAN', () => {
        expect(testSyncService.mapAccount(buildSyncAccount('at48 1200 0100 1234 5678')).iban).toBe('AT481200010012345678');
    });

    it('produces input the liability update form schema accepts', () => {
        const input = testSyncService.mapAccount(buildSyncAccount(''));

        expect(LiabilityAccountCreateInputSchema.safeParse(input).success).toBe(true);
    });
});
