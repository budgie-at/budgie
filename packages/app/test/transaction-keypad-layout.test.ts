import { describe, expect, it } from '@effect/vitest';

import { getTransactionKeypadLayout } from '../src/transaction/utils/get-transaction-keypad-layout.util';

describe('transaction keypad viewport accessibility', () => {
    it('allows the form and keypad to scroll together when large text fills a short viewport', () => {
        expect(getTransactionKeypadLayout(3, 400).requiresScrolling).toBe(true);
    });

    it('keeps the keypad fixed when the viewport has room for the form', () => {
        expect(getTransactionKeypadLayout(1, 700).requiresScrolling).toBe(false);
    });

    it('retains large-text key sizes in the scrolling fallback', () => {
        const layout = getTransactionKeypadLayout(3, 400);

        expect(layout.rowStyle.minHeight).toBeGreaterThanOrEqual(96);
        expect(layout.confirmRowStyle.minHeight).toBeGreaterThanOrEqual(72);
    });
});
