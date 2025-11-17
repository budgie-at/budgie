import { PRECISION } from '@budgie/contracts';

export const convertToMicroUnits = (normalized: number) => normalized * PRECISION;
