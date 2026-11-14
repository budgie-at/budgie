import { YieldGroupEnum } from '@budgie/market';

import { MARKET_CHART_PADDING_X } from '../../market-data/constant/market-chart-padding-x.constant';
import { YIELD_STACK_GROUPS } from '../constant/yield-stack-groups.constant';

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

const buildGroupRecord = (): Record<YieldGroupEnum, YieldBarRectInterface[]> => ({
    [YieldGroupEnum.STAKING_EARN]: [],
    [YieldGroupEnum.INTEREST]: [],
    [YieldGroupEnum.DIVIDENDS]: [],
    [YieldGroupEnum.DISTRIBUTIONS]: [],
    [YieldGroupEnum.TAX]: []
});

const mergeSmallSegments = (heights: readonly number[], gap: number) => {
    const topIndex = heights.findLastIndex(height => height > 0);
    let carried = 0;

    return heights.map((height, index) => {
        if (height <= 0) {
            return 0;
        }

        const total = height + carried;

        if (index < topIndex && total - gap < MIN_SEGMENT_HEIGHT) {
            carried = total;

            return 0;
        }

        carried = 0;

        return total;
    });
};

const buildRadius = (height: number, isTop: boolean) => (isTop && height > 0 ? Math.min(BAR_RADIUS, height) : 0);

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
        const heights = mergeSmallSegments(
            YIELD_STACK_GROUPS.map(group => (visibleGroups.includes(group) ? bucket.amounts[group] * scale : 0)),
            gap
        );
        const topIndex = heights.findLastIndex(segment => segment > 0);
        const taxHeight = bucket.amounts[YieldGroupEnum.TAX] * scale;
        let bottom = zeroY;

        YIELD_STACK_GROUPS.forEach((group, groupIndex) => {
            const segment = heights.at(groupIndex) ?? 0;
            const isTop = groupIndex === topIndex;
            const drawn = isTop ? segment : Math.max(segment - gap, 0);
            const ratio = bucket.amounts[group] > 0 ? Math.min(Math.max(bucket.estimatedAmounts[group] / bucket.amounts[group], 0), 1) : 0;
            const estimatedHeight = drawn * ratio;
            const pricedHeight = drawn - estimatedHeight;
            const top = bottom - drawn;

            groups[group].push({
                x: left,
                y: top + estimatedHeight,
                width: barWidth,
                height: pricedHeight,
                radius: buildRadius(pricedHeight, isTop && estimatedHeight === 0)
            });
            estimated[group].push({
                x: left,
                y: top,
                width: barWidth,
                height: estimatedHeight,
                radius: buildRadius(estimatedHeight, isTop)
            });
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
