import { PRECISION } from '../@generic/constant/precision.constant';

export const baseMicroToQuoteMicro = (fromAmountMicro: number, exchangeRateFromPerTo: number): number => {
    const rateScaled = Math.round(exchangeRateFromPerTo * PRECISION);

    return Math.round((fromAmountMicro * PRECISION) / rateScaled);
};
