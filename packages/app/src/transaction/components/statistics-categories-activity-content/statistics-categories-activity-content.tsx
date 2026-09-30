import { StatsByCategoriesPanel } from '../../../category/components/stats-by-categories-panel/stats-by-categories-panel';
import { useGetStatisticsByCategoryQuery } from '../../query/use-get-statistics-by-category.query';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly income: number;
    readonly expense: number;
}

export const StatisticsCategoriesActivityContent = ({ filters, income, expense }: Props) => {
    const { incomeByCategory, expenseByCategory } = useGetStatisticsByCategoryQuery(filters);

    return (
        <StatsByCategoriesPanel
            filters={filters}
            income={income}
            expense={expense}
            incomeByCategory={incomeByCategory}
            expenseByCategory={expenseByCategory}
        />
    );
};
