import { MARKET_CHART_PADDING_X } from '../../market-data/constant/market-chart-padding-x.constant';

const HALF_SLOT = 0.5;

export const getYieldBarCenterX = (index: number, count: number, width: number): number =>
    MARKET_CHART_PADDING_X + (Math.max(width - MARKET_CHART_PADDING_X * 2, 1) / Math.max(count, 1)) * (index + HALF_SLOT);
