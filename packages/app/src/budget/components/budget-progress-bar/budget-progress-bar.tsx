import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { buildBudgetProgressBarMetrics } from '../../utils/build-budget-progress-bar-metrics.util';
import { BudgetBarTone, resolveBudgetBarTone } from '../../utils/resolve-budget-bar-tone.util';

interface Props {
    readonly amountDecimalPlaces?: number;
    readonly currencySymbol?: string;
    readonly isAmountLight?: boolean;
    readonly isCompact?: boolean;
    readonly isSummaryVisible?: boolean;
    readonly spent: number;
    readonly limit: number;
    readonly testID?: string;
    readonly spentTestID?: string;
    readonly remainingTestID?: string;
}

const barVariants = cva<{ tone: Record<BudgetBarTone, string> }>('h-full rounded-full', {
    variants: {
        tone: {
            green: 'bg-positive-foreground',
            yellow: 'bg-warning-foreground',
            red: 'bg-destructive-foreground'
        }
    }
});

const amountTextVariants = cva('text-primary text-md', {
    variants: {
        isAmountLight: {
            false: 'font-semibold',
            true: 'font-medium'
        }
    }
});

export const BudgetProgressBar = (props: Props) => {
    const {
        amountDecimalPlaces,
        currencySymbol = '',
        isAmountLight = false,
        isCompact = false,
        isSummaryVisible = true,
        spent,
        limit,
        testID,
        spentTestID,
        remainingTestID
    } = props;
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const effectiveDecimalPlaces = amountDecimalPlaces ?? decimalPlaces;
    const formatDigits = useFormatDigits(effectiveDecimalPlaces);
    const metrics = buildBudgetProgressBarMetrics(spent, limit);
    const amountLabel = `${formatDigits(metrics.displaySpent, currencySymbol)} / ${formatDigits(metrics.displayLimit, currencySymbol)}`;
    const remainingLabel = metrics.isOverBudget ? t`Over budget` : t`Left`;
    const remainingAmountLabel = formatDigits(metrics.displayRemaining, currencySymbol);

    const bar = (
        <View className="h-3 bg-secondary-corner rounded-full overflow-hidden">
            <View className={barVariants({ tone: resolveBudgetBarTone(metrics.ratio) })} style={metrics.widthStyle} />
        </View>
    );

    if (isCompact) {
        return (
            <View testID={testID} className="gap-y-md">
                {bar}

                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-x-sm">
                        <Text
                            className={amountTextVariants({ isAmountLight })}
                            testID={spentTestID}
                            accessible
                            accessibilityLabel={amountLabel}
                        >
                            {amountLabel}
                        </Text>
                        <Text className="text-secondary-foreground text-sm">{metrics.percentLabel}</Text>
                    </View>

                    <View className="flex-row items-center gap-x-xs">
                        <Text className="text-secondary-foreground text-sm">{remainingLabel}</Text>
                        <Text testID={remainingTestID} className={amountTextVariants({ isAmountLight })}>
                            {remainingAmountLabel}
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View testID={testID} className="gap-y-md">
            {isSummaryVisible ? (
                <View className="flex-row items-center justify-between">
                    <Text
                        className={amountTextVariants({ isAmountLight })}
                        testID={spentTestID}
                        accessible
                        accessibilityLabel={amountLabel}
                    >
                        {amountLabel}
                    </Text>

                    <Text className="text-secondary-foreground text-sm">{metrics.percentLabel}</Text>
                </View>
            ) : null}

            {bar}

            {isSummaryVisible ? (
                <View className="flex-row items-center justify-between">
                    <Text className="text-secondary-foreground text-sm">{remainingLabel}</Text>
                    <Text testID={remainingTestID} className={amountTextVariants({ isAmountLight })}>
                        {remainingAmountLabel}
                    </Text>
                </View>
            ) : null}
        </View>
    );
};
