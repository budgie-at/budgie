import { MARKET_CHART_PADDING_X } from '../constant/market-chart-padding-x.constant';

export const getMarketChartBin = (x: number, width: number, count: number): number => {
    'worklet';

    const drawableWidth = width - MARKET_CHART_PADDING_X * 2;

    if (drawableWidth <= 0 || count <= 0) {
        return 0;
    }

    return Math.min(Math.max(Math.floor(((x - MARKET_CHART_PADDING_X) / drawableWidth) * count), 0), count - 1);
};
