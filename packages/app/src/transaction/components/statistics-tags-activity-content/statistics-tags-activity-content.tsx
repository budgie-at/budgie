import { convertToMicroUnits } from '@budgie/contracts';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { StatsByTagsPanel } from '../../../tag/components/stats-by-tags-panel/stats-by-tags-panel';
import { useGetStatisticsByTagQuery } from '../../query/use-get-statistics-by-tag.query';
import { useGetTotalIncomeAndExpensesQuery } from '../../query/use-get-total-income-and-expenses.query';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly filters: TransactionFilterInterface;
}

export const StatisticsTagsActivityContent = ({ filters }: Props) => {
    const { incomeByTag, expenseByTag, isLoading: isTagsLoading } = useGetStatisticsByTagQuery(filters);
    const { income, expense, isLoading: isTotalsLoading } = useGetTotalIncomeAndExpensesQuery(filters);
    const isLoading = isTagsLoading || isTotalsLoading;

    return (
        <LoadingContent isLoading={isLoading}>
            <StatsByTagsPanel
                filters={filters}
                income={convertToMicroUnits(income)}
                expense={convertToMicroUnits(expense)}
                incomeByTag={incomeByTag}
                expenseByTag={expenseByTag}
            />
        </LoadingContent>
    );
};
