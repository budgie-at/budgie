import { BankAccountTypeEnum, BankProviderEnum, mapBankAccountToCreateInput } from '@budgie/bank-sync';
import { LiabilityAccountCreateInputSchema } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

const buildBankAccount = (iban: string | undefined) => ({
    id: 'external-account-1',
    provider: BankProviderEnum.MONOBANK,
    currencyCode: 'UAH',
    currencyCodeNumeric: 980,
    balance: 0,
    creditLimit: 0,
    type: BankAccountTypeEnum.CARD,
    iban,
    maskedPan: ['5168 **** **** 3126']
});

describe('account/account-update-validation', () => {
    it('nulls an empty IBAN instead of persisting it', () => {
        expect(mapBankAccountToCreateInput(buildBankAccount(''), 1).iban).toBeNull();
    });

    it('nulls a too-short IBAN instead of persisting it', () => {
        expect(mapBankAccountToCreateInput(buildBankAccount('UA11111113126'), 1).iban).toBeNull();
    });

    it('preserves and normalizes a valid IBAN', () => {
        expect(mapBankAccountToCreateInput(buildBankAccount('at48 1200 0100 1234 5678'), 1).iban).toBe('AT481200010012345678');
    });

    it('produces input the liability update form schema accepts', () => {
        const input = mapBankAccountToCreateInput(buildBankAccount(''), 1);

        expect(LiabilityAccountCreateInputSchema.safeParse(input).success).toBe(true);
    });
});
