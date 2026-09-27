import { CategorizeInboxStrategyContext } from '../../context/categorize-inbox-strategy.context';
import { useCategorizeInboxTagStrategy } from '../../hook/use-categorize-inbox-tag-strategy.hook';
import { CategorizeInboxPage } from '../categorize-inbox-page/categorize-inbox-page';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const CategorizeInboxTagPage = ({ params }: Props) => {
    const strategy = useCategorizeInboxTagStrategy();

    return (
        <CategorizeInboxStrategyContext.Provider value={strategy}>
            <CategorizeInboxPage params={params} />
        </CategorizeInboxStrategyContext.Provider>
    );
};
