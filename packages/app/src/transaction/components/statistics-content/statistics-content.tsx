import { TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Activity } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { AnalyticsTabType } from '../../../@generic/type/analytics-tab.type';
import { useNetWorthQuery } from '../../../account/query/use-net-worth.query';
import { RunwayContent } from '../../../runway/component/runway-content/runway-content';
import { useGetTotalIncomeAndExpensesQuery } from '../../query/use-get-total-income-and-expenses.query';
import { StatisticsCategoriesActivityContent } from '../statistics-categories-activity-content/statistics-categories-activity-content';
import { StatisticsTagsActivityContent } from '../statistics-tags-activity-content/statistics-tags-activity-content';
import { TransactionAnalyticsCard } from '../transaction-analytics-card/transaction-analytics-card';

interface Props {
    readonly activeTab: AnalyticsTabType;
    readonly filters: TransactionFilterInterface;
    readonly contentInsetTop: number;
}

export const StatisticsContent = ({ activeTab, filters, contentInsetTop }: Props) => {
    const { t } = useLingui();

    const { expense, income } = useGetTotalIncomeAndExpensesQuery(filters);
    const netWorth = useNetWorthQuery();

    const isRunwayTab = activeTab === 'runway';
    const isCategoriesTab = activeTab === 'categories';
    const categoriesActivityMode = isCategoriesTab ? 'visible' : 'hidden';
    const tagsActivityMode = isCategoriesTab ? 'hidden' : 'visible';
    const contentContainerStyle = { paddingTop: contentInsetTop };

    if (isRunwayTab) {
        return <RunwayContent contentContainerStyle={contentContainerStyle} />;
    }

    return (
        <ScrollView
            contentContainerClassName="gap-y-7xl pb-5xl"
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
        >
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
    );
};
