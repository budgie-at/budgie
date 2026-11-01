import { useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../@generic/component/loading-screen/loading-screen';
import { BudgetSafeToSpendSheet } from '../budget/components/budget-safe-to-spend-sheet/budget-safe-to-spend-sheet';
import { useGetActiveBudgetQuery } from '../budget/query/use-get-active-budget.query';
import { useGetEventBudgetQuery } from '../budget/query/use-get-event-budget.query';

export default function BudgetSafeToSpendRoute() {
    const { eventId } = useLocalSearchParams<{ eventId?: string }>();
    const activeBudget = useGetActiveBudgetQuery();
    const eventBudget = useGetEventBudgetQuery(Number(eventId ?? 0));
    const { budget, isLoading } = isDefined(eventId) ? eventBudget : activeBudget;

    if (isLoading) {
        return <LoadingScreen />;
    }

    return isDefined(budget) ? <BudgetSafeToSpendSheet budget={budget} /> : null;
}
