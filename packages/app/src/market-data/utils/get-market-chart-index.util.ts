import { MARKET_CHART_PADDING_X } from '../constant/market-chart-padding-x.constant';

export const getMarketChartIndex = (x: number, width: number, count: number): number => {
    'worklet';

    const drawableWidth = width - MARKET_CHART_PADDING_X * 2;
    const lastIndex = count - 1;

    if (drawableWidth <= 0 || lastIndex <= 0) {
        return 0;
    }

    const index = Math.round(((x - MARKET_CHART_PADDING_X) / drawableWidth) * lastIndex);

    return Math.min(Math.max(index, 0), lastIndex);
};
