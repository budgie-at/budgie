export const resolveIsNegativeAmount = (isNegative: boolean, value: number): boolean => (value === 0 ? isNegative : value < 0);
