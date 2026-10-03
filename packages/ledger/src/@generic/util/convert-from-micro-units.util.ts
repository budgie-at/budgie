import { PRECISION } from '@budgie/contracts';

export const convertFromMicroUnits = (value: number) => value / PRECISION;
