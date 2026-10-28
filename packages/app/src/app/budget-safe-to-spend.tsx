import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../@generic/component/loading-screen/loading-screen';
import { BudgetSafeToSpendSheet } from '../budget/components/budget-safe-to-spend-sheet/budget-safe-to-spend-sheet';
import { useGetActiveBudgetQuery } from '../budget/query/use-get-active-budget.query';

export default function BudgetSafeToSpendRoute() {
    const { budget, isLoading } = useGetActiveBudgetQuery();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return isDefined(budget) ? <BudgetSafeToSpendSheet budget={budget} /> : null;
}
