import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly daysRemaining: number;
    readonly totalDays: number;
    readonly dailyFormatted: string;
    readonly projectedFormatted: string;
}

export const BudgetStatsCards = ({ daysRemaining, totalDays, dailyFormatted, projectedFormatted }: Props) => (
    <View className="flex-row gap-3">
        <Card className="flex-1 gap-1">
            <Icon icon={UserIconNameEnum.Calendar} size={16} className="text-secondary-foreground" />
            <Text className="text-xs text-secondary-foreground">
                <Trans>Days Left</Trans>
            </Text>
            <Text className="text-lg font-semibold text-primary">{daysRemaining}</Text>
            <Text className="text-xs text-secondary-foreground">
                <Trans>of {totalDays}</Trans>
            </Text>
        </Card>

        <Card className="flex-1 gap-1">
            <Icon icon={UserIconNameEnum.TrendingUp} size={16} className="text-secondary-foreground" />
            <Text className="text-xs text-secondary-foreground">
                <Trans>Daily Avg</Trans>
            </Text>
            <Text className="text-lg font-semibold text-primary">{dailyFormatted}</Text>
        </Card>

        <Card className="flex-1 gap-1">
            <Icon icon={UserIconNameEnum.LineChart} size={16} className="text-secondary-foreground" />
            <Text className="text-xs text-secondary-foreground">
                <Trans>Projected</Trans>
            </Text>
            <Text className="text-lg font-semibold text-primary">{projectedFormatted}</Text>
        </Card>
    </View>
);
