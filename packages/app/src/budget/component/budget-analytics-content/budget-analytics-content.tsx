/* eslint-disable max-lines-per-function, @rnw-community/no-complex-jsx-logic, lingui/no-unlocalized-strings, no-plusplus */
import { BudgetEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useAllCategoriesQuery } from '../../../category/query/use-all-categories.query';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { MS_PER_DAY } from '../../constant/ms-per-day.constant';
import { useGetBudgetActualSpendingQuery } from '../../query/use-get-budget-actual-spending.query';
import { useGetBudgetAllocationsQuery } from '../../query/use-get-budget-allocations.query';
import { useGetBudgetIncomeQuery } from '../../query/use-get-budget-income.query';
import { useGetSpendingByCategoryQuery } from '../../query/use-get-spending-by-category.query';
import { calculateEffectivePlannedAmount, calculateTotalPlannedAmount } from '../../util/calculate-effective-planned-amount.util';
import { BudgetHistoricalPeriodCard } from '../budget-historical-period-card/budget-historical-period-card';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetAnalyticsContent = ({ budget }: Props) => {
    const { t } = useLingui();
    const formatDigits = useFormatDigits(0);

    const { allocations } = useGetBudgetAllocationsQuery(budget.id);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { categories } = useAllCategoriesQuery();

    const currencySymbol = instrument?.symbol ?? '';

    const categoryIds = useMemo(
        () => allocations.map(alloc => alloc.categoryId).filter((id): id is number => isDefined(id)),
        [allocations]
    );

    const periodDates = useMemo(() => {
        const now = new Date();
        const { startDay } = budget;
        const year = now.getFullYear();
        const month = now.getMonth();

        let startDate = new Date(year, month, startDay);
        if (startDate > now) {
            startDate = new Date(year, month - 1, startDay);
        }

        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDay);

        return { startDate, endDate };
    }, [budget]);

    const historicalPeriods = useMemo(() => {
        const { startDay } = budget;
        const periods: Array<{ label: string; startDate: Date; endDate: Date }> = [];

        for (let i = 1; i <= 3; i++) {
            const currentStart = periodDates.startDate;
            const startDate = new Date(currentStart.getFullYear(), currentStart.getMonth() - i, startDay);
            const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDay);

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const label = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;

            periods.push({ label, startDate, endDate });
        }

        return periods;
    }, [budget, periodDates.startDate]);

    const { totalSpent } = useGetBudgetActualSpendingQuery({
        categoryIds,
        startDate: periodDates.startDate,
        endDate: periodDates.endDate
    });

    const { totalIncome } = useGetBudgetIncomeQuery({
        startDate: periodDates.startDate,
        endDate: periodDates.endDate
    });

    const { spendingByCategory } = useGetSpendingByCategoryQuery({
        categoryIds,
        startDate: periodDates.startDate,
        endDate: periodDates.endDate
    });

    const periodInfo = useMemo(() => {
        const now = Date.now();
        const startTime = periodDates.startDate.getTime();
        const endTime = periodDates.endDate.getTime();
        const daysElapsed = Math.floor((now - startTime) / MS_PER_DAY);
        const totalDays = Math.floor((endTime - startTime) / MS_PER_DAY);
        const daysRemaining = Math.max(0, totalDays - daysElapsed);
        const progressPercent = totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0;

        return { daysElapsed, totalDays, daysRemaining, progressPercent };
    }, [periodDates]);

    const totalPlanned = useMemo(
        () => calculateTotalPlannedAmount(allocations, totalIncome),
        [allocations, totalIncome]
    );

    const categoryStats = useMemo(
        () =>
            allocations.map(allocation => {
                const category = categories.find(cat => cat.id === allocation.categoryId);
                const spending = spendingByCategory.find(sp => sp.categoryId === allocation.categoryId);
                const spent = spending?.total ?? 0;
                const planned = calculateEffectivePlannedAmount(allocation, totalIncome);
                const remaining = planned - spent;
                const percentage = planned > 0 ? Math.round((spent / planned) * 100) : 0;

                return {
                    name: category?.title ?? '-',
                    icon: category?.icon ?? UserIconNameEnum.Wallet,
                    spent,
                    planned,
                    remaining,
                    percentage,
                    isOverBudget: spent > planned
                };
            }),
        [allocations, spendingByCategory, categories, totalIncome]
    );

    const remaining = totalPlanned - totalSpent;
    const spentPercent = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;
    const isOnTrack = spentPercent <= periodInfo.progressPercent + 10;

    const dailyAverage = periodInfo.daysElapsed > 0 ? totalSpent / periodInfo.daysElapsed : 0;
    const projectedSpend = dailyAverage * periodInfo.totalDays;

    const overBudgetCount = categoryStats.filter(cat => cat.isOverBudget).length;
    const underBudgetCount = categoryStats.filter(cat => cat.percentage < 50 && cat.planned > 0).length;
    const topCategories = [...categoryStats].sort((first, second) => second.spent - first.spent).slice(0, 5);

    const spentFormatted = formatDigits(convertFromMicroUnits(totalSpent), currencySymbol);
    const remainingFormatted = formatDigits(convertFromMicroUnits(Math.abs(remaining)), currencySymbol);
    const dailyFormatted = formatDigits(convertFromMicroUnits(dailyAverage), currencySymbol);
    const projectedFormatted = formatDigits(convertFromMicroUnits(projectedSpend), currencySymbol);
    const plannedFormatted = formatDigits(convertFromMicroUnits(totalPlanned), currencySymbol);
    const { daysRemaining, totalDays } = periodInfo;

    const statusClassName = isOnTrack ? 'text-positive-foreground' : 'text-warning-foreground';
    const remainingClassName = remaining >= 0 ? 'text-positive-foreground' : 'text-warning-foreground';

    return (
        <View className="gap-4">
            <Card className="gap-3">
                <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-primary">{budget.title}</Text>
                    <View className="flex-row items-center gap-1">
                        <Icon icon={isOnTrack ? 'CheckCircle' : 'AlertTriangle'} size={14} className={statusClassName} />
                        <Text className={cn('text-xs', statusClassName)}>{isOnTrack ? t`On Track` : t`Over Pace`}</Text>
                    </View>
                </View>

                <BudgetProgressBar planned={totalPlanned} actual={totalSpent} className="h-2" />

                <View className="flex-row justify-between">
                    <View>
                        <Text className="text-xs text-secondary-foreground"><Trans>Spent</Trans></Text>
                        <Text className="text-lg font-semibold text-primary">{spentFormatted}</Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-xs text-secondary-foreground">{remaining >= 0 ? t`Remaining` : t`Over`}</Text>
                        <Text className={cn('text-lg font-semibold', remainingClassName)}>{remainingFormatted}</Text>
                    </View>
                </View>
            </Card>

            <View className="flex-row gap-3">
                <Card className="flex-1 gap-1">
                    <Icon icon="Calendar" size={16} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground"><Trans>Days Left</Trans></Text>
                    <Text className="text-lg font-semibold text-primary">{daysRemaining}</Text>
                    <Text className="text-xs text-secondary-foreground">{t`of ${totalDays}`}</Text>
                </Card>

                <Card className="flex-1 gap-1">
                    <Icon icon="TrendingUp" size={16} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground"><Trans>Daily Avg</Trans></Text>
                    <Text className="text-lg font-semibold text-primary">{dailyFormatted}</Text>
                </Card>

                <Card className="flex-1 gap-1">
                    <Icon icon="LineChart" size={16} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground"><Trans>Projected</Trans></Text>
                    <Text className="text-lg font-semibold text-primary">{projectedFormatted}</Text>
                </Card>
            </View>

            <Card className="gap-3">
                <Text className="text-xs uppercase text-secondary-foreground"><Trans>Budget Health</Trans></Text>
                <View className="flex-row justify-between">
                    <View className="flex-1 items-center">
                        <Text className="text-2xl font-bold text-primary">{categoryStats.length}</Text>
                        <Text className="text-xs text-secondary-foreground"><Trans>Categories</Trans></Text>
                    </View>
                    <View className="flex-1 items-center">
                        <Text className={cn('text-2xl font-bold', overBudgetCount > 0 ? 'text-warning-foreground' : 'text-positive-foreground')}>
                            {overBudgetCount}
                        </Text>
                        <Text className="text-xs text-secondary-foreground"><Trans>Over Budget</Trans></Text>
                    </View>
                    <View className="flex-1 items-center">
                        <Text className="text-2xl font-bold text-positive-foreground">{underBudgetCount}</Text>
                        <Text className="text-xs text-secondary-foreground"><Trans>Under 50%</Trans></Text>
                    </View>
                </View>
            </Card>

            <Card className="gap-3">
                <Text className="text-xs uppercase text-secondary-foreground"><Trans>Top Categories</Trans></Text>
                {topCategories.map(cat => {
                    const catSpent = formatDigits(convertFromMicroUnits(cat.spent), currencySymbol);
                    const catClassName = cat.isOverBudget ? 'text-warning-foreground' : 'text-primary';

                    return (
                        <View key={cat.name} className="flex-row items-center gap-2">
                            <Icon icon={cat.icon} size={14} className="text-secondary-foreground" />
                            <Text className="flex-1 text-sm text-primary" numberOfLines={1}>{cat.name}</Text>
                            <Text className={cn('text-sm font-medium', catClassName)}>{catSpent}</Text>
                            <Text className="text-xs text-secondary-foreground w-10 text-right">{`${cat.percentage}%`}</Text>
                        </View>
                    );
                })}
            </Card>

            <Card className="gap-2">
                <Text className="text-xs uppercase text-secondary-foreground"><Trans>Summary</Trans></Text>
                <View className="flex-row justify-between py-1">
                    <Text className="text-sm text-secondary-foreground"><Trans>Total Budget</Trans></Text>
                    <Text className="text-sm font-medium text-primary">{plannedFormatted}</Text>
                </View>
                <View className="flex-row justify-between py-1">
                    <Text className="text-sm text-secondary-foreground"><Trans>Total Spent</Trans></Text>
                    <Text className="text-sm font-medium text-primary">{spentFormatted}</Text>
                </View>
                <View className="flex-row justify-between py-1">
                    <Text className="text-sm text-secondary-foreground"><Trans>Projected End</Trans></Text>
                    <Text className="text-sm font-medium text-primary">{projectedFormatted}</Text>
                </View>
                <View className="flex-row justify-between py-1">
                    <Text className="text-sm text-secondary-foreground"><Trans>Budget Usage</Trans></Text>
                    <Text className="text-sm font-medium text-primary">{`${spentPercent}%`}</Text>
                </View>
            </Card>

            <Text className="text-xs uppercase text-secondary-foreground mt-2"><Trans>Previous Periods</Trans></Text>
            {historicalPeriods.map(period => (
                <BudgetHistoricalPeriodCard
                    key={period.label}
                    label={period.label}
                    startDate={period.startDate}
                    endDate={period.endDate}
                    categoryIds={categoryIds}
                    totalPlanned={totalPlanned}
                    currencySymbol={currencySymbol}
                    allocations={allocations.map(alloc => ({ categoryId: alloc.categoryId ?? 0, amount: alloc.amount }))}
                />
            ))}
        </View>
    );
};

