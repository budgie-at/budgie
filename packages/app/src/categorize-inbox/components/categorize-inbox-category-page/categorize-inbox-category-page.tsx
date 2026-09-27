import { CategorizeInboxStrategyContext } from '../../context/categorize-inbox-strategy.context';
import { useCategorizeInboxCategoryStrategy } from '../../hook/use-categorize-inbox-category-strategy.hook';
import { CategorizeInboxPage } from '../categorize-inbox-page/categorize-inbox-page';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const CategorizeInboxCategoryPage = ({ params }: Props) => {
    const strategy = useCategorizeInboxCategoryStrategy();

    return (
        <CategorizeInboxStrategyContext.Provider value={strategy}>
            <CategorizeInboxPage params={params} />
        </CategorizeInboxStrategyContext.Provider>
    );
};
