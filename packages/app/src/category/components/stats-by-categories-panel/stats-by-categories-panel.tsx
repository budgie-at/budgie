import { TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { AnalyticsPageSelector } from '../../../app/(tabs)/analytics-page.selector';
import { CategoryStatInterface } from '../../interface/category-stat.interface';
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
        return (
            <EmptyState
                testID={AnalyticsPageSelector.CategoriesEmptyState}
                circleIcon={UserIconNameEnum.Folder}
                title={t`No categories in this period`}
                description={t`Add transactions to see how your spending breaks down by category.`}
            />
        );
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
