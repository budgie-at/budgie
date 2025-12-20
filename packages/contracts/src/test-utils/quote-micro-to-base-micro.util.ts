import { PRECISION } from '../generic/constant/precision.constant';

export const quoteMicroToBaseMicro = (toAmountMicro: number, exchangeRate: number): number => {
    const rateScaled = Math.round(exchangeRate * PRECISION);

    return Math.round((toAmountMicro * rateScaled) / PRECISION);
};
