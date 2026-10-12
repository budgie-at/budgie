import { convertFromMicroUnits } from '@budgie/contracts';

export const buildBudgetCategoryLimitMetrics = (spent: number, limitAmount: number) => {
    const remainingAmount = limitAmount - spent;

    return {
        displaySpent: convertFromMicroUnits(spent),
        displayLimit: convertFromMicroUnits(limitAmount),
        displayRemaining: convertFromMicroUnits(Math.abs(remainingAmount)),
        isOverBudget: remainingAmount < 0
    };
};
