import { describe, expect, it } from 'vitest';

import { reducePartWidths } from './reduce-part-widths.util';

const AMOUNT_WIDTH = { width: 200, minimumWidth: 0 };
const SYMBOL_WIDTH = { width: 40, minimumWidth: 30 };

describe('reducePartWidths', () => {
    it('adds a newly measured part', () => {
        expect.hasAssertions();

        expect(reducePartWidths({}, { partId: 'amount', partWidth: AMOUNT_WIDTH })).toStrictEqual({ amount: AMOUNT_WIDTH });
    });

    it('replaces a part whose width changed', () => {
        expect.hasAssertions();

        expect(reducePartWidths({ amount: AMOUNT_WIDTH }, { partId: 'amount', partWidth: { width: 250, minimumWidth: 0 } })).toStrictEqual({
            amount: { width: 250, minimumWidth: 0 }
        });
    });

    it('removes an unmounted part', () => {
        expect.hasAssertions();

        expect(reducePartWidths({ amount: AMOUNT_WIDTH, symbol: SYMBOL_WIDTH }, { partId: 'symbol', partWidth: null })).toStrictEqual({
            amount: AMOUNT_WIDTH
        });
    });

    it('returns the same state for an unchanged width', () => {
        expect.hasAssertions();

        const state = { amount: AMOUNT_WIDTH };

        expect(reducePartWidths(state, { partId: 'amount', partWidth: { width: 200, minimumWidth: 0 } })).toBe(state);
    });

    it('returns the same state when removing an absent part', () => {
        expect.hasAssertions();

        const state = { amount: AMOUNT_WIDTH };

        expect(reducePartWidths(state, { partId: 'symbol', partWidth: null })).toBe(state);
    });
});
