import { DEFAULT_TRANSACTION_FILTER, type StatisticsFilterInterface, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { UNTAGGED_TAG_ID_PARAM } from '../../constant/untagged-tag-id-param.constant';
import { StatisticsCategoryIdsContext } from '../../context/statistics-category-ids.context';
import { AnalyticsTransactionsModeEnum } from '../../enum/analytics-transactions-mode.enum';
import { TransactionFilterPageHeaderModeEnum } from '../../enum/transaction-filter-page-header-mode.enum';
import { useGetStatisticsTransactionsQuery } from '../../query/use-get-statistics-transactions.query';
import { buildUncategorizedFilters } from '../../utils/build-uncategorized-filters.util';
import { getSingleAccountId } from '../../utils/get-single-account-id.util';
import { getStatisticsDrillDownEntity } from '../../utils/get-statistics-drill-down-entity.util';
import { parseRouteDateRange } from '../../utils/parse-route-date-range.util';
import { AnalyticsTransactionsPageContent } from '../analytics-transactions-page-content/analytics-transactions-page-content';
import { StatisticsDrillDownEmptyState } from '../statistics-drill-down-empty-state/statistics-drill-down-empty-state';
import { StatisticsDrillDownSummary } from '../statistics-drill-down-summary/statistics-drill-down-summary';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../interface/analytics-transactions-route-params.interface';

const isUntaggedNav = (params: AnalyticsTransactionsRouteParamsInterface): boolean => params.tagId === UNTAGGED_TAG_ID_PARAM;

const buildCategoryIds = (params: AnalyticsTransactionsRouteParamsInterface): number[] | null => {
    if (params.mode === AnalyticsTransactionsModeEnum.BUDGET_OTHER) {
        return null;
    }

    if (isDefined(params.categoryId)) {
        return [Number(params.categoryId)];
    }

    if (isUntaggedNav(params)) {
        return params.categoryIds ?? null;
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

const buildFilters = (params: AnalyticsTransactionsRouteParamsInterface): StatisticsFilterInterface => {
    const { accountIds, amount } = buildUncategorizedFilters(params);

    return {
        type: params.type === TransactionTypeEnum.INCOME || params.type === TransactionTypeEnum.EXPENSE ? params.type : null,
        date: parseRouteDateRange(params.startDate, params.endDate),
        categoryIds: buildCategoryIds(params),
        excludedCategoryIds: params.excludedCategoryIds ?? null,
        tagIds: buildTagIds(params),
        accountIds,
        amount
    };
};

const getHeaderMode = (params: AnalyticsTransactionsRouteParamsInterface): TransactionFilterPageHeaderModeEnum | null => {
    if (params.mode === AnalyticsTransactionsModeEnum.BUDGET_OTHER) {
        return TransactionFilterPageHeaderModeEnum.BUDGET_OTHER;
    }

    if (isUntaggedNav(params)) {
        return TransactionFilterPageHeaderModeEnum.UNTAGGED;
    }

    const isUncategorized = !isDefined(params.categoryId) && !isDefined(params.tagId) && isDefined(params.type);
    if (isUncategorized) {
        return TransactionFilterPageHeaderModeEnum.MISSING_CATEGORIES;
    }

    return null;
};

export const StatisticsAnalyticsTransactionsPage = (params: AnalyticsTransactionsRouteParamsInterface) => {
    const filters = buildFilters(params);

    const { category } = useGetCategoryByIdQuery(isDefined(params.categoryId) ? Number(params.categoryId) : 0);
    const tagIdsForLookup = isUntaggedNav(params) || !isDefined(params.tagId) ? [] : [Number(params.tagId)];
    const { tags } = useGetTagByIdsQuery(tagIdsForLookup);
    const { sections, loadMore, isLoading } = useGetStatisticsTransactionsQuery(filters);

    const selectedTag = tags?.[0] ?? null;
    const hasFiltersSelected = isNotEmptyArray(filters.accountIds) || isDefined(filters.amount);
    const drillDownEntity = getStatisticsDrillDownEntity(params);
    const summaryType = params.type === TransactionTypeEnum.INCOME ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE;
    const summaryFilters = { ...DEFAULT_TRANSACTION_FILTER, date: filters.date, accountIds: filters.accountIds, amount: filters.amount };
    const summary = isDefined(drillDownEntity) ? (
        <StatisticsDrillDownSummary
            kind={drillDownEntity.kind}
            entityId={drillDownEntity.entityId}
            type={summaryType}
            filters={summaryFilters}
        />
    ) : null;
    const headerProps = {
        category,
        tag: selectedTag,
        type: params.type,
        date: filters.date,
        mode: getHeaderMode(params)
    };

    return (
        <StatisticsCategoryIdsContext.Provider value={filters.categoryIds}>
            <AnalyticsTransactionsPageContent
                headerProps={headerProps}
                summary={summary}
                sections={sections}
                emptyState={
                    <StatisticsDrillDownEmptyState isLoading={isLoading} hasFiltersSelected={hasFiltersSelected} type={summaryType} />
                }
                onLoadMore={loadMore}
                accountId={getSingleAccountId(filters.accountIds)}
            />
        </StatisticsCategoryIdsContext.Provider>
    );
};
