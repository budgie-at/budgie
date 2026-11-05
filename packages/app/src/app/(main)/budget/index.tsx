import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { BudgetDetails } from '../../../budget/components/budget-details/budget-details';
import { BudgetPageState } from '../../../budget/components/budget-page-state/budget-page-state';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';

export default function BudgetEntryScreen() {
    const { t } = useLingui();
    const { budget, isLoading, isError } = useGetActiveBudgetQuery();

    if (!isDefined(budget)) {
        return <BudgetPageState title={t`Budget`} isLoading={isLoading} isError={isError} />;
    }

    return <BudgetDetails budget={budget} />;
}
