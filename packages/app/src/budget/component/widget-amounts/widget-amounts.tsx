import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

interface Props {
    readonly safeToSpendFormatted: string;
    readonly safeToSpendPerDayFormatted: string;
    readonly remainingFormatted: string;
    readonly totalFormatted: string;
    readonly isPositive: boolean;
}

const safeToSpendClassName = cva('text-2xl font-bold', {
    variants: {
        isPositive: {
            true: 'text-positive-foreground',
            false: 'text-warning-foreground'
        }
    }
});

const remainingClassName = cva('text-sm font-semibold', {
    variants: {
        isPositive: {
            true: 'text-positive-foreground',
            false: 'text-warning-foreground'
        }
    }
});

export const WidgetAmounts = (props: Props) => {
    const { safeToSpendFormatted, safeToSpendPerDayFormatted, remainingFormatted, totalFormatted, isPositive } = props;

    return (
        <View className="flex-row items-center justify-between">
            <View>
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Safe to Spend</Trans>
                </Text>
                <Text className={safeToSpendClassName({ isPositive })}>{safeToSpendFormatted}</Text>
                <Text className="text-xs text-secondary-foreground">
                    <Trans>{safeToSpendPerDayFormatted}/day</Trans>
                </Text>
            </View>
            <View className="items-end">
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Remaining</Trans>
                </Text>
                <Text className={remainingClassName({ isPositive })}>{remainingFormatted}</Text>
                <Text className="text-xs text-secondary-foreground">
                    <Trans>of {totalFormatted}</Trans>
                </Text>
            </View>
        </View>
    );
};
