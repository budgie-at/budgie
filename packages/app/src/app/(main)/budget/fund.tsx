import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { BudgetFundForm } from '../../../budget/components/budget-fund-form/budget-fund-form';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';

export default function BudgetFundScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { budget, isLoading } = useGetActiveBudgetQuery();
    const editingId = isDefined(id) ? Number(id) : null;

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(budget)) {
        return <Redirect href="/" />;
    }

    return <BudgetFundForm budget={budget} editingId={editingId} />;
}
