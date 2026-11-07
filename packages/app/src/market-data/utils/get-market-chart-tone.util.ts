import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { NEUTRAL_CHANGE_SHARE } from '../constant/neutral-change-share.constant';
import { MarketChartToneEnum } from '../enum/market-chart-tone.enum';

export const getMarketChartTone = (values: readonly number[]): MarketChartToneEnum => {
    const first = values.at(0);
    const last = values.at(-1);

    if (!isDefined(first) || !isDefined(last) || last === first) {
        return MarketChartToneEnum.NEUTRAL;
    }

    if (isPositiveNumber(first) && Math.abs((last - first) / first) < NEUTRAL_CHANGE_SHARE) {
        return MarketChartToneEnum.NEUTRAL;
    }

    return last > first ? MarketChartToneEnum.POSITIVE : MarketChartToneEnum.NEGATIVE;
};
