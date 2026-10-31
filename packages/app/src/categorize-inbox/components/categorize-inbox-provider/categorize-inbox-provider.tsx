import { buildUncategorizedFilters } from '../../../transaction/utils/build-uncategorized-filters.util';
import { CategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxActions } from '../../hook/use-categorize-inbox-actions.hook';
import { useCategorizeInbox } from '../../hook/use-categorize-inbox.hook';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';
import type { CategorizeInboxStrategyInterface } from '../../interface/categorize-inbox-strategy.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
    readonly strategy: CategorizeInboxStrategyInterface;
    readonly children: ReactNode;
}

export const CategorizeInboxProvider = ({ params, strategy, children }: Props) => {
    const inbox = useCategorizeInbox(buildUncategorizedFilters(params), strategy);
    const actions = useCategorizeInboxActions(strategy, inbox);

    const value = { ...actions, items: inbox.items, isLoading: inbox.isLoading };

    return <CategorizeInboxContext.Provider value={value}>{children}</CategorizeInboxContext.Provider>;
};
