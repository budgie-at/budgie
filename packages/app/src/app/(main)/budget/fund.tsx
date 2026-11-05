import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { BudgetFundForm } from '../../../budget/components/budget-fund-form/budget-fund-form';
import { BudgetPageState } from '../../../budget/components/budget-page-state/budget-page-state';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';

export default function BudgetFundScreen() {
    const { t } = useLingui();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { budget, isLoading, isError } = useGetActiveBudgetQuery();
    const editingId = isDefined(id) ? Number(id) : null;

    if (!isDefined(budget)) {
        return <BudgetPageState title={t`Set aside`} isLoading={isLoading} isError={isError} />;
    }

    return <BudgetFundForm budget={budget} editingId={editingId} />;
}
