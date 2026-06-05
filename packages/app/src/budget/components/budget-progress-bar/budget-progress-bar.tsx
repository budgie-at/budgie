import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetBarTone, resolveBudgetBarTone } from '../../utils/resolve-budget-bar-tone.util';

const MIN_PROGRESS = 0;
const MAX_PROGRESS = 1;
const PERCENT_MULTIPLIER = 100;

interface Props {
    readonly amountDecimalPlaces?: number;
    readonly currencySymbol?: string;
    readonly isAmountLight?: boolean;
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

const buildBudgetProgressBarMetrics = (spent: number, limit: number) => {
    const ratio = isPositiveNumber(limit) ? spent / limit : 0;
    const clampedRatio = Math.max(MIN_PROGRESS, Math.min(MAX_PROGRESS, ratio));
    const displaySpent = convertFromMicroUnits(spent);
    const displayLimit = convertFromMicroUnits(limit);
    const remainingAmount = displayLimit - displaySpent;
    const displayRemaining = Math.abs(remainingAmount);
    const widthPercent: `${number}%` = `${clampedRatio * PERCENT_MULTIPLIER}%`;

    return {
        displayLimit,
        displayRemaining,
        displaySpent,
        isOverBudget: remainingAmount < 0,
        percentLabel: `${Math.round(ratio * PERCENT_MULTIPLIER)}%`,
        ratio,
        widthStyle: { width: widthPercent }
    };
};

export const BudgetProgressBar = (props: Props) => {
    const {
        amountDecimalPlaces,
        currencySymbol = '',
        isAmountLight = false,
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

            <View className="h-3 bg-secondary-corner rounded-full overflow-hidden">
                <View className={barVariants({ tone: resolveBudgetBarTone(metrics.ratio) })} style={metrics.widthStyle} />
            </View>

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
