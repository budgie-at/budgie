import { isPositiveNumber } from '@rnw-community/shared';

import { MARKET_CHART_HEIGHT } from '../constant/market-chart-height.constant';
import { MARKET_CHART_PADDING_X } from '../constant/market-chart-padding-x.constant';

import type { MarketChartGeometryInterface } from '../interface/market-chart-geometry.interface';

const PADDING_Y = 16;
const MIDDLE = 0.5;
const MIN_RELATIVE_SPAN = 0.02;

const toCommand = (command: string, x: number, y: number): string => `${command}${x},${y}`;

export const buildMarketChartGeometry = (values: readonly number[], width: number): MarketChartGeometryInterface => {
    const low = Math.min(...values);
    const high = Math.max(...values);
    const middle = (low + high) * MIDDLE;
    const range = Math.max(high - low, Math.abs(middle) * MIN_RELATIVE_SPAN);
    const min = middle - range * MIDDLE;
    const drawableWidth = Math.max(width - MARKET_CHART_PADDING_X * 2, 0);
    const drawableHeight = MARKET_CHART_HEIGHT - PADDING_Y * 2;
    const lastIndex = Math.max(values.length - 1, 1);
    const toY = (value: number) => PADDING_Y + (1 - (isPositiveNumber(range) ? (value - min) / range : MIDDLE)) * drawableHeight;
    const xs = values.map((_, index) => MARKET_CHART_PADDING_X + (index / lastIndex) * drawableWidth);
    const ys = values.map(toY);
    const linePath = xs.map((x, index) => toCommand(index === 0 ? 'M' : 'L', x, ys[index] ?? 0)).join(' ');
    const firstX = xs.at(0) ?? 0;
    const lastX = xs.at(-1) ?? 0;

    return {
        xs,
        ys,
        linePath,
        areaPath: [linePath, toCommand('L', lastX, MARKET_CHART_HEIGHT), toCommand('L', firstX, MARKET_CHART_HEIGHT), 'Z'].join(' '),
        baselineY: toY(values.at(0) ?? min)
    };
};
