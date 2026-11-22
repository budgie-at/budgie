import { MARKET_CHART_PADDING_X } from '../../market-data/constant/market-chart-padding-x.constant';

export const getYieldSlotWidth = (width: number, count: number): number =>
    Math.max(width - MARKET_CHART_PADDING_X * 2, 1) / Math.max(count, 1);
