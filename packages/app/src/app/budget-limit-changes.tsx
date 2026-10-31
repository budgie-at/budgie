import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../@generic/component/loading-screen/loading-screen';
import { BudgetLimitChangesSheet } from '../budget/components/budget-limit-changes-sheet/budget-limit-changes-sheet';
import { useGetActiveBudgetQuery } from '../budget/query/use-get-active-budget.query';

export default function BudgetLimitChangesRoute() {
    const { budget, isLoading } = useGetActiveBudgetQuery();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return isDefined(budget) ? <BudgetLimitChangesSheet budget={budget} /> : null;
}
