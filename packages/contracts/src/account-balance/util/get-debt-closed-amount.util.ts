export const getDebtClosedAmount = (returnedAmount: number, targetBalance: number): number =>
    Math.min(Math.abs(returnedAmount), targetBalance);
