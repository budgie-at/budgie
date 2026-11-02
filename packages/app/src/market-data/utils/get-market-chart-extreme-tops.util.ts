import { MARKET_CHART_PLOT_HEIGHT } from '../constant/market-chart-plot-height.constant';

import type { MarketChartExtremeTopsInterface } from '../interface/market-chart-extreme-tops.interface';

const MARKET_CHART_LABEL_HEIGHT = 16;

const LABEL_GAP = 6;

export const getMarketChartExtremeTops = (values: readonly number[], ys: readonly number[]): MarketChartExtremeTopsInterface => {
    const highIndex = values.indexOf(Math.max(...values));
    const lowIndex = values.indexOf(Math.min(...values));

    return {
        highIndex,
        lowIndex,
        highTop: Math.max((ys[highIndex] ?? 0) - LABEL_GAP - MARKET_CHART_LABEL_HEIGHT, 0),
        lowTop: Math.min((ys[lowIndex] ?? 0) + LABEL_GAP, MARKET_CHART_PLOT_HEIGHT - MARKET_CHART_LABEL_HEIGHT)
    };
};
