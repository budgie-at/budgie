import { PRECISION } from '../constant/precision.constant';

export const convertFromMicroUnits = (microUnits: bigint): number => Number(microUnits) / PRECISION;
