import { privatbankAccountMapper } from '@budgie/bank-sync';
import { normalizeAccountIban } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

const buildRow = (card: string) => ({
    rawDate: '13.01.2026 11:42:53',
    date: new Date('2026-01-13T09:42:53.000Z'),
    category: 'Зарахування переказу',
    card,
    description: 'З гривневого рахунку ФОП',
    cardAmount: 40_000,
    cardCurrency: 'UAH',
    operationAmount: 40_000,
    operationCurrency: 'UAH',
    endBalance: 12_345.67,
    balanceCurrency: 'UAH'
});

describe('privatbank/fake-iban', () => {
    it('generates an IBAN the account schema accepts', () => {
        const [account] = privatbankAccountMapper([buildRow('5168 **** **** 3126')]);

        expect(account.iban).toBeDefined();
        expect(normalizeAccountIban(account.iban)).toBe(account.iban);
    });

    it('stays deterministic for the same card', () => {
        const [first] = privatbankAccountMapper([buildRow('5168 **** **** 3126')]);
        const [second] = privatbankAccountMapper([buildRow('5168 **** **** 3126')]);

        expect(first.iban).toBe(second.iban);
    });

    it('differs across cards and preserves the card ending', () => {
        const [first] = privatbankAccountMapper([buildRow('5168 **** **** 3126')]);
        const [second] = privatbankAccountMapper([buildRow('5168 **** **** 9911')]);

        expect(first.iban).not.toBe(second.iban);
        expect(first.iban?.endsWith('3126')).toBe(true);
        expect(second.iban?.endsWith('9911')).toBe(true);
    });
});
