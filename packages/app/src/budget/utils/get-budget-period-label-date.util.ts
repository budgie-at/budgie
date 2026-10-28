export const getBudgetPeriodLabelDate = (periodStart: Date, periodEnd: Date): Date =>
    new Date((periodStart.getTime() + periodEnd.getTime()) / 2);
