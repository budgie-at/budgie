import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MarketChartToneEnum } from '../enum/market-chart-tone.enum';

const NEUTRAL_CHANGE_SHARE = 0.001;

export const getMarketChartTone = (values: readonly number[]): MarketChartToneEnum => {
    const first = values.at(0);
    const last = values.at(-1);

    if (!isDefined(first) || !isDefined(last) || !isPositiveNumber(first) || Math.abs((last - first) / first) < NEUTRAL_CHANGE_SHARE) {
        return MarketChartToneEnum.NEUTRAL;
    }

    return last > first ? MarketChartToneEnum.POSITIVE : MarketChartToneEnum.NEGATIVE;
};
