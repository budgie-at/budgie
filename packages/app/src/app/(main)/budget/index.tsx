import { Redirect } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';

export default function BudgetEntryScreen() {
    const { budget, isLoading } = useGetActiveBudgetQuery();

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(budget)) {
        return <Redirect href="/" />;
    }

    const href = { pathname: '/budget/edit' as const, params: { id: String(budget.id) } };

    return <Redirect href={href} />;
}
