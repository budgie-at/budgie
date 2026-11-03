import type { MarketChartLabelLayoutInterface } from '../interface/market-chart-label-layout.interface';

const HALF = 0.5;

export const getMarketChartLabelLayout = (x: number, chartWidth: number, labelWidth: number): MarketChartLabelLayoutInterface => {
    const maxLeft = Math.max(chartWidth - labelWidth, 0);
    const left = Math.min(Math.max(x - labelWidth * HALF, 0), maxLeft);

    if (left <= 0) {
        return { left: 0, textClassName: 'text-left' };
    }

    return left >= maxLeft ? { left: maxLeft, textClassName: 'text-right' } : { left, textClassName: 'text-center' };
};
