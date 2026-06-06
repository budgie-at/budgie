import { DEFAULT_TRANSACTION_FILTER, DatePeriodEnum, TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Activity, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { AnalyticsTabType } from '../../../@generic/type/analytics-tab.type';
import { getDateFilterByPeriod } from '../../../@generic/utils/date/get-date-filter-by-period.util';
import { useNetWorthQuery } from '../../../account/query/use-net-worth.query';
import { useGetTotalIncomeAndExpensesQuery } from '../../query/use-get-total-income-and-expenses.query';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';
import { StatisticsCategoriesActivityContent } from '../statistics-categories-activity-content/statistics-categories-activity-content';
import { StatisticsTagsActivityContent } from '../statistics-tags-activity-content/statistics-tags-activity-content';
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
                    <StatisticsCategoriesActivityContent filters={filters} income={income} expense={expense} />
                </Activity>

                <Activity mode={tagsActivityMode}>
                    <StatisticsTagsActivityContent filters={filters} income={income} expense={expense} />
                </Activity>

                <MenuSpacer />
            </ScrollView>
        </>
    );
};
