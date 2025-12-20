import { PRECISION } from '../@generic/constant/precision.constant';

export const quoteMicroToBaseMicro = (toAmountMicro: bigint, exchangeRate: number): bigint => {
    const rateScaled = Math.round(exchangeRate * PRECISION);

    const rateScaledBig = BigInt(rateScaled);
    const precisionBig = BigInt(PRECISION);

    return (toAmountMicro * rateScaledBig) / precisionBig;
};
