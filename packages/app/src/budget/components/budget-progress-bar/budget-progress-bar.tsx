import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { BudgetBarTone, resolveBudgetBarTone } from '../../utils/resolve-budget-bar-tone.util';

const MIN_PROGRESS = 0;
const MAX_PROGRESS = 1;
const PERCENT_MULTIPLIER = 100;

interface Props {
    readonly amountDecimalPlaces?: number;
    readonly isAmountLight?: boolean;
    readonly isSummaryVisible?: boolean;
    readonly spent: number;
    readonly limit: number;
    readonly testID?: string;
    readonly spentTestID?: string;
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
    const { amountDecimalPlaces = 2, isAmountLight = false, isSummaryVisible = true, spent, limit, testID, spentTestID } = props;
    const ratio = isPositiveNumber(limit) ? spent / limit : 0;
    const clampedRatio = Math.max(MIN_PROGRESS, Math.min(MAX_PROGRESS, ratio));
    const percent = Math.round(ratio * PERCENT_MULTIPLIER);
    const displaySpent = convertFromMicroUnits(spent);
    const displayLimit = convertFromMicroUnits(limit);
    const widthPercent: `${number}%` = `${clampedRatio * PERCENT_MULTIPLIER}%`;
    const widthStyle = { width: widthPercent };
    const percentLabel = `${percent}%`;
    const amountLabel = `${displaySpent.toFixed(amountDecimalPlaces)} / ${displayLimit.toFixed(amountDecimalPlaces)}`;

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

                    <Text className="text-secondary-foreground text-sm">{percentLabel}</Text>
                </View>
            ) : null}

            <View className="h-3 bg-secondary-corner rounded-full overflow-hidden">
                <View className={barVariants({ tone: resolveBudgetBarTone(ratio) })} style={widthStyle} />
            </View>
        </View>
    );
};
