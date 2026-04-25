import { StatisticsFilterInterface, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { Page } from '../../../@generic/component/page/page';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { TransactionSectionsList } from '../../../transaction/components/transaction-sections-list/transaction-sections-list';
import { TransactionFilterPageHeader } from '../../../transaction/components/transactions-page-header/transaction-filter-page-header';
import { useGetStatisticsTransactionsQuery } from '../../../transaction/query/use-get-statistics-transactions.query';

interface RouteParams {
    readonly startDate?: string;
    readonly endDate?: string;
    readonly categoryId?: string;
    readonly tagId?: string;
    readonly type?: string;
}

const buildCategoryIds = (params: RouteParams): number[] | null => {
    if (isDefined(params.categoryId)) {
        return [Number(params.categoryId)];
    }

    if (isDefined(params.type) && !isDefined(params.tagId)) {
        return [];
    }

    return null;
};

const buildFilters = (params: RouteParams): StatisticsFilterInterface => ({
    type: params.type as TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE,
    date: {
        from: isDefined(params.startDate) ? new Date(params.startDate) : null,
        to: isDefined(params.endDate) ? new Date(params.endDate) : null
    },
    categoryIds: buildCategoryIds(params),
    tagIds: isDefined(params.tagId) ? [Number(params.tagId)] : null
});

export default function AnalyticsTransactionsPage() {
    const { t } = useLingui();
    const router = useRouter();
    const params = useLocalSearchParams() as RouteParams;
    const filters = buildFilters(params);

    const { category } = useGetCategoryByIdQuery(isDefined(params.categoryId) ? Number(params.categoryId) : 0);
    const { tags } = useGetTagByIdsQuery(isDefined(params.tagId) ? [Number(params.tagId)] : []);
    const { sections, loadMore, isLoading } = useGetStatisticsTransactionsQuery(filters);

    const handleGoBack = () => void router.back();

    const isUncategorized = !isDefined(params.categoryId) && !isDefined(params.tagId) && isDefined(params.type);
    const balanceAdjustmentLabel = t`Balance Adjustment`;
    const categoriesLabel = t`Categories`;

    const listEmptyState = isLoading ? (
        <ActivityIndicator size="large" />
    ) : (
        <EmptyState
            circleIcon={UserIconNameEnum.Receipt}
            title={t`No matching transactions`}
            titleClassName="text-md text-primary font-semibold"
            description={t`Try adjusting your filters to see more results`}
            descriptionClassName="text-center max-w-[250px]"
        />
    );

    return (
        <Page
            header={
                <TransactionFilterPageHeader
                    category={category}
                    tag={tags?.[0]}
                    type={params.type}
                    startDate={params.startDate}
                    endDate={params.endDate}
                    isUncategorized={isUncategorized}
                    onGoBack={handleGoBack}
                />
            }
        >
            <TransactionSectionsList
                sections={sections}
                onEndReached={loadMore}
                listEmptyState={listEmptyState}
                balanceAdjustmentLabel={balanceAdjustmentLabel}
                categoriesLabel={categoriesLabel}
                footerSpacerMultiplier={0}
            />
        </Page>
    );
}
