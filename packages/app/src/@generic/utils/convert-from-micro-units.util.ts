import { PRECISION } from '@budgie/contracts';

export const convertFromMicroUnits = (microUnits: number) => microUnits / PRECISION;
