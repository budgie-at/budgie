import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';

const statusTextVariants = cva('text-xs', {
    variants: {
        status: {
            onTrack: 'text-positive-foreground',
            overPace: 'text-warning-foreground'
        }
    }
});

const remainingTextVariants = cva('text-lg font-semibold', {
    variants: {
        status: {
            positive: 'text-positive-foreground',
            negative: 'text-warning-foreground'
        }
    }
});

interface Props {
    readonly title: string;
    readonly isOnTrack: boolean;
    readonly statusLabel: string;
    readonly spentLabel: ReactNode;
    readonly spentFormatted: string;
    readonly remainingLabel: string;
    readonly remainingFormatted: string;
    readonly isPositiveRemaining: boolean;
    readonly progressBar: ReactNode;
}

export const BudgetOverviewCard = (props: Props) => {
    const {
        title,
        isOnTrack,
        statusLabel,
        spentLabel,
        spentFormatted,
        remainingLabel,
        remainingFormatted,
        isPositiveRemaining,
        progressBar
    } = props;
    const statusIcon = isOnTrack ? UserIconNameEnum.CheckCircle : UserIconNameEnum.AlertTriangle;
    const statusVariant = isOnTrack ? 'onTrack' : 'overPace';
    const remainingVariant = isPositiveRemaining ? 'positive' : 'negative';

    return (
        <Card className="gap-3">
            <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-primary">{title}</Text>
                <View className="flex-row items-center gap-1">
                    <Icon icon={statusIcon} size={14} className={statusTextVariants({ status: statusVariant })} />
                    <Text className={statusTextVariants({ status: statusVariant })}>{statusLabel}</Text>
                </View>
            </View>

            {progressBar}

            <View className="flex-row justify-between">
                <View>
                    <Text className="text-xs text-secondary-foreground">{spentLabel}</Text>
                    <Text className="text-lg font-semibold text-primary">{spentFormatted}</Text>
                </View>

                <View className="items-end">
                    <Text className="text-xs text-secondary-foreground">{remainingLabel}</Text>
                    <Text className={remainingTextVariants({ status: remainingVariant })}>{remainingFormatted}</Text>
                </View>
            </View>
        </Card>
    );
};
