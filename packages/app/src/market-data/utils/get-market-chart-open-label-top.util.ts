import { MARKET_CHART_PLOT_HEIGHT } from '../constant/market-chart-plot-height.constant';

import { getMarketChartExtremeTops } from './get-market-chart-extreme-tops.util';

import type { MarketChartOpenLabelPlacementInputInterface } from '../interface/market-chart-open-label-placement-input.interface';

const LABEL_HEIGHT = 14;
const LINE_GAP = 2;
const EXTREME_CLEARANCE = 16;
const POINT_CLEARANCE = 4;
const CHARACTER_WIDTH = 6.5;

export const getMarketChartOpenLabelTop = ({
    values,
    xs,
    ys,
    baselineY,
    chartWidth,
    labelLength
}: MarketChartOpenLabelPlacementInputInterface): number | null => {
    const spanStart = chartWidth - labelLength * CHARACTER_WIDTH - POINT_CLEARANCE;
    const spanYs = ys.filter((_, index) => (xs[index] ?? 0) >= spanStart);
    const { highTop, lowTop } = getMarketChartExtremeTops(values, ys);
    const hasExtremes = Math.max(...values) !== Math.min(...values);

    const isClear = (top: number): boolean =>
        top >= 0 &&
        top + LABEL_HEIGHT <= MARKET_CHART_PLOT_HEIGHT &&
        spanYs.every(y => y <= top - POINT_CLEARANCE || y >= top + LABEL_HEIGHT + POINT_CLEARANCE) &&
        !(hasExtremes && (Math.abs(top - highTop) < EXTREME_CLEARANCE || Math.abs(top - lowTop) < EXTREME_CLEARANCE));

    return [baselineY - LINE_GAP - LABEL_HEIGHT, baselineY + LINE_GAP].find(isClear) ?? null;
};
