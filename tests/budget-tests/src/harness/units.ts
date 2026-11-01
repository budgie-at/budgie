import { PRECISION } from '@budgie/contracts';

export const units = (amount: number): number => amount * PRECISION;
