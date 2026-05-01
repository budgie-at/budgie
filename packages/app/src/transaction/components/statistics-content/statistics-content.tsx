import { DEFAULT_TRANSACTION_FILTER, DatePeriodEnum, TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Activity, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { AnalyticsTabType } from '../../../@generic/type/analytics-tab.type';
import { getDateFilterByPeriod } from '../../../@generic/utils/date/get-date-filter-by-period.util';
import { useNetWorthQuery } from '../../../account/query/use-net-worth.query';
import { StatsByCategoriesPanel } from '../../../category/components/stats-by-categories-panel/stats-by-categories-panel';
import { StatsByTagsPanel } from '../../../tag/components/stats-by-tags-panel/stats-by-tags-panel';
import { useGetExpenseByCategoryQuery } from '../../query/use-get-expense-by-category.query';
import { useGetExpenseByTagQuery } from '../../query/use-get-expense-by-tag.query';
import { useGetIncomeByCategoryQuery } from '../../query/use-get-income-by-category.query';
import { useGetIncomeByTagQuery } from '../../query/use-get-income-by-tag.query';
import { useGetTotalIncomeAndExpensesQuery } from '../../query/use-get-total-income-and-expenses.query';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';
import { TransactionAnalyticsCard } from '../transaction-analytics-card/transaction-analytics-card';
import { TransactionFilters } from '../transaction-filters/transaction-filters';

interface Props {
    readonly activeTab: AnalyticsTabType;
}

export const StatisticsContent = ({ activeTab }: Props) => {
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

    const isCategoriesTab = activeTab === 'categories';
    const categoriesActivityMode = isCategoriesTab ? 'visible' : 'hidden';
    const tagsActivityMode = isCategoriesTab ? 'hidden' : 'visible';

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
                <View className="gap-y-lg">
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

                <Activity mode={categoriesActivityMode}>
                    <StatsByCategoriesPanel
                        filters={filters}
                        income={income}
                        expense={expense}
                        incomeByCategory={incomeByCategory}
                        expenseByCategory={expenseByCategory}
                    />
                </Activity>

                <Activity mode={tagsActivityMode}>
                    <StatsByTagsPanel
                        filters={filters}
                        income={income}
                        expense={expense}
                        incomeByTag={incomeByTag}
                        expenseByTag={expenseByTag}
                    />
                </Activity>

                <MenuSpacer />
            </ScrollView>
        </>
    );
};
