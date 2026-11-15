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

const ALL_GROUPS = [YieldGroupEnum.STAKING_EARN, YieldGroupEnum.INTEREST, YieldGroupEnum.DIVIDENDS, YieldGroupEnum.DISTRIBUTIONS];

const full = (
    staking: number,
    interest: number,
    dividends: number,
    distributions: number,
    estimatedDividends = 0
): YieldBucketInterface => ({
    ...bucket(staking, interest),
    amounts: { ...amounts(staking, interest), [YieldGroupEnum.DIVIDENDS]: dividends, [YieldGroupEnum.DISTRIBUTIONS]: distributions },
    estimatedAmounts: { ...amounts(0, 0), [YieldGroupEnum.DIVIDENDS]: estimatedDividends }
});

const axisOf100 = { step: 50, top: 100, bottom: 0, gridlines: [0, 50, 100] };

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

it('merges on the drawn height so no visible segment is shorter than 3 pt', () => {
    const layout = buildYieldBarLayout({ buckets: [bucket(2, 98)], visibleGroups: VISIBLE, width: 112, height: 200, axis: axisOf100 });

    expect(layout.groups[YieldGroupEnum.STAKING_EARN][0]?.height).toBe(0);
    expect(layout.groups[YieldGroupEnum.INTEREST][0]).toMatchObject({ y: 0, height: 200 });
});

it('cascades a merge through three small groups into the top one', () => {
    const layout = buildYieldBarLayout({
        buckets: [full(1, 1, 1, 97)],
        visibleGroups: ALL_GROUPS,
        width: 112,
        height: 100,
        axis: axisOf100
    });

    expect(layout.groups[YieldGroupEnum.STAKING_EARN][0]?.height).toBe(0);
    expect(layout.groups[YieldGroupEnum.INTEREST][0]?.height).toBe(0);
    expect(layout.groups[YieldGroupEnum.DIVIDENDS][0]?.height).toBe(0);
    expect(layout.groups[YieldGroupEnum.DISTRIBUTIONS][0]).toMatchObject({ y: 0, height: 100, radius: 4 });
});

it('computes the estimated ratio on the group own amount and clamps it', () => {
    const own = buildYieldBarLayout({
        buckets: [full(0, 1, 10, 80, 5)],
        visibleGroups: ALL_GROUPS,
        width: 112,
        height: 100,
        axis: axisOf100
    });
    const clamped = buildYieldBarLayout({
        buckets: [full(0, 0, 10, 80, 20)],
        visibleGroups: ALL_GROUPS,
        width: 112,
        height: 100,
        axis: axisOf100
    });

    expect(own.estimated[YieldGroupEnum.DIVIDENDS][0]?.height).toBe(4.5);
    expect(clamped.estimated[YieldGroupEnum.DIVIDENDS][0]?.height).toBe(8);
    expect(clamped.groups[YieldGroupEnum.DIVIDENDS][0]?.height).toBe(0);
});

it('caps the radius at the segment height and gives empty rects no radius', () => {
    const tiny = buildYieldBarLayout({ buckets: [bucket(2, 0)], visibleGroups: VISIBLE, width: 112, height: 100, axis: axisOf100 });
    const empty = buildYieldBarLayout({ buckets: [bucket(0, 0)], visibleGroups: VISIBLE, width: 112, height: 100, axis: axisOf100 });

    expect(tiny.groups[YieldGroupEnum.STAKING_EARN][0]).toMatchObject({ height: 2, radius: 2 });
    expect(empty.groups[YieldGroupEnum.STAKING_EARN][0]?.radius).toBe(0);
    expect(empty.estimated[YieldGroupEnum.STAKING_EARN][0]?.radius).toBe(0);
});

it('stacks in group order whatever the order of the visible groups', () => {
    const input = { buckets: [bucket(60, 40)], width: 112, height: 200, axis: axisOf100 };

    expect(buildYieldBarLayout({ ...input, visibleGroups: [...VISIBLE].reverse() })).toEqual(
        buildYieldBarLayout({ ...input, visibleGroups: VISIBLE })
    );
});

it('accumulates a running total', () => {
    expect(buildYieldRunningTotal([1, 2, 3])).toEqual([1, 3, 6]);
    expect(buildYieldRunningTotal([])).toEqual([]);
    expect(buildYieldRunningTotal([5, -8, 2])).toEqual([5, -3, -1]);
});
