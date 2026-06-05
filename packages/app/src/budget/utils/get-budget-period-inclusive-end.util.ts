export const getBudgetPeriodInclusiveEnd = (nextPeriodStart: Date): Date => new Date(nextPeriodStart.getTime() - 1);
