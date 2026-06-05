import { isDefined } from '@rnw-community/shared';

import { BudgetSelector } from '../../budget.selector';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface | null;
    readonly currencySymbol: string;
    readonly isEditing: boolean;
    readonly spentOverall: number;
}

export const BudgetSetupProgressBar = ({ budget, currencySymbol, isEditing, spentOverall }: Props) =>
    isEditing && isDefined(budget) ? (
        <BudgetProgressBar
            currencySymbol={currencySymbol}
            spent={spentOverall}
            limit={budget.overallLimit}
            spentTestID={BudgetSelector.SetupSpentLabel}
            remainingTestID={BudgetSelector.SetupRemainingLabel}
        />
    ) : null;
