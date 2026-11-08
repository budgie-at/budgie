import { describe, expect, it } from '@effect/vitest';

import { getAdjustmentBalanceChange } from '../src/transaction/utils/get-adjustment-balance-change.util';

describe('adjustment balance change', () => {
    it('keeps a bank-controlled balance unchanged for either direction', () => {
        const details = { initialAmount: 1, initialIsIncrease: true, isBalanceFixed: true };

        expect(getAdjustmentBalanceChange(details, 2, true)).toBe(0);
        expect(getAdjustmentBalanceChange(details, 2, false)).toBe(0);
    });

    it('replaces a manual adjustment rather than adding the full proposed amount', () => {
        expect(getAdjustmentBalanceChange({ initialAmount: 250, initialIsIncrease: true, isBalanceFixed: false }, 300, true)).toBe(50);
    });

    it('supports a decrease crossing zero', () => {
        expect(getAdjustmentBalanceChange({ initialAmount: 300, initialIsIncrease: true, isBalanceFixed: false }, 50, false)).toBe(-350);
    });

    it('calculates the difference in microunits', () => {
        expect(getAdjustmentBalanceChange({ initialAmount: 0.1, initialIsIncrease: true, isBalanceFixed: false }, 0.3, true)).toBe(0.2);
    });
});
