import { BudgetLimitChangeReasonEnum, PRECISION } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { proposeLimitChanges } from '../src/tuning/utils/propose-limit-changes.util';

import type { BudgetTuneLimitsInterface } from '../src/tuning/interface/budget-tune-limits.interface';
import type { BudgetTuneSnapshotInterface } from '../src/tuning/interface/budget-tune-snapshot.interface';

const CURRENT_PERIOD_START = new Date(2026, 4, 1);
const GROCERIES = 1;
const TRANSPORT = 2;
const ZERO_OTHER = { limit: 0, spent: 0, carriedIn: 0 };

const units = (amount: number): number => amount * PRECISION;

const category = (categoryId: number, limitAmount: number, spent: number, carriedIn = 0) => ({ categoryId, limitAmount, carriedIn, spent });

const snapshotOf = (
    monthIndex: number,
    categories: BudgetTuneSnapshotInterface['categories'],
    isReconstructed = false,
    other: { readonly limit: number; readonly spent: number; readonly carriedIn?: number } = ZERO_OTHER
): BudgetTuneSnapshotInterface => ({
    periodStart: new Date(2026, monthIndex, 1),
    isReconstructed,
    otherLimit: other.limit,
    otherSpent: other.spent,
    otherCarriedIn: other.carriedIn ?? 0,
    categories
});

const threePeriods = (
    categories: BudgetTuneSnapshotInterface['categories'],
    other: { readonly limit: number; readonly spent: number; readonly carriedIn?: number } = ZERO_OTHER
) => [1, 2, 3].map(monthIndex => snapshotOf(monthIndex, categories, false, other));

const limit = (categoryId: number, limitAmount: number, userEditedAt: Date | null = null) => ({ categoryId, limitAmount, userEditedAt });

const limitsOf = (
    categories: BudgetTuneLimitsInterface['categories'],
    overallLimit = units(10_000),
    otherLimit = 0,
    otherLimitUserEditedAt: Date | null = null
): BudgetTuneLimitsInterface => ({
    overallLimit,
    otherLimit,
    otherLimitUserEditedAt,
    categories
});

const change = (categoryId: number | null, periodStart: Date) => ({ categoryId, periodStart });

const propose = (
    history: readonly BudgetTuneSnapshotInterface[],
    limits: BudgetTuneLimitsInterface,
    recentChanges: readonly { readonly categoryId: number | null; readonly periodStart: Date }[] = []
) => proposeLimitChanges(history, limits, CURRENT_PERIOD_START, recentChanges);

it.effect('lowers an under-spent limit by the 10 percent step', () =>
    Effect.sync(() => {
        expect(propose(threePeriods([category(GROCERIES, units(300), units(150))]), limitsOf([limit(GROCERIES, units(300))]))).toEqual([
            {
                categoryId: GROCERIES,
                previousAmount: units(300),
                newAmount: units(270),
                reason: BudgetLimitChangeReasonEnum.UNDER_SPENT,
                periodsObserved: 3
            }
        ]);
    })
);

it.effect('lowers only down to the mean spend when it is above the step bound', () =>
    Effect.sync(() => {
        const [proposal] = propose(threePeriods([category(GROCERIES, units(300), units(240))]), limitsOf([limit(GROCERIES, units(250))]));

        expect(proposal.newAmount).toBe(units(240));
        expect(proposal.reason).toBe(BudgetLimitChangeReasonEnum.UNDER_SPENT);
    })
);

const underSpentSnapshot = (id: number) => snapshotOf(id, [category(GROCERIES, units(300), units(150))]);

const proposeForGroceries = (history: ReturnType<typeof threePeriods>) => propose(history, limitsOf([limit(GROCERIES, units(300))]));

it.effect('raises an over-spent limit by the 10 percent step', () =>
    Effect.sync(() => {
        expect(propose(threePeriods([category(GROCERIES, units(100), units(200))]), limitsOf([limit(GROCERIES, units(100))]))).toEqual([
            {
                categoryId: GROCERIES,
                previousAmount: units(100),
                newAmount: units(110),
                reason: BudgetLimitChangeReasonEnum.OVER_SPENT,
                periodsObserved: 3
            }
        ]);
    })
);

it.effect('raises only up to the mean spend when it is below the step bound', () =>
    Effect.sync(() => {
        const [proposal] = propose(threePeriods([category(GROCERIES, units(100), units(105))]), limitsOf([limit(GROCERIES, units(100))]));

        expect(proposal.newAmount).toBe(units(105));
    })
);

it.effect('proposes nothing for a mixed history', () =>
    Effect.sync(() => {
        const history = [underSpentSnapshot(1), underSpentSnapshot(2), snapshotOf(3, [category(GROCERIES, units(300), units(260))])];

        expect(proposeForGroceries(history)).toEqual([]);
    })
);

it.effect('ignores reconstructed snapshots and needs three real periods', () =>
    Effect.sync(() => {
        const categories = [category(GROCERIES, units(300), units(150))];
        const twoReal = [snapshotOf(1, categories, true), snapshotOf(2, categories), snapshotOf(3, categories)];
        const threeRealAfterReconstructed = [snapshotOf(0, categories, true), ...threePeriods(categories)];

        expect(propose(twoReal, limitsOf([limit(GROCERIES, units(300))]))).toEqual([]);
        expect(propose(threeRealAfterReconstructed, limitsOf([limit(GROCERIES, units(300))]))).toHaveLength(1);
    })
);

it.effect('skips a limit the user edited in the current period but tunes one edited earlier', () =>
    Effect.sync(() => {
        const history = threePeriods([category(GROCERIES, units(300), units(150))]);

        expect(propose(history, limitsOf([limit(GROCERIES, units(300), new Date(2026, 4, 2))]))).toEqual([]);
        expect(propose(history, limitsOf([limit(GROCERIES, units(300), new Date(2026, 3, 20))]))).toHaveLength(1);
    })
);

it.effect('tunes the Other limit', () =>
    Effect.sync(() => {
        const history = threePeriods([], { limit: units(100), spent: units(20) });

        expect(propose(history, limitsOf([], units(10_000), units(100)))).toEqual([
            {
                categoryId: null,
                previousAmount: units(100),
                newAmount: units(90),
                reason: BudgetLimitChangeReasonEnum.UNDER_SPENT,
                periodsObserved: 3
            }
        ]);
    })
);

it.effect('skips the Other limit the user edited in the current period but tunes it when edited earlier', () =>
    Effect.sync(() => {
        const history = threePeriods([], { limit: units(100), spent: units(20) });

        expect(propose(history, limitsOf([], units(10_000), units(100), new Date(2026, 4, 2)))).toEqual([]);
        expect(propose(history, limitsOf([], units(10_000), units(100), new Date(2026, 3, 20)))).toHaveLength(1);
    })
);

it.effect('locks a line that was changed one closed period ago', () =>
    Effect.sync(() => {
        const history = threePeriods([category(GROCERIES, units(300), units(150))]);

        expect(propose(history, limitsOf([limit(GROCERIES, units(300))]), [change(GROCERIES, new Date(2026, 2, 1))])).toEqual([]);
        expect(propose(history, limitsOf([limit(GROCERIES, units(300))]), [change(GROCERIES, new Date(2026, 1, 1))])).toEqual([]);
    })
);

it.effect('makes a line eligible again once its last change is older than the three observed periods', () =>
    Effect.sync(() => {
        const history = threePeriods([category(GROCERIES, units(300), units(150))]);

        expect(propose(history, limitsOf([limit(GROCERIES, units(300))]), [change(GROCERIES, new Date(2026, 0, 1))])).toHaveLength(1);
        expect(propose(history, limitsOf([limit(GROCERIES, units(300))]), [change(GROCERIES, new Date(2025, 11, 1))])).toHaveLength(1);
    })
);

it.effect('locks only the line that changed, including Other', () =>
    Effect.sync(() => {
        const history = threePeriods([category(GROCERIES, units(300), units(150)), category(TRANSPORT, units(100), units(20))], {
            limit: units(100),
            spent: units(20)
        });
        const limits = limitsOf([limit(GROCERIES, units(300)), limit(TRANSPORT, units(100))], units(10_000), units(100));
        const proposals = propose(history, limits, [change(GROCERIES, new Date(2026, 3, 1)), change(null, new Date(2026, 3, 1))]);

        expect(proposals.map(proposal => proposal.categoryId)).toEqual([TRANSPORT]);
    })
);

it.effect('does not raise a category that only spent its carried-in surplus', () =>
    Effect.sync(() => {
        expect(
            propose(threePeriods([category(GROCERIES, units(100), units(150), units(100))]), limitsOf([limit(GROCERIES, units(100))]))
        ).toEqual([]);
    })
);

it.effect('still raises the base limit when spending exceeds base plus carried-in', () =>
    Effect.sync(() => {
        const [proposal] = propose(
            threePeriods([category(GROCERIES, units(100), units(200), units(20))]),
            limitsOf([limit(GROCERIES, units(100))])
        );

        expect(proposal.previousAmount).toBe(units(100));
        expect(proposal.newAmount).toBe(units(110));
        expect(proposal.reason).toBe(BudgetLimitChangeReasonEnum.OVER_SPENT);
    })
);

it.effect('does not raise Other when it only spent its carried-in surplus', () =>
    Effect.sync(() => {
        const history = threePeriods([], { limit: units(100), spent: units(150), carriedIn: units(100) });

        expect(propose(history, limitsOf([], units(10_000), units(100)))).toEqual([]);
    })
);

it.effect('rounds a lowered limit up to a whole currency unit', () =>
    Effect.sync(() => {
        const [proposal] = propose(threePeriods([category(GROCERIES, 105_500_000, units(50))]), limitsOf([limit(GROCERIES, 105_500_000)]));

        expect(proposal.newAmount).toBe(units(95));
    })
);

it.effect('never lowers a limit below one currency unit and drops unchanged results', () =>
    Effect.sync(() => {
        expect(propose(threePeriods([category(GROCERIES, units(1), 0)]), limitsOf([limit(GROCERIES, units(1))]))).toEqual([]);
    })
);

it.effect('skips a category that is missing from one of the snapshots', () =>
    Effect.sync(() => {
        const history = [underSpentSnapshot(1), underSpentSnapshot(2), snapshotOf(3, [])];

        expect(proposeForGroceries(history)).toEqual([]);
    })
);

it.effect('drops a raise that would push categories and Other above the overall limit', () =>
    Effect.sync(() => {
        const history = threePeriods([category(GROCERIES, units(300), units(400))]);

        expect(propose(history, limitsOf([limit(GROCERIES, units(300))], units(300)))).toEqual([]);
    })
);

it.effect('caps a raise to the room left under the overall limit and logs the capped value', () =>
    Effect.sync(() => {
        const history = threePeriods([category(GROCERIES, units(300), units(400))]);
        const [proposal] = propose(history, limitsOf([limit(GROCERIES, units(300))], units(310)));

        expect(proposal.newAmount).toBe(units(310));
        expect(proposal.reason).toBe(BudgetLimitChangeReasonEnum.OVER_SPENT);
    })
);

it.effect('lets a lowered limit free room for a raise under the overall limit', () =>
    Effect.sync(() => {
        const history = threePeriods([category(GROCERIES, units(300), units(150)), category(TRANSPORT, units(100), units(200))]);
        const proposals = propose(history, limitsOf([limit(GROCERIES, units(300)), limit(TRANSPORT, units(100))], units(400)));

        expect(proposals.map(proposal => [proposal.categoryId, proposal.newAmount])).toEqual([
            [GROCERIES, units(270)],
            [TRANSPORT, units(110)]
        ]);
    })
);

it.effect('lands a capped raise of a fractional limit on a whole currency unit', () =>
    Effect.sync(() => {
        const fractionalLimit = units(300) + 500_000;
        const history = threePeriods([category(GROCERIES, fractionalLimit, units(400))]);
        const [proposal] = propose(history, limitsOf([limit(GROCERIES, fractionalLimit)], units(310)));

        expect(proposal.newAmount).toBe(units(310));
        expect(proposal.newAmount % PRECISION).toBe(0);
    })
);

it.effect('drops a capped raise that cannot reach the next whole unit', () =>
    Effect.sync(() => {
        const fractionalLimit = units(300) + 500_000;
        const history = threePeriods([category(GROCERIES, fractionalLimit, units(400))]);

        expect(propose(history, limitsOf([limit(GROCERIES, fractionalLimit)], fractionalLimit + 400_000))).toEqual([]);
    })
);

const historyEndingAt = (lastMonthIndex: number) =>
    [lastMonthIndex - 2, lastMonthIndex - 1, lastMonthIndex].map(monthIndex =>
        snapshotOf(monthIndex, [category(GROCERIES, units(300), units(150))])
    );

it.effect('locks a line at the two closes after its change and frees it at the third', () =>
    Effect.sync(() => {
        const changedAtClose = [change(GROCERIES, new Date(2026, 0, 1))];
        const limits = limitsOf([limit(GROCERIES, units(300))]);

        expect(propose(historyEndingAt(1), limits, changedAtClose)).toEqual([]);
        expect(propose(historyEndingAt(2), limits, changedAtClose)).toEqual([]);
        expect(propose(historyEndingAt(3), limits, changedAtClose)).toHaveLength(1);
    })
);
