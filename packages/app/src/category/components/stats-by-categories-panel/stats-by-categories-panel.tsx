import { TransactionFilterInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { CategoryStatInterface } from '../../interface/category-stat.interface';
import { CategoriesFeatureIntro } from '../categories-feature-intro/categories-feature-intro';
import { StatsByCategories } from '../stats-by-categories/stats-by-categories';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly income: number;
    readonly expense: number;
    readonly incomeByCategory: CategoryStatInterface[];
    readonly expenseByCategory: CategoryStatInterface[];
}

export const StatsByCategoriesPanel = ({ filters, income, expense, incomeByCategory, expenseByCategory }: Props) => {
    const { t } = useLingui();

    const hasIncomeStats = isNotEmptyArray(incomeByCategory);
    const hasExpenseStats = isNotEmptyArray(expenseByCategory);

    if (!hasIncomeStats && !hasExpenseStats) {
        return <CategoriesFeatureIntro />;
    }

    return (
        <View className="gap-y-7xl">
            {hasIncomeStats && (
                <StatsByCategories
                    variant="positive"
                    title={t`Income by category`}
                    stats={incomeByCategory}
                    totalAmount={income}
                    filters={filters}
                    isIncome
                />
            )}

            {hasExpenseStats && (
                <StatsByCategories
                    variant="destructive"
                    title={t`Spending by Category`}
                    stats={expenseByCategory}
                    totalAmount={expense}
                    filters={filters}
                    isIncome={false}
                />
            )}
        </View>
    );
};
