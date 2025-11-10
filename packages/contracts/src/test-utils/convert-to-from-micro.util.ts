import { PRECISION } from '../transaction/constant/precision.constant';

// convert TO micro-units -> FROM micro-units with same fixed-point rule as schema
export const convertToFromMicro = (toAmountMicro: number, exchangeRate: number): number => {
    const rateScaledInteger = Math.round(exchangeRate * PRECISION);

    return Math.round((toAmountMicro * rateScaledInteger) / PRECISION);
};

