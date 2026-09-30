import { StatsByTagsPanel } from '../../../tag/components/stats-by-tags-panel/stats-by-tags-panel';
import { useGetStatisticsByTagQuery } from '../../query/use-get-statistics-by-tag.query';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly income: number;
    readonly expense: number;
}

export const StatisticsTagsActivityContent = ({ filters, income, expense }: Props) => {
    const { incomeByTag, expenseByTag } = useGetStatisticsByTagQuery(filters);

    return <StatsByTagsPanel filters={filters} income={income} expense={expense} incomeByTag={incomeByTag} expenseByTag={expenseByTag} />;
};
