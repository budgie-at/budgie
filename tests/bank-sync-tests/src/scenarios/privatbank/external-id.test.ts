import { privatbankTransactionMapper } from '@budgie/bank-sync';
import { describe, expect, it } from 'vitest';

const buildPrivatbankRow = (date: Date, endBalance = 12_345.67) => ({
    rawDate: '13.01.2026 11:42:53',
    date,
    category: 'Зарахування переказу',
    card: '5168 **** **** 3126',
    description: 'З гривневого рахунку ФОП',
    cardAmount: 40_000,
    cardCurrency: 'UAH',
    operationAmount: 40_000,
    operationCurrency: 'UAH',
    endBalance,
    balanceCurrency: 'UAH'
});

describe('privatbank/external-id', () => {
    it('uses raw statement data instead of parsed date identity', () => {
        const first = buildPrivatbankRow(new Date('2026-01-13T09:42:53.000Z'));
        const shifted = buildPrivatbankRow(new Date('2026-01-13T10:42:53.000Z'));
        const firstTransaction = privatbankTransactionMapper(first);
        const shiftedTransaction = privatbankTransactionMapper(shifted);

        expect(firstTransaction.id).toBe(shiftedTransaction.id);
    });

    it('ignores volatile statement balance identity and keeps legacy identity', () => {
        const first = buildPrivatbankRow(new Date('2026-01-13T09:42:53.000Z'));
        const changedBalance = buildPrivatbankRow(new Date('2026-01-13T09:42:53.000Z'), 54_321.01);
        const firstTransaction = privatbankTransactionMapper(first);
        const changedBalanceTransaction = privatbankTransactionMapper(changedBalance);

        expect(firstTransaction.id).toBe(changedBalanceTransaction.id);
        expect(firstTransaction.legacyExternalIds?.[0]).not.toBe(changedBalanceTransaction.legacyExternalIds?.[0]);
        expect(firstTransaction.id).not.toBe(firstTransaction.legacyExternalIds?.[0]);
    });

    it('changes when stable statement data changes', () => {
        const first = buildPrivatbankRow(new Date('2026-01-13T09:42:53.000Z'));
        const changedDescription = {
            ...first,
            description: 'З гривневого рахунку ТОВ'
        };
        const firstTransaction = privatbankTransactionMapper(first);
        const changedDescriptionTransaction = privatbankTransactionMapper(changedDescription);

        expect(firstTransaction.id).not.toBe(changedDescriptionTransaction.id);
    });
});
