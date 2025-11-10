import { PRECISION } from '../transaction/constant/precision.constant';

export const convertFromToMicro = (fromAmountMicro: number, exchangeRate: number): number => {
    const rateScaled = Math.round(exchangeRate * PRECISION);

    return Math.round((fromAmountMicro * PRECISION) / rateScaled);
};
