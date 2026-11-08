import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { BudgetSafeToSpendHeader } from '../budget/components/budget-safe-to-spend-header/budget-safe-to-spend-header';
import { BudgetSafeToSpendSheet } from '../budget/components/budget-safe-to-spend-sheet/budget-safe-to-spend-sheet';
import { BudgetSheetState } from '../budget/components/budget-sheet-state/budget-sheet-state';
import { useGetActiveBudgetQuery } from '../budget/query/use-get-active-budget.query';
import { useGetEventBudgetQuery } from '../budget/query/use-get-event-budget.query';

export default function BudgetSafeToSpendRoute() {
    const { t } = useLingui();
    const { eventId } = useLocalSearchParams<{ eventId?: string }>();
    const activeBudget = useGetActiveBudgetQuery();
    const eventBudget = useGetEventBudgetQuery(Number(eventId ?? 0));
    const { budget, isLoading, isError } = isDefined(eventId) ? eventBudget : activeBudget;

    if (!isDefined(budget)) {
        return <BudgetSheetState title={t`Safe to spend`} isLoading={isLoading} isError={isError} header={<BudgetSafeToSpendHeader />} />;
    }

    return <BudgetSafeToSpendSheet budget={budget} />;
}
