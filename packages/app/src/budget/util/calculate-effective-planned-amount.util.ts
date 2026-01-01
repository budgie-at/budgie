import { BudgetAllocationTypeEnum } from '@budgie/contracts';

interface AllocationWithType {
    readonly allocationType: BudgetAllocationTypeEnum;
    readonly amount: number;
    readonly percentage: number;
}

export const calculateEffectivePlannedAmount = (allocation: AllocationWithType, totalIncome: number): number => {
    if (allocation.allocationType === BudgetAllocationTypeEnum.PERCENTAGE) {
        return Math.round((totalIncome * allocation.percentage) / 100);
    }

    return allocation.amount;
};

export const calculateTotalPlannedAmount = (allocations: AllocationWithType[], totalIncome: number): number =>
    allocations.reduce((sum, allocation) => sum + calculateEffectivePlannedAmount(allocation, totalIncome), 0);

