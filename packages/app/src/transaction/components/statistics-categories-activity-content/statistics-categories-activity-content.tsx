import { StatsByCategoriesPanel } from '../../../category/components/stats-by-categories-panel/stats-by-categories-panel';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useGetExpenseByCategoryQuery } from '../../query/use-get-expense-by-category.query';
import { useGetIncomeByCategoryQuery } from '../../query/use-get-income-by-category.query';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly income: number;
    readonly expense: number;
}

export const StatisticsCategoriesActivityContent = ({ filters, income, expense }: Props) => {
    const language = useSetting('language');
    const { incomeByCategory } = useGetIncomeByCategoryQuery(filters, language);
    const { expenseByCategory } = useGetExpenseByCategoryQuery(filters, language);

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
