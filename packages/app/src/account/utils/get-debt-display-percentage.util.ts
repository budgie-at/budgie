const FULL_PERCENTAGE = 100;

export const getDebtDisplayPercentage = (percentage: number): number =>
    percentage >= FULL_PERCENTAGE ? FULL_PERCENTAGE : Math.floor(percentage);
