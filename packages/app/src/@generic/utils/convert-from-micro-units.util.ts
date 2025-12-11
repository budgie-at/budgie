import { MicroUnitType, PRECISION } from '@budgie/contracts';

export const convertFromMicroUnits = (value: MicroUnitType) => Number(value) / PRECISION;
