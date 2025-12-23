import { PRECISION } from '../constant/precision.constant';

export const convertFromMicroUnits = (value: number) => value / PRECISION;
