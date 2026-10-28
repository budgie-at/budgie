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
    it.each([
        { name: 'an expense takes the card amount exceeding the operation amount as the fee', cardAmount: -100.5, expectedFee: 0.5 },
        { name: 'an income reports no fee', cardAmount: 100.5, expectedFee: 0 }
    ])('$name', ({ cardAmount, expectedFee }) => {
        const transaction = privatbankTransactionMapper(buildPrivatbankRow(cardAmount, Math.sign(cardAmount) * 100));

        expect(transaction.feeAmount).toBeCloseTo(expectedFee, 10);
    });
});
