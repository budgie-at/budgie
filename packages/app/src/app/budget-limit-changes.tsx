import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { BudgetLimitChangesSheet } from '../budget/components/budget-limit-changes-sheet/budget-limit-changes-sheet';
import { BudgetSheetState } from '../budget/components/budget-sheet-state/budget-sheet-state';
import { useGetActiveBudgetQuery } from '../budget/query/use-get-active-budget.query';

export default function BudgetLimitChangesRoute() {
    const { t } = useLingui();
    const { budget, isLoading, isError } = useGetActiveBudgetQuery();

    if (!isDefined(budget)) {
        return <BudgetSheetState title={t`Limit changes`} isLoading={isLoading} isError={isError} />;
    }

    return <BudgetLimitChangesSheet budget={budget} />;
}
