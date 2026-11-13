import { YieldGroupEnum } from '@budgie/market';
import { expect, it } from '@effect/vitest';

import { buildYieldBarLayout } from '../src/yield/utils/build-yield-bar-layout.util';
import { buildYieldRunningTotal } from '../src/yield/utils/build-yield-running-total.util';

import type { YieldBucketInterface } from '@budgie/market';

const amounts = (staking: number, interest: number, tax = 0) => ({
    [YieldGroupEnum.STAKING_EARN]: staking,
    [YieldGroupEnum.INTEREST]: interest,
    [YieldGroupEnum.DIVIDENDS]: 0,
    [YieldGroupEnum.DISTRIBUTIONS]: 0,
    [YieldGroupEnum.TAX]: tax
});

const bucket = (staking: number, interest: number, tax = 0, estimatedStaking = 0): YieldBucketInterface => ({
    start: '2026-01-01',
    end: '2026-01-31',
    isInProgress: false,
    amounts: amounts(staking, interest, tax),
    estimatedAmounts: amounts(estimatedStaking, 0),
    total: staking + interest,
    isEstimated: false
});

const VISIBLE = [YieldGroupEnum.STAKING_EARN, YieldGroupEnum.INTEREST];

it('stacks visible groups bottom to top with a 2 pt gap and rounds only the top segment', () => {
    const layout = buildYieldBarLayout({
        buckets: [bucket(60, 40)],
        visibleGroups: VISIBLE,
        width: 112,
        height: 200,
        axis: { step: 50, top: 100, bottom: 0, gridlines: [0, 50, 100] }
    });
    const [staking] = layout.groups[YieldGroupEnum.STAKING_EARN];
    const [interest] = layout.groups[YieldGroupEnum.INTEREST];

    expect(layout.zeroY).toBe(200);
    expect(staking).toMatchObject({ y: 82, height: 118, radius: 0 });
    expect(interest).toMatchObject({ y: 0, height: 80, radius: 4 });
});

it('merges a segment under 3 pt into the one above and draws tax below zero', () => {
    const layout = buildYieldBarLayout({
        buckets: [bucket(1, 99, 20)],
        visibleGroups: VISIBLE,
        width: 112,
        height: 240,
        axis: { step: 100, top: 100, bottom: -20, gridlines: [-20, 0, 100] }
    });

    expect(layout.groups[YieldGroupEnum.STAKING_EARN][0]?.height).toBe(0);
    expect(layout.groups[YieldGroupEnum.INTEREST][0]).toMatchObject({ y: 0, height: 200 });
    expect(layout.tax[0]).toMatchObject({ y: 200, height: 40 });
});

it('draws a 1 pt tick for an empty bucket and 1 pt gaps on narrow bars', () => {
    const narrow = buildYieldBarLayout({
        buckets: Array.from({ length: 30 }, () => bucket(10, 10)),
        visibleGroups: VISIBLE,
        width: 300,
        height: 200,
        axis: { step: 10, top: 20, bottom: 0, gridlines: [0, 10, 20] }
    });
    const empty = buildYieldBarLayout({
        buckets: [bucket(0, 0)],
        visibleGroups: VISIBLE,
        width: 112,
        height: 200,
        axis: { step: 1, top: 1, bottom: 0, gridlines: [0, 1] }
    });

    expect(narrow.groups[YieldGroupEnum.STAKING_EARN][0]?.height).toBe(99);
    expect(empty.groups[YieldGroupEnum.STAKING_EARN][0]?.height).toBe(0);
    expect(empty.tax[0]).toMatchObject({ y: 199, height: 1 });
});

it('splits a segment into its priced part and its estimated part on top', () => {
    const layout = buildYieldBarLayout({
        buckets: [bucket(100, 0, 0, 50)],
        visibleGroups: [YieldGroupEnum.STAKING_EARN],
        width: 112,
        height: 200,
        axis: { step: 50, top: 100, bottom: 0, gridlines: [0, 50, 100] }
    });

    expect(layout.groups[YieldGroupEnum.STAKING_EARN][0]).toMatchObject({ y: 100, height: 100, radius: 0 });
    expect(layout.estimated[YieldGroupEnum.STAKING_EARN][0]).toMatchObject({ y: 0, height: 100, radius: 4 });
});

it('accumulates a running total', () => {
    expect(buildYieldRunningTotal([1, 2, 3])).toEqual([1, 3, 6]);
    expect(buildYieldRunningTotal([])).toEqual([]);
});
