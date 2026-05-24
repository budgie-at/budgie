import { describe, expect, it } from 'vitest';

import { generatePrivatbankExternalId } from '@budgie/bank-sync';

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

        expect(generatePrivatbankExternalId(first)).toBe(generatePrivatbankExternalId(shifted));
    });

    it('changes when statement data changes', () => {
        const first = buildPrivatbankRow(new Date('2026-01-13T09:42:53.000Z'));
        const changedBalance = buildPrivatbankRow(new Date('2026-01-13T09:42:53.000Z'), 54_321.01);

        expect(generatePrivatbankExternalId(first)).not.toBe(generatePrivatbankExternalId(changedBalance));
    });
});
