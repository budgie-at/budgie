import { AccountTypeEnum, ExternalSourceEnum, LiabilityAccountCreateInputSchema, UserIconNameEnum } from '@budgie/contracts';
import { mapSyncAccountToCreateInput, SyncAccountBalanceStateEnum, SyncAccountTypeEnum, SyncProviderEnum } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Schema from 'effect/Schema';

import type { LiabilityAccountCreateInputInterface } from '@budgie/contracts';
import type { SyncAccountInterface } from '@budgie/sync';

const testDefinition = {
    provider: ExternalSourceEnum.MONOBANK,
    accountType: AccountTypeEnum.BANK_SYNC,
    generateAccountTitle: () => 'Monobank',
    accountIcon: () => UserIconNameEnum.Landmark
};

const mapAccount = (account: SyncAccountInterface): LiabilityAccountCreateInputInterface =>
    mapSyncAccountToCreateInput(testDefinition, account, 1);

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
        expect(mapAccount(buildSyncAccount('')).iban).toBeNull();
    });

    it('nulls a too-short IBAN instead of persisting it', () => {
        expect(mapAccount(buildSyncAccount('UA11111113126')).iban).toBeNull();
    });

    it('preserves and normalizes a valid IBAN', () => {
        expect(mapAccount(buildSyncAccount('at48 1200 0100 1234 5678')).iban).toBe('AT481200010012345678');
    });

    it('produces input the liability update form schema accepts', () => {
        const input = mapAccount(buildSyncAccount(''));

        expect(Schema.is(LiabilityAccountCreateInputSchema)(input)).toBe(true);
    });
});
