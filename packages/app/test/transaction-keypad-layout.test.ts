import { describe, expect, it } from '@effect/vitest';

import { getTransactionKeypadLayout } from '../src/transaction/utils/get-transaction-keypad-layout.util';

describe('transaction keypad viewport accessibility', () => {
    it('keeps the keypad pinned at the largest text size while a form row still fits above it', () => {
        expect(getTransactionKeypadLayout(3, 460).requiresScrolling).toBe(false);
    });

    it('scrolls the amount, keypad and form together when no form row fits above the keypad', () => {
        expect(getTransactionKeypadLayout(1, 400).requiresScrolling).toBe(true);
        expect(getTransactionKeypadLayout(3, 400).requiresScrolling).toBe(true);
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
