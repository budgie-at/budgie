import { describe, expect, it } from '@jest/globals';

import { getDebtClosedAmount } from './get-debt-closed-amount.util';

describe('getDebtClosedAmount', () => {
    it('returns the returned amount while it is below the target', () => {
        expect(getDebtClosedAmount(7_934, 45_000)).toBe(7_934);
    });

    it('caps the closed amount at the target', () => {
        expect(getDebtClosedAmount(50_000, 45_000)).toBe(45_000);
    });

    it('returns zero for an empty returned amount', () => {
        expect(getDebtClosedAmount(0, 45_000)).toBe(0);
    });

    it('ignores the sign of the returned amount', () => {
        expect(getDebtClosedAmount(-7_934, 45_000)).toBe(7_934);
    });
});
