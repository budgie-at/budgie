import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { computeFundTimeFraction } from '../src/budget/utils/compute-fund-time-fraction.util';
import { isFundBehind } from '../src/budget/utils/is-fund-behind.util';

import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

type FundSource = Pick<BudgetSinkingFundEntityInterface, 'targetAmount' | 'fundedAmount' | 'dueAt' | 'createdAt' | 'repeatEveryMonths'>;

const fundOf = (overrides: Partial<FundSource>): FundSource => ({
    targetAmount: 1000,
    fundedAmount: 0,
    createdAt: new Date(2026, 0, 1),
    dueAt: new Date(2026, 11, 31),
    repeatEveryMonths: null,
    ...overrides
});

it.effect('measures the elapsed fraction between creation and the due day', () =>
    Effect.sync(() => {
        expect(computeFundTimeFraction(fundOf({}), new Date(2026, 0, 1))).toBe(0);
        expect(computeFundTimeFraction(fundOf({}), new Date(2027, 5, 1))).toBe(1);
        expect(computeFundTimeFraction(fundOf({}), new Date(2026, 6, 2))).toBeCloseTo(0.5, 1);
    })
);

it.effect('uses the current cycle for repeating funds', () =>
    Effect.sync(() => {
        const repeating = fundOf({ repeatEveryMonths: 12, dueAt: new Date(2027, 11, 31) });

        expect(computeFundTimeFraction(repeating, new Date(2027, 0, 1))).toBeLessThan(0.05);
    })
);

it.effect('is behind when the funded share lags the elapsed share by more than the tolerance', () =>
    Effect.sync(() => {
        const halfway = new Date(2026, 6, 2);

        expect(isFundBehind(fundOf({ fundedAmount: 200 }), halfway)).toBe(true);
        expect(isFundBehind(fundOf({ fundedAmount: 480 }), halfway)).toBe(false);
        expect(isFundBehind(fundOf({ fundedAmount: 600 }), halfway)).toBe(false);
    })
);

it.effect('is never behind for degenerate funds', () =>
    Effect.sync(() => {
        expect(isFundBehind(fundOf({ targetAmount: 0 }), new Date(2026, 6, 2))).toBe(false);
        expect(isFundBehind(fundOf({ dueAt: new Date(2026, 0, 1) }), new Date(2026, 6, 2))).toBe(false);
    })
);
