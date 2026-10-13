import { PRECISION } from '../constant/precision.constant';

export const convertToMicroUnits = (value: number): number => Math.round(value * PRECISION);
