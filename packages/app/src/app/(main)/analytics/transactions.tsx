import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { Page } from '../../../@generic/component/page/page';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { TransactionList } from '../../../transaction/components/transaction-list/transaction-list';
import { TransactionsPageHeader } from '../../../transaction/components/transactions-page-header/transactions-page-header';

interface RouteParams {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    tagId?: string;
    type?: string;
    uncategorized?: string;
}

const buildCategoryIds = (params: RouteParams): number[] | null => {
    if (params.uncategorized === 'true') {
        return [];
    }

    if (isDefined(params.categoryId)) {
        return [Number(params.categoryId)];
    }

    return null;
};

const buildFilters = (params: RouteParams): TransactionFilterInterface => ({
    ...DEFAULT_TRANSACTION_FILTER,
    date: {
        from: isDefined(params.startDate) ? new Date(params.startDate) : null,
        to: isDefined(params.endDate) ? new Date(params.endDate) : null
    },
    categoryIds: buildCategoryIds(params),
    tagIds: isDefined(params.tagId) ? [Number(params.tagId)] : null,
    types: isDefined(params.type) ? [params.type as TransactionTypeEnum] : null
});

export default function AnalyticsTransactionsPage() {
    const router = useRouter();
    const params = useLocalSearchParams() as RouteParams;
    const filters = buildFilters(params);

    const { category } = useGetCategoryByIdQuery(isDefined(params.categoryId) ? Number(params.categoryId) : 0);
    const { tags } = useGetTagByIdsQuery(isDefined(params.tagId) ? [Number(params.tagId)] : []);

    const handleGoBack = () => void router.back();

    return (
        <Page
            header={
                <TransactionsPageHeader
                    uncategorized={params.uncategorized}
                    category={category}
                    tag={tags?.[0]}
                    type={params.type}
                    startDate={params.startDate}
                    endDate={params.endDate}
                    onGoBack={handleGoBack}
                />
            }
        >
            <TransactionList filters={filters} showFilters={false} />
        </Page>
    );
}
