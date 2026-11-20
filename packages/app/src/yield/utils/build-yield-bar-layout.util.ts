import { YieldGroupEnum } from '@budgie/market';

import { isPositiveNumber } from '@rnw-community/shared';

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
    const tax: YieldBarRectInterface[] = [];

    buckets.forEach((bucket, index) => {
        const left = (xs.at(index) ?? 0) - barWidth / 2;
        const heights = mergeSmallSegments(
            YIELD_STACK_GROUPS.map(group => (visibleGroups.includes(group) ? bucket.amounts[group] * scale : 0)),
            gap
        );
        const topIndex = heights.findLastIndex(segment => segment > 0);
        const taxHeight = isPositiveNumber(axis.depth)
            ? Math.min(bucket.amounts[YieldGroupEnum.TAX] / axis.depth, 1) * (height - zeroY)
            : 0;
        let bottom = zeroY;

        YIELD_STACK_GROUPS.forEach((group, groupIndex) => {
            const segment = heights.at(groupIndex) ?? 0;
            const isTop = groupIndex === topIndex;
            const drawn = isTop ? segment : Math.max(segment - gap, 0);

            groups[group].push({
                x: left,
                y: bottom - drawn,
                width: barWidth,
                height: drawn,
                radius: buildRadius(drawn, isTop),
                bottomRadius: 0,
                isInProgress: bucket.isInProgress
            });
            bottom -= segment;
        });

        tax.push({
            x: left,
            y: zeroY,
            width: barWidth,
            height: taxHeight,
            radius: 0,
            bottomRadius: buildRadius(taxHeight, true),
            isInProgress: bucket.isInProgress
        });
    });

    return { xs, slot, barWidth, zeroY, scale, groups, tax };
};
