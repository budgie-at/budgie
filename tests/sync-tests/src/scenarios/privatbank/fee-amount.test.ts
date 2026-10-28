import { privatbankTransactionMapper } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';

const DATE = new Date('2026-01-13T09:42:53.000Z');

const buildPrivatbankRow = (cardAmount: number, operationAmount: number) => ({
    rawDate: '13.01.2026 11:42:53',
    date: DATE,
    deviceLocalDate: DATE,
    category: 'Переказ',
    card: '5168 **** **** 3126',
    description: 'Переказ',
    cardAmount,
    cardCurrency: 'UAH',
    operationAmount,
    operationCurrency: 'UAH',
    endBalance: 1000,
    balanceCurrency: 'UAH'
});

describe('privatbank/fee-amount', () => {
    it('derives the fee of an expense from the card amount exceeding the operation amount', () => {
        const transaction = privatbankTransactionMapper(buildPrivatbankRow(-100.5, -100));

        expect(transaction.feeAmount).toBeCloseTo(0.5, 10);
    });

    it('reports no fee for an income whose card amount exceeds the operation amount', () => {
        const transaction = privatbankTransactionMapper(buildPrivatbankRow(100.5, 100));

        expect(transaction.feeAmount).toBe(0);
    });
});
