import { describe, expect, it } from '@effect/vitest';

import { sumTransactionAmounts } from '../src/transaction/utils/sum-transaction-amounts.util';

describe('transaction form amount arithmetic', () => {
    it('replaces a fee without exposing floating point noise to the keypad', () => {
        expect(sumTransactionAmounts(4.7, -0.1, 0.2)).toBe(4.8);
        expect(sumTransactionAmounts(4.700001, -0.1, 0.2)).toBe(4.800001);
    });

    it('recombines split entries and fees at stored precision', () => {
        expect(sumTransactionAmounts(0.1, 0.2)).toBe(0.3);
        expect(sumTransactionAmounts(0.1, 0.2, 0.000001)).toBe(0.300001);
        expect(sumTransactionAmounts(4.800001, -0.2)).toBe(4.600001);
    });
});
