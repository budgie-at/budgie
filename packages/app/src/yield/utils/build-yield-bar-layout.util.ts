import { YieldGroupEnum } from '@budgie/market';

import { MARKET_CHART_PADDING_X } from '../../market-data/constant/market-chart-padding-x.constant';

import type { YieldBarLayoutInputInterface } from '../interface/yield-bar-layout-input.interface';
import type { YieldBarLayoutInterface } from '../interface/yield-bar-layout.interface';
import type { YieldBarRectInterface } from '../interface/yield-bar-rect.interface';

const BAR_WIDTH_SHARE = 0.6;
const BAR_RADIUS = 4;
const MIN_SEGMENT_HEIGHT = 3;
const SEGMENT_GAP = 2;
const NARROW_SEGMENT_GAP = 1;
const NARROW_BAR_WIDTH = 8;
const TICK_HEIGHT = 1;
const STACK_GROUPS = [
    YieldGroupEnum.STAKING_EARN,
    YieldGroupEnum.INTEREST,
    YieldGroupEnum.DIVIDENDS,
    YieldGroupEnum.DISTRIBUTIONS
] as const;

const buildGroupRecord = (): Record<YieldGroupEnum, YieldBarRectInterface[]> => ({
    [YieldGroupEnum.STAKING_EARN]: [],
    [YieldGroupEnum.INTEREST]: [],
    [YieldGroupEnum.DIVIDENDS]: [],
    [YieldGroupEnum.DISTRIBUTIONS]: [],
    [YieldGroupEnum.TAX]: []
});

const mergeSmallSegments = (heights: readonly number[]) =>
    heights.reduce<number[]>((merged, height, index) => {
        const total = height + (merged.at(index) ?? 0);
        const hasLaterSegment = heights.slice(index + 1).some(later => later > 0);

        return total > 0 && total < MIN_SEGMENT_HEIGHT && hasLaterSegment
            ? [...merged.slice(0, index), 0, total]
            : [...merged.slice(0, index), total];
    }, []);

export const buildYieldBarLayout = ({
    buckets,
    visibleGroups,
    width,
    height,
    axis
}: YieldBarLayoutInputInterface): YieldBarLayoutInterface => {
    const slot = Math.max(width - MARKET_CHART_PADDING_X * 2, 1) / Math.max(buckets.length, 1);
    const barWidth = slot * BAR_WIDTH_SHARE;
    const gap = barWidth < NARROW_BAR_WIDTH ? NARROW_SEGMENT_GAP : SEGMENT_GAP;
    const scale = height / (axis.top - axis.bottom);
    const zeroY = axis.top * scale;
    const xs = buckets.map((_, index) => MARKET_CHART_PADDING_X + slot * (index + 0.5));
    const groups = buildGroupRecord();
    const estimated = buildGroupRecord();
    const tax: YieldBarRectInterface[] = [];

    buckets.forEach((bucket, index) => {
        const left = (xs.at(index) ?? 0) - barWidth / 2;
        const heights = mergeSmallSegments(visibleGroups.map(group => bucket.amounts[group] * scale));
        const topIndex = heights.findLastIndex(segment => segment > 0);
        const taxHeight = bucket.amounts[YieldGroupEnum.TAX] * scale;
        let bottom = zeroY;

        STACK_GROUPS.forEach(group => {
            const visibleIndex = visibleGroups.indexOf(group);
            const segment = visibleIndex >= 0 ? (heights.at(visibleIndex) ?? 0) : 0;
            const isTop = visibleIndex === topIndex && segment > 0;
            const drawn = isTop ? segment : Math.max(segment - gap, 0);
            const estimatedHeight = bucket.amounts[group] > 0 ? (drawn * bucket.estimatedAmounts[group]) / bucket.amounts[group] : 0;
            const top = bottom - drawn;

            groups[group].push({
                x: left,
                y: top + estimatedHeight,
                width: barWidth,
                height: drawn - estimatedHeight,
                radius: isTop && estimatedHeight === 0 ? BAR_RADIUS : 0
            });
            estimated[group].push({ x: left, y: top, width: barWidth, height: estimatedHeight, radius: isTop ? BAR_RADIUS : 0 });
            bottom -= segment;
        });

        tax.push(
            topIndex < 0 && taxHeight === 0
                ? { x: left, y: zeroY - TICK_HEIGHT, width: barWidth, height: TICK_HEIGHT, radius: 0 }
                : { x: left, y: zeroY, width: barWidth, height: taxHeight, radius: 0 }
        );
    });

    return { xs, slot, barWidth, zeroY, groups, estimated, tax };
};
