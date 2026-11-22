import { MARKET_CHART_PADDING_X } from '../../market-data/constant/market-chart-padding-x.constant';

import { getYieldSlotWidth } from './get-yield-slot-width.util';

const HALF_SLOT = 0.5;

export const getYieldBarCenterX = (index: number, count: number, width: number): number =>
    MARKET_CHART_PADDING_X + getYieldSlotWidth(width, count) * (index + HALF_SLOT);
