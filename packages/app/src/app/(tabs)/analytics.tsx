import { DEFAULT_TRANSACTION_FILTER, DatePeriodEnum, TransactionFilterInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Page } from '../../@generic/component/page/page';
import { PageHeader } from '../../@generic/component/page-header/page-header';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { getDateFilterByPeriod } from '../../@generic/utils/date/get-date-filter-by-period.util';
import { useNetWorthQuery } from '../../account/query/use-net-worth.query';
import { StatsByCategories } from '../../category/components/stats-by-categories/stats-by-categories';
import { TransactionAnalyticsCard } from '../../transaction/components/transaction-analytics-card/transaction-analytics-card';
import { TransactionFilters } from '../../transaction/components/transaction-filters/transaction-filters';
import { useGetExpenseByCategoryQuery } from '../../transaction/query/use-get-expense-by-category.query';
import { useGetIncomeByCategoryQuery } from '../../transaction/query/use-get-income-by-category.query';
import { useGetTotalIncomeAndExpensesQuery } from '../../transaction/query/use-get-total-income-and-expenses.query';
import { checkIfFiltersSelected } from '../../transaction/utils/check-if-filters-selected.util';

export default function StatisticsPage() {
    const { t } = useLingui();
    const [filters, setFilters] = useState<TransactionFilterInterface>({
        ...DEFAULT_TRANSACTION_FILTER,
        date: getDateFilterByPeriod(DatePeriodEnum.THIS_MONTH)
    });

    const { incomeByCategory } = useGetIncomeByCategoryQuery(filters);
    const { expenseByCategory } = useGetExpenseByCategoryQuery(filters);
    const { expense, income } = useGetTotalIncomeAndExpensesQuery(filters);

    const netWorth = useNetWorthQuery();

    const getIncomePercentageLabel = (percentage: number) => t`${percentage}% of income`;
    const getExpensesPercentageLabel = (percentage: number) => t`${percentage}% of expenses`;

    const hasFiltersSelected = checkIfFiltersSelected(null, filters);

    return (
        <Page header={<PageHeader className="border-b-0" size="md" title={t`Statistics`} />}>
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
                        <TransactionAnalyticsCard amount={expense} label={t`Spent`} icon="TrendingDown" variant="destructive" />
                        <TransactionAnalyticsCard amount={income} label={t`Income`} icon="TrendingUp" variant="positive" />
                        <TransactionAnalyticsCard amount={netWorth} label={t`Balance`} icon="Wallet" variant="warning" />
                    </View>
                </View>

                {isNotEmptyArray(incomeByCategory) ? (
                    <StatsByCategories
                        getPercentageLabel={getIncomePercentageLabel}
                        variant="positive"
                        title={t`Income by category`}
                        stats={incomeByCategory}
                        totalAmount={income}
                    />
                ) : null}

                {isNotEmptyArray(expenseByCategory) ? (
                    <StatsByCategories
                        getPercentageLabel={getExpensesPercentageLabel}
                        variant="destructive"
                        title={t`Spending by Category`}
                        stats={expenseByCategory}
                        totalAmount={convertFromMicroUnits(expense)}
                    />
                ) : null}
            </ScrollView>
        </Page>
    );
}
