import { DatePeriodEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../@generic/components/card/card';
import { CircleIcon } from '../../@generic/components/circle-icon/circle-icon';
import { Page } from '../../@generic/components/page/page';
import { PageHeader } from '../../@generic/components/page-header/page-header';
import { ICONS } from '../../@generic/constant/icons.constant';
import { getDateFilterByPeriod } from '../../@generic/utils/date/get-date-filter-by-period.util';
import { useNetWorthQuery } from '../../account/query/use-net-worth.query';
import { StatsByCategories } from '../../category/components/stats-by-categories/stats-by-categories';
import { useFormatMoney } from '../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useGetExpenseByCategoryQuery } from '../../transaction/query/use-get-expense-by-category.query';
import { useGetIncomeByCategoryQuery } from '../../transaction/query/use-get-income-by-category.query';
import { useGetTotalIncomeAndExpensesQuery } from '../../transaction/query/use-get-total-income-and-expenses.query';

const range = getDateFilterByPeriod(DatePeriodEnum.ALL_TIME) ?? { from: null, to: null };

export default function StatisticsPage() {
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const format = useFormatMoney(decimalPlaces, defaultInstrument.code);

    const { expense, income } = useGetTotalIncomeAndExpensesQuery(range);
    const { incomeByCategory } = useGetIncomeByCategoryQuery(range);
    const { expenseByCategory } = useGetExpenseByCategoryQuery(range);

    const netWorth = useNetWorthQuery();

    const getIncomePercentageLabel = (percentage: number) => t`${percentage}% of income`;
    const getExpensesPercentageLabel = (percentage: number) => t`${percentage}% of expenses`;

    return (
        <Page header={<PageHeader className="border-b-0" size="md" title={t`Statistics`} />}>
            <View className="gap-y-7xl">
                <View className="gap-y-lg ">
                    <Text className="uppercase text-secondary-foreground text-xs">
                        <Trans>Overview</Trans>
                    </Text>

                    <View className="flex-row gap-x-xl">
                        <Card className="flex-1 items-center p-[16px]">
                            <CircleIcon border={false} className="mb-lg" icon={ICONS.TrendingDown} variant="destructive" />

                            <Text className="text-xs text-secondary-foreground">
                                <Trans>Spent</Trans>
                            </Text>

                            <Text className="text-primary text-md">{format(expense)}</Text>
                        </Card>

                        <Card className="flex-1 items-center p-[16px]">
                            <CircleIcon border={false} className="mb-lg" icon={ICONS.TrendingUp} variant="positive" />

                            <Text className="text-xs text-secondary-foreground">
                                <Trans>Income</Trans>
                            </Text>

                            <Text className="text-primary text-md">{format(income)}</Text>
                        </Card>

                        <Card className="flex-1 items-center p-[16px]">
                            <CircleIcon border={false} className="mb-lg" icon={ICONS.Wallet} variant="warning" />

                            <Text className="text-xs text-secondary-foreground">
                                <Trans>Balance</Trans>
                            </Text>

                            <Text className="text-primary text-md">{format(netWorth)}</Text>
                        </Card>
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
                        totalAmount={expense}
                    />
                ) : null}
            </View>
        </Page>
    );
}
