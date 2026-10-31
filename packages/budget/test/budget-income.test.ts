import { BudgetLimitSourceEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { computeIncomeReceived } from '../src/income/utils/compute-income-received.util';
import { resolveBudgetOverallLimit } from '../src/income/utils/resolve-budget-overall-limit.util';

const FIXED_LIMIT = 1000;

it.effect('keeps the fixed limit for FIXED regardless of income', () =>
    Effect.sync(() => {
        expect(resolveBudgetOverallLimit(BudgetLimitSourceEnum.FIXED, FIXED_LIMIT, 400, 900)).toBe(FIXED_LIMIT);
    })
);

it.effect('follows the income received so far for INCOME_RECEIVED', () =>
    Effect.sync(() => {
        expect(resolveBudgetOverallLimit(BudgetLimitSourceEnum.INCOME_RECEIVED, FIXED_LIMIT, 400, 900)).toBe(400);
        expect(resolveBudgetOverallLimit(BudgetLimitSourceEnum.INCOME_RECEIVED, FIXED_LIMIT, 0, 900)).toBe(0);
    })
);

it.effect('uses the expected income for INCOME_EXPECTED', () =>
    Effect.sync(() => {
        expect(resolveBudgetOverallLimit(BudgetLimitSourceEnum.INCOME_EXPECTED, FIXED_LIMIT, 400, 900)).toBe(900);
    })
);

it.effect('falls back to received income for INCOME_EXPECTED when it is larger', () =>
    Effect.sync(() => {
        expect(resolveBudgetOverallLimit(BudgetLimitSourceEnum.INCOME_EXPECTED, FIXED_LIMIT, 1200, 900)).toBe(1200);
        expect(resolveBudgetOverallLimit(BudgetLimitSourceEnum.INCOME_EXPECTED, FIXED_LIMIT, 0, 0)).toBe(0);
    })
);

it.effect('sums income entries in the budget instrument', () =>
    Effect.sync(() => {
        const total = computeIncomeReceived(
            [
                { amount: 100, categoryId: null, instrumentId: 1, rate: null },
                { amount: 50, categoryId: 7, instrumentId: 2, rate: 2 },
                { amount: 25, categoryId: null, instrumentId: 1, rate: null }
            ],
            1
        );

        expect(total).toBe(225);
    })
);

it.effect('returns zero without income entries', () =>
    Effect.sync(() => {
        expect(computeIncomeReceived([], 1)).toBe(0);
    })
);
