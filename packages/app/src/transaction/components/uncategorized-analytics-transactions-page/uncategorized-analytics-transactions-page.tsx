import { DEFAULT_TRANSACTION_FILTER, type TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useGetUncategorizedTransactionsQuery } from '../../query/use-get-uncategorized-transactions.query';
import { AnalyticsTransactionsPageContent } from '../analytics-transactions-page-content/analytics-transactions-page-content';
import { TransactionFilterPageHeader } from '../transactions-page-header/transaction-filter-page-header';

import type { UncategorizedAnalyticsTransactionsPagePropsInterface } from '../../interface/uncategorized-analytics-transactions-page-props.interface';

const buildTypes = (params: UncategorizedAnalyticsTransactionsPagePropsInterface['params']): TransactionTypeEnum[] => {
    if (isNotEmptyArray(params.types)) {
        return [...params.types];
    }

    if (isDefined(params.type)) {
        return [params.type];
    }

    return [TransactionTypeEnum.INCOME, TransactionTypeEnum.EXPENSE];
};

const buildFilterIds = (values?: readonly number[]): number[] | null => {
    if (isNotEmptyArray(values)) {
        return [...values];
    }

    return null;
};

const buildFilters = ({ params }: UncategorizedAnalyticsTransactionsPagePropsInterface): TransactionFilterInterface => ({
    ...DEFAULT_TRANSACTION_FILTER,
    types: buildTypes(params),
    date: {
        from: isDefined(params.startDate) ? new Date(params.startDate) : null,
        to: isDefined(params.endDate) ? new Date(params.endDate) : null
    },
    accountIds: buildFilterIds(params.accountIds),
    tagIds: buildFilterIds(params.tagIds)
});

export const UncategorizedAnalyticsTransactionsPage = ({ params }: UncategorizedAnalyticsTransactionsPagePropsInterface) => {
    const router = useRouter();
    const filters = buildFilters({ params });
    const { sections, loadMore, isLoading } = useGetUncategorizedTransactionsQuery(filters);

    const handleGoBack = () => void router.back();

    const headerTypes = filters.types ?? [];

    const header = (
        <TransactionFilterPageHeader
            isMissingCategories
            type={params.type}
            types={headerTypes}
            startDate={params.startDate}
            endDate={params.endDate}
            onGoBack={handleGoBack}
        />
    );

    return <AnalyticsTransactionsPageContent header={header} sections={sections} isLoading={isLoading} onLoadMore={loadMore} />;
};
