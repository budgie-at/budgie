// SELL conversion helper (matches refine):
// We balance in the TO currency.
// FROM micro -> TO micro with inverse of fixed-point rate:
//   rateScaled = round(exchangeRate * PRECISION)
//   toMicro    = round((fromMicro * PRECISION) / rateScaled)
import { PRECISION } from '../transaction/constant/precision.constant';

export const convertFromToMicro = (fromAmountMicro: number, exchangeRate: number): number => {
    const rateScaledInteger = Math.round(exchangeRate * PRECISION);

    return Math.round((fromAmountMicro * PRECISION) / rateScaledInteger);
};
