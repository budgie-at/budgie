import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { BudgetStatCard } from '../budget-stat-card/budget-stat-card';

interface Props {
    readonly daysRemaining: number;
    readonly totalDays: number;
    readonly dailyFormatted: string;
    readonly projectedFormatted: string;
}

export const BudgetStatsCards = ({ daysRemaining, totalDays, dailyFormatted, projectedFormatted }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-row gap-3">
            <BudgetStatCard
                icon={UserIconNameEnum.Calendar}
                label={t`Days Left`}
                value={String(daysRemaining)}
                subtitle={
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>of {totalDays}</Trans>
                    </Text>
                }
            />

            <BudgetStatCard icon={UserIconNameEnum.TrendingUp} label={t`Daily Avg`} value={dailyFormatted} />

            <BudgetStatCard icon={UserIconNameEnum.LineChart} label={t`Projected`} value={projectedFormatted} />
        </View>
    );
};
