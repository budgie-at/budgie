import { CategorizeInboxCategoryPage } from '../../../categorize-inbox/components/categorize-inbox-category-page/categorize-inbox-category-page';
import { CategorizeInboxTagPage } from '../../../categorize-inbox/components/categorize-inbox-tag-page/categorize-inbox-tag-page';
import { AnalyticsTransactionsModeEnum } from '../../enum/analytics-transactions-mode.enum';
import { buildTransactionFilterKey } from '../../utils/build-transaction-filter-key.util';
import { buildUncategorizedFilters } from '../../utils/build-uncategorized-filters.util';
import { StatisticsAnalyticsTransactionsPage } from '../statistics-analytics-transactions-page/statistics-analytics-transactions-page';
import { UncategorizedAnalyticsTransactionsPage } from '../uncategorized-analytics-transactions-page/uncategorized-analytics-transactions-page';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../interface/analytics-transactions-route-params.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const AnalyticsTransactionsRoute = ({ params }: Props) => {
    const inboxKey = buildTransactionFilterKey(buildUncategorizedFilters(params));

    if (params.mode === AnalyticsTransactionsModeEnum.UNCATEGORIZED) {
        return <UncategorizedAnalyticsTransactionsPage {...params} />;
    }

    if (params.mode === AnalyticsTransactionsModeEnum.CATEGORIZE) {
        return <CategorizeInboxCategoryPage key={inboxKey} params={params} />;
    }

    if (params.mode === AnalyticsTransactionsModeEnum.TAG_INBOX) {
        return <CategorizeInboxTagPage key={inboxKey} params={params} />;
    }

    return <StatisticsAnalyticsTransactionsPage {...params} />;
};
