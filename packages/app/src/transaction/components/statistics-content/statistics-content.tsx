import { DEFAULT_TRANSACTION_FILTER, DatePeriodEnum, TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { getDateFilterByPeriod } from '../../../@generic/utils/date/get-date-filter-by-period.util';
import { useNetWorthQuery } from '../../../account/query/use-net-worth.query';
import { StatsByCategories } from '../../../category/components/stats-by-categories/stats-by-categories';
import { StatsByTags } from '../../../tag/components/stats-by-tags/stats-by-tags';
import { TransactionAnalyticsCard } from '../transaction-analytics-card/transaction-analytics-card';
import { TransactionFilters } from '../transaction-filters/transaction-filters';
import { useGetExpenseByCategoryQuery } from '../../query/use-get-expense-by-category.query';
import { useGetExpenseByTagQuery } from '../../query/use-get-expense-by-tag.query';
import { useGetIncomeByCategoryQuery } from '../../query/use-get-income-by-category.query';
import { useGetIncomeByTagQuery } from '../../query/use-get-income-by-tag.query';
import { useGetTotalIncomeAndExpensesQuery } from '../../query/use-get-total-income-and-expenses.query';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';

export const StatisticsContent = () => {
    const { t } = useLingui();
    const [filters, setFilters] = useState<TransactionFilterInterface>({
        ...DEFAULT_TRANSACTION_FILTER,
        date: getDateFilterByPeriod(DatePeriodEnum.THIS_MONTH)
    });

    const { incomeByCategory } = useGetIncomeByCategoryQuery(filters);
    const { expenseByCategory } = useGetExpenseByCategoryQuery(filters);
    const { incomeByTag } = useGetIncomeByTagQuery(filters);
    const { expenseByTag } = useGetExpenseByTagQuery(filters);
    const { expense, income } = useGetTotalIncomeAndExpensesQuery(filters);
    const netWorth = useNetWorthQuery();
    const hasFiltersSelected = checkIfFiltersSelected(null, filters);

    return (
        <>
            <View className="pb-2xl">
                <TransactionFilters
                    accountId={null}
                    filters={filters}
                    onChange={setFilters}
                    showTypeFilter={false}
                    hasFiltersSelected={hasFiltersSelected}
                />
            </View>

            <ScrollView contentContainerClassName="gap-y-7xl py-5xl" showsVerticalScrollIndicator={false}>
                <View className="gap-y-lg ">
                    <Text className="uppercase text-secondary-foreground text-xs">
                        <Trans>Overview</Trans>
                    </Text>

                    <View className="flex-row gap-x-xl">
                        <TransactionAnalyticsCard
                            amount={expense}
                            label={t`Spent`}
                            icon={UserIconNameEnum.TrendingDown}
                            variant="destructive"
                        />
                        <TransactionAnalyticsCard amount={income} label={t`Income`} icon={UserIconNameEnum.TrendingUp} variant="positive" />
                        <TransactionAnalyticsCard amount={netWorth} label={t`Balance`} icon={UserIconNameEnum.Wallet} variant="warning" />
                    </View>
                </View>

                {isNotEmptyArray(incomeByCategory) && (
                    <StatsByCategories
                        variant="positive"
                        title={t`Income by category`}
                        stats={incomeByCategory}
                        totalAmount={income}
                        filters={filters}
                        isIncome
                    />
                )}

                {isNotEmptyArray(expenseByCategory) && (
                    <StatsByCategories
                        variant="destructive"
                        title={t`Spending by Category`}
                        stats={expenseByCategory}
                        totalAmount={expense}
                        filters={filters}
                        isIncome={false}
                    />
                )}

                {isNotEmptyArray(incomeByTag) && (
                    <StatsByTags
                        variant="positive"
                        title={t`Income by Tag`}
                        stats={incomeByTag}
                        totalAmount={income}
                        filters={filters}
                        isIncome
                    />
                )}

                {isNotEmptyArray(expenseByTag) && (
                    <StatsByTags
                        variant="destructive"
                        title={t`Spending by Tag`}
                        stats={expenseByTag}
                        totalAmount={expense}
                        filters={filters}
                        isIncome={false}
                    />
                )}
                <MenuSpacer />
            </ScrollView>
        </>
    );
};
