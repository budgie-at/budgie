import {
    type AmountRangeInterface,
    DEFAULT_TRANSACTION_FILTER,
    type TransactionFilterInterface,
    TransactionTypeEnum
} from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionFilterPageHeaderModeEnum } from '../../enum/transaction-filter-page-header-mode.enum';
import { useGetUncategorizedTransactionsQuery } from '../../query/use-get-uncategorized-transactions.query';
import { AnalyticsTransactionsPageContent } from '../analytics-transactions-page-content/analytics-transactions-page-content';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../interface/analytics-transactions-route-params.interface';

const buildTypes = (params: AnalyticsTransactionsRouteParamsInterface): TransactionTypeEnum[] => {
    if (isNotEmptyArray(params.types)) {
        return params.types;
    }

    if (isDefined(params.type)) {
        return [params.type];
    }

    return [TransactionTypeEnum.INCOME, TransactionTypeEnum.EXPENSE];
};

const buildFilterIds = (values?: number[]): number[] | null => {
    if (isNotEmptyArray(values)) {
        return values;
    }

    return null;
};

const buildAmountRange = (params: AnalyticsTransactionsRouteParamsInterface): AmountRangeInterface | null => {
    if (!isDefined(params.amountFrom) && !isDefined(params.amountTo)) {
        return null;
    }

    return { from: params.amountFrom ?? null, to: params.amountTo ?? null };
};

const buildFilters = (params: AnalyticsTransactionsRouteParamsInterface): TransactionFilterInterface => ({
    ...DEFAULT_TRANSACTION_FILTER,
    types: buildTypes(params),
    date: {
        from: isDefined(params.startDate) ? new Date(params.startDate) : null,
        to: isDefined(params.endDate) ? new Date(params.endDate) : null
    },
    accountIds: buildFilterIds(params.accountIds),
    tagIds: buildFilterIds(params.tagIds),
    amount: buildAmountRange(params)
});

export const UncategorizedAnalyticsTransactionsPage = (params: AnalyticsTransactionsRouteParamsInterface) => {
    const router = useRouter();
    const filters = buildFilters(params);
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
