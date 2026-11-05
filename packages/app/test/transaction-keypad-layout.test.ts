import { describe, expect, it } from '@effect/vitest';

import { getTransactionKeypadLayout } from '../src/transaction/utils/get-transaction-keypad-layout.util';

describe('transaction keypad viewport accessibility', () => {
    it('scrolls the amount, keypad and form together at accessibility text sizes', () => {
        expect(getTransactionKeypadLayout(1.35, 2000).requiresScrolling).toBe(true);
    });

    it('scrolls when the pinned keypad leaves no room for the form', () => {
        expect(getTransactionKeypadLayout(1, 400).requiresScrolling).toBe(true);
    });

    it('keeps the keypad pinned when the viewport has room for the form', () => {
        expect(getTransactionKeypadLayout(1, 700).requiresScrolling).toBe(false);
    });

    it('retains minimum digit and primary action targets at the largest text size', () => {
        const layout = getTransactionKeypadLayout(3, 400);

        expect(layout.rowStyle.minHeight).toBeGreaterThanOrEqual(44);
        expect(layout.confirmRowStyle.minHeight).toBeGreaterThanOrEqual(50);
    });
});
