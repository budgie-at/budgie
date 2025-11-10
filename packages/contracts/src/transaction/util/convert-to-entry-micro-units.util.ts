import { PRECISION } from '../constant/precision.constant';

export const convertToEntryMicroUnits = (amountMicroUnits: number, rateScaled: number): number =>
    Math.round((amountMicroUnits * rateScaled) / PRECISION);
