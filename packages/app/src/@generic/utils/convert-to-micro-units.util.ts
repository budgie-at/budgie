import { PRECISION } from '@budgie/contracts';

export const convertToMicroUnits = (value: number): number => Math.round(value * PRECISION);
