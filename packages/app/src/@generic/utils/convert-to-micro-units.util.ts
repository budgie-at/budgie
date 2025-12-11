import { MicroUnitType, PRECISION } from '@budgie/contracts';

export const convertToMicroUnits = (value: number): MicroUnitType => BigInt(Math.round(value * PRECISION));
