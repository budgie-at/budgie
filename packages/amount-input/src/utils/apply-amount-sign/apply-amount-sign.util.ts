export const applyAmountSign = (absoluteValue: number, isNegative: boolean): number =>
    isNegative && absoluteValue !== 0 ? -absoluteValue : absoluteValue;
