import { PRECISION } from '../transaction/constant/precision.constant';

export const convertToFromMicro = (toAmountMicro: number, exchangeRate: number): number => {
    const rateScaled = Math.round(exchangeRate * PRECISION);

    return Math.round((toAmountMicro * rateScaled) / PRECISION);
};

