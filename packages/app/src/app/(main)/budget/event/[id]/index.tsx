import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { BudgetEventDetails } from '../../../../../budget/components/budget-event-details/budget-event-details';
import { BudgetPageState } from '../../../../../budget/components/budget-page-state/budget-page-state';
import { useGetEventBudgetQuery } from '../../../../../budget/query/use-get-event-budget.query';

export default function BudgetEventDetailsScreen() {
    const { t } = useLingui();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { budget, isLoading, isError } = useGetEventBudgetQuery(Number(id));

    if (!isDefined(budget)) {
        return <BudgetPageState title={t`Event budget`} isLoading={isLoading} isError={isError} />;
    }

    return <BudgetEventDetails budget={budget} />;
}
