import { type StatisticsFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { useGetStatisticsTransactionsQuery } from '../../query/use-get-statistics-transactions.query';
import { AnalyticsTransactionsPageContent } from '../analytics-transactions-page-content/analytics-transactions-page-content';
import { TransactionFilterPageHeader } from '../transactions-page-header/transaction-filter-page-header';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../interface/analytics-transactions-route-params.interface';
import type { StatisticsAnalyticsTransactionsPagePropsInterface } from '../../interface/statistics-analytics-transactions-page-props.interface';

const UNTAGGED_PARAM = 'untagged';

const isUntaggedNav = (params: AnalyticsTransactionsRouteParamsInterface): boolean => params.tagId === UNTAGGED_PARAM;

const buildCategoryIds = (params: AnalyticsTransactionsRouteParamsInterface): number[] | null => {
    if (isDefined(params.categoryId)) {
        return [Number(params.categoryId)];
    }

    if (isUntaggedNav(params)) {
        return null;
    }

    if (isDefined(params.type) && !isDefined(params.tagId)) {
        return [];
    }

    return null;
};

const buildTagIds = (params: AnalyticsTransactionsRouteParamsInterface): number[] | null => {
    if (isUntaggedNav(params)) {
        return [];
    }

    if (isDefined(params.tagId)) {
        return [Number(params.tagId)];
    }

    return null;
};

const buildFilters = (params: AnalyticsTransactionsRouteParamsInterface): StatisticsFilterInterface => ({
    type: params.type === TransactionTypeEnum.INCOME ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE,
    date: {
        from: isDefined(params.startDate) ? new Date(params.startDate) : null,
        to: isDefined(params.endDate) ? new Date(params.endDate) : null
    },
    categoryIds: buildCategoryIds(params),
    tagIds: buildTagIds(params)
});

export const StatisticsAnalyticsTransactionsPage = ({ params }: StatisticsAnalyticsTransactionsPagePropsInterface) => {
    const router = useRouter();
    const filters = buildFilters(params);

    const { category } = useGetCategoryByIdQuery(isDefined(params.categoryId) ? Number(params.categoryId) : 0);
    const tagIdsForLookup = isUntaggedNav(params) || !isDefined(params.tagId) ? [] : [Number(params.tagId)];
    const { tags } = useGetTagByIdsQuery(tagIdsForLookup);
    const { sections, loadMore, isLoading } = useGetStatisticsTransactionsQuery(filters);

    const handleGoBack = () => void router.back();

    const isUntagged = isUntaggedNav(params);
    const isUncategorized = !isUntagged && !isDefined(params.categoryId) && !isDefined(params.tagId) && isDefined(params.type);
    const selectedTag = tags?.[0] ?? null;

    const header = (
        <TransactionFilterPageHeader
            category={category}
            tag={selectedTag}
            type={params.type}
            startDate={params.startDate}
            endDate={params.endDate}
            isUncategorized={isUncategorized}
            isUntagged={isUntagged}
            onGoBack={handleGoBack}
        />
    );

    return <AnalyticsTransactionsPageContent header={header} sections={sections} isLoading={isLoading} onLoadMore={loadMore} />;
};
