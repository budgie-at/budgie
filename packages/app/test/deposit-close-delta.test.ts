import { describe, expect, it } from '@effect/vitest';

import { getDepositCloseDelta } from '../src/account/utils/get-deposit-close-delta.util';

describe('deposit close delta', () => {
    it('is positive when more than the ledger balance is received', () => {
        expect(getDepositCloseDelta(560.5, 555)).toBe(5.5);
    });

    it('is negative for a shortfall', () => {
        expect(getDepositCloseDelta(540, 555)).toBe(-15);
    });

    it('is exactly zero without floating point noise', () => {
        expect(getDepositCloseDelta(555.1, 555.1)).toBe(0);
        expect(getDepositCloseDelta(0.3, 0.1 + 0.2)).toBe(0);
    });
});
