import { BudgetLimitSourceEnum } from '@budgie/contracts';

import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetSpentQuery } from '../../query/use-get-budget-spent.query';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly currencySymbol: string;
}

export const BudgetSetupProgress = ({ budget, currencySymbol }: Props) => {
    const { spent } = useGetBudgetSpentQuery(budget);

    if (budget.limitSource !== BudgetLimitSourceEnum.FIXED) {
        return null;
    }

    return (
        <BudgetProgressBar
            currencySymbol={currencySymbol}
            spent={spent.spentOverall}
            limit={budget.overallLimit}
            spentTestID={BudgetSelector.SetupSpentLabel}
            remainingTestID={BudgetSelector.SetupRemainingLabel}
        />
    );
};
