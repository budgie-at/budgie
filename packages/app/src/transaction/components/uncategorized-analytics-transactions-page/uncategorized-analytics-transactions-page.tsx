import { useRouter } from 'expo-router';

import { TransactionFilterPageHeaderModeEnum } from '../../enum/transaction-filter-page-header-mode.enum';
import { useGetUncategorizedTransactionsQuery } from '../../query/use-get-uncategorized-transactions.query';
import { buildUncategorizedFilters } from '../../utils/build-uncategorized-filters.util';
import { AnalyticsTransactionsPageContent } from '../analytics-transactions-page-content/analytics-transactions-page-content';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../interface/analytics-transactions-route-params.interface';

export const UncategorizedAnalyticsTransactionsPage = (params: AnalyticsTransactionsRouteParamsInterface) => {
    const router = useRouter();
    const filters = buildUncategorizedFilters(params);
    const { sections, loadMore, isLoading } = useGetUncategorizedTransactionsQuery(filters);

    const handleGoBack = () => void router.back();

    const selectedType = filters.types?.length === 1 ? filters.types[0] : params.type;
    const headerProps = {
        mode: TransactionFilterPageHeaderModeEnum.MISSING_CATEGORIES,
        type: selectedType,
        types: filters.types,
        startDate: params.startDate,
        endDate: params.endDate,
        onGoBack: handleGoBack
    };

    return <AnalyticsTransactionsPageContent headerProps={headerProps} sections={sections} isLoading={isLoading} onLoadMore={loadMore} />;
};
