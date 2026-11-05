import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { BudgetSetupProgressContent } from '../budget-setup-progress-content/budget-setup-progress-content';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly currencySymbol: string;
}

export const BudgetSetupProgress = ({ budget, currencySymbol }: Props) => {
    const { projection, isLoading } = useGetBudgetProjectionQuery(budget);
    const scope = isLoading ? null : projection.overall;

    return <BudgetSetupProgressContent scope={scope} currencySymbol={currencySymbol} />;
};
