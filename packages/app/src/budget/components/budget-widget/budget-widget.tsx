import { isDefined } from '@rnw-community/shared';

import { useSetting } from '../../../settings/hook/use-setting.hook';
import { BudgetSelector } from '../../budget.selector';
import { useGetActiveBudgetQuery } from '../../query/use-get-active-budget.query';
import { BudgetEmptyState } from '../budget-empty-state/budget-empty-state';
import { BudgetWidgetCard } from '../budget-widget-card/budget-widget-card';

export const BudgetWidget = () => {
    const isEnabled = useSetting('isBudgetWidgetEnabled');
    const { budget, isLoading } = useGetActiveBudgetQuery();

    if (!isEnabled || isLoading) {
        return null;
    }

    if (!isDefined(budget)) {
        return <BudgetEmptyState testID={BudgetSelector.WidgetEmptyState} />;
    }

    return <BudgetWidgetCard budget={budget} />;
};
