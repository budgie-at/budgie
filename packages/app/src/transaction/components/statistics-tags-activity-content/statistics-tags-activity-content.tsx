import { StatsByTagsPanel } from '../../../tag/components/stats-by-tags-panel/stats-by-tags-panel';
import { useGetExpenseByTagQuery } from '../../query/use-get-expense-by-tag.query';
import { useGetIncomeByTagQuery } from '../../query/use-get-income-by-tag.query';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly income: number;
    readonly expense: number;
}

export const StatisticsTagsActivityContent = ({ filters, income, expense }: Props) => {
    const { incomeByTag } = useGetIncomeByTagQuery(filters);
    const { expenseByTag } = useGetExpenseByTagQuery(filters);

    return <StatsByTagsPanel filters={filters} income={income} expense={expense} incomeByTag={incomeByTag} expenseByTag={expenseByTag} />;
};
