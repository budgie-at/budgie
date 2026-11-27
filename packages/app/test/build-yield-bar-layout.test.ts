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

const full = (staking: number, interest: number, dividends: number, distributions: number): YieldBucketInterface => ({
    ...bucket(staking, interest),
    amounts: { ...amounts(staking, interest), [YieldGroupEnum.DIVIDENDS]: dividends, [YieldGroupEnum.DISTRIBUTIONS]: distributions }
});

const axisOf100 = { top: 100, bottom: 0, step: 1 };

const VISIBLE = [YieldGroupEnum.STAKING_EARN, YieldGroupEnum.INTEREST];

it('stacks visible groups bottom to top with a 2 pt gap and rounds only the top segment', () => {
    const layout = buildYieldBarLayout({
        buckets: [bucket(60, 40)],
        visibleGroups: VISIBLE,
        width: 112,
        height: 200,
        axis: { top: 100, bottom: 0, step: 1 }
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
        axis: { top: 100, bottom: -20, step: 1 }
    });

    expect(layout.groups[YieldGroupEnum.STAKING_EARN][0]?.height).toBe(0);
    expect(layout.groups[YieldGroupEnum.INTEREST][0]).toMatchObject({ y: 0, height: 200 });
    expect(layout.tax[0]).toMatchObject({ y: 200, height: 40 });
});

it('draws nothing for an empty bucket and 1 pt gaps on narrow bars', () => {
    const narrow = buildYieldBarLayout({
        buckets: Array.from({ length: 30 }, () => bucket(10, 10)),
        visibleGroups: VISIBLE,
        width: 300,
        height: 200,
        axis: { top: 20, bottom: 0, step: 1 }
    });
    const empty = buildYieldBarLayout({
        buckets: [bucket(0, 0)],
        visibleGroups: VISIBLE,
        width: 112,
        height: 200,
        axis: { top: 1, bottom: 0, step: 1 }
    });

    expect(narrow.groups[YieldGroupEnum.STAKING_EARN][0]?.height).toBe(99);
    expect(empty.groups[YieldGroupEnum.STAKING_EARN][0]?.height).toBe(0);
    expect(empty.tax[0]).toMatchObject({ y: 200, height: 0 });
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

it('caps the radius at the segment height and gives empty rects no radius', () => {
    const tiny = buildYieldBarLayout({ buckets: [bucket(2, 0)], visibleGroups: VISIBLE, width: 112, height: 100, axis: axisOf100 });
    const empty = buildYieldBarLayout({ buckets: [bucket(0, 0)], visibleGroups: VISIBLE, width: 112, height: 100, axis: axisOf100 });

    expect(tiny.groups[YieldGroupEnum.STAKING_EARN][0]).toMatchObject({ height: 3, radius: 3 });
    expect(empty.groups[YieldGroupEnum.STAKING_EARN][0]?.radius).toBe(0);
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

it('flags the rects of an in-progress bucket', () => {
    const layout = buildYieldBarLayout({
        buckets: [bucket(60, 40), { ...bucket(60, 40), isInProgress: true }],
        visibleGroups: VISIBLE,
        width: 112,
        height: 200,
        axis: axisOf100
    });

    expect(layout.groups[YieldGroupEnum.STAKING_EARN].map(rect => rect.isInProgress)).toEqual([false, true]);
    expect(layout.tax.map(rect => rect.isInProgress)).toEqual([false, true]);
});

it('scales tax like income with a 3 pt floor, capped to the negative band', () => {
    const axis = { top: 100, bottom: -50, step: 1 };
    const layout = buildYieldBarLayout({
        buckets: [bucket(60, 40, 10), bucket(60, 40, 0.5), bucket(60, 40, 80)],
        visibleGroups: VISIBLE,
        width: 168,
        height: 150,
        axis
    });

    expect(layout.tax.map(rect => rect.height)).toEqual([10, 3, 50]);
});
