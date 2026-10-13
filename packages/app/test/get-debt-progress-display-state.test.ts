import { describe, expect, it } from '@effect/vitest';

import { getDebtProgressDisplayState } from '../src/account/utils/get-debt-progress-display-state.util';

describe('getDebtProgressDisplayState', () => {
    it('treats an exact zero outstanding amount as settled', () => {
        expect(getDebtProgressDisplayState({ outstandingAmount: 0, overpaidAmount: 0, totalAmount: 500 }, 2)).toEqual({
            isSettled: true,
            isOverpaid: false
        });
    });

    it('hides a fraction that rounds to zero without decimals', () => {
        expect(getDebtProgressDisplayState({ outstandingAmount: 0.33, overpaidAmount: 0.33, totalAmount: 84175 }, 0)).toEqual({
            isSettled: true,
            isOverpaid: false
        });
    });

    it('shows the same fraction with two decimals', () => {
        expect(getDebtProgressDisplayState({ outstandingAmount: 0.33, overpaidAmount: 0.33, totalAmount: 84175 }, 2)).toEqual({
            isSettled: false,
            isOverpaid: true
        });
    });

    it('treats amounts below the displayed precision as zero', () => {
        expect(getDebtProgressDisplayState({ outstandingAmount: 0.004, overpaidAmount: 0.004, totalAmount: 10 }, 2)).toEqual({
            isSettled: true,
            isOverpaid: false
        });
    });

    it('does not treat an empty debt as settled', () => {
        expect(getDebtProgressDisplayState({ outstandingAmount: 0, overpaidAmount: 0, totalAmount: 0 }, 2).isSettled).toBe(false);
    });

    it('keeps a clearly outstanding debt active', () => {
        expect(getDebtProgressDisplayState({ outstandingAmount: 1200, overpaidAmount: 0, totalAmount: 1500 }, 0).isSettled).toBe(false);
    });
});
