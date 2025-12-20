import { PRECISION } from '../constant/precision.constant';

export const convertToMicroUnits = (amount: number): bigint => {
    const scaled = Math.round(amount * PRECISION);

    return BigInt(scaled);
};
