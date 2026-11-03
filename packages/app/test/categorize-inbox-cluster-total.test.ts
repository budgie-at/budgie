import { TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { getCategorizeInboxClusterTotal } from '../src/categorize-inbox/utils/get-categorize-inbox-cluster-total.util';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';

const buildRow = (
    transactionId: number,
    amount: number,
    instrumentSymbol: string,
    type = TransactionTypeEnum.EXPENSE
): CategorizeInboxRowInterface => ({
    transactionId,
    type,
    title: 'Corner Deli',
    operatedAt: new Date('2026-10-01T00:00:00.000Z'),
    amount,
    baseAmount: null,
    baseInstrumentId: null,
    instrumentSymbol,
    mccCategoryId: null,
    categoryId: null,
    tagIds: [],
    mcc: null,
    toIban: null
});

describe('getCategorizeInboxClusterTotal', () => {
    it('uses the base-currency total when it exists', () => {
        expect(getCategorizeInboxClusterTotal({ rows: [buildRow(1, 10, '€'), buildRow(2, 20, '$')], totalBaseAmount: 35 }, '$')).toEqual({
            amount: 35,
            symbol: '$',
            sign: ''
        });
    });

    it('sums same-currency rows without a base total', () => {
        expect(getCategorizeInboxClusterTotal({ rows: [buildRow(1, 10, '€'), buildRow(2, 20, '€')], totalBaseAmount: null }, '$')).toEqual({
            amount: 30,
            symbol: '€',
            sign: ''
        });
    });

    it('returns no total for mixed currencies without a base total', () => {
        expect(
            getCategorizeInboxClusterTotal({ rows: [buildRow(1, 10, '€'), buildRow(2, 20, '$')], totalBaseAmount: null }, '$')
        ).toBeNull();
    });

    it('signs income totals', () => {
        expect(
            getCategorizeInboxClusterTotal({ rows: [buildRow(1, 45, '$', TransactionTypeEnum.INCOME)], totalBaseAmount: null }, '$')?.sign
        ).toBe('+');
    });
});
