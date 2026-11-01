import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { StatsByCategoriesPanel } from '../../../category/components/stats-by-categories-panel/stats-by-categories-panel';
import { useGetStatisticsByCategoryQuery } from '../../query/use-get-statistics-by-category.query';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly filters: TransactionFilterInterface;
}

export const StatisticsCategoriesActivityContent = ({ filters }: Props) => {
    const { incomeByCategory, expenseByCategory, isLoading } = useGetStatisticsByCategoryQuery(filters);

    return (
        <LoadingContent isLoading={isLoading}>
            <StatsByCategoriesPanel filters={filters} incomeByCategory={incomeByCategory} expenseByCategory={expenseByCategory} />
        </LoadingContent>
    );
};
