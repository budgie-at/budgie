import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../../../../../@generic/component/loading-screen/loading-screen';
import { BudgetEventDetails } from '../../../../../budget/components/budget-event-details/budget-event-details';
import { useGetEventBudgetQuery } from '../../../../../budget/query/use-get-event-budget.query';

export default function BudgetEventDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { budget, isLoading } = useGetEventBudgetQuery(Number(id));

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(budget)) {
        return <Redirect href="/budget" />;
    }

    return <BudgetEventDetails budget={budget} />;
}
