import { describe, expect, it } from '@effect/vitest';

import { getTransactionKeypadLayout } from '../src/transaction/utils/get-transaction-keypad-layout.util';

describe('transaction keypad viewport accessibility', () => {
    it('retains accessible controls and even spacing on compact screens', () => {
        const layout = getTransactionKeypadLayout(1, 667);

        expect(layout.rowStyle.minHeight).toBeGreaterThanOrEqual(44);
        expect(layout.confirmRowStyle.minHeight).toBeGreaterThanOrEqual(44);
        expect(layout.digitsStyle.gap).toBe(6);
    });

    it('retains minimum digit and primary action targets at the largest text size', () => {
        const layout = getTransactionKeypadLayout(3, 400);

        expect(layout.rowStyle.minHeight).toBeGreaterThanOrEqual(44);
        expect(layout.confirmRowStyle.minHeight).toBeGreaterThanOrEqual(50);
    });
});
