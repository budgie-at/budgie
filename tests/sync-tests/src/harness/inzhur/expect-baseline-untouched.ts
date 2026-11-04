import { PRECISION } from '@budgie/contracts';
import { expect } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance } from '../db/fetch-account-balance';

import { fetchInzhurLedger } from './fetch-inzhur-ledger';
import { requireInzhurSetup } from './require-inzhur-setup';

export const expectBaselineUntouched = Effect.fnUntraced(function* (cashAccountId: number, reitAccountId: number) {
    expect(yield* fetchInzhurLedger()).toEqual([]);
    expect(yield* fetchAccountBalance(cashAccountId)).toBe(1000 * PRECISION);
    expect(yield* fetchAccountBalance(reitAccountId)).toBe(1000 * PRECISION);
    expect((yield* requireInzhurSetup()).lastStatementDate).toBe('2026-09-30');
});
